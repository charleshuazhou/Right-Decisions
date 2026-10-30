import countries from "@/data/countries.json";

import type { City } from "@/lib/types";

type Row = [string, string, string, string, string, number, number, string, number];
const countryNames = countries as unknown as Record<string, [string, string]>;

export function rowToCity(row: Row): City {
  const names = countryNames[row[4]] ?? [row[4], row[4]];
  return {
    name: row[0],
    nameZh: row[1] || "",
    admin: row[2] || "",
    adminZh: row[3] || "",
    country: row[4],
    countryName: names[0],
    countryNameZh: names[1],
    latitude: row[5],
    longitude: row[6],
    timeZone: row[7],
  };
}

let cache: City[] | null = null;
let pending: Promise<City[]> | null = null;

export function loadCities(): Promise<City[]> {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    pending = fetch("/cities.json")
      .then((response) => {
        if (!response.ok) throw new Error("cities");
        return response.json() as Promise<Row[]>;
      })
      .then((rows) => {
        cache = rows.map(rowToCity);
        return cache;
      });
  }
  return pending;
}

export function searchCities(cities: City[], query: string): City[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const scored = cities.flatMap((city) => {
    const fields = [city.name, city.nameZh, city.admin, city.adminZh, city.countryName, city.countryNameZh, city.country]
      .join(" ")
      .toLowerCase();
    if (!fields.includes(needle)) return [];
    const lead = city.name.toLowerCase().startsWith(needle) || city.nameZh.toLowerCase().startsWith(needle);
    return [{ city, lead }];
  });
  scored.sort((a, b) => Number(b.lead) - Number(a.lead));
  return scored.slice(0, 12).map((item) => item.city);
}

export function cityTitle(city: City, locale: "zh" | "en"): string {
  if (locale === "en") return [city.name, city.admin, city.countryName].filter(Boolean).join(", ");
  return [city.nameZh || city.name, city.adminZh || city.admin, city.countryNameZh || city.countryName].filter(Boolean).join(" · ");
}

export const SAMPLE_BIRTH_CITY: City = {
  name: "Chengdu",
  nameZh: "成都",
  admin: "Sichuan",
  adminZh: "四川",
  country: "CN",
  countryName: "China",
  countryNameZh: "中国",
  latitude: 30.6667,
  longitude: 104.0667,
  timeZone: "Asia/Shanghai",
};

export const SAMPLE_CURRENT_CITY: City = {
  name: "Vancouver",
  nameZh: "温哥华",
  admin: "British Columbia",
  adminZh: "不列颠哥伦比亚",
  country: "CA",
  countryName: "Canada",
  countryNameZh: "加拿大",
  latitude: 49.2497,
  longitude: -123.1193,
  timeZone: "America/Vancouver",
};
