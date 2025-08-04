// services/exam.ts

import { EXAM_INTERVALS, LEVELS } from "../constants";
import { LeitnerWord } from "../LanguageLearnerLayout";

export const getWordsForExam = (words: LeitnerWord[]): LeitnerWord[] => {
  const now = Date.now();

  const eligibleWords = words.filter((word) => {
    if (word.level > LEVELS.MAX) {
      return false;
    }

    const lastTestedTime = word.lastTested;
    if (lastTestedTime === null) {
      return true;
    }

    let interval: number;
    switch (word.level) {
      case 1:
        interval = EXAM_INTERVALS.LEVEL_1_INTERVAL;
        break;
      case 2:
        interval = EXAM_INTERVALS.LEVEL_2_INTERVAL;
        break;
      case 3:
        interval = EXAM_INTERVALS.LEVEL_3_INTERVAL;
        break;
      case 4:
        interval = EXAM_INTERVALS.LEVEL_4_INTERVAL;
        break;
      case 5:
        interval = EXAM_INTERVALS.LEVEL_5_INTERVAL;
        break;
      case 6:
        interval = EXAM_INTERVALS.LEVEL_6_INTERVAL;
        break;
      case 7:
        interval = EXAM_INTERVALS.LEVEL_7_INTERVAL;
        break;
      default:
        return false;
    }

    return now - lastTestedTime >= interval;
  });

  return eligibleWords.sort(() => Math.random() - 0.5);
};

export const calculateNewLevel = (
  currentLevel: number,
  isCorrect: boolean
): number => {
  if (isCorrect) {
    return Math.min(LEVELS.MAX + 1, currentLevel + 1);
  } else {
    return Math.max(LEVELS.MIN, currentLevel - 1);
  }
};

export const getExamFeedback = (
  wordText: string,
  newLevel: number,
  isCorrect: boolean
): string => {
  if (newLevel > LEVELS.MAX) {
    return `عالی بود! شما بر کلمه "${wordText}" مسلط شدید.`;
  }
  if (isCorrect) {
    return `عالی بود! "${wordText}" به سطح ${newLevel} رفت.`;
  } else {
    return `اشکالی نداره. "${wordText}" به سطح ${newLevel} برگشت.`;
  }
};
