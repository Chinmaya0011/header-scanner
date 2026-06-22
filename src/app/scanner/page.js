import Navbar from "@/components/layout/Navbar";
import ScannerForm from "@/components/forms/ScannerForm";
import Card from "@/components/ui/Card";
import { Shield, Lock, Activity } from "lucide-react";

export const metadata = {
  title: "Security Header Scanner | HeaderGuard",
  description: "Analyze response headers for Content-Security-Policy, HSTS, CORS misconfigurations, and receive step-by-step fix guides.",
};

export default function ScannerPage() {
  return (
    <div className="min-h-screen bg-bg font-sans text-text flex flex-col">
      <Navbar />

      <main className="flex-1 mx-auto max-w-4xl w-full px-4 sm:px-6 py-12 sm:py-16 select-none animate-fadeInUp z-10 relative">
        {/* Soft background glow */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[90px] pointer-events-none -z-10" />

        {/* Section Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider border border-accent/20">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Security Scan Engine
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight uppercase leading-tight max-w-2xl mx-auto">
            Audit Website <span className="text-accent">Headers</span>
          </h1>

          <p className="text-text-dim text-xs sm:text-sm max-w-md mx-auto leading-relaxed uppercase tracking-wider">
            Examine HTTP response parameters, locate structural vulnerabilities, and verify compliance in real-time.
          </p>
        </div>

        {/* Scanner Form */}
        <div className="max-w-3xl mx-auto">
          <ScannerForm />
        </div>

        {/* Quick Tips Section */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
          <div className="bg-surface/40 border border-white/[0.03] rounded-xl p-5 space-y-2 hover:border-white/10 transition-all duration-300">
            <div className="p-1.5 rounded bg-accent/10 text-accent self-start inline-flex">
              <Shield className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text">Instant Scoring</h3>
            <p className="text-[10px] text-text-dim leading-relaxed">Get a comprehensive security grade based on OWASP security header recommendations.</p>
          </div>

          <div className="bg-surface/40 border border-white/[0.03] rounded-xl p-5 space-y-2 hover:border-white/10 transition-all duration-300">
            <div className="p-1.5 rounded bg-accent/10 text-accent self-start inline-flex">
              <Lock className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text">Compliance Audits</h3>
            <p className="text-[10px] text-text-dim leading-relaxed">Check if your headers meet strict regulatory compliance requirements like PCI-DSS and HIPAA.</p>
          </div>

          <div className="bg-surface/40 border border-white/[0.03] rounded-xl p-5 space-y-2 hover:border-white/10 transition-all duration-300">
            <div className="p-1.5 rounded bg-accent/10 text-accent self-start inline-flex">
              <Activity className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text">Actionable Recommendations</h3>
            <p className="text-[10px] text-text-dim leading-relaxed">Copy ready-to-use snippets for Nginx, Apache, IIS, Cloudflare, and Next.js instantly.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
