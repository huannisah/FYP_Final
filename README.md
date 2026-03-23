# Mental Health Support Chatbot

An AI-powered chatbot using Natural Language Processing to provide mental health support, identify signs of distress, and offer appropriate resources and coping strategies.

## Project Overview

This Final Year Project, titled MindBuddy, implements a mental health support chatbot with the following features:

- **Sentiment Analysis**: Detects emotional tone using VADER
- **Intent Classification**: Identifies user needs using OpenAI (GPT-4o)
- **Context-Aware Responses**: Maintains conversation history for personalised support
- **RAG (Retrieval-Augmented Generation)**: Grounds answers in a local knowledge base (coping strategies, when to seek help, anxiety/stress info)
- **Crisis Detection**: Identifies and responds to crisis situations with immediate resources
- **Privacy-Focused**: Consent-based data handling and secure communication
- **Professional UI**: Clean, accessible Next.js frontend

## System Architecture

### Backend (Python/FastAPI)
- FastAPI REST API server
- PostgreSQL database for data persistence
- LangChain for LLM integration
- VADER sentiment analysis
- OpenAI (GPT-4o) for intent classification and response generation

### Frontend (Next.js/React)
- TypeScript for type safety
- Tailwind CSS for styling
- Axios for API communication
- Real-time chat interface

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- OpenAI API key

## Installation

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Edit .env and set:
# - OPENAI_API_KEY
# - SUPABASE_DB_URL
cp env.example .env

# Run the server
python main.py
```

The backend will run on http://localhost:8000

### RAG (Retrieval-Augmented Generation)

Responses are augmented with relevant excerpts from a local knowledge base so the chatbot can cite coping strategies, when to seek help, and mental health information.

1. **Add or edit documents** in `backend/knowledge/` (Markdown or plain text).
2. **Ingest into the vector store** (first time or after changes):
   ```bash
   cd backend
   python ingest_knowledge.py
   ```
3. The API uses the stored embeddings automatically when generating replies. No extra config is required at runtime.

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will run on http://localhost:3000

## Database Setup (Postgres / Supabase)

The backend uses SQLAlchemy with a single Postgres connection string.

1. Create a Supabase project (recommended) or use any Postgres instance.
2. Set `SUPABASE_DB_URL` in `backend/.env` (copied from `backend/env.example`) or use `DATABASE_URL` for local Postgres.
   - For Supabase, the connection string must include `sslmode=require`.
3. Start the backend (`python main.py`).
   - The app automatically creates the tables on startup via `init_db()` (FastAPI lifespan).

## API Endpoints

- `GET /` - Root status message
- `GET /health` - Server health check
- `GET /users/by-email?email=...` - Lookup `user_id` by email (used on login)
- `POST /users/` - Create/update a user (accepts consent + privacy flags)
- `POST /conversations/` - Create a new conversation
- `GET /users/{user_id}/conversations` - List recent conversations for a user
- `PUT /conversations/{conversation_id}/end` - End a conversation
- `POST /messages/` - Send a message to the chatbot (streams assistant output as SSE: `text/event-stream`)
- `GET /conversations/{conversation_id}/messages` - Get conversation history

## Features

### 1. Sentiment Analysis
The system uses VADER (Valence Aware Dictionary and sEntiment Reasoner) to analyze the emotional tone of user messages:
- Compound scores from -1 (very negative) to +1 (very positive)
- Tracks emotional trajectory across conversations
- Detects crisis-level negative sentiment

### 2. Intent Classification
Using OpenAI (GPT-4o), the system identifies user intents:
- Emotional Support
- Coping Strategies
- Information Seeking
- Symptom Reporting
- Crisis Expression
- General Conversation
- Feedback

### 3. Dialogue Management
- Maintains conversation context
- Adapts responses based on sentiment and intent
- Provides evidence-based coping strategies
- Ensures ethical boundaries

### 4. Crisis Detection and Response
- Crisis-aware detection using:
  - LLM intent classification (`crisis`)
  - VADER negative sentiment thresholds
  - Keyword checks for self-harm/suicide terms
- Encourages professional help

### 5. Privacy and Security
- Consent-based data storage (users must accept consent + privacy flags)
- Safe prompt constraints (never diagnose or provide medical advice)
- Secure API communication
- User consent management

## Project Structure

```
mental-health-chatbot/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── database.py             # Database configuration
│   ├── models.py               # SQLAlchemy models
│   ├── sentiment_analysis.py  # Sentiment analysis module
│   ├── intent_classification.py # Intent classification
│   ├── dialogue_manager.py    # Response generation
│   ├── rag.py                  # RAG retriever (Chroma + OpenAI embeddings)
│   ├── ingest_knowledge.py     # Ingest knowledge/ into vector store
│   ├── knowledge/              # Knowledge base (.md / .txt for RAG)
│   ├── requirements.txt        # Python dependencies
│   └── env.example            # Environment template
├── frontend/
│   ├── src/
│   │   ├── app/               # Next.js app directory
│   │   ├── components/        # React components
│   │   └── lib/               # Utilities (API client)
│   ├── package.json           # Node dependencies
│   └── next.config.js         # Next.js configuration
└── README.md
```

**Disclaimer**: This is a prototype developed for educational purposes. It should not be used as a primary mental health intervention tool without proper clinical validation and oversight.
