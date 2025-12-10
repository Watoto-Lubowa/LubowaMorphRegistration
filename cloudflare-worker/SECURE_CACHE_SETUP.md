# Secure Anonymous Authentication & Cache Setup

## Overview

This system allows teenagers (and other users) to access the registration system securely without login credentials using:

1. **Firebase Anonymous Authentication** - Creates unique, persistent device-specific user IDs
2. **Server-Side Encryption** - Cloudflare Worker derives encryption keys from UID + secret
3. **IndexedDB Caching** - Stores encrypted data locally for quick re-registration

## Security Architecture

### The Problem
Originally, we encrypted data client-side using only the user's UID as the key. This was insecure because:
- UIDs are publicly accessible to the client
- Anyone with the UID could decrypt the cached data
- No true secret protection

### The Solution: UID-Derived Keys with Server Secret

```
Client UID (public) + Server Secret (private) → Derived Key → Encrypt Data
```

**Key Derivation Process:**
1. User gets anonymous UID from Firebase (e.g., `abc123xyz`)
2. Client sends UID + data to Cloudflare Worker `/secure-encrypt`
3. Worker combines UID with secret: `PBKDF2(secret, salt: "${UID}:${SECRET}", 100k iterations)`
4. Worker encrypts data with derived AES-256-GCM key
5. Returns encrypted blob to client
6. Client stores encrypted blob in IndexedDB

**Why This Is Secure:**
- ✅ True secret (CACHE_SECRET_KEY) never leaves the server
- ✅ Each user gets a unique derived key (UID-based)
- ✅ Data is useless without both UID AND server secret
- ✅ PBKDF2 with 100k iterations prevents brute force
- ✅ Device-specific (each device gets own anonymous account)

## Setup Instructions

### 1. Set Cloudflare Worker Secrets

```bash
cd cloudflare-worker

# Set a strong random secret for cache encryption (32+ characters recommended)
wrangler secret put CACHE_SECRET_KEY
# When prompted, enter a strong random string like:
# Example: h8JkL9mN2pQr4StUv6Wx8YzA1bCdE3fG5hI7jK9lM

# Also set QR and user data keys if not already done
wrangler secret put QR_SECRET_KEY
wrangler secret put USER_DATA_KEY
```

**Important:** Use different secrets for each key! Generate strong random strings:
- On Linux/Mac: `openssl rand -base64 32`
- On Windows PowerShell: `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))`

### 2. Deploy the Worker

```bash
# Deploy to Cloudflare
npm run deploy

# Note your worker URL (e.g., https://lubowa-morph-qr-worker.your-username.workers.dev)
```

### 3. Update Frontend Configuration

Update `vue/.env` with your deployed worker URL:

```env
VITE_WORKER_URL=https://lubowa-morph-qr-worker.your-username.workers.dev
```

### 4. Test the Flow

1. **Generate QR Code** (Admin):
   - Go to `/admin/qr-generator`
   - Generate QR for current service
   - Download or print QR code

2. **Scan QR (Teenager)**:
   - Scan QR with phone camera
   - Automatically signed in anonymously
   - Fill registration form
   - Submit → Data cached encrypted

