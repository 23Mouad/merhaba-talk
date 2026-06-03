'use client';
import { use, useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import type { Curriculum, VocabItem, GameId } from '../../lib/types';
import { gameStorage, activityStorage } from '../../lib/localStorage';
import { VoiceButton, TTSButton } from '../../components/ui/VoiceButtons';

type Props = { params: Promise<{ game: string }> };

const EMOJIS = ['🍎', '🚗', '🏠', '🐱', '🌊', '🌙', '☀️', '🌸', '🎵', '🍕'];

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

// ─── Word Scramble ────────────────────────────────────────────────────────────
function WordScramble({ words }: { words: VocabItem[] }) {
  const [idx, setIdx] = useState(0);
  const [letters, setLetters] = useState<string[]>([]);
  const [chosen, setChosen] = useState<number[]>([]);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);

  const word = words[idx % words.length];

  useEffect(() => {
    setLetters(shuffle(word.tr.split('')));
    setChosen([]); setResult(null); setTimeLeft(30);
  }, [idx, word]);

  useEffect(() => {
    if (result) return;
    const t = setInterval(() => setTimeLeft(t => { if (t <= 1) { setResult('wrong'); clearInterval(t as any); return 0; } return t - 1; }), 1000);
    return () => clearInterval(t);
  }, [idx, result]);

  const typed = chosen.map(i => letters[i]).join('');

  const submit = () => {
    if (typed === word.tr) { setResult('correct'); setScore(s => s + 10); gameStorage.update('word-scramble' as GameId, score + 10); }
    else setResult('wrong');
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 48, fontWeight: 800, color: '#1A73E8', marginBottom: 8 }}>{score}</div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'inline-block', padding: '4px 16px', borderRadius: 99, background: timeLeft < 10 ? 'rgba(239,68,68,0.1)' : 'rgba(26,115,232,0.1)', color: timeLeft < 10 ? '#EF4444' : '#1A73E8', fontWeight: 700 }}>⏱ {timeLeft}s</div>
      </div>
      <div style={{ fontSize: 18, marginBottom: 24 }}>{word.ar} <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>({word.en})</span></div>

      {/* Typed area */}
      <div style={{ minHeight: 56, background: 'var(--bg)', borderRadius: 12, border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px', marginBottom: 16, fontSize: 24, fontFamily: 'Plus Jakarta Sans', fontWeight: 700, direction: 'ltr' }}>
        {chosen.length === 0 ? <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>اختر الحروف أدناه</span> : chosen.map((i, ci) => (
          <span key={ci} onClick={() => setChosen(c => c.filter((_, ii) => ii !== ci))} style={{ cursor: 'pointer', padding: '4px 8px', background: '#1A73E8', color: '#fff', borderRadius: 6 }}>{letters[i]}</span>
        ))}
      </div>

      {/* Letters */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
        {letters.map((l, i) => (
          <button key={i} onClick={() => !chosen.includes(i) && setChosen(c => [...c, i])} disabled={chosen.includes(i)}
            style={{ width: 46, height: 46, borderRadius: 10, border: '2px solid var(--border)', background: chosen.includes(i) ? 'var(--border)' : 'var(--bg-card)', color: chosen.includes(i) ? 'var(--text-muted)' : 'var(--text)', cursor: 'pointer', fontSize: 20, fontFamily: 'Plus Jakarta Sans', fontWeight: 700 }}>
            {l}
          </button>
        ))}
      </div>

      {result ? (
        <div style={{ padding: 16, borderRadius: 12, background: result === 'correct' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', marginBottom: 16 }}>
          <div style={{ fontSize: 20, marginBottom: 4 }}>{result === 'correct' ? '✅ صحيح! +10 نقطة' : `❌ الإجابة: ${word.tr}`}</div>
          <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => setIdx(i => i + 1)}>التالي →</button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-ghost" onClick={() => setChosen([])}>مسح</button>
          <button className="btn btn-primary" onClick={submit} disabled={typed.length === 0}>تحقق ✓</button>
        </div>
      )}
    </div>
  );
}

// ─── Match Pairs ──────────────────────────────────────────────────────────────
function MatchPairs({ words }: { words: VocabItem[] }) {
  const gameWords = words.slice(0, 6);
  const [cards, setCards] = useState(() => {
    const cs = [...gameWords.map((w, i) => ({ id: `tr_${i}`, text: w.tr, pairId: i, type: 'tr' as const })),
                ...gameWords.map((w, i) => ({ id: `ar_${i}`, text: w.ar, pairId: i, type: 'ar' as const }))];
    return shuffle(cs);
  });
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);

  const handleFlip = (id: string) => {
    if (flipped.length === 2 || matched.includes(id) || flipped.includes(id)) return;
    const nf = [...flipped, id];
    setFlipped(nf);
    if (nf.length === 2) {
      setMoves(m => m + 1);
      const [a, b] = nf.map(fid => cards.find(c => c.id === fid)!);
      if (a.pairId === b.pairId && a.type !== b.type) {
        setMatched(m => [...m, a.id, b.id]);
        const pts = score + 20;
        setScore(pts);
        gameStorage.update('match-pairs' as GameId, pts);
      }
      setTimeout(() => setFlipped([]), 800);
    }
  };

  const done = matched.length === cards.length;

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 20, fontSize: 14 }}>
        <span>🏆 {score} نقطة</span>
        <span>🔄 {moves} حركة</span>
        <span>{matched.length / 2}/{gameWords.length} أزواج</span>
      </div>
      {done && <div style={{ fontSize: 20, color: '#22C55E', marginBottom: 16, fontWeight: 800 }}>🎉 أحسنت! أكملت كل الأزواج</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {cards.map(card => {
          const isFlipped = flipped.includes(card.id) || matched.includes(card.id);
          const isMatched = matched.includes(card.id);
          return (
            <div key={card.id} onClick={() => handleFlip(card.id)}
              style={{ height: 80, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                background: isMatched ? 'rgba(34,197,94,0.15)' : isFlipped ? 'rgba(26,115,232,0.1)' : 'var(--bg-card)',
                border: `2px solid ${isMatched ? '#22C55E' : isFlipped ? '#1A73E8' : 'var(--border)'}`,
                fontSize: card.type === 'tr' ? 13 : 15, fontWeight: 700,
                fontFamily: card.type === 'tr' ? 'Plus Jakarta Sans' : 'Cairo',
                direction: card.type === 'ar' ? 'rtl' : 'ltr',
                transition: 'all 0.3s', padding: 8, textAlign: 'center' }}>
              {isFlipped ? card.text : '?'}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Turkish Sprint ───────────────────────────────────────────────────────────
function TurkishSprint({ words }: { words: VocabItem[] }) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(t => {
      if (t <= 1) { clearInterval(t as any); setDone(true); gameStorage.update('turkish-sprint' as GameId, score); return 0; }
      return t - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [score]);

  const word = words[idx % words.length];

  const check = () => {
    const correct = answer.trim().toLowerCase() === word.tr.toLowerCase();
    setFeedback(correct ? 'correct' : 'wrong');
    if (correct) setScore(s => s + 15);
    setTimeout(() => { setFeedback(null); setAnswer(''); setIdx(i => i + 1); inputRef.current?.focus(); }, 600);
  };

  if (done) return (
    <div style={{ textAlign: 'center', padding: 32 }}>
      <div style={{ fontSize: 48 }}>🏁</div>
      <div style={{ fontSize: 32, fontWeight: 800, color: '#1A73E8', marginBottom: 8 }}>{score} نقطة</div>
      <div style={{ color: 'var(--text-muted)' }}>أجبت على {idx} سؤال في 60 ثانية</div>
    </div>
  );

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 24, fontSize: 14 }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: '#1A73E8' }}>{score}</span>
        <span style={{ fontSize: 20, fontWeight: 800, color: timeLeft < 15 ? '#EF4444' : '#22C55E' }}>⏱ {timeLeft}s</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{word.ar}</div>
      <div style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 24 }}>{word.en}</div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 10, justifyContent: 'center' }}>
        <input ref={inputRef} className="input" value={answer} onChange={e => setAnswer(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()}
          placeholder="اكتب الكلمة التركية..."
          style={{ maxWidth: 280, direction: 'ltr', textAlign: 'center', fontSize: 16, fontFamily: 'Plus Jakarta Sans',
            borderColor: feedback === 'correct' ? '#22C55E' : feedback === 'wrong' ? '#EF4444' : undefined,
            background: feedback === 'correct' ? 'rgba(34,197,94,0.08)' : feedback === 'wrong' ? 'rgba(239,68,68,0.08)' : undefined }} autoFocus />
        <button className="btn btn-primary" onClick={check} style={{ padding: '10px 20px' }}>→</button>
      </div>
      {feedback === 'wrong' && <div style={{ color: '#EF4444', fontSize: 14 }}>الإجابة: <strong style={{ direction: 'ltr', display: 'inline-block' }}>{word.tr}</strong></div>}
    </div>
  );
}

