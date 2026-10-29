"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { QuizViewer } from "./quiz-viewer";

type Doc = { id: string; fileName: string };
type Question = { question: string; options: string[]; answer_index: number };

export function QuizDashboard({ docs }: { docs: Doc[] }) {
  const searchParams = useSearchParams();
  const fileParam = searchParams.get("file");
  const numParam = searchParams.get("num_questions");

  const [selectedDoc, setSelectedDoc] = useState<string>("");
  const [numQuestions, setNumQuestions] = useState<number>(5); // 👈 Default to 5
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [error, setError] = useState("");

  // Auto-select document and trigger generation based on URL param
  useEffect(() => {
    if (fileParam && docs.length > 0 && !questions && !isGenerating) {
      const matchedDoc = docs.find(d => 
        d.fileName.toLowerCase().includes(fileParam.toLowerCase()) || 
        fileParam.toLowerCase().includes(d.fileName.toLowerCase())
      );
      
      if (matchedDoc) {
        setSelectedDoc(matchedDoc.id);
        // Set the number of questions from URL if available
        const qCount = numParam ? parseInt(numParam) : 5;
        setNumQuestions(qCount);
        generateQuiz(matchedDoc.id, qCount);
      }
    }
  }, [fileParam, numParam, docs]);

  const generateQuiz = async (docId: string, qCount: number) => {
    setIsGenerating(true);
    setError("");
    setQuestions(null);

    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          documentId: docId,
          num_questions: qCount // 👈 Send the number of questions
        }),
      });

      if (!res.ok) throw new Error("Failed to generate quiz");
      
      const data = await res.json();
      setQuestions(data.questions);
    } catch (err) {
      setError("Failed to generate quiz. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = () => {
    if (selectedDoc) generateQuiz(selectedDoc, numQuestions);
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Generate a New Quiz</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">Select a Document</label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={selectedDoc}
              onChange={(e) => setSelectedDoc(e.target.value)}
            >
              <option value="" disabled>Select a PDF...</option>
              {docs.map((doc) => (
                <option key={doc.id} value={doc.id}>{doc.fileName}</option>
              ))}
            </select>
          </div>

          {/* 👇 New Dropdown for Number of Questions */}
          <div className="w-full sm:w-[180px] space-y-2">
            <label className="text-sm font-medium">Questions</label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
            >
              <option value={5}>5 Questions</option>
              <option value={10}>10 Questions</option>
              <option value={15}>15 Questions</option>
              <option value={20}>20 Questions</option>
            </select>
          </div>

          <Button onClick={handleGenerate} disabled={!selectedDoc || isGenerating}>
            {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="mr-2 h-4 w-4" /> Generate Quiz</>}
          </Button>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      {questions && (
        <QuizViewer questions={questions} />
      )}
    </div>
  );
}