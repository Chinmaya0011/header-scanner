"use client";
import { useState } from "react";
import { MdSearch, MdSecurity } from "react-icons/md";
import ScanResults from "./ScanResults";

export default function ScannerForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleScan(e) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Scan failed. Please try again.");
        return;
      }

      setResult(data);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Input form */}
      <form onSubmit={handleScan} className="relative">
        <div className="flex gap-0 rounded-xl overflow-hidden border border-border bg-surface focus-within:border-accent/50 transition-all focus-within:shadow-glow">
          <div className="flex items-center pl-4 text-text-dim">
            <MdSearch className="text-xl" />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            placeholder="Enter domain or URL — e.g. example.com"
            className="scan-input flex-1 bg-transparent px-3 py-4 text-text placeholder:text-muted font-mono text-sm focus:outline-none"
            disabled={loading}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="flex items-center gap-2 px-6 py-4 bg-accent text-bg font-semibold text-sm font-mono hover:bg-accent-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <span className="inline-block h-4 w-4 rounded-full border-2 border-bg/30 border-t-bg animate-spin" />
                Scanning…
              </>
            ) : (
              <>
                <MdSecurity className="text-lg" />
                Scan
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="fade-in-up rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-danger text-sm font-mono">
          ⚠ {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="fade-in-up rounded-xl border border-border bg-surface p-8 flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" />
            <MdSecurity className="absolute inset-0 m-auto text-accent text-2xl" />
          </div>
          <div className="text-center">
            <p className="text-text font-mono text-sm font-semibold">Analyzing security headers…</p>
            <p className="text-text-dim text-xs mt-1">Fetching response headers from the server</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && <ScanResults result={result} />}
    </div>
  );
}
