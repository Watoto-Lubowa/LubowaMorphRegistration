# Quick Start Guide

## Prerequisites
- Node.js v20.x or higher
- npm or yarn
- Firebase project with Firestore and Authentication enabled

## Installation

1. **Navigate to the vue folder:**
   ```bash
   cd vue
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env and add your Firebase credentials
   # You can find these in your Firebase Console
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:5173`

## Project Structure

```
vue/
├── src/
│   ├── components/         # Reusable components
│   ├── views/             # Page components
│   ├── stores/            # Pinia stores
│   ├── router/            # Vue Router
│   ├── utils/             # Helper functions
│   ├── types/             # TypeScript types
│   └── config/            # App configuration
├── .env                   # Environment variables (create this)
├── .env.example           # Environment template
└── package.json           # Dependencies
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Check TypeScript types

## Firebase Setup

1. **Create a Firebase project** at https://console.firebase.google.com/

2. **Enable Authentication:**
   - Go to Authentication > Sign-in method
   - Enable Email/Password

3. **Create Firestore Database:**
   - Go to Firestore Database
   - Create database in production mode
   - Update security rules as needed

4. **Get your config:**
   - Go to Project Settings > General
   - Scroll to "Your apps" section
   - Copy the Firebase configuration
   - Add to `.env` file

## Routes

- `/` - Member Registration (requires user authentication)
- `/admin` - Admin Panel (requires admin authentication)

## Authorization

Add authorized emails to your `.env` file:

```env
VITE_AUTHORIZED_USER_EMAILS=user1@example.com,user2@example.com
VITE_AUTHORIZED_ADMIN_EMAILS=admin@example.com
```

Users must be created in Firebase Authentication before they can sign in.

## Common Issues

### Port already in use
If port 5173 is already in use, Vite will automatically try the next available port.

### Firebase not initialized
Make sure your `.env` file exists and has the correct Firebase credentials.

### Build errors
Run `npm run type-check` to see TypeScript errors.

## Next Steps

1. Customize the theme in `tailwind.config.js`
2. Add your branding/logo
3. Configure Firebase security rules
4. Deploy to production

## Support

For more detailed information, see:
- `README.md` - Full documentation
- `MIGRATION_GUIDE.md` - Migration from vanilla JS
