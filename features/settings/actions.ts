"use server";

import bcrypt from "bcryptjs";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { profileSchema, updatePasswordSchema } from "@/lib/validation/settings";
import { userRepository } from "@/repositories/user.repository";

export type SettingsFormState = { error?: string; success?: string };
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export async function updateProfileAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid profile details." };

  const image = formData.get("image");
  const updates: { name: string; image?: string } = { name: parsed.data.name };
  
  if (image instanceof File && image.size > 0) {
    if (image.size > MAX_IMAGE_BYTES) return { error: "Profile picture must be 2 MB or smaller." };
    if (!image.type.startsWith("image/")) return { error: "Profile picture must be an image." };
    const bytes = Buffer.from(await image.arrayBuffer()).toString("base64");
    updates.image = `data:${image.type};base64,${bytes}`;
  }

  await connectToDatabase();
  await userRepository.updateProfile(user.id, updates);
  return { success: "Profile updated successfully." };
}

export async function updatePasswordAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const user = await requireUser();
  const parsed = updatePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid password details." };

  await connectToDatabase();
  const storedUser = await userRepository.findByIdWithPassword(user.id);
  
  if (!storedUser?.passwordHash || !(await bcrypt.compare(parsed.data.currentPassword, storedUser.passwordHash))) {
    return { error: "Current password is incorrect." };
  }

  await userRepository.updatePassword(user.id, await bcrypt.hash(parsed.data.newPassword, 12));
  return { success: "Password updated successfully." };
}