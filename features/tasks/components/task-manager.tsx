"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Clock, Trash2, Target, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createTask, toggleTask, deleteTask, createGoal, completeGoal, deleteGoal } from "@/features/tasks/actions";

type Task = { id: string; title: string; status: "todo" | "done" };
type Goal = { id: string; title: string; description?: string; type: "long-term" | "short-term"; expiresAt: string | null };

export function TaskManager({ initialTasks, initialGoals }: { initialTasks: Task[]; initialGoals: Goal[] }) {
  const [activeTab, setActiveTab] = useState<"tasks" | "long-term" | "short-term">("tasks");

  // Filter tasks into todo and done
  const pendingTasks = initialTasks.filter((t) => t.status === "todo");
  const completedTasks = initialTasks.filter((t) => t.status === "done");

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-2 border-b pb-2">
        <Button variant={activeTab === "tasks" ? "default" : "ghost"} onClick={() => setActiveTab("tasks")}>
          Daily Tasks
        </Button>
        <Button variant={activeTab === "long-term" ? "default" : "ghost"} onClick={() => setActiveTab("long-term")}>
          Long-Term Goals
        </Button>
        <Button variant={activeTab === "short-term" ? "default" : "ghost"} onClick={() => setActiveTab("short-term")}>
          Short-Term (24h)
        </Button>
      </div>

      {/* 1. DAILY TASKS TAB */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <form action={createTask} className="flex gap-2">
                <Input name="title" placeholder="Add a new task..." required />
                <Button type="submit"><Plus className="h-4 w-4 mr-2" /> Add</Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {pendingTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between rounded-lg border bg-card p-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleTask(task.id)} className="text-muted-foreground hover:text-primary">
                    <Circle className="h-5 w-5" />
                  </button>
                  <span>{task.title}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            
            {completedTasks.length > 0 && (
              <div className="pt-4 space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Completed</h4>
                {completedTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
                    <div className="flex items-center gap-3 text-muted-foreground line-through">
                      <button onClick={() => toggleTask(task.id)} className="text-primary">
                        <CheckCircle2 className="h-5 w-5" />
                      </button>
                      <span>{task.title}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. GOALS TABS (Long & Short Term) */}
      {(activeTab === "long-term" || activeTab === "short-term") && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{activeTab === "long-term" ? "Create a Long-Term Goal" : "Create a Short-Term Goal"}</CardTitle>
              <CardDescription>
                {activeTab === "long-term" 
                  ? "These goals stay active until you complete or delete them." 
                  : "These goals will automatically expire and disappear 24 hours after creation."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createGoal} className="space-y-4">
                <input type="hidden" name="type" value={activeTab} />
                <Input name="title" placeholder="Goal title..." required />
                <Input name="description" placeholder="Why is this important? (Optional)" />
                <Button type="submit"><Target className="h-4 w-4 mr-2" /> Set Goal</Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            {initialGoals.filter((g) => g.type === activeTab).map((goal) => {
              const timeLeft = goal.expiresAt 
                ? Math.max(0, Math.floor((new Date(goal.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)))
                : null;

              return (
                <Card key={goal.id} className="flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{goal.title}</CardTitle>
                    {goal.description && <CardDescription>{goal.description}</CardDescription>}
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-end gap-4">
                    {timeLeft !== null && (
                      <div className="flex items-center text-xs text-amber-500 font-medium">
                        <Clock className="h-3 w-3 mr-1" /> {timeLeft} hours remaining
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => completeGoal(goal.id)}>
                        Complete
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteGoal(goal.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {initialGoals.filter((g) => g.type === activeTab).length === 0 && (
              <p className="text-sm text-muted-foreground col-span-2 text-center py-8">
                No {activeTab === "long-term" ? "long-term" : "short-term"} goals yet.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}