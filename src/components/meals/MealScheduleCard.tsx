import { useState } from 'react';
import { MealSchedule } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Clock, Edit2, UtensilsCrossed } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

interface MealScheduleCardProps {
  meal: MealSchedule;
}

export function MealScheduleCard({ meal }: MealScheduleCardProps) {
  const { updateMealSchedule } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [editedMeal, setEditedMeal] = useState(meal);

  const handleSave = () => {
    updateMealSchedule(editedMeal);
    setIsEditing(false);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <Card variant="elevated" className="animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{meal.name}</CardTitle>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(meal.time)}
              </div>
            </div>
          </div>
          
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Edit2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit {meal.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Time</label>
                  <Input
                    type="time"
                    value={editedMeal.time}
                    onChange={(e) => setEditedMeal({ ...editedMeal, time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <Textarea
                    value={editedMeal.description}
                    onChange={(e) => setEditedMeal({ ...editedMeal, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <Button onClick={handleSave} className="w-full">
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{meal.description}</p>
      </CardContent>
    </Card>
  );
}
