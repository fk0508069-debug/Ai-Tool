"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { taskRepository } from "@/repositories/task.repository";
import { goalRepository } from "@/repositories/goal.repository";

export async function createTask(formData: FormData) {
  const user = await requireUser();
  const title = formData.get("title") as string;
  if (!title?.trim()) return;
  
  await connectToDatabase();
  await taskRepository.create(user.id, title.trim());
  revalidatePath("/tasks");
}

export async function toggleTask(taskId: string) {
  const user = await requireUser();
  await connectToDatabase();
  await taskRepository.toggleStatus(user.id, taskId);
  revalidatePath("/tasks");
}

export async function deleteTask(taskId: string) {
  const user = await requireUser();
  await connectToDatabase();
  await taskRepository.delete(user.id, taskId);
  revalidatePath("/tasks");
}

export async function createGoal(formData: FormData) {
  const user = await requireUser();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const type = formData.get("type") as "long-term" | "short-term";
  
  if (!title?.trim() || !type) return;
  
  await connectToDatabase();
  await goalRepository.create(user.id, { title: title.trim(), description, type });
  revalidatePath("/tasks");
}

export async function completeGoal(goalId: string) {
  const user = await requireUser();
  await connectToDatabase();
  await goalRepository.complete(user.id, goalId);
  revalidatePath("/tasks");
}

export async function deleteGoal(goalId: string) {
  const user = await requireUser();
  await connectToDatabase();
  await goalRepository.delete(user.id, goalId);
  revalidatePath("/tasks");
}