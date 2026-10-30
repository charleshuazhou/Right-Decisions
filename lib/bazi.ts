import { Solar } from "lunar-javascript";

import {
  branchElement,
  controlledBy,
  controls,
  generates,
  relate,
  resourceOf,
  shiftGanZhi,
  stemElement,
} from "@/lib/calendar";
import type { BaziChart, CivilDateTime, Element, Gender, LuckPillar, Pillar } from "@/lib/types";

const HIDDEN: Record<string, { stem: string; weight: number }[]> = {
  子: [{ stem: "癸", weight: 1 }],
  丑: [
    { stem: "己", weight: 0.6 },
    { stem: "癸", weight: 0.3 },
    { stem: "辛", weight: 0.1 },
  ],
  寅: [
    { stem: "甲", weight: 0.6 },
    { stem: "丙", weight: 0.3 },
    { stem: "戊", weight: 0.1 },
  ],
  卯: [{ stem: "乙", weight: 1 }],
  辰: [
    { stem: "戊", weight: 0.6 },
    { stem: "乙", weight: 0.3 },
    { stem: "癸", weight: 0.1 },
  ],
  巳: [
    { stem: "丙", weight: 0.6 },
    { stem: "庚", weight: 0.3 },
    { stem: "戊", weight: 0.1 },
  ],
  午: [
    { stem: "丁", weight: 0.7 },
    { stem: "己", weight: 0.3 },
  ],
  未: [
    { stem: "己", weight: 0.6 },
    { stem: "丁", weight: 0.3 },
    { stem: "乙", weight: 0.1 },
  ],
  申: [
    { stem: "庚", weight: 0.6 },
    { stem: "壬", weight: 0.3 },
    { stem: "戊", weight: 0.1 },
  ],
  酉: [{ stem: "辛", weight: 1 }],
  戌: [
    { stem: "戊", weight: 0.6 },
    { stem: "辛", weight: 0.3 },
    { stem: "丁", weight: 0.1 },
  ],
  亥: [
    { stem: "壬", weight: 0.7 },
    { stem: "甲", weight: 0.3 },
  ],
};

const SEASONAL: Record<string, Element | null> = {
  亥: "火",
  子: "火",
  丑: "火",
  巳: "水",
  午: "水",
  未: "水",
  寅: null,
  卯: null,
  辰: null,
  申: null,
  酉: null,
  戌: null,
};

