# Complete API List for Mental Health Support Chatbot Project

This document lists all APIs used in the project, categorized by type and purpose.

---

## 1. External Third-Party APIs

### 1.1 OpenAI API
- **Service**: OpenAI GPT-4
- **Purpose**: 
  - Intent classification of user messages
  - Generation of conversational responses
- **Endpoints Used**:
  - Chat Completions API (via LangChain)
- **Model**: `gpt-4o`
- **Usage Locations**:
  - `backend/intent_classification.py` - Intent classification (temperature: 0.0)
  - `backend/dialogue_manager.py` - Response generation (temperature: 0.7)
- **Authentication**: API Key via `OPENAI_API_KEY` environment variable
- **Library**: `langchain-openai` (LangChain wrapper)
- **Documentation**: https://platform.openai.com/docs/api-reference

### 1.2 Google OAuth API
- **Service**: Google Identity Services
- **Purpose**: User authentication via Google Sign-In
- **Endpoints Used**:
  - OAuth 2.0 Authorization Endpoint
  - OAuth 2.0 Token Endpoint
  - User Info Endpoint
- **Usage Location**: `frontend/src/lib/auth.ts` (NextAuth Google provider)
- **Authentication**: 
  - `GOOGLE_CLIENT_ID` environment variable
  - `GOOGLE_CLIENT_SECRET` environment variable
- **Library**: `next-auth/providers/google`
- **Documentation**: https://developers.google.com/identity/protocols/oauth2

### 1.3 Supabase Database API
- **Service**: Supabase (PostgreSQL Database)
- **Purpose**: 
  - Database storage for users, conversations, messages
  - Authentication data storage
- **Connection Type**: Direct PostgreSQL connection (not REST API)
- **Protocol**: PostgreSQL protocol over SSL
- **Usage Locations**:
  - `backend/database.py` - Backend database connection
  - `frontend/src/lib/supabase/auth-queries.ts` - Frontend auth queries
- **Connection String Format**: 
  ```
  postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require
  ```
- **Environment Variables**:
  - `SUPABASE_DB_URL` (backend and frontend)
  - `NEXT_PUBLIC_SUPABASE_URL` (frontend, optional)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (frontend, optional)
  - `SUPABASE_SERVICE_ROLE_KEY` (frontend, optional)
- **Library**: 
  - Backend: `psycopg2-binary` (via SQLAlchemy)
  - Frontend: Direct SQL queries via `pg` library
- **Documentation**: https://supabase.com/docs

---

## 2. Internal Backend APIs (FastAPI)

**Base URL**: `http://localhost:8000` (development) or configured via `NEXT_PUBLIC_API_URL`

**Framework**: FastAPI (Python)
**Documentation**: Auto-generated at `http://localhost:8000/docs` (Swagger UI)

### 2.1 Root Endpoint
- **Endpoint**: `GET /`
- **Purpose**: API information and status
- **Response**: 
  ```json
  {
    "message": "Mental Health Support Chatbot API",
    "version": "1.0.0",
    "status": "running"
  }
  ```
- **Location**: `backend/main.py` (line 91-98)

### 2.2 Health Check
- **Endpoint**: `GET /health`
- **Purpose**: Server health monitoring
- **Response**: 
  ```json
  {
    "status": "healthy",
    "timestamp": "2024-01-20T12:00:00"
  }
  ```
- **Location**: `backend/main.py` (line 101-104)

### 2.3 User Management

