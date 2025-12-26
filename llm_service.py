from openai import AsyncOpenAI
import json
import logging
from typing import Optional, Any


logger = logging.getLogger(__name__)

# Initialize OpenAI client



# System prompt for form generation
SYSTEM_PROMPT = """You are an expert form designer AI. Your job is to help users create professional, user-friendly forms by asking clarifying questions and then generating a complete form specification.

When a user describes what form they need, you should:
1. Ask follow-up questions to understand their requirements (field types, validation, options, etc.)
2. Once you have enough information, generate a complete form specification

Use the provided functions:
- ask_question: To ask the user for more information
- finish_form: To return the final form specification

Guidelines:
- Ask specific, targeted questions
- Suggest appropriate field types based on the data being collected
- Include helpful placeholders and hints
- Ensure proper validation (required fields, email format, file types, etc.)
- Keep forms concise and user-friendly
- Use snake_case for field IDs
- For file uploads, specify accepted file types in the accept array
- Add min/max constraints for number fields when appropriate

Be professional, helpful, and efficient."""


# Function schemas for OpenAI function calling
FUNCTION_SCHEMAS = [
    {
        "name": "ask_question",
        "description": "Ask the user a follow-up question to gather more information about the form",
        "parameters": {
            "type": "object",
            "properties": {
                "question_id": {"type": "string", "description": "Unique identifier for this question"},
                "title": {"type": "string", "description": "The question to ask the user"},
                "type": {
                    "type": "string",
                    "enum": ["text", "textarea", "number", "email", "url", "checkbox", "radio", "select", "file", "date"],
                    "description": "Type of input expected"
                },
                "options": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Available options for checkbox, radio, or select types"
                },
                "required": {"type": "boolean", "description": "Whether this question must be answered"},
                "placeholder": {"type": "string", "description": "Placeholder text"},
                "hint": {"type": "string", "description": "Helpful hint for the user"}
            },
            "required": ["question_id", "title", "type"]
        }
    },
    {
        "name": "finish_form",
        "description": "Return the final form specification when all information has been collected",
        "parameters": {
            "type": "object",
            "properties": {
                "form_spec": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "description": "Form title"},
                        "description": {"type": "string", "description": "Form description"},
                        "fields": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "id": {"type": "string", "description": "Field ID in snake_case"},
                                    "type": {"type": "string", "description": "Field type"},
                                    "label": {"type": "string", "description": "Field label"},
                                    "required": {"type": "boolean"},
                                    "options": {"type": "array", "items": {"type": "string"}},
                                    "placeholder": {"type": "string"},
                                    "accept": {"type": "array", "items": {"type": "string"}},
                                    "min": {"type": "number"},
                                    "max": {"type": "number"},
                                    "hint": {"type": "string"}
                                },
                                "required": ["id", "type", "label"]
                            }
                        },
                        "buttons": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "id": {"type": "string"},
                                    "label": {"type": "string"},
                                    "action": {"type": "string", "enum": ["submit", "save", "reset", "cancel"]}
                                },
                                "required": ["id", "label", "action"]
                            }
                        },
                        "submit_endpoint": {"type": "string"}
                    },
                    "required": ["title", "fields", "buttons", "submit_endpoint"]
                }
            },
            "required": ["form_spec"]
        }
    }
]


class LLMService:
    """Service for interacting with OpenAI LLM"""
    
    async def generate_form_question(
        self,
        user_prompt: str,
        conversation_history: list[dict[str, str]] = None
    ) -> dict[str, Any]:
        """Generate initial question or form based on user prompt"""
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        if conversation_history:
            messages.extend(conversation_history)
        
        messages.append({"role": "user", "content": user_prompt})
