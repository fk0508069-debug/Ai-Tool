import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { ConversationModel, MessageModel } from "@/models/chat";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { message, history = [], conversationId, fileName } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    await connectToDatabase();

    let convId = conversationId;
    if (!convId) {
      const newConv = await ConversationModel.create({ userId: user.id, title: message.substring(0, 30) });
      convId = newConv._id;
    }

    await MessageModel.create({
      conversationId: convId,
      role: "user",
      content: message,
    });

    const pythonApiUrl = process.env.PYTHON_AI_API_URL || "http://127.0.0.1:8000/chat";
    const response = await fetch(pythonApiUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.INTERNAL_API_SECRET}` 
      },
      body: JSON.stringify({
        message: message,
        history: history,
        user_id: user.id,
        user_name: user.name || user.email.split("@")[0],
        file_name: fileName || null,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Python API failed: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();

    await MessageModel.create({
      conversationId: convId,
      role: "assistant",
      content: data.reply,
    });

    return NextResponse.json({ 
      reply: data.reply, 
      conversationId: convId,
      redirect: data.redirect // 👈 Pass redirect to Client
    });

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Failed to communicate with the AI." }, { status: 500 });
  }
}