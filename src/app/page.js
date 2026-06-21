import Navbar from "@/components/Navbar";
import ScannerForm from "@/components/ScannerForm";
import { Shield, Zap, Database } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg font-mono">
      <Navbar />

      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-12 sm:py-20 select-none animate-fadeInUp">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent text-[10px] font-bold uppercase tracking-wider mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-accent pulse-accent" />
            Security Analysis Console
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-text tracking-widest uppercase mb-4 leading-tight">
            Scan your site&apos;s
            <br />
            <span className="text-accent">security headers</span>
          </h1>

          <p className="text-text-dim text-xs sm:text-sm max-w-md mx-auto leading-relaxed uppercase tracking-wider">
            Audit response headers for Content-Security-Policy, HSTS, CORS misconfigurations, and receive fix instructions.
          </p>
        </div>

        {/* Scanner */}
        <ScannerForm />

        {/* Feature chips */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FeatureChip
            icon={Shield}
            title="8 Headers Checked"
            desc="CSP, HSTS, X-Frame, CORS, and more"
          />
          <FeatureChip
            icon={Zap}
            title="Instant Results"
            desc="Real-time evaluation with grades"
          />
          <FeatureChip
            icon={Database}
            title="Secure logs"
            desc="All history archived with privacy masking"
          />
        </div>
      </main>
    </div>
  );
}

function FeatureChip({ icon: Icon, title, desc }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 hover:border-accent/40 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="text-accent h-4 w-4" />
        <span className="text-text text-xs font-bold uppercase tracking-wider">{title}</span>
      </div>
      <p className="text-text-dim text-[11px] leading-relaxed">{desc}</p>
    </div>
  );
}
