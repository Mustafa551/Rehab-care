import { useState } from 'react';
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

export function DoctorDetailsDialog({ doctor, trigger }: DoctorDetailsDialogProps) {
  const { patients, getStaffPatients } = useData();
  const [open, setOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState('patients');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Get patients assigned to this doctor
  const doctorPatients = patients.filter(patient => 
    patient.assignedDoctorId === doctor.id
  );

  // Mock patient condition data - in real app, this would come from API
  const [patientConditions, setPatientConditions] = useState<Record<string, PatientConditionUpdate>>({});
  
  const [conditionForm, setConditionForm] = useState<PatientConditionUpdate>({
    date: new Date().toISOString().split('T')[0],
    condition: '',
    notes: '',
    medications: [],
    vitals: {},
    dischargeRecommendation: 'continue',
    dischargeNotes: ''
  });

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveTab('condition');
    
    // Load existing condition data or initialize new
    const existingCondition = patientConditions[patient.id.toString()];
    if (existingCondition) {
      setConditionForm(existingCondition);
    } else {
      setConditionForm({
        date: new Date().toISOString().split('T')[0],
        condition: patient.medicalCondition || '',
        notes: '',
        medications: [],
        vitals: {},
        dischargeRecommendation: 'continue',
        dischargeNotes: ''
      });
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
    
    setIsUpdating(true);
    try {
      // In real app, this would be an API call
      setPatientConditions(prev => ({
        ...prev,
        [selectedPatient.id.toString()]: conditionForm
      }));
      
      toast.success('Patient condition updated successfully');
      
      if (conditionForm.dischargeRecommendation === 'discharge') {
        toast.info('Discharge recommendation noted. Please coordinate with administration.');
      }
    } catch (error) {
      toast.error('Failed to update patient condition');
    } finally {
      setIsUpdating(false);
    }
  };

  const getConditionStatus = (patient: Patient) => {
    const condition = patientConditions[patient.id.toString()];
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
            <TabsTrigger value="condition" disabled={!selectedPatient} className="gap-2">
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

                        {patientConditions[patient.id.toString()]?.dischargeRecommendation === 'discharge' && (
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
                  {/* Condition Update Form */}
                  <div className="space-y-6">
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
                          <Label htmlFor="condition">Current Condition</Label>
                          <Textarea
                            id="condition"
                            value={conditionForm.condition}
                            onChange={(e) => setConditionForm(prev => ({ ...prev, condition: e.target.value }))}
                            placeholder="Describe the patient's current medical condition..."
                            rows={3}
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

                    {/* Vital Signs */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-5 w-5" />
                          Vital Signs
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="bp">Blood Pressure</Label>
                            <Input
                              id="bp"
                              value={conditionForm.vitals?.bloodPressure || ''}
                              onChange={(e) => setConditionForm(prev => ({
                                ...prev,
                                vitals: { ...prev.vitals, bloodPressure: e.target.value }
                              }))}
                              placeholder="120/80"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="hr">Heart Rate</Label>
                            <Input
                              id="hr"
                              value={conditionForm.vitals?.heartRate || ''}
                              onChange={(e) => setConditionForm(prev => ({
                                ...prev,
                                vitals: { ...prev.vitals, heartRate: e.target.value }
                              }))}
                              placeholder="72 bpm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="temp">Temperature</Label>
                            <Input
                              id="temp"
                              value={conditionForm.vitals?.temperature || ''}
                              onChange={(e) => setConditionForm(prev => ({
                                ...prev,
                                vitals: { ...prev.vitals, temperature: e.target.value }
                              }))}
                              placeholder="98.6°F"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="o2">Oxygen Saturation</Label>
                            <Input
                              id="o2"
                              value={conditionForm.vitals?.oxygenSaturation || ''}
                              onChange={(e) => setConditionForm(prev => ({
                                ...prev,
                                vitals: { ...prev.vitals, oxygenSaturation: e.target.value }
                              }))}
                              placeholder="98%"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Medications and Discharge */}
                  <div className="space-y-6">
                    {/* Medications */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Pill className="h-5 w-5" />
                            Medications
                          </CardTitle>
                          <Button onClick={handleAddMedication} size="sm" variant="outline">
                            Add Medication
                          </Button>
                        </div>
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
                                  <Input
                                    value={medication.frequency}
                                    onChange={(e) => handleUpdateMedication(medication.id, 'frequency', e.target.value)}
                                    placeholder="Frequency (e.g., 2x daily)"
                                  />
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
                      disabled={isUpdating}
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
                          Save Patient Assessment
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    {Object.values(patientConditions).filter(c => c.dischargeRecommendation === 'discharge').length}
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
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(patientConditions)
                    .sort(([,a], [,b]) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 5)
                    .map(([patientId, condition]) => {
                      const patient = doctorPatients.find(p => p.id.toString() === patientId);
                      if (!patient) return null;
                      
                      return (
                        <div key={patientId} className="flex items-center gap-3 p-3 rounded-lg border">
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
                  
                  {Object.keys(patientConditions).length === 0 && (
                    <p className="text-muted-foreground text-center py-8">
                      No recent activity. Start by assessing your patients.
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