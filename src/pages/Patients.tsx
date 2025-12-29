import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { PatientCard } from '@/components/patients/PatientCard';
import { AddPatientDialog } from '@/components/patients/AddPatientDialog';
import { PatientDetailsDialog } from '@/components/patients/PatientDetailsDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Users, Baby, Plus, UserPlus } from 'lucide-react';
import { Patient } from '@/types';

export default function Patients() {
  const { patients, getPatientAssignment, getPatientDoctor } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.condition.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.roomNumber.toString().includes(searchTerm)
  );

  const youthPatients = filteredPatients.filter(p => p.ageGroup === 'youth');
  const adultPatients = filteredPatients.filter(p => p.ageGroup === 'adult');

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patients</h1>
          <p className="text-muted-foreground">Manage all patients in the rehabilitation center</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <AddPatientDialog 
            trigger={
              <Button className="gap-2 whitespace-nowrap">
                <UserPlus className="h-4 w-4" />
                Add Patient
              </Button>
            }
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="all" className="gap-2">
            <Users className="h-4 w-4" />
            All ({filteredPatients.length})
          </TabsTrigger>
          <TabsTrigger value="youth" className="gap-2">
            <Baby className="h-4 w-4" />
            Youth ({youthPatients.length})
          </TabsTrigger>
          <TabsTrigger value="adult" className="gap-2">
            <Users className="h-4 w-4" />
            Adult ({adultPatients.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {filteredPatients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatients.map((patient, index) => (
                <div key={patient.id} style={{ animationDelay: `${index * 50}ms` }}>
                  <PatientCard
                    patient={patient}
                    assignedDoctor={getPatientDoctor(patient.id)}
                    onClick={() => handlePatientClick(patient)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No patients found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first patient'}
              </p>
              {!searchTerm && (
                <AddPatientDialog 
                  trigger={
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add First Patient
                    </Button>
                  }
                />
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="youth" className="mt-6">
          <div className="mb-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <h3 className="font-semibold text-foreground mb-1">Youth Section (Rooms 201-210)</h3>
            <p className="text-sm text-muted-foreground">
              Patients under 18 years old with specialized care programs
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {youthPatients.map((patient, index) => (
              <div key={patient.id} style={{ animationDelay: `${index * 50}ms` }}>
                <PatientCard
                  patient={patient}
                  assignedDoctor={getPatientDoctor(patient.id)}
                  onClick={() => handlePatientClick(patient)}
                />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="adult" className="mt-6">
          <div className="mb-4 p-4 rounded-lg bg-secondary/50 border border-secondary">
            <h3 className="font-semibold text-foreground mb-1">Adult Section (Rooms 101-110)</h3>
            <p className="text-sm text-muted-foreground">
              Patients 18 years and older with comprehensive rehabilitation programs
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adultPatients.map((patient, index) => (
              <div key={patient.id} style={{ animationDelay: `${index * 50}ms` }}>
                <PatientCard
                  patient={patient}
                  assignedDoctor={getPatientDoctor(patient.id)}
                  onClick={() => handlePatientClick(patient)}
                />
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Patient Details Dialog */}
      <PatientDetailsDialog
        patient={selectedPatient}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}
