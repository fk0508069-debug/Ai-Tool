import type { Metadata } from "next";
import { InsightsClient } from "@/features/insights/components/insights-client";

export const metadata: Metadata = { title: "Insights & Reports" };

export default function InsightsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Insights & Reports</h1>
        <p className="text-sm text-muted-foreground">
          Review your monthly progress and download your data.
        </p>
      </header>
      <InsightsClient />
    </div>
  );
}