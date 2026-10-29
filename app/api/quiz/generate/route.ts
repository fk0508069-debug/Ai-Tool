import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { StudyDocumentModel } from "@/models/study";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    // 👇 Accept num_questions from the frontend
    const { documentId, num_questions = 5 } = await req.json();
    
    await connectToDatabase();
    const doc = await StudyDocumentModel.findOne({ _id: documentId, userId: user.id });
    
    if (!doc || !doc.fullText) {
      return NextResponse.json({ error: "No text found in this document." }, { status: 400 });
    }

    const pythonApiUrl = process.env.PYTHON_AI_API_URL || "http://127.0.0.1:8000/chat";
    const quizUrl = pythonApiUrl.replace("/chat", "/quiz");

    const response = await fetch(quizUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.INTERNAL_API_SECRET}` 
      },
      body: JSON.stringify({
        text: doc.fullText.substring(0, 20000), 
        num_questions: num_questions // 👈 Send it to Python
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Python Quiz API Error:", response.status, errorText);
      throw new Error(`Failed to generate quiz from Python: ${errorText}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Quiz generation error:", error);
    return NextResponse.json({ error: "Failed to generate quiz." }, { status: 500 });
  }
}