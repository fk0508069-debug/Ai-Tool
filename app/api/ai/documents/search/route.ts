import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { StudyDocumentModel } from "@/models/study";

export async function POST(req: Request) {
  try {
    const userId = req.headers.get("X-User-Id");
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const body = await req.json();
    
    // Type safety
    const query = (body.query as string) || "";
    const limit = (body.limit as number) || 3;

    // Split the query into keywords (e.g., "first lecture of MCM" -> ["first", "lecture", "MCM"])
    const keywords = query.split(" ").filter((k) => k.length > 2);
    
    // Create a regex that matches ANY of the keywords
    const searchRegex = keywords.length > 0 
      ? new RegExp(keywords.join("|"), "i") 
      : new RegExp(query, "i");

    const documents = await StudyDocumentModel.find({
      userId,
      $or: [
        { fileName: { $regex: searchRegex } },
        { subject: { $regex: searchRegex } },
        { fullText: { $regex: searchRegex } }
      ]
    }).limit(limit).lean();

    // Format the response for Python
    const formattedDocs = documents.map(doc => ({
      fileName: doc.fileName,
      subject: doc.subject,
      // Return up to 4000 characters of the text so we don't overload the AI
      content: doc.fullText && doc.fullText.trim().length > 0 
        ? doc.fullText.substring(0, 4000) 
        : "No text extracted. This might be a scanned image PDF."
    }));

    return NextResponse.json({ ok: true, documents: formattedDocs });
  } catch (error) {
    console.error("Document search error:", error);
    return NextResponse.json({ ok: false, error: "Failed to search documents" }, { status: 500 });
  }
}