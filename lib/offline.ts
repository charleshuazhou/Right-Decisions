import { formatCivil } from "@/lib/calendar";
import { categoryPalaces } from "@/lib/reading";
import type { ComputedReading, Lean, Locale, PracticalFactors, StructuredReading } from "@/lib/types";

const LEAN_ZH: Record<Lean, string> = { support: "偏可为", caution: "宜缓", mixed: "未一边倒" };
const LEAN_EN: Record<Lean, string> = { support: "leans toward yes", caution: "leans toward waiting", mixed: "is mixed" };

export function offlineReading(
  question: string,
  options: string[],
  practical: PracticalFactors,
  computed: ComputedReading,
  lang: Locale,
): StructuredReading {
  return lang === "zh"
    ? chineseReading(question, options, practical, computed)
    : englishReading(question, options, practical, computed);
}

function tally(computed: ComputedReading): { support: number; caution: number; mixed: number } {
  return computed.leans.reduce(
    (acc, item) => {
      acc[item.lean] += 1;
      return acc;
    },
    { support: 0, caution: 0, mixed: 0 },
  );
}

function verdict(computed: ComputedReading, lang: Locale): { title: string; lean: Lean } {
  const count = tally(computed);
  let lean: Lean = "mixed";
  if (count.support > count.caution && count.support >= count.mixed) lean = "support";
  else if (count.caution > count.support && count.caution >= count.mixed) lean = "caution";
  if (lang === "zh") {
    if (lean === "support") return { title: "可以往前走，但把条件写清楚", lean };
    if (lean === "caution") return { title: "先别拍板，阅读在劝你放慢", lean };
    return { title: "几种方法没有站到同一边", lean };
  }
  if (lean === "support") return { title: "You can move, once the conditions are explicit", lean };
  if (lean === "caution") return { title: "Don't decide yet — the reading asks you to slow down", lean };
  return { title: "The methods do not stand on the same side", lean };
}

function chineseReading(
  question: string,
  options: string[],
  practical: PracticalFactors,
  computed: ComputedReading,
): StructuredReading {
  const { title, lean } = verdict(computed, "zh");
  const bazi = computed.birth.bazi;
  const lines: string[] = [
    `这是一则未接入语言模型的整理，直接依据卦爻、命盘和历法，不代替你做决定。问题是：「${question}」。`,
    `日主${bazi.dayMaster}${bazi.dayMasterElement}，${bazi.strength === "strong" ? "身强" : "身弱"}，喜用${bazi.favorable.join("、")}，忌${bazi.unfavorable.join("、")}。流年${bazi.flowYear}，流月${bazi.flowMonth}。`,
  ];
  if (computed.iching) {
    const cast = computed.iching;
    lines.push(
      `易经得${cast.primary.symbol}${cast.primary.name}（${cast.primary.english}）。卦辞：${cast.primary.judgment}`,
    );
    if (cast.changingLines.length) {
      const texts = cast.changingLines.map((n) => `${cast.primary.lines[n - 1]?.name}：${cast.primary.lines[n - 1]?.text}`);
      lines.push(`动爻${cast.changingLines.join("、")}。${texts.join(" ")} 之卦为${cast.resulting.name}：${cast.resulting.judgment}`);
    } else {
      lines.push("六爻皆静，之卦不变，事情更像是维持现状。");
    }
  }
  const palaces = categoryPalaces(computed.category);
  const focus = computed.birth.ziwei.palaces.filter((palace) => palaces.includes(palace.name));
  lines.push(
    `紫微${computed.birth.ziwei.fiveElementsClass}，命宫在${computed.birth.ziwei.soulBranch}，身宫在${computed.birth.ziwei.bodyBranch}。此问看${palaces.join("、")}：${focus
      .map((palace) => `${palace.name}见${palace.major.map((star) => star.name).join("、") || "无主星"}`)
      .join("；")}。当前大限在${computed.birth.ziwei.decadal.palace}，流年${computed.birth.ziwei.yearly.stem}${computed.birth.ziwei.yearly.branch}。`,
  );
  if (computed.birth.name?.grids) {
    const person = computed.birth.name.grids.find((grid) => grid.key === "person");
    lines.push(
      `姓名人格${person?.value}（${person?.element}），与喜用${computed.birth.name.note === "assists" ? "相顺" : computed.birth.name.note === "conflicts" ? "不相顺" : "关系平常"}。`,
    );
  }
  const cross = computed.leans.map((item) => `${methodName(item.method)}：${LEAN_ZH[item.lean]}（${item.reasonZh}）`).join("；");
  return {
    mode: "offline",
    providerNote: "未配置 OPENAI_API_KEY 或 XAI_API_KEY，以下为离线整理，不是模型生成。",
    verdictTitle: title,
    summary: lines.join("\n\n"),
    optionReadings: optionComments(options, computed, "zh", lean),
    risks: risks(computed, "zh"),
    timing: timing(computed, "zh"),
    directions: directions(computed, "zh"),
    nextSteps: steps(computed, practical, "zh"),
    crossCheck: cross || "尚未选择可对照的方法。",
    practical: practicalText(practical, lean, "zh"),
    compatibility: computed.compatibility
      ? `合盘指数 ${computed.compatibility.score}。${computed.compatibility.points.map((item) => item.zh).join("；")}`
      : "",
  };
}

