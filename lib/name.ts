import { kangxiStrokes } from "@/data/kangxi";
import { s2tMap } from "@/data/s2t";

import { relate } from "@/lib/calendar";
import type { CharStroke, Element, NameAnalysis, NameGrid } from "@/lib/types";

const LUCK81 = [
  0, 2, -2, 2, -2, 2, 1, 1, 1, -2, -2, 2, -1, 2, -1, 2, 2, 1, 2, -1, -2, 2, -1, 2, 2, 2, -1, -2, -1, 1, 0, 2, 2, 2,
  -1, 2, -1, 2, 0, 2, -1, 2, 0, -1, -1, 2, -1, 2, 2, -1, 0, 0, 2, -1, -2, 0, -1, 1, 0, -1, -1, 2, -1, 2, -1, 2, -1,
  2, 2, -1, -2, 0, -1, 2, -1, 0, -1, 0, 0, -1, -1, 2,
];

export function numberElement(value: number): Element {
  const digit = Math.abs(value) % 10;
  if (digit === 1 || digit === 2) return "木";
  if (digit === 3 || digit === 4) return "火";
  if (digit === 5 || digit === 6) return "土";
  if (digit === 7 || digit === 8) return "金";
  return "水";
}

/** 81数理. Counts above 81 reduce by the traditional 80-cycle. */
export function numerologyNumber(value: number): number {
  if (value <= 81) return value;
  const reduced = ((value - 1) % 80) + 1;
  return reduced;
}

export function luckOf(value: number): NameGrid["luck"] {
  const score = LUCK81[numerologyNumber(value)] ?? 0;
  if (score >= 2) return "great";
  if (score === 1) return "good";
  if (score === 0) return "half";
  if (score === -1) return "bad";
  return "worse";
}

export function resolveChar(char: string, overrides: Record<string, number> = {}): CharStroke {
  const alternatives = s2tMap[char] ?? [];
  const traditional = alternatives[0] && alternatives[0] !== char ? alternatives[0] : char;
  if (overrides[char] != null) {
    return { char, traditional, strokes: overrides[char]!, alternatives, };
  }
  const strokes = kangxiStrokes[traditional] ?? kangxiStrokes[char] ?? null;
  return { char, traditional, strokes, alternatives };
}

type GridNumbers = { heaven: number; person: number; earth: number; outer: number; total: number };

export function wugeNumbers(surname: number[], given: number[]): GridNumbers {
  if (surname.length < 1 || surname.length > 2) throw new Error("surname-length");
  if (given.length < 1 || given.length > 3) throw new Error("given-length");
  const total = [...surname, ...given].reduce((sum, n) => sum + n, 0);
  if (surname.length === 1 && given.length === 1) {
    const heaven = surname[0]! + 1;
    const person = surname[0]! + given[0]!;
    const earth = given[0]! + 1;
    return { heaven, person, earth, outer: 2, total };
  }
  if (surname.length === 1) {
    const heaven = surname[0]! + 1;
    const person = surname[0]! + given[0]!;
    const earth = given.reduce((sum, n) => sum + n, 0);
    return { heaven, person, earth, outer: total - person + 1, total };
  }
  if (given.length === 1) {
    const heaven = surname[0]! + surname[1]!;
    const person = surname[1]! + given[0]!;
    const earth = given[0]! + 1;
    return { heaven, person, earth, outer: surname[0]! + 1, total };
  }
  const heaven = surname[0]! + surname[1]!;
  const person = surname[1]! + given[0]!;
  const earth = given.reduce((sum, n) => sum + n, 0);
  const outer = surname[0]! + given[given.length - 1]!;
  return { heaven, person, earth, outer, total };
}

function sancaiLuck(heaven: Element, person: Element, earth: Element): NameAnalysis["sancai"] {
  const link = (from: Element, to: Element) => {
    const relation = relate(from, to);
    if (relation === "generate" || relation === "same") return 2;
    if (relation === "generated") return 0;
    if (relation === "control") return -1;
    return -2;
  };
  const score = link(heaven, person) + link(person, earth);
  const luck = score >= 3 ? "auspicious" : score >= 1 ? "mixed" : "inauspicious";
  return { heaven, person, earth, luck };
}

export function analyzeName(
  surname: string,
  givenName: string,
  overrides: Record<string, number>,
  favorable: Element[],
): NameAnalysis | null {
  const family = [...surname.trim()];
  const given = [...givenName.trim()];
  if (family.length === 0 && given.length === 0) return null;
  const characters = [...family, ...given].map((char) => resolveChar(char, overrides));
  const missing = characters.filter((item) => item.strokes == null).map((item) => item.char);
  if (family.length === 0 || given.length === 0 || family.length > 2 || given.length > 3 || missing.length > 0) {
    return {
      surname,
      givenName,
      characters,
      grids: null,
      sancai: null,
      missing,
      nameElements: [],
      helpsYongShen: null,
      note: "incomplete",
    };
  }
  const numbers = wugeNumbers(
    characters.slice(0, family.length).map((item) => item.strokes!),
    characters.slice(family.length).map((item) => item.strokes!),
  );
  const keys: NameGrid["key"][] = ["heaven", "person", "earth", "outer", "total"];
  const grids: NameGrid[] = keys.map((key) => {
    const value = numbers[key === "heaven" ? "heaven" : key === "person" ? "person" : key === "earth" ? "earth" : key === "outer" ? "outer" : "total"];
    return {
      key,
      value,
      numerology: numerologyNumber(value),
      element: numberElement(value),
      luck: luckOf(value),
    };
  });
  const heaven = grids[0]!.element;
  const person = grids[1]!.element;
  const earth = grids[2]!.element;
  const total = grids[4]!.element;
  const nameElements = [person, total];
  const helps = nameElements.some((element) => favorable.includes(element));
  const conflicts = nameElements.every((element) => !favorable.includes(element));
  return {
    surname,
    givenName,
    characters,
    grids,
    sancai: sancaiLuck(heaven, person, earth),
    missing: [],
    nameElements,
    helpsYongShen: helps,
    note: helps ? "assists" : conflicts ? "conflicts" : "neutral",
  };
}
