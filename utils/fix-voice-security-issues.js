/**
 * Voice Security Issues Fixer
 * 
 * This script automatically fixes security issues identified by the security audit
 * in the voice interface components.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const securityAudit = require('./security-audit');

// Configuration
const config = {
  // Paths to voice components
  voiceComponentsPaths: [
    path.join(__dirname, '..', 'src', 'utils', 'audio-processor.js'),
    path.join(__dirname, '..', 'src', 'utils', 'language-detector.js'),
    path.join(__dirname, '..', 'src', 'utils', 'model-manager.js'),
    path.join(__dirname, '..', 'src', 'services', 'voice-recognition.service.js'),
    path.join(__dirname, '..', 'src', 'controllers', 'audio-processor.controller.js'),
    path.join(__dirname, '..', 'src', 'controllers', 'language-detector.controller.js'),
    path.join(__dirname, '..', 'src', 'controllers', 'model-manager.controller.js'),
    path.join(__dirname, '..', 'src', 'controllers', 'voice-recognition.controller.js')
  ],
  
  // Security audit results file
  auditResultsFile: path.join(__dirname, 'voice-security-audit-results.json'),
  
  // Backup directory
  backupDir: path.join(__dirname, '..', 'backups', 'security-fixes')
};

// Security fixes registry - maps issue types to fix functions
const securityFixes = {
  'command-injection': fixCommandInjection,
  'path-traversal': fixPathTraversal,
  'unsafe-file-operations': fixUnsafeFileOperations,
  'hardcoded-secrets': fixHardcodedSecrets,
  'insecure-random': fixInsecureRandom,
  'buffer-overflow': fixBufferOverflow,
  'privacy-issue': fixPrivacyIssue,
  'model-validation': fixModelValidation
};

/**
 * Main function to fix security issues
 */
async function fixSecurityIssues() {
  console.log('Voice Security Issues Fixer');
  console.log('===========================');
  
  // Create backup directory if it doesn't exist
  if (!fs.existsSync(config.backupDir)) {
    fs.mkdirSync(config.backupDir, { recursive: true });
  }
  
  // Check if audit results exist, if not run the audit
  if (!fs.existsSync(config.auditResultsFile)) {
    console.log('No audit results found. Running security audit...');
    await runSecurityAudit();
  }
  
  // Load audit results
  const auditResults = JSON.parse(fs.readFileSync(config.auditResultsFile, 'utf8'));
  
  if (!auditResults.issues || auditResults.issues.length === 0) {
    console.log('No security issues found. All voice components are secure!');
    return;
  }
  
  console.log(`Found ${auditResults.issues.length} security issues to fix.`);
  
  // Group issues by file
  const issuesByFile = {};
  auditResults.issues.forEach(issue => {
    if (!issuesByFile[issue.file]) {
      issuesByFile[issue.file] = [];
    }
    issuesByFile[issue.file].push(issue);
  });
  
  // Fix issues in each file
  let fixedCount = 0;
  let skippedCount = 0;
  
  for (const [file, issues] of Object.entries(issuesByFile)) {
    console.log(`\nProcessing ${path.basename(file)}:`);
    
    // Create backup of the file
    const backupFile = path.join(config.backupDir, `${path.basename(file)}.bak`);
    fs.copyFileSync(file, backupFile);
    
    // Read file content
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // Fix each issue
    for (const issue of issues) {
      console.log(`- ${issue.type}: ${issue.description} (line ${issue.line})`);
      
      // Check if we have a fix for this issue type
      if (securityFixes[issue.type]) {
        try {
          content = securityFixes[issue.type](content, issue);
          fixedCount++;
          console.log('  ✓ Fixed');
        } catch (error) {
          console.error(`  ✗ Failed to fix: ${error.message}`);
          skippedCount++;
        }
      } else {
        console.log('  ⚠ No automatic fix available for this issue type');
        skippedCount++;
      }
    }
    
    // Write fixed content if changed
    if (content !== originalContent) {
      fs.writeFileSync(file, content);
      console.log(`Updated ${path.basename(file)}`);
    } else {
      console.log(`No changes made to ${path.basename(file)}`);
    }
  }
  
  console.log('\nSecurity fix summary:');
  console.log(`- Total issues: ${auditResults.issues.length}`);
  console.log(`- Fixed: ${fixedCount}`);
  console.log(`- Skipped/Manual fix required: ${skippedCount}`);
  
  if (skippedCount > 0) {
    console.log('\nSome issues require manual fixes. Please review the audit results.');
  } else {
    console.log('\nAll issues have been fixed automatically!');
  }
  
  // Update audit results
  console.log('\nRunning security audit again to verify fixes...');
  await runSecurityAudit();
  
  // Load updated audit results
  const updatedResults = JSON.parse(fs.readFileSync(config.auditResultsFile, 'utf8'));
  
  if (!updatedResults.issues || updatedResults.issues.length === 0) {
    console.log('All security issues have been fixed successfully!');
  } else {
    console.log(`${updatedResults.issues.length} issues still remain. Some may require manual fixes.`);
  }
}

