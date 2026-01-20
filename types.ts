
export interface Character {
  id: string;
  name: string;
  attributes: string;
}

export interface ForeshadowingNote {
  id: string;
  targetChapterId: number; // The chapter where the reveal happens
  revealDescription: string; // What will be revealed (e.g., "The witch is the hero's mother")
  foreshadowingHint: string; // How to hint at this in earlier chapters (e.g., "The witch shows maternal concern")
  createdAt: number; // Timestamp for ordering
}

export interface Chapter {
  id: number;
  title: string;
  summary: string;
  content?: string; // Optional - only present when chapter is generated
  detailedSummary?: string; // Detailed summary generated from the full chapter content, includes unresolved events
  status: 'pending' | 'generating' | 'completed' | 'error';
  characterIds?: string[]; // IDs of characters participating in this chapter
  foreshadowingNotes?: ForeshadowingNote[]; // Notes for events that will be revealed in this chapter
  foreshadowing?: string[]; // Array of foreshadowing hints for this chapter
  acceptanceCriteria?: string; // Criteria that the generated chapter must meet
  validationResult?: {
    passed: boolean;
    feedback: string;
    timestamp: number;
  };
}

export interface ChapterOutcome {
  title: string;
  summary: string;
  description: string;
}

export type ReadingLevel = 'elementary' | 'middle-grade' | 'young-adult' | 'adult';

export interface StoryState {
  title: string;
  genre: string;
  numChapters: number;
  readingLevel: ReadingLevel;
  characters: Character[];
  outline: Chapter[];
  currentStep: 'setup' | 'outline' | 'manual-generation' | 'generating' | 'reader';
  plotOutline?: string; // The initial plot outline/idea
  systemPrompt?: string;
  foreshadowingNotes?: ForeshadowingNote[]; // Global foreshadowing notes for the story
  chapterOutcomes?: ChapterOutcome[]; // Suggested outcomes for the next chapter in continuous mode
}

export enum GenerationStatus {
  IDLE = 'idle',
  OUTLINE = 'outline',
  CHAPTERS = 'chapters',
  COMPLETE = 'complete',
  ERROR = 'error'
}

export interface StoryTemplate {
  title: string;
  genre: string;
  numChapters: number;
  readingLevel: ReadingLevel;
  plotOutline: string;
  characters: Character[];
  systemPrompt?: string;
}

export interface SavedStory {
  id: string;
  state: StoryState;
  savedAt: number;
  lastModified: number;
  progress: number; // Percentage of chapters completed (0-100)
}
