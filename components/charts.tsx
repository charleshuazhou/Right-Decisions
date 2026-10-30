"use client";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import type { BaziChart, FengshuiAdvice, HexagramView, IchingCast, MeihuaResult, NameAnalysis, QimenChart, ZiweiChart } from "@/lib/types";

const BRANCH_AREA: Record<string, string> = {
  巳: "si",
  午: "wu",
  未: "wei",
  申: "shen",
  辰: "chen",
  酉: "you",
  卯: "mao",
  戌: "xu",
  寅: "yin",
  丑: "chou",
  子: "zi",
  亥: "hai",
};

const GRID_ZH: Record<string, string> = { heaven: "天格", person: "人格", earth: "地格", outer: "外格", total: "总格" };
const GRID_EN: Record<string, string> = { heaven: "Heaven", person: "Person", earth: "Earth", outer: "Outer", total: "Total" };
const LUCK_ZH: Record<string, string> = { great: "大吉", good: "吉", half: "半吉", bad: "凶", worse: "大凶" };
const LUCK_EN: Record<string, string> = { great: "great", good: "good", half: "mixed", bad: "poor", worse: "harsh" };

export function BaziPanel({ chart }: { chart: BaziChart }) {
  const { tx } = useI18n();
  const max = Math.max(...Object.values(chart.scores), 1);
  const labels = [tx("年", "Year"), tx("月", "Month"), tx("日", "Day"), tx("时", "Hour")];
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-4 gap-2">
        {chart.pillars.map((pillar, index) => (
          <div key={pillar.key} className="rounded-lg border border-border bg-card px-2 py-3 text-center">
            <p className="text-muted-foreground text-xs">{labels[index]}</p>
            <p className="font-serif text-2xl">{pillar.stem}</p>
            <p className="font-serif text-2xl">{pillar.branch}</p>
            <p className="text-muted-foreground mt-1 text-[11px]">{pillar.tenGod}</p>
            <p className="text-[11px]">{pillar.naYin}</p>
          </div>
        ))}
      </div>
      <p className="text-sm leading-6">
        {tx("日主", "Day master")} {chart.dayMaster}
        {chart.dayMasterElement} · {chart.strength === "strong" ? tx("身强", "strong") : tx("身弱", "weak")} ·{" "}
        {tx("喜用", "Useful")} {chart.favorable.join("、")} · {tx("忌", "Avoid")} {chart.unfavorable.join("、")}
        {chart.seasonal ? ` · ${tx("调候", "Season")} ${chart.seasonal}` : ""}
      </p>
      <div className="grid gap-1.5">
        {(Object.keys(chart.scores) as (keyof typeof chart.scores)[]).map((element) => (
          <div key={element} className="grid grid-cols-[2rem_1fr_2.5rem] items-center gap-2 text-xs">
            <span>{element}</span>
            <span className="bg-muted h-1.5 overflow-hidden rounded-full">
              <span className="bg-primary block h-full" style={{ width: `${(chart.scores[element] / max) * 100}%` }} />
            </span>
            <span className="text-right">{chart.scores[element]}</span>
          </div>
        ))}
      </div>
      <p className="text-muted-foreground text-xs">
        {tx("起运", "Luck starts")} {chart.startSolar}（{chart.startYears}
        {tx("年", "y")}
        {chart.startMonths}
        {tx("个月", "m")}）· {chart.direction === "forward" ? tx("顺排", "forward") : tx("逆排", "backward")} ·{" "}
        {tx("流年", "Year")} {chart.flowYear} · {tx("流月", "Month")} {chart.flowMonth}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {chart.daYun.map((item) => (
          <div
            key={`${item.ganZhi}-${item.startYear}`}
            className={item.current ? "border-primary shrink-0 rounded-lg border px-2 py-1 text-center" : "shrink-0 rounded-lg border border-border px-2 py-1 text-center"}
          >
            <p className="font-serif">{item.ganZhi}</p>
            <p className="text-muted-foreground text-[11px]">
              {item.startAge}–{item.endAge}
            </p>
            <p className="text-muted-foreground text-[11px]">{item.startYear}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ZiweiBoard({ chart }: { chart: ZiweiChart }) {
  const { tx } = useI18n();
  return (
    <div className="overflow-x-auto">
      <div className="ziwei-board">
        {chart.palaces.map((palace) => (
          <article
            key={palace.branch}
            style={{ gridArea: BRANCH_AREA[palace.branch] }}
            className={palace.branch === chart.decadal.branch ? "rounded-md border border-primary bg-card p-1.5" : "rounded-md border border-border bg-card p-1.5"}
          >
            <header className="flex items-baseline justify-between gap-1">
              <span className="text-primary font-serif text-sm">{palace.name}</span>
              <span className="text-muted-foreground text-[10px]">
                {palace.stem}
                {palace.branch}
                {palace.isBody ? " · 身" : ""}
              </span>
            </header>
            <ul className="mt-1 space-y-0.5">
              {palace.major.map((star) => (
                <li key={star.name} className="text-xs">
                  <StarName name={star.name} brightness={star.brightness} mutagen={star.mutagen} />
                </li>
              ))}
              {palace.minor.map((star) => (
                <li key={star.name} className="text-muted-foreground text-[11px]">
                  <StarName name={star.name} brightness={star.brightness} mutagen={star.mutagen} />
                </li>
              ))}
            </ul>
            {palace.decadal ? (
              <p className="text-muted-foreground mt-1 text-[10px]">
                {palace.decadal[0]}–{palace.decadal[1]}
              </p>
            ) : null}
          </article>
        ))}
        <div style={{ gridArea: "core" }} className="flex flex-col items-center justify-center rounded-md border border-dashed border-border px-3 text-center">
          <p className="font-serif text-lg">{chart.fiveElementsClass}</p>
          <p className="text-sm">
            {tx("命宫", "Life")} {chart.soulBranch} · {tx("身宫", "Body")} {chart.bodyBranch}
          </p>
          <p className="text-muted-foreground text-xs">
            {tx("命主", "Soul")} {chart.soul} · {tx("身主", "Body star")} {chart.body}
          </p>
          <p className="mt-2 text-xs">
            {tx("大限", "Decade")} {chart.decadal.palace} {chart.decadal.stem}
            {chart.decadal.branch}
            {chart.decadal.range ? ` ${chart.decadal.range[0]}–${chart.decadal.range[1]}` : ""}
          </p>
          <p className="text-xs">
            {tx("流年", "Year")} {chart.yearly.stem}
            {chart.yearly.branch} · {chart.yearly.palace}
          </p>
          <p className="text-muted-foreground mt-1 text-[11px]">
            {tx("生年四化", "Natal transformations")}{" "}
            {chart.natalMutagen.map((item) => `${item.star}化${item.mutagen}`).join(" ")}
          </p>
        </div>
      </div>
    </div>
  );
}

function StarName({ name, brightness, mutagen }: { name: string; brightness: string; mutagen: string }) {
  return (
    <span>
      {name}
      {brightness ? <span className="text-muted-foreground"> {brightness}</span> : null}
      {mutagen ? <span className={mutagen === "忌" ? "text-primary" : "text-amber-800"}> 化{mutagen}</span> : null}
    </span>
  );
}

export function HexagramBlock({ cast }: { cast: IchingCast }) {
  const { tx } = useI18n();
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <HexagramCard title={tx("本卦", "Primary")} hex={cast.primary} marks={cast.changingLines} lines={cast.lines.map((line) => line.yang)} />
      <HexagramCard
        title={tx("之卦", "Resulting")}
        hex={cast.resulting}
        marks={[]}
        lines={cast.lines.map((line) => (line.changing ? !line.yang : line.yang))}
      />
      {cast.changingLines.length ? (
        <div className="md:col-span-2 text-sm leading-6">
          {cast.changingLines.map((index) => (
            <p key={index}>
              {cast.primary.lines[index - 1]?.name}：{cast.primary.lines[index - 1]?.text}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground md:col-span-2 text-sm">{tx("六爻安静。", "No changing lines.")}</p>
      )}
    </div>
  );
}

function HexagramCard({
  title,
  hex,
  marks,
  lines,
}: {
  title: string;
  hex: HexagramView;
  marks: number[];
  lines: boolean[];
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-muted-foreground text-xs">{title}</p>
      <p className="font-serif text-3xl">
        {hex.symbol} {hex.name}
      </p>
      <p className="text-muted-foreground text-sm">
        {hex.pinyin} · {hex.english} · {hex.lower}
        {hex.upper}
      </p>
      <div className="my-3 grid justify-items-center gap-1.5">
        {[...lines].reverse().map((yang, index) => {
          const number = lines.length - index;
          return (
            <div key={number} className="flex items-center gap-2">
              <span className={yang ? "bg-foreground h-1.5 w-24" : "flex w-24 justify-between"}>
                {yang ? null : (
                  <>
                    <span className="bg-foreground h-1.5 w-10" />
                    <span className="bg-foreground h-1.5 w-10" />
                  </>
                )}
              </span>
              <span className="text-muted-foreground w-4 text-[10px]">{marks.includes(number) ? "○" : ""}</span>
            </div>
          );
        })}
      </div>
      <p className="text-sm leading-6">{hex.judgment}</p>
      <p className="text-muted-foreground mt-2 text-xs leading-5">{hex.image}</p>
    </div>
  );
}

export function NamePanel({ analysis }: { analysis: NameAnalysis }) {
  const { tx, locale } = useI18n();
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2 text-sm">
        {analysis.characters.map((item) => (
          <span key={item.char} className="rounded-md border border-border px-2 py-1">
            {item.char}
            {item.traditional !== item.char ? ` → ${item.traditional}` : ""} · {item.strokes ?? "?"}
          </span>
        ))}
      </div>
      {analysis.missing.length ? (
        <p className="text-sm">{tx(`还缺笔画：${analysis.missing.join("、")}`, `Missing stroke counts: ${analysis.missing.join(", ")}`)}</p>
      ) : null}
      {analysis.grids ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {analysis.grids.map((grid) => (
            <div key={grid.key} className="rounded-lg border border-border p-2 text-center">
              <p className="text-muted-foreground text-xs">{locale === "zh" ? GRID_ZH[grid.key] : GRID_EN[grid.key]}</p>
              <p className="font-serif text-xl">{grid.value}</p>
              <p className="text-xs">
                {grid.element} · {locale === "zh" ? LUCK_ZH[grid.luck] : LUCK_EN[grid.luck]}
              </p>
            </div>
          ))}
        </div>
      ) : null}
      {analysis.sancai ? (
        <p className="text-sm">
          {tx("三才", "Three talents")} {analysis.sancai.heaven}
          {analysis.sancai.person}
          {analysis.sancai.earth} · {analysis.sancai.luck === "auspicious" ? tx("相生", "generating") : analysis.sancai.luck === "mixed" ? tx("平", "mixed") : tx("相克", "controlling")}
          {" · "}
          {analysis.note === "assists"
            ? tx("人格或总格落入喜用", "A name grid lands in the useful elements")
            : analysis.note === "conflicts"
              ? tx("五格五行没有落在喜用上", "The name elements miss the useful set")
              : tx("姓名还不完整", "The name is incomplete")}
        </p>
      ) : null}
    </div>
  );
}

export function QimenBoard({ chart }: { chart: QimenChart }) {
  const { tx } = useI18n();
  return (
    <div className="grid gap-3">
      <p className="text-sm">
        {chart.ju} · {tx("值符", "Chief")} {chart.zhiFu} · {tx("值使", "Envoy")} {chart.zhiShi} · {tx("空亡", "Void")} {chart.kong}
      </p>
      <div className="qimen-board">
        {chart.palaces.map((palace) => (
          <div
            key={palace.palace}
            className={palace.palace === chart.focusPalace ? "rounded-md border border-primary bg-card p-2 text-xs leading-5" : "rounded-md border border-border bg-card p-2 text-xs leading-5"}
          >
            <p className="text-muted-foreground">
              {palace.palace} {palace.direction}
            </p>
            <p>{palace.god}</p>
            <p>
              {palace.star} · {palace.gate || tx("无门", "no gate")}
            </p>
            <p>
              {tx("天", "Heaven")} {palace.tianPan || "—"} / {tx("地", "Earth")} {palace.diPan || "—"}
            </p>
          </div>
        ))}
      </div>
      <p className="text-muted-foreground text-xs">
        {tx("此问用神", "Focus for this question")} {chart.focusLabel} · {chart.fourPillars}
      </p>
    </div>
  );
}

export function MeihuaPanel({ result }: { result: MeihuaResult }) {
  const { tx } = useI18n();
  return (
    <div className="text-sm leading-6">
      <p>
        {tx("上卦", "Upper")} {result.upper} · {tx("下卦", "Lower")} {result.lower} · {tx("动爻", "Moving line")} {result.moving}
      </p>
      <p>
        {result.primary.symbol} {result.primary.name} → {result.resulting.symbol} {result.resulting.name}
      </p>
      <p>
        {tx("体", "Body")} {result.bodyTrigram}
        {result.bodyElement} · {tx("用", "Use")} {result.useTrigram}
        {result.useElement} · {result.relation}
      </p>
    </div>
  );
}

export function FengshuiPanel({ advice }: { advice: FengshuiAdvice }) {
  const { tx } = useI18n();
  return (
    <div className="grid gap-2 text-sm leading-6">
      <p>
        {tx("以", "From")} {advice.place} {tx("来看，用神", ", useful element")} {advice.yongShen}
        {tx("，喜神", ", secondary")} {advice.xiShen}
        {advice.seasonal ? `，${tx("调候", "seasonal")} ${advice.seasonal}` : ""}。
      </p>
      <p>
        {tx("有利方位", "Directions")} {advice.directions.join("、")} · {tx("颜色", "Colors")} {advice.colors.join("、")} ·{" "}
        {tx("数字", "Numbers")} {advice.numbers.join("、")}
      </p>
      <p>
        {tx("少取", "Go lightly")} {advice.avoidDirections.join("、")} / {advice.avoidColors.join("、")} / {advice.avoidNumbers.join("、")}
      </p>
      <p className="text-muted-foreground text-xs">
        {tx("今日黄历", "Today's almanac")} {tx("喜神", "joy")} {advice.dailyXi} · {tx("财神", "wealth")} {advice.dailyCai} · {tx("福神", "fortune")} {advice.dailyFu}
      </p>
    </div>
  );
}

export function LeanBadge({ lean }: { lean: "support" | "caution" | "mixed" }) {
  const { tx } = useI18n();
  const label = lean === "support" ? tx("偏可为", "leans yes") : lean === "caution" ? tx("宜缓", "wait") : tx("未定", "mixed");
  return <Badge variant={lean === "caution" ? "destructive" : "secondary"}>{label}</Badge>;
}
