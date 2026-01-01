/**
 * Submissions Service
 * Handles form submission API calls
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://172.168.17.38:8000';

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface SubmissionData {
  form_data: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface Submission {
  id?: string;
  _id?: string;
  form_id: string;
  form_data: Record<string, any>;
  submitted_at: string;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Helper to get submission ID (handles both 'id' and '_id' fields)
 */
export function getSubmissionId(submission: Submission): string {
  return submission.id || submission._id || '';
}

/**
 * Submit a form (public, no auth required)
 */
export async function submitForm(slug: string, data: SubmissionData): Promise<Submission> {
  const response = await fetch(`${API_BASE_URL}/api/forms/${slug}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to submit form');
  }

  return response.json();
}

/**
 * Get form submissions (owner only)
 */
export async function getFormSubmissions(
  formId: string,
  skip: number = 0,
  limit: number = 100
): Promise<Submission[]> {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await fetch(
    `${API_BASE_URL}/api/forms/${formId}/submissions?skip=${skip}&limit=${limit}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch submissions');
  }

  return response.json();
}

/**
 * Delete submission (owner only)
 */
export async function deleteSubmission(submissionId: string): Promise<void> {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/submissions/${submissionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete submission');
  }
}

/**
 * Generate a UUID (compatible with all browsers)
 */
function generateUUID(): string {
  // Use crypto.randomUUID if available, otherwise fallback
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Get session ID from localStorage or create new one
 */
export function getOrCreateSessionId(): string {
  const SESSION_KEY = 'form_session_id';
  let sessionId = localStorage.getItem(SESSION_KEY);
  
  if (!sessionId) {
    sessionId = generateUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  
  return sessionId;
}

/**
 * Get user's previous submission for prefill (public, no auth required)
 */
export async function getMySubmission(slug: string, sessionId: string): Promise<{
  has_submission: boolean;
  submission: {
    id: string;
    form_data: Record<string, any>;
    submitted_at: string;
    updated_at: string;
  } | null;
}> {
  const response = await fetch(
    `${API_BASE_URL}/api/forms/${slug}/my-submission?session_id=${encodeURIComponent(sessionId)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    // If not found, return empty response
    if (response.status === 404) {
      return { has_submission: false, submission: null };
    }
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch submission');
  }

  return response.json();
}

