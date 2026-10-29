import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { MemoryModel } from "@/models/memory";
import { UserProfileModel } from "@/models/user-profile";
import { HobbyModel, HabitModel, ActivityModel } from "@/models/tracking";
import { TaskModel } from "@/models/task";
import { GoalModel } from "@/models/goal";
import { StudyDocumentModel } from "@/models/study";
import { UserModel } from "@/models/user";

export async function GET(req: Request) {
  try {
    const userId = req.headers.get("X-User-Id");
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    // Fetch EVERYTHING in parallel from MongoDB
    const [user, profile, aiMemories, hobbies, tasks, goals, habits, activities, documents] = await Promise.all([
      UserModel.findById(userId).lean(),
      UserProfileModel.findOne({ userId }).lean(),
      MemoryModel.find({ userId }).sort({ createdAt: -1 }).limit(20).lean(),
      HobbyModel.find({ userId }).lean(),
      TaskModel.find({ userId }).lean(),
      GoalModel.find({ userId, status: "active" }).lean(),
      HabitModel.find({ userId }).lean(),
      ActivityModel.find({ userId }).sort({ date: -1 }).limit(10).lean(),
      StudyDocumentModel.find({ userId }).lean(),
    ]);

    // Compile into one clean JSON object
    const fullContext = {
      profile: {
        name: user?.name,
        email: user?.email,
        studyScheme: profile?.studyScheme || "Not specified",
        dailyRoutine: profile?.dailyRoutine || "Not specified",
      },
      aiMemories: aiMemories.map(m => ({ category: m.category, content: m.content })),
      hobbies: hobbies.map(h => h.title),
      tasks: tasks.map(t => ({ title: t.title, status: t.status, dueDate: t.dueDate })),
      goals: goals.map(g => ({ title: g.title, type: g.type })),
      habits: habits.map(h => h.title),
      recentActivities: activities.map(a => ({ title: a.title, duration: a.durationMinutes, category: a.category })),
      documents: documents.map(d => ({ fileName: d.fileName, subject: d.subject })),
    };

    return NextResponse.json({ ok: true, context: fullContext });
  } catch (error) {
    console.error("Context route failed:", error);
    return NextResponse.json({ ok: false, error: "Failed to fetch full context" }, { status: 500 });
  }
}