import "server-only";
import { ActivityModel, type ActivityCategory } from "@/models/tracking";

export const activityRepository = {
  async findByUser(userId: string, limit = 20) {
    return ActivityModel.find({ userId }).sort({ date: -1 }).limit(limit).lean();
  },

  async create(userId: string, data: { title: string; category: ActivityCategory; durationMinutes: number; date: string; notes?: string }) {
    return ActivityModel.create({
      userId,
      title: data.title,
      category: data.category,
      durationMinutes: data.durationMinutes,
      date: new Date(data.date),
      notes: data.notes,
    });
  },

  async delete(userId: string, activityId: string) {
    await ActivityModel.deleteOne({ _id: activityId, userId });
  }
};