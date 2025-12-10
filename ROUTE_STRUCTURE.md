# Route Structure Documentation

## Overview
The application has two main routes that serve different purposes while using the same registration component.

## Routes

### 1. QR Check-In Route: `/`
**Purpose**: Quick check-in for teenagers and members using QR codes

**Access**:
- Anyone with a valid QR code
- Anonymous authentication is enabled for this route
- No admin login required

**Flow**:
1. User scans QR code that directs to `https://your-domain.com/?qr=ENCRYPTED_TOKEN`
2. If not authenticated, user is automatically signed in anonymously
3. User data is decrypted from QR code token
4. If returning user (has cached data), shows quick confirm screen
5. If new user or forced update, shows full registration form
6. On successful registration, data is cached with server-side encryption

**Key Features**:
- Anonymous Firebase authentication
- Encrypted user data caching using IndexedDB
- Server-side encryption with UID-derived keys (PBKDF2)
- Quick confirm for returning users
- Geolocation validation
- Service schedule validation

**Important**: QR codes should ALWAYS point to the root path `/` with the QR parameter:
```
https://your-domain.com/?qr=ENCRYPTED_TOKEN
```

---

### 2. Admin Registration Route: `/admin/register`
**Purpose**: Manual registration by authenticated administrators

**Access**:
- Requires admin authentication (email/password)
- Uses `requiresAuth: true` route guard
- If accessed while signed in anonymously, shows sign-out option

**Flow**:
1. Admin navigates to `/admin/register`
2. If not authenticated or anonymous, shows login prompt
3. Admin signs in with email/password
4. Access to full registration form
5. Can manually register members without QR codes

**Key Features**:
- Full admin authentication required
- No QR code needed
- Can override anonymous sessions
- Sign-out button for anonymous users

---

## Route Meta Flags

### `qrOnly: true` (Root Route `/`)
- Indicates this route requires QR code for access
- Shows warning message if accessed without QR parameter
- Allows anonymous authentication

### `requiresAuth: true` (Admin Route `/admin/register`)
- Requires Firebase authentication
- Requires admin privileges
- Shows login form if not authenticated

---

## Component Behavior

Both routes use the same `RegistrationView.vue` component but with different behavior:

### Conditional UI Rendering
```typescript
// Show QR-only message when on root without QR
v-if="route.meta.qrOnly && !validatedQRData && !isAuthenticated"

// Show admin auth required when on admin route with anonymous user
v-if="route.path === '/admin/register' && isAnonymous"
```

### Sign-Out for Route Switching
Anonymous users who navigate to `/admin/register` can sign out to enable admin login:
```typescript
async function handleSignOutForLogin() {
  await authStore.signOutUser()
  uiStore.showInfo('Signed out. Please log in as admin.')
}
```

---

## Navigation Links

### From QR Route to Admin Route
When user is on `/` without a valid QR code:
```html
<router-link to="/admin/register">admin registration page</router-link>
```

### From Admin Route (When Anonymous)
When anonymous user is on `/admin/register`:
```html
<button @click="handleSignOutForLogin">Sign Out & Login as Admin</button>
```

---

## QR Code Generation

QR codes must include the full URL with query parameter:
```
Full URL: https://your-domain.com/?qr=ENCRYPTED_TOKEN
```

**Example QR Generation Request** (to Cloudflare Worker):
```typescript
POST http://localhost:8787/generate-qr

Body:
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+256700123456",
  "service": "10:00 AM"
}

Response:
{
  "qrCodeUrl": "data:image/png;base64,...",
  "encryptedToken": "abc123..."
}
```

**Important**: When generating physical QR codes or printable materials, use:
- Development: `http://localhost:5173/?qr=TOKEN`
- Production: `https://your-production-domain.com/?qr=TOKEN`

---

## Security Considerations

### Anonymous Authentication
- Enabled on `/` route only
- Creates persistent UID per device
- UID used as encryption key (combined with server secret)
- Cache data cannot be decrypted without UID + server secret

### Server-Side Encryption
- PBKDF2 key derivation (100,000 iterations)
- Input: UID (device-specific) + CACHE_SECRET_KEY (server secret)
- Prevents client-side key exposure
- Encrypted cache stored in IndexedDB

