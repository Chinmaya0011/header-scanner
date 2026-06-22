"use client";

import { useState, useEffect } from "react";
import { Terminal, ShieldAlert, Cpu, Radio, Shield } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

const LOG_LINES = [
  "[SYSTEM] Launching HeaderGuard EASM scanner daemon v2.4...",
  "[CONFIG] Mapped scanning sockets for active TCP port probe: [21, 22, 25, 80, 443].",
  "[INFRA] Subdomain crawler buffer initialized (10 common entry prefixes).",
  "[RESOLVE] Root DNS server queried for zone record assertions.",
  "[SCAN] Querying target secure socket TLS certificate expiration data...",
  "[OK] Certificate verified: Let's Encrypt Authority | Expires in 62 days.",
  "[SECURITY] Audited TLS cipher ciphers. Found 4 strong ciphers, 0 weak ciphers.",
  "[CSP] Content-Security-Policy analyzed. Warning: unsafe-inline is enabled on static paths.",
  "[COOKIE] Mapped response cookies list: [session_id, token_hash]. Attribute HttpOnly: OK.",
  "[THREAT] Port check active. Scanning port 22 (SSH)... Connection rejected.",
  "[DISCOVER] Index crawler scanned sensitive folder boundaries. Found /.git (SECURE).",
  "[OK] Compliance checks mapped: GDPR (COMPLIANT), PCI-DSS (VULNERABLE).",
  "[INFO] Aggregating weighted category scores to compute Security Grade...",
  "[SYSTEM] Posture score finalized. Log database entry saved.",
];

export default function TerminalConsole() {
  const [logs, setLogs] = useState([]);
  const [logIndex, setLogIndex] = useState(0);

  useEffect(() => {
    // Add first line on mount
    setLogs([LOG_LINES[0]]);
    setLogIndex(1);
  }, []);

  useEffect(() => {
    if (logIndex >= LOG_LINES.length) {
      // Loop logs or hold
      const timer = setTimeout(() => {
        setLogs([LOG_LINES[0]]);
        setLogIndex(1);
      }, 5000);
      return () => clearTimeout(timer);
    }

    const interval = setTimeout(() => {
      setLogs((prev) => [...prev.slice(-8), LOG_LINES[logIndex]]);
      setLogIndex((prev) => prev + 1);
    }, Math.random() * 2000 + 1000); // Random delay between logs

    return () => clearTimeout(interval);
  }, [logIndex]);

  return (
    <div className="space-y-5">
      {/* Metrics Stats Row */}
      <div className="grid grid-cols-2 gap-3.5">
        <Card className="p-3 bg-surface/30 border border-white/[0.03] backdrop-blur-md flex items-center gap-3">
          <div className="p-2 rounded bg-success/10 text-success">
            <Shield className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-[8px] font-black text-text-dim uppercase tracking-wider">Avg Scan Score</p>
            <p className="text-sm font-bold text-text font-mono">86/100 (B+)</p>
          </div>
        </Card>
        
        <Card className="p-3 bg-surface/30 border border-white/[0.03] backdrop-blur-md flex items-center gap-3">
          <div className="p-2 rounded bg-accent/10 text-accent">
            <Radio className="h-4.5 w-4.5 animate-pulse" />
          </div>
          <div>
            <p className="text-[8px] font-black text-text-dim uppercase tracking-wider">Scans Today</p>
            <p className="text-sm font-bold text-text font-mono">1,248 Audits</p>
          </div>
        </Card>
      </div>

      {/* Terminal Log Shell */}
      <Card className="border border-white/[0.05] bg-bg/90 shadow-2xl relative overflow-hidden font-mono text-[9px] text-accent-light rounded-xl">
        {/* Terminal Header */}
        <div className="bg-surface/50 border-b border-white/[0.04] px-4.5 py-2.5 flex items-center justify-between text-text-dim">
          <div className="flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5 text-accent" />
            <span className="text-[8.5px] font-bold uppercase tracking-wider">guard-engine-feed.log</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500/80" />
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500/80" />
            <span className="h-1.5 w-1.5 rounded-full bg-green-500/80" />
          </div>
        </div>

        {/* Diagnostic log items */}
        <div className="p-4 space-y-2 h-[160px] overflow-y-auto leading-relaxed select-none">
          {logs.map((log, idx) => {
            let logColor = "text-accent-light";
            if (log.includes("[SYSTEM]")) logColor = "text-text-muted";
            else if (log.includes("[OK]")) logColor = "text-success font-semibold";
            else if (log.includes("[WARN]") || log.includes("[SECURITY]")) logColor = "text-warning";
            else if (log.includes("[THREAT]")) logColor = "text-danger font-semibold";

            return (
              <div key={idx} className={`break-all leading-normal ${logColor}`}>
                {log}
              </div>
            );
          })}
          
          <div className="inline-block text-accent font-semibold blink-cursor ml-1">
            █
          </div>
        </div>
      </Card>
      
      {/* Subtext info */}
      <div className="flex items-center gap-2 bg-surface/20 border border-white/[0.02] p-3 rounded-lg text-[9px] text-text-dim leading-relaxed font-sans">
        <Cpu className="h-4.5 w-4.5 text-accent flex-shrink-0" />
        <span>Deploying multi-layered network audits dynamically over standard port bindings to identify SSL, DNS, CSP, and Cookie security postures.</span>
      </div>
    </div>
  );
}
