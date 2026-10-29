"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, Circle, Activity, Flame } from "lucide-react";
import { toggleTask } from "@/features/tasks/actions";
import { toggleHabitLog } from "@/features/tracking/actions";

type Task = { id: string; title: string };
type Habit = { id: string; title: string; isDoneToday: boolean };
type ActivityItem = { id: string; title: string; category: string; durationMinutes: number };

export function MyDayView({ 
  pendingTasks, 
  pendingHabits, 
  recentActivities 
}: { 
  pendingTasks: Task[]; 
  pendingHabits: Habit[];
  recentActivities: ActivityItem[];
}) {
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Tasks Column */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center">
          <CheckCircle2 className="mr-2 h-5 w-5 text-primary" /> Tasks to do
        </h2>
        <Card>
          <CardContent className="p-0">
            {pendingTasks.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">All tasks completed for today! 🎉</p>
            ) : (
              <div className="divide-y">
                {pendingTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-4">
                    <button onClick={() => toggleTask(task.id)} className="text-muted-foreground hover:text-primary transition-colors">
                      <Circle className="h-5 w-5" />
                    </button>
                    <span className="text-sm font-medium">{task.title}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Habits Column */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center">
          <Flame className="mr-2 h-5 w-5 text-orange-500" /> Habits to keep
        </h2>
        <Card>
          <CardContent className="p-0">
            {pendingHabits.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">All habits done! Great job. 🔥</p>
            ) : (
              <div className="divide-y">
                {pendingHabits.map((habit) => (
                  <div key={habit.id} className="flex items-center justify-between p-4">
                    <span className="text-sm font-medium">{habit.title}</span>
                    <button 
                      onClick={() => toggleHabitLog(habit.id, todayStr)}
                      className="text-xs bg-secondary px-3 py-1 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      Mark Done
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Summary */}
      <div className="md:col-span-2 space-y-4">
        <h2 className="text-lg font-semibold flex items-center">
          <Activity className="mr-2 h-5 w-5 text-blue-500" /> Logged Today
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {recentActivities.length === 0 ? (
            <p className="col-span-full text-sm text-muted-foreground">No activities logged yet.</p>
          ) : (
            recentActivities.map((act) => (
              <Card key={act.id}>
                <CardHeader className="pb-2">
                  <CardDescription className="capitalize text-xs">{act.category}</CardDescription>
                  <CardTitle className="text-base">{act.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{act.durationMinutes} minutes</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}