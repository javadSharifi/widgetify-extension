// services/storage.ts

import { STORAGE_KEYS } from "../constants";
import { LeitnerWord } from "../LanguageLearnerLayout";

export const loadWordsFromStorage = (): LeitnerWord[] => {
  try {
    const storedWordsString = localStorage.getItem(STORAGE_KEYS.LEITNER_WORDS);
    if (storedWordsString) {
      return JSON.parse(storedWordsString);
    }
    return [];
  } catch (error) {
    console.error("Failed to load words from localStorage:", error);
    return [];
  }
};

export const saveWordsToStorage = (words: LeitnerWord[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.LEITNER_WORDS, JSON.stringify(words));
  } catch (error) {
    console.error("Failed to save words to localStorage:", error);
    throw new Error("خطا در ذخیره کلمات");
  }
};

export const getLastExamTime = (): number | null => {
  const lastExamTimeStr = localStorage.getItem(
    STORAGE_KEYS.LAST_GENERAL_EXAM_TIME
  );
  return lastExamTimeStr ? parseInt(lastExamTimeStr, 10) : null;
};

export const setLastExamTime = (time: number): void => {
  localStorage.setItem(STORAGE_KEYS.LAST_GENERAL_EXAM_TIME, time.toString());
};
