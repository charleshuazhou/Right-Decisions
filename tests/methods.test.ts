import { describe, expect, it } from "vitest";

import { dayAlmanac } from "@/lib/almanac";
import { relateBranches, trueSolarTime, equationOfTimeMinutes, hourInfo } from "@/lib/calendar";
import { castMeihua, meihuaFromCounts } from "@/lib/meihua";
import { computeQimen } from "@/lib/qimen";

describe("真太阳时", () => {
  it("approximates the equation of time", () => {
    expect(equationOfTimeMinutes(2024, 2, 11)).toBeGreaterThan(-16);
    expect(equationOfTimeMinutes(2024, 2, 11)).toBeLessThan(-12);
    expect(equationOfTimeMinutes(2024, 11, 3)).toBeGreaterThan(14);
    expect(equationOfTimeMinutes(2024, 11, 3)).toBeLessThan(18);
  });

  it("moves a Chengdu birth across the 时辰 boundary", () => {
    const winter = trueSolarTime(
      { year: 2000, month: 1, day: 15, hour: 3, minute: 0 },
      104.0667,
      "Asia/Shanghai",
    );
    expect(winter.day).toBe(15);
    expect(hourInfo(3).branch).toBe("寅");
    expect(hourInfo(winter.hour).branch).toBe("丑");

    // June 1990 was still on China daylight time (UTC+9), so the same clock
    // correction crosses midnight into the previous day's late zi hour.
    const summer = trueSolarTime(
      { year: 1990, month: 6, day: 15, hour: 1, minute: 10 },
      104.0667,
      "Asia/Shanghai",
    );
    expect(summer.day).toBe(14);
    expect(summer.hour).toBe(23);
    expect(hourInfo(summer.hour).branch).toBe("子");
    expect(summer.correctionMinutes).toBeLessThan(-110);
  });

  it("applies daylight saving when the clock meridian shifts", () => {
    const summer = trueSolarTime(
      { year: 1990, month: 7, day: 15, hour: 12, minute: 0 },
      -123.1207,
      "America/Vancouver",
    );
    expect(summer.hour).toBeLessThan(12);
    expect(hourInfo(summer.hour).branch).toBe("巳");
    const winter = trueSolarTime(
      { year: 1990, month: 1, day: 15, hour: 12, minute: 0 },
      -123.1207,
      "America/Vancouver",
    );
    expect(hourInfo(winter.hour).branch).toBe("午");
  });
});

describe("梅花易数", () => {
  it("follows the time method for lunar 2000-07-17 at yin hour", () => {
    const result = castMeihua({ year: 2000, month: 8, day: 16, hour: 4, minute: 0 });
    expect(result.upper).toBe("巽");
    expect(result.lower).toBe("坤");
    expect(result.moving).toBe(2);
    expect(result.primary.name).toBe("观");
    expect(result.useTrigram).toBe("坤");
    expect(result.bodyTrigram).toBe("巽");
    expect(result.lean).toBe("support");
    expect(meihuaFromCounts(29, 32).primary.number).toBe(result.primary.number);
  });
});

describe("奇门与黄历", () => {
  it("matches the published summer-solstice chart", () => {
    const chart = computeQimen({ year: 2026, month: 6, day: 22, hour: 3, minute: 0 }, "career");
    expect(chart.ju).toContain("阴遁九局");
    expect(chart.zhiFu).toBe("天心");
    expect(chart.zhiShi).toBe("开门");
    expect(chart.palaces).toHaveLength(9);
    expect(chart.focusLabel).toBe("开门");
  });

  it("reads 宜忌 for a fixed day", () => {
    const day = dayAlmanac({ year: 2026, month: 10, day: 30, hour: 9, minute: 0 });
    expect(day.yi).toContain("祭祀");
    expect(day.ji).toEqual(expect.arrayContaining(["嫁娶", "开市"]));
    expect(day.ganZhi).toBe("丁丑");
  });

  it("knows the six clashes", () => {
    expect(relateBranches("子", "午")).toBe("clash");
    expect(relateBranches("子", "丑")).toBe("combine");
  });
});
