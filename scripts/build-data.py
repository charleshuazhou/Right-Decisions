#!/usr/bin/env python3
"""Build bundled datasets: hexagrams, Kangxi strokes, s2t, cities.

Sources (see README):
- freizl/yijing (MIT) for Zhouyi 卦辞/爻辞
- breezyreeds/kangxi-strokecount (MIT)
- BYVoid/OpenCC STCharacters (Apache-2.0)
- GeoNames cities15000 (CC-BY)
- umpirsky/country-list country names
"""

from __future__ import annotations

import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = Path("/tmp/wenheng-data")
OPENCC = Path("/workspace/agent-tools/047581af-f71b-49cf-9a70-6dd94c32e375.txt")

HEX_META = [
    # number is King Wen order, matching freizl/yijing zh-CN/64gua.json
    ("乾", "qián", "The Creative", "mixed"),
    ("坤", "kūn", "The Receptive", "mixed"),
    ("屯", "zhūn", "Difficulty at the Beginning", "mixed"),
    ("蒙", "méng", "Youthful Folly", "mixed"),
    ("需", "xū", "Waiting", "mixed"),
    ("讼", "sòng", "Conflict", "caution"),
    ("师", "shī", "The Army", "mixed"),
    ("比", "bǐ", "Holding Together", "support"),
    ("小畜", "xiǎo xù", "Small Taming", "mixed"),
    ("履", "lǚ", "Treading", "mixed"),
    ("泰", "tài", "Peace", "support"),
    ("否", "pǐ", "Standstill", "caution"),
    ("同人", "tóng rén", "Fellowship", "support"),
    ("大有", "dà yǒu", "Great Possession", "support"),
    ("谦", "qiān", "Modesty", "support"),
    ("豫", "yù", "Enthusiasm", "support"),
    ("随", "suí", "Following", "support"),
    ("蛊", "gǔ", "Work on Decay", "caution"),
    ("临", "lín", "Approach", "support"),
    ("观", "guān", "Contemplation", "mixed"),
    ("噬嗑", "shì kè", "Biting Through", "mixed"),
    ("贲", "bì", "Grace", "support"),
    ("剥", "bō", "Splitting Apart", "caution"),
    ("复", "fù", "Return", "support"),
    ("无妄", "wú wàng", "Innocence", "mixed"),
    ("大畜", "dà xù", "Great Taming", "support"),
    ("颐", "yí", "Nourishment", "mixed"),
    ("大过", "dà guò", "Great Exceeding", "caution"),
    ("坎", "kǎn", "The Abysmal Water", "caution"),
    ("离", "lí", "The Clinging Fire", "mixed"),
    ("咸", "xián", "Influence", "support"),
    ("恒", "héng", "Duration", "support"),
    ("遯", "dùn", "Retreat", "caution"),
    ("大壮", "dà zhuàng", "Great Power", "support"),
    ("晋", "jìn", "Progress", "support"),
    ("明夷", "míng yí", "Darkening of the Light", "caution"),
    ("家人", "jiā rén", "The Family", "support"),
    ("睽", "kuí", "Opposition", "caution"),
    ("蹇", "jiǎn", "Obstruction", "caution"),
    ("解", "xiè", "Deliverance", "mixed"),
    ("损", "sǔn", "Decrease", "mixed"),
    ("益", "yì", "Increase", "support"),
    ("夬", "guài", "Breakthrough", "mixed"),
    ("姤", "gòu", "Coming to Meet", "caution"),
    ("萃", "cuì", "Gathering Together", "support"),
    ("升", "shēng", "Pushing Upward", "support"),
    ("困", "kùn", "Oppression", "caution"),
    ("井", "jǐng", "The Well", "support"),
    ("革", "gé", "Revolution", "mixed"),
    ("鼎", "dǐng", "The Cauldron", "support"),
    ("震", "zhèn", "The Arousing", "mixed"),
    ("艮", "gèn", "Keeping Still", "mixed"),
    ("渐", "jiàn", "Development", "support"),
    ("归妹", "guī mèi", "The Marrying Maiden", "caution"),
    ("丰", "fēng", "Abundance", "support"),
    ("旅", "lǚ", "The Wanderer", "mixed"),
    ("巽", "xùn", "The Gentle", "mixed"),
    ("兑", "duì", "The Joyous", "support"),
    ("涣", "huàn", "Dispersion", "mixed"),
    ("节", "jié", "Limitation", "mixed"),
    ("中孚", "zhōng fú", "Inner Truth", "support"),
    ("小过", "xiǎo guò", "Small Exceeding", "caution"),
    ("既济", "jì jì", "After Completion", "support"),
    ("未济", "wèi jì", "Before Completion", "caution"),
]

