# QR Check-In System - Setup Guide

## Overview

This secure QR-code-based check-in system validates user location and service timing before allowing registration. It uses Firebase Cloud Functions for encryption and IndexedDB for local storage.

## Architecture

### Backend (Firebase Cloud Functions)

**Location:** `/functions/index.js`

**Functions:**
1. `generateServiceQR` - Creates encrypted QR codes for current service
2. `encryptUserData` - Encrypts user registration data
3. `validateQRCode` - Validates QR code data (helper)
4. `decryptUserData` - Decrypts data (admin/debugging)

### Frontend (Vue 3 + TypeScript)

**Key Files:**
- `/vue/src/utils/geolocation.ts` - Location validation
- `/vue/src/utils/qrValidation.ts` - QR parsing and validation
- `/vue/src/utils/indexedDB.ts` - Local encrypted storage
- `/vue/src/composables/useQRCheckIn.ts` - Main composable
- `/vue/src/utils/firebase.ts` - Cloud Functions integration

## Installation

### Step 1: Install Dependencies

#### Backend (Cloud Functions)
```bash
cd functions
npm install
```

#### Frontend (Vue)
```bash
cd vue
npm install
```

### Step 2: Configure Firebase Secrets

You need to set two secret keys in Firebase Secret Manager:

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Set QR_SECRET_KEY (for QR code encryption)
firebase functions:secrets:set QR_SECRET_KEY

# Set USER_DATA_KEY (for user data encryption)
firebase functions:secrets:set USER_DATA_KEY
```

**Important:** Use strong, random 32-character keys. Example:
```bash
# Generate random keys (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Deploy Cloud Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific function
firebase deploy --only functions:generateServiceQR
firebase deploy --only functions:encryptUserData
```

## Configuration

### Service Schedule

Edit `/functions/index.js` to configure service times:

```javascript
const SERVICE_SCHEDULE = {
  0: [ // Sunday (0 = Sunday)
    {service: 1, start: 8, end: 10},   // 8am - 10am
    {service: 2, start: 10, end: 12},  // 10am - 12pm
    {service: 3, start: 12, end: 14},  // 12pm - 2pm
  ],
};
```

### Church Location

Edit `/vue/src/utils/geolocation.ts`:

```typescript
export const CHURCH_COORDINATES = {
  latitude: 0.2395,   // Replace with actual coordinates
  longitude: 32.5700, // Replace with actual coordinates
}

export const MAX_DISTANCE_METERS = 500 // Adjust radius as needed
```

## Usage

### Generating QR Codes

**Option 1: Via Cloud Function (Admin)**
```javascript
import { generateServiceQR } from '@/utils/firebase'

const result = await generateServiceQR()
console.log(result.qrData) // Use this for QR code generation
console.log(result.serviceInfo) // Service details
```

**Option 2: Create Admin Tool**
Create a simple admin page that:
1. Calls `generateServiceQR()`
2. Displays QR code using library like `qrcode.js` or `vue-qrcode`
3. Prints QR codes for display at church

### Registration Flow

1. **User scans QR code** → Opens URL with params `?x=...&y=...&u=...&s=...`
2. **App validates QR** → Checks if within service time window
3. **App checks location** → Verifies user is within 500m of church
4. **User fills form** → Enters registration details
5. **Data encrypted** → Sent to cloud function for encryption
6. **Data stored** → Encrypted data saved to IndexedDB

### Integration in Vue Component

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
    alert('QR or location validation failed')
    return
  }
  
  const recordId = await encryptAndStoreData(memberData)
  if (recordId) {
    console.log('Stored with ID:', recordId)
  }
}
</script>

<template>
  <div v-if="hasValidQR && hasValidLocation">
    <h2>{{ currentServiceName }}</h2>
    <!-- Registration form here -->
  </div>
  <div v-else>
    <p>Please scan a valid QR code and enable location</p>
  </div>
</template>
```

## Security Features

### 1. Server-Side Encryption
- Client cannot access encryption keys
- Keys stored in Firebase Secret Manager
- AES-256-CBC encryption algorithm

### 2. Geolocation Validation
- Verifies user is physically at church
- Configurable radius (default: 500m)
- High-accuracy GPS required

### 3. Time-Window Validation
- QR codes expire after service window
- Cannot register for past services
- Prevents replay attacks

### 4. Local Encrypted Storage
- User data encrypted before storage
- Stored in IndexedDB (client-side)
- Can only be decrypted server-side

## Testing

### Test Locally with Emulator

```bash
# Start Firebase emulators
cd functions
npm run serve

# In another terminal, start Vue dev server
cd vue
npm run dev
```

### Test Geolocation (Development)

For development, you can temporarily disable location checking or adjust coordinates:

```typescript
// In geolocation.ts (REMOVE IN PRODUCTION)
export const MAX_DISTANCE_METERS = 50000 // 50km for testing
```

### Test QR Validation

Create test URL manually:
```
http://localhost:5173/?x=2024-12-09T08:00:00Z&y=2024-12-09T10:00:00Z&u=/qrcode/scan&s=1
```

## Troubleshooting

### Cloud Functions Not Working

1. Check secrets are set:
   ```bash
   firebase functions:secrets:access QR_SECRET_KEY
   firebase functions:secrets:access USER_DATA_KEY
   ```

2. Check function logs:
   ```bash
   firebase functions:log
   ```

3. Verify functions are deployed:
   ```bash
   firebase functions:list
   ```

### Geolocation Permission Denied

- User must grant location permission in browser
- HTTPS required (or localhost for development)
- Check browser console for errors

### IndexedDB Errors

- Clear IndexedDB in browser DevTools → Application → IndexedDB
- Check browser compatibility
- Verify database name: `morpher_registration`

## Next Steps

1. **Create QR Generator Admin Page**
   - Add route `/admin/qr-generator`
   - Use `vue-qrcode` library
   - Call `generateServiceQR()` function

2. **Add Offline Support**
   - Service Workers for PWA
   - Queue failed registrations
   - Sync when online

3. **Add Data Sync**
   - Create backend endpoint to receive encrypted data
   - Schedule batch upload to Firestore
   - Verify and decrypt server-side

## Support

For issues or questions, check:
- Firebase Console → Functions logs
- Browser DevTools → Console
- Network tab for failed requests
