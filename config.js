// Configuration file for Firebase and app settings
// This file will be populated by GitHub Actions with environment variables

window.APP_CONFIG = {
  firebase: {
    apiKey: "FIREBASE_API_KEY_PLACEHOLDER",
    authDomain: "FIREBASE_AUTH_DOMAIN_PLACEHOLDER",
    projectId: "FIREBASE_PROJECT_ID_PLACEHOLDER",
    storageBucket: "FIREBASE_STORAGE_BUCKET_PLACEHOLDER",
    messagingSenderId: "FIREBASE_MESSAGING_SENDER_ID_PLACEHOLDER",
    appId: "FIREBASE_APP_ID_PLACEHOLDER",
    measurementId: "FIREBASE_MEASUREMENT_ID_PLACEHOLDER"
  },
  authorizedAdminEmails: "AUTHORIZED_ADMIN_EMAILS_PLACEHOLDER".split(',').map(email => email.trim()),
  authorizedPhoneNumbers: "AUTHORIZED_PHONE_NUMBERS_PLACEHOLDER".split(',').map(phone => phone.trim())
};
