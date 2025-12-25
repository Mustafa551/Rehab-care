import { useData } from '@/contexts/DataContext';
import { MealScheduleCard } from '@/components/meals/MealScheduleCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UtensilsCrossed, Clock, Info } from 'lucide-react';

export default function MealSchedule() {
  const { mealSchedules, patients } = useData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meal Schedule</h1>
        <p className="text-muted-foreground">Manage dietary timing and meal plans for all patients</p>
      </div>

      {/* Overview Card */}
      <Card variant="gradient">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <UtensilsCrossed className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Daily Meal Schedule</h3>
              <p className="text-sm text-muted-foreground">
                {mealSchedules.length} scheduled meals for {patients.length} patients
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/50 border border-border/50">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                Click edit to modify times
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dietary Guidelines */}
      <Card variant="default">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-info" />
            Dietary Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="space-y-2">
              <p className="font-medium text-foreground">Youth Section:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Higher caloric intake for growth</li>
                <li>Balanced nutrients for development</li>
                <li>Age-appropriate portions</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">Adult Section:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Condition-specific dietary plans</li>
                <li>Medication timing considerations</li>
                <li>Therapeutic nutrition focus</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meal Schedule Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mealSchedules.map((meal, index) => (
          <div key={meal.id} style={{ animationDelay: `${index * 50}ms` }}>
            <MealScheduleCard meal={meal} />
          </div>
        ))}
      </div>
    </div>
  );
}
