# Requires -RunAsAdministrator
# Node.js and npm Setup Script
# Save this file as setup-node.ps1 and run it as Administrator

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "This script must be run as Administrator. Please right-click on the script and select 'Run with PowerShell' as Administrator." -ForegroundColor Red
    exit 1
}

# Function to check if a command exists
function Test-CommandExists {
    param($command)
    $exists = $null -ne (Get-Command $command -ErrorAction SilentlyContinue)
    return $exists
}

# Check if Node.js is already in PATH
$nodeInPath = $false
$npmInPath = $false

if (Test-CommandExists "node") {
    $nodeInPath = $true
    Write-Host "Node.js found in PATH" -ForegroundColor Green
    Write-Host "Node.js version: $(node --version)" -ForegroundColor Green
}

if (Test-CommandExists "npm") {
    $npmInPath = $true
    Write-Host "npm found in PATH" -ForegroundColor Green
    Write-Host "npm version: $(npm --version)" -ForegroundColor Green
}

if ($nodeInPath -and $npmInPath) {
    Write-Host "`nNode.js and npm are already properly installed and in PATH." -ForegroundColor Green
    exit 0
}

# If not in PATH, try to find Node.js in common locations
$nodePaths = @(
    "${env:ProgramFiles}\nodejs\node.exe",
    "${env:ProgramFiles(x86)}\nodejs\node.exe",
    "${env:LOCALAPPDATA}\nodejs\node.exe"
)

$nodeFound = $false
foreach ($path in $nodePaths) {
    if (Test-Path $path) {
        $nodeFound = $true
        $nodeDir = Split-Path $path
        
        # Add to system PATH if not already there
        $currentPath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
        if ($currentPath -notlike "*$nodeDir*") {
            [Environment]::SetEnvironmentVariable('Path', "$currentPath;$nodeDir", 'Machine')
            Write-Host "Added Node.js to system PATH: $nodeDir" -ForegroundColor Green
        }
        
        # Also add npm global modules to PATH
        $npmPath = Join-Path $env:APPDATA "npm"
        if (Test-Path $npmPath -and $currentPath -notlike "*$npmPath*") {
            [Environment]::SetEnvironmentVariable('Path', "$currentPath;$npmPath", 'Machine')
            Write-Host "Added npm global modules to PATH: $npmPath" -ForegroundColor Green
        }
        
        # Refresh the current session
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        # Verify
        if (Test-CommandExists "node" -and Test-CommandExists "npm") {
            Write-Host "`nNode.js and npm are now available in PATH" -ForegroundColor Green
            Write-Host "Node.js version: $(node --version)" -ForegroundColor Green
            Write-Host "npm version: $(npm --version)" -ForegroundColor Green
            exit 0
        }
        break
    }
}

# If we get here, Node.js needs to be installed
Write-Host "`nNode.js not found. Downloading and installing Node.js LTS..." -ForegroundColor Yellow

# Download Node.js LTS installer
$url = "https://nodejs.org/dist/v18.17.1/node-v18.17.1-x64.msi"
$output = "$env:TEMP\nodejs_installer.msi"

Write-Host "Downloading Node.js installer..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $url -OutFile $output

# Install Node.js
Write-Host "Installing Node.js..." -ForegroundColor Cyan
$arguments = "/i `"$output`" /qn /norestart"
Start-Process "msiexec.exe" -ArgumentList $arguments -Wait -NoNewWindow

# Clean up installer
Remove-Item $output -Force -ErrorAction SilentlyContinue

# Add Node.js to PATH
$nodeDir = "${env:ProgramFiles}\nodejs"
$npmPath = Join-Path $env:APPDATA "npm"
$currentPath = [Environment]::GetEnvironmentVariable('Path', 'Machine')

if ($currentPath -notlike "*$nodeDir*") {
    [Environment]::SetEnvironmentVariable('Path', "$currentPath;$nodeDir", 'Machine')
}

if ($currentPath -notlike "*$npmPath*") {
    [Environment]::SetEnvironmentVariable('Path', "$currentPath;$npmPath", 'Machine')
}

# Refresh environment variables
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Verify installation
if (Test-CommandExists "node" -and Test-CommandExists "npm") {
    Write-Host "`nNode.js and npm have been successfully installed!" -ForegroundColor Green
    Write-Host "Node.js version: $(node --version)" -ForegroundColor Green
    Write-Host "npm version: $(npm --version)" -ForegroundColor Green
    
    # Install global npm packages
    Write-Host "`nInstalling recommended global npm packages..." -ForegroundColor Cyan
    $globalPackages = @("typescript", "ts-node", "nodemon", "jest", "eslint", "prettier")
    foreach ($pkg in $globalPackages) {
        Write-Host "Installing $pkg..." -ForegroundColor Yellow
        npm install -g $pkg
    }
    
    Write-Host "`nSetup completed successfully!" -ForegroundColor Green
    Write-Host "Please restart any open command prompts for the changes to take effect." -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "`nNode.js installation completed, but there might be an issue with the PATH configuration." -ForegroundColor Red
    Write-Host "Please restart your computer and try running 'node --version' in a new command prompt." -ForegroundColor Yellow
    exit 1
}
