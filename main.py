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
