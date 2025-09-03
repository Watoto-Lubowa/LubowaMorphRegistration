"""
Test script to verify the API endpoints
"""
import asyncio
import httpx
import json

BASE_URL = "http://localhost:8000"

async def test_api():
    """Test the main API endpoints"""
    async with httpx.AsyncClient() as client:
        
        # Test health check
        print("🔍 Testing health check...")
        response = await client.get(f"{BASE_URL}/health")
        print(f"Health check: {response.status_code} - {response.json()}")
        
        # Test current service
        print("\n🔍 Testing current service...")
        response = await client.get(f"{BASE_URL}/api/services/current")
        print(f"Current service: {response.status_code} - {response.json()}")
        
        # Test member search (should fail validation)
        print("\n🔍 Testing member search with invalid data...")
        search_data = {
            "first_name": "A",  # Too short
            "phone_number": "123"  # Too short
        }
        response = await client.post(f"{BASE_URL}/api/members/search", json=search_data)
        print(f"Invalid search: {response.status_code} - {response.json()}")
        
        # Test member search with valid data
        print("\n🔍 Testing member search with valid data...")
        search_data = {
            "first_name": "John",
            "phone_number": "0781234567"
        }
        response = await client.post(f"{BASE_URL}/api/members/search", json=search_data)
        print(f"Valid search: {response.status_code} - {response.json()}")
        
        # Test stats endpoint
        print("\n🔍 Testing stats endpoint...")
        response = await client.get(f"{BASE_URL}/api/data/stats")
        print(f"Stats: {response.status_code} - {response.json()}")
        
        print("\n✅ API test completed!")

if __name__ == "__main__":
    print("🚀 Starting API tests...")
    print("Make sure the API server is running on localhost:8000")
    asyncio.run(test_api())
