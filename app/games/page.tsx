'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { gameStorage } from '../lib/localStorage';
import type { GameId } from '../lib/types';

const GAMES: { id: GameId; icon: string; title: string; titleAr: string; desc: string; color: string }[] = [
  { id: 'word-scramble', icon: '🔤', title: 'Word Scramble', titleAr: 'كلمة مبعثرة', desc: 'رتب الحروف لتكون كلمة تركية صحيحة', color: '#1A73E8' },
  { id: 'word-sniper', icon: '🎯', title: 'Word Sniper', titleAr: 'اصطياد الكلمة', desc: 'اختر الترجمة الصحيحة قبل سقوطها', color: '#7C3AED' },
  { id: 'match-pairs', icon: '🧩', title: 'Match Pairs', titleAr: 'طابق الأزواج', desc: 'ابحث عن أزواج الكلمات المتطابقة', color: '#059669' },
  { id: 'fill-blank', icon: '✍️', title: 'Fill Blank', titleAr: 'أكمل الجملة', desc: 'أكمل الجملة التركية بالكلمة المناسبة', color: '#D97706' },
  { id: 'say-it', icon: '🎤', title: 'Say It!', titleAr: 'قلها بالتركية', desc: 'انطق الكلمة بالتركية وسنقيّم نطقك', color: '#EF4444' },
  { id: 'turkish-sprint', icon: '🏃', title: 'Turkish Sprint', titleAr: 'سباق الكلمات', desc: 'أجب بسرعة على أكبر عدد من الأسئلة', color: '#0891B2' },
  { id: 'image-association', icon: '🖼️', title: 'Image Match', titleAr: 'الصور والكلمات', desc: 'صوّر مع كلمات - اختر الترجمة الصحيحة', color: '#BE185D' },
];

export default function GamesPage() {
  const [scores, setScores] = useState<Record<string, { best: number; plays: number }>>({});

  useEffect(() => {
    const all = gameStorage.getAll();
    setScores(all);
  }, []);

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="section-title"><span>🎮</span> ألعاب تعليمية</h1>
        <p className="section-subtitle">تعلم وتسلى — كل لعبة تمنحك XP وتعزز مفرداتك</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {GAMES.map((game, i) => {
          const score = scores[game.id];
          return (
            <div key={game.id} className="card game-card animate-fade-up" style={{ padding: 0, overflow: 'hidden', animationDelay: `${i * 0.07}s` }}>
              <div style={{ height: 80, background: `linear-gradient(135deg, ${game.color}22, ${game.color}44)`, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 40 }}>{game.icon}</span>
              </div>
              <div style={{ padding: '18px 20px' }}>
                <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 2 }}>{game.titleAr}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Plus Jakarta Sans', marginBottom: 10 }}>{game.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>{game.desc}</div>
                {score && (
                  <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>🏆 أعلى: <strong style={{ color: game.color }}>{score.best}</strong></div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>🎮 جولات: <strong>{score.plays}</strong></div>
                  </div>
                )}
                <Link href={`/games/${game.id}`}>
                  <button style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: game.color, color: '#fff', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                    ابدأ اللعبة
                  </button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
