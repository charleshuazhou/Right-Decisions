import { Lunar, Solar } from "lunar-javascript";

import type { CalendarKind, CivilDateTime, Element } from "@/lib/types";

export const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
export const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
export const ELEMENTS: Element[] = ["木", "火", "土", "金", "水"];

const STEM_ELEMENT: Record<string, Element> = {
  甲: "木",
  乙: "木",
  丙: "火",
  丁: "火",
  戊: "土",
  己: "土",
  庚: "金",
  辛: "金",
  壬: "水",
  癸: "水",
};

const BRANCH_ELEMENT: Record<string, Element> = {
  寅: "木",
  卯: "木",
  巳: "火",
  午: "火",
  辰: "土",
  戌: "土",
  丑: "土",
  未: "土",
  申: "金",
  酉: "金",
  亥: "水",
  子: "水",
};

const GENERATES: Record<Element, Element> = {
  木: "火",
  火: "土",
  土: "金",
  金: "水",
  水: "木",
};

const CONTROLS: Record<Element, Element> = {
  木: "土",
  土: "水",
  水: "火",
  火: "金",
  金: "木",
};

export function stemElement(stem: string): Element {
  const element = STEM_ELEMENT[stem];
  if (!element) throw new Error(`Unknown stem ${stem}`);
  return element;
}

export function branchElement(branch: string): Element {
  const element = BRANCH_ELEMENT[branch];
  if (!element) throw new Error(`Unknown branch ${branch}`);
  return element;
}

export function generates(element: Element): Element {
  return GENERATES[element];
}

export function controls(element: Element): Element {
  return CONTROLS[element];
}

export function resourceOf(element: Element): Element {
  return ELEMENTS.find((item) => generates(item) === element) ?? element;
}

export function controlledBy(element: Element): Element {
  return ELEMENTS.find((item) => controls(item) === element) ?? element;
}

export type ElementRelation = "same" | "generate" | "generated" | "control" | "controlled";

export function relate(from: Element, to: Element): ElementRelation {
  if (from === to) return "same";
  if (generates(from) === to) return "generate";
  if (generates(to) === from) return "generated";
  if (controls(from) === to) return "control";
  return "controlled";
}

export function shiftGanZhi(ganZhi: string, delta: number): string {
  const stem = STEMS.indexOf(ganZhi[0] as (typeof STEMS)[number]);
  const branch = BRANCHES.indexOf(ganZhi[1] as (typeof BRANCHES)[number]);
  if (stem < 0 || branch < 0) throw new Error(`Bad ganZhi ${ganZhi}`);
  return STEMS[(stem + delta + 100) % 10] + BRANCHES[(branch + delta + 120) % 12];
}

export function branchIndex(branch: string): number {
  return BRANCHES.indexOf(branch as (typeof BRANCHES)[number]);
}

/** 子1 … 亥12, the count used by 梅花易数. */
export function branchNumber(branch: string): number {
  const index = branchIndex(branch);
  if (index < 0) throw new Error(`Unknown branch ${branch}`);
  return index + 1;
}

export type HourInfo = {
  branch: string;
  ziweiIndex: number;
  name: string;
};

export function hourInfo(hour: number): HourInfo {
  if (hour === 23) return { branch: "子", ziweiIndex: 12, name: "晚子" };
  if (hour === 0) return { branch: "子", ziweiIndex: 0, name: "早子" };
  const index = Math.floor((hour + 1) / 2);
  const branch = BRANCHES[index] ?? "子";
  return { branch, ziweiIndex: index, name: `${branch}时` };
}

export const SHICHEN: { name: string; hour: number; minute: number }[] = [
  { name: "早子", hour: 0, minute: 30 },
  { name: "丑", hour: 2, minute: 0 },
  { name: "寅", hour: 4, minute: 0 },
  { name: "卯", hour: 6, minute: 0 },
  { name: "辰", hour: 8, minute: 0 },
  { name: "巳", hour: 10, minute: 0 },
  { name: "午", hour: 12, minute: 0 },
  { name: "未", hour: 14, minute: 0 },
  { name: "申", hour: 16, minute: 0 },
  { name: "酉", hour: 18, minute: 0 },
  { name: "戌", hour: 20, minute: 0 },
  { name: "亥", hour: 22, minute: 0 },
  { name: "晚子", hour: 23, minute: 30 },
];

const CLASH: Record<string, string> = {
  子: "午",
  午: "子",
  丑: "未",
  未: "丑",
  寅: "申",
  申: "寅",
  卯: "酉",
  酉: "卯",
  辰: "戌",
  戌: "辰",
  巳: "亥",
  亥: "巳",
};

const COMBINE: Record<string, string> = {
  子: "丑",
  丑: "子",
  寅: "亥",
  亥: "寅",
  卯: "戌",
  戌: "卯",
  辰: "酉",
  酉: "辰",
  巳: "申",
  申: "巳",
  午: "未",
  未: "午",
};

