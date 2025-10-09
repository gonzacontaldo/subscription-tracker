import { apiClient } from './client';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUri: string | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export async function register(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<AuthUser> {
  const { data, error } = await apiClient.request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  if (error || !data) {
    throw error ?? new Error('Registration failed');
  }

  await apiClient.setToken(data.token);
  return data.user;
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<AuthUser> {
  const { data, error } = await apiClient.request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  if (error || !data) {
    throw error ?? new Error('Login failed');
  }

  await apiClient.setToken(data.token);
  return data.user;
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const { data, error, status } = await apiClient.request<AuthUser>('/auth/me');
  if (status === 401) {
    await apiClient.clearToken();
    return null;
  }
  if (error) {
    throw error;
  }
  return data ?? null;
}

export async function updateProfile(input: {
  displayName?: string;
  avatarUri?: string | null;
}): Promise<AuthUser> {
  const { data, error, status } = await apiClient.request<AuthUser>('/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });

  if (status === 401) {
    await apiClient.clearToken();
    throw new Error('Session expired. Please sign in again.');
  }

  if (error || !data) {
    throw error ?? new Error('Failed to update profile');
  }

  return data;
}

export async function logout() {
  await apiClient.clearToken();
}
