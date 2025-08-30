/**
 * Voice MVP Status Checker
 * 
 * This script checks the status of the Voice MVP Checklist and generates
 * a report on the progress towards the MVP release.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
  // Path to the MVP checklist
  checklistPath: path.join(__dirname, '..', 'docs', 'VOICE_MVP_CHECKLIST.md'),
  
  // Path for the status report
  reportPath: path.join(__dirname, '..', 'reports', 'voice-mvp-status-report.md'),
  
  // Path to the open source roadmap
  roadmapPath: path.join(__dirname, '..', 'prompts', 'OPEN_SOURCE_ROADMAP.md'),
  
  // Components to check
  components: [
    {
      name: 'Audio Processor',
      paths: [
        path.join(__dirname, '..', 'src', 'utils', 'audio-processor.js'),
        path.join(__dirname, '..', 'src', 'controllers', 'audio-processor.controller.js'),
        path.join(__dirname, '..', 'tests', 'utils', 'audio-processor.test.js')
      ]
    },
    {
      name: 'Language Detector',
      paths: [
        path.join(__dirname, '..', 'src', 'utils', 'language-detector.js'),
        path.join(__dirname, '..', 'src', 'controllers', 'language-detector.controller.js'),
        path.join(__dirname, '..', 'tests', 'utils', 'language-detector.test.js')
      ]
    },
    {
      name: 'Model Manager',
      paths: [
        path.join(__dirname, '..', 'src', 'utils', 'model-manager.js'),
        path.join(__dirname, '..', 'src', 'controllers', 'model-manager.controller.js'),
        path.join(__dirname, '..', 'tests', 'utils', 'model-manager.test.js')
      ]
    },
    {
      name: 'Voice Recognition',
      paths: [
        path.join(__dirname, '..', 'src', 'services', 'voice-recognition.service.js'),
        path.join(__dirname, '..', 'src', 'controllers', 'voice-recognition.controller.js'),
        path.join(__dirname, '..', 'tests', 'services', 'voice-recognition.test.js')
      ]
    }
  ]
};

/**
 * Main function to check MVP status
 */
