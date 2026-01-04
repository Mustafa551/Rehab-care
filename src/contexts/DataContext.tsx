import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Patient, StaffMember, MealSchedule, DoctorNote, RehabProgress } from '@/types';
import { 
  mealSchedules as initialMeals,
  doctorNotes as initialNotes,
  rehabProgress as initialProgress
} from '@/data/mockData';
import { api, ApiError, VitalSigns, NurseReport, PatientCondition, Medication, MedicationAdministration } from '@/lib/api';

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
  addNurseReport: (report: Omit<PatientConditionReport, 'id' | 'reviewedByDoctor'>) => Promise<void>;
  updateNurseReport: (reportId: string, patientId: string, updates: Partial<PatientConditionReport>) => Promise<void>;
  getPatientNurseReports: (patientId: string) => Promise<PatientConditionReport[]>;
  getUnreviewedReports: (patientId: string) => Promise<PatientConditionReport[]>;
  // Patient condition actions
  updatePatientCondition: (patientId: string, condition: any) => Promise<void>;
  getPatientCondition: (patientId: string) => Promise<any>;
  isPatientReadyForDischarge: (patientId: string) => Promise<boolean>;
  dischargePatient: (patientId: string) => Promise<void>;
  
  // New API-based functions
  // Vital Signs
  getVitalSignsByPatient: (patientId: number, date?: string) => Promise<VitalSigns[]>;
  createVitalSigns: (vitalData: any) => Promise<VitalSigns>;
  
  // Nurse Reports (API-based)
  getNurseReportsByPatientAPI: (patientId: number) => Promise<NurseReport[]>;
  getUnreviewedReportsByPatientAPI: (patientId: number) => Promise<NurseReport[]>;
  createNurseReportAPI: (reportData: any) => Promise<NurseReport>;
  reviewNurseReportAPI: (id: number, doctorResponse: string) => Promise<NurseReport>;
  
  // Patient Conditions (API-based)
  getLatestPatientCondition: (patientId: number) => Promise<PatientCondition | null>;
  createPatientConditionAPI: (conditionData: any) => Promise<PatientCondition>;
  
  // Medications
  getMedicationsByPatient: (patientId: number) => Promise<Medication[]>;
  createMedicationAPI: (medicationData: any) => Promise<Medication>;
  getMedicationAdministrationsByPatient: (patientId: number, date?: string) => Promise<MedicationAdministration[]>;
  administerMedicationAPI: (id: number, administeredBy: string, notes?: string) => Promise<MedicationAdministration>;
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
        // Include all the new comprehensive registration fields
        age: patientData.age,
        gender: patientData.gender,
        address: patientData.address,
        emergencyContact: patientData.emergencyContact,
        diseases: patientData.diseases,
        assignedNurses: patientData.assignedNurses,
        initialDeposit: patientData.initialDeposit,
        roomType: patientData.roomType,
        admissionDate: patientData.admissionDate,
        currentMedications: patientData.currentMedications,
        lastAssessmentDate: patientData.lastAssessmentDate,
        dischargeStatus: patientData.dischargeStatus,
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
    } else if (staff?.role === 'nurse') {
      // For nurses, get patients that have this nurse in their assignedNurses array
      return patients.filter(p => 
        p.assignedNurses && 
        Array.isArray(p.assignedNurses) && 
        p.assignedNurses.includes(staffId.toString())
      );
    } else {
      // For other staff types, return empty array
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

  // Legacy functions for backward compatibility - now use APIs
  const addNurseReport = async (reportData: Omit<PatientConditionReport, 'id' | 'reviewedByDoctor'>): Promise<void> => {
    try {
      await api.createNurseReport({
        patientId: Number(reportData.patientId),
        reportedBy: reportData.reportedBy,
        date: reportData.date,
        time: reportData.time,
        conditionUpdate: reportData.conditionUpdate,
        symptoms: reportData.symptoms,
        painLevel: reportData.painLevel,
        notes: reportData.notes,
        urgency: reportData.urgency,
      });
    } catch (error) {
      console.error('Failed to add nurse report:', error);
      throw error;
    }
  };

  const updateNurseReport = async (reportId: string, patientId: string, updates: Partial<PatientConditionReport>): Promise<void> => {
    try {
      await api.updateNurseReport(Number(reportId), updates);
    } catch (error) {
      console.error('Failed to update nurse report:', error);
      throw error;
    }
  };

  const getPatientNurseReports = async (patientId: string): Promise<PatientConditionReport[]> => {
    try {
      const reports = await api.getNurseReportsByPatient(Number(patientId));
      // Convert API format to legacy format
      return reports.map(report => ({
        id: report.id.toString(),
        patientId: report.patientId.toString(),
        reportedBy: report.reportedBy,
        date: report.date,
        time: report.time,
        conditionUpdate: report.conditionUpdate,
        symptoms: report.symptoms,
        painLevel: report.painLevel,
        notes: report.notes || '',
        urgency: report.urgency,
        reviewedByDoctor: report.reviewedByDoctor,
        doctorResponse: report.doctorResponse,
      }));
    } catch (error) {
      console.error('Failed to get patient nurse reports:', error);
      return [];
    }
  };

  const getUnreviewedReports = async (patientId: string): Promise<PatientConditionReport[]> => {
    try {
      const reports = await api.getUnreviewedReportsByPatient(Number(patientId));
      // Convert API format to legacy format
      return reports.map(report => ({
        id: report.id.toString(),
        patientId: report.patientId.toString(),
        reportedBy: report.reportedBy,
        date: report.date,
        time: report.time,
        conditionUpdate: report.conditionUpdate,
        symptoms: report.symptoms,
        painLevel: report.painLevel,
        notes: report.notes || '',
        urgency: report.urgency,
        reviewedByDoctor: report.reviewedByDoctor,
        doctorResponse: report.doctorResponse,
      }));
    } catch (error) {
      console.error('Failed to get unreviewed reports:', error);
      return [];
    }
  };

  const updatePatientCondition = async (patientId: string, condition: any): Promise<void> => {
    try {
      await api.createPatientCondition({
        patientId: Number(patientId),
        assessedBy: condition.assessedBy || 'Doctor',
        date: condition.date,
        condition: condition.condition,
        notes: condition.notes,
        medications: condition.medications,
        vitals: condition.vitals,
        dischargeRecommendation: condition.dischargeRecommendation,
        dischargeNotes: condition.dischargeNotes,
      });
    } catch (error) {
      console.error('Failed to update patient condition:', error);
      throw error;
    }
  };

  const getPatientCondition = async (patientId: string): Promise<any> => {
    try {
      const condition = await api.getLatestPatientCondition(Number(patientId));
      return condition;
    } catch (error) {
      console.error('Failed to get patient condition:', error);
      return null;
    }
  };

  const isPatientReadyForDischarge = async (patientId: string): Promise<boolean> => {
    try {
      const condition = await api.getLatestPatientCondition(Number(patientId));
      return condition?.dischargeRecommendation === 'discharge';
    } catch (error) {
      console.error('Failed to check discharge status:', error);
      return false;
    }
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

  // New API-based functions
  // Vital Signs
  const getVitalSignsByPatient = async (patientId: number, date?: string): Promise<VitalSigns[]> => {
    try {
      return await api.getVitalSignsByPatient(patientId, date);
    } catch (error) {
      console.error('Failed to get vital signs:', error);
      throw error;
    }
  };

  const createVitalSigns = async (vitalData: any): Promise<VitalSigns> => {
    try {
      return await api.createVitalSigns(vitalData);
    } catch (error) {
      console.error('Failed to create vital signs:', error);
      throw error;
    }
  };

  // Nurse Reports (API-based)
  const getNurseReportsByPatientAPI = async (patientId: number): Promise<NurseReport[]> => {
    try {
      return await api.getNurseReportsByPatient(patientId);
    } catch (error) {
      console.error('Failed to get nurse reports:', error);
      throw error;
    }
  };

  const getUnreviewedReportsByPatientAPI = async (patientId: number): Promise<NurseReport[]> => {
    try {
      return await api.getUnreviewedReportsByPatient(patientId);
    } catch (error) {
      console.error('Failed to get unreviewed reports:', error);
      throw error;
    }
  };

  const createNurseReportAPI = async (reportData: any): Promise<NurseReport> => {
    try {
      return await api.createNurseReport(reportData);
    } catch (error) {
      console.error('Failed to create nurse report:', error);
      throw error;
    }
  };

  const reviewNurseReportAPI = async (id: number, doctorResponse: string): Promise<NurseReport> => {
    try {
      return await api.reviewNurseReport(id, doctorResponse);
    } catch (error) {
      console.error('Failed to review nurse report:', error);
      throw error;
    }
  };

  // Patient Conditions (API-based)
  const getLatestPatientCondition = async (patientId: number): Promise<PatientCondition | null> => {
    try {
      return await api.getLatestPatientCondition(patientId);
    } catch (error) {
      console.error('Failed to get patient condition:', error);
      throw error;
    }
  };

  const createPatientConditionAPI = async (conditionData: any): Promise<PatientCondition> => {
    try {
      return await api.createPatientCondition(conditionData);
    } catch (error) {
      console.error('Failed to create patient condition:', error);
      throw error;
    }
  };

  // Medications
  const getMedicationsByPatient = async (patientId: number): Promise<Medication[]> => {
    try {
      return await api.getMedicationsByPatient(patientId);
    } catch (error) {
      console.error('Failed to get medications:', error);
      throw error;
    }
  };

  const createMedicationAPI = async (medicationData: any): Promise<Medication> => {
    try {
      return await api.createMedication(medicationData);
    } catch (error) {
      console.error('Failed to create medication:', error);
      throw error;
    }
  };

  const getMedicationAdministrationsByPatient = async (patientId: number, date?: string): Promise<MedicationAdministration[]> => {
    try {
      return await api.getMedicationAdministrationsByPatient(patientId, date);
    } catch (error) {
      console.error('Failed to get medication administrations:', error);
      throw error;
    }
  };

  const administerMedicationAPI = async (id: number, administeredBy: string, notes?: string): Promise<MedicationAdministration> => {
    try {
      return await api.administerMedication(id, administeredBy, notes);
    } catch (error) {
      console.error('Failed to administer medication:', error);
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
      // New API-based functions
      getVitalSignsByPatient,
      createVitalSigns,
      getNurseReportsByPatientAPI,
      getUnreviewedReportsByPatientAPI,
      createNurseReportAPI,
      reviewNurseReportAPI,
      getLatestPatientCondition,
      createPatientConditionAPI,
      getMedicationsByPatient,
      createMedicationAPI,
      getMedicationAdministrationsByPatient,
      administerMedicationAPI,
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
