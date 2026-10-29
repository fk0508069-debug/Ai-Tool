import "server-only";
import mongoose from "mongoose";
import dns from "dns";
import { env } from "@/lib/env";

type Cached = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

const globalForMongoose = globalThis as unknown as { _mongoose?: Cached };
const cached: Cached = globalForMongoose._mongoose ?? { conn: null, promise: null };

if (!globalForMongoose._mongoose) globalForMongoose._mongoose = cached;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    // 👇 Moved inside the function and wrapped in try/catch
    try {
      // Fix for Windows/Node.js SRV lookup issues, safely ignored in production
      dns.setServers(["8.8.8.8", "8.8.4.4"]);
    } catch (e) {
      console.warn("Could not set custom DNS servers:", e);
    }

    cached.promise = mongoose.connect(env.MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10_000,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}