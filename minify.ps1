#!/usr/bin/env pwsh

Write-Host "🚀 Lubowa Morph Registration - Minification Script" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not available." -ForegroundColor Red
    exit 1
}

# Install dependencies if they don't exist
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies." -ForegroundColor Red
        exit 1
    }
}

# Run minification
Write-Host "🔧 Starting minification process..." -ForegroundColor Yellow
node minify.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 Minification completed successfully!" -ForegroundColor Green
    Write-Host "📂 Minified files are available in the ./dist directory" -ForegroundColor Green
    Write-Host "🚀 Your application is now optimized for deployment!" -ForegroundColor Green
    
    # Ask user if they want to open the dist folder
    $openFolder = Read-Host "`n🔍 Would you like to open the dist folder? (y/n)"
    if ($openFolder -eq 'y' -or $openFolder -eq 'Y') {
        if (Test-Path "./dist") {
            Invoke-Item "./dist"
        }
    }
} else {
    Write-Host "❌ Minification failed. Please check the errors above." -ForegroundColor Red
    exit 1
}

Write-Host "`n✨ Thank you for using the minification script!" -ForegroundColor Magenta
