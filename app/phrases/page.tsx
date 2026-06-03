'use client';
import { useEffect, useState } from 'react';
import { TTSButton, VoiceButton } from '../components/ui/VoiceButtons';

interface Phrase { id: string; category: string; categoryAr: string; tr: string; ar: string; en: string; context: string; pronunciation: string; }

const CATEGORIES = [
  { id: 'all', label: 'الكل', icon: '📋' },
  { id: 'greetings', label: 'تحيات', icon: '👋' },
  { id: 'restaurant', label: 'المطعم', icon: '🍽️' },
  { id: 'hotel', label: 'الفندق', icon: '🏨' },
  { id: 'help', label: 'طلب مساعدة', icon: '🆘' },
  { id: 'opinion', label: 'رأي', icon: '💭' },
  { id: 'work', label: 'العمل', icon: '💼' },
  { id: 'emotions', label: 'مشاعر', icon: '❤️' },
  { id: 'idioms', label: 'تعابير B2', icon: '🧠' },
];

export default function PhrasesPage() {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [practicing, setPracticing] = useState<Phrase | null>(null);
  const [spoken, setSpoken] = useState('');
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    import('../data/phrases.json').then(m => setPhrases(m.default as unknown as Phrase[]));
    const s = JSON.parse(localStorage.getItem('lk_saved_phrases') || '[]');
    setSaved(new Set(s));
  }, []);

  const filtered = phrases.filter(p => {
    if (cat !== 'all' && p.category !== cat) return false;
    if (search && !p.tr.toLowerCase().includes(search.toLowerCase()) && !p.ar.includes(search)) return false;
    return true;
  });

  const toggleSave = (id: string) => {
    setSaved(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem('lk_saved_phrases', JSON.stringify([...next]));
      return next;
    });
  };

  const startPractice = (phrase: Phrase) => {
    setPracticing(phrase);
    setSpoken('');
    setScore(null);
  };

  const handleVoice = (text: string) => {
    setSpoken(text);
    if (!practicing) return;
    const target = practicing.tr.toLowerCase().replace(/[^a-züöşçığ ]/g, '');
    const got = text.toLowerCase().replace(/[^a-züöşçığ ]/g, '');
    const targetWords = target.split(' ');
    const gotWords = got.split(' ');
    let matches = 0;
    targetWords.forEach(w => { if (gotWords.includes(w)) matches++; });
    setScore(Math.round((matches / targetWords.length) * 100));
  };

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="section-title"><span>💬</span> مكتبة العبارات</h1>
        <p className="section-subtitle">تعلم العبارات الأساسية مع إمكانية التدريب الصوتي</p>
      </div>

      {/* Search */}
      <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن عبارة..." style={{ marginBottom: 20 }} />

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 24 }}>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCat(c.id)} className={`topic-chip${cat === c.id ? ' active' : ''}`}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Phrase cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {filtered.map(phrase => (
          <div key={phrase.id} className="card animate-fade-up" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#1A73E8', direction: 'ltr', fontFamily: 'Plus Jakarta Sans', lineHeight: 1.4 }}>{phrase.tr}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', direction: 'ltr', marginTop: 2 }}>{phrase.pronunciation}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <TTSButton text={phrase.tr} size={30} />
                <button onClick={() => toggleSave(phrase.id)} style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid var(--border)', background: saved.has(phrase.id) ? 'rgba(239,68,68,0.1)' : 'transparent', color: saved.has(phrase.id) ? '#EF4444' : 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}>
                  {saved.has(phrase.id) ? '❤️' : '♡'}
                </button>
              </div>
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{phrase.ar}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{phrase.en}</div>
            <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 12, color: '#92400e' }}>
              💡 {phrase.context}
            </div>
            <button onClick={() => startPractice(phrase)}
              style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #1A73E8', background: 'rgba(26,115,232,0.06)', color: '#1A73E8', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              🎤 تدرب على النطق
            </button>
          </div>
        ))}
      </div>

      {/* Practice Overlay */}
      {practicing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ width: '100%', maxWidth: 480, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>قل هذه العبارة بالتركية:</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#1A73E8', direction: 'ltr', fontFamily: 'Plus Jakarta Sans', marginBottom: 8 }}>{practicing.tr}</div>
            <div style={{ fontSize: 15, marginBottom: 20 }}>{practicing.ar}</div>
            <TTSButton text={practicing.tr} size={40} />
            <div style={{ margin: '20px 0', display: 'flex', justifyContent: 'center' }}>
              <VoiceButton onResult={handleVoice} size={60} />
            </div>
            {spoken && (
              <div style={{ marginBottom: 16, padding: '12px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>ما قلته:</div>
                <div style={{ direction: 'ltr', fontFamily: 'Plus Jakarta Sans', fontWeight: 600 }}>{spoken}</div>
              </div>
            )}
            {score !== null && (
              <div style={{ padding: '16px', borderRadius: 12, background: score >= 70 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1.5px solid ${score >= 70 ? '#22C55E' : '#EF4444'}`, marginBottom: 16 }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: score >= 70 ? '#22C55E' : '#EF4444' }}>{score}%</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{score >= 70 ? 'ممتاز! النطق جيد.' : 'حاول مرة أخرى، استمع أولاً.'}</div>
              </div>
            )}
            <button onClick={() => setPracticing(null)} className="btn btn-ghost" style={{ width: '100%', padding: '12px' }}>إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
}