const HARM: Record<string, string> = {
  子: "未",
  未: "子",
  丑: "午",
  午: "丑",
  寅: "巳",
  巳: "寅",
  卯: "辰",
  辰: "卯",
  申: "亥",
  亥: "申",
  酉: "戌",
  戌: "酉",
};

const TRIPLE = ["申子辰", "寅午戌", "巳酉丑", "亥卯未"];

export type BranchRelation = "same" | "combine" | "triple" | "clash" | "harm" | "punish" | "none";

export function relateBranches(a: string, b: string): BranchRelation {
  if (a === b) {
    if ("辰午酉亥".includes(a)) return "punish";
    return "same";
  }
  if (COMBINE[a] === b) return "combine";
  if (TRIPLE.some((group) => group.includes(a) && group.includes(b))) return "triple";
  if (CLASH[a] === b) return "clash";
  if (HARM[a] === b) return "harm";
  const punishment = ["寅巳申", "丑戌未"];
  if (punishment.some((group) => group.includes(a) && group.includes(b))) return "punish";
  if ((a === "子" && b === "卯") || (a === "卯" && b === "子")) return "punish";
  return "none";
}

export function clashes(a: string, b: string): boolean {
  return CLASH[a] === b;
}

/** NOAA approximation of the equation of time, in minutes. */
export function equationOfTimeMinutes(year: number, month: number, day: number): number {
  const start = Date.UTC(year, 0, 0);
  const dayOfYear = Math.round((Date.UTC(year, month - 1, day) - start) / 86400000);
  const gamma = (2 * Math.PI * (dayOfYear - 1)) / 365;
  return (
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma))
  );
}

export function timeZoneOffsetMinutes(timeZone: string, instant: Date): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(instant).map((part) => [part.type, part.value]),
  );
  const hour = Number(parts.hour) % 24;
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    hour,
    Number(parts.minute),
    Number(parts.second),
  );
  return Math.round((asUtc - instant.getTime()) / 60000);
}

export function civilToUtc(timeZone: string, civil: CivilDateTime): Date {
  let utc = Date.UTC(civil.year, civil.month - 1, civil.day, civil.hour, civil.minute, 0);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const offset = timeZoneOffsetMinutes(timeZone, new Date(utc));
    const next = Date.UTC(civil.year, civil.month - 1, civil.day, civil.hour, civil.minute, 0) - offset * 60000;
    if (next === utc) break;
    utc = next;
  }
  return new Date(utc);
}

export function zonedParts(instant: Date, timeZone: string): CivilDateTime {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(instant).map((part) => [part.type, part.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
  };
}

export type TrueSolarResult = CivilDateTime & { correctionMinutes: number };

/**
 * True solar time at a longitude, expressed as civil clock time in `timeZone`.
 * Correction = (longitude − timezone meridian) × 4 minutes + equation of time.
 * The meridian follows the offset actually in effect, including daylight saving.
 */
export function trueSolarTime(
  civil: CivilDateTime,
  longitude: number,
  timeZone: string,
): TrueSolarResult {
  const utc = civilToUtc(timeZone, civil);
  const offset = timeZoneOffsetMinutes(timeZone, utc);
  const meridian = (offset / 60) * 15;
  const correction = (longitude - meridian) * 4 + equationOfTimeMinutes(civil.year, civil.month, civil.day);
  const adjusted = zonedParts(new Date(utc.getTime() + correction * 60000), timeZone);
  return { ...adjusted, correctionMinutes: Math.round(correction * 10) / 10 };
}

export function addDays(year: number, month: number, day: number, days: number): { year: number; month: number; day: number } {
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

export function formatCivil(value: CivilDateTime): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.year}-${pad(value.month)}-${pad(value.day)} ${pad(value.hour)}:${pad(value.minute)}`;
}

export function lunarLabel(civil: CivilDateTime): string {
  return Solar.fromYmdHms(civil.year, civil.month, civil.day, civil.hour, civil.minute, 0).getLunar().toString();
}

export function solarFromLunar(year: number, month: number, day: number, leap: boolean): { year: number; month: number; day: number } {
  const lunar = Lunar.fromYmd(year, leap ? -month : month, day);
  const [y, m, d] = lunar.getSolar().toYmd().split("-").map(Number);
  if (!y || !m || !d) throw new Error("invalid-date");
  return { year: y, month: m, day: d };
}

export function nominalSolar(input: {
  calendar: CalendarKind;
  leapMonth: boolean;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}): CivilDateTime {
  const date =
    input.calendar === "lunar"
      ? solarFromLunar(input.year, input.month, input.day, input.leapMonth)
      : { year: input.year, month: input.month, day: input.day };
  return { ...date, hour: input.hour, minute: input.minute };
}

export function nowInTimeZone(timeZone: string, instant: Date): CivilDateTime {
  return zonedParts(instant, timeZone);
}

export function travelHorse(branch: string): string {
  if ("申子辰".includes(branch)) return "寅";
  if ("寅午戌".includes(branch)) return "申";
  if ("巳酉丑".includes(branch)) return "亥";
  return "巳";
}
