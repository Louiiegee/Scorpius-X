"""Authentication endpoints for Scorpius X."""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
import time
import uuid
from datetime import datetime, timedelta

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Hardcoded credentials for demonstration
# In production, use a secure database with hashed passwords
VALID_USERS = {
    "admin@scorpiusx.io": {
        "password": "scorpius123",
        "id": "admin-user-001",
        "email": "admin@scorpiusx.io",
        "name": "Scorpius Admin",
        "tier": "enterprise",
        "licenseKey": "ENTERPRISE-LICENSE-001",
        "organization": "Scorpius Security",
        "limits": {
            "maxConcurrentScans": 50,
            "exportLevel": "enterprise",
            "accessWasm": True,
            "apiCallsPerHour": 25000,
            "customIntegrations": True,
            "prioritySupport": True,
            "whiteLabel": True
        },
        "permissions": [
            "admin_access",
            "manage_users",
            "manage_scans",
            "export_reports",
            "configure_settings",
            "view_analytics"
        ],
        "subscription": {
            "status": "active",
            "expiresAt": "2030-12-31T23:59:59Z"
        },
        "security": {
            "mfaEnabled": False,
            "fidoEnabled": False,
            "lastLogin": datetime.now().isoformat(),
            "ipWhitelist": []
        }    }
}

class LoginRequest(BaseModel):
    email: str
    password: str
    licenseKey: Optional[str] = None
    rememberMe: Optional[bool] = False

class User(BaseModel):
    id: str
    email: str
    name: str
    tier: str
    licenseKey: Optional[str] = None
    organization: Optional[str] = None
    limits: dict
    permissions: List[str]
    subscription: dict
    security: dict

@router.post("/login")
async def login(request: LoginRequest):
    """Authenticate a user."""
    print(f"🔐 Login attempt received:")
    print(f"  Email: {request.email}")
    print(f"  Password: {'*' * len(request.password) if request.password else 'EMPTY'}")
    print(f"  License Key: {request.licenseKey or 'None'}")
    print(f"  Remember Me: {request.rememberMe}")
    
    if request.email not in VALID_USERS:
        print(f"❌ Email '{request.email}' not found in valid users")
        print(f"  Valid emails: {list(VALID_USERS.keys())}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_data = VALID_USERS[request.email]
    if request.password != user_data["password"]:
        print(f"❌ Password mismatch for '{request.email}'")
        print(f"  Received: '{request.password}'")
        print(f"  Expected: '{user_data['password']}'")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    print(f"✅ Authentication successful for '{request.email}'")
    
    # Update last login
    user_data["security"]["lastLogin"] = datetime.now().isoformat()
    
    # Create tokens (simplified without JWT for now)
    token = f"{request.email}:{int(time.time())}"
    refresh_token = f"refresh:{request.email}:{int(time.time())}"
    
    return {
        "success": True,
        "token": token,
        "refreshToken": refresh_token,
        "user": {
            "id": user_data["id"],
            "email": user_data["email"],
            "name": user_data["name"],
            "tier": user_data["tier"],
            "licenseKey": user_data["licenseKey"],
            "organization": user_data["organization"],
            "limits": user_data["limits"],
            "permissions": user_data["permissions"],
            "subscription": user_data["subscription"],
            "security": user_data["security"]
        }
    }

@router.get("/me")
async def get_current_user(token: Optional[str] = None):
    """Get current user from token."""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Parse the simple token
    try:
        email, _ = token.split(":", 1)
        if email not in VALID_USERS:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_data = VALID_USERS[email]
        return {
            "id": user_data["id"],
            "email": user_data["email"],
            "name": user_data["name"],
            "tier": user_data["tier"],
            "licenseKey": user_data["licenseKey"],
            "organization": user_data["organization"],
            "limits": user_data["limits"],
            "permissions": user_data["permissions"],
            "subscription": user_data["subscription"],
            "security": user_data["security"]
        }
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/refresh")
async def refresh_token(refresh_token: str):
    """Refresh the access token."""
    try:
        # Parse refresh token
        if not refresh_token.startswith("refresh:"):
            raise ValueError("Invalid refresh token format")
        
        _, email, _ = refresh_token.split(":", 2)
        if email not in VALID_USERS:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        user_data = VALID_USERS[email]
        
        # Create new tokens
        new_token = f"{email}:{int(time.time())}"
        new_refresh_token = f"refresh:{email}:{int(time.time())}"
        
        return {
            "success": True,
            "token": new_token,
            "refreshToken": new_refresh_token,
            "user": {
                "id": user_data["id"],
                "email": user_data["email"],
                "name": user_data["name"],
                "tier": user_data["tier"],
                "licenseKey": user_data["licenseKey"],
                "organization": user_data["organization"],
                "limits": user_data["limits"],
                "permissions": user_data["permissions"],
                "subscription": user_data["subscription"],
                "security": user_data["security"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@router.post("/logout")
async def logout():
    """Logout the user."""
    return {"success": True, "message": "Logged out successfully"}

@router.post("/fido2/challenge")
async def fido2_challenge():
    """Get FIDO2 authentication challenge (not implemented)."""
    raise HTTPException(status_code=501, detail="FIDO2 authentication not implemented")

@router.post("/fido2/verify")
async def fido2_verify():
    """Verify FIDO2 authentication (not implemented)."""
    raise HTTPException(status_code=501, detail="FIDO2 authentication not implemented")
