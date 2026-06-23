const fs = require('fs');
const path = require('path');

// Color helpers for console
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

const RULES = [
  {
    name: 'AWS Access Key ID',
    regex: /(?:AKIA|ASCA|ASIA)[A-Z0-9]{16}/g
  },
  {
    name: 'AWS Secret Access Key',
    regex: /AWS_SECRET_ACCESS_KEY\s*=\s*['"]?[A-Za-z0-9/+=]{40}['"]?/gi
  },
  {
    name: 'GitHub Token',
    regex: /gh[oprs]_[A-Za-z0-9_]{36,255}/g
  },
  {
    name: 'Slack Webhook URL',
    regex: /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9_]{8}\/B[A-Z0-9_]{8}\/[A-Za-z0-9_]{24}/g
  },
  {
    name: 'Stripe Secret Key',
    regex: /sk_(?:test|live)_[0-9a-zA-Z]{24}/g
  },
  {
    name: 'OpenAI API Key',
    regex: /sk-[a-zA-Z0-9]{20,}/g
  },
  {
    name: 'Generic Private Key',
    regex: /-----BEGIN [A-Z ]+ PRIVATE KEY-----/g
  },
  {
    name: 'Generic Secret Assignment',
    regex: /(?:JWT_SECRET|DATABASE_PASSWORD|AZURE_CLIENT_SECRET)\s*=\s*['"]?[A-Za-z0-9_\-]{16,}['"]?/gi
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
  'scripts' // ignore scanner scripts
];

// Files containing mock secrets for testing only
const MOCK_FILES = [
  'test-secret.txt',
  'demo_key.txt'
];

let failed = false;
let totalFilesScanned = 0;

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
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
    
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else {
      callback(filePath, relativePath);
    }
  }
}

console.log(`${CYAN}Scanning repository for hardcoded secrets...${RESET}\n`);

walkDir(process.cwd(), (filePath, relativePath) => {
  totalFilesScanned++;
  
  // Read file content
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    // Skip binary or unreadable files
    return;
  }
  
  const isMockFile = MOCK_FILES.includes(path.basename(relativePath));
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    for (const rule of RULES) {
      // Reset regex index for safety
      rule.regex.lastIndex = 0;
      
      if (rule.regex.test(line)) {
        const lineNum = i + 1;
        const redactedLine = line.replace(rule.regex, '[REDACTED_SECRET]').trim();
        
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

console.log(`${CYAN}Secret scan complete. Scanned ${totalFilesScanned} files.${RESET}`);

if (failed) {
  console.log(`${RED}Error: One or more hardcoded secrets were detected in production-eligible files.${RESET}`);
  process.exit(1);
} else {
  console.log(`${GREEN}Success: No production-blocking hardcoded secrets found.${RESET}`);
  process.exit(0);
}
