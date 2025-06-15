#!/usr/bin/env node

/**
 * Documentation Validation Script
 * 
 * This script validates the documentation structure and content:
 * 1. Checks if all required directories exist
 * 2. Ensures each directory has a README.md
 * 3. Verifies cross-references between documentation files
 * 4. Checks for broken internal links
 * 5. Validates code examples against actual codebase
 * 
 * Usage: node validate-docs.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk'); // You may need to install this: npm install chalk

// Configuration
const DOCS_DIR = path.join(__dirname, '..', 'docs');
const REQUIRED_DIRS = [
  '01_Testing_Strategies',
  '02_Security_and_DevOps',
  '03_Development_Methodologies',
  '04_Project_Specifics'
];

// Utility functions
function logSuccess(message) {
  console.log(chalk.green('✓ ' + message));
}

function logWarning(message) {
  console.log(chalk.yellow('⚠ ' + message));
}

function logError(message) {
  console.log(chalk.red('✗ ' + message));
}

function logInfo(message) {
  console.log(chalk.blue('ℹ ' + message));
}

// Validation functions
function validateDirectoryStructure() {
  logInfo('Validating directory structure...');
  
  // Check if docs directory exists
  if (!fs.existsSync(DOCS_DIR)) {
    logError(`Docs directory not found at ${DOCS_DIR}`);
    return false;
  }
  
  // Check if required directories exist
  let allDirsExist = true;
  for (const dir of REQUIRED_DIRS) {
    const dirPath = path.join(DOCS_DIR, dir);
    if (!fs.existsSync(dirPath)) {
      logError(`Required directory not found: ${dir}`);
      allDirsExist = false;
    } else {
      logSuccess(`Found required directory: ${dir}`);
    }
  }
  
  return allDirsExist;
}

function validateReadmeFiles() {
  logInfo('Validating README.md files...');
  
  let allReadmesExist = true;
  
  // Check main docs README.md
  const mainReadmePath = path.join(DOCS_DIR, 'README.md');
  if (!fs.existsSync(mainReadmePath)) {
    logError('Main docs README.md not found');
    allReadmesExist = false;
  } else {
    logSuccess('Found main docs README.md');
  }
  
  // Check README.md in each required directory
  for (const dir of REQUIRED_DIRS) {
    const readmePath = path.join(DOCS_DIR, dir, 'README.md');
    if (!fs.existsSync(readmePath)) {
      logError(`README.md not found in ${dir}`);
      allReadmesExist = false;
    } else {
      logSuccess(`Found README.md in ${dir}`);
    }
  }
  
  return allReadmesExist;
}

function validateInternalLinks() {
  logInfo('Validating internal links...');
  
  try {
    // Get all markdown files
    const allMdFiles = getAllMarkdownFiles(DOCS_DIR);
    let allLinksValid = true;
    
    // Check each file individually instead of using glob pattern
    for (const file of allMdFiles) {
      try {
        const relativePath = path.relative(process.cwd(), file);
        logInfo(`Checking links in ${relativePath}`);
        execSync(`npx markdown-link-check --quiet "${file}"`, { stdio: 'pipe' });
      } catch (error) {
        logError(`Found broken links in ${path.relative(process.cwd(), file)}`);
        allLinksValid = false;
      }
    }
    
    if (allLinksValid) {
      logSuccess('All internal links are valid');
    }
    
    return allLinksValid;
  } catch (error) {
    logError(`Error validating links: ${error.message}`);
    return false;
  }
}

function validateCodeExamples() {
  logInfo('Validating code examples...');
  
  // This is a simplified implementation that just checks if code files referenced in docs exist
  // A more comprehensive implementation would parse code blocks and validate them against actual code
  
  const allMdFiles = getAllMarkdownFiles(DOCS_DIR);
  let allExamplesValid = true;
  
  for (const file of allMdFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const codeReferences = extractCodeReferences(content);
    
    for (const ref of codeReferences) {
      const refPath = path.join(__dirname, '..', ref);
      if (!fs.existsSync(refPath)) {
        logError(`Referenced code file not found: ${ref} (in ${path.relative(process.cwd(), file)})`);
        allExamplesValid = false;
      }
    }
  }
  
  if (allExamplesValid) {
    logSuccess('All referenced code files exist');
  }
  
  return allExamplesValid;
}

function getAllMarkdownFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results = results.concat(getAllMarkdownFiles(filePath));
    } else if (path.extname(file) === '.md') {
      results.push(filePath);
    }
  }
  
  return results;
}

function extractCodeReferences(content) {
  // This is a simplified implementation that looks for common patterns of code references
  // A more comprehensive implementation would use a proper Markdown parser
  
  const references = [];
  
  // Look for markdown links to code files
  const linkRegex = /\[.*?\]\((.*?\.(?:js|ts|jsx|tsx|html|css|json))\)/g;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    references.push(match[1]);
  }
  
  // Look for code imports or requires
  const importRegex = /(?:import|require)\s*\(['"]([^'"]*\.(?:js|ts|jsx|tsx))['"]\)/g;
  while ((match = importRegex.exec(content)) !== null) {
    references.push(match[1]);
  }
  
  return references;
}

function validateCrossReferences() {
  logInfo('Validating cross-references between documentation files...');
  
  const allMdFiles = getAllMarkdownFiles(DOCS_DIR);
  let allCrossRefsValid = true;
  
  for (const file of allMdFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const mdLinks = extractMarkdownLinks(content);
    
    for (const link of mdLinks) {
      // Skip external links and anchors
      if (link.startsWith('http') || link.startsWith('#')) {
        continue;
      }
      
      const linkPath = path.resolve(path.dirname(file), link);
      if (!fs.existsSync(linkPath)) {
        logError(`Broken cross-reference: ${link} (in ${path.relative(process.cwd(), file)})`);
        allCrossRefsValid = false;
      }
    }
  }
  
  if (allCrossRefsValid) {
    logSuccess('All cross-references are valid');
  }
  
  return allCrossRefsValid;
}

function extractMarkdownLinks(content) {
  const links = [];
  const linkRegex = /\[.*?\]\((.*?)\)/g;
  let match;
  
  while ((match = linkRegex.exec(content)) !== null) {
    links.push(match[1].split('#')[0]); // Remove anchors
  }
  
  return links;
}

// Main validation function
async function validateDocumentation() {
  console.log(chalk.bold('\n=== Documentation Validation ===\n'));
  
  const structureValid = validateDirectoryStructure();
  const readmesValid = validateReadmeFiles();
  const crossRefsValid = validateCrossReferences();
  const internalLinksValid = validateInternalLinks();
  const codeExamplesValid = validateCodeExamples();
  
  console.log(chalk.bold('\n=== Validation Summary ===\n'));
  
  if (structureValid) {
    logSuccess('Directory structure is valid');
  } else {
    logError('Directory structure has issues');
  }
  
  if (readmesValid) {
    logSuccess('README.md files are present');
  } else {
    logError('Some README.md files are missing');
  }
  
  if (crossRefsValid) {
    logSuccess('Cross-references are valid');
  } else {
    logError('Some cross-references are broken');
  }
  
  if (internalLinksValid) {
    logSuccess('Internal links are valid');
  } else {
    logError('Some internal links are broken');
  }
  
  if (codeExamplesValid) {
    logSuccess('Code examples are valid');
  } else {
    logError('Some code examples reference non-existent files');
  }
  
  const allValid = structureValid && readmesValid && crossRefsValid && internalLinksValid && codeExamplesValid;
  
  console.log(chalk.bold('\n=== Final Result ===\n'));
  
  if (allValid) {
    logSuccess('Documentation validation passed!');
    return 0;
  } else {
    logError('Documentation validation failed. Please fix the issues above.');
    return 1;
  }
}

// Run validation
validateDocumentation()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('Validation error:', error);
    process.exit(1);
  });
