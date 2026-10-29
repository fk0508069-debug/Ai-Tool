import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { StudyDocumentModel } from "@/models/study";
import { QuizDashboard } from "@/features/quiz/components/quiz-dashboard";

export const metadata: Metadata = { title: "Quiz Generator" };

export default async function QuizPage() {
  const user = await requireUser();
  await connectToDatabase();

  const docs = await StudyDocumentModel.find({ userId: user.id, status: "ready" }).lean();
  
  const serializedDocs = docs.map((d) => ({
    id: d._id.toString(),
    fileName: d.fileName,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Interactive Quiz</h1>
        <p className="text-sm text-muted-foreground">
          Select a document and let the AI generate an interactive quiz for you.
        </p>
      </header>
      <QuizDashboard docs={serializedDocs} />
    </div>
  );
}