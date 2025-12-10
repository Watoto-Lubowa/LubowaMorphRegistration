# Anonymous Authentication Setup Guide

## Enable Anonymous Authentication in Firebase

To allow teenagers (and other users) to access the system without login credentials, you need to enable Anonymous Authentication in Firebase Console.

### Step-by-Step Instructions

1. **Open Firebase Console**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project: `lubowamorphregistration`

2. **Navigate to Authentication**
   - Click "Authentication" in the left sidebar
   - Click "Sign-in method" tab

3. **Enable Anonymous Provider**
   - Find "Anonymous" in the list of providers
   - Click on it to open settings
   - Toggle "Enable" to ON
   - Click "Save"

4. **Verify Settings**
   - Anonymous should now show as "Enabled" in the providers list
   - Status should show a green checkmark

### What This Enables

Once enabled, the app can:
- ✅ Sign in users without email/password
- ✅ Create unique, persistent device-specific user IDs
- ✅ Store user data securely in Firestore
- ✅ Cache encrypted data locally for quick re-registration

### Security Considerations

**Anonymous Authentication:**
- Creates a unique UID for each device
- UID persists until user clears app data or signs out
- Each device gets its own separate account
- No way to recover account if cleared (by design)

**Data Protection:**
- User data encrypted server-side with UID + secret
- Cached data expires after 30 days
- Cannot transfer cached data to new device
- Server secret never exposed to client

### Testing Anonymous Auth

After enabling, test the flow:

```javascript
// In browser console (with Firebase initialized)
import { getAuth, signInAnonymously } from 'firebase/auth'

const auth = getAuth()
const result = await signInAnonymously(auth)
console.log('Anonymous UID:', result.user.uid)
```

Expected output:
```
Anonymous UID: FxP3mKL8jNqR2tS5vW9xY0zA1bC
```

### Monitoring Anonymous Users

In Firebase Console:
1. Go to Authentication → Users tab
2. Anonymous users show with:
   - Provider: "anonymous"
   - No email address
   - Created date
   - Last sign-in date

### Rate Limits & Quotas

Firebase Anonymous Auth limits:
- **Free tier (Spark):** 10k sign-ups/month
- **Paid tier (Blaze):** Unlimited

Monitor usage in Firebase Console → Authentication → Usage tab

### Disabling Anonymous Auth

⚠️ **Warning:** Disabling will:
- Prevent new anonymous sign-ins
- Existing anonymous users can still access if already signed in
- Cached data will become inaccessible (decryption requires auth)

To disable:
1. Firebase Console → Authentication → Sign-in method
2. Click "Anonymous"
3. Toggle "Enable" to OFF
4. Click "Save"

### Upgrading Anonymous Accounts (Future Feature)

Anonymous accounts can be upgraded to permanent accounts:

```javascript
import { getAuth, linkWithCredential, EmailAuthProvider } from 'firebase/auth'

const auth = getAuth()
const credential = EmailAuthProvider.credential(email, password)
await linkWithCredential(auth.currentUser, credential)
```

This preserves the UID and all associated data while adding email/password login.

### Troubleshooting

**Issue:** "signInAnonymously is not a function"
- **Fix:** Check that you imported it from `firebase/auth`
- **Fix:** Verify Firebase SDK version is 9.0+

**Issue:** Anonymous sign-in fails with error
- **Fix:** Ensure Anonymous provider is enabled in Firebase Console
- **Fix:** Check Firebase config is correct
- **Fix:** Verify network connection

**Issue:** Anonymous users not showing in console
- **Fix:** Refresh the Users page
- **Fix:** Check the time filter (default: last 30 days)
- **Fix:** Verify sign-in actually succeeded (check browser console)

**Issue:** Cached data not decrypting
- **Fix:** Ensure same device (anonymous UID is device-specific)
- **Fix:** Verify CACHE_SECRET_KEY hasn't changed on server
- **Fix:** Check if user signed out (clears anonymous auth)

### Best Practices

1. **Monitor Anonymous Account Growth**
   - Track daily/weekly sign-ups
   - Alert on unusual spikes (potential abuse)

2. **Set Firestore Security Rules**
   ```javascript
   // Allow anonymous users to read/write their own data only
   match /members/{userId} {
     allow read, write: if request.auth != null && request.auth.uid == userId;
   }
   ```

3. **Clean Up Inactive Accounts**
   - Use Firebase Extensions to delete inactive anonymous accounts
   - Or create a Cloud Function to clean up monthly

4. **Provide Clear UI Indicators**
   - Show when user is in "Quick Access Mode" (anonymous)
   - Explain device-specific nature of cached data
   - Offer option to create permanent account

### Next Steps

After enabling Anonymous Auth:
1. ✅ Enable Anonymous provider in Firebase Console
2. ✅ Test anonymous sign-in from browser
3. ✅ Deploy Cloudflare Worker with CACHE_SECRET_KEY
4. ✅ Test full QR flow (scan → register → cache → return)
5. ✅ Monitor authentication logs for issues
6. ✅ Update Firestore security rules for anonymous users

### References

- [Firebase Anonymous Authentication Docs](https://firebase.google.com/docs/auth/web/anonymous-auth)
- [Upgrading Anonymous Accounts](https://firebase.google.com/docs/auth/web/account-linking)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
