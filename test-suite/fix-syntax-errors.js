const fs = require('fs');
const path = require('path');

function fixEscapeSequencesInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let fixed = false;
    
    // Fix common escape sequence issues
    const patterns = [
      // Fix bad escape sequences in strings
      {
        regex: /\\\\\\\([^\\'"bfnrtv0-7xu])/g,
        replacement: (match, char) => `\\\\\\\\\${char}`
      },
      // Fix unterminated escape sequences
      {
        regex: /\\\\\\\$/gm,
        replacement: '\\\\'
      },
      // Fix Windows path separators in strings
      {
        regex: /\\\\\\\([a-zA-Z])/g,
        replacement: (match, char) => {
          // Only fix if it's clearly a path separator issue
          if (['n', 't', 'r', 'b', 'f', 'v', '0'].includes(char)) {
            return match; // Keep valid escape sequences
          }
          return `\\\\\\\\\${char}`;
        }
      }
    ];
    
    let newContent = content;
    
    for (const pattern of patterns) {
      const matches = newContent.match(pattern.regex);
      if (matches && matches.length > 0) {
        newContent = newContent.replace(pattern.regex, pattern.replacement);
        fixed = true;
      }
    }
    
    if (fixed) {
      // Create backup
      const backupPath = `${filePath}.backup`;
      if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(filePath, backupPath);
      }
      
      // Write fixed content
      fs.writeFileSync(filePath, newContent);
      console.log(`Fixed escape sequences in ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error fixing ${filePath}: ${error.message}`);
    return false;
  }
}

function findJavaScriptFiles(directory) {
  const files = [];
  
  function scanDirectory(dir) {
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip node_modules and other common directories
          if (!['node_modules', '.git', 'coverage', '.nyc_output'].includes(item)) {
            scanDirectory(fullPath);
          }
        } else if (item.endsWith('.js') && !item.endsWith('.min.js')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dir}: ${error.message}`);
    }
  }
  
  scanDirectory(directory);
  return files;
}

function fixAllFiles(directory) {
  const jsFiles = findJavaScriptFiles(directory);
  let fixedCount = 0;
  
  console.log(`Checking ${jsFiles.length} JavaScript files for syntax errors...`);
  
  for (const file of jsFiles) {
    if (fixEscapeSequencesInFile(file)) {
      fixedCount++;
    }
  }
  
  console.log(`Fixed ${fixedCount} files with syntax errors`);
  return fixedCount;
}

// Run if called directly
if (require.main === module) {
  const projectDir = process.cwd();
  fixAllFiles(projectDir);
}

module.exports = { fixEscapeSequencesInFile, fixAllFiles };
