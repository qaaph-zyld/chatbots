# Contributing Guide

## Getting Started

### Prerequisites
- Node.js 16+ and npm 8+
- Git
- MongoDB (for local development)
- Redis (optional, for caching)

### Setup Development Environment
```bash
# Clone the repository
git clone <repository-url>
cd chatbots

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

## Development Workflow

### 1. Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical production fixes

### 2. Making Changes
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ... code changes ...

# Run tests
npm test

# Run linting
npm run lint:fix

# Commit changes
git commit -m "feat: add new feature description"
```

### 3. Commit Message Format
Follow conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

## Code Standards

### File Structure
Follow the established architecture:
```
src_new/
├── core/           # Core functionality
├── features/       # Business features
├── infrastructure/ # Infrastructure code
└── api/           # API layer
```

### Naming Conventions
- Files: `kebab-case.js`
- Classes: `PascalCase`
- Functions/Variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`

### Code Style
- Use ESLint configuration
- 2 spaces for indentation
- Single quotes for strings
- Trailing commas in objects/arrays
- Semicolons required

## Testing

### Running Tests
```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# With coverage
npm run test:coverage
```

### Writing Tests
- Place tests in `tests_new/` directory
- Mirror source structure
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

Example:
```javascript
describe('ChatbotService', () => {
  describe('createChatbot', () => {
    it('should create chatbot with valid data', async () => {
      // Arrange
      const chatbotData = { name: 'Test Bot' };
      
      // Act
      const result = await service.createChatbot(chatbotData);
      
      // Assert
      expect(result.name).toBe('Test Bot');
    });
  });
});
```

## Pull Request Process

### 1. Before Submitting
- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation updated if needed
- [ ] No merge conflicts with target branch

### 2. PR Description
Include:
- Clear description of changes
- Link to related issues
- Screenshots (if UI changes)
- Breaking changes (if any)

### 3. Review Process
- At least one approval required
- All CI checks must pass
- Address review feedback
- Squash commits before merge

## Issue Reporting

### Bug Reports
Include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Error logs/screenshots

### Feature Requests
Include:
- Clear description of the feature
- Use case and benefits
- Proposed implementation approach
- Acceptance criteria

## Security

### Reporting Security Issues
- Do NOT create public issues for security vulnerabilities
- Email security concerns to [security email]
- Include detailed description and reproduction steps

### Security Guidelines
- Never commit secrets or API keys
- Use environment variables for configuration
- Validate all user inputs
- Follow OWASP security guidelines

## Documentation

### Code Documentation
- Use JSDoc for function documentation
- Include parameter types and return values
- Provide usage examples for complex functions

### API Documentation
- Update API.md for endpoint changes
- Include request/response examples
- Document error responses

## Performance

### Guidelines
- Avoid blocking operations in main thread
- Use appropriate caching strategies
- Optimize database queries
- Monitor memory usage

### Profiling
```bash
# Performance testing
npm run test:performance

# Memory profiling
node --inspect src_new/api/app.js
```

## Release Process

### Version Bumping
```bash
# Patch version (bug fixes)
npm version patch

# Minor version (new features)
npm version minor

# Major version (breaking changes)
npm version major
```

### Deployment
- Automated via CI/CD pipeline
- Manual deployment requires approval
- Rollback plan must be available
