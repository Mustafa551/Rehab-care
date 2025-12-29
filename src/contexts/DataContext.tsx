import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Patient, StaffMember, MealSchedule, DoctorNote, RehabProgress, StaffAssignment } from '@/types';
import { 
  patients as initialPatients, 
  staffMembers as initialStaff, 
  mealSchedules as initialMeals,
  doctorNotes as initialNotes,
  rehabProgress as initialProgress,
  generateDailyAssignments
} from '@/data/mockData';
import { format } from 'date-fns';

interface DataContextType {
  patients: Patient[];
  staffMembers: StaffMember[];
  mealSchedules: MealSchedule[];
  doctorNotes: DoctorNote[];
  rehabProgress: RehabProgress[];
  assignments: StaffAssignment[];
  currentDate: string;
  
  // Actions
  addPatient: (patient: Omit<Patient, 'id'>) => void;
  updateMealSchedule: (schedule: MealSchedule) => void;
  addDoctorNote: (note: Omit<DoctorNote, 'id'>) => void;
  updateProgress: (progress: RehabProgress) => void;
  rotateStaff: () => void;
  getPatientAssignment: (patientId: string) => StaffMember | null;
  getStaffPatients: (staffId: string) => Patient[];
  getDoctors: () => StaffMember[];
  getPatientDoctor: (patientId: string) => StaffMember | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [staffMembers] = useState<StaffMember[]>(initialStaff);
  const [mealSchedules, setMealSchedules] = useState<MealSchedule[]>(initialMeals);
  const [doctorNotes, setDoctorNotes] = useState<DoctorNote[]>(initialNotes);
  const [rehabProgress, setRehabProgress] = useState<RehabProgress[]>(initialProgress);
  const [assignments, setAssignments] = useState<StaffAssignment[]>([]);
  const [currentDate, setCurrentDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Generate initial assignments
  useEffect(() => {
    setAssignments(generateDailyAssignments(currentDate));
  }, [currentDate]);

  const addPatient = (patientData: Omit<Patient, 'id'>) => {
    const newPatient: Patient = {
      ...patientData,
      id: `p${Date.now()}`,
    };
    setPatients(prev => [...prev, newPatient]);
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

  const rotateStaff = () => {
    // Move to next day and regenerate assignments
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    setCurrentDate(format(nextDate, 'yyyy-MM-dd'));
  };

  const getPatientAssignment = (patientId: string): StaffMember | null => {
    const assignment = assignments.find(a => a.patientId === patientId);
    if (!assignment) return null;
    return staffMembers.find(s => s.id === assignment.staffId) || null;
  };

  const getStaffPatients = (staffId: string): Patient[] => {
    const patientIds = assignments
      .filter(a => a.staffId === staffId)
      .map(a => a.patientId);
    return patients.filter(p => patientIds.includes(p.id));
  };

  const getDoctors = (): StaffMember[] => {
    return staffMembers.filter(s => s.role === 'doctor');
  };

  const getPatientDoctor = (patientId: string): StaffMember | null => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient || !patient.assignedDoctorId) return null;
    return staffMembers.find(s => s.id === patient.assignedDoctorId) || null;
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
      addPatient,
      updateMealSchedule,
      addDoctorNote,
      updateProgress,
      rotateStaff,
      getPatientAssignment,
      getStaffPatients,
      getDoctors,
      getPatientDoctor,
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
