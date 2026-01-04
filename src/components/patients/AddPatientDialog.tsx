import { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  User, 
  MapPin, 
  Calendar, 
  Stethoscope, 
  Baby, 
  Users, 
  UserCheck, 
  Mail, 
  Phone, 
  Loader2,
  Heart,
  DollarSign,
  Building,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { AgeGroup, Gender, RoomType } from '@/types';
import { toast } from 'sonner';
import { api } from '@/lib/api';

// Disease definitions
const DISEASES = [
  { id: 'fever', name: 'Fever' },
  { id: 'diabetes', name: 'Diabetes' },
  { id: 'blood-pressure', name: 'Blood Pressure' },
  { id: 'heart-disease', name: 'Heart Disease' },
  { id: 'asthma', name: 'Asthma' },
  { id: 'arthritis', name: 'Arthritis' },
  { id: 'depression', name: 'Depression' },
  { id: 'anxiety', name: 'Anxiety' },
  { id: 'stroke', name: 'Stroke' },
  { id: 'cancer', name: 'Cancer' },
  { id: 'kidney-disease', name: 'Kidney Disease' },
  { id: 'liver-disease', name: 'Liver Disease' }
];

interface Doctor {
  id: number;
  name: string;
  specialization: string;
  diseases?: string[];
}

interface Nurse {
  id: number;
  name: string;
  nurseType: 'fresh' | 'bscn';
  description?: string;
}

interface AddPatientDialogProps {
  trigger?: React.ReactNode;
}

export function AddPatientDialog({ trigger }: AddPatientDialogProps) {
  const { patients, addPatient, getDoctors, loadPatients } = useData();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // State for real data from API
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [isLoadingNurses, setIsLoadingNurses] = useState(false);
  
  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    age: 0,
    gender: 'male' as Gender,
    phone: '',
    address: '',
    emergencyContact: '',
    
    // Medical Information
    diseases: [] as string[],
    
    // Assignments
    doctorId: '',
    nurseIds: [] as string[],
    
    // Financial
    initialDeposit: 0,
    
    // Accommodation
    roomType: 'general' as RoomType,
    
    // Legacy fields for compatibility
    email: '',
    dateOfBirth: '',
    medicalCondition: '',
    assignedDoctorId: 'none',
    status: 'active' as 'active' | 'inactive' | 'discharged',
    condition: '',
    roomNumber: '',
    admissionDate: new Date().toISOString().split('T')[0],
  });

  const totalSteps = 6;

  // Load nurses when component mounts
  useEffect(() => {
    const loadNurses = async () => {
      setIsLoadingNurses(true);
      try {
        const nursesData = await api.getNurses();
        const formattedNurses: Nurse[] = nursesData.map(nurse => ({
          id: nurse.id,
          name: nurse.name,
          nurseType: nurse.nurseType || 'fresh',
          description: `${nurse.nurseType === 'bscn' ? 'BScN Specialized Nurse' : 'Fresh Nurse'} - ${nurse.nurseType === 'bscn' ? 'Advanced Care' : 'General Care'}`
        }));
        setNurses(formattedNurses);
      } catch (error) {
        console.error('Failed to load nurses:', error);
        toast.error('Failed to load nurses');
      } finally {
        setIsLoadingNurses(false);
      }
    };

    if (open) {
      loadNurses();
    }
  }, [open]);

  // Load doctors when diseases change
  useEffect(() => {
    const loadDoctorsByDiseases = async () => {
      if (formData.diseases.length === 0) {
        setAvailableDoctors([]);
        return;
      }

      setIsLoadingDoctors(true);
      try {
        const doctorsData = await api.getDoctorsByDiseases(formData.diseases);
        const formattedDoctors: Doctor[] = doctorsData.map(doctor => ({
          id: doctor.id,
          name: doctor.name,
          specialization: doctor.specialization || 'General Physician'
        }));
        setAvailableDoctors(formattedDoctors);
      } catch (error) {
        console.error('Failed to load doctors:', error);
        toast.error('Failed to load doctors for selected diseases');
        setAvailableDoctors([]);
      } finally {
        setIsLoadingDoctors(false);
      }
    };

    loadDoctorsByDiseases();
  }, [formData.diseases]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Personal Information
        if (!formData.name.trim()) newErrors.name = 'Full name is required';
        if (formData.age <= 0) newErrors.age = 'Valid age is required';
        if (!formData.phone.trim()) {
          newErrors.phone = 'Phone number is required';
        } else {
          // Pakistani phone number validation
          // Accepts formats: +92-XXX-XXXXXXX, +92XXXXXXXXXX, 0XXX-XXXXXXX, 0XXXXXXXXXX
          const pkPhoneRegex = /^(\+92|0)?[0-9]{3}-?[0-9]{7}$|^(\+92|0)?[0-9]{10}$/;
          if (!pkPhoneRegex.test(formData.phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Please enter a valid Pakistani phone number (e.g., +92-300-1234567 or 0300-1234567)';
          }
        }
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.emergencyContact.trim()) newErrors.emergencyContact = 'Emergency contact is required';
        break;
      
      case 2: // Disease Selection
        if (formData.diseases.length === 0) newErrors.diseases = 'Please select at least one disease';
        break;
      
      case 3: // Doctor Selection
        if (!formData.doctorId) newErrors.doctorId = 'Please select a doctor';
        break;
      
      case 4: // Nurse Selection
        if (formData.nurseIds.length !== 2) newErrors.nurseIds = 'Please select exactly 2 nurses';
        break;
      
      case 5: // Initial Deposit
        if (formData.initialDeposit <= 0) newErrors.initialDeposit = 'Initial deposit must be greater than 0';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDiseaseToggle = (diseaseId: string) => {
    setFormData(prev => ({
      ...prev,
      diseases: prev.diseases.includes(diseaseId)
        ? prev.diseases.filter(id => id !== diseaseId)
        : [...prev.diseases, diseaseId]
    }));
  };

  const handleNurseToggle = (nurseId: string) => {
    setFormData(prev => {
      const currentNurses = prev.nurseIds;
      if (currentNurses.includes(nurseId)) {
        return { ...prev, nurseIds: currentNurses.filter(id => id !== nurseId) };
      } else if (currentNurses.length < 2) {
        return { ...prev, nurseIds: [...currentNurses, nurseId] };
      }
      return prev; // Don't add if already 2 nurses selected
    });
  };

  const getAvailableDoctors = () => {
    return availableDoctors;
  };

  const handleSubmit = async () => {
    if (!validateStep(totalSteps)) return;

    setIsSubmitting(true);

    try {
      // Prepare patient data with all registration information
      const newPatient = {
        name: formData.name,
        email: `${formData.name.toLowerCase().replace(/\s+/g, '.')}@patient.com`, // Generate email
        phone: formData.phone,
        dateOfBirth: new Date(Date.now() - formData.age * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        medicalCondition: formData.diseases.map(id => DISEASES.find(d => d.id === id)?.name).join(', '),
        assignedDoctorId: formData.doctorId ? Number(formData.doctorId) : undefined,
        status: formData.status,
        // New registration fields
        age: formData.age,
        gender: formData.gender,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        diseases: formData.diseases,
        assignedNurses: formData.nurseIds,
        initialDeposit: formData.initialDeposit,
        roomType: formData.roomType,
        roomNumber: Math.floor(Math.random() * 100) + (formData.age < 18 ? 200 : 100),
        admissionDate: formData.admissionDate,
      };

      // Use API directly instead of context
      await api.createPatient(newPatient);
      
      // Refresh the patient list to show the new patient immediately
      if (loadPatients) {
        await loadPatients();
      }
      
      toast.success('Patient registered successfully with comprehensive details!');
      
      // Reset form and close dialog
      setFormData({
        name: '',
        age: 0,
        gender: 'male',
        phone: '',
        address: '',
        emergencyContact: '',
        diseases: [],
        doctorId: '',
        nurseIds: [],
        initialDeposit: 0,
        roomType: 'general',
        email: '',
        dateOfBirth: '',
        medicalCondition: '',
        assignedDoctorId: 'none',
        status: 'active',
        condition: '',
        roomNumber: '',
        admissionDate: new Date().toISOString().split('T')[0],
      });
      setCurrentStep(1);
      setOpen(false);
    } catch (error) {
      console.error('Failed to register patient:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to register patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Personal Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter full name"
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age || ''}
                  onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
                  placeholder="Enter age"
                  min="1"
                  max="120"
                />
                {errors.age && <p className="text-sm text-red-500">{errors.age}</p>}
              </div>

              <div className="space-y-2">
                <Label>Gender *</Label>
                <RadioGroup
                  value={formData.gender}
                  onValueChange={(value) => handleInputChange('gender', value as Gender)}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female">Female</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other">Other</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Pakistan) *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="e.g., +92-300-1234567 or 0300-1234567"
                />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter complete address"
                rows={3}
              />
              {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Emergency Contact *</Label>
              <Input
                id="emergencyContact"
                value={formData.emergencyContact}
                onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                placeholder="Emergency contact name and phone"
              />
              {errors.emergencyContact && <p className="text-sm text-red-500">{errors.emergencyContact}</p>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Stethoscope className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Disease Selection</h3>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Select all diseases that apply to the patient. You can select multiple diseases.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
              {DISEASES.map((disease) => (
                <div
                  key={disease.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    formData.diseases.includes(disease.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleDiseaseToggle(disease.id)}
                >
                  <Checkbox
                    checked={formData.diseases.includes(disease.id)}
                    onChange={() => handleDiseaseToggle(disease.id)}
                  />
                  <Label className="cursor-pointer">{disease.name}</Label>
                </div>
              ))}
            </div>

            {formData.diseases.length > 0 && (
              <div className="mt-4">
                <Label className="text-sm font-medium">Selected Diseases:</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.diseases.map((diseaseId) => {
                    const disease = DISEASES.find(d => d.id === diseaseId);
                    return (
                      <Badge key={diseaseId} variant="secondary">
                        {disease?.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {errors.diseases && <p className="text-sm text-red-500">{errors.diseases}</p>}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <UserCheck className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Doctor Selection</h3>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Select a doctor based on the diseases selected. Only doctors who can treat the selected diseases are shown.
            </p>

            {isLoadingDoctors ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading available doctors...</span>
              </div>
            ) : availableDoctors.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No doctors available for the selected diseases. Please go back and review your disease selection or contact administration to add doctors with relevant specializations.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                {availableDoctors.map((doctor) => (
                  <Card
                    key={doctor.id}
                    className={`cursor-pointer transition-colors ${
                      formData.doctorId === doctor.id.toString()
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleInputChange('doctorId', doctor.id.toString())}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h4 className="font-semibold">{doctor.name}</h4>
                          <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                          <div className="flex flex-wrap gap-1">
                            {formData.diseases.map((diseaseId) => {
                              const disease = DISEASES.find(d => d.id === diseaseId);
                              return (
                                <Badge key={diseaseId} variant="outline" className="text-xs">
                                  {disease?.name}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                        {formData.doctorId === doctor.id.toString() && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {errors.doctorId && <p className="text-sm text-red-500">{errors.doctorId}</p>}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Nurse Selection</h3>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Select exactly 2 nurses for the patient. Each patient must be assigned two nurses for comprehensive care.
            </p>

            {isLoadingNurses ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading available nurses...</span>
              </div>
            ) : nurses.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No nurses available. Please contact administration to add nurses to the system.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                {nurses.map((nurse) => (
                  <Card
                    key={nurse.id}
                    className={`cursor-pointer transition-colors ${
                      formData.nurseIds.includes(nurse.id.toString())
                        ? 'border-primary bg-primary/5'
                        : formData.nurseIds.length >= 2
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleNurseToggle(nurse.id.toString())}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h4 className="font-semibold">{nurse.name}</h4>
                          <p className="text-sm text-muted-foreground">{nurse.description}</p>
                          <Badge variant={nurse.nurseType === 'bscn' ? 'default' : 'secondary'}>
                            {nurse.nurseType === 'bscn' ? 'BScN Specialized' : 'Fresh Nurse'}
                          </Badge>
                        </div>
                        {formData.nurseIds.includes(nurse.id.toString()) && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {formData.nurseIds.length > 0 && (
              <div className="mt-4">
                <Label className="text-sm font-medium">
                  Selected Nurses ({formData.nurseIds.length}/2):
                </Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.nurseIds.map((nurseId) => {
                    const nurse = nurses.find(n => n.id.toString() === nurseId);
                    return (
                      <Badge key={nurseId} variant="secondary">
                        {nurse?.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {errors.nurseIds && <p className="text-sm text-red-500">{errors.nurseIds}</p>}
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Initial Deposit</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="initialDeposit">Initial Deposit Amount (PKR) *</Label>
                <Input
                  id="initialDeposit"
                  type="number"
                  value={formData.initialDeposit || ''}
                  onChange={(e) => handleInputChange('initialDeposit', parseFloat(e.target.value) || 0)}
                  placeholder="Enter deposit amount"
                  min="1"
                />
                {errors.initialDeposit && <p className="text-sm text-red-500">{errors.initialDeposit}</p>}
              </div>

              {formData.initialDeposit > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Deposit Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Initial Deposit:</span>
                      <span className="font-medium">PKR {formData.initialDeposit.toLocaleString()}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Total Amount:</span>
                      <span>PKR {formData.initialDeposit.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Building className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Room Assignment</h3>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Select the type of room for the patient's stay.
            </p>

            <div className="grid grid-cols-1 gap-3">
              {[
                { value: 'general', label: 'General Ward', description: 'Shared room with basic facilities', price: 'PKR 2,000/day' },
                { value: 'semi-private', label: 'Semi-Private', description: 'Shared room with 2 beds', price: 'PKR 3,500/day' },
                { value: 'private', label: 'Private', description: 'Single room with premium facilities', price: 'PKR 5,000/day' }
              ].map((room) => (
                <Card
                  key={room.value}
                  className={`cursor-pointer transition-colors ${
                    formData.roomType === room.value
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => handleInputChange('roomType', room.value as RoomType)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{room.label}</h4>
                        {formData.roomType === room.value && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{room.description}</p>
                      <p className="text-sm font-medium text-primary">{room.price}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Patient
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient Registration - Step {currentStep} of {totalSteps}
          </DialogTitle>
        </DialogHeader>
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-muted-foreground">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              className="flex items-center gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Complete Registration
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}