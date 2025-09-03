# Scripts

This folder contains build and utility scripts for the Lubowa Morph Registration system.

## Build Scripts

### `build.bat` 
Windows batch script for building and preparing the application for deployment.

**Usage**: 
```bash
.\scripts\build.bat
```

### `build.ps1`
PowerShell script for building the application with advanced options and error handling.

**Usage**:
```powershell
.\scripts\build.ps1
```

### `minify.ps1`
PowerShell script for minifying CSS and JavaScript files to optimize file sizes for production.

**Usage**:
```powershell
.\scripts\minify.ps1
```

### `minify.js`
Node.js script for advanced minification of CSS, JavaScript, and HTML files.

**Usage**:
```bash
node .\scripts\minify.js
```

### `build-obfuscate.js`
Node.js script for code obfuscation and advanced build optimization (currently empty - placeholder for future implementation).

## Script Types

- **Build Scripts**: Compile, bundle, and prepare the application (.bat, .ps1, .js)
- **Minification Scripts**: Optimize assets for production deployment
- **Obfuscation Scripts**: Code protection and advanced optimization
- **Utility Scripts**: Various development and maintenance tasks

## Requirements

- **Windows**: All scripts are designed for Windows environments
- **PowerShell**: Some scripts require PowerShell execution policy to be set appropriately
- **Node.js**: Build scripts may require Node.js for JavaScript processing

## Usage Notes

1. Run scripts from the project root directory
2. Ensure proper execution permissions for PowerShell scripts
3. Check script output for any errors or warnings
4. Scripts may modify files in the project directory

## Execution Policy

If you encounter PowerShell execution policy errors, you may need to run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
