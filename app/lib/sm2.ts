import type { FlashcardStats } from './types';
import { flashcardStorage } from './localStorage';

/**
 * SM-2 Spaced Repetition Algorithm
 * quality: 0-5
 *   5 = perfect response
 *   4 = correct response after a hesitation
 *   3 = correct response with serious difficulty
 *   2 = incorrect response; correct one was easy to recall
 *   1 = incorrect response; correct one remembered
 *   0 = complete blackout
 */
export function sm2(
  cardStats: FlashcardStats[string],
  quality: number
): FlashcardStats[string] {
  const q = Math.max(0, Math.min(5, quality));

  let { interval, repetition, ef } = cardStats;

  // Update ease factor
  ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (ef < 1.3) ef = 1.3;

  if (q < 3) {
    // Failed — reset
    repetition = 0;
    interval = 1;
  } else {
    // Passed
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * ef);
    }
    repetition += 1;
  }

  const nextReview = new Date(Date.now() + interval * 86400000).toISOString();

  return { interval, repetition, ef, nextReview, lastQuality: q };
}

export function reviewCard(wordId: string, quality: number) {
  const current = flashcardStorage.getCard(wordId);
  const updated = sm2(current, quality);
  flashcardStorage.update(wordId, updated);
  return updated;
}
