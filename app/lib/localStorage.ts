import type {
  UserProfile, StreakData, LessonProgress, FlashcardStats,
  Note, Conversation, GameScore, GameId, XPEntry, AppSettings,
  VocabItem, DailyActivity
} from './types';

// ─── Keys ─────────────────────────────────────────────────────────────────────
const KEYS = {
  profile:        'lk_user_profile',
  streak:         'lk_streak',
  lessonProgress: 'lk_lesson_progress',
  vocabulary:     'lk_vocabulary',
  flashcardStats: 'lk_flashcard_stats',
  favorites:      'lk_favorites',
  conversations:  'lk_conversations',
  notes:          'lk_notes',
  gameScores:     'lk_game_scores',
  xpLog:          'lk_xp_log',
  settings:       'lk_settings',
  dailyActivity:  'lk_daily_activity',
} as const;

// ─── Core helpers ─────────────────────────────────────────────────────────────
function get<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('localStorage write error:', e);
  }
}

export const DEFAULT_SETTINGS: AppSettings = {
  showEnglish: false,
  ttsRate: 1,
  ttsVoice: '',
  theme: 'light',
  dailyGoal: 20,
  geminiApiKey: 'AIzaSyDQbwPesmV7zhOvRbvOVh-iW_FHriR2sIE',
  sidebarCollapsed: false,
};

export const DEFAULT_PROFILE: UserProfile = {
  name: 'طالب جديد',
  avatar: '🎓',
  joinDate: new Date().toISOString(),
  totalXP: 0,
  currentLevel: 'B1',
};

// ─── Profile ──────────────────────────────────────────────────────────────────
export const profileStorage = {
  get: (): UserProfile => get(KEYS.profile, DEFAULT_PROFILE),
  set: (v: UserProfile) => set(KEYS.profile, v),
  update: (partial: Partial<UserProfile>) => {
    const current = profileStorage.get();
    set(KEYS.profile, { ...current, ...partial });
  },
};

// ─── Streak ───────────────────────────────────────────────────────────────────
export const streakStorage = {
  get: (): StreakData => get(KEYS.streak, { current: 0, longest: 0, lastDate: '' }),
  checkAndUpdate: (): StreakData => {
    const data = streakStorage.get();
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (data.lastDate === today) return data; // already updated today
    
    let updated: StreakData;
    if (data.lastDate === yesterday) {
      // Consecutive day
      updated = {
        current: data.current + 1,
        longest: Math.max(data.longest, data.current + 1),
        lastDate: today,
      };
    } else if (data.lastDate === '') {
      // First time
      updated = { current: 1, longest: 1, lastDate: today };
    } else {
      // Streak broken
      updated = { current: 1, longest: data.longest, lastDate: today };
    }
    set(KEYS.streak, updated);
    return updated;
  },
};

// ─── Lesson Progress ──────────────────────────────────────────────────────────
export const lessonStorage = {
  get: (): LessonProgress => get(KEYS.lessonProgress, {}),
  complete: (lessonId: string, score: number, xp: number) => {
    const progress = lessonStorage.get();
    progress[lessonId] = {
      completed: true,
      score,
      date: new Date().toISOString(),
      xpEarned: xp,
    };
    set(KEYS.lessonProgress, progress);
    xpStorage.add(xp, `lesson:${lessonId}`);
    profileStorage.update({ totalXP: profileStorage.get().totalXP + xp });
  },
};

// ─── Vocabulary ───────────────────────────────────────────────────────────────
export const vocabStorage = {
  getAll: (): VocabItem[] => get(KEYS.vocabulary, []),
  addWord: (word: VocabItem) => {
    const words = vocabStorage.getAll();
    if (!words.find(w => w.id === word.id)) {
      words.unshift(word);
      set(KEYS.vocabulary, words);
    }
  },
  getFavorites: (): string[] => get(KEYS.favorites, []),
  toggleFavorite: (id: string) => {
    const favs = vocabStorage.getFavorites();
    const idx = favs.indexOf(id);
    if (idx >= 0) favs.splice(idx, 1);
    else favs.push(id);
    set(KEYS.favorites, favs);
    return favs.includes(id);
  },
};

