from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from database.connection import get_db
from database.models import User
from utils.dependencies import get_current_user
from services.resource_service import ResourceService
from services.analytics_service import AnalyticsService
from api.schemas import ResourceResponse, UserSavedResourceResponse
from typing import List, Optional
import uuid

router = APIRouter(prefix="/resources", tags=["resources"])


@router.get("", response_model=List[ResourceResponse])
async def get_resources(
    category: Optional[str] = Query(None, description="Filter by resource category"),
    limit: int = Query(20, ge=1, le=100, description="Number of resources to return"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get personalized resources based on user's profile."""
    resources = await ResourceService.get_personalized_resources(
        db, current_user.id, category, limit
    )
    
    # Track resource viewing
    if resources:
        await AnalyticsService.track_event(
            db,
            current_user.id,
            {
                "event_type": "resources_viewed",
                "event_data_json": {
                    "category": category,
                    "count": len(resources)
                }
            }
        )
    
    return resources


@router.get("/search", response_model=List[ResourceResponse])
async def search_resources(
    q: str = Query(..., min_length=1, description="Search query"),
    category: Optional[str] = Query(None, description="Filter by category"),
    age_range: Optional[str] = Query(None, description="Filter by age range"),
    limit: int = Query(20, ge=1, le=100, description="Number of results to return"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Search resources by title, content, or tags."""
    resources = await ResourceService.search_resources(
        db, q, category, age_range, limit
    )
    
    # Track search event
    await AnalyticsService.track_event(
        db,
        current_user.id,
        {
            "event_type": "resource_search",
            "event_data_json": {
                "query": q,
                "category": category,
                "results_count": len(resources)
            }
        }
    )
    
    return resources


@router.get("/{resource_id}", response_model=ResourceResponse)
async def get_resource(
    resource_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific resource by ID."""
    resource = await ResourceService.get_resource_by_id(db, resource_id)
    
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    
    # Track resource view
    await AnalyticsService.track_resource_interaction(
        db, current_user.id, resource_id, "viewed"
    )
    
    return resource


@router.post("/{resource_id}/save", response_model=UserSavedResourceResponse)
async def save_resource(
    resource_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Save a resource to user's favorites."""
    try:
        saved_resource = await ResourceService.save_resource(
            db, current_user.id, resource_id
        )
        
        # Track save event
        await AnalyticsService.track_resource_interaction(
            db, current_user.id, resource_id, "saved"
        )
        
        return saved_resource
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/saved", response_model=List[UserSavedResourceResponse])
async def get_saved_resources(
    category: Optional[str] = Query(None, description="Filter by category"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's saved resources."""
    return await ResourceService.get_saved_resources(
        db, current_user.id, category
    )


@router.delete("/{resource_id}/save")
async def remove_saved_resource(
    resource_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove a resource from user's saved resources."""
    success = await ResourceService.remove_saved_resource(
        db, current_user.id, resource_id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved resource not found"
        )
    
    return {"message": "Resource removed from favorites"}
