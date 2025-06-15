#!/usr/bin/env node

/**
 * Test script for the Project Cleanup Service
 * This script tests the integration between ProjectMappingSystem and ProjectCleanupAutomation
 */

const path = require('path');
const fs = require('fs').promises;
const ProjectMappingSystem = require('./project_mapping');
const ProjectCleanupAutomation = require('./project_cleanup_system');

// Create a test directory structure if it doesn't exist
async function createTestProject(testDir) {
    console.log(`\n🔧 Creating test project in ${testDir}...`);
    
    try {
        // Create test directory
        await fs.mkdir(testDir, { recursive: true });
        
        // Create source directory with some files
        const srcDir = path.join(testDir, 'src');
        await fs.mkdir(srcDir, { recursive: true });
        
        // Create active files
        await fs.writeFile(path.join(srcDir, 'main.js'), 'console.log("Main application file");');
        await fs.writeFile(path.join(srcDir, 'utils.js'), 'function formatDate() { return new Date().toISOString(); }');
        
        // Create obsolete files (older timestamp)
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 60); // 60 days old
        
        await fs.writeFile(path.join(srcDir, 'deprecated.js'), 'console.log("This file is deprecated");');
        await fs.utimes(path.join(srcDir, 'deprecated.js'), oldDate, oldDate);
        
        // Create empty directory
        const emptyDir = path.join(testDir, 'empty');
        await fs.mkdir(emptyDir, { recursive: true });
        
        // Create test directory with test files
        const testDir2 = path.join(testDir, 'tests');
        await fs.mkdir(testDir2, { recursive: true });
        await fs.writeFile(path.join(testDir2, 'main.test.js'), 'test("main works", () => { expect(true).toBe(true); });');
        
        // Create config directory with config files
        const configDir = path.join(testDir, 'config');
        await fs.mkdir(configDir, { recursive: true });
        await fs.writeFile(path.join(configDir, 'settings.json'), '{"version": "1.0.0"}');
        
        // Create an old config file
        await fs.writeFile(path.join(configDir, 'old-settings.json'), '{"version": "0.5.0"}');
        await fs.utimes(path.join(configDir, 'old-settings.json'), oldDate, oldDate);
        
        console.log('✅ Test project created successfully');
    } catch (error) {
        console.error('❌ Failed to create test project:', error);
        throw error;
    }
}

// Run the test
async function runTest() {
    try {
        console.log('🧪 Starting Project Cleanup Service test...');
        
        // Create test directory
        const testDir = path.resolve('./test-project');
        await createTestProject(testDir);
        
        // Step 1: Run ProjectMappingSystem to analyze the project
        console.log('\n📊 Step 1: Running ProjectMappingSystem...');
        const mappingSystem = new ProjectMappingSystem(testDir);
        await mappingSystem.initialize();
        await mappingSystem.saveMapping();
        console.log('✅ Project mapping completed');
        
        // Step 2: Run ProjectCleanupAutomation with the mapping data
        console.log('\n🧹 Step 2: Running ProjectCleanupAutomation in dry-run mode...');
        const cleanupSystem = new ProjectCleanupAutomation(testDir);
        
        // Load the mapping data
        const mappingPath = path.join(testDir, '.project-mapping.json');
        const mappingData = JSON.parse(await fs.readFile(mappingPath, 'utf8'));
        cleanupSystem.setArchitectureData(mappingData);
        
        // Run the cleanup in dry-run mode
        const results = await cleanupSystem.execute({ dryRun: true, verbose: true });
        console.log('✅ Dry-run cleanup completed');
        
        // Step 3: Generate comprehensive report
        console.log('\n📑 Step 3: Generating comprehensive report...');
        const reportResult = await cleanupSystem.generateComprehensiveReport();
        console.log(`✅ Report generated at: ${reportResult.outputPath}`);
        console.log(`✅ HTML report generated at: ${reportResult.htmlPath}`);
        
        // Step 4: Verify the results
        console.log('\n🔍 Step 4: Verifying results...');
        if (results.removed.length > 0) {
            console.log(`✅ Found ${results.removed.length} obsolete files to remove`);
        } else {
            console.log('⚠️ No obsolete files detected');
        }
        
        console.log('\n🎉 Test completed successfully!');
        console.log(`\nTo view the reports, check:\n- JSON: ${path.join(testDir, 'cleanup-report.json')}\n- HTML: ${path.join(testDir, 'cleanup-report.html')}`);
        
        return {
            success: true,
            testDir,
            results
        };
    } catch (error) {
        console.error('❌ Test failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Run the test if this script is executed directly
if (require.main === module) {
    runTest().catch(console.error);
}

module.exports = { runTest, createTestProject };
