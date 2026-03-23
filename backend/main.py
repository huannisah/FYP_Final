from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional, AsyncGenerator
from datetime import datetime
from uuid import UUID
import logging
import os
import asyncio
import json
from dotenv import load_dotenv
from openai import AsyncOpenAI
from contextlib import asynccontextmanager

# Import local modules
from database import get_db, init_db, SessionLocal
from models import User, Conversation, Message, CrisisEvent
from sentiment_analysis import sentiment_analyzer
from intent_classification import intent_classifier
from dialogue_manager import dialogue_manager
from rag import get_rag_retriever

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    logger.info("Application started successfully")
    yield

# Initialize FastAPI app
app = FastAPI(
    title="Mental Health Support Chatbot API",
    description="API for AI-powered mental health support chatbot",
    version="1.0.0"
)

# Configure CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models for request/response
class UserCreate(BaseModel):
    email: str
    consent_given: bool = True
    privacy_accepted: bool = True


class ConversationCreate(BaseModel):
    user_id: UUID


class MessageCreate(BaseModel):
    conversation_id: UUID
    content: str


class MessageResponse(BaseModel):
    message_id: str
    role: str
    content: str
    timestamp: datetime
    sentiment: Optional[dict] = None
    intent: Optional[dict] = None
    
    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    conversation_id: str
    started_at: datetime
    is_active: bool
    total_messages: int
    
    class Config:
        from_attributes = True


# API Endpoints

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Mental Health Support Chatbot API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow()}


@app.get("/users/by-email")
async def get_user_id_by_email(
    email: str,
    db: Session = Depends(get_db)
):
    """Get user_id for an existing user by email (e.g. to load conversations on login). Returns 404 if not found."""
    email_clean = email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == email_clean).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user_id": str(user.id), "email": user.email}

