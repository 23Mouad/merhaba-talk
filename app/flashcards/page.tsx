'use client';
import { useEffect, useState, useCallback } from 'react';
import type { VocabItem, Curriculum } from '../lib/types';
import { flashcardStorage, vocabStorage, activityStorage } from '../lib/localStorage';
import { reviewCard } from '../lib/sm2';
import { TTSButton } from '../components/ui/VoiceButtons';

type Mode = 'new' | 'review' | 'all' | 'favorites';

const MODES: { id: Mode; label: string; icon: string }[] = [
  { id: 'new', label: 'جديدة', icon: '✨' },
  { id: 'review', label: 'مراجعة', icon: '🔄' },
  { id: 'all', label: 'الكل', icon: '📚' },
  { id: 'favorites', label: 'المفضلة', icon: '⭐' },
];

export default function FlashcardsPage() {
  const [allWords, setAllWords] = useState<VocabItem[]>([]);
  const [deck, setDeck] = useState<VocabItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState<Mode>('all');
  const [done, setDone] = useState(0);
  const [known, setKnown] = useState(0);
  const [finished, setFinished] = useState(false);
  const [dragX, setDragX] = useState(0);

  useEffect(() => {
    import('../data/curriculum.json').then(m => {
      const c = m.default as unknown as Curriculum;
      const words = c.phases.flatMap(p => p.sections.flatMap(s => s.lessons.flatMap(l => l.vocabulary)));
      setAllWords(words);
    });
  }, []);

  useEffect(() => {
    if (!allWords.length) return;
    const favIds = vocabStorage.getFavorites();
    const allIds = allWords.map(w => w.id);
    let filtered: VocabItem[];
    if (mode === 'favorites') filtered = allWords.filter(w => favIds.includes(w.id));
    else if (mode === 'review') {
      const due = flashcardStorage.getDueCards(allIds);
      filtered = allWords.filter(w => due.includes(w.id));
    } else filtered = [...allWords];
    setDeck(filtered.sort(() => Math.random() - 0.5));
    setCurrent(0); setFlipped(false); setDone(0); setKnown(0); setFinished(false);
  }, [mode, allWords]);

  const card = deck[current];

  const next = useCallback((quality: number) => {
    if (!card) return;
    reviewCard(card.id, quality);
    activityStorage.record(1);
    if (quality >= 3) setKnown(k => k + 1);
    setDone(d => d + 1);
    if (current + 1 >= deck.length) { setFinished(true); return; }
    setFlipped(false);
    setTimeout(() => setCurrent(c => c + 1), 100);
  }, [card, current, deck.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next(5);
      else if (e.key === 'ArrowLeft') next(0);
      else if (e.key === ' ') { e.preventDefault(); setFlipped(f => !f); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next]);

  if (finished) return (
    <div style={{ padding: '32px 28px', maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
      <div className="card" style={{ padding: 48 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎊</div>
        <h2 style={{ fontFamily: 'Sora', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>أحسنت!</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>راجعت {done} بطاقة • عرفت {known} منها</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-ghost" onClick={() => { setFinished(false); setCurrent(0); setFlipped(false); setDone(0); setKnown(0); }}>كرر مرة أخرى</button>
          <button className="btn btn-primary" onClick={() => setMode('review')}>مراجعة ما لم تتذكره</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '32px 28px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="section-title"><span>🃏</span> البطاقات التعليمية</h1>
        <p className="section-subtitle">اضغط المسافة للقلب • ← معروفة • → مجهولة</p>
      </div>

      {/* Mode selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            style={{ padding: '8px 16px', borderRadius: 99, border: '1.5px solid', borderColor: mode === m.id ? '#1A73E8' : 'var(--border)', background: mode === m.id ? 'rgba(26,115,232,0.1)' : 'transparent', color: mode === m.id ? '#1A73E8' : 'var(--text-muted)', fontFamily: 'Cairo, sans-serif', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* Progress */}
      {deck.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: 'var(--text-muted)' }}>
            <span>{done}/{deck.length} بطاقة</span>
            <span>✅ {known} معروفة</span>
          </div>
          <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${deck.length > 0 ? (done / deck.length) * 100 : 0}%` }} /></div>
        </div>
      )}

      {!card ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <p style={{ color: 'var(--text-muted)' }}>لا توجد بطاقات في هذا الوضع حالياً</p>
        </div>
      ) : (
        <>
          <div className="flashcard-scene" style={{ height: 360, marginBottom: 24 }} onClick={() => setFlipped(f => !f)}>
            <div className={`flashcard${flipped ? ' flipped' : ''}`}
              style={{ transform: `rotateY(${flipped ? 180 : 0}deg) translateX(${dragX}px)` }}>
              {/* Front */}
              <div className="flashcard-face" style={{ background: 'linear-gradient(135deg,#1A73E8,#0D47A1)', cursor: 'pointer' }}>
                <div style={{ textAlign: 'center', padding: 32, color: '#fff' }}>
                  <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 20, textTransform: 'uppercase', letterSpacing: 2 }}>التركية</div>
                  <div style={{ fontSize: 42, fontWeight: 800, fontFamily: 'Plus Jakarta Sans', direction: 'ltr', marginBottom: 16 }}>{card.tr}</div>
                  <div style={{ fontSize: 16, opacity: 0.75, direction: 'ltr', fontFamily: 'Plus Jakarta Sans' }}>{card.pronunciation}</div>
                  <div style={{ marginTop: 24, opacity: 0.5, fontSize: 13 }}>اضغط للقلب</div>
                </div>
              </div>
              {/* Back */}
              <div className="flashcard-face flashcard-back" style={{ background: 'var(--bg-card)', border: '2px solid #1A73E8' }}>
                <div style={{ textAlign: 'center', padding: 28, width: '100%' }}>
                  <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>{card.ar}</div>
                  <div style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 16 }}>{card.en}</div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                    <TTSButton text={card.tr} size={40} />
                  </div>
                  <div style={{ background: 'rgba(26,115,232,0.06)', borderRadius: 12, padding: '12px 16px', border: '1px solid rgba(26,115,232,0.1)' }}>
                    <div style={{ direction: 'ltr', fontFamily: 'Plus Jakarta Sans', fontSize: 13, color: '#1A73E8', fontWeight: 600 }}>{card.example_tr}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{card.example_ar}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rating buttons */}
          {flipped && (
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
              <button onClick={() => next(0)}
                style={{ flex: 1, padding: '16px', borderRadius: 14, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.2)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'}>
                ✗ لا أعرفها
              </button>
              <button onClick={() => next(3)}
                style={{ flex: 1, padding: '16px', borderRadius: 14, border: 'none', background: 'rgba(245,158,11,0.1)', color: '#D97706', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s' }}>
                ~ صعبة
              </button>
              <button onClick={() => next(5)}
                style={{ flex: 1, padding: '16px', borderRadius: 14, border: 'none', background: 'rgba(34,197,94,0.1)', color: '#22C55E', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(34,197,94,0.2)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(34,197,94,0.1)'}>
                ✓ أعرفها
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