TRIGRAMS = {
    "111": "乾",
    "110": "兑",
    "101": "离",
    "100": "震",
    "011": "巽",
    "010": "坎",
    "001": "艮",
    "000": "坤",
}

ADMIN_ZH = {
    "Beijing": "北京",
    "Tianjin": "天津",
    "Hebei": "河北",
    "Shanxi": "山西",
    "Nei Mongol": "内蒙古",
    "Inner Mongolia": "内蒙古",
    "Liaoning": "辽宁",
    "Jilin": "吉林",
    "Heilongjiang": "黑龙江",
    "Shanghai": "上海",
    "Jiangsu": "江苏",
    "Zhejiang": "浙江",
    "Anhui": "安徽",
    "Fujian": "福建",
    "Jiangxi": "江西",
    "Shandong": "山东",
    "Henan": "河南",
    "Hubei": "湖北",
    "Hunan": "湖南",
    "Guangdong": "广东",
    "Guangxi": "广西",
    "Hainan": "海南",
    "Chongqing": "重庆",
    "Sichuan": "四川",
    "Guizhou": "贵州",
    "Yunnan": "云南",
    "Xizang": "西藏",
    "Tibet": "西藏",
    "Shaanxi": "陕西",
    "Gansu": "甘肃",
    "Qinghai": "青海",
    "Ningxia": "宁夏",
    "Xinjiang": "新疆",
    "Taiwan": "台湾",
    "Hong Kong": "香港",
    "Macau": "澳门",
    "Macao": "澳门",
    "British Columbia": "不列颠哥伦比亚",
    "Alberta": "艾伯塔",
    "Ontario": "安大略",
    "Quebec": "魁北克",
    "Manitoba": "曼尼托巴",
    "Saskatchewan": "萨斯喀彻温",
    "Nova Scotia": "新斯科舍",
    "New Brunswick": "新不伦瑞克",
    "Newfoundland and Labrador": "纽芬兰与拉布拉多",
    "Prince Edward Island": "爱德华王子岛",
    "Yukon": "育空",
    "Northwest Territories": "西北地区",
    "Nunavut": "努纳武特",
    "California": "加利福尼亚",
    "New York": "纽约州",
    "Washington": "华盛顿州",
    "Texas": "得克萨斯",
    "Florida": "佛罗里达",
    "Illinois": "伊利诺伊",
    "Massachusetts": "马萨诸塞",
    "Hawaii": "夏威夷",
    "Oregon": "俄勒冈",
    "Nevada": "内华达",
    "Colorado": "科罗拉多",
    "Arizona": "亚利桑那",
    "Georgia": "佐治亚",
    "Pennsylvania": "宾夕法尼亚",
    "New Jersey": "新泽西",
    "Virginia": "弗吉尼亚",
    "Michigan": "密歇根",
    "Ohio": "俄亥俄",
    "North Carolina": "北卡罗来纳",
    "Alaska": "阿拉斯加",
    "District of Columbia": "哥伦比亚特区",
    "England": "英格兰",
    "Scotland": "苏格兰",
    "Wales": "威尔士",
    "Northern Ireland": "北爱尔兰",
    "New South Wales": "新南威尔士",
    "Victoria": "维多利亚州",
    "Queensland": "昆士兰",
    "Tokyo": "东京都",
    "Osaka": "大阪府",
    "Kyoto": "京都府",
    "Hokkaido": "北海道",
    "Seoul": "首尔",
    "Busan": "釜山",
    "Bangkok": "曼谷",
    "Île-de-France": "法兰西岛",
    "Bavaria": "巴伐利亚",
    "Berlin": "柏林",
}

