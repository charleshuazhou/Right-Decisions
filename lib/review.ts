import type { Lean, MethodId, ReadingRecord } from "@/lib/types";

export type AccuracyBucket = { hit: number; miss: number; unclear: number };

export function judgeLean(lean: Lean, outcome: "favorable" | "mixed" | "unfavorable"): keyof AccuracyBucket {
  if (lean === "mixed" || outcome === "mixed") return "unclear";
  if (lean === "support" && outcome === "favorable") return "hit";
  if (lean === "caution" && outcome === "unfavorable") return "hit";
  return "miss";
}

export function methodAccuracy(records: ReadingRecord[]): Record<MethodId, AccuracyBucket> {
  const stats: Record<MethodId, AccuracyBucket> = {
    iching: { hit: 0, miss: 0, unclear: 0 },
    ziwei: { hit: 0, miss: 0, unclear: 0 },
    bazi: { hit: 0, miss: 0, unclear: 0 },
    meihua: { hit: 0, miss: 0, unclear: 0 },
    qimen: { hit: 0, miss: 0, unclear: 0 },
  };
  for (const record of records) {
    if (!record.outcome) continue;
    for (const lean of record.computed.leans) {
      stats[lean.method][judgeLean(lean.lean, record.outcome.result)] += 1;
    }
  }
  return stats;
}

export function pendingReminders(records: ReadingRecord[], today: Date): ReadingRecord[] {
  const stamp = today.toISOString().slice(0, 10);
  return records.filter((record) => !record.outcome && Boolean(record.reminderOn) && record.reminderOn! <= stamp);
}
