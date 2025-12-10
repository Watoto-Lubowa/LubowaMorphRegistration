# Quick Start Guide - Anonymous Auth & Secure Caching

## 🚀 Quick Setup (5 Minutes)

### Step 1: Enable Anonymous Auth in Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `lubowamorphregistration`
3. Click **Authentication** → **Sign-in method**
4. Find **Anonymous** → Toggle **Enable** → **Save**

### Step 2: Test Locally
```powershell
# Terminal 1: Start Cloudflare Worker
cd cloudflare-worker
npm run dev

# Terminal 2: Start Vue App
cd vue
npm run dev
```

### Step 3: Test the Flow
1. Open browser to `http://localhost:5173/admin/qr-generator`
2. Generate a QR code
3. Open the QR URL in new tab (or scan with phone)
4. Verify automatic anonymous sign-in
5. Fill registration form and submit
6. Scan same QR again → Should show "Is this you?" screen

## 📝 What Changed

### New Features
✅ Anonymous users can access system without login  
✅ Server-side encryption with PBKDF2 key derivation  
✅ Secure caching of user data (30-day expiration)  
✅ Automatic anonymous auth on QR scan  
✅ Quick confirm screen for returning users  

### Security Improvements
🔒 Encryption keys never exposed to client  
🔒 PBKDF2 with 100k iterations prevents brute force  
🔒 AES-256-GCM bank-level encryption  
🔒 Device-specific anonymous accounts  

## 🔑 New API Endpoints

### POST /secure-encrypt
Encrypts data with UID-derived key
```json
{
  "uid": "user-firebase-uid",
  "userData": { "name": "...", "phoneNumber": "..." }
}
```

### POST /secure-decrypt
Decrypts data with UID-derived key
```json
{
  "uid": "user-firebase-uid",
  "encryptedData": "base64-blob..."
}
```

## 🎯 User Flow

### First-Time User (Teenager)
```
1. Scan QR code
2. Auto sign-in anonymously (UID: abc123)
3. Fill registration form
4. Submit → Data sent to server
5. Server: Derive key from UID + secret
6. Server: Encrypt data → Return blob
7. Store encrypted blob in IndexedDB
8. Success!
```

### Returning User (Same Device)
```
1. Scan QR code
2. Auto sign-in with same UID (abc123)
3. Check IndexedDB for cached data
4. Found! Send UID + blob to server
5. Server: Derive key from UID + secret
6. Server: Decrypt data → Return plain text
7. Show "Is this you?" screen
8. Tap "Yes" → Instant check-in!
```

## 🧪 Testing Commands

### Test Anonymous Auth
```javascript
// Browser console
const authStore = useAuthStore()
await authStore.signInAnonymously()
console.log(authStore.currentUser.uid)
```

### Test Encryption
```javascript
import { secureEncryptData } from '@/utils/cloudflareWorker'
const result = await secureEncryptData('test-uid', {
  name: 'Test User',
  phoneNumber: '+256700000000'
})
console.log(result.encryptedData)
```

### Test Cache
```javascript
import { saveCachedUserData, getCachedUserData } from '@/utils/qrCache'

// Save
await saveCachedUserData(authStore.currentUser.uid, {
  name: 'Test',
  phoneNumber: '+256700000000'
})

// Retrieve
const cached = await getCachedUserData(authStore.currentUser.uid)
console.log(cached)
```

## 📦 Production Deployment

### Step 1: Set Secrets
```powershell
cd cloudflare-worker

# Generate strong random key (PowerShell)
$key = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
Write-Host $key

# Set the secret
wrangler secret put CACHE_SECRET_KEY
# Paste the generated key when prompted

# Also set other secrets if not done
wrangler secret put QR_SECRET_KEY
wrangler secret put USER_DATA_KEY
```

### Step 2: Deploy Worker
```powershell
npm run deploy
# Note the deployed URL
```

### Step 3: Update Frontend
```env
# vue/.env.production
VITE_WORKER_URL=https://lubowa-morph-qr-worker.your-username.workers.dev
```

### Step 4: Deploy Frontend
```powershell
cd vue
npm run build
# Deploy dist/ folder to your hosting
```

## ⚠️ Important Notes

### Security
- **Never commit `.dev.vars`** to version control (already in .gitignore)
- **Rotate secrets** periodically (requires users to re-register)
- **Monitor** anonymous sign-ups for abuse patterns

### Limitations
- Cache is **device-specific** (can't transfer to new device)
- Cache **expires after 30 days** (automatic cleanup)
- Anonymous accounts **can't be recovered** if cleared

### Best Practices
- Set Firestore security rules for anonymous users
- Monitor authentication logs daily
- Track cache hit rates for optimization
- Provide clear UI for anonymous mode

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| "signInAnonymously is not a function" | Enable Anonymous Auth in Firebase Console |
| Encryption fails | Check CACHE_SECRET_KEY is set in Worker |
| Cached data not found | Same device? Data not expired (30 days)? |
| Worker not responding | Verify it's running: `npm run dev` |
| CORS errors | Check ALLOWED_ORIGINS in wrangler.toml |

## 📚 Documentation

- **Full Setup:** [SECURE_CACHE_SETUP.md](cloudflare-worker/SECURE_CACHE_SETUP.md)
- **Anonymous Auth:** [ANONYMOUS_AUTH_SETUP.md](ANONYMOUS_AUTH_SETUP.md)
- **Summary:** [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

## ✅ Checklist

### Before Production
- [ ] Anonymous Auth enabled in Firebase
- [ ] CACHE_SECRET_KEY set in production Worker
- [ ] Worker deployed and tested
- [ ] Frontend .env updated with Worker URL
- [ ] Firestore rules updated for anonymous users
- [ ] End-to-end flow tested
- [ ] Monitoring set up

### After Deployment
- [ ] Monitor authentication logs
- [ ] Track anonymous sign-up trends
- [ ] Monitor cache hit rates
- [ ] Check for encryption errors in Worker logs
- [ ] Verify QR codes working in production

---

**Need Help?** Check the detailed documentation in the links above or review the code comments.