#### Create User
- **Endpoint**: `POST /users/`
- **Purpose**: Create a new user or return existing user
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "consent_given": true,
    "privacy_accepted": true
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "user_id": "uuid-string",
    "email": "user@example.com",
    "created_at": "2024-01-20T12:00:00"
  }
  ```
- **Location**: `backend/main.py` (line 106-140)
- **Frontend Usage**: `frontend/src/lib/api.ts` - `chatAPI.createUser()`

#### Get User Conversations
- **Endpoint**: `GET /users/{user_id}/conversations`
- **Purpose**: Retrieve all conversations for a specific user
- **Path Parameters**: `user_id` (UUID string)
- **Response** (200 OK):
  ```json
  [
    {
      "conversation_id": "uuid-string",
      "started_at": "2024-01-20T12:00:00",
      "is_active": true,
      "total_messages": 10
    }
  ]
  ```
- **Location**: `backend/main.py` (line 312-340)
- **Frontend Usage**: `frontend/src/lib/api.ts` - `chatAPI.getUserConversations()`

### 2.4 Conversation Management

#### Create Conversation
- **Endpoint**: `POST /conversations/`
- **Purpose**: Create a new conversation session
- **Request Body**:
  ```json
  {
    "user_id": "uuid-string"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "conversation_id": "uuid-string",
    "started_at": "2024-01-20T12:00:00",
    "is_active": true,
    "total_messages": 0
  }
  ```
- **Location**: `backend/main.py` (line 142-174)
- **Frontend Usage**: `frontend/src/lib/api.ts` - `chatAPI.createConversation()`

#### End Conversation
- **Endpoint**: `PUT /conversations/{conversation_id}/end`
- **Purpose**: Mark a conversation as ended
- **Path Parameters**: `conversation_id` (UUID string)
- **Response** (200 OK):
  ```json
  {
    "message": "Conversation ended successfully"
  }
  ```
- **Location**: `backend/main.py` (line 343-370)
- **Frontend Usage**: `frontend/src/lib/api.ts` - `chatAPI.endConversation()`

#### Get Conversation Messages
- **Endpoint**: `GET /conversations/{conversation_id}/messages`
- **Purpose**: Retrieve all messages in a conversation
- **Path Parameters**: `conversation_id` (UUID string)
- **Response** (200 OK):
  ```json
  [
    {
      "message_id": "uuid-string",
      "role": "user",
      "content": "Hello",
      "timestamp": "2024-01-20T12:00:00",
      "sentiment": {
        "score": 0.5,
        "label": "positive"
      },
      "intent": {
        "intent": "general_conversation"
      }
    }
  ]
  ```
- **Location**: `backend/main.py` (line 273-309)
- **Frontend Usage**: `frontend/src/lib/api.ts` - `chatAPI.getConversationMessages()`

### 2.5 Message Operations

#### Send Message (Main Chat Endpoint)
- **Endpoint**: `POST /messages/`
- **Purpose**: Send a user message and receive AI-generated response
- **Request Body**:
  ```json
  {
    "conversation_id": "uuid-string",
    "content": "I'm feeling anxious today"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "message_id": "uuid-string",
    "role": "assistant",
    "content": "I understand that you're feeling anxious...",
    "timestamp": "2024-01-20T12:00:00",
    "sentiment": {
      "compound": -0.3,
      "positive": 0.1,
      "negative": 0.4,
      "neutral": 0.5,
      "label": "negative",
      "is_crisis_sentiment": false
    },
    "intent": {
      "intent": "emotional_support",
      "confidence": 1.0,
      "description": "User seeks empathy, validation, or emotional comfort"
    }
  }
  ```
- **Processing Flow**:
  1. Validates conversation exists
  2. Runs sentiment analysis (VADER)
  3. Runs intent classification (GPT-4)
  4. Checks for crisis detection
  5. Saves user message to database
  6. Generates AI response (GPT-4 via dialogue manager)
  7. Saves assistant response to database
  8. Returns response with metadata
- **Location**: `backend/main.py` (line 177-270)
- **Frontend Usage**: `frontend/src/lib/api.ts` - `chatAPI.sendMessage()`

---

## 3. Frontend API Routes (Next.js API Routes)

**Base URL**: `/api` (relative to frontend domain)

### 3.1 Authentication Routes (NextAuth)

#### NextAuth Handler
- **Endpoint**: `GET/POST /api/auth/[...nextauth]`
- **Purpose**: Handles all NextAuth.js authentication operations
- **Supported Operations**:
  - Sign in (credentials and OAuth)
  - Sign out
  - Session management
  - Callback handling
- **Location**: `frontend/src/app/api/auth/[...nextauth]/route.ts`
- **Library**: NextAuth.js v5
- **Documentation**: https://next-auth.js.org/

#### User Registration
- **Endpoint**: `POST /api/auth/register`
- **Purpose**: Register a new user with email and password
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "name": "User Name"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "User Name"
  }
  ```
- **Error Responses**:
  - 400: Missing email or password
  - 409: Email already registered
  - 500: Registration failed
- **Location**: `frontend/src/app/api/auth/register/route.ts`
- **Frontend Usage**: `frontend/src/app/auth/signup/page.tsx`

---

## 4. Frontend API Client (Axios)

**Library**: Axios
**Base URL**: Configured via `NEXT_PUBLIC_API_URL` (default: `http://localhost:8000`)

### API Client Methods
All methods are defined in `frontend/src/lib/api.ts`:

1. **`createUser(email, consent, privacy)`**
   - Calls: `POST /users/`
   - Used in: `frontend/src/app/page.tsx`

2. **`createConversation(userId)`**
   - Calls: `POST /conversations/`
   - Used in: `frontend/src/app/page.tsx`

3. **`getUserConversations(userId)`**
   - Calls: `GET /users/{userId}/conversations`
   - Used in: `frontend/src/app/page.tsx`

