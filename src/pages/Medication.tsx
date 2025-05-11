import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Clock, Bell, Calendar, Trash, Check, AlertCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useAuth } from "@/contexts/AuthContext";
import { getMedications, addMedication, updateMedication, deleteMedication } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInUp, staggerContainer, scaleIn, listItem } from "@/lib/animations";
import PageWrapper from "@/components/PageWrapper";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
  taken: boolean;
  user_id: string;
}

const FREQUENCY_OPTIONS = [
  { value: "Once daily", label: "Once daily" },
  { value: "Twice daily", label: "Twice daily" },
  { value: "Three times daily", label: "Three times daily" },
  { value: "Every other day", label: "Every other day" },
  { value: "As needed", label: "As needed" },
];

const Medication = () => {
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);  const [newMedication, setNewMedication] = useState({
    name: "",
    dosage: "",
    frequency: "Once daily",
    time: "08:00"
  });

  useEffect(() => {
    const loadMedications = async () => {
      if (user) {
        setLoading(true);
        setError(null);
        try {
          const { data, error } = await getMedications(user.id);
          if (error) throw error;
          setMedications(data || []);
        } catch (error: any) {
          console.error("Error loading medications:", error);
          setError("Failed to load medications. Please try again.");
          toast({
            title: "Error",
            description: "Failed to load medications",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      }
    };

    loadMedications();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewMedication(prev => ({ ...prev, [name]: value }));
  };

  const handleFrequencyChange = (value: string) => {
    setNewMedication(prev => ({ ...prev, frequency: value }));
  };

  const validateMedication = (medication: typeof newMedication) => {
    if (!medication.name.trim()) {
      throw new Error("Medication name is required");
    }
    if (!medication.dosage.trim()) {
      throw new Error("Dosage is required");
    }
    if (!medication.frequency) {
      throw new Error("Frequency is required");
    }
    if (!medication.time) {
      throw new Error("Time is required");
    }
  };

  const addMedicationHandler = async () => {
    if (!user) return;
    
    setSubmitting(true);
    try {
      validateMedication(newMedication);
      
      const medication = {
        ...newMedication,
        taken: false,
      };
      
      const { error } = await addMedication(medication, user.id);
      if (error) throw error;
      
      // Refresh medications list
      const { data } = await getMedications(user.id);
      setMedications(data || []);
      
      // Reset form
      setNewMedication({
        name: "",
        dosage: "",
        frequency: "Once daily",
        time: "08:00"
      });
      
      toast({
        title: "Medication Added",
        description: `${medication.name} has been added to your schedule.`,
      });
      
      // Close the dialog
      setOpen(false);
    } catch (error: any) {
      console.error("Error adding medication:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add medication",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTaken = async (id: string) => {
    try {
      const medication = medications.find(med => med.id === id);
      if (!medication) return;
      
      // Optimistically update UI
      setMedications(prev => 
        prev.map(med => 
          med.id === id 
            ? { ...med, taken: !med.taken } 
            : med
        )
      );
      
      const { error } = await updateMedication(id, { taken: !medication.taken });
      if (error) {
        // Revert on error
        setMedications(prev => 
          prev.map(med => 
            med.id === id 
              ? { ...med, taken: medication.taken } 
              : med
          )
        );
        throw error;
      }
      
      toast({
        title: medication.taken ? "Medication Unmarked" : "Medication Marked as Taken",
        description: `${medication.name} ${medication.taken ? "has been reset." : "has been marked as taken."}`,
      });
    } catch (error: any) {
      console.error("Error toggling medication status:", error);
      toast({
        title: "Error",
        description: "Failed to update medication status",
        variant: "destructive"
      });
    }
  };

  const deleteMedicationHandler = async (id: string) => {
    try {
      const medication = medications.find(med => med.id === id);
      if (!medication) return;
      
      // Optimistically update UI
      setMedications(prev => prev.filter(med => med.id !== id));
      
      const { error } = await deleteMedication(id);
      if (error) {
        // Restore on error
        if (medication) {
          setMedications(prev => [...prev, medication]);
        }
        throw error;
      }
      
      toast({
        title: "Medication Removed",
        description: `${medication.name} has been removed from your schedule.`,
        variant: "destructive",
      });
    } catch (error: any) {
      console.error("Error deleting medication:", error);
      toast({
        title: "Error",
        description: "Failed to delete medication",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="container px-4 md:px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Medication Management</h1>
              <p className="text-muted-foreground">
                Loading your medications...
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-6 bg-muted rounded w-1/3"></div>
                  <div className="h-4 bg-muted rounded w-1/4 mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded"></div>
                  </div>
                </CardContent>
                <CardFooter className="pt-1">
                  <div className="w-full flex justify-between">
                    <div className="h-8 bg-muted rounded w-1/4"></div>
                    <div className="h-8 bg-muted rounded w-1/6"></div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <PageWrapper>
      <div className="container mx-auto px-4 py-8">
        <motion.div 
          variants={fadeInUp}
          className="max-w-4xl mx-auto"
        >
          <motion.div
            variants={scaleIn}
            className="flex justify-between items-center mb-6"
          >
            <div>
              <h1 className="text-3xl font-bold mb-2">Medication Management</h1>
              <p className="text-muted-foreground">Track and manage your medications</p>
            </div>            <motion.div whileHover={{ scale: 1.05 }}>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Medication
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Medication</DialogTitle>
                    <DialogDescription>
                      Enter the details of your medication to set up reminders.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Medication Name
                      </label>
                      <Input
                        id="name"
                        name="name" 
                        placeholder="e.g., Lisinopril"
                        value={newMedication.name}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="dosage" className="text-sm font-medium">
                        Dosage
                      </label>
                      <Input 
                        id="dosage"
                        name="dosage" 
                        placeholder="e.g., 10mg"
                        value={newMedication.dosage}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="frequency" className="text-sm font-medium">
                        Frequency
                      </label>
                      <Select 
                        value={newMedication.frequency}
                        onValueChange={handleFrequencyChange}
                      >
                        <SelectTrigger id="frequency">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          {FREQUENCY_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="time" className="text-sm font-medium">
                        Time(s)
                      </label>
                      <Input 
                        id="time"
                        name="time" 
                        type="time"
                        value={newMedication.time}
                        onChange={handleInputChange}
                      />
                      <p className="text-sm text-muted-foreground">
                        For multiple times, use format: 08:00, 20:00
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={addMedicationHandler} 
                      disabled={submitting || !newMedication.name || !newMedication.dosage}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Medication"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </motion.div>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid gap-6 md:grid-cols-2"
          >
            {/* Active Medications */}
            <motion.div variants={fadeInUp}>
              <Card>
                <CardHeader>
                  <CardTitle>Active Medications</CardTitle>
                  <CardDescription>Currently prescribed medications</CardDescription>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="popLayout">
                    {medications.map((med) => (
                      <motion.div
                        key={med.id}
                        variants={listItem}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        layout
                      >
                        <div className="flex items-center justify-between py-2 border-b last:border-b-0">
                          <div className="flex-1 pr-4">
                            <p className="text-sm font-medium">{med.name}</p>
                            <p className="text-xs text-muted-foreground">{med.dosage}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant={med.taken ? "outline" : "default"} 
                              size="sm"
                              onClick={() => toggleTaken(med.id)}
                            >
                              {med.taken ? "Undo" : "Mark as taken"}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteMedicationHandler(med.id)}
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>

            {/* Medication Schedule */}
            <motion.div variants={fadeInUp}>
              <Card>
                <CardHeader>
                  <CardTitle>Today's Schedule</CardTitle>
                  <CardDescription>Upcoming medication reminders</CardDescription>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="popLayout">
                    {medications.filter(med => med.taken).map((item) => (
                      <motion.div
                        key={item.id}
                        variants={listItem}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        layout
                        className="p-4 border rounded-lg mb-4 last:mb-0"
                      >
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.time}</p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteMedicationHandler(item.id)}
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </motion.div>        {/* Add Medication Dialog is now moved to the top button */}
      </div>
    </PageWrapper>
  );
};

export default Medication;
