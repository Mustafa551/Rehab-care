import { StaffMember, Patient } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Users, Eye } from 'lucide-react';
import { DoctorDetailsDialog } from './DoctorDetailsDialog';
import { NurseDetailsDialog } from './NurseDetailsDialog';

interface StaffCardProps {
  staff: StaffMember;
  assignedPatients: Patient[];
}

export function StaffCard({ staff, assignedPatients }: StaffCardProps) {
  const roleColors = {
    nurse: 'bg-info/10 text-info',
    caretaker: 'bg-success/10 text-success',
    therapist: 'bg-warning/10 text-warning',
    doctor: 'bg-blue-100 text-blue-700',
  };

  return (
    <Card variant="elevated" className="animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-primary text-primary-foreground font-semibold text-lg">
              {staff.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{staff.name}</h3>
              <Badge className={roleColors[staff.role]} variant="secondary">
                {staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}
              </Badge>
            </div>
          </div>
          <Badge variant={staff.isOnDuty ? 'default' : 'outline'}>
            {staff.isOnDuty ? 'On Duty' : 'Off Duty'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{staff.email}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{staff.phone}</span>
        </div>

        {assignedPatients.length > 0 ? (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {staff.role === 'doctor' ? 'Permanent Patients' : 'Today\'s Patients'}
              </span>
              <Badge variant="secondary" className="ml-auto">
                {assignedPatients.length}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1">
              {assignedPatients.map(patient => (
                <Badge key={patient.id} variant="outline" className="text-xs">
                  {patient.name.split(' ')[0]} (Room {patient.roomNumber})
                </Badge>
              ))}
            </div>
            {staff.role === 'doctor' && (
              <>
                <p className="text-xs text-muted-foreground mt-1">
                  Doctor assignments are permanent and do not rotate
                </p>
                <div className="mt-3">
                  <DoctorDetailsDialog 
                    doctor={staff}
                    trigger={
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <Eye className="h-4 w-4" />
                        View Patient Details
                      </Button>
                    }
                  />
                </div>
              </>
            )}
            {staff.role === 'nurse' && (
              <div className="mt-3">
                <NurseDetailsDialog 
                  nurse={staff}
                  trigger={
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Eye className="h-4 w-4" />
                      Nurse Dashboard
                    </Button>
                  }
                />
              </div>
            )}
          </div>
        ) : (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {staff.role === 'doctor' ? 'No permanent patients' : 'No patients assigned today'}
              </span>
              <Badge variant="outline" className="ml-auto">
                0
              </Badge>
            </div>
            {staff.role === 'doctor' && (
              <div className="mt-3">
                <DoctorDetailsDialog 
                  doctor={staff}
                  trigger={
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Eye className="h-4 w-4" />
                      Doctor Dashboard
                    </Button>
                  }
                />
              </div>
            )}
            {staff.role === 'nurse' && (
              <div className="mt-3">
                <NurseDetailsDialog 
                  nurse={staff}
                  trigger={
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Eye className="h-4 w-4" />
                      Nurse Dashboard
                    </Button>
                  }
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
