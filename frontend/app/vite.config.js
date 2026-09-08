import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Answers `/config.json` in development.
 *
 * In production the container writes that file from its environment before
 * Caddy starts (see docker-entrypoint.sh). There is no container in front of
 * `npm run dev`, so the dev server answers the same path itself and the app
 * cannot tell the two apart.
 */
function runtimeConfig() {
  return {
    name: 'docky-runtime-config',
    configureServer(server) {
      server.middlewares.use('/config.json', (_request, response) => {
        response.setHeader('Content-Type', 'application/json')
        response.end(
          JSON.stringify({ edition: process.env.DOCKY_EDITION ?? 'selfhosted' }),
        )
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), runtimeConfig()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8980',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
