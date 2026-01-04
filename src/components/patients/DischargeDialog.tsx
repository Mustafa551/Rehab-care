import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  Pill, 
  User, 
  MapPin,
  CheckCircle,
  Clock,
  Receipt,
  CreditCard
} from 'lucide-react';
import { Patient, StaffMember } from '@/types';
import { toast } from 'sonner';

interface DischargeDialogProps {
  patient: Patient;
  assignedDoctor: StaffMember | null;
  trigger?: React.ReactNode;
}

interface DischargeExpense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
}

export function DischargeDialog({ patient, assignedDoctor, trigger }: DischargeDialogProps) {
  const { getPatientCondition, dischargePatient } = useData();
  const [open, setOpen] = useState(false);
  const [isDischarging, setIsDischarging] = useState(false);

  const patientCondition = getPatientCondition(patient.id.toString());
  
  // Mock discharge expenses - in real app, this would come from API
  const dischargeExpenses: DischargeExpense[] = [
    {
      id: '1',
      category: 'Room Charges',
      description: 'Room accommodation (7 days)',
      amount: 3500,
      date: new Date().toISOString().split('T')[0]
    },
    {
      id: '2',
      category: 'Medical Services',
      description: 'Doctor consultations and assessments',
      amount: 2000,
      date: new Date().toISOString().split('T')[0]
    },
    {
      id: '3',
      category: 'Nursing Care',
      description: 'Nursing services and vital monitoring',
      amount: 1500,
      date: new Date().toISOString().split('T')[0]
    },
    {
      id: '4',
      category: 'Medications',
      description: 'Prescribed medications and treatments',
      amount: 800,
      date: new Date().toISOString().split('T')[0]
    },
    {
      id: '5',
      category: 'Physiotherapy',
      description: 'Rehabilitation and therapy sessions',
      amount: 1200,
      date: new Date().toISOString().split('T')[0]
    }
  ];

  const totalExpenses = dischargeExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const initialDeposit = patient.initialDeposit || 5000;
  const finalAmount = totalExpenses - initialDeposit;

  const handleDischarge = async () => {
    setIsDischarging(true);
    try {
      await dischargePatient(patient.id.toString());
      toast.success(`${patient.name} has been successfully discharged`);
      setOpen(false);
    } catch (error) {
      toast.error('Failed to discharge patient');
    } finally {
      setIsDischarging(false);
    }
  };

  const admissionDate = new Date(patient.admissionDate || patient.createdAt || new Date());
  const dischargeDate = new Date();
  const stayDuration = Math.ceil((dischargeDate.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" size="sm" className="gap-2">
            <Receipt className="h-4 w-4" />
            Discharge
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Discharge Summary - {patient.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p className="font-semibold">{patient.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Age</p>
                  <p className="font-semibold">{patient.age} years</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Room Number</p>
                  <p className="font-semibold">Room {patient.roomNumber}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Admission Date</p>
                  <p className="font-semibold">{admissionDate.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Discharge Date</p>
                  <p className="font-semibold">{dischargeDate.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Length of Stay</p>
                  <p className="font-semibold">{stayDuration} days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Medical Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Initial Condition</p>
                <p className="font-medium">{patient.medicalCondition || patient.condition}</p>
              </div>
              
              {assignedDoctor && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Attending Doctor</p>
                  <p className="font-medium">{assignedDoctor.name}</p>
                </div>
              )}

              {patientCondition && (
                <>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Final Assessment</p>
                    <p className="font-medium">{patientCondition.condition}</p>
                  </div>
                  
                  {patientCondition.notes && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Doctor's Notes</p>
                      <p className="font-medium">{patientCondition.notes}</p>
                    </div>
                  )}

                  {patientCondition.dischargeNotes && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Discharge Instructions</p>
                      <p className="font-medium">{patientCondition.dischargeNotes}</p>
                    </div>
                  )}

                  {patientCondition.medications && patientCondition.medications.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Prescribed Medications</p>
                      <div className="space-y-2">
                        {patientCondition.medications.map((medication: any) => (
                          <div key={medication.id} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{medication.name}</span>
                              <Badge variant="outline">{medication.dosage}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {medication.frequency} - {medication.notes || 'No special instructions'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Expenses Breakdown */}
              <div className="space-y-3">
                <h4 className="font-medium">Expenses Breakdown</h4>
                {dischargeExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between py-2 border-b">
                    <div>
                      <p className="font-medium">{expense.category}</p>
                      <p className="text-sm text-muted-foreground">{expense.description}</p>
                    </div>
                    <p className="font-semibold">PKR {expense.amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Summary Calculations */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Total Expenses</p>
                  <p className="font-semibold">PKR {totalExpenses.toLocaleString()}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-medium">Initial Deposit</p>
                  <p className="font-semibold text-green-600">- PKR {initialDeposit.toLocaleString()}</p>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-lg">
                  <p className="font-bold">
                    {finalAmount >= 0 ? 'Amount Due' : 'Refund Amount'}
                  </p>
                  <p className={`font-bold ${finalAmount >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    PKR {Math.abs(finalAmount).toLocaleString()}
                  </p>
                </div>
              </div>

              {finalAmount < 0 && (
                <Alert>
                  <CreditCard className="h-4 w-4" />
                  <AlertDescription>
                    A refund of PKR {Math.abs(finalAmount).toLocaleString()} will be processed to the patient.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Discharge Confirmation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Discharge Confirmation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertDescription>
                  By clicking "Complete Discharge", you confirm that:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>All medical treatments have been completed</li>
                    <li>Patient is medically stable for discharge</li>
                    <li>All discharge instructions have been provided</li>
                    <li>Financial settlement has been reviewed</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button
                  onClick={handleDischarge}
                  disabled={isDischarging}
                  className="flex-1"
                  size="lg"
                >
                  {isDischarging ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Processing Discharge...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Discharge
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  size="lg"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}