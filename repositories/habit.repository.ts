import "server-only";
import { HabitModel, HabitLogModel } from "@/models/tracking";

export const habitRepository = {
  async findByUser(userId: string) {
    return HabitModel.find({ userId }).sort({ createdAt: 1 }).lean();
  },

  async create(userId: string, title: string) {
    return HabitModel.create({ userId, title });
  },

  async delete(userId: string, habitId: string) {
    await HabitModel.deleteOne({ _id: habitId, userId });
    await HabitLogModel.deleteMany({ habitId, userId });
  },

  async getLogsForUser(userId: string) {
    // Return logs from the last 30 days for streak calculation
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split("T")[0];

    return HabitLogModel.find({ userId, dateString: { $gte: dateStr } }).lean();
  },

  async toggleLog(userId: string, habitId: string, dateString: string) {
    const existing = await HabitLogModel.findOne({ userId, habitId, dateString });
    if (existing) {
      await HabitLogModel.deleteOne({ _id: existing._id });
      return false; // Un-logged
    } else {
      await HabitLogModel.create({ userId, habitId, dateString });
      return true; // Logged
    }
  }
};