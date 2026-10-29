"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { requestOtpAction, resetPasswordAction, type PasswordResetState } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const initialResetState: PasswordResetState = {};

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");

  // Step 1: Request OTP
  const [reqState, reqAction, reqPending] = useActionState(async (prev: PasswordResetState, formData: FormData) => {
    const res = await requestOtpAction(prev, formData);
    if (res.success) {
      setEmail(formData.get("email") as string);
      setStep(2);
    }
    return res;
  }, initialResetState);

  // Step 2: Reset Password
  const [resState, resAction, resPending] = useActionState(async (prev: PasswordResetState, formData: FormData) => {
    formData.append("email", email);
    const res = await resetPasswordAction(prev, formData);
    if (res.success) {
      setStep(3);
    }
    return res;
  }, initialResetState);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          {step === 1 && "Forgot Password"}
          {step === 2 && "Enter Reset Code"}
          {step === 3 && "Password Reset"}
        </CardTitle>
        <CardDescription>
          {step === 1 && "Enter your email to receive a 6-digit reset code."}
          {step === 2 && `We sent a code to ${email}. It expires in 15 minutes.`}
          {step === 3 && "Your password has been successfully updated."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 1 && (
          <form action={reqAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            {reqState.error && <p className="text-sm text-destructive">{reqState.error}</p>}
            <Button type="submit" className="w-full" disabled={reqPending}>
              {reqPending ? "Sending..." : "Send Reset Code"}
            </Button>
          </form>
        )}

        {step === 2 && (
          <form action={resAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">6-Digit OTP</Label>
              <Input id="otp" name="otp" required maxLength={6} placeholder="123456" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" name="password" type="password" required minLength={10} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={10} />
            </div>
            {resState.error && <p className="text-sm text-destructive">{resState.error}</p>}
            <Button type="submit" className="w-full" disabled={resPending}>
              {resPending ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        )}

        {step === 3 && (
          <div className="text-center space-y-4 pt-4">
            <p className="text-sm text-green-600 font-medium">Success! You can now log in with your new password.</p>
            <Button asChild className="w-full">
              <Link href="/login">Go to Login</Link>
            </Button>
          </div>
        )}

        {step !== 3 && (
          <div className="mt-4 text-center">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline">
              Back to Login
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}