import { DoctorNote, Patient } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface DoctorNoteCardProps {
  note: DoctorNote;
  patient?: Patient;
}

export function DoctorNoteCard({ note, patient }: DoctorNoteCardProps) {
  const typeColors = {
    general: 'bg-muted text-muted-foreground',
    progress: 'bg-success/10 text-success',
    medication: 'bg-warning/10 text-warning',
    therapy: 'bg-info/10 text-info',
  };

  return (
    <Card variant="default" className="animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              {patient && (
                <p className="font-semibold text-foreground">{patient.name}</p>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                {note.doctorName}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className={typeColors[note.type]} variant="secondary">
              {note.type.charAt(0).toUpperCase() + note.type.slice(1)}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(note.date), 'MMM d, yyyy')}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">{note.notes}</p>
      </CardContent>
    </Card>
  );
}
