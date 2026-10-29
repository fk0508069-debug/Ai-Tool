import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { TaskModel } from "@/models/task";
import { ActivityModel, HabitLogModel } from "@/models/tracking";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month"); // YYYY-MM
    const now = new Date();
    
    let startDate, endDate;
    if (monthParam) {
      const [year, month] = monthParam.split("-").map(Number);
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    const dateFilter = { $gte: startDate, $lte: endDate };

    const tasks = await TaskModel.find({ userId: user.id, updatedAt: dateFilter, status: "done" }).lean();
    const activities = await ActivityModel.find({ userId: user.id, date: dateFilter }).lean();
    const habitLogs = await HabitLogModel.find({ 
      userId: user.id, 
      dateString: { 
        $gte: startDate.toISOString().split("T")[0], 
        $lte: endDate.toISOString().split("T")[0] 
      } 
    }).lean();

    // Create CSV String
    let csv = "Type,Title,Date,Duration/Status\n";
    
    tasks.forEach(t => {
      csv += `Task,"${t.title.replace(/"/g, '""')}",${t.updatedAt.toISOString().split("T")[0]},Completed\n`;
    });
    
    activities.forEach(a => {
      csv += `Activity,"${a.title.replace(/"/g, '""')}",${a.date.toISOString().split("T")[0]},${a.durationMinutes} mins\n`;
    });

    habitLogs.forEach(h => {
      csv += `Habit Log,"Completed Habit",${h.dateString},Done\n`;
    });

    const monthName = startDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Return as a downloadable file
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="AI-Life-OS-Report-${monthName.replace(" ", "-")}.csv"`,
      },
    });
  } catch (error) {
    console.error("Download API Error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}