"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Shield, LogOut, User, Menu, X, ChevronDown, Settings, Code, LayoutDashboard, BellRing } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  
  const dropdownRef = useRef(null);

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

  // Click outside to close profile dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        setUser(null);
        setProfileDropdownOpen(false);
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navLinks = user
    ? [
        { href: "/scanner", label: "Scanner" },
        { href: "/history", label: "History" },
        { href: "/dashboard", label: "Console" },
        { href: "/monitors", label: "Monitors" },
      ]
    : [
        { href: "/home", label: "Home" },
        { href: "/scanner", label: "Scanner" },
        { href: "/demo/user", label: "Demo User" },
        { href: "/demo/admin", label: "Demo Admin" },
      ];

  return (
    <nav className="sticky top-0 z-50 bg-bg/75 backdrop-blur-md border-b border-white/[0.04] font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo */}
          <Link href="/home" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 border border-accent/20 group-hover:border-accent/40 group-hover:bg-accent/20 transition-all duration-300">
              <Shield className="text-accent h-5 w-5" />
            </div>
            <span className="font-bold text-text text-sm tracking-wider uppercase">
              Header<span className="text-accent font-extrabold">Guard</span>
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                  pathname === link.href
                    ? "text-accent bg-accent/10 font-bold"
                    : "text-text-dim hover:text-text hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {user ? (
              <div className="flex items-center gap-2 ml-4 relative" ref={dropdownRef}>
                {/* Profile Trigger Button */}
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg text-xs border border-white/[0.05] text-text font-semibold transition-all"
                >
                  <User className="text-accent h-3.5 w-3.5" />
                  <span className="truncate max-w-[120px]">{user.email.split("@")[0]}</span>
                  <ChevronDown className="h-3 w-3 text-text-dim group-hover:text-text transition-transform duration-200" />
                </button>

                {/* Glassmorphic Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-surface/95 border border-white/[0.05] rounded-xl shadow-2xl backdrop-blur-md p-1.5 space-y-0.5 animate-fadeInUp">
                    <div className="px-3.5 py-2.5 border-b border-white/[0.04] select-none">
                      <p className="text-[10px] text-text-dim font-bold uppercase tracking-wider">Account Access</p>
                      <p className="text-xs text-text font-mono truncate mt-0.5" title={user.email}>{user.email}</p>
                    </div>
                    
                    <Link
                      href="/developers"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-text-dim hover:text-text hover:bg-white/5 rounded-lg transition-all"
                    >
                      <Code className="h-4 w-4 text-accent" />
                      <span>Developer API</span>
                    </Link>

                    <Link
                      href="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-text-dim hover:text-text hover:bg-white/5 rounded-lg transition-all"
                    >
                      <Settings className="h-4 w-4 text-accent" />
                      <span>Account Settings</span>
                    </Link>

                    {user.role === "admin" && (
                      <Link
                        href="/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-text-dim hover:text-text hover:bg-white/5 rounded-lg transition-all border-t border-white/[0.04] pt-2"
                      >
                        <LayoutDashboard className="h-4 w-4 text-warning" />
                        <span>System Control Console</span>
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-danger hover:bg-danger/10 rounded-lg transition-all border-t border-white/[0.04] mt-1"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout Account</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-4">
                <Link
                  href="/login"
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    pathname === "/login"
                      ? "text-accent bg-accent/10"
                      : "text-text-dim hover:text-text hover:bg-white/5"
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-accent text-bg hover:bg-accent-light hover:shadow-glow transition-all duration-200"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-text-dim hover:text-text hover:bg-white/5 transition-all"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/[0.04] bg-bg/95 backdrop-blur-md px-4 py-4 space-y-1.5 animate-fadeInUp">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                pathname === link.href
                  ? "text-accent bg-accent/10 border border-accent/20"
                  : "text-text-dim hover:text-text hover:bg-white/5 border border-transparent"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <div className="pt-4 border-t border-white/[0.04] space-y-2">
              <div className="flex items-center justify-between px-4 py-2 bg-surface rounded-lg border border-white/[0.05]">
                <div className="flex items-center gap-2 text-xs text-text truncate">
                  <User className="text-accent h-3.5 w-3.5" />
                  <span className="font-semibold truncate max-w-[160px]">{user.email}</span>
                </div>
                <span className={`text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase border ${
                  user.role === "admin" 
                    ? "border-accent/40 bg-accent/10 text-accent" 
                    : "border-success/30 bg-success/10 text-success"
                }`}>
                  {user.role}
                </span>
              </div>
              
              <Link
                href="/developers"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-text-dim hover:text-text hover:bg-white/5 rounded-lg transition-all"
              >
                <Code className="h-4 w-4 text-accent" />
                <span>Developer API Hub</span>
              </Link>

              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-text-dim hover:text-text hover:bg-white/5 rounded-lg transition-all"
              >
                <Settings className="h-4 w-4 text-accent" />
                <span>Account Settings</span>
              </Link>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg bg-danger/5 border border-danger/20 text-danger hover:bg-danger/10 text-xs font-bold uppercase tracking-wider transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout Account</span>
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-white/[0.04] grid grid-cols-2 gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-text-dim hover:text-text hover:bg-white/5 border border-white/[0.05] text-center"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-accent text-bg hover:bg-accent-light text-center"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
