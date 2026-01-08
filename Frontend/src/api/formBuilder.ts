/**
 * Form Builder API Client
 * Handles all API calls to the FastAPI backend for AI form generation
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://172.168.17.38:8000';
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Get authorization header
 */
function getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('access_token');
    if (!token) {
        throw new Error('No access token found. Please login.');
    }
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
}

export interface Question {
    id: string;
    label: string;
    default: boolean;
}

export interface QuestionData {
    id: string;
    label: string;
    type: 'radio' | 'checkbox' | 'text';
    options?: string[];
    allow_multiple?: boolean;
}

export interface FormField {
    id: string;
    type: string;
    label: string;
    placeholder?: string;
    required: boolean;
    validation?: string;
    options?: string[];
    accept?: string[];
    min?: number;
    max?: number;
}

export interface FormSchema {
    title: string;
    description?: string;
    fields: FormField[];
}

export interface InitFormResponse {
    session_id: string;
    mode: 'question' | 'form_schema' | 'error';
    question?: QuestionData;  // Single question
    form?: FormSchema;
    error?: string;
    question_number?: number;  // Track progress
    form_id?: string;  // Form ID when form is created
}

export interface AnswerResponse {
    session_id: string;
    mode: 'question' | 'form_schema' | 'error';
    question?: QuestionData;  // Next question
    form?: FormSchema;
    error?: string;
    question_number?: number;  // Track progress
    form_id?: string;  // Form ID when form is created
}

export interface SessionState {
    session_id: string;
    form_type: string;
    initial_prompt: string;
    conversation_history: any[];
    selected_answers: any[];
    current_stage: string;
    current_questions: Question[];
    final_form: FormSchema | null;
    created_at: string;
    updated_at: string;
}

/**
 * Initialize form creation with a form type
 * @param formType - Type of form (predefined or 'blank')
 * @param customPrompt - Optional custom prompt for blank forms
 * @param sessionId - Optional session ID to resume
 * @param fileContent - Optional file content to include with prompt
 * @param imageData - Optional Base64 image for Vision API analysis
 */
export async function initFormCreation(
    formType: string,
    customPrompt?: string,
    sessionId?: string,
    fileContent?: string,
    imageData?: string
): Promise<InitFormResponse> {
    const response = await fetch(`${API_BASE_URL}/api/ai/form/init`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
            form_type: formType,
            custom_prompt: customPrompt,
            session_id: sessionId,
            file_content: fileContent,
            image_data: imageData  // For Vision API analysis
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to initialize form creation');
    }

    return response.json();
}

/**
 * Submit an answer to a single question
 * @param sessionId - Current session ID
 * @param questionId - ID of the question being answered
 * @param answer - User's answer (string or array for checkboxes)
 */
export async function submitAnswer(
    sessionId: string,
    questionId: string,
    answer: string | string[]
): Promise<AnswerResponse> {
    const response = await fetch(`${API_BASE_URL}/api/ai/form/answer`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
            session_id: sessionId,
            question_id: questionId,
            answer: answer
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to submit answer');
    }

    return response.json();
}

/**
 * Get current session state
 */
export async function getSessionState(sessionId: string): Promise<SessionState> {
    const response = await fetch(`${API_BASE_URL}/api/form/session/${sessionId}`, {
        method: 'GET',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get session state');
    }

    return response.json();
}

/**
 * Reset/delete a session
 */
export async function resetSession(sessionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/form/session/${sessionId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to reset session');
    }
}

/**
 * Get available form types
 */
export async function getFormTypes(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/api/form/types`, {
        method: 'GET',
    });

    if (!response.ok) {
        throw new Error('Failed to get form types');
    }

    const data = await response.json();
    return data.form_types;
}
