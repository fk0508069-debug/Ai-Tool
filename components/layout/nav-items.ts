import {
  Activity,
  BookOpen,
  Brain,
  CalendarDays,
  Dumbbell,
  FileText,
  LayoutDashboard,
  ListChecks,
  LineChart,
  Settings,
  Sparkles,
  HelpCircle
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  phase: number;
};

export const navItems: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, phase: 1 },
  { label: "AI Assistant", href: "/assistant", icon: Sparkles, phase: 3 },
  { label: "My Day", href: "/my-day", icon: CalendarDays, phase: 2 },
  { label: "Tasks & Goals", href: "/tasks", icon: ListChecks, phase: 2 },
  { label: "Habits & Activities", href: "/habits", icon: Activity, phase: 2 },
  // { label: "Fitness & Lifestyle", href: "/fitness", icon: Dumbbell, phase: 2 },
  { label: "Study Workspace", href: "/study", icon: BookOpen, phase: 4 },
  // { label: "Notes & Documents", href: "/notes", icon: FileText, phase: 4 },
  { label: "Insights & Reports", href: "/insights", icon: LineChart, phase: 5 },
  { label: "Memory Center", href: "/memory", icon: Brain, phase: 3 },
  { label: "Settings", href: "/settings", icon: Settings, phase: 2 },
  { label: "Quiz Generator", href: "/quiz", icon: HelpCircle, phase: 4 },

];