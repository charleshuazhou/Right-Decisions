import { describe, expect, it } from "vitest";

import { computeBazi, elementScores, judgeStrength } from "@/lib/bazi";
import { solarFromLunar } from "@/lib/calendar";

const now = { year: 2026, month: 10, day: 30, hour: 12, minute: 0 };

describe("八字", () => {
  it("matches the published lunar-javascript pillars for 2005-12-23 08:37", () => {
    const chart = computeBazi({ year: 2005, month: 12, day: 23, hour: 8, minute: 37 }, "male", now);
    expect(chart.pillars.map((pillar) => pillar.ganZhi).join(" ")).toBe("乙酉 戊子 辛巳 壬辰");
    expect(chart.dayMaster).toBe("辛");
    expect(chart.dayMasterElement).toBe("金");
    expect(chart.pillars[1]?.naYin).toBe("霹雳火");
    expect(chart.direction).toBe("backward");
  });

  it("uses 立春, not lunar new year, for the year and month pillars", () => {
    const before = computeBazi({ year: 2024, month: 2, day: 4, hour: 10, minute: 0 }, "female", now);
    const after = computeBazi({ year: 2024, month: 2, day: 4, hour: 22, minute: 0 }, "female", now);
    expect(before.pillars.map((pillar) => pillar.ganZhi).join(" ")).toBe("癸卯 乙丑 戊戌 丁巳");
    expect(after.pillars.map((pillar) => pillar.ganZhi).join(" ")).toBe("甲辰 丙寅 戊戌 癸亥");
  });

  it("moves the day pillar at 23:00, in line with 晚子时", () => {
    const late = computeBazi({ year: 1990, month: 1, day: 1, hour: 23, minute: 0 }, "male", now);
    expect(late.pillars.map((pillar) => pillar.ganZhi).join(" ")).toBe("己巳 丙子 丁卯 庚子");
  });

  it("matches the published female luck-cycle start for 1981-01-29 23:37 under the late-zi day rule", () => {
    const chart = computeBazi({ year: 1981, month: 1, day: 29, hour: 23, minute: 37 }, "female", now);
    expect(chart.pillars[2]?.ganZhi).toBe("戊申");
    expect(chart.pillars[3]?.ganZhi).toBe("壬子");
    expect(chart.startSolar).toBe("1989-02-18");
  });

  it("converts lunar 2000-07-17 to solar 2000-08-16", () => {
    expect(solarFromLunar(2000, 7, 17, false)).toEqual({ year: 2000, month: 8, day: 16 });
  });

  it("judges a wood-heavy chart as strong and a metal-pressed chart as weak", () => {
    const strong = judgeStrength(
      "木",
      elementScores([
        { stem: "甲", branch: "寅" },
        { stem: "甲", branch: "寅" },
        { stem: "甲", branch: "寅" },
        { stem: "甲", branch: "子" },
      ]),
    );
    expect(strong.strength).toBe("strong");
    expect(strong.yongShen).toBe("金");

    const weak = judgeStrength(
      "木",
      elementScores([
        { stem: "庚", branch: "申" },
        { stem: "庚", branch: "申" },
        { stem: "甲", branch: "午" },
        { stem: "庚", branch: "申" },
      ]),
    );
    expect(weak.strength).toBe("weak");
    expect(weak.yongShen).toBe("水");
  });
});
