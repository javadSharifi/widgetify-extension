import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { LeitnerWord } from "../LanguageLearnerLayout";
import {
  loadWordsFromStorage,
  saveWordsToStorage,
} from "../services/storage";
import { calculateNewLevel } from "../services/exam";

interface WordsContextType {
  words: LeitnerWord[];
  addWord: (
    word: Omit<LeitnerWord, "id" | "level" | "lastTested">,
  ) => void;
  deleteWord: (id: number) => void;
  updateWord: (updatedWord: LeitnerWord) => void;
  updateWordLevel: (wordId: number, isCorrect: boolean) => void;
}

const WordsContext = createContext<WordsContextType | undefined>(undefined);

export const useWords = () => {
  const context = useContext(WordsContext);
  if (!context) {
    throw new Error("useWords must be used within a WordsProvider");
  }
  return context;
};

interface WordsProviderProps {
  children: ReactNode;
}

export const WordsProvider = ({ children }: WordsProviderProps) => {
  const [words, setWords] = useState<LeitnerWord[]>([]);

  useEffect(() => {
    setWords(loadWordsFromStorage());
  }, []);

  const saveWords = useCallback((wordsToSave: LeitnerWord[]) => {
    saveWordsToStorage(wordsToSave);
    setWords(wordsToSave);
  }, []);

  const addWord = useCallback(
    (word: Omit<LeitnerWord, "id" | "level" | "lastTested">) => {
      const newWord: LeitnerWord = {
        ...word,
        id: Date.now(),
        level: 1,
        lastTested: null,
      };
      saveWords([...words, newWord]);
    },
    [words, saveWords],
  );

  const deleteWord = useCallback(
    (id: number) => {
      const updatedWords = words.filter((word) => word.id !== id);
      saveWords(updatedWords);
    },
    [words, saveWords],
  );

  const updateWord = useCallback(
    (updatedWord: LeitnerWord) => {
      const updatedWords = words.map((word) =>
        word.id === updatedWord.id ? updatedWord : word,
      );
      saveWords(updatedWords);
    },
    [words, saveWords],
  );

  const updateWordLevel = useCallback(
    (wordId: number, isCorrect: boolean) => {
      const wordToUpdate = words.find((w) => w.id === wordId);
      if (!wordToUpdate) return;

      const newLevel = calculateNewLevel(wordToUpdate.level, isCorrect);

      const updatedWord: LeitnerWord = {
        ...wordToUpdate,
        level: newLevel,
        lastTested: Date.now(),
      };

      const updatedWords = words.map((word) =>
        word.id === wordId ? updatedWord : word,
      );
      saveWords(updatedWords);
    },
    [words, saveWords],
  );

  const value = {
    words,
    addWord,
    deleteWord,
    updateWord,
    updateWordLevel,
  };

  return (
    <WordsContext.Provider value={value}>{children}</WordsContext.Provider>
  );
};