export type AgeGroup = 'youth' | 'adult';
export type Gender = 'male' | 'female' | 'other';
export type RoomType = 'general' | 'semi-private' | 'private';

export interface Patient {
  id: string | number;
  name: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  medicalCondition?: string;
  assignedDoctorId?: string | number | null;
  status?: 'active' | 'inactive' | 'discharged';
  createdAt?: string;
  updatedAt?: string;
  // New registration fields
  age?: number;
  gender?: Gender;
  address?: string;
  emergencyContact?: string;
  diseases?: string[];
  assignedNurses?: string[];
  initialDeposit?: number;
  roomType?: RoomType;
  // Legacy fields for compatibility
  ageGroup?: AgeGroup;
  roomNumber?: number;
  admissionDate?: string;
  condition?: string;
  assignedStaffId?: string | null;
  photoUrl?: string;
  // Medical tracking fields
  currentMedications?: string[];
  lastAssessmentDate?: string;
  dischargeStatus?: 'continue' | 'ready' | 'pending';
}

export interface StaffMember {
  id: string | number;
  name: string;
  role: 'nurse' | 'caretaker' | 'therapist' | 'doctor';
  email: string;
  phone: string;
  photoUrl?: string;
  isOnDuty: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StaffAssignment {
  id: string;
  staffId: string;
  patientId: string;
  date: string;
}

export interface MealSchedule {
  id: string;
  name: string;
  time: string;
  description: string;
}

export interface PatientMealPlan {
  id: string;
  patientId: string;
  mealScheduleId: string;
  dietaryNotes: string;
  restrictions: string[];
}

export interface DoctorNote {
  id: string;
  patientId: string;
  doctorName: string;
  date: string;
  notes: string;
  type: 'general' | 'progress' | 'medication' | 'therapy';
}

export interface RehabProgress {
  id: string;
  patientId: string;
  date: string;
  milestone: string;
  progressPercentage: number;
  notes: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
  // Computed properties for compatibility
  name?: string;
  role?: 'admin' | 'staff';
}
export interface Doctor {
  id: string | number;
  name: string;
  specialization: string;
  diseases: string[];
}

export interface Nurse {
  id: string | number;
  name: string;
  type: 'fresh' | 'bscn';
  description: string;
}

export interface Disease {
  id: string;
  name: string;
  category?: string;
}

export interface PatientRegistration {
  // Personal Information
  fullName: string;
  age: number;
  gender: Gender;
  phone: string;
  address: string;
  emergencyContact: string;
  
  // Medical Information
  diseases: string[];
  
  // Assignments
  doctorId: string | number;
  nurseIds: string[];
  
  // Financial
  initialDeposit: number;
  
  // Accommodation
  roomType: RoomType;
}