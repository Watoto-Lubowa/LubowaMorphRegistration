# Firebase Functions Deployment Guide

## Prerequisites

1. **Firebase CLI installed**
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase project initialized**
   ```bash
   firebase login
   firebase init functions
   ```

## Quick Deploy

### Deploy All Functions
```bash
cd functions
firebase deploy --only functions
```

### Deploy Specific Function
```bash
firebase deploy --only functions:generateServiceQR
firebase deploy --only functions:encryptUserData
```

## Set Required Secrets

Before deploying, set encryption keys in Firebase Secret Manager:

```bash
# Set QR code encryption key
firebase functions:secrets:set QR_SECRET_KEY
# Enter a 32-character random string when prompted

# Set user data encryption key
firebase functions:secrets:set USER_DATA_KEY
# Enter a different 32-character random string when prompted
```

### Generate Random Keys

**Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**PowerShell:**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

## Function Details

### generateServiceQR
- **Type:** HTTPS Callable
- **Purpose:** Generate encrypted QR code for current service
- **Secrets:** QR_SECRET_KEY
- **Returns:** QR data string + service info

### encryptUserData
- **Type:** HTTPS Callable
- **Purpose:** Encrypt user registration data
- **Secrets:** USER_DATA_KEY
- **Input:** `{ userData: object | string }`
- **Returns:** Encrypted data string

### validateQRCode (Helper)
- **Type:** HTTPS Callable
- **Purpose:** Validate and decrypt QR code
- **Secrets:** QR_SECRET_KEY
- **Input:** `{ qrData: string }`
- **Returns:** Validation result

### decryptUserData (Helper)
- **Type:** HTTPS Callable
- **Purpose:** Decrypt user data (admin/debug)
- **Secrets:** USER_DATA_KEY
- **Input:** `{ encryptedData: string }`
- **Returns:** Decrypted data

## Testing with Emulator

```bash
# Start emulator
firebase emulators:start --only functions

# Functions will be available at:
# http://localhost:5001/<project-id>/<region>/functionName
```

## Monitoring

### View Logs
```bash
firebase functions:log
```

### View Specific Function Logs
```bash
firebase functions:log --only generateServiceQR
```

### Real-time Logs
```bash
firebase functions:log --tail
```

## Troubleshooting

### Secrets Not Found
```bash
# List all secrets
firebase functions:secrets:list

# Access secret value (for verification)
firebase functions:secrets:access QR_SECRET_KEY
```

### Function Deployment Failed
```bash
# Check for syntax errors
cd functions
npm run lint

# Check Node version (should be 18)
node --version
```

### Update Secrets
```bash
# Update existing secret
firebase functions:secrets:set QR_SECRET_KEY

# Delete secret
firebase functions:secrets:destroy QR_SECRET_KEY
```

## Costs

Firebase Functions pricing:
- 2 million invocations/month free
- $0.40 per million invocations after
- Typical registration: 2 function calls

**Estimated cost for 1000 registrations/month:** ~$0.001 (negligible)

## Security Best Practices

1. **Never commit secrets to Git**
2. **Rotate keys periodically** (every 6-12 months)
3. **Use different keys for dev/prod**
4. **Monitor function invocations** for anomalies
5. **Set up function authentication** if needed

## Next Steps

After deployment:
1. Test functions with Firebase console
2. Update frontend Firebase config
3. Generate test QR code
4. Verify encryption/decryption flow
