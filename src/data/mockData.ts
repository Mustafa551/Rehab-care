import { Patient, StaffMember, MealSchedule, DoctorNote, RehabProgress, StaffAssignment } from '@/types';

export const patients: Patient[] = [
  { id: 'p1', name: 'John Anderson', age: 45, ageGroup: 'adult', roomNumber: 101, admissionDate: '2024-01-15', condition: 'Post-surgery rehabilitation', assignedStaffId: null, assignedDoctorId: null },
  { id: 'p2', name: 'Maria Garcia', age: 62, ageGroup: 'adult', roomNumber: 102, admissionDate: '2024-02-01', condition: 'Stroke recovery', assignedStaffId: null, assignedDoctorId: null },
  { id: 'p3', name: 'Tommy Wilson', age: 16, ageGroup: 'youth', roomNumber: 201, admissionDate: '2024-01-20', condition: 'Sports injury rehabilitation', assignedStaffId: null, assignedDoctorId: null },
  { id: 'p4', name: 'Sarah Chen', age: 55, ageGroup: 'adult', roomNumber: 103, admissionDate: '2024-02-10', condition: 'Joint replacement recovery', assignedStaffId: null, assignedDoctorId: null },
  { id: 'p5', name: 'Emma Thompson', age: 14, ageGroup: 'youth', roomNumber: 202, admissionDate: '2024-02-05', condition: 'Physical therapy', assignedStaffId: null, assignedDoctorId: null },
  { id: 'p6', name: 'Robert Johnson', age: 70, ageGroup: 'adult', roomNumber: 104, admissionDate: '2024-01-28', condition: 'Cardiac rehabilitation', assignedStaffId: null, assignedDoctorId: null },
  { id: 'p7', name: 'Lucas Martinez', age: 17, ageGroup: 'youth', roomNumber: 203, admissionDate: '2024-02-12', condition: 'Accident recovery', assignedStaffId: null, assignedDoctorId: null },
  { id: 'p8', name: 'Patricia Brown', age: 48, ageGroup: 'adult', roomNumber: 105, admissionDate: '2024-02-08', condition: 'Neurological rehabilitation', assignedStaffId: null, assignedDoctorId: null },
  { id: 'p9', name: 'James Lee', age: 15, ageGroup: 'youth', roomNumber: 204, admissionDate: '2024-02-14', condition: 'Orthopedic rehabilitation', assignedStaffId: null, assignedDoctorId: null },
  { id: 'p10', name: 'Helen Davis', age: 58, ageGroup: 'adult', roomNumber: 106, admissionDate: '2024-02-03', condition: 'Pulmonary rehabilitation', assignedStaffId: null, assignedDoctorId: null },
];

export const staffMembers: StaffMember[] = [
  { id: 's1', name: 'Dr. Emily Watson', role: 'nurse', email: 'emily.watson@rehab.com', phone: '555-0101', isOnDuty: true },
  { id: 's2', name: 'Michael Torres', role: 'caretaker', email: 'michael.torres@rehab.com', phone: '555-0102', isOnDuty: true },
  { id: 's3', name: 'Lisa Park', role: 'therapist', email: 'lisa.park@rehab.com', phone: '555-0103', isOnDuty: true },
  { id: 's4', name: 'David Kim', role: 'nurse', email: 'david.kim@rehab.com', phone: '555-0104', isOnDuty: true },
  { id: 's5', name: 'Jennifer Adams', role: 'caretaker', email: 'jennifer.adams@rehab.com', phone: '555-0105', isOnDuty: true },
  { id: 's6', name: 'Robert Chen', role: 'therapist', email: 'robert.chen@rehab.com', phone: '555-0106', isOnDuty: true },
  { id: 's7', name: 'Amanda White', role: 'nurse', email: 'amanda.white@rehab.com', phone: '555-0107', isOnDuty: true },
  { id: 's8', name: 'Carlos Rivera', role: 'caretaker', email: 'carlos.rivera@rehab.com', phone: '555-0108', isOnDuty: true },
  { id: 's9', name: 'Sarah Miller', role: 'therapist', email: 'sarah.miller@rehab.com', phone: '555-0109', isOnDuty: true },
  { id: 's10', name: 'Kevin Brown', role: 'nurse', email: 'kevin.brown@rehab.com', phone: '555-0110', isOnDuty: true },
  // Doctors
  { id: 'd1', name: 'Dr. Smith', role: 'doctor', email: 'dr.smith@rehab.com', phone: '555-0201', isOnDuty: true },
  { id: 'd2', name: 'Dr. Johnson', role: 'doctor', email: 'dr.johnson@rehab.com', phone: '555-0202', isOnDuty: true },
  { id: 'd3', name: 'Dr. Williams', role: 'doctor', email: 'dr.williams@rehab.com', phone: '555-0203', isOnDuty: true },
  { id: 'd4', name: 'Dr. Davis', role: 'doctor', email: 'dr.davis@rehab.com', phone: '555-0204', isOnDuty: true },
  { id: 'd5', name: 'Dr. Martinez', role: 'doctor', email: 'dr.martinez@rehab.com', phone: '555-0205', isOnDuty: true },
];

