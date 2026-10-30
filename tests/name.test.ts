import { describe, expect, it } from "vitest";

import { analyzeName, numerologyNumber, resolveChar, wugeNumbers } from "@/lib/name";

describe("姓名五格", () => {
  it("uses Kangxi strokes of the traditional form", () => {
    expect(resolveChar("王").strokes).toBe(4);
    expect(resolveChar("万")).toMatchObject({ traditional: "萬", strokes: 15 });
    expect(resolveChar("张")).toMatchObject({ traditional: "張", strokes: 11 });
    expect(resolveChar("伟")).toMatchObject({ traditional: "偉", strokes: 11 });
    expect(resolveChar("欧")).toMatchObject({ traditional: "歐", strokes: 15 });
    expect(resolveChar("阳")).toMatchObject({ traditional: "陽", strokes: 17 });
  });

  it("computes 王小明", () => {
    const grids = wugeNumbers([4], [3, 8]);
    expect(grids).toEqual({ heaven: 5, person: 7, earth: 11, outer: 9, total: 15 });
    const analysis = analyzeName("王", "小明", {}, ["金", "水"]);
    expect(analysis?.grids?.map((grid) => grid.value)).toEqual([5, 7, 11, 9, 15]);
    expect(analysis?.grids?.find((grid) => grid.key === "person")?.element).toBe("金");
    expect(analysis?.sancai).toMatchObject({ heaven: "土", person: "金", earth: "木" });
    expect(analysis?.note).toBe("assists");
  });

  it("computes a two-character surname and a single given name", () => {
    expect(wugeNumbers([15, 17], [4])).toEqual({ heaven: 32, person: 21, earth: 5, outer: 16, total: 36 });
  });

  it("reduces counts above 81 by the 80-cycle", () => {
    expect(numerologyNumber(81)).toBe(81);
    expect(numerologyNumber(82)).toBe(2);
    expect(numerologyNumber(15)).toBe(15);
  });

  it("honors a manual stroke override", () => {
    expect(resolveChar("发", { 发: 12 }).strokes).toBe(12);
  });
});
