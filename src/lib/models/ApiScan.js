import mongoose from "mongoose";

const ApiParameterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, enum: ["path", "query", "header", "body"], default: "query" },
  type: { type: String, default: "string" },
  required: { type: Boolean, default: false },
});

const ApiEndpointSchema = new mongoose.Schema({
  method: { type: String, required: true },
  path: { type: String, required: true },
  url: { type: String, required: true },
  source: { type: String, enum: ["openapi", "javascript", "web", "crawler"], default: "web" },
  parameters: [ApiParameterSchema],
  authenticationRequired: { type: Boolean, default: true },
  tags: [String],
  testStatus: { type: String, enum: ["PASS", "FAIL", "WARNING", "NOT_TESTED"], default: "NOT_TESTED" },
  riskScore: { type: Number, default: 0 },
});

const ApiFindingSchema = new mongoose.Schema({
  findingId: { type: String, required: true },
  category: { type: String, required: true }, // e.g. "API1:2023 - BOLA"
  title: { type: String, required: true },
  severity: { type: String, enum: ["critical", "high", "medium", "low", "info"], required: true },
  confidence: { type: String, enum: ["high", "medium", "low"], required: true },
  endpoint: { type: String, required: true },
  method: { type: String, default: "GET" },
  parameter: { type: String, default: null },
  description: { type: String, required: true },
  impact: { type: String, required: true },
  remediation: { type: String, required: true },
  evidence: {
    request: {
      method: String,
      url: String,
      headers: mongoose.Schema.Types.Mixed,
      body: String,
    },
    response: {
      status: Number,
      headers: mongoose.Schema.Types.Mixed,
      body: String,
    },
    comparison: {
      statusA: Number,
      statusB: Number,
      note: String,
    }
  }
});

const ApiScanSchema = new mongoose.Schema(
  {
    targetUrl: { type: String, required: true },
    domain: { type: String, required: true },
    maskedDomain: { type: String, required: true },
    authType: { type: String, enum: ["bearer", "apikey", "none"], default: "bearer" },
    scanMode: { type: String, enum: ["passive", "safe_active", "advanced_active"], default: "safe_active" },
    hasSecondaryAuth: { type: Boolean, default: false },
    apiKeyHeader: { type: String, default: "X-API-Key" },
    
    // Status & Progress
    status: { type: String, enum: ["queued", "discovering", "testing", "completed", "failed", "cancelled"], default: "queued" },
    progress: { type: Number, default: 0 },
    statusMessage: { type: String, default: "Initializing API scan..." },
    
    // Statistics & Scores
    score: { type: Number, default: 100 },
    totalEndpoints: { type: Number, default: 0 },
    testedEndpoints: { type: Number, default: 0 },
    
    inventory: {
      documented: { type: Number, default: 0 },
      undocumented: { type: Number, default: 0 },
      legacy: { type: Number, default: 0 },
      internal: { type: Number, default: 0 },
    },
    
    owaspDistribution: {
      api1_bola: { type: Number, default: 0 },
      api2_auth: { type: Number, default: 0 },
      api3_properties: { type: Number, default: 0 },
      api4_resources: { type: Number, default: 0 },
      api5_bfla: { type: Number, default: 0 },
      api6_business: { type: Number, default: 0 },
      api7_ssrf: { type: Number, default: 0 },
      api8_config: { type: Number, default: 0 },
      api9_inventory: { type: Number, default: 0 },
      api10_consumption: { type: Number, default: 0 },
    },

    severitySummary: {
      critical: { type: Number, default: 0 },
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 },
      info: { type: Number, default: 0 },
    },

    endpoints: [ApiEndpointSchema],
    findings: [ApiFindingSchema],
    
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    durationMs: { type: Number, default: 0 },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV === "development" && mongoose.models.ApiScan) {
  delete mongoose.models.ApiScan;
}

export default mongoose.models.ApiScan || mongoose.model("ApiScan", ApiScanSchema);
