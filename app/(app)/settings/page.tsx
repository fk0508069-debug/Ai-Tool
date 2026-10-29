import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel } from "@/models/user";
import { SettingsUI } from "@/features/settings/components/settings-ui";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const sessionUser = await requireUser();
  await connectToDatabase();
  
  const dbUser = await UserModel.findById(sessionUser.id).lean();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Account Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile and account security.</p>
      </header>
      <SettingsUI 
        user={{ 
          name: dbUser?.name || sessionUser.name || "", 
          image: dbUser?.image || "" 
        }} 
      />
    </div>
  );
}