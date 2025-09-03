# Setup Scripts

This folder contains setup and configuration scripts for the Lubowa Morph Registration system.

## Setup Scripts

### `setup-local.bat`
Windows batch script for setting up the local development environment.

**Purpose**:
- Install required dependencies
- Configure local environment variables
- Set up database connections
- Initialize project configuration

**Usage**: 
```bash
.\setup\setup-local.bat
```

### `api-key-example.js` (if present)
Example configuration file showing the structure for API keys and credentials.

**Purpose**:
- Template for setting up API credentials
- Example of proper configuration format
- Security guidance for credential management

**What it does**:
- Checks for required software (Node.js, etc.)
- Installs npm dependencies
- Sets up local configuration files
- Initializes Firebase configuration
- Creates necessary directories
- Sets appropriate permissions

## Setup Process

1. **Prerequisites Check**: Verifies required software is installed
2. **Dependency Installation**: Downloads and installs project dependencies
3. **Configuration**: Sets up local configuration files
4. **Environment Setup**: Configures environment variables
5. **Database Setup**: Initializes database connections and schemas
6. **Verification**: Tests that setup completed successfully

## Requirements

- **Windows**: Scripts are designed for Windows environments
- **Administrator Rights**: Some setup operations may require elevated privileges
- **Internet Connection**: Required for downloading dependencies
- **Node.js**: Required for JavaScript dependencies
- **Firebase CLI**: Required for Firebase integration

## Troubleshooting

- **Permission Errors**: Run as Administrator if needed
- **Network Issues**: Check firewall and proxy settings
- **Missing Dependencies**: Ensure all prerequisites are installed
- **Configuration Errors**: Check environment variables and config files

## First-Time Setup

For new developers or fresh installations:

1. Clone the repository
2. Run `.\setup\setup-local.bat`
3. Follow any additional prompts
4. Verify setup by running the application
5. Check logs for any issues

## Environment Configuration

The setup script will help configure:
- Firebase credentials
- Database connection strings
- API keys and secrets
- Local development ports
- Security settings
