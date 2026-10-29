"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, RotateCcw, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

type Question = {
  question: string;
  options: string[];
  answer_index: number;
};

export function QuizViewer({ questions }: { questions: Question[] }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showCorrect, setShowCorrect] = useState(false);

  const question = questions[currentQ];

  const handleSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
  };

  const handleReset = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setShowCorrect(false);
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((prev) => prev + 1);
      handleReset();
    }
  };

  const isCorrect = selectedOption === question.answer_index;

  return (
    <Card className="max-w-3xl mx-auto shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Question {currentQ + 1} of {questions.length}</CardTitle>
          <span className="text-sm text-muted-foreground">
            Score: {isAnswered && isCorrect ? "1" : "0"} / 1
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-base font-medium leading-relaxed">{question.question}</p>

        <div className="grid gap-3">
          {question.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const isCorrectAnswer = question.answer_index === index;
            
            let buttonStyle = "bg-card border-border hover:bg-accent";
            if (isAnswered) {
              if (isSelected && isCorrect) buttonStyle = "bg-green-500/20 border-green-500 text-green-700 dark:text-green-400";
              else if (isSelected && !isCorrect) buttonStyle = "bg-red-500/20 border-red-500 text-red-700 dark:text-red-400";
              else if (showCorrect && isCorrectAnswer) buttonStyle = "bg-green-500/20 border-green-500 text-green-700 dark:text-green-400";
              else buttonStyle = "bg-muted opacity-50";
            }

            return (
              <button
                key={index}
                onClick={() => handleSelect(index)}
                disabled={isAnswered}
                className={cn(
                  "flex items-center justify-between w-full p-4 text-left rounded-lg border-2 transition-all",
                  buttonStyle
                )}
              >
                <span>{option}</span>
                {isAnswered && isSelected && isCorrect && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                {isAnswered && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-600" />}
                {isAnswered && !isSelected && showCorrect && isCorrectAnswer && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        {isAnswered && (
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            {!isCorrect && !showCorrect && (
              <Button variant="outline" className="flex-1" onClick={() => setShowCorrect(true)}>
                <Eye className="mr-2 h-4 w-4" /> Show Correct Answer
              </Button>
            )}
            
            <Button variant="outline" className="flex-1" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" /> Reset Question
            </Button>

            {isCorrect && currentQ < questions.length - 1 && (
              <Button className="flex-1" onClick={handleNext}>
                Next Question
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}