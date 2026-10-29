import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { TaskModel } from "@/models/task";
import { ActivityModel, HabitLogModel, HabitModel } from "@/models/tracking";
import { GoalModel } from "@/models/goal";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month"); // Format: YYYY-MM (e.g., 2023-10)
    
    const now = new Date();
    let startDate, endDate;

    if (monthParam) {
      const [year, month] = monthParam.split("-").map(Number);
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59);
    } else {
      // Default to current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    const dateFilter = { $gte: startDate, $lte: endDate };

    // 1. Fetch Tasks
    const tasks = await TaskModel.find({ userId: user.id }).lean();
    const completedTasks = tasks.filter(t => t.status === "done" && new Date(t.updatedAt) >= startDate);
    const pendingTasks = tasks.filter(t => t.status === "todo");

    // 2. Fetch Activities (Total duration)
    const activities = await ActivityModel.find({ userId: user.id, date: dateFilter }).lean();
    const totalActivityMinutes = activities.reduce((sum, act) => sum + act.durationMinutes, 0);

    // 3. Fetch Habits & Logs
    const habits = await HabitModel.find({ userId: user.id }).lean();
    const habitLogs = await HabitLogModel.find({ 
      userId: user.id, 
      dateString: { 
        $gte: startDate.toISOString().split("T")[0], 
        $lte: endDate.toISOString().split("T")[0] 
      } 
    }).lean();

    // 4. Fetch Goals
    const completedGoals = await GoalModel.find({ 
      userId: user.id, 
      status: "completed",
      updatedAt: dateFilter
    }).lean();

    return NextResponse.json({
      ok: true,
      stats: {
        tasksCompleted: completedTasks.length,
        tasksPending: pendingTasks.length,
        totalActivityMinutes,
        habitsCompleted: habitLogs.length,
        totalHabits: habits.length,
        goalsAchieved: completedGoals.length,
      },
      activities,
      habits: habits.map(h => ({ title: h.title, logsCount: habitLogs.filter(l => l.habitId.toString() === h._id.toString()).length })),
      period: { startDate, endDate }
    });
  } catch (error) {
    console.error("Insights API Error:", error);
    return NextResponse.json({ error: "Failed to fetch insights" }, { status: 500 });
  }
}