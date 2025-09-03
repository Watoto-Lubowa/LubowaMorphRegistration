"""
Member service for handling member-related operations
"""
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

from services.firebase_service import FirebaseService
from models import MemberCreateRequest, MemberUpdateRequest
from utils.validation import PhoneValidator, NameValidator, SchoolValidator

logger = logging.getLogger(__name__)

class MemberService:
    """Service for member operations"""
    
    def __init__(self, firebase_service: FirebaseService):
        self.firebase = firebase_service
        self.collection_name = "morphers"
    
    async def search_member(self, first_name: str, phone_number: str) -> Optional[Dict[str, Any]]:
        """Search for a member by first name and phone number"""
        try:
            # Normalize phone number
            normalized_phone = PhoneValidator.normalize_phone_number(phone_number)
            
            # Search by phone number first (more specific)
            phone_matches = await self.firebase.search_members_by_phone(normalized_phone)
            
            if phone_matches:
                # Filter by name if we have phone matches
                for member in phone_matches:
                    member_name = member.get('Name', '').lower()
                    if member_name.startswith(first_name.lower()):
                        return self._convert_firestore_to_response(member)
                
                # If no exact name match, check if first name appears anywhere in full name
                for member in phone_matches:
                    member_name = member.get('Name', '').lower()
                    if first_name.lower() in member_name:
                        return self._convert_firestore_to_response(member)
            
            # Progressive search by name with phone filter
            for i in range(len(first_name), 2, -1):  # Start from full name, go down to 3 chars
                name_prefix = first_name[:i]
                name_matches = await self.firebase.search_members_by_name_prefix(
                    name_prefix, normalized_phone
                )
                
                if name_matches:
                    # Return the first match
                    return self._convert_firestore_to_response(name_matches[0])
            
            return None
            
        except Exception as e:
            logger.error(f"Error searching for member: {e}")
            raise
    
    async def create_member(self, request: MemberCreateRequest) -> str:
        """Create a new member"""
        try:
            # Validate full name
            if not NameValidator.validate_full_name(request.name):
                raise ValueError("Please provide full name (first and last name)")
            
            # Validate school name
            school_validation = SchoolValidator.validate_and_normalize_school_name(request.school)
            if not school_validation['is_valid']:
                raise ValueError(school_validation['suggestion'])
            
            # Normalize phone numbers
            morphers_number = PhoneValidator.normalize_phone_number(request.morphers_number)
            parents_number = PhoneValidator.normalize_phone_number(request.parents_number) if request.parents_number else ""
            
            # Create member document
            member_data = {
                'Name': request.name.strip(),
                'MorphersNumber': morphers_number,
                'ParentsName': request.parents_name.strip() if request.parents_name else '',
                'ParentsNumber': parents_number,
                'School': school_validation['normalized_name'],
                'Class': request.class_level.strip(),
                'Residence': request.residence.strip(),
                'Cell': request.cell,
                'attendance': request.attendance or {}
            }
            
            # Create document in Firebase
            member_id = await self.firebase.create_document(self.collection_name, member_data)
            
            logger.info(f"Created member: {member_id}")
            return member_id
            
        except Exception as e:
            logger.error(f"Error creating member: {e}")
            raise
    
    async def search_member(self, first_name: str, phone_number: str) -> Optional[Dict[str, Any]]:
        """Search for a member by first name and phone number"""
        try:
            normalized_phone = self._normalize_phone_number(phone_number)
            
            # Progressive search: start with full first name, then shorten
            for i in range(len(first_name), 2, -1):  # From full name down to 3 characters
                search_name = first_name[:i]
                
                # Search by phone number first
                phone_results = await self.firebase.search_members_by_phone(normalized_phone)
                
                for member in phone_results:
                    member_name = member.get('Name', '')
                    if member_name.lower().startswith(search_name.lower()):
                        return self._format_member_response(member)
                
                # If no "starts with" match, try "contains"
                for member in phone_results:
                    member_name = member.get('Name', '')
                    if search_name.lower() in member_name.lower():
                        return self._format_member_response(member)
            
            return None
            
        except Exception as e:
            logger.error(f"Error searching member: {e}")
            raise
    
    async def get_member(self, member_id: str) -> Optional[Dict[str, Any]]:
        """Get a member by ID"""
        try:
            member = await self.firebase.get_document(self.collection_name, member_id)
            
            if member:
                return self._format_member_response(member)
            return None
            
        except Exception as e:
            logger.error(f"Error getting member {member_id}: {e}")
            raise
    
    async def create_member(self, request: MemberCreateRequest) -> str:
        """Create a new member"""
        try:
            # Prepare member data
            member_data = {
                "Name": request.name.strip(),
                "MorphersNumber": self._normalize_phone_number(request.morphers_number),
                "ParentsName": request.parents_name.strip() if request.parents_name else "",
                "ParentsNumber": self._normalize_phone_number(request.parents_number) if request.parents_number else "",
                "School": request.school.strip(),
                "Class": request.class_level.strip(),
                "Residence": request.residence.strip(),
                "Cell": request.cell,
                "attendance": request.attendance or {}
            }
            
            # Create document
            member_id = await self.firebase.create_document(self.collection_name, member_data)
            
            logger.info(f"Created member: {member_id}")
            return member_id
            
        except Exception as e:
            logger.error(f"Error creating member: {e}")
            raise
    
    async def update_member(self, member_id: str, request: MemberUpdateRequest) -> bool:
        """Update an existing member"""
        try:
            # Prepare update data (only include provided fields)
            update_data = {}
            
            if request.name is not None:
                update_data["Name"] = request.name.strip()
            
            if request.morphers_number is not None:
                update_data["MorphersNumber"] = self._normalize_phone_number(request.morphers_number)
            
            if request.parents_name is not None:
                update_data["ParentsName"] = request.parents_name.strip() if request.parents_name else ""
            
            if request.parents_number is not None:
                update_data["ParentsNumber"] = self._normalize_phone_number(request.parents_number) if request.parents_number else ""
            
            if request.school is not None:
                update_data["School"] = request.school.strip()
            
            if request.class_level is not None:
                update_data["Class"] = request.class_level.strip()
            
            if request.residence is not None:
                update_data["Residence"] = request.residence.strip()
            
            if request.cell is not None:
                update_data["Cell"] = request.cell
            
            if request.attendance is not None:
                update_data["attendance"] = request.attendance
            
            if not update_data:
                return True  # No updates needed
            
            # Update document
            success = await self.firebase.update_document(self.collection_name, member_id, update_data)
            
            if success:
                logger.info(f"Updated member: {member_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error updating member {member_id}: {e}")
            raise
    
    async def delete_member(self, member_id: str) -> bool:
        """Delete a member"""
        try:
            success = await self.firebase.delete_document(self.collection_name, member_id)
            
            if success:
                logger.info(f"Deleted member: {member_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error deleting member {member_id}: {e}")
            raise
    
    async def add_attendance(self, member_id: str, date: str, service: str) -> bool:
        """Add attendance record for a member"""
        try:
            # Get current member data
            member = await self.firebase.get_document(self.collection_name, member_id)
            if not member:
                return False
            
            # Update attendance
            attendance = member.get('attendance', {})
            attendance[date] = service
            
            # Update document
            success = await self.firebase.update_document(
                self.collection_name, 
                member_id, 
                {"attendance": attendance}
            )
            
            if success:
                logger.info(f"Added attendance for member {member_id}: {date} -> {service}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error adding attendance for member {member_id}: {e}")
            raise
    
    async def get_attendance(self, member_id: str) -> Dict[str, str]:
        """Get attendance records for a member"""
        try:
            member = await self.firebase.get_document(self.collection_name, member_id)
            
            if member:
                return member.get('attendance', {})
            return {}
            
        except Exception as e:
            logger.error(f"Error getting attendance for member {member_id}: {e}")
            raise
    
    async def remove_attendance(self, member_id: str, date: str) -> bool:
        """Remove attendance record for a member"""
        try:
            # Get current member data
            member = await self.firebase.get_document(self.collection_name, member_id)
            if not member:
                return False
            
            # Remove attendance entry
            attendance = member.get('attendance', {})
            if date in attendance:
                del attendance[date]
                
                # Update document
                success = await self.firebase.update_document(
                    self.collection_name, 
                    member_id, 
                    {"attendance": attendance}
                )
                
                if success:
                    logger.info(f"Removed attendance for member {member_id}: {date}")
                
                return success
            
            return False  # Date not found
            
        except Exception as e:
            logger.error(f"Error removing attendance for member {member_id}: {e}")
            raise
    
    def _convert_firestore_to_response(self, firestore_doc: Dict[str, Any]) -> Dict[str, Any]:
        """Convert Firestore document to API response format"""
        return {
            'id': firestore_doc.get('id', ''),
            'name': firestore_doc.get('Name', ''),
            'morphers_number': firestore_doc.get('MorphersNumber', ''),
            'parents_name': firestore_doc.get('ParentsName', ''),
            'parents_number': firestore_doc.get('ParentsNumber', ''),
            'school': firestore_doc.get('School', ''),
            'class': firestore_doc.get('Class', ''),
            'residence': firestore_doc.get('Residence', ''),
            'cell': firestore_doc.get('Cell', ''),
            'attendance': firestore_doc.get('attendance', {}),
            'created_at': firestore_doc.get('createdAt'),
            'last_updated': firestore_doc.get('lastUpdated')
        }
    
    def _format_member_response(self, member_doc: Dict[str, Any]) -> Dict[str, Any]:
        """Format member document for API response (alias for _convert_firestore_to_response)"""
        return self._convert_firestore_to_response(member_doc)
        return {
            "id": member.get("id"),
            "name": member.get("Name", ""),
            "morphers_number": member.get("MorphersNumber", ""),
            "parents_name": member.get("ParentsName", ""),
            "parents_number": member.get("ParentsNumber", ""),
            "school": member.get("School", ""),
            "class": member.get("Class", ""),
            "residence": member.get("Residence", ""),
            "cell": member.get("Cell", ""),
            "attendance": member.get("attendance", {}),
            "created_at": member.get("createdAt"),
            "last_updated": member.get("lastUpdated")
        }
