import { Solar } from "lunar-javascript";

import { branchNumber, hourInfo, relate } from "@/lib/calendar";
import { hexagramFromBinary } from "@/lib/iching";
import type { CivilDateTime, Element, Lean, MeihuaResult } from "@/lib/types";

const TRIGRAM_BINARY: Record<string, string> = {
  乾: "111",
  兑: "110",
  离: "101",
  震: "100",
  巽: "011",
  坎: "010",
  艮: "001",
  坤: "000",
};

const TRIGRAM_ELEMENT: Record<string, Element> = {
  乾: "金",
  兑: "金",
  离: "火",
  震: "木",
  巽: "木",
  坎: "水",
  艮: "土",
  坤: "土",
};

const BY_NUMBER = ["", "乾", "兑", "离", "震", "巽", "坎", "艮", "坤"];

export function trigramFromCount(count: number): string {
  const remainder = count % 8;
  return BY_NUMBER[remainder === 0 ? 8 : remainder] ?? "坤";
}

export function movingFromCount(count: number): number {
  const remainder = count % 6;
  return remainder === 0 ? 6 : remainder;
}

function flipTrigram(binary: string, lineInTrigram: number): string {
  const chars = binary.split("");
  const index = lineInTrigram - 1;
  chars[index] = chars[index] === "1" ? "0" : "1";
  return chars.join("");
}

export function castMeihua(when: CivilDateTime): MeihuaResult {
  const lunar = Solar.fromYmdHms(when.year, when.month, when.day, when.hour, when.minute, 0).getLunar();
  const yearBranch = lunar.getYearInGanZhi().slice(-1);
  const month = Math.abs(lunar.getMonth());
  const day = lunar.getDay();
  const hour = branchNumber(hourInfo(when.hour).branch);
  const upperCount = branchNumber(yearBranch) + month + day;
  const lowerCount = upperCount + hour;
  return meihuaFromCounts(upperCount, lowerCount);
}

export function meihuaFromCounts(upperCount: number, lowerCount: number): MeihuaResult {
  const upper = trigramFromCount(upperCount);
  const lower = trigramFromCount(lowerCount);
  const moving = movingFromCount(lowerCount);
  const lowerBinary = TRIGRAM_BINARY[lower] ?? "000";
  const upperBinary = TRIGRAM_BINARY[upper] ?? "000";
  let nextLower = lowerBinary;
  let nextUpper = upperBinary;
  if (moving <= 3) nextLower = flipTrigram(lowerBinary, moving);
  else nextUpper = flipTrigram(upperBinary, moving - 3);
  const primary = hexagramFromBinary(lowerBinary + upperBinary);
  const resulting = hexagramFromBinary(nextLower + nextUpper);
  const bodyTrigram = moving <= 3 ? upper : lower;
  const useTrigram = moving <= 3 ? lower : upper;
  const bodyElement = TRIGRAM_ELEMENT[bodyTrigram] ?? "土";
  const useElement = TRIGRAM_ELEMENT[useTrigram] ?? "土";
  const relation = relate(useElement, bodyElement);
  const mapped =
    relation === "generate"
      ? "use-generates-body"
      : relation === "generated"
        ? "body-generates-use"
        : relation === "controlled"
          ? "body-controls-use"
          : relation === "control"
            ? "use-controls-body"
            : "same";
  const lean: Lean =
    mapped === "use-generates-body" || mapped === "body-controls-use"
      ? "support"
      : mapped === "use-controls-body"
        ? "caution"
        : "mixed";
  return {
    upper,
    lower,
    moving,
    primary,
    resulting,
    bodyTrigram,
    useTrigram,
    bodyElement,
    useElement,
    relation: mapped,
    lean,
  };
}
