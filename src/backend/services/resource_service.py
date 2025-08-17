from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, or_
from database.models import Resource, UserSavedResource, User, UserProfile
from api.schemas import ResourceResponse, UserSavedResourceResponse
from datetime import date
from typing import List, Optional
import uuid


class ResourceService:
    """Service for managing parenting resources."""
    
    @staticmethod
    async def get_personalized_resources(
        db: AsyncSession,
        user_id: uuid.UUID,
        category: Optional[str] = None,
        limit: int = 20
    ) -> List[ResourceResponse]:
        """Get personalized resources based on user's baby age and preferences."""
        # Get user profile for personalization
        profile_result = await db.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        )
        profile = profile_result.scalar_one_or_none()
        
        # Start with base query
        query = select(Resource)
        
        # Filter by category if specified
        if category:
            query = query.where(Resource.category == category)
        
        # Personalize based on baby age if available
        if profile and profile.baby_birth_date:
            baby_age_days = (date.today() - profile.baby_birth_date).days
            
            # Map age to age ranges
            if baby_age_days <= 90:  # 0-3 months
                age_filters = ["0-3months", "newborn", "all"]
            elif baby_age_days <= 180:  # 3-6 months
                age_filters = ["3-6months", "infant", "all"]
            elif baby_age_days <= 365:  # 6-12 months
                age_filters = ["6-12months", "infant", "all"]
            elif baby_age_days <= 730:  # 1-2 years
                age_filters = ["1-2years", "toddler", "all"]
            else:  # 2+ years
                age_filters = ["2+years", "toddler", "all"]
            
            # Add age filter
            age_conditions = [Resource.age_range == age_range for age_range in age_filters]
            query = query.where(or_(*age_conditions))
        
        # Order by creation date (newest first) and limit
        query = query.order_by(desc(Resource.created_at)).limit(limit)
        
        result = await db.execute(query)
        resources = result.scalars().all()
        
        return [ResourceResponse.from_orm(resource) for resource in resources]
    
    @staticmethod
    async def search_resources(
        db: AsyncSession,
        search_query: str,
        category: Optional[str] = None,
        age_range: Optional[str] = None,
        limit: int = 20
    ) -> List[ResourceResponse]:
        """Search resources by title, content, or tags."""
        query = select(Resource)
        
        # Add search filters
        search_conditions = [
            Resource.title.ilike(f"%{search_query}%"),
            Resource.content.ilike(f"%{search_query}%")
        ]
        
        # Search in tags (JSON array)
        # Note: This is PostgreSQL specific syntax
        search_conditions.append(
            Resource.tags.op('?')(search_query.lower())
        )
        
        query = query.where(or_(*search_conditions))
        
        # Add additional filters
        if category:
            query = query.where(Resource.category == category)
        
        if age_range:
            query = query.where(Resource.age_range == age_range)
        
        # Order by relevance (title matches first, then content)
        query = query.order_by(
            Resource.title.ilike(f"%{search_query}%").desc(),
            desc(Resource.created_at)
        ).limit(limit)
        
        result = await db.execute(query)
        resources = result.scalars().all()
        
        return [ResourceResponse.from_orm(resource) for resource in resources]
    
    @staticmethod
    async def save_resource(
        db: AsyncSession,
        user_id: uuid.UUID,
        resource_id: uuid.UUID
    ) -> UserSavedResourceResponse:
        """Save a resource to user's favorites."""
        # Check if resource exists
        resource_result = await db.execute(
            select(Resource).where(Resource.id == resource_id)
        )
        resource = resource_result.scalar_one_or_none()
        
        if not resource:
            raise ValueError("Resource not found")
        
        # Check if already saved
        existing_result = await db.execute(
            select(UserSavedResource).where(
                and_(
                    UserSavedResource.user_id == user_id,
                    UserSavedResource.resource_id == resource_id
                )
            )
        )
        existing = existing_result.scalar_one_or_none()
        
        if existing:
            # Return existing record
            response = UserSavedResourceResponse.from_orm(existing)
            response.resource = ResourceResponse.from_orm(resource)
            return response
        
        # Create new saved resource record
        saved_resource = UserSavedResource(
            user_id=user_id,
            resource_id=resource_id
        )
        
        db.add(saved_resource)
        await db.commit()
        await db.refresh(saved_resource)
        
        response = UserSavedResourceResponse.from_orm(saved_resource)
        response.resource = ResourceResponse.from_orm(resource)
        
        return response
    
    @staticmethod
    async def get_saved_resources(
        db: AsyncSession,
        user_id: uuid.UUID,
        category: Optional[str] = None
    ) -> List[UserSavedResourceResponse]:
        """Get user's saved resources."""
        query = select(UserSavedResource, Resource).join(Resource).where(
            UserSavedResource.user_id == user_id
        )
        
        if category:
            query = query.where(Resource.category == category)
        
        query = query.order_by(desc(UserSavedResource.saved_date))
        
        result = await db.execute(query)
        
        saved_resources = []
        for saved_resource, resource in result.all():
            response = UserSavedResourceResponse.from_orm(saved_resource)
            response.resource = ResourceResponse.from_orm(resource)
            saved_resources.append(response)
        
        return saved_resources
    
    @staticmethod
    async def remove_saved_resource(
        db: AsyncSession,
        user_id: uuid.UUID,
        resource_id: uuid.UUID
    ) -> bool:
        """Remove a resource from user's saved resources."""
        result = await db.execute(
            select(UserSavedResource).where(
                and_(
                    UserSavedResource.user_id == user_id,
                    UserSavedResource.resource_id == resource_id
                )
            )
        )
        saved_resource = result.scalar_one_or_none()
        
        if not saved_resource:
            return False
        
        await db.delete(saved_resource)
        await db.commit()
        
        return True
    
    @staticmethod
    async def get_resource_by_id(
        db: AsyncSession,
        resource_id: uuid.UUID
    ) -> Optional[ResourceResponse]:
        """Get a specific resource by ID."""
        result = await db.execute(
            select(Resource).where(Resource.id == resource_id)
        )
        resource = result.scalar_one_or_none()
        
        if not resource:
            return None
        
        return ResourceResponse.from_orm(resource)
