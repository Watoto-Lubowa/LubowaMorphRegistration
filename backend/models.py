"""
Pydantic models for request/response validation
"""
from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr, validator
import re

# =======================
# REQUEST MODELS
# =======================

class MemberSearchRequest(BaseModel):
    """Request model for member search"""
    first_name: str = Field(..., min_length=2, max_length=50)
    phone_number: str = Field(..., min_length=7, max_length=15)
    
    @validator('first_name')
    def validate_first_name(cls, v):
        if not v or not v.strip():
            raise ValueError('First name is required')
        return v.strip()
    
    @validator('phone_number')
    def validate_phone_number(cls, v):
        if not v or not v.strip():
            raise ValueError('Phone number is required')
        # Remove spaces and common formatting
        cleaned = re.sub(r'[\s\-\(\)]', '', v)
        if not re.match(r'^[\+]?[0-9]{7,15}$', cleaned):
            raise ValueError('Invalid phone number format')
        return cleaned

class MemberCreateRequest(BaseModel):
    """Request model for creating a new member"""
    name: str = Field(..., min_length=2, max_length=100)
    morphers_number: str = Field(..., min_length=7, max_length=15)
    parents_name: Optional[str] = Field(None, max_length=100)
    parents_number: Optional[str] = Field(None, max_length=15)
    school: str = Field(..., min_length=3, max_length=200)
    class_level: str = Field(..., alias="class", max_length=20)
    residence: str = Field(..., min_length=2, max_length=100)
    cell: str = Field(..., regex=r'^[01]$')
    attendance: Optional[Dict[str, str]] = Field(default_factory=dict)
    
    class Config:
        allow_population_by_field_name = True
    
    @validator('name')
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Name is required')
        # Check if it has at least first and last name
        parts = v.strip().split()
        if len(parts) < 2:
            raise ValueError('Please provide full name (first and last name)')
        return v.strip()
    
    @validator('school')
    def validate_school(cls, v):
        if not v or not v.strip():
            raise ValueError('School is required')
        # Check for abbreviations (uppercase and short)
        trimmed = v.strip()
        no_dots = re.sub(r'\.', '', trimmed)
        if no_dots.isupper() and len(no_dots) <= 3:
            raise ValueError('Please enter the full school name instead of abbreviation')
        return trimmed

class MemberUpdateRequest(BaseModel):
    """Request model for updating a member"""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    morphers_number: Optional[str] = Field(None, min_length=7, max_length=15)
    parents_name: Optional[str] = Field(None, max_length=100)
    parents_number: Optional[str] = Field(None, max_length=15)
    school: Optional[str] = Field(None, min_length=3, max_length=200)
    class_level: Optional[str] = Field(None, alias="class", max_length=20)
    residence: Optional[str] = Field(None, min_length=2, max_length=100)
    cell: Optional[str] = Field(None, regex=r'^[01]$')
    attendance: Optional[Dict[str, str]] = None
    
    class Config:
        allow_population_by_field_name = True

class AttendanceRequest(BaseModel):
    """Request model for attendance"""
    date: str = Field(..., regex=r'^\d{2}_\d{2}_\d{4}$')
    service: str = Field(..., regex=r'^[123]$')
    
    @validator('date')
    def validate_date_format(cls, v):
        # Validate date format DD_MM_YYYY
        try:
            datetime.strptime(v, '%d_%m_%Y')
        except ValueError:
            raise ValueError('Date must be in format DD_MM_YYYY')
        return v

class LoginRequest(BaseModel):
    """Request model for admin login"""
    email: EmailStr
    password: str = Field(..., min_length=6)

# =======================
# RESPONSE MODELS
# =======================

class MemberResponse(BaseModel):
    """Response model for member data"""
    id: str
    name: str
    morphers_number: str
    parents_name: Optional[str] = None
    parents_number: Optional[str] = None
    school: str
    class_level: str = Field(alias="class")
    residence: str
    cell: str
    attendance: Dict[str, str] = Field(default_factory=dict)
    created_at: Optional[datetime] = None
    last_updated: Optional[datetime] = None
    
    class Config:
        allow_population_by_field_name = True

class APIResponse(BaseModel):
    """Generic API response model"""
    success: bool
    message: str
    data: Optional[Any] = None
    error: Optional[str] = None

class LoginResponse(BaseModel):
    """Response model for login"""
    access_token: str
    token_type: str
    expires_in: int
    user_info: Dict[str, Any]

class StatsResponse(BaseModel):
    """Response model for system statistics"""
    total_members: int
    active_members: int
    recent_registrations: int
    attendance_summary: Dict[str, int]
    by_cell: Dict[str, int]
    by_service: Dict[str, int]

# =======================
# FIREBASE MODELS
# =======================

class FirebaseConfig(BaseModel):
    """Firebase configuration model"""
    project_id: str
    private_key_path: str

class MemberFirestoreDoc(BaseModel):
    """Model representing a member document in Firestore"""
    Name: str
    MorphersNumber: str
    ParentsName: Optional[str] = ""
    ParentsNumber: Optional[str] = ""
    School: str
    Class: str
    Residence: str
    Cell: str
    attendance: Dict[str, str] = Field(default_factory=dict)
    createdAt: Optional[datetime] = None
    lastUpdated: Optional[datetime] = None
