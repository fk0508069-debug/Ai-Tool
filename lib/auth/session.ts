import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return { id: session.user.id, email: session.user.email ?? "", name: session.user.name ?? "" };
}