@app.post("/users/", status_code=status.HTTP_201_CREATED)
async def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create a new user or return existing user"""
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(func.lower(User.email) == user_data.email.strip().lower()).first()
        if existing_user:
            logger.info(f"User already exists: {existing_user.id}")
            existing_user.consent_given = user_data.consent_given
            existing_user.privacy_accepted = user_data.privacy_accepted
            db.commit()
            db.refresh(existing_user)
            return {
                "user_id": str(existing_user.id),
                "email": existing_user.email,
                "created_at": existing_user.created_at
            }
        
        # Create new user
        user = User(
            email=user_data.email,
            consent_given=user_data.consent_given,
            privacy_accepted=user_data.privacy_accepted,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        logger.info(f"Created new user: {user.id} with email: {user.email}")
        
        return {
            "user_id": str(user.id),
            "email": user.email,
            "created_at": user.created_at
        }
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Error creating user")
    
@app.post("/conversations/", status_code=status.HTTP_201_CREATED)
async def create_conversation(
    conv_data: ConversationCreate,
    db: Session = Depends(get_db)
):
    """Create a new conversation"""
    try:
        # Find user
        user = db.query(User).filter(User.id == conv_data.user_id).first()
        logger.info(user)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create conversation
        conversation = Conversation(user_id=user.id)
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        
        logger.info(f"Created conversation: {conversation.id}")
        
        return {
            "conversation_id": str(conversation.id),
            "started_at": conversation.started_at,
            "is_active": conversation.is_active,
            "total_messages": conversation.total_messages,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating conversation: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Error creating conversation")


@app.post("/messages/", response_model=MessageResponse)
async def send_message(
    message_data: MessageCreate,
    db: Session = Depends(get_db)
):
    """
    Send a message and get chatbot response.
    Now:
    - Runs intent classification and RAG retrieval in parallel
    - Streams non-crisis responses using Server-Sent Events (SSE)
    """
    try:
        # Find conversation
        conversation = db.query(Conversation).filter(
            Conversation.id == message_data.conversation_id
        ).first()

        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Sentiment analysis
        sentiment_result = sentiment_analyzer.analyze(message_data.content)

        # Intent classification and RAG retrieval in parallel
        async def classify_intent():
            return await asyncio.to_thread(
                intent_classifier.classify, message_data.content
            )

        async def retrieve_context():
            return await asyncio.to_thread(
                get_rag_retriever().retrieve_as_context, message_data.content, 4
            )

        intent_result, retrieved_context = await asyncio.gather(
            classify_intent(),
            retrieve_context(),
        )

        # Check for crisis
        is_crisis = (
            intent_result['intent'] == 'crisis'
            or sentiment_result['is_crisis_sentiment']
            or intent_result.get('crisis_keywords') is not None
        )

        # Save user message
        user_message = Message(
            conversation_id=conversation.id,
            role="user",
            content=message_data.content,
            sentiment_score=sentiment_result['compound'],
            sentiment_label=sentiment_result['label'],
            intent=intent_result['intent'],
        )
        db.add(user_message)
        db.flush()  # get user_message.id for crisis_events

        # Update conversation
        conversation.total_messages += 1
        if is_crisis:
            db.add(CrisisEvent(
                user_id=conversation.user_id,
                conversation_id=conversation.id,
                message_id=user_message.id,
                severity="high",
            ))

        # Last 20 messages in this conversation only
        conversation_messages = (
            db.query(Message)
            .filter(Message.conversation_id == conversation.id)
            .order_by(Message.timestamp.desc())
            .limit(20)
            .all()
        )
        # Chronological order (oldest first) for the LLM
        history_list = [
            {"role": msg.role, "content": msg.content}
            for msg in reversed(conversation_messages)
        ]

        # Crisis path: generate immediate crisis response
        if is_crisis:
            response_text = dialogue_manager._generate_crisis_response(message_data.content)

            assistant_message = Message(
                conversation_id=conversation.id,
                role="assistant",
                content=response_text
            )
            db.add(assistant_message)
            conversation.total_messages += 1

            db.commit()
            db.refresh(assistant_message)

            logger.info(f"Processed crisis message in conversation: {conversation.id}")

            return MessageResponse(
                message_id=str(assistant_message.id),
                role=assistant_message.role,
                content=assistant_message.content,
                timestamp=assistant_message.timestamp,
                sentiment=sentiment_result,
                intent=intent_result,
            )

        # Non-crisis path: stream GPT-4o response using SSE
        from langchain_core.messages import HumanMessage, AIMessage

        # Rebuild chat history into LangChain messages
        chat_history_msgs = []
        for msg in history_list[-20:]:
            if msg["role"] == "user":
                chat_history_msgs.append(HumanMessage(content=msg["content"]))
            else:
                chat_history_msgs.append(AIMessage(content=msg["content"]))

        # Use dialogue_manager prompt logic to build messages
        prompt = dialogue_manager.create_response_prompt(
            intent=intent_result['intent'],
            sentiment=sentiment_result["label"],
            retrieved_context=retrieved_context or "",
        )
        lc_messages = prompt.format_messages(
            chat_history=chat_history_msgs,
            input=message_data.content,
        )

        # Convert LangChain messages to OpenAI chat format
        def lc_to_openai(m):
            m_type = getattr(m, "type", None) or getattr(m, "role", "user")
            if m_type in ("system", "human", "ai"):
                if m_type == "system":
                    role = "system"
                elif m_type == "human":
                    role = "user"
                else:
                    role = "assistant"
            else:
                role = "user"
            return {"role": role, "content": m.content}

        openai_messages = [lc_to_openai(m) for m in lc_messages]
    
        # Commit user message and conversation update before streaming begins
        db.commit()
        full_text_parts: list[str] = []

        async def event_stream() -> AsyncGenerator[bytes, None]:
            try:
                stream = await openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=openai_messages,
                    temperature=0.7,
                    stream=True,
                )
                async for chunk in stream:
                    choice = chunk.choices[0]
                    delta = choice.delta.content or ""
                    if delta:
                        cleaned = delta.replace("**", "")
                        full_text_parts.append(cleaned)
                        yield f"data: {json.dumps(cleaned)}\n\n".encode("utf-8")
            except Exception as e:
                logger.error(f"Streaming error: {e}")
            finally:
                full_text = "".join(full_text_parts)
                if not full_text:
                    return
                save_db = SessionLocal()
                try:
                    assistant_message = Message(
                        conversation_id=conversation.id,
                        role="assistant",
                        content=full_text,
                    )
                    save_db.add(assistant_message)
                    conv = (
                        save_db.query(Conversation)
                        .filter(Conversation.id == conversation.id)
                        .first()
                    )
                    if conv:
                        conv.total_messages += 1
                    save_db.commit()
                except Exception as db_err:
                    logger.error(f"Error saving streamed message: {db_err}")
                    save_db.rollback()
                finally:
                    save_db.close()

        return StreamingResponse(event_stream(), media_type="text/event-stream")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Error processing message")


@app.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_conversation_messages(
    conversation_id: str,
    db: Session = Depends(get_db)
):
    """Get all messages in a conversation"""
    try:
        conversation = db.query(Conversation).filter(
            Conversation.id == conversation_id
        ).first()
        
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        messages = db.query(Message).filter(
            Message.conversation_id == conversation.id
        ).order_by(Message.timestamp.asc()).all()
        
        return [
            MessageResponse(
                message_id=str(msg.id),
                role=msg.role,
                content=msg.content,
                timestamp=msg.timestamp,
                sentiment={
                    'score': msg.sentiment_score,
                    'label': msg.sentiment_label
                } if msg.sentiment_score is not None else None,
                intent={'intent': msg.intent} if msg.intent else None
            )
            for msg in messages
        ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching messages: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching messages")


@app.get("/users/{user_id}/conversations", response_model=List[ConversationResponse])
async def get_user_conversations(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Get all conversations for a user"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        conversations = db.query(Conversation).filter(
            Conversation.user_id == user.id
        ).order_by(Conversation.started_at.desc()).limit(20).all()
        
        return [
            ConversationResponse(
                conversation_id=str(conv.id),
                started_at=conv.started_at,
                is_active=conv.is_active,
                total_messages=conv.total_messages
            )
            for conv in conversations
        ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching conversations: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching conversations")


@app.put("/conversations/{conversation_id}/end")
async def end_conversation(
    conversation_id: str,
    db: Session = Depends(get_db)
):
    """End a conversation"""
    try:
        conversation = db.query(Conversation).filter(
            Conversation.id == conversation_id
        ).first()
        
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        conversation.is_active = False
        conversation.ended_at = datetime.utcnow()
        
        db.commit()
        
        logger.info(f"Ended conversation: {conversation_id}")
        
        return {"message": "Conversation ended successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error ending conversation: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Error ending conversation")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "True") == "True"
    )
