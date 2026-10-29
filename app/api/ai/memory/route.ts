import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { MemoryModel } from "@/models/memory";

export async function GET(req: Request) {
  try {
    const userId = req.headers.get("X-User-Id");
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";

    let filter: any = { userId };

    // If the AI asks a broad question, fetch the latest 15 memories
    const genericQueries = ["me", "myself", "all", "about me", "*", "everything"];
    if (!genericQueries.includes(query.toLowerCase().trim()) && query.trim() !== "") {
      filter.$or = [
        { content: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } }
      ];
    }

    const memories = await MemoryModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(15)
      .lean();

    return NextResponse.json({ ok: true, memories });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Failed to search memories" }, { status: 500 });
  }
}