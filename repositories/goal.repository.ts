import "server-only";
import { GoalModel } from "@/models/goal";

export const goalRepository = {
  async findActiveByUser(userId: string) {
    // Fetch active goals. Short-term goals automatically expire and are filtered out if past 24 hours.
    return GoalModel.find({
      userId,
      status: "active",
      $or: [
        { type: "long-term" },
        { type: "short-term", expiresAt: { $gt: new Date() } }
      ]
    }).sort({ createdAt: -1 }).lean();
  },
  async create(userId: string, data: { title: string; description?: string; type: "long-term" | "short-term" }) {
    const expiresAt = data.type === "short-term" ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;
    return GoalModel.create({ userId, ...data, expiresAt });
  },
  async complete(userId: string, goalId: string) {
    await GoalModel.updateOne({ _id: goalId, userId }, { status: "completed" });
  },
  async delete(userId: string, goalId: string) {
    await GoalModel.deleteOne({ _id: goalId, userId });
  }
};