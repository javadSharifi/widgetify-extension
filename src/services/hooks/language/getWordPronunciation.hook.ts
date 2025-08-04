import axios from "axios";
import { URLS } from "@/layouts/widgets/languageLearner/constants";

export interface Phonetic {
  text: string;
  audio: string;
  sourceUrl: string;
  license: {
    name: string;
    url: string;
  };
}

export interface WordPronunciationResponse {
  word: string;
  phonetic: string;
  phonetics: Phonetic[];
}

export const getWordPronunciation = async (
  word: string,
): Promise<WordPronunciationResponse[]> => {
  const { data } = await axios.get(`${URLS.DICTIONARY_API}${word}`);
  return data;
};