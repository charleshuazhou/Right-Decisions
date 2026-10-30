import type { BaziChart, Element, FengshuiAdvice } from "@/lib/types";
import { dayAlmanac } from "@/lib/almanac";
import type { CivilDateTime } from "@/lib/types";

const STYLE: Record<Element, { directions: string[]; colors: string[]; numbers: number[] }> = {
  木: { directions: ["东"], colors: ["青", "绿"], numbers: [3, 8] },
  火: { directions: ["南"], colors: ["红", "紫"], numbers: [2, 7] },
  土: { directions: ["东北", "西南"], colors: ["黄", "褐"], numbers: [5, 0] },
  金: { directions: ["西", "西北"], colors: ["白", "金"], numbers: [4, 9] },
  水: { directions: ["北"], colors: ["黑", "蓝"], numbers: [1, 6] },
};

export function fengshuiFor(bazi: BaziChart, when: CivilDateTime, place: string): FengshuiAdvice {
  const useful = STYLE[bazi.yongShen];
  const extra = STYLE[bazi.xiShen];
  const avoid = STYLE[bazi.unfavorable[0] ?? "土"];
  const day = dayAlmanac(when);
  const directions = unique([...useful.directions, ...extra.directions]);
  return {
    yongShen: bazi.yongShen,
    xiShen: bazi.xiShen,
    seasonal: bazi.seasonal,
    directions,
    avoidDirections: avoid.directions.filter((item) => !directions.includes(item)),
    colors: unique([...useful.colors, ...extra.colors]),
    avoidColors: avoid.colors,
    numbers: unique([...useful.numbers, ...extra.numbers]),
    avoidNumbers: avoid.numbers,
    dailyXi: day.xi,
    dailyCai: day.cai,
    dailyFu: day.fu,
    place,
  };
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}
