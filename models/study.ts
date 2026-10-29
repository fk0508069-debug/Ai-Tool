import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface IStudyDocument {
  userId: Types.ObjectId;
  fileName: string;
  fileSize: number;
  subject: string;
  status: "processing" | "ready";
  summary?: string;
  fullText?: string; // 👈 THIS IS REQUIRED
  createdAt: Date;
}

const StudyDocumentSchema = new Schema<IStudyDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    subject: { type: String, required: true },
    status: { type: String, enum: ["processing", "ready"], default: "ready" },
    summary: { type: String },
    fullText: { type: String }, // 👈 THIS IS REQUIRED
  },
  { timestamps: true },
);

export const StudyDocumentModel: Model<IStudyDocument> =
  (mongoose.models.StudyDocument as Model<IStudyDocument>) ?? mongoose.model<IStudyDocument>("StudyDocument", StudyDocumentSchema);