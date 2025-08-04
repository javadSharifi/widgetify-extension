import { WidgetContainer } from "../widget-container";
import NavbarWidgetsTooltip from "./components/navbar-widgets-tooltip";
import { HiMiniPlus, HiOutlineBookOpen } from "react-icons/hi2";
import { GoTasklist } from "react-icons/go";
import WordList from "./components/word-list";
import { WordsProvider, useWords } from "./context/words.context";
import { useState } from "react";
import WordForm from "./components/word-form";
import ExamModal from "./components/ExamModal";
import { getWordsForExam } from "./services/exam";

export interface LeitnerWord {
  id: number;
  text: string;
  translation: string;
  example: string;
  level: number;
  lastTested: number | null;
}

function LanguageLearner() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const { words } = useWords();

  const wordsForExam = getWordsForExam(
    words.filter((word) => word.level <= 7),
  );

  const handleStartExam = () => {
    setShowExamModal(true);
  };

  return (
    <WidgetContainer>
      <div className="flex flex-col h-full gap-0.5">
        {showAddForm ? (
          <WordForm onClose={() => setShowAddForm(false)} />
        ) : showExamModal ? (
          <ExamModal
            wordsForExam={wordsForExam}
            onClose={() => setShowExamModal(false)}
          />
        ) : (
          <>
            <div className="flex justify-between space-y-2 flex-none">
              <h4 className="'text-xs font-medium flex items-center text-content'">
                لایتنر زبان آموز
              </h4>
              <div className="space-x-1.5 flex items-center">
                <NavbarWidgetsTooltip
                  content="افزودن کلمه"
                  Icon={HiMiniPlus}
                  onClick={() => setShowAddForm(true)}
                />
                <NavbarWidgetsTooltip
                  content="دیکشنری"
                  Icon={HiOutlineBookOpen}
                  onClick={() => {}}
                />
                <NavbarWidgetsTooltip
                  content={`گرفتن آزمون (${wordsForExam.length})`}
                  Icon={GoTasklist}
                  onClick={handleStartExam}
                  disabled={wordsForExam.length === 0}
                />
              </div>
            </div>
            <WordList />
          </>
        )}
      </div>
    </WidgetContainer>
  );
}

export default function LanguageLearnerLayout() {
  return (
    <WordsProvider>
      <LanguageLearner />
    </WordsProvider>
  );
}