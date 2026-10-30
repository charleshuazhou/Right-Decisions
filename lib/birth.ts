import { computeBazi } from "@/lib/bazi";
import { formatCivil, hourInfo, lunarLabel, nominalSolar, trueSolarTime } from "@/lib/calendar";
import { analyzeName } from "@/lib/name";
import type { BirthComputation, BirthProfile, CivilDateTime } from "@/lib/types";
import { computeZiwei } from "@/lib/ziwei";

export function displayName(profile: BirthProfile): string {
  const chinese = `${profile.surname}${profile.givenName}`.trim();
  if (chinese && profile.englishName.trim()) return `${chinese} / ${profile.englishName.trim()}`;
  return chinese || profile.englishName.trim() || "未具名";
}

export function cityLabel(city: BirthProfile["currentCity"], locale: "zh" | "en" = "zh"): string {
  if (locale === "en") {
    return [city.name, city.admin, city.countryName].filter(Boolean).join(", ");
  }
  return [city.nameZh || city.name, city.adminZh || city.admin, city.countryNameZh || city.countryName]
    .filter(Boolean)
    .join(" · ");
}

export function computeBirth(profile: BirthProfile, now: CivilDateTime): BirthComputation {
  const nominal = nominalSolar(profile);
  const corrected = profile.useTrueSolarTime
    ? trueSolarTime(nominal, profile.birthCity.longitude, profile.birthCity.timeZone)
    : { ...nominal, correctionMinutes: 0 };
  const hour = hourInfo(corrected.hour);
  const bazi = computeBazi(corrected, profile.gender, now);
  const ziwei = computeZiwei(corrected, profile.gender, now);
  const name = analyzeName(profile.surname, profile.givenName, profile.strokeOverrides, bazi.favorable);
  return {
    inputCalendar: profile.calendar,
    nominal,
    corrected,
    lunarText: lunarLabel(corrected),
    trueSolarApplied: profile.useTrueSolarTime,
    correctionMinutes: corrected.correctionMinutes,
    hourName: hour.name,
    hourBranch: hour.branch,
    ziweiTimeIndex: hour.ziweiIndex,
    bazi,
    ziwei,
    name,
  };
}

export function birthSummary(birth: BirthComputation): string {
  const pillars = birth.bazi.pillars.map((pillar) => pillar.ganZhi).join(" ");
  return `${formatCivil(birth.corrected)} ${birth.hourName} ${pillars} 日主${birth.bazi.dayMaster}`;
}
