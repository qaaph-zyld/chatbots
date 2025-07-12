# Development Guide

This guide provides essential information for setting up and working with the Chatbots project.

## Prerequisites

- Node.js 16.x or later
- npm 8.x or later
- Docker 20.10+ and Docker Compose (for local development)
- AWS CLI (for deployment)

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/chatbots.git
   cd chatbots
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## Project Structure

```
chatbots/
├── src/                    # Source code
│   ├── api/                # API routes and controllers
│   ├── core/               # Core business logic
│   ├── integrations/       # Third-party integrations
│   ├── tests/              # Test files
│   └── utils/              # Utility functions
├── config/                 # Configuration files
├── docs/                   # Documentation
├── scripts/                # Utility scripts
└── .github/workflows/      # GitHub Actions workflows
```

## Development Workflow

### Running Tests

- **Unit tests**: `npm test:unit`
- **Integration tests**: `npm test:integration`
- **End-to-end tests**: `npm test:e2e`
- **All tests**: `npm test:all`
- **Watch mode**: `npm test:watch`

### Code Quality

- **Lint code**: `npm run lint`
- **Format code**: `npm run format`
- **Type checking**: `npm run type-check`
- **Security audit**: `npm run security:check`

### Docker Development

```bash
# Start services
npm run docker:compose:up

# Stop services
npm run docker:compose:down

# View logs
npm run docker:compose:logs
```

## Deployment

### Staging

```bash
# Deploy to staging
npm run deploy:staging

# Verify deployment
npm run deploy:verify -- --env=staging
```

### Production

```bash
# Deploy to production
npm run deploy:production

# Rollback if needed
npm run deploy:rollback
```

## Branching Strategy

- `main` - Production releases
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical production fixes

## Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

## Code Review Process

1. Create a pull request from your feature branch to `develop`
2. Ensure all tests pass
3. Update documentation if needed
4. Request review from at least one team member
5. Address all review comments
6. Merge when approved

## Troubleshooting

### Common Issues

- **Dependency issues**: Try `rm -rf node_modules package-lock.json && npm install`
- **Test failures**: Run `npm run test:ci` to identify the issue
- **Docker issues**: Ensure Docker is running and you have sufficient resources

### Getting Help

- Check the [documentation](docs/README.md)
- Search existing issues
- If you can't find an answer, open a new issue

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
