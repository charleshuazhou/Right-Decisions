import { describe, expect, it } from "vitest";

import { allHexagrams, castFromLines, hexagramFromBinary, throwCoins } from "@/lib/iching";

describe("I Ching coin cast", () => {
  it("maps the three-coin sums", () => {
    expect(throwCoins([3, 3, 3])).toMatchObject({ sum: 9, yang: true, changing: true });
    expect(throwCoins([3, 2, 2])).toMatchObject({ sum: 7, yang: true, changing: false });
    expect(throwCoins([2, 3, 3])).toMatchObject({ sum: 8, yang: false, changing: false });
    expect(throwCoins([2, 2, 2])).toMatchObject({ sum: 6, yang: false, changing: true });
  });

  it("builds Qian and the resulting Gou when the bottom line changes", () => {
    const youngYang = throwCoins([3, 2, 2]);
    const oldYang = throwCoins([3, 3, 3]);
    const cast = castFromLines([oldYang, youngYang, youngYang, youngYang, youngYang, youngYang]);
    expect(cast.primary.number).toBe(1);
    expect(cast.primary.name).toBe("乾");
    expect(cast.primary.judgment).toContain("元亨");
    expect(cast.primary.lines[1]?.text).toContain("见龙在田");
    expect(cast.changingLines).toEqual([1]);
    expect(cast.resulting.name).toBe("姤");
    expect(cast.resulting.lower).toBe("巽");
    expect(cast.resulting.upper).toBe("乾");
  });

  it("keeps all 64 King Wen hexagrams and known trigrams", () => {
    expect(allHexagrams()).toHaveLength(64);
    expect(hexagramFromBinary("000000").name).toBe("坤");
    expect(hexagramFromBinary("100010")).toMatchObject({ name: "屯", lower: "震", upper: "坎", number: 3 });
    expect(hexagramFromBinary("101010").number).toBe(63);
    expect(hexagramFromBinary("010101").number).toBe(64);
    expect(allHexagrams().every((item) => item.lines.length === 6 && item.pinyin && item.english)).toBe(true);
  });
});
