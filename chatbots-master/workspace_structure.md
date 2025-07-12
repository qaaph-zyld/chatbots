# Chatbot Platform Workspace Structure

Last Updated: 2025-06-04 04:39:13

## Root Directory
- `.env` - Environment variables configuration file
- `.env.template` - Template for environment variables
- `.gitignore` - Git ignore configuration
- `.windsurf/` - Directory for Windsurf AI configuration
  - `rules/` - Directory for Windsurf rules
    - `changelog.md` - Changelog generation rules
- `Changelog.md` - Documentation of system changes
- `Changelog_new.md` - New changelog format example
- `README.md` - Project documentation
- `ROADMAP.md` - Project roadmap and planning
- `package.json` - Node.js package configuration
- `package-lock.json` - Node.js package lock file
- `run-tests.js` - Test runner script
- `test-results/` - Directory for test results
  - `manual-test-results.txt` - Results of manual tests
- `workspace_structure.md` - This file documenting workspace structure
- `workspace_structure_complete_example.md` - Example of complete workspace structure

## Source Code
- `src/` - Main source code directory
  - `analytics/` - Analytics module
    - `analytics.service.js` - Analytics service implementation
  - `api/` - API endpoints
    - `controllers/` - API controllers
    - `routes/` - API route definitions
    - `middleware/` - API middleware
  - `config/` - Configuration files
    - `index.js` - Configuration exports
    - `environment.js` - Environment configuration
    - `mongodb.js` - MongoDB configuration
    - `proxy.js` - Proxy configuration
    - `README.md` - Configuration documentation
  - `data/` - Data access layer
    - `analytics.repository.js` - Analytics repository
    - `base.repository.js` - Base repository class
    - `chatbot.repository.js` - Chatbot repository
    - `conversation.repository.js` - Conversation repository
    - `database.service.js` - Database service
    - `entity.repository.js` - Entity repository
    - `index.js` - Data layer exports
    - `preference.repository.js` - Preference repository
    - `topic.repository.js` - Topic repository
  - `models/` - Database models
    - `analytics.model.js` - Analytics model
    - `chatbot.model.js` - Chatbot model
    - `conversation.model.js` - Conversation model
    - `entity.model.js` - Entity model
    - `preference.model.js` - Preference model
    - `topic.model.js` - Topic model
  - `services/` - Business logic services
    - `analytics.service.js` - Analytics service
    - `chatbot.service.js` - Chatbot service
    - `conversation.service.js` - Conversation service
    - `entity.service.js` - Entity service
    - `preference.service.js` - Preference service
    - `topic.service.js` - Topic service
  - `tests/` - Test files
    - `scripts/` - Test scripts
      - `analytics-demo.js` - Analytics demo script
      - `entity-service-test.js` - Entity service test
      - `mongodb-connection-test.js` - MongoDB connection diagnostics
      - `simple-topic-test.js` - Simple topic test
      - `test-topic-repo.js` - Topic repository test
      - `topic-service-test.js` - Topic service test
    - `setup/` - Test setup files
      - `mock-factory.js` - Mock data factory
  - `utils/` - Utils Directory
    - `index.js` - Exports utility modules
    - `logger.js` - Logging utility
    - `validation.js` - Input validation utilities
    - `errors.js` - Error handling utilities
    - `mongo-connection-helper.js` - MongoDB connection diagnostics and utilities

## Documentation
- `docs/` - Documentation files
  - `entity-service-refactoring.md` - Entity service refactoring documentation
  - `mongodb-abstraction-refactoring-guide.md` - MongoDB abstraction refactoring guide
  - `proxy-centralization-implementation.md` - Proxy centralization documentation
  - `topic-service-refactoring.md` - Topic service refactoring documentation
  - `topic-service-refactoring-summary.md` - Topic service refactoring summary
