"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg) => showToast(msg, "success"),
    error: (msg) => showToast(msg, "error"),
    warning: (msg) => showToast(msg, "warning"),
    info: (msg) => showToast(msg, "info"),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      
      {/* Toast Portal Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full font-sans pointer-events-none">
        {toasts.map((t) => {
          let bgClass = "bg-surface border-border text-text";
          let icon = <Info className="h-4 w-4 text-accent" />;
          let accentClass = "border-accent/40";
          let glowClass = "shadow-[0_0_15px_rgba(99,102,241,0.1)]";

          if (t.type === "success") {
            bgClass = "bg-[#0b1f13]/95 border-success/35 text-[#cbfce1]";
            icon = <CheckCircle2 className="h-4 w-4 text-success" />;
            accentClass = "border-success/30";
            glowClass = "shadow-[0_0_20px_rgba(16,185,129,0.1)]";
          } else if (t.type === "error") {
            bgClass = "bg-[#241315]/95 border-danger/35 text-[#fcd8d9]";
            icon = <XCircle className="h-4 w-4 text-danger" />;
            accentClass = "border-danger/30";
            glowClass = "shadow-[0_0_20px_rgba(239,68,68,0.1)]";
          } else if (t.type === "warning") {
            bgClass = "bg-[#241d0f]/95 border-warning/35 text-[#fdf2d0]";
            icon = <AlertTriangle className="h-4 w-4 text-warning" />;
            accentClass = "border-warning/30";
            glowClass = "shadow-[0_0_20px_rgba(245,158,11,0.1)]";
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border ${bgClass} ${accentClass} ${glowClass} backdrop-blur-md transition-all duration-300`}
              style={{
                animation: "fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <div className="flex-shrink-0 mt-0.5">{icon}</div>
              <div className="flex-1 text-xs leading-relaxed font-medium break-words">
                {t.message}
              </div>
              <button
                onClick={() => dismissToast(t.id)}
                className="flex-shrink-0 text-text-dim hover:text-text p-0.5 rounded transition-colors"
                aria-label="Close notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
