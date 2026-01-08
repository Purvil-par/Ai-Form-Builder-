import os
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_core.runnables import RunnableWithMessageHistory
from langchain_core.chat_history import InMemoryChatMessageHistory

# Prompt template helpers
from langchain_core.prompts import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
    MessagesPlaceholder,
)

load_dotenv()

model = ChatOpenAI(model="gpt-4o", temperature=0)

# --- in-memory session store for history ---
store = {}
def get_history(session_id):
    if session_id not in store:
        store[session_id] = InMemoryChatMessageHistory()
    return store[session_id]

# System prompt as plain string (NOT SystemMessage object)
system_text = """
You are an expert form designer AI. Your job is to help users create professional, user-friendly forms by asking clarifying questions and then generating a complete form specification.

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

Be professional, helpful, and efficient
""".strip()

# Build a ChatPromptTemplate from message *templates*
messages = ChatPromptTemplate.from_messages([
    SystemMessagePromptTemplate.from_template(system_text),
    # human message template; `user_prompt` is an input variable we will provide
    HumanMessagePromptTemplate.from_template("User Intent: {user_prompt}"),
    # placeholder to include past chat history maintained by RunnableWithMessageHistory
    MessagesPlaceholder(variable_name="history"),
])

# Compose pipeline and wrap with memory runnable
pipeline_base = messages | model

pipeline = RunnableWithMessageHistory(
    runnable=pipeline_base,
    get_session_history=get_history,
    input_messages_key="input",    # how invoke() will pass inputs
    history_messages_key="history",
    return_messages=True
)

print("🤖 AI Form Builder Ready! (Type 'exit' to quit)")

session_id = "default_user"  # or dynamic per user

while True:
    user_input = input("You: ")
    if user_input.lower() in ["exit", "quit"]:
        print("👋 Goodbye!")
        break

    # IMPORTANT: we pass the prompt variable 'user_prompt' inside the "input" payload
    response = pipeline.invoke(
        {"user_prompt": user_input,"input": user_input},
        config={"configurable": {"session_id": session_id}}
    )

    print("Bot:", response.content)


# Initialize LLM with high max_tokens for large form generation
# GPT-4o supports up to 16384 output tokens - we use 16000 to be safe
# model = ChatOpenAI(
#     model="gpt-4o",
#     temperature=0,
#     api_key=settings.OPENAI_API_KEY,
#     max_tokens=16000  # Increased for large forms (50+ MCQ questions)
# )


'''

'''







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