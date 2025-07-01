import React, { useState, useEffect, useMemo } from 'react';
import Tooltip from '@/components/toolTip';
import { TabManager, type TabItem } from '@/components/tab-manager';
import { Button } from '@/components/button/button';
import { TextInput } from '@/components/text-input';
import toast from 'react-hot-toast';
import {
  FiPlusSquare,   // For Add new word
  FiClipboard,    // For Take Exam
  FiEdit3,        // For Edit word
  FiTrash2,       // For Delete word
  FiVolume2,      // For Play sound
  FiCheckCircle,  // For Correct answer in exam
  FiXCircle,      // For Incorrect answer in exam
  FiEye,          // For Show answer in exam
  FiAlertTriangle // For general warning/info if needed
} from 'react-icons/fi'; // Using Feather Icons as a consistent set for now
// import './LanguageLearnerWidget.css'; // Add if custom CSS is needed

// Define the structure of a word item
interface LeitnerWord {
  id: string;
  text: string;
  pronunciation: string;
  example: string;
  level: number;
  lastTested: number | null;
}

const LEITNER_STORAGE_KEY = 'leitnerWordsApp';

const LanguageLearnerWidget: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("1"); // Changed to string for TabManager
  const [showAddWordForm, setShowAddWordForm] = useState<boolean>(false);

  // State for form inputs
  const [wordInput, setWordInput] = useState<string>('');
  const [pronunciationInput, setPronunciationInput] = useState<string>('');
  const [exampleInput, setExampleInput] = useState<string>('');

  const [words, setWords] = useState<LeitnerWord[]>([]);
  const [isLoadingPronunciation, setIsLoadingPronunciation] = useState<boolean>(false);
  const [playingWordId, setPlayingWordId] = useState<string | null>(null);
  const [editingWord, setEditingWord] = useState<LeitnerWord | null>(null);
  const [expandedWordId, setExpandedWordId] = useState<string | null>(null);

  // Exam State
  const [isExamMode, setIsExamMode] = useState<boolean>(false);
  const [examWords, setExamWords] = useState<LeitnerWord[]>([]);
  const [currentExamWordIndex, setCurrentExamWordIndex] = useState<number>(0);
  const [showExamAnswer, setShowExamAnswer] = useState<boolean>(false);
  const [examFeedback, setExamFeedback] = useState<string>(''); // e.g., "Correct!", "Incorrect. Level down."

  const LAST_GENERAL_EXAM_TIME_KEY = 'leitnerLastGeneralExamTime';
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

  // const handleTabClick = (tabIndex: number) => { // Replaced by TabManager's onTabChange
  //   setActiveTab(tabIndex);
  //   setShowAddWordForm(false); // Hide form when changing tabs
  // };

  const handleSaveWord = () => {
    if (!wordInput.trim()) {
      toast.error('فیلد "کلمه" نمی‌تواند خالی باشد.');
      return;
    }

    try {
      let updatedWordsArray: LeitnerWord[];
      let targetLevelValue: number;

      if (editingWord) {
        // Update existing word
        updatedWordsArray = words.map(w =>
          w.id === editingWord.id
            ? {
                ...w,
                text: wordInput.trim(),
                pronunciation: pronunciationInput.trim(),
                example: exampleInput.trim(),
              }
            : w
        );
        targetLevelValue = editingWord.level;
        console.log('Word updated:', editingWord.id);
        setEditingWord(null);
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
        const currentWords: LeitnerWord[] = existingWordsString ? JSON.parse(existingWordsString) : [];
        updatedWords = [...currentWords, newWord];
        targetLevel = newWord.level;
        console.log('Word saved:', newWord);
      }

      localStorage.setItem(LEITNER_STORAGE_KEY, JSON.stringify(updatedWords));
      setWords(updatedWords);

      // Clear form inputs
      setWordInput('');
      setPronunciationInput('');
      setExampleInput('');
      setShowAddWordForm(false);
      setActiveTab(targetLevel);
      toast.success(editingWord ? 'کلمه با موفقیت به‌روزرسانی شد!' : 'کلمه با موفقیت ذخیره شد!');

    } catch (error) {
      console.error("Failed to save/update word to localStorage:", error);
      toast.error("خطا در ذخیره/به‌روزرسانی کلمه. لطفا کنسول را بررسی کنید.");
    }
  };

  const openAddWordForm = () => {
    setWordInput('');
    setPronunciationInput('');
    setExampleInput('');
    setEditingWord(null);
    setShowAddWordForm(true);
    // setActiveTab("0") or a specific value is not needed here as TabManager won't be shown
  }

  const handleEditWordClick = (word: LeitnerWord) => {
    setEditingWord(word);
    setWordInput(word.text);
    setPronunciationInput(word.pronunciation);
    setExampleInput(word.example);
    setShowAddWordForm(true);
    // No need to change activeTab here, form will overlay TabManager
  };

  const handleDeleteWordClick = (wordId: string, wordText: string) => {
    toast((t) => (
      <div className="flex flex-col items-center">
        <span className="text-center">آیا از حذف کلمه "{wordText}" مطمئن هستید؟</span>
        <div className="mt-3 flex space-x-2 space-x-reverse">
          <Button
            size="sm"
            className="bg-red-500 hover:bg-red-600 text-white"
            onClick={() => {
              try {
                const updatedWords = words.filter(w => w.id !== wordId);
                localStorage.setItem(LEITNER_STORAGE_KEY, JSON.stringify(updatedWords));
                setWords(updatedWords);
                toast.dismiss(t.id);
                toast.success(`کلمه "${wordText}" با موفقیت حذف شد.`);
                console.log('Word deleted:', wordId);
                if (editingWord && editingWord.id === wordId) {
                  setEditingWord(null);
                  setWordInput('');
                  setPronunciationInput('');
                  setExampleInput('');
                }
              } catch (error) {
                console.error("Failed to delete word from localStorage:", error);
                toast.error("خطا در حذف کلمه. لطفا کنسول را بررسی کنید.");
                toast.dismiss(t.id);
              }
            }}
          >
            بله، حذف کن
          </Button>
          <Button
            size="sm"
            className="bg-gray-300 hover:bg-gray-400 text-gray-800"
            onClick={() => toast.dismiss(t.id)}
          >
            لغو
          </Button>
        </div>
      </div>
    ), {
      duration: 6000, // Keep the toast longer for confirmation
    });
  };

  const toggleWordDetails = (wordId: string) => {
    setExpandedWordId(prevExpandedId => (prevExpandedId === wordId ? null : wordId));
  };

  // --- EXAM LOGIC ---
  const canTakeGeneralExam = (): boolean => {
    const lastExamTimeStr = localStorage.getItem(LAST_GENERAL_EXAM_TIME_KEY);
    if (!lastExamTimeStr) return true; // Never taken an exam
    const lastExamTime = parseInt(lastExamTimeStr, 10);
    return (Date.now() - lastExamTime) >= THREE_HOURS_MS;
  };

  const getWordsForExam = (): LeitnerWord[] => {
    const now = Date.now();
    const eligibleWords = words.filter(word => {
      if (word.level >= 1 && word.level <= 4) {
        return true;
      }
      const lastTestedTime = word.lastTested;
      if (!lastTestedTime) return true; // Never tested before

      if (word.level === 5) {
        return (now - lastTestedTime) >= ONE_DAY_MS;
      }
      if (word.level === 6) {
        return (now - lastTestedTime) >= THREE_DAYS_MS;
      }
      if (word.level === 7) {
        return (now - lastTestedTime) >= ONE_WEEK_MS;
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
      toast.error(`شما به تازگی امتحان داده‌اید. ${timeRemainingMsg}`);
      return;
    }

    const wordsForSession = getWordsForExam();
    if (wordsForSession.length === 0) {
      toast.info("در حال حاضر کلمه‌ای برای امتحان وجود ندارد. لطفا کلمات بیشتری اضافه کنید یا صبر کنید تا زمان آزمون کلمات فعلی فرا برسد.");
      return;
    }

    setExamWords(wordsForSession);
    setCurrentExamWordIndex(0);
    setShowExamAnswer(false);
    setExamFeedback('');
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
      setExamFeedback(`عالی بود! "${currentWord.text}" به سطح ${newLevel} رفت.`);
    } else {
      newLevel = Math.max(1, currentWord.level - 1);
      setExamFeedback(`اشکالی نداره. "${currentWord.text}" به سطح ${newLevel} برگشت.`);
    }

    const updatedWordData: LeitnerWord = {
      ...currentWord,
      level: newLevel,
      lastTested: Date.now(),
    };

    // Update the word in the main 'words' state and localStorage
    const mainWordsUpdated = words.map(w => w.id === currentWord.id ? updatedWordData : w);
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
    setExamFeedback(`امتحان تمام شد! برای امتحان بعدی باید حداقل ۳ ساعت صبر کنید.`); // This feedback will be shown briefly
    // Consider showing a summary or just going back to the main view
    setActiveTab("1"); // Go back to level 1 or a summary tab if implemented
    // Reset exam states
    setExamWords([]);
    setCurrentExamWordIndex(0);
    setShowExamAnswer(false);
    // examFeedback is already set
    toast.success(examFeedback || "امتحان تمام شد! برای امتحان بعدی باید حداقل ۳ ساعت صبر کنید.", { duration: 4000});
  };
  // --- END OF EXAM LOGIC ---

  const getTakeExamTooltipContent = () => {
    if (!canTakeGeneralExam()) {
      const lastExamTimeStr = localStorage.getItem(LAST_GENERAL_EXAM_TIME_KEY);
      if (lastExamTimeStr) {
        const lastExamTime = parseInt(lastExamTimeStr, 10);
        const timePassed = Date.now() - lastExamTime;
        const timeRemaining = THREE_HOURS_MS - timePassed;
        if (timeRemaining > 0) {
          const minutesRemaining = Math.ceil(timeRemaining / (60 * 1000));
          return `تا آزمون بعدی حدود ${minutesRemaining} دقیقه باقی مانده است.`;
        }
      }
      return "شما به تازگی امتحان داده‌اید. لطفا ۳ ساعت صبر کنید.";
    }
    return "گرفتن امتحان";
  };

  const playPronunciation = async (wordText: string, wordId: string) => {
    if (isLoadingPronunciation && playingWordId === wordId) return; // Prevent multiple requests for the same word while loading

    setIsLoadingPronunciation(true);
    setPlayingWordId(wordId);

    // Attempt to use user-provided pronunciation first if available
    const currentWord = words.find(w => w.id === wordId);
    if (currentWord?.pronunciation && currentWord.pronunciation.startsWith('//ssl.gstatic.com')) {
        // This is a quick check if the stored pronunciation is likely a direct gstatic URL
        // A more robust check might be needed if various audio URL formats are stored.
        try {
            const audio = new Audio(currentWord.pronunciation);
            await audio.play();
            setIsLoadingPronunciation(false);
            setPlayingWordId(null);
            return;
        } catch (e) {
            console.warn("Could not play stored pronunciation, falling back to API:", e);
            // Fall through to API if playing stored one fails
        }
    }


    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${wordText}`);
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
      let audioUrl = '';
      if (data && data.length > 0) {
        const phonetics = data[0].phonetics;
        if (phonetics && phonetics.length > 0) {
          for (const p of phonetics) {
            if (p.audio && p.audio.length > 0) {
              audioUrl = p.audio;
              // Prefer GB audio if available, otherwise take any
              if (p.audio.includes('_gb_')) {
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
        toast.error(`تلفظ صوتی برای کلمه "${wordText}" یافت نشد.`);
      }
    } catch (error: any) {
      console.error("Error fetching pronunciation:", error);
      toast.error(error.message || "خطا در دریافت تلفظ.");
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
          <Tooltip content="افزودن کلمه جدید">
            {/* Ensure Tooltip can correctly wrap a disabled Button or use a wrapper div if needed */}
            {/* For DaisyUI/Button component, disabled styling should be inherent */}
            <Button
              size="sm" // or "xs" for smaller
              className="btn-square btn-ghost" // btn-ghost for minimal styling, btn-square for square shape
              onClick={openAddWordForm}
              disabled={isExamMode}
              aria-label="افزودن کلمه جدید"
            >
              <FiPlusSquare size={18} />
            </Button>
          </Tooltip>
          <Tooltip content={getTakeExamTooltipContent()}>
             {/* Wrapper div for tooltip on disabled button if Button component doesn't handle it well */}
            <div className={`${(!canTakeGeneralExam() || isExamMode) ? 'cursor-not-allowed' : ''}`}>
              <Button
                size="sm" // or "xs"
                className="btn-square btn-ghost"
                onClick={startExam}
                disabled={isExamMode || !canTakeGeneralExam()}
                aria-label="گرفتن امتحان"
              >
                <FiClipboard size={18} />
              </Button>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* Tabs for Levels - Hide if in exam mode or add word form */}
      {!showAddWordForm && !isExamMode && (
         <TabManager
            tabs={useMemo(() =>
                Array.from({ length: TABS_COUNT }, (_, i) => i + 1).map(level => ({
                    label: `سطح ${level}`,
                    value: level.toString(),
                    icon: null, // Or a relevant icon like <VscCircleSmallFilled />
                    element: (
                        <div className="p-1 space-y-2 h-full overflow-y-auto small-scrollbar">
                            {words.filter(word => word.level === level).length === 0 && (
                                <p className="text-center text-gray-500 dark:text-gray-400 pt-4">
                                    هیچ کلمه‌ای در سطح {level} وجود ندارد.
                                </p>
                            )}
                            {words.filter(word => word.level === level).map(word => (
                                <div key={word.id} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md shadow group relative cursor-pointer" onClick={(e) => {
                                    if ((e.target as HTMLElement).closest('button')) return;
                                    toggleWordDetails(word.id);
                                }}>
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium flex-1 min-w-0 truncate" title={word.text}>{word.text}</span>
                                        <div className="flex items-center space-x-1 space-x-reverse flex-shrink-0">
                                            <Tooltip content="پخش تلفظ">
                                                <Button
                                                    size="xs"
                                                    className="btn-ghost btn-circle"
                                                    onClick={(e) => { e.stopPropagation(); playPronunciation(word.text, word.id); }}
                                                    disabled={isLoadingPronunciation && playingWordId === word.id}
                                                    aria-label="پخش تلفظ"
                                                >
                                                    {isLoadingPronunciation && playingWordId === word.id ? <span className="loading loading-spinner loading-xs"></span> : <FiVolume2 size={16} />}
                                                </Button>
                                            </Tooltip>
                                            <Tooltip content="ویرایش کلمه">
                                                <Button
                                                    size="xs"
                                                    className="btn-ghost btn-circle opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => { e.stopPropagation(); handleEditWordClick(word);}}
                                                    aria-label="ویرایش کلمه"
                                                >
                                                    <FiEdit3 size={16} />
                                                </Button>
                                            </Tooltip>
                                            <Tooltip content="حذف کلمه">
                                                <Button
                                                    size="xs"
                                                    className="btn-ghost btn-circle opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteWordClick(word.id, word.text);}}
                                                    aria-label="حذف کلمه"
                                                >
                                                    <FiTrash2 size={16} />
                                                </Button>
                                            </Tooltip>
                                        </div>
                                    </div>
                                    {expandedWordId === word.id && (
                                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                            {word.example ? (
                                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                                    <strong>مثال:</strong> {word.example}
                                                </p>
                                            ) : (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">مثالی برای این کلمه وارد نشده است.</p>
                                            )}
                                            {word.pronunciation && !word.pronunciation.startsWith('//ssl.gstatic.com') && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    <strong>تلفظ (دستی):</strong> {word.pronunciation}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                })), [words, expandedWordId, isLoadingPronunciation, playingWordId])} // Dependencies for useMemo
            selectedTab={activeTab}
            onTabChange={(newTab) => {
                setActiveTab(newTab);
                setShowAddWordForm(false);
                setExpandedWordId(null); // Close any expanded word when changing tabs
            }}
            direction="rtl"
        />
      )}

      {/* Content Area: Exam Mode and Add Word Form */}
      {/* This div will now only contain the Exam or AddWordForm, or be empty if TabManager is shown */}
      <div className={`flex-grow overflow-y-auto ${(!showAddWordForm && !isExamMode) ? 'hidden' : ''}`}>
        {isExamMode && (
          // Exam Mode Area (Content remains largely the same as before)
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
                  // Button component for "Show Answer"
                  <Button
                    size="md"
                    className="mb-4 btn-info" // Changed from isPrimary to btn-info for neutral action
                    onClick={handleShowAnswer}
                  >
                    <FiEye className="mr-2" /> نمایش پاسخ
                  </Button>
                )}

                {showExamAnswer && (
                  <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md text-center w-full max-w-md">
                    {examWords[currentExamWordIndex].pronunciation && (
                        <p className="text-md dark:text-gray-300">
                            تلفظ: {examWords[currentExamWordIndex].pronunciation.startsWith('//ssl.gstatic.com') ? '(از API)' : examWords[currentExamWordIndex].pronunciation}
                            <Tooltip content="پخش تلفظ">
                                <Button
                                    size="xs"
                                    className="btn-ghost btn-circle ml-2"
                                    onClick={() => playPronunciation(examWords[currentExamWordIndex].text, examWords[currentExamWordIndex].id)}
                                    disabled={isLoadingPronunciation && playingWordId === examWords[currentExamWordIndex].id}
                                    aria-label="پخش تلفظ"
                                >
                                     {isLoadingPronunciation && playingWordId === examWords[currentExamWordIndex].id ? <span className="loading loading-spinner loading-xs"></span> : <FiVolume2 size={16} />}
                                </Button>
                            </Tooltip>
                        </p>
                    )}
                    <p className="text-md mt-1 dark:text-gray-300 whitespace-pre-wrap">
                      مثال: {examWords[currentExamWordIndex].example || <span className="italic text-gray-500 dark:text-gray-400">بدون مثال</span>}
                    </p>
                  </div>
                )}

                {showExamAnswer && (
                  <div className="flex space-x-4 space-x-reverse">
                     {/* Button components for Correct/Incorrect */}
                    <Button
                        size="md"
                        className="btn-success" // DaisyUI success color
                        onClick={() => handleExamAnswer(true)}
                    >
                        <FiCheckCircle className="mr-2" /> درست گفتم
                    </Button>
                    <Button
                        size="md"
                        className="btn-error" // DaisyUI error color
                        onClick={() => handleExamAnswer(false)}
                    >
                        <FiXCircle className="mr-2" /> غلط گفتم
                    </Button>
                  </div>
                )}
                {examFeedback && showExamAnswer && <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">{examFeedback}</p>}
              </>
            ) : (
              // This part should ideally not be reached if exam ends correctly and isExamMode becomes false
              <p className="text-gray-700 dark:text-gray-300">پایان آزمون یا در حال بارگذاری...</p>
            )}
          </div>
        )}

        {showAddWordForm && (
          // Add Word Form Area (Content remains largely the same, but inputs/buttons will be updated next)
          <div className="p-2">
            <h3 className="text-lg font-semibold mb-3">افزودن کلمه جدید</h3>
            {/* Use a form tag for better semantics, though direct onClick on button works too */}
            <form onSubmit={(e) => { e.preventDefault(); handleSaveWord(); }} className="space-y-4">
              <div>
                <label htmlFor="word-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{editingWord ? 'ویرایش کلمه' : 'کلمه'}</label>
                <TextInput
                  id="word-input"
                  value={wordInput}
                  onChange={setWordInput}
                  placeholder="کلمه را وارد کنید"
                  className="bg-content" // Ensure it matches theme
                  size={"md" as any} // Cast if TextInputSize enum is not directly compatible
                />
              </div>
              <div>
                <label htmlFor="pronunciation-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تلفظ (اختیاری)</label>
                <TextInput
                  id="pronunciation-input"
                  value={pronunciationInput}
                  onChange={setPronunciationInput}
                  placeholder="تلفظ کلمه"
                  className="bg-content"
                  size={"md" as any}
                />
              </div>
              <div>
                <label htmlFor="example-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">مثال</label>
                <textarea
                  id="example-input"
                  rows={3}
                  value={exampleInput}
                  onChange={(e) => setExampleInput(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
              <div className="flex justify-end">
                {/* Buttons to be updated to use Button component */}
                <button
                  onClick={handleSaveWord}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm"
                >
                  {editingWord ? 'به‌روزرسانی کلمه' : 'ذخیره کلمه'}
                </button>
                <button
                  onClick={() => {
                    setShowAddWordForm(false);
                    setEditingWord(null);
                    if (!activeTab || activeTab === "0") setActiveTab("1");
                    else if (editingWord) setActiveTab(editingWord.level.toString());
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
            {activeTab > 0 && words.filter(word => word.level === activeTab).length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 pt-4">
                هیچ کلمه‌ای در سطح {activeTab} وجود ندارد.
              </p>
            )}
            {activeTab > 0 && words.filter(word => word.level === activeTab).map(word => (
              <div key={word.id} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md shadow group relative cursor-pointer" onClick={(e) => {
                // Prevent toggling details if a button inside the card was clicked
                if ((e.target as HTMLElement).closest('button')) {
                  return;
                }
                toggleWordDetails(word.id);
              }}>
                <div className="flex justify-between items-center">
                  <span className="font-medium flex-1 min-w-0 truncate" title={word.text}>{word.text}</span> {/* Added truncate for long words */}
                  <div className="flex items-center space-x-2 space-x-reverse flex-shrink-0">
                    <button
                      title="پخش تلفظ"
                      onClick={(e) => { e.stopPropagation(); playPronunciation(word.text, word.id); }}
                      className={`text-blue-500 hover:text-blue-700 ${ (isLoadingPronunciation && playingWordId === word.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => playPronunciation(word.text, word.id)}
                      disabled={isLoadingPronunciation && playingWordId === word.id}
                    >
                      { (isLoadingPronunciation && playingWordId === word.id) ? '⏳' : '🔊'}
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
                      onClick={() => handleDeleteWordClick(word.id, word.text)}
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
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">مثالی برای این کلمه وارد نشده است.</p>
                    )}
                    {/* Optionally, display pronunciation text if available and different from API one */}
                    {word.pronunciation && !word.pronunciation.startsWith('//ssl.gstatic.com') && (
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
