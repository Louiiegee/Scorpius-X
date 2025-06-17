"""Authentication endpoints for Scorpius X."""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict
import time
import hashlib
import secrets
import json
import os
import re

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# File-based user storage (in production, use a proper database)
USERS_FILE = "users.json"

# Initialize users file if it doesn't exist
if not os.path.exists(USERS_FILE):
    initial_users = {
        "admin@scorpiusx.io": {
            "password_hash": hashlib.sha256("scorpius123".encode()).hexdigest(),
            "role": "admin",
            "name": "Admin",
            "avatar": "🦂",
            "tier": "enterprise",
            "created_at": time.time(),
            "email_verified": True
        }
    }
    with open(USERS_FILE, 'w') as f:
        json.dump(initial_users, f)

def load_users() -> Dict:
    """Load users from file."""
    try:
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    except:
        return {}

def save_users(users: Dict):
    """Save users to file."""
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)

def hash_password(password: str) -> str:
    """Hash a password with salt."""
    salt = secrets.token_hex(32)
    return hashlib.sha256((password + salt).encode()).hexdigest() + ":" + salt

def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its hash."""
    if ":" not in password_hash:
        # Legacy hash without salt (for the demo admin user)
        return hashlib.sha256(password.encode()).hexdigest() == password_hash
    
    hash_part, salt = password_hash.split(":", 1)
    return hashlib.sha256((password + salt).encode()).hexdigest() == hash_part

def validate_email(email: str) -> bool:
    """Simple email validation."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    organization: Optional[str] = None
    licenseKey: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    newPassword: str

class User(BaseModel):
    email: str
    role: str
    name: str
    avatar: str
    token: str
    tier: str

class RefreshRequest(BaseModel):
    refreshToken: str

# Temporary storage for reset tokens (use Redis in production)
reset_tokens = {}

@router.post("/register")
async def register(request: RegisterRequest):
    """Register a new user."""
    # Validate email format
    if not validate_email(request.email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    users = load_users()
    
    if request.email in users:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash the password
    password_hash = hash_password(request.password)
    
    # Determine tier based on license key (simplified logic)
    tier = "community"
    if request.licenseKey:
        if request.licenseKey.startswith("ENT-"):
            tier = "enterprise"
        elif request.licenseKey.startswith("PRO-"):
            tier = "pro"
        elif request.licenseKey.startswith("STR-"):
            tier = "starter"
    
    # Create new user
    users[request.email] = {
        "password_hash": password_hash,
        "role": "user",
        "name": request.name,
        "avatar": "👤",
        "tier": tier,
        "organization": request.organization,
        "created_at": time.time(),
        "email_verified": False
    }
    
    save_users(users)
    
    return {
        "success": True,
        "message": "Registration successful",
        "user": {
            "email": request.email,
            "name": request.name,
            "role": "user",
            "tier": tier
        }
    }

@router.post("/login")
async def login(request: LoginRequest):
    """Authenticate a user."""
    users = load_users()
    
    if request.email not in users:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_data = users[request.email]
    if not verify_password(request.password, user_data["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Generate tokens (use JWT in production)
    token = f"{request.email}:{int(time.time())}"
    refresh_token = f"{request.email}:{int(time.time()) + 3600}"  # Longer expiry for refresh
    
    return {
        "success": True,
        "token": token,
        "refreshToken": refresh_token,
        "user": {
            "email": request.email,
            "role": user_data["role"],
            "name": user_data["name"],
            "avatar": user_data["avatar"],
            "tier": user_data.get("tier", "community"),
            "token": token
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
        users = load_users()
        if email not in users:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_data = users[email]
        return {
            "email": email,
            "role": user_data["role"],
            "name": user_data["name"],
            "avatar": user_data["avatar"],
            "tier": user_data.get("tier", "community")
        }
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/refresh")
async def refresh_token(request: RefreshRequest):
    """Refresh an access token."""
    # For this demo, we'll just validate the refresh token and issue a new token
    # In production, implement proper refresh token validation and rotation
    
    try:
        # Parse the refresh token (same format as access token for demo)
        email, _ = request.refreshToken.split(":", 1)
        users = load_users()
        if email not in users:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        user_data = users[email]
        
        # Generate new tokens
        new_token = f"{email}:{int(time.time())}"
        new_refresh_token = f"{email}:{int(time.time()) + 3600}"  # Longer expiry for refresh
        
        return {
            "token": new_token,
            "refreshToken": new_refresh_token,
            "user": {
                "email": email,
                "role": user_data["role"],                "name": user_data["name"],
                "avatar": user_data["avatar"],
                "tier": user_data.get("tier", "community"),
                "token": new_token
            }
        }
    except:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@router.post("/logout")
async def logout(token: Optional[str] = None):
    """Logout a user."""
    # In a real implementation, you would invalidate the token
    # For now, we'll just return success
    return {"success": True, "message": "Logged out successfully"}

@router.post("/change-password")
async def change_password(request: ChangePasswordRequest, token: Optional[str] = None):
    """Change user password."""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        email, _ = token.split(":", 1)
        users = load_users()
        
        if email not in users:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_data = users[email]
        
        # Verify current password
        if not verify_password(request.currentPassword, user_data["password_hash"]):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        # Update password
        users[email]["password_hash"] = hash_password(request.newPassword)
        save_users(users)
        
        return {"success": True, "message": "Password changed successfully"}
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Send password reset email."""
    users = load_users()
    
    if request.email not in users:
        # Don't reveal if email exists or not for security
        return {"success": True, "message": "If the email exists, a reset link has been sent"}
    
    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    reset_tokens[reset_token] = {
        "email": request.email,
        "expires": time.time() + 3600  # 1 hour expiry
    }
    
    # In production, send email here
    print(f"Password reset token for {request.email}: {reset_token}")
    
    return {"success": True, "message": "If the email exists, a reset link has been sent"}

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset password using token."""
    if request.token not in reset_tokens:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    token_data = reset_tokens[request.token]
    
    # Check if token is expired
    if time.time() > token_data["expires"]:
        del reset_tokens[request.token]
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    # Update password
    users = load_users()
    email = token_data["email"]
    
    if email in users:
        users[email]["password_hash"] = hash_password(request.newPassword)
        save_users(users)
    
    # Remove used token
    del reset_tokens[request.token]
    
    return {"success": True, "message": "Password reset successfully"}

@router.post("/fido2/challenge")
async def fido2_challenge():
    """Get FIDO2 authentication challenge."""
    # This is a simplified FIDO2 implementation for demo purposes
    # In production, use a proper WebAuthn library
    challenge = secrets.token_urlsafe(32)
    
    return {
        "success": True,
        "challenge": challenge,
        "options": {
            "challenge": challenge,
            "timeout": 60000,
            "userVerification": "required"
        }
    }
