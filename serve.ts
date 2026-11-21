// A tiny static server for app/ (Node 22, standard library only), so an entry can be tried
// locally without a build step: `node serve.ts` serves app/ on http://localhost:8080.
// Round 3 additions: --host flag, a /__health JSON endpoint for screenshot
// drivers, HEAD support, ETag + conditional requests, per-type cache
// headers, timestamped access logging, and a clean SIGINT shutdown.
// It still sends the MIME types an offline web app needs, refuses any path
// outside app/, and otherwise does nothing clever: this is a development
// convenience, not a web server for the internet.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./app', import.meta.url)));

function flagValue(args, name, fallback) {
  const i = args.indexOf(name);
  if (i === -1 || i + 1 >= args.length) return fallback;
  return args[i + 1];
}

const argv = process.argv.slice(2);
const requestedPort = Number(flagValue(argv, '--port', '8080'));
const port = Number.isInteger(requestedPort) && requestedPort > 0 && requestedPort < 65536
  ? requestedPort
  : 8080;
const host = flagValue(argv, '--host', '127.0.0.1');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.bin': 'application/octet-stream',
  '.wasm': 'application/wasm',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

// Fonts and images are immutable vendored assets; pages and scripts are
// always re-fetched so an edit shows up without a cache clear.
function cacheControl(ext) {
  if (ext === '.woff2' || ext === '.woff' || ext === '.ttf' || ext === '.otf' || ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.webp') {
    return 'public, max-age=86400, immutable';
  }
  return 'no-store';
}

function logLine(status, method, path, ms) {
  const stamp = new Date().toISOString().slice(11, 19);
  console.log(`${stamp} ${status} ${method} ${path} ${ms}ms`);
}

function etagFor(stats) {
  return `"${stats.size.toString(16)}-${Math.floor(stats.mtimeMs).toString(16)}"`;
}

const server = createServer((request, response) => {
  const started = Date.now();
  const finish = (status) => logLine(status, request.method, request.url ?? '/', Date.now() - started);

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { allow: 'GET, HEAD' }).end('method not allowed');
    finish(405);
    return;
  }

  let url;
  try {
    url = new URL(request.url ?? '/', 'http://localhost');
  } catch {
    response.writeHead(400).end('bad request');
    finish(400);
    return;
  }

  // Health endpoint for screenshot drivers: 200 + JSON, no file involved.
  if (url.pathname === '/__health') {
    const body = JSON.stringify({ ok: true, app: 'neon-palms', root, time: new Date().toISOString() });
    response.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(body) });
    response.end(request.method === 'HEAD' ? undefined : body);
    finish(200);
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    response.writeHead(400).end('bad request');
    finish(400);
    return;
  }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = resolve(join(root, normalize(pathname)));
  if (file !== root && !file.startsWith(root + sep)) {
    response.writeHead(403).end('forbidden');
    finish(403);
    return;
  }

  let stats;
  try {
    stats = statSync(file);
    if (!stats.isFile()) throw new Error('not a file');
  } catch {
    response.writeHead(404).end('not found');
    finish(404);
    return;
  }

  const ext = extname(file).toLowerCase();
  const tag = etagFor(stats);
  if (request.headers['if-none-match'] === tag) {
    response.writeHead(304, { etag: tag, 'cache-control': cacheControl(ext) }).end();
    finish(304);
    return;
  }

  response.writeHead(200, {
    'content-type': MIME[ext] ?? 'application/octet-stream',
    'content-length': stats.size,
    'cache-control': cacheControl(ext),
    etag: tag,
  });
  if (request.method === 'HEAD') {
    response.end();
    finish(200);
    return;
  }
  createReadStream(file).pipe(response);
  response.on('finish', () => finish(200));
});

server.listen(port, host, () => {
  console.log(`NEON PALMS app/ is on http://${host}:${port}  (health: /__health)`);
});

process.on('SIGINT', () => {
  console.log('\nshutting down…');
  server.close(() => process.exit(0));
});
