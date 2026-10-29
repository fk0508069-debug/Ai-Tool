import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface ITask {
  userId: Types.ObjectId;
  title: string;
  status: "todo" | "done";
  dueDate?: string;
  priority?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    status: { type: String, enum: ["todo", "done"], default: "todo" },
    dueDate: { type: String },
    priority: { type: String },
    notes: { type: String },
  },
  { timestamps: true },
);

export const TaskModel: Model<ITask> =
  (mongoose.models.Task as Model<ITask>) ?? mongoose.model<ITask>("Task", TaskSchema);