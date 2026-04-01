// server.js - Production server for Next.js standalone build
// This file should be placed in the root directory after deployment
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// When using standalone output, Next.js creates a minimal server
// This file is for custom server setup if needed
// For standalone builds, use the server.js from .next/standalone/server.js

if (dev) {
  // Development mode - use Next.js dev server
  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('internal server error');
      }
    }).listen(port, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://${hostname}:${port}`);
    });
  });
} else {
  // Production mode - for standalone builds, use the server from .next/standalone
  console.log('Starting production server...');
  console.log('For standalone builds, use: node .next/standalone/server.js');
  console.log('Or configure your hosting to use: .next/standalone/server.js');
}
