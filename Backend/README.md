# AI Form Builder - Backend

Complete authentication system with Google OAuth, MongoDB integration, and AI-powered form generation.

## 🚀 Features

- ✅ **Authentication**

  - Email/Password registration and login
  - Google OAuth 2.0 integration
  - JWT access and refresh tokens
  - Secure password hashing with bcrypt

- ✅ **Form Management**

  - Create, read, update, delete forms
  - Form ownership and access control
  - Draft/Published status
  - Unique shareable links
  - Version history support

- ✅ **AI Form Generation**

  - Conversational AI-driven form creation
  - GPT-4 powered question flow
  - Automatic form schema generation
  - Saves to database with ownership

- ✅ **Form Submissions**

  - Public form submission (no auth required)
  - Rate limiting protection
  - Owner-only access to submissions
  - IP and user agent tracking

- ✅ **MongoDB Storage**
  - User accounts
  - Forms with ownership
  - Submissions
  - Indexed for performance

## 📋 Prerequisites

- Python 3.9+
- MongoDB (local or cloud)
- OpenAI API key
- Google OAuth credentials (optional)

## 🛠️ Installation

1. **Install dependencies:**

```bash
pip install -r requirements.txt
```

2. **Setup environment variables:**

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
OPENAI_API_KEY=your_openai_api_key
MONGODB_URL=mongodb://localhost:27017/ai_form_builder
JWT_SECRET_KEY=your_secret_key_here
GOOGLE_CLIENT_ID=your_google_client_id  # Optional
GOOGLE_CLIENT_SECRET=your_google_client_secret  # Optional
```

3. **Start MongoDB:**

```bash
# If using local MongoDB
mongod
```

4. **Run the server:**

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

## 📚 API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔐 Authentication Endpoints

### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "full_name": "John Doe"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

### Google OAuth

```http
POST /api/auth/google
Content-Type: application/json

{
  "token": "google_id_token_from_frontend"
}
```

### Get Current User

```http
GET /api/auth/me
Authorization: Bearer {access_token}
```

## 📝 Form Management Endpoints

### Create Form

```http
POST /api/forms
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "Contact Form",
  "description": "Get in touch with us",
  "fields": [...],
  "status": "draft"
}
```

### Get User's Forms

```http
GET /api/forms
Authorization: Bearer {access_token}
```

### Update Form

```http
PUT /api/forms/{form_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "Updated Title",
  "status": "published"
}
```

### Get Public Form

```http
GET /api/forms/public/{slug}
```

## 🤖 AI Form Generation

### Initialize AI Form Creation

```http
POST /api/ai/form/init
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "form_type": "contact",
  "custom_prompt": "Create a contact form"  // For blank forms
}
```

### Submit Answer to AI Question

```http
POST /api/ai/form/answer
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "session_id": "session_id_from_init",
  "question_id": "question_id",
  "answer": "Selected option"
}
```

## 📊 Submission Endpoints

### Submit Form (Public)

```http
POST /api/forms/{slug}/submit
Content-Type: application/json

{
  "form_data": {
    "field_id": "value"
  }
}
```

### Get Form Submissions (Owner Only)

```http
GET /api/forms/{form_id}/submissions
Authorization: Bearer {access_token}
```

## 🗄️ Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  email: String (unique),
  hashed_password: String,
  google_id: String (optional),
  full_name: String,
  avatar_url: String,
  is_active: Boolean,
  is_verified: Boolean,
  created_at: DateTime,
  updated_at: DateTime
}
```

### Forms Collection

```javascript
{
  _id: ObjectId,
  owner_id: String,
  slug: String (unique),
  title: String,
  description: String,
  fields: Array,
  globalStyles: Object,
  status: String (draft/published/archived),
  version: Number,
  created_at: DateTime,
  updated_at: DateTime,
  submission_count: Number
}
```

### Submissions Collection

```javascript
{
  _id: ObjectId,
  form_id: String,
  form_data: Object,
  submitted_at: DateTime,
  ip_address: String,
  user_agent: String
}
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt
- **JWT Tokens**: Access (30 min) + Refresh (7 days)
- **Rate Limiting**: 10 submissions per hour per IP
- **Access Control**: Owner-only form editing
- **Input Validation**: Pydantic models
- **CORS**: Configured for frontend origin

## 🧪 Testing

```bash
# Health check
curl http://localhost:8000/health

# Register user
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","full_name":"Test User"}'
```

## 📁 Project Structure

```
Backend/
├── app.py                 # Main FastAPI application
├── config.py              # Configuration management
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables
│
├── auth/                  # Authentication module
│   ├── jwt_handler.py     # JWT token management
│   ├── password.py        # Password hashing
│   ├── google_oauth.py    # Google OAuth
│   └── middleware.py      # Auth middleware
│
├── database/              # Database module
│   ├── connection.py      # MongoDB connection
│   └── repositories.py    # Data access layer
│
├── models/                # Pydantic models
│   ├── user.py           # User models
│   ├── form.py           # Form models
│   └── submission.py     # Submission models
│
├── routes/                # API routes
│   ├── auth_routes.py    # Authentication endpoints
│   ├── form_routes.py    # Form management endpoints
│   └── submission_routes.py  # Submission endpoints
│
└── [Legacy files]
    ├── form_prompts.py   # AI form prompts
    ├── llm_parser.py     # LLM response parser
    └── session_manager.py # AI session management
```

## 🚨 Common Issues

### MongoDB Connection Error

```bash
# Make sure MongoDB is running
mongod

# Or check connection string in .env
MONGODB_URL=mongodb://localhost:27017/ai_form_builder
```

### JWT Secret Key Error

```bash
# Generate a secure secret key
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Add to .env
JWT_SECRET_KEY=generated_key_here
```

### Google OAuth Not Working

```bash
# Make sure you have valid credentials in .env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
```

## 📝 Environment Variables

| Variable                      | Description                      | Required | Default                                     |
| ----------------------------- | -------------------------------- | -------- | ------------------------------------------- |
| `OPENAI_API_KEY`              | OpenAI API key for AI generation | Yes      | -                                           |
| `MONGODB_URL`                 | MongoDB connection string        | Yes      | `mongodb://localhost:27017/ai_form_builder` |
| `MONGODB_DB_NAME`             | Database name                    | No       | `ai_form_builder`                           |
| `JWT_SECRET_KEY`              | Secret key for JWT signing       | Yes      | -                                           |
| `JWT_ALGORITHM`               | JWT algorithm                    | No       | `HS256`                                     |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token expiry              | No       | `30`                                        |
| `REFRESH_TOKEN_EXPIRE_DAYS`   | Refresh token expiry             | No       | `7`                                         |
| `GOOGLE_CLIENT_ID`            | Google OAuth client ID           | No       | -                                           |
| `GOOGLE_CLIENT_SECRET`        | Google OAuth secret              | No       | -                                           |
| `FRONTEND_URL`                | Frontend URL for CORS            | No       | `http://localhost:5174`                     |

## 🎯 Next Steps

1. ✅ Backend complete with authentication
2. ⏳ Frontend implementation
3. ⏳ Deployment configuration
4. ⏳ Email notifications
5. ⏳ Analytics dashboard

## 📄 License

MIT License - See LICENSE file for details
