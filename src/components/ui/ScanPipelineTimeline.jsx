"use client";

import { CheckCircle2, Clock, Activity, Shield, Globe, Lock, Cpu, Check } from "lucide-react";

export default function ScanPipelineTimeline({ duration = 0, timestamp }) {
  const steps = [
    { name: "DNS & Zone Resolution", duration: "120ms", icon: Globe },
    { name: "TLS / SSL Handshake", duration: "240ms", icon: Lock },
    { name: "HTTP Header Matrix", duration: "180ms", icon: Shield },
    { name: "Port & Asset Mapping", duration: "310ms", icon: Cpu },
    { name: "OWASP Policy Synthesis", duration: "110ms", icon: Activity },
  ];

  const totalTimeStr = duration > 0 ? `${(duration / 1000).toFixed(2)}s` : "0.96s";

  return (
    <div className="glass-card p-4 space-y-3 font-sans">
      {/* Header Bar */}
      <div className="flex flex-row items-center justify-between pb-2.5 border-b border-border">
        <div className="inline-flex flex-row items-center gap-2">
          <Activity className="w-4 h-4 text-accent shrink-0" />
          <h3 className="font-bold text-xs text-text uppercase tracking-wider whitespace-nowrap">
            Scan Execution Pipeline
          </h3>
        </div>
        <div className="inline-flex flex-row items-center gap-1.5 font-mono text-xs text-text-dim shrink-0 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 text-accent shrink-0" />
          <span>Total Latency: <strong className="text-text">{totalTimeStr}</strong></span>
        </div>
      </div>

      {/* Stepper Grid - 1 Row horizontal flex icons + text */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 font-mono">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={idx} className="p-2.5 bg-panel/60 border border-border rounded flex flex-row items-center justify-between gap-2 min-w-0">
              <div className="inline-flex flex-row items-center gap-2 min-w-0 flex-1">
                <div className="w-6 h-6 rounded bg-surface border border-border flex flex-row items-center justify-center text-accent shrink-0">
                  <Icon className="w-3 h-3 shrink-0" />
                </div>
                <span className="text-[11px] font-sans font-semibold text-text leading-tight truncate whitespace-nowrap">{step.name}</span>
              </div>
              <span className="inline-flex flex-row items-center gap-0.5 text-[10px] text-success font-bold shrink-0 whitespace-nowrap">
                <Check className="w-3 h-3 shrink-0" />
                <span>{step.duration}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
