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
import { Plus, User, MapPin, Calendar, Stethoscope, Baby, Users, UserCheck, Mail, Phone, Loader2 } from 'lucide-react';
import { AgeGroup } from '@/types';
import { toast } from 'sonner';

interface AddPatientDialogProps {
  trigger?: React.ReactNode;
}

export function AddPatientDialog({ trigger }: AddPatientDialogProps) {
  const { patients, addPatient, getDoctors } = useData();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    medicalCondition: '',
    assignedDoctorId: 'none',
    status: 'active' as 'active' | 'inactive' | 'discharged',
    // Legacy fields for compatibility
    age: '',
    condition: '',
    roomNumber: '',
    admissionDate: new Date().toISOString().split('T')[0],
  });

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = formData.dateOfBirth ? calculateAge(formData.dateOfBirth) : (formData.age ? parseInt(formData.age) : 0);
  const ageGroup: AgeGroup = age < 18 ? 'youth' : 'adult';
  const doctors = getDoctors();
  
  // Get available room numbers
  const occupiedRooms = patients.map(p => p.roomNumber);
  const youthRooms = Array.from({ length: 10 }, (_, i) => 201 + i);
  const adultRooms = Array.from({ length: 10 }, (_, i) => 101 + i);
  const availableYouthRooms = youthRooms.filter(room => !occupiedRooms.includes(room));
  const availableAdultRooms = adultRooms.filter(room => !occupiedRooms.includes(room));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.email || !formData.phone || !formData.dateOfBirth || !formData.medicalCondition) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate phone format (XXX-XXXX)
    const phoneRegex = /^\d{3}-\d{4}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error('Phone number must be in format XXX-XXXX');
      return;
    }

    setIsSubmitting(true);

    try {
      const newPatient = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        medicalCondition: formData.medicalCondition,
        assignedDoctorId: formData.assignedDoctorId === 'none' ? undefined : Number(formData.assignedDoctorId),
        status: formData.status,
        // Legacy fields for compatibility
        age,
        ageGroup,
        condition: formData.medicalCondition,
        roomNumber: parseInt(formData.roomNumber) || Math.floor(Math.random() * 100) + 100,
        admissionDate: formData.admissionDate,
        assignedStaffId: null,
      };

      await addPatient(newPatient);
      
      toast.success('Patient added successfully! Staff will be automatically assigned for today.');
      
      // Reset form and close dialog
      setFormData({
        name: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        medicalCondition: '',
        assignedDoctorId: 'none',
        status: 'active',
        age: '',
        condition: '',
        roomNumber: '',
        admissionDate: new Date().toISOString().split('T')[0],
      });
      setOpen(false);
    } catch (error) {
      console.error('Failed to add patient:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Add New Patient
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter patient's full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="patient@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="123-4567"
                  pattern="\d{3}-\d{4}"
                  title="Phone number must be in format XXX-XXXX"
                  required
                />
                <p className="text-xs text-muted-foreground">Format: XXX-XXXX</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
                {formData.dateOfBirth && (
                  <p className="text-xs text-muted-foreground">Age: {age} years old</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedDoctor">Assign Doctor</Label>
                <Select
                  value={formData.assignedDoctorId}
                  onValueChange={(value) => handleInputChange('assignedDoctorId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a doctor (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No doctor assigned</SelectItem>
                    {doctors.map(doctor => (
                      <SelectItem key={doctor.id} value={doctor.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4" />
                          {doctor.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {doctors.length === 0 && (
                  <p className="text-xs text-muted-foreground">No doctors available. Add doctors first.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'inactive' | 'discharged') => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="discharged">Discharged</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicalCondition">Medical Condition *</Label>
                <Textarea
                  id="medicalCondition"
                  value={formData.medicalCondition}
                  onChange={(e) => handleInputChange('medicalCondition', e.target.value)}
                  placeholder="Describe the patient's condition and rehabilitation needs"
                  rows={3}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding Patient...
                    </>
                  ) : (
                    'Add Patient'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>

          {/* Preview Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Preview</h3>
            
            <Card variant="elevated">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">
                      {formData.name ? formData.name.split(' ').map(n => n[0]).join('') : '??'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {formData.name || 'Patient Name'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Age: {age || '--'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={ageGroup === 'youth' ? 'default' : 'secondary'}>
                    {ageGroup === 'youth' ? (
                      <>
                        <Baby className="h-3 w-3 mr-1" />
                        Youth
                      </>
                    ) : (
                      <>
                        <Users className="h-3 w-3 mr-1" />
                        Adult
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium text-foreground">
                    {formData.email || '--'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium text-foreground">
                    {formData.phone || '--'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Date of Birth</span>
                  <span className="font-medium text-foreground">
                    {formData.dateOfBirth ? 
                      new Date(formData.dateOfBirth).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : '--'
                    }
                  </span>
                </div>
                
                <div className="flex items-start gap-2 text-sm">
                  <Stethoscope className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground line-clamp-3">
                    {formData.medicalCondition || 'Medical condition will appear here...'}
                  </span>
                </div>

                {formData.assignedDoctorId && formData.assignedDoctorId !== 'none' && (
                  <div className="flex items-center gap-2 text-sm">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Doctor</span>
                    <span className="font-medium text-foreground">
                      {doctors.find(d => d.id.toString() === formData.assignedDoctorId)?.name || '--'}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Badge variant={formData.status === 'active' ? 'default' : formData.status === 'inactive' ? 'secondary' : 'destructive'}>
                    {formData.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Doctor availability info */}
            <Card variant="flat" className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Assignment Information</h4>
                  <div className="text-xs space-y-1">
                    <div>
                      <span className="text-muted-foreground">Available doctors:</span>
                      <span className="ml-1 font-medium">{doctors.length}</span>
                    </div>
                    <p className="text-muted-foreground">
                      • Doctor assignment is permanent (optional)
                    </p>
                    <p className="text-muted-foreground">
                      • Nurse/caretaker will be auto-assigned for today
                    </p>
                    <p className="text-muted-foreground">
                      • Non-doctor staff rotate daily
                    </p>
                  </div>
                  {doctors.length === 0 && (
                    <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                      No doctors available. Add doctors from the Staff page first.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}