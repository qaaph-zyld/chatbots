const fs = require('fs');
const path = require('path');

class EnhancedReporting {
  constructor() {
    this.reportHistory = [];
    this.trendAnalysis = new Map();
  }

  async generateComprehensiveReport(iteration, coverageData, qualityMetrics, testResults, appliedFixes) {
    const report = {
      timestamp: new Date().toISOString(),
      iteration: iteration,
      summary: {
        overallStatus: this.calculateOverallStatus(coverageData, qualityMetrics, testResults),
        targetsAchieved: this.checkTargetsAchieved(coverageData, qualityMetrics, testResults),
        progressScore: this.calculateProgressScore(coverageData, qualityMetrics, testResults)
      },
      coverage: {
        current: coverageData.total,
        targets: { statements: 80, branches: 80, functions: 80, lines: 80 },
        gaps: this.calculateCoverageGaps(coverageData),
        quality: this.assessCoverageQuality(coverageData)
      },
      testQuality: {
        overall: qualityMetrics.overall,
        breakdown: qualityMetrics.factors,
        trends: await this.calculateQualityTrends(),
        recommendations: qualityMetrics.recommendations
      },
      testExecution: {
        total: testResults.total || 0,
        passed: testResults.passed || 0,
        failed: testResults.failed || 0,
        passRate: testResults.passRate || 0,
        duration: testResults.duration || 0,
        performance: this.analyzeTestPerformance(testResults)
      },
      fixes: {
        applied: appliedFixes.length,
        successful: appliedFixes.filter(f => f.result?.success).length,
        impact: this.calculateFixImpact(appliedFixes),
        categories: this.categorizeFixes(appliedFixes)
      },
      trends: await this.analyzeTrends(),
      nextActions: this.generateNextActions(coverageData, qualityMetrics, testResults),
      detailedAnalysis: await this.generateDetailedAnalysis(coverageData, qualityMetrics, testResults)
    };

    // Save report
    await this.saveReport(report);
    
    // Update history
    this.reportHistory.push(report);
    
    return report;
  }

  calculateOverallStatus(coverageData, qualityMetrics, testResults) {
    const coverageScore = this.calculateCoverageScore(coverageData);
    const qualityScore = qualityMetrics.overall || 0;
    const passRateScore = testResults.passRate || 0;
    
    const overallScore = (coverageScore * 0.4 + qualityScore * 0.3 + passRateScore * 0.3);
    
    if (overallScore >= 90) return 'excellent';
    if (overallScore >= 80) return 'good';
    if (overallScore >= 70) return 'fair';
    if (overallScore >= 60) return 'poor';
    return 'critical';
  }

  checkTargetsAchieved(coverageData, qualityMetrics, testResults) {
    const coverageTargets = {
      statements: coverageData.total?.statements >= 80,
      branches: coverageData.total?.branches >= 80,
      functions: coverageData.total?.functions >= 80,
      lines: coverageData.total?.lines >= 80
    };
    
    const qualityTarget = qualityMetrics.overall >= 80;
    const passRateTarget = testResults.passRate >= 99;
    
    return {
      coverage: Object.values(coverageTargets).every(Boolean),
      quality: qualityTarget,
      passRate: passRateTarget,
      all: Object.values(coverageTargets).every(Boolean) && qualityTarget && passRateTarget
    };
  }

  calculateProgressScore(coverageData, qualityMetrics, testResults) {
    const weights = {
      coverage: 0.4,
      quality: 0.3,
      passRate: 0.3
    };
    
    const scores = {
      coverage: this.calculateCoverageScore(coverageData),
      quality: qualityMetrics.overall || 0,
      passRate: testResults.passRate || 0
    };
    
    return Object.entries(weights).reduce((total, [key, weight]) => {
      return total + (scores[key] * weight);
    }, 0);
  }

  calculateCoverageScore(coverageData) {
    if (!coverageData.total) return 0;
    
    const { statements, branches, functions, lines } = coverageData.total;
    return (statements + branches + functions + lines) / 4;
  }

  calculateCoverageGaps(coverageData) {
    if (!coverageData.total) return {};
    
    const targets = { statements: 80, branches: 80, functions: 80, lines: 80 };
    const gaps = {};
    
    for (const [metric, target] of Object.entries(targets)) {
      const current = coverageData.total[metric] || 0;
      gaps[metric] = Math.max(0, target - current);
    }
    
    return gaps;
  }

