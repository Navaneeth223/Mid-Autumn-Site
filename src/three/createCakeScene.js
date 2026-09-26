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
//   apply({ opacity, dx, dy, rotY, scale })  <- scroll timeline pushes state
//   setActive(bool)                          <- render loop gate
//   resize()
//   dispose()
// ---------------------------------------------------------------------------

export function createCakeScene(container, { gltf }) {
  if (!gltf) return null

  // ----------------------------------------------------------- renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true, // transparent so the video backdrop (moon!) stays visible
    powerPreference: 'high-performance',
  })
  renderer.setClearColor(0x000000, 0)
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

  // normalize width to a known constant so placement math stays simple
  const NORM_W = 1.6
  model.position.sub(center)
  const cake = new THREE.Group()
  cake.add(model)
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(W, H, false)
    camera.aspect = W / H
    camera.updateProjectionMatrix()
    layout()
  }

  // -------------------------------------------------------- state + loop
  const st = { opacity: 0, dx: 0, dy: 0, rotY: 0, scale: 0.94 }
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
    // gentle continuous auto-rotate + tiny wiggle + breathing bob
    cake.rotation.y = st.rotY + idleT * 0.28
    cake.rotation.z = Math.sin(idleT * 1.5) * 0.035
    cake.position.set(
      basePos.x + st.dx * W * upp(),
      // st.dy is CSS-style (positive = down); the world is y-up -> subtract
      basePos.y - st.dy * H * upp() + Math.sin(idleT * 0.9) * 0.045,
      0,
    )
    const s = baseScale * st.scale
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
    dispose() {
      cancelAnimationFrame(raf)
      envRT.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
