import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'

// NOTE: <StrictMode> is deliberately omitted. In dev it double-invokes
// effects, which would build/tear down the WebGL scene and GSAP pins twice
// and makes canvas timing bugs much harder to reason about.
createRoot(document.getElementById('root')).render(<App />)
