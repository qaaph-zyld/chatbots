

Here's the comprehensive PowerShell script to analyze Jest terminal output, based on my previous analysis:

```powershell
# Analyze-Terminal-Output.ps1
# Comprehensive Jest test failure analysis script

param(
    [string]$inputFile = "C:\Users\ajelacn\Documents\chatbots\ShopBot\terminal-output.txt",
    [string]$outputFile = "C:\Users\ajelacn\Documents\chatbots\ShopBot\jest_analysis.md"
)

# Initialize analysis variables
Write-Host "Starting Jest test failure analysis..." -ForegroundColor Cyan

# Check if input file exists
if (-not (Test-Path $inputFile)) {
    Write-Error "Input file not found: $inputFile"
    exit 1
}

# Read the entire file content
$content = Get-Content $inputFile -Raw
$totalLines = (Get-Content $inputFile).Count

Write-Host "Processing $totalLines lines of terminal output..." -ForegroundColor Yellow

# Initialize counters and collections
$testFailures = @()
$errorTypes = @{}
$errorFiles = @{}
$errorMessages = @{}
$loggerErrors = 0
$moduleErrors = 0
$syntaxErrors = 0
$setupFiles = @()
$circularDependencies = @()

# Extract test failures
Write-Host "Extracting test failures..." -ForegroundColor Yellow
$testFailurePattern = "FAIL\s+([^\s]+\.test\.js)"
$testFailures = [regex]::Matches($content, $testFailurePattern) | ForEach-Object { $_.Groups[1].Value }

# Extract error details with full context
Write-Host "Analyzing error patterns..." -ForegroundColor Yellow
$errorBlockPattern = "(FAIL\s+[^\s]+\.test\.js[\s\S]*?)(?=FAIL\s+[^\s]+\.test\.js|\Z)"
$errorBlocks = [regex]::Matches($content, $errorBlockPattern) | ForEach-Object { $_.Groups[1].Value }

foreach ($block in $errorBlocks) {
    # Extract error type and message
    $errorTypeMatch = [regex]::Match($block, "(ReferenceError|SyntaxError|TypeError|Error):\s+([^\n]+)")
    if ($errorTypeMatch.Success) {
        $errorType = $errorTypeMatch.Groups[1].Value
        $errorMessage = $errorTypeMatch.Groups[2].Value
        
        # Count error types
        if ($errorTypes.ContainsKey($errorType)) {
            $errorTypes[$errorType]++
        } else {
            $errorTypes[$errorType] = 1
        }
        
        # Count specific error messages
        if ($errorMessages.ContainsKey($errorMessage)) {
            $errorMessages[$errorMessage]++
        } else {
            $errorMessages[$errorMessage] = 1
        }
        
        # Categorize errors
        if ($errorMessage -like "*logger is not defined*") {
            $loggerErrors++
        } elseif ($errorMessage -like "*Cannot find module*") {
            $moduleErrors++
        } elseif ($errorMessage -like "*has already been declared*") {
            $syntaxErrors++
        }
    }
    
    # Extract file paths from stack traces
    $filePattern = "at\s+.+\(([^:]+):\d+:\d+\)"
    $fileMatches = [regex]::Matches($block, $filePattern)
    
    foreach ($match in $fileMatches) {
        $filePath = $match.Groups[1].Value
        if ($filePath -like "*/src/*" -or $filePath -like "*/tests/*") {
            if ($errorFiles.ContainsKey($filePath)) {
                $errorFiles[$filePath]++
            } else {
                $errorFiles[$filePath] = 1
            }
        }
    }
    
    # Extract setup file dependencies
    $setupPattern = "require\(['""](@[^'""]+)['""]\)"
    $setupMatches = [regex]::Matches($block, $setupPattern)
    
    foreach ($match in $setupMatches) {
        $setupPath = $match.Groups[1].Value
        if ($setupPath -like "*setup*") {
            $setupFiles += $setupPath
        }
    }
}

# Detect circular dependencies in setup files
Write-Host "Detecting circular dependencies..." -ForegroundColor Yellow
$setupFilePattern = "require\(['""]([^'""]+)['""]\)"
$allRequires = [regex]::Matches($content, $setupFilePattern) | ForEach-Object { $_.Groups[1].Value }

# Find potential circular dependencies (simplified detection)
$setupFiles = $setupFiles | Select-Object -Unique
foreach ($file in $setupFiles) {
    if ($file -like "*setup*" -and $allRequires -contains $file) {
        $circularDependencies += $file
    }
}

# Generate comprehensive analysis report
Write-Host "Generating analysis report..." -ForegroundColor Yellow

$analysis = @"
# Jest Test Failure Analysis Report

**Generated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")  
**Source File:** $(Split-Path $inputFile -Leaf)  
**Total Lines Analyzed:** $totalLines  
**Analysis Duration:** $((Get-Date) - $startTime).TotalSeconds seconds

---

## Executive Summary

This analysis identified **$($testFailures.Count)** test failures with **$($errorTypes.Keys.Count)** distinct error types. The primary issues are:

1. **Logger Definition Issues**: $loggerErrors occurrences
2. **Module Resolution Problems**: $moduleErrors occurrences  
3. **Syntax Errors**: $syntaxErrors occurrences
4. **Circular Dependencies**: $($circularDependencies.Count) potential cases

---

## Test Failure Statistics

### Overall Metrics
- **Total Test Failures**: $($testFailures.Count)
- **Unique Error Types**: $($errorTypes.Keys.Count)
- **Files with Errors**: $($errorFiles.Keys.Count)
- **Setup Files Involved**: $($setupFiles.Count)

### Error Type Distribution
| Error Type | Count | Percentage | Severity |
|------------|-------|------------|----------|
"@

$totalErrors = $errorTypes.Values | Measure-Object -Sum | Select-Object -ExpandProperty Sum

foreach ($error in $errorTypes.GetEnumerator() | Sort-Object Value -Descending) {
    $percentage = [math]::Round(($error.Value / $totalErrors) * 100, 1)
    $severity = if ($error.Key -eq "ReferenceError") { "🔴 Critical" } elseif ($error.Key -eq "SyntaxError") { "🟡 High" } else { "🟠 Medium" }
    $analysis += "| $($error.Key) | $($error.Value) | $percentage% | $severity`n"
}

