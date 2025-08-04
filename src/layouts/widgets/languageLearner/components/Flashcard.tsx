import React from "react";
import { LeitnerWord } from "../LanguageLearnerLayout";

interface FlashcardProps {
  word: LeitnerWord;
  isFlipped: boolean;
  feedback: "correct" | "incorrect" | null;
  actions?: React.ReactNode;
}

export default function Flashcard({
  word,
  isFlipped,
  feedback,
  actions,
}: FlashcardProps) {
  const feedbackBorder =
    feedback === "correct"
      ? "border-green-500"
      : feedback === "incorrect"
      ? "border-red-500"
      : "";
  return (
    <div className="w-full h-[150px] [perspective:1000px]">
      <div
        className={`w-full h-full relative transition-transform duration-600 [transform-style:preserve-3d] ${
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        <div className="absolute w-full h-full [backface-visibility:hidden] flex justify-center items-center rounded-lg p-4 bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <div className="text-center">
            <p className="text-2xl font-bold">{word.text}</p>
            {word.example && (
              <p className="text-sm text-muted mt-2">
                <span className="font-medium">Example: </span>
                {word.example}
              </p>
            )}
          </div>
        </div>
        <div
          className={`absolute w-full h-full [backface-visibility:hidden] flex justify-center items-center rounded-lg p-4 bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 [transform:rotateY(180deg)] ${feedbackBorder}`}
        >
          <div className="relative w-full h-full flex flex-col justify-center items-center text-center p-4">
            <p className="text-2xl font-bold">{word.translation}</p>
            {actions && (
              <div className="absolute bottom-4 flex justify-center w-full">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
