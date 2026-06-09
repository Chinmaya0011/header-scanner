import Navbar from "@/components/Navbar";
import ScannerForm from "@/components/ScannerForm";
import { MdShield, MdSpeed, MdStorage } from "react-icons/md";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-20">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-mono mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-accent pulse-accent" />
            Security Analysis Tool
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold text-text tracking-tight mb-4">
            Scan your site&apos;s
            <br />
            <span className="text-accent">security headers</span>
          </h1>

          <p className="text-text-dim text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
            Enter any domain or URL to get an instant security report on your HTTP
            response headers — with a score, grade, and actionable fixes.
          </p>
        </div>

        {/* Scanner */}
        <ScannerForm />

        {/* Feature chips */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FeatureChip
            icon={MdShield}
            title="8 Headers Checked"
            desc="CSP, HSTS, X-Frame, CORS, and more"
          />
          <FeatureChip
            icon={MdSpeed}
            title="Instant Results"
            desc="Real-time fetch with scoring & grade"
          />
          <FeatureChip
            icon={MdStorage}
            title="Scan History"
            desc="All results saved with privacy masking"
          />
        </div>
      </main>
    </div>
  );
}

function FeatureChip({ icon: Icon, title, desc }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="text-accent text-lg" />
        <span className="text-text text-sm font-semibold">{title}</span>
      </div>
      <p className="text-text-dim text-xs leading-relaxed">{desc}</p>
    </div>
  );
}
