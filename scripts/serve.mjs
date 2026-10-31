// GRAVITY BREAK — static file server (no dependencies).
// Serves the built directory in the foreground on $PORT (default 3000).
import { createServer } from 'node:http'
import { statSync, readFileSync, existsSync } from 'node:fs'
import { resolve, join, extname, normalize } from 'node:path'

const root = resolve(process.env.DIST_DIR || join(process.cwd(), 'dist'))
const port = Number(process.env.PORT || 3000)

if (!existsSync(join(root, 'index.html'))) {
  console.error(`[serve] dist missing index.html at ${root}`)
  process.exit(1)
}

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'text/xml; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.glb': 'model/gltf-binary'
}

const server = createServer((req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost')
    let path = resolve(root, '.' + decodeURIComponent(url.pathname))
    if (path !== root && !path.startsWith(root + '/')) { res.writeHead(404); res.end('Not found'); return }
    if (!statSync(path).isFile()) path = join(path, 'index.html')
    if (!existsSync(path)) {
      // SPA-style fallback for unknown routes
      const fallback = join(root, 'index.html')
      if (existsSync(fallback)) path = fallback
      else { res.writeHead(404); res.end('Not found'); return }
    }
    res.setHeader('Content-Type', mime[extname(path).toLowerCase()] || 'application/octet-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.end(readFileSync(path))
  } catch (error) {
    res.writeHead(404)
    res.end('Not found')
  }
})

server.on('error', (error) => {
  console.error(`[serve] ${error.message}`)
  process.exit(1)
})

server.listen(port, '0.0.0.0', () => {
  console.log(`[serve] serving ${root} on http://0.0.0.0:${port}`)
})
