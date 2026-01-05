import { Patient, StaffMember } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, MapPin, Calendar, Stethoscope, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { useData } from '@/contexts/DataContext';
import { DischargeDialog } from './DischargeDialog';
import { useState, useEffect } from 'react';

interface PatientCardProps {
  patient: Patient;
  assignedDoctor: StaffMember | null;
  onClick?: () => void;
}

export function PatientCard({ patient, assignedDoctor, onClick }: PatientCardProps) {
  const { isPatientReadyForDischarge } = useData();
  const [isReadyForDischarge, setIsReadyForDischarge] = useState(false);
  const [isCheckingDischarge, setIsCheckingDischarge] = useState(true);

  // Check discharge status on mount and when patient changes
  useEffect(() => {
    const checkDischargeStatus = async () => {
      setIsCheckingDischarge(true);
      try {
        const ready = await isPatientReadyForDischarge(patient.id.toString());
        setIsReadyForDischarge(ready);
      } catch (error) {
        console.error('Failed to check discharge status:', error);
        setIsReadyForDischarge(false);
      } finally {
        setIsCheckingDischarge(false);
      }
    };

    checkDischargeStatus();
  }, [patient.id]); // Only depend on patient ID to avoid unnecessary re-renders

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on discharge button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onClick?.();
  };

  return (
    <Card 
      variant="interactive" 
      className="animate-fade-in cursor-pointer hover:shadow-lg transition-all duration-200"
      onClick={handleCardClick}
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

        {assignedDoctor && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Doctor:</span>
              <span className="text-sm font-medium text-foreground">{assignedDoctor.name}</span>
            </div>
          </div>
        )}

        {/* Discharge Button */}
        {!isCheckingDischarge && isReadyForDischarge && (
          <div className="pt-3 border-t border-border">
            <DischargeDialog
              patient={patient}
              assignedDoctor={assignedDoctor}
              trigger={
                <Button 
                  variant="default" 
                  size="sm" 
                  className="w-full gap-2 bg-green-600 hover:bg-green-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Receipt className="h-4 w-4" />
                  Ready for Discharge
                </Button>
              }
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
