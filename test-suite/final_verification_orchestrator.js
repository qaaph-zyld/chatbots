#!/usr/bin/env node

/**
 * Final Verification Orchestrator - 5 Test Runs
 * Runs the test suite 5 times and generates comprehensive final report
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class FinalVerificationOrchestrator {
  constructor() {
    this.projectRoot = process.cwd();
    this.outputFile = 'final-verification-output.txt';
    this.reportFile = 'final-verification-report.json';
    this.totalRuns = 5;
    this.runResults = [];
    
    // Clear previous logs
    if (fs.existsSync(this.outputFile)) {
      fs.unlinkSync(this.outputFile);
    }
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(this.outputFile, logMessage + '\n');
  }

  async runSingleTestSuite(runNumber) {
    this.log(`🔄 === TEST RUN ${runNumber}/${this.totalRuns} ===`);
    
    try {
      const result = await this.executeJestTests();
      const parsedResult = await this.parseTestResults(result, runNumber);
      
      this.runResults.push(parsedResult);
      
      this.log(`📊 Run ${runNumber} Results:`);
      this.log(`   Coverage: ${parsedResult.coverage.statements}% statements`);
      this.log(`   Pass Rate: ${parsedResult.testResults.passRate}%`);
      this.log(`   Tests: ${parsedResult.testResults.passed}/${parsedResult.testResults.total}`);
      this.log(`   Duration: ${parsedResult.duration}ms`);
      
      return parsedResult;
    } catch (error) {
      this.log(`❌ Run ${runNumber} failed: ${error.message}`);
      return {
        runNumber,
        timestamp: new Date().toISOString(),
        success: false,
        error: error.message,
        coverage: { statements: 0, branches: 0, functions: 0, lines: 0 },
        testResults: { total: 0, passed: 0, failed: 0, passRate: 0 },
        duration: 0
      };
    }
  }

  async executeJestTests() {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      // Use node directly to run jest
      const jestPath = path.join(this.projectRoot, 'node_modules', '.bin', 'jest');
      const useNodeModules = fs.existsSync(jestPath);
      
      const command = useNodeModules ? 'node' : 'jest';
      const args = useNodeModules ? 
        [jestPath, '--coverage', '--verbose', '--json', '--outputFile=test-results.json'] :
        ['--coverage', '--verbose', '--json', '--outputFile=test-results.json'];

      const testProcess = spawn(command, args, {
        cwd: this.projectRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      let stdout = '';
      let stderr = '';

      testProcess.stdout.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        process.stdout.write(text);
        fs.appendFileSync(this.outputFile, text);
      });

      testProcess.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        process.stderr.write(text);
        fs.appendFileSync(this.outputFile, text);
      });

      testProcess.on('close', (code) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        resolve({ stdout, stderr, exitCode: code, duration });
      });

      testProcess.on('error', (error) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        reject(new Error(`Test execution error: ${error.message}`));
      });

      // Timeout after 15 minutes
      setTimeout(() => {
        testProcess.kill('SIGTERM');
        reject(new Error('Test execution timeout'));
      }, 15 * 60 * 1000);
    });
  }

  async parseTestResults(result, runNumber) {
    const parsedResult = {
      runNumber,
      timestamp: new Date().toISOString(),
      success: result.exitCode === 0,
      duration: result.duration,
      coverage: { statements: 0, branches: 0, functions: 0, lines: 0 },
      testResults: { total: 0, passed: 0, failed: 0, passRate: 0 },
      exitCode: result.exitCode
    };

    try {
      // Try to read Jest JSON output
      const jsonResultPath = path.join(this.projectRoot, 'test-results.json');
      if (fs.existsSync(jsonResultPath)) {
        const jestResults = JSON.parse(fs.readFileSync(jsonResultPath, 'utf8'));
        
        if (jestResults.numTotalTests) {
          parsedResult.testResults = {
            total: jestResults.numTotalTests,
            passed: jestResults.numPassedTests,
            failed: jestResults.numFailedTests,
            passRate: jestResults.numTotalTests > 0 ? 
              Math.round((jestResults.numPassedTests / jestResults.numTotalTests) * 100) : 0
          };
        }
      }

      // Parse coverage from stdout
      const coverageMatch = result.stdout.match(/Statements\s*:\s*(\d+\.?\d*)%.*?Branches\s*:\s*(\d+\.?\d*)%.*?Functions\s*:\s*(\d+\.?\d*)%.*?Lines\s*:\s*(\d+\.?\d*)%/s);
      if (coverageMatch) {
        parsedResult.coverage = {
          statements: parseFloat(coverageMatch[1]),
          branches: parseFloat(coverageMatch[2]),
          functions: parseFloat(coverageMatch[3]),
          lines: parseFloat(coverageMatch[4])
        };
      }

      // Fallback: parse from single-run-report.json if it exists
      const singleRunReport = path.join(this.projectRoot, 'single-run-report.json');
      if (fs.existsSync(singleRunReport)) {
        const reportData = JSON.parse(fs.readFileSync(singleRunReport, 'utf8'));
        if (parsedResult.coverage.statements === 0) {
          parsedResult.coverage = reportData.coverage;
        }
        if (parsedResult.testResults.total === 0) {
          parsedResult.testResults = reportData.testResults;
        }
      }

    } catch (error) {
      this.log(`⚠️ Failed to parse test results for run ${runNumber}: ${error.message}`);
    }

    return parsedResult;
  }

  calculateStatistics() {
    if (this.runResults.length === 0) {
      return null;
    }

    const successfulRuns = this.runResults.filter(r => r.success);
    const coverageValues = this.runResults.map(r => r.coverage.statements).filter(v => v > 0);
    const passRateValues = this.runResults.map(r => r.testResults.passRate).filter(v => v >= 0);
    const durationValues = this.runResults.map(r => r.duration).filter(v => v > 0);

    const calculateStats = (values) => {
      if (values.length === 0) return { min: 0, max: 0, avg: 0, median: 0 };
      
      const sorted = values.sort((a, b) => a - b);
      const sum = values.reduce((a, b) => a + b, 0);
      
      return {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: Math.round((sum / values.length) * 100) / 100,
        median: sorted.length % 2 === 0 ? 
          (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 :
          sorted[Math.floor(sorted.length / 2)]
      };
    };

    return {
      totalRuns: this.runResults.length,
      successfulRuns: successfulRuns.length,
      failedRuns: this.runResults.length - successfulRuns.length,
      successRate: Math.round((successfulRuns.length / this.runResults.length) * 100),
      coverage: calculateStats(coverageValues),
      passRate: calculateStats(passRateValues),
      duration: calculateStats(durationValues)
    };
  }

  async generateFinalReport() {
    const statistics = this.calculateStatistics();
    const finalResult = this.runResults[this.runResults.length - 1];
    
    const finalReport = {
      summary: {
        timestamp: new Date().toISOString(),
        totalRuns: this.totalRuns,
        completedRuns: this.runResults.length,
        statistics,
        finalResult,
        targetsAchieved: this.checkTargetsAchieved(statistics),
        overallAssessment: this.generateAssessment(statistics)
      },
      runs: this.runResults,
      recommendations: this.generateRecommendations(statistics),
      nextSteps: this.generateNextSteps(statistics)
    };

    fs.writeFileSync(this.reportFile, JSON.stringify(finalReport, null, 2));
    
    this.log('📄 Final Verification Report Generated:');
    this.log(`   File: ${this.reportFile}`);
    this.log(`   Completed Runs: ${finalReport.summary.completedRuns}/${this.totalRuns}`);
    this.log(`   Success Rate: ${statistics ? statistics.successRate : 0}%`);
    
    if (statistics) {
      this.log(`   Coverage Range: ${statistics.coverage.min}% - ${statistics.coverage.max}%`);
      this.log(`   Pass Rate Range: ${statistics.passRate.min}% - ${statistics.passRate.max}%`);
      this.log(`   Targets Achieved: ${finalReport.summary.targetsAchieved ? 'YES' : 'NO'}`);
    }

    return finalReport;
  }

  checkTargetsAchieved(statistics) {
    if (!statistics) return false;
    
    const targetCoverage = 80;
    const targetPassRate = 99;
    
    return statistics.coverage.avg >= targetCoverage && 
           statistics.passRate.avg >= targetPassRate;
  }

  generateAssessment(statistics) {
    if (!statistics) {
      return 'CRITICAL: No successful test runs completed';
    }

    if (statistics.successRate < 50) {
      return 'CRITICAL: Test infrastructure unstable';
    }

    if (statistics.coverage.avg >= 80 && statistics.passRate.avg >= 99) {
      return 'EXCELLENT: All targets achieved consistently';
    }

    if (statistics.coverage.avg >= 60 && statistics.passRate.avg >= 80) {
      return 'GOOD: Significant progress made, minor improvements needed';
    }

    if (statistics.coverage.avg >= 30 && statistics.passRate.avg >= 50) {
      return 'FAIR: Moderate progress, substantial improvements needed';
    }

    return 'POOR: Major improvements required across all metrics';
  }

  generateRecommendations(statistics) {
    const recommendations = [];

    if (!statistics) {
      recommendations.push('Fix test infrastructure and execution environment');
      recommendations.push('Ensure all dependencies are properly installed');
      return recommendations;
    }

    if (statistics.coverage.avg < 80) {
      recommendations.push(`Increase test coverage from ${statistics.coverage.avg}% to 80%`);
      recommendations.push('Generate more unit tests for uncovered functions');
      recommendations.push('Add integration tests for complex workflows');
    }

    if (statistics.passRate.avg < 99) {
      recommendations.push(`Improve test pass rate from ${statistics.passRate.avg}% to 99%`);
      recommendations.push('Fix failing tests and improve test reliability');
      recommendations.push('Implement proper mocking for external dependencies');
    }

    if (statistics.successRate < 100) {
      recommendations.push('Improve test execution stability');
      recommendations.push('Fix timeout and infrastructure issues');
    }

    return recommendations;
  }

  generateNextSteps(statistics) {
    const nextSteps = [];

    if (!statistics || statistics.successRate < 80) {
      nextSteps.push('Priority 1: Stabilize test execution environment');
      nextSteps.push('Priority 2: Fix critical infrastructure issues');
      nextSteps.push('Priority 3: Implement comprehensive error handling');
    } else if (statistics.coverage.avg < 80 || statistics.passRate.avg < 99) {
      nextSteps.push('Priority 1: Continue iterative improvement cycles');
      nextSteps.push('Priority 2: Focus on specific failing test patterns');
      nextSteps.push('Priority 3: Implement advanced test generation strategies');
    } else {
      nextSteps.push('Priority 1: Maintain current test quality standards');
      nextSteps.push('Priority 2: Implement continuous integration monitoring');
      nextSteps.push('Priority 3: Document best practices for future development');
    }

    return nextSteps;
  }

  async run() {
    this.log('🚀 Starting Final Verification - 5 Test Runs');
    this.log(`🎯 Target: 80% coverage, 99% pass rate`);
    
    for (let i = 1; i <= this.totalRuns; i++) {
      await this.runSingleTestSuite(i);
      
      if (i < this.totalRuns) {
        this.log(`⏳ Preparing for next run...`);
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second pause
      }
    }
    
    const finalReport = await this.generateFinalReport();
    
    this.log('🏁 Final Verification Complete');
    this.log(`📊 Overall Assessment: ${finalReport.summary.overallAssessment}`);
    
    return finalReport;
  }
}

// Main execution
async function main() {
  const orchestrator = new FinalVerificationOrchestrator();
  
  try {
    const report = await orchestrator.run();
    process.exit(report.summary.targetsAchieved ? 0 : 1);
  } catch (error) {
    console.error('❌ Final verification failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = FinalVerificationOrchestrator;
