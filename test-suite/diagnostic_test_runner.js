#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class DiagnosticTestRunner {
    constructor() {
        this.outputFile = path.join(process.cwd(), 'diagnostic-test-output.txt');
        this.logStream = fs.createWriteStream(this.outputFile, { flags: 'w' });
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;
        console.log(message);
        this.logStream.write(logMessage);
    }

    async runSimpleTest() {
        this.log('🔍 Starting diagnostic test run...');
        
        return new Promise((resolve, reject) => {
            const testProcess = spawn('cmd.exe', ['/c', 'npx jest --listTests'], {
                cwd: process.cwd(),
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: false
            });

            let stdout = '';
            let stderr = '';

            testProcess.stdout.on('data', (data) => {
                const text = data.toString();
                stdout += text;
                process.stdout.write(text);
                this.logStream.write(text);
            });

            testProcess.stderr.on('data', (data) => {
                const text = data.toString();
                stderr += text;
                process.stderr.write(text);
                this.logStream.write(text);
            });

            testProcess.on('close', (code) => {
                this.log(`📊 Test listing completed with code: ${code}`);
                resolve({ code, stdout, stderr });
            });

            testProcess.on('error', (error) => {
                this.log(`❌ Test process error: ${error.message}`);
                reject(error);
            });

            // Timeout after 2 minutes
            setTimeout(() => {
                this.log('⏰ Test listing timeout - killing process');
                testProcess.kill('SIGKILL');
                reject(new Error('Test listing timeout'));
            }, 120000);
        });
    }

    async runSingleTest() {
        this.log('🧪 Running single test file...');
        
        // Find a simple test file to run
        const testFiles = this.findTestFiles();
        if (testFiles.length === 0) {
            this.log('❌ No test files found');
            return;
        }

        const testFile = testFiles[0];
        this.log(`🎯 Running test: ${testFile}`);

        return new Promise((resolve, reject) => {
            const testProcess = spawn('cmd.exe', ['/c', `npx jest "${testFile}" --verbose`], {
                cwd: process.cwd(),
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: false
            });

            let stdout = '';
            let stderr = '';

            testProcess.stdout.on('data', (data) => {
                const text = data.toString();
                stdout += text;
                process.stdout.write(text);
                this.logStream.write(text);
            });

            testProcess.stderr.on('data', (data) => {
                const text = data.toString();
                stderr += text;
                process.stderr.write(text);
                this.logStream.write(text);
            });

            testProcess.on('close', (code) => {
                this.log(`📊 Single test completed with code: ${code}`);
                resolve({ code, stdout, stderr });
            });

            testProcess.on('error', (error) => {
                this.log(`❌ Single test error: ${error.message}`);
                reject(error);
            });

            // Timeout after 3 minutes
            setTimeout(() => {
                this.log('⏰ Single test timeout - killing process');
                testProcess.kill('SIGKILL');
                reject(new Error('Single test timeout'));
            }, 180000);
        });
    }

    findTestFiles() {
        const testFiles = [];
        const testDir = path.join(process.cwd(), 'tests');
        
        if (!fs.existsSync(testDir)) {
            return testFiles;
        }

        const scanDirectory = (dir) => {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const itemPath = path.join(dir, item);
                const stat = fs.statSync(itemPath);
                
                if (stat.isDirectory()) {
                    scanDirectory(itemPath);
                } else if (item.endsWith('.test.js')) {
                    testFiles.push(itemPath);
                }
            }
        };

        scanDirectory(testDir);
        return testFiles.slice(0, 5); // Return first 5 test files
    }

    async runDiagnostics() {
        try {
            this.log('🚀 Starting diagnostic test runner...');
            
            // Step 1: List tests
            this.log('📋 Step 1: Listing available tests...');
            const listResult = await this.runSimpleTest();
            
            if (listResult.code === 0) {
                this.log('✅ Test listing successful');
                
                // Step 2: Run a single test
                this.log('📋 Step 2: Running single test...');
                const singleResult = await this.runSingleTest();
                
                if (singleResult.code === 0) {
                    this.log('✅ Single test successful');
                } else {
                    this.log(`⚠️ Single test failed with code: ${singleResult.code}`);
                }
            } else {
                this.log(`⚠️ Test listing failed with code: ${listResult.code}`);
            }

        } catch (error) {
            this.log(`❌ Diagnostic error: ${error.message}`);
        } finally {
            this.logStream.end();
            this.log('🏁 Diagnostic test runner completed');
        }
    }
}

// Run diagnostics
const runner = new DiagnosticTestRunner();
runner.runDiagnostics().catch(console.error);
