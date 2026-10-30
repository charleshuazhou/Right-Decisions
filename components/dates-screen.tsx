"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Page } from "@/components/site-chrome";
import { recommendDates } from "@/lib/almanac";
import { computeBirth } from "@/lib/birth";
import { nowInTimeZone } from "@/lib/calendar";
import { useI18n } from "@/lib/i18n";
import { loadProfile } from "@/lib/storage";
import type { ActivityId, AuspiciousDate, BirthProfile } from "@/lib/types";

const ACTIVITIES: ActivityId[] = ["sign", "move", "open", "travel", "meet", "general"];
const LABELS: Record<ActivityId, [string, string]> = {
  sign: ["签约", "Signing"],
  move: ["搬家", "Moving"],
  open: ["开业", "Opening"],
  travel: ["出行", "Travel"],
  meet: ["见面", "Meeting"],
  general: ["一般事务", "General"],
};

export function DatesScreen() {
  const { tx } = useI18n();
  const [profile, setProfile] = useState<BirthProfile | null | undefined>(undefined);
  const [activity, setActivity] = useState<ActivityId>("sign");
  const [dates, setDates] = useState<AuspiciousDate[]>([]);

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  useEffect(() => {
    if (!profile) return;
    try {
      const now = nowInTimeZone(profile.currentCity.timeZone, new Date());
      const birth = computeBirth(profile, now);
      setDates(recommendDates(now, activity, birth.bazi, 60, 8));
    } catch {
      setDates([]);
    }
  }, [profile, activity]);

  if (profile === undefined) return <Page><p className="text-sm">{tx("正在看黄历。", "Checking the almanac.")}</p></Page>;
  if (!profile) {
    return (
      <Page>
        <h1 className="font-serif text-3xl">{tx("择日", "Choosing a day")}</h1>
        <p className="text-muted-foreground mt-2 text-sm">{tx("择日要对照你的日柱和喜用，先保存生辰。", "Dates are scored against your day pillar and useful elements. Save a profile first.")}</p>
        <Link href="/profile" className="mt-3 inline-block text-sm underline">{tx("去填写", "Enter it")}</Link>
      </Page>
    );
  }

  return (
    <Page>
      <h1 className="font-serif text-3xl">{tx("择日", "Choosing a day")}</h1>
      <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-6">
        {tx(
          `按${profile.currentCity.nameZh || profile.currentCity.name}的日期，往后看 60 天。宜忌来自黄历，另外避开与你年支、日支相冲的日子，并给喜用日干加分。`,
          `Looking 60 days ahead from dates in ${profile.currentCity.name}. Almanac terms, clashes with your year and day branches, and the day's stem are all scored.`,
        )}
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {ACTIVITIES.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={activity === item}
            className={activity === item ? "bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm" : "bg-muted rounded-full px-3 py-1 text-sm"}
            onClick={() => setActivity(item)}
          >
            {tx(LABELS[item][0], LABELS[item][1])}
          </button>
        ))}
      </div>
      <ul className="mt-4 grid gap-2">
        {dates.length === 0 ? <li className="text-sm">{tx("这 60 天里没有足够干净的日子。", "No day in these 60 scores cleanly enough.")}</li> : null}
        {dates.map((item) => (
          <li key={`${item.year}-${item.month}-${item.day}`} className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
            <p className="font-serif text-lg">
              {item.year}-{String(item.month).padStart(2, "0")}-{String(item.day).padStart(2, "0")} {item.ganZhi}
            </p>
            <p className="text-muted-foreground text-xs">{item.lunarText} · {item.zhiXing}</p>
            <p className="mt-1">{item.reasons.map((reason) => (tx(reason.zh, reason.en))).join(" · ")}</p>
            {item.hours.length ? <p className="text-xs">{tx("时辰", "Hours")} {item.hours.join("、")}</p> : null}
          </li>
        ))}
      </ul>
    </Page>
  );
}
