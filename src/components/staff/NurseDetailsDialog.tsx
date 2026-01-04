import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
  Zap
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
  const { patients, getStaffPatients } = useData();
  const [open, setOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState('patients');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Get patients assigned to this nurse (for daily assignments)
  const nursePatients = getStaffPatients(nurse.id.toString());

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

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveTab('vitals');
    
    // Reset vital signs form
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
  };

  const handleSaveVitals = async () => {
    if (!selectedPatient) return;
    
    // Validate required fields
    if (!vitalForm.bloodPressure || !vitalForm.heartRate || !vitalForm.temperature) {
      toast.error('Please fill in all required vital signs');
      return;
    }

    setIsUpdating(true);
    try {
      const newVital: VitalSigns = {
        id: Date.now().toString(),
        patientId: selectedPatient.id.toString(),
        ...vitalForm,
        recordedBy: nurse.name
      };

      setVitalSigns(prev => ({
        ...prev,
        [selectedPatient.id.toString()]: [
          ...(prev[selectedPatient.id.toString()] || []),
          newVital
        ]
      }));
      
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
      
      toast.success('Vital signs recorded successfully');
    } catch (error) {
      toast.error('Failed to record vital signs');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMedicationAdministration = async (medicationId: string, administered: boolean) => {
    if (!selectedPatient) return;
    
    setMedicationAdministrations(prev => ({
      ...prev,
      [selectedPatient.id.toString()]: (prev[selectedPatient.id.toString()] || []).map(med =>
        med.id === medicationId
          ? {
              ...med,
              administered,
              administeredTime: administered ? new Date().toTimeString().slice(0, 5) : undefined,
              administeredBy: administered ? nurse.name : undefined
            }
          : med
      )
    }));

    const medication = getMockMedications(selectedPatient).find(m => m.id === medicationId);
    if (administered) {
      toast.success(`${medication?.medicationName} administered to ${selectedPatient.name}`);
    } else {
      toast.info(`${medication?.medicationName} administration cancelled`);
    }
  };

  // Mock medication data - in real app, this would come from doctor's prescriptions
  const getMockMedications = (patient: Patient): MedicationAdministration[] => {
    const patientId = patient.id.toString();
    if (medicationAdministrations[patientId]) {
      return medicationAdministrations[patientId];
    }

    // Generate mock medications based on patient's condition
    const mockMeds: MedicationAdministration[] = [
      {
        id: `${patientId}-med-1`,
        patientId,
        medicationName: 'Paracetamol',
        dosage: '500mg',
        scheduledTime: '08:00',
        administered: false,
        notes: 'Take with food'
      },
      {
        id: `${patientId}-med-2`,
        patientId,
        medicationName: 'Vitamin D',
        dosage: '1000 IU',
        scheduledTime: '12:00',
        administered: false,
        notes: 'Daily supplement'
      },
      {
        id: `${patientId}-med-3`,
        patientId,
        medicationName: 'Physiotherapy Exercise',
        dosage: '30 minutes',
        scheduledTime: '16:00',
        administered: false,
        notes: 'Supervised exercise session'
      }
    ];

    setMedicationAdministrations(prev => ({
      ...prev,
      [patientId]: mockMeds
    }));

    return mockMeds;
  };

  const getPatientVitals = (patient: Patient) => {
    return vitalSigns[patient.id.toString()] || [];
  };

  const getTodayVitals = (patient: Patient) => {
    const today = new Date().toISOString().split('T')[0];
    return getPatientVitals(patient).filter(vital => vital.date === today);
  };

  const getVitalStatus = (patient: Patient) => {
    const todayVitals = getTodayVitals(patient);
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="patients" className="gap-2">
              <Users className="h-4 w-4" />
              My Patients ({nursePatients.length})
            </TabsTrigger>
            <TabsTrigger value="vitals" disabled={!selectedPatient} className="gap-2">
              <Activity className="h-4 w-4" />
              Vital Signs
            </TabsTrigger>
            <TabsTrigger value="medications" disabled={!selectedPatient} className="gap-2">
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
                            {getMockMedications(patient).filter(m => m.administered).length}/
                            {getMockMedications(patient).length} given
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
                          <Label htmlFor="time">Time</Label>
                          <Input
                            id="time"
                            type="time"
                            value={vitalForm.time}
                            onChange={(e) => setVitalForm(prev => ({ ...prev, time: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="bp">Blood Pressure *</Label>
                          <Input
                            id="bp"
                            value={vitalForm.bloodPressure}
                            onChange={(e) => setVitalForm(prev => ({ ...prev, bloodPressure: e.target.value }))}
                            placeholder="120/80"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="hr">Heart Rate * (bpm)</Label>
                          <Input
                            id="hr"
                            value={vitalForm.heartRate}
                            onChange={(e) => setVitalForm(prev => ({ ...prev, heartRate: e.target.value }))}
                            placeholder="72"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="temp">Temperature * (°F)</Label>
                          <Input
                            id="temp"
                            value={vitalForm.temperature}
                            onChange={(e) => setVitalForm(prev => ({ ...prev, temperature: e.target.value }))}
                            placeholder="98.6"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="o2">Oxygen Saturation (%)</Label>
                          <Input
                            id="o2"
                            value={vitalForm.oxygenSaturation}
                            onChange={(e) => setVitalForm(prev => ({ ...prev, oxygenSaturation: e.target.value }))}
                            placeholder="98"
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="rr">Respiratory Rate (breaths/min)</Label>
                          <Input
                            id="rr"
                            value={vitalForm.respiratoryRate}
                            onChange={(e) => setVitalForm(prev => ({ ...prev, respiratoryRate: e.target.value }))}
                            placeholder="16"
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
                        disabled={isUpdating}
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
                            Record Vital Signs
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
                        {getTodayVitals(selectedPatient).length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">
                            No vital signs recorded today.
                          </p>
                        ) : (
                          getTodayVitals(selectedPatient)
                            .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))
                            .map((vital) => (
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
                                    <div>O2: <span className="font-medium">{vital.oxygenSaturation}%</span></div>
                                  </div>
                                  {vital.notes && (
                                    <p className="text-sm text-muted-foreground italic">
                                      {vital.notes}
                                    </p>
                                  )}
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
                  <User className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Patient Selected</h3>
                  <p className="text-muted-foreground text-center">
                    Select a patient from the patients tab to record vital signs.
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
                    <CardTitle className="flex items-center gap-2">
                      <Pill className="h-5 w-5" />
                      Today's Medications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {getMockMedications(selectedPatient).map((medication) => (
                        <Card key={medication.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={medication.administered}
                                  onCheckedChange={(checked) => 
                                    handleMedicationAdministration(medication.id, checked as boolean)
                                  }
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
                      ))}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      total + getMockMedications(patient).filter(m => m.administered).length, 0
                    )}
                  </div>
                  <p className="text-muted-foreground">Administered today</p>
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
                    const medications = getMockMedications(patient);
                    const administeredMeds = medications.filter(m => m.administered);
                    
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