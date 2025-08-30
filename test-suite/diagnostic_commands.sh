# Step 1: Check current directory and list files
pwd
ls -la

# Alternative for Windows PowerShell
Get-Location
Get-ChildItem -Force

# Step 2: Search for test-suite.js in current directory and subdirectories
find . -name "test-suite.js" -type f

# Alternative for Windows PowerShell
Get-ChildItem -Recurse -Name "test-suite.js"

# Step 3: Check if there are any JavaScript files in the directory
find . -name "*.js" -type f

# Alternative for Windows PowerShell
Get-ChildItem -Recurse -Filter "*.js"