import type { ComputedReading, Locale, PracticalFactors, StructuredReading } from "@/lib/types";

export function buildPrompt(input: {
  question: string;
  options: string[];
  practical: PracticalFactors;
  computed: ComputedReading;
  language: Locale;
  name: string;
}): { system: string; user: string } {
  const facts = summarizeFacts(input);
  const system = [
    "You are a careful advisor who can read 易经, 紫微斗数, 八字, 梅花易数 and 奇门遁甲.",
    "Combine the symbolism with ordinary decision sense. Do not claim fate is fixed, and do not give financial, medical, or legal instructions.",
    "Answer in the language requested. Use the chart facts you are given; do not invent different pillars, stars, or hexagrams.",
    "Return only JSON with keys: verdictTitle, summary, optionReadings (array of {option, lean, comment}, lean is support|caution|mixed), risks (string array), timing, directions, nextSteps (string array), crossCheck, practical, compatibility.",
  ].join(" ");
  const user = [
    `Reply in ${input.language === "zh" ? "Simplified Chinese" : "English"}.`,
    `Person: ${input.name}`,
    `Question: ${input.question}`,
    `Options: ${input.options.join(" | ") || "(none)"}`,
    `Category: ${input.computed.category}`,
    `Budget: ${input.practical.budget || "(blank)"}`,
    `Deadline: ${input.practical.deadline || "(blank)"}`,
    `Risk tolerance: ${input.practical.risk}`,
    `Gut: ${input.practical.gut}. ${input.practical.gutNote}`,
    facts,
  ].join("\n");
  return { system, user };
}

function summarizeFacts(input: { computed: ComputedReading }): string {
  const birth = input.computed.birth;
  const bazi = birth.bazi;
  const parts = [
    `八字 ${bazi.pillars.map((item) => item.ganZhi).join(" ")}`,
    `日主${bazi.dayMaster}${bazi.dayMasterElement} ${bazi.strength}`,
    `喜用 ${bazi.favorable.join("")} 忌 ${bazi.unfavorable.join("")}`,
    `大运 ${bazi.daYun.filter((item) => item.current).map((item) => item.ganZhi).join("") || "未入大运"}`,
    `流年 ${bazi.flowYear} 流月 ${bazi.flowMonth}`,
    `紫微 ${birth.ziwei.fiveElementsClass} 命宫${birth.ziwei.soulBranch} 身宫${birth.ziwei.bodyBranch} 大限${birth.ziwei.decadal.palace}`,
    `问事地 ${input.computed.place} 当地 ${input.computed.askedAt.year}-${input.computed.askedAt.month}-${input.computed.askedAt.day} ${input.computed.askedAt.hour}:${input.computed.askedAt.minute}`,
    `方位 ${input.computed.fengshui.directions.join("")} 色 ${input.computed.fengshui.colors.join("")}`,
  ];
  if (birth.name?.grids) {
    parts.push(
      `姓名 ${birth.name.surname}${birth.name.givenName} 五格 ${birth.name.grids.map((grid) => `${grid.key}${grid.value}${grid.element}`).join(" ")} ${birth.name.note}`,
    );
  }
  if (input.computed.iching) {
    const cast = input.computed.iching;
    parts.push(
      `易经 ${cast.primary.name} 动${cast.changingLines.join(",") || "无"} 之${cast.resulting.name} 卦辞 ${cast.primary.judgment}`,
    );
  }
  if (input.computed.meihua) {
    parts.push(`梅花 ${input.computed.meihua.primary.name} 动${input.computed.meihua.moving} 体${input.computed.meihua.bodyTrigram}用${input.computed.meihua.useTrigram} ${input.computed.meihua.lean}`);
  }
  if (input.computed.qimen) {
    parts.push(`奇门 ${input.computed.qimen.ju} 用神${input.computed.qimen.focusLabel} ${input.computed.qimen.lean}`);
  }
  if (input.computed.compatibility) {
    parts.push(`合盘 ${input.computed.compatibility.score} ${input.computed.compatibility.points.map((item) => item.zh).join("；")}`);
  }
  parts.push(`择日 ${input.computed.dates.slice(0, 3).map((item) => `${item.month}/${item.day}${item.ganZhi}`).join(" ")}`);
  parts.push(`方法倾向 ${input.computed.leans.map((item) => `${item.method}:${item.lean}`).join(" ")}`);
  return parts.join("\n");
}

export function parseReadingJson(raw: string): Omit<StructuredReading, "mode" | "providerNote"> | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const data = JSON.parse(raw.slice(start, end + 1)) as Partial<StructuredReading>;
    if (typeof data.summary !== "string" || typeof data.verdictTitle !== "string") return null;
    return {
      verdictTitle: data.verdictTitle,
      summary: data.summary,
      optionReadings: Array.isArray(data.optionReadings) ? data.optionReadings : [],
      risks: Array.isArray(data.risks) ? data.risks.map(String) : [],
      timing: String(data.timing ?? ""),
      directions: String(data.directions ?? ""),
      nextSteps: Array.isArray(data.nextSteps) ? data.nextSteps.map(String) : [],
      crossCheck: String(data.crossCheck ?? ""),
      practical: String(data.practical ?? ""),
      compatibility: String(data.compatibility ?? ""),
    };
  } catch {
    return null;
  }
}
