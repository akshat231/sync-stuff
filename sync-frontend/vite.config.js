import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { resolve, dirname } from 'path'
import { existsSync, mkdirSync, writeFileSync } from 'fs'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const hostRoot = env.VITE_SYNC_ROOT_HOST || resolve(process.cwd(), '../sync-client/data')
  const containerRoot = env.VITE_SYNC_ROOT_CONTAINER || '/sync'
  return {
    plugins: [
      react(),
      {
        name: 'picked-folder-sink',
        configureServer(server) {
          server.middlewares.use('/set-folder', (req, res) => {
            const send = (status, body) => {
              res.writeHead(status, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify(body))
            }
            const url = new URL(req.url, 'http://localhost')
            const hostPath = url.searchParams.get('path')
            const name = url.searchParams.get('name')

            if (!hostPath || !name) {
              send(400, { ok: false, error: 'path and name are required' })
              return
            }
            if (!hostPath.startsWith(hostRoot + '/')) {
              send(400, {
                ok: false,
                error: `Folder must live under ${hostRoot} (the dir mounted into the Syncthing container)`,
              })
              return
            }
            if (!existsSync(hostPath)) {
              send(400, { ok: false, error: `Folder not found on this machine: ${hostPath}` })
              return
            }

            const rel = hostPath.slice(hostRoot.length)
            const containerPath = containerRoot + rel
            const target = resolve(process.cwd(), '../sync-client/.picked-folder.json')
            mkdirSync(dirname(target), { recursive: true })
            writeFileSync(
              target,
              JSON.stringify({ hostPath, containerPath, name, pickedAt: new Date().toISOString() }, null, 2)
            )
            send(200, { ok: true, hostPath, containerPath })
          })
        },
      },
    ],
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