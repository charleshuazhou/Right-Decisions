"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { BirthFields, emptyDraft, profileFromDraft, type ProfileDraft } from "@/components/birth-fields";
import { Page } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cityTitle, SAMPLE_BIRTH_CITY, SAMPLE_CURRENT_CITY } from "@/lib/cities";
import { useI18n } from "@/lib/i18n";
import { pendingReminders } from "@/lib/review";
import { createReading } from "@/lib/create-reading";
import { emptyPractical, loadHistory, loadProfile, saveDraft, type QuestionDraft } from "@/lib/storage";
import { CATEGORIES, METHODS, type CategoryId, type MethodId } from "@/lib/types";

const CATEGORY_TEXT: Record<CategoryId, [string, string]> = {
  general: ["综合", "General"],
  career: ["事业", "Career"],
  investment: ["投资", "Investment"],
  relationship: ["关系", "Relationship"],
  property: ["房产", "Property"],
  health: ["健康", "Health"],
  travel: ["出行", "Travel"],
};

const METHOD_TEXT: Record<MethodId, [string, string]> = {
  iching: ["易经", "I Ching"],
  ziwei: ["紫微", "Zi Wei"],
  bazi: ["八字", "Ba Zi"],
  meihua: ["梅花", "Plum Blossom"],
  qimen: ["奇门", "Qi Men"],
};

