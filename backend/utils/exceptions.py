"""
Custom exceptions for the application
"""

class ValidationError(Exception):
    """Raised when validation fails"""
    pass

class AuthenticationError(Exception):
    """Raised when authentication fails"""
    pass

class NotFoundError(Exception):
    """Raised when a resource is not found"""
    pass

class PermissionError(Exception):
    """Raised when user doesn't have permission"""
    pass

class DatabaseError(Exception):
    """Raised when database operation fails"""
    pass
