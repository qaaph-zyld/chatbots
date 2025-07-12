# Development Environment Setup

This guide will help you set up your development environment for the Chatbots project.

## Prerequisites

- Windows 10/11 (64-bit)
- PowerShell 5.1 or later
- Administrator access (required for software installation)

## Quick Start

1. **Open PowerShell as Administrator**
   - Right-click on the Start menu
   - Select "Windows PowerShell (Admin)" or "Terminal (Admin)"
   - Click "Yes" when prompted by User Account Control

2. **Run the setup script**
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force
   .\scripts\setup-dev.ps1
   ```

3. **Restart your terminal** after the script completes to ensure all environment variables are loaded.

## Manual Installation

If you prefer to install the tools manually, follow these steps:

### 1. Install Node.js and npm

1. Download and install Node.js LTS (v18.x) from [nodejs.org](https://nodejs.org/)
2. Verify the installation:
   ```
   node --version
   npm --version
   ```

### 2. Install Git

1. Download and install Git from [git-scm.com](https://git-scm.com/)
2. Configure your Git identity:
   ```
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

### 3. Install Docker Desktop

1. Download and install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/)
2. Start Docker Desktop and sign in if prompted
3. Enable Kubernetes in Docker Desktop settings if needed

### 4. Install Visual Studio Code

1. Download and install VS Code from [code.visualstudio.com](https://code.visualstudio.com/)
2. Install recommended extensions:
   - ESLint
   - Prettier
   - Jest
   - Docker
   - YAML

### 5. Install Project Dependencies

1. Navigate to the project directory
2. Run:
   ```
   npm install
   ```

## Environment Variables

1. Copy the example environment file:
   ```
   cp .env.example .env
   ```
2. Update the `.env` file with your configuration

## Running the Application

- **Development server**: `npm run dev`
- **Production build**: `npm run build`
- **Production server**: `npm start`

## Testing

- **Run all tests**: `npm test`
- **Run unit tests**: `npm run test:unit`
- **Run integration tests**: `npm run test:integration`
- **Run E2E tests**: `npm run test:e2e`

## Troubleshooting

### Node.js installation issues
- Ensure you have the latest Windows updates installed
- Try uninstalling any existing Node.js versions before reinstalling
- Check that Node.js is added to your system PATH

### Docker issues
- Make sure Docker Desktop is running
- Run Docker Desktop as administrator
- Check that virtualization is enabled in your BIOS

### Permission errors
- Run your terminal as administrator when installing global packages
- Check file permissions if you encounter access denied errors

## Getting Help

If you encounter any issues during setup, please:
1. Check the [Troubleshooting](#troubleshooting) section
2. Search the project's issue tracker
3. Open a new issue if your problem isn't already reported

## Next Steps

- Read the [DEVELOPMENT.md](DEVELOPMENT.md) guide
- Review the [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) if you're updating from an older version
- Check out the [API documentation](docs/API.md)
