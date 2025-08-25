import { API_BASE_URL } from '../config/config';

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const maxRetries = 3;
  let attempt = 0;
  let lastError;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        credentials: 'include',
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      attempt++;
      if (attempt >= maxRetries) throw lastError;
    }
  }

  throw lastError;
}