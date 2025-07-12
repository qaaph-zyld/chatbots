/**
 * File Migration Script
 * 
 * This script handles the migration of files from the old directory structure
 * to the new structure following the dev_framework standards.
 * 
 * Usage:
 *   node scripts/migrate-files.js [--dry-run] [--verbose]
 * 
 * Options:
 *   --dry-run  Show what would be migrated without actually moving files
 *   --verbose  Show detailed information about each file being migrated
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const mkdirp = require('mkdirp');

// Promisify fs functions
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const copyFile = promisify(fs.copyFile);
const exists = promisify(fs.exists);

// Configuration
const ROOT_DIR = path.resolve(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');
const REMOVE_ORIGINALS = process.argv.includes('--remove-originals');

// Migration mappings
const MIGRATIONS = [
  // Config files
  { from: 'src/config', to: 'configs', pattern: /.*/ },
  
  // Domain models
  { from: 'src/models', to: 'src/domain', pattern: /.*/ },
  
  // Services to modules
  { from: 'src/services/analytics', to: 'src/modules/analytics', pattern: /.*/ },
  { from: 'src/services/chatbot', to: 'src/modules/chatbot', pattern: /.*/ },
  { from: 'src/services/conversation', to: 'src/modules/conversation', pattern: /.*/ },
  { from: 'src/services/entity', to: 'src/modules/entity', pattern: /.*/ },
  { from: 'src/services/preference', to: 'src/modules/preference', pattern: /.*/ },
  { from: 'src/services/topic', to: 'src/modules/topic', pattern: /.*/ },
  
  // Tests
  { from: 'src/tests/unit', to: 'tests/unit', pattern: /.*/ },
  { from: 'src/tests/integration', to: 'tests/integration', pattern: /.*/ },
  { from: 'src/tests/e2e', to: 'tests/e2e', pattern: /.*/ },
  { from: 'src/tests/setup', to: 'tests/unit/setup', pattern: /.*/ },
  { from: 'src/tests/scripts', to: 'tests/unit', pattern: /.*/ },
  
  // Add more mappings as needed
];

// Statistics
const stats = {
  directoriesCreated: 0,
  filesCopied: 0,
  filesSkipped: 0,
  errors: 0
};

/**
 * Ensure a directory exists
 */
async function ensureDirectoryExists(dirPath) {
  const fullPath = path.join(ROOT_DIR, dirPath);
  
  if (DRY_RUN) {
    if (VERBOSE) {
      console.log(`[DRY RUN] Would create directory: ${dirPath}`);
    }
    return;
  }
  
  try {
    await mkdirp(fullPath);
    stats.directoriesCreated++;
    if (VERBOSE) {
      console.log(`Created directory: ${dirPath}`);
    }
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error.message);
    stats.errors++;
  }
}

/**
 * Get all files in a directory recursively
 */
async function getFilesRecursively(dir) {
  const fullDir = path.join(ROOT_DIR, dir);
  
  if (!(await exists(fullDir))) {
    if (VERBOSE) {
      console.log(`Directory does not exist: ${dir}`);
    }
    return [];
  }
  
  try {
    const entries = await readdir(fullDir);
    const files = await Promise.all(entries.map(async (entry) => {
      const fullPath = path.join(fullDir, entry);
      const stats = await stat(fullPath);
      const relativePath = path.join(dir, entry);
      
      if (stats.isDirectory()) {
        return getFilesRecursively(relativePath);
      } else {
        return relativePath;
      }
    }));
    
    return files.flat();
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
    stats.errors++;
    return [];
  }
}

/**
 * Copy a file from source to destination
 */
async function copyFileWithPath(source, destination) {
  const sourceFullPath = path.join(ROOT_DIR, source);
  const destFullPath = path.join(ROOT_DIR, destination);
  const destDir = path.dirname(destFullPath);
  
  if (DRY_RUN) {
    if (VERBOSE) {
      console.log(`[DRY RUN] Would copy: ${source} -> ${destination}`);
    }
    return;
  }
  
  try {
    // Ensure destination directory exists
    await mkdirp(destDir);
    
    // Copy the file
    await copyFile(sourceFullPath, destFullPath);
    stats.filesCopied++;
    
    if (VERBOSE) {
      console.log(`Copied: ${source} -> ${destination}`);
    }
    
    // Remove original if requested
    if (REMOVE_ORIGINALS) {
      try {
        fs.unlinkSync(sourceFullPath);
        if (VERBOSE) {
          console.log(`Removed original: ${source}`);
        }
      } catch (error) {
        console.error(`Error removing original file ${source}:`, error.message);
        stats.errors++;
      }
    }
  } catch (error) {
    console.error(`Error copying ${source} to ${destination}:`, error.message);
    stats.errors++;
  }
}

/**
 * Process a migration mapping
 */
async function processMigration(migration) {
  const { from, to, pattern } = migration;
  
  // Check if source directory exists
  const sourceFullPath = path.join(ROOT_DIR, from);
  if (!(await exists(sourceFullPath))) {
    console.log(`Source directory does not exist: ${from}`);
    stats.filesSkipped += 1;
    return;
  }
  
  // Create destination directory
  await ensureDirectoryExists(to);
  
  // Get all files in source directory
  const files = await getFilesRecursively(from);
  
  // Filter files based on pattern
  const filesToMigrate = files.filter(file => {
    const fileName = path.basename(file);
    return pattern.test(fileName);
  });
  
  console.log(`Found ${filesToMigrate.length} files to migrate from ${from} to ${to}`);
  
  // Copy each file
  for (const file of filesToMigrate) {
    const relativePath = path.relative(from, file);
    const destination = path.join(to, relativePath);
    await copyFileWithPath(file, destination);
  }
}

/**
 * Main function
 */
async function main() {
  console.log(`Starting file migration ${DRY_RUN ? '(DRY RUN)' : ''}`);
  
  try {
    // Create all necessary directories first
    await Promise.all([
      ensureDirectoryExists('configs'),
      ensureDirectoryExists('configs/webpack'),
      ensureDirectoryExists('configs/jest'),
      ensureDirectoryExists('configs/eslint'),
      ensureDirectoryExists('src/core'),
      ensureDirectoryExists('src/modules'),
      ensureDirectoryExists('src/api'),
      ensureDirectoryExists('src/data'),
      ensureDirectoryExists('src/domain'),
      ensureDirectoryExists('src/utils'),
      ensureDirectoryExists('tests/unit'),
      ensureDirectoryExists('tests/integration'),
      ensureDirectoryExists('tests/e2e'),
      ensureDirectoryExists('.github/workflows'),
      ensureDirectoryExists('docs')
    ]);
    
    // Process each migration mapping
    for (const migration of MIGRATIONS) {
      await processMigration(migration);
    }
    
    console.log('\nMigration completed!');
    console.log(`Directories created: ${stats.directoriesCreated}`);
    console.log(`Files copied: ${stats.filesCopied}`);
    console.log(`Files skipped: ${stats.filesSkipped}`);
    
    if (stats.errors > 0) {
      console.log(`Errors encountered: ${stats.errors}`);
    }
    
    if (DRY_RUN) {
      console.log('\nThis was a dry run. No files were actually migrated.');
      console.log('Run without --dry-run to apply changes.');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
