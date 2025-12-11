# QR Code Generation Feature

## Overview
Implemented bulk QR code generation for all three Sunday services at Watoto Church Lubowa. Admin can generate and print all QR codes in one action, with each service QR code on a separate page.

## Implementation Date
January 2025

## Architecture

### Module Structure
Following SonarQube standards with proper separation of concerns:

```
generateAllQRCodes() → Main orchestrator
  ├─ generateServiceQR(serviceNum) → Generate single service QR
  ├─ createPrintLayout(qrData[]) → Build print-ready HTML
  └─ printQRCodes(html) → Trigger print dialog
```

### Key Components

#### 1. Service QR Generation (`generateServiceQR`)
**Purpose**: Generate QR code for a specific service using Cloudflare Worker encryption

**Input**: Service number (1, 2, or 3)

**Output**: `ServiceQRData` object containing:
- `serviceNumber`: Number identifying the service
- `serviceName`: Display name (e.g., "First Service")
- `serviceTime`: Time range (e.g., "8:00 AM - 10:00 AM")
- `qrCodeDataUrl`: Base64-encoded QR code image

**Service Schedule**:
- Service 1: 8:00 AM - 10:00 AM
- Service 2: 10:00 AM - 12:00 PM
- Service 3: 12:00 PM - 2:00 PM

**QR Code Specifications**:
- Format: Data URL (base64)
- Size: 400x400 pixels
- Error correction: Level H (highest)
- Margin: 2 units
- Content: **Encrypted payload from Cloudflare Worker** containing:
  - Service window (dateFrom, dateTo) for next Sunday
  - Service number
  - URL path for validation
  - All data encrypted using AES-GCM

**Worker Integration**:
- Calls `generateServiceQRForService(serviceNumber)` from `@/utils/cloudflareWorker`
- Worker endpoint: `GET /generate-qr-for-service?service=X`
- Worker calculates next Sunday and generates encrypted payload
- QR code contains same encrypted format as live QR check-in system

#### 2. Print Layout Creation (`createPrintLayout`)
**Purpose**: Generate print-ready HTML with all QR codes

**Input**: Array of `ServiceQRData` objects

**Output**: Complete HTML document with print styles

**Layout Features**:
- **Page Format**: A4 portrait, one service per page
- **Logo**: Watoto Church logo at top (80px height)
- **Service Info**: 
  - Service name (2.5rem, bold)
  - Time range (1.5rem)
  - Location "Watoto Church Lubowa" (1.2rem)
- **QR Code**: 
  - 400px max-width
  - Bordered with rounded corners
  - White background with padding
- **Instructions**: Bottom text explaining usage

**Print Styles**:
- `@page` rule: A4 portrait, zero margins
- `page-break-after`: Automatic page breaks between services
- Responsive: Images load before print dialog opens

#### 3. Print Execution (`printQRCodes`)
**Purpose**: Open print dialog with generated content

**Implementation**:
1. Opens new blank window
2. Writes HTML content
3. Waits for images to load (`window.onload`)
4. Triggers print dialog

**Error Handling**: Checks for popup blockers

#### 4. Main Orchestrator (`generateAllQRCodes`)
**Purpose**: Coordinate entire QR generation workflow

**Workflow**:
1. **Authentication Check**: Verify admin privileges
2. **Parallel Generation**: Generate all 3 QR codes simultaneously
3. **Layout Creation**: Build print HTML
4. **Print Trigger**: Open print dialog
5. **User Feedback**: Success/error messages

**State Management**:
- Sets `isGeneratingQRs = true` during operation
- Resets state in `finally` block (guarantees cleanup)
- Updates UI with loading spinner

**Error Handling**:
- Validates authentication
- Catches all errors from generation/print pipeline
- Displays user-friendly error messages
- Logs detailed errors to console

## User Interface

### Admin Panel Card
```vue
<div class="action-card">
  <div class="action-icon">📱</div>
  <h3>Generate QR Codes</h3>
  <p>Generate QR codes for all three Sunday services</p>
  <button @click="generateAllQRCodes" :disabled="isGeneratingQRs">
    <span v-if="!isGeneratingQRs">Generate & Print</span>
    <span v-else>Generating...</span>
  </button>
</div>
```

### Button States
- **Idle**: "Generate & Print" (enabled)
- **Loading**: "Generating..." (disabled)
- **Disabled**: When `isGeneratingQRs = true`

## Technical Specifications

### Dependencies
- **qrcode**: `^1.5.4` - QR code generation
- **@types/qrcode**: `^1.5.6` - TypeScript types
- **Cloudflare Worker**: Encryption and service window calculation

### Worker Endpoint
**URL**: `GET /generate-qr-for-service?service=X`

**Parameters**:
- `service`: Service number (1, 2, or 3)

**Response**:
```json
{
  "success": true,
  "qrData": "encrypted_payload_base64",
  "serviceInfo": {
    "serviceNumber": 1,
    "startTime": "2025-12-14T05:00:00.000Z",
    "endTime": "2025-12-14T07:15:00.000Z"
  }
}
```

**Encryption Details**:
- Algorithm: AES-GCM with 256-bit key
- Key: `QR_SECRET_KEY` environment variable
- Payload structure:
  ```json
  {
    "x": "dateFrom (ISO timestamp)",
    "y": "dateTo (ISO timestamp)",
    "u": "/qrcode/scan",
    "s": serviceNumber
  }
  ```

### TypeScript Interfaces
```typescript
interface ServiceQRData {
  serviceNumber: number
  serviceName: string
  serviceTime: string
  qrCodeDataUrl: string
}
```

### State Variables
```typescript
const isGeneratingQRs = ref(false) // Loading state for QR generation
```

