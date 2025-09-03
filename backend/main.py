#!/usr/bin/env python3
"""
Main FastAPI application for Lubowa Morph Registration Backend
"""

import os
import sys
from pathlib import Path
from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
import uvicorn
from typing import List, Optional, Dict, Any
import logging

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from config import settings
from models import (
    MemberSearchRequest, 
    MemberCreateRequest, 
    MemberUpdateRequest, 
    MemberResponse,
    AttendanceRequest,
    LoginRequest,
    LoginResponse,
    StatsResponse,
    APIResponse
)
from services.firebase_service import FirebaseService
from services.auth_service import AuthService
from services.member_service import MemberService
from services.data_service import DataService
from utils.validation import PhoneValidator
from utils.exceptions import ValidationError, AuthenticationError, NotFoundError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize services
firebase_service = None
auth_service = None
member_service = None
data_service = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup"""
    global firebase_service, auth_service, member_service, data_service
    
    try:
        # Initialize Firebase service
        firebase_service = FirebaseService(
            project_id=settings.FIREBASE_PROJECT_ID,
            private_key_path=settings.FIREBASE_PRIVATE_KEY_PATH
        )
        
        # Initialize other services
        auth_service = AuthService(
            secret_key=settings.SECRET_KEY,
            authorized_emails=settings.AUTHORIZED_ADMIN_EMAILS
        )
        
        member_service = MemberService(firebase_service)
        data_service = DataService(firebase_service)
        
        logger.info("✅ All services initialized successfully")
        yield
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize services: {e}")
        raise
    finally:
        # Cleanup if needed
        logger.info("🧹 Cleaning up services...")

# Create FastAPI app
app = FastAPI(
    title="Lubowa Morph Registration API",
    description="Backend API for the Lubowa Morph Registration System",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Verify JWT token and return admin user info"""
    try:
        token = credentials.credentials
        user_info = auth_service.verify_token(token)
        return user_info
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Lubowa Morph Registration API is running"}

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Lubowa Morph Registration API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

# =======================
# MEMBER ENDPOINTS
# =======================

@app.post("/api/members/search", response_model=APIResponse)
async def search_members(request: MemberSearchRequest):
    """Search for existing members by first name and phone number"""
    try:
        # Validate phone number
        if not PhoneValidator.validate_phone_number(request.phone_number):
            raise ValidationError("Invalid phone number format")
        
        # Search for member
        member = await member_service.search_member(
            first_name=request.first_name,
            phone_number=request.phone_number
        )
        
        if member:
            return APIResponse(
                success=True,
                message="Member found",
                data={"member": member, "found": True}
            )
        else:
            return APIResponse(
                success=True,
                message="No member found",
                data={"member": None, "found": False}
            )
    
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during search"
        )

@app.post("/api/members", response_model=APIResponse)
async def create_member(request: MemberCreateRequest):
    """Create a new member"""
    try:
        # Validate required fields
        if not request.name or len(request.name.strip()) < 2:
            raise ValidationError("Name must be at least 2 characters long")
        
        if not PhoneValidator.validate_phone_number(request.morphers_number):
            raise ValidationError("Invalid morpher's phone number")
        
        if request.parents_number and not PhoneValidator.validate_phone_number(request.parents_number):
            raise ValidationError("Invalid parent's phone number")
        
        # Create member
        member_id = await member_service.create_member(request)
        
        return APIResponse(
            success=True,
            message="Member created successfully",
            data={"member_id": member_id}
        )
    
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Create member error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create member"
        )

@app.get("/api/members/{member_id}", response_model=APIResponse)
async def get_member(member_id: str):
    """Get member by ID"""
    try:
        member = await member_service.get_member(member_id)
        
        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Member not found"
            )
        
        return APIResponse(
            success=True,
            message="Member retrieved successfully",
            data={"member": member}
        )
    
    except Exception as e:
        logger.error(f"Get member error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve member"
        )

@app.put("/api/members/{member_id}", response_model=APIResponse)
async def update_member(member_id: str, request: MemberUpdateRequest):
    """Update existing member"""
    try:
        # Validate phone numbers if provided
        if request.morphers_number and not PhoneValidator.validate_phone_number(request.morphers_number):
            raise ValidationError("Invalid morpher's phone number")
        
        if request.parents_number and not PhoneValidator.validate_phone_number(request.parents_number):
            raise ValidationError("Invalid parent's phone number")
        
        # Update member
        success = await member_service.update_member(member_id, request)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Member not found"
            )
        
        return APIResponse(
            success=True,
            message="Member updated successfully",
            data={"member_id": member_id}
        )
    
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Update member error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update member"
        )

@app.delete("/api/members/{member_id}", response_model=APIResponse)
async def delete_member(member_id: str, current_admin: Dict = Depends(get_current_admin)):
    """Delete member (admin only)"""
    try:
        success = await member_service.delete_member(member_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Member not found"
            )
        
        return APIResponse(
            success=True,
            message="Member deleted successfully",
            data={"member_id": member_id}
        )
    
    except Exception as e:
        logger.error(f"Delete member error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete member"
        )

# =======================
# ATTENDANCE ENDPOINTS
# =======================

@app.post("/api/attendance/{member_id}", response_model=APIResponse)
async def add_attendance(member_id: str, request: AttendanceRequest):
    """Add attendance record for a member"""
    try:
        success = await member_service.add_attendance(
            member_id=member_id,
            date=request.date,
            service=request.service
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Member not found"
            )
        
        return APIResponse(
            success=True,
            message="Attendance added successfully",
            data={"member_id": member_id, "date": request.date, "service": request.service}
        )
    
    except Exception as e:
        logger.error(f"Add attendance error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add attendance"
        )

