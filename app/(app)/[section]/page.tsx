import { notFound } from "next/navigation";
import Link from "next/link";
import { navItems } from "@/components/layout/nav-items";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Params = { section: string };

export function generateStaticParams() {
  return navItems.filter((item) => item.href !== "/dashboard").map((item) => ({ section: item.href.slice(1) }));
}

export default async function SectionPlaceholder({ params }: { params: Promise<Params> }) {
  const { section } = await params;
  const item = navItems.find((entry) => entry.href === `/${section}`);
  if (!item) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-center gap-3">
        <item.icon className="h-6 w-6 text-muted-foreground" aria-hidden />
        <h1 className="text-2xl font-semibold tracking-tight">{item.label}</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Not built yet</CardTitle>
          <CardDescription>
            This module ships in Phase {item.phase}. It is linked so navigation is complete, and it will never
            display placeholder statistics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to Overview</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}