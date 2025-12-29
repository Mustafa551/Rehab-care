import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { StaffCard } from '@/components/staff/StaffCard';
import { PatientCard } from '@/components/patients/PatientCard';
import { AddStaffDialog } from '@/components/staff/AddStaffDialog';
import { AddPatientDialog } from '@/components/patients/AddPatientDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, RefreshCw, Calendar, Info, Loader2, AlertCircle, Users, UserCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';

export default function Staff() {
  const { 
    staffMembers,
    patients,
    assignments,
    currentDate, 
    getStaffPatients,
    getPatientDoctor,
    isLoadingStaff,
    isLoadingPatients, 
    isLoadingAssignments,
    staffError,
    patientError,
    assignmentError, 
    refreshStaff,
    refreshPatients,
    refreshAssignments
  } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredStaff = staffMembers.filter(staff =>
    staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.condition.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.roomNumber.toString().includes(searchTerm)
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshStaff(), refreshPatients(), refreshAssignments()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRegenerateAssignments = async () => {
    setIsRefreshing(true);
    try {
      await refreshAssignments();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff & Patient Management</h1>
          <p className="text-muted-foreground">View staff assignments, patient assignments, and rotation schedule</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff or patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoadingStaff || isLoadingPatients}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="default"
            onClick={handleRegenerateAssignments}
            disabled={isRefreshing || isLoadingAssignments}
            className="gap-2"
          >
            <UserCheck className="h-4 w-4" />
            Assign Today
          </Button>
          <AddStaffDialog />
          <AddPatientDialog />
        </div>
      </div>

      {/* Current Date and Rotation Info */}
      <Card variant="flat" className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">
                  Current Assignment Date: {format(new Date(currentDate), 'EEEE, MMMM d, yyyy')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Non-doctor staff assignments rotate daily • Doctor assignments are permanent
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">
                Assignments: {assignments.length} total
              </p>
              <p className="text-xs text-muted-foreground">
                {patients.length} patients • {staffMembers.filter(s => s.isOnDuty).length} active staff
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alerts */}
      {staffError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Staff Error: {staffError}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {patientError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Patient Error: {patientError}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {assignmentError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Assignment Error: {assignmentError}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

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
              Each patient is assigned one rotating staff member (nurse, caretaker, therapist) per day
            </li>
            <li className="flex items-start gap-2">
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">2</span>
              Doctors have permanent assignments and do not rotate daily
            </li>
            <li className="flex items-start gap-2">
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">3</span>
              Use the "Simulate Next Day" button in the header to rotate non-doctor staff assignments
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Tabs for Staff and Patients */}
      <Tabs defaultValue="staff" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="staff" className="gap-2">
            <UserCheck className="h-4 w-4" />
            Staff ({filteredStaff.length})
          </TabsTrigger>
          <TabsTrigger value="patients" className="gap-2">
            <Users className="h-4 w-4" />
            Patients ({filteredPatients.length})
          </TabsTrigger>
        </TabsList>

        {/* Staff Tab */}
        <TabsContent value="staff" className="mt-6">
          {/* Loading State */}
          {(isLoadingStaff || isLoadingAssignments) && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>
                  {isLoadingStaff && isLoadingAssignments 
                    ? 'Loading staff and assignments...'
                    : isLoadingStaff 
                    ? 'Loading staff members...'
                    : 'Loading assignments...'}
                </span>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingStaff && !isLoadingAssignments && !staffError && staffMembers.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">No Staff Members Found</h3>
                    <p className="text-muted-foreground">Get started by adding your first staff member.</p>
                  </div>
                  <AddStaffDialog trigger={
                    <Button>
                      Add First Staff Member
                    </Button>
                  } />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Staff Grid */}
          {!isLoadingStaff && !isLoadingAssignments && filteredStaff.length > 0 && (
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
          )}

          {/* No Search Results */}
          {!isLoadingStaff && !isLoadingAssignments && staffMembers.length > 0 && filteredStaff.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">No Results Found</h3>
                    <p className="text-muted-foreground">
                      No staff members match your search for "{searchTerm}".
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setSearchTerm('')}>
                    Clear Search
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Patients Tab */}
        <TabsContent value="patients" className="mt-6">
          {/* Loading State */}
          {isLoadingPatients && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading patients...</span>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingPatients && !patientError && patients.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">No Patients Found</h3>
                    <p className="text-muted-foreground">Get started by adding your first patient.</p>
                  </div>
                  <AddPatientDialog trigger={
                    <Button>
                      Add First Patient
                    </Button>
                  } />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Patients Grid */}
          {!isLoadingPatients && filteredPatients.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatients.map((patient, index) => (
                <div key={patient.id} style={{ animationDelay: `${index * 50}ms` }}>
                  <PatientCard
                    patient={patient}
                    assignedDoctor={getPatientDoctor(patient.id.toString())}
                  />
                </div>
              ))}
            </div>
          )}

          {/* No Search Results */}
          {!isLoadingPatients && patients.length > 0 && filteredPatients.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">No Results Found</h3>
                    <p className="text-muted-foreground">
                      No patients match your search for "{searchTerm}".
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setSearchTerm('')}>
                    Clear Search
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
