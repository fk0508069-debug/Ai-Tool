"use client";

import { useState } from "react";
import { FileText, UploadCloud, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter } from "next/navigation";

type StudyDoc = {
  id: string;
  fileName: string;
  fileSize: number;
  subject: string;
  status: string;
  summary?: string;
};

export function StudyWorkspaceUI({ initialDocs }: { initialDocs: StudyDoc[] }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [subject, setSubject] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !subject) return;

    if (file.size > 15 * 1024 * 1024) {
      setError("File is larger than 15MB.");
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("subject", subject);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      setFile(null);
      setSubject("");
      router.refresh(); // Refresh server component data
    } catch (err) {
      setError("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Upload Form */}
      <Card className="md:col-span-1 h-fit">
        <CardHeader>
          <CardTitle>Upload Material</CardTitle>
          <CardDescription>Upload a PDF (Max 15MB).</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <Input 
              placeholder="Subject (e.g., Computer Science)" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required 
            />
            
            {/* FIXED DROPZONE */}
            <div className="relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors">
              <input 
                type="file" 
                accept=".pdf" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                title="" // Removes default browser tooltip
              />
              <UploadCloud className="h-8 w-8 text-muted-foreground mb-2 pointer-events-none" />
              <span className="text-sm font-medium pointer-events-none">
                {file ? file.name : "Click to select PDF"}
              </span>
            </div>
            
            {error && <p className="text-xs text-destructive">{error}</p>}
            
            <Button type="submit" className="w-full" disabled={!file || !subject || uploading}>
              {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : "Upload & Analyze"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Uploaded Documents List */}
      <div className="md:col-span-2 space-y-4">
        <h3 className="font-semibold flex items-center"><BookOpen className="mr-2 h-5 w-5" /> Your Study Library</h3>
        
        {initialDocs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No documents uploaded yet. Upload a PDF to get started.
            </CardContent>
          </Card>
        ) : (
          initialDocs.map((doc) => (
            <Card key={doc.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" /> {doc.fileName}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Subject: <span className="font-medium text-foreground">{doc.subject}</span> • {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                    </CardDescription>
                  </div>
                  <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 rounded-md font-medium">
                    {doc.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-md p-4 border text-sm text-muted-foreground">
                  <strong className="text-foreground block mb-1">AI Summary:</strong>
                  {doc.summary}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}