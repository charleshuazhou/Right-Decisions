import { describe, expect, it } from "vitest";

import { computeZiwei } from "@/lib/ziwei";

describe("紫微斗数", () => {
  it("matches iztro's published chart for 2000-08-16, yin hour, female", () => {
    const chart = computeZiwei(
      { year: 2000, month: 8, day: 16, hour: 4, minute: 0 },
      "female",
      { year: 2026, month: 10, day: 30, hour: 12, minute: 0 },
    );
    expect(chart.fiveElementsClass).toBe("木三局");
    expect(chart.soulBranch).toBe("午");
    expect(chart.bodyBranch).toBe("戌");
    expect(chart.chineseDate).toBe("庚辰 甲申 丙午 庚寅");
    const life = chart.palaces.find((palace) => palace.name === "命宫");
    expect(life?.major.map((star) => star.name)).toEqual(["紫微"]);
    expect(life?.minor.map((star) => star.name)).toContain("文曲");
    expect(chart.natalMutagen).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ star: "太阳", mutagen: "禄" }),
        expect.objectContaining({ star: "武曲", mutagen: "权" }),
        expect.objectContaining({ star: "太阴", mutagen: "科" }),
        expect.objectContaining({ star: "天同", mutagen: "忌" }),
      ]),
    );
    expect(chart.decadal.palace).toBe("夫妻");
    expect(chart.yearly.stem + chart.yearly.branch).toBe("丙午");
    expect(chart.palaces.filter((palace) => palace.major.length || palace.minor.length).length).toBeGreaterThan(8);
  });

  it("treats 23:00 as the next day's early zi, same as iztro", () => {
    const late = computeZiwei(
      { year: 1990, month: 1, day: 1, hour: 23, minute: 30 },
      "male",
      { year: 2026, month: 6, day: 1, hour: 12, minute: 0 },
    );
    const next = computeZiwei(
      { year: 1990, month: 1, day: 2, hour: 0, minute: 30 },
      "male",
      { year: 2026, month: 6, day: 1, hour: 12, minute: 0 },
    );
    expect(late.soulBranch).toBe(next.soulBranch);
    expect(late.fiveElementsClass).toBe(next.fiveElementsClass);
    expect(late.chineseDate).toBe(next.chineseDate);
  });
});
