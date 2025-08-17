from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.models import User, UserProfile
from api.schemas import UserCreate, UserResponse, LoginRequest
from utils.auth import get_password_hash, verify_password, generate_token_pair
from fastapi import HTTPException, status
import uuid


class AuthService:
    """Authentication service for user management."""
    
    @staticmethod
    async def create_user(db: AsyncSession, user_data: UserCreate) -> UserResponse:
        """Create a new user."""
        # Check if user already exists
        result = await db.execute(select(User).where(User.email == user_data.email))
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        hashed_password = get_password_hash(user_data.password)
        db_user = User(
            email=user_data.email,
            name=user_data.name,
            password_hash=hashed_password
        )
        
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        
        # Create empty user profile
        user_profile = UserProfile(user_id=db_user.id)
        db.add(user_profile)
        await db.commit()
        
        return UserResponse.from_orm(db_user)
    
    @staticmethod
    async def authenticate_user(db: AsyncSession, login_data: LoginRequest) -> User:
        """Authenticate user with email and password."""
        result = await db.execute(select(User).where(User.email == login_data.email))
        user = result.scalar_one_or_none()
        
        if not user or not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )
        
        return user
    
    @staticmethod
    async def login_user(db: AsyncSession, login_data: LoginRequest) -> dict:
        """Login user and return tokens."""
        user = await AuthService.authenticate_user(db, login_data)
        tokens = generate_token_pair(user.id)
        return tokens
    
    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> User:
        """Get user by ID."""
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return user
    
    @staticmethod
    async def refresh_access_token(refresh_token: str) -> dict:
        """Refresh access token using refresh token."""
        from utils.auth import verify_token, create_access_token
        
        payload = verify_token(refresh_token, "refresh")
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Create new access token
        access_token = create_access_token({"sub": user_id})
        
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