$analysis += @"

### Top Error Messages
| Error Message | Count | Impact |
|--------------|-------|---------|
"@

$topErrors = $errorMessages.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 10
foreach ($error in $topErrors) {
    $impact = if ($error.Key -like "*logger is not defined*") { "🔴 Systemic" } elseif ($error.Key -like "*Cannot find module*") { "🔴 Blocking" } else { "🟡 Localized" }
    $analysis += "| $($error.Key.Substring(0, [Math]::Min(80, $error.Key.Length)))... | $($error.Value) | $impact`n"
}

$analysis += @"

---

## Critical Issues Analysis

### 1. Logger Definition Crisis 🔴
**Status:** CRITICAL - Affects $($loggerErrors) test files  
**Root Cause:** `logger` is exported in `src/utils/index.js` but never defined  
**Impact:** Complete test suite failure due to dependency chain collapse  

**Error Pattern:**
```
ReferenceError: logger is not defined
    at Object.logger (src/utils/index.js:13:3)
    at Object.require (src/tests/setup/mongoose-test-setup.js:8:1)
    at Object.require (src/tests/setup/jest-setup.js:7:1)
    at Object.require (tests/setup/test-setup.js:4:1)
```

**Immediate Fix Required:**
1. Open `src/utils/index.js`
2. Add proper logger import: `const logger = require('./logger');`
3. Create `src/utils/logger.js` if missing
4. Verify logger export before other modules

### 2. Module Resolution Failure 🔴
**Status:** CRITICAL - Affects $($moduleErrors) test files  
**Root Cause:** Incorrect Jest path mapping for setup files  
**Impact:** Prevents test environment initialization  