@app.get("/api/attendance/{member_id}", response_model=APIResponse)
async def get_attendance(member_id: str):
    """Get attendance records for a member"""
    try:
        attendance = await member_service.get_attendance(member_id)
        
        return APIResponse(
            success=True,
            message="Attendance retrieved successfully",
            data={"member_id": member_id, "attendance": attendance}
        )
    
    except Exception as e:
        logger.error(f"Get attendance error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve attendance"
        )

@app.delete("/api/attendance/{member_id}/{date}", response_model=APIResponse)
async def remove_attendance(member_id: str, date: str):
    """Remove attendance record for a member"""
    try:
        success = await member_service.remove_attendance(member_id, date)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attendance record not found"
            )
        
        return APIResponse(
            success=True,
            message="Attendance removed successfully",
            data={"member_id": member_id, "date": date}
        )
    
    except Exception as e:
        logger.error(f"Remove attendance error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove attendance"
        )

# =======================
# DATA MANAGEMENT ENDPOINTS
# =======================

@app.get("/api/data/export", response_model=None)
async def export_data(current_admin: Dict = Depends(get_current_admin)):
    """Export all data as CSV (admin only)"""
    try:
        csv_content = await data_service.export_all_data()
        
        # Create streaming response
        def iter_csv():
            yield csv_content
        
        return StreamingResponse(
            iter_csv(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=morphers-data.csv"}
        )
    
    except Exception as e:
        logger.error(f"Export data error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export data"
        )

@app.post("/api/data/import", response_model=APIResponse)
async def import_data(
    file: UploadFile = File(...),
    current_admin: Dict = Depends(get_current_admin)
):
    """Import CSV data (admin only)"""
    try:
        if not file.filename.lower().endswith('.csv'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be a CSV file"
            )
        
        content = await file.read()
        csv_content = content.decode('utf-8')
        
        result = await data_service.import_csv_data(csv_content)
        
        return APIResponse(
            success=True,
            message=f"Successfully imported {result['imported']} records",
            data=result
        )
    
    except Exception as e:
        logger.error(f"Import data error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to import data: {str(e)}"
        )

@app.get("/api/data/stats", response_model=APIResponse)
async def get_stats():
    """Get system statistics"""
    try:
        stats = await data_service.get_statistics()
        
        return APIResponse(
            success=True,
            message="Statistics retrieved successfully",
            data=stats
        )
    
    except Exception as e:
        logger.error(f"Get stats error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve statistics"
        )

# =======================
# AUTH ENDPOINTS
# =======================

@app.post("/api/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Admin login"""
    try:
        result = await auth_service.authenticate_admin(
            email=request.email,
            password=request.password
        )
        
        return LoginResponse(
            access_token=result['access_token'],
            token_type="bearer",
            expires_in=result['expires_in'],
            user_info=result['user_info']
        )
    
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

@app.post("/api/auth/refresh", response_model=LoginResponse)
async def refresh_token(current_admin: Dict = Depends(get_current_admin)):
    """Refresh authentication token"""
    try:
        result = await auth_service.refresh_token(current_admin['email'])
        
        return LoginResponse(
            access_token=result['access_token'],
            token_type="bearer",
            expires_in=result['expires_in'],
            user_info=result['user_info']
        )
    
    except Exception as e:
        logger.error(f"Refresh token error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )

@app.post("/api/auth/logout", response_model=APIResponse)
async def logout(current_admin: Dict = Depends(get_current_admin)):
    """Admin logout"""
    try:
        # In a real implementation, you might want to blacklist the token
        # For now, we'll just return success
        return APIResponse(
            success=True,
            message="Logged out successfully",
            data={}
        )
    
    except Exception as e:
        logger.error(f"Logout error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )

# =======================
# UTILITY ENDPOINTS
# =======================

@app.get("/api/services/current", response_model=APIResponse)
async def get_current_service():
    """Get current service based on time"""
    try:
        from datetime import datetime
        
        now = datetime.now()
        current_hour = now.hour
        current_minutes = now.minute
        current_time_minutes = current_hour * 60 + current_minutes
        
        # Service times in minutes from midnight
        service1_start = 8 * 60  # 8:00 AM
        service1_end = 10 * 60   # 10:00 AM
        service2_start = 10 * 60 # 10:00 AM
        service2_end = 12 * 60   # 12:00 PM
        service3_start = 12 * 60 # 12:00 PM
        day_end = 14 * 60        # 2:00 PM
        
        service = None
        service_text = "No service currently"
        
        if service1_start <= current_time_minutes <= service1_end:
            service = "1"
            service_text = "1st Service (8:00-10:00 AM)"
        elif service2_start <= current_time_minutes <= service2_end:
            service = "2"
            service_text = "2nd Service (10:00-12:00 PM)"
        elif service3_start <= current_time_minutes <= day_end:
            service = "3"
            service_text = "3rd Service (12:00-2:00 PM)"
        
        return APIResponse(
            success=True,
            message="Current service retrieved",
            data={
                "service": service,
                "service_text": service_text,
                "current_time": now.strftime("%H:%M")
            }
        )
    
    except Exception as e:
        logger.error(f"Get current service error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get current service"
        )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
