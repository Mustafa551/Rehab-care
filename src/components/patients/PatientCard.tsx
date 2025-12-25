import { Patient, StaffMember } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, Calendar, Stethoscope } from 'lucide-react';
import { format } from 'date-fns';

interface PatientCardProps {
  patient: Patient;
  assignedStaff: StaffMember | null;
  onClick?: () => void;
}

export function PatientCard({ patient, assignedStaff, onClick }: PatientCardProps) {
  return (
    <Card 
      variant="interactive" 
      className="animate-fade-in"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">
              {patient.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{patient.name}</h3>
              <p className="text-sm text-muted-foreground">Age: {patient.age}</p>
            </div>
          </div>
          <Badge variant={patient.ageGroup === 'youth' ? 'default' : 'secondary'}>
            {patient.ageGroup === 'youth' ? 'Youth' : 'Adult'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Room</span>
          <span className="font-medium text-foreground">{patient.roomNumber}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Admitted</span>
          <span className="font-medium text-foreground">
            {format(new Date(patient.admissionDate), 'MMM d, yyyy')}
          </span>
        </div>
        
        <div className="flex items-start gap-2 text-sm">
          <Stethoscope className="h-4 w-4 text-muted-foreground mt-0.5" />
          <span className="text-muted-foreground line-clamp-2">{patient.condition}</span>
        </div>

        {assignedStaff && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Assigned:</span>
              <span className="text-sm font-medium text-foreground">{assignedStaff.name}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