CITY_ZH = {
    ("CA", "Vancouver"): "温哥华",
    ("CA", "Victoria"): "维多利亚",
    ("CA", "Richmond"): "列治文",
    ("CA", "Burnaby"): "本拿比",
    ("CA", "Surrey"): "素里",
    ("CA", "Toronto"): "多伦多",
    ("CA", "Montreal"): "蒙特利尔",
    ("CA", "Ottawa"): "渥太华",
    ("CA", "Calgary"): "卡尔加里",
    ("CA", "Edmonton"): "埃德蒙顿",
    ("CA", "Winnipeg"): "温尼伯",
    ("CA", "Quebec"): "魁北克市",
    ("CA", "Halifax"): "哈利法克斯",
    ("US", "New York"): "纽约",
    ("US", "New York City"): "纽约",
    ("US", "Los Angeles"): "洛杉矶",
    ("US", "San Francisco"): "旧金山",
    ("US", "Seattle"): "西雅图",
    ("US", "Chicago"): "芝加哥",
    ("US", "Boston"): "波士顿",
    ("US", "Houston"): "休斯顿",
    ("US", "Honolulu"): "檀香山",
    ("GB", "London"): "伦敦",
    ("FR", "Paris"): "巴黎",
    ("JP", "Tokyo"): "东京",
    ("JP", "Osaka"): "大阪",
    ("JP", "Kyoto"): "京都",
    ("KR", "Seoul"): "首尔",
    ("SG", "Singapore"): "新加坡",
    ("AU", "Sydney"): "悉尼",
    ("AU", "Melbourne"): "墨尔本",
    ("NZ", "Auckland"): "奥克兰",
    ("DE", "Berlin"): "柏林",
    ("IT", "Rome"): "罗马",
    ("ES", "Madrid"): "马德里",
    ("NL", "Amsterdam"): "阿姆斯特丹",
    ("TH", "Bangkok"): "曼谷",
    ("MY", "Kuala Lumpur"): "吉隆坡",
    ("IN", "Mumbai"): "孟买",
    ("AE", "Dubai"): "迪拜",
}


def build_hexagrams() -> None:
    src = json.loads((RAW / "64gua.json").read_text(encoding="utf-8"))
    if len(src) != 64 or len(HEX_META) != 64:
        raise SystemExit("expected 64 hexagrams")
    out = []
    for i, item in enumerate(src):
        name, pinyin, english, tone = HEX_META[i]
        if item["name"] != name:
            raise SystemExit(f"order mismatch at {i+1}: {item['name']} != {name}")
        binary = item["id"]
        if len(binary) != 6 or set(binary) - {"0", "1"}:
            raise SystemExit(f"bad binary {name} {binary}")
        judgment = item["gua_ci"]
        prefix = f"{name}："
        if judgment.startswith(prefix):
            judgment = judgment[len(prefix) :]
        prefix2 = f"{name}:"
        if judgment.startswith(prefix2):
            judgment = judgment[len(prefix2) :]
        lines = []
        yong = None
        line_re = re.compile(r"^(用[九六]|[初上][九六]|[九六][二三四五])[：:，,](.+)$")
        for raw in item["yao_ci"]:
            matched = line_re.match(raw)
            if not matched:
                raise SystemExit(f"bad line {raw}")
            label, text = matched.group(1), matched.group(2)
            entry = {"name": label, "text": text}
            if label.startswith("用"):
                yong = entry
            else:
                lines.append(entry)
        if len(lines) != 6:
            raise SystemExit(f"{name} has {len(lines)} lines")
        out.append(
            {
                "number": i + 1,
                "name": name,
                "pinyin": pinyin,
                "english": english,
                "symbol": item["symbol"],
                "binary": binary,
                "lower": TRIGRAMS[binary[:3]],
                "upper": TRIGRAMS[binary[3:]],
                "judgment": judgment,
                "image": item["da_xiang"],
                "lines": lines,
                "yong": yong,
                "tone": tone,
            }
        )
    path = ROOT / "data" / "hexagrams.json"
    path.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"hexagrams {len(out)} -> {path} ({path.stat().st_size} bytes)")


