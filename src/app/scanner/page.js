import Navbar from "@/components/layout/Navbar";
import ScannerForm from "@/components/forms/ScannerForm";

export const metadata = {
  title: "EASM Website Security Posture Scanner | HeaderGuard",
  description: "Examine server headers, resolve SSL/TLS ciphers, query DNS security zones, and verify PCI/GDPR compliance in real-time.",
};

export default function ScannerPage() {
  return (
    <div className="min-h-screen bg-bg font-sans text-text flex flex-col relative overflow-hidden">
      
      {/* Dynamic Background Blurs */}
      <div className="absolute top-12 left-1/3 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-24 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <Navbar />

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 py-10 z-10 relative">
        <ScannerForm />
      </main>
    </div>
  );
}
