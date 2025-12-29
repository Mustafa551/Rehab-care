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
import { Plus, User, MapPin, Calendar, Stethoscope, Baby, Users } from 'lucide-react';
import { AgeGroup } from '@/types';

interface AddPatientDialogProps {
  trigger?: React.ReactNode;
}

export function AddPatientDialog({ trigger }: AddPatientDialogProps) {
  const { patients, addPatient } = useData();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    condition: '',
    roomNumber: '',
    admissionDate: new Date().toISOString().split('T')[0],
  });

  const ageGroup: AgeGroup = parseInt(formData.age) < 18 ? 'youth' : 'adult';
  
  // Get available room numbers
  const occupiedRooms = patients.map(p => p.roomNumber);
  const youthRooms = Array.from({ length: 10 }, (_, i) => 201 + i);
  const adultRooms = Array.from({ length: 10 }, (_, i) => 101 + i);
  const availableYouthRooms = youthRooms.filter(room => !occupiedRooms.includes(room));
  const availableAdultRooms = adultRooms.filter(room => !occupiedRooms.includes(room));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.age || !formData.condition || !formData.roomNumber) {
      return;
    }

    const newPatient = {
      name: formData.name,
      age: parseInt(formData.age),
      ageGroup,
      roomNumber: parseInt(formData.roomNumber),
      admissionDate: formData.admissionDate,
      condition: formData.condition,
      assignedStaffId: null,
    };

    // Add patient using context function
    addPatient(newPatient);
    
    // Reset form and close dialog
    setFormData({
      name: '',
      age: '',
      condition: '',
      roomNumber: '',
      admissionDate: new Date().toISOString().split('T')[0],
    });
    setOpen(false);
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
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  min="1"
                  max="120"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="Enter age"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomNumber">Room Number *</Label>
                <Select
                  value={formData.roomNumber}
                  onValueChange={(value) => handleInputChange('roomNumber', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select room number" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.age && parseInt(formData.age) < 18 ? (
                      <>
                        <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                          Youth Section (201-210)
                        </div>
                        {availableYouthRooms.map(room => (
                          <SelectItem key={room} value={room.toString()}>
                            Room {room}
                          </SelectItem>
                        ))}
                      </>
                    ) : formData.age && parseInt(formData.age) >= 18 ? (
                      <>
                        <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                          Adult Section (101-110)
                        </div>
                        {availableAdultRooms.map(room => (
                          <SelectItem key={room} value={room.toString()}>
                            Room {room}
                          </SelectItem>
                        ))}
                      </>
                    ) : (
                      <div className="px-2 py-1 text-xs text-muted-foreground">
                        Please enter age first
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admissionDate">Admission Date *</Label>
                <Input
                  id="admissionDate"
                  type="date"
                  value={formData.admissionDate}
                  onChange={(e) => handleInputChange('admissionDate', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Medical Condition *</Label>
                <Textarea
                  id="condition"
                  value={formData.condition}
                  onChange={(e) => handleInputChange('condition', e.target.value)}
                  placeholder="Describe the patient's condition and rehabilitation needs"
                  rows={3}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  Add Patient
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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
                        Age: {formData.age || '--'}
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
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Room</span>
                  <span className="font-medium text-foreground">
                    {formData.roomNumber || '--'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Admitted</span>
                  <span className="font-medium text-foreground">
                    {formData.admissionDate ? 
                      new Date(formData.admissionDate).toLocaleDateString('en-US', {
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
                    {formData.condition || 'Medical condition will appear here...'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Room availability info */}
            <Card variant="flat" className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Room Availability</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Youth (201-210):</span>
                      <span className="ml-1 font-medium">{availableYouthRooms.length} available</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Adult (101-110):</span>
                      <span className="ml-1 font-medium">{availableAdultRooms.length} available</span>
                    </div>
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