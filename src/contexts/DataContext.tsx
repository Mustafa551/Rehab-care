import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Patient, StaffMember, MealSchedule, DoctorNote, RehabProgress, StaffAssignment } from '@/types';
import { 
  patients as initialPatients, 
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
  isLoadingAssignments: boolean;
  staffError: string | null;
  assignmentError: string | null;
  
  // Actions
  addPatient: (patient: Omit<Patient, 'id'>) => void;
  addStaffMember: (staff: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMealSchedule: (schedule: MealSchedule) => void;
  addDoctorNote: (note: Omit<DoctorNote, 'id'>) => void;
  updateProgress: (progress: RehabProgress) => void;
  rotateStaff: () => Promise<void>;
  getPatientAssignment: (patientId: string) => StaffMember | null;
  getStaffPatients: (staffId: string | number) => Patient[];
  getDoctors: () => StaffMember[];
  getPatientDoctor: (patientId: string) => StaffMember | null;
  refreshStaff: () => Promise<void>;
  refreshAssignments: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [mealSchedules, setMealSchedules] = useState<MealSchedule[]>(initialMeals);
  const [doctorNotes, setDoctorNotes] = useState<DoctorNote[]>(initialNotes);
  const [rehabProgress, setRehabProgress] = useState<RehabProgress[]>(initialProgress);
  const [assignments, setAssignments] = useState<StaffAssignment[]>([]);
  const [currentDate, setCurrentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  // Load staff from backend on mount
  useEffect(() => {
    loadStaff();
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
      
      // First try to get existing assignments for current date
      let backendAssignments = await api.getAssignmentsByDate(currentDate);
      
      // If no assignments exist for current date, generate them
      if (backendAssignments.length === 0) {
        console.log('No assignments found for current date, generating new assignments...');
        backendAssignments = await api.generateAssignments(currentDate);
      }
      
      // Convert backend assignments to frontend format
      const formattedAssignments = backendAssignments.map(assignment => ({
        id: `a-${assignment.patientId}-${assignment.date}`,
        staffId: assignment.staffId.toString(),
        patientId: assignment.patientId,
        date: assignment.date,
      }));
      
      setAssignments(formattedAssignments);
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

  const refreshAssignments = async () => {
    await loadAssignments();
  };

  const addPatient = (patientData: Omit<Patient, 'id'>) => {
    const newPatient: Patient = {
      ...patientData,
      id: `p${Date.now()}`,
    };
    setPatients(prev => [...prev, newPatient]);
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
    const patientIds = assignments
      .filter(a => a.staffId.toString() === staffId.toString())
      .map(a => a.patientId);
    return patients.filter(p => patientIds.includes(p.id));
  };

  const getDoctors = (): StaffMember[] => {
    return staffMembers.filter(s => s.role === 'doctor');
  };

  const getPatientDoctor = (patientId: string): StaffMember | null => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient || !patient.assignedDoctorId) return null;
    return staffMembers.find(s => s.id.toString() === patient.assignedDoctorId) || null;
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
      isLoadingAssignments,
      staffError,
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
