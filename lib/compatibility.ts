import { relate, relateBranches } from "@/lib/calendar";
import type { Bilingual, BirthComputation, CompatibilityReport } from "@/lib/types";

const BRANCH_TEXT: Record<string, Bilingual> = {
  same: { zh: "日支相同", en: "The day branches match" },
  combine: { zh: "日支六合", en: "The day branches form a six-combination" },
  triple: { zh: "日支三合", en: "The day branches share a triple combination" },
  clash: { zh: "日支相冲", en: "The day branches clash" },
  harm: { zh: "日支相害", en: "The day branches harm each other" },
  punish: { zh: "日支相刑", en: "The day branches punish each other" },
  none: { zh: "日支无合冲", en: "The day branches are neutral" },
};

export function compareCharts(self: BirthComputation, other: BirthComputation): CompatibilityReport {
  const a = self.bazi;
  const b = other.bazi;
  let score = 52;
  const points: Bilingual[] = [];
  const stemRelation = relate(a.dayMasterElement, b.dayMasterElement);
  if (stemRelation === "generate" || stemRelation === "generated") {
    score += 12;
    points.push({ zh: "日主五行相生", en: "The day masters generate each other" });
  } else if (stemRelation === "same") {
    score += 6;
    points.push({ zh: "日主同气", en: "The day masters share an element" });
  } else {
    score -= 10;
    points.push({ zh: "日主五行相克", en: "The day masters control each other" });
  }
  const dayBranch = relateBranches(a.pillars[2]!.branch, b.pillars[2]!.branch);
  score += branchScore(dayBranch);
  const yearBranch = relateBranches(a.pillars[0]!.branch, b.pillars[0]!.branch);
  score += Math.round(branchScore(yearBranch) / 2);
  if (b.favorable.includes(a.dayMasterElement) || a.favorable.includes(b.dayMasterElement)) {
    score += 10;
    points.push({ zh: "一方日主落到另一方喜用", en: "One day master lands in the other's useful elements" });
  }
  const selfSpouse = self.ziwei.palaces.find((palace) => palace.name === "夫妻");
  const otherLife = other.ziwei.palaces.find((palace) => palace.name === "命宫");
  const spouseStars = selfSpouse?.major.map((star) => star.name) ?? [];
  const lifeStars = otherLife?.major.map((star) => star.name) ?? [];
  const shared = spouseStars.filter((name) => lifeStars.includes(name));
  if (shared.length) {
    score += 6;
    points.push({ zh: `夫妻宫与对方命宫同见${shared.join("、")}`, en: `Spouse palace and their life palace share ${shared.join(", ")}` });
  }
  if (selfSpouse?.major.some((star) => star.mutagen === "忌") || selfSpouse?.minor.some((star) => star.mutagen === "忌")) {
    score -= 6;
    points.push({ zh: "本命夫妻宫带化忌", en: "The natal spouse palace carries a taboo transformation" });
  }
  const bounded = Math.max(8, Math.min(96, score));
  const label = bounded >= 72 ? "harmonious" : bounded >= 60 ? "complementary" : bounded >= 46 ? "neutral" : "tense";
  const yearText = BRANCH_TEXT[yearBranch] ?? BRANCH_TEXT.none!;
  return {
    score: bounded,
    label,
    dayStem: {
      zh: `日主${a.dayMaster}${a.dayMasterElement}与${b.dayMaster}${b.dayMasterElement}`,
      en: `Day masters ${a.dayMasterElement} and ${b.dayMasterElement}`,
    },
    dayBranch: BRANCH_TEXT[dayBranch] ?? BRANCH_TEXT.none!,
    yearBranch: { zh: yearText.zh.replace("日支", "年支"), en: yearText.en.replace("day", "year") },
    elementFit: points.find((item) => item.zh.includes("喜用")) ?? {
      zh: "喜用神未见明显互补",
      en: "The useful elements do not obviously complement each other",
    },
    ziwei: points.find((item) => item.zh.includes("宫")) ?? {
      zh: "命宫与夫妻宫没有同星",
      en: "Life and spouse palaces do not share a major star",
    },
    points,
  };
}

function branchScore(relation: string): number {
  switch (relation) {
    case "combine":
      return 18;
    case "triple":
      return 12;
    case "same":
      return 4;
    case "clash":
      return -18;
    case "harm":
    case "punish":
      return -10;
    default:
      return 0;
  }
}
