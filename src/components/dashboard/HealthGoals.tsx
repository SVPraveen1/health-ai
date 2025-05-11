import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus, Check, Award, Target, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HealthGoal } from "@/types/health-metrics";
import { format } from "date-fns";

interface Props {
  goals: HealthGoal[];
  onAddGoal: (goal: Omit<HealthGoal, "id" | "user_id" | "created_at" | "updated_at">) => void;
  onUpdateGoal: (goalId: string, progress: number) => void;
}

const HealthGoals: React.FC<Props> = ({ goals, onAddGoal, onUpdateGoal }) => {
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    type: "activity",
    target: "",
    deadline: "",
    progress: 0,
    completed: false
  });

  const getGoalIcon = (type: string) => {
    switch (type) {
      case "sleep":
        return "🌙";
      case "activity":
        return "🏃";
      case "weight":
        return "⚖️";
      case "steps":
        return "👣";
      case "blood_pressure":
        return "❤️";
      case "heart_rate":
        return "💓";
      default:
        return "🎯";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddGoal({
      ...newGoal,
      target: Number(newGoal.target),
      progress: 0,
      completed: false
    });
    setNewGoal({
      title: "",
      description: "",
      type: "activity",
      target: "",
      deadline: "",
      progress: 0,
      completed: false
    });
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-green-500";
    if (progress >= 75) return "bg-emerald-500";
    if (progress >= 50) return "bg-amber-500";
    return "bg-blue-500";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Health Goals</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Health Goal</DialogTitle>
              <DialogDescription>
                Set a specific, measurable health goal with a deadline
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Increase daily steps"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Walk more to improve fitness"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select 
                    value={newGoal.type}
                    onValueChange={(value) => setNewGoal(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sleep">Sleep</SelectItem>
                      <SelectItem value="activity">Activity</SelectItem>
                      <SelectItem value="weight">Weight</SelectItem>
                      <SelectItem value="steps">Steps</SelectItem>
                      <SelectItem value="blood_pressure">Blood Pressure</SelectItem>
                      <SelectItem value="heart_rate">Heart Rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target">Target Value</Label>
                  <Input
                    id="target"
                    type="number"
                    value={newGoal.target}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, target: e.target.value }))}
                    placeholder="e.g., 10000"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
                  required
                />
              </div>

              <Button type="submit" className="w-full">Create Goal</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((goal) => (
          <motion.div
            key={goal.id}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-card/95 hover:bg-card/90 transition-colors backdrop-blur-sm border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{getGoalIcon(goal.type)}</span>
                    {goal.title}
                  </div>
                  {goal.completed && (
                    <Check className="h-5 w-5 text-green-500" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{goal.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(goal.progress)}%</span>
                </div>
                <Progress 
                  value={goal.progress} 
                  className="h-2" 
                  indicatorClassName={getProgressColor(goal.progress)}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <Target className="h-4 w-4 mr-1" />
                    {goal.target} {goal.type === "activity" ? "mins" : goal.type === "weight" ? "kg" : ""}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {format(new Date(goal.deadline), "MMM d, yyyy")}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HealthGoals;