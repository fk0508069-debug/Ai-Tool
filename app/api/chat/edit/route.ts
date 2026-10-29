import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { MessageModel } from "@/models/chat";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { messageId, newContent, conversationId, history } = await req.json();

    await connectToDatabase();

    // 1. Find the original message to get its timestamp
    const originalMessage = await MessageModel.findById(messageId);
    if (!originalMessage) return NextResponse.json({ error: "Message not found" }, { status: 404 });

    // 2. Update the message content
    originalMessage.content = newContent;
    await originalMessage.save();

    // 3. Delete all messages in this conversation that came AFTER the edited message
    await MessageModel.deleteMany({
      conversationId,
      createdAt: { $gt: originalMessage.createdAt }
    });

    // 4. Call Python Backend for the new AI response
    const pythonApiUrl = process.env.PYTHON_AI_API_URL || "http://127.0.0.1:8000/chat";
    const response = await fetch(pythonApiUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.INTERNAL_API_SECRET}` 
      },
      body: JSON.stringify({
        message: newContent,
        history: history, 
        user_id: user.id,
        user_name: user.name || user.email.split("@")[0],
        file_name: null,
      }),
    });

    if (!response.ok) throw new Error("Python API failed");
    const data = await response.json();

    // 5. Save the new AI response
    const aiMessage = await MessageModel.create({
      conversationId,
      role: "assistant",
      content: data.reply,
    });

    return NextResponse.json({ 
      reply: data.reply, 
      redirect: data.redirect 
    });

  } catch (error) {
    console.error("Edit API Error:", error);
    return NextResponse.json({ error: "Failed to edit message." }, { status: 500 });
  }
}