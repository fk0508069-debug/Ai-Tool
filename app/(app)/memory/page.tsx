import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { MemoryModel } from "@/models/memory";
import { UserProfileModel } from "@/models/user-profile";
import { HobbyModel, HabitModel, ActivityModel } from "@/models/tracking";
import { TaskModel } from "@/models/task";
import { GoalModel } from "@/models/goal";
import { StudyDocumentModel } from "@/models/study";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Heart, CheckCircle2, Flame, BookOpen, User, ArrowRight, Target, Activity } from "lucide-react";
import { MemoryList } from "@/features/memory/components/memory-list";

export const metadata: Metadata = { title: "Memory Center" };

export default async function MemoryCenterPage() {
  const user = await requireUser();
  await connectToDatabase();

  // 1. Fetch EVERYTHING in parallel
  const [profile, aiMemories, hobbies, tasks, goals, habits, activities, documents] = await Promise.all([
    UserProfileModel.findOne({ userId: user.id }).lean(),
    MemoryModel.find({ userId: user.id }).sort({ createdAt: -1 }).lean(),
    HobbyModel.find({ userId: user.id }).lean(),
    TaskModel.find({ userId: user.id }).sort({ createdAt: -1 }).lean(),
    GoalModel.find({ userId: user.id, status: "active" }).lean(),
    HabitModel.find({ userId: user.id }).lean(),
    ActivityModel.find({ userId: user.id }).sort({ date: -1 }).limit(10).lean(),
    StudyDocumentModel.find({ userId: user.id }).lean(),
  ]);

  // Serialize AI Memories for the client component
  const serializedMemories = aiMemories.map((m) => ({
    id: m._id.toString(),
    content: m.content,
    category: m.category,
    date: m.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Memory Center</h1>
        <p className="text-muted-foreground">
          The central vault of everything your AI Life OS knows about you.
        </p>
      </header>

      {/* Profile Info Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <User className="h-5 w-5 text-primary" /> Personal Profile
        </h2>
        <Card>
          <CardContent className="p-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium">{user.name || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium text-sm break-all">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Study Scheme</p>
              <p className="font-medium">{profile?.studyScheme || "Not specified"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Daily Routine</p>
              <p className="font-medium">{profile?.dailyRoutine || "Not specified"}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Grid of ALL Data Summaries */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Hobbies */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Heart className="h-5 w-5 text-rose-500" /> Hobbies
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {hobbies.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {hobbies.map((h) => <li key={h._id.toString()}>{h.title}</li>)}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No hobbies saved.</p>}
          </CardContent>
          <CardFooter className="pt-0 mt-2">
            <Button asChild variant="link" className="px-0 h-auto">
              <Link href="/habits">Manage Hobbies <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Goals */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5 text-purple-500" /> Active Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {goals.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {goals.map((g) => (
                  <li key={g._id.toString()}>
                    <span className="font-medium">{g.title}</span>
                    <span className="text-xs text-muted-foreground ml-2 capitalize">({g.type})</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No active goals.</p>}
          </CardContent>
          <CardFooter className="pt-0 mt-2">
            <Button asChild variant="link" className="px-0 h-auto">
              <Link href="/tasks">Manage Goals <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Tasks */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-5 w-5 text-green-500" /> Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {tasks.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {tasks.slice(0, 5).map((t) => (
                  <li key={t._id.toString()} className={t.status === "done" ? "line-through text-muted-foreground" : ""}>
                    {t.title}
                  </li>
                ))}
                {tasks.length > 5 && <li className="text-muted-foreground text-xs">+ {tasks.length - 5} more...</li>}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No tasks created.</p>}
          </CardContent>
          <CardFooter className="pt-0 mt-2">
            <Button asChild variant="link" className="px-0 h-auto">
              <Link href="/tasks">Manage Tasks <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Habits */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Flame className="h-5 w-5 text-orange-500" /> Tracked Habits
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
             {habits.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {habits.map((h) => <li key={h._id.toString()}>{h.title}</li>)}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No habits tracked.</p>}
          </CardContent>
          <CardFooter className="pt-0 mt-2">
            <Button asChild variant="link" className="px-0 h-auto">
              <Link href="/habits">Manage Habits <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Recent Activities */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-5 w-5 text-blue-500" /> Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
             {activities.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {activities.slice(0, 5).map((a) => (
                  <li key={a._id.toString()}>
                    {a.title} <span className="text-muted-foreground text-xs">({a.durationMinutes}m)</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No activities logged.</p>}
          </CardContent>
          <CardFooter className="pt-0 mt-2">
            <Button asChild variant="link" className="px-0 h-auto">
              <Link href="/habits">Manage Activities <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Study Documents */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-5 w-5 text-indigo-500" /> Study Materials
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
             {documents.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {documents.slice(0, 4).map((d) => <li key={d._id.toString()} className="truncate max-w-full">{d.fileName}</li>)}
                {documents.length > 4 && <li className="text-muted-foreground text-xs">+ {documents.length - 4} more...</li>}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No documents uploaded.</p>}
          </CardContent>
          <CardFooter className="pt-0 mt-2">
            <Button asChild variant="link" className="px-0 h-auto">
              <Link href="/study">Manage Documents <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* AI Memories Section */}
      <section className="space-y-4 pt-6 border-t">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" /> AI Extracted Memories
          </h2>
          <p className="text-sm text-muted-foreground">
            Facts and preferences the AI has saved while chatting with you. You can edit or delete these directly here.
          </p>
        </div>
        <MemoryList initialMemories={serializedMemories} />
      </section>
    </div>
  );
}