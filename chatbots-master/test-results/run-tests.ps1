# PowerShell script to run tests and log results
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logFile = "C:\Users\ajelacn\Documents\chatbots\test-results\test-results-$timestamp.txt"

# Initialize log file
"Test Results - $(Get-Date)" | Out-File -FilePath $logFile

# Function to run tests and log results
function Run-Tests {
    param (
        [string]$TestName,
        [string]$Command
    )
    
    "=== $TestName ===" | Out-File -FilePath $logFile -Append
    "Running: $Command" | Out-File -FilePath $logFile -Append
    
    try {
        $output = Invoke-Expression $Command 2>&1 | Out-String
        $exitCode = $LASTEXITCODE
        
        $output | Out-File -FilePath $logFile -Append
        
        if ($exitCode -eq 0) {
            "✅ $TestName PASSED" | Out-File -FilePath $logFile -Append
            return $true
        } else {
            "❌ $TestName FAILED" | Out-File -FilePath $logFile -Append
            return $false
        }
    } catch {
        "❌ $TestName FAILED with error: $_" | Out-File -FilePath $logFile -Append
        return $false
    }
}

# Run different test suites
$testResults = @()

# Unit Tests
$unitTestsPassed = Run-Tests -TestName "UNIT TESTS" -Command "npx jest --testPathPattern=src/tests/unit"
$testResults += @{Name = "Unit Tests"; Passed = $unitTestsPassed}

# Integration Tests
$integrationTestsPassed = Run-Tests -TestName "INTEGRATION TESTS" -Command "npx jest --testPathPattern=src/tests/integration"
$testResults += @{Name = "Integration Tests"; Passed = $integrationTestsPassed}

# Advanced Context Awareness Tests
$contextTestsPassed = Run-Tests -TestName "ADVANCED CONTEXT AWARENESS TESTS" -Command "npx jest tests/advanced-context-awareness.test.js"
$testResults += @{Name = "Advanced Context Awareness Tests"; Passed = $contextTestsPassed}

# Voice Component Tests
$voiceTestsPassed = Run-Tests -TestName "VOICE COMPONENT TESTS" -Command "npx jest tests/integration/voice-components.test.js"
$testResults += @{Name = "Voice Component Tests"; Passed = $voiceTestsPassed}

# Coverage Report
"=== TEST COVERAGE SUMMARY ===" | Out-File -FilePath $logFile -Append
$coverageOutput = Invoke-Expression "npx jest --coverage --coverageReporters=text-summary" 2>&1 | Out-String
$coverageOutput | Out-File -FilePath $logFile -Append

# Calculate overall pass rate
$passedCount = ($testResults | Where-Object { $_.Passed -eq $true }).Count
$totalCount = $testResults.Count
$passRate = ($passedCount / $totalCount) * 100

# Log summary
$summary = @"

=== OVERALL TEST SUMMARY ===
Passed Test Suites: $passedCount/$totalCount ($([math]::Round($passRate, 2))%)

Test Suites:
$(($testResults | ForEach-Object { "$($_.Name): $(if($_.Passed) {"✅ PASSED"} else {"❌ FAILED"})" }) -join "`n")

Complete test results saved to: $logFile
"@

$summary | Out-File -FilePath $logFile -Append
Write-Host $summary

# Open the log file
Invoke-Item $logFile
