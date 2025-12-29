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

export interface StaffMember {
  id: number;
  name: string;
  role: 'nurse' | 'caretaker' | 'therapist' | 'doctor';
  email: string;
  phone: string;
  isOnDuty: boolean;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffAssignment {
  id: number;
  staffId: number;
  patientId: string;
  date: string;
  createdAt: string;
  updatedAt: string;
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

  // Staff endpoints
  getAllStaff: async (filters?: { role?: string; onDuty?: boolean }): Promise<StaffMember[]> => {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.onDuty !== undefined) params.append('onDuty', filters.onDuty.toString());
    
    const queryString = params.toString();
    const endpoint = queryString ? `/staff?${queryString}` : '/staff';
    
    return apiRequest<StaffMember[]>(endpoint);
  },

  getStaffById: async (staffId: number): Promise<StaffMember> => {
    return apiRequest<StaffMember>(`/staff/${staffId}`);
  },

  createStaff: async (staffData: {
    name: string;
    role: 'nurse' | 'caretaker' | 'therapist' | 'doctor';
    email: string;
    phone: string;
    isOnDuty?: boolean;
    photoUrl?: string;
  }): Promise<StaffMember> => {
    return apiRequest<StaffMember>('/staff', {
      method: 'POST',
      body: JSON.stringify(staffData),
    });
  },

  updateStaff: async (
    staffId: number,
    staffData: Partial<{
      name: string;
      role: 'nurse' | 'caretaker' | 'therapist' | 'doctor';
      email: string;
      phone: string;
      isOnDuty: boolean;
      photoUrl: string;
    }>
  ): Promise<StaffMember> => {
    return apiRequest<StaffMember>(`/staff/${staffId}`, {
      method: 'PATCH',
      body: JSON.stringify(staffData),
    });
  },

  deleteStaff: async (staffId: number) => {
    return apiRequest(`/staff/${staffId}`, {
      method: 'DELETE',
    });
  },

  // Assignment endpoints
  getAssignmentsByDate: async (date: string): Promise<StaffAssignment[]> => {
    return apiRequest<StaffAssignment[]>(`/assignments?date=${date}`);
  },

  generateAssignments: async (date: string): Promise<StaffAssignment[]> => {
    return apiRequest<StaffAssignment[]>('/assignments/generate', {
      method: 'POST',
      body: JSON.stringify({ date }),
    });
  },

  initializeAssignments: async () => {
    return apiRequest('/assignments/initialize', {
      method: 'POST',
    });
  },

  getAssignmentsByStaff: async (staffId: number, date?: string): Promise<StaffAssignment[]> => {
    const endpoint = date 
      ? `/assignments/staff/${staffId}?date=${date}`
      : `/assignments/staff/${staffId}`;
    return apiRequest<StaffAssignment[]>(endpoint);
  },

  getAssignmentsByPatient: async (patientId: string, date?: string): Promise<StaffAssignment[]> => {
    const endpoint = date 
      ? `/assignments/patient/${patientId}?date=${date}`
      : `/assignments/patient/${patientId}`;
    return apiRequest<StaffAssignment[]>(endpoint);
  },

  // Doctor assignment endpoints
  getDoctorAssignments: async () => {
    return apiRequest('/assignments/doctors');
  },

  assignDoctorToPatient: async (doctorId: number, patientId: string) => {
    return apiRequest('/assignments/doctors/assign', {
      method: 'POST',
      body: JSON.stringify({ doctorId, patientId }),
    });
  },
};

export { ApiError };