# PowerShell script to run E2E tests and capture output

$outputFile = "test-results\e2e-test-results.txt"

# Create test-results directory if it doesn't exist
if (-not (Test-Path -Path "test-results")) {
    New-Item -ItemType Directory -Path "test-results"
}

# Run the monitoring-alert-integration test
Write-Output "Running monitoring-alert-integration.test.js..." | Tee-Object -FilePath $outputFile -Append
npm test -- tests/e2e/monitoring-alert-integration.test.js | Tee-Object -FilePath $outputFile -Append

# Run user-journey test
Write-Output "\n\nRunning user-journey.test.js..." | Tee-Object -FilePath $outputFile -Append
npm test -- tests/e2e/user-journey.test.js | Tee-Object -FilePath $outputFile -Append

# Run payment-lifecycle test
Write-Output "\n\nRunning payment-lifecycle.test.js..." | Tee-Object -FilePath $outputFile -Append
npm test -- tests/e2e/payment-lifecycle.test.js | Tee-Object -FilePath $outputFile -Append

Write-Output "\n\nAll E2E tests completed. Results saved to $outputFile" | Tee-Object -FilePath $outputFile -Append
