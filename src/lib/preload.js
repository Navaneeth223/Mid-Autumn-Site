import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { FRAMES, LOAD_WEIGHTS, PATHS } from './config.js'

// ---------------------------------------------------------------------------
// Asset preloader.
//  - 121 webp frames (concurrency-limited pool, count-based progress)
//  - mooncake.glb (streaming fetch => real byte progress, then GLTF parse)
//  - locale JSONs + the poster still (tiny, but they gate first paint)
// Everything is weighted (LOAD_WEIGHTS) into one 0..1 progress number for the
// loader screen. Partial failure never blocks the site forever: after the
// hard timeout we continue with whatever arrived (drawFrame tolerates gaps).
// ---------------------------------------------------------------------------

export function detectWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch {
    return false
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`failed: ${src}`))
    img.src = src
  })
}

function fetchJSON(url) {
  return fetch(url).then((r) => {
    if (!r.ok) throw new Error(`failed: ${url}`)
    return r.json()
  })
}

// Fetch with per-byte progress. Falls back to a plain arrayBuffer when the
// server hides Content-Length (then progress for this asset simply jumps).
async function fetchBufferWithProgress(url, onBytes) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`failed: ${url}`)
  const total = Number(res.headers.get('Content-Length')) || 0
  if (!res.body || !total) return res.arrayBuffer()

  const reader = res.body.getReader()
  const chunks = []
  let recv = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    recv += value.length
    onBytes(recv, total)
  }
  const out = new Uint8Array(recv)
  let off = 0
  for (const c of chunks) {
    out.set(c, off)
    off += c.length
  }
  return out.buffer
}

// Small promise pool so 121 requests don't stampede a phone radio.
async function pool(items, limit, worker) {
  let cursor = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const i = cursor++
      if (i >= items.length) return
      await worker(items[i], i)
    }
  })
  await Promise.all(runners)
}

export function preloadAssets(onProgress) {
  const state = { frames: 0, model: 0, misc: 0 }
  const emit = () => {
    const p =
      (state.frames / FRAMES.count) * LOAD_WEIGHTS.frames +
      state.model * LOAD_WEIGHTS.model +
      state.misc * LOAD_WEIGHTS.misc
    onProgress(Math.min(0.999, p))
  }

  const result = { frames: new Array(FRAMES.count).fill(null), gltf: null, locales: null, webglOK: detectWebGL() }

  const work = (async () => {
    // -- misc: locales + poster (the loader screen itself needs the poster)
    const miscJobs = [
      fetchJSON(PATHS.locales.en),
      fetchJSON(PATHS.locales.zh),
      loadImage(PATHS.poster),
    ]
    let miscDone = 0
    const locales = await Promise.all(
      miscJobs.map((job) =>
        job
          .then((v) => {
            miscDone++
            state.misc = miscDone / miscJobs.length
            emit()
            return v
          })
          .catch(() => {
            miscDone++
            state.misc = miscDone / miscJobs.length
            emit()
            return null
          }),
      ),
    )
    result.locales = { en: locales[0] || {}, zh: locales[1] || {} }

    // -- frames
    await pool(
      Array.from({ length: FRAMES.count }, (_, i) => i),
      10,
      async (i) => {
        try {
          result.frames[i] = await loadImage(PATHS.frames(i))
        } catch {
          // one bad frame shouldn't kill the experience; drawFrame skips gaps
        }
        state.frames++
        emit()
      },
    )

    // -- model (only if WebGL exists; otherwise skip the 38% download)
    if (result.webglOK) {
      try {
        const buffer = await fetchBufferWithProgress(PATHS.model, (recv, total) => {
          state.model = Math.min(1, recv / total)
          emit()
        })
        const loader = new GLTFLoader()
        const draco = new DRACOLoader()
        draco.setDecoderPath(PATHS.dracoDecoder)
        loader.setDRACOLoader(draco)
        result.gltf = await new Promise((resolve, reject) =>
          // All buffers/textures are embedded in the .glb -> empty resource path.
          loader.parse(buffer, '', resolve, reject),
        )
        state.model = 1
        emit()
      } catch {
        result.gltf = null // site falls back to the 2D still, by design
      }
    }

    onProgress(1)
    return result
  })()

  // Hard safety: if the network stalls badly, proceed with whatever loaded.
  const timeout = new Promise((resolve) =>
    setTimeout(() => resolve(result), 30000),
  )

  return Promise.race([work, timeout])
}
