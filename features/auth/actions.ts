"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { registerSchema } from "@/lib/validation/auth";
import { requestOtpSchema, resetPasswordSchema } from "@/lib/validation/auth";
import { userRepository } from "@/repositories/user.repository";
import { Resend } from "resend";

import { z } from "zod";
import { UserModel } from "@/models/user";
export type AuthFormState = { error?: string };
export type PasswordResetState = { error?: string; success?: string };

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    // New fields
    studyScheme: formData.get("studyScheme"),
    dailyRoutine: formData.get("dailyRoutine"),
    hobbies: formData.get("hobbies"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await connectToDatabase();

  const existing = await userRepository.findByEmail(parsed.data.email);
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  
  // Updated repository call with new fields
  await userRepository.createWithProfile({
    email: parsed.data.email,
    name: parsed.data.name,
    passwordHash,
    studyScheme: parsed.data.studyScheme,
    dailyRoutine: parsed.data.dailyRoutine,
    hobbies: parsed.data.hobbies,
  });

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created, but automatic sign-in failed. Please log in." };
    }
    throw error;
  }

  return {};
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Incorrect email or password." };
    }
    throw error;
  }

  return {};
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function requestOtpAction(
  _prev: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const parsed = requestOtpSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid email address." };

  await connectToDatabase();
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  const user = await userRepository.setResetOtp(parsed.data.email, otp, expiresAt);

  if (user) {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const resend = new Resend(apiKey);
      const result = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "AI Life OS <onboarding@resend.dev>",
        to: parsed.data.email,
        subject: "Your AI Life OS password reset code",
        text: `Your password reset code is ${otp}. It expires in 15 minutes.`,
      });
      if (result.error) throw new Error(`Unable to send password reset email: ${result.error.message}`);
    } else {
      console.log(`[password-reset] ${parsed.data.email}: ${otp}`);
    }
  }

  return { success: "If an account exists for that email, a reset code has been sent." };
}

export async function resetPasswordAction(
  _prev: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const parsed = resetPasswordSchema.safeParse({
    email: formData.get("email"),
    otp: formData.get("otp"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid reset details." };

  await connectToDatabase();
  const user = await userRepository.findByEmail(parsed.data.email);
  if (!user || user.resetOtp !== parsed.data.otp || !user.resetOtpExpiry || user.resetOtpExpiry.getTime() < Date.now()) {
    return { error: "That reset code is invalid or expired." };
  }

  await userRepository.resetPassword(parsed.data.email, await bcrypt.hash(parsed.data.password, 12));
  return { success: "Your password has been reset. You can now sign in." };
}