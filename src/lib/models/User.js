import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
    apiKeys: [
      {
        keyHash: { type: String, required: true },
        name: { type: String, default: "Default API Key" },
        createdAt: { type: Date, default: Date.now },
        lastUsed: { type: Date },
        isActive: { type: Boolean, default: true },
        webhookUrl: { type: String, default: "" },
        allowedDomains: { type: String, default: "" },
        customUserAgent: { type: String, default: "" },
        status: { type: String, enum: ["active", "revoked", "expired", "deleted"], default: "active" }
      }
    ],
    apiAccessEnabled: { type: Boolean, default: true },
    dailyLimit: { type: Number, default: 20 },
    dailyUsage: { type: Number, default: 0 },
    lastUsageReset: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

UserSchema.pre("save", function (next) {
  if (this.role === "admin" && (this.dailyLimit === undefined || this.dailyLimit === 20)) {
    this.dailyLimit = 27;
  }
  next();
});

export default mongoose.models.User || mongoose.model("User", UserSchema);

