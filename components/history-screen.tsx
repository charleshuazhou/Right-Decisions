"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { LeanBadge } from "@/components/charts";
import { Page } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { deleteReading, loadHistory } from "@/lib/storage";
import type { ReadingRecord } from "@/lib/types";

export function HistoryScreen() {
  const { tx } = useI18n();
  const [records, setRecords] = useState<ReadingRecord[]>([]);

  useEffect(() => {
    setRecords(loadHistory());
  }, []);

  if (records.length === 0) {
    return (
      <Page>
        <h1 className="font-serif text-3xl">{tx("记录", "History")}</h1>
        <p className="text-muted-foreground mt-2 text-sm">{tx("还没有保存的解读。问过的事会留在这台浏览器。", "No readings yet. Questions you ask stay in this browser.")}</p>
        <Link href="/" className="mt-4 inline-block text-sm underline">{tx("去问一件事", "Ask something")}</Link>
      </Page>
    );
  }

  return (
    <Page>
      <h1 className="font-serif text-3xl">{tx("记录", "History")}</h1>
      <ul className="mt-4 grid gap-3">
        {records.map((record) => (
          <li key={record.id} className="rounded-xl border border-border bg-card px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <Link href={`/reading/${record.id}`} className="font-serif text-lg hover:underline">
                  {record.question}
                </Link>
                <p className="text-muted-foreground text-xs">{new Date(record.createdAt).toLocaleString()}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  deleteReading(record.id);
                  setRecords(loadHistory());
                }}
              >
                {tx("删除", "Delete")}
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {record.computed.leans.map((lean) => (
                <span key={lean.method} className="flex items-center gap-1 text-xs">
                  {lean.method}
                  <LeanBadge lean={lean.lean} />
                </span>
              ))}
              {record.outcome ? <span className="text-xs">{record.outcome.result}</span> : null}
            </div>
          </li>
        ))}
      </ul>
    </Page>
  );
}
