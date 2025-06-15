# Project Cleanup Service

Automated project cleanup system that combines detailed architecture analysis with intelligent cleanup automation.

## Features

- **Four-Phase Cleanup Process**:
  1. Architecture Analysis
  2. Obsolescence Detection
  3. Safe Removal Protocol
  4. Comprehensive Reporting
- **Integration with Project Mapping**: Uses detailed project mapping for accurate analysis
- **Configuration Driven**: Customize via `.cleanup-config.json`
- **Safety First**: Dry-run mode by default with backup system

## Installation

```bash
npm install -g project-cleanup-service
```

## Usage

### Basic Usage
```bash
# Run in dry-run mode (default)
cleanup-system

# Execute actual cleanup
cleanup-system --execute

# Verbose output
cleanup-system --verbose
```

### Configuration
Create `.cleanup-config.json` in your project root:
```json
{
  "analysisTargets": ["src", "lib"],
  "protectedPatterns": [".env", "docker-compose.yml"],
  "minAgeForDeletion": 60,
  "backupDir": ".cleanup-backups",
  "reportFile": "cleanup-summary.json",
  "reportHtmlFile": "cleanup-report.html"
}
```

### Report Example
![Cleanup Report](cleanup-report-screenshot.png)

## Advanced Options

- `--project-path`: Specify custom project path
- `--config`: Use custom configuration file
- `--min-age`: Override minimum file age (days)

## Safety Features

- Dry-run mode by default
- Automatic backups before removal
- Protected file patterns
- Comprehensive audit trail

## Integration

```javascript
const { ProjectCleanupAutomation } = require('project-cleanup-service');

async function runCleanup() {
  const cleanup = new ProjectCleanupAutomation('./my-project');
  await cleanup.execute({ dryRun: false });
}

runCleanup();
```
