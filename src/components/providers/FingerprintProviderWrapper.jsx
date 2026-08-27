"use client";

import React from "react";
import { FingerprintProvider } from "@fingerprint/react";
let mypersonal_key = "1okskjj77729mmsl";
const FINGERPRINT_PUBLIC_KEY = process.env.NEXT_PUBLIC_FINGERPRINT_PUBLIC_KEY || "1JQORojs6DaX5hEWd0an";
const FINGERPRINT_REGION = process.env.NEXT_PUBLIC_FINGERPRINT_REGION || "ap";

export default function FingerprintProviderWrapper({ children }) {
  return (
    <FingerprintProvider
      apiKey={FINGERPRINT_PUBLIC_KEY}
      region={FINGERPRINT_REGION}
    >
      {children}
    </FingerprintProvider>
  );
}
