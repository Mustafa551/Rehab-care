export type AgeGroup = 'youth' | 'adult';

export interface Patient {
  id: string;
  name: string;
  age: number;
  ageGroup: AgeGroup;
  roomNumber: number;
  admissionDate: string;
  condition: string;
  assignedStaffId: string | null;
  assignedDoctorId: string | null;
  photoUrl?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'nurse' | 'caretaker' | 'therapist' | 'doctor';
  email: string;
  phone: string;
  photoUrl?: string;
  isOnDuty: boolean;
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
