# Lubowa Morph Registration

A church registration system with Firebase authentication and data management capabilities.

## Features

- **Main Registration Form**: Allow morphers to register with identity verification
- **Admin Panel**: Secure admin access with email/password authentication
- **CSV Management**: Upload and download member data
- **Firebase Integration**: Real-time database and authentication
- **Responsive Design**: Works on desktop and mobile devices

## Admin Authentication

The admin panel uses Firebase email/password authentication for secure access:

- **Password Authentication**: Secure login with email and password
- **Password Reset**: Forgot password functionality via email
- **Authorized Emails**: Only pre-authorized email addresses can access admin functions
- **Session Management**: Automatic sign-out and session handling

### Setting up Admin Users

To create admin users, you need to:

1. **Create Firebase Users**: Use Firebase Console or Firebase Admin SDK to create user accounts
2. **Add to Authorized List**: Include their email addresses in the `AUTHORIZED_ADMIN_EMAILS` secret
3. **Set Passwords**: Users can set their passwords during account creation or use password reset

## GitHub Pages Deployment

This application is configured to automatically deploy to GitHub Pages using GitHub Actions.

### Setting up GitHub Secrets

Before deploying, you need to configure the following secrets in your GitHub repository:

1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Add the following repository secrets:

#### Firebase Configuration Secrets
- `FIREBASE_API_KEY`: Your Firebase API key
- `FIREBASE_AUTH_DOMAIN`: Your Firebase auth domain (e.g., `yourproject.firebaseapp.com`)
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket
- `FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID
- `FIREBASE_APP_ID`: Your Firebase app ID
- `FIREBASE_MEASUREMENT_ID`: Your Firebase measurement ID (for Analytics)

#### Authorization Configuration Secrets
- `AUTHORIZED_ADMIN_EMAILS`: Comma-separated list of authorized admin emails (e.g., `admin@example.com,pastor@example.com`)
- `AUTHORIZED_PHONE_NUMBERS`: Comma-separated list of authorized admin phone numbers (e.g., `+256700123456,+256701234567`)

### Deployment Process

1. **Push to Main Branch**: The deployment will automatically trigger when you push changes to the `main` or `master` branch.

2. **GitHub Actions Workflow**: The workflow will:
   - Check out your code
   - Replace configuration placeholders with your secrets
   - Build the site using Jekyll
   - Deploy to GitHub Pages

3. **Access Your Site**: Once deployed, your site will be available at:
   `https://yourusername.github.io/LubowaMorphRegistration`

### Local Development

For local development, the app will fall back to the hardcoded configuration values in the JavaScript files. Make sure to update these with your actual Firebase configuration before deployment.

### Files Structure

```
├── main.html          # Main registration form
├── admin.html         # Admin panel
├── scripts.js         # Main application logic
├── admin.js          # Admin panel logic
├── config.js         # Configuration template (populated by CI)
├── styles.css        # Main styles
├── admin-styles.css  # Admin panel styles
├── minify.js         # Minification script
├── minify.ps1        # PowerShell minification script
├── package.json      # Node.js dependencies for minification
└── .github/workflows/deploy.yml  # GitHub Actions workflow with minification
```

## Code Minification & Obfuscation

The application includes automated minification and obfuscation to protect your code:

### Automatic Minification (GitHub Pages)
- **JavaScript**: Compressed and obfuscated using Terser with variable mangling
- **CSS**: Minified using clean-css-cli  
- **HTML**: Compressed with html-minifier-terser
- **Security**: Console logs and debugger statements removed
- **Size Reduction**: Typically 60-80% smaller file sizes

### Local Minification

#### Option 1: PowerShell Script (Windows)
```powershell
.\minify.ps1
```

#### Option 2: Node.js Script (Cross-platform)
```bash
# Install Node.js dependencies
npm install

# Run minification
npm run minify
# or
node minify.js
```

#### Option 3: Individual Commands
```bash
# Minify JavaScript
npm run minify:js

# Minify CSS  
npm run minify:css

# Minify HTML
npm run minify:html
```

### Minification Features
- **JavaScript Obfuscation**: Variable names mangled for security
- **Dead Code Removal**: Unused code eliminated
- **Comment Removal**: All comments stripped
- **Whitespace Compression**: Minimal file sizes
- **Console Log Removal**: Debug statements removed
- **File Size Reporting**: Shows compression statistics

### Security Notes

- Never commit actual Firebase keys or sensitive data to the repository
- Use GitHub secrets for all sensitive configuration
- Ensure your Firebase security rules are properly configured
- Regularly review and update authorized email/phone lists
- Minified code makes reverse engineering much more difficult

### Troubleshooting

1. **Deployment Fails**: Check that all required secrets are set in your repository
2. **Firebase Errors**: Verify your Firebase configuration and security rules
3. **Authentication Issues**: Ensure authorized emails/phones are correctly configured in secrets

## Local Setup

If you want to run this locally:

1. Clone the repository
2. Update the Firebase configuration in `scripts.js` and `admin.js`
3. Update the authorized emails/phone numbers
4. Serve the files using a local server (e.g., `python -m http.server`)

## Support

For issues or questions, please open an issue in the GitHub repository.
