# 🏗️ AI Form Builder - Backend Documentation

> Complete documentation of the Backend folder structure, files, and API endpoints.

---

## 📚 Table of Contents

1. [Architecture Overview](#-architecture-overview)
2. [File-wise Code Explanation](#-file-wise-code-explanation)
3. [Auth Module](#-auth-module)
4. [Database Module](#-database-module)
5. [Models Module](#-models-module)
6. [API Endpoints](#-api-endpoints)
7. [AI Form Generation Flow](#-ai-form-generation-flow)
8. [Data Flow Diagram](#-data-flow-diagram)

---

## 🏗️ Architecture Overview

Ye ek **FastAPI** based backend hai jo **AI Form Builder** application ke liye hai.

### Key Technologies:

| Technology        | Purpose                             |
| ----------------- | ----------------------------------- |
| **FastAPI**       | Python web framework                |
| **MongoDB**       | NoSQL database (Motor async driver) |
| **JWT**           | Authentication tokens               |
| **OpenAI GPT-4o** | AI-powered form generation          |
| **DALL-E 3**      | Background image generation         |
| **bcrypt**        | Password hashing                    |
| **Google OAuth**  | Social login                        |

### Folder Structure:

```
Backend/
├── app.py                 # Main application entry point
├── config.py              # Configuration management
├── form_prompts.py        # Pre-written form type prompts
├── llm_parser.py          # LLM response parser
├── session_manager.py     # AI session management
├── auth/                  # Authentication module
│   ├── __init__.py
│   ├── google_oauth.py
│   ├── jwt_handler.py
│   ├── middleware.py
│   └── password.py
├── database/              # Database module
│   ├── __init__.py
│   ├── connection.py
│   └── repositories.py
├── models/                # Pydantic models
│   ├── __init__.py
│   ├── form_models.py
│   ├── submission.py
│   └── user.py
└── routes/                # API routes
    ├── __init__.py
    ├── auth_routes.py
    ├── form_routes.py
    └── submission_routes.py
```

---

## 📁 File-wise Code Explanation

### 1️⃣ `config.py` - Configuration Management

**Purpose:** Environment variables ko Pydantic Settings se load karta hai

**Key Settings:**

| Setting                       | Default                                     | Purpose                  |
| ----------------------------- | ------------------------------------------- | ------------------------ |
| `OPENAI_API_KEY`              | Required                                    | GPT-4 aur DALL-E ke liye |
| `MONGODB_URL`                 | `mongodb://localhost:27017/ai_form_builder` | Database connection      |
| `MONGODB_DB_NAME`             | `ai_form_builder`                           | Database name            |
| `JWT_SECRET_KEY`              | Required                                    | Token signing            |
| `JWT_ALGORITHM`               | `HS256`                                     | Token algorithm          |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30`                                        | Access token expiry      |
| `REFRESH_TOKEN_EXPIRE_DAYS`   | `7`                                         | Refresh token expiry     |
| `GOOGLE_CLIENT_ID`            | Optional                                    | Google OAuth             |
| `GOOGLE_CLIENT_SECRET`        | Optional                                    | Google OAuth             |
| `FRONTEND_URL`                | `http://localhost:5174`                     | CORS & URLs              |
| `RATE_LIMIT_PER_MINUTE`       | `60`                                        | API rate limiting        |
| `FORM_SUBMISSION_RATE_LIMIT`  | `10`                                        | Submissions per hour     |

---

### 2️⃣ `app.py` - Main Application Entry Point

**Purpose:** Poori application yahan se start hoti hai

**Key Components:**

#### LLM Setup

```python
model = ChatOpenAI(
    model="gpt-4o",
    temperature=0,
    max_tokens=16000  # Large forms (50+ MCQ) support
)
```

#### SYSTEM_PROMPT

- AI ko batata hai kaise form create karna hai
- Single question mode (ek ek question puchta hai)
- JSON format mandatory
- Background image question mandatory (last question)

#### `generate_background_image(theme)`

- DALL-E se background image generate karta hai
- Base64 data URL return karta hai
- Skip conditions: "No background", "clean white"

#### Startup/Shutdown Events

- Database connection initialize/close
- Routers register

---

### 3️⃣ `form_prompts.py` - Form Type Prompts

**Purpose:** Har form type ke liye pre-written detailed prompts

**Supported Form Types:**

| Form Type      | Use Case                            |
| -------------- | ----------------------------------- |
| `application`  | Job/membership/program applications |
| `registration` | Event/course registration           |
| `feedback`     | Product/service feedback            |
| `admission`    | School/college admission            |
| `survey`       | Market research, polls              |
| `consent`      | Legal consent, agreements           |
| `order`        | Product orders, bookings            |
| `complaint`    | Customer complaints                 |
| `request`      | Service/information requests        |
| `evaluation`   | Performance reviews                 |
| `blank`        | User-defined custom prompt          |

**Key Functions:**

| Function                        | Purpose                           |
| ------------------------------- | --------------------------------- |
| `get_form_prompt(form_type)`    | Get prompt for specific form type |
| `get_available_form_types()`    | List all available types          |
| `is_blank_form(form_type)`      | Check if blank form               |
| `wrap_user_prompt(user_prompt)` | Wrap user prompt with guardrails  |

---

### 4️⃣ `llm_parser.py` - LLM Response Parser

**Purpose:** GPT-4 ke response ko parse aur validate karta hai

**Key Functions:**

| Function                             | Purpose                                                |
| ------------------------------------ | ------------------------------------------------------ |
| `repair_truncated_json(json_str)`    | Incomplete JSON fix (50+ MCQ forms ke liye)            |
| `parse_llm_response(response_text)`  | Parse response, detect mode (`question`/`form_schema`) |
| `extract_questions(response_text)`   | Extract questions from text                            |
| `extract_form_schema(response_text)` | Extract form schema                                    |
| `is_final_form(response_text)`       | Check if final form or questions                       |
| `normalize_checkbox_answers()`       | Checkbox answers to text                               |
| `validate_form_schema(form_schema)`  | Validate schema (title, fields required)               |

**JSON Repair Logic:**

- Counts opening/closing brackets
- Removes trailing commas
- Closes unclosed strings
- Adds missing brackets/braces

---

### 5️⃣ `session_manager.py` - AI Session Management

**Purpose:** AI conversation sessions manage karta hai

**Session Stages (Enum):**

| Stage         | Description                 |
| ------------- | --------------------------- |
| `INITIALIZED` | Session shuru hua           |
| `QUESTION`    | AI question puch raha hai   |
| `FORM_SCHEMA` | Final form generate ho gaya |
| `COMPLETED`   | Session complete            |

**FormSession Fields:**

- `session_id` - Unique identifier
- `form_type` - Selected form type
- `conversation_history` - Chat history
- `current_question` - Current AI question
- `answers` - User answers dictionary
- `form_id` - Saved form ID
- `expires_at` - 24 hours expiry

**SessionManager Methods:**

| Method                       | Purpose                 |
| ---------------------------- | ----------------------- |
| `create_session()`           | New session create      |
| `get_session()`              | Get session by ID       |
| `update_session()`           | Update session          |
| `delete_session()`           | Delete session          |
| `cleanup_expired_sessions()` | Remove expired sessions |
| `get_session_count()`        | Active sessions count   |

---

## 🔐 Auth Module

### `jwt_handler.py` - JWT Token Management

| Function                                   | Purpose                               |
| ------------------------------------------ | ------------------------------------- |
| `create_access_token(data, expires_delta)` | Access token create (30 mins default) |
| `create_refresh_token(data)`               | Refresh token create (7 days)         |
| `verify_token(token, token_type)`          | Token validation                      |
| `decode_token(token)`                      | Token decode, get payload             |
| `get_token_expiry(token)`                  | Get expiration datetime               |

**Token Payload:**

```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "exp": 1234567890,
  "iat": 1234567890,
  "type": "access" // or "refresh"
}
```

---

### `password.py` - Password Hashing

| Function                         | Purpose                 |
| -------------------------------- | ----------------------- |
| `hash_password(password)`        | bcrypt hash (12 rounds) |
| `verify_password(plain, hashed)` | Password verification   |
| `needs_rehash(hashed, rounds)`   | Check if rehash needed  |

**Features:**

- bcrypt with 12 rounds
- SHA256 pre-hash for passwords > 72 bytes
- Secure error handling

---

### `google_oauth.py` - Google OAuth

| Function                     | Purpose                |
| ---------------------------- | ---------------------- |
| `verify_google_token(token)` | Verify Google ID token |
| `get_google_oauth_url()`     | Generate OAuth URL     |

**Returns user info:**

```json
{
  "google_id": "...",
  "email": "user@gmail.com",
  "email_verified": true,
  "name": "John Doe",
  "picture": "https://..."
}
```

---

### `middleware.py` - Authentication Middleware

| Function                                 | Purpose                                  |
| ---------------------------------------- | ---------------------------------------- |
| `get_current_user(credentials)`          | Extract user from JWT (protected routes) |
| `get_current_user_optional(credentials)` | Optional auth                            |
| `require_auth(func)`                     | Decorator for auth requirement           |

**Usage:**

```python
@app.get("/protected")
async def protected_route(current_user: UserResponse = Depends(get_current_user)):
    return {"user": current_user}
```

---

## 💾 Database Module

### `connection.py` - MongoDB Connection

| Function                  | Purpose                            |
| ------------------------- | ---------------------------------- |
| `init_database()`         | Connect to MongoDB, create indexes |
| `get_database()`          | Get current database instance      |
| `close_database()`        | Close connection gracefully        |
| `check_database_health()` | Health check for monitoring        |
| `create_indexes()`        | Create performance indexes         |

**Indexes Created:**

| Collection    | Index                     | Type     |
| ------------- | ------------------------- | -------- |
| `users`       | `email`                   | Unique   |
| `users`       | `google_id`               | Sparse   |
| `forms`       | `slug`                    | Unique   |
| `forms`       | `owner_id`                | Regular  |
| `forms`       | `(owner_id, created_at)`  | Compound |
| `forms`       | `status`                  | Regular  |
| `submissions` | `form_id`                 | Regular  |
| `submissions` | `(form_id, submitted_at)` | Compound |

---

### `repositories.py` - Data Access Layer

#### UserRepository

| Method                               | Purpose                      |
| ------------------------------------ | ---------------------------- |
| `create(user_data, hashed_password)` | Create user (email/password) |
| `create_from_google(google_info)`    | Create Google user           |
| `get_by_email(email)`                | Find by email                |
| `get_by_google_id(google_id)`        | Find by Google ID            |
| `get_by_id(user_id)`                 | Find by ID                   |
| `update(user_id, update_data)`       | Update user                  |
| `update_last_login(user_id)`         | Update login timestamp       |

#### FormRepository

| Method                                   | Purpose                  |
| ---------------------------------------- | ------------------------ |
| `create(form_data, owner_id, slug)`      | Create form              |
| `get_by_id(form_id)`                     | Get form by ID           |
| `get_by_slug(slug)`                      | Get form by public slug  |
| `get_user_forms(owner_id, skip, limit)`  | Get user's forms         |
| `update(form_id, update_data, owner_id)` | Update form (owner only) |
| `delete(form_id, owner_id)`              | Permanent delete         |
| `archive(form_id, owner_id)`             | Soft delete              |
| `increment_submission_count(form_id)`    | Increment counter        |
| `slug_exists(slug)`                      | Check slug uniqueness    |

#### SubmissionRepository

| Method                                              | Purpose                    |
| --------------------------------------------------- | -------------------------- |
| `create(data, form_id, ip, user_agent, session_id)` | Create submission          |
| `get_by_id(submission_id)`                          | Get by ID                  |
| `get_by_session(form_id, session_id)`               | Get by session (prefill)   |
| `update_by_session(form_id, session_id, data)`      | Update existing submission |
| `get_form_submissions(form_id, skip, limit)`        | Get all form submissions   |
| `count_form_submissions(form_id)`                   | Count submissions          |
| `delete(submission_id)`                             | Delete submission          |

---

## 📋 Models Module

### `user.py` - User Schemas

| Model            | Purpose                                    |
| ---------------- | ------------------------------------------ |
| `UserBase`       | Base fields (email, full_name, avatar_url) |
| `UserCreate`     | Registration (+ password with validation)  |
| `UserLogin`      | Login credentials                          |
| `UserUpdate`     | Profile update                             |
| `UserResponse`   | API response (no sensitive data)           |
| `User`           | Complete DB model                          |
| `GoogleUserInfo` | Google OAuth info                          |

**Password Validation Rules:**

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 digit

---

### `form_models.py` - Form Schemas

| Model          | Purpose                          |
| -------------- | -------------------------------- |
| `FormStatus`   | Enum: draft, published, archived |
| `FormField`    | Individual field schema          |
| `CTAButton`    | Submit button customization      |
| `GlobalStyles` | Form styling                     |
| `FormCreate`   | Create request                   |
| `FormUpdate`   | Update request                   |
| `FormResponse` | API response                     |

**FormField Properties:**

```json
{
  "id": "field_id",
  "type": "text|email|tel|number|select|checkbox|radio|textarea|file|date|time|url",
  "label": "Field Label",
  "placeholder": "Optional placeholder",
  "required": true,
  "validation": "regex pattern",
  "options": ["opt1", "opt2"], // for select/radio/checkbox
  "accept": [".pdf", ".jpg"], // for file upload
  "min": 0,
  "max": 100,
  "visible": true
}
```

---

### `submission.py` - Submission Schemas

| Model                | Purpose                                 |
| -------------------- | --------------------------------------- |
| `SubmissionCreate`   | Create submission (form_data, metadata) |
| `SubmissionResponse` | API response                            |
| `Submission`         | Complete DB model                       |

---

## 🛣️ API Endpoints

### 🔐 Authentication Routes (`/api/auth`)

#### `POST /api/auth/register`

**Purpose:** New user registration

**Request:**

```json
{
  "email": "user@example.com",
  "password": "Password123",
  "full_name": "John Doe"
}
```

**Response:**

```json
{
  "access_token": "eyJhbG...",
  "refresh_token": "eyJhbG...",
  "token_type": "bearer",
  "user": {
    "id": "64a...",
    "email": "user@example.com",
    "full_name": "John Doe",
    "is_active": true,
    "is_verified": false
  }
}
```

**Errors:**

- `400` - Email already registered
- `422` - Invalid password format

---

#### `POST /api/auth/login`

**Purpose:** User login with email/password

**Request:**

```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Response:** Same as register

**Errors:**

- `401` - Incorrect email or password
- `401` - Please login with Google (no password set)
- `403` - Account is inactive

---

#### `POST /api/auth/google`

**Purpose:** Google OAuth login/signup

**Request:**

```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Flow:**

1. Frontend gets Google ID token from OAuth popup
2. Backend verifies token with Google servers
3. User exists ➜ Login
4. User doesn't exist ➜ Create new account
5. Email matches but no Google ID ➜ Link accounts

---

#### `POST /api/auth/refresh`

**Purpose:** Refresh access token

**Request:**

```json
{
  "refresh_token": "eyJhbG..."
}
```

**Response:** New access + refresh tokens

**Why needed:**

- Access token expires in 30 minutes
- Refresh token valid for 7 days
- User doesn't need to login repeatedly

---

#### `GET /api/auth/me`

**Purpose:** Get current user info

**Headers:** `Authorization: Bearer <access_token>`

**Response:**

```json
{
  "id": "64a...",
  "email": "user@example.com",
  "full_name": "John Doe",
  "avatar_url": null,
  "is_active": true,
  "is_verified": false
}
```

---

#### `POST /api/auth/logout`

**Purpose:** Logout user

**Note:** Client should delete tokens from local storage

---

### 📝 Form Routes (`/api/forms`)

#### `POST /api/forms`

**Purpose:** Create new form (manual, without AI)

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "title": "Contact Form",
  "description": "Get in touch with us",
  "fields": [
    {
      "id": "name",
      "type": "text",
      "label": "Your Name",
      "required": true
    },
    {
      "id": "email",
      "type": "email",
      "label": "Email Address",
      "required": true
    }
  ],
  "status": "draft"
}
```

**Response:**

```json
{
  "id": "64a123...",
  "slug": "contact-form-abc12345",
  "public_url": "http://localhost:5174/forms/contact-form-abc12345",
  "owner_id": "...",
  "title": "Contact Form",
  "status": "draft",
  "submission_count": 0,
  "created_at": "2024-01-15T10:30:00"
}
```

**Slug Generation:**

- Title ➜ lowercase + hyphen
- Random 8 character suffix
- Example: "Contact Form" ➜ `contact-form-x7k9m2pq`

---

#### `GET /api/forms`

**Purpose:** Get user's all forms (dashboard)

**Headers:** `Authorization: Bearer <token>`

**Query Params:** `?skip=0&limit=50`

**Response:**

```json
[
  {
    "id": "64a123...",
    "title": "Feedback Form",
    "status": "published",
    "submission_count": 25
  },
  {
    "id": "64a456...",
    "title": "Registration Form",
    "status": "draft",
    "submission_count": 0
  }
]
```

---

#### `GET /api/forms/{form_id}`

**Purpose:** Get specific form (owner only)

**Headers:** `Authorization: Bearer <token>`

**Errors:**

- `404` - Form not found
- `403` - Not owner

---

#### `GET /api/forms/public/{slug}`

**Purpose:** Get form for public filling (no auth)

**Note:** Only PUBLISHED forms accessible

**Errors:**

- `404` - Form not found or not published

---

#### `PUT /api/forms/{form_id}`

**Purpose:** Update form (owner only)

**Request:** Partial update - only changed fields

```json
{
  "title": "Updated Form Title",
  "status": "published"
}
```

---

#### `DELETE /api/forms/{form_id}`

**Purpose:** Delete or archive form

**Query Params:**

- `?permanent=false` (default) ➜ Soft delete (archive)
- `?permanent=true` ➜ Hard delete

---

#### `POST /api/forms/{form_id}/publish`

**Purpose:** Publish draft form

**Effect:** Form becomes accessible via public URL

---

### 📊 Submission Routes (`/api`)

#### `POST /api/forms/{slug}/submit`

**Purpose:** Submit form (public, rate limited)

**Request:**

```json
{
  "form_data": {
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Hello!"
  },
  "metadata": {
    "session_id": "browser-session-123"
  }
}
```

**Rate Limiting:** 10 submissions per hour per IP per form

**Session-based resubmission:**

- Same session_id ➜ UPDATE existing
- New session_id ➜ CREATE new

**Errors:**

- `404` - Form not found or not published
- `429` - Too many submissions

---

#### `GET /api/forms/{slug}/my-submission?session_id=xxx`

**Purpose:** Get previous submission for prefill

**Response:**

```json
{
  "has_submission": true,
  "submission": {
    "id": "sub_123",
    "form_data": { "name": "John", "email": "john@example.com" },
    "submitted_at": "2024-01-15T14:30:00"
  }
}
```

---

#### `GET /api/forms/{form_id}/submissions`

**Purpose:** Get all submissions for a form (owner only)

**Headers:** `Authorization: Bearer <token>`

**Query Params:** `?skip=0&limit=100`

---

#### `GET /api/submissions/{submission_id}`

**Purpose:** Get single submission (owner only)

---

#### `DELETE /api/submissions/{submission_id}`

**Purpose:** Delete submission (owner only)

---

### 🤖 AI Form Generation Routes (`/api/ai`)

#### `POST /api/ai/form/init`

**Purpose:** Start AI form creation

**Headers:** `Authorization: Bearer <token>`

**Request (Predefined type):**

```json
{
  "form_type": "feedback"
}
```

**Request (Blank with custom prompt):**

```json
{
  "form_type": "blank",
  "custom_prompt": "Create a quiz with 10 MCQ questions about Indian History",
  "file_content": "Q1: Who was the first President?..."
}
```

**Response:**

```json
{
  "session_id": "uuid-session-123",
  "mode": "question",
  "question": {
    "id": "feedback_purpose",
    "label": "What is the feedback about?",
    "type": "radio",
    "options": ["Product", "Service", "Website", "Other"]
  },
  "question_number": 1
}
```

---

#### `POST /api/ai/form/answer`

**Purpose:** Answer AI question

**Headers:** `Authorization: Bearer <token>`

**Request:**

```json
{
  "session_id": "uuid-session-123",
  "question_id": "feedback_purpose",
  "answer": "Product"
}
```

**Response (Next question):**

```json
{
  "session_id": "uuid-session-123",
  "mode": "question",
  "question": {...},
  "question_number": 2
}
```

**Response (Final form):**

```json
{
  "session_id": "uuid-session-123",
  "mode": "form_schema",
  "form": {
    "title": "Product Feedback Form",
    "fields": [...],
    "backgroundImage": "data:image/png;base64,..."
  },
  "form_id": "64a789..."
}
```

---

### 🔧 Utility Endpoints

#### `GET /`

**Purpose:** API info HTML page

#### `GET /health`

**Purpose:** Health check

```json
{
  "status": "ok",
  "database": "connected",
  "active_ai_sessions": 5,
  "available_form_types": ["application", "registration", ...]
}
```

#### `GET /api/form/types`

**Purpose:** List available form types

---

## 🤖 AI Form Generation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    AI FORM GENERATION FLOW                   │
└─────────────────────────────────────────────────────────────┘

User selects form type (e.g., "feedback")
                    │
                    ▼
        ┌─────────────────────┐
        │  POST /api/ai/form  │
        │       /init         │
        └─────────────────────┘
                    │
                    ▼
        ┌─────────────────────┐
        │   AI asks Q1        │◄──────┐
        │   (radio/checkbox)  │       │
        └─────────────────────┘       │
                    │                 │
                    ▼                 │
        ┌─────────────────────┐       │
        │   User answers      │       │
        │   POST /answer      │       │
        └─────────────────────┘       │
                    │                 │
                    ▼                 │
              ┌───────────┐           │
              │ More Qs?  │───Yes────►┘
              └───────────┘
                    │ No (3-5 questions done)
                    ▼
        ┌─────────────────────┐
        │   Background Q      │
        │   (mandatory last)  │
        └─────────────────────┘
                    │
                    ▼
        ┌─────────────────────┐
        │   DALL-E generates  │
        │   background image  │
        └─────────────────────┘
                    │
                    ▼
        ┌─────────────────────┐
        │   Form auto-saved   │
        │   to MongoDB        │
        └─────────────────────┘
                    │
                    ▼
        ┌─────────────────────┐
        │   Return form_id    │
        │   + form schema     │
        └─────────────────────┘
                    │
                    ▼
        ┌─────────────────────┐
        │   Redirect to       │
        │   Form Editor       │
        └─────────────────────┘
```

---

## 🔄 Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                      COMPLETE DATA FLOW                          │
└──────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────────────────┐
│   Frontend  │────►│   FastAPI   │────►│   MongoDB               │
│   (React)   │◄────│   Backend   │◄────│   (users, forms,        │
└─────────────┘     └─────────────┘     │    submissions)         │
                           │            └─────────────────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   OpenAI    │
                    │   GPT-4o    │◄───── Form Generation
                    │   DALL-E    │◄───── Background Images
                    └─────────────┘

User Journey:
═════════════

1. Register/Login ─────► JWT Token
        │
        ▼
2. Create Form (AI/Manual)
        │
        ▼
3. Edit Form ◄─────────► Save to DB
        │
        ▼
4. Publish Form ─────► Public URL accessible
        │
        ▼
5. Share Link ─────► Public users fill form
        │
        ▼
6. View Submissions ◄── Owner dashboard
```

---

## 📝 Error Handling

| Status Code | Meaning                                  |
| ----------- | ---------------------------------------- |
| `200`       | Success                                  |
| `201`       | Created                                  |
| `400`       | Bad Request (validation error)           |
| `401`       | Unauthorized (invalid/expired token)     |
| `403`       | Forbidden (not owner)                    |
| `404`       | Not Found                                |
| `422`       | Unprocessable Entity (schema validation) |
| `429`       | Too Many Requests (rate limit)           |
| `500`       | Internal Server Error                    |

---

## 🔒 Security Features

1. **JWT Authentication** - Stateless token-based auth
2. **Password Hashing** - bcrypt with 12 rounds
3. **Rate Limiting** - 10 submissions/hour per IP
4. **Owner Verification** - Only form owner can edit/delete
5. **CORS** - Configurable origins
6. **Input Validation** - Pydantic models

---

## 🚀 Running the Backend

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your values

# Run development server
uvicorn app:app --reload --host 0.0.0.0 --port 8000

# API docs available at:
# http://localhost:8000/docs (Swagger UI)
# http://localhost:8000/redoc (ReDoc)
```

---

> **Generated on:** 2026-01-02
> **Version:** 2.0.0
