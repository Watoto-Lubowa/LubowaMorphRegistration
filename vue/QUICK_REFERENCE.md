# Lubowa Morph Registration - Quick Reference Guide

## 🚀 Quick Start

```bash
# Start Development Server
cd vue
npm run dev
# Server runs on http://localhost:5173 (or next available port)
```

## 📁 Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/views/RegistrationView.vue` | Main registration interface | 633 |
| `src/views/AdminView.vue` | Admin dashboard | - |
| `src/stores/members.ts` | Member CRUD & search logic | 329 |
| `src/stores/auth.ts` | Authentication state | 171 |
| `src/utils/validation.ts` | Phone formatting & validation | 387 |
| `src/utils/attendance.ts` | Time-based service detection | 300 |
| `src/components/LoginForm.vue` | Login UI component | - |
| `src/components/PhoneInput.vue` | Phone number input component | - |

## 🔐 Authentication

**Authorized Emails:**
- Configured in `src/stores/auth.ts`
- Uses Firebase Authentication with session persistence
- Auto-login on page refresh via `onAuthStateChanged`

**Key Functions:**
```typescript
await authStore.signIn(email, password)  // Login
await authStore.signOut()                // Logout
await authStore.resetPassword(email)     // Password reset
```

## 🔍 Search Flow

**Progressive Search Algorithm:**
1. Starts with full name (e.g., "Jerome Lubowa")
2. Reduces by one word each iteration
3. Minimum 3 characters to search
4. Uses Firebase compound queries with phone number variants

**Phone Number Handling:**
- **Display Format:** `0701234567` (Uganda), `+1234567890` (others)
- **Storage Format:** `+256701234567` (E.164 for all)
- **Search Variants:** Generates multiple formats for fuzzy matching

**Key Functions:**
```typescript
await membersStore.performProgressiveSearch(name, phone, countryCode)
membersStore.searchWithCompoundQuery(nameLength, phone, countryCode)
membersStore.searchWithPhoneOnly(phone, countryCode)
```

## ⏰ Attendance System

**Service Times:**
- **Service 1:** 8:00 AM - 10:15 AM
- **Service 2:** 10:00 AM - 12:15 PM
- **Service 3:** 12:00 PM - 2:15 PM

**Auto-Population:**
- Automatically detects current service based on time
- Pre-fills attendance for today's service
- Merges with existing attendance records

**Key Functions:**
```typescript
import { getCurrentService, autoPopulateAttendance } from '@/utils/attendance'

const service = getCurrentService()  // Returns '1', '2', or '3'
const attendance = autoPopulateAttendance(existingRecords)
```

## ✅ Form Validation

**Name Validation:**
- Minimum 2 names required
- Each name >= 2 characters
- Example: "Jerome Lubowa" ✅, "J" ❌

**Phone Validation:**
- Uses `libphonenumber-js` for E.164 validation
- Country code required
- Minimum 7 digits

**School Validation:**
- Rejects abbreviations (uppercase words <= 3 chars)
- Minimum 3 characters
- Example: "Kampala International School" ✅, "K.I.S." ❌

**Required Fields:**
- Full Name, Morpher's Phone, Parent's Name, Parent's Phone
- School, Class, Residence, Cell

## 💾 Save Operations

**New Member:**
```typescript
await membersStore.saveMember({
  ...formData,
  MorphersNumber: formatPhoneForStorage(phone, countryCode),
  // Phones stored in E.164 format
})
```

**Update Existing:**
- Uses `docId` from search result
- Merges new data with existing record
- Preserves unchanged fields
- Merges attendance records

## 🌍 Countries Data

**Loading:**
```typescript
import { loadCountriesData } from '@/utils/countries'

const countries = await loadCountriesData()
// Returns array of 248 countries with dialCode and isoCode
```

**Fallback:**
- Uses East African countries if JSON load fails
- Default country: Uganda (+256)

## 🎨 UI Components

**Toast Notifications:**
```typescript
import { useUIStore } from '@/stores/ui'

const uiStore = useUIStore()
uiStore.showToast('Success message', 'success')  // success, error, warning, info
```

**Phone Input:**
```vue
<PhoneInput
  v-model:phone="formData.MorphersNumber"
  v-model:country-code="formData.MorphersCountryCode"
  :countries="countries"
  :required="true"
/>
```

**Step Indicator:**
- Step 1: Identity Section (search)
- Step 2: Completion Section (form)
- Automatically updates based on `currentStep` reactive state

## 🔄 User Flows

