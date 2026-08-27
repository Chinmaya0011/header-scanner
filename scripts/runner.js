const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

console.log(`${CYAN}===============================================${RESET}`);
console.log(`${CYAN}   Header Scanner - Pipeline Audit & Security  ${RESET}`);
console.log(`${CYAN}===============================================${RESET}\n`);

const runReportPath = path.join(process.cwd(), 'run-report.json');
const startTime = Date.now();
const isoTimestamp = new Date().toISOString();

const runReport = {
  timestamp: isoTimestamp,
  status: 'IN_PROGRESS',
  failedStep: null,
  durationSeconds: 0,
  steps: [],
  gitleaks: null,
  semgrep: null,
  updatedAt: isoTimestamp
};

function saveReport() {
  runReport.updatedAt = new Date().toISOString();
  fs.writeFileSync(runReportPath, JSON.stringify(runReport, null, 2), 'utf8');
}

saveReport();

function runStep(name, command, args = []) {
  const stepStart = Date.now();
  console.log(`${YELLOW}[*] Starting: ${name}...${RESET}`);
  console.log(`${CYAN}Executing: ${command} ${args.join(' ')}${RESET}\n`);

  const result = spawnSync(command, args, { stdio: 'inherit', shell: true });
  const exitCode = result.status ?? (result.error ? 1 : 0);
  const stepDuration = Math.round((Date.now() - stepStart) / 1000);

  const stepRecord = {
    name,
    command: `${command} ${args.join(' ')}`.trim(),
    status: exitCode === 0 ? 'SUCCESS' : 'FAILED',
    exitCode,
    durationSeconds: stepDuration
  };

  runReport.steps.push(stepRecord);

  if (exitCode !== 0) {
    runReport.status = 'FAILED';
    runReport.failedStep = name;
    runReport.durationSeconds = Math.round((Date.now() - startTime) / 1000);
    saveReport();
    console.log(`\n${RED}[X] Error: ${name} failed with exit code ${exitCode}.${RESET}`);
    console.log(`${RED}[X] Pipeline report updated: run-report.json${RESET}\n`);
    process.exit(exitCode);
  } else {
    saveReport();
    console.log(`${GREEN}[✓] Success: ${name} completed successfully!${RESET}\n`);
  }
}

// 1. Unit Tests
runStep('Unit Tests', 'npm', ['run', 'test']);

// 2. Gitleaks Secret Scan
runStep('Gitleaks Secret Scan', 'node', ['scripts/scan-secrets.js']);

// 3. Semgrep SAST Scan
runStep('Semgrep SAST Scan', 'node', ['scripts/run-semgrep.js']);

// 4. Linter Check
runStep('Linter Check', 'npm', ['run', 'lint']);

// 5. Production Build
runStep('Production Build', 'npm', ['run', 'build']);

// Pipeline Success
const totalDuration = Math.round((Date.now() - startTime) / 1000);
runReport.status = 'SUCCESS';
runReport.durationSeconds = totalDuration;
saveReport();

console.log(`${GREEN}===============================================${RESET}`);
console.log(`${GREEN}[✓] All checks passed! Reports saved in root.${RESET}`);
console.log(`${GREEN}===============================================${RESET}\n`);

// 6. Start Application
console.log(`${CYAN}Starting application... (npm run start)${RESET}\n`);
spawnSync('npm', ['run', 'start'], { stdio: 'inherit', shell: true });
