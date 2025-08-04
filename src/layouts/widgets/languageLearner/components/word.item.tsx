import { LeitnerWord } from "../LanguageLearnerLayout";
import {
  FiChevronDown,
  FiTrash2,
  FiEdit,
  FiVolume2,
  FiBookOpen,
  FiPlayCircle,
} from "react-icons/fi";
import { useState } from "react";
import { useWords } from "../context/words.context";
import WordForm from "./word-form";
import {
  getWordPronunciation,
  WordPronunciationResponse,
} from "@/services/hooks/language/getWordPronunciation.hook";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/button/button";
import Tooltip from "@/components/toolTip";

export default function WordItem({ word }: { word: LeitnerWord }) {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { deleteWord } = useWords();
  const queryClient = useQueryClient();

  const handleDelete = () => {
    deleteWord(word.id);
  };

  const handleOpenDictionary = () => {
    window.open(
      `https://dic.b-amooz.com/en/dictionary/w?word=${word.text}`,
      "_blank"
    );
  };

  const handleOpenPlayPhrase = () => {
    window.open(
      `https://www.playphrase.me/#/search?q=%22${encodeURIComponent(
        word.text
      )}%22&language=en`,
      "_blank"
    );
  };

  const playAudio = async () => {
    const queryKey = ["wordPronunciation", word.text];
    try {
      const data = await queryClient.fetchQuery<WordPronunciationResponse[]>({
        queryKey,
        queryFn: () => getWordPronunciation(word.text),
        staleTime: 1000 * 60 * 60, // 1 hour
      });

      if (data && data.length > 0) {
        const audioUrl = data[0].phonetics.find((p) => p.audio)?.audio;
        if (audioUrl) {
          new Audio(audioUrl).play();
        } else {
          console.warn("No audio found for this word.");
        }
      }
    } catch (error) {
      console.error("Failed to fetch pronunciation", error);
    }
  };

  if (isEditing) {
    return (
      <WordForm
        word={word}
        onClose={() => setIsEditing(false)}
        className="space-y-2 p-1"
      />
    );
  }

  return (
    <div className="overflow-hidden  rounded-lg transition delay-150 duration-300 ease-in-out bg-content group ">
      <div className={"flex items-center gap-1.5 pr-1.5 p-1.5"}>
        <div
          className="flex-1 overflow-hidden cursor-pointer flex items-center gap-1"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="text-ellipsis whitespace-nowrap text-xs font-semibold">
            {word.text}
          </span>
        </div>
        <div className="flex items-center gap-x-1">
          <Tooltip content="Pronounce">
            <Button
              className="border-0 p-0 hover:bg-transparent"
              size="xs"
              onClick={playAudio}
            >
              <FiVolume2 size={13} />
            </Button>
          </Tooltip>
          <Tooltip content="Watch in the movie">
            <Button
              className="border-0 p-0 hover:bg-transparent"
              size="xs"
              onClick={handleOpenPlayPhrase}
            >
              <FiPlayCircle size={13} />
            </Button>
          </Tooltip>
          <Tooltip content="in the dictionary">
            <Button
              className="border-0 p-0 hover:bg-transparent"
              size="xs"
              onClick={handleOpenDictionary}
            >
              <FiBookOpen size={13} />
            </Button>
          </Tooltip>
          <Button
            className="border-0 p-0 hover:bg-transparent"
            size="xs"
            onClick={() => setExpanded(!expanded)}
          >
            <FiChevronDown
              size={14}
              className={`${
                expanded ? "rotate-180" : "rotate-0"
              } transition-transform duration-300`}
            />
          </Button>
        </div>
      </div>
      {expanded && (
        <div className={"px-2 pb-1.5 text-xs text-content/80 transition-all"}>
          <p className="mt-0.5 mb-1 break-words">{word.translation}</p>
          {word.example && (
            <p className="mt-0.5 mb-1 break-words">{word.example}</p>
          )}

          <div className="flex gap-2">
            <Tooltip content="Edit">
              <Button
                className="border-0 p-0 hover:bg-transparent"
                size="xs"
                onClick={() => setIsEditing(true)}
              >
                <FiEdit size={13} />
              </Button>
            </Tooltip>

            <Tooltip content="Delete">
              <Button
                className="border-0 p-0 hover:bg-transparent"
                size="xs"
                onClick={handleDelete}
              >
                <FiTrash2 size={13} />
              </Button>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
}
