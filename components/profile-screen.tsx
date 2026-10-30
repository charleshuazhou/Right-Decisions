"use client";

import { useEffect, useMemo, useState } from "react";

import { BirthFields, emptyDraft, profileFromDraft, type ProfileDraft } from "@/components/birth-fields";
import { BaziPanel, NamePanel, ZiweiBoard } from "@/components/charts";
import { Page } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { computeBirth } from "@/lib/birth";
import { nowInTimeZone, formatCivil } from "@/lib/calendar";
import { SAMPLE_BIRTH_CITY, SAMPLE_CURRENT_CITY } from "@/lib/cities";
import { useI18n } from "@/lib/i18n";
import { resolveChar } from "@/lib/name";
import { loadProfile, saveProfile } from "@/lib/storage";

export function ProfileScreen() {
  const { tx } = useI18n();
  const [draft, setDraft] = useState<ProfileDraft>(emptyDraft());
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const stored = loadProfile();
    if (stored) setDraft(stored);
  }, []);

  const preview = useMemo(() => {
    const profile = profileFromDraft(draft);
    if (!profile) return null;
    try {
      return { birth: computeBirth(profile, nowInTimeZone(profile.currentCity.timeZone, new Date())) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "invalid-date" };
    }
  }, [draft]);

  function fillSample() {
    setDraft({
      ...emptyDraft(),
      surname: "陈",
      givenName: "明",
      englishName: "Chen Ming",
      gender: "male",
      calendar: "solar",
      year: 1990,
      month: 8,
      day: 16,
      hour: 4,
      minute: 30,
      birthCity: SAMPLE_BIRTH_CITY,
      currentCity: SAMPLE_CURRENT_CITY,
      useTrueSolarTime: true,
    });
    setSaved(false);
  }

  function save() {
    const profile = profileFromDraft(draft);
    if (!profile || (preview && "error" in preview)) return;
    saveProfile(profile);
    setSaved(true);
  }

  const characters = `${draft.surname}${draft.givenName}`.trim();

  return (
    <Page>
      <div className="grid gap-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl">{tx("生辰与所在地", "Birth and where you live")}</h1>
            <p className="text-muted-foreground mt-1 max-w-xl text-sm leading-6">
              {tx(
                "出生地只用于真太阳时。现在的城市用于问事的时辰、流日和方位。档案保存在这台浏览器。",
                "Birthplace is only for true solar time. The city you live in sets the hour of the question, the day pillar, and directions. The profile stays in this browser.",
              )}
            </p>
          </div>
          <Button variant="outline" onClick={fillSample}>
            {tx("填入示例", "Fill an example")}
          </Button>
        </div>
        <Card>
            <CardContent className="grid gap-4">
              <BirthFields value={draft} onChange={(next) => { setDraft(next); setSaved(false); }} showPlace idPrefix="self" />
              {characters ? (
                <div className="grid gap-2">
                  <p className="text-sm">{tx("康熙笔画。简体会计入对应繁体。不对就改数字。", "Kangxi strokes. Simplified characters use the traditional form. Edit a number if it is the wrong character.")}</p>
                  <div className="flex flex-wrap gap-2">
                    {[...characters].map((char) => {
                      const info = resolveChar(char, draft.strokeOverrides);
                      return (
                        <label key={char} className="grid gap-1 text-xs">
                          {char}
                          {info.alternatives.length > 1 ? ` / ${info.alternatives.join(" ")}` : ""}
                          <Input
                            className="w-20"
                            value={String(draft.strokeOverrides[char] ?? info.strokes ?? "")}
                            onChange={(event) => {
                              const strokes = Number(event.target.value);
                              setDraft({
                                ...draft,
                                strokeOverrides: Number.isFinite(strokes) && event.target.value !== ""
                                  ? { ...draft.strokeOverrides, [char]: strokes }
                                  : Object.fromEntries(Object.entries(draft.strokeOverrides).filter(([key]) => key !== char)),
                              });
                            }}
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              <div className="flex items-center gap-3">
                <Button onClick={save} disabled={!profileFromDraft(draft) || Boolean(preview && "error" in preview)}>
                  {tx("保存档案", "Save profile")}
                </Button>
                {saved ? <span className="text-sm">{tx("已保存。", "Saved.")}</span> : null}
              </div>
            </CardContent>
          </Card>
        {preview && "error" in preview ? <p className="text-primary text-sm">{tx("这个日期排不出来，检查闰月或日数。", "That date could not be converted. Check the leap month and the day.")}</p> : null}
        {preview && "birth" in preview && preview.birth ? (
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-xl">{tx("四柱", "Four pillars")}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <p className="text-muted-foreground text-sm">
                  {tx("真太阳时", "True solar time")} {formatCivil(preview.birth.corrected)} · {preview.birth.hourName} · {preview.birth.lunarText}
                  {preview.birth.trueSolarApplied ? ` · ${tx("校正", "correction")} ${preview.birth.correctionMinutes} ${tx("分钟", "min")}` : ""}
                </p>
                <BaziPanel chart={preview.birth.bazi} />
              </CardContent>
            </Card>
            {preview.birth.name ? (
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-xl">{tx("姓名", "Name")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <NamePanel analysis={preview.birth.name} />
                </CardContent>
              </Card>
            ) : null}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-xl">{tx("紫微", "Zi Wei")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ZiweiBoard chart={preview.birth.ziwei} />
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </Page>
  );
}
