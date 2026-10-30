export type Element = "木" | "火" | "土" | "金" | "水";

export type Gender = "male" | "female";

export type CalendarKind = "solar" | "lunar";

export type Lean = "support" | "caution" | "mixed";

export type CategoryId =
  | "general"
  | "career"
  | "investment"
  | "relationship"
  | "property"
  | "health"
  | "travel";

export type MethodId = "iching" | "ziwei" | "bazi" | "meihua" | "qimen";

export type ActivityId = "sign" | "move" | "open" | "travel" | "meet" | "general";

export type RiskLevel = "low" | "medium" | "high";

export type GutFeeling = "yes" | "unsure" | "no";

export type Locale = "zh" | "en";

export type CivilDateTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

export type City = {
  name: string;
  nameZh: string;
  admin: string;
  adminZh: string;
  country: string;
  countryName: string;
  countryNameZh: string;
  latitude: number;
  longitude: number;
  timeZone: string;
};

export type BirthProfile = {
  surname: string;
  givenName: string;
  englishName: string;
  gender: Gender;
  calendar: CalendarKind;
  leapMonth: boolean;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  birthCity: City;
  currentCity: City;
  useTrueSolarTime: boolean;
  strokeOverrides: Record<string, number>;
};

export type PracticalFactors = {
  budget: string;
  deadline: string;
  risk: RiskLevel;
  gut: GutFeeling;
  gutNote: string;
};

export type Pillar = {
  key: "year" | "month" | "day" | "hour";
  ganZhi: string;
  stem: string;
  branch: string;
  stemElement: Element;
  branchElement: Element;
  tenGod: string;
  naYin: string;
  hideStems: string[];
};

export type LuckPillar = {
  ganZhi: string;
  startYear: number;
  endYear: number;
  startAge: number;
  endAge: number;
  current: boolean;
};

export type BaziChart = {
  pillars: Pillar[];
  dayMaster: string;
  dayMasterElement: Element;
  strength: "strong" | "weak";
  scores: Record<Element, number>;
  favorable: Element[];
  unfavorable: Element[];
  seasonal: Element | null;
  yongShen: Element;
  xiShen: Element;
  daYun: LuckPillar[];
  startYears: number;
  startMonths: number;
  startDays: number;
  startSolar: string;
  direction: "forward" | "backward";
  flowYear: string;
  flowMonth: string;
  flowDay: string;
  flowHour: string;
  spouseElement: Element;
};

export type StarBrief = {
  name: string;
  brightness: string;
  mutagen: string;
};

export type PalaceBrief = {
  name: string;
  stem: string;
  branch: string;
  isBody: boolean;
  isSoul: boolean;
  major: StarBrief[];
  minor: StarBrief[];
  decadal: [number, number] | null;
};

export type ZiweiChart = {
  fiveElementsClass: string;
  soul: string;
  body: string;
  soulBranch: string;
  bodyBranch: string;
  chineseDate: string;
  palaces: PalaceBrief[];
  natalMutagen: { star: string; mutagen: string; palace: string }[];
  decadal: {
    stem: string;
    branch: string;
    palace: string;
    range: [number, number] | null;
  };
  yearly: { stem: string; branch: string; palace: string; mutagen: string[] };
  monthly: { stem: string; branch: string };
};

export type CharStroke = {
  char: string;
  traditional: string;
  strokes: number | null;
  alternatives: string[];
};

export type NameGrid = {
  key: "heaven" | "person" | "earth" | "outer" | "total";
  value: number;
  numerology: number;
  element: Element;
  luck: "great" | "good" | "half" | "bad" | "worse";
};

export type NameAnalysis = {
  surname: string;
  givenName: string;
  characters: CharStroke[];
  grids: NameGrid[] | null;
  sancai: {
    heaven: Element;
    person: Element;
    earth: Element;
    luck: "auspicious" | "mixed" | "inauspicious";
  } | null;
  missing: string[];
  nameElements: Element[];
  helpsYongShen: boolean | null;
  note: "assists" | "conflicts" | "neutral" | "incomplete";
};

export type HexagramView = {
  number: number;
  name: string;
  pinyin: string;
  english: string;
  symbol: string;
  upper: string;
  lower: string;
  judgment: string;
  image: string;
  lines: { name: string; text: string }[];
  yong: { name: string; text: string } | null;
  tone: Lean;
};

export type CoinThrow = {
  coins: [2 | 3, 2 | 3, 2 | 3];
  sum: 6 | 7 | 8 | 9;
  yang: boolean;
  changing: boolean;
};

