"""
Firebase service for interacting with Firestore database
"""
import asyncio
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1 import DocumentReference, DocumentSnapshot

logger = logging.getLogger(__name__)

class FirebaseService:
    """Service for Firebase Firestore operations"""
    
    def __init__(self, project_id: str, private_key_path: str):
        self.project_id = project_id
        self.private_key_path = private_key_path
        self.db = None
        self._initialized = False
        self._initialize_firebase()
    
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            if not firebase_admin._apps:
                # Initialize Firebase Admin SDK
                if self.private_key_path:
                    cred = credentials.Certificate(self.private_key_path)
                else:
                    # Try to use default credentials (for Cloud Run, etc.)
                    cred = credentials.ApplicationDefault()
                
                firebase_admin.initialize_app(cred, {
                    'projectId': self.project_id
                })
            
            # Get Firestore client
            self.db = firestore.client()
            self._initialized = True
            logger.info(f"✅ Firebase initialized for project: {self.project_id}")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Firebase: {e}")
            raise
    
    def _ensure_initialized(self):
        """Ensure Firebase is initialized"""
        if not self._initialized or not self.db:
            raise RuntimeError("Firebase service not initialized")
    
    async def get_document(self, collection_name: str, document_id: str) -> Optional[Dict[str, Any]]:
        """Get a document from Firestore"""
        self._ensure_initialized()
        
        try:
            doc_ref = self.db.collection(collection_name).document(document_id)
            doc = await asyncio.get_event_loop().run_in_executor(None, doc_ref.get)
            
            if doc.exists:
                data = doc.to_dict()
                data['id'] = doc.id
                return data
            return None
            
        except Exception as e:
            logger.error(f"Error getting document {document_id}: {e}")
            raise
    
    async def create_document(self, collection_name: str, data: Dict[str, Any], document_id: Optional[str] = None) -> str:
        """Create a new document in Firestore"""
        self._ensure_initialized()
        
        try:
            # Add timestamps
            now = datetime.utcnow()
            data['createdAt'] = now
            data['lastUpdated'] = now
            
            if document_id:
                doc_ref = self.db.collection(collection_name).document(document_id)
                await asyncio.get_event_loop().run_in_executor(None, doc_ref.set, data)
                return document_id
            else:
                # Auto-generate document ID
                doc_ref = self.db.collection(collection_name).document()
                await asyncio.get_event_loop().run_in_executor(None, doc_ref.set, data)
                return doc_ref.id
                
        except Exception as e:
            logger.error(f"Error creating document: {e}")
            raise
    
    async def update_document(self, collection_name: str, document_id: str, data: Dict[str, Any]) -> bool:
        """Update a document in Firestore"""
        self._ensure_initialized()
        
        try:
            # Add update timestamp
            data['lastUpdated'] = datetime.utcnow()
            
            doc_ref = self.db.collection(collection_name).document(document_id)
            await asyncio.get_event_loop().run_in_executor(None, doc_ref.update, data)
            return True
            
        except Exception as e:
            logger.error(f"Error updating document {document_id}: {e}")
            return False
    
    async def delete_document(self, collection_name: str, document_id: str) -> bool:
        """Delete a document from Firestore"""
        self._ensure_initialized()
        
        try:
            doc_ref = self.db.collection(collection_name).document(document_id)
            await asyncio.get_event_loop().run_in_executor(None, doc_ref.delete)
            return True
            
        except Exception as e:
            logger.error(f"Error deleting document {document_id}: {e}")
            return False
    
    async def query_documents(self, collection_name: str, filters: List[tuple] = None, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Query documents from Firestore"""
        self._ensure_initialized()
        
        try:
            query = self.db.collection(collection_name)
            
            # Apply filters
            if filters:
                for field, operator, value in filters:
                    query = query.where(field, operator, value)
            
            # Apply limit
            if limit:
                query = query.limit(limit)
            
            # Execute query
            docs = await asyncio.get_event_loop().run_in_executor(None, query.stream)
            
            results = []
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                results.append(data)
            
            return results
            
        except Exception as e:
            logger.error(f"Error querying documents: {e}")
            raise
    
    async def search_members_by_phone(self, phone_number: str) -> List[Dict[str, Any]]:
        """Search members by phone number (morphers or parents)"""
        self._ensure_initialized()
        
        try:
            # Search in both MorphersNumber and ParentsNumber fields
            morphers_query = self.db.collection('morphers').where('MorphersNumber', '==', phone_number)
            parents_query = self.db.collection('morphers').where('ParentsNumber', '==', phone_number)
            
            # Execute queries
            morphers_docs = await asyncio.get_event_loop().run_in_executor(None, morphers_query.stream)
            parents_docs = await asyncio.get_event_loop().run_in_executor(None, parents_query.stream)
            
            # Combine results
            results = []
            doc_ids = set()  # To avoid duplicates
            
            for doc in morphers_docs:
                if doc.id not in doc_ids:
                    data = doc.to_dict()
                    data['id'] = doc.id
                    results.append(data)
                    doc_ids.add(doc.id)
            
            for doc in parents_docs:
                if doc.id not in doc_ids:
                    data = doc.to_dict()
                    data['id'] = doc.id
                    results.append(data)
                    doc_ids.add(doc.id)
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching members by phone: {e}")
            raise
    
    async def search_members_by_name_prefix(self, name_prefix: str, phone_number: Optional[str] = None) -> List[Dict[str, Any]]:
        """Search members by name prefix, optionally filtered by phone number"""
        self._ensure_initialized()
        
        try:
            # Start with base query for name range
            query = self.db.collection('morphers')
            query = query.where('Name', '>=', name_prefix)
            query = query.where('Name', '<=', name_prefix + '\uf8ff')
            
            # Execute query
            docs = await asyncio.get_event_loop().run_in_executor(None, query.stream)
            
            results = []
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                
                # If phone number is provided, filter by it
                if phone_number:
                    if (data.get('MorphersNumber') == phone_number or 
                        data.get('ParentsNumber') == phone_number):
                        results.append(data)
                else:
                    results.append(data)
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching members by name prefix: {e}")
            raise
    
    async def get_collection_count(self, collection_name: str) -> int:
        """Get count of documents in a collection"""
        self._ensure_initialized()
        
        try:
            collection_ref = self.db.collection(collection_name)
            docs = await asyncio.get_event_loop().run_in_executor(None, collection_ref.stream)
            
            count = 0
            for _ in docs:
                count += 1
                
            return count
            
        except Exception as e:
            logger.error(f"Error getting collection count: {e}")
            return 0
    
    async def get_all_documents(self, collection_name: str) -> List[Dict[str, Any]]:
        """Get all documents from a collection"""
        self._ensure_initialized()
        
        try:
            collection_ref = self.db.collection(collection_name)
            docs = await asyncio.get_event_loop().run_in_executor(None, collection_ref.stream)
            
            results = []
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                results.append(data)
            
            return results
            
        except Exception as e:
            logger.error(f"Error getting all documents: {e}")
            raise
    
    async def batch_create_documents(self, collection_name: str, documents: List[Dict[str, Any]]) -> List[str]:
        """Create multiple documents in a batch"""
        self._ensure_initialized()
        
        try:
            batch = self.db.batch()
            doc_ids = []
            
            # Add timestamp to all documents
            now = datetime.utcnow()
            for doc_data in documents:
                doc_data['createdAt'] = now
                doc_data['lastUpdated'] = now
                
                doc_ref = self.db.collection(collection_name).document()
                batch.set(doc_ref, doc_data)
                doc_ids.append(doc_ref.id)
            
            # Commit batch
            await asyncio.get_event_loop().run_in_executor(None, batch.commit)
            
            return doc_ids
            
        except Exception as e:
            logger.error(f"Error in batch create: {e}")
            raise
    
    async def batch_delete_collection(self, collection_name: str, batch_size: int = 500) -> int:
        """Delete all documents in a collection in batches"""
        self._ensure_initialized()
        
        try:
            deleted_count = 0
            
            while True:
                # Get a batch of documents
                docs = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: list(self.db.collection(collection_name).limit(batch_size).stream())
                )
                
                if not docs:
                    break
                
                # Delete batch
                batch = self.db.batch()
                for doc in docs:
                    batch.delete(doc.reference)
                
                await asyncio.get_event_loop().run_in_executor(None, batch.commit)
                deleted_count += len(docs)
                
                logger.info(f"Deleted {deleted_count} documents so far...")
            
            return deleted_count
            
        except Exception as e:
            logger.error(f"Error in batch delete: {e}")
            raise
