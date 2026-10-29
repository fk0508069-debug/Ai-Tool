import "server-only";
import { TaskModel } from "@/models/task";

export const taskRepository = {
  async findByUser(userId: string) {
    return TaskModel.find({ userId }).sort({ createdAt: -1 }).lean();
  },
  async create(userId: string, title: string) {
    return TaskModel.create({ userId, title });
  },
  async toggleStatus(userId: string, taskId: string) {
    const task = await TaskModel.findOne({ _id: taskId, userId });
    if (!task) throw new Error("Task not found");
    task.status = task.status === "todo" ? "done" : "todo";
    await task.save();
  },
  async delete(userId: string, taskId: string) {
    await TaskModel.deleteOne({ _id: taskId, userId });
  }
};