import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  User, 
  MapPin, 
  Calendar, 
  Stethoscope, 
  Baby, 
  Users, 
  FileText, 
  TrendingUp, 
  Utensils,
  Phone,
  Mail,
  Clock,
  Activity
} from 'lucide-react';
import { Patient, StaffMember } from '@/types';
import { format } from 'date-fns';

interface PatientDetailsDialogProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PatientDetailsDialog({ patient, open, onOpenChange }: PatientDetailsDialogProps) {
  const { getPatientAssignment, doctorNotes, rehabProgress } = useData();
  
  if (!patient) return null;

  const assignedStaff = getPatientAssignment(patient.id);
  const patientNotes = doctorNotes.filter(note => note.patientId === patient.id);
  const patientProgress = rehabProgress.filter(progress => progress.patientId === patient.id);
  
  // Calculate days since admission
  const daysSinceAdmission = Math.floor(
    (new Date().getTime() - new Date(patient.admissionDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Get latest progress
  const latestProgress = patientProgress.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
              {patient.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <span>{patient.name}</span>
              <Badge 
                variant={patient.ageGroup === 'youth' ? 'default' : 'secondary'}
                className="ml-2"
              >
                {patient.ageGroup === 'youth' ? (
                  <>
                    <Baby className="h-3 w-3 mr-1" />
                    Youth
                  </>
                ) : (
                  <>
                    <Users className="h-3 w-3 mr-1" />
                    Adult
                  </>
                )}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="notes">Notes ({patientNotes.length})</TabsTrigger>
            <TabsTrigger value="care">Care Plan</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] mt-4">
            <TabsContent value="overview" className="space-y-4 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Age:</span>
                      <span className="font-medium">{patient.age} years old</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Room:</span>
                      <span className="font-medium">#{patient.roomNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Section:</span>
                      <span className="font-medium">
                        {patient.ageGroup === 'youth' ? 'Youth (201-210)' : 'Adult (101-110)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Admitted:</span>
                      <span className="font-medium">
                        {format(new Date(patient.admissionDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Days in care:</span>
                      <span className="font-medium">{daysSinceAdmission} days</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Assigned Staff */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Assigned Staff
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {assignedStaff ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-semibold">
                            {assignedStaff.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium">{assignedStaff.name}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {assignedStaff.role}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2 pt-2 border-t">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span>{assignedStaff.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{assignedStaff.phone}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No staff assigned today</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Medical Condition */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Medical Condition
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed">{patient.condition}</p>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card variant="flat" className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Doctor Notes</span>
                    </div>
                    <p className="text-2xl font-bold text-primary mt-1">{patientNotes.length}</p>
                  </CardContent>
                </Card>
                
                <Card variant="flat" className="bg-success/5 border-success/20">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-success" />
                      <span className="text-sm text-muted-foreground">Progress Records</span>
                    </div>
                    <p className="text-2xl font-bold text-success mt-1">{patientProgress.length}</p>
                  </CardContent>
                </Card>
                
                <Card variant="flat" className="bg-warning/5 border-warning/20">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-warning" />
                      <span className="text-sm text-muted-foreground">Latest Progress</span>
                    </div>
                    <p className="text-2xl font-bold text-warning mt-1">
                      {latestProgress ? `${latestProgress.progressPercentage}%` : 'N/A'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="progress" className="space-y-4 mt-0">
              {patientProgress.length > 0 ? (
                <div className="space-y-4">
                  {patientProgress
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((progress) => (
                      <Card key={progress.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-medium">{progress.milestone}</h4>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(progress.date), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <Badge variant={
                              progress.progressPercentage >= 80 ? 'default' :
                              progress.progressPercentage >= 60 ? 'secondary' : 'outline'
                            }>
                              {progress.progressPercentage}%
                            </Badge>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 mb-3">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress.progressPercentage}%` }}
                            />
                          </div>
                          {progress.notes && (
                            <p className="text-sm text-muted-foreground">{progress.notes}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No progress records yet</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="notes" className="space-y-4 mt-0">
              {patientNotes.length > 0 ? (
                <div className="space-y-4">
                  {patientNotes
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((note) => (
                      <Card key={note.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-medium">Dr. {note.doctorName}</h4>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(note.date), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <Badge variant="outline" className="capitalize">
                              {note.type}
                            </Badge>
                          </div>
                          <p className="text-foreground leading-relaxed">{note.notes}</p>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No doctor notes yet</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="care" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Utensils className="h-4 w-4" />
                    Care Plan Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Treatment Focus</h4>
                      <p className="text-sm text-muted-foreground">
                        Based on the patient's condition: {patient.condition}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Care Level</h4>
                      <p className="text-sm text-muted-foreground">
                        {patient.ageGroup === 'youth' ? 'Pediatric rehabilitation care' : 'Adult rehabilitation care'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Daily Schedule</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Morning therapy:</span>
                        <span>9:00 AM - 11:00 AM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Afternoon activities:</span>
                        <span>2:00 PM - 4:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Evening assessment:</span>
                        <span>6:00 PM - 7:00 PM</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}