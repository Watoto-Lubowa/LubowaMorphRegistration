"""
Validation utilities
"""
import re
import phonenumbers
from phonenumbers import NumberParseException

class PhoneValidator:
    """Phone number validation utilities"""
    
    @staticmethod
    def validate_phone_number(phone_number: str, country_code: str = 'UG') -> bool:
        """Validate phone number using libphonenumber"""
        try:
            if not phone_number or not phone_number.strip():
                return False
            
            # Clean the phone number for analysis
            clean_number = re.sub(r'[\s\-\(\)]', '', phone_number)
            
            # Check if it's an international number (doesn't start with 256 or 0, has 10+ characters)
            starts_with_uganda = clean_number.startswith('256') or clean_number.startswith('0')
            is_long_enough = len(clean_number) >= 10
            
            # If it's not Uganda format but long enough, consider it valid international number
            if not starts_with_uganda and is_long_enough:
                # Basic validation: only digits, +, -, (, ), and spaces allowed
                valid_chars = re.match(r'^[\d\+\-\(\)\s]+$', phone_number)
                return valid_chars and len(clean_number) <= 15  # Max international number length
            
            # For Uganda numbers or short numbers, use libphonenumber validation
            phone_number_obj = phonenumbers.parse(phone_number, country_code)
            return phonenumbers.is_valid_number(phone_number_obj)
            
        except NumberParseException:
            # Fallback validation for international numbers if libphonenumber fails
            clean_number = re.sub(r'[\s\-\(\)]', '', phone_number)
            starts_with_uganda = clean_number.startswith('256') or clean_number.startswith('0')
            is_long_enough = len(clean_number) >= 10
            
            if not starts_with_uganda and is_long_enough:
                valid_chars = re.match(r'^[\d\+\-\(\)\s]+$', phone_number)
                return valid_chars and len(clean_number) <= 15
            
            return False
        except Exception:
            return False
    
    @staticmethod
    def normalize_phone_number(phone_number: str) -> str:
        """Normalize phone number for storage"""
        if not phone_number:
            return ""
        
        # Remove all spaces, dashes, parentheses for analysis
        clean_number = re.sub(r'[\s\-\(\)]', '', phone_number)
        
        # Check if it's an international number (doesn't start with 256 or 0, has 10+ characters)
        starts_with_uganda = clean_number.startswith('256') or clean_number.startswith('0')
        is_long_enough = len(clean_number) >= 10
        
        # For international numbers, return as-is (just cleaned)
        if not starts_with_uganda and is_long_enough:
            return clean_number  # Keep international numbers in their original format
        
        # For Uganda numbers, apply Uganda-specific normalization
        normalized = clean_number.replace('+', '')  # Remove plus signs
        
        # Remove leading zero if present (Uganda numbers often start with 0)
        if normalized.startswith('0'):
            normalized = normalized[1:]
        
        # For Uganda, ensure it starts with country code or is in national format
        # If it's 9 digits and doesn't start with 256, it's likely a national number without country code
        if len(normalized) == 9 and not normalized.startswith('256'):
            # Keep it as national format without leading zero
            return normalized
        
        # If it starts with 256, remove it to store in national format
        if normalized.startswith('256'):
            return normalized[3:]
        
        return normalized

class NameValidator:
    """Name validation utilities"""
    
    @staticmethod
    def validate_full_name(name: str) -> bool:
        """Validate that name contains at least first and last name"""
        if not name or not isinstance(name, str):
            return False
        
        name_parts = name.strip().split()
        
        # Must have at least 2 names
        if len(name_parts) < 2:
            return False
        
        # Each name part must be at least 2 characters
        return all(len(part) >= 2 for part in name_parts)
    
    @staticmethod
    def suggest_full_name(name: str) -> str:
        """Suggest full name format if only one name provided"""
        if not name:
            return ''
        
        name_parts = name.strip().split()
        if len(name_parts) == 1:
            return f'Please enter your full name (e.g., "{name} LastName")'
        
        # Check if any name part is too short
        short_parts = [part for part in name_parts if len(part) < 2]
        if short_parts:
            return f'Please enter your full name (e.g., "{name} LastName")'
        
        return ''

class SchoolValidator:
    """School name validation utilities"""
    
    @staticmethod
    def validate_and_normalize_school_name(school_name: str) -> dict:
        """Validate and normalize school name"""
        if not school_name or not isinstance(school_name, str):
            return {
                'is_valid': False,
                'normalized_name': '',
                'suggestion': 'Please enter a school name'
            }
        
        trimmed = school_name.strip()
        
        # Remove dots to check for abbreviations like K.I.S.
        no_dots = trimmed.replace('.', '')
        
        # Check if it's an invalid abbreviation (uppercase and 3 characters or less after removing dots)
        if no_dots.isupper() and len(no_dots) <= 3:
            return {
                'is_valid': False,
                'normalized_name': trimmed,
                'suggestion': 'Please enter the full school name instead of abbreviation'
            }
        
        # Check minimum length for school names
        if len(trimmed) < 3:
            return {
                'is_valid': False,
                'normalized_name': trimmed,
                'suggestion': 'Please enter the complete school name (at least 3 characters)'
            }
        
        # School name passes validation
        return {
            'is_valid': True,
            'normalized_name': trimmed,
            'suggestion': ''
        }
