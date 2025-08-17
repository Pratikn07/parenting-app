from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum
import uuid


class ParentingStage(str, Enum):
    EXPECTING = "expecting"
    NEWBORN = "newborn"
    INFANT = "infant"
    TODDLER = "toddler"


class MilestoneCategory(str, Enum):
    MOTOR = "motor"
    COGNITIVE = "cognitive"
    SOCIAL = "social"
    LANGUAGE = "language"


class ResourceCategory(str, Enum):
    SLEEP = "sleep"
    FEEDING = "feeding"
    DEVELOPMENT = "development"
    HEALTH = "health"


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None


class UserResponse(UserBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# User Profile Schemas
class UserProfileBase(BaseModel):
    baby_birth_date: Optional[date] = None
    parenting_stage: Optional[ParentingStage] = None
    preferences_json: Optional[Dict[str, Any]] = None
    timezone: str = "UTC"


class UserProfileCreate(UserProfileBase):
    pass


class UserProfileUpdate(UserProfileBase):
    pass


class UserProfileResponse(UserProfileBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Authentication Schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[uuid.UUID] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# Conversation Schemas
class ConversationBase(BaseModel):
    message: str


class ConversationCreate(ConversationBase):
    pass


class ConversationResponse(ConversationBase):
    id: uuid.UUID
    user_id: uuid.UUID
    response: str
    context_json: Optional[Dict[str, Any]] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# Milestone Schemas
class MilestoneBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: MilestoneCategory
    age_range_start: int
    age_range_end: int


class MilestoneCreate(MilestoneBase):
    pass


class MilestoneResponse(MilestoneBase):
    id: uuid.UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserMilestoneBase(BaseModel):
    milestone_id: uuid.UUID
    completed: bool = False
    notes: Optional[str] = None


class UserMilestoneCreate(UserMilestoneBase):
    pass


class UserMilestoneUpdate(BaseModel):
    completed: Optional[bool] = None
    notes: Optional[str] = None


class UserMilestoneResponse(UserMilestoneBase):
    id: uuid.UUID
    user_id: uuid.UUID
    completed_date: Optional[datetime] = None
    created_at: datetime
    milestone: MilestoneResponse
    
    class Config:
        from_attributes = True


# Resource Schemas
class ResourceBase(BaseModel):
    title: str
    content: str
    category: ResourceCategory
    age_range: str
    tags: Optional[List[str]] = None


class ResourceCreate(ResourceBase):
    pass


class ResourceResponse(ResourceBase):
    id: uuid.UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserSavedResourceResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    resource_id: uuid.UUID
    saved_date: datetime
    resource: ResourceResponse
    
    class Config:
        from_attributes = True


# Daily Tip Schemas
class DailyTipBase(BaseModel):
    content: str
    category: str
    age_range: str


class DailyTipCreate(DailyTipBase):
    pass


class DailyTipResponse(DailyTipBase):
    id: uuid.UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


# Analytics Schemas
class AnalyticsEventBase(BaseModel):
    event_type: str
    event_data_json: Optional[Dict[str, Any]] = None


class AnalyticsEventCreate(AnalyticsEventBase):
    pass


class AnalyticsEventResponse(AnalyticsEventBase):
    id: uuid.UUID
    user_id: uuid.UUID
    timestamp: datetime
    
    class Config:
        from_attributes = True


# Chat System Schemas
class ChatMessage(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    response: str
    conversation_id: uuid.UUID
    context: Optional[Dict[str, Any]] = None


# Progress Tracking Schemas
class ProgressStats(BaseModel):
    total_milestones: int
    completed_milestones: int
    completion_percentage: float
    recent_completions: List[UserMilestoneResponse]


class WeeklyProgress(BaseModel):
    week_start: date
    week_end: date
    milestones_completed: int
    resources_viewed: int
    chat_interactions: int
    tips_viewed: int
