import { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Heart, 
  Users, 
  User, 
  Calendar, 
  Pill, 
  Activity, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Save,
  Eye,
  Thermometer,
  Zap,
  FileText
} from 'lucide-react';
import { StaffMember, Patient } from '@/types';
import { toast } from 'sonner';

interface NurseDetailsDialogProps {
  nurse: StaffMember;
  trigger?: React.ReactNode;
}

interface VitalSigns {
  id: string;
  patientId: string;
  date: string;
  time: string;
  bloodPressure: string;
  heartRate: string;
  temperature: string;
  oxygenSaturation: string;
  respiratoryRate: string;
  notes?: string;
  recordedBy: string;
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
interface MedicationAdministration {
  id: string;
  patientId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  administeredTime?: string;
  administered: boolean;
  notes?: string;
  administeredBy?: string;
}

export function NurseDetailsDialog({ nurse, trigger }: NurseDetailsDialogProps) {
  const { 
    patients, 
    getStaffPatients, 
    createVitalSigns,
    createNurseReportAPI,
    getVitalSignsByPatient,
    getMedicationAdministrationsByPatient,
    administerMedicationAPI,
    getNurseReportsByPatientAPI
  } = useData();
  const [open, setOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState('patients');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Get patients assigned to this nurse (doctors only have permanent assignments)
  const nursePatients = getStaffPatients(nurse.id.toString());

  // Helper function to check if patient is discharged
  const isPatientDischarged = (patient: Patient | null): boolean => {
    return patient?.status === 'discharged';
  };

  // Mock data - in real app, this would come from API
  const [vitalSigns, setVitalSigns] = useState<Record<string, VitalSigns[]>>({});
  const [medicationAdministrations, setMedicationAdministrations] = useState<Record<string, MedicationAdministration[]>>({});
  
  const [vitalForm, setVitalForm] = useState<Omit<VitalSigns, 'id' | 'patientId' | 'recordedBy'>>({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    oxygenSaturation: '',
    respiratoryRate: '',
    notes: ''
  });

  const [conditionForm, setConditionForm] = useState<Omit<PatientConditionReport, 'id' | 'patientId' | 'reportedBy' | 'reviewedByDoctor' | 'doctorResponse'>>({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    conditionUpdate: '',
    symptoms: [],
    painLevel: 0,
    notes: '',
    urgency: 'medium'
  });

  const handlePatientSelect = async (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveTab('vitals');
    
    // Reset forms
    setVitalForm({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      oxygenSaturation: '',
      respiratoryRate: '',
      notes: ''
    });

    setConditionForm({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      conditionUpdate: '',
      symptoms: [],
      painLevel: 0,
      notes: '',
      urgency: 'medium'
    });

    // Always refresh patient data when selecting a patient
    console.log('Loading fresh data for patient:', patient.name);
    
    try {
      await Promise.all([
        getPatientVitals(patient),
        getPatientMedications(patient),
        getPatientReports(patient)
      ]);
      console.log('Successfully loaded all patient data including vital signs records');
    } catch (error) {
      console.error('Error loading patient data:', error);
      toast.error('Failed to load patient data');
    }
  };

  // Load vital signs for all patients on mount
  useEffect(() => {
    const loadPatientData = async () => {
      if (!open || nursePatients.length === 0) return;
      
      console.log('Loading data for', nursePatients.length, 'patients');
      
      try {
        for (const patient of nursePatients) {
          console.log('Loading data for patient:', patient.name);
          
          // Load vitals
          try {
            await getPatientVitals(patient);
          } catch (error) {
            console.error(`Failed to load vitals for ${patient.name}:`, error);
          }
          
          // Load medications
          try {
            await getPatientMedications(patient);
          } catch (error) {
            console.error(`Failed to load medications for ${patient.name}:`, error);
          }
          
          // Load reports
          try {
            await getPatientReports(patient);
          } catch (error) {
            console.error(`Failed to load reports for ${patient.name}:`, error);
          }
        }
      } catch (error) {
        console.error('Error loading patient data:', error);
      }
    };
    
    loadPatientData();
  }, [nursePatients.length, open]); // Only depend on length and open state

  const handleSaveVitals = async () => {
    if (!selectedPatient) return;
    
    // Validate required fields
    if (!vitalForm.bloodPressure || !vitalForm.heartRate || !vitalForm.temperature) {
      toast.error('Please fill in all required vital signs (Blood Pressure, Heart Rate, Temperature)');
      return;
    }

    // Validate blood pressure format
    const bpRegex = /^\d{2,3}\/\d{2,3}$/;
    if (!bpRegex.test(vitalForm.bloodPressure)) {
      toast.error('Blood pressure must be in format XXX/XX (e.g., 120/80)');
      return;
    }

    // Validate heart rate (should be a number)
    if (isNaN(Number(vitalForm.heartRate)) || Number(vitalForm.heartRate) < 30 || Number(vitalForm.heartRate) > 200) {
      toast.error('Heart rate must be a number between 30 and 200');
      return;
    }

    // Validate temperature (should be a number)
    if (isNaN(Number(vitalForm.temperature)) || Number(vitalForm.temperature) < 90 || Number(vitalForm.temperature) > 110) {
      toast.error('Temperature must be a number between 90 and 110°F');
      return;
    }

    // Ensure time is set, default to current time if empty
    const timeToSend = vitalForm.time || new Date().toTimeString().slice(0, 5);

    setIsUpdating(true);
    try {
      console.log('Recording vital signs for patient:', selectedPatient.name);
      
      await createVitalSigns({
        patientId: Number(selectedPatient.id),
        date: vitalForm.date,
        time: timeToSend,
        bloodPressure: vitalForm.bloodPressure,
        heartRate: vitalForm.heartRate,
        temperature: vitalForm.temperature,
        oxygenSaturation: vitalForm.oxygenSaturation,
        respiratoryRate: vitalForm.respiratoryRate,
        notes: vitalForm.notes,
        recordedBy: nurse.name,
      });
      
      console.log('Vital signs recorded successfully');
      
      // Refresh vital signs cache
      await getPatientVitals(selectedPatient);
      
      // Reset form
      setVitalForm({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        bloodPressure: '',
        heartRate: '',
        temperature: '',
        oxygenSaturation: '',
        respiratoryRate: '',
        notes: ''
      });
      
      toast.success(`Vital signs recorded successfully for ${selectedPatient.name}`);
    } catch (error) {
      console.error('Failed to record vital signs:', error);
      toast.error('Failed to record vital signs. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveConditionReport = async () => {
    if (!selectedPatient) return;
    
    // Enhanced validation
    if (!conditionForm.conditionUpdate.trim()) {
      toast.error('Please describe the condition update');
      return;
    }

    if (conditionForm.conditionUpdate.trim().length < 10) {
      toast.error('Condition update must be at least 10 characters long');
      return;
    }

    if (conditionForm.urgency === 'high' && !conditionForm.notes.trim()) {
      toast.error('High urgency reports require additional notes');
      return;
    }

    // Ensure time is set, default to current time if empty
    const timeToSend = conditionForm.time || new Date().toTimeString().slice(0, 5);

    setIsUpdating(true);
    try {
      console.log('Submitting condition report for patient:', selectedPatient.name);
      
      await createNurseReportAPI({
        patientId: Number(selectedPatient.id),
        reportedBy: nurse.name,
        date: conditionForm.date,
        time: timeToSend,
        conditionUpdate: conditionForm.conditionUpdate.trim(),
        symptoms: conditionForm.symptoms,
        painLevel: conditionForm.painLevel,
        notes: conditionForm.notes.trim(),
        urgency: conditionForm.urgency,
      });
      
      console.log('Condition report submitted successfully');
      
      // Refresh reports cache
      await getPatientReports(selectedPatient);
      
      // Reset form
      setConditionForm({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        conditionUpdate: '',
        symptoms: [],
        painLevel: 0,
        notes: '',
        urgency: 'medium'
      });
      
      toast.success(`Condition report submitted to doctor for ${selectedPatient.name}`);
      
      if (conditionForm.urgency === 'high') {
        toast.warning('High urgency report - Doctor will be notified immediately');
      }
    } catch (error) {
      console.error('Failed to submit condition report:', error);
      toast.error('Failed to submit condition report. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSymptomToggle = (symptom: string) => {
    setConditionForm(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  const commonSymptoms = [
    'Pain', 'Nausea', 'Dizziness', 'Fatigue', 'Shortness of breath',
    'Fever', 'Headache', 'Confusion', 'Anxiety', 'Difficulty sleeping'
  ];
  const handleMedicationAdministration = async (medicationId: string, administered: boolean) => {
    if (!selectedPatient) return;
    
    try {
      if (administered) {
        await administerMedicationAPI(Number(medicationId), nurse.name);
        toast.success(`Medication administered to ${selectedPatient.name}`);
      } else {
        // For now, we'll just show a message since we don't have an "unadminister" API
        toast.info(`Medication administration cancelled`);
      }
      
      // Refresh the medication list
      await getPatientMedications(selectedPatient);
    } catch (error) {
      toast.error('Failed to update medication administration');
    }
  };

  // API-based functions to replace mock data
  const [vitalSignsCache, setVitalSignsCache] = useState<Record<string, VitalSigns[]>>({});
  const [medicationAdministrationsCache, setMedicationAdministrationsCache] = useState<Record<string, MedicationAdministration[]>>({});
  const [nurseReportsCache, setNurseReportsCache] = useState<Record<string, any[]>>({});

  const getPatientVitals = async (patient: Patient): Promise<VitalSigns[]> => {
    try {
      const patientId = Number(patient.id);
      console.log(`Loading vitals for patient ${patient.name} (ID: ${patientId})`);
      
      const vitals = await getVitalSignsByPatient(patientId);
      console.log(`Found ${vitals.length} vital signs for ${patient.name}:`, vitals);
      
      // Convert API format to component format
      const formattedVitals = vitals.map(vital => ({
        id: vital.id.toString(),
        patientId: vital.patientId.toString(),
        date: vital.date,
        time: vital.time,
        bloodPressure: vital.bloodPressure,
        heartRate: vital.heartRate,
        temperature: vital.temperature,
        oxygenSaturation: vital.oxygenSaturation || '',
        respiratoryRate: vital.respiratoryRate || '',
        notes: vital.notes || '',
        recordedBy: vital.recordedBy,
      }));
      
      setVitalSignsCache(prev => ({
        ...prev,
        [patient.id.toString()]: formattedVitals
      }));
      
      return formattedVitals;
    } catch (error) {
      console.error('Failed to get patient vitals:', error);
      return [];
    }
  };

  const getTodayVitals = (patient: Patient): VitalSigns[] => {
    const cachedVitals = vitalSignsCache[patient.id.toString()] || [];
    const today = new Date().toISOString().split('T')[0];
    return cachedVitals.filter(vital => vital.date === today);
  };

  const getPatientMedications = async (patient: Patient): Promise<MedicationAdministration[]> => {
    try {
      const patientId = Number(patient.id);
      const today = new Date().toISOString().split('T')[0];
      console.log(`Loading medications for patient ${patient.name} (ID: ${patientId}) for date: ${today}`);
      
      const administrations = await getMedicationAdministrationsByPatient(patientId, today);
      console.log(`Found ${administrations.length} medication administrations for ${patient.name}:`, administrations);
      
      setMedicationAdministrationsCache(prev => ({
        ...prev,
        [patient.id.toString()]: administrations
      }));
      
      return administrations;
    } catch (error) {
      console.error('Failed to get patient medications:', error);
      return [];
    }
  };

  const getPatientReports = async (patient: Patient) => {
    try {
      const reports = await getNurseReportsByPatientAPI(Number(patient.id));
      setNurseReportsCache(prev => ({
        ...prev,
        [patient.id.toString()]: reports
      }));
      return reports;
    } catch (error) {
      console.error('Failed to get patient reports:', error);
      return [];
    }
  };

  const getVitalStatus = (patient: Patient) => {
    const cachedVitals = vitalSignsCache[patient.id.toString()] || [];
    const today = new Date().toISOString().split('T')[0];
    const todayVitals = cachedVitals.filter(vital => vital.date === today);
    
    if (todayVitals.length === 0) return 'pending';
    
    const lastVital = todayVitals[todayVitals.length - 1];
    const lastTime = new Date(`${lastVital.date}T${lastVital.time}`);
    const now = new Date();
    const hoursSince = (now.getTime() - lastTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursSince < 4) return 'recent';
    if (hoursSince < 8) return 'due';
    return 'overdue';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recent': return 'bg-green-100 text-green-800';
      case 'due': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'recent': return 'Recently Checked';
      case 'due': return 'Due Soon';
      case 'overdue': return 'Overdue';
      default: return 'Pending';
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
            <Heart className="h-5 w-5" />
            {nurse.name} - Nurse Dashboard
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="patients" className="gap-2">
              <Users className="h-4 w-4" />
              My Patients ({nursePatients.length})
            </TabsTrigger>
            <TabsTrigger value="vitals" disabled={!selectedPatient || isPatientDischarged(selectedPatient)} className="gap-2">
              <Activity className="h-4 w-4" />
              Vital Signs
            </TabsTrigger>
            <TabsTrigger value="records" disabled={!selectedPatient} className="gap-2">
              <FileText className="h-4 w-4" />
              Records
            </TabsTrigger>
            <TabsTrigger value="condition" disabled={!selectedPatient || isPatientDischarged(selectedPatient)} className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Condition Report
            </TabsTrigger>
            <TabsTrigger value="medications" disabled={!selectedPatient || isPatientDischarged(selectedPatient)} className="gap-2">
              <Pill className="h-4 w-4" />
              Medications
            </TabsTrigger>
            <TabsTrigger value="overview" className="gap-2">
              <Thermometer className="h-4 w-4" />
              Overview
            </TabsTrigger>
          </TabsList>

          {/* Patients List Tab */}
          <TabsContent value="patients" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Today's Assigned Patients</h3>
              <Badge variant="outline">
                {nursePatients.length} patients assigned
              </Badge>
            </div>

            {nursePatients.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Patients Assigned</h3>
                  <p className="text-muted-foreground text-center">
                    No patients are currently assigned to you for today.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nursePatients.map((patient) => {
                  const vitalStatus = getVitalStatus(patient);
                  const todayVitals = getTodayVitals(patient);
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
                          <Badge className={getStatusColor(vitalStatus)}>
                            {getStatusText(vitalStatus)}
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
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Vitals Today:</span>
                          <span className="font-medium">
                            {todayVitals.length} recordings
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Pill className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Medications:</span>
                          <span className="font-medium">
                            {(medicationAdministrationsCache[patient.id.toString()] || []).filter(m => m.administered).length}/
                            {(medicationAdministrationsCache[patient.id.toString()] || []).length} given
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Reports:</span>
                          <span className="font-medium">
                            {(nurseReportsCache[patient.id.toString()] || []).length} total
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Vital Signs Tab */}
          <TabsContent value="vitals" className="space-y-6">
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
                  {/* Vital Signs Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Record Vital Signs
                      </CardTitle>
                      {isPatientDischarged(selectedPatient) && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            This patient has been discharged. Vital signs recording is now disabled.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="date">Date</Label>
                          <Input
                            id="date"
                            type="date"
                            value={vitalForm.date}
                            onChange={(e) => setVitalForm(prev => ({ ...prev, date: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="time">Time <span className="text-xs text-muted-foreground">(optional - defaults to current time)</span></Label>
                          <Input
                            id="time"
                            type="time"
                            value={vitalForm.time}
                            onChange={(e) => setVitalForm(prev => ({ ...prev, time: e.target.value }))}
                            placeholder="Current time will be used if empty"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="bp">Blood Pressure * <span className="text-xs text-muted-foreground">(e.g., 120/80)</span></Label>
                          <Input
                            id="bp"
                            value={vitalForm.bloodPressure}
                            onChange={(e) => setVitalForm(prev => ({ ...prev, bloodPressure: e.target.value }))}
                            placeholder="120/80"
                            pattern="\d{2,3}/\d{2,3}"
                            required
                            className="focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="hr">Heart Rate * <span className="text-xs text-muted-foreground">(30-200 bpm)</span></Label>
                          <Input
                            id="hr"
                            type="number"
                            min="30"
                            max="200"
                            value={vitalForm.heartRate}
                            onChange={(e) => setVitalForm(prev => ({ ...prev, heartRate: e.target.value }))}
                            placeholder="72"
                            required
                            className="focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="temp">Temperature * <span className="text-xs text-muted-foreground">(90-110°F)</span></Label>
                          <Input
                            id="temp"
                            type="number"
                            step="0.1"
                            min="90"
                            max="110"
                            value={vitalForm.temperature}
                            onChange={(e) => setVitalForm(prev => ({ ...prev, temperature: e.target.value }))}
                            placeholder="98.6"
                            required
                            className="focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="o2">Oxygen Saturation <span className="text-xs text-muted-foreground">(70-100%)</span></Label>
                          <Input
                            id="o2"
                            type="number"
                            min="70"
                            max="100"
                            value={vitalForm.oxygenSaturation}
                            onChange={(e) => setVitalForm(prev => ({ ...prev, oxygenSaturation: e.target.value }))}
                            placeholder="98"
                            className="focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="rr">Respiratory Rate <span className="text-xs text-muted-foreground">(8-40 breaths/min)</span></Label>
                          <Input
                            id="rr"
                            type="number"
                            min="8"
                            max="40"
                            value={vitalForm.respiratoryRate}
                            onChange={(e) => setVitalForm(prev => ({ ...prev, respiratoryRate: e.target.value }))}
                            placeholder="16"
                            className="focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={vitalForm.notes}
                          onChange={(e) => setVitalForm(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Any observations or notes..."
                          rows={3}
                        />
                      </div>

                      <Button 
                        onClick={handleSaveVitals} 
                        disabled={isUpdating || isPatientDischarged(selectedPatient)}
                        className="w-full"
                      >
                        {isUpdating ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Recording...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {isPatientDischarged(selectedPatient) ? 'Patient Discharged - Read Only' : 'Record Vital Signs'}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Vital Signs History */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Thermometer className="h-5 w-5" />
                        Today's Vital Signs
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(() => {
                          const todayVitals = (vitalSignsCache[selectedPatient.id.toString()] || [])
                            .filter(vital => vital.date === new Date().toISOString().split('T')[0])
                            .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));
                          
                          if (todayVitals.length === 0) {
                            return (
                              <div className="text-center py-8">
                                <Thermometer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No vital signs recorded today.</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                  Use the form on the left to record vital signs.
                                </p>
                              </div>
                            );
                          }
                          
                          return todayVitals.map((vital) => (
                            <Card key={vital.id} className="p-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{vital.time}</span>
                                  <Badge variant="outline">
                                    By {vital.recordedBy}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>BP: <span className="font-medium">{vital.bloodPressure}</span></div>
                                  <div>HR: <span className="font-medium">{vital.heartRate} bpm</span></div>
                                  <div>Temp: <span className="font-medium">{vital.temperature}°F</span></div>
                                  <div>O2: <span className="font-medium">{vital.oxygenSaturation || 'N/A'}%</span></div>
                                </div>
                                {vital.notes && (
                                  <p className="text-sm text-muted-foreground italic">
                                    {vital.notes}
                                  </p>
                                )}
                              </div>
                            </Card>
                          ));
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <User className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Patient Selected</h3>
                  <p className="text-muted-foreground text-center">
                    Select a patient from the patients tab to record vital signs.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Records Tab - View All Vital Signs Records */}
          <TabsContent value="records" className="space-y-6">
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
                          <p className="text-sm text-muted-foreground">
                            Vital Signs Records History
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={() => getPatientVitals(selectedPatient)} 
                          variant="outline" 
                          size="sm"
                          className="gap-2"
                        >
                          <Activity className="h-4 w-4" />
                          Refresh
                        </Button>
                        <Button onClick={() => setActiveTab('patients')} variant="outline">
                          Back to Patients
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* All Vital Signs Records */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        All Vital Signs Records
                      </CardTitle>
                      <Badge variant="outline">
                        {(vitalSignsCache[selectedPatient.id.toString()] || []).length} total records
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(() => {
                        const allVitals = (vitalSignsCache[selectedPatient.id.toString()] || [])
                          .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));
                        
                        if (allVitals.length === 0) {
                          return (
                            <div className="text-center py-12">
                              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-foreground mb-2">No Records Found</h3>
                              <p className="text-muted-foreground">
                                No vital signs have been recorded for this patient yet.
                              </p>
                              <Button 
                                onClick={() => setActiveTab('vitals')} 
                                className="mt-4"
                                variant="outline"
                              >
                                Record Vital Signs
                              </Button>
                            </div>
                          );
                        }
                        
                        return (
                          <div className="space-y-4 max-h-96 overflow-y-auto">
                            {allVitals.map((vital, index) => {
                              const isToday = vital.date === new Date().toISOString().split('T')[0];
                              const isRecent = index < 3; // Last 3 records
                              
                              return (
                                <Card 
                                  key={vital.id} 
                                  className={`p-4 transition-all hover:shadow-md ${
                                    isToday ? 'border-blue-200 bg-blue-50' : 
                                    isRecent ? 'border-green-200 bg-green-50' : ''
                                  }`}
                                >
                                  <div className="space-y-3">
                                    {/* Header with date, time, and badges */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                          <Calendar className="h-4 w-4 text-muted-foreground" />
                                          <span className="font-medium">
                                            {new Date(vital.date).toLocaleDateString('en-US', {
                                              weekday: 'short',
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric'
                                            })}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Clock className="h-4 w-4 text-muted-foreground" />
                                          <span className="font-medium">{vital.time}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {isToday && (
                                          <Badge className="bg-blue-100 text-blue-800">
                                            Today
                                          </Badge>
                                        )}
                                        {isRecent && !isToday && (
                                          <Badge className="bg-green-100 text-green-800">
                                            Recent
                                          </Badge>
                                        )}
                                        <Badge variant="outline" className="text-xs">
                                          Record #{allVitals.length - index}
                                        </Badge>
                                      </div>
                                    </div>
                                    
                                    {/* Vital Signs Data Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Blood Pressure</Label>
                                        <div className="flex items-center gap-2">
                                          <Heart className="h-4 w-4 text-red-500" />
                                          <span className="font-medium">{vital.bloodPressure}</span>
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Heart Rate</Label>
                                        <div className="flex items-center gap-2">
                                          <Activity className="h-4 w-4 text-pink-500" />
                                          <span className="font-medium">{vital.heartRate} bpm</span>
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Temperature</Label>
                                        <div className="flex items-center gap-2">
                                          <Thermometer className="h-4 w-4 text-orange-500" />
                                          <span className="font-medium">{vital.temperature}°F</span>
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Oxygen Sat.</Label>
                                        <div className="flex items-center gap-2">
                                          <Zap className="h-4 w-4 text-blue-500" />
                                          <span className="font-medium">
                                            {vital.oxygenSaturation ? `${vital.oxygenSaturation}%` : 'N/A'}
                                          </span>
                                        </div>
                                      </div>
                                      {vital.respiratoryRate && (
                                        <div className="space-y-1 col-span-2">
                                          <Label className="text-xs text-muted-foreground">Respiratory Rate</Label>
                                          <div className="flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-teal-500" />
                                            <span className="font-medium">{vital.respiratoryRate} breaths/min</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Notes Section */}
                                    {vital.notes && (
                                      <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Notes</Label>
                                        <p className="text-sm bg-gray-50 p-2 rounded italic">
                                          "{vital.notes}"
                                        </p>
                                      </div>
                                    )}
                                    
                                    {/* Footer with recorder info */}
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <User className="h-3 w-3" />
                                        <span>Recorded by {vital.recordedBy}</span>
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {(() => {
                                          const recordDate = new Date(`${vital.date}T${vital.time}`);
                                          const now = new Date();
                                          const diffHours = Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 60 * 60));
                                          
                                          if (diffHours < 1) return 'Just recorded';
                                          if (diffHours < 24) return `${diffHours} hours ago`;
                                          const diffDays = Math.floor(diffHours / 24);
                                          return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                                        })()}
                                      </div>
                                    </div>
                                  </div>
                                </Card>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Today's Records</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {(vitalSignsCache[selectedPatient.id.toString()] || [])
                          .filter(vital => vital.date === new Date().toISOString().split('T')[0]).length}
                      </div>
                      <p className="text-xs text-muted-foreground">Vital signs recorded today</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {(vitalSignsCache[selectedPatient.id.toString()] || []).length}
                      </div>
                      <p className="text-xs text-muted-foreground">All time vital signs</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Last Recorded</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm font-bold">
                        {(() => {
                          const vitals = vitalSignsCache[selectedPatient.id.toString()] || [];
                          if (vitals.length === 0) return 'Never';
                          const latest = vitals[0];
                          return `${latest.date} ${latest.time}`;
                        })()}
                      </div>
                      <p className="text-xs text-muted-foreground">Most recent entry</p>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Patient Selected</h3>
                  <p className="text-muted-foreground text-center">
                    Select a patient from the patients tab to view their vital signs records.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Condition Report Tab */}
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
                          <p className="text-sm text-muted-foreground">
                            Condition Report - {new Date().toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button onClick={() => setActiveTab('patients')} variant="outline">
                        Back to Patients
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Condition Report Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Report Condition Change
                      </CardTitle>
                      {isPatientDischarged(selectedPatient) && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            This patient has been discharged. Condition reporting is now disabled.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="conditionDate">Date</Label>
                          <Input
                            id="conditionDate"
                            type="date"
                            value={conditionForm.date}
                            onChange={(e) => setConditionForm(prev => ({ ...prev, date: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="conditionTime">Time <span className="text-xs text-muted-foreground">(optional - defaults to current time)</span></Label>
                          <Input
                            id="conditionTime"
                            type="time"
                            value={conditionForm.time}
                            onChange={(e) => setConditionForm(prev => ({ ...prev, time: e.target.value }))}
                            placeholder="Current time will be used if empty"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="conditionUpdate">Condition Update * <span className="text-xs text-muted-foreground">(min. 10 characters)</span></Label>
                        <Textarea
                          id="conditionUpdate"
                          value={conditionForm.conditionUpdate}
                          onChange={(e) => setConditionForm(prev => ({ ...prev, conditionUpdate: e.target.value }))}
                          placeholder="Describe the patient's current condition, any changes observed, behavior, appetite, mobility, etc..."
                          rows={4}
                          required
                          className={`focus:ring-2 focus:ring-blue-500 ${
                            conditionForm.conditionUpdate.length > 0 && conditionForm.conditionUpdate.length < 10 
                              ? 'border-red-300 focus:border-red-500' 
                              : ''
                          }`}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            {conditionForm.conditionUpdate.length < 10 && conditionForm.conditionUpdate.length > 0
                              ? `Need ${10 - conditionForm.conditionUpdate.length} more characters`
                              : 'Provide detailed observations'
                            }
                          </span>
                          <span>{conditionForm.conditionUpdate.length} characters</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Observed Symptoms</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {commonSymptoms.map((symptom) => (
                            <div
                              key={symptom}
                              className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                                conditionForm.symptoms.includes(symptom)
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50'
                              }`}
                              onClick={() => handleSymptomToggle(symptom)}
                            >
                              <Checkbox
                                checked={conditionForm.symptoms.includes(symptom)}
                                onChange={() => handleSymptomToggle(symptom)}
                              />
                              <Label className="cursor-pointer text-sm">{symptom}</Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="painLevel">Pain Level (0-10)</Label>
                        <Input
                          id="painLevel"
                          type="number"
                          min="0"
                          max="10"
                          value={conditionForm.painLevel || ''}
                          onChange={(e) => setConditionForm(prev => ({ ...prev, painLevel: parseInt(e.target.value) || 0 }))}
                          placeholder="0 = No pain, 10 = Severe pain"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="urgency">Urgency Level</Label>
                        <Select
                          value={conditionForm.urgency}
                          onValueChange={(value: 'low' | 'medium' | 'high') => 
                            setConditionForm(prev => ({ ...prev, urgency: value }))
                          }
                        >
                          <SelectTrigger className={`focus:ring-2 ${
                            conditionForm.urgency === 'high' ? 'border-red-300 focus:border-red-500' :
                            conditionForm.urgency === 'medium' ? 'border-yellow-300 focus:border-yellow-500' :
                            'border-green-300 focus:border-green-500'
                          }`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low" className="text-green-700">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                Low - Routine follow-up
                              </div>
                            </SelectItem>
                            <SelectItem value="medium" className="text-yellow-700">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                Medium - Doctor review needed
                              </div>
                            </SelectItem>
                            <SelectItem value="high" className="text-red-700">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                High - Immediate attention required
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {conditionForm.urgency === 'high' && (
                          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                            ⚠️ High urgency reports require additional notes and will notify the doctor immediately.
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="conditionNotes">
                          Additional Notes
                          {conditionForm.urgency === 'high' && <span className="text-red-500"> *</span>}
                        </Label>
                        <Textarea
                          id="conditionNotes"
                          value={conditionForm.notes}
                          onChange={(e) => setConditionForm(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder={
                            conditionForm.urgency === 'high' 
                              ? "High urgency reports require detailed notes. Describe what makes this urgent, immediate concerns, actions taken..."
                              : "Any additional observations, patient concerns, or recommendations..."
                          }
                          rows={conditionForm.urgency === 'high' ? 4 : 3}
                          className={`focus:ring-2 focus:ring-blue-500 ${
                            conditionForm.urgency === 'high' && !conditionForm.notes.trim()
                              ? 'border-red-300 focus:border-red-500'
                              : ''
                          }`}
                        />
                        {conditionForm.urgency === 'high' && !conditionForm.notes.trim() && (
                          <div className="text-xs text-red-600">
                            Additional notes are required for high urgency reports
                          </div>
                        )}
                      </div>

                      <Button 
                        onClick={handleSaveConditionReport} 
                        disabled={isUpdating || isPatientDischarged(selectedPatient)}
                        className="w-full"
                      >
                        {isUpdating ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {isPatientDischarged(selectedPatient) ? 'Patient Discharged - Read Only' : 'Submit Report to Doctor'}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Previous Reports */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        All Condition Reports
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(nurseReportsCache[selectedPatient.id.toString()] || []).length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">
                            No condition reports submitted yet.
                          </p>
                        ) : (
                          (nurseReportsCache[selectedPatient.id.toString()] || [])
                            .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))
                            .map((report) => (
                              <Card key={report.id} className="p-4">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">
                                        {new Date(report.date).toLocaleDateString()} {report.time}
                                      </span>
                                      <Badge 
                                        variant={
                                          report.urgency === 'high' ? 'destructive' :
                                          report.urgency === 'medium' ? 'default' : 'secondary'
                                        }
                                      >
                                        {report.urgency} urgency
                                      </Badge>
                                    </div>
                                    <Badge variant={report.reviewedByDoctor ? 'default' : 'outline'}>
                                      {report.reviewedByDoctor ? 'Reviewed' : 'Pending Review'}
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
                                    <div>
                                      <p className="text-sm font-medium">Pain Level: {report.painLevel}/10</p>
                                    </div>
                                  )}

                                  {report.notes && (
                                    <div>
                                      <p className="text-sm font-medium">Notes:</p>
                                      <p className="text-sm text-muted-foreground italic">{report.notes}</p>
                                    </div>
                                  )}

                                  {report.doctorResponse && (
                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                                      <p className="text-sm font-medium text-blue-900">Doctor's Response:</p>
                                      <p className="text-sm text-blue-800">{report.doctorResponse}</p>
                                    </div>
                                  )}

                                  <div className="text-xs text-muted-foreground">
                                    Reported by {report.reportedBy}
                                  </div>
                                </div>
                              </Card>
                            ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Patient Selected</h3>
                  <p className="text-muted-foreground text-center">
                    Select a patient from the patients tab to report condition changes.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Medications Tab */}
          <TabsContent value="medications" className="space-y-6">
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
                          <p className="text-sm text-muted-foreground">
                            Medication Administration - {new Date().toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button onClick={() => setActiveTab('patients')} variant="outline">
                        Back to Patients
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                {/* Medications List */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Pill className="h-5 w-5" />
                        Today's Medications
                      </CardTitle>
                      <Button 
                        onClick={() => getPatientMedications(selectedPatient)} 
                        variant="outline" 
                        size="sm"
                        className="gap-2"
                        disabled={isPatientDischarged(selectedPatient)}
                      >
                        <Activity className="h-4 w-4" />
                        Refresh
                      </Button>
                    </div>
                    {isPatientDischarged(selectedPatient) && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          This patient has been discharged. Medication administration is now disabled.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(medicationAdministrationsCache[selectedPatient.id.toString()] || []).length === 0 ? (
                        <div className="text-center py-8">
                          <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No medications scheduled for today.</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Medications will appear here once prescribed by the doctor.
                          </p>
                        </div>
                      ) : (
                        (medicationAdministrationsCache[selectedPatient.id.toString()] || []).map((medication) => (
                          <Card key={medication.id} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <Checkbox
                                    checked={medication.administered}
                                    onCheckedChange={(checked) => 
                                      handleMedicationAdministration(medication.id, checked as boolean)
                                    }
                                    disabled={isPatientDischarged(selectedPatient)}
                                  />
                                  <div>
                                    <h4 className="font-semibold">{medication.medicationName}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {medication.dosage} - Scheduled: {medication.scheduledTime}
                                    </p>
                                    {medication.notes && (
                                      <p className="text-xs text-muted-foreground italic">
                                        {medication.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                {medication.administered ? (
                                  <div className="space-y-1">
                                    <Badge className="bg-green-100 text-green-800">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Administered
                                    </Badge>
                                    <p className="text-xs text-muted-foreground">
                                      {medication.administeredTime} by {medication.administeredBy}
                                    </p>
                                  </div>
                                ) : (
                                  <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Pending
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Pill className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Patient Selected</h3>
                  <p className="text-muted-foreground text-center">
                    Select a patient from the patients tab to manage medications.
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
                    Assigned Patients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{nursePatients.length}</div>
                  <p className="text-muted-foreground">Today's assignment</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Vitals Recorded
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {nursePatients.reduce((total, patient) => 
                      total + getTodayVitals(patient).length, 0
                    )}
                  </div>
                  <p className="text-muted-foreground">Today's recordings</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    Medications Given
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {nursePatients.reduce((total, patient) => 
                      total + (medicationAdministrationsCache[patient.id.toString()] || []).filter(m => m.administered).length, 0
                    )}
                  </div>
                  <p className="text-muted-foreground">Administered today</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    All Condition Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {nursePatients.reduce((total, patient) => 
                      total + (nurseReportsCache[patient.id.toString()] || []).length, 0
                    )}
                  </div>
                  <p className="text-muted-foreground">Total reports submitted</p>
                </CardContent>
              </Card>
            </div>

            {/* Patient Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Patient Status Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {nursePatients.map((patient) => {
                    const vitalStatus = getVitalStatus(patient);
                    const todayVitals = getTodayVitals(patient);
                    const medications = medicationAdministrationsCache[patient.id.toString()] || [];
                    const administeredMeds = medications.filter(m => m.administered);
                    const allReports = nurseReportsCache[patient.id.toString()] || [];
                    
                    return (
                      <div key={patient.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {patient.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{patient.name}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Room {patient.roomNumber}</span>
                            <span>Vitals: {todayVitals.length}</span>
                            <span>Meds: {administeredMeds.length}/{medications.length}</span>
                            <span>Reports: {allReports.length} total</span>
                          </div>
                        </div>
                        <Badge className={getStatusColor(vitalStatus)}>
                          {getStatusText(vitalStatus)}
                        </Badge>
                      </div>
                    );
                  })}
                  
                  {nursePatients.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">
                      No patients assigned for today.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}