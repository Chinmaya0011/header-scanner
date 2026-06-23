import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function seedAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.warn("Seeding skipped: ADMIN_EMAIL or ADMIN_PASSWORD not configured in environment variables.");
      return;
    }

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      console.log("Seeding admin user...");
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await User.create({
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        dailyLimit: 27,
      });
      console.log("Admin user seeded successfully.");
    }

    // Update any existing admin users who have the old default limit of 20 to the new 27 limit
    await User.updateMany({ role: "admin", dailyLimit: 25 }, { $set: { dailyLimit: 50} });
  } catch (error) {
    console.error("Failed to seed admin:", error);
  }
}

async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("Please define MONGODB_URI in your environment variables");
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, { bufferCommands: false })
      .then((m) => m);
  }

  cached.conn = await cached.promise;
  await seedAdmin();
  return cached.conn;
}

export default connectDB;
