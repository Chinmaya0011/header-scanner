import mongoose from "mongoose";

const AssetVerificationSchema = new mongoose.Schema(
  {
    domain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    verificationToken: {
      type: String,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verificationMethod: {
      type: String,
      enum: ["dns", "file", "none"],
      default: "none",
    },
  },
  { timestamps: true }
);

// Ensure a user can only have one verification record per domain
AssetVerificationSchema.index({ domain: 1, owner: 1 }, { unique: true });

export default mongoose.models.AssetVerification || mongoose.model("AssetVerification", AssetVerificationSchema);
