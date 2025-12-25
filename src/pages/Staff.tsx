import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { StaffCard } from '@/components/staff/StaffCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, RefreshCw, Calendar, Info } from 'lucide-react';
import { format } from 'date-fns';

export default function Staff() {
  const { staffMembers, patients, currentDate, getStaffPatients, assignments } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStaff = staffMembers.filter(staff =>
    staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff Management</h1>
          <p className="text-muted-foreground">View staff assignments and rotation schedule</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Rotation Info Card */}
      <Card variant="gradient">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <RefreshCw className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Daily Staff Rotation</h3>
              <p className="text-sm text-muted-foreground">
                Staff assignments rotate automatically each day. Current rotation date:
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/50 border border-border/50">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">
                {format(new Date(currentDate), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How Rotation Works */}
      <Card variant="default">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-info" />
            How Staff Rotation Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">1</span>
              Each patient is assigned exactly one staff member per day
            </li>
            <li className="flex items-start gap-2">
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">2</span>
              Assignments rotate daily to ensure varied care perspectives
            </li>
            <li className="flex items-start gap-2">
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">3</span>
              Use the "Simulate Next Day" button in the header to preview tomorrow's rotation
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map((staff, index) => (
          <div key={staff.id} style={{ animationDelay: `${index * 50}ms` }}>
            <StaffCard
              staff={staff}
              assignedPatients={getStaffPatients(staff.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
