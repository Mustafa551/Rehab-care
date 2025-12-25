import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { DoctorNoteCard } from '@/components/notes/DoctorNoteCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function DoctorNotes() {
  const { doctorNotes, patients, addDoctorNote } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState({
    patientId: '',
    doctorName: '',
    notes: '',
    type: 'general' as 'general' | 'progress' | 'medication' | 'therapy',
  });

  const filteredNotes = doctorNotes.filter(note => {
    const patient = patients.find(p => p.id === note.patientId);
    return (
      patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.notes.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleAddNote = () => {
    if (!newNote.patientId || !newNote.doctorName || !newNote.notes) {
      toast.error('Please fill in all fields');
      return;
    }

    addDoctorNote({
      ...newNote,
      date: format(new Date(), 'yyyy-MM-dd'),
    });

    setNewNote({
      patientId: '',
      doctorName: '',
      notes: '',
      type: 'general',
    });
    setIsDialogOpen(false);
    toast.success('Note added successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Doctor Notes</h1>
          <p className="text-muted-foreground">View and add medical notes for patients</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Doctor Note</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Patient</label>
                  <Select
                    value={newNote.patientId}
                    onValueChange={(value) => setNewNote({ ...newNote, patientId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map(patient => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name} (Room {patient.roomNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Doctor Name</label>
                  <Input
                    placeholder="Enter doctor name"
                    value={newNote.doctorName}
                    onChange={(e) => setNewNote({ ...newNote, doctorName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Note Type</label>
                  <Select
                    value={newNote.type}
                    onValueChange={(value: any) => setNewNote({ ...newNote, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="progress">Progress</SelectItem>
                      <SelectItem value="medication">Medication</SelectItem>
                      <SelectItem value="therapy">Therapy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Notes</label>
                  <Textarea
                    placeholder="Enter medical notes..."
                    value={newNote.notes}
                    onChange={(e) => setNewNote({ ...newNote, notes: e.target.value })}
                    rows={4}
                  />
                </div>

                <Button onClick={handleAddNote} className="w-full">
                  Add Note
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {['general', 'progress', 'medication', 'therapy'].map(type => {
          const count = doctorNotes.filter(n => n.type === type).length;
          return (
            <Card key={type} variant="default">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{count}</p>
                    <p className="text-sm text-muted-foreground capitalize">{type}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredNotes.map((note, index) => {
          const patient = patients.find(p => p.id === note.patientId);
          return (
            <div key={note.id} style={{ animationDelay: `${index * 50}ms` }}>
              <DoctorNoteCard note={note} patient={patient} />
            </div>
          );
        })}
      </div>

      {filteredNotes.length === 0 && (
        <Card variant="default" className="py-12">
          <CardContent className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">No notes found</p>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? 'Try a different search term' : 'Add your first doctor note'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
