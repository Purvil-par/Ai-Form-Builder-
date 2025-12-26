/**
 * Forms Service
 * Handles all form management API calls
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://172.168.17.38:8000';

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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
  style?: any;
  width?: string;
  order?: number;
}

export interface FormData {
  title: string;
  description?: string;
  fields: FormField[];
  globalStyles?: any;
  ctaButton?: {
    text?: string;
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: string;
    fontSize?: string;
    fontWeight?: string;
  };
  status?: 'draft' | 'published' | 'archived';
}

export interface Form extends FormData {
  id: string;
  owner_id: string;
  slug: string;
  version: number;
  public_url: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  submission_count: number;
}

/**
 * Get authorization header
 */
function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No access token found');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Create a new form
 */
export async function createForm(formData: FormData): Promise<Form> {
  const response = await fetch(`${API_BASE_URL}/api/forms`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create form');
  }

  return response.json();
}

/**
 * Get all user's forms
 */
export async function getUserForms(skip: number = 0, limit: number = 50): Promise<Form[]> {
  const response = await fetch(`${API_BASE_URL}/api/forms?skip=${skip}&limit=${limit}`, {
    method: 'GET',
    headers: getAuthHeader(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch forms');
  }

  return response.json();
}

/**
 * Get form by ID
 */
export async function getFormById(formId: string): Promise<Form> {
  const response = await fetch(`${API_BASE_URL}/api/forms/${formId}`, {
    method: 'GET',
    headers: getAuthHeader(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch form');
  }

  return response.json();
}

/**
 * Get public form by slug (no auth required)
 */
export async function getPublicForm(slug: string): Promise<Form> {
  const response = await fetch(`${API_BASE_URL}/api/forms/public/${slug}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Form not found');
  }

  return response.json();
}

/**
 * Update form
 */
export async function updateForm(formId: string, updates: Partial<FormData>): Promise<Form> {
  const response = await fetch(`${API_BASE_URL}/api/forms/${formId}`, {
    method: 'PUT',
    headers: getAuthHeader(),
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update form');
  }

  return response.json();
}

/**
 * Delete or archive form
 */
export async function deleteForm(formId: string, permanent: boolean = false): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/forms/${formId}?permanent=${permanent}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete form');
  }
}

/**
 * Publish form
 */
export async function publishForm(formId: string): Promise<Form> {
  const response = await fetch(`${API_BASE_URL}/api/forms/${formId}/publish`, {
    method: 'POST',
    headers: getAuthHeader(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to publish form');
  }

  return response.json();
}
