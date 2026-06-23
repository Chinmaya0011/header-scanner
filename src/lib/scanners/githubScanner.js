export async function scanGitHub(usernameOrOrg) {
  const result = {
    username: usernameOrOrg,
    exists: false,
    type: "unknown",
    publicReposCount: 0,
    repos: [],
    findings: [],
    checkedAt: new Date().toISOString()
  };

  if (!usernameOrOrg) return result;

  const target = usernameOrOrg.trim();
  let reposData = [];
  let isOrg = false;
  let ownerName = "";

  // 1. Fetch repositories from GitHub API (try org first, fallback to user)
  try {
    const orgRes = await fetch(`https://api.github.com/orgs/${target}/repos?sort=updated&per_page=5`, {
      headers: { "User-Agent": "HeaderGuard-Scanner/2.0" }
    });

    if (orgRes.status === 200) {
      reposData = await orgRes.json();
      isOrg = true;
      result.type = "organization";
      result.exists = true;
      ownerName = target;
    } else {
      const userRes = await fetch(`https://api.github.com/users/${target}/repos?sort=updated&per_page=5`, {
        headers: { "User-Agent": "HeaderGuard-Scanner/2.0" }
      });
      if (userRes.status === 200) {
        reposData = await userRes.json();
        isOrg = false;
        result.type = "user";
        result.exists = true;
        ownerName = target;
      }
    }
  } catch (err) {
    console.error("GitHub API fetch error:", err);
    return result;
  }

  if (!result.exists || !Array.isArray(reposData)) {
    return result;
  }

  result.publicReposCount = reposData.length;

  // Let's audit the top 3 public repos to avoid rate limits
  const reposToAudit = reposData.slice(0, 3);
  const secretsRegex = {
    google_api: /AIzaSy[A-Za-z0-9_-]{35}/,
    slack_webhook: /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9_]+\/B[A-Z0-9_]+\/[A-Za-z0-9_]+/,
    aws_key: /([^A-Z0-9]|^)(AKIA|ASCA|ACCA|ASIA)[A-Z0-9]{16}([^A-Z0-9]|$)/,
    generic_secret: /(password|jwt_secret|api_key|client_secret|db_pass)\s*=\s*['"]?[a-zA-Z0-9_\-\.\/!@#\$%^&*()]{8,}['"]?/i
  };

  const checkFileInRepo = async (owner, repo, filename, branch = "main") => {
    try {
      const res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filename}`);
      if (res.status === 200) {
        const content = await res.text();
        return { exists: true, content };
      }
      if (branch === "main") {
        // Fallback to master
        const fallbackRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/master/${filename}`);
        if (fallbackRes.status === 200) {
          const content = await fallbackRes.text();
          return { exists: true, content };
        }
      }
      return { exists: false, content: null };
    } catch {
      return { exists: false, content: null };
    }
  };

  for (const repo of reposToAudit) {
    const repoInfo = {
      name: repo.name,
      description: repo.description || "No description provided",
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language || "Not Detected",
      license: repo.license ? repo.license.name : "None",
      hasReadme: false,
      hasSecurityPolicy: false,
      exposedEnv: false,
      exposedSecrets: [],
      dependencyFiles: []
    };

    const repoName = repo.name;

    // 1. Check README.md
    const readmeCheck = await checkFileInRepo(ownerName, repoName, "README.md");
    repoInfo.hasReadme = readmeCheck.exists;

    if (!readmeCheck.exists) {
      result.findings.push({
        title: `Missing README.md in Repository "${repoName}"`,
        category: "Repository Health",
        severity: "low",
        description: `Public repository "${repoName}" does not have a README.md file in its root directory.`,
        evidence: "HTTP 404 Not Found on README.md",
        businessImpact: "Lack of repository documentation affects repository usability and makes it difficult for security reviewers to evaluate the asset usage.",
        technicalExplanation: "The README file is the entry point for code guidelines and configuration descriptions.",
        remediation: "Create a README.md file documenting the project purpose and basic setup guide.",
        references: ["https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes"],
        timestamp: new Date().toISOString()
      });
    }

    // 2. Check SECURITY.md
    const securityCheck = await checkFileInRepo(ownerName, repoName, "SECURITY.md");
    repoInfo.hasSecurityPolicy = securityCheck.exists;

    if (!securityCheck.exists) {
      result.findings.push({
        title: `Missing Security Policy (SECURITY.md) in "${repoName}"`,
        category: "Repository Security Policy",
        severity: "medium",
        description: `Public repository "${repoName}" does not define a SECURITY.md file outlining how security disclosures should be made.`,
        evidence: "HTTP 404 Not Found on SECURITY.md or .github/SECURITY.md",
        businessImpact: "Without a vulnerability reporting policy, researchers may disclose vulnerabilities publicly, leading to zero-day exposures.",
        technicalExplanation: "SECURITY.md defines the instructions on how to report safety vulnerabilities privately to the maintainers.",
        remediation: "Add a SECURITY.md file in the root or .github directory detailing the vulnerability disclosure procedure and contacts.",
        references: ["https://docs.github.com/en/code-security/getting-started/adding-a-security-policy-to-your-repository"],
        timestamp: new Date().toISOString()
      });
    }

    // 3. Check License
    if (!repo.license) {
      result.findings.push({
        title: `Unlicensed Public Repository "${repoName}"`,
        category: "Compliance",
        severity: "low",
        description: `Public repository "${repoName}" does not have a license file declared on GitHub.`,
        evidence: "No license structure detected in GitHub repository metadata.",
        businessImpact: "Without a license, copyright rules apply by default, potentially creating legal issues regarding code reuse or compliance gaps.",
        technicalExplanation: "License tags define usage rights for open-source codebases.",
        remediation: "Select and configure a valid open-source license (like MIT, Apache 2.0, or BSD) and upload the LICENSE file.",
        references: ["https://choosealicense.com/"],
        timestamp: new Date().toISOString()
      });
    }

    // 4. Check .env / environment files exposure
    const envCheck = await checkFileInRepo(ownerName, repoName, ".env");
    const envLocalCheck = await checkFileInRepo(ownerName, repoName, ".env.local");

    if (envCheck.exists || envLocalCheck.exists) {
      repoInfo.exposedEnv = true;
      const targetEnv = envCheck.exists ? ".env" : ".env.local";
      const envContent = envCheck.exists ? envCheck.content : envLocalCheck.content;

      // Scan content for secrets
      const foundSecrets = [];
      for (const [key, regex] of Object.entries(secretsRegex)) {
        const match = envContent.match(regex);
        if (match) {
          foundSecrets.push(key.replace("_", " ").toUpperCase());
        }
      }

      repoInfo.exposedSecrets = foundSecrets;

      result.findings.push({
        title: `Exposed Environment Configuration File (${targetEnv}) in "${repoName}"`,
        category: "Sensitive Data Exposure",
        severity: foundSecrets.length > 0 ? "critical" : "high",
        description: `The public repository "${repoName}" contains an active configuration file "${targetEnv}" exposed in its root folder.`,
        evidence: `Exposed File: ${targetEnv}\nSecrets Detected: ${foundSecrets.length > 0 ? foundSecrets.join(", ") : "None Detected (Key-Value entries present)"}`,
        businessImpact: "Leaked credentials or server keys can give unauthorized individuals full access to databases, cloud servers, or third-party APIs.",
        technicalExplanation: "Environment files contain private tokens and config hashes that should never be pushed to version control.",
        remediation: "Immediately delete the file from the public repository and add it to .gitignore. Rotate any credentials or keys listed in the file.",
        references: ["https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning"],
        timestamp: new Date().toISOString()
      });
    }

    // 5. Check dependency manifests
    const packageCheck = await checkFileInRepo(ownerName, repoName, "package.json");
    if (packageCheck.exists) repoInfo.dependencyFiles.push("package.json");

    const reqsCheck = await checkFileInRepo(ownerName, repoName, "requirements.txt");
    if (reqsCheck.exists) repoInfo.dependencyFiles.push("requirements.txt");

    const goCheck = await checkFileInRepo(ownerName, repoName, "go.mod");
    if (goCheck.exists) repoInfo.dependencyFiles.push("go.mod");

    result.repos.push(repoInfo);
  }

  return result;
}
