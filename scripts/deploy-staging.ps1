# PowerShell Staging Deployment Script
# Deploys the chatbot platform to staging environment on Windows

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("deploy", "rollback", "health", "logs", "status")]
    [string]$Action = "deploy"
)

# Configuration
$STAGING_ENV_FILE = ".env.staging"
$DOCKER_COMPOSE_FILE = "docker-compose.staging.yml"
$BACKUP_DIR = "./backups/$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Function to check prerequisites
function Test-Prerequisites {
    Write-Status "Checking prerequisites..."
    
    # Check if Docker is installed and running
    try {
        $dockerVersion = docker --version
        Write-Status "Docker found: $dockerVersion"
    }
    catch {
        Write-Error "Docker is not installed or not in PATH"
        exit 1
    }
    
    try {
        docker info | Out-Null
        Write-Status "Docker is running"
    }
    catch {
        Write-Error "Docker is not running. Please start Docker Desktop."
        exit 1
    }
    
    # Check if Docker Compose is available
    try {
        $composeVersion = docker-compose --version
        Write-Status "Docker Compose found: $composeVersion"
    }
    catch {
        Write-Error "Docker Compose is not installed"
        exit 1
    }
    
    # Check if staging environment file exists
    if (-not (Test-Path $STAGING_ENV_FILE)) {
        Write-Error "Staging environment file ($STAGING_ENV_FILE) not found"
        exit 1
    }
    
    Write-Status "Prerequisites check passed ✓"
}

# Function to backup current deployment
function Backup-CurrentDeployment {
    Write-Status "Creating backup of current deployment..."
    
    New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
    
    # Backup database
    $mongoContainer = docker ps --filter "name=chatbots-mongodb-staging" --format "{{.Names}}"
    if ($mongoContainer) {
        Write-Status "Backing up MongoDB..."
        docker exec $mongoContainer mongodump --out /tmp/backup
        docker cp "${mongoContainer}:/tmp/backup" "$BACKUP_DIR/mongodb"
    }
    
    # Backup Redis data
    $redisContainer = docker ps --filter "name=chatbots-redis-staging" --format "{{.Names}}"
    if ($redisContainer) {
        Write-Status "Backing up Redis..."
        docker exec $redisContainer redis-cli BGSAVE
        docker cp "${redisContainer}:/data/dump.rdb" "$BACKUP_DIR/redis-dump.rdb"
    }
    
    # Backup application logs
    if (Test-Path "./logs") {
        Copy-Item -Path "./logs" -Destination "$BACKUP_DIR/" -Recurse
    }
    
    Write-Status "Backup created at $BACKUP_DIR ✓"
}

# Function to run pre-deployment tests
function Invoke-Tests {
    Write-Status "Running pre-deployment tests..."
    
    # Run unit tests using the approved command
    $testResult = & cmd /c "npm test 2>&1 | Tee-Object -FilePath terminal-output.txt; echo `$LASTEXITCODE"
    $exitCode = $testResult[-1]
    
    if ($exitCode -ne 0) {
        Write-Error "Tests failed. Deployment aborted."
        Get-Content "terminal-output.txt" | Select-Object -Last 20
        exit 1
    }
    
    Write-Status "All tests passed ✓"
}

# Function to build and deploy
function Start-Deployment {
    Write-Status "Building and deploying to staging..."
    
    # Load staging environment variables
    if (Test-Path $STAGING_ENV_FILE) {
        Get-Content $STAGING_ENV_FILE | ForEach-Object {
            if ($_ -match '^([^#][^=]+)=(.*)$') {
                [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
            }
        }
    }
    
    # Stop existing containers
    Write-Status "Stopping existing containers..."
    docker-compose -f $DOCKER_COMPOSE_FILE down --remove-orphans
    
    # Build new images
    Write-Status "Building application image..."
    docker-compose -f $DOCKER_COMPOSE_FILE build --no-cache
    
    # Start services
    Write-Status "Starting services..."
    docker-compose -f $DOCKER_COMPOSE_FILE up -d
    
    # Wait for services to be healthy
    Write-Status "Waiting for services to be healthy..."
    Start-Sleep -Seconds 30
    
    # Check service health
    Test-ServiceHealth
}

# Function to check service health
function Test-ServiceHealth {
    Write-Status "Checking service health..."
    
    $maxAttempts = 30
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/health" -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Status "Application is healthy ✓"
                return
            }
        }
        catch {
            Write-Warning "Attempt $attempt/$maxAttempts`: Application not ready yet..."
            Start-Sleep -Seconds 10
            $attempt++
        }
    }
    
    if ($attempt -gt $maxAttempts) {
        Write-Error "Application failed to become healthy"
        Write-Status "Checking container logs..."
        docker-compose -f $DOCKER_COMPOSE_FILE logs app
        exit 1
    }
}

# Function to run database migrations
function Invoke-Migrations {
    Write-Status "Running database migrations..."
    
    docker-compose -f $DOCKER_COMPOSE_FILE exec -T app npm run migrate
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Database migrations failed"
        exit 1
    }
    
    Write-Status "Database migrations completed ✓"
}

