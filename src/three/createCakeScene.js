import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { CAKE_ANCHOR, FRAMES } from '../lib/config.js'
import { coverRect } from '../lib/geom.js'

// ---------------------------------------------------------------------------
// The 3D mooncake scene (raw Three.js — full control, zero extra deps).
//
// It is placed so the model lands EXACTLY on top of the flat mooncake in the
// last video frame (the cover-crop mapping is shared with the 2D canvas via
// geom.coverRect), which is what makes the "pop-out" crossfade feel seamless.
//
// Public API (consumed by ScrollStage):
//   apply({ opacity, dx, dy, pitch, scale })  <- scroll timeline pushes state
//   setActive(bool)                            <- render loop gate
//   resize()
//   orbitBy(dx, dy)      <- screen-space trackball rotation (px deltas)
//   rollBy(angle)        <- rotation around the view axis (two-finger twist)
//   panBy(dx, dy)        <- move the cake on screen (px); springs home
//   zoomBy(factor)       <- multiplicative zoom (pinch / wheel)
//   setInteracting(bool) <- pauses idle spin, arms inertia / pan spring
//   resetView(immediate) <- orientation + zoom + pan back to home
//   dispose()
//
// Group chain (outermost first): cake(anchor pos/scale) -> user(trackball) ->
// spin(idle turntable) -> tilt(scroll pose) -> model. The user rotation sits
// outermost so drags always rotate around SCREEN axes, like a 3D editor —
// every axis is reachable, including flipping to the top or bottom view.
// ---------------------------------------------------------------------------

const ZOOM_MIN = 0.55
const ZOOM_MAX = 2.6
const PAN_RANGE = 0.42 // how far (fraction of viewport) the cake may be dragged
const DRAG_K = 0.0056 // rad per px of drag