export const mealSchedules: MealSchedule[] = [
  { id: 'm1', name: 'Breakfast', time: '07:30', description: 'Morning meal with balanced nutrition' },
  { id: 'm2', name: 'Morning Snack', time: '10:00', description: 'Light healthy snack' },
  { id: 'm3', name: 'Lunch', time: '12:30', description: 'Main midday meal' },
  { id: 'm4', name: 'Afternoon Snack', time: '15:30', description: 'Light refreshment' },
  { id: 'm5', name: 'Dinner', time: '18:30', description: 'Evening meal' },
  { id: 'm6', name: 'Evening Snack', time: '20:30', description: 'Optional light snack' },
];

export const doctorNotes: DoctorNote[] = [
  { id: 'dn1', patientId: 'p1', doctorName: 'Dr. Smith', date: '2024-02-15', notes: 'Patient showing good progress in mobility exercises. Continue current therapy regimen.', type: 'progress' },
  { id: 'dn2', patientId: 'p2', doctorName: 'Dr. Johnson', date: '2024-02-14', notes: 'Speech therapy showing improvement. Recommend increasing session frequency.', type: 'therapy' },
  { id: 'dn3', patientId: 'p3', doctorName: 'Dr. Williams', date: '2024-02-15', notes: 'Excellent recovery from sports injury. Expected discharge in 2 weeks.', type: 'general' },
  { id: 'dn4', patientId: 'p4', doctorName: 'Dr. Smith', date: '2024-02-13', notes: 'Post-operative healing well. Pain management adjusted.', type: 'medication' },
  { id: 'dn5', patientId: 'p5', doctorName: 'Dr. Davis', date: '2024-02-15', notes: 'Physical therapy progressing well. Patient motivated and cooperative.', type: 'progress' },
];

export const rehabProgress: RehabProgress[] = [
  { id: 'rp1', patientId: 'p1', date: '2024-02-15', milestone: 'Walking without support', progressPercentage: 75, notes: 'Great improvement in balance' },
  { id: 'rp2', patientId: 'p2', date: '2024-02-14', milestone: 'Speech clarity improvement', progressPercentage: 60, notes: 'Consistent daily exercises' },
  { id: 'rp3', patientId: 'p3', date: '2024-02-15', milestone: 'Full range of motion', progressPercentage: 90, notes: 'Ready for advanced exercises' },
  { id: 'rp4', patientId: 'p4', date: '2024-02-13', milestone: 'Independent mobility', progressPercentage: 45, notes: 'Steady progress' },
  { id: 'rp5', patientId: 'p5', date: '2024-02-15', milestone: 'Strength building', progressPercentage: 70, notes: 'Excellent muscle recovery' },
  { id: 'rp6', patientId: 'p6', date: '2024-02-12', milestone: 'Cardiac endurance', progressPercentage: 55, notes: 'Monitoring closely' },
  { id: 'rp7', patientId: 'p7', date: '2024-02-14', milestone: 'Pain-free movement', progressPercentage: 65, notes: 'Good response to treatment' },
  { id: 'rp8', patientId: 'p8', date: '2024-02-15', milestone: 'Cognitive exercises', progressPercentage: 50, notes: 'Daily improvement noted' },
  { id: 'rp9', patientId: 'p9', date: '2024-02-14', milestone: 'Bone healing', progressPercentage: 80, notes: 'Ahead of schedule' },
  { id: 'rp10', patientId: 'p10', date: '2024-02-15', milestone: 'Breathing exercises', progressPercentage: 40, notes: 'Gradual improvement' },
];

// Function to generate daily staff rotation (excludes doctors)
export function generateDailyAssignments(date: string, staffMembers?: StaffMember[]): StaffAssignment[] {
  const dateObj = new Date(date);
  const dayOfYear = Math.floor((dateObj.getTime() - new Date(dateObj.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  
  const assignments: StaffAssignment[] = [];
  const availableStaff = staffMembers || [];
  
  // Filter out doctors - they don't rotate
  const rotatingStaff = availableStaff.filter(staff => staff.role !== 'doctor');
  
  if (!rotatingStaff || rotatingStaff.length === 0) {
    return assignments;
  }
  
  patients.forEach((patient, index) => {
    // Rotate only non-doctor staff based on day of year
    const staffIndex = (index + dayOfYear) % rotatingStaff.length;
    assignments.push({
      id: `a-${patient.id}-${date}`,
      staffId: rotatingStaff[staffIndex].id.toString(),
      patientId: patient.id,
      date: date,
    });
  });
  
  return assignments;
}
