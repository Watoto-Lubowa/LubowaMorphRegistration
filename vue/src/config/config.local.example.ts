/**
 * Local Development Configuration
 * 
 * This file provides local Firebase configuration for development and testing.
 * It's an alternative to using .env.local file.
 * 
 * IMPORTANT: This file should be in .gitignore and never committed to production!
 * 
 * Usage:
 * 1. Rename this file to `config.local.ts` (remove .example)
 * 2. Use this config in development by importing it instead of the default config
 * 3. To use this config, update src/config/index.ts to import from here
 */

import type { AppConfig } from '@/types'

export const localConfig: AppConfig = {
  firebase: {
    apiKey: "AIzaSyBB533JOkvbcF8zvyClb2noCZifQjUbJ2k",
    authDomain: "lubowamorphregistration.firebaseapp.com",
    projectId: "lubowamorphregistration",
    storageBucket: "lubowamorphregistration.firebasestorage.app",
    messagingSenderId: "1011234595387",
    appId: "1:1011234595387:web:96c8b7e129f8cf2173321e",
    measurementId: "G-07PTV3DXG4"
  },
  authorizedAdminEmails: [
    "jeromessenyonjo@gmail.com"
  ],
  authorizedUserEmails: [
    "jeromessenyonjo@gmail.com",
    "volunteer.lubowa@watotochurch.com",
    "denis.omoding@watotochurch.com"
  ],
  authorizedPhoneNumbers: [
    "0700000000"
  ]
}

console.log('🔧 Local TypeScript config loaded for project:', localConfig.firebase.projectId)
