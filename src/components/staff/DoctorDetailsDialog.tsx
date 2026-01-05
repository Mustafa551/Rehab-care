import { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Stethoscope, 
  Users, 
  User, 
  Calendar, 
  Pill, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Phone,
  MapPin,
  Heart,
  Activity,
  Clock,
  Save,
  Eye
} from 'lucide-react';
import { StaffMember, Patient } from '@/types';
import { toast } from 'sonner';

interface DoctorDetailsDialogProps {
  doctor: StaffMember;
  trigger?: React.ReactNode;
}

interface PatientMedication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  notes?: string;
}

interface PatientConditionUpdate {
  date: string;
  condition: string;
  notes: string;
  medications: PatientMedication[];
  vitals?: {
    bloodPressure?: string;
    heartRate?: string;
    temperature?: string;
    oxygenSaturation?: string;
  };
  dischargeRecommendation?: 'continue' | 'discharge';
  dischargeNotes?: string;
}

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

export function DoctorDetailsDialog({ doctor, trigger }: DoctorDetailsDialogProps) {
  const { 
    patients, 
    getStaffPatients, 
    getNurseReportsByPatientAPI,
    getUnreviewedReportsByPatientAPI,
    reviewNurseReportAPI,
    createPatientConditionAPI,
    getLatestPatientCondition,
    createMedicationAPI,
    getMedicationsByPatient,
    getVitalSignsByPatient
  } = useData();
  const [open, setOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState('patients');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Get patients assigned to this doctor
  const doctorPatients = patients.filter(patient => 
    patient.assignedDoctorId === doctor.id
  );

  // Helper function to check if patient is discharged
  const isPatientDischarged = (patient: Patient | null): boolean => {
    return patient?.status === 'discharged';
  };

  const [doctorResponses, setDoctorResponses] = useState<Record<string, string>>({});
  const [nurseReportsCache, setNurseReportsCache] = useState<Record<string, any[]>>({});
  const [patientConditionsCache, setPatientConditionsCache] = useState<Record<string, any>>({});
  const [vitalSignsCache, setVitalSignsCache] = useState<Record<string, any[]>>({});
  
  const [conditionForm, setConditionForm] = useState<PatientConditionUpdate>({
    date: new Date().toISOString().split('T')[0],
    condition: '',
    notes: '',
    medications: [],
    vitals: {},
    dischargeRecommendation: 'continue',
    dischargeNotes: ''
  });

  // Load patient data functions
  const loadPatientReports = async (patient: Patient) => {
    try {
      const reports = await getNurseReportsByPatientAPI(Number(patient.id));
      setNurseReportsCache(prev => ({
        ...prev,
        [patient.id.toString()]: reports
      }));
      return reports;
    } catch (error) {
      console.error('Failed to load patient reports:', error);
      return [];
    }
  };

  const loadPatientCondition = async (patient: Patient) => {
    try {
      const condition = await getLatestPatientCondition(Number(patient.id));
      if (condition) {
        setPatientConditionsCache(prev => ({
          ...prev,
          [patient.id.toString()]: condition
        }));
      }
      return condition;
    } catch (error) {
      console.error('Failed to load patient condition:', error);
      return null;
    }
  };

  const loadPatientVitalSigns = async (patient: Patient) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const vitals = await getVitalSignsByPatient(Number(patient.id), today);
      setVitalSignsCache(prev => ({
        ...prev,
        [patient.id.toString()]: vitals
      }));
      return vitals;
    } catch (error) {
      console.error('Failed to load patient vital signs:', error);
      return [];
    }
  };

  const getPatientNurseReports = (patientId: string) => {
    return nurseReportsCache[patientId] || [];
  };

  const getUnreviewedReports = (patientId: string) => {
    const reports = nurseReportsCache[patientId] || [];
    return reports.filter(report => !report.reviewedByDoctor);
  };

  const getPatientCondition = (patientId: string) => {
    return patientConditionsCache[patientId] || null;
  };

  const getLatestVitalSigns = (patientId: string) => {
    const vitals = vitalSignsCache[patientId] || [];
    return vitals.length > 0 ? vitals[0] : null;
  };

  // Load data for all patients on mount
  useEffect(() => {
    const loadAllPatientData = async () => {
      for (const patient of doctorPatients) {
        await loadPatientReports(patient);
        await loadPatientCondition(patient);
        await loadPatientVitalSigns(patient);
      }
    };
    
    if (doctorPatients.length > 0 && open) {
      loadAllPatientData();
    }
  }, [doctorPatients.length, open]); // Only depend on length and open state

  const handlePatientSelect = async (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveTab('condition');
    
    // Load patient data
    await loadPatientReports(patient);
    const existingCondition = await loadPatientCondition(patient);
    const latestVitals = await loadPatientVitalSigns(patient);
    
    // Load existing condition data or initialize new
    if (existingCondition) {
      setConditionForm({
        date: existingCondition.date,
        condition: existingCondition.condition || patient.medicalCondition || patient.condition || 'General assessment needed',
        notes: existingCondition.notes || '',
        medications: existingCondition.medications || [],
        vitals: existingCondition.vitals || (latestVitals.length > 0 ? {
          bloodPressure: latestVitals[0].bloodPressure,
          heartRate: latestVitals[0].heartRate,
          temperature: latestVitals[0].temperature,
          oxygenSaturation: latestVitals[0].oxygenSaturation
        } : {}),
        dischargeRecommendation: existingCondition.dischargeRecommendation || 'continue',
        dischargeNotes: existingCondition.dischargeNotes || ''
      });
    } else {
      setConditionForm({
        date: new Date().toISOString().split('T')[0],
        condition: patient.medicalCondition || patient.condition || 'General assessment needed',
        notes: '',
        medications: [],
        vitals: latestVitals.length > 0 ? {
          bloodPressure: latestVitals[0].bloodPressure,
          heartRate: latestVitals[0].heartRate,
          temperature: latestVitals[0].temperature,
          oxygenSaturation: latestVitals[0].oxygenSaturation
        } : {},
        dischargeRecommendation: 'continue',
        dischargeNotes: ''
      });
    }
  };

  const handleReviewReport = async (reportId: string, response: string) => {
    if (!selectedPatient) return;

    try {
      await reviewNurseReportAPI(Number(reportId), response);
      
      // Update local cache
      setNurseReportsCache(prev => ({
        ...prev,
        [selectedPatient.id.toString()]: prev[selectedPatient.id.toString()].map(report =>
          report.id.toString() === reportId
            ? { ...report, reviewedByDoctor: true, doctorResponse: response }
            : report
        )
      }));

      // Clear the response input
      setDoctorResponses(prev => ({
        ...prev,
        [reportId]: ''
      }));

      toast.success('Report reviewed and response sent to nursing staff');
    } catch (error) {
      toast.error('Failed to review report');
    }
  };

  const handleAddMedication = () => {
    const newMedication: PatientMedication = {
      id: Date.now().toString(),
      name: '',
      dosage: '',
      frequency: '',
      startDate: new Date().toISOString().split('T')[0],
      notes: ''
    };
    
    setConditionForm(prev => ({
      ...prev,
      medications: [...prev.medications, newMedication]
    }));
  };

  const handleSaveMedication = async (medication: PatientMedication) => {
    if (!selectedPatient || !medication.name.trim()) return;

    try {
      await createMedicationAPI({
        patientId: Number(selectedPatient.id),
        medicationName: medication.name,
        dosage: medication.dosage,
        frequency: medication.frequency,
        startDate: medication.startDate,
        endDate: medication.endDate,
        notes: medication.notes,
        prescribedBy: doctor.name,
      });
      
      toast.success('Medication prescribed successfully');
    } catch (error) {
      toast.error('Failed to prescribe medication');
    }
  };

  // Function to create medication administrations for prescribed medications
  const createMedicationAdministrations = async (patient: Patient, medications: PatientMedication[]) => {
    try {
      for (const medication of medications) {
        if (!medication.name.trim()) continue;
        
        console.log('Creating medication and administrations for:', medication.name);
        
        // First create the medication record
        const createdMedication = await createMedicationAPI({
          patientId: Number(patient.id),
          medicationName: medication.name,
          dosage: medication.dosage,
          frequency: medication.frequency,
          startDate: medication.startDate,
          endDate: medication.endDate,
          notes: medication.notes,
          prescribedBy: doctor.name,
        });

        console.log('Created medication:', createdMedication);

        // Then create administration schedules based on frequency
        const today = new Date().toISOString().split('T')[0];
        const administrationTimes = getAdministrationTimes(medication.frequency);
        
        console.log('Creating administration schedules for times:', administrationTimes);
        
        for (const time of administrationTimes) {
          try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/medications/administrations`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                medicationId: createdMedication.id,
                patientId: Number(patient.id),
                scheduledTime: time,
                date: today,
                notes: `Scheduled administration for ${medication.name}`,
              }),
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error(`Failed to create administration schedule for ${medication.name} at ${time}:`, errorText);
            } else {
              const result = await response.json();
              console.log(`Created administration schedule for ${medication.name} at ${time}:`, result);
            }
          } catch (error) {
            console.error(`Failed to create administration schedule for ${medication.name} at ${time}:`, error);
          }
        }
      }
      
      toast.success('Medications prescribed and scheduled for nursing administration');
    } catch (error) {
      console.error('Failed to create medication administrations:', error);
      toast.error('Failed to schedule medication administrations');
    }
  };

  // Helper function to determine administration times based on frequency
  const getAdministrationTimes = (frequency: string): string[] => {
    const freq = frequency.toLowerCase();
    
    if (freq.includes('3') || freq.includes('three')) {
      return ['08:00', '14:00', '20:00']; // 3 times daily
    } else if (freq.includes('2') || freq.includes('two') || freq.includes('twice')) {
      return ['08:00', '20:00']; // 2 times daily
    } else if (freq.includes('4') || freq.includes('four')) {
      return ['06:00', '12:00', '18:00', '24:00']; // 4 times daily
    } else {
      return ['08:00']; // Once daily (default)
    }
  };

  const handleUpdateMedication = (medicationId: string, field: keyof PatientMedication, value: string) => {
    setConditionForm(prev => ({
      ...prev,
      medications: prev.medications.map(med => 
        med.id === medicationId ? { ...med, [field]: value } : med
      )
    }));
  };

  const handleRemoveMedication = (medicationId: string) => {
    setConditionForm(prev => ({
      ...prev,
      medications: prev.medications.filter(med => med.id !== medicationId)
    }));
  };

  const handleSaveCondition = async () => {
    if (!selectedPatient) return;
    
    // Validate required fields on client side
    if (!conditionForm.condition.trim()) {
      toast.error('Please describe the patient\'s current condition');
      return;
    }
    
    // Use current date if no date is selected
    const assessmentDate = conditionForm.date || new Date().toISOString().split('T')[0];
    
    setIsUpdating(true);
    try {
      // Create patient condition using API
      const conditionData = {
        patientId: Number(selectedPatient.id),
        assessedBy: doctor.name,
        date: assessmentDate,
        condition: conditionForm.condition.trim(),
        notes: conditionForm.notes || '',
        medications: conditionForm.medications || [],
        vitals: conditionForm.vitals || {},
        dischargeRecommendation: conditionForm.dischargeRecommendation || 'continue',
        dischargeNotes: conditionForm.dischargeNotes || '',
      };

      console.log('Sending condition data:', conditionData); // Debug log

      const savedCondition = await createPatientConditionAPI(conditionData);
      console.log('Saved condition:', savedCondition);
      
      // Create medication administrations for each prescribed medication
      if (conditionForm.medications && conditionForm.medications.length > 0) {
        console.log('Creating medication administrations for', conditionForm.medications.length, 'medications');
        await createMedicationAdministrations(selectedPatient, conditionForm.medications);
      }
      
      // Update local cache
      setPatientConditionsCache(prev => ({
        ...prev,
        [selectedPatient.id.toString()]: savedCondition
      }));
      
      toast.success('Patient condition updated successfully');
      
      if (conditionForm.dischargeRecommendation === 'discharge') {
        toast.info('Discharge recommendation noted. Patient is now ready for discharge.');
      }
    } catch (error) {
      console.error('Failed to update patient condition:', error);
      
      // More specific error handling
      if (error instanceof Error) {
        if (error.message.includes('date')) {
          toast.error('Invalid date format. Please check the assessment date.');
        } else if (error.message.includes('required')) {
          toast.error('Please fill in all required fields.');
        } else {
          toast.error(`Failed to update patient condition: ${error.message}`);
        }
      } else {
        toast.error('Failed to update patient condition. Please try again.');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const getConditionStatus = (patient: Patient) => {
    const condition = getPatientCondition(patient.id.toString());
    if (!condition) return 'pending';
    
    const daysSinceUpdate = Math.floor(
      (new Date().getTime() - new Date(condition.date).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceUpdate === 0) return 'updated-today';
    if (daysSinceUpdate <= 3) return 'recent';
    return 'needs-update';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'updated-today': return 'bg-green-100 text-green-800';
      case 'recent': return 'bg-blue-100 text-blue-800';
      case 'needs-update': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'updated-today': return 'Updated Today';
      case 'recent': return 'Recently Updated';
      case 'needs-update': return 'Needs Update';
      default: return 'Pending Review';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Eye className="h-4 w-4" />
            View Details
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            {doctor.name} - Doctor Dashboard
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="patients" className="gap-2">
              <Users className="h-4 w-4" />
              My Patients ({doctorPatients.length})
            </TabsTrigger>
            <TabsTrigger value="condition" disabled={!selectedPatient || isPatientDischarged(selectedPatient)} className="gap-2">
              <FileText className="h-4 w-4" />
              Patient Condition
            </TabsTrigger>
            <TabsTrigger value="overview" className="gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
          </TabsList>

          {/* Patients List Tab */}
          <TabsContent value="patients" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Assigned Patients</h3>
              <Badge variant="outline">
                {doctorPatients.length} patients under care
              </Badge>
            </div>

            {doctorPatients.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Patients Assigned</h3>
                  <p className="text-muted-foreground text-center">
                    No patients are currently assigned to this doctor.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {doctorPatients.map((patient) => {
                  const status = getConditionStatus(patient);
                  return (
                    <Card 
                      key={patient.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handlePatientSelect(patient)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                              {patient.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <h4 className="font-semibold">{patient.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                Age: {patient.age} • Room: {patient.roomNumber}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(status)}>
                            {getStatusText(status)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Heart className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Condition:</span>
                          <span className="font-medium line-clamp-1">
                            {patient.medicalCondition || 'Not specified'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Admitted:</span>
                          <span className="font-medium">
                            {patient.admissionDate ? new Date(patient.admissionDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>

                        {getPatientCondition(patient.id.toString())?.dischargeRecommendation === 'discharge' && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="font-medium">Recommended for discharge</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Patient Condition Tab */}
          <TabsContent value="condition" className="space-y-6">
            {selectedPatient ? (
              <>
                {/* Patient Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">
                          {selectedPatient.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold">{selectedPatient.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Age: {selectedPatient.age}</span>
                            <span>Room: {selectedPatient.roomNumber}</span>
                            <span>Gender: {selectedPatient.gender || 'Not specified'}</span>
                          </div>
                        </div>
                      </div>
                      <Button onClick={() => setActiveTab('patients')} variant="outline">
                        Back to Patients
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Nurse Reports Section */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Nurse Condition Reports
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {getPatientNurseReports(selectedPatient.id.toString()).length} total
                            </Badge>
                            <Badge variant="destructive" className="text-xs">
                              {getUnreviewedReports(selectedPatient.id.toString()).length} pending
                            </Badge>
                            <Button 
                              onClick={() => loadPatientReports(selectedPatient)} 
                              variant="outline" 
                              size="sm"
                              className="gap-2"
                            >
                              <Activity className="h-4 w-4" />
                              Refresh
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {getPatientNurseReports(selectedPatient.id.toString()).length === 0 ? (
                          <div className="text-center py-8">
                            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-foreground mb-2">No Reports Yet</h3>
                            <p className="text-muted-foreground text-center">
                              No condition reports from nursing staff yet.
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                              Nurses will submit condition updates that will appear here.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4 max-h-96 overflow-y-auto">
                            {getPatientNurseReports(selectedPatient.id.toString())
                              .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))
                              .map((report) => {
                                const isUrgent = report.urgency === 'high';
                                const isUnreviewed = !report.reviewedByDoctor;
                                
                                return (
                                  <Card 
                                    key={report.id} 
                                    className={`p-4 transition-all hover:shadow-md ${
                                      isUnreviewed ? 'border-orange-200 bg-orange-50' : 
                                      isUrgent ? 'border-red-200 bg-red-50' : ''
                                    }`}
                                  >
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-sm">
                                            {new Date(report.date).toLocaleDateString('en-US', {
                                              weekday: 'short',
                                              month: 'short',
                                              day: 'numeric'
                                            })} {report.time}
                                          </span>
                                          <Badge 
                                            variant={
                                              report.urgency === 'high' ? 'destructive' :
                                              report.urgency === 'medium' ? 'default' : 'secondary'
                                            }
                                            className="text-xs"
                                          >
                                            {report.urgency} urgency
                                          </Badge>
                                          {isUnreviewed && (
                                            <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800">
                                              New
                                            </Badge>
                                          )}
                                        </div>
                                        <Badge variant={report.reviewedByDoctor ? 'default' : 'outline'}>
                                          {report.reviewedByDoctor ? 'Reviewed' : 'Needs Review'}
                                        </Badge>
                                      </div>
                                      
                                      <div>
                                        <p className="text-sm font-medium">Condition Update:</p>
                                        <p className="text-sm text-muted-foreground">{report.conditionUpdate}</p>
                                      </div>

                                      {report.symptoms.length > 0 && (
                                        <div>
                                          <p className="text-sm font-medium">Symptoms:</p>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {report.symptoms.map(symptom => (
                                              <Badge key={symptom} variant="outline" className="text-xs">
                                                {symptom}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {report.painLevel !== undefined && report.painLevel > 0 && (
                                        <div className="flex items-center gap-2">
                                          <p className="text-sm font-medium">Pain Level:</p>
                                          <div className="flex items-center gap-1">
                                            <span className="font-bold text-lg">{report.painLevel}/10</span>
                                            <div className="flex">
                                              {[...Array(10)].map((_, i) => (
                                                <div
                                                  key={i}
                                                  className={`w-2 h-2 rounded-full mr-1 ${
                                                    i < report.painLevel ? 'bg-red-500' : 'bg-gray-200'
                                                  }`}
                                                />
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {report.notes && (
                                        <div>
                                          <p className="text-sm font-medium">Notes:</p>
                                          <p className="text-sm text-muted-foreground italic bg-gray-50 p-2 rounded">
                                            "{report.notes}"
                                          </p>
                                        </div>
                                      )}

                                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>Reported by {report.reportedBy}</span>
                                        <span>
                                          {(() => {
                                            const reportTime = new Date(`${report.date}T${report.time}`);
                                            const now = new Date();
                                            const diffHours = Math.floor((now.getTime() - reportTime.getTime()) / (1000 * 60 * 60));
                                            
                                            if (diffHours < 1) return 'Just reported';
                                            if (diffHours < 24) return `${diffHours} hours ago`;
                                            const diffDays = Math.floor(diffHours / 24);
                                            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                                          })()}
                                        </span>
                                      </div>

                                      {report.doctorResponse && (
                                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                                          <p className="text-sm font-medium text-blue-900">Your Response:</p>
                                          <p className="text-sm text-blue-800">{report.doctorResponse}</p>
                                        </div>
                                      )}

                                      {!report.reviewedByDoctor && (
                                        <div className="space-y-2 pt-2 border-t">
                                          <Label htmlFor={`response-${report.id}`} className="text-sm font-medium">
                                            Doctor Response: <span className="text-red-500">*</span>
                                          </Label>
                                          <Textarea
                                            id={`response-${report.id}`}
                                            value={doctorResponses[report.id] || ''}
                                            onChange={(e) => setDoctorResponses(prev => ({
                                              ...prev,
                                              [report.id]: e.target.value
                                            }))}
                                            placeholder="Provide instructions, medication changes, or follow-up notes..."
                                            rows={3}
                                            className="text-sm"
                                          />
                                          <Button
                                            onClick={() => handleReviewReport(report.id, doctorResponses[report.id] || '')}
                                            size="sm"
                                            disabled={!doctorResponses[report.id]?.trim()}
                                            className="w-full"
                                          >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Review & Respond
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </Card>
                                );
                              })}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Condition Update Form */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Condition Assessment
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="date">Assessment Date</Label>
                          <Input
                            id="date"
                            type="date"
                            value={conditionForm.date}
                            onChange={(e) => setConditionForm(prev => ({ ...prev, date: e.target.value }))}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="condition">Current Condition *</Label>
                          <Textarea
                            id="condition"
                            value={conditionForm.condition}
                            onChange={(e) => setConditionForm(prev => ({ ...prev, condition: e.target.value }))}
                            placeholder="Describe the patient's current medical condition..."
                            rows={3}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="notes">Clinical Notes</Label>
                          <Textarea
                            id="notes"
                            value={conditionForm.notes}
                            onChange={(e) => setConditionForm(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Additional observations, symptoms, progress notes..."
                            rows={4}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Vital Signs - Read Only for Doctors */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Latest Vital Signs (View Only)
                          </CardTitle>
                          <Button 
                            onClick={() => loadPatientVitalSigns(selectedPatient)} 
                            variant="outline" 
                            size="sm"
                            className="gap-2"
                          >
                            <Activity className="h-4 w-4" />
                            Refresh
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Vital signs are recorded by nurses. You can view the latest readings here.
                          </AlertDescription>
                        </Alert>
                        
                        {(() => {
                          const latestVitals = getLatestVitalSigns(selectedPatient.id.toString());
                          
                          if (!latestVitals) {
                            return (
                              <div className="text-center py-8">
                                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No vital signs recorded yet.</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                  Nurses will record vital signs that will appear here.
                                </p>
                              </div>
                            );
                          }
                          
                          return (
                            <>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Blood Pressure</Label>
                                  <Input
                                    value={latestVitals.bloodPressure || 'Not recorded'}
                                    disabled
                                    className="bg-muted cursor-not-allowed"
                                    readOnly
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Heart Rate (bpm)</Label>
                                  <Input
                                    value={latestVitals.heartRate ? `${latestVitals.heartRate} bpm` : 'Not recorded'}
                                    disabled
                                    className="bg-muted cursor-not-allowed"
                                    readOnly
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Temperature (°F)</Label>
                                  <Input
                                    value={latestVitals.temperature ? `${latestVitals.temperature}°F` : 'Not recorded'}
                                    disabled
                                    className="bg-muted cursor-not-allowed"
                                    readOnly
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Oxygen Saturation (%)</Label>
                                  <Input
                                    value={latestVitals.oxygenSaturation ? `${latestVitals.oxygenSaturation}%` : 'Not recorded'}
                                    disabled
                                    className="bg-muted cursor-not-allowed"
                                    readOnly
                                  />
                                </div>
                                {latestVitals.respiratoryRate && (
                                  <div className="space-y-2 col-span-2">
                                    <Label>Respiratory Rate (breaths/min)</Label>
                                    <Input
                                      value={`${latestVitals.respiratoryRate} breaths/min`}
                                      disabled
                                      className="bg-muted cursor-not-allowed"
                                      readOnly
                                    />
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    Last recorded: {latestVitals.date} at {latestVitals.time} by {latestVitals.recordedBy}
                                  </span>
                                </div>
                                {latestVitals.notes && (
                                  <div className="mt-2">
                                    <span className="font-medium">Notes:</span> {latestVitals.notes}
                                  </div>
                                )}
                              </div>
                              
                              {/* Vital Signs History for Doctor */}
                              <div className="mt-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-sm font-medium text-muted-foreground">Recent Vital Signs History</h4>
                                  <Badge variant="outline" className="text-xs">
                                    Last 5 recordings
                                  </Badge>
                                </div>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {(() => {
                                    const recentVitals = (vitalSignsCache[selectedPatient.id.toString()] || [])
                                      .slice(0, 5); // Show last 5 recordings
                                    
                                    if (recentVitals.length <= 1) {
                                      return (
                                        <p className="text-xs text-muted-foreground text-center py-2">
                                          No additional vital signs history available
                                        </p>
                                      );
                                    }
                                    
                                    return recentVitals.slice(1).map((vital, index) => (
                                      <div key={vital.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                                        <div className="flex items-center gap-4">
                                          <span className="font-medium">{vital.date} {vital.time}</span>
                                          <span>BP: {vital.bloodPressure}</span>
                                          <span>HR: {vital.heartRate}</span>
                                          <span>Temp: {vital.temperature}°F</span>
                                          {vital.oxygenSaturation && <span>O2: {vital.oxygenSaturation}%</span>}
                                        </div>
                                        <span className="text-muted-foreground">{vital.recordedBy}</span>
                                      </div>
                                    ));
                                  })()}
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Medications */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Pill className="h-5 w-5" />
                            Medications
                          </CardTitle>
                          <Button 
                            onClick={handleAddMedication} 
                            size="sm" 
                            variant="outline"
                            disabled={isPatientDischarged(selectedPatient)}
                          >
                            Add Medication
                          </Button>
                        </div>
                        {isPatientDischarged(selectedPatient) && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              This patient has been discharged. Medical records are now read-only.
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {conditionForm.medications.length === 0 ? (
                          <p className="text-muted-foreground text-center py-4">
                            No medications prescribed. Click "Add Medication" to add one.
                          </p>
                        ) : (
                          conditionForm.medications.map((medication) => (
                            <Card key={medication.id} className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <Input
                                    value={medication.name}
                                    onChange={(e) => handleUpdateMedication(medication.id, 'name', e.target.value)}
                                    placeholder="Medication name"
                                    className="flex-1 mr-2"
                                  />
                                  <Button
                                    onClick={() => handleRemoveMedication(medication.id)}
                                    size="sm"
                                    variant="destructive"
                                  >
                                    Remove
                                  </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    value={medication.dosage}
                                    onChange={(e) => handleUpdateMedication(medication.id, 'dosage', e.target.value)}
                                    placeholder="Dosage (e.g., 500mg)"
                                  />
                                  <Select
                                    value={medication.frequency}
                                    onValueChange={(value) => handleUpdateMedication(medication.id, 'frequency', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select frequency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Once daily">Once daily</SelectItem>
                                      <SelectItem value="Twice daily">Twice daily</SelectItem>
                                      <SelectItem value="3 times daily">3 times daily</SelectItem>
                                      <SelectItem value="4 times daily">4 times daily</SelectItem>
                                      <SelectItem value="As needed">As needed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Textarea
                                  value={medication.notes || ''}
                                  onChange={(e) => handleUpdateMedication(medication.id, 'notes', e.target.value)}
                                  placeholder="Special instructions or notes..."
                                  rows={2}
                                />
                              </div>
                            </Card>
                          ))
                        )}
                      </CardContent>
                    </Card>

                    {/* Discharge Recommendation */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          Discharge Recommendation
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Recommendation</Label>
                          <Select
                            value={conditionForm.dischargeRecommendation}
                            onValueChange={(value: 'continue' | 'discharge') => 
                              setConditionForm(prev => ({ ...prev, dischargeRecommendation: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="continue">Continue Treatment</SelectItem>
                              <SelectItem value="discharge">Ready for Discharge</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {conditionForm.dischargeRecommendation !== 'continue' && (
                          <div className="space-y-2">
                            <Label htmlFor="dischargeNotes">Discharge Notes</Label>
                            <Textarea
                              id="dischargeNotes"
                              value={conditionForm.dischargeNotes || ''}
                              onChange={(e) => setConditionForm(prev => ({ ...prev, dischargeNotes: e.target.value }))}
                              placeholder="Reason for discharge, follow-up instructions..."
                              rows={3}
                            />
                          </div>
                        )}

                        {conditionForm.dischargeRecommendation === 'discharge' && (
                          <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>
                              Patient will be marked as ready for discharge. Administration will be notified.
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>

                    {/* Save Button */}
                    <Button 
                      onClick={handleSaveCondition} 
                      disabled={isUpdating || isPatientDischarged(selectedPatient)}
                      className="w-full"
                      size="lg"
                    >
                      {isUpdating ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {isPatientDischarged(selectedPatient) ? 'Patient Discharged - Read Only' : 'Save Patient Assessment'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <User className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Patient Selected</h3>
                  <p className="text-muted-foreground text-center">
                    Select a patient from the patients tab to view and update their condition.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Total Patients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{doctorPatients.length}</div>
                  <p className="text-muted-foreground">Under your care</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Ready for Discharge
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {doctorPatients.filter(p => getPatientCondition(p.id.toString())?.dischargeRecommendation === 'discharge').length}
                  </div>
                  <p className="text-muted-foreground">Patients recommended</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Needs Review
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {doctorPatients.filter(p => getConditionStatus(p) === 'needs-update').length}
                  </div>
                  <p className="text-muted-foreground">Patients need assessment</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Nurse Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {doctorPatients.reduce((total, patient) => 
                      total + getUnreviewedReports(patient.id.toString()).length, 0
                    )}
                  </div>
                  <p className="text-muted-foreground">Pending review</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Patient Updates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {doctorPatients
                      .filter(patient => getPatientCondition(patient.id.toString()))
                      .sort((a, b) => {
                        const conditionA = getPatientCondition(a.id.toString());
                        const conditionB = getPatientCondition(b.id.toString());
                        return new Date(conditionB.date).getTime() - new Date(conditionA.date).getTime();
                      })
                      .slice(0, 5)
                      .map((patient) => {
                        const condition = getPatientCondition(patient.id.toString());
                        if (!condition) return null;
                        
                        return (
                          <div key={patient.id} className="flex items-center gap-3 p-3 rounded-lg border">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                              {patient.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{patient.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Condition updated on {new Date(condition.date).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant={condition.dischargeRecommendation === 'discharge' ? 'default' : 'secondary'}>
                              {condition.dischargeRecommendation === 'discharge' ? 'Discharge Ready' : 'In Treatment'}
                            </Badge>
                          </div>
                        );
                      })}
                    
                    {doctorPatients.filter(p => getPatientCondition(p.id.toString())).length === 0 && (
                      <p className="text-muted-foreground text-center py-8">
                        No recent activity. Start by assessing your patients.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Nurse Reports Needing Review
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {doctorPatients
                      .flatMap(patient => 
                        getUnreviewedReports(patient.id.toString()).map(report => ({ ...report, patient }))
                      )
                      .sort((a, b) => {
                        // Sort by urgency first (high -> medium -> low), then by date/time
                        const urgencyOrder = { high: 3, medium: 2, low: 1 };
                        if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
                          return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
                        }
                        return `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`);
                      })
                      .slice(0, 5)
                      .map((report) => (
                        <div key={report.id} className="flex items-center gap-3 p-3 rounded-lg border border-orange-200 bg-orange-50">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-700 font-semibold text-sm">
                            {report.patient.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{report.patient.name}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {report.conditionUpdate}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(report.date).toLocaleDateString()} {report.time} by {report.reportedBy}
                            </p>
                          </div>
                          <Badge 
                            variant={
                              report.urgency === 'high' ? 'destructive' :
                              report.urgency === 'medium' ? 'default' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {report.urgency}
                          </Badge>
                        </div>
                      ))}
                    
                    {doctorPatients.every(p => getUnreviewedReports(p.id.toString()).length === 0) && (
                      <p className="text-muted-foreground text-center py-8">
                        No pending nurse reports. All reports have been reviewed.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}