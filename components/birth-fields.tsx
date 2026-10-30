"use client";

import { CityPicker } from "@/components/city-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SHICHEN } from "@/lib/calendar";
import { useI18n } from "@/lib/i18n";
import type { BirthProfile, CalendarKind, City, Gender } from "@/lib/types";

export type ProfileDraft = Omit<BirthProfile, "birthCity" | "currentCity"> & {
  birthCity: City | null;
  currentCity: City | null;
};

export function emptyDraft(): ProfileDraft {
  return {
    surname: "",
    givenName: "",
    englishName: "",
    gender: "male",
    calendar: "solar",
    leapMonth: false,
    year: 1990,
    month: 8,
    day: 16,
    hour: 4,
    minute: 30,
    birthCity: null,
    currentCity: null,
    useTrueSolarTime: true,
    strokeOverrides: {},
  };
}

export function profileFromDraft(draft: ProfileDraft): BirthProfile | null {
  if (!draft.birthCity || !draft.currentCity) return null;
  if (!`${draft.surname}${draft.givenName}${draft.englishName}`.trim()) return null;
  return { ...draft, birthCity: draft.birthCity, currentCity: draft.currentCity };
}

export function BirthFields({
  value,
  onChange,
  showPlace,
  idPrefix,
}: {
  value: ProfileDraft;
  onChange: (next: ProfileDraft) => void;
  showPlace: boolean;
  idPrefix: string;
}) {
  const { tx } = useI18n();
  const set = (patch: Partial<ProfileDraft>) => onChange({ ...value, ...patch });
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={tx("姓", "Surname")}>
          <Input value={value.surname} onChange={(event) => set({ surname: event.target.value })} />
        </Field>
        <Field label={tx("名", "Given name")}>
          <Input value={value.givenName} onChange={(event) => set({ givenName: event.target.value })} />
        </Field>
        <Field label={tx("英文名", "English name")}>
          <Input value={value.englishName} onChange={(event) => set({ englishName: event.target.value })} />
        </Field>
      </div>
      <div className="flex flex-wrap gap-2">
        <Choice pressed={value.gender === "male"} onClick={() => set({ gender: "male" })}>
          {tx("男", "Male")}
        </Choice>
        <Choice pressed={value.gender === "female"} onClick={() => set({ gender: "female" })}>
          {tx("女", "Female")}
        </Choice>
        <Choice pressed={value.calendar === "solar"} onClick={() => set({ calendar: "solar", leapMonth: false })}>
          {tx("公历", "Solar")}
        </Choice>
        <Choice pressed={value.calendar === "lunar"} onClick={() => set({ calendar: "lunar" })}>
          {tx("农历", "Lunar")}
        </Choice>
      </div>
      {value.calendar === "lunar" ? (
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={value.leapMonth} onCheckedChange={(checked) => set({ leapMonth: checked })} />
          {tx("闰月", "Leap month")}
        </label>
      ) : null}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        <NumberField label={tx("年", "Year")} value={value.year} onChange={(year) => set({ year })} />
        <NumberField label={tx("月", "Month")} value={value.month} onChange={(month) => set({ month })} />
        <NumberField label={tx("日", "Day")} value={value.day} onChange={(day) => set({ day })} />
        <NumberField label={tx("时", "Hour")} value={value.hour} onChange={(hour) => set({ hour })} />
        <NumberField label={tx("分", "Minute")} value={value.minute} onChange={(minute) => set({ minute })} />
      </div>
      <div>
        <p className="mb-2 text-sm">{tx("或直接选时辰", "Or pick the double-hour")}</p>
        <div className="flex flex-wrap gap-1.5">
          {SHICHEN.map((item) => (
            <Choice
              key={item.name}
              pressed={value.hour === item.hour && value.minute === item.minute}
              onClick={() => set({ hour: item.hour, minute: item.minute })}
            >
              {item.name}
            </Choice>
          ))}
        </div>
      </div>
      <CityPicker
        id={`${idPrefix}-birth`}
        label={tx("出生地（用来校正真太阳时）", "Birthplace, used for true solar time")}
        value={value.birthCity}
        onChange={(birthCity) => set({ birthCity })}
      />
      {showPlace ? (
        <>
          <CityPicker
            id={`${idPrefix}-now`}
            label={tx("现在所在地（问事时辰、流日、方位）", "Where you live now: question hour, day, directions")}
            value={value.currentCity}
            onChange={(currentCity) => set({ currentCity })}
          />
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={value.useTrueSolarTime} onCheckedChange={(checked) => set({ useTrueSolarTime: checked })} />
            {tx("按出生地经度计算真太阳时", "Correct the birth time to true solar time")}
          </label>
        </>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <Field label={label}>
      <Input
        inputMode="numeric"
        value={String(value)}
        onChange={(event) => onChange(Number(event.target.value.replace(/[^\d-]/g, "")) || 0)}
      />
    </Field>
  );
}

function Choice({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={pressed ? "bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm" : "bg-muted rounded-full px-3 py-1 text-sm"}
    >
      {children}
    </button>
  );
}

export function genderLabel(gender: Gender, zh: boolean): string {
  if (zh) return gender === "male" ? "男" : "女";
  return gender === "male" ? "Male" : "Female";
}

export function calendarLabel(calendar: CalendarKind, zh: boolean): string {
  if (zh) return calendar === "solar" ? "公历" : "农历";
  return calendar === "solar" ? "Solar" : "Lunar";
}
