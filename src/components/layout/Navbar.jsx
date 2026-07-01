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
  Crown,
  Bell,
  Check,
  Trash2,
  Inbox,
  AlertCircle,
  CheckSquare
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  // Use notifications hook
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
  } = useNotifications(user);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        logout();
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
            {loading ? (
              <div className="flex items-center gap-4 px-2">
                <div className="h-6 w-16 bg-white/5 rounded-lg animate-pulse" />
                <div className="h-6 w-16 bg-white/5 rounded-lg animate-pulse" />
                <div className="h-6 w-16 bg-white/5 rounded-lg animate-pulse" />
                <div className="h-6 w-16 bg-white/5 rounded-lg animate-pulse" />
                <div className="h-8 w-24 bg-white/5 rounded-lg animate-pulse ml-4" />
              </div>
            ) : (
              <>
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
                  <div className="flex items-center gap-3 ml-4">
                    {/* Notification Center Dropdown */}
                    <div className="relative" ref={notifRef}>
                      <button
                        onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                        className="relative p-2 text-text-dim hover:text-text hover:bg-white/[0.04] rounded-lg transition-all"
                        aria-label="Notifications"
                      >
                        <Bell id="notif-bell-icon" className={`h-4.5 w-4.5 transition-colors duration-200 ${unreadCount > 0 ? "text-accent" : "text-text-dim"}`} />
                        {unreadCount > 0 && (
                          <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 transform translate-x-0.5 -translate-y-0.5 items-center justify-center rounded-full bg-danger text-[8px] font-black text-white border border-[#030712]">
                            {unreadCount}
                          </span>
                        )}
                      </button>

                      {notifDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-[#0b0f19]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl p-1.5 space-y-1 animate-fadeInUp z-50">
                          {/* Header */}
                          <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] select-none text-left">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-text">Notifications</p>
                              {unreadCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-accent/10 text-accent border border-accent/20">
                                  {unreadCount} new
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              {unreadCount > 0 && (
                                <button
                                  onClick={markAllAsRead}
                                  className="text-[10px] text-accent hover:text-accent-light font-semibold hover:underline"
                                >
                                  Mark all read
                                </button>
                              )}
                              {notifications.length > 0 && (
                                <button
                                  onClick={deleteAllNotifications}
                                  className="text-[10px] text-danger hover:text-opacity-85 font-semibold flex items-center gap-0.5"
                                >
                                  <Trash2 className="h-3 w-3" /> Clear all
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Notification List */}
                          <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.04] scrollbar-thin">
                            {notifications.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-8 text-center text-text-muted gap-2">
                                <Inbox className="h-8 w-8 opacity-40" />
                                <p className="text-xs font-medium">All caught up!</p>
                                <p className="text-[10px]">No new notifications.</p>
                              </div>
                            ) : (
                              notifications.map((notif) => {
                                let typeColor = "text-accent";
                                let bgType = "bg-accent/5";
                                let icon = <Bell className="h-3.5 w-3.5" />;

                                if (notif.type === "success") {
                                  typeColor = "text-success";
                                  bgType = "bg-success/5";
                                  icon = <Check className="h-3.5 w-3.5" />;
                                } else if (notif.type === "danger" || notif.type === "security") {
                                  typeColor = "text-danger";
                                  bgType = "bg-danger/5";
                                  icon = <AlertCircle className="h-3.5 w-3.5" />;
                                } else if (notif.type === "warning") {
                                  typeColor = "text-warning";
                                  bgType = "bg-warning/5";
                                  icon = <AlertCircle className="h-3.5 w-3.5" />;
                                }

                                return (
                                  <div
                                    key={notif._id}
                                    className={`flex items-start gap-3 p-3 rounded-lg hover:bg-white/[0.02] transition-colors relative group ${
                                      !notif.isRead ? "bg-white/[0.01]" : ""
                                    }`}
                                  >
                                    {/* Icon */}
                                    <div className={`flex-shrink-0 p-1.5 rounded-lg ${bgType} ${typeColor} mt-0.5`}>
                                      {icon}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 text-left">
                                      <div className="flex items-center justify-between gap-2">
                                        <p className={`text-xs font-bold truncate leading-tight ${!notif.isRead ? "text-text" : "text-text-dim"}`}>
                                          {notif.title}
                                        </p>
                                        <span className="text-[9px] text-text-muted font-mono flex-shrink-0">
                                          {new Date(notif.createdAt).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit"
                                          })}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-text-dim leading-normal mt-1 whitespace-pre-wrap">
                                        {notif.message}
                                      </p>

                                      {/* Action Buttons */}
                                      <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!notif.isRead && (
                                          <button
                                            onClick={() => markAsRead(notif._id)}
                                            className="text-[9px] text-accent hover:text-accent-light font-bold flex items-center gap-0.5"
                                          >
                                            <CheckSquare className="h-3 w-3" /> Mark read
                                          </button>
                                        )}
                                        <button
                                          onClick={() => deleteNotification(notif._id)}
                                          className="text-[9px] text-danger hover:text-opacity-80 font-bold flex items-center gap-0.5"
                                        >
                                          <Trash2 className="h-3 w-3" /> Delete
                                        </button>
                                      </div>
                                    </div>

                                    {/* Unread dot */}
                                    {!notif.isRead && (
                                      <span className="absolute top-3.5 right-3.5 h-1.5 w-1.5 bg-accent rounded-full animate-pulse" />
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Profile Trigger button wrapper */}
                    <div className="flex items-center gap-2 relative" ref={dropdownRef}>
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
              </>
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
          {loading ? (
            <div className="space-y-4">
              <div className="h-8 w-full bg-white/5 rounded-lg animate-pulse" />
              <div className="h-8 w-full bg-white/5 rounded-lg animate-pulse" />
              <div className="h-8 w-full bg-white/5 rounded-lg animate-pulse" />
              <div className="pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-2.5">
                <div className="h-9 bg-white/5 rounded-lg animate-pulse" />
                <div className="h-9 bg-white/5 rounded-lg animate-pulse" />
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}
    </nav>
  );
}
