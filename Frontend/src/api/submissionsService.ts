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
