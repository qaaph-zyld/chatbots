# Run this script as Administrator

$nodePath = "C:\Program Files\nodejs"
$systemPath = [Environment]::GetEnvironmentVariable('Path', 'Machine')

# Check if Node.js path is already in the system PATH
if ($systemPath -split ';' -notcontains $nodePath) {
    try {
        # Add Node.js to system PATH
        [Environment]::SetEnvironmentVariable(
            'Path',
            $systemPath + ";$nodePath",
            'Machine'
        )
        Write-Host "Successfully added Node.js to system PATH. Please restart your terminal for changes to take effect." -ForegroundColor Green
    }
    catch {
        Write-Host "Error: Failed to update system PATH. Please run this script as Administrator." -ForegroundColor Red
        Write-Host "Error details: $_" -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "Node.js is already in the system PATH." -ForegroundColor Yellow
}

# Verify the change
$updatedPath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
Write-Host "`nCurrent system PATH includes Node.js: $($updatedPath -split ';' -contains $nodePath)" -ForegroundColor Cyan
