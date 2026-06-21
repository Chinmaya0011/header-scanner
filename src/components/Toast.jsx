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

  // Helpers
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
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full font-mono pointer-events-none">
        {toasts.map((t) => {
          let bgClass = "bg-surface border-border text-text";
          let icon = <Info className="h-4 w-4 text-accent" />;
          let accentClass = "border-accent/40";
          let glowClass = "shadow-[0_0_15px_rgba(0,255,65,0.1)]";

          if (t.type === "success") {
            bgClass = "bg-[#0a1f0d]/90 border-success/30 text-[#b4ffb4]";
            icon = <CheckCircle2 className="h-4 w-4 text-success" />;
            accentClass = "border-success/40";
            glowClass = "shadow-[0_0_20px_rgba(57,255,20,0.15)]";
          } else if (t.type === "error") {
            bgClass = "bg-[#250d0a]/90 border-danger/30 text-[#ffb4b4]";
            icon = <XCircle className="h-4 w-4 text-danger" />;
            accentClass = "border-danger/40";
            glowClass = "shadow-[0_0_20px_rgba(255,61,0,0.15)]";
          } else if (t.type === "warning") {
            bgClass = "bg-[#25250a]/90 border-warning/30 text-[#fffbb4]";
            icon = <AlertTriangle className="h-4 w-4 text-warning" />;
            accentClass = "border-warning/40";
            glowClass = "shadow-[0_0_20px_rgba(204,255,0,0.15)]";
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border ${bgClass} ${accentClass} ${glowClass} backdrop-blur-md transition-all duration-300 animate-[fadeInUp_0.2s_ease-out]`}
              style={{
                animation: "fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <div className="flex-shrink-0 mt-0.5">{icon}</div>
              <div className="flex-1 text-xs leading-relaxed font-semibold break-words">
                {t.message}
              </div>
              <button
                onClick={() => dismissToast(t.id)}
                className="flex-shrink-0 text-text-dim hover:text-text p-0.5 rounded transition-colors"
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
