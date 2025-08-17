from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from database.connection import get_db
from database.models import User
from utils.dependencies import get_current_user
from services.chat_service import ChatService
from api.schemas import ChatMessage, ChatResponse, ConversationResponse
from typing import List

router = APIRouter(prefix="/chat", tags=["chat"])
chat_service = ChatService()


@router.post("/message", response_model=ChatResponse)
async def send_message(
    chat_message: ChatMessage,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Send message to AI assistant and get response."""
    return await chat_service.process_chat_message(db, current_user, chat_message)


@router.get("/history", response_model=List[ConversationResponse])
async def get_chat_history(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's chat history."""
    conversations = await chat_service.get_conversation_history(db, current_user.id, limit)
    return [ConversationResponse.from_orm(conv) for conv in conversations]


@router.delete("/history")
async def clear_chat_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Clear user's chat history."""
    success = await chat_service.clear_conversation_history(db, current_user.id)
    if success:
        return {"message": "Chat history cleared successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear chat history"
        )
