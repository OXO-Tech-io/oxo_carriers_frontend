// server-static.js - Static file server for Next.js export build
// This server serves the static files from the 'build' directory

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const BUILD_DIR = path.join(__dirname, 'build');

// Check if build directory exists
if (!fs.existsSync(BUILD_DIR)) {
  console.error('❌ Build directory not found!');
  console.error(`   Expected: ${BUILD_DIR}`);
  console.error('   Run "npm run build" first.');
  process.exit(1);
}

// Serve static files from build directory
app.use(express.static(BUILD_DIR, {
  maxAge: '1y', // Cache static assets for 1 year
  etag: true,
  lastModified: true,
}));

// Handle client-side routing (SPA fallback)
// All routes should serve index.html for client-side routing
app.get('*', (req, res) => {
  // Check if the request is for a file (has extension)
  const hasExtension = path.extname(req.path).length > 0;
  
  if (hasExtension) {
    // If it's a file request, try to serve it, or return 404
    const filePath = path.join(BUILD_DIR, req.path);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return res.sendFile(filePath);
    }
    return res.status(404).send('File not found');
  }
  
  // For all other routes, serve index.html (for client-side routing)
  const indexPath = path.join(BUILD_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('index.html not found. Please run "npm run build" first.');
  }
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Static file server started');
  console.log(`📁 Serving files from: ${BUILD_DIR}`);
  console.log(`🌐 Server running on port ${PORT}`);
  console.log(`🔗 Access at: http://localhost:${PORT}`);
  console.log(`📦 Production URL: https://app.oxocareers.com/`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully...');
  process.exit(0);
});
