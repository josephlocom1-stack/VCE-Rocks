export type TimedWord = {word: string; startFrame: number; endFrame: number; sentence: number};
export type CaptionPhrase = {words: TimedWord[]; startFrame: number; endFrame: number; emphasis: number};
export const WORDS: TimedWord[] = [];
export const PHRASES: CaptionPhrase[] = [];
export const SENTENCE_STARTS = [0, 120, 300, 450, 600, 780, 930, 1110, 1290, 1470, 1650, 1830];
export const TOTAL_FRAMES = 2160;
