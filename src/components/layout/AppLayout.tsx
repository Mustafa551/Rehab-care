import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { useData } from '@/contexts/DataContext';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Loader2, AlertCircle } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { currentDate, rotateStaff, assignmentError, isLoadingAssignments } = useData();
  const [isRotating, setIsRotating] = useState(false);

  const handleRotateStaff = async () => {
    setIsRotating(true);
    try {
      await rotateStaff();
    } finally {
      setIsRotating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Today's Date</p>
              <p className="text-lg font-semibold text-foreground">
                {format(new Date(currentDate), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
            <Button 
              onClick={handleRotateStaff} 
              variant="outline" 
              size="sm" 
              className="gap-2" 
              disabled={isRotating || isLoadingAssignments}
            >
              {isRotating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isRotating ? 'Rotating...' : 'Simulate Next Day (Rotate Staff)'}
            </Button>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">
          {/* Assignment Error Alert */}
          {assignmentError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Assignment Error: {assignmentError}
              </AlertDescription>
            </Alert>
          )}
          
          {children}
        </div>
      </main>
    </div>
  );
}
