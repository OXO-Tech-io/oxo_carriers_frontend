// scripts/prepare-deploy.js - Prepare build files for deployment
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📦 Preparing deployment package...\n');

const rootDir = process.cwd();
const standaloneDir = path.join(rootDir, '.next', 'standalone');
const publicDir = path.join(rootDir, 'public');
const standalonePublicDir = path.join(standaloneDir, 'public');
const deployDir = path.join(rootDir, 'deploy');

// Check if standalone build exists
if (!fs.existsSync(standaloneDir)) {
  console.error('❌ Standalone build not found!');
  console.error('   Run "npm run build" first.\n');
  process.exit(1);
}

// Create deploy directory
if (fs.existsSync(deployDir)) {
  console.log('🧹 Cleaning existing deploy directory...');
  fs.rmSync(deployDir, { recursive: true, force: true });
}
fs.mkdirSync(deployDir, { recursive: true });

console.log('📋 Copying standalone build...');

// Copy standalone directory
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

// Copy standalone build
copyRecursiveSync(standaloneDir, path.join(deployDir, 'standalone'));

// Copy public folder to standalone (always copy to ensure it's there)
if (fs.existsSync(publicDir)) {
  console.log('📁 Copying public folder...');
  const deployPublicDir = path.join(deployDir, 'standalone', 'public');
  if (fs.existsSync(deployPublicDir)) {
    fs.rmSync(deployPublicDir, { recursive: true, force: true });
  }
  copyRecursiveSync(publicDir, deployPublicDir);
} else {
  console.log('⚠️  Public folder not found, but continuing...');
}

// Copy .next/static to standalone/.next/static (CRITICAL for pages to load)
const staticDir = path.join(rootDir, '.next', 'static');
const standaloneStaticDir = path.join(standaloneDir, '.next', 'static');
const deployStaticDir = path.join(deployDir, 'standalone', '.next', 'static');

if (fs.existsSync(staticDir)) {
  console.log('📁 Copying static files (CRITICAL for pages to load)...');
  // Always copy static files, even if they exist in standalone
  if (fs.existsSync(deployStaticDir)) {
    fs.rmSync(deployStaticDir, { recursive: true, force: true });
  }
  fs.mkdirSync(path.dirname(deployStaticDir), { recursive: true });
  copyRecursiveSync(staticDir, deployStaticDir);
  console.log('✅ Static files copied successfully');
} else {
  console.error('❌ Static directory not found! Build may be incomplete.');
  console.error('   Path:', staticDir);
  console.error('   Run "npm run build" first to generate static files.');
}

// Also copy .next/server if it exists (for server-side rendering)
const serverDir = path.join(rootDir, '.next', 'server');
const deployServerDir = path.join(deployDir, 'standalone', '.next', 'server');
if (fs.existsSync(serverDir)) {
  console.log('📁 Copying server files...');
  if (fs.existsSync(deployServerDir)) {
    fs.rmSync(deployServerDir, { recursive: true, force: true });
  }
  copyRecursiveSync(serverDir, deployServerDir);
}

