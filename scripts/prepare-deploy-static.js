// scripts/prepare-deploy-static.js - Prepare static export build for deployment
const fs = require('fs');
const path = require('path');

console.log('📦 Preparing static export deployment package...\n');

const rootDir = process.cwd();
const buildDir = path.join(rootDir, 'build');
const deployDir = path.join(rootDir, 'deploy');

// Check if build exists
if (!fs.existsSync(buildDir)) {
  console.error('❌ Build directory not found!');
  console.error('   Run "npm run build" first.\n');
  process.exit(1);
}

// Create deploy directory
if (fs.existsSync(deployDir)) {
  console.log('🧹 Cleaning existing deploy directory...');
  fs.rmSync(deployDir, { recursive: true, force: true });
}
fs.mkdirSync(deployDir, { recursive: true });

console.log('📋 Copying build files...');

// Copy function
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Copy build directory
copyRecursiveSync(buildDir, path.join(deployDir, 'build'));

// Copy server-static.js
console.log('📝 Copying server file...');
const serverStaticPath = path.join(rootDir, 'server-static.js');
if (fs.existsSync(serverStaticPath)) {
  fs.copyFileSync(serverStaticPath, path.join(deployDir, 'server.js'));
} else {
  console.error('❌ server-static.js not found!');
  process.exit(1);
}

// Create package.json for deployment
console.log('📝 Creating deployment package.json...');
const rootPackageJson = require(path.join(rootDir, 'package.json'));
const deployPackageJson = {
  name: 'oxo-carriers-frontend',
  version: '1.0.0',
  private: true,
  scripts: {
    start: 'node server.js'
  },
  dependencies: {
    express: '^4.18.2'
  }
};

fs.writeFileSync(
  path.join(deployDir, 'package.json'),
  JSON.stringify(deployPackageJson, null, 2)
);

// Create .htaccess for LiteSpeed (optional, for static file serving)
console.log('📝 Creating .htaccess for LiteSpeed server...');
const htaccessContent = `# Static Export - LiteSpeed Configuration
RewriteEngine On

# Handle client-side routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]

# Security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Enable compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
`;
fs.writeFileSync(path.join(deployDir, '.htaccess'), htaccessContent);

// Create deployment instructions
console.log('📝 Creating deployment instructions...');
const instructions = `# Deployment Instructions for Static Export

## Files to Upload

Upload the entire contents of the 'deploy' folder to your server at:
https://app.oxocareers.com/

## Upload Structure

The deploy folder contains:
- build/ - Next.js static export build
- server.js - Express server to serve static files
- package.json - Minimal dependencies (only express)
- .htaccess - LiteSpeed server configuration (optional)

## Server Setup

1. Upload all files from the 'deploy' folder to your server root
2. Install Node.js dependencies:
   \`\`\`bash
   npm install --production
   \`\`\`

3. Configure Node.js Application in cPanel:
   - Application Root: /public_html (or your domain directory)
   - Application URL: app.oxocareers.com
   - Application Startup File: server.js
   - Node.js Version: 18.x or higher

4. Set Environment Variables (if needed):
   - NODE_ENV=production
   - PORT=3000 (or your server's port)

5. Start the application in cPanel Node.js Selector

## Alternative: Serve Without Node.js

If you prefer to serve static files without Node.js:
1. Upload only the 'build' folder contents to your web root
2. Configure .htaccess for client-side routing
3. No Node.js application needed

## Troubleshooting

- Check Node.js logs in cPanel
- Verify all files are uploaded correctly
- Ensure file permissions are correct (644 for files, 755 for directories)
- Check that Node.js version is compatible (18.x or higher)
`;
fs.writeFileSync(path.join(deployDir, 'DEPLOYMENT_INSTRUCTIONS.md'), instructions);

console.log('\n✅ Static export deployment package prepared successfully!');
console.log(`📁 Location: ${deployDir}`);
console.log('\n📋 Next steps:');
console.log('1. Review the files in the "deploy" folder');
console.log('2. Upload all files to https://app.oxocareers.com/');
console.log('3. Follow the instructions in DEPLOYMENT_INSTRUCTIONS.md');
console.log('4. Configure Node.js application in cPanel\n');
