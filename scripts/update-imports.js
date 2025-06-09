/**
 * Import Path Update Script
 * 
 * This script updates import paths throughout the codebase to use module aliases.
 * It replaces relative paths with module aliases based on the configuration in package.json.
 * 
 * Usage:
 *   node scripts/update-imports.js [--dry-run] [--verbose]
 * 
 * Options:
 *   --dry-run  Show what would be updated without actually changing files
 *   --verbose  Show detailed information about each file being updated
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

// Promisify fs functions
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

// Configuration
const ROOT_DIR = path.resolve(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

// Get module aliases from package.json
const packageJson = require('../package.json');
const moduleAliases = packageJson._moduleAliases || {};

// Add tests alias which isn't in package.json
moduleAliases['@tests'] = 'tests';

// Directories to scan for JS files
const DIRECTORIES_TO_SCAN = [
  'src',
  'tests',
  'scripts'
];

// File extensions to process
const FILE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

// Regular expression to match import/require statements
const IMPORT_REGEX = /(?:import\s+(?:(?:[\w*{}\n\r\t, ]+)\s+from\s+)?['"])(\.\.?\/.*?)(['"])|(?:(?:const|let|var)\s+(?:[\w{}\n\r\t, ]+)\s*=\s*require\s*\(\s*['"])(\.\.?\/.*?)(['"])/g;

/**
 * Get all JS files in a directory recursively
 * @param {string} dir Directory to scan
 * @returns {Promise<string[]>} Array of file paths
 */
async function getJsFilesRecursively(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  
  const files = await Promise.all(entries.map(async entry => {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules and .git directories
      if (entry.name === 'node_modules' || entry.name === '.git') {
        return [];
      }
      return getJsFilesRecursively(fullPath);
    } else if (FILE_EXTENSIONS.includes(path.extname(entry.name))) {
      return [fullPath];
    }
    return [];
  }));
  
  return files.flat();
}

/**
 * Convert a relative path to a module alias path
 * @param {string} filePath Path of the file containing the import
 * @param {string} relativePath Relative import path
 * @returns {string|null} Module alias path or null if no match
 */
function convertToModuleAlias(filePath, relativePath) {
  // Get absolute path of the imported file
  const absoluteImportPath = path.resolve(path.dirname(filePath), relativePath);
  const relativeToRoot = path.relative(ROOT_DIR, absoluteImportPath);
  
  // Check if the import path matches any of the module aliases
  for (const [alias, aliasPath] of Object.entries(moduleAliases)) {
    const aliasAbsolutePath = path.resolve(ROOT_DIR, aliasPath);
    
    if (absoluteImportPath.startsWith(aliasAbsolutePath)) {
      // Replace the alias path with the alias
      const remainingPath = path.relative(aliasAbsolutePath, absoluteImportPath);
      const aliasImportPath = `${alias}${remainingPath ? `/${remainingPath}` : ''}`;
      return aliasImportPath;
    }
  }
  
  return null;
}

/**
 * Update import paths in a file
 * @param {string} filePath Path of the file to update
 * @returns {Promise<boolean>} True if the file was updated
 */
async function updateImportsInFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    let updatedContent = content;
    let updated = false;
    
    // Replace import/require statements with module aliases
    updatedContent = content.replace(IMPORT_REGEX, (match, importPath1, quote1, importPath2, quote2) => {
      const importPath = importPath1 || importPath2;
      const quote = quote1 || quote2;
      
      // Only process relative imports
      if (importPath.startsWith('./') || importPath.startsWith('../')) {
        const aliasPath = convertToModuleAlias(filePath, importPath);
        
        if (aliasPath) {
          updated = true;
          
          if (VERBOSE) {
            console.log(`[${filePath}] Replacing "${importPath}" with "${aliasPath}"`);
          }
          
          // Reconstruct the import statement with the alias path
          if (importPath1) {
            return `import ${quote}${aliasPath}${quote}`;
          } else {
            return `require(${quote}${aliasPath}${quote}`;
          }
        }
      }
      
      return match;
    });
    
    if (updated && !DRY_RUN) {
      await writeFile(filePath, updatedContent, 'utf8');
      console.log(`Updated imports in ${filePath}`);
    } else if (updated) {
      console.log(`[DRY RUN] Would update imports in ${filePath}`);
    }
    
    return updated;
  } catch (error) {
    console.error(`Error updating imports in ${filePath}:`, error);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Starting import path updates');
  console.log(`Module aliases: ${JSON.stringify(moduleAliases, null, 2)}`);
  
  if (DRY_RUN) {
    console.log('DRY RUN: No files will be modified');
  }
  
  let totalFiles = 0;
  let updatedFiles = 0;
  
  for (const dir of DIRECTORIES_TO_SCAN) {
    const dirPath = path.join(ROOT_DIR, dir);
    
    try {
      const dirStat = await stat(dirPath);
      
      if (!dirStat.isDirectory()) {
        console.warn(`${dirPath} is not a directory, skipping`);
        continue;
      }
      
      console.log(`Scanning ${dirPath} for JS files...`);
      
      const files = await getJsFilesRecursively(dirPath);
      totalFiles += files.length;
      
      console.log(`Found ${files.length} files in ${dirPath}`);
      
      for (const file of files) {
        const updated = await updateImportsInFile(file);
        
        if (updated) {
          updatedFiles++;
        }
      }
    } catch (error) {
      console.error(`Error processing directory ${dirPath}:`, error);
    }
  }
  
  console.log('\nImport path update completed!');
  console.log(`Total files scanned: ${totalFiles}`);
  console.log(`Files updated: ${updatedFiles}`);
  
  if (DRY_RUN) {
    console.log('This was a dry run. No files were actually modified.');
    console.log('Run without --dry-run to apply changes.');
  }
}

// Run the script
main().catch(console.error);
