import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { habitRepository } from "@/repositories/habit.repository";
import { activityRepository } from "@/repositories/activity.repository";
import { HobbyModel } from "@/models/tracking";
import { TrackingDashboard } from "@/features/tracking/components/tracking-dashboard";

export const metadata: Metadata = { title: "Habits & Activities" };

export default async function HabitsPage() {
  const user = await requireUser();
  await connectToDatabase();

  // Fetch data from database
  const habits = await habitRepository.findByUser(user.id);
  const logs = await habitRepository.getLogsForUser(user.id);
  const activities = await activityRepository.findByUser(user.id);
  const hobbies = await HobbyModel.find({ userId: user.id }).sort({ createdAt: -1 }).lean();

  // Format today's date string (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split("T")[0];

  // Serialize Habits & Calculate Streaks
  const serializedHabits = habits.map((h) => {
    const habitLogs = logs.filter((l) => l.habitId.toString() === h._id.toString());
    const loggedDates = habitLogs.map((l) => l.dateString);
    const isDoneToday = loggedDates.includes(todayStr);

    // Calculate streak
    let streak = 0;
    let checkDate = new Date();
    
    // If not done today, start checking from yesterday
    if (!isDoneToday) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if (loggedDates.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      id: h._id.toString(),
      title: h.title,
      isDoneToday,
      streak,
    };
  });

  // Serialize Activities
  const serializedActivities = activities.map((a) => ({
    id: a._id.toString(),
    title: a.title,
    category: a.category,
    durationMinutes: a.durationMinutes,
    date: a.date.toISOString(),
    notes: a.notes,
  }));

  // Serialize Hobbies
  const serializedHobbies = hobbies.map((h) => ({
    id: h._id.toString(),
    title: h.title,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Habits & Activities</h1>
        <p className="text-sm text-muted-foreground">
          Track your daily recurring habits, log activities, and save your hobbies.
        </p>
      </header>

      <TrackingDashboard
        initialHabits={serializedHabits}
        initialActivities={serializedActivities}
        initialHobbies={serializedHobbies}
        todayStr={todayStr}
      />
    </div>
  );
}