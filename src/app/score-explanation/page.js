import { Suspense } from "react";
import ScoreExplanationClient from "./ScoreExplanationClient";
import Loading from "@/components/common/Loading";

import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Security Grade & Score Explanations | HeaderGuard",
  description:
    "Learn how we calculate website threat profile indices. Outlines weighting matrices for HTTP response headers, certificate compliance, and DNS zones.",
  url: "/score-explanation",
  keywords: [
    "grading criteria",
    "risk scoring weights",
    "csp evaluation standards",
    "header compliance metric info",
  ],
});

export default function ScoreExplanationPage() {
  return (
    <Suspense fallback={<Loading message="LOADING EXPLANATION METRICS" />}>
      <ScoreExplanationClient />
    </Suspense>
  );
}
