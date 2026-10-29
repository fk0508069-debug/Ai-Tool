"use client";

import { useState } from "react";
import { useActionState } from "react";
import Link from "next/link";
import {
  requestOtpAction,
  resetPasswordAction,
  type PasswordResetState,
} from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: PasswordResetState = {};

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [requestState, requestAction, requestPending] = useActionState(requestOtpAction, initialState);
  const [resetState, resetAction, resetPending] = useActionState(resetPasswordAction, initialState);
  const step = resetState.success ? 3 : requestState.success ? 2 : 1;

  if (step === 3) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">{resetState.success}</p>
        <Button asChild className="w-full">
          <Link href="/login">Return to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {step === 1 ? (
        <form action={(formData) => {
          setEmail(String(formData.get("email") ?? ""));
          requestAction(formData);
        }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input id="reset-email" name="email" type="email" autoComplete="email" required />
          </div>
          {(requestState.error || requestState.success) && (
            <p role="alert" className={`rounded-md px-3 py-2 text-sm ${requestState.error ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
              {requestState.error ?? requestState.success}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={requestPending}>
            {requestPending ? "Sending code…" : "Send reset code"}
          </Button>
        </form>
      ) : (
        <form action={resetAction} className="space-y-4">
          <input type="hidden" name="email" value={email} />
          <div className="space-y-2">
            <Label htmlFor="reset-otp">6-digit code</Label>
            <Input id="reset-otp" name="otp" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reset-password">New password</Label>
            <Input id="reset-password" name="password" type="password" autoComplete="new-password" minLength={10} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reset-confirm-password">Confirm new password</Label>
            <Input id="reset-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" required />
          </div>
          {resetState.error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{resetState.error}</p>}
          <Button type="submit" className="w-full" disabled={resetPending}>
            {resetPending ? "Updating password…" : "Reset password"}
          </Button>
        </form>
      )}
      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">Sign in</Link>
      </p>
    </div>
  );
}
