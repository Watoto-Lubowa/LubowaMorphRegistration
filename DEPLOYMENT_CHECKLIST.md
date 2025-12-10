# Deployment Checklist - QR Check-In System

## 🎯 Pre-Deployment Tasks

### 1. Enable Firebase Anonymous Authentication
**Status**: ⏳ REQUIRED - Must complete before testing

**Steps**:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Authentication** → **Sign-in method**
4. Scroll to find **Anonymous** provider
5. Click **Anonymous** → Toggle **Enable** → **Save**

**Verification**:
```bash
# Should work after enabling
cd vue
npm run dev
# Navigate to http://localhost:5173 (will auto sign-in anonymously)
# Check console: Should see "Signed in anonymously with UID: ..."
```

**Reference**: See `ANONYMOUS_AUTH_SETUP.md` for screenshots

---

### 2. Test QR Check-In Flow Locally
**Status**: ⏳ Pending (requires Step 1 complete)

#### Prerequisites Checklist:
- [x] Cloudflare Worker running (`cd cloudflare-worker && npm run dev`)
- [x] Worker accessible at http://localhost:8787
- [x] Vue dev server running (`cd vue && npm run dev`)
- [x] Vue app accessible at http://localhost:5173
- [ ] Anonymous Auth enabled in Firebase Console ⚠️

#### Test Steps:

**A. Generate Test QR Code**
```bash
# PowerShell
$body = @{
  firstName = "Test"
  lastName = "User"
  phoneNumber = "+256700123456"
  service = "10:00 AM"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8787/generate-qr" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

# Extract token
$token = $response.encryptedToken
Write-Host "Token: $token"
```

**B. Test First-Time Registration**
1. Open browser to: `http://localhost:5173/?qr=TOKEN_FROM_ABOVE`
2. ✅ Verify automatic anonymous sign-in (check console)
3. ✅ Verify QR token validated successfully
4. ✅ Verify form prefilled with test data
5. ✅ Complete any missing fields (if service requires location, allow GPS)
6. ✅ Submit registration
7. ✅ Verify success message appears
8. ✅ Check DevTools → Application → IndexedDB → `morpher_qr_cache`
   - Should see entry with key = Firebase UID
   - Value should have `data` (encrypted blob), `timestamp`, `expiresAt`

**C. Test Returning User (Quick Confirm)**
1. **Keep same browser/tab** (to maintain anonymous session)
2. Visit same URL again: `http://localhost:5173/?qr=TOKEN`
3. ✅ Verify same UID logged in console (not a new anonymous user)
4. ✅ Verify "Welcome back!" quick confirm screen appears
5. ✅ Verify all data auto-filled correctly
6. ✅ Verify service selection dropdown shows current services
7. ✅ Select service → Click "Confirm & Check In"
8. ✅ Verify attendance submitted successfully
9. ✅ Check Firestore - should see new attendance record

**D. Test Cache Persistence**
1. Close browser tab (keep browser open)
2. Reopen new tab to: `http://localhost:5173/?qr=TOKEN`
3. ✅ Verify same UID (anonymous session persists across tabs)
4. ✅ Verify quick confirm still works

**E. Test Cache Expiration**
1. Open DevTools → Application → IndexedDB → `morpher_qr_cache`
2. Find your UID entry
3. Right-click → Edit value → Change `expiresAt` to a past timestamp
4. Refresh page: `http://localhost:5173/?qr=TOKEN`
5. ✅ Verify cache ignored (full form shown, not quick confirm)
6. ✅ Verify new cache created on registration

**F. Console Logs to Verify**
Watch for these in browser console:

```
[QR Cache] Attempting to save cached data for UID: abc123...
[QR Cache] Encrypting data for UID: abc123...
[QR Cache] Encryption successful, encrypted length: 456
[QR Cache] Saving to IndexedDB with key: abc123...
[QR Cache] Successfully saved cache entry

[QR Cache] Attempting to retrieve cached data for UID: abc123...
[QR Cache] Found cache entry in IndexedDB
[QR Cache] Cache is still valid (expires: ...)
[QR Cache] Decrypting cached data for UID: abc123...
[QR Cache] Decryption successful
```

Watch for these in worker terminal:

```
/secure-encrypt request received
Derived encryption key for UID: abc123...
Data encrypted successfully

/secure-decrypt request received
Derived decryption key for UID: abc123...
Data decrypted successfully
```

---

### 3. Test Admin Registration Flow
**Status**: ⏳ Ready to test

**A. Test Anonymous User on Admin Route**
1. Navigate to: `http://localhost:5173/admin/register`
2. ✅ If signed in anonymously, verify "Authentication Required" message shows
3. ✅ Verify "Sign Out & Login as Admin" button visible
4. ✅ Click button → verify signed out
5. ✅ Verify info message: "Signed out. Please log in as admin."

**B. Test Admin Login**
1. On `/admin/register` route (after signing out)
2. ✅ Verify login form appears
3. ✅ Enter admin email and password
4. ✅ Sign in successfully
5. ✅ Verify full registration form accessible
6. ✅ Manually enter member data (no QR required)
7. ✅ Submit registration
8. ✅ Verify success (no caching should occur on admin route)

