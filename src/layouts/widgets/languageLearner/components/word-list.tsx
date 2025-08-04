import { TabNavigation } from "@/components/tabNavigation";
import { useState } from "react";
import { tabsLanguageLearner } from "../constants";
import WordItem from "./word.item";
import { useWords } from "../context/words.context";

export default function WordList() {
  const [activeTab, setActiveTab] = useState<number>(1);
  const { words } = useWords();

  const handleTabClick = (tabIndex: number) => {
    setActiveTab(tabIndex);
  };

  const filteredWords = words.filter((word) => word.level === activeTab);

  return (
    <div className=" flex gap-0.5 flex-col flex-grow overflow-hidden ">
      <div className=" flex border-b border-gray-200 dark:border-gray-700 flex-none">
        <TabNavigation
          layoutId="language-learner-tabs"
          tabs={tabsLanguageLearner}
          activeTab={activeTab}
          onTabClick={handleTabClick}
        />
      </div>

      {filteredWords.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 pt-4">
          هیچ کلمه‌ای در سطح {activeTab} وجود ندارد.
        </p>
      ) : (
        <div className="flex-grow overflow-hidden">
          <div className={`pr-1.5 space-y-1.5 overflow-y-auto h-full`}>
            {filteredWords.map((word) => (
              <WordItem word={word} key={word.id} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}