"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Shield, LogOut, User, Menu, X } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const navLinks = [
    { href: "/", label: "Scanner" },
    { href: "/history", label: "History" },
  ];

  if (user) {
    navLinks.push(
      { href: "/dashboard", label: "Dashboard" },
      { href: "/monitors", label: "Monitoring" },
      { href: "/developers", label: "Developer API" },
      { href: "/profile", label: "Profile" }
    );
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md font-sans">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 border border-accent/20 group-hover:border-accent/40 group-hover:bg-accent/20 transition-all duration-300">
              <Shield className="text-accent h-5 w-5" />
            </div>
            <span className="font-bold text-text text-sm tracking-wider uppercase">
              Header<span className="text-accent font-extrabold">Guard</span>
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 border ${
                  pathname === link.href
                    ? "text-accent bg-accent/5 border-accent/20 shadow-glow"
                    : "text-text-dim hover:text-text hover:bg-surface border-transparent"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {user ? (
              <div className="flex items-center gap-2.5 ml-2">
                {/* User Session status */}
                <div className="flex items-center gap-2 border border-border/80 bg-surface px-3 py-1.5 rounded-lg text-xs">
                  <User className="text-accent h-3.5 w-3.5" />
                  <span className="text-text font-semibold truncate max-w-[120px]" title={user.email}>
                    {user.email.split("@")[0]}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold tracking-wider border uppercase ${
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
                  aria-label="Logout"
                >
                  <LogOut className="h-4.5 w-4.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link
                  href="/login"
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 border ${
                    pathname === "/login"
                      ? "text-accent bg-accent/5 border-accent/20"
                      : "text-text-dim hover:text-text hover:bg-surface border-transparent"
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider bg-accent text-bg hover:bg-accent-light hover:shadow-glow transition-all duration-200 font-bold"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-text-dim hover:text-text hover:bg-surface border border-transparent hover:border-border transition-all"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-bg/95 backdrop-blur-md px-4 py-4 space-y-2 animate-fadeInUp">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border ${
                pathname === link.href
                  ? "text-accent bg-accent/5 border-accent/20"
                  : "text-text-dim hover:text-text hover:bg-surface border-transparent"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <div className="pt-4 border-t border-border/60 space-y-3">
              <div className="flex items-center justify-between px-4 py-2 bg-surface rounded-lg border border-border">
                <div className="flex items-center gap-2 text-xs text-text truncate">
                  <User className="text-accent h-3.5 w-3.5" />
                  <span className="font-semibold truncate max-w-[160px]">{user.email}</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold border uppercase ${
                  user.role === "admin" 
                    ? "border-accent/40 bg-accent/10 text-accent" 
                    : "border-success/30 bg-success/10 text-success"
                }`}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-danger/5 border border-danger/20 text-danger hover:bg-danger/10 text-xs font-bold uppercase tracking-wider transition-all"
              >
                <LogOut className="h-4 w-4" />
                Logout Console
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-border/60 grid grid-cols-2 gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider text-text-dim hover:text-text hover:bg-surface border border-border/60 text-center"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-accent text-bg hover:bg-accent-light text-center"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