export type IchingCast = {
  lines: CoinThrow[];
  primary: HexagramView;
  resulting: HexagramView;
  changingLines: number[];
};

export type MeihuaResult = {
  upper: string;
  lower: string;
  moving: number;
  primary: HexagramView;
  resulting: HexagramView;
  bodyTrigram: string;
  useTrigram: string;
  bodyElement: Element;
  useElement: Element;
  relation:
    | "use-generates-body"
    | "body-generates-use"
    | "body-controls-use"
    | "use-controls-body"
    | "same";
  lean: Lean;
};

export type QimenPalace = {
  palace: string;
  direction: string;
  diPan: string;
  tianPan: string;
  star: string;
  gate: string;
  god: string;
};

export type QimenChart = {
  ju: string;
  dun: "yin" | "yang";
  yuan: string;
  zhiFu: string;
  zhiShi: string;
  kong: string;
  xunShou: string;
  solarTerm: string;
  fourPillars: string;
  palaces: QimenPalace[];
  focusLabel: string;
  focusPalace: string;
  lean: Lean;
};

export type Bilingual = { zh: string; en: string };

export type AuspiciousDate = {
  year: number;
  month: number;
  day: number;
  ganZhi: string;
  lunarText: string;
  yi: string[];
  ji: string[];
  zhiXing: string;
  score: number;
  reasons: Bilingual[];
  hours: string[];
};

export type FengshuiAdvice = {
  yongShen: Element;
  xiShen: Element;
  seasonal: Element | null;
  directions: string[];
  avoidDirections: string[];
  colors: string[];
  avoidColors: string[];
  numbers: number[];
  avoidNumbers: number[];
  dailyXi: string;
  dailyCai: string;
  dailyFu: string;
  place: string;
};

export type CompatibilityReport = {
  score: number;
  label: "harmonious" | "complementary" | "neutral" | "tense";
  dayStem: Bilingual;
  dayBranch: Bilingual;
  yearBranch: Bilingual;
  elementFit: Bilingual;
  ziwei: Bilingual;
  points: Bilingual[];
};

export type MethodLean = {
  method: MethodId;
  lean: Lean;
  reasonZh: string;
  reasonEn: string;
};

export type BirthComputation = {
  inputCalendar: CalendarKind;
  nominal: CivilDateTime;
  corrected: CivilDateTime;
  lunarText: string;
  trueSolarApplied: boolean;
  correctionMinutes: number;
  hourName: string;
  hourBranch: string;
  ziweiTimeIndex: number;
  bazi: BaziChart;
  ziwei: ZiweiChart;
  name: NameAnalysis | null;
};

export type ComputedReading = {
  askedAt: CivilDateTime;
  timeZone: string;
  place: string;
  category: CategoryId;
  activity: ActivityId;
  birth: BirthComputation;
  counterpart: BirthComputation | null;
  iching: IchingCast | null;
  meihua: MeihuaResult | null;
  qimen: QimenChart | null;
  fengshui: FengshuiAdvice;
  dates: AuspiciousDate[];
  compatibility: CompatibilityReport | null;
  leans: MethodLean[];
};

export type StructuredReading = {
  mode: "llm" | "offline";
  providerNote: string;
  verdictTitle: string;
  summary: string;
  optionReadings: { option: string; lean: Lean; comment: string }[];
  risks: string[];
  timing: string;
  directions: string;
  nextSteps: string[];
  crossCheck: string;
  practical: string;
  compatibility: string;
};

export type OutcomeRecord = {
  result: "favorable" | "mixed" | "unfavorable";
  note: string;
  recordedAt: string;
  reminderOn?: string;
};

export type ReadingRecord = {
  id: string;
  createdAt: string;
  question: string;
  questionLang: Locale;
  category: CategoryId;
  options: string[];
  methods: MethodId[];
  practical: PracticalFactors;
  profile: BirthProfile;
  counterpart: BirthProfile | null;
  computed: ComputedReading;
  interpretation: StructuredReading | null;
  reminderOn?: string;
  outcome?: OutcomeRecord;
};

export const CATEGORIES: CategoryId[] = [
  "general",
  "career",
  "investment",
  "relationship",
  "property",
  "health",
  "travel",
];

export const METHODS: MethodId[] = ["iching", "ziwei", "bazi", "meihua", "qimen"];

export function assertNever(value: never): never {
  throw new Error(`Unhandled variant: ${String(value)}`);
}
