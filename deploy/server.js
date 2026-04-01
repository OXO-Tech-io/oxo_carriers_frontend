// Production server for Next.js standalone build
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
