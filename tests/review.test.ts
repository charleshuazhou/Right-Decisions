import { describe, expect, it } from "vitest";

import { judgeLean, methodAccuracy } from "@/lib/review";
import type { ReadingRecord } from "@/lib/types";

describe("复盘", () => {
  it("counts a matching lean as a hit and a mixed outcome as unclear", () => {
    expect(judgeLean("support", "favorable")).toBe("hit");
    expect(judgeLean("caution", "unfavorable")).toBe("hit");
    expect(judgeLean("support", "unfavorable")).toBe("miss");
    expect(judgeLean("mixed", "favorable")).toBe("unclear");
    const stats = methodAccuracy([
      {
        outcome: { result: "favorable", note: "", recordedAt: "" },
        computed: { leans: [{ method: "iching", lean: "support", reasonZh: "", reasonEn: "" }] },
      } as ReadingRecord,
    ]);
    expect(stats.iching.hit).toBe(1);
  });
});
