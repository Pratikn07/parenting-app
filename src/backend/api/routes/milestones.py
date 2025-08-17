from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from database.connection import get_db
from database.models import User
from utils.dependencies import get_current_user
from services.milestone_service import MilestoneService
from api.schemas import (
    MilestoneResponse, UserMilestoneResponse, UserMilestoneUpdate, 
    ProgressStats
)
from typing import List, Optional
import uuid

router = APIRouter(prefix="/milestones", tags=["milestones"])


@router.get("", response_model=List[MilestoneResponse])
async def get_milestones(
    category: Optional[str] = Query(None, description="Filter by milestone category"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get age-appropriate milestones for the user."""
    return await MilestoneService.get_age_appropriate_milestones(
        db, current_user.id, category
    )


@router.get("/user", response_model=List[UserMilestoneResponse])
async def get_user_milestones(
    completed_only: bool = Query(False, description="Show only completed milestones"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's milestone progress."""
    return await MilestoneService.get_user_milestones(
        db, current_user.id, completed_only
    )


@router.put("/{milestone_id}/complete", response_model=UserMilestoneResponse)
async def mark_milestone_completed(
    milestone_id: uuid.UUID,
    update_data: UserMilestoneUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark milestone as completed or update its status."""
    return await MilestoneService.mark_milestone_completed(
        db, current_user.id, milestone_id, update_data
    )


@router.get("/progress", response_model=ProgressStats)
async def get_milestone_progress(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get milestone completion statistics."""
    return await MilestoneService.get_progress_stats(db, current_user.id)
