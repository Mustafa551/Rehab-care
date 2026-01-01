import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, UserPlus, Mail, Phone, Stethoscope, UserCheck, Users, Activity, Heart, Shield, Zap, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    role: 'doctor' as 'nurse' | 'caretaker' | 'therapist' | 'doctor',
    email: '',
    phone: '',
    isOnDuty: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.email || !formData.phone) {
      setError('Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Phone validation (Pakistani format)
    // Accepts formats: +92-XXX-XXXXXXX, +92XXXXXXXXXX, 0XXX-XXXXXXX, 0XXXXXXXXXX
    const phoneRegex = /^(\+92|0)?[0-9]{3}-?[0-9]{7}$|^(\+92|0)?[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      setError('Please enter a valid Pakistani phone number (e.g., +92-300-1234567 or 0300-1234567)');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newStaff = {
        name: formData.name,
        role: formData.role,
        email: formData.email,
        phone: formData.phone,
        isOnDuty: formData.isOnDuty,
      };

      // Add staff using context function (which calls the API)
      await addStaffMember(newStaff);
      
      // Reset form and close dialog
      setFormData({
        name: '',
        role: 'doctor',
        email: '',
        phone: '',
        isOnDuty: true,
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'doctor': return <Stethoscope className="h-4 w-4" />;
      case 'nurse': return <Heart className="h-4 w-4" />;
      case 'caretaker': return <Shield className="h-4 w-4" />;
      case 'therapist': return <Zap className="h-4 w-4" />;
      default: return <UserCheck className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'doctor': return 'bg-blue-100 text-blue-700';
      case 'nurse': return 'bg-info/10 text-info';
      case 'caretaker': return 'bg-success/10 text-success';
      case 'therapist': return 'bg-warning/10 text-warning';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Staff
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New Staff Member
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter staff member's full name"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Designation *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleInputChange('role', value)}
                  required
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select designation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-blue-600" />
                        Doctor
                      </div>
                    </SelectItem>
                    <SelectItem value="nurse">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        Nurse
                      </div>
                    </SelectItem>
                    <SelectItem value="caretaker">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-600" />
                        Caretaker
                      </div>
                    </SelectItem>
                    <SelectItem value="therapist">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-orange-500" />
                        Therapist
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="staff.name@rehab.com"
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Must be a valid email format
                </p>
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

              <div className="space-y-2">
                <Label htmlFor="status">Initial Status</Label>
                <Select
                  value={formData.isOnDuty ? 'on-duty' : 'off-duty'}
                  onValueChange={(value) => handleInputChange('isOnDuty', value === 'on-duty')}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select initial status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on-duty">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-green-500" />
                        On Duty
                      </div>
                    </SelectItem>
                    <SelectItem value="off-duty">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-gray-400" />
                        Off Duty
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding Staff...
                    </>
                  ) : (
                    'Add Staff Member'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                >
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
                        {formData.name || 'Staff Member Name'}
                      </h3>
                      <Badge variant="secondary" className={getRoleColor(formData.role)}>
                        {getRoleIcon(formData.role)}
                        <span className="ml-1">{formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}</span>
                      </Badge>
                    </div>
                  </div>
                  <Badge variant={formData.isOnDuty ? 'default' : 'secondary'}>
                    <Activity className={`h-3 w-3 mr-1 ${formData.isOnDuty ? 'text-green-500' : 'text-gray-400'}`} />
                    {formData.isOnDuty ? 'On Duty' : 'Off Duty'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium text-foreground">
                    {formData.email || 'email@example.com'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium text-foreground">
                    {formData.phone || '555-0123'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Assigned Patients</span>
                  <span className="font-medium text-foreground">
                    0 patients
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Role</span>
                  <span className="font-medium text-foreground">
                    {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card variant="flat" className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Staff Information</h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• Choose the appropriate designation for the staff member</p>
                    <p>• Doctors can be assigned to patients for medical oversight</p>
                    <p>• Nurses, caretakers, and therapists handle daily patient care</p>
                    <p>• Email format must be valid for system notifications</p>
                    <p>• Phone number is used for emergency contact</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}