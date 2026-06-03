// ─── Type Definitions for TürkçeAI ───────────────────────────────────────────

export interface VocabItem {
  id: string;
  tr: string;           // Turkish word
  ar: string;           // Arabic meaning
  en: string;           // English meaning
  pronunciation: string; // phonetic guide
  example_tr: string;   // example sentence in Turkish
  example_ar: string;   // Arabic translation of example
  example_en?: string;
  tags: string[];       // verb, noun, adj, phrase, etc.
  level: 'B1' | 'B2';
  section: string;      // section id
  lessonId: string;
}

export interface Exercise {
  id: string;
  type: 'fill_blank' | 'match' | 'translate' | 'multiple_choice';
  question: string;
  questionAr?: string;
  options?: string[];
  answer: string;
  explanation?: string;
}

export interface Lesson {
  id: string;
  title: string;       // Arabic title
  titleTr: string;     // Turkish title
  vocabulary: VocabItem[];
  grammar: string;     // HTML string, Arabic explanation
  exercises: Exercise[];
  xpReward: number;
}

export interface Section {
  id: string;
  title: string;       // Arabic title
  titleTr: string;
  emoji: string;
  lessons: Lesson[];
}

export interface Phase {
  id: 'b1' | 'b2';
  label: string;
  description: string;
  color: string;
  sections: Section[];
}

export interface Curriculum {
  phases: Phase[];
}

// ─── User Progress ────────────────────────────────────────────────────────────

export interface UserProfile {
  name: string;
  avatar: string;
  joinDate: string;
  totalXP: number;
  currentLevel: 'B1' | 'B2';
}

export interface StreakData {
  current: number;
  longest: number;
  lastDate: string;
}

export interface LessonProgress {
  [lessonId: string]: {
    completed: boolean;
    score: number;
    date: string;
    xpEarned: number;
  };
}

// ─── Flashcard / SM-2 ────────────────────────────────────────────────────────

export interface FlashcardStats {
  [wordId: string]: {
    interval: number;     // days until next review
    repetition: number;   // number of times reviewed
    ef: number;           // ease factor (min 1.3)
    nextReview: string;   // ISO date string
    lastQuality: number;  // 0-5
  };
}

// ─── Notes ───────────────────────────────────────────────────────────────────

export interface Note {
  id: string;
  title: string;
  content: string;     // Tiptap JSON string
  tags: string[];
  pinned: boolean;
  template?: 'lesson' | 'grammar' | 'conversation';
  createdAt: string;
  updatedAt: string;
}

// ─── Conversations ────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  contentTr: string;
  contentAr?: string;
  contentEn?: string;
  correction?: {
    score: number;
    highlightedCorrected: string;
    betterAlternative?: string;
  };
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// ─── Games ───────────────────────────────────────────────────────────────────

export type GameId =
  | 'word-scramble'
  | 'word-sniper'
  | 'match-pairs'
  | 'fill-blank'
  | 'say-it'
  | 'turkish-sprint'
  | 'image-association';

export interface GameScore {
  best: number;
  last: number;
  plays: number;
  lastPlayed?: string;
}

export interface XPEntry {
  amount: number;
  source: string;
  date: string;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface AppSettings {
  showEnglish: boolean;
  ttsRate: number;
  ttsVoice: string;
  theme: 'light' | 'dark';
  dailyGoal: number;       // words per day
  geminiApiKey: string;
  sidebarCollapsed: boolean;
}

// ─── Podcast ─────────────────────────────────────────────────────────────────

export interface TranscriptSegment {
  time: number;
  tr: string;
  ar: string;
  en?: string;
  grammarNote?: string;
}

export interface PodcastEpisode {
  id: string;
  title: string;
  youtubeId: string;
  level: 'B1' | 'B2';
  topic: string;
  durationMin: number;
  transcript: TranscriptSegment[];
}

// ─── Daily Stats ─────────────────────────────────────────────────────────────

export interface DailyActivity {
  [dateStr: string]: number;  // words reviewed / xp earned
}
