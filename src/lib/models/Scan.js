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

const CheckSchema = new mongoose.Schema({
  id: String,
  category: String,
  title: String,
  severity: { type: String, enum: ["critical", "high", "medium", "low", "info"] },
  status: { type: String, enum: ["passed", "failed", "warning", "info"] },
  description: String,
  evidence: String,
  whyItMatters: String,
  recommendation: String,
  references: [String],
});

// EASM extensions
const SslDetailsSchema = new mongoose.Schema({
  valid: Boolean,
  tlsVersion: String,
  supportedVersions: [String],
  cipherSuite: String,
  expirationDate: Date,
  daysRemaining: Number,
  issuer: String,
  wildcard: Boolean,
  sans: [String],
  ocspStatus: String,
  hstsPreload: Boolean,
  keyType: String,
  keyLength: Number,
});

const DnsDetailsSchema = new mongoose.Schema({
  a: [String],
  aaaa: [String],
  cname: [String],
  mx: [String],
  txt: [String],
  spf: { value: String, valid: Boolean, error: String },
  dkim: { value: String, found: Boolean },
  dmarc: { value: String, valid: Boolean, error: String },
  dnssec: Boolean,
  caa: [String],
});

const InfraDetailsSchema = new mongoose.Schema({
  cdn: String,
  waf: String,
  reverseProxy: String,
  hosting: String,
  asn: String,
  isp: String,
  country: String,
  region: String,
});

const TechItemSchema = new mongoose.Schema({
  name: String,
  category: String,
  version: String,
});

const DetailedCookieSchema = new mongoose.Schema({
  name: String,
  value: String,
  domain: String,
  path: String,
  secure: Boolean,
  httpOnly: Boolean,
  sameSite: String,
  maxAge: Number,
  expires: String,
  hostPrefix: Boolean,
  securePrefix: Boolean,
  risk: String,
});

const CspAnalyzerSchema = new mongoose.Schema({
  unsafeInline: Boolean,
  unsafeEval: Boolean,
  strictDynamic: Boolean,
  nonceUsage: Boolean,
  hashUsage: Boolean,
  reportUri: String,
  reportTo: String,
  directives: mongoose.Schema.Types.Mixed,
});

const ProtocolDetailsSchema = new mongoose.Schema({
  version: String,
  http2: Boolean,
  http3: Boolean,
  quic: Boolean,
  compression: String,
  keepAlive: Boolean,
  redirectChain: [String],
});

const PerfMetricsSchema = new mongoose.Schema({
  dnsLookup: Number,
  tlsHandshake: Number,
  ttfb: Number,
  responseTime: Number,
  redirectTime: Number,
  totalTime: Number,
});

const RobotsDetailsSchema = new mongoose.Schema({
  exists: Boolean,
  sitemaps: [String],
  sensitiveExposed: Boolean,
  exposedPathsCount: Number,
});

const SitemapDetailsSchema = new mongoose.Schema({
  exists: Boolean,
  urlCount: Number,
  brokenUrls: [String],
  lastModified: Date,
});

const SensitiveFileSchema = new mongoose.Schema({
  path: String,
  exists: Boolean,
  status: Number,
  severity: String,
});

const SecurityTxtSchema = new mongoose.Schema({
  exists: Boolean,
  contact: String,
  expires: String,
  encryption: String,
  policy: String,
});

const EmailSecuritySchema = new mongoose.Schema({
  score: Number,
  spfPresent: Boolean,
  dmarcPresent: Boolean,
  dkimPresent: Boolean,
  bimiPresent: Boolean,
  mtaStsPresent: Boolean,
  tlsRptPresent: Boolean,
});

const PrivacyDetailsSchema = new mongoose.Schema({
  privacyPolicyUrl: String,
  privacyPolicyPresent: Boolean,
  cookieBannerPresent: Boolean,
  thirdPartyScripts: [String],
  trackingPixels: [String],
  analyticsTools: [String],
  externalDomains: [String],
});

const BenchmarkSchema = new mongoose.Schema({
  googleScore: Number,
  githubScore: Number,
  cloudflareScore: Number,
  microsoftScore: Number,
  industryAverage: Number,
});

const SeoDetailsSchema = new mongoose.Schema({
  canonicalUrl: String,
  metaRobots: String,
  isIndexable: Boolean,
  openGraph: mongoose.Schema.Types.Mixed,
  twitterCard: mongoose.Schema.Types.Mixed,
  title: String,
  description: String,
  h1Count: Number,
  h2Count: Number,
  imageCount: Number,
  imageAltCount: Number,
  favicon: String,
  detectedImages: mongoose.Schema.Types.Mixed
});

const WhoisDetailsSchema = new mongoose.Schema({
  registrar: String,
  createdDate: Date,
  expiryDate: Date,
  updatedDate: Date,
  domainAgeDays: Number,
  daysToExpiry: Number,
  nameServers: [String],
  isRecent: Boolean,
  isExpiringSoon: Boolean,
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
    checks: [CheckSchema],
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
    source: { type: String, enum: ["web", "api"], default: "web" },
    apiKeyId: { type: String, default: null },
    isSuccess: { type: Boolean, default: true },
    failReason: { type: String, default: null },
    
    // EASM Extensions
    ssl: SslDetailsSchema,
    dns: DnsDetailsSchema,
    infrastructure: InfraDetailsSchema,
    techStack: [TechItemSchema],
    cookies: [DetailedCookieSchema],
    deepCsp: CspAnalyzerSchema,
    httpProtocol: ProtocolDetailsSchema,
    performance: PerfMetricsSchema,
    robotsTxt: RobotsDetailsSchema,
    sitemapXml: SitemapDetailsSchema,
    sensitiveFiles: [SensitiveFileSchema],
    securityTxt: SecurityTxtSchema,
    emailSecurity: EmailSecuritySchema,
    subdomains: [mongoose.Schema.Types.Mixed],
    publicPages: [mongoose.Schema.Types.Mixed],
    whois: WhoisDetailsSchema,


    exposedServices: [mongoose.Schema.Types.Mixed],
    loginSurfaces: [mongoose.Schema.Types.Mixed],
    benchmarks: BenchmarkSchema,
    seo: SeoDetailsSchema,
    privacy: PrivacyDetailsSchema,
    categoryScores: {
      headers: Number,
      ssl: Number,
      dns: Number,
      cookies: Number,
      compliance: Number,
      performance: Number,
      exposure: Number,
    }
  },
  { timestamps: true }
);

// Force rebuild of the model in development to apply schema changes instantly
if (process.env.NODE_ENV === "development" && mongoose.models.Scan) {
  delete mongoose.models.Scan;
}

export default mongoose.models.Scan || mongoose.model("Scan", ScanSchema);
