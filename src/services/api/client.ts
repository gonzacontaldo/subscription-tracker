import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';

function resolveApiUrl() {
  const extra = Constants.expoConfig?.extra ?? {};
  const baseUrl = typeof extra.apiUrl === 'string' ? extra.apiUrl : undefined;
  return baseUrl ?? 'http://localhost:4000';
}

async function getToken() {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.warn('Failed to read token from secure storage', error);
    return null;
  }
}

async function setToken(token: string) {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.warn('Failed to store auth token securely', error);
  }
}

async function clearToken() {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.warn('Failed to clear auth token', error);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ data: T | null; error: Error | null; status: number }> {
  const baseUrl = resolveApiUrl();
  const token = await getToken();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
    });

    const status = response.status;

    if (status === 204) {
      return { data: null, error: null, status };
    }

    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const message = extractErrorMessage(payload);
      return { data: null, error: new Error(message), status };
    }

    return { data: payload as T, error: null, status };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Network request failed'),
      status: 0,
    };
  }
}

export const apiClient = {
  request,
  getToken,
  setToken,
  clearToken,
};

function extractErrorMessage(payload: unknown): string {
  if (!payload) {
    return 'Request failed with unknown error';
  }

  if (typeof payload === 'string') {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const raw = (payload as { error?: unknown }).error ?? payload;
    const messages = gatherMessages(raw);
    if (messages.length) {
      return messages.join('\n');
    }
  }

  return 'Request failed with unknown error';
}

function gatherMessages(input: unknown): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.flatMap(gatherMessages).filter(Boolean);
  }
  if (typeof input === 'object') {
    return Object.values(input).flatMap(gatherMessages).filter(Boolean);
  }
  if (typeof input === 'string') {
    return input.trim() ? [input.trim()] : [];
  }
  return [String(input)];
}
