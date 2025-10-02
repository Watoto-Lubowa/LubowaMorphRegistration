# Lubowa Morph Registration - Vue Application

This is the modern Vue 3 + TypeScript + Vite + Tailwind CSS version of the Lubowa Morph Registration system.

## 🚀 Tech Stack

- **Vue 3** - Progressive JavaScript Framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Next Generation Frontend Tooling
- **Tailwind CSS** - Utility-first CSS Framework
- **Pinia** - Vue Store (State Management)
- **Vue Router** - Official Router for Vue.js
- **Firebase** - Backend as a Service (Auth + Firestore)
- **libphonenumber-js** - Phone number validation

## 📁 Project Structure

```
vue/
├── src/
│   ├── assets/          # Static assets
│   ├── components/      # Reusable Vue components
│   ├── config/          # Configuration files
│   ├── router/          # Vue Router configuration
│   ├── stores/          # Pinia stores
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   ├── views/           # Page components
│   └── main.ts          # Entry point
├── .env.example         # Environment template
└── package.json         # Dependencies
```

## 🛠️ Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and add your Firebase credentials.

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

## 📱 Features

- User authentication
- Member registration and search
- Admin panel with member management
- Phone validation with country codes
- Toast notifications
- Responsive design

## 🔐 Security

- Firebase Authentication
- Email-based authorization
- Protected admin routes
- Input validation

For more details, see the full documentation.
