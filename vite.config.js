import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Where the dashboard's API calls go when it is built with VITE_API_BASE_URL=/live-api.
const LIVE_API = 'https://staging.api.mobile.paralexlogistics.com'

// The live API's CORS rules reject browser requests from other sites (even its own Swagger
// page), so the preview server relays them server-to-server instead of the browser calling it.
const liveApiProxy = {
  '/live-api': {
    target: LIVE_API,
    changeOrigin: true,
    secure: true,
    rewrite: (path) => path.replace(/^\/live-api/, ''),
    configure: (proxy) => {
      // Server-to-server call: drop the browser's Origin so the API's CORS check doesn't apply.
      proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
    },
  },
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: liveApiProxy,
  },
  // Vite 6 refuses requests whose Host header it does not recognise; this is the name the
  // VPS ingress forwards when the dashboard is published at paralex-admin.lab.perblis.com.
  preview: {
    allowedHosts: ['paralex-admin.lab.perblis.com'],
    proxy: liveApiProxy,
  },
})
