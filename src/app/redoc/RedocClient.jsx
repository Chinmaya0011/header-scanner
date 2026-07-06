"use client";

import { useRef } from "react";
import Script from "next/script";

export default function RedocClient() {
  const containerRef = useRef(null);

  const initRedoc = () => {
    if (window.Redoc && containerRef.current) {
      window.Redoc.init(
        "/openapi.yaml",
        {
          scrollYOffset: 50,
          hideDownloadButton: false,
          theme: { colors: { primary: { main: '#3b82f6' } } }
        },
        containerRef.current
      );
    }
  };

  return (
    <div style={{ margin: 0, padding: 0, minHeight: '100vh', backgroundColor: '#fff' }}>
      <Script 
        src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js" 
        strategy="afterInteractive"
        onLoad={initRedoc}
        onReady={initRedoc}
      />
      <div ref={containerRef} id="redoc-container"></div>
    </div>
  );
}
