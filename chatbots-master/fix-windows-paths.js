const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, 'src');
const fileExtensions = ['.js', '.jsx', '.ts', '.tsx'];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Fix Windows paths in require/import statements
    content = content.replace(
      /(require\(['\"])@[a-zA-Z0-9_/\\-]+\\([a-zA-Z0-9_\-./]+)(?=['\"]\))/g,
      (match, p1) => p1.replace(/\\\\/g, '/')
    );
    
    content = content.replace(
      /(from\s+['\"])@[a-zA-Z0-9_/\\-]+\\([a-zA-Z0-9_\-./]+)(?=['\"])/g,
      (match, p1) => p1.replace(/\\\\/g, '/')
    );
    
    // Fix specific case in test-user-behavior-insights.js
    content = content.replace(
      /require\('@src\\\\analytics\\\\behavior\\\\user-behavior-insights\\.service'\)/g,
      "require('@src/analytics/behavior/user-behavior-insights.service')"
    );
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed paths in: ${path.relative(process.cwd(), filePath)}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (fileExtensions.some(ext => entry.name.endsWith(ext))) {
      processFile(fullPath);
    }
  }
}

console.log('Fixing Windows paths in source files...');
processDirectory(rootDir);
console.log('Path fixing complete!');
