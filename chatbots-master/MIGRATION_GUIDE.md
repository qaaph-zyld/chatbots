# Migration Guide

This guide provides instructions for migrating from the old project structure to the new modular structure.

## Overview of Changes

- **New Directory Structure**: Reorganized source code into a more modular structure
- **Updated Build System**: Modernized build and test configurations
- **Enhanced CI/CD**: New GitHub Actions workflows for testing and deployment
- **Improved Documentation**: Comprehensive guides and references

## Migration Steps

### 1. Update Dependencies

```bash
# Remove old dependencies
rm -rf node_modules package-lock.json

# Install updated dependencies
npm install
```

### 2. Configuration Updates

1. Copy your existing environment variables to the new `.env` file:
   ```bash
   cp .env.example .env
   # Update with your existing configuration
   ```

2. Update any custom configurations in the `config/` directory if you had any overrides.

### 3. Code Updates

#### Imports

Update import paths to use the new module aliases:

```javascript
// Old
const { someUtil } = require('../../utils/someUtil');

// New
const { someUtil } = require('@utils/someUtil');
```

#### Configuration

If you had custom configurations, move them to the appropriate location in the new structure:

- Server configuration → `config/server.js`
- Database configuration → `config/database.js`
- Environment variables → `.env`

### 4. Testing Updates

1. Move test files to match the new structure:
   - Unit tests → `src/tests/unit/`
   - Integration tests → `src/tests/integration/`
   - E2E tests → `src/tests/e2e/`

2. Update test configurations to use the new paths

### 5. Deployment Updates

1. Update your deployment scripts to use the new build commands:
   ```bash
   # Old
   npm run build:prod
   
   # New
   npm run build
   ```

2. Update CI/CD pipeline configurations to use the new workflow files:
   - `.github/workflows/ci-cd.yml`
   - `.github/workflows/deploy.yml`

## Breaking Changes

1. **Module Resolution**
   - All imports must use the new module aliases
   - Relative paths should be avoided in favor of the `@` aliases

2. **Configuration**
   - Environment variables have been reorganized
   - Some configuration options may have been renamed or moved

3. **API Routes**
   - Route paths may have changed
   - Middleware organization has been updated

## Troubleshooting

### Common Issues

1. **Module Not Found**
   - Ensure you're using the correct module alias
   - Check that the file exists in the new location

2. **Configuration Errors**
   - Verify all required environment variables are set in `.env`
   - Check the configuration files in `config/` for any required updates

3. **Test Failures**
   - Update test paths to match the new structure
   - Ensure all test dependencies are installed

## Getting Help

If you encounter any issues during migration:

1. Check the [documentation](docs/README.md)
2. Search existing issues
3. Open a new issue if you can't find a solution

## Rollback Plan

If you need to rollback:

1. Revert to the previous commit
2. Restore any modified configuration files
3. Reinstall dependencies from the old `package-lock.json`

```bash
git checkout <previous-commit-hash>
npm ci
```

## Support

For support with the migration, please contact the development team or open an issue in the repository.
