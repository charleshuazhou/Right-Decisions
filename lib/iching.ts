import hexagrams from "@/data/hexagrams.json";

import type { CoinThrow, HexagramView, IchingCast, Lean } from "@/lib/types";

type HexagramRecord = HexagramView & { binary: string };

const RECORDS = hexagrams as HexagramRecord[];
const BY_BINARY = new Map(RECORDS.map((item) => [item.binary, item]));
const BY_NUMBER = new Map(RECORDS.map((item) => [item.number, item]));

export function getHexagram(number: number): HexagramView {
  const found = BY_NUMBER.get(number);
  if (!found) throw new Error(`Unknown hexagram ${number}`);
  return toView(found);
}

export function hexagramFromBinary(binary: string): HexagramView {
  const found = BY_BINARY.get(binary);
  if (!found) throw new Error(`Unknown hexagram binary ${binary}`);
  return toView(found);
}

function toView(record: HexagramRecord): HexagramView {
  return {
    number: record.number,
    name: record.name,
    pinyin: record.pinyin,
    english: record.english,
    symbol: record.symbol,
    upper: record.upper,
    lower: record.lower,
    judgment: record.judgment,
    image: record.image,
    lines: record.lines,
    yong: record.yong,
    tone: record.tone as Lean,
  };
}

export function throwCoins(coins: [2 | 3, 2 | 3, 2 | 3]): CoinThrow {
  const sum = (coins[0] + coins[1] + coins[2]) as 6 | 7 | 8 | 9;
  if (![6, 7, 8, 9].includes(sum)) throw new Error(`Impossible coin sum ${sum}`);
  return {
    coins,
    sum,
    yang: sum === 7 || sum === 9,
    changing: sum === 6 || sum === 9,
  };
}

export function randomCoins(): [2 | 3, 2 | 3, 2 | 3] {
  const face = (): 2 | 3 => {
    const bytes = new Uint8Array(1);
    crypto.getRandomValues(bytes);
    return bytes[0]! % 2 === 0 ? 3 : 2;
  };
  return [face(), face(), face()];
}

export function castFromLines(lines: CoinThrow[]): IchingCast {
  if (lines.length !== 6) throw new Error("A hexagram needs six lines, bottom first");
  const binary = lines.map((line) => (line.yang ? "1" : "0")).join("");
  const changed = lines.map((line) => (line.changing ? (line.yang ? "0" : "1") : line.yang ? "1" : "0")).join("");
  const changingLines = lines.flatMap((line, index) => (line.changing ? [index + 1] : []));
  return {
    lines,
    primary: hexagramFromBinary(binary),
    resulting: hexagramFromBinary(changed),
    changingLines,
  };
}

export function allHexagrams(): HexagramView[] {
  return RECORDS.map(toView);
}
