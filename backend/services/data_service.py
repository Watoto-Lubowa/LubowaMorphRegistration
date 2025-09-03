"""
Data service for handling bulk data operations
"""
import logging
import csv
import io
from typing import Dict, Any, List
from datetime import datetime
import pandas as pd

from services.firebase_service import FirebaseService
from utils.validation import PhoneValidator

logger = logging.getLogger(__name__)

class DataService:
    """Service for data management operations"""
    
    def __init__(self, firebase_service: FirebaseService):
        self.firebase = firebase_service
        self.collection_name = "morphers"
    
    async def export_all_data(self) -> str:
        """Export all member data as CSV"""
        try:
            # Get all members
            members = await self.firebase.get_all_documents(self.collection_name)
            
            if not members:
                return ""
            
            # Flatten the data for CSV export
            flattened_data = []
            
            for member in members:
                flat_record = {
                    'ID': member.get('id', ''),
                    'Name': member.get('Name', ''),
                    'MorphersNumber': member.get('MorphersNumber', ''),
                    'ParentsName': member.get('ParentsName', ''),
                    'ParentsNumber': member.get('ParentsNumber', ''),
                    'School': member.get('School', ''),
                    'Class': member.get('Class', ''),
                    'Residence': member.get('Residence', ''),
                    'Cell': member.get('Cell', ''),
                    'createdAt': self._format_timestamp(member.get('createdAt')),
                    'lastUpdated': self._format_timestamp(member.get('lastUpdated'))
                }
                
                # Flatten attendance data
                attendance = member.get('attendance', {})
                for date, service in attendance.items():
                    flat_record[f'attendance_{date}'] = service
                
                flattened_data.append(flat_record)
            
            # Convert to CSV
            if not flattened_data:
                return ""
            
            # Get all unique column headers
            all_headers = set()
            for record in flattened_data:
                all_headers.update(record.keys())
            
            headers = sorted(list(all_headers))
            
            # Create CSV content
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=headers)
            writer.writeheader()
            writer.writerows(flattened_data)
            
            return output.getvalue()
            
        except Exception as e:
            logger.error(f"Error exporting data: {e}")
            raise
    
    async def import_csv_data(self, csv_content: str) -> Dict[str, Any]:
        """Import data from CSV content"""
        try:
            # Parse CSV
            csv_file = io.StringIO(csv_content)
            reader = csv.DictReader(csv_file)
            
            rows = list(reader)
            if not rows:
                raise ValueError("No data rows found in CSV")
            
            # Convert CSV rows to member documents
            members = []
            errors = []
            
            for i, row in enumerate(rows, 1):
                try:
                    member = self._parse_csv_row(row)
                    if member:
                        members.append(member)
                except Exception as e:
                    errors.append(f"Row {i}: {str(e)}")
            
            if not members:
                raise ValueError("No valid member records found in CSV")
            
            # Clear existing data if requested
            logger.info("Deleting existing data...")
            deleted_count = await self.firebase.batch_delete_collection(self.collection_name)
            
            # Import new data
            logger.info(f"Importing {len(members)} members...")
            doc_ids = await self.firebase.batch_create_documents(self.collection_name, members)
            
            result = {
                "imported": len(members),
                "deleted": deleted_count,
                "errors": errors,
                "success": True
            }
            
            logger.info(f"Import completed: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Error importing CSV data: {e}")
            raise
    
    async def get_statistics(self) -> Dict[str, Any]:
        """Get system statistics"""
        try:
            # Get all members
            members = await self.firebase.get_all_documents(self.collection_name)
            
            total_members = len(members)
            
            # Calculate statistics
            stats = {
                "total_members": total_members,
                "active_members": 0,
                "recent_registrations": 0,
                "by_cell": {"Yes": 0, "No": 0},
                "by_service": {"1": 0, "2": 0, "3": 0},
                "attendance_summary": {},
                "by_school": {},
                "by_residence": {}
            }
            
            if not members:
                return stats
            
            # Calculate recent registrations (last 30 days)
            thirty_days_ago = datetime.now().timestamp() - (30 * 24 * 60 * 60)
            
            for member in members:
                # Cell statistics
                cell = member.get('Cell', '0')
                if cell == '1':
                    stats["by_cell"]["Yes"] += 1
                else:
                    stats["by_cell"]["No"] += 1
                
                # Recent registrations
                created_at = member.get('createdAt')
                if created_at and hasattr(created_at, 'timestamp'):
                    if created_at.timestamp() > thirty_days_ago:
                        stats["recent_registrations"] += 1
                
                # Attendance statistics
                attendance = member.get('attendance', {})
                if attendance:
                    stats["active_members"] += 1
                    
                    # Count by service
                    for date, service in attendance.items():
                        if service in stats["by_service"]:
                            stats["by_service"][service] += 1
                
                # School statistics
                school = member.get('School', '').strip()
                if school:
                    stats["by_school"][school] = stats["by_school"].get(school, 0) + 1
                
                # Residence statistics
                residence = member.get('Residence', '').strip()
                if residence:
                    stats["by_residence"][residence] = stats["by_residence"].get(residence, 0) + 1
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting statistics: {e}")
            raise
    
    def _parse_csv_row(self, row: Dict[str, str]) -> Dict[str, Any]:
        """Parse a CSV row into a member document"""
        # Required fields
        name = row.get('Name', '').strip()
        if not name or len(name) < 2:
            raise ValueError("Invalid or missing name")
        
        morphers_number = row.get('MorphersNumber', '').strip()
        if not morphers_number:
            raise ValueError("Missing morphers number")
        
        if not PhoneValidator.validate_phone_number(morphers_number):
            raise ValueError(f"Invalid morphers number: {morphers_number}")
        
        school = row.get('School', '').strip()
        if not school:
            raise ValueError("Missing school")
        
        class_level = row.get('Class', '').strip()
        if not class_level:
            raise ValueError("Missing class")
        
        residence = row.get('Residence', '').strip()
        if not residence:
            raise ValueError("Missing residence")
        
        cell = row.get('Cell', '0').strip()
        if cell not in ['0', '1']:
            cell = '0'
        
        # Optional fields
        parents_name = row.get('ParentsName', '').strip()
        parents_number = row.get('ParentsNumber', '').strip()
        
        if parents_number and not PhoneValidator.validate_phone_number(parents_number):
            parents_number = ""  # Clear invalid parent number
        
        # Parse attendance data
        attendance = {}
        for key, value in row.items():
            if key.startswith('attendance_') and value and value.strip():
                date_key = key.replace('attendance_', '')
                service = value.strip()
                if service in ['1', '2', '3']:
                    attendance[date_key] = service
        
        # Create member document
        member = {
            'Name': name,
            'MorphersNumber': self._normalize_phone_number(morphers_number),
            'ParentsName': parents_name,
            'ParentsNumber': self._normalize_phone_number(parents_number) if parents_number else '',
            'School': school,
            'Class': class_level,
            'Residence': residence,
            'Cell': cell,
            'attendance': attendance
        }
        
        return member
    
    def _normalize_phone_number(self, phone_number: str) -> str:
        """Normalize phone number for consistent storage"""
        if not phone_number:
            return ""
        
        # Remove all spaces, dashes, parentheses
        import re
        cleaned = re.sub(r'[\s\-\(\)]', '', phone_number)
        
        # Check if it's an international number (doesn't start with 256 or 0)
        starts_with_uganda = cleaned.startswith('256') or cleaned.startswith('0')
        is_long_enough = len(cleaned) >= 10
        
        # For international numbers, return as-is (just cleaned)
        if not starts_with_uganda and is_long_enough:
            return cleaned
        
        # For Uganda numbers, apply Uganda-specific normalization
        normalized = cleaned.replace('+', '')
        
        # Remove leading zero if present
        if normalized.startswith('0'):
            normalized = normalized[1:]
        
        # If it starts with 256, remove it to store in national format
        if normalized.startswith('256'):
            return normalized[3:]
        
        return normalized
    
    def _format_timestamp(self, timestamp) -> str:
        """Format timestamp for CSV export"""
        if not timestamp:
            return ""
        
        if hasattr(timestamp, 'isoformat'):
            return timestamp.isoformat()
        elif hasattr(timestamp, 'timestamp'):
            return datetime.fromtimestamp(timestamp.timestamp()).isoformat()
        else:
            return str(timestamp)
