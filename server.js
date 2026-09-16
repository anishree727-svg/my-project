const http = require('http');
const fs = require('fs');
const path = require('path');
const contactFunction = require('./netlify/functions/contact.js');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;

  // Handle Netlify function endpoint
  if (pathname === '/api/contact' || pathname === '/.netlify/functions/contact' || pathname === '/contact-submit') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const event = {
          httpMethod: req.method,
          headers: req.headers,
          body: body
        };

        const result = await contactFunction.handler(event);

        res.writeHead(result.statusCode || 200, result.headers || { 'Content-Type': 'application/json' });
        res.end(result.body || '');
      } catch (err) {
        console.error('Function error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Internal Server Error' }));
      }
    });
    return;
  }

  // Handle static files
  let safePath = pathname === '/' ? '/index.html' : pathname;
  if (safePath === '/products') safePath = '/products.html';

  const filePath = path.join(PUBLIC_DIR, safePath);

  // Security check: ensure path is within PUBLIC_DIR
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 Not Found</h1>');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  Thete Agro Impex Local Dev Server`);
  console.log(`  URL: http://localhost:${PORT}`);
  console.log(`  Enquiry API: http://localhost:${PORT}/api/contact`);
  console.log(`======================================================\n`);
});