function englishReading(
  question: string,
  options: string[],
  practical: PracticalFactors,
  computed: ComputedReading,
): StructuredReading {
  const { title, lean } = verdict(computed, "en");
  const bazi = computed.birth.bazi;
  const lines = [
    `This is an offline reading built from the chart and the texts, because no language-model key is configured. It is not a substitute for the decision. Question: “${question}”.`,
    `Day master ${bazi.dayMaster} (${bazi.dayMasterElement}) is ${bazi.strength}. Useful elements: ${bazi.favorable.join(", ")}. Unfavorable: ${bazi.unfavorable.join(", ")}. Annual pillar ${bazi.flowYear}, month ${bazi.flowMonth}.`,
  ];
  if (computed.iching) {
    const cast = computed.iching;
    lines.push(`${cast.primary.symbol} ${cast.primary.name} ${cast.primary.pinyin}, ${cast.primary.english}. Judgment: ${cast.primary.judgment}`);
    if (cast.changingLines.length) {
      lines.push(
        `Changing lines ${cast.changingLines.join(", ")} move toward ${cast.resulting.name} (${cast.resulting.english}): ${cast.resulting.judgment}`,
      );
    } else {
      lines.push("No line changes, so the picture is the situation as it stands.");
    }
  }
  const palaces = categoryPalaces(computed.category);
  lines.push(
    `Zi Wei ${computed.birth.ziwei.fiveElementsClass}. Life palace at ${computed.birth.ziwei.soulBranch}, body palace at ${computed.birth.ziwei.bodyBranch}. This question looks at ${palaces.join(", ")}. Current decade is the ${computed.birth.ziwei.decadal.palace} palace.`,
  );
  const cross = computed.leans.map((item) => `${item.method}: ${LEAN_EN[item.lean]} (${item.reasonEn})`).join("; ");
  return {
    mode: "offline",
    providerNote: "No OPENAI_API_KEY or XAI_API_KEY is set. This is an offline reading, not a model response.",
    verdictTitle: title,
    summary: lines.join("\n\n"),
    optionReadings: optionComments(options, computed, "en", lean),
    risks: risks(computed, "en"),
    timing: timing(computed, "en"),
    directions: directions(computed, "en"),
    nextSteps: steps(computed, practical, "en"),
    crossCheck: cross || "No methods were selected to compare.",
    practical: practicalText(practical, lean, "en"),
    compatibility: computed.compatibility
      ? `Compatibility index ${computed.compatibility.score}. ${computed.compatibility.points.map((item) => item.en).join("; ")}`
      : "",
  };
}

function optionComments(options: string[], computed: ComputedReading, lang: Locale, overall: Lean) {
  if (options.length === 0) {
    return [
      {
        option: lang === "zh" ? "做 / 不做" : "Yes / no",
        lean: overall,
        comment:
          lang === "zh"
            ? computed.iching
              ? "本卦写现状，之卦写动了之后。若选项是维持原状，多对照本卦；若是改道，多对照之卦。"
              : "没有列出选项。把「维持」和「改变」分开写下来，再各自对照上面的倾向。"
            : computed.iching
              ? "The primary hexagram is the situation now; the resulting one is the move. Match staying put to the first, and changing course to the second."
              : "No options were listed. Write down staying and changing as two separate choices.",
      },
    ];
  }
  return options.map((option, index) => {
    const line = computed.iching?.primary.lines[index];
    const lean: Lean = index === 0 ? computed.iching?.primary.tone ?? overall : computed.iching?.resulting.tone ?? overall;
    const comment =
      lang === "zh"
        ? line
          ? `卦不点名。若把这一项对上第${index + 1}爻：${line.name}，${line.text}`
          : "卦和命盘都不替你排序。用同一套风险、期限和预算去量这一项，看它要的是守成还是改道。"
        : line
          ? `The oracle does not name it. If you line this option up with line ${index + 1}: ${line.text}`
          : "Neither the hexagram nor the chart ranks this for you. Measure it with the same budget, deadline, and risk.";
    return { option, lean, comment };
  });
}

function risks(computed: ComputedReading, lang: Locale): string[] {
  const items: string[] = [];
  if (computed.iching) {
    const harsh = computed.iching.primary.lines.filter((line) => /凶|吝|厉|悔/.test(line.text));
    if (harsh.length) {
      items.push(lang === "zh" ? `爻辞里直接写到的风险：${harsh.map((line) => line.text).join("；")}` : `Line texts that name trouble: ${harsh.map((line) => line.text).join("; ")}`);
    }
  }
  items.push(
    lang === "zh"
      ? `忌神为${computed.birth.bazi.unfavorable.join("、")}。流年或合作方若专走这几项，代价会放大。`
      : `Unfavorable elements: ${computed.birth.bazi.unfavorable.join(", ")}. A year or a partner that pushes only those will magnify the cost.`,
  );
  if (computed.qimen && computed.qimen.lean === "caution") {
    items.push(lang === "zh" ? `奇门用神落在偏紧的门星：${computed.qimen.focusLabel}。` : `The Qi Men focus sits in a tight position: ${computed.qimen.focusLabel}.`);
  }
  return items;
}

