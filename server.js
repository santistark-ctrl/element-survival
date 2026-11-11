// Servidor estático mínimo (sin dependencias) para correr el juego.
// Uso: node server.js  ->  http://localhost:8080
// También lo usa el envoltorio de escritorio (desktop/main.cjs).
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};

function start(port = process.env.PORT || 8080, onReady) {
  const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';
    const file = path.normalize(path.join(ROOT, urlPath));
    if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('Prohibido'); }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); return res.end('No encontrado: ' + urlPath); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(data);
    });
  });
  server.listen(port, '127.0.0.1', () => {
    const p = server.address().port;
    if (onReady) onReady(p);
    else { console.log(`Element Survival corriendo en http://localhost:${p}`); console.log('Ctrl+C para detener.'); }
  });
  return server;
}

if (require.main === module) start();
module.exports = { start };
