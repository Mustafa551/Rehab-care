const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface ApiResponse<T = any> {
  success?: boolean;
  error?: boolean;
  message?: string;
  data?: T;
}

export interface LoginResponse {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    createdAt: string;
    updatedAt: string;
  };
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || `HTTP error! status: ${response.status}`,
        response.status,
        data
      );
    }

    if (data.error) {
      throw new ApiError(
        data.message || 'API request failed',
        response.status,
        data
      );
    }

    return data.data || (data as T);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
}

export const api = {
  // Auth endpoints
  login: async (email: string, password: string): Promise<LoginResponse> => {
    return apiRequest<LoginResponse>('/user/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // User endpoints
  getUserById: async (userId: number) => {
    return apiRequest(`/user?userId=${userId}`);
  },

  createUser: async (userData: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
  }) => {
    return apiRequest('/user', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  updateUser: async (
    userId: number, 
    userData: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    }>
  ) => {
    return apiRequest(`/user/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  },

  deleteUser: async (userId: number) => {
    return apiRequest(`/user/${userId}`, {
      method: 'DELETE',
    });
  },
};

export { ApiError };