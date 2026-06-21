"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Shield, LogOut, User } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.loggedIn) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Failed to load auth status in navbar:", err);
      }
    }
    checkAuth();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        setUser(null);
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-bg/85 backdrop-blur-md font-mono select-none">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/5 border border-accent/20 group-hover:border-accent/50 group-hover:bg-accent/10 transition-all duration-300">
              <Shield className="text-accent h-5 w-5 animate-pulse" />
            </div>
            <span className="font-bold text-text text-sm tracking-widest uppercase">
              Header<span className="text-accent font-extrabold">Guard</span>
            </span>
          </Link>

          {/* Nav Items */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border ${
                pathname === "/"
                  ? "text-accent bg-accent/5 border-accent/20 shadow-glow"
                  : "text-text-dim hover:text-text hover:bg-panel border-transparent"
              }`}
            >
              Scanner
            </Link>
            
            <Link
              href="/history"
              className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border ${
                pathname === "/history"
                  ? "text-accent bg-accent/5 border-accent/20 shadow-glow"
                  : "text-text-dim hover:text-text hover:bg-panel border-transparent"
              }`}
            >
              History
            </Link>

            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border ${
                    pathname === "/dashboard"
                      ? "text-accent bg-accent/5 border-accent/20 shadow-glow"
                      : "text-text-dim hover:text-text hover:bg-panel border-transparent"
                  }`}
                >
                  Dashboard
                </Link>

                <Link
                  href="/profile"
                  className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border ${
                    pathname === "/profile"
                      ? "text-accent bg-accent/5 border-accent/20 shadow-glow"
                      : "text-text-dim hover:text-text hover:bg-panel border-transparent"
                  }`}
                >
                  Profile
                </Link>

                {/* User Session status */}
                <div className="hidden sm:flex items-center gap-2 border border-border/60 bg-panel px-3 py-1.5 rounded-lg text-xs">
                  <User className="text-accent h-3.5 w-3.5" />
                  <span className="text-text-dim font-bold truncate max-w-[100px]" title={user.email}>
                    {user.email.split("@")[0]}
                  </span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-extrabold tracking-wider border uppercase ${
                    user.role === "admin" 
                      ? "border-accent/40 bg-accent/10 text-accent" 
                      : "border-success/30 bg-success/10 text-success"
                  }`}>
                    {user.role}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-danger hover:bg-danger/10 border border-transparent hover:border-danger/25 transition-all duration-200 flex items-center justify-center"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border ${
                    pathname === "/login"
                      ? "text-accent bg-accent/5 border-accent/20"
                      : "text-text-dim hover:text-text hover:bg-panel border-transparent"
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="hidden sm:inline-block px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-accent/10 border border-accent/30 hover:bg-accent/20 hover:border-accent text-accent transition-all duration-200"
                >
                  Register
                </Link>
              </>
            )}
          </div>
          
        </div>
      </div>
    </nav>
  );
}
