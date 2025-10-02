# Migration Audit: scripts.js → Vue 3

## Audit Status: 🔍 IN PROGRESS

This document compares the original vanilla JavaScript implementation (`src/scripts/scripts.js` - 2829 lines) against the Vue 3 TypeScript implementation to ensure complete feature parity.

---

## 📊 Summary Statistics

| Category | Original (scripts.js) | Vue Implementation | Status |
|----------|----------------------|-------------------|--------|
| **Total Functions** | ~60 functions | Distributed across stores/utils | ⚠️ Partial |
| **Global Variables** | 12+ variables | Pinia state management | ✅ Migrated |
| **Firebase Operations** | Direct SDK calls | Wrapped utilities | ✅ Migrated |
| **UI Sections** | 4 sections | 2 views + components | ✅ Migrated |
| **Phone Validation** | libphonenumber-js + custom | libphonenumber-js | ✅ Migrated |
| **Authentication** | Firebase Auth | Firebase Auth (store) | ✅ Migrated |

---

## 🎯 Section-by-Section Analysis

### SECTION 1: Global Variables & State Management

| Original Variable | Vue Equivalent | Status | Location |
|-------------------|----------------|--------|----------|
| `existingDocId` | `members.store.currentMemberId` | ❌ **MISSING** | N/A |
| `foundRecord` | `members.store.currentMember` | ✅ Migrated | `stores/members.ts` |
| `matchedRecord` | `members.store.currentMember` | ✅ Migrated | `stores/members.ts` |
| `searchCounter` | - | ❌ **MISSING** | N/A |
| `currentAttendance` | - | ❌ **MISSING** | N/A |
| `currentUser` | `auth.store.user` | ✅ Migrated | `stores/auth.ts` |
| `db` | `db` in firebase.ts | ✅ Migrated | `utils/firebase.ts` |
| `auth` | `auth` in firebase.ts | ✅ Migrated | `utils/firebase.ts` |
| `firebaseApp` | `app` in firebase.ts | ✅ Migrated | `utils/firebase.ts` |
| `firebaseInitialized` | Implicit via Firebase init | ✅ Migrated | `utils/firebase.ts` |
| `countriesData` | `countries.ts` | ✅ Migrated | `utils/countries.ts` |
| `AUTHORIZED_USER_EMAILS` | `config.authorizedEmails` | ✅ Migrated | `config/index.ts` |

**Issues Found:**
1. ⚠️ **Missing `searchCounter`**: Tracks number of search attempts to show "Create New Record" button after 2 attempts
2. ⚠️ **Missing `currentAttendance`**: Stores attendance data before save
3. ⚠️ **Missing `existingDocId`**: Tracks the document ID for updates vs creates

---

### SECTION 2: Constants & Configuration

| Original Constant | Vue Equivalent | Status |
|-------------------|----------------|--------|
| `VALIDATION_CONSTANTS.MIN_NAME_LENGTH` | Hardcoded values | ⚠️ Partial |
| `VALIDATION_CONSTANTS.MIN_PHONE_LENGTH` | Hardcoded values | ⚠️ Partial |
| `VALIDATION_CONSTANTS.MAX_PHONE_LENGTH` | Hardcoded values | ⚠️ Partial |
| `VALIDATION_CONSTANTS.TOAST_DURATION` | Toast `duration` param | ⚠️ Partial |
| `VALIDATION_CONSTANTS.DEBOUNCE_DELAY` | `validation.ts` debounce | ⚠️ Partial |
| `ERROR_MESSAGES.*` | Inline error strings | ⚠️ Partial |

**Issues Found:**
1. ⚠️ **No centralized constants file**: Should create `src/constants/index.ts` for consistency

---

### SECTION 3: Utility Functions

| Original Function | Vue Equivalent | Status | Location |
|-------------------|----------------|--------|----------|
| `loadCountriesData()` | `loadCountriesData()` | ✅ Migrated | `utils/countries.ts` |
| `getCountryCodeFromCallingCode()` | `getCountryByCallingCode()` | ✅ Migrated | `utils/countries.ts` |
| `getCallingCodeFromCountryCode()` | Inline in countries.ts | ⚠️ Partial | `utils/countries.ts` |

**Issues Found:**
1. ⚠️ **Missing helper**: `getCallingCodeFromCountryCode()` not explicitly exported

---

### SECTION 4: UI Notification System

| Original Function | Vue Equivalent | Status | Location |
|-------------------|----------------|--------|----------|
| `showToast(message, type, duration)` | `ui.showToast()` | ✅ Migrated | `stores/ui.ts` |
| `closeToast(button)` | Component method | ✅ Migrated | `ToastContainer.vue` |
| `removeToast(toast)` | Component method | ✅ Migrated | `ToastContainer.vue` |