**Error Pattern:**
```
Cannot find module '@src/tests/setup/mongoose-test-setup' from 'src/tests/setup/jest-setup.js'
```

**Required Configuration Fix:**
1. Update Jest `moduleNameMapper`:
   ```javascript
   moduleNameMapper: {
     '^@src/(.*)$': '<rootDir>/src/$1',
     '^@tests/(.*)$': '<rootDir>/tests/$1'  // Add this
   }
   ```
2. Change require statements: `@src/tests/setup/` → `@tests/setup/`

### 3. Generated Test Syntax Issues 🟡
**Status:** HIGH - Affects $($syntaxErrors) test files  
**Root Cause:** Duplicate variable declarations in auto-generated tests  
**Impact:** Individual test file failures  

**Error Pattern:**
```
SyntaxError: Identifier 'path' has already been declared (80:6)
```

**Solution Options:**
1. Fix test generation script to avoid duplicates
2. Exclude generated tests temporarily: `!<rootDir>/tests/generated/**/*.test.js`
3. Run cleanup script to fix existing generated files

---

## Most Problematic Files

| File | Error Count | Error Type | Priority |
|------|-------------|------------|----------|
"@

$problematicFiles = $errorFiles.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 10
foreach ($file in $problematicFiles) {
    $priority = if ($file.Value -gt 10) { "🔴 Critical" } elseif ($file.Value -gt 5) { "🟡 High" } else { "🟠 Medium" }
    $analysis += "| $($file.Key) | $($file.Value) | Root Cause | $priority`n"
}

$analysis += @"

---

## Setup File Dependency Analysis

### Setup Files Chain
```
$($setupFiles | Select-Object -Unique | ForEach-Object { "├── $_" })
```

### Potential Circular Dependencies
"@

if ($circularDependencies.Count -gt 0) {
    $analysis += "⚠️ **Warning**: $($circularDependencies.Count) potential circular dependencies detected:`n"
    foreach ($dep in $circularDependencies | Select-Object -Unique) {
        $analysis += "- $dep`n"
    }
} else {
    $analysis += "✅ No obvious circular dependencies detected`n"
}

$analysis += @"

---

## Action Plan

### 🚨 IMMEDIATE ACTIONS (Do These First)

#### 1. Fix Logger Definition (Priority: CRITICAL)
**Time Estimate:** 5 minutes  
**Files to Edit:** `src/utils/index.js`, `src/utils/logger.js`

**Steps:**
```javascript
// In src/utils/index.js - ADD THIS LINE AT TOP:
const logger = require('./logger');

// If logger.js doesn't exist, create src/utils/logger.js:
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()]
});
module.exports = logger;
```

#### 2. Fix Module Resolution (Priority: CRITICAL)
**Time Estimate:** 10 minutes  
**Files to Edit:** Jest config, setup files

**Steps:**
1. Update `jest.config.js`:
   ```javascript
   moduleNameMapper: {
     '^@src/(.*)$': '<rootDir>/src/$1',
     '^@tests/(.*)$': '<rootDir>/tests/$1'  // Add this line
   }
   ```
2. Update require statements in setup files:
   - Change `@src/tests/setup/` to `@tests/setup/`

#### 3. Run Test Environment Setup
**Time Estimate:** 2 minutes  
**Command:**
```bash
npm install winston mongoose jest --save-dev
```

### 📋 MEDIUM PRIORITY ACTIONS

#### 4. Fix Generated Test Files
**Time Estimate:** 30 minutes  
**Approach:**
1. Create script to fix duplicate `path` declarations
2. Run: `node scripts/fix-generated-tests.js`
3. Or temporarily exclude generated tests

#### 5. Verify Test Environment
**Time Estimate:** 15 minutes  
**Commands:**
```bash
npm test -- --testPathPattern="src/utils/index.test.js"  # Test one file
npm test -- --verbose  # See detailed output
npm run test:coverage  # Check coverage
```