**C. Test Route Switching**
1. Start as anonymous user on `/` route
2. ✅ Navigate to `/admin/register`
3. ✅ Verify sign-out option appears
4. ✅ Sign out and login as admin
5. ✅ Navigate back to `/`
6. ✅ Verify admin session persists (not anonymous anymore)
7. ✅ If accessing `/` as admin without QR, verify appropriate message

---

### 4. Test Error Scenarios
**Status**: ⏳ Ready to test

**A. Invalid QR Token**
```
http://localhost:5173/?qr=invalid-token-here
```
- [ ] Verify error message shown
- [ ] Verify registration blocked

**B. Expired QR Token**
Generate QR with past service time, verify validation fails

**C. No QR Parameter on Root Route**
```
http://localhost:5173/
```
- [ ] Verify "QR Code Required" message
- [ ] Verify link to `/admin/register` shown

**D. Different Device (Different UID)**
1. Register on one browser
2. Open same QR link in different browser (different anonymous UID)
3. ✅ Verify cache NOT found (different UID)
4. ✅ Verify full registration form shown (not quick confirm)

**E. Browser Data Cleared**
1. Register and cache data
2. Clear browser data (IndexedDB)
3. Revisit same QR link (same anonymous session, but no cache)
4. ✅ Verify cache not found
5. ✅ Verify full form shown

---

## 🚀 Production Deployment

### Step 1: Deploy Cloudflare Worker

**A. Set Production Secrets**
```bash
cd cloudflare-worker

# Set QR encryption key
wrangler secret put QR_SECRET_KEY
# Paste: <your-64-char-hex-key>

# Set legacy user data key
wrangler secret put USER_DATA_KEY
# Paste: <your-64-char-hex-key>

# Set cache encryption salt
wrangler secret put CACHE_SECRET_KEY
# Paste: <your-64-char-hex-key>
```

**Generate keys if needed**:
```bash
# PowerShell
-join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })
```

**B. Update Allowed Origins**
Edit `wrangler.toml`:
```toml
[vars]
ALLOWED_ORIGINS = "https://your-production-domain.com"
```

**C. Deploy**
```bash
npm run deploy
```

**D. Note Deployment URL**
```
Example: https://your-worker-name.workers.dev
```

---

### Step 2: Build and Deploy Vue App

**A. Create Production Environment File**
Create `vue/.env.production`:
```bash
VITE_WORKER_URL=https://your-worker-name.workers.dev
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

**B. Build**
```bash
cd vue
npm run build
```

**C. Deploy dist/ Folder**
Choose your hosting platform:

**Option 1: Firebase Hosting**
```bash
firebase deploy --only hosting
```

**Option 2: Netlify**
```bash
# Drag/drop dist/ folder to Netlify
# Or use Netlify CLI
```

**Option 3: Vercel**
```bash
vercel --prod
```

**D. Note Production URL**
```
Example: https://your-app.web.app
```

---

### Step 3: Update Worker CORS Origins

**A. Add Production URL to Allowed Origins**
```bash
cd cloudflare-worker

# Edit wrangler.toml
[vars]
ALLOWED_ORIGINS = "https://your-production-domain.com,https://your-app.web.app"

# Redeploy
npm run deploy
```

**B. Verify CORS**
```bash
# Test from production URL
# Open browser console on https://your-app.web.app
fetch('https://your-worker.workers.dev/generate-qr', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: "Test",
    lastName: "CORS",
    phoneNumber: "+256700000000",
    service: "10:00 AM"
  })
})
.then(r => r.json())
.then(console.log)
```

Should return QR data without CORS error.

---

### Step 4: Reset Service Schedule to Production Hours

**A. Edit Worker Service Schedule**
File: `cloudflare-worker/src/index.ts`

Find `serviceSchedules` object and change to:
```typescript
const serviceSchedules: ServiceSchedules = {
  'Sunday': {
    start: 8,
    end: 16,
    services: ['8:00 AM', '10:00 AM', '12:00 PM']
  },
  'Monday': null,
  'Tuesday': null,
  'Wednesday': null,
  'Thursday': null,
  'Friday': null,
  'Saturday': null
}
```

**B. Redeploy**
```bash
cd cloudflare-worker
npm run deploy
```

**C. Verify**
Try generating QR on a non-Sunday:
```bash
# Should fail with "No services available today"
POST https://your-worker.workers.dev/generate-qr
```

---

### Step 5: Generate Production QR Codes

**A. Generate QR Codes for Each Service**

Using PowerShell:
```powershell
# Service 1: 8:00 AM
$body1 = @{
  firstName = ""
  lastName = ""
  phoneNumber = ""
  service = "8:00 AM"
} | ConvertTo-Json

$response1 = Invoke-RestMethod -Uri "https://your-worker.workers.dev/generate-qr" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body1

# Save QR image (base64 data URL)
$response1.qrCodeUrl | Out-File "qr-8am.txt"

