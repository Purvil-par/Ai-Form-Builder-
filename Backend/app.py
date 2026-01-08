# app.py - AI Form Builder API with Authentication and MongoDB Integration

import os
import asyncio
from typing import Optional, List, Union
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.responses import HTMLResponse, PlainTextResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import logging
import traceback

# LangChain imports
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.memory import ConversationBufferMemory


# Local imports
from form_prompts import (
    get_form_prompt, 
    get_available_form_types,
    is_blank_form,
    wrap_user_prompt
)
from llm_parser import (
    parse_llm_response,
    normalize_checkbox_answers,
    validate_form_schema
)
from session_manager import (
    get_session_manager,
    SessionStage
)

# New imports for authentication and database
from config import settings
from database import init_database, close_database, get_database
from database.repositories import FormRepository
from routes import auth_router, form_router, submission_router
from auth.middleware import get_current_user
from models.user import UserResponse
from models.form_models import FormCreate, FormStatus
from file_parser import detect_and_parse_file_content, analyze_image_for_form_generation, format_image_analysis_for_llm

load_dotenv()


# Initialize LLM with high max_tokens for large form generation
# GPT-4o supports up to 16384 output tokens - we use 16000 to be safe
model = ChatOpenAI(
    model="gpt-4o",
    temperature=0,
    api_key=settings.OPENAI_API_KEY,
    max_tokens=16000  # Increased for large forms (50+ MCQ questions)
)

# model = ChatGoogleGenerativeAI(
#     model="gemini-2.5-flash",
#     temperature=0,
#     api_key=settings.GOOGLE_API_KEY,
#     max_tokens=16000  # Increased for large forms (50+ MCQ questions)
# )

# OpenAI client for DALL-E image generation
from openai import OpenAI
openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)


async def generate_background_image(theme: str) -> str:
    """
    Generate a background image using DALL-E based on user's theme selection.
    
    Args:
        theme: Theme description from user's selection
        
    Returns:
        Base64 data URL of generated image, or None if failed
    """
    import base64
    import httpx
    
    # Skip if user chose no background
    if not theme or "no background" in theme.lower() or "clean" in theme.lower() or "white" in theme.lower():
        logger.info("User chose no background - skipping image generation")
        return None
    
    # Create DALL-E prompt based on theme
    prompt = f"A beautiful, professional background image for a form with theme: {theme}. Soft colors, subtle gradients, minimal design, suitable as form background, light and clean aesthetic, no text."
    
    try:
        logger.info(f"🎨 Generating background with DALL-E for theme: {theme}")
        
        # Generate image using DALL-E
        response = await asyncio.to_thread(
            lambda: openai_client.images.generate(
                model="dall-e-3",   
                prompt=prompt,
                size="1792x1024",
                quality="standard",
                n=1,
            )
        )
            
        image_url = response.data[0].url
        logger.info(f"✅ DALL-E generated image URL received")
        
        # Download and convert to Base64
        async with httpx.AsyncClient() as client:
            img_response = await client.get(image_url)
            if img_response.status_code == 200:
                image_bytes = img_response.content
                base64_image = base64.b64encode(image_bytes).decode('utf-8')
                data_url = f"data:image/png;base64,{base64_image}"
                logger.info(f"✅ Background image converted to Base64 ({len(data_url)} chars)")
                return data_url
        
        logger.warning("⚠️ Failed to download generated image")
        return None
        
    except Exception as e:
        logger.error(f"❌ DALL-E background generation error: {e}")
        return None

