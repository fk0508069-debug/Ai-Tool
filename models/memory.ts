import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface IMemory {
  userId: Types.ObjectId;
  content: string;
  category: string;
  createdAt: Date;
}

const MemorySchema = new Schema<IMemory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, required: true },
    category: { type: String, required: true },
  },
  { timestamps: true }
);

export const MemoryModel: Model<IMemory> =
  (mongoose.models.Memory as Model<IMemory>) ?? mongoose.model<IMemory>("Memory", MemorySchema);