  assessCoverageQuality(coverageData) {
    if (!coverageData.files) return { score: 0, issues: [] };
    
    const issues = [];
    let totalScore = 0;
    let fileCount = 0;
    
    for (const [filePath, coverage] of Object.entries(coverageData.files)) {
      fileCount++;
      const fileScore = (coverage.statements + coverage.branches + coverage.functions + coverage.lines) / 4;
      totalScore += fileScore;
      
      if (coverage.statements < 50) {
        issues.push({ file: filePath, issue: 'Low statement coverage', value: coverage.statements });
      }
      if (coverage.branches < 50) {
        issues.push({ file: filePath, issue: 'Low branch coverage', value: coverage.branches });
      }
      if (coverage.functions < 80) {
        issues.push({ file: filePath, issue: 'Low function coverage', value: coverage.functions });
      }
    }
    
    return {
      score: fileCount > 0 ? totalScore / fileCount : 0,
      issues: issues.slice(0, 10), // Top 10 issues
      fileCount: fileCount
    };
  }

  async calculateQualityTrends() {
    const historyPath = path.join(process.cwd(), 'quality-history.json');
    
    if (!fs.existsSync(historyPath)) {
      return { trend: 'no_data', change: 0, history: [] };
    }
    
    try {
      const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      
      if (history.length < 2) {
        return { trend: 'insufficient_data', change: 0, history: history };
      }
      
      const recent = history.slice(-5); // Last 5 entries
      const trend = this.calculateTrendDirection(recent.map(h => h.overall));
      const change = recent[recent.length - 1].overall - recent[0].overall;
      
      return {
        trend: trend,
        change: Math.round(change * 100) / 100,
        history: recent,
        velocity: this.calculateVelocity(recent)
      };
    } catch (error) {
      return { trend: 'error', change: 0, history: [] };
    }
  }