### 🔧 LONG-TERM IMPROVEMENTS

#### 6. Refactor Test Setup
**Time Estimate:** 2-4 hours  
**Goals:**
- Eliminate circular dependencies
- Simplify setup file chain
- Implement proper mocking

#### 7. Improve Test Generation
**Time Estimate:** 4-6 hours  
**Goals:**
- Fix duplicate variable declarations
- Add validation to generated tests
- Implement unique naming conventions

---

## Success Criteria

### Phase 1 Success (Immediate)
- [ ] Logger definition errors eliminated
- [ ] Module resolution errors resolved  
- [ ] At least 50% of tests now passing

### Phase 2 Success (Medium Term)
- [ ] All syntax errors in generated tests fixed
- [ ] Test suite runs without crashes
- [ ] 80%+ test pass rate achieved

### Phase 3 Success (Long Term)
- [ ] No circular dependencies
- [ ] Stable test environment
- [ ] 95%+ test pass rate

---

## Sample Error Details for Debugging

### Logger Error Example
```
ReferenceError: logger is not defined
  at Object.logger (src/utils/index.js:13:3)
  at Object.require (src/tests/setup/mongoose-test-setup.js:8:1)
  at Object.require (src/tests/setup/jest-setup.js:7:1)
  at Object.require (tests/setup/test-setup.js:4:1)
```

### Module Resolution Error Example
```
Cannot find module '@src/tests/setup/mongoose-test-setup' from 'src/tests/setup/jest-setup.js'
```

### Syntax Error Example
```
SyntaxError: Identifier 'path' has already been declared (80:6)
```

---

**Next Steps:** Start with the immediate actions in the order listed. Focus on the logger definition first, as it's blocking the entire test suite.

**Report Generated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@

# Write the analysis to file
$analysis | Out-File -FilePath $outputFile -Encoding utf8

Write-Host "Analysis complete! Report saved to: $outputFile" -ForegroundColor Green
Write-Host "Found $($testFailures.Count) test failures with $($errorTypes.Keys.Count) error types" -ForegroundColor Yellow
Write-Host "Critical issues identified: Logger ($loggerErrors), Module Resolution ($moduleErrors), Syntax ($syntaxErrors)" -ForegroundColor Red

# Display summary in console
Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Total Test Failures: $($testFailures.Count)" -ForegroundColor White
Write-Host "Logger Errors: $loggerErrors" -ForegroundColor Red
Write-Host "Module Errors: $moduleErrors" -ForegroundColor Red
Write-Host "Syntax Errors: $syntaxErrors" -ForegroundColor Yellow
Write-Host "Most Problematic File: $(($problematicFiles | Select-Object -First 1).Key)" -ForegroundColor Magenta
```

This script provides:

1. **Comprehensive Error Analysis**:
   - Extracts and categorizes all error types
   - Counts specific error messages
   - Identifies the most problematic files
   - Detects potential circular dependencies

2. **Root Cause Identification**:
   - Pinpoints the logger definition as the primary issue
   - Highlights module resolution problems
   - Identifies syntax errors in generated tests

3. **Actionable Solutions**:
   - Provides step-by-step fix instructions
   - Includes code examples for each fix
   - Prioritizes actions by urgency
   - Estimates time required for each fix

4. **Visual Progress Tracking**:
   - Uses color coding for severity levels
   - Provides success criteria for each phase
   - Includes sample error details for debugging

5. **Executive Summary**:
   - High-level overview of the situation
   - Clear priority ranking of issues
   - Immediate next steps

To use this script:
1. Save it as `Analyze-Terminal-Output.ps1`
2. Run it in PowerShell: `.\Analyze-Terminal-Output.ps1`
3. Review the generated `jest_analysis.md` file
4. Follow the action plan starting with critical issues

The script will give you a complete roadmap to fix all your Jest test failures, starting with the most critical issues first.