export function AskScreen() {
  const router = useRouter();
  const { locale, tx } = useI18n();
  const [profileReady, setProfileReady] = useState(false);
  const [reminders, setReminders] = useState(0);
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState<CategoryId>("general");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [methods, setMethods] = useState<MethodId[]>(["iching", "ziwei", "bazi"]);
  const [practical, setPractical] = useState(emptyPractical());
  const [openPractical, setOpenPractical] = useState(false);
  const [withOther, setWithOther] = useState(false);
  const [other, setOther] = useState<ProfileDraft>(emptyDraft());
  const [error, setError] = useState("");

  useEffect(() => {
    setProfileReady(Boolean(loadProfile()));
    setReminders(pendingReminders(loadHistory(), new Date()).length);
  }, []);

  function toggleMethod(method: MethodId) {
    setMethods((current) => (current.includes(method) ? current.filter((item) => item !== method) : [...current, method]));
  }

  function submit() {
    const profile = loadProfile();
    if (!profile) {
      setError(tx("先把生辰和现居地存进档案。", "Save a birth profile and current city first."));
      return;
    }
    if (!question.trim()) {
      setError(tx("先写下要决定的事。", "Write the decision first."));
      return;
    }
    if (methods.length === 0) {
      setError(tx("至少选一种方法。", "Pick at least one method."));
      return;
    }
    let counterpart = null;
    if (withOther) {
      const parsed = profileFromDraft({ ...other, currentCity: other.birthCity });
      if (!parsed) {
        setError(tx("对方的姓名、生辰和出生地还没填完。", "The other person's name, birth time, and birthplace are incomplete."));
        return;
      }
      counterpart = parsed;
    }
    const draft: QuestionDraft = {
      question,
      category,
      options,
      methods,
      practical,
      counterpart,
    };
    setError("");
    if (methods.includes("iching")) {
      saveDraft(draft);
      router.push("/cast");
      return;
    }
    try {
      const record = createReading(draft, profile, null);
      router.push(`/reading/${record.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : tx("排盘没有完成。", "The chart could not be built."));
    }
  }

  return (
    <Page>
      <div className="grid gap-6">
        {reminders > 0 ? (
          <button type="button" className="rounded-lg border border-primary/40 bg-card px-4 py-3 text-left text-sm" onClick={() => router.push("/review")}>
            {tx(`有 ${reminders} 条决定到了复盘的日子。`, `${reminders} decision${reminders > 1 ? "s are" : " is"} due for review.`)}
          </button>
        ) : null}
        <section className="grid gap-2">
          <p className="text-primary font-serif text-sm tracking-[0.2em]">{tx("把决定摊开", "Lay the decision out")}</p>
          <h1 className="font-serif text-4xl leading-tight sm:text-5xl">{tx("问一件具体的事。", "Ask one concrete thing.")}</h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-6">
            {tx(
              "生辰八字、姓名和现居地会跟易经、紫微、梅花或奇门放在一起。模型负责把象征说成人话；没有密钥时，仍然用卦辞和命盘整理一则阅读。",
              "Your pillars, name, and current city sit with the I Ching, Zi Wei, Plum Blossom, or Qi Men. A model turns the symbols into advice; without a key, the app still writes a reading from the texts.",
            )}
          </p>
        </section>
        {!profileReady ? (
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl">{tx("先留下生辰", "Start with the birth details")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <p className="text-muted-foreground text-sm">
                {tx("姓名、性别、公历或农历、时辰、出生地和现在所在的城市。档案只存在这台浏览器里。", "Name, gender, solar or lunar date, hour, birthplace, and where you live now. The profile stays in this browser.")}
              </p>
              <div>
                <Button onClick={() => router.push("/profile")}>{tx("填写生辰", "Enter birth details")}</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <ProfileStrip />
        )}
        <Card>
          <CardContent className="grid gap-4 pt-1">
            <Textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={4}
              placeholder={tx("例如：我该不该接这份温哥华的工作？", "For example: Should I take this job in Vancouver?")}
              className="font-serif min-h-28 text-lg"
            />
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={category === item}
                  className={category === item ? "bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm" : "bg-muted rounded-full px-3 py-1 text-sm"}
                  onClick={() => setCategory(item)}
                >
                  {tx(CATEGORY_TEXT[item][0], CATEGORY_TEXT[item][1])}
                </button>
              ))}
            </div>
            <div className="grid gap-2">
              <p className="text-sm">{tx("正在比较的选项，可留空", "Options you are weighing, optional")}</p>
              {options.map((option, index) => (
                <Input
                  key={index}
                  value={option}
                  placeholder={tx(`选项 ${index + 1}`, `Option ${index + 1}`)}
                  onChange={(event) => setOptions(options.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))}
                />
              ))}
              <div>
                <Button variant="outline" size="sm" onClick={() => setOptions([...options, ""])}>
                  {tx("再加一个选项", "Add an option")}
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {METHODS.map((method) => (
                <button
                  key={method}
                  type="button"
                  aria-pressed={methods.includes(method)}
                  className={methods.includes(method) ? "bg-foreground text-background rounded-full px-3 py-1 text-sm" : "bg-muted rounded-full px-3 py-1 text-sm"}
                  onClick={() => toggleMethod(method)}
                >
                  {tx(METHOD_TEXT[method][0], METHOD_TEXT[method][1])}
                </button>
              ))}
            </div>
            <button type="button" className="text-left text-sm underline-offset-4 hover:underline" onClick={() => setOpenPractical((open) => !open)}>
              {tx("预算、期限、风险和直觉", "Budget, deadline, risk, and gut feeling")}
            </button>
            {openPractical ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  value={practical.budget}
                  placeholder={tx("预算，例如 4 万加元", "Budget, for example CAD 40,000")}
                  onChange={(event) => setPractical({ ...practical, budget: event.target.value })}
                />
                <Input type="date" value={practical.deadline} onChange={(event) => setPractical({ ...practical, deadline: event.target.value })} />
                <div className="flex gap-1.5">
                  {(["low", "medium", "high"] as const).map((risk) => (
                    <button
                      key={risk}
                      type="button"
                      className={practical.risk === risk ? "bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm" : "bg-muted rounded-full px-3 py-1 text-sm"}
                      onClick={() => setPractical({ ...practical, risk })}
                    >
                      {risk === "low" ? tx("低风险", "Low risk") : risk === "medium" ? tx("中等", "Medium") : tx("高风险", "High risk")}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  {(["yes", "unsure", "no"] as const).map((gut) => (
                    <button
                      key={gut}
                      type="button"
                      className={practical.gut === gut ? "bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm" : "bg-muted rounded-full px-3 py-1 text-sm"}
                      onClick={() => setPractical({ ...practical, gut })}
                    >
                      {gut === "yes" ? tx("想做", "Leaning yes") : gut === "no" ? tx("不想", "Leaning no") : tx("说不上", "Unsure")}
                    </button>
                  ))}
                </div>
                <Textarea
                  className="sm:col-span-2"
                  value={practical.gutNote}
                  placeholder={tx("直觉背后的那句话", "The sentence behind the gut feeling")}
                  onChange={(event) => setPractical({ ...practical, gutNote: event.target.value })}
                />
              </div>
            ) : null}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={withOther} onChange={(event) => setWithOther(event.target.checked)} />
              {tx("这件事还牵涉另一个人", "Another person is part of this decision")}
            </label>
            {withOther ? (
              <div className="rounded-xl border border-border p-3">
                <BirthFields value={other} onChange={setOther} showPlace={false} idPrefix="other" />
                <p className="text-muted-foreground mt-2 text-xs">
                  {locale === "zh" ? "对方不需要现居地。合盘用双方的八字和紫微。" : "They do not need a current city. The comparison uses both Ba Zi and Zi Wei charts."}
                </p>
              </div>
            ) : null}
            {error ? (
              <p role="alert" className="border-primary text-primary rounded-lg border bg-card px-3 py-2 text-sm">
                {error}
              </p>
            ) : null}
            <div>
              <Button size="lg" className="h-10 px-4" onClick={submit}>
                {methods.includes("iching") ? tx("去起卦", "Cast the hexagram") : tx("生成解读", "Build the reading")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}

function ProfileStrip() {
  const { locale, tx } = useI18n();
  const profile = loadProfile();
  if (!profile) return null;
  const name = `${profile.surname}${profile.givenName}`.trim() || profile.englishName;
  return (
    <p className="text-muted-foreground text-sm">
      {name} · {cityTitle(profile.currentCity, locale)} ·{" "}
      <a className="underline-offset-4 hover:underline" href="/profile">
        {tx("改档案", "Edit profile")}
      </a>
    </p>
  );
}
