import {
  PiNumberOneBold,
  PiNumberTwoBold,
  PiNumberThreeBold,
  PiNumberFourBold,
  PiNumberFiveBold,
  PiNumberSixBold,
  PiNumberSevenBold,
} from "react-icons/pi";

export const tabsLanguageLearner = [
  { id: 1, icon: PiNumberOneBold, label: "۱ سطح" },
  { id: 2, icon: PiNumberTwoBold, label: "۲ سطح" },
  { id: 3, icon: PiNumberThreeBold, label: "۳ سطح" },
  { id: 4, icon: PiNumberFourBold, label: "۴ سطح" },
  { id: 5, icon: PiNumberFiveBold, label: "۵ سطح" },
  { id: 6, icon: PiNumberSixBold, label: "۶ سطح" },
  { id: 7, icon: PiNumberSevenBold, label: "۷ سطح" },
];

export const STORAGE_KEYS = {
  LEITNER_WORDS: "leitnerWordsApp",
  LAST_GENERAL_EXAM_TIME: "leitnerLastGeneralExamTime",
} as const;

export const TIME_INTERVALS = {
  THREE_HOURS: 3 * 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  THREE_DAYS: 3 * 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

export const EXAM_INTERVALS = {
  LEVEL_1_INTERVAL: TIME_INTERVALS.THREE_HOURS,
  LEVEL_2_INTERVAL: TIME_INTERVALS.THREE_HOURS,
  LEVEL_3_INTERVAL: TIME_INTERVALS.ONE_DAY,
  LEVEL_4_INTERVAL: TIME_INTERVALS.ONE_DAY,
  LEVEL_5_INTERVAL: TIME_INTERVALS.THREE_DAYS,
  LEVEL_6_INTERVAL: TIME_INTERVALS.THREE_DAYS,
  LEVEL_7_INTERVAL: TIME_INTERVALS.ONE_WEEK,
} as const;

export const LEVELS = {
  MIN: 1,
  MAX: 7,
  INITIAL: 1,
} as const;

export const URLS = {
  CATEGORIES:
    "https://gist.githubusercontent.com/javadSharifi/e9122e8fe2354a8398b58ad6a29b3360/raw/ff2b4aa0517be76cb14aa015495a3c4bf4219f70/library_categories.json",
  DICTIONARY_API: "https://api.dictionaryapi.dev/api/v2/entries/en/",
} as const;

export const TABS_COUNT = 7;
