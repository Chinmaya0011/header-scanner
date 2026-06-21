"use client";

import Link from "next/link";
import { Shield, ChevronRight } from "lucide-react";

export default function Scanner({
    scanUrl,
    setScanUrl,
    scanLoading,
    scanError,
    scanSuccessId,
    handleLiveScan
}) {
    return (
        <div className="bg-surface border border-border rounded-xl p-6 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4 border-b border-border/30 pb-3">
                <Shield className="text-accent h-4 w-4 animate-pulse" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-text">Launch Console Header Audit</h2>
            </div>

            <form onSubmit={handleLiveScan} className="flex flex-col sm:flex-row gap-2">
                <input
                    type="text"
                    required
                    value={scanUrl}
                    onChange={(e) => setScanUrl(e.target.value)}
                    placeholder="Enter domain e.g., google.com or https://example.com"
                    className="flex-1 bg-panel border border-border focus:border-accent rounded-lg px-4 py-2.5 text-xs text-text font-mono focus:outline-none scan-input w-full"
                    disabled={scanLoading}
                />
                <button
                    type="submit"
                    disabled={scanLoading || !scanUrl.trim()}
                    className="bg-accent/10 border border-accent/40 text-accent font-bold px-6 py-2.5 rounded-lg text-xs uppercase tracking-wider hover:bg-accent/25 transition-colors disabled:opacity-50 w-full sm:w-auto flex items-center justify-center"
                >
                    {scanLoading ? "Auditing..." : "Audit"}
                </button>
            </form>

            {scanError && (
                <div className="mt-3 p-3 bg-danger/5 border border-danger/25 text-danger text-xs rounded-lg font-mono">
                    ⚠ {scanError}
                </div>
            )}

            {scanSuccessId && (
                <div className="mt-3 p-3 bg-success/5 border border-success/25 text-success text-xs rounded-lg font-mono flex items-center justify-between">
                    <span>✔ Security evaluation successful!</span>
                    <Link
                        href={`/scan/${scanSuccessId}`}
                        className="text-accent hover:underline flex items-center font-bold"
                    >
                        View report console <ChevronRight className="h-4 w-4" />
                    </Link>
                </div>
            )}

            {scanLoading && (
                <div className="mt-4 p-4 border border-border bg-panel/30 rounded-lg flex items-center gap-3 animate-pulse text-xs text-text-dim">
                    <div className="h-4 w-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                    <span>Connecting to target host & evaluating cryptographic configs...</span>
                </div>
            )}
        </div>
    );
}