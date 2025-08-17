from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.connection import get_db
from database.models import User, UserProfile
from utils.dependencies import get_current_user
from api.schemas import (
    UserResponse, UserUpdate, UserProfileResponse, 
    UserProfileCreate, UserProfileUpdate
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/profile", response_model=UserResponse)
async def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user profile."""
    return UserResponse.from_orm(current_user)


@router.put("/profile", response_model=UserResponse)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user profile."""
    # Update user fields
    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.email is not None:
        # Check if email is already taken
        existing_user = await db.execute(
            select(User).where(User.email == user_update.email, User.id != current_user.id)
        )
        if existing_user.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already taken"
            )
        current_user.email = user_update.email
    
    await db.commit()
    await db.refresh(current_user)
    
    return UserResponse.from_orm(current_user)


@router.get("/profile/details", response_model=UserProfileResponse)
async def get_user_profile_details(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed user profile including parenting information."""
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    return UserProfileResponse.from_orm(profile)


@router.put("/profile/details", response_model=UserProfileResponse)
async def update_user_profile_details(
    profile_update: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update detailed user profile."""
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    # Update profile fields
    if profile_update.baby_birth_date is not None:
        profile.baby_birth_date = profile_update.baby_birth_date
    if profile_update.parenting_stage is not None:
        profile.parenting_stage = profile_update.parenting_stage
    if profile_update.preferences_json is not None:
        profile.preferences_json = profile_update.preferences_json
    if profile_update.timezone is not None:
        profile.timezone = profile_update.timezone
    
    await db.commit()
    await db.refresh(profile)
    
    return UserProfileResponse.from_orm(profile)


@router.post("/onboarding")
async def complete_onboarding(
    profile_data: UserProfileCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Complete user onboarding setup."""
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    # Update profile with onboarding data
    profile.baby_birth_date = profile_data.baby_birth_date
    profile.parenting_stage = profile_data.parenting_stage
    profile.preferences_json = profile_data.preferences_json or {}
    profile.timezone = profile_data.timezone
    
    await db.commit()
    
    return {"message": "Onboarding completed successfully"}
