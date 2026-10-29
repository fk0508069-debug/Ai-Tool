import "server-only";
import { UserModel, type IUser } from "@/models/user";
import { UserProfileModel } from "@/models/user-profile";

export const userRepository = {
  async findByEmail(email: string) {
    return UserModel.findOne({ email: email.toLowerCase() }).lean<IUser | null>();
  },

  async findByEmailWithPassword(email: string) {
    return UserModel.findOne({ email: email.toLowerCase() }).select("+passwordHash").lean<IUser | null>();
  },

  async findById(id: string) {
    return UserModel.findById(id).lean<IUser | null>();
  },

  // 👇 ADDED FOR SETTINGS ACTIONS
  async findByIdWithPassword(id: string) {
    return UserModel.findById(id).select("+passwordHash").lean<IUser | null>();
  },

  async updateProfile(userId: string, updates: { name: string; image?: string }) {
    return UserModel.updateOne({ _id: userId }, updates);
  },

  async updatePassword(userId: string, passwordHash: string) {
    return UserModel.updateOne({ _id: userId }, { passwordHash });
  },
  // 👆 -----------------------

  async createWithProfile(input: { 
    email: string; 
    name?: string; 
    passwordHash: string;
    studyScheme?: string;
    dailyRoutine?: string;
    hobbies?: string;
  }) {
    const user = await UserModel.create({
      email: input.email.toLowerCase(),
      name: input.name,
      passwordHash: input.passwordHash,
    });

    await UserProfileModel.create({ 
      userId: user._id, 
      displayName: input.name,
      studyScheme: input.studyScheme,
      dailyRoutine: input.dailyRoutine,
      hobbies: input.hobbies,
    });

    return user;
  },

  async setResetOtp(email: string, otp: string, expiresAt: Date) {
    return UserModel.findOneAndUpdate(
      { email: email.toLowerCase() },
      { resetOtp: otp, resetOtpExpiry: expiresAt },
      { new: true }
    ).lean();
  },

  async resetPassword(email: string, passwordHash: string) {
    return UserModel.updateOne(
      { email: email.toLowerCase() },
      { 
        passwordHash, 
        $unset: { resetOtp: 1, resetOtpExpiry: 1 } 
      }
    );
  }
};