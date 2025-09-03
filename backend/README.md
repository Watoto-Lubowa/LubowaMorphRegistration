# FastAPI Backend for Lubowa Morph Registration

This is the FastAPI backend that extracts all server-side functionality from the original JavaScript client-side application.

## Features

- **Member Registration API**: Handle member registration and updates
- **Search API**: Search for existing members by name and phone number
- **Attendance Management**: Track service attendance
- **CSV Import/Export**: Bulk data operations
- **Admin Authentication**: Secure admin operations
- **Firebase Integration**: Maintain compatibility with existing Firestore database

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables in `.env`:
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_PATH=path/to/serviceAccount.json
AUTHORIZED_ADMIN_EMAILS=admin1@example.com,admin2@example.com
SECRET_KEY=your-secret-key
```

3. Run the server:
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000` with automatic docs at `http://localhost:8000/docs`.

## API Endpoints

### Member Operations
- `POST /api/members/search` - Search for existing members
- `POST /api/members` - Create new member
- `PUT /api/members/{member_id}` - Update existing member
- `GET /api/members/{member_id}` - Get member by ID
- `DELETE /api/members/{member_id}` - Delete member (admin only)

### Attendance
- `POST /api/attendance/{member_id}` - Add attendance record
- `GET /api/attendance/{member_id}` - Get member attendance
- `DELETE /api/attendance/{member_id}/{date}` - Remove attendance record

### Data Management
- `GET /api/data/export` - Export all data as CSV (admin only)
- `POST /api/data/import` - Import CSV data (admin only)
- `GET /api/data/stats` - Get system statistics

### Administration
- `POST /api/auth/login` - Admin login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

## Architecture

- **FastAPI**: Modern, fast web framework for building APIs
- **Firebase Admin SDK**: Server-side Firebase integration
- **Pydantic**: Data validation and serialization
- **JWT**: Secure authentication
- **Phone validation**: International phone number validation
- **CSV processing**: Pandas for data import/export
