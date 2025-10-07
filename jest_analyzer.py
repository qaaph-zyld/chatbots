#!/usr/bin/env python3
"""
Jest Test Failure Analysis Tool
===============================

Comprehensive Python script for analyzing Jest terminal output, categorizing failures,
identifying patterns, and generating actionable reports with automated fixes.

Author: Jest Analysis Framework
Version: 2.0.0
Python: 3.8+
"""

import argparse
import json
import logging
import re
import sys
import traceback
from collections import defaultdict, Counter
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import subprocess


class JestAnalyzer:
    """
    Main analyzer class implementing comprehensive Jest test failure analysis
    with modular design, robust error handling, and automated reporting.
    """
    
    VERSION = "2.0.0"
    
    def __init__(self, log_level: str = "INFO", auto_fix: bool = False):
        """Initialize analyzer with configuration and logging."""
        self.start_time = datetime.now()
        self.auto_fix = auto_fix
        
        # Configure logging
        self._setup_logging(log_level)
        
        # Error pattern definitions
        self.patterns = {
            'test_failure': r'FAIL\s+([^\s]+\.test\.js)',
            'error_block': r'(FAIL\s+[^\s]+\.test\.js[\s\S]*?)(?=(?:FAIL\s+[^\s]+\.test\.js|\s*(?:Test Suites:|npm ERR!|$)))',
            'error_type': r'(ReferenceError|SyntaxError|TypeError|Error|ImportError|ModuleNotFoundError):\s*([^\r\n]+)',
            'stack_trace': r'at\s+(?:.*?\s+\()?([^:\s]+):(\d+):(\d+)\)?',
            'module_require': r'require\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)',
            'import_statement': r'import\s+.*?\s+from\s+[\'"]([^\'"]+)[\'"]',
            'missing_module': r'Cannot find module [\'"]([^\'"]+)[\'"]'
        }
        
        # Error categorization rules
        self.error_categories = {
            'Logger': [
                r'logger is not defined',
                r'logger.*undefined'
            ],
            'Module': [
                r'Cannot find module',
                r'Module not found',
                r'ENOENT.*require'
            ],
            'Syntax': [
                r'has already been declared',
                r'Unexpected token',
                r'Unexpected identifier'
            ],
            'Import': [
                r'Cannot resolve module',
                r'Failed to resolve import'
            ],
            'Circular': [
                r'Circular dependency',
                r'cyclic dependency'
            ]
        }
        
        # Initialize analysis data structure
        self.analysis_data = {
            'summary': {
                'total_lines': 0,
                'test_failures': [],
                'processing_time': None,
                'files_analyzed': []
            },
            'errors': {
                'by_type': Counter(),
                'by_message': Counter(),
                'by_file': Counter(),
                'by_category': {
                    'Logger': 0,
                    'Module': 0,
                    'Syntax': 0,
                    'Import': 0,
                    'Circular': 0,
                    'Other': 0
                }
            },
            'dependencies': {
                'setup_files': [],
                'circular_deps': [],
                'missing_modules': []
            },
            'recommendations': [],
            'auto_fix_results': []
        }
    
    def _setup_logging(self, level: str) -> None:
        """Configure logging with appropriate level and formatting."""
        log_levels = {
            'DEBUG': logging.DEBUG,
            'INFO': logging.INFO,
            'WARNING': logging.WARNING,
            'ERROR': logging.ERROR,
            'CRITICAL': logging.CRITICAL
        }
        
        logging.basicConfig(
            level=log_levels.get(level.upper(), logging.INFO),
            format='[%(asctime)s] [%(levelname)s] %(message)s',
            datefmt='%H:%M:%S'
        )
        self.logger = logging.getLogger(__name__)
    
    def read_input_file(self, file_path: str) -> Optional[str]:
        """
        Safely read input file with encoding detection and error handling.
        
        Args:
            file_path: Path to the Jest terminal output file
            
        Returns:
            File content as string or None if failed
        """
        try:
            input_path = Path(file_path)
            if not input_path.exists():
                self.logger.error(f"Input file does not exist: {file_path}")
                return None
            
            # Try different encodings
            encodings = ['utf-8', 'utf-8-sig', 'latin1', 'cp1252']
            
            for encoding in encodings:
                try:
                    content = input_path.read_text(encoding=encoding)
                    lines = len(content.splitlines())
                    self.analysis_data['summary']['total_lines'] = lines
                    self.logger.info(f"Successfully read {lines} lines with {encoding} encoding")
                    return content
                except UnicodeDecodeError:
                    continue
            
            self.logger.error(f"Failed to decode file with any supported encoding")
            return None
            
        except Exception as e:
            self.logger.error(f"Failed to read file: {str(e)}")
            return None
    
    def extract_test_failures(self, content: str) -> None:
        """Extract and catalog test failures with file context."""
        self.logger.info("Extracting test failures...")
        
        matches = re.findall(self.patterns['test_failure'], content, re.IGNORECASE)
        self.analysis_data['summary']['test_failures'] = list(set(matches))
        
        self.logger.info(f"Found {len(self.analysis_data['summary']['test_failures'])} unique test failures")
    
    def analyze_errors(self, content: str) -> None:
        """
        Comprehensive error analysis with categorization and impact assessment.
        
        Args:
            content: Full terminal output content
        """
        self.logger.info("Analyzing error patterns...")
        
        # Extract error blocks
        error_blocks = re.findall(self.patterns['error_block'], content, re.MULTILINE | re.DOTALL)
        
        for block in error_blocks:
            self._process_error_block(block)
        
        self.logger.info(f"Analyzed {len(error_blocks)} error blocks")
    
    def _process_error_block(self, block: str) -> None:
        """Process individual error block for detailed analysis."""
        # Extract error types and messages
        error_matches = re.findall(self.patterns['error_type'], block)
        
        for error_type, error_message in error_matches:
            # Count by type
            self.analysis_data['errors']['by_type'][error_type] += 1
            
            # Count by message (truncated for grouping)
            message_key = error_message[:100] if len(error_message) > 100 else error_message
            self.analysis_data['errors']['by_message'][message_key] += 1
            
            # Categorize error
            category = self._categorize_error(error_message, error_type)
            self.analysis_data['errors']['by_category'][category] += 1
        
        # Extract file paths from stack traces
        stack_matches = re.findall(self.patterns['stack_trace'], block)
        
        for match in stack_matches:
            file_path = match[0] if isinstance(match, tuple) else match
            
            # Filter for project files (exclude node_modules)
            if re.search(r'(src|tests?|__tests__|spec)', file_path) and 'node_modules' not in file_path:
                self.analysis_data['errors']['by_file'][file_path] += 1
    
    def _categorize_error(self, error_message: str, error_type: str) -> str:
        """Intelligent error categorization using pattern matching."""
        for category, patterns in self.error_categories.items():
            for pattern in patterns:
                if re.search(pattern, error_message, re.IGNORECASE):
                    return category
        
        # Fallback categorization based on error type
        type_mapping = {
            'ReferenceError': 'Reference',
            'SyntaxError': 'Syntax',
            'TypeError': 'Type',
            'ModuleNotFoundError': 'Module'
        }
        
        return type_mapping.get(error_type, 'Other')
    
    def analyze_dependencies(self, content: str) -> None:
        """Advanced dependency analysis including circular dependency detection."""
        self.logger.info("Analyzing dependencies...")
        
        # Extract require and import statements
        require_matches = re.findall(self.patterns['module_require'], content)
        import_matches = re.findall(self.patterns['import_statement'], content)
        
        all_dependencies = list(set(require_matches + import_matches))
        
        # Identify setup files
        setup_files = [
            dep for dep in all_dependencies 
            if re.search(r'(setup|config|jest)', dep, re.IGNORECASE) and 'node_modules' not in dep
        ]
        self.analysis_data['dependencies']['setup_files'] = setup_files
        
        # Detect missing modules
        missing_matches = re.findall(self.patterns['missing_module'], content)
        self.analysis_data['dependencies']['missing_modules'] = list(set(missing_matches))
        
        # Simple circular dependency detection
        setup_file_groups = [f for f in setup_files if re.search(r'setup|config', f, re.IGNORECASE)]
        for file in setup_file_groups:
            depends_on_setup = [
                dep for dep in all_dependencies 
                if dep != file and re.search(r'setup|config', dep, re.IGNORECASE)
            ]
            if depends_on_setup:
                self.analysis_data['dependencies']['circular_deps'].append(
                    f"Potential: {file} → {', '.join(depends_on_setup)}"
                )
        
        self.logger.info(
            f"Found {len(setup_files)} setup files, "
            f"{len(self.analysis_data['dependencies']['missing_modules'])} missing modules"
        )
    
    def generate_recommendations(self) -> None:
        """Generate intelligent recommendations based on analysis results."""
        self.logger.info("Generating recommendations...")
        
        recommendations = []
        
        # Logger-specific recommendations
        if self.analysis_data['errors']['by_category']['Logger'] > 0:
            recommendations.append({
                'priority': 'CRITICAL',
                'category': 'Logger Definition',
                'issue': f"Logger is exported but not defined ({self.analysis_data['errors']['by_category']['Logger']} occurrences)",
                'solution': [
                    "Add logger import in src/utils/index.js: const logger = require('./logger');",
                    "Create src/utils/logger.js with proper Winston configuration",
                    "Verify logger export order in module dependencies"
                ],
                'files': ['src/utils/index.js', 'src/utils/logger.js'],
                'estimated_time': '10 minutes',
                'auto_fixable': True
            })
        
        # Module resolution recommendations
        if self.analysis_data['errors']['by_category']['Module'] > 0:
            recommendations.append({
                'priority': 'CRITICAL',
                'category': 'Module Resolution',
                'issue': f"Module path resolution failing ({self.analysis_data['errors']['by_category']['Module']} occurrences)",
                'solution': [
                    "Update Jest moduleNameMapper configuration",
                    "Fix path aliases in require/import statements",
                    "Verify package.json dependencies"
                ],
                'files': ['jest.config.js', 'package.json'],
                'estimated_time': '15 minutes',
                'auto_fixable': True
            })
        
        # Syntax error recommendations
        if self.analysis_data['errors']['by_category']['Syntax'] > 0:
            recommendations.append({
                'priority': 'HIGH',
                'category': 'Syntax Errors',
                'issue': f"Variable redeclaration and syntax issues ({self.analysis_data['errors']['by_category']['Syntax']} occurrences)",
                'solution': [
                    "Review generated test files for duplicate declarations",
                    "Update test generation scripts to avoid conflicts",
                    "Consider excluding problematic generated files temporarily"
                ],
                'files': ['Generated test files', 'Test generation scripts'],
                'estimated_time': '30 minutes',
                'auto_fixable': False
            })
        
        # Missing modules recommendations
        if self.analysis_data['dependencies']['missing_modules']:
            recommendations.append({
                'priority': 'HIGH',
                'category': 'Missing Dependencies',
                'issue': 'Missing module dependencies detected',
                'solution': [
                    f"Install missing dependencies: npm install {' '.join(self.analysis_data['dependencies']['missing_modules'])}",
                    "Verify package.json includes all required dependencies",
                    "Update import paths if modules moved"
                ],
                'files': ['package.json'],
                'estimated_time': '5 minutes',
                'auto_fixable': True
            })
        
        self.analysis_data['recommendations'] = recommendations
        self.logger.info(f"Generated {len(recommendations)} recommendations")
    
    def apply_auto_fixes(self) -> None:
        """Attempt automated fixes for identified issues."""
        if not self.auto_fix:
            self.logger.info("Auto-fix disabled, skipping automatic repairs")
            return
        
        self.logger.info("Attempting automated fixes...")
        
        fix_results = []
        
        for rec in self.analysis_data['recommendations']:
            if rec.get('auto_fixable', False):
                self.logger.info(f"Attempting fix for: {rec['category']}")
                
                try:
                    if rec['category'] == 'Logger Definition':
                        result = self._fix_logger_definition()
                        fix_results.append(result)
                    elif rec['category'] == 'Module Resolution':
                        result = self._fix_module_resolution()
                        fix_results.append(result)
                    elif rec['category'] == 'Missing Dependencies':
                        result = self._fix_missing_dependencies()
                        fix_results.append(result)
                except Exception as e:
                    fix_results.append({
                        'category': rec['category'],
                        'success': False,
                        'error': str(e),
                        'action': 'Failed to apply fix'
                    })
        
        self.analysis_data['auto_fix_results'] = fix_results
        
        success_count = sum(1 for r in fix_results if r.get('success', False))
        self.logger.info(f"Auto-fix completed: {success_count} successful, {len(fix_results) - success_count} failed")
    
    def _fix_logger_definition(self) -> Dict[str, Any]:
        """Automatically fix logger definition issues."""
        utils_index_path = Path('src/utils/index.js')
        logger_path = Path('src/utils/logger.js')
        
        if not utils_index_path.exists():
            return {
                'category': 'Logger Definition',
                'success': False,
                'error': 'src/utils/index.js not found',
                'action': 'Skipped - file not found'
            }
        
        try:
            content = utils_index_path.read_text()
            
            # Check if logger import already exists
            if "require('./logger')" not in content:
                new_content = "const logger = require('./logger');\n" + content
                utils_index_path.write_text(new_content)
            
            # Create logger.js if it doesn't exist
            if not logger_path.exists():
                logger_path.parent.mkdir(parents=True, exist_ok=True)
                logger_content = '''const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

module.exports = logger;
'''
                logger_path.write_text(logger_content)
            
            return {
                'category': 'Logger Definition',
                'success': True,
                'action': 'Added logger import and created logger.js',
                'files_modified': [str(utils_index_path), str(logger_path)]
            }
        except Exception as e:
            return {
                'category': 'Logger Definition',
                'success': False,
                'error': str(e),
                'action': 'Failed to modify files'
            }
    
    def _fix_module_resolution(self) -> Dict[str, Any]:
        """Fix Jest module resolution configuration."""
        jest_config_path = Path('jest.config.js')
        
        if not jest_config_path.exists():
            return {
                'category': 'Module Resolution',
                'success': False,
                'error': 'jest.config.js not found',
                'action': 'Skipped - config file not found'
            }
        
        try:
            content = jest_config_path.read_text()
            
            # Check if moduleNameMapper needs updating
            if 'moduleNameMapper' in content and '@tests/' not in content:
                # Add tests path mapping
                updated_content = re.sub(
                    r'(moduleNameMapper\s*:\s*\{[^}]*)',
                    r"\1,\n    '^@tests/(.*)$': '<rootDir>/tests/$1'",
                    content
                )
                jest_config_path.write_text(updated_content)
                
                return {
                    'category': 'Module Resolution',
                    'success': True,
                    'action': 'Updated Jest moduleNameMapper configuration',
                    'files_modified': [str(jest_config_path)]
                }
            
            return {
                'category': 'Module Resolution',
                'success': True,
                'action': 'No changes needed - configuration already correct'
            }
        except Exception as e:
            return {
                'category': 'Module Resolution',
                'success': False,
                'error': str(e),
                'action': 'Failed to update Jest configuration'
            }
    
    def _fix_missing_dependencies(self) -> Dict[str, Any]:
        """Install missing npm dependencies."""
        if not self.analysis_data['dependencies']['missing_modules']:
            return {
                'category': 'Missing Dependencies',
                'success': True,
                'action': 'No missing dependencies detected'
            }
        
        try:
            modules = ' '.join(self.analysis_data['dependencies']['missing_modules'])
            install_command = f"npm install {modules} --save-dev"
            
            self.logger.info(f"Installing missing dependencies: {modules}")
            
            result = subprocess.run(
                install_command.split(),
                capture_output=True,
                text=True,
                check=True
            )
            
            return {
                'category': 'Missing Dependencies',
                'success': True,
                'action': f'Installed missing dependencies: {modules}',
                'command': install_command,
                'output': result.stdout
            }
        except subprocess.CalledProcessError as e:
            return {
                'category': 'Missing Dependencies',
                'success': False,
                'error': e.stderr,
                'action': 'Failed to install dependencies'
            }
    
    def generate_markdown_report(self, output_path: str) -> bool:
        """Generate comprehensive Markdown analysis report."""
        self.logger.info("Generating Markdown report...")
        
        processing_time = (datetime.now() - self.start_time).total_seconds()
        total_errors = sum(self.analysis_data['errors']['by_type'].values())
        
        try:
            report_content = self._build_markdown_content(processing_time, total_errors)
            
            output_file = Path(output_path)
            output_file.parent.mkdir(parents=True, exist_ok=True)
            output_file.write_text(report_content, encoding='utf-8')
            
            self.logger.info(f"Report saved successfully to: {output_path}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to save report: {str(e)}")
            return False
    
    def _build_markdown_content(self, processing_time: float, total_errors: int) -> str:
        """Build comprehensive Markdown report content."""
        report = f'''# Jest Test Failure Analysis Report

**Generated:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}  
**Version:** {self.VERSION}  
**Processing Time:** {processing_time:.2f} seconds  
**Total Lines Analyzed:** {self.analysis_data['summary']['total_lines']}  

---

## 📊 Executive Summary

This comprehensive analysis identified **{len(self.analysis_data['summary']['test_failures'])}** test failures across **{len(self.analysis_data['errors']['by_type'])}** distinct error types.

### Critical Metrics
- **Total Errors:** {total_errors}
- **Logger Issues:** {self.analysis_data['errors']['by_category']['Logger']}
- **Module Resolution:** {self.analysis_data['errors']['by_category']['Module']}  
- **Syntax Errors:** {self.analysis_data['errors']['by_category']['Syntax']}
- **Files Affected:** {len(self.analysis_data['errors']['by_file'])}

---

## 🔍 Error Analysis

### Error Distribution by Type
| Error Type | Count | Percentage | Severity |
|------------|-------|------------|----------|
'''

        # Add error type table
        if total_errors > 0:
            for error_type, count in self.analysis_data['errors']['by_type'].most_common():
                percentage = round((count / total_errors) * 100, 1)
                severity_map = {
                    'ReferenceError': '🔴 Critical',
                    'SyntaxError': '🟡 High',
                    'TypeError': '🟠 Medium'
                }
                severity = severity_map.get(error_type, '🟢 Low')
                report += f'| {error_type} | {count} | {percentage}% | {severity} |\n'

        report += f'''
### Error Categories Impact
| Category | Count | Impact Level |
|----------|-------|--------------|
| Logger | {self.analysis_data['errors']['by_category']['Logger']} | {"🔴 Systemic" if self.analysis_data['errors']['by_category']['Logger'] > 0 else "✅ None"} |
| Module | {self.analysis_data['errors']['by_category']['Module']} | {"🔴 Blocking" if self.analysis_data['errors']['by_category']['Module'] > 0 else "✅ None"} |
| Syntax | {self.analysis_data['errors']['by_category']['Syntax']} | {"🟡 Localized" if self.analysis_data['errors']['by_category']['Syntax'] > 0 else "✅ None"} |
| Import | {self.analysis_data['errors']['by_category']['Import']} | {"🟠 Moderate" if self.analysis_data['errors']['by_category']['Import'] > 0 else "✅ None"} |

---

## 📁 Most Problematic Files
| File Path | Error Count | Priority |
|-----------|-------------|----------|
'''

        # Add top problematic files
        for file_path, count in Counter(self.analysis_data['errors']['by_file']).most_common(10):
            priority = "🔴 Critical" if count > 10 else "🟡 High" if count > 5 else "🟠 Medium"
            report += f'| {file_path} | {count} | {priority} |\n'

        report += '\n---\n\n## 🔧 Recommended Actions\n'

        # Add recommendations
        priority_order = {'CRITICAL': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4}
        sorted_recommendations = sorted(
            self.analysis_data['recommendations'],
            key=lambda x: priority_order.get(x.get('priority', 'LOW'), 5)
        )

        for rec in sorted_recommendations:
            priority_icons = {
                'CRITICAL': '🚨',
                'HIGH': '⚠️',
                'MEDIUM': '📋',
                'LOW': '💡'
            }
            icon = priority_icons.get(rec.get('priority', 'LOW'), '📋')
            
            report += f'''
### {icon} {rec.get('priority', 'LOW')}: {rec.get('category', 'Unknown')}

**Issue:** {rec.get('issue', 'No description')}  
**Estimated Time:** {rec.get('estimated_time', 'Unknown')}  
**Auto-fixable:** {"✅ Yes" if rec.get('auto_fixable', False) else "❌ No"}

**Solution Steps:**
'''
            for step in rec.get('solution', []):
                report += f'- {step}\n'
            
            if rec.get('files'):
                report += f'\n**Files to modify:** {", ".join(rec["files"])}\n'

        # Add auto-fix results if available
        if self.analysis_data['auto_fix_results']:
            report += '\n---\n\n## 🤖 Auto-Fix Results\n\n| Category | Status | Action |\n|----------|--------|---------|\n'
            
            for result in self.analysis_data['auto_fix_results']:
                status = "✅ Success" if result.get('success', False) else "❌ Failed"
                report += f"| {result.get('category', 'Unknown')} | {status} | {result.get('action', 'No action')} |\n"

        # Add dependency analysis
        deps = self.analysis_data['dependencies']
        if deps['setup_files'] or deps['missing_modules']:
            report += '\n---\n\n## 📦 Dependency Analysis\n\n### Setup Files Detected\n'
            
            for file in deps['setup_files']:
                report += f'- {file}\n'

            if deps['missing_modules']:
                report += '\n### Missing Dependencies\n'
                for module in deps['missing_modules']:
                    report += f'- {module}\n'

            if deps['circular_deps']:
                report += '\n### Potential Circular Dependencies\n'
                for dep in deps['circular_deps']:
                    report += f'- {dep}\n'

        report += f'''
---

## 🎯 Success Criteria

### Phase 1: Critical Issues (Immediate)
- [ ] Logger definition errors eliminated
- [ ] Module resolution issues fixed
- [ ] Test environment initializes successfully
- [ ] At least 50% of tests execute without crashes

### Phase 2: Stabilization (Short-term)
- [ ] All syntax errors resolved
- [ ] Setup file dependencies working correctly
- [ ] 80%+ test pass rate achieved
- [ ] No blocking errors in test output

### Phase 3: Optimization (Medium-term)
- [ ] All circular dependencies resolved
- [ ] Test performance optimized
- [ ] 95%+ test pass rate maintained
- [ ] Comprehensive error handling in place

---

## 📋 Next Steps

1. **Start with CRITICAL priority items** - These block the entire test suite
2. **Apply auto-fixes if available** - Use the `--auto-fix` parameter
3. **Verify each fix** - Run targeted tests after each change
4. **Monitor progress** - Re-run analysis after major fixes

### Quick Commands
```bash
# Test single file after fixes
npm test -- --testPathPattern="src/utils/index.test.js"

# Run with verbose output
npm test -- --verbose

# Check coverage after fixes
npm run test:coverage
```

---

**Analysis completed at:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}  
**Report generated by:** Jest Analysis Framework v{self.VERSION}
'''

        return report
    
    def export_json(self, output_path: str) -> None:
        """Export analysis data as JSON for automation and integration."""
        json_path = Path(output_path).with_suffix('.json')
        
        export_data = {
            'metadata': {
                'version': self.VERSION,
                'generated': datetime.now().isoformat(),
                'processing_time': (datetime.now() - self.start_time).total_seconds()
            },
            'summary': self.analysis_data['summary'],
            'errors': {
                'by_type': dict(self.analysis_data['errors']['by_type']),
                'by_message': dict(self.analysis_data['errors']['by_message']),
                'by_file': dict(self.analysis_data['errors']['by_file']),
                'by_category': self.analysis_data['errors']['by_category']
            },
            'dependencies': self.analysis_data['dependencies'],
            'recommendations': self.analysis_data['recommendations'],
            'auto_fix_results': self.analysis_data['auto_fix_results']
        }
        
        try:
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(export_data, f, indent=2)
            self.logger.info(f"JSON export saved to: {json_path}")
        except Exception as e:
            self.logger.error(f"Failed to export JSON: {str(e)}")
    
    def display_summary(self) -> None:
        """Display concise analysis summary in console."""
        total_errors = sum(self.analysis_data['errors']['by_type'].values())
        critical_issues = (
            self.analysis_data['errors']['by_category']['Logger'] +
            self.analysis_data['errors']['by_category']['Module']
        )
        
        print("\n" + "=" * 80)
        print("JEST ANALYSIS SUMMARY")
        print("=" * 80)
        
        print(f"📊 Test Failures: {len(self.analysis_data['summary']['test_failures'])}")
        print(f"🚨 Total Errors: {total_errors}")
        print(f"🔴 Critical Issues: {critical_issues}")
        print(f"📁 Files Affected: {len(self.analysis_data['errors']['by_file'])}")
        
        processing_time = (datetime.now() - self.start_time).total_seconds()
        print(f"⏱️ Processing Time: {processing_time:.2f}s")
        
        if self.analysis_data['auto_fix_results']:
            successful_fixes = sum(1 for r in self.analysis_data['auto_fix_results'] if r.get('success', False))
            total_fixes = len(self.analysis_data['auto_fix_results'])
            print(f"🤖 Auto-fixes Applied: {successful_fixes}/{total_fixes}")
        
        print("=" * 80)
        
        # Show critical recommendations
        critical_recs = [r for r in self.analysis_data['recommendations'] if r.get('priority') == 'CRITICAL']
        if critical_recs:
            print("\n🚨 CRITICAL ACTIONS REQUIRED:")
            for rec in critical_recs:
                print(f"   • {rec.get('category', 'Unknown')}: {rec.get('issue', 'No description')}")
            print("\nReview the full report for detailed solutions.")
    
    def analyze_file(self, input_file: str, output_file: str, export_json: bool = False) -> bool:
        """
        Main analysis pipeline orchestrating all analysis components.
        
        Args:
            input_file: Path to Jest terminal output file
            output_file: Path for generated analysis report
            export_json: Whether to export JSON data
            
        Returns:
            True if analysis completed successfully, False otherwise
        """
        try:
            self.logger.info(f"Jest Test Failure Analysis v{self.VERSION}")
            self.logger.info("Starting comprehensive analysis pipeline...")
            
            # Step 1: Read input file
            self.logger.info("Step 1: Reading input file...")
            content = self.read_input_file(input_file)
            if not content:
                return False
            
            # Step 2: Extract test failures
            self.logger.info("Step 2: Extracting test failures...")
            self.extract_test_failures(content)
            
            # Step 3: Analyze errors
            self.logger.info("Step 3: Analyzing error patterns...")
            self.analyze_errors(content)
            
            # Step 4: Analyze dependencies
            self.logger.info("Step 4: Analyzing dependencies...")
            self.analyze_dependencies(content)
            
            # Step 5: Generate recommendations
            self.logger.info("Step 5: Generating recommendations...")
            self.generate_recommendations()
            
            # Step 6: Apply auto-fixes if enabled
            if self.auto_fix:
                self.logger.info("Step 6: Attempting auto-fixes...")
                self.apply_auto_fixes()
            
            # Step 7: Generate reports
            self.logger.info("Step 7: Generating reports...")
            report_success = self.generate_markdown_report(output_file)
            
            if export_json:
                self.export_json(output_file)
            
            # Step 8: Display summary
            self.analysis_data['summary']['processing_time'] = (datetime.now() - self.start_time).total_seconds()
            
            if report_success:
                self.logger.info("Analysis pipeline completed successfully!")
                self.display_summary()
                return True
            else:
                self.logger.error("Report generation failed")
                return False
                
        except Exception as e:
            self.logger.error(f"Analysis pipeline failed: {str(e)}")
            self.logger.debug(f"Stack trace: {traceback.format_exc()}")
            return False


