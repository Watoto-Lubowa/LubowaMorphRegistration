# Cloudflare Worker Setup Guide - QR Check-in System

## Overview

This system uses **Cloudflare Workers** (free tier) for backend encryption and QR generation, while keeping Firebase for frontend hosting and database.

## Architecture

```
┌─────────────────────┐
│  Firebase Hosting   │ ← Vue Frontend
│  Firebase Firestore │ ← Database
└──────────┬──────────┘
           │
           │ API Calls
           ▼
┌─────────────────────┐
│ Cloudflare Worker   │ ← Encryption & QR Logic
│ (Free Tier)         │
└─────────────────────┘
```

## Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

## Step 2: Login to Cloudflare

```bash
wrangler login
```

This will open a browser for authentication.

## Step 3: Navigate to Worker Directory

```bash
cd cloudflare-worker
```

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Set Secret Keys

Generate two random 32-character keys:

```bash
# Generate keys (run this twice for two different keys)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set the secrets:

```bash
# Set QR encryption key
wrangler secret put QR_SECRET_KEY
# Paste the first generated key when prompted

# Set user data encryption key
wrangler secret put USER_DATA_KEY
# Paste the second generated key when prompted
```

## Step 6: Update CORS Configuration

Edit `wrangler.toml`:

```toml
[vars]
ALLOWED_ORIGINS = "https://your-firebase-app.web.app,http://localhost:5173"
```

Replace `your-firebase-app.web.app` with your actual Firebase hosting domain.

## Step 7: Test Locally

```bash
npm run dev
```

Worker will run at: `http://localhost:8787`

Test endpoints:
```bash
# Test QR generation
curl http://localhost:8787/generate-qr

# Test encryption
curl -X POST http://localhost:8787/encrypt-user-data \
  -H "Content-Type: application/json" \
  -d '{"userData": {"Name": "Test User", "Phone": "256701234567"}}'
```

## Step 8: Deploy to Cloudflare

```bash
npm run deploy
```

After deployment, you'll see output like:
```
Deployed lubowa-morph-qr-worker to
  https://lubowa-morph-qr-worker.your-subdomain.workers.dev
```

**Copy this URL!** You'll need it for the frontend.

## Step 9: Update Frontend Configuration

### Option A: Environment Variable (Recommended)

Create/edit `vue/.env.local`:

```bash
cd ../vue
```

Create `.env.local`:
```env
VITE_WORKER_URL=https://lubowa-morph-qr-worker.your-subdomain.workers.dev
```

### Option B: Direct Update

Edit `vue/src/utils/cloudflareWorker.ts`:

```typescript
export const WORKER_URL = 'https://lubowa-morph-qr-worker.your-subdomain.workers.dev'
```

## Step 10: Test End-to-End

### Start Vue Dev Server

```bash
cd vue
npm run dev
```

### Test QR Generation

1. Navigate to `/admin/qr-generator`
2. Click "Generate QR Code for Current Service"
3. Should display QR code if it's Sunday during service hours

### Test Registration Flow

1. Scan QR code or use test URL:
   ```
   http://localhost:5173/?qr=<encrypted-data>&s=1
   ```
2. Should validate QR and show registration form
3. Fill and submit form
4. Check browser DevTools → Application → IndexedDB → `morpher_registration`

## Service Schedule Configuration

Edit `cloudflare-worker/src/index.js`:

```javascript
const SERVICE_SCHEDULE = {
  0: [ // Sunday (0 = Sunday)
    { service: 1, start: 8, end: 10 },   // 8am - 10am
    { service: 2, start: 10, end: 12 },  // 10am - 12pm
    { service: 3, start: 12, end: 14 },  // 12pm - 2pm
  ],
  // Add more days if needed:
  // 3: [{ service: 1, start: 18, end: 20 }], // Wednesday 6-8pm
};
```

After editing, redeploy:
```bash
cd cloudflare-worker
npm run deploy
```

## Troubleshooting

### "Secret not found" Error

```bash
# List all secrets
wrangler secret list

# Set missing secret
wrangler secret put QR_SECRET_KEY
```

### CORS Error in Browser

1. Check `wrangler.toml` has correct `ALLOWED_ORIGINS`
2. Redeploy: `npm run deploy`
3. Clear browser cache

### "No active service" Error

- Check service schedule matches current day/time
- Services are Sunday only by default
- Update `SERVICE_SCHEDULE` in `src/index.js`

### Worker URL Not Working

1. Verify deployment succeeded
2. Check URL in deployment output
3. Test with curl:
   ```bash
   curl https://your-worker-url.workers.dev/generate-qr
   ```

## Cloudflare Free Tier Limits

- ✅ **100,000 requests/day** - More than enough
- ✅ **10ms CPU time per request** - Plenty for encryption
- ✅ **Unlimited bandwidth**
- ✅ **No credit card required**

Estimated usage for 1000 registrations/day:
- QR generations: ~3 requests
- User encryptions: ~1000 requests
- **Total: ~1003 requests/day** (well within free tier)

## Security Features

✅ **AES-GCM Encryption** - Web Crypto API (built-in, no dependencies)  
✅ **Environment Secrets** - Keys never exposed to client  
✅ **CORS Protection** - Only allowed domains can access  
✅ **Time-Window Validation** - QR codes expire automatically  
✅ **No Database** - Stateless worker, very fast  

## Monitoring

### View Logs

```bash
wrangler tail
```

This shows real-time logs from your worker.

### Check Analytics

1. Go to Cloudflare Dashboard
2. Navigate to Workers & Pages
3. Click on your worker
4. View metrics and logs

## Updating the Worker

1. Edit `cloudflare-worker/src/index.js`
2. Test locally: `npm run dev`
3. Deploy: `npm run deploy`

## Backup Plan

If Cloudflare is down (rare), you can:

1. Temporarily disable QR validation in frontend
2. Use direct registration (no QR required)
3. Switch back when service restored

## Next Steps

1. ✅ Deploy worker
2. ✅ Update frontend WORKER_URL
3. ✅ Test QR generation
4. ✅ Test encryption
5. ✅ Test full registration flow
6. ✅ Update service schedule if needed
7. ✅ Deploy Vue app to Firebase

## Support

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
