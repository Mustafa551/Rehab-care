import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useData } from '@/contexts/DataContext';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { currentDate, rotateStaff } = useData();

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
            <Button onClick={rotateStaff} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Simulate Next Day (Rotate Staff)
            </Button>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
