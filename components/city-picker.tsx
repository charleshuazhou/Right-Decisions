"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { cityTitle, loadCities, searchCities } from "@/lib/cities";
import { useI18n } from "@/lib/i18n";
import type { City } from "@/lib/types";

export function CityPicker({
  label,
  value,
  onChange,
  id,
}: {
  label: string;
  value: City | null;
  onChange: (city: City) => void;
  id: string;
}) {
  const { locale, tx } = useI18n();
  const [query, setQuery] = useState("");
  const [cities, setCities] = useState<City[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    loadCities()
      .then((rows) => {
        if (alive) setCities(rows);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const results = cities ? searchCities(cities, query) : [];

  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm">
        {label}
      </label>
      {value ? (
        <button
          type="button"
          className="bg-muted rounded-lg px-3 py-2 text-left text-sm"
          onClick={() => onChange(value)}
        >
          {cityTitle(value, locale)}
          <span className="text-muted-foreground block text-xs">
            {value.latitude.toFixed(2)}, {value.longitude.toFixed(2)} · {value.timeZone}
          </span>
        </button>
      ) : null}
      <Input
        id={id}
        value={query}
        placeholder={tx("搜索城市、省份或国家", "Search city, region, or country")}
        onChange={(event) => setQuery(event.target.value)}
      />
      {error ? <p className="text-destructive text-xs">{tx("城市列表没有载入。", "The city list did not load.")}</p> : null}
      {query && results.length > 0 ? (
        <ul className="max-h-56 overflow-auto rounded-lg border border-border bg-card">
          {results.map((city) => (
            <li key={`${city.country}-${city.name}-${city.admin}-${city.latitude}`}>
              <button
                type="button"
                className="hover:bg-muted w-full px-3 py-2 text-left text-sm"
                onClick={() => {
                  onChange(city);
                  setQuery("");
                }}
              >
                {cityTitle(city, locale)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {query && cities && results.length === 0 ? (
        <p className="text-muted-foreground text-xs">{tx("没有匹配的城市。", "No matching city.")}</p>
      ) : null}
    </div>
  );
}
