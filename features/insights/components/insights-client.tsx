"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2, CheckCircle2, Clock, Flame, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type InsightsData = {
  stats: {
    tasksCompleted: number;
    tasksPending: number;
    totalActivityMinutes: number;
    habitsCompleted: number;
    goalsAchieved: number;
  };
  activities: any[];
  habits: any[];
};

export function InsightsClient() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // e.g., "2023-10"
  );

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/insights?month=${selectedMonth}`);
        const json = await res.json();
        if (json.ok) setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedMonth]);

  const handleDownload = () => {
    window.location.href = `/api/insights/download?month=${selectedMonth}`;
  };

  // Format chart data
  const chartData = data?.habits.map(h => ({
    name: h.title,
    completions: h.logsCount,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Month Selector & Download */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/50 p-4 rounded-lg border">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Select Month:</label>
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          />
        </div>
        <Button onClick={handleDownload} variant="default" className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" /> Download Report (CSV)
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Tasks Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.stats.tasksCompleted || 0}</div>
                <p className="text-xs text-muted-foreground">{data?.stats.tasksPending || 0} still pending</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-blue-500" /> Activity Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.stats.totalActivityMinutes || 0}m</div>
                <p className="text-xs text-muted-foreground">Logged this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Flame className="h-4 w-4 text-orange-500" /> Habit Check-ins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.stats.habitsCompleted || 0}</div>
                <p className="text-xs text-muted-foreground">Across all habits</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-purple-500" /> Goals Achieved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.stats.goalsAchieved || 0}</div>
                <p className="text-xs text-muted-foreground">Completed this month</p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Habit Consistency</CardTitle>
              <CardDescription>How often you completed your tracked habits this month.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar dataKey="completions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  No habit data recorded for this month.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
