import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { ProgressCard } from '@/components/progress/ProgressCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Search, TrendingUp, Award, Target } from 'lucide-react';

export default function ProgressPage() {
  const { rehabProgress, patients } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProgress = rehabProgress.filter(progress => {
    const patient = patients.find(p => p.id === progress.patientId);
    return (
      patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      progress.milestone.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const avgProgress = Math.round(
    rehabProgress.reduce((acc, p) => acc + p.progressPercentage, 0) / rehabProgress.length
  );

  const excellentProgress = rehabProgress.filter(p => p.progressPercentage >= 75).length;
  const goodProgress = rehabProgress.filter(p => p.progressPercentage >= 50 && p.progressPercentage < 75).length;
  const needsAttention = rehabProgress.filter(p => p.progressPercentage < 50).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rehab Progress</h1>
          <p className="text-muted-foreground">Track patient rehabilitation milestones and progress</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search progress..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="gradient">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{avgProgress}%</p>
                <p className="text-sm text-muted-foreground">Average Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{excellentProgress}</p>
                <p className="text-sm text-muted-foreground">Excellent (75%+)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{goodProgress}</p>
                <p className="text-sm text-muted-foreground">Good (50-74%)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{needsAttention}</p>
                <p className="text-sm text-muted-foreground">Needs Attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress Bar */}
      <Card variant="default">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Center-wide Recovery Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall patient rehabilitation progress</span>
              <span className="font-semibold text-foreground">{avgProgress}%</span>
            </div>
            <Progress value={avgProgress} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProgress.map((progress, index) => {
          const patient = patients.find(p => p.id === progress.patientId);
          return (
            <div key={progress.id} style={{ animationDelay: `${index * 50}ms` }}>
              <ProgressCard progress={progress} patient={patient} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
