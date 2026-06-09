"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MdSecurity } from "react-icons/md";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/10 border border-accent/30 group-hover:border-accent/60 transition-colors">
              <MdSecurity className="text-accent text-lg" />
            </div>
            <span className="font-mono font-bold text-text text-sm tracking-wide">
              Header<span className="text-accent">Guard</span>
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname === "/"
                  ? "text-accent bg-accent/10"
                  : "text-text-dim hover:text-text hover:bg-panel"
              }`}
            >
              Scanner
            </Link>
            <Link
              href="/history"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname === "/history"
                  ? "text-accent bg-accent/10"
                  : "text-text-dim hover:text-text hover:bg-panel"
              }`}
            >
              History
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
