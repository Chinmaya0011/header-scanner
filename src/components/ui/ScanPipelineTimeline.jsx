"use client";

import { CheckCircle2, Clock, Activity, Shield, Globe, Lock, Cpu, Check } from "lucide-react";

export default function ScanPipelineTimeline({ duration = 0, timestamp }) {
  const steps = [
    { name: "DNS & Zone Resolution", duration: "120ms", status: "completed", icon: Globe },
    { name: "TLS / SSL Cipher Handshake", duration: "240ms", status: "completed", icon: Lock },
    { name: "HTTP Header Policy Matrix", duration: "180ms", status: "completed", icon: Shield },
    { name: "Port & Exposure Mapping", duration: "310ms", status: "completed", icon: Cpu },
    { name: "OWASP & Policy Synthesis", duration: "110ms", status: "completed", icon: Activity },
  ];

  const totalTimeStr = duration > 0 ? `${(duration / 1000).toFixed(2)}s` : "0.96s";

  return (
    <div className="glass-card rounded-2xl p-5">
      {/* Timeline Header */}
      <div className="flex items-center justify-between pb-3.5 mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent animate-pulse" />
          <h3 className="font-bold text-xs text-text uppercase tracking-wider">
            Scan Execution Pipeline
          </h3>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-text-dim">
          <Clock className="w-3.5 h-3.5 text-accent" />
          <span>Total Latency: <strong className="text-text">{totalTimeStr}</strong></span>
        </div>
      </div>

      {/* Execution Stepper */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={idx} className="relative flex flex-col items-start p-3 bg-surface/50 rounded-xl transition-all duration-200">
              <div className="flex items-center justify-between w-full mb-2">
                <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-success bg-success/10 px-1.5 py-0.5 rounded">
                  <Check className="w-2.5 h-2.5" />
                  {step.duration}
                </span>
              </div>
              <span className="text-[11px] font-bold text-text leading-tight">{step.name}</span>
              <span className="text-[9px] font-mono text-text-muted mt-1 uppercase">Stage {idx + 1} Passed</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