### Flow 1: New Member Registration
1. **Login** → Enter authorized email/password
2. **Search** → Enter name + phone (not found)
3. **Create New** → Click "Create New Record" after 2+ searches
4. **Fill Form** → Complete all required fields
5. **Save** → Submit form, validate, save to Firebase
6. **Reset** → Form clears, ready for next member

### Flow 2: Existing Member Update
1. **Login** → Enter authorized email/password
2. **Search** → Enter name + phone (found!)
3. **Confirm Identity** → Review details, click "Confirm"
4. **Update Form** → Modify fields if needed
5. **Save** → Submit form, merge with existing data
6. **Reset** → Form clears, ready for next member

## 📊 Database Structure

**Firebase Collection:** `members`

**Document Fields:**
```typescript
{
  FullName: string
  MorphersNumber: string        // E.164 format
  MorphersCountryCode: string   // e.g., "UG", "US"
  ParentsName: string
  ParentsNumber: string         // E.164 format
  ParentsCountryCode: string
  School: string
  Class: string
  Residence: string
  Cell: string                  // "Shepherds", "Leaders", or "None"
  createdAt: Timestamp
  updatedAt: Timestamp
  attendance: {
    [dateKey: string]: {        // Format: "DD_MM_YYYY"
      service1?: boolean
      service2?: boolean
      service3?: boolean
    }
  }
}
```

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Start dev server with HMR
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check

# Lint code
npm run lint
```

## 🔧 Configuration Files

**Vite Config:** `vite.config.ts`
- Port: 5173 (auto-increments if occupied)
- HMR enabled
- TypeScript support

**Tailwind Config:** `tailwind.config.js`
- Custom gradient colors
- Typography plugin
- Forms plugin

**Firebase Config:** `src/config/index.ts`
- API keys (use `config.local.ts` for development)
- Project ID, storage bucket, etc.

**TypeScript Config:** `tsconfig.json`
- Strict mode enabled
- Path aliases: `@/*` → `src/*`

## 🐛 Common Issues

**Issue:** Phone numbers showing as +256701234567 instead of 0701234567
**Solution:** Use `formatPhoneForDisplay()` utility:
```typescript
import { formatPhoneForDisplay } from '@/utils/validation'

const displayPhone = formatPhoneForDisplay('+256701234567', 'UG')
// Returns: "0701234567"
```

**Issue:** Search not finding records
**Solution:** Check phone number variants are generated correctly:
```typescript
import { generatePhoneVariants } from '@/utils/validation'

const variants = generatePhoneVariants('0701234567', 'UG')
// Returns: ['+256701234567', '256701234567', '0701234567', '701234567']
```

**Issue:** Form validation not triggering
**Solution:** Ensure `isFormValid` computed property is used:
```typescript
const isFormValid = computed(() => {
  return formData.FullName?.trim() &&
         formData.MorphersNumber?.trim() &&
         // ... all required fields
})
```

**Issue:** Attendance not auto-populating
**Solution:** Check current service detection:
```typescript
import { getCurrentService } from '@/utils/attendance'

const service = getCurrentService()
console.log('Current service:', service)  // Should return '1', '2', '3', or null
```

## 📚 Additional Documentation

- **Full Migration Report:** `MIGRATION_COMPLETION_SUMMARY.md`
- **Vue Setup Guide:** `VUE_SETUP_COMPLETE.md`
- **Backend API:** `../backend/README.md`
- **Security Guide:** `../docs/SECURITY_GUIDE.md`

## 🎯 Key Metrics

- **Total Lines:** 2,600+ (Vue/TypeScript)
- **Components:** 4 Vue components
- **Stores:** 3 Pinia stores
- **Utilities:** 5 utility modules
- **Countries Supported:** 248
- **Feature Parity:** 100% ✅

## 🚢 Deployment

**Production Build:**
```bash
npm run build
# Output: dist/ folder
```

**Firebase Hosting:**
```bash
firebase deploy --only hosting
```

**Environment Variables:**
- Copy `src/config/config.local.example.ts` to `config.local.ts`
- Add Firebase API keys and configuration
- Never commit `config.local.ts` (in `.gitignore`)

## 📞 Support

For issues or questions, refer to:
1. `MIGRATION_COMPLETION_SUMMARY.md` for detailed implementation
2. Inline code comments for specific function documentation
3. Original `scripts.js` in root for legacy reference

---

**Last Updated:** December 2024  
**Vue Version:** 3.5.13  
**TypeScript Version:** 5.6.3  
**Migration Status:** ✅ Complete (35/35 items verified)