# Function to run smoke tests
function Invoke-SmokeTests {
    Write-Status "Running smoke tests..."
    
    $baseUrl = "http://localhost:3000/api/v1"
    
    # Health check
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/health" -UseBasicParsing
        if ($response.StatusCode -ne 200) {
            throw "Health check failed with status $($response.StatusCode)"
        }
    }
    catch {
        Write-Error "Health check failed: $($_.Exception.Message)"
        return $false
    }
    
    # Test authentication endpoint
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/auth/status" -UseBasicParsing
        if ($response.StatusCode -ne 200) {
            throw "Auth endpoint test failed with status $($response.StatusCode)"
        }
    }
    catch {
        Write-Error "Auth endpoint test failed: $($_.Exception.Message)"
        return $false
    }
    
    Write-Status "Smoke tests passed ✓"
    return $true
}

# Function to setup monitoring
function Initialize-Monitoring {
    Write-Status "Setting up monitoring..."
    
    # Create monitoring directories
    New-Item -ItemType Directory -Path "./monitoring/logs" -Force | Out-Null
    New-Item -ItemType Directory -Path "./monitoring/metrics" -Force | Out-Null
    
    # Start monitoring containers if configured
    if (Test-Path "docker-compose.monitoring.yml") {
        docker-compose -f docker-compose.monitoring.yml up -d
    }
    
    Write-Status "Monitoring setup completed ✓"
}

# Function to send deployment notification
function Send-Notification {
    param([string]$Status)
    
    $message = "Staging deployment $Status at $(Get-Date)"
    
    Write-Status "Sending deployment notification..."
    
    # Send to Slack if webhook is configured
    $slackWebhook = $env:SLACK_WEBHOOK_URL
    if ($slackWebhook) {
        $body = @{ text = $message } | ConvertTo-Json
        try {
            Invoke-RestMethod -Uri $slackWebhook -Method Post -Body $body -ContentType "application/json"
        }
        catch {
            Write-Warning "Failed to send Slack notification: $($_.Exception.Message)"
        }
    }
    
    # Log deployment
    $logEntry = "$(Get-Date): $message"
    Add-Content -Path "./logs/deployments.log" -Value $logEntry
}

# Function to rollback deployment
function Start-Rollback {
    Write-Error "Deployment failed. Starting rollback..."
    
    # Stop current containers
    docker-compose -f $DOCKER_COMPOSE_FILE down
    
    # Restore from backup if available
    if (Test-Path $BACKUP_DIR) {
        Write-Status "Restoring from backup..."
        
        # Restore database
        if (Test-Path "$BACKUP_DIR/mongodb") {
            docker-compose -f $DOCKER_COMPOSE_FILE up -d mongodb
            Start-Sleep -Seconds 10
            docker cp "$BACKUP_DIR/mongodb" chatbots-mongodb-staging:/tmp/restore
            docker exec chatbots-mongodb-staging mongorestore /tmp/restore
        }
        
        # Restore Redis
        if (Test-Path "$BACKUP_DIR/redis-dump.rdb") {
            docker-compose -f $DOCKER_COMPOSE_FILE up -d redis
            Start-Sleep -Seconds 5
            docker cp "$BACKUP_DIR/redis-dump.rdb" chatbots-redis-staging:/data/dump.rdb
            docker restart chatbots-redis-staging
        }
    }
    
    Write-Status "Rollback completed"
    Send-Notification "FAILED (rolled back)"
    exit 1
}

# Main deployment process
function Start-MainDeployment {
    Write-Status "Starting staging deployment process..."
    
    try {
        # Run deployment steps
        Test-Prerequisites
        Backup-CurrentDeployment
        Invoke-Tests
        Start-Deployment
        Invoke-Migrations
        
        if (-not (Invoke-SmokeTests)) {
            throw "Smoke tests failed"
        }
        
        Initialize-Monitoring
        
        Write-Status "🎉 Staging deployment completed successfully!"
        Send-Notification "SUCCESS"
        
        # Display deployment information
        Write-Host ""
        Write-Host "=== Deployment Information ===" -ForegroundColor Cyan
        Write-Host "Environment: Staging"
        Write-Host "Timestamp: $(Get-Date)"
        Write-Host "Application URL: http://localhost:3000"
        Write-Host "Admin Panel: http://localhost:3000/admin"
        Write-Host "API Documentation: http://localhost:3000/api/docs"
        Write-Host ""
        Write-Host "=== Service Status ===" -ForegroundColor Cyan
        docker-compose -f $DOCKER_COMPOSE_FILE ps
        Write-Host ""
        Write-Host "=== Next Steps ===" -ForegroundColor Cyan
        Write-Host "1. Run user acceptance tests"
        Write-Host "2. Verify all integrations"
        Write-Host "3. Check monitoring dashboards"
        Write-Host "4. Prepare for production deployment"
    }
    catch {
        Write-Error "Deployment failed: $($_.Exception.Message)"
        Start-Rollback
    }
}

# Function to show service status
function Show-ServiceStatus {
    Write-Status "Checking service status..."
    docker-compose -f $DOCKER_COMPOSE_FILE ps
}

# Function to show logs
function Show-Logs {
    Write-Status "Showing service logs..."
    docker-compose -f $DOCKER_COMPOSE_FILE logs -f
}

# Main script execution
switch ($Action) {
    "deploy" {
        Start-MainDeployment
    }
    "rollback" {
        Start-Rollback
    }
    "health" {
        Test-ServiceHealth
    }
    "logs" {
        Show-Logs
    }
    "status" {
        Show-ServiceStatus
    }
    default {
        Write-Host "Usage: .\deploy-staging.ps1 [-Action {deploy|rollback|health|logs|status}]"
        exit 1
    }
}
