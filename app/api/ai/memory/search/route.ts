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

    const memories = await MemoryModel.find({
      userId,
      content: { $regex: query, $options: "i" }
    }).limit(10).lean();

    return NextResponse.json({ ok: true, memories });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Failed to search memories" }, { status: 500 });
  }
}