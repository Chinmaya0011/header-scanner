import mongoose from "mongoose";

const HeaderResultSchema = new mongoose.Schema({
  name: String,
  status: { type: String, enum: ["present", "missing", "weak", "invalid"] },
  value: String,
  description: String,
  recommendation: String,
  severity: { type: String, enum: ["critical", "high", "medium", "low", "info"] },
});

const RecommendationSchema = new mongoose.Schema({
  header: String,
  severity: String,
  recommendation: String,
  expectedFormat: String,
  reference: String,
});

const ComplianceItemSchema = new mongoose.Schema({
  compliant: { type: Boolean, default: false },
  recommendation: String,
});

const VulnerabilitySchema = new mongoose.Schema({
  id: String,
  name: String,
  severity: { type: String, enum: ["critical", "high", "medium", "low", "info"] },
  category: String,
  description: String,
  recommendation: String,
});

const ScanSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    domain: { type: String, required: true },
    maskedDomain: { type: String, required: true },
    score: { type: Number, required: true },
    grade: { type: String, required: true },
    headers: [HeaderResultSchema],
    vulnerabilities: [VulnerabilitySchema],
    statusCode: Number,
    scanDuration: Number,
    summary: {
      present: Number,
      missing: Number,
      weak: Number,
      invalid: Number,
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    recommendations: [RecommendationSchema],
    compliance: {
      GDPR: ComplianceItemSchema,
      PCI_DSS: ComplianceItemSchema,
      OWASP: ComplianceItemSchema,
      NIST: ComplianceItemSchema,
    },
    isPublic: { type: Boolean, default: false },
    shareToken: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

export default mongoose.models.Scan || mongoose.model("Scan", ScanSchema);
