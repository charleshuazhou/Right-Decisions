"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { BaziPanel, FengshuiPanel, HexagramBlock, LeanBadge, MeihuaPanel, NamePanel, QimenBoard, ZiweiBoard } from "@/components/charts";
import { Page } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { displayName } from "@/lib/birth";
import { formatCivil } from "@/lib/calendar";
import { offlineReading } from "@/lib/offline";
import { useI18n } from "@/lib/i18n";
import { loadReading, updateReading } from "@/lib/storage";
import type { ReadingRecord, StructuredReading } from "@/lib/types";

export function ReadingScreen({ id }: { id: string }) {
  const { tx } = useI18n();
  const [record, setRecord] = useState<ReadingRecord | null | undefined>(undefined);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    const loaded = loadReading(id);
    setRecord(loaded);
    if (!loaded || loaded.interpretation) return;
    let cancel = false;
    setAsking(true);
    const offline = offlineReading(loaded.question, loaded.options, loaded.practical, loaded.computed, loaded.questionLang);
    const failedNote = loaded.questionLang === "zh" ? "请求没有完成。" : "The request did not finish.";
    fetch("/api/interpret", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: loaded.question,
        options: loaded.options,
        practical: loaded.practical,
        computed: loaded.computed,
        language: loaded.questionLang,
        name: displayName(loaded.profile),
      }),
    })
      .then(async (response) => {
        const payload = (await response.json()) as { mode?: string; provider?: string; model?: string; reading?: Omit<StructuredReading, "mode" | "providerNote">; message?: string };
        if (cancel) return;
        if (payload.mode === "llm" && payload.reading) {
          const interpretation: StructuredReading = {
            ...offline,
            ...payload.reading,
            mode: "llm",
            providerNote: `${payload.provider ?? "llm"} · ${payload.model ?? ""}`.trim(),
          };
          setRecord(updateReading(loaded.id, { interpretation }));
        } else {
          const note = payload.mode === "unconfigured" ? offline.providerNote : `${offline.providerNote} ${payload.message ?? ""}`.trim();
          setRecord(updateReading(loaded.id, { interpretation: { ...offline, providerNote: note } }));
        }
      })
      .catch(() => {
        if (cancel) return;
        setRecord(updateReading(loaded.id, { interpretation: { ...offline, providerNote: `${offline.providerNote} ${failedNote}` } }));
      })
      .finally(() => {
        if (!cancel) setAsking(false);
      });
    return () => {
      cancel = true;
    };
  }, [id]);

  if (record === undefined) return <Page><p className="text-sm">{tx("正在打开这则记录。", "Opening this reading.")}</p></Page>;
  if (!record) {
    return (
      <Page>
        <p className="text-sm">{tx("这则记录不在这台浏览器里。", "This reading is not in this browser.")}</p>
        <Link href="/" className="mt-3 inline-block text-sm underline">{tx("回到问策", "Back to the question")}</Link>
      </Page>
    );
  }

  const reading = record.interpretation;
  const computed = record.computed;

  return (
    <Page>
      <div className="grid gap-5">
        <div>
          <p className="text-muted-foreground text-xs">{new Date(record.createdAt).toLocaleString()} · {formatCivil(computed.askedAt)} · {computed.place}</p>
          <h1 className="font-serif mt-1 text-3xl leading-snug">{record.question}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {computed.leans.map((lean) => (
              <span key={lean.method} className="flex items-center gap-1 text-xs">
                {lean.method}
                <LeanBadge lean={lean.lean} />
              </span>
            ))}
          </div>
        </div>
        {asking || !reading ? <p className="text-sm">{tx("正在整理解读。", "Composing the reading.")}</p> : <ReadingBody record={record} reading={reading} />}
        <ReviewBox record={record} onChange={setRecord} />
      </div>
    </Page>
  );
}

