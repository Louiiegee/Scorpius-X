# scorpius_scanner/api/security.py
import uuid
from typing import Optional
from enum import Enum
from fastapi import Depends, HTTPException, status
from fastapi_users import BaseUserManager, FastAPIUsers, UUIDIDMixin, schemas
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTStrategy,
)
from fastapi_users.db import SQLAlchemyUserDatabase
from fastapi_users.password import PasswordHelper
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Boolean, DateTime
from datetime import datetime
from pydantic import validator

from ..core.config import settings
from ..core.database import Base, get_db_session

class RoleEnum(str, Enum):
    viewer = "viewer"
    analyst = "analyst" 
    admin = "admin"

class User(Base):
    __tablename__ = "users"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    role: Mapped[str] = mapped_column(String(50), default=RoleEnum.viewer.value)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class UserCreate(schemas.BaseUserCreate):
    role: RoleEnum = RoleEnum.viewer

class UserUpdate(schemas.BaseUserUpdate):
    role: Optional[RoleEnum] = None

    @validator("role")
    def validate_role(cls, v):
        if v is not None and v not in RoleEnum:
            raise ValueError(f"Invalid role: {v}")
        return v

class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = settings.auth.jwt_secret
    verification_token_secret = settings.auth.jwt_secret

    def __init__(self, user_db: SQLAlchemyUserDatabase):
        super().__init__(user_db)
        self.password_helper = PasswordHelper()

    async def validate_password(self, password: str, user: Optional[User] = None) -> None:
        """Validate password requirements"""
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isdigit() for c in password):
            raise ValueError("Password must contain at least one digit")
        if not any(c.isupper() for c in password):
            raise ValueError("Password must contain at least one uppercase letter")

    async def on_after_register(self, user: User, request: Optional = None):
        print(f"User {user.id} has registered with role {user.role}")

    async def create(self, user_create: UserCreate, safe: bool = False, request: Optional = None):
        """Create user with proper password hashing"""
        await self.validate_password(user_create.password, user_create)
        
        existing_user = await self.user_db.get_by_email(user_create.email)
        if existing_user is not None:
            raise ValueError("User already exists")

        user_dict = user_create.create_update_dict()
        password = user_dict.pop("password")
        user_dict["hashed_password"] = self.password_helper.hash(password)
        user_dict["role"] = user_create.role.value

        created_user = await self.user_db.create(user_dict)
        await self.on_after_register(created_user, request)
        return created_user

async def get_user_db(session: AsyncSession = Depends(get_db_session)):
    yield SQLAlchemyUserDatabase(session, User)

async def get_user_manager(user_db: SQLAlchemyUserDatabase = Depends(get_user_db)):
    yield UserManager(user_db)

bearer_transport = BearerTransport(tokenUrl="auth/jwt/login")

def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=settings.auth.jwt_secret, lifetime_seconds=3600)

auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)

fastapi_users = FastAPIUsers[User, uuid.UUID](get_user_manager, [auth_backend])

current_active_user = fastapi_users.current_user(active=True)

def require_role(required_role: str):
    """Dependency to require specific role"""
    def role_checker(user: User = Depends(current_active_user)):
        role_hierarchy = {
            RoleEnum.viewer.value: 0, 
            RoleEnum.analyst.value: 1, 
            RoleEnum.admin.value: 2
        }
        
        user_level = role_hierarchy.get(user.role, 0)
        required_level = role_hierarchy.get(required_role, 999)
        
        if user_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required: {required_role}, Current: {user.role}"
            )
        return user
    return role_checker
