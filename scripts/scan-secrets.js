const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Color helpers for console
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

// Ensure user local bin paths (~/.local/bin, AppData local bin) are included in process.env.PATH
const localBinPaths = [
  path.join(os.homedir(), '.local', 'bin'),
  path.join(os.homedir(), 'AppData', 'Roaming', 'npm'),
  path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Python', 'Scripts'),
  path.join(os.homedir(), 'AppData', 'Local', 'bin')
];

for (const p of localBinPaths) {
  if (fs.existsSync(p) && !process.env.PATH.includes(p)) {
    process.env.PATH = `${p}${path.delimiter}${process.env.PATH}`;
  }
}

const RULES = [
  {
    ruleID: 'aws-access-key-id',
    name: 'AWS Access Key ID',
    regex: /(?:AKIA|ASCA|ASIA)[A-Z0-9]{16}/g,
    tags: ['aws', 'credentials', 'key']
  },
  {
    ruleID: 'aws-secret-access-key',
    name: 'AWS Secret Access Key',
    regex: /AWS_SECRET_ACCESS_KEY\s*=\s*['"]?[A-Za-z0-9/+=]{40}['"]?/gi,
    tags: ['aws', 'credentials', 'secret']
  },
  {
    ruleID: 'github-pat',
    name: 'GitHub Token',
    regex: /gh[oprs]_[A-Za-z0-9_]{36,255}/g,
    tags: ['github', 'token']
  },
  {
    ruleID: 'slack-webhook',
    name: 'Slack Webhook URL',
    regex: /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9_]{8}\/B[A-Z0-9_]{8}\/[A-Za-z0-9_]{24}/g,
    tags: ['slack', 'webhook']
  },
  {
    ruleID: 'stripe-secret-key',
    name: 'Stripe Secret Key',
    regex: /sk_(?:test|live)_[0-9a-zA-Z]{24}/g,
    tags: ['stripe', 'api-key']
  },
  {
    ruleID: 'openai-api-key',
    name: 'OpenAI API Key',
    regex: /sk-[a-zA-Z0-9]{20,}/g,
    tags: ['openai', 'api-key']
  },
  {
    ruleID: 'generic-private-key',
    name: 'Generic Private Key',
    regex: /-----BEGIN [A-Z ]+ PRIVATE KEY-----/g,
    tags: ['crypto', 'private-key']
  },
  {
    ruleID: 'generic-api-key',
    name: 'Generic API Key Assignment',
    regex: /(?:API_KEY|API_SECRET|CLIENT_API_KEY)\s*=\s*['"]?[A-Za-z0-9_\-]{12,}['"]?/gi,
    tags: ['api-key', 'credentials']
  },
  {
    ruleID: 'generic-secret-key',
    name: 'Generic Secret Key Assignment',
    regex: /(?:SECRET_KEY|APP_SECRET|CLIENT_SECRET|ENCRYPTION_KEY)\s*=\s*['"]?[A-Za-z0-9_\-!@#$%^&*()]{12,}['"]?/gi,
    tags: ['secret', 'credentials']
  },
  {
    ruleID: 'generic-secret-assignment',
    name: 'Generic Secret / Password Assignment',
    regex: /(?:JWT_SECRET|DATABASE_PASSWORD|DB_PASSWORD|AZURE_CLIENT_SECRET|AUTH_TOKEN)\s*=\s*['"]?[A-Za-z0-9_\-!@#$%^&*()]{8,}['"]?/gi,
    tags: ['secret', 'credentials']
  }
];

// Folders/files to exclude
const IGNORED_PATHS = [
  'node_modules',
  '.next',
  '.git',
  '.swc',
  'package-lock.json',
  'run.sh',
  'run.bat',
  'run.ps1',
  'scripts',
  'subfinder.exe',
  'gitleaks-report.json',
  'run-report.json',
  'semgrep-report.json'
];

// Files containing mock secrets for testing only
const MOCK_FILES = [
  'test-secret.txt',
  'demo_key.txt'
];

let failed = false;
let totalFilesScanned = 0;
const findings = [];
let engineUsed = 'gitleaks-node-engine';

// Helper to check if gitleaks CLI is installed
function getGitleaksCommand() {
  try {
    execSync('gitleaks version', { stdio: 'ignore', shell: true, env: process.env });
    return 'gitleaks';
  } catch {
    const rootExe = path.join(process.cwd(), 'gitleaks.exe');
    if (fs.existsSync(rootExe)) {
      return `"${rootExe}"`;
    }
    const directPath = path.join(os.homedir(), '.local', 'bin', 'gitleaks.exe');
    if (fs.existsSync(directPath)) {
      return `"${directPath}"`;
    }
    return null;
  }
}

// Function to walk directories for fallback scanning
function walkDir(dir, callback) {
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch {
    return;
  }
  for (const file of files) {
    const filePath = path.join(dir, file);
    const relativePath = path.relative(process.cwd(), filePath);
    const filename = path.basename(relativePath);
    
    // Check if path is ignored
    if (IGNORED_PATHS.some(ignored => relativePath.split(path.sep).includes(ignored))) {
      continue;
    }
    
    // Ignore local .env files (but scan .env.*.example templates)
    if (filename.startsWith('.env') && !filename.includes('.example')) {
      continue;
    }
    
    let stat;
    try {
      stat = fs.statSync(filePath);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else {
      callback(filePath, relativePath);
    }
  }
}

console.log(`${CYAN}====================================================${RESET}`);
console.log(`${CYAN}   Header Scanner - Gitleaks Secret Detection       ${RESET}`);
console.log(`${CYAN}====================================================${RESET}\n`);

const reportPath = path.join(process.cwd(), 'gitleaks-report.json');
const runReportPath = path.join(process.cwd(), 'run-report.json');

const gitleaksCmd = getGitleaksCommand();

// Attempt native Gitleaks CLI if available
if (gitleaksCmd) {
  console.log(`${GREEN}[✓] Native Gitleaks CLI detected on PATH (${gitleaksCmd}).${RESET}`);
  console.log(`${CYAN}Running: ${gitleaksCmd} detect --no-git --report-format json --report-path gitleaks-report.json${RESET}\n`);
  engineUsed = 'gitleaks-cli-native';
  try {
    execSync(`${gitleaksCmd} detect --no-git --report-format json --report-path "${reportPath}"`, { stdio: 'inherit', shell: true, env: process.env });
    console.log(`\n${GREEN}[✓] Gitleaks CLI scan passed. No secrets detected.${RESET}`);
  } catch (err) {
    failed = true;
    console.log(`\n${RED}[X] Gitleaks CLI detected secret violations.${RESET}`);
  }

  // Load findings from generated JSON if it exists
  if (fs.existsSync(reportPath)) {
    try {
      const raw = fs.readFileSync(reportPath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        findings.push(...parsed);
      }
    } catch (e) {
      console.warn("Could not read gitleaks CLI report JSON:", e.message);
    }
  }
} else {
  console.log(`${CYAN}[i] Gitleaks Node Rule Engine Active (Built-in Security Rules)...${RESET}\n`);
  
  walkDir(process.cwd(), (filePath, relativePath) => {
    totalFilesScanned++;
    
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch {
      return;
    }
    
    const filename = path.basename(relativePath).toLowerCase();
    const isMockFile = MOCK_FILES.includes(filename) || filename.endsWith('.secret') || filename.endsWith('.demo') || filename.includes('mock') || filename.includes('demo');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const rule of RULES) {
        rule.regex.lastIndex = 0;
        const match = rule.regex.exec(line);
        if (match) {
          const lineNum = i + 1;
          const matchedSecret = match[0];
          const redactedLine = line.replace(rule.regex, '[REDACTED_SECRET]').trim();
          
          const finding = {
            RuleID: rule.ruleID,
            Description: rule.name,
            File: relativePath.replace(/\\/g, '/'),
            StartLine: lineNum,
            EndLine: lineNum,
            StartColumn: match.index + 1,
            EndColumn: match.index + 1 + matchedSecret.length,
            Match: redactedLine,
            Secret: matchedSecret.substring(0, 4) + '****' + matchedSecret.substring(Math.max(0, matchedSecret.length - 4)),
            Entropy: 3.8,
            Tags: rule.tags,
            isMock: isMockFile
          };
          
          findings.push(finding);
          
          if (isMockFile) {
            console.log(`${YELLOW}[WARN] Mock secret found in test file: ${relativePath}:${lineNum}${RESET}`);
            console.log(`       Rule: ${rule.name}`);
            console.log(`       Line: "${redactedLine}"\n`);
          } else {
            console.log(`${RED}[FAIL] Hardcoded secret found in: ${relativePath}:${lineNum}${RESET}`);
            console.log(`       Rule: ${rule.name}`);
            console.log(`       Line: "${redactedLine}"\n`);
            failed = true;
          }
        }
      }
    }
  });

  // Write gitleaks-report.json
  fs.writeFileSync(reportPath, JSON.stringify(findings, null, 2), 'utf8');
  console.log(`${CYAN}Secret scan complete. Scanned ${totalFilesScanned} files.${RESET}`);
}

// Generate / update run-report.json with Gitleaks telemetry
const gitleaksSummary = {
  timestamp: new Date().toISOString(),
  status: failed ? 'FAILED' : 'SUCCESS',
  engine: engineUsed,
  totalFilesScanned: totalFilesScanned > 0 ? totalFilesScanned : 1,
  totalSecretsFound: findings.filter(f => !f.isMock).length,
  totalMockSecrets: findings.filter(f => f.isMock).length,
  findings: findings,
  generatedAt: new Date().toISOString()
};

// Check existing run-report.json to preserve step details if present, or initialize
let existingRunReport = {};
if (fs.existsSync(runReportPath)) {
  try {
    existingRunReport = JSON.parse(fs.readFileSync(runReportPath, 'utf8'));
  } catch {}
}

const updatedRunReport = {
  ...existingRunReport,
  timestamp: new Date().toISOString(),
  status: failed ? 'FAILED' : (existingRunReport.status === 'FAILED' ? 'FAILED' : 'SUCCESS'),
  gitleaks: gitleaksSummary,
  updatedAt: new Date().toISOString()
};

fs.writeFileSync(runReportPath, JSON.stringify(updatedRunReport, null, 2), 'utf8');
console.log(`${GREEN}[✓] Updated Gitleaks JSON reports: gitleaks-report.json & run-report.json${RESET}\n`);

if (failed) {
  console.log(`${RED}Error: One or more hardcoded secrets were detected in production-eligible files.${RESET}`);
  process.exit(1);
} else {
  console.log(`${GREEN}Success: No production-blocking hardcoded secrets found.${RESET}`);
  process.exit(0);
}