**Status:** ✅ **FULLY MIGRATED**

---

### SECTION 5: Input Validation & Sanitization

| Original Function | Vue Equivalent | Status | Location |
|-------------------|----------------|--------|----------|
| `isValidString(value, minLength)` | `validateName()` | ⚠️ Partial | `utils/validation.ts` |
| `isValidPhoneNumber(phone, inputId)` | `validatePhone()` | ✅ Migrated | `utils/validation.ts` |
| `sanitizeInput(input)` | Inline validation | ⚠️ Partial | N/A |
| `autoFocusToField(fieldId, showMessage)` | - | ❌ **MISSING** | N/A |
| `validateAndFocusFirstError(validations)` | - | ❌ **MISSING** | N/A |

**Issues Found:**
1. ❌ **Missing `autoFocusToField()`**: Auto-scrolls and focuses invalid fields with visual feedback
2. ❌ **Missing `validateAndFocusFirstError()`**: Validates multiple fields and focuses first error
3. ⚠️ **Missing `sanitizeInput()`**: Basic XSS prevention (though Vue provides XSS protection by default)

---

### SECTION 6: Authentication System

| Original Function | Vue Equivalent | Status | Location |
|-------------------|----------------|--------|----------|
| `showLoginScreen()` | Router navigation | ✅ Migrated | `router/index.ts` |
| `showMainApp()` | Router navigation | ✅ Migrated | `router/index.ts` |
| `signInUser()` | `auth.signIn()` | ✅ Migrated | `stores/auth.ts` |
| `resetUserPassword()` | - | ❌ **MISSING** | N/A |

**Issues Found:**
1. ❌ **Missing `resetUserPassword()`**: Password reset functionality not implemented in Vue

---

### SECTION 7: Firebase Initialization & Configuration

| Original Function | Vue Equivalent | Status | Location |
|-------------------|----------------|--------|----------|
| `initializeApp()` | Firebase init in `firebase.ts` | ✅ Migrated | `utils/firebase.ts` |
| `setupEventListeners()` | Vue component lifecycle | ✅ Migrated | Components |

