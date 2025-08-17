from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from database.connection import get_db
from services.auth_service import AuthService
from utils.dependencies import get_current_user
from utils.auth import verify_token
from api.schemas import (
    UserCreate, UserResponse, LoginRequest, Token, 
    RefreshTokenRequest, UserProfileResponse
)
from database.models import User

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user."""
    return await AuthService.create_user(db, user_data)


@router.post("/login", response_model=Token)
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Login user and return access and refresh tokens."""
    return await AuthService.login_user(db, login_data)


@router.post("/refresh", response_model=dict)
async def refresh_token(
    refresh_data: RefreshTokenRequest
):
    """Refresh access token using refresh token."""
    return await AuthService.refresh_access_token(refresh_data.refresh_token)


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user)
):
    """Logout user (client should remove tokens)."""
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information."""
    return UserResponse.from_orm(current_user)
