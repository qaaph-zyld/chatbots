#!/usr/bin/env node

/**
 * Project Architecture Cleanup System
 * 
 * A comprehensive automated cleanup system that analyzes project architecture
 * and safely removes obsolete components using a four-phase approach:
 * 1. Architecture Analysis
 * 2. Obsolescence Detection
 * 3. Safe Removal Protocol
 * 4. Comprehensive Reporting
 */

const fs = require('fs').promises;
const path = require('path');
const ProjectMappingSystem = require('./project_mapping');
const ProjectCleanupAutomation = require('./project_cleanup_system');

// Parse command line arguments
const args = process.argv.slice(2);
let projectPath = '.';
let executeMode = false;

// Process arguments
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--execute') {
        executeMode = true;
    } else if (!args[i].startsWith('--')) {
        projectPath = args[i];
    }
}

// Resolve project path
projectPath = path.resolve(projectPath);

// Banner
console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║           PROJECT ARCHITECTURE CLEANUP SYSTEM              ║
║                                                            ║
║  Mode: ${executeMode ? 'LIVE EXECUTION' : 'DRY RUN (Safe Mode)'}                              ║
║  Path: ${projectPath.length > 40 ? '...' + projectPath.slice(-37) : projectPath.padEnd(40)}  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);

/**
 * Main execution function
 */
async function main() {
    try {
        // Phase 1: Architecture Analysis using ProjectMappingSystem
        console.log('🔍 Phase 1: Architecture Analysis');
        console.log('--------------------------------');
        
        const mappingSystem = new ProjectMappingSystem(projectPath);
        const architectureData = await mappingSystem.initialize();
        
        console.log(`✅ Project structure mapped: ${architectureData.metadata.totalFiles} files, ${architectureData.metadata.totalDirectories} directories`);
        
        // Phase 2-4: Cleanup using ProjectCleanupAutomation
        const cleanupSystem = new ProjectCleanupAutomation(projectPath);
        
        // Pass the architecture data to the cleanup system
        cleanupSystem.setArchitectureData(architectureData);
        
        // Phase 2: Obsolescence Detection
        console.log('\n🕵️  Phase 2: Obsolescence Detection');
        console.log('--------------------------------');
        
        const obsoleteFiles = await cleanupSystem.detectObsoleteFiles();
        
        console.log(`✅ Detected ${obsoleteFiles.length} obsolete files`);
        
        // Phase 3: Safe Removal Protocol
        console.log('\n🧹 Phase 3: Safe Removal Protocol');
        console.log('--------------------------------');
        
        const cleanupResults = await cleanupSystem.performSafeCleanup(!executeMode); // dry run if not execute mode
        
        console.log(`✅ ${executeMode ? 'Removed' : 'Would remove'} ${cleanupResults.removed.length} files (${formatBytes(cleanupResults.spaceFreed)})`);
        if (cleanupResults.errors.length > 0) {
            console.log(`⚠️  ${cleanupResults.errors.length} errors occurred during cleanup`);
        }
        
        // Phase 4: Comprehensive Reporting
        console.log('\n📊 Phase 4: Comprehensive Reporting');
        console.log('--------------------------------');
        
        const report = await cleanupSystem.generateComprehensiveReport();
        
        console.log(`✅ Report generated: ${report.outputPath}`);
        
        // Summary
        console.log('\n📝 Summary');
        console.log('--------------------------------');
        console.log(`Total files analyzed: ${architectureData.metadata.totalFiles}`);
        console.log(`Obsolete files detected: ${obsoleteFiles.length}`);
        console.log(`Files ${executeMode ? 'removed' : 'that would be removed'}: ${cleanupResults.removed.length}`);
        console.log(`Space ${executeMode ? 'freed' : 'that would be freed'}: ${formatBytes(cleanupResults.spaceFreed)}`);
        console.log(`Errors: ${cleanupResults.errors.length}`);
        
        if (!executeMode) {
            console.log('\n⚠️  This was a DRY RUN. No files were actually removed.');
            console.log('   To perform actual cleanup, run with --execute flag:');
            console.log('   node cleanup-system.js --execute');
        } else {
            console.log('\n✅ Cleanup completed successfully!');
            console.log(`   Backup created at: ${path.join(projectPath, cleanupSystem.config.backupDir)}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Execute main function
main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
