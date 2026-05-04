// Authentication Service for handling login, registration, and token management

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

interface AuthResponse {
  success: boolean;
  token?: string;
  user?: { id: string; username: string };
  error?: string;
}

interface User {
  id: string;
  username: string;
}

// Token management
const TOKEN_KEY = 'lumina_auth_token';
const USER_KEY = 'lumina_auth_user';

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.warn('Failed to get token from localStorage:', error);
    return null;
  }
};

export const setToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.warn('Failed to set token in localStorage:', error);
  }
};

export const removeToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.warn('Failed to remove token from localStorage:', error);
  }
};

export const getStoredUser = (): User | null => {
  try {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.warn('Failed to get user from localStorage:', error);
    return null;
  }
};

export const setStoredUser = (user: User): void => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.warn('Failed to set user in localStorage:', error);
  }
};

export const removeStoredUser = (): void => {
  try {
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    console.warn('Failed to remove user from localStorage:', error);
  }
};

// API calls
export const login = async (username: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Login failed' };
    }

    if (data.token && data.user) {
      setToken(data.token);
      setStoredUser(data.user);
    }

    return { success: true, token: data.token, user: data.user };
  } catch (error) {
    return { success: false, error: 'Network error. Please try again.' };
  }
};

export const register = async (username: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Registration failed' };
    }

    if (data.token && data.user) {
      setToken(data.token);
      setStoredUser(data.user);
    }

    return { success: true, token: data.token, user: data.user };
  } catch (error) {
    return { success: false, error: 'Network error. Please try again.' };
  }
};

export const logout = (): void => {
  removeToken();
  removeStoredUser();
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};