function ReadingBody({ record, reading }: { record: ReadingRecord; reading: StructuredReading }) {
  const { tx } = useI18n();
  const computed = record.computed;
  return (
    <Tabs defaultValue="reading">
      <TabsList className="flex h-auto w-full flex-wrap justify-start">
        <TabsTrigger value="reading">{tx("解读", "Reading")}</TabsTrigger>
        <TabsTrigger value="iching">{tx("易经", "I Ching")}</TabsTrigger>
        <TabsTrigger value="ziwei">{tx("紫微", "Zi Wei")}</TabsTrigger>
        <TabsTrigger value="bazi">{tx("八字", "Ba Zi")}</TabsTrigger>
        <TabsTrigger value="more">{tx("其他", "More")}</TabsTrigger>
        <TabsTrigger value="dates">{tx("择日", "Dates")}</TabsTrigger>
      </TabsList>
      <TabsContent value="reading" className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-2xl">{reading.verdictTitle}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm leading-7">
            <p className="text-muted-foreground text-xs">{reading.mode === "llm" ? reading.providerNote : reading.providerNote}</p>
            {reading.summary.split("\n\n").map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </CardContent>
        </Card>
        {reading.optionReadings.map((item) => (
          <Card key={item.option}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {item.option}
                <LeanBadge lean={item.lean} />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6">{item.comment}</CardContent>
          </Card>
        ))}
        <Section title={tx("风险", "Risks")} body={reading.risks.join("\n")} />
        <Section title={tx("时机", "Timing")} body={reading.timing} />
        <Section title={tx("方位", "Directions")} body={reading.directions} />
        <Section title={tx("下一步", "Next steps")} body={reading.nextSteps.join("\n")} />
        <Section title={tx("对照", "Cross-check")} body={reading.crossCheck} />
        <Section title={tx("现实条件", "Practical constraints")} body={reading.practical} />
        {reading.compatibility ? <Section title={tx("合盘", "Compatibility")} body={reading.compatibility} /> : null}
      </TabsContent>
      <TabsContent value="iching">
        {computed.iching ? <HexagramBlock cast={computed.iching} /> : <p className="text-sm">{tx("这次没有起卦。", "This reading has no hexagram.")}</p>}
      </TabsContent>
      <TabsContent value="ziwei">
        <ZiweiBoard chart={computed.birth.ziwei} />
      </TabsContent>
      <TabsContent value="bazi" className="grid gap-4">
        <p className="text-muted-foreground text-sm">
          {formatCivil(computed.birth.corrected)} · {computed.birth.hourName} · {computed.birth.lunarText}
        </p>
        <BaziPanel chart={computed.birth.bazi} />
        {computed.birth.name ? <NamePanel analysis={computed.birth.name} /> : <p className="text-sm">{tx("没有中文姓名，所以没有五格。", "No Chinese name, so there is no five-grid count.")}</p>}
      </TabsContent>
      <TabsContent value="more" className="grid gap-4">
        {computed.meihua ? <MeihuaPanel result={computed.meihua} /> : null}
        {computed.qimen ? <QimenBoard chart={computed.qimen} /> : null}
        <FengshuiPanel advice={computed.fengshui} />
        {computed.compatibility ? (
          <p className="text-sm leading-6">
            {computed.compatibility.score} · {computed.compatibility.points.map((item) => item.zh).join("；")}
          </p>
        ) : null}
      </TabsContent>
      <TabsContent value="dates" className="grid gap-2">
        {computed.dates.length === 0 ? <p className="text-sm">{tx("接下来一个半月没有同时避开冲、又合宜的日子。", "No day in the next six weeks is both clear of a clash and favored.")}</p> : null}
        {computed.dates.map((item) => (
          <div key={`${item.year}-${item.month}-${item.day}`} className="rounded-lg border border-border px-3 py-2 text-sm">
            <p className="font-serif">
              {item.year}-{item.month}-{item.day} {item.ganZhi}
            </p>
            <p className="text-muted-foreground text-xs">{item.lunarText}</p>
            <p>{item.reasons.map((reason) => reason.zh).join("；")}</p>
            {item.hours.length ? <p className="text-xs">{tx("可看的时辰", "Hours")} {item.hours.join("、")}</p> : null}
          </div>
        ))}
      </TabsContent>
    </Tabs>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  if (!body.trim()) return null;
  return (
    <section className="grid gap-1">
      <h2 className="font-serif text-lg">{title}</h2>
      {body.split("\n").filter(Boolean).map((line) => (
        <p key={line.slice(0, 40)} className="text-sm leading-6">{line}</p>
      ))}
    </section>
  );
}

function ReviewBox({ record, onChange }: { record: ReadingRecord; onChange: (record: ReadingRecord) => void }) {
  const { tx } = useI18n();
  const [note, setNote] = useState(record.outcome?.note ?? "");
  const [reminder, setReminder] = useState(record.reminderOn ?? "");

  function saveOutcome(result: "favorable" | "mixed" | "unfavorable") {
    const next = updateReading(record.id, {
      outcome: { result, note, recordedAt: new Date().toISOString() },
    });
    if (next) onChange(next);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-xl">{tx("后来怎么样", "What actually happened")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p className="text-muted-foreground text-sm">
          {tx("记下结果之后，复盘页会统计哪种方法更常说对。提醒只出现在这台浏览器里。", "After you record the outcome, the review page counts which method was right more often. The reminder stays in this browser.")}
        </p>
        <label className="grid gap-1 text-sm">
          {tx("提醒我回来写", "Remind me to write this down")}
          <input
            type="date"
            className="bg-card h-9 rounded-md border border-border px-2"
            value={reminder}
            onChange={(event) => {
              setReminder(event.target.value);
              const next = updateReading(record.id, { reminderOn: event.target.value });
              if (next) onChange(next);
            }}
          />
        </label>
        <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={tx("实际发生了什么", "What happened")} />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => saveOutcome("favorable")}>{tx("走得顺", "It went well")}</Button>
          <Button variant="outline" onClick={() => saveOutcome("mixed")}>{tx("不好说", "Mixed")}</Button>
          <Button variant="outline" onClick={() => saveOutcome("unfavorable")}>{tx("不顺", "It did not")}</Button>
        </div>
        {record.outcome ? <p className="text-sm">{tx("已记下。", "Recorded.")} {record.outcome.result}</p> : null}
      </CardContent>
    </Card>
  );
}
