const fs = require('fs');
const path = require('path');

// Simple build script for backend
console.log('Building backend application...');

const srcDir = path.join(__dirname, 'src');
const distDir = path.join(__dirname, 'dist');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy source files to dist (for now, just copy - can be enhanced with transpilation)
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const files = fs.readdirSync(src);
  
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// Copy main files
if (fs.existsSync(srcDir)) {
  copyDir(srcDir, path.join(distDir, 'src'));
}

// Copy server.js if it exists
const serverFile = path.join(__dirname, 'server.js');
if (fs.existsSync(serverFile)) {
  fs.copyFileSync(serverFile, path.join(distDir, 'server.js'));
}

// Copy models directory
const modelsDir = path.join(__dirname, 'models');
if (fs.existsSync(modelsDir)) {
  copyDir(modelsDir, path.join(distDir, 'models'));
}

// Copy routes directory
const routesDir = path.join(__dirname, 'routes');
if (fs.existsSync(routesDir)) {
  copyDir(routesDir, path.join(distDir, 'routes'));
}

console.log('Backend build completed successfully!');
console.log(`Output directory: ${distDir}`);
