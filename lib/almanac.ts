import { Solar } from "lunar-javascript";

import { addDays, clashes, hourInfo, stemElement } from "@/lib/calendar";
import type { ActivityId, AuspiciousDate, BaziChart, Bilingual, CivilDateTime } from "@/lib/types";

const TERMS: Record<ActivityId, string[]> = {
  sign: ["订盟", "交易", "立券", "纳财", "开市", "订婚"],
  move: ["移徙", "入宅", "安床"],
  open: ["开市", "交易", "挂匾", "纳财", "开业"],
  travel: ["出行", "移徙"],
  meet: ["会友", "订盟", "交易", "会亲友"],
  general: ["祈福", "纳财", "祭祀", "求财"],
};

const GOOD_XING = new Set(["成", "开", "满"]);
const BAD_XING = new Set(["破", "闭", "收"]);

export function activityTerms(activity: ActivityId): string[] {
  return TERMS[activity];
}

export function recommendDates(
  start: CivilDateTime,
  activity: ActivityId,
  bazi: BaziChart,
  days = 45,
  limit = 6,
): AuspiciousDate[] {
  const terms = TERMS[activity];
  const yearBranch = bazi.pillars[0]?.branch ?? "";
  const dayBranch = bazi.pillars[2]?.branch ?? "";
  const found: AuspiciousDate[] = [];
  for (let offset = 1; offset <= days; offset += 1) {
    const date = addDays(start.year, start.month, start.day, offset);
    const lunar = Solar.fromYmdHms(date.year, date.month, date.day, 12, 0, 0).getLunar();
    const eight = lunar.getEightChar();
    eight.setSect(1);
    const ganZhi = eight.getDay();
    const yi = lunar.getDayYi();
    const ji = lunar.getDayJi();
    const reasons: Bilingual[] = [];
    let score = 0;
    const hit = terms.filter((term) => yi.includes(term));
    const blocked = terms.filter((term) => ji.includes(term));
    if (hit.length) {
      score += 4;
      reasons.push({ zh: `宜${hit.join("、")}`, en: `Almanac favors ${hit.join(", ")}` });
    }
    if (blocked.length) {
      score -= 5;
      reasons.push({ zh: `忌${blocked.join("、")}`, en: `Almanac avoids ${blocked.join(", ")}` });
    }
    const stemEl = stemElement(ganZhi[0] ?? "");
    if (bazi.favorable.includes(stemEl)) {
      score += 2;
      reasons.push({ zh: `日干${ganZhi[0]}属${stemEl}，合喜用`, en: `Day stem ${stemEl} matches the useful elements` });
    } else if (bazi.unfavorable.includes(stemEl)) {
      score -= 2;
      reasons.push({ zh: `日干${ganZhi[0]}属${stemEl}，触忌神`, en: `Day stem ${stemEl} is among the unfavorable elements` });
    }
    if (clashes(ganZhi[1] ?? "", yearBranch) || clashes(ganZhi[1] ?? "", dayBranch)) {
      score -= 3;
      reasons.push({ zh: "日支与命主年支或日支相冲", en: "The day branch clashes the natal year or day" });
    }
    const xing = lunar.getZhiXing();
    if (GOOD_XING.has(xing)) score += 1;
    if (BAD_XING.has(xing)) score -= 1;
    const hours = lunar
      .getTimes()
      .filter((time) => terms.some((term) => time.getYi().includes(term)))
      .slice(0, 3)
      .map((time) => hourInfo(branchToHour(time.getZhi())).name.replace("时", "") || time.getZhi());
    if (score >= 3) {
      found.push({
        year: date.year,
        month: date.month,
        day: date.day,
        ganZhi,
        lunarText: lunar.toString(),
        yi,
        ji,
        zhiXing: xing,
        score,
        reasons,
        hours: hours.map((hour) => (hour.endsWith("时") ? hour : `${hour}时`)),
      });
    }
  }
  return found.sort((a, b) => b.score - a.score || a.year - b.year || a.month - b.month || a.day - b.day).slice(0, limit);
}

function branchToHour(branch: string): number {
  const map: Record<string, number> = {
    子: 0,
    丑: 2,
    寅: 4,
    卯: 6,
    辰: 8,
    巳: 10,
    午: 12,
    未: 14,
    申: 16,
    酉: 18,
    戌: 20,
    亥: 22,
  };
  return map[branch] ?? 0;
}

export function dayAlmanac(when: CivilDateTime) {
  const lunar = Solar.fromYmdHms(when.year, when.month, when.day, when.hour, when.minute, 0).getLunar();
  return {
    yi: lunar.getDayYi(),
    ji: lunar.getDayJi(),
    zhiXing: lunar.getZhiXing(),
    chong: lunar.getDayChong(),
    xi: lunar.getDayPositionXi(),
    cai: lunar.getDayPositionCai(),
    fu: lunar.getDayPositionFu(),
    pengzu: `${lunar.getPengZuGan()} ${lunar.getPengZuZhi()}`,
    lunarText: lunar.toString(),
    ganZhi: lunar.getDayInGanZhi(),
  };
}