// Create server.js for deployment
console.log('📝 Creating server.js for deployment...');
const serverJsPath = path.join(deployDir, 'server.js');
const serverJsContent = `// Production server for Next.js standalone build
// Entry point for app.oxocareers.com

console.log('🚀 Starting Next.js standalone server...');
console.log('📁 Current directory:', process.cwd());
console.log('📁 __dirname:', __dirname);

// Load environment variables if .env exists
try {
  require('dotenv').config();
  console.log('✅ Environment variables loaded');
} catch (e) {
  console.log('ℹ️  dotenv not available, using environment variables from server');
}

const path = require('path');
const fs = require('fs');

// Get the standalone directory path
const standaloneDir = path.join(__dirname, 'standalone');
const standaloneServer = path.join(standaloneDir, 'server.js');

console.log('📁 Standalone directory:', standaloneDir);
console.log('📁 Standalone server file:', standaloneServer);

// Check if standalone directory exists
if (!fs.existsSync(standaloneDir)) {
  console.error('❌ Standalone directory not found:', standaloneDir);
  console.error('   Please ensure the standalone build is uploaded correctly.');
  process.exit(1);
}

// Check if server.js exists in standalone
if (!fs.existsSync(standaloneServer)) {
  console.error('❌ Standalone server.js not found:', standaloneServer);
  console.error('   Please ensure the build was created correctly.');
  process.exit(1);
}

// Set the working directory to standalone folder
try {
  process.chdir(standaloneDir);
  console.log('✅ Changed working directory to:', process.cwd());
} catch (error) {
  console.error('❌ Failed to change directory:', error.message);
  process.exit(1);
}

// Load and run the Next.js standalone server
try {
  console.log('📦 Loading Next.js standalone server...');
  require('./server.js');
  console.log('✅ Next.js server started successfully');
} catch (error) {
  console.error('❌ Failed to start Next.js server:', error);
  console.error('   Error details:', error.message);
  console.error('   Stack:', error.stack);
  process.exit(1);
}
`;
fs.writeFileSync(serverJsPath, serverJsContent);

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
    next: rootPackageJson.dependencies.next,
    react: rootPackageJson.dependencies.react,
    'react-dom': rootPackageJson.dependencies['react-dom']
  }
};

// Add dotenv if it exists in dependencies
if (rootPackageJson.dependencies.dotenv) {
  deployPackageJson.dependencies.dotenv = rootPackageJson.dependencies.dotenv;
}

fs.writeFileSync(
  path.join(deployDir, 'package.json'),
  JSON.stringify(deployPackageJson, null, 2)
);

// Create .htaccess for LiteSpeed/cPanel (optional - for static file serving)
console.log('📝 Creating .htaccess for LiteSpeed server...');
const htaccessContent = `# Next.js Standalone - LiteSpeed Configuration
# Note: This is optional. Node.js will handle routing.

# Security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Enable compression for static files
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
const instructions = `# Deployment Instructions for app.oxocareers.com

## Files to Upload

Upload the entire contents of the 'deploy' folder to your server at:
https://app.oxocareers.com/

## Upload Structure

The deploy folder contains:
- standalone/ - Next.js standalone build
- server.js - Server entry point
- package.json - Minimal dependencies
- .htaccess - LiteSpeed server configuration

## Server Setup

1. Upload all files from the 'deploy' folder to your server root
2. Install Node.js dependencies (if not already installed):
   \`\`\`bash
   npm install --production
   \`\`\`

3. Configure Node.js Application in cPanel:
   - Application Root: /public_html (or your domain directory)
   - Application URL: app.oxocareers.com
   - Application Startup File: server.js
   - Node.js Version: 18.x or higher

4. Set Environment Variables (if needed):
   - NEXT_PUBLIC_API_URL=https://your-backend-api-url/api
   - PORT=3000 (or your server's port)

5. Start the application in cPanel Node.js Selector

## Alternative: Using Standalone Server Directly

If your server supports it, you can run:
\`\`\`bash
node standalone/server.js
\`\`\`

## Troubleshooting

- Check Node.js logs in cPanel
- Verify all files are uploaded correctly
- Ensure file permissions are correct (644 for files, 755 for directories)
- Check that Node.js version is compatible (18.x or higher)
`;
fs.writeFileSync(path.join(deployDir, 'DEPLOYMENT_INSTRUCTIONS.md'), instructions);

console.log('\n✅ Deployment package prepared successfully!');
console.log(`📁 Location: ${deployDir}`);
console.log('\n📋 Next steps:');
console.log('1. Review the files in the "deploy" folder');
console.log('2. Upload all files to https://app.oxocareers.com/');
console.log('3. Follow the instructions in DEPLOYMENT_INSTRUCTIONS.md');
console.log('4. Configure Node.js application in cPanel\n');
