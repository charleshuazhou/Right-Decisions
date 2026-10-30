import { describe, expect, it } from "vitest";

import { computeBirth } from "@/lib/birth";
import { SAMPLE_BIRTH_CITY, SAMPLE_CURRENT_CITY } from "@/lib/cities";
import { computeReading } from "@/lib/reading";
import type { BirthProfile } from "@/lib/types";

const profile: BirthProfile = {
  surname: "陈",
  givenName: "明",
  englishName: "Chen Ming",
  gender: "male",
  calendar: "solar",
  leapMonth: false,
  year: 1990,
  month: 8,
  day: 16,
  hour: 4,
  minute: 30,
  birthCity: SAMPLE_BIRTH_CITY,
  currentCity: SAMPLE_CURRENT_CITY,
  useTrueSolarTime: true,
  strokeOverrides: {},
};

describe("sample profile", () => {
  it("builds pillars, a twelve-palace chart, and the name grids together", () => {
    const birth = computeBirth(profile, { year: 2026, month: 10, day: 30, hour: 12, minute: 0 });
    expect(birth.bazi.pillars.map((pillar) => pillar.ganZhi)).toHaveLength(4);
    expect(birth.ziwei.palaces).toHaveLength(12);
    expect(birth.name?.characters.map((item) => item.traditional).join("")).toBe("陳明");
    expect(birth.name?.grids?.map((grid) => grid.value)).toEqual([17, 24, 9, 2, 24]);
    expect(birth.correctionMinutes).not.toBe(0);
    const reading = computeReading({
      profile,
      counterpart: null,
      category: "career",
      methods: ["ziwei", "bazi", "meihua", "qimen"],
      iching: null,
      now: new Date("2026-10-30T19:00:00Z"),
    });
    expect(reading.leans.map((item) => item.method)).toEqual(["ziwei", "bazi", "meihua", "qimen"]);
    expect(reading.qimen?.palaces).toHaveLength(9);
    expect(reading.fengshui.place).toContain("温哥华");
    expect(reading.dates.length).toBeGreaterThan(0);
  });
});