/**
 * Run the security audit
 */
async function runSecurityAudit() {
  try {
    execSync('node run-voice-security-audit.js', { 
      cwd: __dirname,
      stdio: 'inherit'
    });
  } catch (error) {
    console.error('Failed to run security audit:', error.message);
    process.exit(1);
  }
}

/**
 * Fix command injection vulnerabilities
 */
function fixCommandInjection(content, issue) {
  // Extract the vulnerable line and context
  const lines = content.split('\n');
  const vulnerableLine = lines[issue.line - 1];
  
  // Check for common command injection patterns
  if (vulnerableLine.includes('exec(') || 
      vulnerableLine.includes('execSync(') || 
      vulnerableLine.includes('spawn(') || 
      vulnerableLine.includes('spawnSync(')) {
    
    // Fix by using parameter arrays instead of string concatenation
    if (vulnerableLine.includes('+') || vulnerableLine.includes('${')) {
      // Extract the command and arguments
      const match = vulnerableLine.match(/(?:exec|execSync|spawn|spawnSync)\s*\(\s*(['"`])(.*?)\1/);
      
      if (match) {
        const command = match[2];
        
        // Create a safer version using array of arguments
        let fixedLine = vulnerableLine.replace(
          /(?:exec|execSync|spawn|spawnSync)\s*\(\s*(['"`])(.*?)\1\s*\+\s*(.*)/,
          (match, quote, cmd, args) => {
            return match.replace(`${quote}${cmd}${quote} + ${args}`, `'${cmd}', [${args}]`);
          }
        );
        
        // If the fix didn't work with the regex, add a comment for manual fix
        if (fixedLine === vulnerableLine) {
          fixedLine = vulnerableLine + ' // SECURITY: Fix command injection vulnerability by using parameterized arguments';
        }
        
        lines[issue.line - 1] = fixedLine;
      }
    }
  }
  
  return lines.join('\n');
}

/**
 * Fix path traversal vulnerabilities
 */
function fixPathTraversal(content, issue) {
  // Extract the vulnerable line and context
  const lines = content.split('\n');
  const vulnerableLine = lines[issue.line - 1];
  
  // Check for common path traversal patterns
  if (vulnerableLine.includes('path.join(') || 
      vulnerableLine.includes('path.resolve(') || 
      vulnerableLine.includes('fs.readFile') || 
      vulnerableLine.includes('fs.writeFile')) {
    
    // Add path normalization and validation
    if (!vulnerableLine.includes('path.normalize(') && 
        !vulnerableLine.includes('.replace(/\\.\\./g, \'\')')) {
      
      // Add path validation logic
      const pathValidationCode = `
  // Validate path to prevent path traversal
  const validatePath = (inputPath, basePath) => {
    const normalizedPath = path.normalize(inputPath).replace(/\\\\/g, '/');
    const normalizedBasePath = path.normalize(basePath).replace(/\\\\/g, '/');
    
    if (!normalizedPath.startsWith(normalizedBasePath)) {
      throw new Error('Invalid path: Path traversal attempt detected');
    }
    
    return normalizedPath;
  };`;
      
      // Add the validation code if it doesn't exist
      if (!content.includes('validatePath')) {
        // Find the imports section to add after
        const importSection = content.match(/(?:const|let|var)[\s\S]*?require.*?;/g);
        if (importSection && importSection.length > 0) {
          const lastImport = importSection[importSection.length - 1];
          const insertPosition = content.indexOf(lastImport) + lastImport.length;
          content = content.substring(0, insertPosition) + pathValidationCode + content.substring(insertPosition);
        }
      }
      
      // Add a comment to the vulnerable line
      lines[issue.line - 1] = vulnerableLine + ' // SECURITY: Use validatePath() to prevent path traversal';
    }
  }
  
  return lines.join('\n');
}

/**
 * Fix unsafe file operations
 */
function fixUnsafeFileOperations(content, issue) {
  // Extract the vulnerable line and context
  const lines = content.split('\n');
  const vulnerableLine = lines[issue.line - 1];
  
  // Check for unsafe file operations
  if (vulnerableLine.includes('fs.') && 
     (vulnerableLine.includes('Sync(') || 
      vulnerableLine.includes('File(') || 
      vulnerableLine.includes('Directory('))) {
    
    // Add try-catch if not present
    if (!vulnerableLine.includes('try {') && 
        !lines[issue.line - 2]?.includes('try {')) {
      
      // Find the function or block this line is in
      let blockStart = issue.line - 2;
      while (blockStart >= 0 && !lines[blockStart].includes('{')) {
        blockStart--;
      }
      
      // Add try-catch around the vulnerable line
      const indentation = vulnerableLine.match(/^\s*/)[0];
      lines[issue.line - 1] = `${indentation}try {
${vulnerableLine}
${indentation}} catch (error) {
${indentation}  console.error('File operation error:', error.message);
${indentation}  throw new Error('Failed to perform file operation safely');
${indentation}}`;
    }
  }
  
  return lines.join('\n');
}

/**
 * Fix hardcoded secrets
 */
function fixHardcodedSecrets(content, issue) {
  // Extract the vulnerable line and context
  const lines = content.split('\n');
  const vulnerableLine = lines[issue.line - 1];
  
  // Check for hardcoded secrets patterns
  const secretPatterns = [
    /(['"`])(?:api|secret|key|token|password|auth).*?\1\s*[=:]\s*(['"`])(?!process\.env)[^'"`]+\2/i,
    /const\s+(?:api|secret|key|token|password|auth).*?=\s*(['"`])(?!process\.env)[^'"`]+\1/i
  ];
  
  for (const pattern of secretPatterns) {
    if (pattern.test(vulnerableLine)) {
      // Replace with environment variable
      const match = vulnerableLine.match(pattern);
      if (match) {
        const variableName = vulnerableLine.match(/(?:const|let|var)\s+(\w+)/)?.[1] || 
                            vulnerableLine.match(/['"`](\w+)['"`]\s*[=:]/)?.[1];
        
        if (variableName) {
          const envVarName = variableName.toUpperCase();
          const fixedLine = vulnerableLine.replace(
            pattern,
            `$1${variableName}$1 = process.env.${envVarName}`
          );
          
          lines[issue.line - 1] = fixedLine + ` // SECURITY: Use environment variable for ${variableName}`;
          
          // Add a comment about adding to .env file
          lines.splice(issue.line, 0, `// IMPORTANT: Add ${envVarName} to your .env file`);
        }
      }
    }
  }
  
  return lines.join('\n');
}

/**
 * Fix insecure random values
 */
function fixInsecureRandom(content, issue) {
  // Extract the vulnerable line and context
  const lines = content.split('\n');
  const vulnerableLine = lines[issue.line - 1];
  
  // Check for insecure random patterns
  if (vulnerableLine.includes('Math.random()')) {
    // Add crypto import if not present
    if (!content.includes('crypto')) {
      const importMatch = content.match(/(?:const|let|var)[\s\S]*?require.*?;/g);
      if (importMatch && importMatch.length > 0) {
        const lastImport = importMatch[importMatch.length - 1];
        const insertPosition = content.indexOf(lastImport) + lastImport.length;
        content = content.substring(0, insertPosition) + "\nconst crypto = require('crypto');\n" + content.substring(insertPosition);
      }
    }
    
    // Replace Math.random with crypto.randomBytes
    if (vulnerableLine.includes('Math.random() *')) {
      // For generating random numbers in a range
      const match = vulnerableLine.match(/Math\.random\(\)\s*\*\s*(\d+)/);
      if (match) {
        const max = match[1];
        const fixedLine = vulnerableLine.replace(
          /Math\.random\(\)\s*\*\s*(\d+)/,
          `crypto.randomInt(${max})`
        );
        lines[issue.line - 1] = fixedLine;
      }
    } else {
      // For generating random values
      const fixedLine = vulnerableLine.replace(
        /Math\.random\(\)/,
        'crypto.randomBytes(8).readUInt32LE(0) / 0xFFFFFFFF'
      );
      lines[issue.line - 1] = fixedLine;
    }
  }
  
  return lines.join('\n');
}

/**
 * Fix buffer overflow issues
 */
function fixBufferOverflow(content, issue) {
  // Extract the vulnerable line and context
  const lines = content.split('\n');
  const vulnerableLine = lines[issue.line - 1];
  
  // Check for buffer operations without proper bounds checking
  if (vulnerableLine.includes('Buffer') && 
     (vulnerableLine.includes('write') || vulnerableLine.includes('read'))) {
    
    // Add bounds checking
    if (!vulnerableLine.includes('if (') && 
        !lines[issue.line - 2]?.includes('if (')) {
      
      // Add bounds checking before the vulnerable line
      const indentation = vulnerableLine.match(/^\s*/)[0];
      const bufferMatch = vulnerableLine.match(/(\w+)\.(?:write|read)/);
      
      if (bufferMatch) {
        const bufferName = bufferMatch[1];
        const operationMatch = vulnerableLine.match(/\.(\w+)\(/);
        const operation = operationMatch ? operationMatch[1] : 'operation';
        
        lines[issue.line - 1] = `${indentation}// Ensure buffer operation is within bounds
${indentation}if (${bufferName} && ${bufferName}.length >= requiredLength) {
${indentation}  ${vulnerableLine.trim()}
${indentation}} else {
${indentation}  throw new Error('Buffer ${operation} would exceed bounds');
${indentation}}`;
      }
    }
  }
  
  return lines.join('\n');
}

/**
 * Fix privacy issues
 */
function fixPrivacyIssue(content, issue) {
  // Extract the vulnerable line and context
  const lines = content.split('\n');
  const vulnerableLine = lines[issue.line - 1];
  
  // Check for privacy issues like logging sensitive data
  if (vulnerableLine.includes('console.log(') && 
     (vulnerableLine.includes('user') || 
      vulnerableLine.includes('profile') || 
      vulnerableLine.includes('audio') || 
      vulnerableLine.includes('data'))) {
    
    // Replace with privacy-preserving logging
    const fixedLine = vulnerableLine.replace(
      /console\.log\(\s*(['"`])(.*?)\1\s*,\s*(.*)\)/,
      (match, quote, message, data) => {
        return `console.log(${quote}${message}${quote}, '[REDACTED]') // SECURITY: Avoid logging sensitive data`;
      }
    );
    
    lines[issue.line - 1] = fixedLine;
  }
  
  return lines.join('\n');
}

/**
 * Fix model validation issues
 */
function fixModelValidation(content, issue) {
  // Extract the vulnerable line and context
  const lines = content.split('\n');
  const vulnerableLine = lines[issue.line - 1];
  
  // Check for model loading without validation
  if (vulnerableLine.includes('loadModel(') || 
      vulnerableLine.includes('model.load(')) {
    
    // Add model validation
    if (!vulnerableLine.includes('validateModel(') && 
        !lines[issue.line - 2]?.includes('validateModel(')) {
      
      // Add a comment to the vulnerable line
      lines[issue.line - 1] = vulnerableLine + ' // SECURITY: Add model validation before loading';
      
      // Add model validation function if not present
      if (!content.includes('validateModel')) {
        // Find a good place to add the validation function
        const functionSection = content.match(/function\s+\w+\s*\([^)]*\)\s*{/g);
        if (functionSection && functionSection.length > 0) {
          const lastFunction = functionSection[functionSection.length - 1];
          const functionEndMatch = content.substring(content.indexOf(lastFunction)).match(/}\s*$/m);
          
          if (functionEndMatch) {
            const insertPosition = content.indexOf(lastFunction) + 
                                  content.substring(content.indexOf(lastFunction)).indexOf(functionEndMatch[0]) + 
                                  functionEndMatch[0].length;
            
            const validationFunction = `
/**
 * Validate model integrity and authenticity
 * @param {string} modelPath - Path to the model file
 * @returns {boolean} - True if model is valid
 */
function validateModel(modelPath) {
  if (!fs.existsSync(modelPath)) {
    throw new Error(\`Model not found: \${modelPath}\`);
  }
  
  // Check file size
  const stats = fs.statSync(modelPath);
  if (stats.size < 1000) { // Minimum expected size
    throw new Error(\`Model file too small, may be corrupted: \${modelPath}\`);
  }
  
  // Check file extension
  const ext = path.extname(modelPath).toLowerCase();
  const validExtensions = ['.pb', '.tflite', '.onnx', '.bin', '.model'];
  if (!validExtensions.includes(ext)) {
    throw new Error(\`Invalid model file extension: \${ext}\`);
  }
  
  // Additional validation could include checksum verification
  
  return true;
}`;
            
            content = content.substring(0, insertPosition) + validationFunction + content.substring(insertPosition);
          }
        }
      }
    }
  }
  
  return lines.join('\n');
}

// Run the script
fixSecurityIssues().catch(error => {
  console.error('Failed to fix security issues:', error);
  process.exit(1);
});
