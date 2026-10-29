"use client";

import { useState } from "react";
import { Brain, Trash2, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { deleteMemory, updateMemory } from "@/features/memory/actions";

type Memory = {
  id: string;
  content: string;
  category: string;
  date: string;
};

export function MemoryList({ initialMemories }: { initialMemories: Memory[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleEditClick = (memory: Memory) => {
    setEditingId(memory.id);
    setEditContent(memory.content);
  };

  const handleSave = async (id: string) => {
    if (!editContent.trim()) return;
    await updateMemory(id, editContent);
    setEditingId(null);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "preference": return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "personal_fact": return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "goal": return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
      default: return "bg-gray-500/10 text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <div className="space-y-4">
      {initialMemories.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No memories saved yet. Chat with the AI and tell it to remember something about you!
          </CardContent>
        </Card>
      ) : (
        initialMemories.map((memory) => (
          <Card key={memory.id} className="group relative">
            <CardContent className="p-4 sm:p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getCategoryColor(memory.category)}`}>
                    {memory.category.replace("_", " ")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(memory.date).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(memory)}>
                    <Edit2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteMemory(memory.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {editingId === memory.id ? (
                <div className="flex items-center gap-2 mt-2">
                  <Input 
                    value={editContent} 
                    onChange={(e) => setEditContent(e.target.value)} 
                    autoFocus
                  />
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-green-600" onClick={() => handleSave(memory.id)}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" onClick={() => setEditingId(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <p className="text-sm leading-relaxed flex items-start gap-3">
                  <Brain className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  {memory.content}
                </p>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}