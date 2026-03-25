import type { DuplicateCandidate, MockServiceRow } from "./types";

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function formatINR(value: number): string {
  const n = Number(value || 0);
  return n.toLocaleString("en-IN");
}

export function buildMockServices(dupCandidates: DuplicateCandidate[] | undefined): MockServiceRow[] {
  const names = new Set<string>();

  (dupCandidates || []).slice(0, 60).forEach((c) => {
    if (c.service_a) names.add(c.service_a);
    if (c.service_b) names.add(c.service_b);
  });

  // If duplicates are empty (early stage), provide a stable set
  if (names.size === 0) {
    ["Slack", "Microsoft Teams", "Zoom", "Notion", "Jira", "GitHub", "Salesforce", "Zendesk"].forEach((n) =>
      names.add(n),
    );
  }

  return Array.from(names)
    .slice(0, 10)
    .map((name) => {
      const h = hashString(name);

      // Deterministic but "enterprise-looking" ranges
      const monthlyCost = 120000 + (h % 900000); // mock INR-ish
      const activeUsers = 20 + (h % 180);
      const usagePct = Math.min(99, Math.max(5, 12 + (h % 80)));

      const status: MockServiceRow["status"] = usagePct < 50 ? "Underutilized" : "Active";
      return {
        name,
        monthlyCost,
        activeUsers,
        usagePct,
        status,
      };
    });
}

export function computeOverlapPct(candidate: DuplicateCandidate): number {
  if (candidate.type === "exact_duplicate") return 100;
  if (candidate.type === "functional_overlap_faiss" && typeof candidate.similarity === "number") {
    return Math.max(0, Math.min(100, Math.round(candidate.similarity * 100)));
  }
  if (candidate.type === "capability_overlap") return 75;
  return 0;
}