function emptyScores(): Record<Element, number> {
  return { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
}

export function elementScores(pillars: { stem: string; branch: string }[]): Record<Element, number> {
  const scores = emptyScores();
  pillars.forEach((pillar, index) => {
    const stemWeight = index === 1 ? 1.5 : 1;
    scores[stemElement(pillar.stem)] += stemWeight;
    const branchWeight = index === 1 ? 1.6 : 1;
    for (const hidden of HIDDEN[pillar.branch] ?? []) {
      scores[stemElement(hidden.stem)] += hidden.weight * branchWeight;
    }
  });
  for (const element of Object.keys(scores) as Element[]) {
    scores[element] = Math.round(scores[element] * 100) / 100;
  }
  return scores;
}

export function judgeStrength(dayMaster: Element, scores: Record<Element, number>): {
  strength: "strong" | "weak";
  favorable: Element[];
  unfavorable: Element[];
  yongShen: Element;
  xiShen: Element;
} {
  const support = scores[dayMaster] + scores[resourceOf(dayMaster)];
  const drain = scores[generates(dayMaster)] + scores[controls(dayMaster)] + scores[controlledBy(dayMaster)];
  const strength = support >= drain ? "strong" : "weak";
  if (strength === "weak") {
    const favorable = [resourceOf(dayMaster), dayMaster];
    const unfavorable = [generates(dayMaster), controls(dayMaster), controlledBy(dayMaster)];
    return { strength, favorable, unfavorable, yongShen: favorable[0]!, xiShen: favorable[1]! };
  }
  const favorable = [controlledBy(dayMaster), generates(dayMaster), controls(dayMaster)];
  const unfavorable = [resourceOf(dayMaster), dayMaster];
  return { strength, favorable, unfavorable, yongShen: favorable[0]!, xiShen: favorable[1]! };
}

function splitHide(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function computeBazi(birth: CivilDateTime, gender: Gender, now: CivilDateTime): BaziChart {
  const eight = Solar.fromYmdHms(birth.year, birth.month, birth.day, birth.hour, birth.minute, 0).getLunar().getEightChar();
  // Sect 1: 23:00 starts the next day's day pillar, matching iztro 晚子时.
  eight.setSect(1);
  const raw = [
    { key: "year" as const, ganZhi: eight.getYear(), tenGod: eight.getYearShiShenGan(), naYin: eight.getYearNaYin(), hide: eight.getYearHideGan() },
    { key: "month" as const, ganZhi: eight.getMonth(), tenGod: eight.getMonthShiShenGan(), naYin: eight.getMonthNaYin(), hide: eight.getMonthHideGan() },
    { key: "day" as const, ganZhi: eight.getDay(), tenGod: eight.getDayShiShenGan(), naYin: eight.getDayNaYin(), hide: eight.getDayHideGan() },
    { key: "hour" as const, ganZhi: eight.getTime(), tenGod: eight.getTimeShiShenGan(), naYin: eight.getTimeNaYin(), hide: eight.getTimeHideGan() },
  ];
  const pillars: Pillar[] = raw.map((item) => ({
    key: item.key,
    ganZhi: item.ganZhi,
    stem: item.ganZhi[0] ?? "",
    branch: item.ganZhi[1] ?? "",
    stemElement: stemElement(item.ganZhi[0] ?? ""),
    branchElement: branchElement(item.ganZhi[1] ?? ""),
    tenGod: item.tenGod,
    naYin: item.naYin,
    hideStems: splitHide(String(item.hide)),
  }));
  const day = pillars[2]!;
  const month = pillars[1]!;
  const scores = elementScores(pillars);
  const judged = judgeStrength(day.stemElement, scores);
  const seasonal = SEASONAL[month.branch] ?? null;
  const yun = eight.getYun(gender === "male" ? 1 : 0);
  const currentYear = now.year;
  const daYun: LuckPillar[] = yun.getDaYun().flatMap((item) => {
    const ganZhi = item.getGanZhi();
    if (!ganZhi) return [];
    const startYear = item.getStartYear();
    const endYear = item.getEndYear();
    return [
      {
        ganZhi,
        startYear,
        endYear,
        startAge: item.getStartAge(),
        endAge: item.getEndAge(),
        current: currentYear >= startYear && currentYear <= endYear,
      },
    ];
  });
  const first = daYun[0];
  const direction = first && first.ganZhi === shiftGanZhi(month.ganZhi, 1) ? "forward" : "backward";
  const flow = Solar.fromYmdHms(now.year, now.month, now.day, now.hour, now.minute, 0).getLunar().getEightChar();
  flow.setSect(1);
  return {
    pillars,
    dayMaster: day.stem,
    dayMasterElement: day.stemElement,
    strength: judged.strength,
    scores,
    favorable: judged.favorable,
    unfavorable: judged.unfavorable,
    seasonal,
    yongShen: judged.yongShen,
    xiShen: judged.xiShen,
    daYun,
    startYears: yun.getStartYear(),
    startMonths: yun.getStartMonth(),
    startDays: yun.getStartDay(),
    startSolar: yun.getStartSolar().toYmd(),
    direction,
    flowYear: flow.getYear(),
    flowMonth: flow.getMonth(),
    flowDay: flow.getDay(),
    flowHour: flow.getTime(),
    spouseElement: gender === "male" ? controls(day.stemElement) : controlledBy(day.stemElement),
  };
}

export function flowElementRelation(flowGanZhi: string, favorable: Element[], unfavorable: Element[]): "support" | "caution" | "mixed" {
  const element = stemElement(flowGanZhi[0] ?? "");
  if (favorable.includes(element)) return "support";
  if (unfavorable.includes(element)) return "caution";
  return "mixed";
}

export function elementRelationLabel(from: Element, to: Element): string {
  const relation = relate(from, to);
  switch (relation) {
    case "same":
      return "比和";
    case "generate":
      return "生";
    case "generated":
      return "被生";
    case "control":
      return "克";
    case "controlled":
      return "被克";
    default: {
      const _never: never = relation;
      return _never;
    }
  }
}
