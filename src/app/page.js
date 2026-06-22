import Navbar from "@/components/layout/Navbar";
import ScannerForm from "@/components/forms/ScannerForm";
import Card from "@/components/ui/Card";
import { Shield, Zap, Database } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg font-sans">
      <Navbar />

      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-12 sm:py-20 select-none animate-fadeInUp">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-accent pulse-accent" />
            Security Analysis Console
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-text tracking-wider uppercase mb-4 leading-tight">
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
            index={1}
          />
          <FeatureChip
            icon={Zap}
            title="Instant Results"
            desc="Real-time evaluation with grades"
            index={2}
          />
          <FeatureChip
            icon={Database}
            title="Secure logs"
            desc="All history archived with privacy masking"
            index={3}
          />
        </div>
      </main>
    </div>
  );
}

function FeatureChip({ icon: Icon, title, desc, index }) {
  return (
    <Card hoverable className={`p-5 flex flex-col justify-between animate-fadeInUp stagger-${index}`}>
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Icon className="text-accent h-4 w-4" />
          <span className="text-text text-xs font-bold uppercase tracking-wider">{title}</span>
        </div>
        <p className="text-text-dim text-[11px] leading-relaxed">{desc}</p>
      </div>
    </Card>
  );
}