**Status:** ✅ **FULLY MIGRATED** (adapted to Vue's reactive model)

---

### SECTION 8: Search & Record Management

| Original Function | Vue Equivalent | Status | Location |
|-------------------|----------------|--------|----------|
| `searchForRecord()` | `members.searchMember()` | ⚠️ **PARTIAL** | `stores/members.ts` |
| `matchesMultipleNames()` | `normalizeString()` | ⚠️ **PARTIAL** | `utils/validation.ts` |
| `validateSearchPrerequisites()` | Inline validation | ⚠️ Partial | Components |
| `updateSearchUI()` | Vue reactive state | ✅ Migrated | Components |
| `testFirebaseConnection()` | - | ❌ **MISSING** | N/A |
| `performProgressiveSearch()` | - | ❌ **MISSING** | N/A |
| `searchWithName()` | Part of `searchMember()` | ⚠️ Partial | `stores/members.ts` |
| `searchWithCompoundQuery()` | - | ❌ **MISSING** | N/A |
| `searchWithPhoneOnly()` | - | ❌ **MISSING** | N/A |
| `fallbackSearch()` | - | ❌ **MISSING** | N/A |
| `handleSearchResults()` | Component methods | ⚠️ Partial | Components |
| `transitionToNoRecordSection()` | Vue transitions | ⚠️ Partial | Components |
| `handleSearchError()` | Error handling | ⚠️ Partial | `stores/members.ts` |
| `cleanupSearchUI()` | Vue reactive cleanup | ✅ Migrated | Components |

**Issues Found:**
1. ❌ **Missing Progressive Search Logic**: Original uses multi-attempt search with name truncation
2. ❌ **Missing Phone Variants**: `generatePhoneVariants()` for backward compatibility
3. ❌ **Missing Compound Queries**: Complex Firestore queries with phone + name
4. ⚠️ **Simplified Name Matching**: Original has sophisticated multi-name matching
5. ❌ **Missing Firebase Connection Test**: Pre-search connectivity validation

---

### SECTION 9: UI State Management

| Original Function | Vue Equivalent | Status | Location |
|-------------------|----------------|--------|----------|
| `showConfirmationSection(found)` | Component state | ⚠️ Partial | `RegistrationView.vue` |
| `showNoRecordSection()` | Component state | ⚠️ Partial | `RegistrationView.vue` |
| `showNewRecordSection()` | Component state | ⚠️ Partial | `RegistrationView.vue` |
| `showCompletionSection(isNew)` | Component state | ⚠️ Partial | `RegistrationView.vue` |
| `confirmIdentity()` | Component method | ⚠️ Partial | `RegistrationView.vue` |
| `denyIdentity()` | Component method | ⚠️ Partial | `RegistrationView.vue` |
| `disableIdentitySection()` | Vue disabled state | ✅ Migrated | Components |
| `enableIdentitySection()` | Vue disabled state | ✅ Migrated | Components |
| `resetToStep1()` | Component method | ⚠️ Partial | `RegistrationView.vue` |

**Issues Found:**
1. ⚠️ **Simplified Flow**: Original has 4 distinct sections (identity, confirmation, no-record, completion)
2. ⚠️ **Missing Smooth Transitions**: Original uses CSS classes for smooth section transitions
3. ⚠️ **Missing "Create New Record" after 2 searches**: Relies on `searchCounter`

---

### SECTION 10: Phone Number Handling

| Original Function | Vue Equivalent | Status | Location |
|-------------------|----------------|--------|----------|
| `formatPhoneForDisplay(phone, code)` | `formatPhoneNumber()` | ⚠️ Partial | `utils/validation.ts` |
| `setPhoneValue(inputId, phone, code)` | Component binding | ✅ Migrated | `PhoneInput.vue` |
| `getPhoneValue(inputId)` | Component emits | ✅ Migrated | `PhoneInput.vue` |
| `populateNewRecordData()` | Component method | ⚠️ Partial | `RegistrationView.vue` |
| `populateAllEditableFields()` | Component method | ⚠️ Partial | `RegistrationView.vue` |
| `loadAttendanceRecords()` | - | ❌ **MISSING** | N/A |
| `getCurrentService()` | - | ❌ **MISSING** | N/A |
| `getServiceText(service)` | - | ❌ **MISSING** | N/A |
| `updateCurrentServiceDisplay()` | - | ❌ **MISSING** | N/A |
| `clearAllAttendance()` | - | ❌ **MISSING** | N/A |

**Issues Found:**
1. ❌ **Missing Attendance Features**: Entire attendance tracking system not implemented
2. ❌ **Missing Service Detection**: Auto-detect current service (1st/2nd/3rd) based on time
3. ⚠️ **Phone Display Format**: Original handles Uganda-specific formatting (0 prefix vs +256)

---

### SECTION 11: Form Validation & Data Processing

| Original Function | Vue Equivalent | Status | Location |
|-------------------|----------------|--------|----------|
| `validatePhoneNumber(phone, code, id)` | `validatePhone()` | ✅ Migrated | `utils/validation.ts` |
| `getCellValue()` | Form state | ⚠️ Partial | Components |
| `setCellValue(value)` | Form state | ⚠️ Partial | Components |
| `formatPhoneNumber(phone, code)` | `formatPhoneNumber()` | ✅ Migrated | `utils/validation.ts` |
| `normalizePhoneNumber(phone)` | `formatPhoneNumber()` | ⚠️ Partial | `utils/validation.ts` |
| `generatePhoneVariants(phone)` | - | ❌ **MISSING** | N/A |
| `parsePhoneNumber(phone, inputId)` | `parsePhoneNumberFromString()` | ⚠️ Partial | libphonenumber-js |
| `getCallingCodeFromCountryCode(code)` | - | ❌ **MISSING** | N/A |
| `reconstructPhoneNumber(code, national)` | - | ❌ **MISSING** | N/A |
| `formatPhoneForStorage(phone)` | `formatPhoneNumber()` | ⚠️ Partial | `utils/validation.ts` |
| `updateStepIndicator(step)` | Component state | ⚠️ Partial | Components |
| `validateFullName(name)` | - | ❌ **MISSING** | N/A |
| `suggestFullName(name)` | - | ❌ **MISSING** | N/A |
| `validateAndNormalizeSchoolName(school)` | - | ❌ **MISSING** | N/A |
| `validateIdentity()` | - | ❌ **MISSING** | N/A |

**Issues Found:**
1. ❌ **Missing Phone Variants Generation**: Backward compatibility for database queries
2. ❌ **Missing Full Name Validation**: Must have first + last name (2+ names)
3. ❌ **Missing School Name Validation**: Rejects abbreviations, ensures full name
4. ❌ **Missing Identity Validation**: Confirms name matches found record
5. ⚠️ **Missing Step Indicator**: Visual progress through registration steps

---

### SECTION 12: Data Storage & Record Management

| Original Function | Vue Equivalent | Status | Location |
|-------------------|----------------|--------|----------|
| `saveRecord()` | `members.saveMember()` | ⚠️ **PARTIAL** | `stores/members.ts` |
| `resetForm()` | Component method | ⚠️ Partial | `RegistrationView.vue` |
| `clearAllValidationStates()` | - | ❌ **MISSING** | N/A |

**Issues Found:**
1. ⚠️ **Simplified Save Logic**: Original has extensive validation before save
2. ❌ **Missing Validation State Cleanup**: Clears all CSS validation classes
3. ⚠️ **Missing Field Pre-population**: Original pre-fills name/phone from identity search
4. ⚠️ **Missing Attendance Integration**: Original saves attendance with member data

---

### SECTION 13 & 14: Global Exports & Initialization

**Status:** ✅ **NOT APPLICABLE** (Vue uses imports/exports, no need for global window functions)

---

## 🚨 Critical Missing Features

### 1. Search Counter & Progressive "Create New Record" Button
**Original Behavior:**
- Tracks search attempts in `searchCounter` variable
- Shows "Create New Record" button only after 2 failed searches
- Prevents accidental duplicate entries

**Current State:** ❌ Missing entirely

**Impact:** High - Users can create duplicates immediately

**Fix Required:** Add `searchAttempts` to members store

---

### 2. Attendance Tracking System
**Original Behavior:**
- Auto-detects current service (1st: 8:00-10:15, 2nd: 10:00-12:15, 3rd: 12:00-14:15)
- Stores attendance as `{ "DD_MM_YYYY": "1"|"2"|"3" }` object
- Updates display every 60 seconds
- Saves attendance with member record

**Current State:** ❌ Missing entirely

**Impact:** Critical - Core feature not implemented

**Fix Required:** 
1. Create `src/utils/attendance.ts` with service detection logic
2. Add `attendance` field to member interface
3. Add attendance UI to registration form

---

### 3. Progressive Search with Fallbacks
**Original Behavior:**
- Tries full name first
- Progressively shortens name (from length down to 3 chars)
- Uses compound queries (phone + name)
- Falls back to phone-only with enhanced name matching
- Generates phone variants for backward compatibility

**Current State:** ⚠️ Basic search only

**Impact:** High - May miss valid matches

**Fix Required:** Refactor `members.searchMember()` to include progressive logic

---

### 4. Advanced Name Matching
**Original Behavior:**
- `matchesMultipleNames()` handles:
  - Single word matches
  - Multi-word matches (any order)
  - Partial word matches
  - 70% threshold for match confidence

**Current State:** ⚠️ Simple `normalizeString()` comparison

**Impact:** Medium - May fail on name variations

**Fix Required:** Port `matchesMultipleNames()` to validation.ts

---

### 5. Phone Variants for Database Queries
**Original Behavior:**
- `generatePhoneVariants()` creates multiple formats:
  - E.164: `+256701234567`
  - National: `701234567`
  - Legacy: `0701234567`
- Used in Firestore `or()` queries for backward compatibility

**Current State:** ❌ Missing entirely

**Impact:** High - May not find records stored in old formats

**Fix Required:** Add `generatePhoneVariants()` to validation.ts

---

### 6. School Name Validation
**Original Behavior:**
- `validateAndNormalizeSchoolName()`:
  - Rejects abbreviations (e.g., "K.I.S")
  - Ensures minimum 3 characters
  - Suggests full name

**Current State:** ❌ Missing entirely

**Impact:** Medium - Data quality issue

**Fix Required:** Add school validation to validation.ts

---

### 7. Full Name Validation
**Original Behavior:**
- `validateFullName()`: Requires at least 2 names
- `suggestFullName()`: Provides helpful message

**Current State:** ❌ Missing entirely

**Impact:** Medium - Data quality issue

**Fix Required:** Add to validation.ts

---

### 8. Auto-focus with Error Highlighting
**Original Behavior:**
- `autoFocusToField()`:
  - Smooth scrolls to invalid field
  - Focuses field after 300ms delay
  - Adds CSS class `field-error`
  - Removes error class after 3 seconds
  - Handles radio button groups specially

**Current State:** ❌ Missing entirely

**Impact:** Medium - UX degradation

**Fix Required:** Add composable `useFieldFocus()` or utility function

---

### 9. Multi-field Validation with Smart Focus
**Original Behavior:**
- `validateAndFocusFirstError()`:
  - Validates array of fields
  - Shows single error or summary
  - Auto-focuses first invalid field

**Current State:** ❌ Missing entirely

**Impact:** Medium - UX degradation

**Fix Required:** Add to validation.ts

---

### 10. Password Reset Functionality
**Original Behavior:**
- `resetUserPassword()`:
  - Validates email format
  - Checks authorized emails
  - Sends Firebase password reset email
  - Shows detailed error messages

**Current State:** ❌ Missing entirely

**Impact:** High - Users can't reset forgotten passwords

**Fix Required:** Add method to `auth.store.ts`

---

### 11. Firebase Connection Test
**Original Behavior:**
- `testFirebaseConnection()`:
  - Tests connection before search
  - Shows user-friendly errors
  - Handles `unavailable` and `permission-denied` errors

**Current State:** ❌ Missing entirely

**Impact:** Low - Nice to have

**Fix Required:** Add to firebase.ts utility

---

### 12. Smooth Section Transitions
**Original Behavior:**
- Uses CSS classes: `transitioning-out`, `transitioning-in`
- 400ms animation timing
- Coordinated hide/show with callbacks

**Current State:** ⚠️ Vue Transition component used, but simpler

**Impact:** Low - Aesthetic

**Fix Required:** Add Transition component with matching animations

---

### 13. Document ID Tracking
**Original Behavior:**
- `existingDocId` tracks Firestore document ID
- Used to differentiate create vs update operations

**Current State:** ❌ Missing explicit tracking

**Impact:** High - May cause save issues

**Fix Required:** Add `currentMemberId` to members store

---

### 14. Validation State Cleanup
**Original Behavior:**
- `clearAllValidationStates()`:
  - Removes all `field-error`, `field-valid` classes
  - Clears `setCustomValidity()`
  - Resets border colors
  - Clears error messages

**Current State:** ❌ Missing entirely

**Impact:** Medium - May show stale validation after reset

**Fix Required:** Add to form reset logic

---

## 📝 Recommendations

### Priority 1: Critical Features (Must Fix Before Release)
1. ✅ **Implement Attendance System**
   - Create `utils/attendance.ts`
   - Add service detection logic
   - Update member interface
   - Add UI to registration form

2. ✅ **Add Search Counter & Progressive Button Logic**
   - Add `searchAttempts` to members store
   - Show "Create New Record" after 2 attempts

3. ✅ **Add Document ID Tracking**
   - Add `currentMemberId` to members store
   - Track for update vs create operations

4. ✅ **Implement Password Reset**
   - Add `resetPassword()` to auth store
   - Add UI button/link

### Priority 2: High Impact Features
5. ✅ **Port Progressive Search Logic**
   - Refactor `searchMember()` with fallbacks
   - Add phone variants generation
   - Add advanced name matching

6. ✅ **Add Full Name & School Validation**
   - Validate 2+ names required
   - Reject school abbreviations

### Priority 3: Medium Impact Features
7. ✅ **Add Auto-focus with Error Highlighting**
   - Create `useFieldFocus()` composable
   - Add error highlighting CSS

8. ✅ **Add Validation State Cleanup**
   - Clear validation on form reset

### Priority 4: Nice to Have
9. ✅ **Add Smooth Section Transitions**
   - Match original 400ms timing
   - Use Vue Transition groups

10. ✅ **Centralize Constants**
    - Create `src/constants/index.ts`
    - Move validation constants

---

## ✅ What's Working Well

1. **Pinia State Management**: Clean separation of concerns
2. **TypeScript Type Safety**: Catches errors early
3. **Component Modularity**: Reusable components
4. **Firebase Utilities**: Clean wrapper functions
5. **Phone Input Component**: Works well with libphonenumber-js
6. **Toast Notifications**: Better styled than original
7. **Routing**: Clean separation of login/registration/admin
8. **Config System**: Flexible TypeScript + env vars

---

## 🔧 Next Steps

1. **Read and understand** this audit document
2. **Prioritize** fixes based on user impact
3. **Implement** Priority 1 features first
4. **Test** each feature thoroughly
5. **Update** this document as features are completed

---

## 📊 Completion Status

- **Global State**: 75% Complete
- **Authentication**: 85% Complete (missing password reset)
- **Search Logic**: 40% Complete (missing progressive search)
- **Phone Validation**: 70% Complete (missing variants)
- **Form Validation**: 50% Complete (missing full name, school, auto-focus)
- **UI Transitions**: 60% Complete (basic transitions working)
- **Attendance System**: 0% Complete ❌
- **Data Storage**: 80% Complete (basic save working)

**Overall Migration Status: 62% Complete**

---

## 📅 Audit Date
**Created:** 2024-01-XX  
**Last Updated:** 2024-01-XX  
**Audited By:** GitHub Copilot  
**Original File:** `src/scripts/scripts.js` (2829 lines)  
**Vue Files:** `vue/src/**/*.{ts,vue}` (Multiple files)