// ─── Fill Blank ───────────────────────────────────────────────────────────────
function FillBlank({ words }: { words: VocabItem[] }) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const word = words[idx % words.length];
  const opts = shuffle([word.tr, ...shuffle(words.filter(w => w.id !== word.id)).slice(0, 3).map(w => w.tr)]);
  const sentence = word.example_tr.replace(word.tr, '______');

  const select = (opt: string) => {
    if (chosen) return;
    setChosen(opt);
    if (opt === word.tr) { const s = score + 10; setScore(s); gameStorage.update('fill-blank' as GameId, s); }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 36, fontWeight: 800, color: '#1A73E8', marginBottom: 20 }}>{score}</div>
      <div style={{ fontSize: 15, direction: 'ltr', fontFamily: 'Plus Jakarta Sans', marginBottom: 8, background: 'rgba(26,115,232,0.06)', padding: '16px', borderRadius: 12, fontWeight: 600 }}>{sentence}</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>{word.example_ar}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {opts.map(opt => (
          <button key={opt} onClick={() => select(opt)} style={{ padding: '14px', borderRadius: 12, border: '2px solid',
            borderColor: !chosen ? 'var(--border)' : opt === word.tr ? '#22C55E' : opt === chosen ? '#EF4444' : 'var(--border)',
            background: !chosen ? 'transparent' : opt === word.tr ? 'rgba(34,197,94,0.08)' : opt === chosen ? 'rgba(239,68,68,0.08)' : 'transparent',
            cursor: 'pointer', fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 15, direction: 'ltr' }}>
            {opt}
          </button>
        ))}
      </div>
      {chosen && <button className="btn btn-primary" onClick={() => { setChosen(null); setIdx(i => i + 1); }}>التالي →</button>}
    </div>
  );
}

