<#
.SYNOPSIS
    Setup development environment for the Chatbots project
.DESCRIPTION
    This script helps set up the development environment by checking for required tools
    and installing necessary dependencies.
#>

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "This script requires administrator privileges. Please run as administrator." -ForegroundColor Red
    exit 1
}

# Check if Chocolatey is installed
$chocoInstalled = $false
if (Get-Command choco -ErrorAction SilentlyContinue) {
    $chocoInstalled = $true
    Write-Host "Chocolatey is already installed." -ForegroundColor Green
} else {
    Write-Host "Chocolatey not found. Installing Chocolatey..." -ForegroundColor Yellow
    try {
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        $chocoInstalled = $true
        Write-Host "Chocolatey installed successfully." -ForegroundColor Green
    } catch {
        Write-Host "Failed to install Chocolatey: $_" -ForegroundColor Red
        exit 1
    }
}

# Function to install a package using Chocolatey
function Install-ChocoPackage {
    param(
        [string]$packageName,
        [string]$packageVersion = ""
    )
    
    $versionParam = if ($packageVersion) { "--version $packageVersion" } else { "" }
    
    Write-Host "Checking for $packageName..." -ForegroundColor Cyan
    if (Get-Command $packageName -ErrorAction SilentlyContinue) {
        Write-Host "$packageName is already installed." -ForegroundColor Green
        return $true
    }
    
    Write-Host "Installing $packageName $packageVersion..." -ForegroundColor Yellow
    try {
        $installCmd = "choco install $packageName -y $versionParam --no-progress"
        Invoke-Expression $installCmd
        if ($LASTEXITCODE -ne 0) { throw "Installation failed with exit code $LASTEXITCODE" }
        
        # Refresh PATH to ensure the installed package is available
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        Write-Host "$packageName installed successfully." -ForegroundColor Green
        return $true
    } catch {
        Write-Host "Failed to install $packageName : $_" -ForegroundColor Red
        return $false
    }
}

# Install required tools
$tools = @(
    @{ Name = "nodejs-lts"; Version = "18.17.0" },
    @{ Name = "git" },
    @{ Name = "docker-desktop" },
    @{ Name = "vscode" },
    @{ Name = "yarn" }
)

$allInstalled = $true
foreach ($tool in $tools) {
    $result = Install-ChocoPackage -packageName $tool.Name -packageVersion $tool.Version
    if (-not $result) { $allInstalled = $false }
}

if (-not $allInstalled) {
    Write-Host "Some tools failed to install. Please check the logs above." -ForegroundColor Red
    exit 1
}

# Verify Node.js and npm installation
Write-Host "`nVerifying Node.js and npm installation..." -ForegroundColor Cyan
$nodeVersion = node --version
$npmVersion = npm --version

if ($nodeVersion -and $npmVersion) {
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
    Write-Host "npm version: $npmVersion" -ForegroundColor Green
    
    # Install global npm packages
    Write-Host "`nInstalling global npm packages..." -ForegroundColor Cyan
    $globalPackages = @(
        "typescript",
        "ts-node",
        "nodemon",
        "jest",
        "eslint",
        "prettier",
        "typescript-eslint"
    )
    
    foreach ($pkg in $globalPackages) {
        Write-Host "Installing $pkg..." -ForegroundColor Yellow
        npm install -g $pkg
    }
    
    # Install project dependencies
    Write-Host "`nInstalling project dependencies..." -ForegroundColor Cyan
    Set-Location $PSScriptRoot\..
    npm install
    
    Write-Host "`nDevelopment environment setup completed successfully!" -ForegroundColor Green
    Write-Host "Please restart your terminal or run 'refreshenv' to update environment variables." -ForegroundColor Yellow
} else {
    Write-Host "Failed to verify Node.js and npm installation. Please install them manually." -ForegroundColor Red
    exit 1
}
