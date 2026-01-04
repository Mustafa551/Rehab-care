import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, UserPlus, Mail, Phone, Stethoscope, Heart, Loader2, AlertCircle, CheckCircle, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Staff role definitions for nurses and doctors
const DOCTOR_SPECIALIZATIONS = [
  { id: 'cardiologist', name: 'Cardiologist', diseases: ['Heart Disease', 'Blood Pressure'] },
  { id: 'endocrinologist', name: 'Endocrinologist', diseases: ['Diabetes', 'Kidney Disease'] },
  { id: 'pulmonologist', name: 'Pulmonologist', diseases: ['Asthma', 'Fever'] },
  { id: 'psychiatrist', name: 'Psychiatrist', diseases: ['Depression', 'Anxiety'] },
  { id: 'general', name: 'General Physician', diseases: ['Fever', 'Arthritis'] },
  { id: 'oncologist', name: 'Oncologist', diseases: ['Cancer'] },
  { id: 'neurologist', name: 'Neurologist', diseases: ['Stroke'] }
];

const NURSE_TYPES = [
  { id: 'fresh', name: 'Fresh Nurse', description: 'General care and patient support' },
  { id: 'bscn', name: 'BScN Specialized Nurse', description: 'Advanced care and specialized procedures' }
];

interface AddStaffDialogProps {
  trigger?: React.ReactNode;
}

export function AddStaffDialog({ trigger }: AddStaffDialogProps) {
  const { addStaffMember } = useData();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: 'doctor' as 'nurse' | 'doctor',
    email: '',
    phone: '',
    isOnDuty: true,
    // Doctor specific fields
    specialization: '',
    // Nurse specific fields
    nurseType: 'fresh' as 'fresh' | 'bscn',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.email || !formData.phone) {
      setError('Please fill in all required fields');
      return;
    }

    // Role-specific validation
    if (formData.role === 'doctor' && !formData.specialization) {
      setError('Please select a specialization for the doctor');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Phone validation (Pakistani format)
    const phoneRegex = /^(\+92|0)?[0-9]{3}-?[0-9]{7}$|^(\+92|0)?[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      setError('Please enter a valid Pakistani phone number (e.g., +92-300-1234567 or 0300-1234567)');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newStaff = {
        name: formData.name, // Backend will add "Dr." prefix automatically
        role: formData.role,
        email: formData.email,
        phone: formData.phone,
        isOnDuty: formData.isOnDuty,
        // Add role-specific fields
        ...(formData.role === 'doctor' && formData.specialization && {
          specialization: formData.specialization,
        }),
        ...(formData.role === 'nurse' && {
          nurseType: formData.nurseType,
        }),
      };

      await addStaffMember(newStaff);
      
      // Reset form and close dialog
      setFormData({
        name: '',
        role: 'doctor',
        email: '',
        phone: '',
        isOnDuty: true,
        specialization: '',
        nurseType: 'fresh',
      });
      setOpen(false);
    } catch (error: any) {
      setError(error.message || 'Failed to add staff member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Staff Member
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New Staff Member
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Section */}
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter full name"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="staff@rehabcare.com"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+92-300-1234567 or 0300-1234567"
                      required
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Pakistani format: +92-300-1234567 or 0300-1234567
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Role Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" />
                    Role Selection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Label>Select Role *</Label>
                    <RadioGroup
                      value={formData.role}
                      onValueChange={(value) => handleInputChange('role', value)}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="doctor" id="doctor" />
                        <Label htmlFor="doctor" className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4" />
                          Doctor
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nurse" id="nurse" />
                        <Label htmlFor="nurse" className="flex items-center gap-2">
                          <Heart className="h-4 w-4" />
                          Nurse
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Doctor Specialization */}
                  {formData.role === 'doctor' && (
                    <div className="space-y-2">
                      <Label htmlFor="specialization">Specialization *</Label>
                      <Select
                        value={formData.specialization}
                        onValueChange={(value) => handleInputChange('specialization', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select specialization" />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCTOR_SPECIALIZATIONS.map(spec => (
                            <SelectItem key={spec.id} value={spec.id}>
                              <div className="flex flex-col">
                                <span>{spec.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  Treats: {spec.diseases.join(', ')}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Nurse Type */}
                  {formData.role === 'nurse' && (
                    <div className="space-y-2">
                      <Label>Nurse Type</Label>
                      <RadioGroup
                        value={formData.nurseType}
                        onValueChange={(value) => handleInputChange('nurseType', value)}
                        className="space-y-2"
                      >
                        {NURSE_TYPES.map(type => (
                          <div key={type.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={type.id} id={type.id} />
                            <Label htmlFor={type.id} className="flex-1">
                              <div>
                                <div className="font-medium">{type.name}</div>
                                <div className="text-xs text-muted-foreground">{type.description}</div>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="status">Initial Status</Label>
                    <Select
                      value={formData.isOnDuty ? 'on-duty' : 'off-duty'}
                      onValueChange={(value) => handleInputChange('isOnDuty', value === 'on-duty')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on-duty">On Duty</SelectItem>
                        <SelectItem value="off-duty">Off Duty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">
                      {formData.role === 'doctor' ? (
                        <Stethoscope className="h-6 w-6" />
                      ) : (
                        <Heart className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {formData.role === 'doctor' && formData.name ? `Dr. ${formData.name}` : formData.name || 'Staff Name'}
                      </h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {formData.role}
                        {formData.role === 'doctor' && formData.specialization && 
                          ` - ${DOCTOR_SPECIALIZATIONS.find(s => s.id === formData.specialization)?.name}`
                        }
                        {formData.role === 'nurse' && 
                          ` - ${NURSE_TYPES.find(t => t.id === formData.nurseType)?.name}`
                        }
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{formData.email || '--'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium">{formData.phone || '--'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={formData.isOnDuty ? 'default' : 'secondary'}>
                        {formData.isOnDuty ? 'On Duty' : 'Off Duty'}
                      </Badge>
                    </div>

                    {formData.role === 'doctor' && formData.specialization && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Can Treat:</h4>
                        <div className="flex flex-wrap gap-1">
                          {DOCTOR_SPECIALIZATIONS.find(s => s.id === formData.specialization)?.diseases.map(disease => (
                            <Badge key={disease} variant="outline" className="text-xs">
                              {disease}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Information Card */}
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Staff Information</h4>
                    <div className="text-xs space-y-1">
                      <p className="text-muted-foreground">
                        • Only doctors and nurses can be added
                      </p>
                      <p className="text-muted-foreground">
                        • Doctors require specialization selection
                      </p>
                      <p className="text-muted-foreground">
                        • Nurses can be Fresh or BScN Specialized
                      </p>
                      <p className="text-muted-foreground">
                        • Staff will be available for patient care
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-6 border-t">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding Staff...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Add Staff Member
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}