import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Patient, StaffMember, MealSchedule, DoctorNote, RehabProgress } from '@/types';
import { 
  mealSchedules as initialMeals,
  doctorNotes as initialNotes,
  rehabProgress as initialProgress
} from '@/data/mockData';
import { api, ApiError } from '@/lib/api';
import { format } from 'date-fns';

interface PatientConditionReport {
  id: string;
  patientId: string;
  reportedBy: string;
  date: string;
  time: string;
  conditionUpdate: string;
  symptoms: string[];
  painLevel?: number;
  notes: string;
  urgency: 'low' | 'medium' | 'high';
  reviewedByDoctor: boolean;
  doctorResponse?: string;
}

interface DataContextType {
  patients: Patient[];
  staffMembers: StaffMember[];
  mealSchedules: MealSchedule[];
  doctorNotes: DoctorNote[];
  rehabProgress: RehabProgress[];
  nurseReports: Record<string, PatientConditionReport[]>;
  patientConditions: Record<string, any>; // Store patient conditions from doctors
  isLoadingStaff: boolean;
  isLoadingPatients: boolean;
  staffError: string | null;
  patientError: string | null;
  
  // Actions
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  loadPatients: () => Promise<void>;
  addStaffMember: (staff: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMealSchedule: (schedule: MealSchedule) => void;
  addDoctorNote: (note: Omit<DoctorNote, 'id'>) => void;
  updateProgress: (progress: RehabProgress) => void;
  getStaffPatients: (staffId: string | number) => Patient[];
  getDoctors: () => StaffMember[];
  getPatientDoctor: (patientId: string | number) => StaffMember | null;
  refreshStaff: () => Promise<void>;
  refreshPatients: () => Promise<void>;
  // Nurse reports actions
  addNurseReport: (report: Omit<PatientConditionReport, 'id' | 'reviewedByDoctor'>) => void;
  updateNurseReport: (reportId: string, patientId: string, updates: Partial<PatientConditionReport>) => void;
  getPatientNurseReports: (patientId: string) => PatientConditionReport[];
  getUnreviewedReports: (patientId: string) => PatientConditionReport[];
  // Patient condition actions
  updatePatientCondition: (patientId: string, condition: any) => void;
  getPatientCondition: (patientId: string) => any;
  isPatientReadyForDischarge: (patientId: string) => boolean;
  dischargePatient: (patientId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [mealSchedules, setMealSchedules] = useState<MealSchedule[]>(initialMeals);
  const [doctorNotes, setDoctorNotes] = useState<DoctorNote[]>(initialNotes);
  const [rehabProgress, setRehabProgress] = useState<RehabProgress[]>(initialProgress);
  const [nurseReports, setNurseReports] = useState<Record<string, PatientConditionReport[]>>({});
  const [patientConditions, setPatientConditions] = useState<Record<string, any>>({});
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [patientError, setPatientError] = useState<string | null>(null);

  // Load staff and patients from backend on mount
  useEffect(() => {
    loadStaff();
    loadPatients();
    initializeMockNurseReports();
  }, []);

  const loadStaff = async () => {
    try {
      setIsLoadingStaff(true);
      setStaffError(null);
      const staff = await api.getAllStaff();
      setStaffMembers(staff);
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

  // Initialize some mock nurse reports for demonstration
  const initializeMockNurseReports = () => {
    // This will be called once on app load to create some sample reports
    const mockReports: Record<string, PatientConditionReport[]> = {
      '1': [
        {
          id: 'report-1-1',
          patientId: '1',
          reportedBy: 'Nurse Aisha',
          date: new Date().toISOString().split('T')[0],
          time: '14:30',
          conditionUpdate: 'Patient showing signs of improvement. More alert and responsive during medication time.',
          symptoms: ['Fatigue'],
          painLevel: 3,
          notes: 'Patient requested additional pillow for comfort. Appetite has improved.',
          urgency: 'low',
          reviewedByDoctor: false
        },
        {
          id: 'report-1-2',
          patientId: '1',
          reportedBy: 'Nurse Khadija',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          time: '09:15',
          conditionUpdate: 'Patient complained of increased discomfort during morning routine. Vital signs stable but patient seems restless.',
          symptoms: ['Pain', 'Anxiety', 'Difficulty sleeping'],
          painLevel: 6,
          notes: 'Patient mentioned difficulty sleeping last night. Requesting pain medication review.',
          urgency: 'medium',
          reviewedByDoctor: true,
          doctorResponse: 'Adjusted pain medication dosage. Monitor for next 24 hours and report any changes.'
        }
      ]
    };
    
    setNurseReports(mockReports);

    // Add some mock patient conditions to demonstrate discharge functionality
    // Removed mock discharge conditions to prevent new patients from showing discharge button
    const mockConditions: Record<string, any> = {
      // No mock conditions - discharge status should only be set by doctors
    };

    setPatientConditions(mockConditions);
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
      };
      
      setPatients(prev => [...prev, formattedPatient]);
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

  const getStaffPatients = (staffId: string | number): Patient[] => {
    const staff = staffMembers.find(s => s.id.toString() === staffId.toString());
    
    if (staff?.role === 'doctor') {
      // For doctors, get patients with permanent doctor assignments
      return patients.filter(p => p.assignedDoctorId?.toString() === staffId.toString());
    } else {
      // For nurses, return empty array since we removed assignments
      return [];
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

  // Nurse reports functions
  const addNurseReport = (reportData: Omit<PatientConditionReport, 'id' | 'reviewedByDoctor'>) => {
    const newReport: PatientConditionReport = {
      ...reportData,
      id: `report-${Date.now()}`,
      reviewedByDoctor: false
    };

    setNurseReports(prev => ({
      ...prev,
      [reportData.patientId]: [
        ...(prev[reportData.patientId] || []),
        newReport
      ]
    }));
  };

  const updateNurseReport = (reportId: string, patientId: string, updates: Partial<PatientConditionReport>) => {
    setNurseReports(prev => ({
      ...prev,
      [patientId]: (prev[patientId] || []).map(report =>
        report.id === reportId ? { ...report, ...updates } : report
      )
    }));
  };

  const getPatientNurseReports = (patientId: string): PatientConditionReport[] => {
    return nurseReports[patientId] || [];
  };

  const getUnreviewedReports = (patientId: string): PatientConditionReport[] => {
    return getPatientNurseReports(patientId).filter(report => !report.reviewedByDoctor);
  };

  // Patient condition functions
  const updatePatientCondition = (patientId: string, condition: any) => {
    setPatientConditions(prev => ({
      ...prev,
      [patientId]: condition
    }));
  };

  const getPatientCondition = (patientId: string) => {
    return patientConditions[patientId] || null;
  };

  const isPatientReadyForDischarge = (patientId: string): boolean => {
    const condition = patientConditions[patientId];
    
    // Only show discharge button if doctor has explicitly set discharge recommendation
    return condition?.dischargeRecommendation === 'discharge';
  };

  const dischargePatient = async (patientId: string): Promise<void> => {
    try {
      // Use the dedicated discharge API endpoint
      const dischargeData = {
        dischargeDate: new Date().toISOString().split('T')[0],
        dischargedBy: 'System', // You can update this to use actual user info
      };
      
      await api.dischargePatient(Number(patientId), dischargeData);
      
      // Update local state
      setPatients(prev => prev.map(patient => 
        patient.id.toString() === patientId 
          ? { ...patient, status: 'discharged' as const, dischargeStatus: 'ready' }
          : patient
      ));
    } catch (error) {
      console.error('Failed to discharge patient:', error);
      throw error;
    }
  };

  return (
    <DataContext.Provider value={{
      patients,
      staffMembers,
      mealSchedules,
      doctorNotes,
      rehabProgress,
      nurseReports,
      isLoadingStaff,
      isLoadingPatients,
      staffError,
      patientError,
      addPatient,
      loadPatients,
      addStaffMember,
      updateMealSchedule,
      addDoctorNote,
      updateProgress,
      getStaffPatients,
      getDoctors,
      getPatientDoctor,
      refreshStaff,
      refreshPatients,
      addNurseReport,
      updateNurseReport,
      getPatientNurseReports,
      getUnreviewedReports,
      patientConditions,
      updatePatientCondition,
      getPatientCondition,
      isPatientReadyForDischarge,
      dischargePatient,
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
