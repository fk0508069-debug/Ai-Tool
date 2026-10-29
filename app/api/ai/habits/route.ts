import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { HabitModel } from "@/models/tracking";



export async function GET(req: Request) {
  try {
    const userId = req.headers.get("X-User-Id");
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const habits = await HabitModel.find({ userId }).lean();
    return NextResponse.json({ ok: true, habits });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Failed to fetch habits" }, { status: 500 });
  }
}


export async function POST(req: Request) {
  try {
    const user = await requireUser();
    await connectToDatabase();
    const body = await req.json();

    const habit = await HabitModel.create({
      userId: user.id,
      title: body.title || "New Habit",
    });

    return NextResponse.json({ ok: true, habit_id: habit._id });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Failed to create habit" }, { status: 500 });
  }
}