4. **`endConversation(conversationId)`**
   - Calls: `PUT /conversations/{conversationId}/end`
   - Used in: `frontend/src/components/ChatInterface.tsx`

5. **`sendMessage(conversationId, content)`**
   - Calls: `POST /messages/`
   - Used in: `frontend/src/components/ChatInterface.tsx`

6. **`getConversationMessages(conversationId)`**
   - Calls: `GET /conversations/{conversationId}/messages`
   - Used in: `frontend/src/components/ChatInterface.tsx`

7. **`healthCheck()`**
   - Calls: `GET /health`
   - Available but not actively used in UI

---

## 5. Database APIs/Connections

### 5.1 PostgreSQL Connection (Supabase)
- **Type**: Direct database connection (not REST API)
- **Protocol**: PostgreSQL protocol
- **Connection Method**: SQLAlchemy (backend) / Direct SQL (frontend)
- **SSL**: Required (`sslmode=require`)
- **Port**: 5432
- **Database**: `postgres`
- **Libraries**:
  - Backend: `sqlalchemy`, `psycopg2-binary`
  - Frontend: `pg` (PostgreSQL client)

### 5.2 Database Tables Accessed
- `users` - User accounts and consent information
- `conversations` - Conversation sessions
- `messages` - Individual chat messages
- `analytics` - Defined but not actively used
- `nextauth_users` - NextAuth user accounts (via Supabase)
- `nextauth_accounts` - OAuth account links (via Supabase)
- `nextauth_sessions` - User sessions (via Supabase)
- `nextauth_verification_tokens` - Email verification tokens (via Supabase)

---

## 6. API Summary Table

| API Type | Service/Endpoint | Method | Purpose | Authentication |
|----------|-----------------|--------|---------|----------------|
| **External** | OpenAI GPT-4 | POST | Intent classification & response generation | API Key |
| **External** | Google OAuth | GET/POST | User authentication | OAuth 2.0 |
| **External** | Supabase PostgreSQL | SQL | Database operations | Connection string |
| **Backend** | `/` | GET | API info | None |
| **Backend** | `/health` | GET | Health check | None |
| **Backend** | `/users/` | POST | Create user | None |
| **Backend** | `/users/{id}/conversations` | GET | Get user conversations | None |
| **Backend** | `/conversations/` | POST | Create conversation | None |
| **Backend** | `/conversations/{id}/end` | PUT | End conversation | None |
| **Backend** | `/conversations/{id}/messages` | GET | Get messages | None |
| **Backend** | `/messages/` | POST | Send message & get response | None |
| **Frontend** | `/api/auth/[...nextauth]` | GET/POST | Authentication | NextAuth |
| **Frontend** | `/api/auth/register` | POST | User registration | None |

---

## 7. API Dependencies

### Backend Dependencies (Python)
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `langchain-openai` - OpenAI API wrapper
- `openai` - OpenAI SDK
- `sqlalchemy` - Database ORM
- `psycopg2-binary` - PostgreSQL driver
- `pydantic` - Data validation

### Frontend Dependencies (Node.js)
- `axios` - HTTP client for API calls
- `next-auth` - Authentication framework
- `pg` - PostgreSQL client (for direct DB queries)

---

## 8. API Configuration

### Environment Variables Required

**Backend** (`backend/.env`):
```env
SUPABASE_DB_URL=postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require
OPENAI_API_KEY=your_openai_api_key_here
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=http://localhost:3000
```

**Frontend** (`frontend/.env.local`):
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
SUPABASE_DB_URL=postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 9. API Rate Limits & Costs

### External APIs
- **OpenAI API**: Pay-per-use (tokens consumed)
  - Intent classification: ~50-100 tokens per message
  - Response generation: ~100-500 tokens per response
  - Model: `gpt-4o` (premium pricing)
- **Google OAuth**: Free tier available
- **Supabase**: Free tier includes:
  - 500 MB database
  - Unlimited API requests
  - 2 GB bandwidth/month

### Internal APIs
- **No rate limiting implemented** (identified as limitation)
- **No authentication on backend endpoints** (identified as limitation)

---

## 10. API Documentation

### Auto-Generated Documentation
- **Backend Swagger UI**: `http://localhost:8000/docs`
- **Backend ReDoc**: `http://localhost:8000/redoc`
- Generated automatically by FastAPI from endpoint definitions

### Manual Documentation
- This document (API_LIST.md)
- README.md files in root and frontend directories
- PROFESSOR_UPDATE.md (technical overview)

---

*Last Updated: Based on codebase analysis*
*Total APIs: 3 External + 8 Backend + 2 Frontend = 13 API endpoints*
