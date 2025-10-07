# Fix Path Separators Script
# This script fixes malformed require statements with excessive backslashes

$rootPath = "c:\Users\ajelacn\Documents\chatbots\ShopBot"
$jsFiles = Get-ChildItem -Recurse -Path $rootPath -Include "*.js"

$fixCount = 0

foreach ($file in $jsFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Fix patterns like @src/path\\\\\\\subpath to @src/path/subpath
    $content = $content -replace "@src/([^'`"]*?)\\\\\\\\\\\\\\\\", "@src/`$1/"
    $content = $content -replace "@src/([^'`"]*?)\\\\\\\\\\\\", "@src/`$1/"
    $content = $content -replace "@src/([^'`"]*?)\\\\\\\\", "@src/`$1/"
    $content = $content -replace "@src/([^'`"]*?)\\\\\\", "@src/`$1/"
    $content = $content -replace "@src/([^'`"]*?)\\\\", "@src/`$1/"
    
    # Additional cleanup for any remaining backslashes in @src paths
    $content = $content -replace "@src/([^'`"]*?)\\([^'`"]*?)", "@src/`$1/`$2"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($file.FullName)"
        $fixCount++
    }
}

Write-Host "Fixed $fixCount files with path separator issues"