// ─── Flashcard SM-2 stats ─────────────────────────────────────────────────────
export const flashcardStorage = {
  get: (): FlashcardStats => get(KEYS.flashcardStats, {}),
  getCard: (id: string) => {
    const stats = flashcardStorage.get();
    return stats[id] || { interval: 1, repetition: 0, ef: 2.5, nextReview: new Date().toISOString(), lastQuality: 0 };
  },
  update: (id: string, data: FlashcardStats[string]) => {
    const stats = flashcardStorage.get();
    stats[id] = data;
    set(KEYS.flashcardStats, stats);
  },
  getDueCards: (allIds: string[]): string[] => {
    const stats = flashcardStorage.get();
    const now = new Date();
    return allIds.filter(id => {
      const s = stats[id];
      if (!s) return true; // new card, always due
      return new Date(s.nextReview) <= now;
    });
  },
};

// ─── Notes ───────────────────────────────────────────────────────────────────
export const notesStorage = {
  getAll: (): Note[] => get(KEYS.notes, []),
  save: (note: Note) => {
    const notes = notesStorage.getAll();
    const idx = notes.findIndex(n => n.id === note.id);
    if (idx >= 0) notes[idx] = note;
    else notes.unshift(note);
    set(KEYS.notes, notes);
  },
  delete: (id: string) => {
    const notes = notesStorage.getAll().filter(n => n.id !== id);
    set(KEYS.notes, notes);
  },
};

// ─── Conversations ────────────────────────────────────────────────────────────
export const conversationStorage = {
  getAll: (): Conversation[] => get(KEYS.conversations, []),
  save: (conv: Conversation) => {
    const convs = conversationStorage.getAll();
    const idx = convs.findIndex(c => c.id === conv.id);
    if (idx >= 0) convs[idx] = conv;
    else convs.unshift(conv);
    set(KEYS.conversations, convs.slice(0, 50)); // keep last 50
  },
  delete: (id: string) => {
    const convs = conversationStorage.getAll().filter(c => c.id !== id);
    set(KEYS.conversations, convs);
  },
};

// ─── Game Scores ──────────────────────────────────────────────────────────────
export const gameStorage = {
  getAll: (): Record<string, GameScore> => get(KEYS.gameScores, {}),
  getGame: (id: GameId): GameScore => {
    const all = gameStorage.getAll();
    return all[id] || { best: 0, last: 0, plays: 0 };
  },
  update: (id: GameId, score: number) => {
    const all = gameStorage.getAll();
    const prev = all[id] || { best: 0, last: 0, plays: 0 };
    all[id] = {
      best: Math.max(prev.best, score),
      last: score,
      plays: prev.plays + 1,
      lastPlayed: new Date().toISOString(),
    };
    set(KEYS.gameScores, all);
    if (score > 0) xpStorage.add(Math.floor(score / 10), `game:${id}`);
  },
};

// ─── XP Log ───────────────────────────────────────────────────────────────────
export const xpStorage = {
  getAll: (): XPEntry[] => get(KEYS.xpLog, []),
  add: (amount: number, source: string) => {
    const log = xpStorage.getAll();
    log.unshift({ amount, source, date: new Date().toISOString() });
    set(KEYS.xpLog, log.slice(0, 500));
  },
  getTodayXP: (): number => {
    const today = new Date().toDateString();
    return xpStorage.getAll()
      .filter(e => new Date(e.date).toDateString() === today)
      .reduce((sum, e) => sum + e.amount, 0);
  },
};

// ─── Daily Activity (heatmap) ─────────────────────────────────────────────────
export const activityStorage = {
  get: (): DailyActivity => get(KEYS.dailyActivity, {}),
  record: (points: number = 1) => {
    const activity = activityStorage.get();
    const key = new Date().toISOString().split('T')[0];
    activity[key] = (activity[key] || 0) + points;
    set(KEYS.dailyActivity, activity);
  },
};

// ─── Settings ─────────────────────────────────────────────────────────────────
export const settingsStorage = {
  get: (): AppSettings => ({ ...DEFAULT_SETTINGS, ...get(KEYS.settings, {}) }),
  set: (v: AppSettings) => set(KEYS.settings, v),
  update: (partial: Partial<AppSettings>) => {
    const current = settingsStorage.get();
    set(KEYS.settings, { ...current, ...partial });
    // Apply theme immediately
    if (partial.theme) {
      document.documentElement.setAttribute('data-theme', partial.theme);
    }
  },
};

// ─── Reset all ────────────────────────────────────────────────────────────────
export const resetAll = () => {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
};
