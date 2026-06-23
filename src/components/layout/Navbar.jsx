"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Shield, 
  LogOut, 
  User, 
  Menu, 
  X, 
  ChevronDown, 
  Settings, 
  Code, 
  LayoutDashboard,
  Activity,
  BookOpen,
  History,
  Home,
  Crown
} from "lucide-react";

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
        if (!res.ok) {
          setUser(null);
          return;
        }
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          if (data && data.loggedIn) {
            setUser(data.user);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Failed to load auth status in navbar:", err);
        setUser(null);
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
        { href: "/scanner", label: "Scanner", icon: Shield },
        { href: "/history", label: "History", icon: History },
        { href: "/dashboard", label: "Console", icon: LayoutDashboard },
        { href: "/monitors", label: "Monitors", icon: Activity, isLive: true },
        { href: "/docs", label: "Docs", icon: BookOpen },
      ]
    : [
        { href: "/home", label: "Home", icon: Home },
        { href: "/scanner", label: "Scanner", icon: Shield },
        { href: "/docs", label: "Docs", icon: BookOpen },
        { href: "/demo/user", label: "Demo User", icon: User },
        { href: "/demo/admin", label: "Demo Admin", icon: Crown },
      ];

  return (
    <nav className="sticky top-0 z-50 bg-[#030712]/75 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.15)] transition-all duration-300">
      {/* Top micro-gradient indicator bar */}
      <div className="h-[2px] w-full bg-gradient-to-r from-accent/40 via-accent to-accent-light/40" />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo Brand */}
          <Link href="/home" className="flex items-center group">
            <div className="flex flex-col">
              <span className="font-sans text-[15.5px] font-bold tracking-tight text-white group-hover:text-accent-light transition-colors leading-none">
                Header<span className="text-accent font-extrabold">Guard</span>
              </span>
              <span className="font-mono text-[8px] text-text-dim/50 font-semibold uppercase tracking-widest leading-none mt-1">
                Security Scanner
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? "text-accent bg-accent/5 border border-accent/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                      : "text-text-dim hover:text-text hover:bg-white/[0.02] border border-transparent"
                  }`}
                >
                  <Icon className={`h-4 w-4 transition-transform duration-200 ${
                    isActive ? "text-accent" : "text-text-muted group-hover:text-text"
                  }`} />
                  
                  <span>{link.label}</span>
                  
                  {/* Pulse Dot for Monitors */}
                  {link.isLive && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success"></span>
                    </span>
                  )}
                </Link>
              );
            })}

            {user ? (
              <div className="flex items-center gap-2 ml-4 relative" ref={dropdownRef}>
                {/* Profile Trigger Button */}
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 bg-gradient-to-b from-white/[0.04] to-white/[0.01] hover:from-white/[0.08] hover:to-white/[0.02] px-3 py-1.5 rounded-lg text-xs border border-white/[0.08] text-text font-medium transition-all shadow-sm"
                >
                  <div className="h-5 w-5 rounded-full bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-[10px] font-black text-white shadow-inner">
                    {user.email.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="truncate max-w-[110px] text-text/90 font-medium">{user.email.split("@")[0]}</span>
                  <ChevronDown className={`h-3 w-3 text-text-dim transition-transform duration-300 ${profileDropdownOpen ? 'rotate-180 text-text' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-[#0b0f19]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl p-1.5 space-y-1 animate-fadeInUp">
                    {/* User Info Header */}
                    <div className="px-3 py-2.5 border-b border-white/[0.06] select-none text-left">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-xs font-black text-accent">
                          {user.email.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="truncate flex-1">
                          <p className="text-[9px] text-accent font-extrabold uppercase tracking-widest font-mono">Account Session</p>
                          <p className="text-xs text-text font-mono truncate leading-tight mt-0.5" title={user.email}>{user.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <Link
                      href="/developers"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-text-dim hover:text-text hover:bg-white/[0.04] rounded-lg transition-all text-left"
                    >
                      <Code className="h-4 w-4 text-accent" />
                      <div className="flex flex-col">
                        <span>Developer API</span>
                        <span className="text-[9px] text-text-muted">Manage keys & webhooks</span>
                      </div>
                    </Link>

                    <Link
                      href="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-text-dim hover:text-text hover:bg-white/[0.04] rounded-lg transition-all text-left"
                    >
                      <Settings className="h-4 w-4 text-accent" />
                      <div className="flex flex-col">
                        <span>Account Settings</span>
                        <span className="text-[9px] text-text-muted">Security & profile details</span>
                      </div>
                    </Link>

                    {user.role === "admin" && (
                      <Link
                        href="/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-text-dim hover:text-warning hover:bg-warning/5 rounded-lg transition-all border-t border-white/[0.04] pt-2 text-left"
                      >
                        <LayoutDashboard className="h-4 w-4 text-warning" />
                        <div className="flex flex-col">
                          <span>System Console</span>
                          <span className="text-[9px] text-warning/70">Admin configuration control</span>
                        </div>
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-danger hover:bg-danger/10 rounded-lg transition-all border-t border-white/[0.04] mt-1 text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span>Logout Account</span>
                        <span className="text-[9px] text-danger/70 text-opacity-80">Terminate current session</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-4">
                <Link
                  href="/login"
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                    pathname === "/login"
                      ? "text-accent bg-accent/5 border-accent/15"
                      : "text-text-dim hover:text-text hover:bg-white/[0.02] border-transparent"
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent text-white hover:bg-accent-light hover:shadow-glow transition-all duration-300 border border-accent/10"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-text-dim hover:text-text hover:bg-white/5 border border-transparent hover:border-white/[0.05] transition-all"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/[0.06] bg-[#030712]/95 backdrop-blur-xl px-4 py-5 space-y-2.5 animate-fadeInUp shadow-inner">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-left ${
                  isActive
                    ? "text-accent bg-accent/5 border border-accent/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                    : "text-text-dim hover:text-text hover:bg-white/5 border border-transparent"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-accent' : 'text-text-muted'}`} />
                <span className="flex-1">{link.label}</span>
                {link.isLive && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success"></span>
                  </span>
                )}
              </Link>
            );
          })}

          {user ? (
            <div className="pt-4 border-t border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#0b0f19]/80 rounded-lg border border-white/[0.05] shadow-inner">
                <div className="flex items-center gap-2 text-xs text-text truncate">
                  <div className="h-6 w-6 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-[9px] font-black text-accent">
                    {user.email.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="font-semibold truncate max-w-[160px] font-mono">{user.email}</span>
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
                className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-text-dim hover:text-text hover:bg-white/5 rounded-lg transition-all text-left"
              >
                <Code className="h-4 w-4 text-accent" />
                <span>Developer API Hub</span>
              </Link>

              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-text-dim hover:text-text hover:bg-white/5 rounded-lg transition-all text-left"
              >
                <Settings className="h-4 w-4 text-accent" />
                <span>Account Settings</span>
              </Link>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg bg-danger/5 border border-danger/10 text-danger hover:bg-danger/10 text-xs font-bold uppercase tracking-wider transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout Account</span>
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-2.5">
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
                className="flex items-center justify-center px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-accent text-white hover:bg-accent-light text-center"
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