3. **Return Visit (Same Device)**:
   - Scan QR again
   - Same anonymous UID recognized
   - Cached data decrypted server-side
   - Quick confirm screen appears
   - One tap to check in!

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ FIRST TIME QR SCAN (Teenager)                                   │
├─────────────────────────────────────────────────────────────────┤
│ 1. Scan QR → Navigate to app with ?qr=<encrypted-payload>       │
│ 2. No auth → signInAnonymously() → Get UID (e.g., abc123xyz)   │
│ 3. QR validated → Show registration form                        │
│ 4. Fill name + phone → Submit                                   │
│ 5. Worker: PBKDF2(UID, SECRET) → Encrypt data → Return blob    │
│ 6. Store encrypted blob in IndexedDB (key: UID)                 │
│ 7. Save to Firestore → Success!                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ RETURN VISIT (Same Teenager, Same Device)                       │
├─────────────────────────────────────────────────────────────────┤
│ 1. Scan QR → Navigate with ?qr=<encrypted-payload>              │
│ 2. Already have anonymous auth → UID: abc123xyz                 │
│ 3. Check IndexedDB for cached data (key: UID)                   │
│ 4. Found! Send UID + encrypted blob to Worker                   │
│ 5. Worker: PBKDF2(UID, SECRET) → Decrypt → Return user data    │
│ 6. Show "Is this you?" with name + phone                        │
│ 7. Tap "Yes, that's me!" → Quick check-in complete!            │
└─────────────────────────────────────────────────────────────────┘
```

## API Endpoints

### POST /secure-encrypt
Securely encrypt data with UID-derived key.

**Request:**
```json
{
  "uid": "abc123xyz",
  "userData": {
    "name": "John Doe",
    "phoneNumber": "+256700000000"
  }
}
```

**Response:**
```json
{
  "success": true,
  "encryptedData": "base64-encrypted-blob...",
  "timestamp": "2025-12-09T10:30:00.000Z"
}
```

### POST /secure-decrypt
Securely decrypt data with UID-derived key.

**Request:**
```json
{
  "uid": "abc123xyz",
  "encryptedData": "base64-encrypted-blob..."
}
```

**Response:**
```json
{
  "success": true,
  "decryptedData": {
    "name": "John Doe",
    "phoneNumber": "+256700000000"
  }
}
```

## Caching Utilities

### Save Cached Data
```typescript
import { saveCachedUserData } from '@/utils/qrCache'

// After successful registration
await saveCachedUserData(currentUser.uid, {
  name: 'John Doe',
  phoneNumber: '+256700000000'
})
```

### Retrieve Cached Data
```typescript
import { getCachedUserData } from '@/utils/qrCache'

// On QR scan with existing auth
const cached = await getCachedUserData(currentUser.uid)
if (cached) {
  // Show quick confirm screen
  console.log(cached.name, cached.phoneNumber)
}
```

### Clear Cache
```typescript
import { clearCachedUserData } from '@/utils/qrCache'

// Clear specific user
await clearCachedUserData(currentUser.uid)

// Clear all expired entries (30+ days old)
await clearExpiredCache()
```

## Cache Expiration

- **Duration:** 30 days from cache date
- **Auto-cleanup:** Expired entries removed on access attempt
- **Manual cleanup:** Call `clearExpiredCache()` periodically

## Security Considerations

### ✅ Secure
- Server-side encryption with secret key
- PBKDF2 key derivation (100k iterations)
- AES-256-GCM encryption
- Device-specific anonymous accounts
- Data expires after 30 days

### ⚠️ Limitations
- Device-specific (can't transfer to new device without re-registration)
- If device is compromised, cached data is accessible (but encrypted)
- Anonymous accounts can't be recovered if cleared

### 🔒 Best Practices
- Rotate CACHE_SECRET_KEY periodically (requires all users to re-register)
- Monitor for unusual anonymous account creation patterns
- Consider adding rate limiting for encrypt/decrypt endpoints
- Keep Cloudflare Worker logs for security auditing

## Troubleshooting

### User doesn't see cached data
1. Check if same device (anonymous UID is device-specific)
2. Verify cache hasn't expired (30 days)
3. Check browser console for errors
4. Verify CACHE_SECRET_KEY is set in Worker

### Decryption fails
1. Ensure CACHE_SECRET_KEY hasn't changed
2. Check Worker logs for errors
3. Verify UID matches cached data
4. Try clearing cache and re-registering

### Anonymous auth not working
1. Check Firebase Console → Authentication → Sign-in methods
2. Enable "Anonymous" authentication provider
3. Verify Firebase config is correct in frontend

## Production Deployment Checklist

- [ ] Set CACHE_SECRET_KEY in production worker
- [ ] Set QR_SECRET_KEY in production worker
- [ ] Set USER_DATA_KEY in production worker
- [ ] Enable Anonymous auth in Firebase Console
- [ ] Update VITE_WORKER_URL in production .env
- [ ] Test full flow on staging environment
- [ ] Monitor worker logs for errors
- [ ] Document secret rotation procedure
- [ ] Set up monitoring for anonymous account abuse

## Monitoring & Analytics

Track these metrics:
- Number of anonymous accounts created per day
- Cache hit rate (returning users vs new registrations)
- Encryption/decryption success rate
- Average time to check-in (with vs without cache)

## Future Enhancements

- Add PIN protection for cached data (optional user-set PIN)
- Support account linking (upgrade anonymous → email/password)
- Cross-device sync (via QR code transfer)
- Biometric authentication for cached data access