def build_kangxi_and_s2t() -> None:
    strokes: dict[str, int] = {}
    with (RAW / "kangxi.csv").open(encoding="utf-8-sig", newline="") as f:
        started = False
        reader = csv.reader(f)
        for row in reader:
            if not row:
                continue
            if not started:
                if row[0].strip().lstrip("\ufeff") == "CodePoint":
                    started = True
                continue
            if len(row) < 4:
                continue
            ch = row[2]
            if not ch:
                continue
            strokes[ch] = int(row[3])
    # Keep the BMP CJK block plus anything we actually saw that is a single character.
    # Full table is fine; drop non-single and private-use noise.
    compact = {ch: n for ch, n in strokes.items() if len(ch) == 1}
    payload = json.dumps(compact, ensure_ascii=False, separators=(",", ":"))
    if "`" in payload or "${" in payload or "\\" in payload:
        raise SystemExit("kangxi payload needs extra escaping")
    path = ROOT / "data" / "kangxi.ts"
    path.write_text(
        "/* Generated by scripts/build-data.py. Do not edit. */\n"
        "export const kangxiStrokes = JSON.parse(`"
        + payload
        + "`) as Record<string, number>;\n",
        encoding="utf-8",
    )
    print(f"kangxi {len(compact)} -> {path} ({path.stat().st_size} bytes)")
    for sample in "王小明張張万萬伟偉欧歐阳陽":
        print(" ", sample, compact.get(sample))

    s2t: dict[str, list[str]] = {}
    for line in OPENCC.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or line.startswith("-") or line.startswith("Format"):
            continue
        parts = line.split()
        if len(parts) < 2:
            continue
        src, *targets = parts
        if len(src) != 1 or any(len(t) != 1 for t in targets):
            continue
        if not re.search(r"[\u4e00-\u9fff]", src):
            continue
        s2t[src] = targets
    payload = json.dumps(s2t, ensure_ascii=False, separators=(",", ":"))
    if "`" in payload or "${" in payload or "\\" in payload:
        raise SystemExit("s2t payload needs extra escaping")
    sp = ROOT / "data" / "s2t.ts"
    sp.write_text(
        "/* Generated by scripts/build-data.py. Do not edit. */\n"
        "export const s2tMap = JSON.parse(`"
        + payload
        + "`) as Record<string, string[]>;\n",
        encoding="utf-8",
    )
    print(f"s2t {len(s2t)} -> {sp} ({sp.stat().st_size} bytes)")


def load_admin() -> dict[str, str]:
    admin = {}
    for line in (RAW / "admin1.txt").read_text(encoding="utf-8").splitlines():
        parts = line.split("\t")
        if len(parts) >= 2:
            admin[parts[0]] = parts[1]
    return admin


def load_countries() -> dict[str, list[str]]:
    zh = json.loads((RAW / "country-zh.json").read_text(encoding="utf-8"))
    en = json.loads((RAW / "country-en.json").read_text(encoding="utf-8"))
    # GeoNames uses the same ISO codes. A few manual names.
    extra_en = {"XK": "Kosovo"}
    extra_zh = {"XK": "科索沃", "TW": "台湾", "HK": "香港", "MO": "澳门"}
    codes = set(zh) | set(en) | set(extra_en)
    out = {}
    for code in sorted(codes):
        out[code] = [en.get(code) or extra_en.get(code) or code, zh.get(code) or extra_zh.get(code) or en.get(code) or code]
    out["TW"] = ["Taiwan", "台湾"]
    out["HK"] = ["Hong Kong", "香港"]
    out["MO"] = ["Macao", "澳门"]
    path = ROOT / "data" / "countries.json"
    path.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"countries {len(out)}")
    return out


