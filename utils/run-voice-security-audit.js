/**
 * Voice Components Security Audit
 * 
 * This script runs a security audit specifically on the voice interface components.
 */

const securityAudit = require('./security-audit');
const path = require('path');
const fs = require('fs');

// Voice-specific configuration
const voiceComponentPaths = [
  'src/utils/audio-processor.js',
  'src/utils/language-detector.js',
  'src/utils/model-manager.js',
  'src/services/voice-recognition.service.js',
  'src/controllers/audio-processor.controller.js',
  'src/controllers/language-detector.controller.js',
  'src/controllers/model-manager.controller.js',
  'src/controllers/voice-recognition.controller.js',
  'src/routes/audio-processor.routes.js',
  'src/routes/language-detector.routes.js',
  'src/routes/model-manager.routes.js',
  'src/routes/voice-recognition.routes.js'
];

// Voice-specific security rules
const voiceSecurityRules = {
  audioFileValidation: {
    pattern: /\.(?:wav|mp3|ogg|flac)$/i,
    description: 'Audio file extension validation without proper content validation',
    severity: 'medium'
  },
  audioBufferOverflow: {
    pattern: /Buffer\.alloc\s*\(\s*(?!.*?{)/,
    description: 'Potential buffer overflow in audio processing',
    severity: 'high'
  },
  unsafeAudioProcessing: {
    pattern: /(?:ffmpeg|sox)\s+.*?-i\s+([^-])/i,
    description: 'Potentially unsafe audio processing command',
    severity: 'high'
  },
  modelValidation: {
    pattern: /downloadModel|loadModel|validateModel/,
    description: 'Model loading without proper validation',
    severity: 'medium'
  },
  privacyIssues: {
    pattern: /(?:record|save|store).*?(?:audio|voice|speech)/i,
    description: 'Potential privacy issues with voice data',
    severity: 'medium'
  }
};

/**
 * Run voice-specific security audit
 */
async function runVoiceSecurityAudit() {
  console.log('Starting voice components security audit...');
  
  // Merge voice-specific rules with general rules
  const originalRules = { ...securityAudit.config.securityRules };
  securityAudit.config.securityRules = {
    ...originalRules,
    ...voiceSecurityRules
  };
  
  // Create results object
  const auditResults = {
    summary: {
      filesScanned: 0,
      issuesFound: 0,
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0,
      lowIssues: 0
    },
    issues: []
  };
  
  // Scan each voice component
  for (const componentPath of voiceComponentPaths) {
    const fullPath = path.resolve(process.cwd(), componentPath);
    
    if (fs.existsSync(fullPath)) {
      console.log(`Scanning ${componentPath}...`);
      
      try {
        const componentResults = await securityAudit.scanFile(fullPath);
        
        // Merge results
        auditResults.summary.filesScanned++;
        auditResults.issues.push(...componentResults.issues);
        
        // Update summary
        auditResults.summary.issuesFound += componentResults.summary.issuesFound;
        auditResults.summary.criticalIssues += componentResults.summary.criticalIssues;
        auditResults.summary.highIssues += componentResults.summary.highIssues;
        auditResults.summary.mediumIssues += componentResults.summary.mediumIssues;
        auditResults.summary.lowIssues += componentResults.summary.lowIssues;
      } catch (error) {
        console.error(`Error scanning ${componentPath}:`, error);
      }
    } else {
      console.warn(`File not found: ${fullPath}`);
    }
  }
  
  // Generate voice-specific report
  const reportPath = path.resolve(process.cwd(), 'voice-security-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));
  
  // Print summary
  console.log('\nVoice Components Security Audit Summary:');
  console.log(`Files scanned: ${auditResults.summary.filesScanned}`);
  console.log(`Issues found: ${auditResults.summary.issuesFound}`);
  console.log(`- Critical: ${auditResults.summary.criticalIssues}`);
  console.log(`- High: ${auditResults.summary.highIssues}`);
  console.log(`- Medium: ${auditResults.summary.mediumIssues}`);
  console.log(`- Low: ${auditResults.summary.lowIssues}`);
  
  console.log(`\nDetailed report saved to: ${reportPath}`);
  
  // Print recommendations
  console.log('\nRecommendations:');
  console.log('1. Ensure all audio file uploads have proper validation');
  console.log('2. Implement secure audio processing with input sanitization');
  console.log('3. Add model integrity verification before loading');
  console.log('4. Implement proper error handling for all voice operations');
  console.log('5. Add privacy controls for voice data handling');
  
  return auditResults;
}

// Run audit if called directly
if (require.main === module) {
  runVoiceSecurityAudit();
}

module.exports = {
  runVoiceSecurityAudit
};
