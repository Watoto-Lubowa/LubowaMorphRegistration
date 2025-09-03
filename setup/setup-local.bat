@echo off
REM Local development setup script for Windows
echo Setting up local development environment...

echo Creating local config file...
echo // Local development configuration > config-local.js
echo // Copy your Firebase config here for local development >> config-local.js
echo window.APP_CONFIG = { >> config-local.js
echo   firebase: { >> config-local.js
echo     apiKey: "YOUR_API_KEY_HERE", >> config-local.js
echo     authDomain: "YOUR_PROJECT.firebaseapp.com", >> config-local.js
echo     projectId: "YOUR_PROJECT_ID", >> config-local.js
echo     storageBucket: "YOUR_PROJECT.firebasestorage.app", >> config-local.js
echo     messagingSenderId: "YOUR_SENDER_ID", >> config-local.js
echo     appId: "YOUR_APP_ID", >> config-local.js
echo     measurementId: "YOUR_MEASUREMENT_ID" >> config-local.js
echo   }, >> config-local.js
echo   authorizedAdminEmails: ["admin@example.com"], >> config-local.js
echo   authorizedPhoneNumbers: ["+256700123456"] >> config-local.js
echo }; >> config-local.js

echo.
echo Local config file created: config-local.js
echo Please edit this file with your actual Firebase configuration.
echo.
echo To use the local config, temporarily replace config.js with config-local.js
echo in your HTML files for local development.
echo.
pause
