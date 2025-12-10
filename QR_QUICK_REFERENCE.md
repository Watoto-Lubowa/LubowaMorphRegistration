# QR System - Quick Reference Card

## 🚀 Quick Commands

### Deploy Functions
```bash
cd functions
firebase deploy --only functions
```

### Set Secrets
```bash
firebase functions:secrets:set QR_SECRET_KEY
firebase functions:secrets:set USER_DATA_KEY
```

### Generate Random Key
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Test Functions Locally
```bash
cd functions
npm run serve
```

### Start Dev Server
```bash
cd vue
npm run dev
```

## 📍 Key Locations

### Backend
- Cloud Functions: `/functions/index.js`
- Service Schedule: `/functions/index.js` (line 16)
- Deployment Guide: `/functions/DEPLOYMENT.md`

### Frontend
- Geolocation: `/vue/src/utils/geolocation.ts`
- QR Validation: `/vue/src/utils/qrValidation.ts`
- IndexedDB: `/vue/src/utils/indexedDB.ts`
- Main Composable: `/vue/src/composables/useQRCheckIn.ts`
- QR Generator: `/vue/src/views/QRGeneratorView.vue`
- Integration Example: `/vue/src/views/QRRegistrationExample.vue`

### Documentation
- Main README: `/QR_SYSTEM_README.md`
- Setup Guide: `/QR_SYSTEM_SETUP.md`
- Implementation Summary: `/QR_IMPLEMENTATION_SUMMARY.md`

## 🔑 Configuration

### Church Coordinates
File: `/vue/src/utils/geolocation.ts`
```typescript
export const CHURCH_COORDINATES = {
  latitude: 0.2395,
  longitude: 32.5700,
}
export const MAX_DISTANCE_METERS = 500
```

### Service Times
File: `/functions/index.js`
```javascript
const SERVICE_SCHEDULE = {
  0: [ // Sunday
    {service: 1, start: 8, end: 10},
    {service: 2, start: 10, end: 12},
    {service: 3, start: 12, end: 14},
  ],
};
```

## 🔧 Common Tasks

### Generate QR Code
1. Navigate to `/admin/qr-generator`
2. Click "Generate QR Code for Current Service"
3. Download or print

### Integrate in Component
```typescript
import { useQRCheckIn } from '@/composables/useQRCheckIn'

const {
  hasValidQR,
  hasValidLocation,
  canProceedWithRegistration,
  encryptAndStoreData,
} = useQRCheckIn()
```

### Validate QR + Location
```typescript
// Automatically happens on mount if QR params present
// Or manually:
await checkQRCode()
await checkGeolocation()
```

### Store Encrypted Data
```typescript
if (canProceedWithRegistration.value) {
  const recordId = await encryptAndStoreData(memberData)
}
```

## 🐛 Quick Troubleshooting

### No Active Service
- Check day of week (0 = Sunday)
- Check current hour matches service times
- Update SERVICE_SCHEDULE in `/functions/index.js`

### Location Permission Denied
- Use HTTPS (or localhost)
- Check browser settings
- Clear site data

### Secrets Not Found
```bash
firebase functions:secrets:list
firebase functions:secrets:set QR_SECRET_KEY
```

### IndexedDB Error
- Open DevTools → Application → IndexedDB
- Delete `morpher_registration` database
- Reload page

## 📱 Testing URLs

### Local Development
```
http://localhost:5173/?x=2024-12-09T08:00:00Z&y=2024-12-09T10:00:00Z&u=/qrcode/scan&s=1
```

### Production
```
https://your-domain.com/?x=2024-12-09T08:00:00Z&y=2024-12-09T10:00:00Z&u=/qrcode/scan&s=1
```

## 🔒 Security Checklist

- [ ] Secrets set in Firebase Secret Manager
- [ ] Different keys for dev/prod
- [ ] HTTPS enabled
- [ ] Church coordinates updated
- [ ] Service schedule configured
- [ ] Functions deployed
- [ ] Tested QR expiration
- [ ] Tested location validation
- [ ] Tested encryption/decryption

## 📊 Function Names

- `generateServiceQR` - Generate QR code
- `encryptUserData` - Encrypt data
- `validateQRCode` - Validate QR (helper)
- `decryptUserData` - Decrypt data (helper)

## 🎯 Main Flow

1. Admin generates QR → `generateServiceQR()`
2. User scans QR → URL with params
3. App validates QR → `parseQRParams()` + `validateQRTimeWindow()`
4. App checks location → `validateUserLocation()`
5. User submits form → `encryptUserData()`
6. Store encrypted → `storeEncryptedData()`

## 💡 Tips

- QR codes expire after service window
- Location must be within 500m
- Data encrypted before storage
- Use emulators for local testing
- Check console for detailed errors
- Use QRRegistrationExample.vue as template
