import { RehabProgress, Patient } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Calendar, Target } from 'lucide-react';
import { format } from 'date-fns';

interface ProgressCardProps {
  progress: RehabProgress;
  patient?: Patient;
}

export function ProgressCard({ progress, patient }: ProgressCardProps) {
  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return 'text-success';
    if (percentage >= 50) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <Card variant="elevated" className="animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              {patient && (
                <p className="font-semibold text-foreground">{patient.name}</p>
              )}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Target className="h-3.5 w-3.5" />
                {progress.milestone}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {format(new Date(progress.date), 'MMM d')}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className={`text-sm font-semibold ${getProgressColor(progress.progressPercentage)}`}>
              {progress.progressPercentage}%
            </span>
          </div>
          <Progress value={progress.progressPercentage} className="h-2" />
        </div>
        <p className="text-sm text-muted-foreground">{progress.notes}</p>
      </CardContent>
    </Card>
  );
}
