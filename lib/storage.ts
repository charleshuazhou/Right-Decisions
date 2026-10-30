import { DRAFT_KEY, HISTORY_KEY, PROFILE_KEY } from "@/lib/keys";
import type { BirthProfile, CategoryId, MethodId, PracticalFactors, ReadingRecord } from "@/lib/types";

export { DRAFT_KEY, HISTORY_KEY, LOCALE_KEY, PROFILE_KEY } from "@/lib/keys";

export type QuestionDraft = {
  question: string;
  category: CategoryId;
  options: string[];
  methods: MethodId[];
  practical: PracticalFactors;
  counterpart: BirthProfile | null;
};

export const emptyPractical = (): PracticalFactors => ({
  budget: "",
  deadline: "",
  risk: "medium",
  gut: "unsure",
  gutNote: "",
});

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadProfile(): BirthProfile | null {
  return readJson<BirthProfile | null>(PROFILE_KEY, null);
}

export function saveProfile(profile: BirthProfile) {
  writeJson(PROFILE_KEY, profile);
}

export function loadHistory(): ReadingRecord[] {
  return readJson<ReadingRecord[]>(HISTORY_KEY, []);
}

export function saveHistory(records: ReadingRecord[]) {
  writeJson(HISTORY_KEY, records.slice(0, 80));
}

export function loadReading(id: string): ReadingRecord | null {
  return loadHistory().find((item) => item.id === id) ?? null;
}

export function updateReading(id: string, patch: Partial<ReadingRecord>) {
  const next = loadHistory().map((item) => (item.id === id ? { ...item, ...patch } : item));
  saveHistory(next);
  return next.find((item) => item.id === id) ?? null;
}

export function deleteReading(id: string) {
  saveHistory(loadHistory().filter((item) => item.id !== id));
}

export function saveDraft(draft: QuestionDraft) {
  writeJson(DRAFT_KEY, draft);
}

export function loadDraft(): QuestionDraft | null {
  return readJson<QuestionDraft | null>(DRAFT_KEY, null);
}

export function clearDraft() {
  window.sessionStorage.removeItem(DRAFT_KEY);
  window.localStorage.removeItem(DRAFT_KEY);
}
