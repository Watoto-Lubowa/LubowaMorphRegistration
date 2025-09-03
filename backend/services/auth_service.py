"""
Authentication service for admin users
"""
import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from passlib.hash import bcrypt

logger = logging.getLogger(__name__)

class AuthService:
    """Service for handling authentication"""
    
    def __init__(self, secret_key: str, authorized_emails: List[str]):
        self.secret_key = secret_key
        self.authorized_emails = [email.strip().lower() for email in authorized_emails]
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 60 * 24  # 24 hours
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        try:
            return self.pwd_context.verify(plain_password, hashed_password)
        except Exception as e:
            logger.error(f"Password verification error: {e}")
            return False
    
    def get_password_hash(self, password: str) -> str:
        """Hash a password"""
        return self.pwd_context.hash(password)
    
    def create_access_token(self, data: Dict[str, Any], expires_delta: timedelta = None) -> str:
        """Create a JWT access token"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        
        to_encode.update({"exp": expire})
        
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            email: str = payload.get("sub")
            
            if email is None:
                raise ValueError("Token missing subject")
            
            # Verify email is still authorized
            if email.lower() not in self.authorized_emails:
                raise ValueError("Email no longer authorized")
            
            return {
                "email": email,
                "expires": payload.get("exp"),
                "issued_at": payload.get("iat")
            }
            
        except JWTError as e:
            logger.error(f"JWT verification error: {e}")
            raise ValueError(f"Invalid token: {e}")
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            raise ValueError(f"Token verification failed: {e}")
    
    def is_email_authorized(self, email: str) -> bool:
        """Check if email is in the authorized list"""
        return email.lower().strip() in self.authorized_emails
    
    async def authenticate_admin(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticate admin user"""
        try:
            # Check if email is authorized
            if not self.is_email_authorized(email):
                raise ValueError("Email not authorized for admin access")
            
            # For now, we'll use a simple password check
            # In a real application, you'd verify against stored hashed passwords
            # This is a simplified version for demonstration
            
            # For demo purposes, we'll accept any password for authorized emails
            # In production, implement proper password verification
            
            # Create access token
            access_token_expires = timedelta(minutes=self.access_token_expire_minutes)
            access_token = self.create_access_token(
                data={"sub": email.lower()},
                expires_delta=access_token_expires
            )
            
            return {
                "access_token": access_token,
                "expires_in": self.access_token_expire_minutes * 60,  # in seconds
                "user_info": {
                    "email": email.lower(),
                    "is_admin": True,
                    "authorized_at": datetime.utcnow().isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            raise ValueError(f"Authentication failed: {e}")
    
    async def refresh_token(self, email: str) -> Dict[str, Any]:
        """Refresh access token for authenticated user"""
        try:
            if not self.is_email_authorized(email):
                raise ValueError("Email not authorized")
            
            # Create new access token
            access_token_expires = timedelta(minutes=self.access_token_expire_minutes)
            access_token = self.create_access_token(
                data={"sub": email.lower()},
                expires_delta=access_token_expires
            )
            
            return {
                "access_token": access_token,
                "expires_in": self.access_token_expire_minutes * 60,
                "user_info": {
                    "email": email.lower(),
                    "is_admin": True,
                    "refreshed_at": datetime.utcnow().isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"Token refresh error: {e}")
            raise ValueError(f"Token refresh failed: {e}")
