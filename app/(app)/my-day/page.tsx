import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { taskRepository } from "@/repositories/task.repository";
import { habitRepository } from "@/repositories/habit.repository";
import { activityRepository } from "@/repositories/activity.repository";
import { MyDayView } from "@/features/my-day/components/my-day-view";

export const metadata: Metadata = { title: "My Day" };

export default async function MyDayPage() {
  const user = await requireUser();
  await connectToDatabase();

  const tasks = await taskRepository.findByUser(user.id);
  const habits = await habitRepository.findByUser(user.id);
  const logs = await habitRepository.getLogsForUser(user.id);
  const activities = await activityRepository.findByUser(user.id, 5); // just recent 5 for today

  const todayStr = new Date().toISOString().split("T")[0];

  // Filter tasks that are not done
  const pendingTasks = tasks.filter((t) => t.status === "todo").map(t => ({
    id: t._id.toString(),
    title: t.title,
  }));

  // Filter habits not done today
  const habitsWithLogs = habits.map((h) => {
    const isDoneToday = logs.some((l) => l.habitId.toString() === h._id.toString() && l.dateString === todayStr);
    return { id: h._id.toString(), title: h.title, isDoneToday };
  });
  const pendingHabits = habitsWithLogs.filter((h) => !h.isDoneToday);

  const serializedActivities = activities.map((a) => ({
    id: a._id.toString(),
    title: a.title,
    category: a.category,
    durationMinutes: a.durationMinutes,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">My Day</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </header>

      <MyDayView 
        pendingTasks={pendingTasks} 
        pendingHabits={pendingHabits} 
        recentActivities={serializedActivities} 
      />
    </div>
  );
}