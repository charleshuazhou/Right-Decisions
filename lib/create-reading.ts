import { detectLanguage, computeReading } from "@/lib/reading";
import { loadHistory, saveHistory, type QuestionDraft } from "@/lib/storage";
import type { BirthProfile, IchingCast, ReadingRecord } from "@/lib/types";

export function createReading(draft: QuestionDraft, profile: BirthProfile, iching: IchingCast | null): ReadingRecord {
  const computed = computeReading({
    profile,
    counterpart: draft.counterpart,
    category: draft.category,
    methods: draft.methods,
    iching,
  });
  const record: ReadingRecord = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    question: draft.question.trim(),
    questionLang: detectLanguage(draft.question),
    category: draft.category,
    options: draft.options.map((item) => item.trim()).filter(Boolean),
    methods: draft.methods,
    practical: draft.practical,
    profile,
    counterpart: draft.counterpart,
    computed,
    interpretation: null,
  };
  saveHistory([record, ...loadHistory()]);
  return record;
}
