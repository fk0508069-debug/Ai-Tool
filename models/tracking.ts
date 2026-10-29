import mongoose, { Schema, type Model, type Types } from "mongoose";

// ==========================================
// 1. HABIT MODEL
// ==========================================
export interface IHabit {
  userId: Types.ObjectId;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

const HabitSchema = new Schema<IHabit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

export const HabitModel: Model<IHabit> =
  (mongoose.models.Habit as Model<IHabit>) ?? mongoose.model<IHabit>("Habit", HabitSchema);


// ==========================================
// 2. HABIT LOG MODEL
// ==========================================
export interface IHabitLog {
  userId: Types.ObjectId;
  habitId: Types.ObjectId;
  dateString: string; // Format: YYYY-MM-DD for easy uniqueness and querying
  createdAt: Date;
}

const HabitLogSchema = new Schema<IHabitLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    habitId: { type: Schema.Types.ObjectId, ref: "Habit", required: true, index: true },
    dateString: { type: String, required: true },
  },
  { timestamps: true },
);

// Ensure a user can only log a habit once per day
HabitLogSchema.index({ habitId: 1, dateString: 1 }, { unique: true });

export const HabitLogModel: Model<IHabitLog> =
  (mongoose.models.HabitLog as Model<IHabitLog>) ?? mongoose.model<IHabitLog>("HabitLog", HabitLogSchema);


// ==========================================
// 3. ACTIVITY MODEL
// ==========================================
export const ACTIVITY_CATEGORIES = ["study", "exercise", "work", "routine", "other"] as const;
export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export interface IActivity {
  userId: Types.ObjectId;
  title: string;
  category: ActivityCategory;
  durationMinutes: number;
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: ACTIVITY_CATEGORIES, required: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    date: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

// ==========================================
// 4. HOBBY MODEL
// ==========================================
export interface IHobby {
  userId: Types.ObjectId;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

const HobbySchema = new Schema<IHobby>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

export const HobbyModel: Model<IHobby> =
  (mongoose.models.Hobby as Model<IHobby>) ?? mongoose.model<IHobby>("Hobby", HobbySchema);

// Compound index to quickly get recent activities for a specific user
ActivitySchema.index({ userId: 1, date: -1 });

export const ActivityModel: Model<IActivity> =
  (mongoose.models.Activity as Model<IActivity>) ?? mongoose.model<IActivity>("Activity", ActivitySchema);