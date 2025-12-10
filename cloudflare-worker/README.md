# Cloudflare Worker - QR Check-in System

## Setup

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Set Secrets

```bash
# Set QR encryption key
wrangler secret put QR_SECRET_KEY

# Set user data encryption key
wrangler secret put USER_DATA_KEY
```

Generate random keys:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Update Allowed Origins

Edit `wrangler.toml`:
```toml
[vars]
ALLOWED_ORIGINS = "https://your-firebase-domain.web.app,http://localhost:5173"
```

## Development

```bash
npm run dev
```

Worker will be available at: `http://localhost:8787`

## Deployment

```bash
npm run deploy
```

## API Endpoints

### GET /generate-qr
Generate encrypted QR code for current service.

**Response:**
```json
{
  "success": true,
  "qrData": "encrypted-base64-string",
  "serviceInfo": {
    "serviceNumber": 1,
    "startTime": "2024-12-09T08:00:00.000Z",
    "endTime": "2024-12-09T10:00:00.000Z"
  }
}
```

### POST /encrypt-user-data
Encrypt user registration data.

**Request:**
```json
{
  "userData": {
    "Name": "John Doe",
    "MorphersNumber": "256701234567",
    "School": "Example School"
  }
}
```

**Response:**
```json
{
  "success": true,
  "encryptedData": "encrypted-base64-string",
  "timestamp": "2024-12-09T10:30:00.000Z"
}
```

### POST /validate-qr (Helper)
Validate QR code data.

**Request:**
```json
{
  "qrData": "encrypted-base64-string"
}
```

**Response:**
```json
{
  "success": true,
  "isValid": true,
  "payload": {
    "x": "2024-12-09T08:00:00.000Z",
    "y": "2024-12-09T10:00:00.000Z",
    "u": "/qrcode/scan",
    "s": 1
  },
  "message": "QR code is valid"
}
```

### POST /decrypt-user-data (Helper)
Decrypt user data (for debugging).

**Request:**
```json
{
  "encryptedData": "encrypted-base64-string"
}
```

## Testing

```bash
# Test generate-qr
curl http://localhost:8787/generate-qr

# Test encrypt-user-data
curl -X POST http://localhost:8787/encrypt-user-data \
  -H "Content-Type: application/json" \
  -d '{"userData": {"Name": "Test User"}}'
```

## Service Schedule

Edit `src/index.js`:
```javascript
const SERVICE_SCHEDULE = {
  0: [ // Sunday
    { service: 1, start: 8, end: 10 },
    { service: 2, start: 10, end: 12 },
    { service: 3, start: 12, end: 14 },
  ],
};
```

## Security

- Uses Web Crypto API (AES-GCM) for encryption
- Secrets stored in Cloudflare environment variables
- CORS protection
- No external dependencies required