# Repeat for 10:00 AM and 12:00 PM
```

**B. Create Printable QR Codes**

Option 1: Use saved base64 data URL in HTML
```html
<!DOCTYPE html>
<html>
<head><title>8:00 AM Service QR</title></head>
<body style="text-align: center; padding: 50px;">
  <h1>8:00 AM Service</h1>
  <img src="data:image/png;base64,..." style="width: 400px; height: 400px;">
  <p>Scan to check in</p>
  <p style="font-size: 12px; color: #666;">
    https://your-app.web.app/?qr=...
  </p>
</body>
</html>
```

Option 2: Online QR generator
- Copy the full URL: `https://your-app.web.app/?qr=TOKEN`
- Use qr-code-generator.com or similar
- Download and print

**C. Verify Production QR Codes**
1. Print one test QR
2. Scan with phone camera
3. ✅ Should open production URL with `?qr=` parameter
4. ✅ Should trigger anonymous sign-in
5. ✅ Should validate successfully
6. ✅ Should allow registration

---

### Step 6: Enable Anonymous Auth in Production Firebase

If not already done:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Authentication → Sign-in method
4. Enable "Anonymous" → Save

---

### Step 7: Monitor and Verify

**A. Cloudflare Worker Logs**
```bash
wrangler tail
```
Watch for:
- `/generate-qr` requests (during QR generation)
- `/validate-qr` requests (during check-in)
- `/secure-encrypt` and `/secure-decrypt` (during caching)

**B. Firebase Console**
- **Authentication**: Monitor anonymous user creations
- **Firestore**: Watch `members` collection for new registrations

**C. Browser Console (User Device)**
- Check for `[QR Cache]` log messages
- Verify no errors during QR scan and registration

**D. Analytics**
Consider adding to worker:
```typescript
// Track QR usage
console.log(`[Analytics] QR validated for service: ${data.service}`)
```

---

## 📋 Post-Deployment Checklist

### Critical Items
- [ ] Anonymous Auth enabled in Firebase Console (production)
- [ ] Cloudflare Worker deployed with production secrets
- [ ] Vue app deployed with production `.env`
- [ ] Worker CORS configured with production domain
- [ ] Service schedule reset to Sundays only (8am-4pm)
- [ ] Production QR codes generated and tested
- [ ] At least one test check-in successful

### Nice-to-Have
- [ ] Cloudflare Worker analytics/logging set up
- [ ] Error monitoring (Sentry, etc.) configured
- [ ] Performance monitoring enabled
- [ ] Admin dashboard showing QR check-in stats

### Documentation
- [ ] `ROUTE_STRUCTURE.md` reviewed by team
- [ ] `ANONYMOUS_AUTH_SETUP.md` available for troubleshooting
- [ ] `QR_IMPLEMENTATION_SUMMARY.md` bookmarked
- [ ] Admin trained on `/admin/register` route
- [ ] Users informed about QR check-in process

---

## 🐛 Common Issues After Deployment

### Issue: QR codes don't scan
**Check**:
- QR encodes full URL: `https://your-app.web.app/?qr=TOKEN`
- Not just the token
- URL is accessible publicly

### Issue: CORS errors in production
**Check**:
- Production domain in `ALLOWED_ORIGINS`
- Worker redeployed after CORS changes
- No typos in domain (http vs https, trailing slash)

### Issue: Anonymous auth fails in production
**Check**:
- Anonymous provider enabled in Firebase Console
- Using production Firebase config in Vue app
- No authentication errors in browser console

### Issue: Cache not persisting in production
**Check**:
- CACHE_SECRET_KEY set in Cloudflare secrets (not just `.dev.vars`)
- Worker `/secure-encrypt` and `/secure-decrypt` endpoints working
- IndexedDB enabled in user browsers (not in private/incognito mode)

### Issue: Different UID each time
**Cause**: Anonymous sessions not persisting
**Check**:
- Browser not in incognito mode
- Browser not clearing data automatically
- Firebase auth persistence set correctly

---

## 📊 Success Metrics

### Week 1 (Soft Launch)
- Target: 10-20 test users
- Monitor: Error rates, cache hit rates, user feedback

### Month 1
- Target: 50+ returning users with quick confirm
- Monitor: Average check-in time reduction

### Ongoing
- Track: Anonymous user retention (same UID returning)
- Track: Cache expiration rates (30-day threshold)
- Track: QR validation success rate
- Track: Service attendance distribution

---

## 🎓 Next Steps (Future Enhancements)

### Potential Improvements
1. **QR Code Regeneration** - Auto-regenerate weekly for security
2. **Admin Dashboard** - View QR check-in statistics
3. **Push Notifications** - Remind users to check in
4. **Offline Support** - Service worker for offline QR validation
5. **Multi-Church Support** - Different QR codes per campus
6. **Attendance Reports** - Export QR check-in data
7. **User Profiles** - Allow users to update cached info

### Performance Optimizations
1. **Edge Caching** - Cache QR validation responses
2. **Lazy Loading** - Split Vue app for faster initial load
3. **Image Optimization** - Compress QR code images
4. **Worker KV** - Store frequently used data in Cloudflare KV

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**System Status**: Development Complete, Testing Pending  
**Critical Path**: Enable Anonymous Auth → Test Locally → Deploy Production
