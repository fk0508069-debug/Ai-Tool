import mongoose, { Schema, type Model } from "mongoose";

export interface IUser {
  _id: string;
  email: string;
  name?: string;
  passwordHash: string;
  image?: string;
  resetOtp?: string;          // 👈 NEW
  resetOtpExpiry?: Date;      // 👈 NEW
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    image: { type: String },
    resetOtp: { type: String },             // 👈 NEW
    resetOtpExpiry: { type: Date },         // 👈 NEW
  },
  { timestamps: true },
);

export const UserModel: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ?? mongoose.model<IUser>("User", UserSchema);