# Enhanced system prompt with single-question JSON format
# Optimized for both small and large form generation (supports 50+ MCQ forms)
SYSTEM_PROMPT = """You are an expert form designer AI. Your job is to help users create professional, user-friendly forms by asking ONE clarifying question at a time and then generating a complete form specification.

RESPONSE FORMAT RULES (CRITICAL):

1. When asking a clarifying question, respond with JSON in this EXACT format:
{"mode":"question","question":{"id":"unique_id","label":"Question text?","type":"radio","options":["Option 1","Option 2"]}}

    QUESTION TYPES:
    - "radio": Single-choice question (user selects ONE option)
    - "checkbox": Multi-choice question (user can select MULTIPLE options)
    - "text": Open-ended text input

2. When generating the final form, respond with COMPACT JSON (no extra whitespace):
{"mode":"form_schema","form":{"title":"Form Title","description":"Optional description","fields":[{"id":"field_id","type":"radio","label":"Question Label","required":true,"options":["opt1","opt2"]}]}}

CRITICAL JSON RULES:
- Output MUST be valid, complete JSON - never truncate or cut off
- Use compact format (minimize whitespace) for large forms
- ALWAYS close all brackets and braces properly
- If the form is very large (50+ fields), use abbreviated field IDs like "q1", "q2" etc.
- For MCQ/quiz forms: each question should be a "radio" type field with "options" array

FIELD TYPES: text, email, tel, number, select, checkbox, radio, textarea, file, date, time, url

EXIT CONDITION RULES:
- Ask maximum 3-5 questions ONE AT A TIME
- Stop asking questions once you have enough information to create a complete, usable form
- Do not over-ask or request unnecessary details
- Be efficient and focused

QUESTION GUIDELINES: 
- Ask ONE specific, targeted question at a time
- Use clear, simple language
- Provide 3-5 sensible options for radio/checkbox questions
- Focus on essential information only
- Progress logically from general to specific

FORM GENERATION GUIDELINES:
- Use short snake_case for field IDs (keep IDs brief for large forms)
- Include helpful placeholders and hints
- Ensure proper validation (required fields, email format, file types, etc.)
- Keep forms concise and user-friendly
- Add min/max constraints for number fields when appropriate
- For file uploads, specify accepted file types in the accept array
- For MCQ/Quiz forms with many questions: generate ALL questions requested by the user

STRICT CONTENT EXTRACTION RULES (FOR UPLOADED FILES/IMAGES):
⚠️ CRITICAL: When user uploads a file, image, or provides specific content:
- Generate form fields ONLY from information EXPLICITLY present in the provided content
- Do NOT add inferred, guessed, or assumed questions beyond what is in the source
- Do NOT create duplicate questions that ask the same thing in different words
- Do NOT expand or elaborate beyond the source material
- Each question/field MUST map directly to specific content in the uploaded file
- If the file contains 10 MCQs, generate EXACTLY 10 MCQ fields - no more, no less
- Preserve the EXACT wording of questions and options when extracting from source
- NEVER add "bonus", "additional", or "extra" questions not in the source
- If source has 5 questions, output EXACTLY 5 fields. If source has 20 questions, output EXACTLY 20 fields.

DEDUPLICATION RULES:
- Before adding any field, mentally check if a semantically equivalent field already exists
- Questions like "What is X?" and "Describe X" are duplicates - keep only one
- Combine related information into single comprehensive fields when appropriate
- Never repeat the same concept in multiple fields

BACKGROUND IMAGE QUESTION (MANDATORY - ALWAYS ASK AS FINAL QUESTION):
⚠️ IMPORTANT: Before generating the final form, you MUST ask the user about background preference.
- This is the LAST question you ask before generating the form
- Always ask this question - never skip it
- Generate 4-5 contextual background options based on the form type being created
- First option should always be "No background (clean white)"
- Other options should match the form's purpose (e.g., for school form: "School campus", "Books/education", etc.)

Use this format:
{"mode":"question","question":{"id":"bg_preference","label":"Would you like a background image for your form?","type":"radio","options":["No background (clean white)", "Option based on form type", "Another relevant option", "Third relevant option", "Fourth relevant option"]}}

Be professional, helpful, and efficient."""