### Route Separation Benefits
1. **Prevents Admin Lockout**: Admins can access `/admin/register` without QR interference
2. **Preserves Anonymous Sessions**: Teenagers keep cached data on `/` route
3. **Clear Separation**: Different URLs for different user types
4. **Better UX**: Appropriate messages based on route context

---

## Testing Checklist

### QR Check-In Flow (`/`)
- [ ] Generate QR code with test data
- [ ] Scan QR code (or manually visit `/?qr=TOKEN`)
- [ ] Verify anonymous authentication occurs
- [ ] Complete registration form
- [ ] Verify data cached in IndexedDB
- [ ] Return with same QR code
- [ ] Verify quick confirm screen appears
- [ ] Verify cached data auto-fills form

### Admin Registration Flow (`/admin/register`)
- [ ] Navigate to `/admin/register`
- [ ] If anonymous, verify sign-out button appears
- [ ] Sign out and login as admin
- [ ] Verify admin authentication works
- [ ] Access full registration form
- [ ] Register member manually

### Route Switching
- [ ] Start on `/` as anonymous user
- [ ] Navigate to `/admin/register`
- [ ] Verify sign-out option appears
- [ ] Sign out and verify can login as admin
- [ ] Return to `/` and verify anonymous session available

---

## Common Issues

### Issue: "QR Code Required" message on root
**Cause**: Accessing `/` without `?qr=TOKEN` parameter  
**Solution**: Use valid QR code or navigate to `/admin/register` for manual entry

### Issue: "Authentication Required" on admin route
**Cause**: Accessing `/admin/register` while signed in anonymously  
**Solution**: Click "Sign Out & Login as Admin" button, then sign in with admin credentials

### Issue: Admin cannot login after scanning QR
**Cause**: Anonymous session persists across routes  
**Solution**: Route separation implemented - admins should use `/admin/register` instead of `/`

### Issue: Cache not found for returning user
**Cause**: UID changed (different device/browser) or cache expired (30 days)  
**Solution**: Re-register to create new cache entry

---

## Deployment Notes

### Update QR Codes for Production
1. Deploy Cloudflare Worker and Vue app
2. Update `VITE_WORKER_URL` in `.env.production`
3. Regenerate ALL QR codes with production URL
4. QR codes should point to: `https://production-domain.com/?qr=TOKEN`

### Firebase Anonymous Auth
Must be enabled in Firebase Console:
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable "Anonymous" provider
3. Save changes

See `ANONYMOUS_AUTH_SETUP.md` for detailed steps.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     User Access                          │
└─────────────────────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌─────────────────┐            ┌──────────────────┐
│  QR Check-In    │            │ Admin Manual     │
│       /         │            │ /admin/register  │
└─────────────────┘            └──────────────────┘
         │                               │
         │ QR Required                   │ Auth Required
         │ Anonymous OK                  │ Admin Only
         │                               │
         ▼                               ▼
┌─────────────────────────────────────────────────────────┐
│              RegistrationView Component                  │
│  - Conditional UI based on route meta                   │
│  - QR validation & caching                              │
│  - Form submission & geolocation                        │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              Cloudflare Worker Backend                   │
│  - /generate-qr        (Generate QR codes)              │
│  - /validate-qr        (Validate & decrypt)             │
│  - /secure-encrypt     (UID-based encryption)           │
│  - /secure-decrypt     (UID-based decryption)           │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│                 Firebase Backend                         │
│  - Firestore (member data storage)                      │
│  - Authentication (anonymous + email/password)          │
│  - Security rules                                       │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Reference

| Aspect | QR Route (`/`) | Admin Route (`/admin/register`) |
|--------|----------------|----------------------------------|
| **URL** | `/?qr=TOKEN` | `/admin/register` |
| **Auth Type** | Anonymous | Email/Password |
| **QR Required** | Yes | No |
| **Caching** | Yes | No |
| **Quick Confirm** | Yes | No |
| **Target Users** | Teenagers/Members | Administrators |
| **Primary Use** | Self check-in | Manual registration |
