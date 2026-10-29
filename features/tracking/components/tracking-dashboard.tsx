"use client";

import { useState } from "react";
import { Check, Flame, Plus, Trash2, Clock, Activity as ActivityIcon, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  createHabit, 
  deleteHabit, 
  toggleHabitLog, 
  createActivity, 
  deleteActivity,
  createHobby,
  deleteHobby
} from "@/features/tracking/actions";
import { cn } from "@/lib/utils";

type Habit = { id: string; title: string; isDoneToday: boolean; streak: number };
type Activity = { id: string; title: string; category: string; durationMinutes: number; date: string; notes?: string };
type Hobby = { id: string; title: string };

export function TrackingDashboard({
  initialHabits,
  initialActivities,
  initialHobbies,
  todayStr,
}: {
  initialHabits: Habit[];
  initialActivities: Activity[];
  initialHobbies: Hobby[];
  todayStr: string;
}) {
  const [activeTab, setActiveTab] = useState<"habits" | "activities" | "hobbies">("habits");

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-2 border-b pb-2">
        <Button variant={activeTab === "habits" ? "default" : "ghost"} onClick={() => setActiveTab("habits")}>
          Daily Habits
        </Button>
        <Button variant={activeTab === "activities" ? "default" : "ghost"} onClick={() => setActiveTab("activities")}>
          Activity Log
        </Button>
        <Button variant={activeTab === "hobbies" ? "default" : "ghost"} onClick={() => setActiveTab("hobbies")}>
          My Hobbies
        </Button>
      </div>

      {/* 1. HABITS TAB */}
      {activeTab === "habits" && (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <form action={createHabit} className="flex gap-2">
                <Input name="title" placeholder="Add a new daily habit (e.g., Read 10 pages, Drink water)..." required />
                <Button type="submit"><Plus className="h-4 w-4 mr-2" /> Add Habit</Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {initialHabits.map((habit) => (
              <Card key={habit.id} className={cn("transition-colors", habit.isDoneToday && "border-primary/50 bg-primary/5")}>
                <CardContent className="p-4 flex flex-col justify-between h-full gap-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="font-medium">{habit.title}</div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteHabit(habit.id)}>
                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Flame className={cn("h-4 w-4 mr-1", habit.streak > 0 ? "text-orange-500" : "")} />
                      {habit.streak} day streak
                    </div>
                    <Button 
                      variant={habit.isDoneToday ? "secondary" : "outline"} 
                      size="sm"
                      onClick={() => toggleHabitLog(habit.id, todayStr)}
                    >
                      {habit.isDoneToday ? (
                        <><Check className="h-4 w-4 mr-2 text-primary" /> Done</>
                      ) : "Mark Done"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {initialHabits.length === 0 && (
              <p className="col-span-full text-center py-8 text-muted-foreground text-sm">
                No habits yet. Add one above to start tracking your streak!
              </p>
            )}
          </div>
        </div>
      )}

      {/* 2. ACTIVITIES TAB */}
      {activeTab === "activities" && (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Log Form */}
          <Card className="md:col-span-1 h-fit">
            <CardHeader>
              <CardTitle>Log Activity</CardTitle>
              <CardDescription>Record what you did today.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createActivity} className="space-y-4">
                <Input name="title" placeholder="Activity title (e.g., Ran 5km)" required />
                <select name="category" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" required>
                  <option value="study">Study</option>
                  <option value="exercise">Exercise</option>
                  <option value="work">Work</option>
                  <option value="routine">Daily Routine</option>
                  <option value="other">Other</option>
                </select>
                <Input name="durationMinutes" type="number" placeholder="Duration (minutes)" min="1" required />
                <Input name="date" type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} required />
                <Input name="notes" placeholder="Notes (Optional)" />
                <Button type="submit" className="w-full"><ActivityIcon className="h-4 w-4 mr-2" /> Log Activity</Button>
              </form>
            </CardContent>
          </Card>

          {/* Activity List */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="font-medium">Recent Activity</h3>
            {initialActivities.map((activity) => (
              <Card key={activity.id}>
                <CardContent className="p-4 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{activity.title}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary capitalize">{activity.category}</span>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4">
                      <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {activity.durationMinutes} mins</span>
                      <span>{new Date(activity.date).toLocaleString()}</span>
                    </div>
                    {activity.notes && <p className="text-sm text-muted-foreground mt-2">{activity.notes}</p>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteActivity(activity.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
            {initialActivities.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No activities logged yet.</p>
            )}
          </div>
        </div>
      )}

      {/* 3. HOBBIES TAB */}
      {activeTab === "hobbies" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add a Hobby</CardTitle>
              <CardDescription>What do you enjoy doing in your free time?</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createHobby} className="flex gap-2">
                <Input name="title" placeholder="e.g., Playing Guitar, Photography, Chess..." required />
                <Button type="submit"><Plus className="h-4 w-4 mr-2" /> Add Hobby</Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {initialHobbies.map((hobby) => (
              <Card key={hobby.id}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-2 font-medium">
                    <Heart className="h-4 w-4 text-rose-500" />
                    {hobby.title}
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteHobby(hobby.id)}>
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
            {initialHobbies.length === 0 && (
              <p className="col-span-full text-center py-8 text-muted-foreground text-sm">
                No hobbies saved yet. Add one above!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}