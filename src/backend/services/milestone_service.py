from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from database.models import Milestone, UserMilestone, User, UserProfile
from api.schemas import (
    MilestoneResponse, UserMilestoneResponse, UserMilestoneUpdate, 
    ProgressStats
)
from datetime import datetime, date
from typing import List, Optional
import uuid


class MilestoneService:
    """Service for managing milestones and user progress."""
    
    @staticmethod
    async def get_age_appropriate_milestones(
        db: AsyncSession, 
        user_id: uuid.UUID,
        category: Optional[str] = None
    ) -> List[MilestoneResponse]:
        """Get milestones appropriate for user's baby age."""
        # Get user profile to determine baby age
        profile_result = await db.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        )
        profile = profile_result.scalar_one_or_none()
        
        if not profile or not profile.baby_birth_date:
            # If no birth date, return all milestones
            query = select(Milestone)
        else:
            # Calculate baby age in days
            baby_age_days = (date.today() - profile.baby_birth_date).days
            
            # Get milestones for current age range
            query = select(Milestone).where(
                and_(
                    Milestone.age_range_start <= baby_age_days,
                    Milestone.age_range_end >= baby_age_days
                )
            )
        
        # Add category filter if specified
        if category:
            query = query.where(Milestone.category == category)
        
        result = await db.execute(query.order_by(Milestone.age_range_start))
        milestones = result.scalars().all()
        
        return [MilestoneResponse.from_orm(milestone) for milestone in milestones]
    
    @staticmethod
    async def get_user_milestones(
        db: AsyncSession,
        user_id: uuid.UUID,
        completed_only: bool = False
    ) -> List[UserMilestoneResponse]:
        """Get user's milestone progress."""
        query = select(UserMilestone, Milestone).join(Milestone).where(
            UserMilestone.user_id == user_id
        )
        
        if completed_only:
            query = query.where(UserMilestone.completed == True)
        
        result = await db.execute(
            query.order_by(desc(UserMilestone.created_at))
        )
        
        user_milestones = []
        for user_milestone, milestone in result.all():
            milestone_data = UserMilestoneResponse.from_orm(user_milestone)
            milestone_data.milestone = MilestoneResponse.from_orm(milestone)
            user_milestones.append(milestone_data)
        
        return user_milestones
    
    @staticmethod
    async def mark_milestone_completed(
        db: AsyncSession,
        user_id: uuid.UUID,
        milestone_id: uuid.UUID,
        update_data: UserMilestoneUpdate
    ) -> UserMilestoneResponse:
        """Mark a milestone as completed or update its status."""
        # Check if user milestone record exists
        result = await db.execute(
            select(UserMilestone).where(
                and_(
                    UserMilestone.user_id == user_id,
                    UserMilestone.milestone_id == milestone_id
                )
            )
        )
        user_milestone = result.scalar_one_or_none()
        
        if not user_milestone:
            # Create new user milestone record
            user_milestone = UserMilestone(
                user_id=user_id,
                milestone_id=milestone_id,
                completed=update_data.completed or False,
                notes=update_data.notes
            )
            
            if update_data.completed:
                user_milestone.completed_date = datetime.utcnow()
            
            db.add(user_milestone)
        else:
            # Update existing record
            if update_data.completed is not None:
                user_milestone.completed = update_data.completed
                if update_data.completed and not user_milestone.completed_date:
                    user_milestone.completed_date = datetime.utcnow()
                elif not update_data.completed:
                    user_milestone.completed_date = None
            
            if update_data.notes is not None:
                user_milestone.notes = update_data.notes
        
        await db.commit()
        await db.refresh(user_milestone)
        
        # Get the milestone details
        milestone_result = await db.execute(
            select(Milestone).where(Milestone.id == milestone_id)
        )
        milestone = milestone_result.scalar_one()
        
        response = UserMilestoneResponse.from_orm(user_milestone)
        response.milestone = MilestoneResponse.from_orm(milestone)
        
        return response
    
    @staticmethod
    async def get_progress_stats(
        db: AsyncSession,
        user_id: uuid.UUID
    ) -> ProgressStats:
        """Get user's milestone progress statistics."""
        # Get age-appropriate milestones
        age_appropriate = await MilestoneService.get_age_appropriate_milestones(
            db, user_id
        )
        total_milestones = len(age_appropriate)
        
        # Get completed milestones
        completed_result = await db.execute(
            select(UserMilestone, Milestone)
            .join(Milestone)
            .where(
                and_(
                    UserMilestone.user_id == user_id,
                    UserMilestone.completed == True
                )
            )
            .order_by(desc(UserMilestone.completed_date))
        )
        
        completed_milestones_data = completed_result.all()
        completed_count = len(completed_milestones_data)
        
        # Calculate completion percentage
        completion_percentage = (
            (completed_count / total_milestones * 100) 
            if total_milestones > 0 else 0
        )
        
        # Get recent completions (last 5)
        recent_completions = []
        for user_milestone, milestone in completed_milestones_data[:5]:
            milestone_response = UserMilestoneResponse.from_orm(user_milestone)
            milestone_response.milestone = MilestoneResponse.from_orm(milestone)
            recent_completions.append(milestone_response)
        
        return ProgressStats(
            total_milestones=total_milestones,
            completed_milestones=completed_count,
            completion_percentage=round(completion_percentage, 2),
            recent_completions=recent_completions
        )
