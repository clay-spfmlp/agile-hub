import { useAuth } from '../contexts/AuthContext';

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export function useAuthenticatedFetch() {
  const { token } = useAuth();

  const authenticatedFetch = async (url: string, options: FetchOptions = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    return response;
  };

  return authenticatedFetch;
} 