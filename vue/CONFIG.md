# Configuration Guide

This document explains how to configure the Vue application for different environments.

## Configuration Methods

The application supports **two methods** for configuration:

### Method 1: Environment Variables (Recommended for Production)

Create a `.env.local` file in the `vue/` directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Authorization
VITE_AUTHORIZED_ADMIN_EMAILS=admin@example.com,admin2@example.com
VITE_AUTHORIZED_USER_EMAILS=user@example.com,user2@example.com
VITE_AUTHORIZED_PHONE_NUMBERS=+256700000000
```

### Method 2: TypeScript Config File (For Local Development)

The app already includes `src/config/config.local.ts` with your local Firebase configuration.

**Priority:** If `config.local.ts` exists, it will be used instead of environment variables.

## Configuration Loading Order

1. **config.local.ts** (highest priority) - TypeScript file with direct configuration
2. **.env.local** - Environment variables for local development
3. **.env** - Default environment variables (committed to repo)
4. **Placeholders** - Fallback values if nothing is configured

## Current Setup

✅ **Already configured for you:**
- `.env.local` - Contains your Firebase credentials
- `src/config/config.local.ts` - TypeScript version of the config
- Both files are in `.gitignore` and won't be committed

## Testing the Configuration

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Check the console:**
   - You should see: `"✅ Using local TypeScript configuration"`
   - Or: `"✅ Using environment variable configuration"`

3. **Verify Firebase connection:**
   - Open `http://localhost:5173`
   - Try to sign in with: `jeromessenyonjo@gmail.com`

## Switching Configuration Methods

### Use TypeScript Config (Current Default)
- Keep `src/config/config.local.ts` as is
- This is already set up for you

### Use Environment Variables Instead
- Delete or rename `src/config/config.local.ts`
- The app will automatically fall back to `.env.local`

### Use Production Config
- Remove both `config.local.ts` and `.env.local`
- Set environment variables in your deployment platform
- Or use `.env.production` for build-time variables

## Security Notes

🔒 **NEVER commit these files:**
- `.env.local`
- `src/config/config.local.ts`
- Any file with real Firebase credentials

✅ **Safe to commit:**
- `.env.example` - Template without real credentials
- `src/config/config.local.example.ts` - Example template

## Troubleshooting

### "Firebase not initialized" error
- Check that your config files exist
- Verify Firebase credentials are correct
- Check browser console for config loading messages

### "Access denied" error
- Verify your email is in `authorizedAdminEmails` or `authorizedUserEmails`
- Check that the email matches exactly (case-sensitive)
- Make sure the user exists in Firebase Authentication

### Config not loading
- Clear browser cache and reload
- Check terminal for error messages
- Verify file paths are correct

## Production Deployment

For production, use environment variables:

1. **Remove local config files** (they're only for development)
2. **Set environment variables** in your hosting platform:
   - Netlify: Site settings > Environment variables
   - Vercel: Project settings > Environment Variables
   - Firebase Hosting: Use `.env.production`

3. **Build the app:**
   ```bash
   npm run build
   ```

The build process will use `.env.production` or environment variables from your CI/CD system.

## Example: Adding a New Admin

Edit either:

**Option A: config.local.ts**
```typescript
authorizedAdminEmails: [
  "jeromessenyonjo@gmail.com",
  "newadmin@example.com"  // Add here
]
```

**Option B: .env.local**
```env
VITE_AUTHORIZED_ADMIN_EMAILS=jeromessenyonjo@gmail.com,newadmin@example.com
```

Then restart the dev server.

## Files Reference

| File | Purpose | Committed? |
|------|---------|-----------|
| `.env.example` | Template | ✅ Yes |
| `.env.local` | Local dev config | ❌ No |
| `.env.production` | Production config | ✅ Yes (no secrets) |
| `src/config/index.ts` | Config loader | ✅ Yes |
| `src/config/config.local.ts` | Local TS config | ❌ No |
| `src/config/config.local.example.ts` | TS template | ✅ Yes |
