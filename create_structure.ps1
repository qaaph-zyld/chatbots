# Create new directory structure for reorganization
$directories = @(
    "src_new\core\engine",
    "src_new\core\interfaces", 
    "src_new\core\services",
    "src_new\features\chatbot",
    "src_new\features\conversation",
    "src_new\features\analytics", 
    "src_new\features\sentiment",
    "src_new\infrastructure\database",
    "src_new\infrastructure\middleware",
    "src_new\infrastructure\utils",
    "src_new\api\routes",
    "config_new\environments",
    "tests_new\unit\core",
    "tests_new\unit\features", 
    "tests_new\unit\infrastructure",
    "tests_new\integration\api",
    "tests_new\integration\database",
    "tests_new\e2e"
)

foreach ($dir in $directories) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    Write-Host "Created: $dir"
}

Write-Host "Directory structure created successfully!"
