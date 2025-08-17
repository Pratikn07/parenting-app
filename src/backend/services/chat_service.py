from typing import Dict, Any, List, Optional
import openai
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from database.models import User, UserProfile, Conversation, Milestone, UserMilestone
from api.schemas import ChatMessage, ChatResponse
from config.settings import settings
from datetime import datetime, date
import uuid


class ChatService:
    """AI-powered chat service for parenting assistance."""
    
    def __init__(self):
        openai.api_key = settings.openai_api_key
        self.model = settings.openai_model
    
    async def get_user_context(self, db: AsyncSession, user: User) -> Dict[str, Any]:
        """Get user context for personalized responses."""
        # Get user profile
        profile_result = await db.execute(
            select(UserProfile).where(UserProfile.user_id == user.id)
        )
        profile = profile_result.scalar_one_or_none()
        
        # Calculate baby age if birth date is available
        baby_age_days = None
        if profile and profile.baby_birth_date:
            today = date.today()
            baby_age_days = (today - profile.baby_birth_date).days
        
        # Get recent conversations for context
        recent_conversations = await db.execute(
            select(Conversation)
            .where(Conversation.user_id == user.id)
            .order_by(desc(Conversation.created_at))
            .limit(5)
        )
        conversations = recent_conversations.scalars().all()
        
        # Get completed milestones
        completed_milestones = await db.execute(
            select(UserMilestone, Milestone)
            .join(Milestone)
            .where(UserMilestone.user_id == user.id)
            .where(UserMilestone.completed == True)
            .order_by(desc(UserMilestone.completed_date))
            .limit(10)
        )
        milestones = completed_milestones.all()
        
        return {
            "user_name": user.name,
            "parenting_stage": profile.parenting_stage if profile else None,
            "baby_age_days": baby_age_days,
            "preferences": profile.preferences_json if profile else {},
            "recent_conversations": [
                {"message": conv.message, "response": conv.response}
                for conv in conversations
            ],
            "completed_milestones": [
                {"title": milestone.Milestone.title, "category": milestone.Milestone.category}
                for milestone in milestones
            ]
        }
    
    def build_system_prompt(self, context: Dict[str, Any]) -> str:
        """Build personalized system prompt based on user context."""
        base_prompt = """You are a knowledgeable and supportive parenting assistant. 
        You provide evidence-based advice, emotional support, and practical tips for parents.
        Always be empathetic, non-judgmental, and encourage parents to trust their instincts.
        If medical concerns arise, always recommend consulting with healthcare professionals."""
        
        # Add personalization based on context
        if context.get("user_name"):
            base_prompt += f"\n\nYou are speaking with {context['user_name']}."
        
        if context.get("parenting_stage"):
            base_prompt += f"\nThey are in the {context['parenting_stage']} stage of parenting."
        
        if context.get("baby_age_days"):
            days = context["baby_age_days"]
            if days < 30:
                age_desc = f"{days} days old"
            elif days < 365:
                months = days // 30
                age_desc = f"about {months} months old"
            else:
                years = days // 365
                age_desc = f"about {years} years old"
            base_prompt += f"\nTheir baby is {age_desc}."
        
        if context.get("completed_milestones"):
            milestones = context["completed_milestones"][:3]  # Recent milestones
            milestone_list = ", ".join([m["title"] for m in milestones])
            base_prompt += f"\nRecent milestones achieved: {milestone_list}."
        
        return base_prompt
    
    def detect_topic_category(self, message: str) -> str:
        """Detect the main topic category of the message."""
        sleep_keywords = ["sleep", "nap", "bedtime", "wake", "night", "tired"]
        feeding_keywords = ["feed", "eat", "milk", "bottle", "breast", "formula", "solid"]
        development_keywords = ["crawl", "walk", "talk", "milestone", "develop", "learn"]
        health_keywords = ["sick", "fever", "doctor", "medicine", "health", "symptom"]
        
        message_lower = message.lower()
        
        if any(keyword in message_lower for keyword in sleep_keywords):
            return "sleep"
        elif any(keyword in message_lower for keyword in feeding_keywords):
            return "feeding"
        elif any(keyword in message_lower for keyword in development_keywords):
            return "development"
        elif any(keyword in message_lower for keyword in health_keywords):
            return "health"
        else:
            return "general"
    
    async def generate_response(
        self, 
        message: str, 
        context: Dict[str, Any],
        topic_category: str
    ) -> str:
        """Generate AI response using OpenAI."""
        system_prompt = self.build_system_prompt(context)
        
        # Add topic-specific guidance
        topic_guidance = {
            "sleep": "Focus on safe sleep practices, age-appropriate sleep schedules, and gentle sleep training methods.",
            "feeding": "Provide guidance on feeding schedules, nutrition, and addressing feeding challenges.",
            "development": "Share information about developmental milestones and activities to support growth.",
            "health": "Provide general health information but always recommend consulting healthcare professionals for medical concerns.",
            "general": "Provide supportive and practical parenting advice."
        }
        
        if topic_category in topic_guidance:
            system_prompt += f"\n\nFor this {topic_category}-related question: {topic_guidance[topic_category]}"
        
        try:
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                max_tokens=500,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
        
        except Exception as e:
            # Fallback response if OpenAI fails
            return "I'm sorry, I'm having trouble connecting right now. Please try again in a moment. In the meantime, remember that you're doing great as a parent!"
    
    async def save_conversation(
        self, 
        db: AsyncSession,
        user_id: uuid.UUID,
        message: str,
        response: str,
        context: Dict[str, Any]
    ) -> Conversation:
        """Save conversation to database."""
        conversation = Conversation(
            user_id=user_id,
            message=message,
            response=response,
            context_json=context
        )
        
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
        
        return conversation
    
    async def process_chat_message(
        self,
        db: AsyncSession,
        user: User,
        chat_message: ChatMessage
    ) -> ChatResponse:
        """Process incoming chat message and return AI response."""
        # Get user context
        context = await self.get_user_context(db, user)
        
        # Detect topic category
        topic_category = self.detect_topic_category(chat_message.message)
        
        # Add topic to context
        context["topic_category"] = topic_category
        context["timestamp"] = datetime.utcnow().isoformat()
        
        # Generate AI response
        ai_response = await self.generate_response(
            chat_message.message,
            context,
            topic_category
        )
        
        # Save conversation
        conversation = await self.save_conversation(
            db,
            user.id,
            chat_message.message,
            ai_response,
            context
        )
        
        return ChatResponse(
            response=ai_response,
            conversation_id=conversation.id,
            context={"topic_category": topic_category}
        )
    
    async def get_conversation_history(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        limit: int = 20
    ) -> List[Conversation]:
        """Get user's conversation history."""
        result = await db.execute(
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(desc(Conversation.created_at))
            .limit(limit)
        )
        
        return result.scalars().all()
    
    async def clear_conversation_history(
        self,
        db: AsyncSession,
        user_id: uuid.UUID
    ) -> bool:
        """Clear user's conversation history."""
        conversations = await db.execute(
            select(Conversation).where(Conversation.user_id == user_id)
        )
        
        for conversation in conversations.scalars():
            await db.delete(conversation)
        
        await db.commit()
        return True