function timing(computed: ComputedReading, lang: Locale): string {
  const decade = computed.birth.ziwei.decadal;
  const dates = computed.dates.slice(0, 3).map((item) => `${item.month}/${item.day}`);
  if (lang === "zh") {
    return `大限在${decade.palace}（${decade.stem}${decade.branch}）。近月可留意的日子：${dates.join("、") || "未来一个半月没有同时避开冲日、又合宜的日期"}。问事时辰按${computed.place}的当地时间 ${formatCivil(computed.askedAt)}。`;
  }
  return `The current decade sits in ${decade.palace} (${decade.stem}${decade.branch}). Near-term dates worth a look: ${dates.join(", ") || "none in the next six weeks clear both the clash and the almanac"}. The question's hour uses local time in ${computed.place}: ${formatCivil(computed.askedAt)}.`;
}

function directions(computed: ComputedReading, lang: Locale): string {
  const feng = computed.fengshui;
  if (lang === "zh") {
    return `以${feng.place}为中心，用神${feng.yongShen}的有利方位是${feng.directions.join("、")}，颜色${feng.colors.join("、")}，数字${feng.numbers.join("、")}。少取${feng.avoidDirections.join("、")}与${feng.avoidColors.join("、")}。今日黄历喜神在${feng.dailyXi}，财神在${feng.dailyCai}。`;
  }
  return `From ${feng.place}, the useful element ${feng.yongShen} favors ${feng.directions.join(", ")}, colors ${feng.colors.join(", ")}, numbers ${feng.numbers.join(", ")}. Go lightly on ${feng.avoidDirections.join(", ")}. Today's auspicious direction is ${feng.dailyXi}; wealth direction ${feng.dailyCai}.`;
}

function steps(computed: ComputedReading, practical: PracticalFactors, lang: Locale): string[] {
  if (lang === "zh") {
    return [
      "把每个选项写成：要花的钱、最晚决定日、做不成时损失什么。",
      computed.dates[0] ? `若必须挑日子，先看 ${computed.dates[0].month}月${computed.dates[0].day}日（${computed.dates[0].ganZhi}）。` : "近期没有特别干净的日子，就把决定拆成可退出的一小步。",
      practical.risk === "low" ? "你把风险承受设得很低，所以任何「大致可行」都还要留退路。" : "给最坏情况一个你真的扛得住的上限，再决定要不要动。",
    ];
  }
  return [
    "Write each option as money, a latest decision date, and what you lose if it fails.",
    computed.dates[0]
      ? `If you need a date, start with ${computed.dates[0].year}-${computed.dates[0].month}-${computed.dates[0].day} (${computed.dates[0].ganZhi}).`
      : "No especially clean date showed up; make the next step reversible.",
    practical.risk === "low"
      ? "You set risk tolerance low, so even a favorable reading still needs an exit."
      : "Name the worst case you can actually carry, then decide whether to move.",
  ];
}

function practicalText(practical: PracticalFactors, lean: Lean, lang: Locale): string {
  const gut = practical.gut === "yes" ? (lang === "zh" ? "你心里偏向要做" : "your gut leans yes") : practical.gut === "no" ? (lang === "zh" ? "你心里偏向不做" : "your gut leans no") : lang === "zh" ? "你还没有明显的直觉" : "you do not have a clear gut feeling";
  const tension =
    (lean === "caution" && practical.gut === "yes") || (lean === "support" && practical.gut === "no")
      ? lang === "zh"
        ? "这和阅读的倾向不一致，先写下来差在哪里，不要急着抹平。"
        : "That disagrees with the reading. Write down the gap before you smooth it over."
      : lang === "zh"
        ? "直觉和阅读大体同向，仍然要用预算和期限来验。"
        : "Gut and reading mostly point the same way; still check them against budget and deadline.";
  if (lang === "zh") {
    return `预算：${practical.budget || "未填"}。期限：${practical.deadline || "未填"}。风险承受：${practical.risk}。${gut}。${practical.gutNote ? practical.gutNote + "。" : ""}${tension}`;
  }
  return `Budget: ${practical.budget || "not set"}. Deadline: ${practical.deadline || "not set"}. Risk: ${practical.risk}. ${gut}. ${practical.gutNote ? practical.gutNote + ". " : ""}${tension}`;
}

function methodName(method: string): string {
  switch (method) {
    case "iching":
      return "易经";
    case "ziwei":
      return "紫微";
    case "bazi":
      return "八字";
    case "meihua":
      return "梅花";
    case "qimen":
      return "奇门";
    default:
      return method;
  }
}
