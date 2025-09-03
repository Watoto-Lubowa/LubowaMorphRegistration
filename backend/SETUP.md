# Lubowa Morph Registration - FastAPI Backend Setup

## Quick Start Guide

### 1. Prerequisites
- Python 3.8 or higher
- Firebase project with Firestore enabled
- Firebase service account key

### 2. Installation

```bash
cd backend
pip install -r requirements.txt
```

### 3. Configuration

1. Copy the environment file:
```bash
cp .env.example .env
```

2. Edit `.env` with your actual values:
```env
# Firebase settings
FIREBASE_PROJECT_ID=your-actual-project-id
FIREBASE_PRIVATE_KEY_PATH=path/to/serviceAccount.json

# Security
SECRET_KEY=your-super-secret-key-here

# Admin emails (comma-separated)
AUTHORIZED_ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

3. Download your Firebase service account key:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate new private key
   - Save as `serviceAccount.json` in the backend directory
   - Update the path in `.env`

### 4. Run the Server

Development mode (with auto-reload):
```bash
python run_dev.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 5. Test the API

```bash
python test_api.py
```

Visit the API documentation at: http://localhost:8000/docs

## API Endpoints Overview

### Member Operations
- `POST /api/members/search` - Search for existing members
- `POST /api/members` - Create new member  
- `GET /api/members/{id}` - Get member details
- `PUT /api/members/{id}` - Update member
- `DELETE /api/members/{id}` - Delete member (admin only)

### Attendance
- `POST /api/attendance/{id}` - Add attendance
- `GET /api/attendance/{id}` - Get attendance records
- `DELETE /api/attendance/{id}/{date}` - Remove attendance

### Data Management (Admin Only)
- `GET /api/data/export` - Export data as CSV
- `POST /api/data/import` - Import CSV data
- `GET /api/data/stats` - Get statistics

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Utilities
- `GET /health` - Health check
- `GET /api/services/current` - Get current service time

## Frontend Integration

To integrate with your existing frontend, update the JavaScript to call these API endpoints instead of directly calling Firebase. For example:

```javascript
// Instead of direct Firebase calls:
// const docRef = await setDoc(doc(db, "morphers"), data);

// Use API calls:
const response = await fetch('/api/members', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(memberData)
});
```

## Security Features

- JWT token authentication for admin operations
- Phone number validation and normalization
- Input sanitization and validation
- CORS configuration for frontend integration
- Authorized email list for admin access

## Development Notes

- The backend maintains full compatibility with your existing Firestore database
- All phone numbers are normalized for consistent storage
- Progressive search algorithm matches the original JavaScript logic
- Full attendance tracking with date-based records
- CSV import/export functionality for bulk operations

## Production Deployment

For production deployment:

1. Set `DEBUG=false` in environment
2. Use proper secret keys
3. Configure production CORS origins
4. Set up proper Firebase authentication
5. Use a production WSGI server like Gunicorn

Example production command:
```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```
