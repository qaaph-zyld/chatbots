/**
 * Import Path Migration Script
 * 
 * This script updates import paths throughout the codebase to reflect the new directory structure.
 * It handles both relative and absolute imports, updating them to use the new module aliases.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Configuration
const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const TEST_DIR = path.join(ROOT_DIR, 'tests');
const FILE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

// Path mapping for imports
const PATH_MAPPINGS = [
  // Old path -> New path
  { from: /from ['"]\.\.\/\.\.\/config\/([^'"]+)['"]/g, to: 'from "@src/core/config/$1"' },
  { from: /from ['"]\.\.\/\.\.\/services\/([^'"]+)['"]/g, to: 'from "@modules/$1"' },
  { from: /from ['"]\.\.\/\.\.\/models\/([^'"]+)['"]/g, to: 'from "@domain/$1"' },
  { from: /from ['"]\.\.\/\.\.\/utils\/([^'"]+)['"]/g, to: 'from "@utils/$1"' },
  { from: /from ['"]\.\.\/\.\.\/tests\/([^'"]+)['"]/g, to: 'from "@tests/$1"' },
  { from: /from ['"]\.\.\/services\/([^'"]+)['"]/g, to: 'from "@modules/$1"' },
  { from: /from ['"]\.\.\/models\/([^'"]+)['"]/g, to: 'from "@domain/$1"' },
  { from: /from ['"]\.\.\/utils\/([^'"]+)['"]/g, to: 'from "@utils/$1"' },
  { from: /from ['"]\.\.\/config\/([^'"]+)['"]/g, to: 'from "@core/config/$1"' },
  { from: /from ['"]\.\/models\/([^'"]+)['"]/g, to: 'from "@domain/$1"' },
  { from: /from ['"]\.\/services\/([^'"]+)['"]/g, to: 'from "@modules/$1"' },
  { from: /from ['"]\.\/utils\/([^'"]+)['"]/g, to: 'from "@utils/$1"' },
  { from: /from ['"]\.\/config\/([^'"]+)['"]/g, to: 'from "@core/config/$1"' },
  // Add more mappings as needed
];

// Module-specific mappings
const MODULE_MAPPINGS = {
  'analytics': '@modules/analytics',
  'chatbot': '@modules/chatbot',
  'conversation': '@modules/conversation',
  'entity': '@modules/entity',
  'preference': '@modules/preference',
  'topic': '@modules/topic'
};

// Counter for statistics
const stats = {
  filesProcessed: 0,
  filesModified: 0,
  importsUpdated: 0,
  errors: 0
};

/**
 * Recursively get all files in a directory
 */
async function getFiles(dir) {
  const subdirs = await readdir(dir);
  const files = await Promise.all(subdirs.map(async (subdir) => {
    const res = path.resolve(dir, subdir);
    return (await stat(res)).isDirectory() ? getFiles(res) : res;
  }));
  return files.flat();
}

/**
 * Check if a file should be processed based on its extension
 */
function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  return FILE_EXTENSIONS.includes(ext);
}

/**
 * Update imports in a file
 */
async function updateImports(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    let updatedContent = content;
    let importUpdates = 0;

    // Apply path mappings
    PATH_MAPPINGS.forEach(mapping => {
      const matches = content.match(mapping.from);
      if (matches) {
        updatedContent = updatedContent.replace(mapping.from, mapping.to);
        importUpdates += matches.length;
      }
    });

    // Apply module-specific mappings
    Object.entries(MODULE_MAPPINGS).forEach(([moduleName, modulePath]) => {
      const moduleRegex = new RegExp(`from ['"]\\.\\.\\/(services|modules)\\/${moduleName}\\/([^'"]+)['"]`, 'g');
      const matches = content.match(moduleRegex);
      if (matches) {
        updatedContent = updatedContent.replace(moduleRegex, `from "${modulePath}/$2"`);
        importUpdates += matches.length;
      }
    });

    // Update file if changes were made
    if (updatedContent !== content) {
      if (!DRY_RUN) {
        await writeFile(filePath, updatedContent, 'utf8');
      }
      stats.filesModified++;
      stats.importsUpdated += importUpdates;
      
      if (VERBOSE) {
        console.log(`Updated ${importUpdates} imports in ${filePath}`);
      }
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    stats.errors++;
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log(`Starting import path migration ${DRY_RUN ? '(DRY RUN)' : ''}`);
  
  try {
    // Get all files in src and tests directories
    const srcFiles = await getFiles(SRC_DIR);
    const testFiles = await getFiles(TEST_DIR);
    const allFiles = [...srcFiles, ...testFiles];
    
    // Filter files by extension
    const filesToProcess = allFiles.filter(shouldProcessFile);
    
    console.log(`Found ${filesToProcess.length} files to process`);
    
    // Process each file
    for (const file of filesToProcess) {
      stats.filesProcessed++;
      await updateImports(file);
      
      // Show progress
      if (stats.filesProcessed % 10 === 0 && !VERBOSE) {
        process.stdout.write(`.`);
      }
    }
    
    console.log('\n\nMigration completed!');
    console.log(`Files processed: ${stats.filesProcessed}`);
    console.log(`Files modified: ${stats.filesModified}`);
    console.log(`Imports updated: ${stats.importsUpdated}`);
    
    if (stats.errors > 0) {
      console.log(`Errors encountered: ${stats.errors}`);
    }
    
    if (DRY_RUN) {
      console.log('\nThis was a dry run. No files were actually modified.');
      console.log('Run without --dry-run to apply changes.');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
