"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { HexagramBlock } from "@/components/charts";
import { Page } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { castFromLines, randomCoins, throwCoins } from "@/lib/iching";
import { useI18n } from "@/lib/i18n";
import { createReading } from "@/lib/create-reading";
import { loadDraft, loadProfile, type QuestionDraft } from "@/lib/storage";
import type { CoinThrow } from "@/lib/types";

export function CastScreen() {
  const router = useRouter();
  const { tx } = useI18n();
  const [draft, setDraft] = useState<QuestionDraft | null>(null);
  const [lines, setLines] = useState<CoinThrow[]>([]);
  const [faces, setFaces] = useState<(2 | 3)[] | null>(null);
  const [tossing, setTossing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setDraft(loadDraft());
  }, []);

  function pushLine(coins: [2 | 3, 2 | 3, 2 | 3]) {
    setFaces(coins);
    setTossing(true);
    window.setTimeout(() => {
      setLines((current) => (current.length >= 6 ? current : [...current, throwCoins(coins)]));
      setTossing(false);
    }, 700);
  }

  function castAll() {
    if (tossing || lines.length >= 6) return;
    const sequence: [2 | 3, 2 | 3, 2 | 3][] = [];
    for (let index = lines.length; index < 6; index += 1) sequence.push(randomCoins());
    let cursor = 0;
    const step = () => {
      const coins = sequence[cursor];
      if (!coins) return;
      setFaces(coins);
      setTossing(true);
      window.setTimeout(() => {
        setLines((current) => (current.length >= 6 ? current : [...current, throwCoins(coins)]));
        setTossing(false);
        cursor += 1;
        if (cursor < sequence.length) window.setTimeout(step, 180);
      }, 650);
    };
    step();
  }

  function finish() {
    const profile = loadProfile();
    if (!draft || !profile || lines.length !== 6) return;
    try {
      const record = createReading(draft, profile, castFromLines(lines));
      router.push(`/reading/${record.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : tx("排盘没有完成。", "The chart could not be built."));
    }
  }

  const cast = lines.length === 6 ? castFromLines(lines) : null;

  return (
    <Page>
      <div className="grid gap-5">
        <div>
          <h1 className="font-serif text-3xl">{tx("三钱起卦", "Three-coin cast")}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {tx("从下往上，掷六次。正面为三，背面为二。六是老阴，九是老阳，都会变。", "Six throws, bottom line first. Heads count three, tails two. Six and nine change.")}
          </p>
          {draft ? <p className="font-serif mt-3 text-lg">{draft.question}</p> : <p className="mt-3 text-sm">{tx("没有待起的问题。", "There is no question waiting to be cast.")}</p>}
        </div>
        <div className="flex items-end gap-4">
          <div className="flex gap-2">
            {(faces ?? [3, 3, 3]).map((face, index) => (
              <span key={index} className={tossing ? "coin toss" : "coin"}>
                {face === 3 ? tx("字", "3") : tx("背", "2")}
              </span>
            ))}
          </div>
          <div className="grid gap-2">
            <Button disabled={!draft || tossing || lines.length >= 6} onClick={() => pushLine(randomCoins())}>
              {tx("掷一次", "Toss once")}
            </Button>
            <Button variant="outline" disabled={!draft || tossing || lines.length >= 6} onClick={castAll}>
              {tx("替我起卦", "Cast for me")}
            </Button>
          </div>
        </div>
        <ol className="grid gap-1">
          {lines.map((line, index) => (
            <li key={index} className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground w-10">{tx(`第${index + 1}爻`, `Line ${index + 1}`)}</span>
              <span className={line.yang ? "bg-foreground h-1.5 w-24" : "flex w-24 justify-between"}>
                {line.yang ? null : (
                  <>
                    <span className="bg-foreground h-1.5 w-10" />
                    <span className="bg-foreground h-1.5 w-10" />
                  </>
                )}
              </span>
              <span>
                {line.sum}
                {line.changing ? tx(" 变", " changing") : ""}
              </span>
            </li>
          ))}
        </ol>
        <ManualLines
          onAccept={(next) => {
            setLines(next);
            setFaces(next[5]?.coins ?? null);
          }}
        />
        {cast ? <HexagramBlock cast={cast} /> : null}
        {error ? <p className="text-primary text-sm">{error}</p> : null}
        <div>
          <Button disabled={!cast || tossing} onClick={finish}>
            {tx("看解读", "Read it")}
          </Button>
        </div>
      </div>
    </Page>
  );
}

function ManualLines({ onAccept }: { onAccept: (lines: CoinThrow[]) => void }) {
  const { tx } = useI18n();
  const [open, setOpen] = useState(false);
  const [sums, setSums] = useState<[6 | 7 | 8 | 9, 6 | 7 | 8 | 9, 6 | 7 | 8 | 9, 6 | 7 | 8 | 9, 6 | 7 | 8 | 9, 6 | 7 | 8 | 9]>([7, 7, 7, 7, 7, 7]);
  if (!open) {
    return (
      <button type="button" className="text-left text-sm underline-offset-4 hover:underline" onClick={() => setOpen(true)}>
        {tx("我已经用铜钱掷过", "I already cast with coins")}
      </button>
    );
  }
  return (
    <div className="grid gap-2">
      <p className="text-sm">{tx("从初爻到上爻，填 6、7、8 或 9。", "From the first line to the sixth, enter 6, 7, 8, or 9.")}</p>
      <div className="flex flex-wrap gap-2">
        {sums.map((sum, index) => (
          <label key={index} className="grid text-xs">
            {index + 1}
            <select
              className="bg-card rounded-md border border-border px-2 py-1"
              value={sum}
              onChange={(event) => {
                const next = [...sums] as typeof sums;
                next[index] = Number(event.target.value) as 6 | 7 | 8 | 9;
                setSums(next);
              }}
            >
              <option value={6}>6</option>
              <option value={7}>7</option>
              <option value={8}>8</option>
              <option value={9}>9</option>
            </select>
          </label>
        ))}
      </div>
      <div>
        <Button
          variant="outline"
          onClick={() => onAccept(sums.map((sum) => throwCoins(sum === 6 ? [2, 2, 2] : sum === 7 ? [3, 2, 2] : sum === 8 ? [2, 3, 3] : [3, 3, 3])))}
        >
          {tx("用这六爻", "Use these lines")}
        </Button>
      </div>
    </div>
  );
}
