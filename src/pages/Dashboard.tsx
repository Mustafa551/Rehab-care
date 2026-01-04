import { useData } from '@/contexts/DataContext';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { StatCard } from '@/components/dashboard/StatCard';
import { PatientCard } from '@/components/patients/PatientCard';
import { ProgressCard } from '@/components/progress/ProgressCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCog, Activity, TrendingUp, Calendar } from 'lucide-react';

export default function Dashboard() {
  const { patients, staffMembers, rehabProgress, mealSchedules, getPatientDoctor } = useData();
  
  // Prevent back navigation to login
  useNavigationGuard();

  const youthPatients = patients.filter(p => p.ageGroup === 'youth');
  const adultPatients = patients.filter(p => p.ageGroup === 'adult');
  const avgProgress = Math.round(
    rehabProgress.reduce((acc, p) => acc + p.progressPercentage, 0) / rehabProgress.length
  );

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to RehabCare Management System</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Patients"
          value={patients.length}
          icon={<Users className="h-6 w-6" />}
        />
        <StatCard
          title="Staff on Duty"
          value={staffMembers.filter(s => s.isOnDuty).length}
          icon={<UserCog className="h-6 w-6" />}
        />
        <StatCard
          title="Average Progress"
          value={`${avgProgress}%`}
          icon={<TrendingUp className="h-6 w-6" />}
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Daily Meals"
          value={mealSchedules.length}
          icon={<Calendar className="h-6 w-6" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Youth Section */}
          <Card variant="default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Youth Section ({youthPatients.length} patients)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {youthPatients.map(patient => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    assignedDoctor={getPatientDoctor(patient.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Adult Section */}
          <Card variant="default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Adult Section ({adultPatients.length} patients)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adultPatients.slice(0, 4).map(patient => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    assignedDoctor={getPatientDoctor(patient.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Meal Schedule */}
          <Card variant="gradient">
            <CardHeader>
              <CardTitle className="text-lg">Today's Meals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mealSchedules.map(meal => (
                <div 
                  key={meal.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50"
                >
                  <span className="font-medium text-foreground">{meal.name}</span>
                  <span className="text-sm text-muted-foreground">{formatTime(meal.time)}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Progress */}
          <Card variant="default">
            <CardHeader>
              <CardTitle className="text-lg">Recent Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rehabProgress.slice(0, 3).map(progress => {
                const patient = patients.find(p => p.id === progress.patientId);
                return (
                  <ProgressCard
                    key={progress.id}
                    progress={progress}
                    patient={patient}
                  />
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
