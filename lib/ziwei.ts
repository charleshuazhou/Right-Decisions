import { astro } from "iztro";

import type { CivilDateTime, Gender, PalaceBrief, StarBrief, ZiweiChart } from "@/lib/types";
import { hourInfo } from "@/lib/calendar";

const AUSPICIOUS_MAJOR = new Set(["紫微", "天府", "太阳", "太阴", "天同", "天梁", "天相"]);
const AUSPICIOUS_MINOR = new Set(["左辅", "右弼", "文昌", "文曲", "天魁", "天钺", "禄存"]);
const SHA = new Set(["擎羊", "陀罗", "火星", "铃星", "地空", "地劫"]);

function starBrief(star: { name: string; brightness?: string; mutagen?: string }): StarBrief {
  return {
    name: star.name,
    brightness: star.brightness ?? "",
    mutagen: star.mutagen ?? "",
  };
}

export function computeZiwei(birth: CivilDateTime, gender: Gender, now: CivilDateTime): ZiweiChart {
  const index = hourInfo(birth.hour).ziweiIndex;
  const chart = astro.bySolar(
    `${birth.year}-${birth.month}-${birth.day}`,
    index,
    gender === "male" ? "男" : "女",
    true,
    "zh-CN",
  );
  const horoscope = chart.horoscope(`${now.year}-${now.month}-${now.day}`, hourInfo(now.hour).ziweiIndex);
  const palaces: PalaceBrief[] = chart.palaces.map((palace) => ({
    name: palace.name,
    stem: palace.heavenlyStem,
    branch: palace.earthlyBranch,
    isBody: palace.isBodyPalace,
    isSoul: palace.name === "命宫",
    major: palace.majorStars.map(starBrief),
    minor: palace.minorStars.map(starBrief),
    decadal: palace.decadal?.range ?? null,
  }));
  const natalMutagen = palaces.flatMap((palace) =>
    [...palace.major, ...palace.minor]
      .filter((star) => star.mutagen)
      .map((star) => ({ star: star.name, mutagen: star.mutagen, palace: palace.name })),
  );
  const decadalPalace = chart.palaces[horoscope.decadal.index];
  const yearlyPalace = chart.palaces[horoscope.yearly.index];
  return {
    fiveElementsClass: chart.fiveElementsClass,
    soul: chart.soul,
    body: chart.body,
    soulBranch: chart.earthlyBranchOfSoulPalace,
    bodyBranch: chart.earthlyBranchOfBodyPalace,
    chineseDate: chart.chineseDate,
    palaces,
    natalMutagen,
    decadal: {
      stem: horoscope.decadal.heavenlyStem,
      branch: horoscope.decadal.earthlyBranch,
      palace: decadalPalace?.name ?? "",
      range: decadalPalace?.decadal.range ?? null,
    },
    yearly: {
      stem: horoscope.yearly.heavenlyStem,
      branch: horoscope.yearly.earthlyBranch,
      palace: yearlyPalace?.name ?? "",
      mutagen: [...horoscope.yearly.mutagen],
    },
    monthly: {
      stem: horoscope.monthly.heavenlyStem,
      branch: horoscope.monthly.earthlyBranch,
    },
  };
}

export function scorePalaces(chart: ZiweiChart, names: string[]): number {
  const focus = chart.palaces.filter((palace) => names.includes(palace.name));
  let score = 0;
  for (const palace of focus) {
    for (const star of palace.major) {
      if (AUSPICIOUS_MAJOR.has(star.name)) score += 2;
      if (star.mutagen === "禄") score += 2;
      if (star.mutagen === "权" || star.mutagen === "科") score += 1;
      if (star.mutagen === "忌") score -= 2;
    }
    for (const star of palace.minor) {
      if (AUSPICIOUS_MINOR.has(star.name)) score += 1;
      if (SHA.has(star.name)) score -= 1;
      if (star.mutagen === "忌") score -= 2;
    }
  }
  return score;
}

export function leanFromScore(score: number): "support" | "caution" | "mixed" {
  if (score >= 2) return "support";
  if (score <= -1) return "caution";
  return "mixed";
}