export function createCakeScene(container, { gltf }) {
  if (!gltf) return null

  // ----------------------------------------------------------- renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true, // transparent so the video backdrop (moon!) stays visible
    powerPreference: 'high-performance',
  })
  renderer.setClearColor(0x000000, 0)
  // richer highlights: filmic tone mapping + a hair of exposure
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:0;'
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60)
  camera.position.set(0, 0.42, 5.6)
  camera.lookAt(0, 0.05, 0)

  // ------------------------------------------------------------- lights
  // warm lantern key from the left, cool moonlight rim from the right —
  // matching the video's lighting, so the pop-out reads as the same cake.
  const hemi = new THREE.HemisphereLight(0xfff2dd, 0x241a3c, 0.55)
  const key = new THREE.DirectionalLight(0xffd9a0, 1.7)
  key.position.set(-2.6, 3.2, 2.6)
  const rim = new THREE.DirectionalLight(0xa9c4ff, 0.9)
  rim.position.set(2.6, 2.2, -1.6)
  const lantern = new THREE.PointLight(0xffb35c, 14, 9, 2)
  lantern.position.set(-1.8, -0.4, 1.8)
  scene.add(hemi, key, rim, lantern)

  // subtle environment sheen (cheap one-bounce room)
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04)
  scene.environment = envRT.texture
  scene.environmentIntensity = 0.5

  // -------------------------------------------------------------- model
  const model = gltf.scene
  const box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())

  // crisp texture sampling when the visitor zooms in close
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy())
  model.traverse((o) => {
    if (!o.material) return
    const mats = Array.isArray(o.material) ? o.material : [o.material]
    for (const m of mats) {
      for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap']) {
        if (m[k]) {
          m[k].anisotropy = maxAniso
          m[k].needsUpdate = true
        }
      }
    }
  })

  // normalize width to a known constant so placement math stays simple
  const NORM_W = 1.6
  model.position.sub(center)
  // nested groups: cake(anchor) -> user(trackball) -> spin(idle) -> tilt(pose)
  const tilt = new THREE.Group()
  tilt.add(model)
  const spin = new THREE.Group()
  spin.add(tilt)
  const user = new THREE.Group()
  user.add(spin)
  const cake = new THREE.Group()
  cake.add(user)
  cake.scale.setScalar(NORM_W / Math.max(size.x, 1e-4))
  scene.add(cake)

  // ------------------------------------------------------------- layout
  let W = 1
  let H = 1
  let baseScale = 1
  let basePos = { x: 0, y: 0 }

  function layout() {
    const r = coverRect(FRAMES.width, FRAMES.height, W, H)
    const px = r.x + CAKE_ANCHOR.x * r.w
    const py = r.y + CAKE_ANCHOR.y * r.h
    // world units per CSS pixel, measured on the z=0 plane in front of camera
    const dist = camera.position.z
    const worldH = 2 * Math.tan((camera.fov * Math.PI) / 180 / 2) * dist
    const upp = worldH / H
    basePos = { x: (px - W / 2) * upp, y: (H / 2 - py) * upp }
    const targetWorldW = CAKE_ANCHOR.size * r.w * upp
    baseScale = targetWorldW / NORM_W
  }

  function resize() {
    const rect = container.getBoundingClientRect()
    W = Math.max(1, rect.width)
    H = Math.max(1, rect.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5))
    renderer.setSize(W, H, false)
    camera.aspect = W / H
    camera.updateProjectionMatrix()
    layout()
  }

  // -------------------------------------------------------- interaction
  const orbQ = new THREE.Quaternion() // smoothed user orientation
  const orbQT = new THREE.Quaternion() // target user orientation
  const pan = { x: 0, y: 0, tx: 0, ty: 0, vx: 0, vy: 0, free: false } // px, screen space
  const zoom = { v: 1, t: 1 }
  const inertia = { x: 0, y: 0 } // angular velocity (rad/s) for the release glide
  let interacting = false
  let spinAngle = 0
  let lastOrbitT = 0

  const _e = new THREE.Euler(0, 0, 0, 'XYZ')
  const _q = new THREE.Quaternion()
  const _axis = new THREE.Vector3()

  function orbitBy(dx, dy) {
    const now = performance.now()
    const dt = lastOrbitT ? Math.min((now - lastOrbitT) / 1000, 0.1) : 0.016
    lastOrbitT = now
    // screen-space trackball: horizontal drag -> world Y, vertical drag -> world X.
    // premultiply = rotate in WORLD space, so any orientation is reachable.
    const ax = -dy * DRAG_K
    const ay = dx * DRAG_K
    _e.set(ax, ay, 0, 'XYZ')
    _q.setFromEuler(_e)
    orbQT.premultiply(_q)
    inertia.x = inertia.x * 0.65 + (ax / Math.max(dt, 0.001)) * 0.35
    inertia.y = inertia.y * 0.65 + (ay / Math.max(dt, 0.001)) * 0.35
  }

  function rollBy(angle) {
    _q.setFromAxisAngle(_axis.set(0, 0, 1), angle)
    orbQT.premultiply(_q)
  }

  function panBy(dx, dy) {
    pan.tx = Math.max(-W * PAN_RANGE, Math.min(W * PAN_RANGE, pan.tx + dx))
    pan.ty = Math.max(-H * PAN_RANGE, Math.min(H * PAN_RANGE, pan.ty + dy))
  }

  function zoomBy(factor) {
    zoom.t = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom.t * factor))
  }

  function setInteracting(v) {
    interacting = v
    pan.free = v
    if (v) {
      inertia.x = inertia.y = 0
    } else {
      lastOrbitT = 0
    }
  }

  function resetView(immediate = false) {
    orbQT.identity()
    zoom.t = 1
    pan.tx = pan.ty = 0
    inertia.x = inertia.y = 0
    if (immediate) {
      orbQ.identity()
      zoom.v = 1
      pan.x = pan.y = pan.vx = pan.vy = 0
    }
  }

  // -------------------------------------------------------- state + loop
  const st = { opacity: 0, dx: 0, dy: 0, pitch: 0, scale: 0.94 }
  let active = false
  let raf = 0
  const clock = new THREE.Clock()
  let idleT = 0

  const loop = () => {
    raf = requestAnimationFrame(loop)
    const dt = Math.min(clock.getDelta(), 0.05)
    // sleep when invisible: saves GPU/battery while the scrub section plays
    if (!active || document.hidden || st.opacity <= 0.001) return
    idleT += dt

    // ease everything toward its target
    const k = 1 - Math.exp(-14 * dt)
    orbQ.slerp(orbQT, k)
    zoom.v += (zoom.t - zoom.v) * k

    if (!interacting) {
      // release glide: keep turning with the last drag velocity, decaying
      if (Math.abs(inertia.x) > 0.05 || Math.abs(inertia.y) > 0.05) {
        _e.set(inertia.x * dt, inertia.y * dt, 0, 'XYZ')
        _q.setFromEuler(_e)
        orbQT.premultiply(_q)
        const decay = Math.exp(-2.4 * dt)
        inertia.x *= decay
        inertia.y *= decay
      } else {
        inertia.x = inertia.y = 0
      }
      // pan springs home with a gentle, slightly elastic settle
      const SPR = 60
      const DAMP = 10.5
      pan.vx += (-SPR * pan.x - DAMP * pan.vx) * dt
      pan.vy += (-SPR * pan.y - DAMP * pan.vy) * dt
      pan.x += pan.vx * dt
      pan.y += pan.vy * dt
      // idle turntable about the cake's own axis — paused while the visitor plays
      spinAngle += 0.26 * dt
    } else {
      // while dragging, pan follows the pointer closely
      const kf = 1 - Math.exp(-22 * dt)
      pan.x += (pan.tx - pan.x) * kf
      pan.y += (pan.ty - pan.y) * kf
    }

    spin.rotation.y = spinAngle
    tilt.rotation.x = st.pitch
    tilt.rotation.z = Math.sin(idleT * 1.5) * 0.035
    user.quaternion.copy(orbQ)

    cake.position.set(
      basePos.x + st.dx * W * upp() + pan.x * upp(),
      // st.dy is CSS-style (positive = down); the world is y-up -> subtract
      basePos.y - st.dy * H * upp() + Math.sin(idleT * 0.9) * 0.045 - pan.y * upp(),
      0,
    )
    const s = baseScale * st.scale * zoom.v
    cake.scale.setScalar(s)
    renderer.render(scene, camera)
  }

  // world-units-per-px helper used above (kept as fn to read fresh H)
  function upp() {
    const worldH = 2 * Math.tan((camera.fov * Math.PI) / 180 / 2) * camera.position.z
    return worldH / H
  }

  resize()
  raf = requestAnimationFrame(loop)

  return {
    apply(partial) {
      Object.assign(st, partial)
      renderer.domElement.style.opacity = String(st.opacity)
    },
    setActive(v) {
      active = v
    },
    resize,
    orbitBy,
    rollBy,
    panBy,
    zoomBy,
    setInteracting,
    resetView,
    dispose() {
      cancelAnimationFrame(raf)
      envRT.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