# FastAPI app
app = FastAPI(
    title="AI Form Builder API",
    description="AI-powered form builder with authentication and MongoDB storage",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get session manager (for AI conversation flow)
session_mgr = get_session_manager()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("ai-form-builder")


# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize database and services on startup"""
    try:
        await init_database()
        logger.info("✅ AI Form Builder API started successfully")
        logger.info(f"📊 MongoDB connected: {settings.MONGODB_DB_NAME}")
        logger.info(f"🔗 Frontend URL: {settings.FRONTEND_URL}")
        logger.info(f"🤖 Available form types: {get_available_form_types()}")
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on shutdown"""
    await close_database()
    logger.info("👋 AI Form Builder API shutdown complete")


# Register routers
app.include_router(auth_router)
app.include_router(form_router)
app.include_router(submission_router)


# Pydantic models for AI form generation
class QuestionData(BaseModel):
    """Single question from LLM"""
    id: str
    label: str
    type: str  # "radio", "checkbox", "text"
    options: Optional[List[str]] = None
    allow_multiple: bool = False


class InitFormRequest(BaseModel):
    form_type: str
    custom_prompt: Optional[str] = None  # For blank forms with user-defined prompts
    file_content: Optional[str] = None  # Content from uploaded file (MCQs, data, etc.)
    image_data: Optional[str] = None  # Base64 image data for Vision API analysis
    session_id: Optional[str] = None


class AnswerRequest(BaseModel):
    """User's answer to a single question"""
    session_id: str
    question_id: str
    answer: Union[str, List[str]]  # Single value or list for checkboxes


class SessionResponse(BaseModel):
    """Response from form initialization or answer submission"""
    session_id: str
    mode: str  # "question", "form_schema", "error"
    question: Optional[QuestionData] = None  # Single question
    form: Optional[dict] = None
    error: Optional[str] = None
    question_number: Optional[int] = None  # Track progress
    form_id: Optional[str] = None  # Added: Form ID after saving to DB


# Helper function to call LLM
async def call_llm(messages: List) -> str:
    """Call LLM with messages and return response"""
    import json
    from datetime import datetime
    
    try:
        response = await asyncio.to_thread(
            lambda: model.invoke(messages)
        )
        
        # Save LLM output to JSON file (only response content)
        output_data = {
            "timestamp": datetime.now().isoformat(),
            "llm_output": response.content
        }
        
        # Save to JSON file (append mode)
        json_file_path = "llm_outputs.json"
        try:
            existing_data = []
            if os.path.exists(json_file_path):
                with open(json_file_path, 'r', encoding='utf-8') as f:
                    existing_data = json.load(f)
            existing_data.append(output_data)
            with open(json_file_path, 'w', encoding='utf-8') as f:
                json.dump(existing_data, f, indent=2, ensure_ascii=False)
            logger.info(f"📁 LLM output saved to {json_file_path}")
        except Exception as file_error:
            logger.warning(f"⚠️ Could not save LLM output to file: {file_error}")
        
        return response.content
    except Exception as e:
        logger.error(f"LLM call failed: {e}")
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")




# Root endpoint
@app.get("/", response_class=HTMLResponse)
async def root():
    return """
    <h1>🤖 AI Form Builder API v2.0</h1>
    <p>Intelligent form creation with authentication and MongoDB storage</p>
    <p>Use <a href='/docs'>/docs</a> to explore the API</p>
    <h3>🔐 Authentication Endpoints:</h3>
    <ul>
        <li>POST /api/auth/register - Register with email/password</li>
        <li>POST /api/auth/login - Login with credentials</li>
        <li>POST /api/auth/google - Google OAuth login</li>
        <li>POST /api/auth/refresh - Refresh access token</li>
        <li>GET /api/auth/me - Get current user</li>
    </ul>
    <h3>📝 Form Management:</h3>
    <ul>
        <li>POST /api/forms - Create new form</li>
        <li>GET /api/forms - Get user's forms</li>
        <li>GET /api/forms/{form_id} - Get form details</li>
        <li>PUT /api/forms/{form_id} - Update form</li>
        <li>DELETE /api/forms/{form_id} - Delete/archive form</li>
        <li>GET /api/forms/public/{slug} - Public form view</li>
    </ul>
    <h3>🤖 AI Form Generation:</h3>
    <ul>
        <li>POST /api/ai/form/init - Initialize AI form creation (requires auth)</li>
        <li>POST /api/ai/form/answer - Submit answer to AI question (requires auth)</li>
    </ul>
    <h3>📊 Submissions:</h3>
    <ul>
        <li>POST /api/forms/{slug}/submit - Submit form (public)</li>
        <li>GET /api/forms/{form_id}/submissions - Get submissions (owner only)</li>
    </ul>
    """


@app.get("/favicon.ico", response_class=PlainTextResponse)
async def favicon():
    return ""


@app.get("/health")
async def health():
    """Health check endpoint"""
    from database.connection import check_database_health
    
    db_healthy = await check_database_health()
    
    return {
        "status": "ok" if db_healthy else "degraded",
        "database": "connected" if db_healthy else "disconnected",
        "active_ai_sessions": session_mgr.get_session_count(),
        "available_form_types": get_available_form_types()
    }


# AI Form Generation Endpoints (Protected with Authentication)
@app.post("/api/ai/form/init", response_model=SessionResponse)
async def init_form_creation(
    req: InitFormRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Initialize AI-driven form creation (requires authentication)
    
    This endpoint starts the AI conversation flow to generate a form.
    The generated form will be automatically saved to the database and owned by the current user.
    """
    try:
        # Validate form type
        if req.form_type not in get_available_form_types():
            raise HTTPException(
                status_code=400,
                detail=f"Invalid form type. Available: {get_available_form_types()}"
            )
        
        # Handle blank form vs predefined form types
        if is_blank_form(req.form_type):
            if not req.custom_prompt or len(req.custom_prompt.strip()) < 10:
                raise HTTPException(
                    status_code=400,
                    detail="custom_prompt is required for blank forms (minimum 10 characters)"
                )
            
            # Combine user prompt with file content if provided
            user_prompt = req.custom_prompt.strip()
            
            # Track if we have image data for Vision API
            has_image = req.image_data and len(req.image_data.strip()) > 100
            image_analysis = None
            
            if has_image:
                # Process image for Vision API
                logger.info("📷 Image data received - analyzing for form generation...")
                image_analysis = analyze_image_for_form_generation(req.image_data.strip())
                
                if image_analysis.get("success"):
                    # Format image analysis for LLM
                    image_prompt = format_image_analysis_for_llm(image_analysis, user_prompt)
                    logger.info(f"✅ Image analyzed: type={image_analysis['content_type']}, OCR={image_analysis['ocr_char_count']} chars")
                    
                    # If we also have file content, combine both
                    if req.file_content and len(req.file_content.strip()) > 0:
                        parsed_content = detect_and_parse_file_content(req.file_content.strip())
                        if parsed_content:
                            image_prompt += f"\n\nADDITIONAL FILE CONTENT:\n---\n{parsed_content[:10000]}\n---"
                    
                    initial_prompt = wrap_user_prompt(image_prompt)
                else:
                    logger.warning("⚠️ Image analysis failed, falling back to text prompt")
                    initial_prompt = wrap_user_prompt(user_prompt)
                    has_image = False  # Reset flag
            elif req.file_content and len(req.file_content.strip()) > 0:
                # Parse file content (handles PDF, DOCX, XLSX extraction)
                parsed_content = detect_and_parse_file_content(req.file_content.strip())
                
                if parsed_content:
                    # Log the parsed content for debugging
                    logger.info(f"📄 PARSED FILE CONTENT ({len(parsed_content)} chars):")
                    logger.info(f"--- START PARSED CONTENT ---")
                    # Log first 1000 chars to avoid flooding logs
                    logger.info(parsed_content[:1000] + ("..." if len(parsed_content) > 1000 else ""))
                    logger.info(f"--- END PARSED CONTENT PREVIEW ---")
                    
                    # Format: User instructions + Parsed file content
                    combined_prompt = f"""USER INSTRUCTIONS:
{user_prompt}

UPLOADED FILE CONTENT (PARSED):
---
{parsed_content}
---

Please analyze the file content above and follow the user's instructions to generate the form.
If the file contains MCQs/questions, extract them and create form fields accordingly.
If the file contains data, generate relevant questions/fields based on that data."""
                    logger.info(f"✅ File parsed and combined with prompt ({len(parsed_content)} chars)")
                    initial_prompt = wrap_user_prompt(combined_prompt)
                else:
                    initial_prompt = wrap_user_prompt(user_prompt)
            else:
                initial_prompt = wrap_user_prompt(user_prompt)
            
            logger.info(f"Blank form with custom prompt: {req.custom_prompt[:100]}...")
        else:
            initial_prompt = get_form_prompt(req.form_type)
            has_image = False
            image_analysis = None
        
        # Create session
        session = session_mgr.create_session(
            form_type=req.form_type,
            initial_prompt=initial_prompt,
            session_id=req.session_id
        )
        
        # Store user ID in session for later form saving
        session.user_id = current_user.id
        
        logger.info(f"Created AI session {session.session_id} for user {current_user.email}")
        
        # Prepare messages for LLM (with or without image)
        if has_image and image_analysis and image_analysis.get("success"):
            # Use multimodal message with image for Vision API
            logger.info("🖼️ Sending image to Vision LLM for analysis...")
            
            # Create multimodal content for Gemini Vision
            image_content = {
                "type": "image_url",
                "image_url": {
                    "url": f"data:{image_analysis['mime_type']};base64,{image_analysis['base64_data']}"
                } 
            }
            
            messages = [
                SystemMessage(content=SYSTEM_PROMPT),
                HumanMessage(content=[
                    {"type": "text", "text": initial_prompt},
                    image_content
                ])
            ]
        else:
            # Standard text-only message
            messages = [
                SystemMessage(content=SYSTEM_PROMPT),
                HumanMessage(content=initial_prompt)
            ]
        
        # Call LLM
        llm_response = await call_llm(messages)
        
        # Add to conversation history
        session.add_message("system", SYSTEM_PROMPT)
        session.add_message("user", initial_prompt)
        session.add_message("assistant", llm_response)
        
        # Parse LLM response
        parsed = parse_llm_response(llm_response)
        
        logger.info(f"Parsed LLM response mode: {parsed.get('mode')}")
        
        if parsed["mode"] == "question":
            session.current_question = parsed["question"]
            session.question_count = 1
            session.current_stage = SessionStage.QUESTION
            session_mgr.update_session(session)
            
            return SessionResponse(
                session_id=session.session_id,
                mode="question",
                question=QuestionData(**parsed["question"]),
                question_number=1
            )
            
        elif parsed["mode"] == "form_schema":
            # Validate and save form to database
            is_valid, error = validate_form_schema(parsed["form"])
            if not is_valid:
                logger.error(f"Invalid form schema: {error}")
                return SessionResponse(
                    session_id=session.session_id,
                    mode="error",
                    error=f"Form validation failed: {error}"
                )
            
            # Save form to database (only if not already saved)
            if not session.form_id:
                logger.info(f"💾 Saving new form for session {session.session_id}")
                
                # Extract bg_preference from session answers (user's background selection)
                form_data_with_bg = parsed["form"].copy() if isinstance(parsed["form"], dict) else parsed["form"]
                
                # session.answers is a Dict[str, Any] where key is question_id and value is the answer
                if hasattr(session, 'answers') and isinstance(session.answers, dict):
                    bg_value = session.answers.get('bg_preference')
                    if bg_value:
                        form_data_with_bg['bg_preference'] = bg_value
                        logger.info(f"🎨 Found bg_preference in session answers: {bg_value}")
                
                form_id, generated_bg = await save_ai_generated_form(
                    form_data_with_bg,
                    current_user.id,
                    req.form_type,
                    session.session_id
                )
                session.form_id = form_id  # Track that we saved this form
                session.generated_bg = generated_bg  # Store for response
            else:
                logger.info(f"✅ Form already saved for session {session.session_id}, using existing form_id: {session.form_id}")
                form_id = session.form_id
                generated_bg = getattr(session, 'generated_bg', None)
            
            session.final_form = parsed["form"]
            session.current_stage = SessionStage.FORM_SCHEMA
            session_mgr.update_session(session)
            
            # Include generated background image in response for immediate display
            response_form = parsed["form"].copy() if isinstance(parsed["form"], dict) else parsed["form"]
            if generated_bg:
                response_form["backgroundImage"] = generated_bg
                logger.info("✅ Including generated backgroundImage in response")
            
            return SessionResponse(
                session_id=session.session_id,
                mode="form_schema",
                form=response_form,
                form_id=form_id
            )
            
        else:
            logger.error(f"Unexpected LLM response mode: {parsed.get('mode')}")
            raise HTTPException(
                status_code=500,
                detail=f"Unexpected LLM response mode: {parsed.get('mode')}"
            )
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in init_form_creation: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/form/answer", response_model=SessionResponse)
async def submit_answer(
    req: AnswerRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Submit answer to AI question (requires authentication)
    
    Continues the AI conversation flow. When complete, saves the generated form to database.
    """
    try:
        # Get session
        session = session_mgr.get_session(req.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found or expired")
        
        # Verify session belongs to current user
        if not hasattr(session, 'user_id') or session.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized access to session")
        
        if session.current_stage != SessionStage.QUESTION:
            raise HTTPException(status_code=400, detail="Session not in question stage")
        
        # Store answer
        session.answers[req.question_id] = req.answer
        
        # Convert answer to text for conversation
        if isinstance(req.answer, list):
            answer_text = f"Answer to {req.question_id}: {', '.join(req.answer)}"
        else:
            answer_text = f"Answer to {req.question_id}: {req.answer}"
        
        logger.info(f"Session {session.session_id} - User answers: {answer_text}")
        
        # Prepare messages with conversation history
        messages = [SystemMessage(content=SYSTEM_PROMPT)]
        
        for msg in session.conversation_history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))
        
        messages.append(HumanMessage(content=answer_text))
        
        # Call LLM
        llm_response = await call_llm(messages)
        
        # Add to history
        session.add_message("user", answer_text)
        session.add_message("assistant", llm_response)
        
        # Parse response
        parsed = parse_llm_response(llm_response)
        
        if parsed["mode"] == "question":
            session.current_question = parsed["question"]
            session.question_count += 1
            session.current_stage = SessionStage.QUESTION
            session_mgr.update_session(session)
            
            return SessionResponse(
                session_id=session.session_id,
                mode="question",
                question=QuestionData(**parsed["question"]),
                question_number=session.question_count
            )
            
        elif parsed["mode"] == "form_schema":
            # Validate and save form
            is_valid, error = validate_form_schema(parsed["form"])
            if not is_valid:
                logger.error(f"Invalid form schema: {error}")
                return SessionResponse(
                    session_id=session.session_id,
                    mode="error",
                    error=f"Form validation failed: {error}"
                )
            
            # Save form to database (only if not already saved)
            if not session.form_id:
                logger.info(f"💾 Saving new form for session {session.session_id}")
                
                # Extract bg_preference from session answers (user's background selection)
                form_data_with_bg = parsed["form"].copy() if isinstance(parsed["form"], dict) else parsed["form"]
                
                # session.answers is a Dict[str, Any] where key is question_id and value is the answer
                if hasattr(session, 'answers') and isinstance(session.answers, dict):
                    # Debug: log all answer keys
                    logger.info(f"📋 Session answers keys: {list(session.answers.keys())}")
                    logger.info(f"📋 Session answers: {session.answers}")
                    
                    bg_value = session.answers.get('bg_preference')
                    if bg_value:
                        form_data_with_bg['bg_preference'] = bg_value
                        logger.info(f"🎨 Found bg_preference in session answers: {bg_value}")
                    else:
                        logger.warning("⚠️ bg_preference not found in session.answers")
                
                form_id, generated_bg = await save_ai_generated_form(
                    form_data_with_bg,
                    current_user.id,
                    session.form_type,
                    session.session_id
                )
                session.form_id = form_id  # Track that we saved this form
                session.generated_bg = generated_bg  # Store for response
            else:
                logger.info(f"✅ Form already saved for session {session.session_id}, using existing form_id: {session.form_id}")
                form_id = session.form_id
                generated_bg = getattr(session, 'generated_bg', None)
            
            session.final_form = parsed["form"]
            session.current_stage = SessionStage.FORM_SCHEMA
            session_mgr.update_session(session)
            
            # Include generated background image in response for immediate display
            response_form = parsed["form"].copy() if isinstance(parsed["form"], dict) else parsed["form"]
            if generated_bg:
                response_form["backgroundImage"] = generated_bg
                logger.info("✅ Including generated backgroundImage in response")
            
            return SessionResponse(
                session_id=session.session_id,
                mode="form_schema",
                form=response_form,
                form_id=form_id
            )
        else:
            raise HTTPException(status_code=500, detail="Unexpected LLM response mode")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in submit_answer: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


async def save_ai_generated_form(form_data: dict, owner_id: str, form_type: str, ai_session_id: str) -> str:
    """
    Save AI-generated form to database
    
    Args:
        form_data: Form schema from AI
        owner_id: User ID who owns the form
        form_type: Original form type used for generation
        ai_session_id: AI conversation session ID
    
    Returns:
        tuple: (form_id, background_image) - Created form ID and generated background image
    """
    from routes.form_routes import generate_slug
    
    form_repo = FormRepository()
    
    # Check if user selected a background theme and generate image
    background_image = None
    bg_preference = form_data.get("bg_preference") or form_data.get("backgroundTheme")
    if bg_preference:
        logger.info(f"🎨 User selected background: {bg_preference}")
        background_image = await generate_background_image(bg_preference)
    
    # Create FormCreate object
    form_create = FormCreate(
        title=form_data.get("title", "Untitled Form"),
        description=form_data.get("description"),
        fields=form_data.get("fields", []),
        globalStyles=form_data.get("globalStyles"),
        backgroundImage=background_image,  # Include generated background
        status=FormStatus.DRAFT  # AI-generated forms start as drafts
    )
    
    # Generate unique slug
    slug = generate_slug(form_create.title)
    attempts = 0
    while await form_repo.slug_exists(slug) and attempts < 10:
        slug = generate_slug(form_create.title)
        attempts += 1
    
    # Create form
    form = await form_repo.create(form_create, owner_id, slug)
    
    # Update with AI metadata
    await form_repo.collection.update_one(
        {"_id": form["_id"]},
        {"$set": {
            "form_type": form_type,
            "ai_session_id": ai_session_id
        }}
    )
    
    logger.info(f"✅ AI-generated form saved to database: {form['_id']}")
    
    # Return both form_id and generated background image
    return str(form["_id"]), background_image


# Legacy endpoints (kept for backward compatibility)
@app.get("/api/form/types")
async def get_form_types():
    """Get list of available form types"""
    return {
        "form_types": get_available_form_types()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

class AnswerRequest(BaseModel):
    """User's answer to a single question"""
    session_id: str
    question_id: str
    answer: Union[str, List[str]]  # Single value or list for checkboxes






# API Endpoints
@app.get("/", response_class=HTMLResponse)
async def root():
    return """
    <h1>AI Form Builder API</h1>
    <p>Intelligent prompt-driven form creation system</p>
    <p>Use <a href='/docs'>/docs</a> to explore the API</p>
    <h3>Available Endpoints:</h3>
    <ul>
        <li>POST /api/form/init - Initialize form creation</li>
        <li>POST /api/form/answer - Submit checkbox answers</li>
        <li>GET /api/form/session/{session_id} - Get session state</li>
        <li>DELETE /api/form/session/{session_id} - Reset session</li>
    </ul>
    """


@app.get("/favicon.ico", response_class=PlainTextResponse)
async def favicon():
    return ""


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "active_sessions": session_mgr.get_session_count(),
        "available_form_types": get_available_form_types()
    }


@app.post("/api/form/init", response_model=SessionResponse)
async def init_form_creation(req: InitFormRequest):
    """
    Initialize form creation with a form type card OR blank form with custom prompt
    
    This endpoint handles two scenarios:
    1. Predefined form types: Uses pre-written system prompts
    2. Blank form: Uses user-provided custom prompt
    
    Both follow the same AI-driven Q&A flow after initialization.
    """
    try:
        # Validate form type
        if req.form_type not in get_available_form_types():
            raise HTTPException(
                status_code=400,
                detail=f"Invalid form type. Available: {get_available_form_types()}"
            )
        
        # Handle blank form vs predefined form types
        if is_blank_form(req.form_type):
            # Blank form requires custom prompt
            if not req.custom_prompt or len(req.custom_prompt.strip()) < 10:
                raise HTTPException(
                    status_code=400,
                    detail="custom_prompt is required for blank forms (minimum 10 characters)"
                )
            # Wrap user prompt with guardrails and instructions
            initial_prompt = wrap_user_prompt(req.custom_prompt.strip())
            logger.info(f"Blank form with custom prompt: {req.custom_prompt[:100]}...")
        else:
            # Get pre-written prompt for predefined form type
            initial_prompt = get_form_prompt(req.form_type)
        
        # Create session
        session = session_mgr.create_session(
            form_type=req.form_type,
            initial_prompt=initial_prompt,
            session_id=req.session_id
        )
        
        logger.info(f"Created session {session.session_id} for form type: {req.form_type}")
        
        # Prepare messages for LLM
        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=initial_prompt)
        ]
        
        
        # Call LLM
        llm_response = await call_llm(messages)
        
        # Log raw LLM response for debugging
        logger.info(f"Raw LLM response (first 500 chars): {llm_response[:500]}")
        
        # Add to conversation history
        session.add_message("system", SYSTEM_PROMPT)
        session.add_message("user", initial_prompt)
        session.add_message("assistant", llm_response)
        
        # Parse LLM response
        parsed = parse_llm_response(llm_response)
        
        # Log the parsed response for debugging
        logger.info(f"Parsed LLM response mode: {parsed.get('mode')}")
        logger.debug(f"Full parsed response: {parsed}")
        
        if parsed["mode"] == "question":
            # Single question mode
            session.current_question = parsed["question"]
            session.question_count = 1
            session.current_stage = SessionStage.QUESTION
            session_mgr.update_session(session)
            
            return SessionResponse(
                session_id=session.session_id,
                mode="question",
                question=QuestionData(**parsed["question"]),
                question_number=1
            )
        elif parsed["mode"] == "form_schema":
            # Validate form schema
            is_valid, error = validate_form_schema(parsed["form"])
            if not is_valid:
                logger.error(f"Invalid form schema: {error}")
                return SessionResponse(
                    session_id=session.session_id,
                    mode="error",
                    error=f"Form validation failed: {error}"
                )
            
            # Store final form
            session.final_form = parsed["form"]
            session.current_stage = SessionStage.FORM_SCHEMA
            session_mgr.update_session(session)
            
            return SessionResponse(
                session_id=session.session_id,
                mode="form_schema",
                form=parsed["form"]
            )
        elif parsed["mode"] == "error":
            # LLM returned error mode
            logger.error(f"LLM returned error: {parsed.get('error')}")
            return SessionResponse(
                session_id=session.session_id,
                mode="error",
                error=parsed.get("error", "Unknown error from LLM")
            )
        else:
            # Unexpected mode - log full response for debugging
            logger.error(f"Unexpected LLM response mode: {parsed.get('mode')}")
            logger.error(f"Full LLM response: {llm_response[:500]}")
            logger.error(f"Parsed response: {parsed}")
            raise HTTPException(
                status_code=500, 
                detail=f"Unexpected LLM response mode: {parsed.get('mode')}. Check server logs for details."
            )
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in init_form_creation: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/form/answer", response_model=SessionResponse)
async def submit_answer(req: AnswerRequest):
    """
    Submit answer to a single question
    
    Stores the answer and asks LLM for next question or generates final form.
    """
    try:
        # Get session
        session = session_mgr.get_session(req.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found or expired")
        
        if session.current_stage != SessionStage.QUESTION:
            raise HTTPException(status_code=400, detail="Session not in question stage")
        
        # Store answer
        session.answers[req.question_id] = req.answer
        
        # Convert answer to text for conversation
        if isinstance(req.answer, list):
            answer_text = f"Answer to {req.question_id}: {', '.join(req.answer)}"
        else:
            answer_text = f"Answer to {req.question_id}: {req.answer}"
        
        logger.info(f"Session {session.session_id} - User answers: {answer_text}")
        
        # Prepare messages with conversation history
        messages = [SystemMessage(content=SYSTEM_PROMPT)]
        
        # Add conversation history
        for msg in session.conversation_history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))
        
        # Add current answer
        messages.append(HumanMessage(content=answer_text))
        
        # Call LLM
        llm_response = await call_llm(messages)
        
        # Add to history
        session.add_message("user", answer_text)
        session.add_message("assistant", llm_response)
        
        # Parse response
        parsed = parse_llm_response(llm_response)
        
        if parsed["mode"] == "question":
            # Next question
            session.current_question = parsed["question"]
            session.question_count += 1
            session.current_stage = SessionStage.QUESTION
            session_mgr.update_session(session)
            
            return SessionResponse(
                session_id=session.session_id,
                mode="question",
                question=QuestionData(**parsed["question"]),
                question_number=session.question_count
            )
        elif parsed["mode"] == "form_schema":
            # Final form generated
            is_valid, error = validate_form_schema(parsed["form"])
            if not is_valid:
                logger.error(f"Invalid form schema: {error}")
                return SessionResponse(
                    session_id=session.session_id,
                    mode="error",
                    error=f"Form validation failed: {error}"
                )
            
            session.final_form = parsed["form"]
            session.current_stage = SessionStage.FORM_SCHEMA
            session_mgr.update_session(session)
            
            return SessionResponse(
                session_id=session.session_id,
                mode="form_schema",
                form=parsed["form"]
            )
        else:
            raise HTTPException(status_code=500, detail="Unexpected LLM response mode")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in submit_answers: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/form/session/{session_id}")
async def get_session_state(session_id: str):
    """Get current session state"""
    session = session_mgr.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    
    return session.to_dict()


@app.delete("/api/form/session/{session_id}")
async def reset_session(session_id: str):
    """Reset/delete a session"""
    deleted = session_mgr.delete_session(session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"message": "Session deleted successfully"}


@app.get("/api/form/types")
async def get_form_types():
    """Get list of available form types"""
    return {
        "form_types": get_available_form_types()
    }


# Cleanup task (run periodically)
@app.on_event("startup")
async def startup_event():
    """Startup tasks"""
    logger.info("AI Form Builder API started")
    logger.info(f"Available form types: {get_available_form_types()}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)



    ""