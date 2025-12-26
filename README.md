# 🤖 AI Form Builder

An intelligent, AI-powered form builder with a beautiful Canva-style editor. Create professional forms using AI assistance or build custom forms with drag-and-drop functionality.

## ✨ Features

### 🎨 **Canva-Style Editor**

- Drag-and-drop form fields
- Real-time visual editing
- Custom styling for each field
- Global theme customization
- CTA button customization

### 🤖 **AI-Powered Form Generation**

- Intelligent form creation through conversational AI
- Multiple pre-built form templates
- Custom form generation from natural language
- Smart field suggestions

### 🔐 **Authentication & Security**

- Email/Password authentication
- Google OAuth integration
- JWT-based secure sessions
- Protected routes

### 📊 **Form Management**

- Create, edit, and publish forms
- Form versioning
- Submission tracking
- Public form sharing via unique URLs

### 💾 **Database**

- MongoDB for data persistence
- User management
- Form storage
- Submission collection

## 🏗️ Tech Stack

### Backend

- **Framework:** FastAPI (Python)
- **Database:** MongoDB
- **AI:** OpenAI GPT-4
- **Authentication:** JWT, OAuth 2.0
- **API:** RESTful

### Frontend

- **Framework:** React 18 + TypeScript
- **Routing:** React Router v6
- **Styling:** Tailwind CSS
- **Build Tool:** Vite
- **Rich Text:** Jodit Editor
- **Icons:** Lucide React

## 📁 Project Structure

```
Ai Form Builder/
├── Backend/                 # FastAPI backend
│   ├── auth/               # Authentication modules
│   ├── database/           # Database connections & repositories
│   ├── models/             # Pydantic models
│   ├── routes/             # API routes
│   ├── app.py              # Main FastAPI application
│   ├── config.py           # Configuration settings
│   └── requirements.txt    # Python dependencies
│
└── Frontend/               # React frontend
    ├── public/             # Static assets
    ├── src/
    │   ├── api/           # API service layer
    │   ├── components/    # React components
    │   ├── contexts/      # React contexts
    │   ├── hooks/         # Custom hooks
    │   ├── pages/         # Page components
    │   ├── styles/        # CSS files
    │   └── types/         # TypeScript types
    └── package.json       # Node dependencies
```

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- Node.js 16+
- MongoDB
- OpenAI API Key

### Backend Setup

1. **Navigate to Backend directory:**

   ```bash
   cd Backend
   ```

2. **Create virtual environment:**

   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment:**

   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

5. **Create `.env` file:**

   ```env
   # MongoDB
   MONGODB_URL=mongodb://localhost:27017
   MONGODB_DB_NAME=ai_form_builder

   # JWT
   JWT_SECRET_KEY=your-secret-key-here
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   REFRESH_TOKEN_EXPIRE_DAYS=7

   # OpenAI
   OPENAI_API_KEY=your-openai-api-key

   # Google OAuth (optional)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret

   # Frontend URL
   FRONTEND_URL=http://localhost:5173

   # Rate Limiting
   FORM_SUBMISSION_RATE_LIMIT=10
   ```

6. **Run the backend:**
   ```bash
   uvicorn app:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Navigate to Frontend directory:**

   ```bash
   cd Frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Create `.env` file:**

   ```env
   VITE_API_URL=http://localhost:8000
   VITE_GOOGLE_CLIENT_ID=your-google-client-id
   ```

4. **Run the frontend:**

   ```bash
   npm run dev
   ```

5. **Open browser:**
   Navigate to `http://localhost:5173`

## 🔑 Environment Variables

### Backend (.env)

| Variable               | Description                    | Required |
| ---------------------- | ------------------------------ | -------- |
| `MONGODB_URL`          | MongoDB connection string      | Yes      |
| `MONGODB_DB_NAME`      | Database name                  | Yes      |
| `JWT_SECRET_KEY`       | Secret key for JWT tokens      | Yes      |
| `OPENAI_API_KEY`       | OpenAI API key for AI features | Yes      |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID         | No       |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret     | No       |
| `FRONTEND_URL`         | Frontend URL for CORS          | Yes      |

### Frontend (.env)

| Variable                | Description            | Required |
| ----------------------- | ---------------------- | -------- |
| `VITE_API_URL`          | Backend API URL        | Yes      |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | No       |

## 📚 API Documentation

Once the backend is running, visit:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

### Key Endpoints

#### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/me` - Get current user

#### Forms

- `POST /api/forms` - Create new form
- `GET /api/forms` - Get user's forms
- `GET /api/forms/{form_id}` - Get form by ID
- `PUT /api/forms/{form_id}` - Update form
- `DELETE /api/forms/{form_id}` - Delete form
- `GET /api/forms/public/{slug}` - Get public form

#### AI Form Generation

- `POST /api/ai/form/init` - Initialize AI form creation
- `POST /api/ai/form/answer` - Submit answer to AI question

#### Submissions

- `POST /api/forms/{slug}/submit` - Submit form (public)
- `GET /api/forms/{form_id}/submissions` - Get form submissions

## 🎯 Usage

### Creating a Form with AI

1. Login/Register
2. Click "Create with AI"
3. Choose a form template or start blank
4. Answer AI questions
5. Review and customize generated form
6. Publish and share

### Manual Form Creation

1. Login/Register
2. Go to Dashboard
3. Click on any existing form to edit
4. Use drag-and-drop editor
5. Customize fields and styling
6. Save and publish

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Purvil**

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- FastAPI for the amazing Python framework
- React team for the frontend library
- MongoDB for the database solution
