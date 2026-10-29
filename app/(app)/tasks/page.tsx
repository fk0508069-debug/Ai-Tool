import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { taskRepository } from "@/repositories/task.repository";
import { goalRepository } from "@/repositories/goal.repository";
import { TaskManager } from "@/features/tasks/components/task-manager";

export const metadata: Metadata = { title: "Tasks & Goals" };

export default async function TasksPage() {
  const user = await requireUser();
  await connectToDatabase();

  const tasks = await taskRepository.findByUser(user.id);
  const goals = await goalRepository.findActiveByUser(user.id);

  // Serialize Mongoose documents to plain objects for the client component
  const serializedTasks = tasks.map((t) => ({
    id: t._id.toString(),
    title: t.title,
    status: t.status,
  }));

  const serializedGoals = goals.map((g) => ({
    id: g._id.toString(),
    title: g.title,
    description: g.description,
    type: g.type,
    expiresAt: g.expiresAt?.toISOString() || null,
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Tasks & Goals</h1>
        <p className="text-sm text-muted-foreground">
          Manage your daily to-dos, long-term ambitions, and 24-hour short-term sprints.
        </p>
      </header>

      <TaskManager initialTasks={serializedTasks} initialGoals={serializedGoals} />
    </div>
  );
}