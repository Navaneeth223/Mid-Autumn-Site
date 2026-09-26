import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Single GSAP setup point: every module imports gsap FROM HERE so the plugin
// registration + config happen exactly once.
gsap.registerPlugin(ScrollTrigger)
gsap.ticker.lagSmoothing(500, 33)
// Mobile address-bar show/hide causes tiny viewport changes; ignore them so
// the pinned stage never jumps while scrolling on a phone.
ScrollTrigger.config({ ignoreMobileResize: true })

export { gsap, ScrollTrigger }