def main():
    """Main entry point with command-line argument parsing."""
    parser = argparse.ArgumentParser(
        description='Comprehensive Jest test failure analysis and reporting tool',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  python jest_analyzer.py -i terminal-output.txt -l DEBUG
  python jest_analyzer.py -i output.txt -o custom-report.md --export-json --auto-fix
  python jest_analyzer.py --input "logs/jest-output.txt" --log-level VERBOSE
        '''
    )
    
    parser.add_argument(
        '-i', '--input',
        default='terminal-output.txt',
        help='Path to Jest terminal output file (default: terminal-output.txt)'
    )
    
    parser.add_argument(
        '-o', '--output',
        default=r'C:\Users\ajelacn\Documents\chatbots\ShopBot\terminal_analysis.md',
        help='Output path for analysis report (default: C:\\Users\\ajelacn\\Documents\\chatbots\\ShopBot\\terminal_analysis.md)'
    )
    
    parser.add_argument(
        '-l', '--log-level',
        choices=['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'],
        default='INFO',
        help='Logging level (default: INFO)'
    )
    
    parser.add_argument(
        '--export-json',
        action='store_true',
        help='Export JSON data for automation'
    )
    
    parser.add_argument(
        '--auto-fix',
        action='store_true',
        help='Attempt automatic fixes for identified issues'
    )
    
    parser.add_argument(
        '--version',
        action='version',
        version=f'Jest Analysis Framework v{JestAnalyzer.VERSION}'
    )
    
    args = parser.parse_args()
    
    try:
        # Validate Python version
        if sys.version_info < (3, 8):
            print(f"Error: This script requires Python 3.8 or higher. Current version: {sys.version}")
            sys.exit(1)
        
        # Initialize analyzer
        analyzer = JestAnalyzer(log_level=args.log_level, auto_fix=args.auto_fix)
        
        # Run analysis
        success = analyzer.analyze_file(
            input_file=args.input,
            output_file=args.output,
            export_json=args.export_json
        )
        
        # Exit with appropriate code
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\nAnalysis interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"Fatal error: {str(e)}")
        print(f"Stack trace: {traceback.format_exc()}")
        sys.exit(1)


if __name__ == '__main__':
    main()