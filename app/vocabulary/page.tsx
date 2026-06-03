'use client';
import { useEffect, useState, useMemo } from 'react';
import type { VocabItem, Curriculum } from '../lib/types';
import { vocabStorage, flashcardStorage } from '../lib/localStorage';
import { TTSButton } from '../components/ui/VoiceButtons';

type SortKey = 'az' | 'za' | 'recent' | 'level';
type ViewMode = 'table' | 'grid';

export default function VocabularyPage() {
  const [words, setWords] = useState<VocabItem[]>([]);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'B1' | 'B2'>('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [sort, setSort] = useState<SortKey>('recent');
  const [view, setView] = useState<ViewMode>('grid');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    import('../data/curriculum.json').then(m => {
      const c = m.default as unknown as Curriculum;
      setWords(c.phases.flatMap(p => p.sections.flatMap(s => s.lessons.flatMap(l => l.vocabulary))));
    });
    setFavorites(new Set(vocabStorage.getFavorites()));
  }, []);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    words.forEach(w => w.tags.forEach(t => tags.add(t)));
    return ['all', ...Array.from(tags)];
  }, [words]);

  const filtered = useMemo(() => {
    let list = [...words];
    if (levelFilter !== 'all') list = list.filter(w => w.level === levelFilter);
    if (tagFilter !== 'all') list = list.filter(w => w.tags.includes(tagFilter));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(w => w.tr.toLowerCase().includes(q) || w.ar.includes(q) || w.en.toLowerCase().includes(q));
    }
    if (sort === 'az') list.sort((a, b) => a.tr.localeCompare(b.tr));
    else if (sort === 'za') list.sort((a, b) => b.tr.localeCompare(a.tr));
    else if (sort === 'level') list.sort((a, b) => a.level.localeCompare(b.level));
    return list;
  }, [words, levelFilter, tagFilter, search, sort]);

  const toggleFav = (id: string) => {
    vocabStorage.toggleFavorite(id);
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const TAG_COLORS: Record<string, string> = { verb: 'badge-blue', noun: 'badge-purple', adjective: 'badge-amber', adverb: 'badge-green', question: 'badge-red', conjunction: 'badge-amber', passive: 'badge-red' };

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="section-title"><span>📖</span> بنك المفردات</h1>
          <p className="section-subtitle">{filtered.length} كلمة من أصل {words.length}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setView('grid')} style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid', borderColor: view === 'grid' ? '#1A73E8' : 'var(--border)', background: view === 'grid' ? 'rgba(26,115,232,0.1)' : 'transparent', cursor: 'pointer', color: view === 'grid' ? '#1A73E8' : 'var(--text-muted)' }}>⊞ شبكة</button>
          <button onClick={() => setView('table')} style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid', borderColor: view === 'table' ? '#1A73E8' : 'var(--border)', background: view === 'table' ? 'rgba(26,115,232,0.1)' : 'transparent', cursor: 'pointer', color: view === 'table' ? '#1A73E8' : 'var(--text-muted)' }}>☰ جدول</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث بالتركية أو العربية أو الإنجليزية..." style={{ flex: '1 1 220px' }} />
        <select className="input" value={levelFilter} onChange={e => setLevelFilter(e.target.value as any)} style={{ flex: '0 1 120px' }}>
          <option value="all">كل المستويات</option>
          <option value="B1">B1</option>
          <option value="B2">B2</option>
        </select>
        <select className="input" value={tagFilter} onChange={e => setTagFilter(e.target.value)} style={{ flex: '0 1 140px' }}>
          {allTags.map(t => <option key={t} value={t}>{t === 'all' ? 'كل الأنواع' : t}</option>)}
        </select>
        <select className="input" value={sort} onChange={e => setSort(e.target.value as SortKey)} style={{ flex: '0 1 150px' }}>
          <option value="recent">الأحدث</option>
          <option value="az">أ-ي</option>
          <option value="za">ي-أ</option>
          <option value="level">المستوى</option>
        </select>
      </div>

      {/* Grid View */}
      {view === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 16 }}>
          {filtered.map(word => {
            const isFav = favorites.has(word.id);
            return (
              <div key={word.id} className="card animate-fade-up" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#1A73E8', direction: 'ltr', fontFamily: 'Plus Jakarta Sans' }}>{word.tr}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', direction: 'ltr' }}>{word.pronunciation}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <TTSButton text={word.tr} size={30} />
                    <button onClick={() => toggleFav(word.id)} style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid var(--border)', background: isFav ? 'rgba(245,158,11,0.1)' : 'transparent', color: isFav ? '#F59E0B' : 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}>
                      {isFav ? '⭐' : '☆'}
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{word.ar}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>{word.en}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className={`badge ${TAG_COLORS[word.tags[0]] || 'badge-blue'}`}>{word.tags[0]}</span>
                  <span className="badge badge-blue">{word.level}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <div className="card" style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                {['التركية', 'النطق', 'العربية', 'الإنجليزية', 'النوع', 'المستوى', ''].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((word, i) => (
                <tr key={word.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(26,115,232,0.02)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1A73E8', direction: 'ltr', fontFamily: 'Plus Jakarta Sans' }}>{word.tr}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)', direction: 'ltr' }}>{word.pronunciation}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{word.ar}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{word.en}</td>
                  <td style={{ padding: '12px 16px' }}><span className={`badge ${TAG_COLORS[word.tags[0]] || 'badge-blue'}`}>{word.tags[0]}</span></td>
                  <td style={{ padding: '12px 16px' }}><span className="badge badge-blue">{word.level}</span></td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <TTSButton text={word.tr} size={28} />
                      <button onClick={() => toggleFav(word.id)} style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid var(--border)', background: 'transparent', color: favorites.has(word.id) ? '#F59E0B' : 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>
                        {favorites.has(word.id) ? '⭐' : '☆'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
