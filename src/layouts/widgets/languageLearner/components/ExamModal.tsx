import React, { useState, useMemo, useEffect } from "react";
import { LeitnerWord } from "../LanguageLearnerLayout";
import { Button } from "@/components/button/button";
import { useWords } from "../context/words.context";
import { getExamFeedback, calculateNewLevel } from "../services/exam";
import Flashcard from "./Flashcard";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";

interface ExamModalProps {
  wordsForExam: LeitnerWord[];
  onClose: () => void;
}

export default function ExamModal({ wordsForExam, onClose }: ExamModalProps) {
  const [examWords] = useState(() => wordsForExam);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(
    null,
  );
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const { updateWordLevel } = useWords();

  const currentWord = useMemo(() => {
    return examWords[currentWordIndex];
  }, [currentWordIndex, examWords]);

  const progress = useMemo(() => {
    if (examWords.length === 0) return 100;
    return ((currentWordIndex + 1) / examWords.length) * 100;
  }, [currentWordIndex, examWords.length]);

  const handleAnswer = (isCorrect: boolean) => {
    if (!currentWord || feedback) return;

    const newLevel = calculateNewLevel(currentWord.level, isCorrect);
    updateWordLevel(currentWord.id, isCorrect);
    setFeedback(isCorrect ? "correct" : "incorrect");
    setFeedbackMessage(getExamFeedback(currentWord.text, newLevel, isCorrect));

    setTimeout(() => {
      setFeedback(null);
      setFeedbackMessage(null);
      setIsFlipped(false);

      if (currentWordIndex < examWords.length - 1) {
        setCurrentWordIndex(currentWordIndex + 1);
      } else {
        onClose();
      }
    }, 2000);
  };

  useEffect(() => {
    setIsFlipped(false);
  }, [currentWord]);

  if (examWords.length === 0) {
    return (
      <div className="p-4 text-center flex flex-col justify-center items-center h-full">
        <p className="text-lg">هیچ کلمه‌ای برای آزمون وجود ندارد.</p>
        <Button onClick={onClose} className="mt-6" size="md">
          بستن
        </Button>
      </div>
    );
  }

  if (!currentWord) {
    return (
      <div className="p-4 text-center flex flex-col justify-center items-center h-full">
        <p className="text-lg">آزمون تمام شد!</p>
        <Button onClick={onClose} className="mt-6" size="md">
          بستن
        </Button>
      </div>
    );
  }

  const actionButtons = (
    <div className="flex gap-2">
      <Button
        onClick={() => handleAnswer(false)}
        className="bg-red-500 hover:bg-red-600 text-white"
        size="sm"
        disabled={!!feedback}
      >
        نمی‌دانم
      </Button>
      <Button
        onClick={() => handleAnswer(true)}
        className="bg-green-500 hover:bg-green-600 text-white"
        size="sm"
        disabled={!!feedback}
      >
        می‌دانم
      </Button>
    </div>
  );

  return (
    <div className="p-4 flex flex-col gap-4 h-full justify-between">
      <div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="text-xs text-muted text-center mt-2">
          کلمه {currentWordIndex + 1} از {examWords.length}
        </div>
      </div>

      <Flashcard
        word={currentWord}
        isFlipped={isFlipped}
        feedback={feedback}
        actions={isFlipped && !feedback ? actionButtons : undefined}
      />

      <div className="h-10 flex items-center justify-center">
        {feedbackMessage && (
          <div
            className={`flex items-center gap-2 text-sm font-medium ${
              feedback === "correct" ? "text-green-500" : "text-red-500"
            }`}
          >
            {feedback === "correct" ? (
              <FiCheckCircle size={20} />
            ) : (
              <FiXCircle size={20} />
            )}
            {feedbackMessage}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 h-10">
        {!isFlipped && (
          <Button
            onClick={() => setIsFlipped(true)}
            className="w-full"
            size="md"
          >
            نمایش ترجمه
          </Button>
        )}
      </div>
    </div>
  );
}
