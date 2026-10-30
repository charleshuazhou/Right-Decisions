"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Page } from "@/components/site-chrome";
import { useI18n } from "@/lib/i18n";
import { methodAccuracy, pendingReminders, type AccuracyBucket } from "@/lib/review";
import { loadHistory } from "@/lib/storage";
import { METHODS, type MethodId, type ReadingRecord } from "@/lib/types";

const NAMES: Record<MethodId, [string, string]> = {
  iching: ["易经", "I Ching"],
  ziwei: ["紫微", "Zi Wei"],
  bazi: ["八字", "Ba Zi"],
  meihua: ["梅花", "Plum Blossom"],
  qimen: ["奇门", "Qi Men"],
};

export function ReviewScreen() {
  const { tx } = useI18n();
  const [records, setRecords] = useState<ReadingRecord[]>([]);
  const [due, setDue] = useState<ReadingRecord[]>([]);

  useEffect(() => {
    const history = loadHistory();
    setRecords(history);
    setDue(pendingReminders(history, new Date()));
  }, []);

  const stats = methodAccuracy(records);
  const reviewed = records.filter((record) => record.outcome).length;

  return (
    <Page>
      <h1 className="font-serif text-3xl">{tx("复盘", "Review")}</h1>
      <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-6">
        {tx(
          "「偏可为」对上后来顺利，或「宜缓」对上后来不顺，记一次说对。两边都含糊的不计入。样本少的时候，这只是你自己的记录，不是方法的胜率。",
          "A yes-lean that later went well, or a wait-lean that later did not, counts as a hit. Mixed calls are left out. With few notes, this is your record, not a win rate for the method.",
        )}
      </p>
      {due.length ? (
        <ul className="mt-4 grid gap-2">
          {due.map((record) => (
            <li key={record.id}>
              <Link href={`/reading/${record.id}`} className="block rounded-lg border border-primary/40 px-3 py-2 text-sm">
                {tx("该写结果了：", "Time to note the outcome: ")}
                {record.question}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {reviewed === 0 ? (
        <p className="mt-6 text-sm">{tx("还没有记下任何结果。打开一则解读，在页底写下后来发生了什么。", "No outcomes yet. Open a reading and write what happened at the bottom.")}</p>
      ) : (
        <table className="mt-6 w-full text-left text-sm">
          <thead className="text-muted-foreground text-xs">
            <tr>
              <th className="py-2">{tx("方法", "Method")}</th>
              <th>{tx("说对", "Hits")}</th>
              <th>{tx("没说对", "Misses")}</th>
              <th>{tx("不计", "Unclear")}</th>
            </tr>
          </thead>
          <tbody>
            {METHODS.map((method) => (
              <tr key={method} className="border-t border-border">
                <td className="py-2">{tx(NAMES[method][0], NAMES[method][1])}</td>
                <Count cell={stats[method]} />
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Page>
  );
}

function Count({ cell }: { cell: AccuracyBucket }) {
  return (
    <>
      <td>{cell.hit}</td>
      <td>{cell.miss}</td>
      <td>{cell.unclear}</td>
    </>
  );
}
