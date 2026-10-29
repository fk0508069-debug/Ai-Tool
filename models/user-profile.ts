import mongoose, { Schema, type Model, type Types } from "mongoose";

export const MEMORY_CATEGORIES = ["profile", "daily", "progress", "knowledge", "conversation"] as const;
export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];

export interface IUserProfile {
  userId: Types.ObjectId;
  timezone: string;
  displayName?: string;
  studyScheme?: string; // New
  dailyRoutine?: string; // New
  hobbies?: string; // New
  dashboardLayout: string[];
  memorySettings: Record<MemoryCategory, boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserProfileSchema = new Schema<IUserProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    timezone: { type: String, default: "UTC" },
    displayName: { type: String, trim: true },
    studyScheme: { type: String, trim: true }, // New
    dailyRoutine: { type: String, trim: true }, // New
    hobbies: { type: String, trim: true }, // New
    dashboardLayout: {
      type: [String],
      default: ["overview", "tasks", "activities", "study", "insights"],
    },
    memorySettings: {
      type: Object,
      default: () =>
        Object.fromEntries(MEMORY_CATEGORIES.map((category) => [category, true])) as Record<MemoryCategory, boolean>,
    },
  },
  { timestamps: true },
);

export const UserProfileModel: Model<IUserProfile> =
  (mongoose.models.UserProfile as Model<IUserProfile>) ??
  mongoose.model<IUserProfile>("UserProfile", UserProfileSchema);