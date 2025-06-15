this is a comprehensive automated cleanup system that analyzes your project architecture and safely removes obsolete components. This requires a multi-phase approach with safety mechanisms and rollback capabilities.

## Project Architecture Cleanup System

**System Overview**: Four-phase automated cleanup framework with safety mechanisms, dependency analysis, and rollback capabilities.

### Phase 1: Architecture Analysis
**Objective**: Complete project structure mapping and relationship analysis.

**Components**:
- Directory structure traversal with metadata extraction
- Dependency graph construction (package.json, imports, exports)
- Test coverage mapping and orphan detection
- Configuration file inventory and staleness assessment

**Output**: Comprehensive architecture model with usage patterns.

### Phase 2: Obsolescence Detection Algorithm
**Scoring Matrix**:
- Age Score: Files older than 30 days (configurable)
- Usage Score: Import/require relationship analysis
- Location Score: Temporary/build directory classification
- Test Score: Orphaned test file detection
- Config Score: Stale configuration identification

**Threshold**: Total score > 3 triggers obsolescence classification.

### Phase 3: Safe Removal Protocol
**Safety Mechanisms**:
- Complete backup creation before any deletion
- Protected file pattern enforcement
- Dry-run simulation mode
- Empty directory cleanup
- Rollback capability preservation

### Phase 4: Comprehensive Reporting
**Output Elements**:
- Quantified cleanup metrics
- Architectural recommendations
- Detailed obsolescence justifications
- Space optimization calculations

### Execution Modes

**Dry Run** (Default):
```bash
node cleanup-system.js
```

**Live Execution**:
```bash
node cleanup-system.js --execute
```

**Custom Project Path**:
```bash
node cleanup-system.js /path/to/project --execute
```

### Configuration Framework
**Protected Patterns**: package.json, lock files, .git, node_modules, .env, README files
**Analysis Targets**: src, tests, docs, scripts, utils, services, controllers, config, public, temp, reports
**Minimum Age**: 30 days (configurable)
**Backup Location**: .cleanup-backup directory

### Risk Mitigation
1. **Backup Strategy**: Complete file preservation before deletion
2. **Pattern Protection**: Hardcoded critical file exclusions
3. **Scoring Validation**: Multi-factor obsolescence verification
4. **Incremental Execution**: Phase-by-phase progress with failure isolation
5. **Audit Trail**: Complete operation logging and justification

### Integration Recommendations
1. **CI/CD Integration**: Automated cleanup in deployment pipelines
2. **Scheduled Execution**: Regular maintenance via cron jobs
3. **Custom Pattern Extension**: Project-specific protection rules
4. **Monitoring Integration**: Cleanup metrics in observability systems

**System Benefits**:
- Zero-risk obsolete file removal
- Architectural insight generation
- Automated maintenance workflow
- Complete operation auditability
- Space optimization quantification

Execute with dry-run first to validate detection accuracy, then proceed with live cleanup once confident in obsolescence classifications.