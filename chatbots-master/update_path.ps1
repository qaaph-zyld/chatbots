# Update PATH to include Node.js and npm
$nodePath = "C:\Program Files\nodejs"
$currentPath = [Environment]::GetEnvironmentVariable('PATH', 'User')

# Check if Node.js is already in PATH
if ($currentPath -notlike "*$nodePath*") {
    # Add Node.js to PATH
    [Environment]::SetEnvironmentVariable('PATH', "$nodePath;" + $currentPath, 'User')
    Write-Host "Node.js has been added to your PATH. Please restart your terminal for changes to take effect." -ForegroundColor Green
} else {
    Write-Host "Node.js is already in your PATH." -ForegroundColor Green
}

# Verify Node.js and npm
Write-Host "`nVerifying installation..." -ForegroundColor Cyan
Write-Host "Node.js version: " -NoNewline
& "$nodePath\node.exe" -v
Write-Host "npm version: " -NoNewline
& "$nodePath\npm.cmd" -v
