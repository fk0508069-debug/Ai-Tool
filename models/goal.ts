import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface IGoal {
  userId: Types.ObjectId;
  title: string;
  description?: string;
  type: "long-term" | "short-term";
  status: "active" | "completed";
  expiresAt?: Date | null; // Only used for short-term goals
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: { type: String, enum: ["long-term", "short-term"], required: true },
    status: { type: String, enum: ["active", "completed"], default: "active" },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const GoalModel: Model<IGoal> =
  (mongoose.models.Goal as Model<IGoal>) ?? mongoose.model<IGoal>("Goal", GoalSchema);