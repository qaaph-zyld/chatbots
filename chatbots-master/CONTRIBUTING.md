# Contributing to Open-Source Chatbots Platform

Thank you for your interest in contributing to the Open-Source Chatbots Platform! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Your First Code Contribution](#your-first-code-contribution)
  - [Pull Requests](#pull-requests)
- [Development Process](#development-process)
  - [Setting Up the Development Environment](#setting-up-the-development-environment)
  - [Coding Standards](#coding-standards)
  - [Testing](#testing)
  - [Documentation](#documentation)
- [Community](#community)
  - [Communication Channels](#communication-channels)
  - [Project Structure](#project-structure)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [project-admin@opensource-chatbots.org](mailto:project-admin@opensource-chatbots.org).

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

**Before Submitting A Bug Report:**
- Check the [issues](https://github.com/Pavleee23/chatbots/issues) to see if the bug has already been reported.
- Perform a quick search to see if the problem has been reported already.

**How to Submit A Good Bug Report:**
- Use a clear and descriptive title.
- Describe the exact steps to reproduce the problem.
- Provide specific examples to demonstrate the steps.
- Describe the behavior you observed after following the steps.
- Explain which behavior you expected to see instead and why.
- Include screenshots or animated GIFs if possible.
- Include details about your configuration and environment.

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion, including completely new features and minor improvements to existing functionality.

**Before Submitting An Enhancement Suggestion:**
- Check if the enhancement has already been suggested.
- Determine which repository the enhancement should be suggested in.

**How to Submit A Good Enhancement Suggestion:**
- Use a clear and descriptive title.
- Provide a step-by-step description of the suggested enhancement.
- Provide specific examples to demonstrate the steps.
- Describe the current behavior and explain which behavior you expected to see instead.
- Explain why this enhancement would be useful to most users.
- List some other applications where this enhancement exists, if applicable.

### Your First Code Contribution

Unsure where to begin contributing? You can start by looking through these `beginner` and `help-wanted` issues:

* [Beginner issues](https://github.com/Pavleee23/chatbots/labels/beginner) - issues which should only require a few lines of code.
* [Help wanted issues](https://github.com/Pavleee23/chatbots/labels/help%20wanted) - issues which should be a bit more involved than `beginner` issues.

### Pull Requests

The process described here has several goals:
- Maintain the project's quality
- Fix problems that are important to users
- Engage the community in working toward the best possible solution
- Enable a sustainable system for maintainers to review contributions

Please follow these steps to have your contribution considered by the maintainers:

1. Follow all instructions in [the template](PULL_REQUEST_TEMPLATE.md)
2. Follow the [styleguides](#coding-standards)
3. After you submit your pull request, verify that all [status checks](https://help.github.com/articles/about-status-checks/) are passing

While the prerequisites above must be satisfied prior to having your pull request reviewed, the reviewer(s) may ask you to complete additional design work, tests, or other changes before your pull request can be ultimately accepted.

## Development Process

### Setting Up the Development Environment

To set up the development environment:

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/chatbots.git
   ```
3. Install dependencies:
   ```bash
   cd chatbots
   npm install
   ```
4. Create a new branch for your changes:
   ```bash
   git checkout -b my-branch-name
   ```

### Coding Standards

#### JavaScript

- We use ESLint and Prettier to enforce coding standards
- Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use ES6+ features when appropriate
- Add JSDoc comments for all functions and classes

#### CSS

- Use CSS variables for colors, spacing, etc.
- Follow BEM naming convention for classes

#### Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line
- Consider starting the commit message with an applicable emoji:
  - 🎨 `:art:` when improving the format/structure of the code
  - 🐎 `:racehorse:` when improving performance
  - 🚱 `:non-potable_water:` when plugging memory leaks
  - 📝 `:memo:` when writing docs
  - 🐛 `:bug:` when fixing a bug
  - 🔥 `:fire:` when removing code or files
  - 💚 `:green_heart:` when fixing the CI build
  - ✅ `:white_check_mark:` when adding tests
  - 🔒 `:lock:` when dealing with security
  - ⬆️ `:arrow_up:` when upgrading dependencies
  - ⬇️ `:arrow_down:` when downgrading dependencies
  - 👕 `:shirt:` when removing linter warnings

### Testing

- Write tests for all new features and bug fixes
- Maintain at least 80% code coverage
- Run the test suite before submitting a pull request:
  ```bash
  npm test
  ```

### Documentation

- Update the documentation with details of changes to the interface
- Update the README.md with details of changes to the functionality
- Add JSDoc comments for all functions, classes, and methods

## Community

### Communication Channels

- [GitHub Discussions](https://github.com/Pavleee23/chatbots/discussions) - For general questions and discussions
- [Discord Server](https://discord.gg/opensource-chatbots) - For real-time chat and collaboration
- [Community Forum](https://forum.opensource-chatbots.org) - For longer discussions and announcements

### Project Structure

The project is organized into the following main directories:

- `src/` - Source code
  - `controllers/` - API controllers
  - `models/` - Data models
  - `routes/` - API routes
  - `services/` - Business logic
  - `utils/` - Utility functions
- `tests/` - Test files
  - `unit/` - Unit tests
  - `integration/` - Integration tests
  - `acceptance/` - Acceptance tests
- `docs/` - Documentation
- `website/` - Project website
- `scripts/` - Utility scripts

## License

By contributing to the Open-Source Chatbots Platform, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