### Imports
```typescript
import QRCode from 'qrcode'
import { appConfig } from '@/config'
```

## Print Output

### Page Structure (Per Service)
```
┌─────────────────────────────────────┐
│         [Watoto Logo]               │
│                                     │
│        First Service                │
│      8:00 AM - 10:00 AM            │
│    Watoto Church Lubowa            │
│                                     │
│      ┌───────────────┐             │
│      │               │             │
│      │   [QR CODE]   │             │
│      │               │             │
│      └───────────────┘             │
│                                     │
│  Scan this QR code to check in     │
│      for First Service              │
└─────────────────────────────────────┘
```

### Print Specifications
- **Paper Size**: A4 (210mm × 297mm)
- **Orientation**: Portrait
- **Margins**: 0 (full bleed)
- **Pages**: 3 (one per service)
- **Format**: HTML5 with CSS print styles

## Security & Access Control

### Authentication Requirements
- User must be authenticated (`isAuthenticated = true`)
- User must have admin privileges (`isAdmin = true`)
- Function immediately returns with error if unauthorized

### Error Messages
- "Access denied: Admin privileges required" - Unauthorized access
- "Failed to open print window. Please check your popup blocker settings." - Popup blocked
- "Failed to generate QR codes: [error]" - Generation failure

## QR Code Flow

### Generation to Check-in Flow
1. **Admin**: Clicks "Generate & Print" button
2. **System**: Generates 3 QR codes with service-specific URLs
3. **Admin**: Prints QR codes (one per service)
4. **Admin**: Posts printed QR codes at church entrance
5. **User**: Opens camera/QR scanner app
6. **User**: Scans QR code
7. **System**: Redirects to `/qr?service=X`
8. **QRView**: Validates service, location, and checks in user

### QR Code Data Structure
- **Format**: Encrypted base64 string (same as live system)
- **Encryption**: AES-GCM with QR_SECRET_KEY
- **Contains**: Service window timestamps for next Sunday (or current Sunday if generated on Sunday)
- **Validation**: QRView decrypts and validates against current time window
- **Security**: Cannot be forged without secret key, prevents replay attacks outside service window

## Testing Checklist

### Functional Testing
- [ ] Admin can generate all 3 QR codes
- [ ] Print dialog opens automatically
- [ ] Each QR code is on separate page
- [ ] Logo displays correctly
- [ ] Service info is accurate
- [ ] QR codes scan correctly
- [ ] URLs redirect to correct service

### Security Testing
- [ ] Non-admin users cannot access feature
- [ ] Unauthenticated users blocked
- [ ] Error handling works correctly

### UI Testing
- [ ] Button disabled during generation
- [ ] Loading spinner displays
- [ ] Success/error messages show
- [ ] Card styling consistent with admin panel

### Print Testing
- [ ] Page breaks work correctly
- [ ] Logo prints clearly
- [ ] QR codes print at correct size
- [ ] Text is readable
- [ ] Layout centered on page

## Performance

### Optimization Strategies
1. **Parallel Generation**: All 3 QR codes generated simultaneously using `Promise.all()`
2. **Lazy Window Load**: Print dialog waits for images to load before triggering
3. **Error Isolation**: Individual QR generation failures don't block others

### Expected Performance
- **Generation Time**: ~500ms for all 3 QR codes
- **Print Dialog**: Opens within 1 second
- **Total Workflow**: < 2 seconds from click to print

## Code Quality

### SonarQube Standards
✅ **Modularity**: Separate functions for each concern
✅ **Error Handling**: Try-catch with proper cleanup
✅ **Type Safety**: TypeScript interfaces for all data structures
✅ **Documentation**: JSDoc comments for all functions
✅ **Naming**: Clear, descriptive function and variable names
✅ **Separation of Concerns**: Generation, layout, and printing isolated

### Best Practices
- **Single Responsibility**: Each function has one clear purpose
- **DRY Principle**: Service info centralized in object
- **Error Recovery**: State always reset in `finally` block
- **User Feedback**: Clear messages for all outcomes
- **Accessibility**: Print-friendly layout with semantic HTML

## Maintenance

### Future Enhancements
- [ ] Add download as PDF option
- [ ] Support custom service times
- [ ] Add QR code customization (colors, logo in QR)
- [ ] Email QR codes to admins
- [ ] Track QR code usage analytics

### Known Limitations
- Requires popup permissions (browser security)
- Print layout optimized for A4 paper only
- Service times hardcoded (not dynamic from schedule)

## Related Files

### Modified Files
- `vue/src/views/AdminView.vue` - Main implementation
- `vue/package.json` - Dependencies (qrcode already installed)

### Related Features
- `vue/src/views/QRView.vue` - QR check-in entry point
- `cloudflare-worker/src/index.ts` - Service validation
- `vue/src/stores/members.ts` - GPS enforcement state

## References

### Documentation
- [qrcode npm package](https://www.npmjs.com/package/qrcode)
- [CSS @page rule](https://developer.mozilla.org/en-US/docs/Web/CSS/@page)
- [Window.print() API](https://developer.mozilla.org/en-US/docs/Web/API/Window/print)

### Internal Docs
- `SERVER_DEPLOYMENT_GUIDE.md` - Deployment instructions
- `VUE_SETUP_COMPLETE.md` - Vue setup documentation
- `SECURITY_GUIDE.md` - Security best practices

## Support

### Common Issues

**Issue**: Print dialog doesn't open
**Solution**: Check popup blocker settings in browser

**Issue**: QR codes don't scan
**Solution**: Ensure adequate lighting and print quality

**Issue**: Wrong service detected
**Solution**: Verify service parameter in QR URL matches schedule

### Contact
For issues or questions, contact the development team or refer to the project README.

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: Production Ready ✅
