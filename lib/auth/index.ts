import "server-only";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/lib/auth/config";
import { loginSchema } from "@/lib/validation/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { userRepository } from "@/repositories/user.repository";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        await connectToDatabase();
        const user = await userRepository.findByEmailWithPassword(parsed.data.email);
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return { id: String(user._id), email: user.email, name: user.name ?? null };
      },
    }),
  ],
});