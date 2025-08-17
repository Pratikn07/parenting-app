from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc
from database.models import UserAnalytics, User, UserMilestone, UserSavedResource, Conversation
from api.schemas import AnalyticsEventCreate, AnalyticsEventResponse, WeeklyProgress
from datetime import datetime, date, timedelta
from typing import Dict, Any, List
import uuid


class AnalyticsService:
    """Service for tracking and analyzing user behavior."""
    
    @staticmethod
    async def track_event(
        db: AsyncSession,
        user_id: uuid.UUID,
        event_data: AnalyticsEventCreate
    ) -> AnalyticsEventResponse:
        """Track a user analytics event."""
        analytics_event = UserAnalytics(
            user_id=user_id,
            event_type=event_data.event_type,
            event_data_json=event_data.event_data_json
        )
        
        db.add(analytics_event)
        await db.commit()
        await db.refresh(analytics_event)
        
        return AnalyticsEventResponse.from_orm(analytics_event)
    
    @staticmethod
    async def get_weekly_progress(
        db: AsyncSession,
        user_id: uuid.UUID,
        weeks_back: int = 1
    ) -> List[WeeklyProgress]:
        """Get user's weekly progress statistics."""
        progress_data = []
        
        for week_offset in range(weeks_back):
            # Calculate week dates
            end_date = date.today() - timedelta(days=week_offset * 7)
            start_date = end_date - timedelta(days=6)
            
            # Convert to datetime for database queries
            start_datetime = datetime.combine(start_date, datetime.min.time())
            end_datetime = datetime.combine(end_date, datetime.max.time())
            
            # Get milestones completed this week
            milestones_result = await db.execute(
                select(func.count(UserMilestone.id))
                .where(
                    and_(
                        UserMilestone.user_id == user_id,
                        UserMilestone.completed == True,
                        UserMilestone.completed_date >= start_datetime,
                        UserMilestone.completed_date <= end_datetime
                    )
                )
            )
            milestones_completed = milestones_result.scalar() or 0
            
            # Get resources viewed this week (from analytics events)
            resources_result = await db.execute(
                select(func.count(UserAnalytics.id))
                .where(
                    and_(
                        UserAnalytics.user_id == user_id,
                        UserAnalytics.event_type == 'resource_viewed',
                        UserAnalytics.timestamp >= start_datetime,
                        UserAnalytics.timestamp <= end_datetime
                    )
                )
            )
            resources_viewed = resources_result.scalar() or 0
            
            # Get chat interactions this week
            chat_result = await db.execute(
                select(func.count(Conversation.id))
                .where(
                    and_(
                        Conversation.user_id == user_id,
                        Conversation.created_at >= start_datetime,
                        Conversation.created_at <= end_datetime
                    )
                )
            )
            chat_interactions = chat_result.scalar() or 0
            
            # Get tips viewed this week (from analytics events)
            tips_result = await db.execute(
                select(func.count(UserAnalytics.id))
                .where(
                    and_(
                        UserAnalytics.user_id == user_id,
                        UserAnalytics.event_type == 'tip_viewed',
                        UserAnalytics.timestamp >= start_datetime,
                        UserAnalytics.timestamp <= end_datetime
                    )
                )
            )
            tips_viewed = tips_result.scalar() or 0
            
            progress_data.append(WeeklyProgress(
                week_start=start_date,
                week_end=end_date,
                milestones_completed=milestones_completed,
                resources_viewed=resources_viewed,
                chat_interactions=chat_interactions,
                tips_viewed=tips_viewed
            ))
        
        return progress_data
    
    @staticmethod
    async def get_user_insights(
        db: AsyncSession,
        user_id: uuid.UUID
    ) -> Dict[str, Any]:
        """Get comprehensive user insights and analytics."""
        # Get total activity counts
        total_milestones_result = await db.execute(
            select(func.count(UserMilestone.id))
            .where(
                and_(
                    UserMilestone.user_id == user_id,
                    UserMilestone.completed == True
                )
            )
        )
        total_milestones = total_milestones_result.scalar() or 0
        
        total_conversations_result = await db.execute(
            select(func.count(Conversation.id))
            .where(Conversation.user_id == user_id)
        )
        total_conversations = total_conversations_result.scalar() or 0
        
        total_saved_resources_result = await db.execute(
            select(func.count(UserSavedResource.id))
            .where(UserSavedResource.user_id == user_id)
        )
        total_saved_resources = total_saved_resources_result.scalar() or 0
        
        # Get most active times (hour of day)
        activity_by_hour_result = await db.execute(
            select(
                func.extract('hour', UserAnalytics.timestamp).label('hour'),
                func.count(UserAnalytics.id).label('count')
            )
            .where(UserAnalytics.user_id == user_id)
            .group_by(func.extract('hour', UserAnalytics.timestamp))
            .order_by(desc('count'))
            .limit(3)
        )
        most_active_hours = [
            {"hour": int(row.hour), "activity_count": row.count}
            for row in activity_by_hour_result.all()
        ]
        
        # Get most common event types
        event_types_result = await db.execute(
            select(
                UserAnalytics.event_type,
                func.count(UserAnalytics.id).label('count')
            )
            .where(UserAnalytics.user_id == user_id)
            .group_by(UserAnalytics.event_type)
            .order_by(desc('count'))
            .limit(5)
        )
        top_activities = [
            {"activity": row.event_type, "count": row.count}
            for row in event_types_result.all()
        ]
        
        # Calculate engagement score (simple algorithm)
        days_since_first_activity_result = await db.execute(
            select(func.min(UserAnalytics.timestamp))
            .where(UserAnalytics.user_id == user_id)
        )
        first_activity = days_since_first_activity_result.scalar()
        
        if first_activity:
            days_active = (datetime.utcnow() - first_activity).days + 1
            engagement_score = min(100, (total_conversations + total_milestones * 2) / days_active * 10)
        else:
            engagement_score = 0
        
        return {
            "total_milestones_completed": total_milestones,
            "total_conversations": total_conversations,
            "total_saved_resources": total_saved_resources,
            "engagement_score": round(engagement_score, 2),
            "most_active_hours": most_active_hours,
            "top_activities": top_activities,
            "days_active": days_active if first_activity else 0
        }
    
    @staticmethod
    async def track_milestone_completion(
        db: AsyncSession,
        user_id: uuid.UUID,
        milestone_id: uuid.UUID,
        milestone_title: str
    ):
        """Track milestone completion event."""
        await AnalyticsService.track_event(
            db,
            user_id,
            AnalyticsEventCreate(
                event_type="milestone_completed",
                event_data_json={
                    "milestone_id": str(milestone_id),
                    "milestone_title": milestone_title
                }
            )
        )
    
    @staticmethod
    async def track_resource_interaction(
        db: AsyncSession,
        user_id: uuid.UUID,
        resource_id: uuid.UUID,
        interaction_type: str  # viewed, saved, shared
    ):
        """Track resource interaction event."""
        await AnalyticsService.track_event(
            db,
            user_id,
            AnalyticsEventCreate(
                event_type=f"resource_{interaction_type}",
                event_data_json={
                    "resource_id": str(resource_id),
                    "interaction_type": interaction_type
                }
            )
        )
    
    @staticmethod
    async def track_chat_interaction(
        db: AsyncSession,
        user_id: uuid.UUID,
        topic_category: str,
        message_length: int
    ):
        """Track chat interaction event."""
        await AnalyticsService.track_event(
            db,
            user_id,
            AnalyticsEventCreate(
                event_type="chat_interaction",
                event_data_json={
                    "topic_category": topic_category,
                    "message_length": message_length
                }
            )
        )
