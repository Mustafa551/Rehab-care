const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
  role: 'nurse' | 'doctor'; // Updated to only allow nurse and doctor
  email: string;
  phone: string;
  isOnDuty: boolean;
  photoUrl?: string;
  // New fields for frontend compatibility
  specialization?: string; // For doctors
  nurseType?: 'fresh' | 'bscn'; // For nurses
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  medicalCondition: string;
  assignedDoctorId?: number;
  status: 'active' | 'inactive' | 'discharged';
  createdAt: string;
  updatedAt: string;
}

export interface VitalSigns {
  id: number;
  patientId: number;
  date: string;
  time: string;
  bloodPressure: string;
  heartRate: string;
  temperature: string;
  oxygenSaturation?: string;
  respiratoryRate?: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

export interface NurseReport {
  id: number;
  patientId: number;
  reportedBy: string;
  date: string;
  time: string;
  conditionUpdate: string;
  symptoms: string[];
  painLevel?: number;
  notes?: string;
  urgency: 'low' | 'medium' | 'high';
  reviewedByDoctor: boolean;
  doctorResponse?: string;
  createdAt: string;
}

export interface PatientCondition {
  id: number;
  patientId: number;
  assessedBy: string;
  date: string;
  condition: string;
  notes?: string;
  medications: any[];
  vitals?: any;
  dischargeRecommendation: 'continue' | 'discharge';
  dischargeNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Medication {
  id: number;
  patientId: number;
  prescribedBy: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

export interface MedicationAdministration {
  id: number;
  medicationId: number;
  patientId: number;
  scheduledTime: string;
  administeredTime?: string;
  administered: boolean;
  administeredBy?: string;
  notes?: string;
  date: string;
  createdAt: string;
  // Joined fields from medication
  medicationName?: string;
  dosage?: string;
  frequency?: string;
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
  getAllStaff: async (filters?: { role?: string; onDuty?: boolean; diseases?: string[] }): Promise<StaffMember[]> => {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.onDuty !== undefined) params.append('onDuty', filters.onDuty.toString());
    if (filters?.diseases && filters.diseases.length > 0) {
      params.append('diseases', filters.diseases.join(','));
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `/staff?${queryString}` : '/staff';
    
    return apiRequest<StaffMember[]>(endpoint);
  },

  getDoctorsByDiseases: async (diseases: string[]): Promise<StaffMember[]> => {
    return apiRequest<StaffMember[]>(`/staff?diseases=${diseases.join(',')}`);
  },

  getNurses: async (): Promise<StaffMember[]> => {
    return apiRequest<StaffMember[]>('/staff?role=nurse');
  },

  getStaffById: async (staffId: number): Promise<StaffMember> => {
    return apiRequest<StaffMember>(`/staff/${staffId}`);
  },

  createStaff: async (staffData: {
    name: string;
    role: 'nurse' | 'doctor';
    email: string;
    phone: string;
    isOnDuty?: boolean;
    photoUrl?: string;
    specialization?: string; // For doctors
    nurseType?: 'fresh' | 'bscn'; // For nurses
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
      role: 'nurse' | 'doctor';
      email: string;
      phone: string;
      isOnDuty: boolean;
      photoUrl: string;
      specialization: string; // For doctors
      nurseType: 'fresh' | 'bscn'; // For nurses
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

  // Patient endpoints
  getAllPatients: async (filters?: { status?: string; doctorId?: number }): Promise<Patient[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.doctorId) params.append('doctorId', filters.doctorId.toString());
    
    const queryString = params.toString();
    const endpoint = queryString ? `/patients?${queryString}` : '/patients';
    
    return apiRequest<Patient[]>(endpoint);
  },

  getPatientById: async (patientId: number): Promise<Patient> => {
    return apiRequest<Patient>(`/patients/${patientId}`);
  },

  createPatient: async (patientData: {
    name: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    medicalCondition: string;
    assignedDoctorId?: number;
    status?: 'active' | 'inactive' | 'discharged';
    // New comprehensive registration fields
    age?: number;
    gender?: 'male' | 'female' | 'other';
    address?: string;
    emergencyContact?: string;
    diseases?: string[];
    assignedNurses?: string[];
    initialDeposit?: number;
    roomType?: 'general' | 'semi-private' | 'private';
    roomNumber?: number;
    admissionDate?: string;
    currentMedications?: string[];
    lastAssessmentDate?: string;
    dischargeStatus?: 'continue' | 'ready' | 'pending';
  }): Promise<Patient> => {
    return apiRequest<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
  },

  updatePatient: async (
    patientId: number,
    patientData: Partial<{
      name: string;
      email: string;
      phone: string;
      dateOfBirth: string;
      medicalCondition: string;
      assignedDoctorId: number;
      status: 'active' | 'inactive' | 'discharged';
    }>
  ): Promise<Patient> => {
    return apiRequest<Patient>(`/patients/${patientId}`, {
      method: 'PATCH',
      body: JSON.stringify(patientData),
    });
  },

  deletePatient: async (patientId: number) => {
    return apiRequest(`/patients/${patientId}`, {
      method: 'DELETE',
    });
  },

  // Discharge patient
  dischargePatient: async (
    patientId: number,
    dischargeData?: {
      dischargeNotes?: string;
      finalBillAmount?: number;
      dischargeDate?: string;
      dischargedBy?: string;
    }
  ) => {
    return apiRequest(`/patients/${patientId}/discharge`, {
      method: 'POST',
      body: JSON.stringify(dischargeData || {}),
    });
  },

  // Vital Signs endpoints
  getAllVitalSigns: async (): Promise<VitalSigns[]> => {
    return apiRequest<VitalSigns[]>('/vital-signs');
  },

  getVitalSignsByPatient: async (patientId: number, date?: string): Promise<VitalSigns[]> => {
    const endpoint = date 
      ? `/vital-signs/patient/${patientId}?date=${date}`
      : `/vital-signs/patient/${patientId}`;
    return apiRequest<VitalSigns[]>(endpoint);
  },

  createVitalSigns: async (vitalData: {
    patientId: number;
    date: string;
    time: string;
    bloodPressure: string;
    heartRate: string;
    temperature: string;
    oxygenSaturation?: string;
    respiratoryRate?: string;
    notes?: string;
    recordedBy: string;
  }): Promise<VitalSigns> => {
    return apiRequest<VitalSigns>('/vital-signs', {
      method: 'POST',
      body: JSON.stringify(vitalData),
    });
  },

  updateVitalSigns: async (id: number, vitalData: any): Promise<VitalSigns> => {
    return apiRequest<VitalSigns>(`/vital-signs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(vitalData),
    });
  },

  deleteVitalSigns: async (id: number) => {
    return apiRequest(`/vital-signs/${id}`, {
      method: 'DELETE',
    });
  },

  // Nurse Reports endpoints
  getAllNurseReports: async (): Promise<NurseReport[]> => {
    return apiRequest<NurseReport[]>('/nurse-reports');
  },

  getNurseReportsByPatient: async (patientId: number): Promise<NurseReport[]> => {
    return apiRequest<NurseReport[]>(`/nurse-reports/patient/${patientId}`);
  },

  getUnreviewedReportsByPatient: async (patientId: number): Promise<NurseReport[]> => {
    return apiRequest<NurseReport[]>(`/nurse-reports/patient/${patientId}/unreviewed`);
  },

  getAllUnreviewedReports: async (): Promise<NurseReport[]> => {
    return apiRequest<NurseReport[]>('/nurse-reports/unreviewed');
  },

  createNurseReport: async (reportData: {
    patientId: number;
    reportedBy: string;
    date: string;
    time: string;
    conditionUpdate: string;
    symptoms?: string[];
    painLevel?: number;
    notes?: string;
    urgency: 'low' | 'medium' | 'high';
  }): Promise<NurseReport> => {
    return apiRequest<NurseReport>('/nurse-reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  },

  updateNurseReport: async (id: number, reportData: any): Promise<NurseReport> => {
    return apiRequest<NurseReport>(`/nurse-reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(reportData),
    });
  },

  reviewNurseReport: async (id: number, doctorResponse: string): Promise<NurseReport> => {
    return apiRequest<NurseReport>(`/nurse-reports/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ doctorResponse }),
    });
  },

  deleteNurseReport: async (id: number) => {
    return apiRequest(`/nurse-reports/${id}`, {
      method: 'DELETE',
    });
  },

  // Patient Conditions endpoints
  getAllPatientConditions: async (): Promise<PatientCondition[]> => {
    return apiRequest<PatientCondition[]>('/patient-conditions');
  },

  getPatientConditionsByPatient: async (patientId: number): Promise<PatientCondition[]> => {
    return apiRequest<PatientCondition[]>(`/patient-conditions/patient/${patientId}`);
  },

  getLatestPatientCondition: async (patientId: number): Promise<PatientCondition | null> => {
    return apiRequest<PatientCondition | null>(`/patient-conditions/patient/${patientId}/latest`);
  },

  createPatientCondition: async (conditionData: {
    patientId: number;
    assessedBy: string;
    date: string;
    condition: string;
    notes?: string;
    medications?: any[];
    vitals?: any;
    dischargeRecommendation?: 'continue' | 'discharge';
    dischargeNotes?: string;
  }): Promise<PatientCondition> => {
    return apiRequest<PatientCondition>('/patient-conditions', {
      method: 'POST',
      body: JSON.stringify(conditionData),
    });
  },

  updatePatientCondition: async (id: number, conditionData: any): Promise<PatientCondition> => {
    return apiRequest<PatientCondition>(`/patient-conditions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(conditionData),
    });
  },

  deletePatientCondition: async (id: number) => {
    return apiRequest(`/patient-conditions/${id}`, {
      method: 'DELETE',
    });
  },

  // Medications endpoints
  getAllMedications: async (): Promise<Medication[]> => {
    return apiRequest<Medication[]>('/medications');
  },

  getMedicationsByPatient: async (patientId: number): Promise<Medication[]> => {
    return apiRequest<Medication[]>(`/medications/patient/${patientId}`);
  },

  createMedication: async (medicationData: {
    patientId: number;
    prescribedBy: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate?: string;
    notes?: string;
  }): Promise<Medication> => {
    return apiRequest<Medication>('/medications', {
      method: 'POST',
      body: JSON.stringify(medicationData),
    });
  },

  updateMedication: async (id: number, medicationData: any): Promise<Medication> => {
    return apiRequest<Medication>(`/medications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(medicationData),
    });
  },

  deleteMedication: async (id: number) => {
    return apiRequest(`/medications/${id}`, {
      method: 'DELETE',
    });
  },

  // Medication Administration endpoints
  getMedicationAdministrationsByPatient: async (patientId: number, date?: string): Promise<MedicationAdministration[]> => {
    const endpoint = date 
      ? `/medications/administrations/patient/${patientId}?date=${date}`
      : `/medications/administrations/patient/${patientId}`;
    return apiRequest<MedicationAdministration[]>(endpoint);
  },

  createMedicationAdministration: async (administrationData: {
    medicationId: number;
    patientId: number;
    scheduledTime: string;
    date: string;
    notes?: string;
  }): Promise<MedicationAdministration> => {
    return apiRequest<MedicationAdministration>('/medications/administrations', {
      method: 'POST',
      body: JSON.stringify(administrationData),
    });
  },

  updateMedicationAdministration: async (id: number, administrationData: any): Promise<MedicationAdministration> => {
    return apiRequest<MedicationAdministration>(`/medications/administrations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(administrationData),
    });
  },

  administerMedication: async (id: number, administeredBy: string, notes?: string): Promise<MedicationAdministration> => {
    return apiRequest<MedicationAdministration>(`/medications/administrations/${id}/administer`, {
      method: 'POST',
      body: JSON.stringify({ administeredBy, notes }),
    });
  },
};

export { ApiError };