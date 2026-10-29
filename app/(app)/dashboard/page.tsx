import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Overview" };

const widgets = [
  { title: "Today's tasks", body: "No tasks yet.", href: "/tasks", cta: "Create a task" },
  { title: "Activities", body: "Nothing logged today.", href: "/habits", cta: "Log activity" },
  { title: "Study progress", body: "No study sessions yet.", href: "/study", cta: "Add a subject" },
  { title: "AI insights", body: "Insights appear once there is enough recorded data.", href: "/insights", cta: "View insights" },
];

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = (user.name || user.email).split(/[\s@]/)[0];
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
        <p className="text-sm text-muted-foreground">{today}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Your dashboard is empty — and that is accurate</CardTitle>
          <CardDescription>
            Every metric here will be computed from records you create. Nothing is pre-filled or simulated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/tasks">Start by adding your first task</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {widgets.map((widget) => (
          <Card key={widget.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{widget.title}</CardTitle>
              <CardDescription>{widget.body}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={widget.href}>{widget.cta}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}