  calculateTrendDirection(values) {
    if (values.length < 2) return 'stable';
    
    let increases = 0;
    let decreases = 0;
    
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i-1]) increases++;
      else if (values[i] < values[i-1]) decreases++;
    }
    
    if (increases > decreases) return 'improving';
    if (decreases > increases) return 'declining';
    return 'stable';
  }

  calculateVelocity(history) {
    if (history.length < 3) return 0;
    
    const changes = [];
    for (let i = 1; i < history.length; i++) {
      changes.push(history[i].overall - history[i-1].overall);
    }
    
    return changes.reduce((sum, change) => sum + change, 0) / changes.length;
  }

  analyzeTestPerformance(testResults) {
    const performance = {
      speed: 'unknown',
      efficiency: 'unknown',
      reliability: 'unknown'
    };
    
    if (testResults.duration) {
      if (testResults.duration < 30000) performance.speed = 'fast';
      else if (testResults.duration < 120000) performance.speed = 'moderate';
      else performance.speed = 'slow';
    }
    
    if (testResults.total && testResults.duration) {
      const testsPerSecond = testResults.total / (testResults.duration / 1000);
      performance.efficiency = testsPerSecond > 10 ? 'high' : testsPerSecond > 5 ? 'moderate' : 'low';
    }
    
    if (testResults.passRate !== undefined) {
      if (testResults.passRate >= 95) performance.reliability = 'high';
      else if (testResults.passRate >= 85) performance.reliability = 'moderate';
      else performance.reliability = 'low';
    }
    
    return performance;
  }

  calculateFixImpact(appliedFixes) {
    if (appliedFixes.length === 0) return 0;
    
    const totalImpact = appliedFixes.reduce((sum, fix) => {
      return sum + (fix.impact || 0) * (fix.result?.success ? 1 : 0);
    }, 0);
    
    return totalImpact / appliedFixes.length;
  }

  categorizeFixes(appliedFixes) {
    const categories = {};
    
    for (const fix of appliedFixes) {
      const category = fix.rootCause || 'unknown';
      if (!categories[category]) {
        categories[category] = { count: 0, successful: 0, impact: 0 };
      }
      
      categories[category].count++;
      if (fix.result?.success) {
        categories[category].successful++;
        categories[category].impact += fix.impact || 0;
      }
    }
    
    return categories;
  }

  async analyzeTrends() {
    const trends = {
      coverage: await this.analyzeCoverageTrend(),
      quality: await this.analyzeQualityTrend(),
      passRate: await this.analyzePassRateTrend(),
      performance: await this.analyzePerformanceTrend()
    };
    
    return trends;
  }

  async analyzeCoverageTrend() {
    // Analyze coverage trends over time
    return { direction: 'stable', velocity: 0, prediction: 'unknown' };
  }

  async analyzeQualityTrend() {
    // Analyze quality trends over time
    return { direction: 'stable', velocity: 0, prediction: 'unknown' };
  }

  async analyzePassRateTrend() {
    // Analyze pass rate trends over time
    return { direction: 'stable', velocity: 0, prediction: 'unknown' };
  }

  async analyzePerformanceTrend() {
    // Analyze performance trends over time
    return { direction: 'stable', velocity: 0, prediction: 'unknown' };
  }

  generateNextActions(coverageData, qualityMetrics, testResults) {
    const actions = [];
    
    // Coverage-based actions
    if (coverageData.total?.statements < 80) {
      actions.push({
        type: 'coverage_improvement',
        priority: 'high',
        description: 'Improve statement coverage',
        target: 80 - (coverageData.total?.statements || 0),
        estimatedEffort: 'medium'
      });
    }
    
    if (coverageData.total?.branches < 80) {
      actions.push({
        type: 'branch_testing',
        priority: 'high',
        description: 'Add branch coverage tests',
        target: 80 - (coverageData.total?.branches || 0),
        estimatedEffort: 'high'
      });
    }
    
    // Quality-based actions
    if (qualityMetrics.overall < 80) {
      actions.push({
        type: 'quality_improvement',
        priority: 'medium',
        description: 'Improve test quality and assertions',
        target: 80 - qualityMetrics.overall,
        estimatedEffort: 'medium'
      });
    }
    
    // Pass rate actions
    if (testResults.passRate < 99) {
      actions.push({
        type: 'fix_failing_tests',
        priority: 'high',
        description: 'Fix failing tests to achieve 99% pass rate',
        target: 99 - testResults.passRate,
        estimatedEffort: 'high'
      });
    }
    
    // Sort by priority and impact
    actions.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
    
    return actions.slice(0, 5); // Top 5 actions
  }

  async generateDetailedAnalysis(coverageData, qualityMetrics, testResults) {
    return {
      coverageAnalysis: this.analyzeCoverageDetails(coverageData),
      qualityAnalysis: this.analyzeQualityDetails(qualityMetrics),
      testAnalysis: this.analyzeTestDetails(testResults),
      recommendations: this.generateDetailedRecommendations(coverageData, qualityMetrics, testResults)
    };
  }

  analyzeCoverageDetails(coverageData) {
    if (!coverageData.files) return {};
    
    const analysis = {
      totalFiles: Object.keys(coverageData.files).length,
      wellCovered: 0,
      poorlyCovered: 0,
      uncovered: 0,
      criticalFiles: []
    };
    
    for (const [filePath, coverage] of Object.entries(coverageData.files)) {
      const avgCoverage = (coverage.statements + coverage.branches + coverage.functions + coverage.lines) / 4;
      
      if (avgCoverage >= 80) analysis.wellCovered++;
      else if (avgCoverage >= 50) analysis.poorlyCovered++;
      else analysis.uncovered++;
      
      if (avgCoverage < 30) {
        analysis.criticalFiles.push({ file: filePath, coverage: avgCoverage });
      }
    }
    
    return analysis;
  }

  analyzeQualityDetails(qualityMetrics) {
    return {
      strengths: this.identifyQualityStrengths(qualityMetrics),
      weaknesses: this.identifyQualityWeaknesses(qualityMetrics),
      improvementAreas: qualityMetrics.recommendations || []
    };
  }

  analyzeTestDetails(testResults) {
    return {
      executionSummary: {
        total: testResults.total || 0,
        passed: testResults.passed || 0,
        failed: testResults.failed || 0,
        skipped: testResults.skipped || 0
      },
      performance: this.analyzeTestPerformance(testResults),
      reliability: this.calculateTestReliability(testResults)
    };
  }

  identifyQualityStrengths(qualityMetrics) {
    const strengths = [];
    const factors = qualityMetrics.factors || {};
    
    if (factors.coverageQuality >= 80) strengths.push('Good coverage quality');
    if (factors.assertionQuality >= 80) strengths.push('Strong assertion quality');
    if (factors.testCompleteness >= 80) strengths.push('Comprehensive test coverage');
    if (factors.edgeCaseCoverage >= 70) strengths.push('Good edge case testing');
    
    return strengths;
  }

  identifyQualityWeaknesses(qualityMetrics) {
    const weaknesses = [];
    const factors = qualityMetrics.factors || {};
    
    if (factors.coverageQuality < 60) weaknesses.push('Poor coverage quality');
    if (factors.assertionQuality < 60) weaknesses.push('Weak assertions');
    if (factors.testCompleteness < 60) weaknesses.push('Incomplete test coverage');
    if (factors.edgeCaseCoverage < 50) weaknesses.push('Insufficient edge case testing');
    
    return weaknesses;
  }

  calculateTestReliability(testResults) {
    if (!testResults.total) return 0;
    
    const passRate = testResults.passRate || 0;
    const consistency = this.calculateConsistency(testResults);
    
    return (passRate * 0.7 + consistency * 0.3);
  }

  calculateConsistency(testResults) {
    // This would analyze consistency across multiple runs
    // For now, return a placeholder
    return testResults.passRate || 0;
  }

  generateDetailedRecommendations(coverageData, qualityMetrics, testResults) {
    const recommendations = [];
    
    // Add specific, actionable recommendations based on analysis
    if (coverageData.total?.branches < 70) {
      recommendations.push({
        category: 'coverage',
        priority: 'high',
        title: 'Improve Branch Coverage',
        description: 'Focus on testing conditional logic and error paths',
        actions: [
          'Identify uncovered branches using coverage reports',
          'Add tests for if/else conditions',
          'Test error handling paths',
          'Add tests for switch/case statements'
        ]
      });
    }
    
    if (qualityMetrics.factors?.assertionQuality < 70) {
      recommendations.push({
        category: 'quality',
        priority: 'medium',
        title: 'Enhance Test Assertions',
        description: 'Replace weak assertions with meaningful validations',
        actions: [
          'Replace toBeDefined() with specific value checks',
          'Use toMatchObject() for object validation',
          'Add toHaveBeenCalledWith() for mock verification',
          'Include error message validation in exception tests'
        ]
      });
    }
    
    return recommendations;
  }

  async saveReport(report) {
    const reportPath = path.join(process.cwd(), 'test-suite-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Also save a human-readable version
    const readableReport = this.generateReadableReport(report);
    const readablePath = path.join(process.cwd(), 'test-suite-report.md');
    fs.writeFileSync(readablePath, readableReport);
  }

  generateReadableReport(report) {
    return `# Test Suite Report - ${report.timestamp}

## Summary
- **Overall Status**: ${report.summary.overallStatus}
- **Progress Score**: ${Math.round(report.summary.progressScore)}%
- **Targets Achieved**: ${report.summary.targetsAchieved.all ? '✅ All' : '❌ Partial'}

## Coverage Metrics
- **Statements**: ${report.coverage.current.statements || 0}% (Target: 80%)
- **Branches**: ${report.coverage.current.branches || 0}% (Target: 80%)
- **Functions**: ${report.coverage.current.functions || 0}% (Target: 80%)
- **Lines**: ${report.coverage.current.lines || 0}% (Target: 80%)

## Test Quality
- **Overall Quality**: ${Math.round(report.testQuality.overall)}%
- **Coverage Quality**: ${Math.round(report.testQuality.breakdown?.coverageQuality || 0)}%
- **Assertion Quality**: ${Math.round(report.testQuality.breakdown?.assertionQuality || 0)}%
- **Test Completeness**: ${Math.round(report.testQuality.breakdown?.testCompleteness || 0)}%

## Test Execution
- **Total Tests**: ${report.testExecution.total}
- **Passed**: ${report.testExecution.passed}
- **Failed**: ${report.testExecution.failed}
- **Pass Rate**: ${Math.round(report.testExecution.passRate)}%

## Applied Fixes
- **Total Applied**: ${report.fixes.applied}
- **Successful**: ${report.fixes.successful}
- **Impact Score**: ${Math.round(report.fixes.impact * 100)}%

## Next Actions
${report.nextActions.map(action => `- **${action.description}** (Priority: ${action.priority})`).join('\n')}

---
Generated on ${report.timestamp}
`;
  }
}

module.exports = EnhancedReporting;
