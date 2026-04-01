// scripts/show-build.js - Display build output information
const fs = require('fs');
const path = require('path');

const getDirectorySize = (dirPath) => {
  let totalSize = 0;
  try {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        totalSize += getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    });
  } catch (error) {
    // Directory doesn't exist or can't be read
  }
  return totalSize;
};

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const listDirectory = (dirPath, prefix = '', maxDepth = 2, currentDepth = 0) => {
  if (currentDepth >= maxDepth) return;
  
  try {
    const items = fs.readdirSync(dirPath).sort();
    items.forEach((item, index) => {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);
      const isLast = index === items.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      
      if (stats.isDirectory()) {
        console.log(`${prefix}${connector}${item}/`);
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        listDirectory(itemPath, newPrefix, maxDepth, currentDepth + 1);
      } else {
        const size = formatBytes(stats.size);
        console.log(`${prefix}${connector}${item} (${size})`);
      }
    });
  } catch (error) {
    // Directory doesn't exist or can't be read
  }
};

console.log('\n📦 Build Output Summary\n');
console.log('='.repeat(50));

const nextDir = path.join(process.cwd(), '.next');
const standaloneDir = path.join(nextDir, 'standalone');

// Check if .next directory exists
if (fs.existsSync(nextDir)) {
  const nextSize = getDirectorySize(nextDir);
  console.log(`\n✅ Build directory: .next/`);
  console.log(`   Total size: ${formatBytes(nextSize)}`);
  console.log(`\n📁 Directory structure:`);
  listDirectory(nextDir);
  
  // Check for standalone build
  if (fs.existsSync(standaloneDir)) {
    const standaloneSize = getDirectorySize(standaloneDir);
    console.log(`\n🚀 Standalone build: .next/standalone/`);
    console.log(`   Total size: ${formatBytes(standaloneSize)}`);
    console.log(`\n📁 Standalone structure:`);
    listDirectory(standaloneDir, '', 3);
  }
  
  // Show build info if available
  const buildManifest = path.join(nextDir, 'build-manifest.json');
  if (fs.existsSync(buildManifest)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf8'));
      console.log(`\n📋 Build manifest found`);
    } catch (error) {
      // Ignore parse errors
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ Build completed successfully!\n');
  console.log('To start the production server, run:');
  console.log('  npm run start\n');
} else {
  console.log('\n❌ Build directory not found!');
  console.log('   Run "npm run build" first.\n');
}
