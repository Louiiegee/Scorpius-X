# tests/test_enterprise.py
import pytest
import httpx
import asyncio
from datetime import datetime

@pytest.mark.asyncio
async def test_health_endpoint():
    """Test health endpoint returns plugin count"""
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "plugins" in data
        assert isinstance(data["plugins"], int)

@pytest.mark.asyncio
async def test_auth_flow():
    """Test complete auth flow"""
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        # Register user
        register_data = {
            "email": "test@example.com",
            "password": "testpass123",
            "role": "analyst"
        }
        response = await client.post("/auth/register", json=register_data)
        assert response.status_code in [201, 400]  # 400 if user exists
        
        # Login
        login_data = {
            "username": "test@example.com",
            "password": "testpass123"
        }
        response = await client.post("/auth/jwt/login", data=login_data)
        assert response.status_code == 200
        
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test protected endpoint
        response = await client.get("/users/me", headers=headers)
        assert response.status_code == 200
        user_data = response.json()
        assert "role" in user_data

@pytest.mark.asyncio  
async def test_scan_creation_with_auth():
    """Test scan creation requires auth"""
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        # Try without auth - should fail
        scan_data = {
            "target": "0xA0b86a33E6Bb54b474a072fa2B4b9b9A7bCC5B6C",
            "enable_simulation": False
        }
        response = await client.post("/scan", json=scan_data)
        assert response.status_code == 401

def test_metrics_endpoint():
    """Test Prometheus metrics are exposed"""
    import requests
    response = requests.get("http://localhost:8000/metrics")
    assert response.status_code == 200
    assert "http_requests_total" in response.text

@pytest.mark.asyncio
async def test_queue_persistence():
    """Test Redis Streams queue persistence"""
    from scorpius_scanner.core.stream_queue import ScanQueue
    
    queue = ScanQueue()
    
    # Enqueue a test job
    payload = {"target": "test", "scan_id": "test-123"}
    job_id = await queue.enqueue(payload)
    assert job_id
    
    # Verify it can be consumed
    consumed = False
    async for msg_id, data in queue.consume():
        if data.get("scan_id") == "test-123":
            consumed = True
            break
    
    assert consumed
