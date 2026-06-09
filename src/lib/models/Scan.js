import mongoose from "mongoose";

const HeaderResultSchema = new mongoose.Schema({
  name: String,
  status: { type: String, enum: ["present", "missing", "weak"] },
  value: String,
  description: String,
  recommendation: String,
  severity: { type: String, enum: ["critical", "high", "medium", "low", "info"] },
});

const ScanSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    domain: { type: String, required: true },
    maskedDomain: { type: String, required: true },
    score: { type: Number, required: true },
    grade: { type: String, required: true },
    headers: [HeaderResultSchema],
    statusCode: Number,
    scanDuration: Number,
    summary: {
      present: Number,
      missing: Number,
      weak: Number,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Scan || mongoose.model("Scan", ScanSchema);
