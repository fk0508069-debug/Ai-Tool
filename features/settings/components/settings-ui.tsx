"use client";

import { useActionState, useState } from "react";
import { updateProfileAction, updatePasswordAction } from "@/features/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SettingsUser = { name: string; image: string };

export function SettingsUI({ user }: { user: SettingsUser }) {
  const [tab, setTab] = useState<"profile" | "security">("profile");
  
  const [profState, profAction, profPending] = useActionState(updateProfileAction, {});
  const [passState, passAction, passPending] = useActionState(updatePasswordAction, {});

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-2 border-b pb-2">
        <Button variant={tab === "profile" ? "default" : "ghost"} onClick={() => setTab("profile")}>
          Profile
        </Button>
        <Button variant={tab === "security" ? "default" : "ghost"} onClick={() => setTab("security")}>
          Security
        </Button>
      </div>

      {tab === "profile" && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={profAction} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-muted overflow-hidden border">
                  {user.image ? (
                    <img src={user.image} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xl font-bold text-muted-foreground">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="image">Profile Picture (Max 2MB)</Label>
                  <Input id="image" name="image" type="file" accept="image/*" className="mt-1" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" defaultValue={user.name} required minLength={2} maxLength={80} />
              </div>
              
              {profState.error && <p className="text-sm text-destructive">{profState.error}</p>}
              {profState.success && <p className="text-sm text-green-600">{profState.success}</p>}
              
              <Button type="submit" disabled={profPending}>
                {profPending ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {tab === "security" && (
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={passAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" name="currentPassword" type="password" required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" name="newPassword" type="password" required minLength={10} />
              </div>

              {/* 👇 NEW CONFIRM PASSWORD FIELD */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={10} />
              </div>

              {passState.error && <p className="text-sm text-destructive">{passState.error}</p>}
              {passState.success && <p className="text-sm text-green-600">{passState.success}</p>}

              <Button type="submit" disabled={passPending}>
                {passPending ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}