import React, { useState } from "react";
import { Button } from "@/components/button/button";
import { useWords } from "../context/words.context";
import { TextInput } from "@/components/text-input";
import { LeitnerWord } from "../LanguageLearnerLayout";

interface WordFormProps {
  word?: LeitnerWord;
  onClose: () => void;
  className?: string;
}

export default function WordForm({ word, onClose, className }: WordFormProps) {
  const [text, setText] = useState(word?.text || "");
  const [translation, setTranslation] = useState(word?.translation || "");
  const [example, setExample] = useState(word?.example || "");
  const { addWord, updateWord } = useWords();

  const isEditMode = !!word;

  const handleSubmit = () => {
    if (text && translation) {
      if (isEditMode) {
        updateWord({ ...word, text, translation, example });
        onClose();
      } else {
        addWord({ text, translation, example });
        onClose();
      }
    }
  };

  const formClassName =
    className ?? "space-y-2 p-2 rounded-lg border border-base-300 mb-2";

  return (
    <div className={formClassName}>
      <div>
        <label
          htmlFor="main-word"
          className="text-xs font-medium text-content/80 mb-1 block"
        >
          کلمه اصلی
        </label>
        <TextInput
          id="main-word"
          value={text}
          onChange={setText}
          placeholder="e.g., 'Hello'"
        />
      </div>
      <div>
        <label
          htmlFor="translation"
          className="text-xs font-medium text-content/80 mb-1 block"
        >
          ترجمه
        </label>
        <TextInput
          id="translation"
          value={translation}
          onChange={setTranslation}
          placeholder="e.g., 'سلام'"
        />
      </div>
      <div>
        <label
          htmlFor="example"
          className="text-xs font-medium text-content/80 mb-1 block"
        >
          مثال (اختیاری)
        </label>
        <TextInput
          id="example"
          value={example}
          onChange={setExample}
          placeholder="e.g., 'Hello, world!'"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" onClick={onClose}>
          انصراف
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!text || !translation}
        >
          {isEditMode ? "ذخیره" : "افزودن"}
        </Button>
      </div>
    </div>
  );
}
