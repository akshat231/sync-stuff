import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
        },
        '/syncthing': {
          target: env.VITE_SYNCTHING_URL || 'http://localhost:8384',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/syncthing/, ''),
        },
      },
    },
  }
})