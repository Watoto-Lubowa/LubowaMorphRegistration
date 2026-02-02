# Secret Gesture Feature - Implementation Summary

## Overview
Implemented a "7 taps in 7 seconds" secret gesture on the Watoto logo to reveal facilitator settings.

## Features

### 1. **Secret Gesture Activation**
- **Trigger**: Click/tap the Watoto logo 7 times within a 7-second window
- **Counter Reset**: If the user doesn't complete 7 taps within 7 seconds, the counter resets
- **Feedback**: Success toast notification when unlocked

### 2. **Ghost Button Styling**
- ✅ **No background**: Completely transparent at all times
- ✅ **No border**: Clean, minimalist appearance
- ✅ **No shadow**: Subtle and unobtrusive
- ✅ **Light grey icon**: #9ca3af color for subtle visibility
- ✅ **Hover effect**: Scales to 1.15x and darkens slightly (#6b7280)

### 3. **Animations**

#### Reveal Animation (Rotate In)
- **Duration**: 0.6 seconds
- **Effect**: 
  - Rotates 360 degrees
  - Scales from 0.5 to 1.0
  - Fades from opacity 0 to 1
- **Easing**: cubic-bezier(0.34, 1.56, 0.64, 1) for bounce effect

#### Hide Animation (Rotate Out)
- **Duration**: 0.6 seconds
- **Effect**:
  - Rotates from 360 degrees back to 0
  - Scales from 1.0 to 0.5
  - Fades from opacity 1 to 0
- **Trigger**: Automatically when settings modal is closed
- **Easing**: Same as reveal for consistency

### 4. **Positioning**
- **Desktop**: Top-right corner of the registration card (20px from top and right)
- **Mobile**: Slightly inset (10px from right) for better touch access
- **Position Type**: Absolute (relative to `.main-container`)

### 5. **Behavior Flow**
1. User taps logo 7 times within 7 seconds
2. Settings button rotates in and fades in
3. Button remains visible and clickable
4. User clicks button → settings modal opens
5. User closes modal → button rotates out and fades out
6. **Must reactivate** with 7 taps to reveal again

## Technical Implementation

### Files Modified
1. **`/vue/src/views/RegistrationView.vue`**
   - Added tap detection logic
   - Implemented show/hide functions with animations
   - Added watcher to auto-hide on modal close
   - Moved button inside `.main-container` for relative positioning

2. **`/vue/src/style.css`**
   - Removed all borders and backgrounds
   - Changed from `position: fixed` to `position: absolute`
   - Implemented rotation animations
   - Removed old slide animations
   - Updated mobile styles

### Key Code Elements

#### Template
```vue
<button 
  class="floating-settings-btn"
  :class="{ 
    revealed: isSettingsRevealed, 
    'rotate-in': isSettingsAnimating && isSettingsRevealed,
    'rotate-out': isSettingsAnimating && !isSettingsRevealed
  }"
>
```

#### State Management
```typescript
const isSettingsRevealed = ref(false)  // Button visibility
const isSettingsAnimating = ref(false) // Animation in progress
const logoTapCount = ref(0)            // Current tap count
const logoTapTimer = ref<...>(null)    // 7-second window timer
```

#### Auto-hide Watcher
```typescript
watch(showSettings, (newValue, oldValue) => {
  if (oldValue === true && newValue === false && isSettingsRevealed.value) {
    hideSettingsButton()
  }
})
```

### CSS Keyframes
```css
@keyframes rotateIn {
  0% { opacity: 0; transform: rotate(0deg) scale(0.5); }
  100% { opacity: 1; transform: rotate(360deg) scale(1); }
}

@keyframes rotateOut {
  0% { opacity: 1; transform: rotate(360deg) scale(1); }
  100% { opacity: 0; transform: rotate(0deg) scale(0.5); }
}
```

## User Experience
- **Discovery**: Hidden until activated (no visual clue)
- **Activation**: Requires deliberate action (7 taps)
- **Feedback**: Clear success message on unlock
- **Persistence**: Single-use per session (hides after use)
- **Reactivation**: Same gesture required each time

## Notes
- The duplicate ID warning for `quickCheckInService` is a pre-existing issue unrelated to this feature
- The form label warning is also pre-existing and outside the scope of this implementation
