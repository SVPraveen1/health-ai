
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
  const [open, setOpen] = useState(false);
  
  const [newMedication, setNewMedication] = useState({
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
    <div className="container px-4 md:px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Medication Management</h1>
            <p className="text-muted-foreground">
              Track and manage your medications with smart reminders
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1">
                <Plus className="h-4 w-4" />
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
        </div>

        {error && (
          <Card className="mb-6 border-destructive bg-destructive/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <p className="font-medium text-destructive">{error}</p>
              </div>
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={() => window.location.reload()}
              >
                Try again
              </Button>
            </CardContent>
          </Card>
        )}

        {!error && medications.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground py-8">No medications added yet.</p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="default">Add your first medication</Button>
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
                      <label htmlFor="name-empty" className="text-sm font-medium">
                        Medication Name
                      </label>
                      <Input
                        id="name-empty"
                        name="name" 
                        placeholder="e.g., Lisinopril"
                        value={newMedication.name}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="dosage-empty" className="text-sm font-medium">
                        Dosage
                      </label>
                      <Input 
                        id="dosage-empty"
                        name="dosage" 
                        placeholder="e.g., 10mg"
                        value={newMedication.dosage}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="frequency-empty" className="text-sm font-medium">
                        Frequency
                      </label>
                      <Select 
                        value={newMedication.frequency}
                        onValueChange={handleFrequencyChange}
                      >
                        <SelectTrigger id="frequency-empty">
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
                      <label htmlFor="time-empty" className="text-sm font-medium">
                        Time(s)
                      </label>
                      <Input 
                        id="time-empty"
                        name="time" 
                        type="time"
                        value={newMedication.time}
                        onChange={handleInputChange}
                      />
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
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {medications.map((medication) => (
              <Card key={medication.id} className={medication.taken ? "bg-muted/50" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {medication.name}
                        {medication.taken && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-normal">
                            Taken
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>{medication.dosage}</CardDescription>
                    </div>
                    <Drawer>
                      <DrawerTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                          >
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="19" cy="12" r="1" />
                            <circle cx="5" cy="12" r="1" />
                          </svg>
                        </Button>
                      </DrawerTrigger>
                      <DrawerContent>
                        <DrawerHeader>
                          <DrawerTitle>{medication.name}</DrawerTitle>
                          <DrawerDescription>Manage your medication</DrawerDescription>
                        </DrawerHeader>
                        <div className="px-4">
                          <Button 
                            variant="outline" 
                            className="w-full mb-2 justify-start"
                            onClick={() => toggleTaken(medication.id)}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Mark as {medication.taken ? "not taken" : "taken"}
                          </Button>
                          <Button 
                            variant="destructive" 
                            className="w-full justify-start"
                            onClick={() => deleteMedicationHandler(medication.id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete medication
                          </Button>
                        </div>
                        <DrawerFooter>
                          <DrawerClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DrawerClose>
                        </DrawerFooter>
                      </DrawerContent>
                    </Drawer>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{medication.frequency}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{medication.time}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-1">
                  <div className="flex justify-between items-center w-full">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => toggleTaken(medication.id)}
                    >
                      {medication.taken ? "Undo" : "Mark as taken"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8"
                      onClick={() => deleteMedicationHandler(medication.id)}
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Enhanced HCI Principles Information */}
        
      </div>
    </div>
  );
};

export default Medication;
