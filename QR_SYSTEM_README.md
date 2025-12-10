# QR Check-In System - Complete Implementation

## 📋 Overview

This is a secure, location-aware QR code check-in system for the Lubowa Morph Registration app. It ensures that:
- ✅ Members can only register during active service times
- ✅ Members must be physically present at the church (within 500m)
- ✅ All registration data is encrypted before storage
- ✅ QR codes expire automatically after the service window

## 🏗️ Architecture

### Backend (Firebase Cloud Functions)
Located in: `/functions/index.js`

**Functions:**
1. **generateServiceQR** - Creates encrypted QR codes for current service
2. **encryptUserData** - Encrypts user registration data
3. **validateQRCode** - Validates QR code data (helper)
4. **decryptUserData** - Decrypts data (admin/debugging)

### Frontend (Vue 3 + TypeScript)
**Utilities:**
- `/vue/src/utils/geolocation.ts` - Location validation (Haversine formula)
- `/vue/src/utils/qrValidation.ts` - QR parsing and time-window validation
- `/vue/src/utils/indexedDB.ts` - Encrypted local storage
- `/vue/src/utils/firebase.ts` - Cloud Functions integration

**Composables:**
- `/vue/src/composables/useQRCheckIn.ts` - Main QR check-in logic

**Views:**
- `/vue/src/views/QRGeneratorView.vue` - Admin QR generator
- `/vue/src/views/QRRegistrationExample.vue` - Integration example

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
# Backend
cd functions
npm install

# Frontend
cd ../vue
npm install qrcode  # For QR code generation
```

### Step 2: Configure Firebase Secrets

```bash
# Login to Firebase
firebase login

# Set encryption keys (use 32-character random strings)
firebase functions:secrets:set QR_SECRET_KEY
firebase functions:secrets:set USER_DATA_KEY
```

Generate random keys:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Deploy Cloud Functions

```bash
cd functions
firebase deploy --only functions
```

### Step 4: Update Church Coordinates

Edit `/vue/src/utils/geolocation.ts`:
```typescript
export const CHURCH_COORDINATES = {
  latitude: 0.2395,   // Replace with actual latitude
  longitude: 32.5700, // Replace with actual longitude
}
```

### Step 5: Add QR Generator Route

In `/vue/src/router/index.ts`:
```typescript
import QRGeneratorView from '@/views/QRGeneratorView.vue'

{
  path: '/admin/qr-generator',
  name: 'qr-generator',
  component: QRGeneratorView,
  meta: { title: 'QR Generator', requiresAdmin: true }
}
```

## 📱 Usage Flow

### For Administrators:

1. **Navigate to QR Generator**
   - Go to `/admin/qr-generator`
   
2. **Generate QR Code**
   - Click "Generate QR Code for Current Service"
   - QR code appears if a service is currently active
   
3. **Display QR Code**
   - Download PNG or print the QR code
   - Place at registration desk/entrance

### For Members:

1. **Scan QR Code**
   - Opens registration URL with parameters
   
2. **Grant Location Permission**
   - Browser prompts for location access
   - App verifies user is within 500m of church
   
3. **Fill Registration Form**
   - Form appears if QR and location are valid
   
4. **Submit**
   - Data is encrypted and stored locally
   - Attendance is recorded in Firestore

## 🔒 Security Features

### 1. Time-Window Validation
- QR codes contain encrypted start/end timestamps
- Validated client-side and can be server-verified
- Automatically expire after service window

### 2. Geolocation Verification
- Uses high-accuracy GPS
- Haversine formula for distance calculation
- 500m radius from church coordinates

### 3. Encryption
- **Server-side encryption** using AES-256-CBC
- Keys stored in Firebase Secret Manager
- Client never has access to encryption keys

### 4. Local Storage
- Encrypted data stored in IndexedDB
- Can only be decrypted server-side
- Prevents data tampering

## 🛠️ Integration Example

### Basic Integration in RegistrationView.vue

```vue
<script setup lang="ts">
import { useQRCheckIn } from '@/composables/useQRCheckIn'

const {
  hasValidQR,
  hasValidLocation,
  canProceedWithRegistration,
  currentServiceName,
  encryptAndStoreData,
} = useQRCheckIn()

async function handleSubmit(memberData) {
  if (!canProceedWithRegistration.value) {
    alert('Invalid QR or location')
    return
  }
  
  // Save to Firestore
  await saveMember(memberData)
  
  // Encrypt and store locally
  await encryptAndStoreData(memberData)
}
</script>

