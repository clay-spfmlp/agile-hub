// API Configuration and Helper Functions

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  error: string;
  details?: any;
  statusCode?: number;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      if (contentType?.includes('application/json')) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, use the default error message
        }
      }
      
      const apiError: ApiError = {
        error: errorMessage,
        statusCode: response.status
      };
      
      throw apiError;
    }

    if (contentType?.includes('application/json')) {
      return response.json();
    }
    
    return response.text() as any;
  }

  async get<T>(endpoint: string, params?: URLSearchParams): Promise<T> {
    const url = params 
      ? `${this.baseURL}${endpoint}?${params.toString()}` 
      : `${this.baseURL}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });

    return this.handleResponse<T>(response);
  }
}

// Create singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Specific API functions for different entities
export const releasesApi = {
  list: (params?: { teamId?: number; status?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.teamId) searchParams.append('teamId', params.teamId.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    
    return apiClient.get<{ releases: any[] }>('/api/releases', searchParams);
  },
  
  get: (id: number) => apiClient.get(`/api/releases/${id}`),
  
  create: (data: any) => apiClient.post('/api/releases', data),
  
  update: (id: number, data: any) => apiClient.put(`/api/releases/${id}`, data),
  
  delete: (id: number) => apiClient.delete(`/api/releases/${id}`)
};

export const sprintsApi = {
  list: (params?: { teamId?: number; releaseId?: number; status?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.teamId) searchParams.append('teamId', params.teamId.toString());
    if (params?.releaseId) searchParams.append('releaseId', params.releaseId.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    
    return apiClient.get<{ sprints: any[] }>('/api/sprints', searchParams);
  },
  
  get: (id: number) => apiClient.get(`/api/sprints/${id}`),
  
  create: (data: any) => apiClient.post('/api/sprints', data),
  
  update: (id: number, data: any) => apiClient.put(`/api/sprints/${id}`, data),
  
  delete: (id: number) => apiClient.delete(`/api/sprints/${id}`)
};

export const analyticsApi = {
  overview: () => apiClient.get('/api/analytics/overview'),
  
  storyDistribution: () => apiClient.get<{ distribution: any[] }>('/api/analytics/story-distribution'),
  
  teamVelocity: (teamId: number) => apiClient.get<{ sprints: any[] }>(`/api/analytics/team/${teamId}/velocity`),
  
  burndown: (sprintId: number) => apiClient.get(`/api/analytics/sprint/${sprintId}/burndown`),
  
  releaseProgress: (releaseId: number) => apiClient.get(`/api/analytics/release/${releaseId}/progress`)
};

export const teamsApi = {
  list: () => apiClient.get<{ teams: any[] }>('/api/teams'),
  
  get: (id: number) => apiClient.get(`/api/teams/${id}`),
  
  create: (data: any) => apiClient.post('/api/teams', data),
  
  update: (id: number, data: any) => apiClient.put(`/api/teams/${id}`, data),
  
  delete: (id: number) => apiClient.delete(`/api/teams/${id}`)
};

// Helper function for handling API errors in components
export const handleApiError = (error: any): string => {
  if (error && typeof error === 'object' && 'error' in error) {
    return error.error;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}; 