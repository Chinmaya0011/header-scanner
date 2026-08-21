"use client";

import { useRef } from "react";
import Script from "next/script";
import Link from "next/link";
import { ShieldCheck, BookOpen, ArrowLeft, ExternalLink, Code } from "lucide-react";

export default function SwaggerClient() {
  const containerRef = useRef(null);

  const initSwagger = () => {
    if (window.SwaggerUIBundle && containerRef.current) {
      window.SwaggerUIBundle({
        url: "/openapi.json",
        dom_id: "#swagger-ui-container",
        deepLinking: true,
        presets: [
          window.SwaggerUIBundle.presets.apis,
          window.SwaggerUIBundle.SwaggerUIStandalonePreset || window.SwaggerUIStandalonePreset
        ].filter(Boolean),
        layout: "BaseLayout",
        docExpansion: "list",
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        displayRequestDuration: true,
        persistAuthorization: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">
      {/* Top Header Bar */}
      <header className="bg-[#161b22] border-b border-[#30363d] py-3.5 px-4 sm:px-6 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/docs"
              className="p-1.5 rounded-lg bg-[#21262d] border border-[#30363d] text-gray-300 hover:text-white hover:bg-[#30363d] transition-all"
              title="Back to Docs"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-blue-400" />
              <span className="font-bold text-base tracking-wide text-white">HeaderGuard</span>
              <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono font-semibold">
                Swagger UI 3.1.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/openapi.json"
              target="_blank"
              className="text-xs font-mono text-gray-400 hover:text-blue-400 flex items-center gap-1 transition-colors"
            >
              <Code className="h-3.5 w-3.5" /> openapi.json <ExternalLink className="h-3 w-3" />
            </Link>
            <Link
              href="/redoc"
              className="text-xs font-medium bg-[#21262d] hover:bg-[#30363d] text-gray-200 border border-[#30363d] px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
            >
              <BookOpen className="h-3.5 w-3.5 text-blue-400" /> Redoc View
            </Link>
          </div>
        </div>
      </header>

      {/* External Swagger CSS */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.18.2/swagger-ui.css"
      />

      {/* Embedded Custom Theme Adjustments for Dark Mode Compatibility */}
      <style jsx global>{`
        .swagger-ui-custom-wrap {
          background-color: #0d1117;
          color: #c9d1d9;
          font-family: inherit;
        }
        .swagger-ui {
          font-family: inherit !important;
        }
        .swagger-ui .topbar {
          display: none !important;
        }
        .swagger-ui .wrapper {
          max-width: 1280px !important;
          padding: 20px 24px !important;
        }
        .swagger-ui .info {
          margin: 20px 0 !important;
        }
        .swagger-ui .info .title {
          color: #f0f6fc !important;
          font-weight: 700 !important;
        }
        .swagger-ui .info p, .swagger-ui .info li, .swagger-ui .info table {
          color: #8b949e !important;
        }
        .swagger-ui .scheme-container {
          background: #161b22 !important;
          border: 1px solid #30363d !important;
          border-radius: 12px !important;
          box-shadow: none !important;
          padding: 16px !important;
          margin-bottom: 24px !important;
        }
        .swagger-ui .opblock-tag {
          color: #58a6ff !important;
          border-bottom: 1px solid #30363d !important;
          font-size: 18px !important;
          padding: 12px 0 !important;
        }
        .swagger-ui .opblock {
          border-radius: 10px !important;
          box-shadow: none !important;
          border: 1px solid #30363d !important;
          background: #161b22 !important;
          margin-bottom: 12px !important;
        }
        .swagger-ui .opblock .opblock-summary {
          border-bottom: 1px solid transparent !important;
          padding: 10px 16px !important;
        }
        .swagger-ui .opblock .opblock-summary-path {
          color: #f0f6fc !important;
          font-family: monospace !important;
          font-size: 14px !important;
        }
        .swagger-ui .opblock .opblock-summary-description {
          color: #8b949e !important;
          font-size: 13px !important;
        }
        .swagger-ui .opblock-body {
          background: #0d1117 !important;
          padding: 16px !important;
        }
        .swagger-ui table thead tr th, .swagger-ui table thead tr td {
          color: #c9d1d9 !important;
          border-bottom: 1px solid #30363d !important;
        }
        .swagger-ui .parameter__name {
          color: #58a6ff !important;
        }
        .swagger-ui .parameter__type {
          color: #79c0ff !important;
        }
        .swagger-ui input[type=text], .swagger-ui textarea, .swagger-ui select {
          background: #0d1117 !important;
          border: 1px solid #30363d !important;
          color: #f0f6fc !important;
          border-radius: 6px !important;
        }
        .swagger-ui .btn {
          border-radius: 6px !important;
          font-weight: 600 !important;
          border: 1px solid #30363d !important;
        }
        .swagger-ui .btn.authorize {
          color: #3fb950 !important;
          border-color: #2ea043 !important;
          background: rgba(46, 160, 67, 0.15) !important;
        }
        .swagger-ui .btn.execute {
          background-color: #238636 !important;
          color: #ffffff !important;
          border-color: #2ea043 !important;
        }
        .swagger-ui section.models {
          border: 1px solid #30363d !important;
          border-radius: 12px !important;
          background: #161b22 !important;
        }
        .swagger-ui section.models h4 {
          color: #f0f6fc !important;
          border-bottom: 1px solid #30363d !important;
        }
        .swagger-ui .model-box {
          background: #0d1117 !important;
          border-radius: 6px !important;
        }
      `}</style>

      {/* Main Swagger UI Container */}
      <main className="flex-1 swagger-ui-custom-wrap">
        <div ref={containerRef} id="swagger-ui-container"></div>
      </main>

      {/* Scripts */}
      <Script
        src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.18.2/swagger-ui-bundle.js"
        strategy="afterInteractive"
        onLoad={initSwagger}
        onReady={initSwagger}
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.18.2/swagger-ui-standalone-preset.js"
        strategy="afterInteractive"
      />
    </div>
  );
}
