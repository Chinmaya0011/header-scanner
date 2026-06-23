"use client";

import React from "react";
import Loading from "@/components/common/Loading";

export default function RootLoading() {
  return <Loading message="ESTABLISHING CLIENT CONNECTION..." fullScreen={true} />;
}