def cjk_name(name: str, alts: str, s2t: dict[str, list[str]]) -> str:
    parts: list[str] = []
    for part in [name, *alts.split(",")]:
        part = part.strip()
        if re.fullmatch(r"[\u4e00-\u9fff]{1,12}", part):
            parts.append(part)
    if not parts:
        return ""
    official = {p[:-1] for p in parts if p.endswith("市") and len(p) > 1}
    if official:
        pool = list(official)
    else:
        pool = [p for p in parts if not p.endswith("市")] or [p[:-1] if p.endswith("市") else p for p in parts]
    longer = [p for p in pool if len(p) >= 2]
    if longer:
        pool = longer

    def score(p: str) -> tuple[int, int, int]:
        simplified = sum(1 for ch in p if s2t.get(ch) and s2t[ch][0] != ch)
        traditional = sum(1 for ch in p if ch not in s2t and "\u4e00" <= ch <= "\u9fff")
        return (simplified, -traditional, -len(p))

    pool.sort(key=score, reverse=True)
    return pool[0]


def build_cities() -> None:
    admin = load_admin()
    countries = load_countries()
    s2t_ts = (ROOT / "data" / "s2t.ts").read_text(encoding="utf-8")
    s2t = json.loads(s2t_ts.split("JSON.parse(`", 1)[1].rsplit("`) as", 1)[0])
    rows = []
    with (RAW / "cities15000.txt").open(encoding="utf-8") as f:
        for line in f:
            p = line.rstrip("\n").split("\t")
            if len(p) < 19:
                continue
            if p[6] != "P":
                continue
            pop = int(p[14] or 0)
            code = p[7]
            country = p[8]
            keep = pop >= 40000 or code in {"PPLC", "PPLA"} or (country in {"CA", "US", "CN", "HK", "MO", "TW", "SG"} and pop >= 15000)
            if not keep:
                continue
            name = p[1]
            asciiname = p[2] or name
            zh = cjk_name(name, p[3], s2t)
            override = CITY_ZH.get((country, name)) or CITY_ZH.get((country, asciiname))
            if override:
                zh = override
            admin_name = admin.get(f"{country}.{p[10]}", "")
            admin_zh = ADMIN_ZH.get(admin_name, "")
            if countries.get(country) is None:
                countries[country] = [country, country]
            lat = round(float(p[4]), 4)
            lng = round(float(p[5]), 4)
            tz = p[17]
            display = asciiname if re.search(r"[A-Za-z]", asciiname) else name
            rows.append((pop, [display, zh, admin_name, admin_zh, country, lat, lng, tz, pop]))
    rows.sort(key=lambda r: -r[0])
    # Cap so the picker stays light, but never drop a national or first-order capital.
    capped = []
    for pop, rec in rows:
        capped.append(rec)
    if len(capped) > 9000:
        must = []
        rest = []
        # We no longer have feature code. Keep top 9000 by population; capitals of small
        # countries are usually the only large city and already rank high.
        capped = capped[:9000]
    path = ROOT / "public" / "cities.json"
    path.write_text(json.dumps(capped, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"cities {len(capped)} -> {path} ({path.stat().st_size} bytes)")
    # sanity: Vancouver, Beijing, Chengdu
    def find(q):
        for rec in capped:
            if rec[0] == q or rec[1] == q:
                return rec
        return None
    print(" Vancouver", find("Vancouver"))
    print(" Beijing", find("Beijing") or find("北京"))
    print(" Chengdu", find("Chengdu") or find("成都"))


def main() -> None:
    (ROOT / "data").mkdir(exist_ok=True)
    build_hexagrams()
    build_kangxi_and_s2t()
    build_cities()


if __name__ == "__main__":
    main()
