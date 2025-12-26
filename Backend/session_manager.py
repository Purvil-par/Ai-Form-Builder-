"""
Session Manager Module
Manages session state and conversation history for form builder
"""

import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field, asdict
from enum import Enum


class SessionStage(str, Enum):
    """Session stages"""
    INITIALIZED = "initialized"
    QUESTION = "question"  # Changed from QUESTIONS to QUESTION (singular)
    FORM_SCHEMA = "form_schema"  # Changed from FINAL_FORM
    COMPLETED = "completed"


@dataclass
class AnswerRound:
    """Represents one round of Q&A"""
    round_number: int
    question_ids: List[str]
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class FormSession:
    """Session data structure for single-question mode"""
    session_id: str
    form_type: str
    initial_prompt: str
    conversation_history: List[Dict[str, str]] = field(default_factory=list)
    current_stage: SessionStage = SessionStage.INITIALIZED
    
    # Single-question mode fields
    current_question: Optional[Dict[str, Any]] = None
    question_count: int = 0
    answers: Dict[str, Any] = field(default_factory=dict)  # question_id -> answer
    
    # Form tracking
    form_id: Optional[str] = None  # Track if form already saved for this session
    
    # Legacy fields (kept for backward compatibility)
    selected_answers: List[AnswerRound] = field(default_factory=list)
    current_questions: List[Dict[str, Any]] = field(default_factory=list)
    final_form: Optional[Dict[str, Any]] = None
    
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    expires_at: str = field(default_factory=lambda: (datetime.utcnow() + timedelta(hours=24)).isoformat())
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        data = asdict(self)
        # Convert enums to strings
        data['current_stage'] = self.current_stage.value
        return data 
    
    def update_timestamp(self):
        """Update the updated_at timestamp"""
        self.updated_at = datetime.utcnow().isoformat()
    
    def is_expired(self) -> bool:
        """Check if session has expired"""
        expires = datetime.fromisoformat(self.expires_at)
        return datetime.utcnow() > expires
    
    def add_message(self, role: str, content: str):
        """Add message to conversation history"""
        self.conversation_history.append({
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat()
        })
        self.update_timestamp()
    
    def add_answer_round(self, question_ids: List[str]):
        """Add a round of answers"""
        round_number = len(self.selected_answers) + 1
        self.selected_answers.append(AnswerRound(
            round_number=round_number,
            question_ids=question_ids
        ))
        self.update_timestamp()
    
    def set_questions(self, questions: List[Dict[str, Any]]):
        """Set current questions"""
        self.current_questions = questions
        self.current_stage = SessionStage.QUESTIONS
        self.update_timestamp()
    
    def set_final_form(self, form_schema: Dict[str, Any]):
        """Set final form and mark as completed"""
        self.final_form = form_schema
        self.current_stage = SessionStage.FINAL_FORM
        self.update_timestamp()


class SessionManager:
    """Manages all form builder sessions"""
    
    def __init__(self):
        self.sessions: Dict[str, FormSession] = {}
    
    def create_session(
        self, 
        form_type: str, 
        initial_prompt: str,
        session_id: Optional[str] = None
    ) -> FormSession:
        """
        Create a new session
        
        Args:   
            form_type: Type of form being created
            initial_prompt: Initial prompt for the form type
            session_id: Optional custom session ID
            
        Returns:
            Created FormSession
        """
        if session_id is None:
            session_id = str(uuid.uuid4())
        
        session = FormSession(
            session_id=session_id,
            form_type=form_type,
            initial_prompt=initial_prompt
        )
        
        self.sessions[session_id] = session
        return session
    
    def get_session(self, session_id: str) -> Optional[FormSession]:
        """
        Get session by ID
        
        Args:
            session_id: Session identifier
            
        Returns:
            FormSession if found, None otherwise
        """
        session = self.sessions.get(session_id)
        
        # Check if expired
        if session and session.is_expired():
            del self.sessions[session_id]
            return None
        
        return session
    
    def update_session(self, session: FormSession):
        """
        Update existing session
        
        Args:
            session: FormSession to update
        """
        session.update_timestamp()
        self.sessions[session.session_id] = session
    
    def delete_session(self, session_id: str) -> bool:
        """
        Delete a session
        
        Args:
            session_id: Session identifier
            
        Returns:
            True if deleted, False if not found
        """
        if session_id in self.sessions:
            del self.sessions[session_id]
            return True
        return False
    
    def cleanup_expired_sessions(self):
        """Remove all expired sessions"""
        expired_ids = [
            sid for sid, session in self.sessions.items()
            if session.is_expired()
        ]
        for sid in expired_ids:
            del self.sessions[sid]
    
    def get_session_count(self) -> int:
        """Get total number of active sessions"""
        return len(self.sessions)
    
    def get_all_sessions(self) -> List[FormSession]:
        """Get all active sessions"""
        return list(self.sessions.values())


# Global session manager instance
session_manager = SessionManager()


def get_session_manager() -> SessionManager:
    """Get the global session manager instance"""
    return session_manager
