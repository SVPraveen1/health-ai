import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, Clock, Plus, File, AlertTriangle, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  doctor: string;
  type: string;
  notes: string;
  records?: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  user_id: string;
}

const AppointmentTypes = [
  "General Checkup",
  "Specialist Consultation",
  "Follow-up",
  "Vaccination",
  "Lab Test",
  "Physical Therapy",
] as const;

const timeSlots = Array.from({ length: 9 }, (_, i) => {
  const hour = i + 9; // Start from 9 AM
  return `${hour.toString().padStart(2, '0')}:00`;
});

const Appointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [newAppointment, setNewAppointment] = useState({
    title: "",
    date: "",
    time: "",
    doctor: "",
    type: "",
    notes: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>(timeSlots);

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, [user]);

  const loadAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = async (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      // Get AI recommendation for available slots
      try {
        const { data, error } = await supabase.functions.invoke('gemini-ai', {
          body: {
            type: 'appointment-scheduling',
            date: date.toISOString(),
            appointments: appointments
          }
        });

        if (error) throw error;
        setAvailableSlots(data.availableSlots || timeSlots);
      } catch (error) {
        console.error('Error getting slot recommendations:', error);
        setAvailableSlots(timeSlots);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedDate) return;

    try {
      // Upload health record if selected
      let recordUrl;
      if (selectedFile) {
        const { data, error } = await supabase.storage
          .from('health-records')
          .upload(`${user.id}/${Date.now()}-${selectedFile.name}`, selectedFile);

        if (error) throw error;
        recordUrl = data.path;
      }

      // Create appointment
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          ...newAppointment,
          date: format(selectedDate, 'yyyy-MM-dd'),
          user_id: user.id,
          status: 'scheduled',
          records: recordUrl ? [recordUrl] : undefined
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Appointment Scheduled",
        description: "Your appointment has been successfully scheduled.",
      });

      // Schedule reminder
      await supabase.functions.invoke('schedule-reminder', {
        body: {
          appointmentId: data.id,
          userId: user.id,
          date: data.date,
          time: data.time
        }
      });

      setAppointments(prev => [...prev, data]);
      // Reset form
      setNewAppointment({
        title: "",
        date: "",
        time: "",
        doctor: "",
        type: "",
        notes: "",
      });
      setSelectedFile(null);
    } catch (error: any) {
      console.error('Error scheduling appointment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to schedule appointment",
        variant: "destructive"
      });
    }
  };

  const cancelAppointment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;

      setAppointments(prev =>
        prev.map(apt =>
          apt.id === id ? { ...apt, status: 'cancelled' } : apt
        )
      );

      toast({
        title: "Appointment Cancelled",
        description: "The appointment has been cancelled successfully."
      });
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast({
        title: "Error",
        description: "Failed to cancel appointment",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container px-4 md:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Appointments</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Schedule Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Schedule New Appointment</DialogTitle>
              <DialogDescription>
                Book an appointment and attach any relevant health records.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Appointment Title</Label>
                  <Input
                    id="title"
                    value={newAppointment.title}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select 
                    value={newAppointment.type}
                    onValueChange={(value) => setNewAppointment(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {AppointmentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label>Date</Label>
                  <div className="border rounded-md p-4">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      disabled={(date) => date < new Date()}
                      className="rounded-md border"
                    />
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label>Time</Label>
                  <Select 
                    value={newAppointment.time}
                    onValueChange={(value) => setNewAppointment(prev => ({ ...prev, time: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="doctor">Doctor's Name</Label>
                  <Input
                    id="doctor"
                    value={newAppointment.doctor}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, doctor: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={newAppointment.notes}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any special notes or concerns"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="records">Attach Health Records</Label>
                  <Input
                    id="records"
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.jpg,.png,.doc,.docx"
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full">
                Schedule Appointment
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <div className="grid gap-4">
            {loading ? (
              <Card className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-6 bg-muted rounded w-1/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ) : appointments
                .filter(apt => 
                  apt.status === 'scheduled' && 
                  new Date(`${apt.date} ${apt.time}`) > new Date()
                )
                .map(appointment => (
                  <Card key={appointment.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle>{appointment.title}</CardTitle>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        with Dr. {appointment.doctor}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(appointment.date), 'PPP')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{appointment.time}</span>
                        </div>
                        {appointment.notes && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {appointment.notes}
                          </p>
                        )}
                        {appointment.records && appointment.records.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <File className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {appointment.records.length} attached record(s)
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        className="w-full text-red-600 hover:text-red-700"
                        onClick={() => cancelAppointment(appointment.id)}
                      >
                        Cancel Appointment
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
          </div>
        </TabsContent>

        <TabsContent value="past">
          <div className="grid gap-4">
            {appointments
              .filter(apt => 
                apt.status === 'completed' || 
                (apt.status === 'scheduled' && new Date(`${apt.date} ${apt.time}`) < new Date())
              )
              .map(appointment => (
                <Card key={appointment.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle>{appointment.title}</CardTitle>
                      <Badge className={getStatusColor('completed')}>
                        completed
                      </Badge>
                    </div>
                    <CardDescription>
                      with Dr. {appointment.doctor}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(appointment.date), 'PPP')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{appointment.time}</span>
                      </div>
                      {appointment.notes && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {appointment.notes}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="cancelled">
          <div className="grid gap-4">
            {appointments
              .filter(apt => apt.status === 'cancelled')
              .map(appointment => (
                <Card key={appointment.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle>{appointment.title}</CardTitle>
                      <Badge className={getStatusColor('cancelled')}>
                        cancelled
                      </Badge>
                    </div>
                    <CardDescription>
                      with Dr. {appointment.doctor}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(appointment.date), 'PPP')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{appointment.time}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Appointments;