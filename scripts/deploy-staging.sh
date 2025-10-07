#!/bin/bash

# Staging Deployment Script
# Deploys the chatbot platform to staging environment

set -e

echo "🚀 Starting staging deployment..."

# Configuration
STAGING_ENV_FILE=".env.staging"
DOCKER_COMPOSE_FILE="docker-compose.staging.yml"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running"
        exit 1
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if staging environment file exists
    if [ ! -f "$STAGING_ENV_FILE" ]; then
        print_error "Staging environment file ($STAGING_ENV_FILE) not found"
        exit 1
    fi
    
    print_status "Prerequisites check passed ✓"
}

# Function to backup current deployment
backup_current_deployment() {
    print_status "Creating backup of current deployment..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    if docker ps | grep -q "chatbots-mongodb-staging"; then
        print_status "Backing up MongoDB..."
        docker exec chatbots-mongodb-staging mongodump --out /tmp/backup
        docker cp chatbots-mongodb-staging:/tmp/backup "$BACKUP_DIR/mongodb"
    fi
    
    # Backup Redis data
    if docker ps | grep -q "chatbots-redis-staging"; then
        print_status "Backing up Redis..."
        docker exec chatbots-redis-staging redis-cli BGSAVE
        docker cp chatbots-redis-staging:/data/dump.rdb "$BACKUP_DIR/redis-dump.rdb"
    fi
    
    # Backup application logs
    if [ -d "./logs" ]; then
        cp -r ./logs "$BACKUP_DIR/"
    fi
    
    print_status "Backup created at $BACKUP_DIR ✓"
}

# Function to run pre-deployment tests
run_tests() {
    print_status "Running pre-deployment tests..."
    
    # Run unit tests
    npm test 2>&1 | tee test-results.txt
    
    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        print_error "Tests failed. Deployment aborted."
        exit 1
    fi
    
    print_status "All tests passed ✓"
}

# Function to build and deploy
deploy() {
    print_status "Building and deploying to staging..."
    
    # Load staging environment variables
    export $(cat $STAGING_ENV_FILE | xargs)
    
    # Stop existing containers
    print_status "Stopping existing containers..."
    docker-compose -f $DOCKER_COMPOSE_FILE down --remove-orphans
    
    # Build new images
    print_status "Building application image..."
    docker-compose -f $DOCKER_COMPOSE_FILE build --no-cache
    
    # Start services
    print_status "Starting services..."
    docker-compose -f $DOCKER_COMPOSE_FILE up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    check_service_health
}

# Function to check service health
check_service_health() {
    print_status "Checking service health..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000/api/v1/health &> /dev/null; then
            print_status "Application is healthy ✓"
            break
        fi
        
        print_warning "Attempt $attempt/$max_attempts: Application not ready yet..."
        sleep 10
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_error "Application failed to become healthy"
        print_status "Checking container logs..."
        docker-compose -f $DOCKER_COMPOSE_FILE logs app
        exit 1
    fi
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    docker-compose -f $DOCKER_COMPOSE_FILE exec -T app npm run migrate
    
    if [ $? -ne 0 ]; then
        print_error "Database migrations failed"
        exit 1
    fi
    
    print_status "Database migrations completed ✓"
}

# Function to run smoke tests
run_smoke_tests() {
    print_status "Running smoke tests..."
    
    # Test API endpoints
    local base_url="http://localhost:3000/api/v1"
    
    # Health check
    if ! curl -f "$base_url/health" &> /dev/null; then
        print_error "Health check failed"
        return 1
    fi
    
    # Test authentication endpoint
    if ! curl -f "$base_url/auth/status" &> /dev/null; then
        print_error "Auth endpoint test failed"
        return 1
    fi
    
    print_status "Smoke tests passed ✓"
}

# Function to setup monitoring
setup_monitoring() {
    print_status "Setting up monitoring..."
    
    # Create monitoring directories
    mkdir -p ./monitoring/logs
    mkdir -p ./monitoring/metrics
    
    # Start monitoring containers if configured
    if [ -f "docker-compose.monitoring.yml" ]; then
        docker-compose -f docker-compose.monitoring.yml up -d
    fi
    
    print_status "Monitoring setup completed ✓"
}

# Function to send deployment notification
send_notification() {
    local status=$1
    local message="Staging deployment $status at $(date)"
    
    print_status "Sending deployment notification..."
    
    # Send to Slack if webhook is configured
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
    
    # Log deployment
    echo "$(date): $message" >> ./logs/deployments.log
}

# Function to rollback deployment
rollback() {
    print_error "Deployment failed. Starting rollback..."
    
    # Stop current containers
    docker-compose -f $DOCKER_COMPOSE_FILE down
    
    # Restore from backup if available
    if [ -d "$BACKUP_DIR" ]; then
        print_status "Restoring from backup..."
        
        # Restore database
        if [ -d "$BACKUP_DIR/mongodb" ]; then
            docker-compose -f $DOCKER_COMPOSE_FILE up -d mongodb
            sleep 10
            docker cp "$BACKUP_DIR/mongodb" chatbots-mongodb-staging:/tmp/restore
            docker exec chatbots-mongodb-staging mongorestore /tmp/restore
        fi
        
        # Restore Redis
        if [ -f "$BACKUP_DIR/redis-dump.rdb" ]; then
            docker-compose -f $DOCKER_COMPOSE_FILE up -d redis
            sleep 5
            docker cp "$BACKUP_DIR/redis-dump.rdb" chatbots-redis-staging:/data/dump.rdb
            docker restart chatbots-redis-staging
        fi
    fi
    
    print_status "Rollback completed"
    send_notification "FAILED (rolled back)"
    exit 1
}

# Main deployment process
main() {
    print_status "Starting staging deployment process..."
    
    # Set trap for cleanup on failure
    trap rollback ERR
    
    # Run deployment steps
    check_prerequisites
    backup_current_deployment
    run_tests
    deploy
    run_migrations
    run_smoke_tests
    setup_monitoring
    
    print_status "🎉 Staging deployment completed successfully!"
    send_notification "SUCCESS"
    
    # Display deployment information
    echo ""
    echo "=== Deployment Information ==="
    echo "Environment: Staging"
    echo "Timestamp: $(date)"
    echo "Application URL: http://localhost:3000"
    echo "Admin Panel: http://localhost:3000/admin"
    echo "API Documentation: http://localhost:3000/api/docs"
    echo ""
    echo "=== Service Status ==="
    docker-compose -f $DOCKER_COMPOSE_FILE ps
    echo ""
    echo "=== Next Steps ==="
    echo "1. Run user acceptance tests"
    echo "2. Verify all integrations"
    echo "3. Check monitoring dashboards"
    echo "4. Prepare for production deployment"
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback
        ;;
    "health")
        check_service_health
        ;;
    "logs")
        docker-compose -f $DOCKER_COMPOSE_FILE logs -f
        ;;
    "status")
        docker-compose -f $DOCKER_COMPOSE_FILE ps
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|health|logs|status}"
        exit 1
        ;;
esac