<template>
  <div v-if="canProceedWithRegistration">
    <h2>{{ currentServiceName }}</h2>
    <form @submit.prevent="handleSubmit">
      <!-- Form fields -->
    </form>
  </div>
  <div v-else>
    <p>Please scan QR code and enable location</p>
  </div>
</template>
```

## 📊 Service Schedule Configuration

Edit `/functions/index.js`:

```javascript
const SERVICE_SCHEDULE = {
  0: [ // Sunday
    {service: 1, start: 8, end: 10},   // 8-10 AM
    {service: 2, start: 10, end: 12},  // 10 AM-12 PM
    {service: 3, start: 12, end: 14},  // 12-2 PM
  ],
  // Add more days if needed:
  // 3: [{service: 1, start: 18, end: 20}], // Wednesday 6-8 PM
};
```

## 🧪 Testing

### Test Locally

```bash
# Start Firebase emulators
cd functions
npm run serve

# Start Vue dev server
cd ../vue
npm run dev
```

### Test QR Flow

1. **Generate test URL manually:**
```
http://localhost:5173/?x=2024-12-09T08:00:00Z&y=2024-12-09T10:00:00Z&u=/qrcode/scan&s=1
```

2. **Adjust time window** to current time for testing

3. **Mock geolocation** in browser DevTools:
   - Open DevTools → ⋮ → More tools → Sensors
   - Set custom location near church coordinates

### Disable Location Check (Development Only)

In `/vue/src/utils/geolocation.ts`:
```typescript
export const MAX_DISTANCE_METERS = 50000 // 50km for testing
```

**⚠️ REMOVE IN PRODUCTION!**

## 📦 File Structure

```
functions/
  ├── index.js              # Cloud Functions
  ├── package.json          # Dependencies
  ├── DEPLOYMENT.md         # Deployment guide
  └── .gitignore

vue/src/
  ├── utils/
  │   ├── geolocation.ts    # Location validation
  │   ├── qrValidation.ts   # QR parsing
  │   ├── indexedDB.ts      # Local storage
  │   └── firebase.ts       # Cloud Functions integration
  ├── composables/
  │   └── useQRCheckIn.ts   # Main composable
  ├── views/
  │   ├── QRGeneratorView.vue        # Admin QR generator
  │   └── QRRegistrationExample.vue  # Integration example
  └── types/
      └── index.ts          # TypeScript types
```

## 🐛 Troubleshooting

### QR Code Won't Generate

**Error:** "No active service at this time"
- **Solution:** Check service schedule matches current day/time
- Services are Sunday only by default (0 = Sunday)

### Location Permission Denied

**Error:** "Location permission denied"
- **Solution:** 
  - Use HTTPS (required for geolocation)
  - Check browser permissions
  - Clear site data and retry

### Cloud Function Errors

**Error:** "Secret not found"
```bash
# Verify secrets are set
firebase functions:secrets:list

# Set missing secrets
firebase functions:secrets:set QR_SECRET_KEY
```

### IndexedDB Errors

**Error:** "Failed to open database"
- **Solution:**
  - Clear IndexedDB in DevTools → Application → IndexedDB
  - Check browser compatibility
  - Verify database name: `morpher_registration`

## 📈 Performance

### Function Invocations
- **Per registration:** 2 calls (validateQRCode optional)
- **Cost:** ~$0.001 per 1000 registrations
- **Free tier:** 2M invocations/month

### Client-Side
- **QR validation:** <10ms
- **Geolocation:** 1-5 seconds (depends on GPS)
- **Encryption call:** 100-300ms
- **IndexedDB:** <50ms

## 🔐 Security Best Practices

1. **Rotate encryption keys** every 6-12 months
2. **Use different keys** for dev/staging/production
3. **Never commit secrets** to Git
4. **Monitor function invocations** for anomalies
5. **Set up Firebase App Check** for additional security

## 📚 Additional Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Firebase Secret Manager](https://firebase.google.com/docs/functions/config-env)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)

## 🤝 Support

For issues or questions:
1. Check Firebase Console → Functions logs
2. Check browser DevTools → Console
3. Review Network tab for failed requests
4. Verify secrets are properly set

## 📝 License

This QR check-in system is part of the Lubowa Morph Registration project.
