
export interface Character {
  id: string;
  name: string;
  attributes: string;
}

export interface Chapter {
  id: number;
  title: string;
  summary: string;
  content: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  characterIds?: string[]; // IDs of characters participating in this chapter
}

export interface StoryState {
  title: string;
  genre: string;
  numChapters: number;
  characters: Character[];
  outline: Chapter[];
  currentStep: 'setup' | 'outline' | 'manual-generation' | 'generating' | 'reader';
}

export enum GenerationStatus {
  IDLE = 'idle',
  OUTLINE = 'outline',
  CHAPTERS = 'chapters',
  COMPLETE = 'complete',
  ERROR = 'error'
}
