import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { TaskModel } from "@/models/task";

export async function POST(req: Request) {
  try {
    // 1. Verify Python API Token
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.INTERNAL_API_SECRET}`) {
      console.error("Task API: Unauthorized token");
      return NextResponse.json({ ok: false, error: "Unauthorized API request" }, { status: 401 });
    }

    // 2. Verify User ID
    const userId = req.headers.get("X-User-Id");
    if (!userId) {
      console.error("Task API: Missing User ID");
      return NextResponse.json({ ok: false, error: "Missing User ID" }, { status: 400 });
    }

    await connectToDatabase();
    const body = await req.json();

    // 3. Create the Task with the AI's data
    const task = await TaskModel.create({
      userId,
      title: body.title || "Untitled Task",
      status: "todo",
      dueDate: body.due_date,
      priority: body.priority,
      notes: body.notes,
    });

    return NextResponse.json({ ok: true, task_id: task._id });
  } catch (error) {
    console.error("AI Task Creation Error:", error); // 👈 CHECK YOUR TERMINAL FOR THIS
    return NextResponse.json({ ok: false, error: "Failed to create task" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.INTERNAL_API_SECRET}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized API request" }, { status: 401 });
    }
    const userId = req.headers.get("X-User-Id");
    if (!userId) return NextResponse.json({ ok: false, error: "Missing User ID" }, { status: 400 });

    await connectToDatabase();
    const tasks = await TaskModel.find({ userId }).lean();
    return NextResponse.json({ ok: true, tasks });
  } catch (error) {
    console.error("AI Task Fetch Error:", error);
    return NextResponse.json({ ok: false, error: "Failed to fetch tasks" }, { status: 500 });
  }
}