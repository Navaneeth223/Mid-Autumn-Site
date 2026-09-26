import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' keeps the built site portable: works at a domain root (Vercel)
// AND inside a sub-path (GitHub Pages: /<repo>/) without reconfiguring.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  // host:true -> `npm run dev` also prints LAN URLs, so Navi can test
  // on a real phone over Wi-Fi (the prompt asks for real-device testing).
  server: { host: true },
  build: {
    chunkSizeWarningLimit: 1600,
  },
})
