import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { StudyDocumentModel } from "@/models/study";
import { StudyWorkspaceUI } from "@/features/study/components/study-workspace-ui";

export const metadata: Metadata = { title: "Study Workspace" };

export default async function StudyPage() {
  const user = await requireUser();
  await connectToDatabase();

  const docs = await StudyDocumentModel.find({ userId: user.id }).sort({ createdAt: -1 }).lean();
  const serializedDocs = docs.map(d => ({
    id: d._id.toString(),
    fileName: d.fileName,
    fileSize: d.fileSize,
    subject: d.subject,
    status: d.status,
    summary: d.summary,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Study Workspace</h1>
        <p className="text-sm text-muted-foreground">Upload subject PDFs for AI summaries and Q&A.</p>
      </header>
      <StudyWorkspaceUI initialDocs={serializedDocs} />
    </div>
  );
}