/**
 * Authentication Service
 * Handles all authentication API calls
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://172.168.17.38:8000";
  // import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name?: string;
}

export interface GoogleAuthRequest {
  token: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

/**
 * Register a new user
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Registration failed");
  }

  return response.json();
}

/**
 * Login with email and password
 */
export async function login(
  credentials: LoginCredentials
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Login failed");
  }

  return response.json();
}

/**
 * Login with Google OAuth
 */
export async function googleAuth(
  request: GoogleAuthRequest
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Google authentication failed");
  }

  return response.json();
}

/**
 * Refresh access token
 */
export async function refreshToken(
  refreshToken: string
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Token refresh failed");
  }

  return response.json();
}

/**
 * Get current user info
 */
export async function getCurrentUser(accessToken: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to get user info");
  }

  return response.json();
}

/**
 * Logout (client-side token cleanup)
 */
export async function logout(accessToken: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (error) {
    // Ignore errors on logout
    console.error("Logout error:", error);
  }
}
