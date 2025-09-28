// Local development Firebase configuration
// This file is for local testing only and should not be committed to production

console.log('🔧 Loading local development config');

window.APP_CONFIG = {
  firebase: {
    apiKey: "AIzaSyBB533JOkvbcF8zvyClb2noCZifQjUbJ2k",
    authDomain: "lubowamorphregistration.firebaseapp.com", 
    projectId: "lubowamorphregistration",
    storageBucket: "lubowamorphregistration.firebasestorage.app",
    messagingSenderId: "1011234595387",
    appId: "1:1011234595387:web:96c8b7e129f8cf2173321e",
    measurementId: "G-07PTV3DXG4"
  },
  authorizedAdminEmails: ["jeromessenyonjo@gmail.com"],
  authorizedUserEmails: ["jeromessenyonjo@gmail.com", "volunteer.lubowa@watotochurch.com", "denis.omoding@watotochurch.com"],
  authorizedPhoneNumbers: ["0700000000"]
};

console.log('✅ Local config loaded for project:', window.APP_CONFIG.firebase.projectId);
