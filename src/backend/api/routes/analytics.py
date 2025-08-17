from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from database.connection import get_db
from database.models import User
from utils.dependencies import get_current_user
from services.analytics_service import AnalyticsService
from api.schemas import AnalyticsEventCreate, AnalyticsEventResponse, WeeklyProgress
from typing import List, Dict, Any

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.post("/event", response_model=AnalyticsEventResponse)
async def track_event(
    event_data: AnalyticsEventCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Track a user analytics event."""
    return await AnalyticsService.track_event(db, current_user.id, event_data)


@router.get("/progress", response_model=List[WeeklyProgress])
async def get_weekly_progress(
    weeks: int = Query(4, ge=1, le=12, description="Number of weeks to retrieve"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's weekly progress statistics."""
    return await AnalyticsService.get_weekly_progress(db, current_user.id, weeks)


@router.get("/insights", response_model=Dict[str, Any])
async def get_user_insights(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get comprehensive user insights and analytics."""
    return await AnalyticsService.get_user_insights(db, current_user.id)