// ─── Say It ───────────────────────────────────────────────────────────────────
function SayIt({ words }: { words: VocabItem[] }) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [spoken, setSpoken] = useState('');
  const [pct, setPct] = useState<number | null>(null);
  const word = words[idx % words.length];

  const handleVoice = (text: string) => {
    setSpoken(text);
    const targetParts = word.tr.toLowerCase().split('');
    const gotParts = text.toLowerCase().split('');
    let match = 0;
    targetParts.forEach(c => { if (gotParts.includes(c)) match++; });
    const p = Math.round((match / targetParts.length) * 100);
    setPct(p);
    if (p >= 60) { const s = score + p; setScore(s); gameStorage.update('say-it' as GameId, s); }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 36, fontWeight: 800, color: '#1A73E8', marginBottom: 24 }}>{score} XP</div>
      <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{word.ar}</div>
      <div style={{ fontSize: 18, color: 'var(--text-muted)', marginBottom: 8 }}>{word.en}</div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center', gap: 10 }}>
        <TTSButton text={word.tr} size={40} />
        <span style={{ fontSize: 13, color: 'var(--text-muted)', alignSelf: 'center' }}>استمع أولاً</span>
      </div>
      <VoiceButton onResult={handleVoice} size={64} />
      {spoken && <div style={{ marginTop: 16, fontSize: 14, color: 'var(--text-muted)' }}>قلت: <em style={{ direction: 'ltr', display: 'inline-block' }}>{spoken}</em></div>}
      {pct !== null && (
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: pct >= 60 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1.5px solid ${pct >= 60 ? '#22C55E' : '#EF4444'}` }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: pct >= 60 ? '#22C55E' : '#EF4444' }}>{pct}%</div>
          <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={() => { setPct(null); setSpoken(''); setIdx(i => i + 1); }}>التالي →</button>
        </div>
      )}
    </div>
  );
}

// ─── Word Sniper ──────────────────────────────────────────────────────────────
function WordSniper({ words }: { words: VocabItem[] }) {
  const [score, setScore] = useState(0);
  const [targetIdx, setTargetIdx] = useState(0);
  const [falling, setFalling] = useState<{ id: number; word: VocabItem; x: number; y: number }[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const nextId = useRef(0);

  const target = words[targetIdx % words.length];

  useEffect(() => {
    if (gameOver) return;
    const candidates = shuffle(words).slice(0, 3);
    if (!candidates.find(w => w.id === target.id)) candidates[0] = target;
    const newFalling = shuffle(candidates).map(w => ({ id: nextId.current++, word: w, x: Math.random() * 70 + 5, y: -10 }));
    setFalling(newFalling);
  }, [targetIdx, gameOver]);

  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setFalling(prev => {
        const updated = prev.map(f => ({ ...f, y: f.y + 0.5 }));
        if (updated.some(f => f.y > 90)) { setGameOver(true); gameStorage.update('word-sniper' as GameId, score); }
        return updated;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [gameOver, score]);

  const shoot = (id: number, word: VocabItem) => {
    if (word.id === target.id) {
      const s = score + 15;
      setScore(s);
      setTargetIdx(i => i + 1);
    } else {
      setGameOver(true);
      gameStorage.update('word-sniper' as GameId, score);
    }
  };

  if (gameOver) return (
    <div style={{ textAlign: 'center', padding: 32 }}>
      <div style={{ fontSize: 48 }}>💥</div>
      <div style={{ fontSize: 32, fontWeight: 800, color: '#1A73E8', marginBottom: 8 }}>{score}</div>
      <button className="btn btn-primary" onClick={() => { setScore(0); setGameOver(false); setTargetIdx(0); }}>العب مرة أخرى</button>
    </div>
  );

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 }}>اصطد الترجمة التركية لـ:</div>
        <div style={{ fontSize: 28, fontWeight: 800 }}>{target.ar}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#1A73E8', marginTop: 8 }}>{score} نقطة</div>
      </div>
      <div style={{ position: 'relative', height: 320, background: 'var(--bg)', borderRadius: 16, overflow: 'hidden', border: '2px solid var(--border)' }}>
        {falling.map(f => (
          <button key={f.id} onClick={() => shoot(f.id, f.word)}
            style={{ position: 'absolute', left: `${f.x}%`, top: `${f.y}%`, transform: 'translateX(-50%)', padding: '8px 16px', borderRadius: 99, border: 'none', background: '#1A73E8', color: '#fff', fontFamily: 'Plus Jakarta Sans', fontWeight: 700, cursor: 'pointer', fontSize: 14, whiteSpace: 'nowrap', transition: 'none' }}>
            {f.word.tr}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Image Association ────────────────────────────────────────────────────────
function ImageAssoc({ words }: { words: VocabItem[] }) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const word = words[idx % words.length];
  const emoji = EMOJIS[idx % EMOJIS.length];
  const opts = shuffle([word.ar, ...shuffle(words.filter(w => w.id !== word.id)).slice(0, 3).map(w => w.ar)]);

  const select = (opt: string) => {
    if (chosen) return;
    setChosen(opt);
    if (opt === word.ar) { const s = score + 10; setScore(s); gameStorage.update('image-association' as GameId, s); }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 36, fontWeight: 800, color: '#1A73E8', marginBottom: 16 }}>{score}</div>
      <div style={{ fontSize: 80, marginBottom: 8 }}>{emoji}</div>
      <div style={{ fontSize: 20, fontFamily: 'Plus Jakarta Sans', fontWeight: 700, color: '#1A73E8', marginBottom: 20, direction: 'ltr' }}>{word.tr}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {opts.map(opt => (
          <button key={opt} onClick={() => select(opt)} style={{ padding: '14px', borderRadius: 12, border: '2px solid',
            borderColor: !chosen ? 'var(--border)' : opt === word.ar ? '#22C55E' : opt === chosen ? '#EF4444' : 'var(--border)',
            background: !chosen ? 'transparent' : opt === word.ar ? 'rgba(34,197,94,0.08)' : opt === chosen ? 'rgba(239,68,68,0.08)' : 'transparent',
            cursor: 'pointer', fontFamily: 'Cairo', fontWeight: 700, fontSize: 15 }}>
            {opt}
          </button>
        ))}
      </div>
      {chosen && <button className="btn btn-primary" onClick={() => { setChosen(null); setIdx(i => i + 1); }}>التالي →</button>}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function GamePage({ params }: Props) {
  const { game } = use(params);
  const [words, setWords] = useState<VocabItem[]>([]);

  useEffect(() => {
    import('../../data/curriculum.json').then(m => {
      const c = m.default as unknown as Curriculum;
      const all = c.phases.flatMap(p => p.sections.flatMap(s => s.lessons.flatMap(l => l.vocabulary)));
      setWords(shuffle(all));
      activityStorage.record(2);
    });
  }, []);

  const TITLES: Record<string, string> = {
    'word-scramble': '🔤 كلمة مبعثرة',
    'word-sniper': '🎯 اصطياد الكلمة',
    'match-pairs': '🧩 طابق الأزواج',
    'fill-blank': '✍️ أكمل الجملة',
    'say-it': '🎤 قلها بالتركية',
    'turkish-sprint': '🏃 سباق الكلمات',
    'image-association': '🖼️ الصور والكلمات',
  };

  if (!words.length) return <div style={{ padding: 40, textAlign: 'center' }}>⏳ جارٍ تحميل اللعبة...</div>;

  return (
    <div style={{ padding: '32px 28px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/games" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 14 }}>← الألعاب</Link>
        <h1 className="section-title" style={{ margin: 0 }}>{TITLES[game] || '🎮 لعبة'}</h1>
      </div>

      <div className="card" style={{ padding: 28 }}>
        {game === 'word-scramble' && <WordScramble words={words} />}
        {game === 'word-sniper' && <WordSniper words={words} />}
        {game === 'match-pairs' && <MatchPairs words={words} />}
        {game === 'fill-blank' && <FillBlank words={words} />}
        {game === 'say-it' && <SayIt words={words} />}
        {game === 'turkish-sprint' && <TurkishSprint words={words} />}
        {game === 'image-association' && <ImageAssoc words={words} />}
      </div>
    </div>
  );
}
