import type { DuplicateCandidate } from "./types";

export function computeOverlapPct(candidate: DuplicateCandidate): number {
  if (candidate.type === "exact_duplicate") return 100;
  if (candidate.type === "functional_overlap_faiss" && typeof candidate.similarity === "number") {
    return Math.max(0, Math.min(100, Math.round(candidate.similarity * 100)));
  }
  if (candidate.type === "capability_overlap") return 75;
  return 0;
}

