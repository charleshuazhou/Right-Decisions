import { calculate } from "qimendunjia-standalone";

import type { CategoryId, CivilDateTime, Lean, QimenChart, QimenPalace } from "@/lib/types";

const DIRECTION: Record<string, string> = {
  "1": "北",
  "2": "西南",
  "3": "东",
  "4": "东南",
  "5": "中",
  "6": "西北",
  "7": "西",
  "8": "东北",
  "9": "南",
};

const ORDER = ["4", "9", "2", "3", "5", "7", "8", "1", "6"];

const AUSPICIOUS_GATES = new Set(["开门", "休门", "生门"]);
const HARSH_GATES = new Set(["死门", "惊门", "伤门"]);
const AUSPICIOUS_GODS = new Set(["值符", "九天", "六合", "太阴"]);
const HARSH_GODS = new Set(["白虎", "玄武", "腾蛇"]);

const FOCUS: Record<CategoryId, { field: "gate" | "god" | "star"; name: string }> = {
  career: { field: "gate", name: "开门" },
  investment: { field: "gate", name: "生门" },
  relationship: { field: "god", name: "六合" },
  property: { field: "gate", name: "生门" },
  health: { field: "star", name: "天心" },
  travel: { field: "gate", name: "景门" },
  general: { field: "god", name: "值符" },
};

export function computeQimen(when: CivilDateTime, category: CategoryId): QimenChart {
  const chart = calculate(new Date(when.year, when.month - 1, when.day, when.hour, when.minute, 0));
  if ("error" in chart) throw new Error(chart.message);
  const palaces: QimenPalace[] = ORDER.map((palace) => {
    const key = palace as keyof typeof chart.raw.diPan;
    return {
      palace,
      direction: DIRECTION[palace] ?? "",
      diPan: chart.raw.diPan[key] ?? "",
      tianPan: chart.raw.tianPan[key] ?? "",
      star: chart.raw.jiuXing[key] ?? "",
      gate: chart.raw.baMen[key] ?? "",
      god: chart.raw.baShen[key] ?? "",
    };
  });
  const focus = FOCUS[category];
  const found =
    palaces.find((palace) => palace[focus.field].includes(focus.name)) ??
    palaces.find((palace) => palace.god.includes("值符")) ??
    palaces[4]!;
  let score = 0;
  if (AUSPICIOUS_GATES.has(found.gate)) score += 2;
  if (HARSH_GATES.has(found.gate)) score -= 2;
  if (AUSPICIOUS_GODS.has(found.god)) score += 1;
  if (HARSH_GODS.has(found.god)) score -= 1;
  if (found.star.includes("天心") || found.star.includes("天辅") || found.star.includes("天禽")) score += 1;
  const lean: Lean = score >= 2 ? "support" : score <= -1 ? "caution" : "mixed";
  return {
    ju: chart.raw.juShu.fullName,
    dun: chart.raw.juShu.type,
    yuan: chart.raw.juShu.yuan,
    zhiFu: chart.info.fu.replace("值符：", ""),
    zhiShi: chart.info.shi.replace("值使：", ""),
    kong: chart.info.kong,
    xunShou: chart.info.xunshou,
    solarTerm: chart.raw.juShu.jieQiName,
    fourPillars: `${chart.info.siZhu.year} ${chart.info.siZhu.month} ${chart.info.siZhu.day} ${chart.info.siZhu.time}`,
    palaces,
    focusLabel: focus.name,
    focusPalace: found.palace,
    lean,
  };
}
