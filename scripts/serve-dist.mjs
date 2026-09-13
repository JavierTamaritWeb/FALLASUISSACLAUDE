import http from 'http';
import { createReadStream, existsSync, statSync, realpathSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs(argv) {
  const args = { port: 4173, root: 'dist' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--port') args.port = Number(argv[++i] ?? args.port);
    if (a === '--root') args.root = String(argv[++i] ?? args.root);
  }
  return args;
}

const { port, root } = parseArgs(process.argv);
const rootDir = realpathSync(path.resolve(__dirname, '..', root));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf'
};

function safePath(urlPath) {
  try {
    const decoded = decodeURIComponent(urlPath.split('?')[0]);
    if (decoded.includes('\0')) return null;
    const normalized = decoded.replace(/\\/g, '/');
    const rel = normalized.startsWith('/') ? normalized.slice(1) : normalized;
    const resolved = path.resolve(rootDir, rel);
    if (!isInsideRoot(resolved)) return null;
    // Comprobar también el destino real de los enlaces simbólicos existentes.
    if (existsSync(resolved) && !isInsideRoot(realpathSync(resolved))) return null;
    return resolved;
  } catch {
    return null;
  }
}

function isInsideRoot(filePath) {
  const relative = path.relative(rootDir, filePath);
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

const server = http.createServer((req, res) => {
  const resolved = safePath(req.url || '/');
  if (!resolved) {
    res.writeHead(400);
    res.end('Bad request');
    return;
  }

  let filePath = resolved;
  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  if (!isInsideRoot(realpathSync(filePath))) {
    res.writeHead(400);
    res.end('Bad request');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  const stream = createReadStream(filePath);
  // Un archivo retirado durante la lectura no debe derribar el servidor.
  stream.on('error', () => res.destroy());
  res.on('close', () => stream.destroy());
  stream.pipe(res);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`[serve-dist] http://127.0.0.1:${server.address().port}/ (root: ${rootDir})`);
});
