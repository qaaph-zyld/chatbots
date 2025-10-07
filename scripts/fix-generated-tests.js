// scripts/fix-generated-tests.js
const fs = require('fs');
const path = require('path');

const generatedTestsDir = path.join(__dirname, '../tests/generated');

// Function to fix duplicate path declarations
function fixDuplicatePathDeclarations(content) {
  // Replace duplicate 'const path = require('path')' declarations
  const pathDeclarationRegex = /const\s+path\s*=\s*require\(['"]path['"]\);/g;
  const matches = content.match(pathDeclarationRegex);
  
  if (matches && matches.length > 1) {
    // Keep the first declaration and remove subsequent ones
    let firstOccurrence = true;
    return content.replace(pathDeclarationRegex, (match) => {
      if (firstOccurrence) {
        firstOccurrence = false;
        return match;
      }
      return '';
    });
  }
  
  return content;
}

// Process all generated test files
function processGeneratedTests() {
  if (!fs.existsSync(generatedTestsDir)) {
    console.log('Generated tests directory not found');
    return;
  }
  
  const processDirectory = (dir) => {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        processDirectory(filePath);
      } else if (file.endsWith('.test.js')) {
        console.log(`Processing ${filePath}`);
        
        // Read file content
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Fix duplicate path declarations
        content = fixDuplicatePathDeclarations(content);
        
        // Write back fixed content
        fs.writeFileSync(filePath, content, 'utf8');
      }
    }
  };
  
  processDirectory(generatedTestsDir);
  console.log('Generated tests fixed successfully');
}

// Run the fix
processGeneratedTests();
