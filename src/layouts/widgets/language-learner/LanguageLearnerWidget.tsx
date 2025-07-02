import { TabNavigation } from "@/components/TabNavigation";
import React, { useState, useEffect } from "react"; // Added useEffect
import { useQuery } from "@tanstack/react-query"; // Added useQuery
import { tabsLanguageLearner } from "./constants";

// Function to fetch data (generic)
const fetchJson = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Network response was not ok for ${url}`);
  }
  return response.json();
};


interface LeitnerWord {
  id: string;
  text: string;
  pronunciation: string;
  example: string;
  level: number;
  lastTested: number | null;
}

const LEITNER_STORAGE_KEY = "leitnerWordsApp";

const LanguageLearnerWidget: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(1);
  const [showAddWordForm, setShowAddWordForm] = useState<boolean>(false);
  const [showWordLibrary, setShowWordLibrary] = useState<boolean>(false); // New state for word library

  // State for form inputs
  const [wordInput, setWordInput] = useState<string>("");
  const [pronunciationInput, setPronunciationInput] = useState<string>("");
  const [exampleInput, setExampleInput] = useState<string>("");

  const [words, setWords] = useState<LeitnerWord[]>([]);
  const [isLoadingPronunciation, setIsLoadingPronunciation] =
    useState<boolean>(false);
  const [playingWordId, setPlayingWordId] = useState<string | null>(null);
  const [editingWord, setEditingWord] = useState<LeitnerWord | null>(null);
  const [expandedWordId, setExpandedWordId] = useState<string | null>(null);

  // Word Library State
  const [selectedCategory, setSelectedCategory] = useState<WordCategory | null>(null); // Changed to WordCategory type

  // Interface for the structure of items in library_categories.json
  interface WordCategory {
    name: string;
    url: string;
    type?: "simple_list" | "ranked";
  }
  const [selectedRankKey, setSelectedRankKey] = useState<string | null>(null); // State for selected rank key

  // Fetching categories
  const categoriesUrl = "https://gist.githubusercontent.com/javadSharifi/e9122e8fe2354a8398b58ad6a29b3360/raw/ff2b4aa0517be76cb14aa015495a3c4bf4219f70/library_categories.json";
  const {
    data: wordCategories,
    isLoading: isLoadingCategories,
    error: categoriesError,
  } = useQuery<WordCategory[], Error>({
    queryKey: ["wordCategories", categoriesUrl],
    queryFn: () => fetchJson(categoriesUrl),
  });

  // Interface for items from common_words.json or common_idioms.json
  interface LibraryWordItem {
    word: string;
    meaning: string;
    example?: string;
  }

  // Fetching words for a selected category
  const {
    data: libraryWords, // Can be LibraryWordItem[] or Record<string, LibraryWordItem[]>
    isLoading: isLoadingLibraryWords,
    error: libraryWordsError,
  } = useQuery<LibraryWordItem[] | Record<string, LibraryWordItem[]>, Error>({
    queryKey: ["libraryWords", selectedCategory?.url],
    queryFn: () => {
      if (!selectedCategory?.url) {
        // This case should ideally not be reached if 'enabled' is set correctly,
        // but as a fallback, return an empty array or object based on type.
        return selectedCategory?.type === 'ranked' ? Promise.resolve({}) : Promise.resolve([]);
      }
      return fetchJson(selectedCategory.url);
    },
    enabled: !!selectedCategory?.url, // Query runs if a category is selected
    onSuccess: () => {
      // When new category data is fetched, reset the selected rank
      setSelectedRankKey(null);
    }
  });

  useEffect(() => {
    if (libraryWordsError && selectedCategory) { // Ensure selectedCategory is not null
      alert(`مشکلی در بارگذاری کلمات از "${selectedCategory.name}" پیش آمد: ${libraryWordsError.message}`);
      setSelectedCategory(null); // Reset selected category on error
      setSelectedRankKey(null); // Also reset rank key
    }
  }, [libraryWordsError, selectedCategory]);


  // Exam State
  const [isExamMode, setIsExamMode] = useState<boolean>(false);
  const [examWords, setExamWords] = useState<LeitnerWord[]>([]);
  const [currentExamWordIndex, setCurrentExamWordIndex] = useState<number>(0);
  const [showExamAnswer, setShowExamAnswer] = useState<boolean>(false);
  const [examFeedback, setExamFeedback] = useState<string>(""); // e.g., "Correct!", "Incorrect. Level down."

  const LAST_GENERAL_EXAM_TIME_KEY = "leitnerLastGeneralExamTime";
  const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const THREE_DAYS_MS = 3 * ONE_DAY_MS;
  const ONE_WEEK_MS = 7 * ONE_DAY_MS;

  // Load words from localStorage on component mount
  useEffect(() => {
    try {
      const storedWordsString = localStorage.getItem(LEITNER_STORAGE_KEY);
      if (storedWordsString) {
        const storedWords: LeitnerWord[] = JSON.parse(storedWordsString);
        setWords(storedWords);
        console.log("Words loaded from localStorage:", storedWords);
      }
    } catch (error) {
      console.error("Failed to load words from localStorage:", error);
      // Potentially clear corrupted data or notify user
      // localStorage.removeItem(LEITNER_STORAGE_KEY);
    }
  }, []);

  const TABS_COUNT = 7;

  const handleTabClick = (tabIndex: number) => {
    setActiveTab(tabIndex);
    setShowAddWordForm(false); // Hide form when changing tabs
  };

  const handleSaveWord = () => {
    if (!wordInput.trim()) {
      alert('فیلد "کلمه" نمی‌تواند خالی باشد.'); // Replace with a better notification later
      return;
    }

    try {
      let updatedWords: LeitnerWord[];
      let targetLevel: number;

      if (editingWord) {
        // Update existing word
        updatedWords = words.map((w) =>
          w.id === editingWord.id
            ? {
                ...w,
                text: wordInput.trim(),
                pronunciation: pronunciationInput.trim(),
                example: exampleInput.trim(),
                // Level is not changed during edit, but could be if needed
              }
            : w
        );
        targetLevel = editingWord.level;
        console.log("Word updated:", editingWord.id);
        setEditingWord(null); // Clear editing state
      } else {
        // Add new word
        const newWord: LeitnerWord = {
          id: Date.now().toString(),
          text: wordInput.trim(),
          pronunciation: pronunciationInput.trim(),
          example: exampleInput.trim(),
          level: 1, // New words start at level 1
          lastTested: null,
        };
        const existingWordsString = localStorage.getItem(LEITNER_STORAGE_KEY);
        const currentWords: LeitnerWord[] = existingWordsString
          ? JSON.parse(existingWordsString)
          : [];
        updatedWords = [...currentWords, newWord];
        targetLevel = newWord.level;
        console.log("Word saved:", newWord);
      }

      localStorage.setItem(LEITNER_STORAGE_KEY, JSON.stringify(updatedWords));
      setWords(updatedWords);

      // Clear form inputs
      setWordInput("");
      setPronunciationInput("");
      setExampleInput("");
      setShowAddWordForm(false);
      setActiveTab(targetLevel);
    } catch (error) {
      console.error("Failed to save/update word to localStorage:", error);
      alert("خطا در ذخیره/به‌روزرسانی کلمه. لطفا کنسول را بررسی کنید.");
    }
  };

  const openAddWordForm = () => {
    setWordInput("");
    setPronunciationInput("");
    setExampleInput("");
    setEditingWord(null); // Ensure editing state is cleared
    setShowAddWordForm(true);
    setShowWordLibrary(false); // Close library if open
    setSelectedCategory(null); // Reset library states
    setSelectedRankKey(null);
    setActiveTab(0); // Indicate no specific level tab is active for the form
  };

  // Renamed openWordLibrary to openWordLibraryCustom to avoid conflicts if old one was used elsewhere
  const openWordLibraryCustom = () => {
    setShowWordLibrary(true);
    setShowAddWordForm(false);
    setActiveTab(0);
    setSelectedCategory(null); // Reset category when opening library
    setSelectedRankKey(null);  // Reset rank key when opening library
  };

  const handleEditWordClick = (word: LeitnerWord) => {
    setEditingWord(word);
    setWordInput(word.text);
    setPronunciationInput(word.pronunciation);
    setExampleInput(word.example);
    setShowAddWordForm(true);
    setActiveTab(0); // To show the form view
  };

  const handleDeleteWordClick = (wordId: string, wordText: string) => {
    if (window.confirm(`آیا از حذف کلمه "${wordText}" مطمئن هستید؟`)) {
      try {
        const updatedWords = words.filter((w) => w.id !== wordId);
        localStorage.setItem(LEITNER_STORAGE_KEY, JSON.stringify(updatedWords));
        setWords(updatedWords);
        console.log("Word deleted:", wordId);
        // If the deleted word was being edited, clear the form
        if (editingWord && editingWord.id === wordId) {
          setEditingWord(null);
          setWordInput("");
          setPronunciationInput("");
          setExampleInput("");
          // setShowAddWordForm(false); // Optionally hide form
        }
      } catch (error) {
        console.error("Failed to delete word from localStorage:", error);
        alert("خطا در حذف کلمه. لطفا کنسول را بررسی کنید.");
      }
    }
  };

  const toggleWordDetails = (wordId: string) => {
    setExpandedWordId((prevExpandedId) =>
      prevExpandedId === wordId ? null : wordId
    );
  };

  // --- EXAM LOGIC ---
  const canTakeGeneralExam = (): boolean => {
    const lastExamTimeStr = localStorage.getItem(LAST_GENERAL_EXAM_TIME_KEY);
    if (!lastExamTimeStr) return true; // Never taken an exam
    const lastExamTime = parseInt(lastExamTimeStr, 10);
    return Date.now() - lastExamTime >= THREE_HOURS_MS;
  };

  const getWordsForExam = (): LeitnerWord[] => {
    const now = Date.now();
    const eligibleWords = words.filter((word) => {
      if (word.level >= 1 && word.level <= 4) {
        return true;
      }
      const lastTestedTime = word.lastTested;
      if (!lastTestedTime) return true; // Never tested before

      if (word.level === 5) {
        return now - lastTestedTime >= ONE_DAY_MS;
      }
      if (word.level === 6) {
        return now - lastTestedTime >= THREE_DAYS_MS;
      }
      if (word.level === 7) {
        return now - lastTestedTime >= ONE_WEEK_MS;
      }
      return false; // Should not happen if level is within 1-7
    });
    // Shuffle the eligible words
    return eligibleWords.sort(() => Math.random() - 0.5);
  };

  const startExam = () => {
    if (!canTakeGeneralExam()) {
      const lastExamTimeStr = localStorage.getItem(LAST_GENERAL_EXAM_TIME_KEY);
      let timeRemainingMsg = "لطفا ۳ ساعت صبر کنید.";
      if (lastExamTimeStr) {
        const lastExamTime = parseInt(lastExamTimeStr, 10);
        const timePassed = Date.now() - lastExamTime;
        const timeRemaining = THREE_HOURS_MS - timePassed;
        const minutesRemaining = Math.ceil(timeRemaining / (60 * 1000));
        timeRemainingMsg = `لطفا حدود ${minutesRemaining} دقیقه دیگر دوباره امتحان کنید.`;
      }
      alert(`شما به تازگی امتحان داده‌اید. ${timeRemainingMsg}`);
      return;
    }

    const wordsForSession = getWordsForExam();
    if (wordsForSession.length === 0) {
      alert(
        "در حال حاضر کلمه‌ای برای امتحان وجود ندارد. لطفا کلمات بیشتری اضافه کنید یا صبر کنید تا زمان آزمون کلمات فعلی فرا برسد."
      );
      return;
    }

    setExamWords(wordsForSession);
    setCurrentExamWordIndex(0);
    setShowExamAnswer(false);
    setExamFeedback("");
    setIsExamMode(true);
    setShowAddWordForm(false); // Ensure add word form is hidden
    console.log("Exam started with words:", wordsForSession);
  };

  const handleShowAnswer = () => {
    setShowExamAnswer(true);
  };

  const handleExamAnswer = (isCorrect: boolean) => {
    const currentWord = examWords[currentExamWordIndex];
    if (!currentWord) return;

    let newLevel = currentWord.level;
    if (isCorrect) {
      newLevel = Math.min(7, currentWord.level + 1);
      setExamFeedback(
        `عالی بود! "${currentWord.text}" به سطح ${newLevel} رفت.`
      );
    } else {
      newLevel = Math.max(1, currentWord.level - 1);
      setExamFeedback(
        `اشکالی نداره. "${currentWord.text}" به سطح ${newLevel} برگشت.`
      );
    }

    const updatedWordData: LeitnerWord = {
      ...currentWord,
      level: newLevel,
      lastTested: Date.now(),
    };

    // Update the word in the main 'words' state and localStorage
    const mainWordsUpdated = words.map((w) =>
      w.id === currentWord.id ? updatedWordData : w
    );
    setWords(mainWordsUpdated);
    localStorage.setItem(LEITNER_STORAGE_KEY, JSON.stringify(mainWordsUpdated));

    // Move to the next word or end exam
    if (currentExamWordIndex < examWords.length - 1) {
      setCurrentExamWordIndex(currentExamWordIndex + 1);
      setShowExamAnswer(false);
      // Feedback for the next word will be cleared or set by next action
    } else {
      endExam();
    }
  };

  const endExam = () => {
    setIsExamMode(false);
    localStorage.setItem(LAST_GENERAL_EXAM_TIME_KEY, Date.now().toString());
    setExamFeedback(
      `امتحان تمام شد! برای امتحان بعدی باید حداقل ۳ ساعت صبر کنید.`
    ); // This feedback will be shown briefly
    // Consider showing a summary or just going back to the main view
    setActiveTab(1); // Go back to level 1 or a summary tab if implemented
    // Reset exam states
    setExamWords([]);
    setCurrentExamWordIndex(0);
    setShowExamAnswer(false);
    // examFeedback will be cleared on next tab click or action.
    alert("امتحان تمام شد!"); // Temporary alert
  };
  // --- END OF EXAM LOGIC ---

  const handleAddWordFromLibrary = (item: { word: string; meaning: string; example?: string; pronunciation?: string }) => {
    // Check for duplicates by text (case-insensitive)
    const isDuplicate = words.some(
      (w) => w.text.trim().toLowerCase() === item.word.trim().toLowerCase()
    );

    if (isDuplicate) {
      alert(`کلمه "${item.word}" قبلاً به لیست شما اضافه شده است.`);
      return;
    }

    try {
      const newWordFromLibrary: LeitnerWord = {
        id: Date.now().toString(),
        text: item.word.trim(),
        // Assuming 'meaning' from JSON can be used as 'pronunciation' for the Leitner system.
        // Adjust if your JSON has a specific 'pronunciation' field or if it should be empty.
        pronunciation: item.meaning.trim(), // Or use item.pronunciation if that's the intended field from JSON
        example: item.example?.trim() || "",
        level: 1, // New words from library start at level 1
        lastTested: null,
      };

      // It's generally better to update based on the latest state from localStorage
      // to avoid race conditions if the app could be open in multiple tabs (though less likely for a widget).
      // However, for simplicity and given it's a single-user widget context, updating current 'words' state directly is often fine.
      const existingWordsString = localStorage.getItem(LEITNER_STORAGE_KEY);
      const currentWords: LeitnerWord[] = existingWordsString
        ? JSON.parse(existingWordsString)
        : [];
      const updatedWords = [...currentWords, newWordFromLibrary];

      localStorage.setItem(LEITNER_STORAGE_KEY, JSON.stringify(updatedWords));
      setWords(updatedWords); // Update the state to reflect the change in UI

      console.log("Word added from library:", newWordFromLibrary);
      alert(`کلمه "${item.word}" با موفقیت به سطح ۱ اضافه شد.`);
      // Optionally, disable the add button for this item in the library list or provide other visual feedback.
    } catch (error) {
      console.error("Failed to add word from library to localStorage:", error);
      alert("خطا در افزودن کلمه از کتابخانه. لطفا کنسول را بررسی کنید.");
    }
  };

  const playPronunciation = async (wordText: string, wordId: string) => {
    if (isLoadingPronunciation && playingWordId === wordId) return; // Prevent multiple requests for the same word while loading

    setIsLoadingPronunciation(true);
    setPlayingWordId(wordId);

    // Attempt to use user-provided pronunciation first if available
    const currentWord = words.find((w) => w.id === wordId);
    if (
      currentWord?.pronunciation &&
      currentWord.pronunciation.startsWith("//ssl.gstatic.com")
    ) {
      // This is a quick check if the stored pronunciation is likely a direct gstatic URL
      // A more robust check might be needed if various audio URL formats are stored.
      try {
        const audio = new Audio(currentWord.pronunciation);
        await audio.play();
        setIsLoadingPronunciation(false);
        setPlayingWordId(null);
        return;
      } catch (e) {
        console.warn(
          "Could not play stored pronunciation, falling back to API:",
          e
        );
        // Fall through to API if playing stored one fails
      }
    }

    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${wordText}`
      );
      if (!response.ok) {
        // Try to get error message from API if available
        let errorMsg = `کلمه "${wordText}" یافت نشد یا خطایی در دریافت تلفظ رخ داد.`;
        try {
          const errorData = await response.json();
          if (errorData.title && errorData.message) {
            errorMsg = `${errorData.title}: ${errorData.message}`;
          }
        } catch (jsonError) {
          // Ignore if error response is not JSON
        }
        throw new Error(errorMsg);
      }
      const data = await response.json();
      let audioUrl = "";
      if (data && data.length > 0) {
        const phonetics = data[0].phonetics;
        if (phonetics && phonetics.length > 0) {
          for (const p of phonetics) {
            if (p.audio && p.audio.length > 0) {
              audioUrl = p.audio;
              // Prefer GB audio if available, otherwise take any
              if (p.audio.includes("_gb_")) {
                break;
              }
            }
          }
        }
      }

      if (audioUrl) {
        const audio = new Audio(audioUrl);
        await audio.play();
        // Optionally, save this fetched audio URL back to the word in localStorage/state
        // This could reduce future API calls for the same word.
        // const wordIndex = words.findIndex(w => w.id === wordId);
        // if (wordIndex !== -1) {
        //   const updatedWords = [...words];
        //   updatedWords[wordIndex].pronunciation = audioUrl; // Assuming pronunciation field can store URL
        //   setWords(updatedWords);
        //   localStorage.setItem(LEITNER_STORAGE_KEY, JSON.stringify(updatedWords));
        // }
      } else {
        alert(`تلفظ صوتی برای کلمه "${wordText}" یافت نشد.`);
      }
    } catch (error: any) {
      console.error("Error fetching pronunciation:", error);
      alert(error.message || "خطا در دریافت تلفظ.");
    } finally {
      setIsLoadingPronunciation(false);
      setPlayingWordId(null);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg h-full flex flex-col text-gray-900 dark:text-white">
      {/* Header: Add Word & Take Exam Buttons */}
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">لایتنر زبان آموز</h2>
        <div className="flex space-x-2 space-x-reverse">
          <button
            onClick={openAddWordForm}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm"
            disabled={isExamMode} // Disable if in exam mode
          >
            افزودن کلمه
          </button>
          <button
            onClick={startExam}
            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm"
            disabled={isExamMode} // Disable if already in exam mode
          >
            گرفتن امتحان
          </button>
          <button
            onClick={openWordLibraryCustom} // Using the new function name
            className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded-md text-sm"
            disabled={isExamMode || showAddWordForm} // Disable if in exam mode or add word form is open
          >
            کتابخانه کلمات
          </button>
        </div>
      </div>

      {!showAddWordForm && !isExamMode && !showWordLibrary && (
        <div className="mb-4 flex border-b border-gray-200 dark:border-gray-700">
          <TabNavigation
            layoutId="language-learner-tabs"
            tabs={tabsLanguageLearner}
            activeTab={activeTab}
            onTabClick={handleTabClick}
          />
        </div>
      )}

      {/* Content Area */}
      <div className="flex-grow overflow-y-auto">
        {showWordLibrary ? (
          // Word Library Area
          <div className="p-2 flex flex-col h-full">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">
                {selectedCategory ? `کلمات: ${selectedCategory.name}` : "کتابخانه کلمات"}
              </h3>
              <button
                onClick={() => {
                  setShowWordLibrary(false);
                  setSelectedCategory(null);
                  setSelectedRankKey(null); // Reset rank key on close
                  setActiveTab(1);
                }}
                className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm"
              >
                بستن
              </button>
            </div>

            {isLoadingCategories && (
              <div className="flex-grow flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">در حال بارگذاری دسته‌بندی‌ها...</p>
              </div>
            )}

            {categoriesError && (
              <div className="flex-grow flex flex-col items-center justify-center">
                <p className="text-red-500 dark:text-red-400">خطا در بارگذاری دسته‌بندی‌ها: {categoriesError.message}</p>
                <button onClick={() => window.location.reload()} className="mt-2 px-3 py-1 bg-blue-500 text-white rounded">بارگذاری مجدد</button>
              </div>
            )}

            {!isLoadingCategories && !categoriesError && !selectedCategory && wordCategories && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">یک دسته‌بندی را انتخاب کنید:</p>
                {wordCategories.map((category) => (
                  <button
                    key={category.url} // Using URL as key, assuming it's unique
                    onClick={() => setSelectedCategory(category)}
                    className="w-full text-left p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            )}

            {selectedCategory && (
              <>
                {isLoadingLibraryWords && (
                  <div className="flex-grow flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400">در حال بارگذاری کلمات از {selectedCategory.name}...</p>
                  </div>
                )}

                {/* Error for library words is handled by useEffect. */}

                {/* Ranked Words Display */}
                {selectedCategory.type === 'ranked' && libraryWords && typeof libraryWords === 'object' && !Array.isArray(libraryWords) && (
                  <>
                    {!selectedRankKey ? (
                      // Display Rank Keys
                      <div className="flex-grow overflow-y-auto space-y-2">
                        <button
                          onClick={() => {
                            setSelectedCategory(null);
                            setSelectedRankKey(null); // Ensure rank key is reset
                          }}
                          className="mb-3 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm"
                        >
                          &rarr; بازگشت به دسته‌بندی‌ها
                        </button>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">یک رتبه را انتخاب کنید:</p>
                        {Object.keys(libraryWords).length > 0 ? (
                          Object.keys(libraryWords).map((rankKey) => (
                            <button
                              key={rankKey}
                              onClick={() => setSelectedRankKey(rankKey)}
                              className="w-full text-left p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
                            >
                              {rankKey}
                            </button>
                          ))
                        ) : (
                          <p>رتبه‌بندی‌ای در این دسته‌بندی یافت نشد.</p>
                        )}
                      </div>
                    ) : (
                      // Display Words for Selected Rank
                      <div className="flex-grow overflow-y-auto space-y-2">
                        <button
                          onClick={() => setSelectedRankKey(null)}
                          className="mb-3 px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md text-sm"
                        >
                          &rarr; بازگشت به لیست رنک‌ها
                        </button>
                        {(libraryWords[selectedRankKey] as LibraryWordItem[] || []).length > 0 ? (
                          (libraryWords[selectedRankKey] as LibraryWordItem[]).map((item, index) => {
                            const isAdded = words.some(w => w.text.trim().toLowerCase() === item.word.trim().toLowerCase());
                            return (
                              <div key={index} className={`p-3 rounded-md shadow ${isAdded ? 'bg-green-100 dark:bg-green-800' : 'bg-gray-50 dark:bg-gray-700'}`}>
                                <div className="flex justify-between items-center">
                                  <h4 className={`font-semibold text-md ${isAdded ? 'text-green-700 dark:text-green-300' : ''}`}>{item.word}</h4>
                                  <button
                                    onClick={() => handleAddWordFromLibrary(item)}
                                    className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded-md text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isAdded}
                                  >
                                    {isAdded ? "اضافه شده" : "افزودن"}
                                  </button>
                                </div>
                                <p className={`text-sm mt-1 ${isAdded ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-300'}`}>{item.meaning}</p>
                                {item.example && (
                                  <p className={`text-xs mt-1 italic whitespace-pre-wrap ${isAdded ? 'text-green-500 dark:text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                    مثال: {item.example}
                                  </p>
                                )}
                              </div>
                            );
                          })
                        ) : (
                           <p>کلمه‌ای در رتبه "{selectedRankKey}" یافت نشد.</p>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Simple List Display (if category type is not 'ranked' or is undefined) */}
                {selectedCategory.type !== 'ranked' && Array.isArray(libraryWords) && (
                  <div className="flex-grow overflow-y-auto space-y-2">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className="mb-3 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm"
                      >
                        &rarr; بازگشت به دسته‌بندی‌ها
                    </button>
                    {libraryWords.length > 0 ? (
                      libraryWords.map((item, index) => {
                        const isAdded = words.some(w => w.text.trim().toLowerCase() === item.word.trim().toLowerCase());
                        // Assuming item here is LibraryWordItem
                        return (
                          <div key={index} className={`p-3 rounded-md shadow ${isAdded ? 'bg-green-100 dark:bg-green-800' : 'bg-gray-50 dark:bg-gray-700'}`}>
                            <div className="flex justify-between items-center">
                              <h4 className={`font-semibold text-md ${isAdded ? 'text-green-700 dark:text-green-300' : ''}`}>{item.word}</h4>
                              <button
                                onClick={() => handleAddWordFromLibrary(item)}
                                className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded-md text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isAdded}
                              >
                                {isAdded ? "اضافه شده" : "افزودن"}
                              </button>
                            </div>
                            <p className={`text-sm mt-1 ${isAdded ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-300'}`}>{item.meaning}</p>
                            {item.example && (
                              <p className={`text-xs mt-1 italic whitespace-pre-wrap ${isAdded ? 'text-green-500 dark:text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                مثال: {item.example}
                              </p>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p>کلمه‌ای در دسته‌بندی "{selectedCategory.name}" یافت نشد یا لیست خالی است.</p>
                    )}
                  </div>
                )}

                {/* Fallback for empty or error in libraryWords (when not loading) */}
                {!isLoadingLibraryWords && !libraryWordsError &&
                  ((selectedCategory.type === 'ranked' && (!libraryWords || Object.keys(libraryWords).length === 0)) ||
                   (selectedCategory.type !== 'ranked' && (!libraryWords || !Array.isArray(libraryWords) || libraryWords.length === 0))) &&
                  (
                    <div className="flex-grow flex flex-col items-center justify-center">
                      <p className="text-gray-500 dark:text-gray-400 mb-4">محتوایی برای دسته‌بندی "{selectedCategory.name}" یافت نشد.</p>
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm"
                      >
                        &rarr; بازگشت به دسته‌بندی‌ها
                      </button>
                    </div>
                  )
                }
              </>
            )}
          </div>
        ) : isExamMode ? (
          // Exam Mode Area
          <div className="p-4 flex flex-col items-center justify-center h-full">
            {examWords.length > 0 && currentExamWordIndex < examWords.length ? (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  کلمه {currentExamWordIndex + 1} از {examWords.length}
                </p>
                <h3 className="text-3xl font-bold mb-4 dark:text-white">
                  {examWords[currentExamWordIndex].text}
                </h3>

                {!showExamAnswer && (
                  <button
                    onClick={handleShowAnswer}
                    className="mb-4 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md"
                  >
                    نمایش پاسخ
                  </button>
                )}

                {showExamAnswer && (
                  <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md text-center">
                    {examWords[currentExamWordIndex].pronunciation && (
                      <p className="text-md dark:text-gray-300">
                        تلفظ:{" "}
                        {examWords[
                          currentExamWordIndex
                        ].pronunciation.startsWith("//ssl.gstatic.com")
                          ? "(از API)"
                          : examWords[currentExamWordIndex].pronunciation}
                        <button
                          onClick={() =>
                            playPronunciation(
                              examWords[currentExamWordIndex].text,
                              examWords[currentExamWordIndex].id
                            )
                          }
                          className="ml-2 text-blue-500 hover:text-blue-700"
                          disabled={
                            isLoadingPronunciation &&
                            playingWordId === examWords[currentExamWordIndex].id
                          }
                        >
                          {isLoadingPronunciation &&
                          playingWordId === examWords[currentExamWordIndex].id
                            ? "⏳"
                            : "🔊"}
                        </button>
                      </p>
                    )}
                    <p className="text-md mt-1 dark:text-gray-300 whitespace-pre-wrap">
                      مثال:{" "}
                      {examWords[currentExamWordIndex].example || (
                        <span className="italic text-gray-500 dark:text-gray-400">
                          بدون مثال
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {showExamAnswer && (
                  <div className="flex space-x-4 space-x-reverse">
                    <button
                      onClick={() => handleExamAnswer(true)}
                      className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md"
                    >
                      درست گفتم
                    </button>
                    <button
                      onClick={() => handleExamAnswer(false)}
                      className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md"
                    >
                      غلط گفتم
                    </button>
                  </div>
                )}
                {examFeedback && showExamAnswer && (
                  <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                    {examFeedback}
                  </p>
                )}
              </>
            ) : (
              <p className="text-gray-700 dark:text-gray-300">
                بارگذاری آزمون...
              </p> // Or end of exam message if needed here
            )}
          </div>
        ) : showAddWordForm ? (
          // Add Word Form Area
          <div className="p-2">
            <h3 className="text-lg font-semibold mb-3">افزودن کلمه جدید</h3>
            {/* Form elements will go here */}
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="word-input"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {editingWord ? "ویرایش کلمه" : "کلمه"}
                </label>
                <input
                  type="text"
                  id="word-input"
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="pronunciation-input"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  تلفظ (اختیاری)
                </label>
                <input
                  type="text"
                  id="pronunciation-input"
                  value={pronunciationInput}
                  onChange={(e) => setPronunciationInput(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="example-input"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  مثال
                </label>
                <textarea
                  id="example-input"
                  rows={3}
                  value={exampleInput}
                  onChange={(e) => setExampleInput(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSaveWord}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm"
                >
                  {editingWord ? "به‌روزرسانی کلمه" : "ذخیره کلمه"}
                </button>
                <button
                  onClick={() => {
                    setShowAddWordForm(false);
                    setEditingWord(null); // Clear editing state on cancel
                    if (activeTab === 0 && editingWord)
                      setActiveTab(editingWord.level);
                    // Go back to original level if was editing
                    else if (activeTab === 0) setActiveTab(1); // Go back to level 1 tab or last active tab
                  }}
                  className="mr-2 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md text-sm"
                >
                  لغو
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Word List Area
          <div className="p-2 space-y-2">
            {activeTab > 0 &&
              words.filter((word) => word.level === activeTab).length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 pt-4">
                  هیچ کلمه‌ای در سطح {activeTab} وجود ندارد.
                </p>
              )}
            {activeTab > 0 &&
              words
                .filter((word) => word.level === activeTab)
                .map((word) => (
                  <div
                    key={word.id}
                    className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md shadow group relative cursor-pointer"
                    onClick={(e) => {
                      // Prevent toggling details if a button inside the card was clicked
                      if ((e.target as HTMLElement).closest("button")) {
                        return;
                      }
                      toggleWordDetails(word.id);
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span
                        className="font-medium flex-1 min-w-0 truncate"
                        title={word.text}
                      >
                        {word.text}
                      </span>{" "}
                      {/* Added truncate for long words */}
                      <div className="flex items-center space-x-2 space-x-reverse flex-shrink-0">
                        <button
                          title="پخش تلفظ"
                          onClick={(e) => {
                            e.stopPropagation();
                            playPronunciation(word.text, word.id);
                          }}
                          className={`text-blue-500 hover:text-blue-700 ${
                            isLoadingPronunciation && playingWordId === word.id
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          disabled={
                            isLoadingPronunciation && playingWordId === word.id
                          }
                        >
                          {isLoadingPronunciation && playingWordId === word.id
                            ? "⏳"
                            : "🔊"}
                        </button>
                        {/* Edit and Delete buttons - shown on hover (using group-hover) or always visible */}
                        <button
                          title="ویرایش کلمه"
                          onClick={() => handleEditWordClick(word)}
                          className="text-yellow-500 hover:text-yellow-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✏️
                        </button>
                        <button
                          title="حذف کلمه"
                          onClick={() =>
                            handleDeleteWordClick(word.id, word.text)
                          }
                          className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    {expandedWordId === word.id && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                        {word.example ? (
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            <strong>مثال:</strong> {word.example}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                            مثالی برای این کلمه وارد نشده است.
                          </p>
                        )}
                        {/* Optionally, display pronunciation text if available and different from API one */}
                        {word.pronunciation &&
                          !word.pronunciation.startsWith(
                            "//ssl.gstatic.com"
                          ) && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              <strong>تلفظ (دستی):</strong> {word.pronunciation}
                            </p>
                          )}
                      </div>
                    )}
                  </div>
                ))}
            {/* Fallback if no tab is selected but not in add form (should not happen with current logic) */}
            {activeTab === 0 && !showAddWordForm && (
              <p className="text-center text-gray-500 dark:text-gray-400 pt-4">
                لطفا یک سطح را انتخاب کنید یا کلمه جدید اضافه کنید.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LanguageLearnerWidget;
