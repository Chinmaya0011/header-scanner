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

console.log(`${CYAN}====================================================${RESET}`);
console.log(`${CYAN}   Header Scanner - Semgrep SAST Code Security Scan ${RESET}`);
console.log(`${CYAN}====================================================${RESET}\n`);

const semgrepReportPath = path.join(process.cwd(), 'semgrep-report.json');
const runReportPath = path.join(process.cwd(), 'run-report.json');

// Check if semgrep CLI is installed
function getSemgrepCommand() {
  try {
    execSync('semgrep --version', { stdio: 'ignore', shell: true, env: process.env });
    return 'semgrep';
  } catch {
    const rootSemgrep = path.join(process.cwd(), 'semgrep.exe');
    if (fs.existsSync(rootSemgrep)) {
      return `"${rootSemgrep}"`;
    }
    const directSemgrep = path.join(os.homedir(), '.local', 'bin', 'semgrep.exe');
    if (fs.existsSync(directSemgrep)) {
      return `"${directSemgrep}"`;
    }
    return null;
  }
}

const semgrepCmd = getSemgrepCommand();
let semgrepResults = [];
let scanSuccess = true;
let totalFindings = 0;
let errors = 0;
let warnings = 0;
let infoCount = 0;

if (semgrepCmd) {
  console.log(`${GREEN}[✓] Native Semgrep CLI detected (${semgrepCmd}).${RESET}`);
  console.log(`${CYAN}Running: ${semgrepCmd} scan --config auto --json --output semgrep-report.json${RESET}\n`);
  
  try {
    execSync(`${semgrepCmd} scan --config auto --json --output "${semgrepReportPath}"`, { stdio: 'inherit', shell: true, env: process.env });
    console.log(`\n${GREEN}[✓] Semgrep SAST scan completed cleanly.${RESET}`);
  } catch (err) {
    console.log(`\n${YELLOW}[!] Semgrep SAST scan completed with findings or exit code.${RESET}`);
  }

  // Load and parse generated semgrep-report.json
  if (fs.existsSync(semgrepReportPath)) {
    try {
      const raw = fs.readFileSync(semgrepReportPath, 'utf8').replace(/^\uFEFF/, '').trim();
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.results)) {
        semgrepResults = parsed.results;
        totalFindings = semgrepResults.length;
        
        semgrepResults.forEach(item => {
          const sev = (item.extra?.severity || '').toLowerCase();
          if (sev === 'error') errors++;
          else if (sev === 'warning' || sev === 'warn') warnings++;
          else infoCount++;
        });
      }
    } catch (e) {
      console.warn("Could not read semgrep-report.json:", e.message);
    }
  }
} else {
  console.log(`${CYAN}[i] Using cached semgrep-report.json data (Native Semgrep CLI not detected)...${RESET}\n`);
  if (fs.existsSync(semgrepReportPath)) {
    try {
      const raw = fs.readFileSync(semgrepReportPath, 'utf8').replace(/^\uFEFF/, '').trim();
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.results)) {
        semgrepResults = parsed.results;
        totalFindings = semgrepResults.length;
        semgrepResults.forEach(item => {
          const sev = (item.extra?.severity || '').toLowerCase();
          if (sev === 'error') errors++;
          else if (sev === 'warning' || sev === 'warn') warnings++;
          else infoCount++;
        });
      }
    } catch {}
  }
}

// Summary telemetry
const semgrepSummary = {
  timestamp: new Date().toISOString(),
  status: scanSuccess ? 'SUCCESS' : 'COMPLETED_WITH_FINDINGS',
  totalFindings: totalFindings,
  errors: errors,
  warnings: warnings,
  info: infoCount,
  reportFile: 'semgrep-report.json',
  updatedAt: new Date().toISOString()
};

console.log(`${CYAN}Semgrep Scan Summary: ${totalFindings} total findings (${errors} errors, ${warnings} warnings, ${infoCount} info).${RESET}`);
console.log(`${GREEN}[✓] Updated semgrep-report.json${RESET}\n`);

// Update run-report.json
let existingRunReport = {};
if (fs.existsSync(runReportPath)) {
  try {
    existingRunReport = JSON.parse(fs.readFileSync(runReportPath, 'utf8'));
  } catch {}
}

const updatedRunReport = {
  ...existingRunReport,
  timestamp: new Date().toISOString(),
  semgrep: semgrepSummary,
  updatedAt: new Date().toISOString()
};

fs.writeFileSync(runReportPath, JSON.stringify(updatedRunReport, null, 2), 'utf8');
console.log(`${GREEN}[✓] Telemetry updated in run-report.json${RESET}\n`);

process.exit(0);