async function checkMvpStatus() {
  console.log('Voice MVP Status Checker');
  console.log('=======================');
  
  // Create reports directory if it doesn't exist
  const reportsDir = path.dirname(config.reportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  // Parse the checklist
  const checklistData = parseChecklist();
  
  // Check component implementation status
  const componentStatus = checkComponentStatus();
  
  // Check test coverage
  const testCoverage = checkTestCoverage();
  
  // Check documentation status
  const documentationStatus = checkDocumentationStatus();
  
  // Check roadmap progress
  const roadmapProgress = checkRoadmapProgress();
  
  // Generate report
  generateReport(checklistData, componentStatus, testCoverage, documentationStatus, roadmapProgress);
  
  console.log(`Report generated at: ${config.reportPath}`);
  
  // Print summary to console
  printSummary(checklistData, roadmapProgress);
}

/**
 * Parse the MVP checklist
 */
function parseChecklist() {
  if (!fs.existsSync(config.checklistPath)) {
    console.error(`Checklist file not found: ${config.checklistPath}`);
    return { categories: {}, totalItems: 0, completedItems: 0 };
  }
  
  const content = fs.readFileSync(config.checklistPath, 'utf8');
  const lines = content.split('\n');
  
  const categories = {};
  let currentCategory = null;
  let totalItems = 0;
  let completedItems = 0;
  
  for (const line of lines) {
    // Check for category headers
    if (line.startsWith('## ') && !line.includes('Completion Tracking')) {
      currentCategory = line.replace('## ', '').trim();
      categories[currentCategory] = { items: [], completed: 0, total: 0 };
    }
    
    // Check for checklist items
    if (line.match(/^- \[[ x]\]/i) && currentCategory) {
      const completed = line.includes('- [x]') || line.includes('- [X]');
      const item = line.replace(/^- \[[ xX]\] /, '').trim();
      
      categories[currentCategory].items.push({ item, completed });
      categories[currentCategory].total++;
      totalItems++;
      
      if (completed) {
        categories[currentCategory].completed++;
        completedItems++;
      }
    }
  }
  
  return { categories, totalItems, completedItems };
}

/**
 * Check component implementation status
 */
function checkComponentStatus() {
  const status = {};
  
  for (const component of config.components) {
    status[component.name] = { implemented: true, missingFiles: [] };
    
    for (const filePath of component.paths) {
      if (!fs.existsSync(filePath)) {
        status[component.name].implemented = false;
        status[component.name].missingFiles.push(path.basename(filePath));
      }
    }
  }
  
  return status;
}

/**
 * Check test coverage
 */
function checkTestCoverage() {
  // This is a simplified check - in a real implementation, you would
  // run the tests with coverage reporting and parse the results
  
  const coveragePath = path.join(__dirname, '..', 'coverage');
  const hasRun = fs.existsSync(coveragePath);
  
  const acceptanceTestPath = path.join(__dirname, '..', 'tests', 'acceptance', 'voice-interface.test.js');
  const hasAcceptanceTests = fs.existsSync(acceptanceTestPath);
  
  return {
    hasRun,
    hasAcceptanceTests,
    summary: hasRun ? 'Coverage reports available' : 'No coverage reports found'
  };
}

/**
 * Check documentation status
 */
function checkDocumentationStatus() {
  const docPaths = [
    { name: 'Voice Features', path: path.join(__dirname, '..', 'docs', 'VOICE_FEATURES.md') },
    { name: 'Testing Plan', path: path.join(__dirname, '..', 'docs', 'VOICE_TESTING_PLAN.md') },
    { name: 'MVP Checklist', path: path.join(__dirname, '..', 'docs', 'VOICE_MVP_CHECKLIST.md') }
  ];
  
  const status = {};
  
  for (const doc of docPaths) {
    if (fs.existsSync(doc.path)) {
      const content = fs.readFileSync(doc.path, 'utf8');
      status[doc.name] = {
        exists: true,
        size: content.length,
        lastModified: fs.statSync(doc.path).mtime
      };
    } else {
      status[doc.name] = { exists: false };
    }
  }
  
  return status;
}

/**
 * Check roadmap progress
 */
function checkRoadmapProgress() {
  if (!fs.existsSync(config.roadmapPath)) {
    console.error(`Roadmap file not found: ${config.roadmapPath}`);
    return { phase: 'Unknown', progress: 0 };
  }
  
  const content = fs.readFileSync(config.roadmapPath, 'utf8');
  const lines = content.split('\n');
  
  // Find the voice interface phase
  const voicePhaseMatch = content.match(/## Phase \d+: Open-Source Voice Interface \((\d+)-(\d+)%\)/);
  const voicePhase = voicePhaseMatch ? `Phase ${voicePhaseMatch[0].match(/\d+/)[0]}` : 'Unknown';
  
  // Find the MVP release phase
  const mvpPhaseMatch = content.match(/## Phase \d+: MVP Release \((\d+)-(\d+)%\)/);
  const mvpPhase = mvpPhaseMatch ? `Phase ${mvpPhaseMatch[0].match(/\d+/)[0]}` : 'Unknown';
  
  // Count completed tasks in the MVP phase
  let mvpTasks = 0;
  let completedMvpTasks = 0;
  let inMvpPhase = false;
  
  for (const line of lines) {
    if (line.match(/## Phase \d+: MVP Release/)) {
      inMvpPhase = true;
      continue;
    }
    
    if (inMvpPhase && line.startsWith('## Phase')) {
      break;
    }
    
    if (inMvpPhase && line.match(/^- \[[ x]\]/i)) {
      mvpTasks++;
      if (line.includes('- [x]') || line.includes('- [X]')) {
        completedMvpTasks++;
      }
    }
  }
  
  const mvpProgress = mvpTasks > 0 ? Math.round((completedMvpTasks / mvpTasks) * 100) : 0;
  
  return {
    voicePhase,
    mvpPhase,
    mvpTasks,
    completedMvpTasks,
    mvpProgress
  };
}

/**
 * Generate a report of the MVP status
 */
function generateReport(checklistData, componentStatus, testCoverage, documentationStatus, roadmapProgress) {
  const now = new Date();
  
  let reportContent = `# Voice Interface MVP Status Report
Generated on: ${now.toISOString()}

## Summary
- **Checklist Progress**: ${checklistData.completedItems}/${checklistData.totalItems} items completed (${Math.round((checklistData.completedItems / checklistData.totalItems) * 100)}%)
- **Roadmap Phase**: ${roadmapProgress.voicePhase} -> ${roadmapProgress.mvpPhase}
- **MVP Phase Progress**: ${roadmapProgress.completedMvpTasks}/${roadmapProgress.mvpTasks} tasks completed (${roadmapProgress.mvpProgress}%)
- **Components Implemented**: ${Object.values(componentStatus).every(c => c.implemented) ? 'All components implemented' : 'Some components missing'}
- **Acceptance Tests**: ${testCoverage.hasAcceptanceTests ? 'Implemented' : 'Not implemented'}

## Checklist Status by Category
`;

  // Add checklist status
  Object.entries(checklistData.categories).forEach(([category, data]) => {
    const percentage = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
    reportContent += `### ${category}: ${data.completed}/${data.total} (${percentage}%)
| Status | Item |
|--------|------|
`;
    
    data.items.forEach(item => {
      reportContent += `| ${item.completed ? '✅' : '❌'} | ${item.item} |\n`;
    });
    
    reportContent += '\n';
  });

  // Add component status
  reportContent += `## Component Implementation Status
| Component | Status | Missing Files |
|-----------|--------|---------------|
`;

  Object.entries(componentStatus).forEach(([component, status]) => {
    reportContent += `| ${component} | ${status.implemented ? '✅ Implemented' : '❌ Incomplete'} | ${status.missingFiles.join(', ')} |\n`;
  });

  // Add documentation status
  reportContent += `\n## Documentation Status
| Document | Status | Last Modified |
|----------|--------|---------------|
`;

  Object.entries(documentationStatus).forEach(([doc, status]) => {
    if (status.exists) {
      reportContent += `| ${doc} | ✅ Available | ${status.lastModified.toISOString()} |\n`;
    } else {
      reportContent += `| ${doc} | ❌ Missing | N/A |\n`;
    }
  });

  // Add roadmap progress
  reportContent += `\n## Roadmap Progress
- Current Voice Interface Phase: ${roadmapProgress.voicePhase}
- MVP Release Phase: ${roadmapProgress.mvpPhase}
- MVP Tasks Completed: ${roadmapProgress.completedMvpTasks}/${roadmapProgress.mvpTasks} (${roadmapProgress.mvpProgress}%)

## Next Steps
`;

  // Add recommendations based on checklist status
  const incompleteCategories = Object.entries(checklistData.categories)
    .filter(([_, data]) => data.completed < data.total)
    .sort((a, b) => (a[1].completed / a[1].total) - (b[1].completed / b[1].total));
  
  if (incompleteCategories.length > 0) {
    reportContent += "### Recommended Focus Areas (Prioritized)\n";
    
    incompleteCategories.forEach(([category, data]) => {
      const percentage = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
      reportContent += `1. **${category}** (${percentage}% complete)\n`;
      
      // List up to 3 incomplete items
      const incompleteItems = data.items.filter(item => !item.completed).slice(0, 3);
      incompleteItems.forEach(item => {
        reportContent += `   - ${item.item}\n`;
      });
      
      if (data.items.filter(item => !item.completed).length > 3) {
        reportContent += `   - Plus ${data.items.filter(item => !item.completed).length - 3} more items\n`;
      }
    });
  } else {
    reportContent += "All checklist items are complete! The Voice Interface is ready for MVP release.\n";
  }

  // Write report to file
  fs.writeFileSync(config.reportPath, reportContent);
}

/**
 * Print a summary to the console
 */
function printSummary(checklistData, roadmapProgress) {
  console.log('\nVoice MVP Status Summary:');
  console.log('-------------------------');
  console.log(`Checklist Progress: ${checklistData.completedItems}/${checklistData.totalItems} items completed (${Math.round((checklistData.completedItems / checklistData.totalItems) * 100)}%)`);
  console.log(`Roadmap Phase: ${roadmapProgress.voicePhase} -> ${roadmapProgress.mvpPhase}`);
  console.log(`MVP Phase Progress: ${roadmapProgress.completedMvpTasks}/${roadmapProgress.mvpTasks} tasks completed (${roadmapProgress.mvpProgress}%)`);
  
  console.log('\nCategory Progress:');
  Object.entries(checklistData.categories).forEach(([category, data]) => {
    const percentage = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
    console.log(`- ${category}: ${data.completed}/${data.total} (${percentage}%)`);
  });
  
  console.log('\nFor detailed information, see the report at:');
  console.log(config.reportPath);
}

// Run the script
checkMvpStatus().catch(error => {
  console.error('Failed to check MVP status:', error);
  process.exit(1);
});
