import { recommendDates } from "@/lib/almanac";
import { computeBirth, cityLabel } from "@/lib/birth";
import { flowElementRelation } from "@/lib/bazi";
import { compareCharts } from "@/lib/compatibility";
import { fengshuiFor } from "@/lib/fengshui";
import type { IchingCast } from "@/lib/types";
import { castMeihua } from "@/lib/meihua";
import { computeQimen } from "@/lib/qimen";
import type {
  ActivityId,
  BirthProfile,
  CategoryId,
  ComputedReading,
  Lean,
  MethodId,
  MethodLean,
} from "@/lib/types";
import { assertNever } from "@/lib/types";
import { leanFromScore, scorePalaces } from "@/lib/ziwei";
import { nowInTimeZone } from "@/lib/calendar";

const PALACES: Record<CategoryId, string[]> = {
  general: ["命宫", "福德"],
  career: ["官禄", "命宫"],
  investment: ["财帛", "福德"],
  relationship: ["夫妻", "命宫"],
  property: ["田宅", "财帛"],
  health: ["疾厄", "命宫"],
  travel: ["迁移", "命宫"],
};

const ACTIVITY: Record<CategoryId, ActivityId> = {
  general: "general",
  career: "sign",
  investment: "sign",
  relationship: "meet",
  property: "move",
  health: "general",
  travel: "travel",
};

export function categoryActivity(category: CategoryId): ActivityId {
  return ACTIVITY[category];
}

export function categoryPalaces(category: CategoryId): string[] {
  return PALACES[category];
}

export function detectLanguage(text: string): "zh" | "en" {
  const cjk = text.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  const latin = text.match(/[A-Za-z]/g)?.length ?? 0;
  if (cjk === 0) return "en";
  if (latin === 0) return "zh";
  return cjk >= latin ? "zh" : "en";
}

function ichingLean(cast: IchingCast): Lean {
  if (cast.changingLines.length === 0) return cast.primary.tone;
  if (cast.primary.tone === cast.resulting.tone) return cast.primary.tone;
  if (cast.primary.tone === "mixed") return cast.resulting.tone;
  if (cast.resulting.tone === "mixed") return "mixed";
  return "mixed";
}

export function buildLeans(computed: Omit<ComputedReading, "leans">, methods: MethodId[]): MethodLean[] {
  const leans: MethodLean[] = [];
  for (const method of methods) {
    switch (method) {
      case "iching": {
        if (!computed.iching) break;
        const lean = ichingLean(computed.iching);
        leans.push({
          method,
          lean,
          reasonZh: `本卦${computed.iching.primary.name}，之卦${computed.iching.resulting.name}`,
          reasonEn: `${computed.iching.primary.english} changing toward ${computed.iching.resulting.english}`,
        });
        break;
      }
      case "ziwei": {
        const score = scorePalaces(computed.birth.ziwei, PALACES[computed.category]);
        leans.push({
          method,
          lean: leanFromScore(score),
          reasonZh: `${PALACES[computed.category].join("、")}的星情计 ${score}`,
          reasonEn: `Focused palaces score ${score}`,
        });
        break;
      }
      case "bazi": {
        const lean = flowElementRelation(
          computed.birth.bazi.flowYear,
          computed.birth.bazi.favorable,
          computed.birth.bazi.unfavorable,
        );
        leans.push({
          method,
          lean,
          reasonZh: `流年${computed.birth.bazi.flowYear}，喜用${computed.birth.bazi.favorable.join("、")}`,
          reasonEn: `Annual pillar ${computed.birth.bazi.flowYear}; useful elements ${computed.birth.bazi.favorable.join(", ")}`,
        });
        break;
      }
      case "meihua": {
        if (!computed.meihua) break;
        leans.push({
          method,
          lean: computed.meihua.lean,
          reasonZh: `体${computed.meihua.bodyTrigram}用${computed.meihua.useTrigram}`,
          reasonEn: `Body ${computed.meihua.bodyTrigram}, use ${computed.meihua.useTrigram}`,
        });
        break;
      }
      case "qimen": {
        if (!computed.qimen) break;
        leans.push({
          method,
          lean: computed.qimen.lean,
          reasonZh: `${computed.qimen.ju}，用神${computed.qimen.focusLabel}在${computed.qimen.focusPalace}宫`,
          reasonEn: `${computed.qimen.ju}; focus ${computed.qimen.focusLabel} in palace ${computed.qimen.focusPalace}`,
        });
        break;
      }
      default:
        assertNever(method);
    }
  }
  return leans;
}

export function computeReading(input: {
  profile: BirthProfile;
  counterpart: BirthProfile | null;
  category: CategoryId;
  methods: MethodId[];
  iching: IchingCast | null;
  now?: Date;
}): ComputedReading {
  const timeZone = input.profile.currentCity.timeZone;
  const askedAt = nowInTimeZone(timeZone, input.now ?? new Date());
  const birth = computeBirth(input.profile, askedAt);
  const counterpart = input.counterpart ? computeBirth(input.counterpart, askedAt) : null;
  const meihua = input.methods.includes("meihua") ? castMeihua(askedAt) : null;
  const qimen = input.methods.includes("qimen") ? computeQimen(askedAt, input.category) : null;
  const place = cityLabel(input.profile.currentCity, "zh");
  const partial = {
    askedAt,
    timeZone,
    place,
    category: input.category,
    activity: categoryActivity(input.category),
    birth,
    counterpart,
    iching: input.methods.includes("iching") ? input.iching : null,
    meihua,
    qimen,
    fengshui: fengshuiFor(birth.bazi, askedAt, place),
    dates: recommendDates(askedAt, categoryActivity(input.category), birth.bazi),
    compatibility: counterpart ? compareCharts(birth, counterpart) : null,
  };
  return { ...partial, leans: buildLeans(partial, input.methods) };
}
