"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { MemoryModel } from "@/models/memory";

export async function deleteMemory(memoryId: string) {
  const user = await requireUser();
  await connectToDatabase();

  // Ensure the user can only delete their own memory
  await MemoryModel.deleteOne({ _id: memoryId, userId: user.id });
  
  revalidatePath("/memory");
}

export async function updateMemory(memoryId: string, content: string) {
  const user = await requireUser();
  await connectToDatabase();

  // Ensure the user can only update their own memory
  await MemoryModel.updateOne(
    { _id: memoryId, userId: user.id },
    { content: content.trim() }
  );

  revalidatePath("/memory");
}