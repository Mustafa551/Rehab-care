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
    getStaffPatients,
    getPatientDoctor,
    isLoadingStaff,
    isLoadingPatients, 
    staffError,
    patientError,
    refreshStaff,
    refreshPatients,
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
      await Promise.all([refreshStaff(), refreshPatients()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff & Patient Management</h1>
          <p className="text-muted-foreground">Manage staff members and patients</p>
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
          <AddStaffDialog />
          <AddPatientDialog />
        </div>
      </div>

      {/* Staff and Patient Overview */}
      <Card variant="flat" className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">
                  Staff & Patient Overview
                </h3>
                <p className="text-sm text-muted-foreground">
                  Manage your healthcare team and patient records
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">
                {patients.length} patients • {staffMembers.filter(s => s.isOnDuty).length} active staff
              </p>
              <p className="text-xs text-muted-foreground">
                {staffMembers.filter(s => s.role === 'doctor').length} doctors • {staffMembers.filter(s => s.role === 'nurse').length} nurses
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

      {/* Staff Management Info */}
      <Card variant="gradient">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <UserCheck className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Staff Management</h3>
              <p className="text-sm text-muted-foreground">
                Manage your healthcare team members and their patient assignments
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/50 border border-border/50">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">
                {staffMembers.length} Total Staff
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How Staff Management Works */}
      <Card variant="default">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-info" />
            Staff Management Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">1</span>
              Doctors are permanently assigned to patients during registration
            </li>
            <li className="flex items-start gap-2">
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">2</span>
              Nurses can view and update patient vital signs and conditions
            </li>
            <li className="flex items-start gap-2">
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">3</span>
              Use staff cards to view detailed information and patient lists
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
          {isLoadingStaff && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading staff members...</span>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingStaff && !staffError && staffMembers.length === 0 && (
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
          {!isLoadingStaff && filteredStaff.length > 0 && (
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
          {!isLoadingStaff && staffMembers.length > 0 && filteredStaff.length === 0 && (
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
