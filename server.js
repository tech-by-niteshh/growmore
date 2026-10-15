const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.apk': 'application/vnd.android.package-archive',
  '.zip': 'application/zip',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Download routing
  if (pathname === '/download/growmore.apk') {
    const apkFile = path.join(ROOT_DIR, 'downloads', 'growmore.apk');
    if (fs.existsSync(apkFile)) {
      res.writeHead(200, {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="growmore.apk"'
      });
      fs.createReadStream(apkFile).pipe(res);
      return;
    }
  }

  if (pathname === '/download/growmore-app.zip') {
    const zipFile = path.join(ROOT_DIR, 'downloads', 'growmore-app.zip');
    if (fs.existsSync(zipFile)) {
      res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="growmore-app.zip"'
      });
      fs.createReadStream(zipFile).pipe(res);
      return;
    }
  }

  // API endpoints
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
    return;
  }

  // Default to index.html
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  const filePath = path.join(ROOT_DIR, pathname);

  // Security check: ensure path is inside ROOT_DIR
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403);
    res.end('Access Denied');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // 404
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache'
    });

    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`⚡ GrowMore Live Platform Running at:`);
  console.log(`🌐 Website:    http://localhost:${PORT}`);
  console.log(`📱 Mobile App: http://localhost:${PORT}/app.html`);
  console.log(`📥 Download APK: http://localhost:${PORT}/download/growmore.apk`);
  console.log(`📦 Download ZIP: http://localhost:${PORT}/download/growmore-app.zip`);
  console.log(`=======================================================`);
});
