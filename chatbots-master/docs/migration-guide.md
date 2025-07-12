# Project Reorganization Migration Guide

This document provides a comprehensive guide for migrating the chatbot platform to the new directory structure following the dev_framework standards.

## Overview of Changes

The project has been reorganized to follow the dev_framework standards with the following key changes:

1. **New Directory Structure**:
   - `configs/` for all configuration files
   - `src/modules/` for feature-specific services
   - `src/domain/` for domain models
   - `src/core/` for core functionality
   - `tests/` organized by test type (unit, integration, e2e)

2. **Configuration Updates**:
   - Jest configuration updated for new test paths
   - Webpack configuration moved to `configs/webpack/`
   - ESLint configuration added

3. **Import Path Updates**:
   - Module aliases added to package.json
   - Import paths updated throughout the codebase

## Migration Steps

### 1. Create New Directory Structure

```powershell
# Create root-level directories
mkdir -p configs/webpack configs/jest configs/eslint
mkdir -p src/core src/modules src/api src/data src/domain src/utils
mkdir -p tests/unit tests/integration tests/e2e
mkdir -p .github/workflows
mkdir -p docs
```

### 2. Move Files to New Locations

```powershell
# Move configuration files
Move-Item -Path src/config/* -Destination configs/ -Force

# Move domain models
Move-Item -Path src/models/* -Destination src/domain/ -Force

# Move services to modules
Move-Item -Path src/services/analytics/* -Destination src/modules/analytics/ -Force
Move-Item -Path src/services/chatbot/* -Destination src/modules/chatbot/ -Force
Move-Item -Path src/services/conversation/* -Destination src/modules/conversation/ -Force
Move-Item -Path src/services/entity/* -Destination src/modules/entity/ -Force
Move-Item -Path src/services/preference/* -Destination src/modules/preference/ -Force
Move-Item -Path src/services/topic/* -Destination src/modules/topic/ -Force

# Move tests
Move-Item -Path src/tests/unit/* -Destination tests/unit/ -Force
Move-Item -Path src/tests/integration/* -Destination tests/integration/ -Force
Move-Item -Path src/tests/e2e/* -Destination tests/e2e/ -Force
```

### 3. Update Configuration Files

1. **Jest Configuration**: Update `jest.config.js` to reflect new test paths
2. **Webpack Configuration**: Create root `webpack.config.js` and environment-specific configs
3. **ESLint Configuration**: Add `.eslintrc.js` at root and detailed config in `configs/eslint/`

### 4. Update Import Paths

Run the import path migration script:

```powershell
node scripts/update-import-paths.js --dry-run
```

Review the changes, then apply them:

```powershell
node scripts/update-import-paths.js
```

### 5. Install Module Alias Package

```powershell
npm install --save module-alias
```

Add the following to the top of your entry file (`src/index.js`):

```javascript
require('module-alias/register');
```

### 6. Verify Changes

1. **Run Tests**: Ensure all tests pass with the new structure
   ```powershell
   npm test
   ```

2. **Start Development Server**: Verify the application runs correctly
   ```powershell
   npm run dev
   ```

## Troubleshooting

### Common Issues

1. **Missing Modules**: If you encounter "Cannot find module" errors:
   - Check that the file has been moved to the correct location
   - Verify import paths have been updated correctly
   - Ensure module-alias is properly configured

2. **Test Failures**: If tests fail after migration:
   - Check test setup files for correct paths
   - Verify test fixtures are accessible
   - Update any hardcoded paths in test files

3. **Build Errors**: If webpack build fails:
   - Check webpack configuration for correct paths
   - Verify all required loaders and plugins are installed
   - Update any aliases in webpack configuration

## Rollback Plan

If issues arise that cannot be resolved quickly, follow these steps to roll back:

1. Revert to the previous branch:
   ```powershell
   git checkout main
   ```

2. If changes were committed:
   ```powershell
   git revert <commit-hash>
   ```

## Next Steps

After successful migration:

1. Update documentation to reflect new structure
2. Train team members on new organization
3. Update CI/CD pipelines for new directory structure
4. Review and update any scripts that may depend on the old structure

## References

- [dev_framework Repository](https://github.com/qaaph-zyld/dev_framework)
- [Jest Configuration Documentation](https://jestjs.io/docs/configuration)
- [Webpack Configuration Documentation](https://webpack.js.org/configuration/)
- [ESLint Configuration Documentation](https://eslint.org/docs/user-guide/configuring/)
