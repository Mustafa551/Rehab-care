import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Patient, StaffMember, MealSchedule, DoctorNote, RehabProgress, StaffAssignment } from '@/types';
import { 
  mealSchedules as initialMeals,
  doctorNotes as initialNotes,
  rehabProgress as initialProgress
} from '@/data/mockData';
import { api, ApiError } from '@/lib/api';
import { format } from 'date-fns';

interface DataContextType {
  patients: Patient[];
  staffMembers: StaffMember[];
  mealSchedules: MealSchedule[];
  doctorNotes: DoctorNote[];
  rehabProgress: RehabProgress[];
  assignments: StaffAssignment[];
  currentDate: string;
  isLoadingStaff: boolean;
  isLoadingPatients: boolean;
  isLoadingAssignments: boolean;
  staffError: string | null;
  patientError: string | null;
  assignmentError: string | null;
  
  // Actions
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addStaffMember: (staff: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMealSchedule: (schedule: MealSchedule) => void;
  addDoctorNote: (note: Omit<DoctorNote, 'id'>) => void;
  updateProgress: (progress: RehabProgress) => void;
  rotateStaff: () => Promise<void>;
  getPatientAssignment: (patientId: string) => StaffMember | null;
  getStaffPatients: (staffId: string | number) => Patient[];
  getDoctors: () => StaffMember[];
  getPatientDoctor: (patientId: string | number) => StaffMember | null;
  refreshStaff: () => Promise<void>;
  refreshPatients: () => Promise<void>;
  refreshAssignments: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [mealSchedules, setMealSchedules] = useState<MealSchedule[]>(initialMeals);
  const [doctorNotes, setDoctorNotes] = useState<DoctorNote[]>(initialNotes);
  const [rehabProgress, setRehabProgress] = useState<RehabProgress[]>(initialProgress);
  const [assignments, setAssignments] = useState<StaffAssignment[]>([]);
  const [currentDate, setCurrentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  // Load staff and patients from backend on mount
  useEffect(() => {
    loadStaff();
    loadPatients();
  }, []);

  // Load assignments when staff loads or date changes
  useEffect(() => {
    if (staffMembers.length > 0) {
      loadAssignments();
    }
  }, [currentDate, staffMembers]);

  const loadStaff = async () => {
    try {
      setIsLoadingStaff(true);
      setStaffError(null);
      const staff = await api.getAllStaff();
      setStaffMembers(staff);
      
      // Initialize doctor assignments if this is the first time
      try {
        await api.initializeAssignments();
      } catch (error) {
        // Don't fail if initialization fails, just log it
        console.warn('Failed to initialize assignments:', error);
      }
    } catch (error) {
      console.error('Failed to load staff:', error);
      if (error instanceof ApiError) {
        setStaffError(error.message);
      } else {
        setStaffError('Failed to load staff members');
      }
      // Fallback to empty array on error
      setStaffMembers([]);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const loadAssignments = async () => {
    try {
      setIsLoadingAssignments(true);
      setAssignmentError(null);
      
      // Always generate assignments for current date to ensure all patients are assigned
      console.log('Generating assignments for current date:', currentDate);
      const backendAssignments = await api.generateAssignments(currentDate);
      
      // Convert backend assignments to frontend format
      const formattedAssignments = backendAssignments.map(assignment => ({
        id: `a-${assignment.patientId}-${assignment.date}`,
        staffId: assignment.staffId.toString(),
        patientId: assignment.patientId.toString(),
        date: assignment.date,
      }));
      
      setAssignments(formattedAssignments);
      console.log('Loaded assignments:', formattedAssignments.length);
    } catch (error) {
      console.error('Failed to load assignments:', error);
      if (error instanceof ApiError) {
        setAssignmentError(error.message);
      } else {
        setAssignmentError('Failed to load assignments');
      }
      // Fallback to empty array on error
      setAssignments([]);
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  const refreshStaff = async () => {
    await loadStaff();
  };

  const loadPatients = async () => {
    try {
      setIsLoadingPatients(true);
      setPatientError(null);
      const backendPatients = await api.getAllPatients();
      
      // Convert backend patients to frontend format for compatibility
      const formattedPatients = backendPatients.map(patient => ({
        ...patient,
        id: patient.id.toString(),
        condition: patient.medicalCondition,
        admissionDate: patient.createdAt,
        age: patient.dateOfBirth ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : 0,
        ageGroup: (patient.dateOfBirth ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : 0) < 18 ? 'youth' as const : 'adult' as const,
        roomNumber: Math.floor(Math.random() * 100) + 100, // Temporary random room number
        assignedStaffId: null, // Will be populated from assignments
      }));
      
      setPatients(formattedPatients);
    } catch (error) {
      console.error('Failed to load patients:', error);
      if (error instanceof ApiError) {
        setPatientError(error.message);
      } else {
        setPatientError('Failed to load patients');
      }
      setPatients([]);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const refreshPatients = async () => {
    await loadPatients();
  };

  const refreshAssignments = async () => {
    await loadAssignments();
  };

  const addPatient = async (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setPatientError(null);
      const newPatient = await api.createPatient({
        name: patientData.name,
        email: patientData.email || '',
        phone: patientData.phone || '',
        dateOfBirth: patientData.dateOfBirth || new Date().toISOString().split('T')[0],
        medicalCondition: patientData.medicalCondition || patientData.condition || '',
        assignedDoctorId: patientData.assignedDoctorId ? Number(patientData.assignedDoctorId) : undefined,
        status: patientData.status || 'active',
      });
      
      // Convert to frontend format
      const formattedPatient = {
        ...newPatient,
        id: newPatient.id.toString(),
        condition: newPatient.medicalCondition,
        admissionDate: newPatient.createdAt,
        age: newPatient.dateOfBirth ? new Date().getFullYear() - new Date(newPatient.dateOfBirth).getFullYear() : 0,
        ageGroup: (newPatient.dateOfBirth ? new Date().getFullYear() - new Date(newPatient.dateOfBirth).getFullYear() : 0) < 18 ? 'youth' as const : 'adult' as const,
        roomNumber: Math.floor(Math.random() * 100) + 100,
        assignedStaffId: null,
      };
      
      setPatients(prev => [...prev, formattedPatient]);
      
      // Refresh assignments to include the new patient
      await loadAssignments();
    } catch (error) {
      console.error('Failed to add patient:', error);
      if (error instanceof ApiError) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to add patient');
      }
    }
  };

  const addStaffMember = async (staffData: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setStaffError(null);
      const newStaff = await api.createStaff(staffData);
      setStaffMembers(prev => [...prev, newStaff]);
    } catch (error) {
      console.error('Failed to add staff member:', error);
      if (error instanceof ApiError) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to add staff member');
      }
    }
  };

  const updateMealSchedule = (schedule: MealSchedule) => {
    setMealSchedules(prev => prev.map(m => m.id === schedule.id ? schedule : m));
  };

  const addDoctorNote = (note: Omit<DoctorNote, 'id'>) => {
    const newNote: DoctorNote = {
      ...note,
      id: `dn${Date.now()}`,
    };
    setDoctorNotes(prev => [newNote, ...prev]);
  };

  const updateProgress = (progress: RehabProgress) => {
    setRehabProgress(prev => {
      const existing = prev.find(p => p.id === progress.id);
      if (existing) {
        return prev.map(p => p.id === progress.id ? progress : p);
      }
      return [...prev, progress];
    });
  };

  const rotateStaff = async () => {
    try {
      setAssignmentError(null);
      // Move to next day
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateString = format(nextDate, 'yyyy-MM-dd');
      
      // Generate assignments for the next day via API
      const newAssignments = await api.generateAssignments(nextDateString);
      
      // Update the current date
      setCurrentDate(nextDateString);
      
      // Convert API assignments to frontend format
      const formattedAssignments = newAssignments.map(assignment => ({
        id: `a-${assignment.patientId}-${assignment.date}`,
        staffId: assignment.staffId.toString(),
        patientId: assignment.patientId,
        date: assignment.date,
      }));
      
      setAssignments(formattedAssignments);
    } catch (error) {
      console.error('Failed to rotate staff:', error);
      if (error instanceof ApiError) {
        setAssignmentError(error.message);
      } else {
        setAssignmentError('Failed to rotate staff assignments');
      }
    }
  };

  const getPatientAssignment = (patientId: string): StaffMember | null => {
    const assignment = assignments.find(a => a.patientId === patientId);
    if (!assignment) return null;
    return staffMembers.find(s => s.id.toString() === assignment.staffId.toString()) || null;
  };

  const getStaffPatients = (staffId: string | number): Patient[] => {
    const staff = staffMembers.find(s => s.id.toString() === staffId.toString());
    
    if (staff?.role === 'doctor') {
      // For doctors, get patients with permanent doctor assignments
      return patients.filter(p => p.assignedDoctorId?.toString() === staffId.toString());
    } else {
      // For other staff, get patients from daily assignments
      const patientIds = assignments
        .filter(a => a.staffId.toString() === staffId.toString())
        .map(a => a.patientId);
      return patients.filter(p => patientIds.includes(p.id.toString()));
    }
  };

  const getDoctors = (): StaffMember[] => {
    return staffMembers.filter(s => s.role === 'doctor');
  };

  const getPatientDoctor = (patientId: string | number): StaffMember | null => {
    const patient = patients.find(p => p.id.toString() === patientId.toString());
    if (!patient || !patient.assignedDoctorId) return null;
    return staffMembers.find(s => s.id.toString() === patient.assignedDoctorId?.toString()) || null;
  };

  return (
    <DataContext.Provider value={{
      patients,
      staffMembers,
      mealSchedules,
      doctorNotes,
      rehabProgress,
      assignments,
      currentDate,
      isLoadingStaff,
      isLoadingPatients,
      isLoadingAssignments,
      staffError,
      patientError,
      assignmentError,
      addPatient,
      addStaffMember,
      updateMealSchedule,
      addDoctorNote,
      updateProgress,
      rotateStaff,
      getPatientAssignment,
      getStaffPatients,
      getDoctors,
      getPatientDoctor,
      refreshStaff,
      refreshPatients,
      refreshAssignments,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
