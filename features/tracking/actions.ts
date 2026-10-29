"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { habitRepository } from "@/repositories/habit.repository";
import { activityRepository } from "@/repositories/activity.repository";
import { HobbyModel, type ActivityCategory } from "@/models/tracking";

// --- Habit Actions ---
export async function createHabit(formData: FormData) {
  const user = await requireUser();
  const title = formData.get("title") as string;
  if (!title?.trim()) return;

  await connectToDatabase();
  await habitRepository.create(user.id, title.trim());
  revalidatePath("/habits");
}

export async function deleteHabit(habitId: string) {
  const user = await requireUser();
  await connectToDatabase();
  await habitRepository.delete(user.id, habitId);
  revalidatePath("/habits");
}

export async function toggleHabitLog(habitId: string, dateString: string) {
  const user = await requireUser();
  await connectToDatabase();
  await habitRepository.toggleLog(user.id, habitId, dateString);
  revalidatePath("/habits");
}

// --- Activity Actions ---
export async function createActivity(formData: FormData) {
  const user = await requireUser();
  const title = formData.get("title") as string;
  const category = formData.get("category") as ActivityCategory;
  const duration = Number(formData.get("durationMinutes"));
  const date = formData.get("date") as string;
  const notes = formData.get("notes") as string;

  if (!title?.trim() || !category || isNaN(duration)) return;

  await connectToDatabase();
  await activityRepository.create(user.id, { title, category, durationMinutes: duration, date, notes });
  revalidatePath("/habits");
}

export async function deleteActivity(activityId: string) {
  const user = await requireUser();
  await connectToDatabase();
  await activityRepository.delete(user.id, activityId);
  revalidatePath("/habits");
}

// --- Hobby Actions ---
export async function createHobby(formData: FormData) {
  const user = await requireUser();
  const title = formData.get("title") as string;
  if (!title?.trim()) return;

  await connectToDatabase();
  await HobbyModel.create({ userId: user.id, title: title.trim() });
  revalidatePath("/habits");
}

export async function deleteHobby(hobbyId: string) {
  const user = await requireUser();
  await connectToDatabase();
  await HobbyModel.deleteOne({ _id: hobbyId, userId: user.id });
  revalidatePath("/habits");
}