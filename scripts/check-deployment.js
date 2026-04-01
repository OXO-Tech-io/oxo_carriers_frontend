// scripts/check-deployment.js - Check if deployment files are correct
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking deployment setup...\n');

const rootDir = process.cwd();
const checks = {
  serverJs: { path: path.join(rootDir, 'server.js'), required: true },
  packageJson: { path: path.join(rootDir, 'package.json'), required: true },
  standaloneDir: { path: path.join(rootDir, 'standalone'), required: true },
  standaloneServer: { path: path.join(rootDir, 'standalone', 'server.js'), required: true },
  standaloneStatic: { path: path.join(rootDir, 'standalone', '.next', 'static'), required: true, critical: true },
  standalonePublic: { path: path.join(rootDir, 'standalone', 'public'), required: true, critical: true },
  standaloneServerDir: { path: path.join(rootDir, 'standalone', '.next', 'server'), required: true },
  nodeModules: { path: path.join(rootDir, 'node_modules'), required: false },
};

let allGood = true;

console.log('📁 File Structure Check:\n');

for (const [name, check] of Object.entries(checks)) {
  const exists = fs.existsSync(check.path);
  const isCritical = check.critical || false;
  const status = exists ? '✅' : (check.required ? '❌' : '⚠️ ');
  const req = check.required ? (isCritical ? '(CRITICAL - Pages won\'t load without this!)' : '(REQUIRED)') : '(optional)';
  
  console.log(`${status} ${name}: ${exists ? 'Found' : 'Missing'} ${req}`);
  console.log(`   Path: ${check.path}`);
  
  if (!exists && check.required) {
    allGood = false;
    if (isCritical) {
      console.log('   ⚠️  WARNING: This is critical for pages to load!');
    }
  }
  
  // Check static directory contents
  if (exists && name === 'standaloneStatic') {
    try {
      const staticFiles = fs.readdirSync(check.path);
      console.log(`   - Contains ${staticFiles.length} items`);
      if (staticFiles.length === 0) {
        console.log('   ⚠️  Static directory is empty! Pages will not load.');
        allGood = false;
      }
    } catch (e) {
      console.log('   ⚠️  Could not read static directory');
    }
  }
  
  if (exists && name === 'nodeModules') {
    try {
      const nextExists = fs.existsSync(path.join(check.path, 'next'));
      const reactExists = fs.existsSync(path.join(check.path, 'react'));
      console.log(`   - next: ${nextExists ? '✅' : '❌'}`);
      console.log(`   - react: ${reactExists ? '✅' : '❌'}`);
      if (!nextExists || !reactExists) {
        console.log('   ⚠️  Dependencies may not be installed. Run: npm install --production');
      }
    } catch (e) {
      // Ignore
    }
  }
  
  console.log('');
}

console.log('🌍 Environment Check:\n');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`PORT: ${process.env.PORT || 'not set (default: 3000)'}`);
console.log(`NEXT_PUBLIC_API_URL: ${process.env.NEXT_PUBLIC_API_URL || 'not set'}`);
console.log('');

if (allGood) {
  console.log('✅ All required files are present!');
  console.log('\n📋 Next steps:');
  console.log('1. Make sure NODE_ENV=production is set');
  console.log('2. Set PORT to match your server configuration');
  console.log('3. Set NEXT_PUBLIC_API_URL=https://backend.oxocareers.com/api');
  console.log('4. Run: npm install --production (if node_modules missing)');
  console.log('5. Start the application in cPanel Node.js Selector');
  console.log('6. Verify static files are accessible (check browser console)\n');
} else {
  console.log('❌ Some required files are missing!');
  console.log('\n🔧 Fix steps:');
  console.log('1. If static files are missing, run: npm run build:deploy');
  console.log('2. Make sure the build completed successfully');
  console.log('3. Verify .next/static exists after build');
  console.log('4. Check that deploy/standalone/.next/static was created');
  console.log('5. Re-upload all files from the deploy folder');
  console.log('\n📖 See FIX_PAGES_NOT_LOADING.md for detailed instructions.\n');
}
