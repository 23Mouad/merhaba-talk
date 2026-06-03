'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Curriculum, Phase, Section } from '../lib/types';
import { lessonStorage } from '../lib/localStorage';

export default function LearnPage() {
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [activePhase, setActivePhase] = useState<'b1' | 'b2'>('b1');

  useEffect(() => {
    fetch('/api/curriculum').then(r => r.json()).then(setCurriculum).catch(async () => {
      const r = await import('../data/curriculum.json');
      setCurriculum(r.default as unknown as Curriculum);
    });
    const lp = lessonStorage.get();
    const done: Record<string, boolean> = {};
    Object.entries(lp).forEach(([k, v]) => { done[k] = v.completed; });
    setProgress(done);
  }, []);

  if (!curriculum) return <div style={{ padding: 40, textAlign: 'center' }}>جارٍ التحميل...</div>;

  const phase = curriculum.phases.find(p => p.id === activePhase)!;

  const sectionPct = (sec: Section) => {
    const total = sec.lessons.length;
    const done = sec.lessons.filter(l => progress[l.id]).length;
    return total === 0 ? 0 : Math.round((done / total) * 100);
  };

  const phasePct = (ph: Phase) => {
    const all = ph.sections.flatMap(s => s.lessons);
    const done = all.filter(l => progress[l.id]).length;
    return all.length === 0 ? 0 : Math.round((done / all.length) * 100);
  };

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="section-title"><span>📚</span> المنهج الدراسي</h1>
        <p className="section-subtitle">تعلم التركية من المستوى B1 حتى B2 بشكل منظم</p>
      </div>

      {/* Phase tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
        {curriculum.phases.map(ph => (
          <button key={ph.id} onClick={() => setActivePhase(ph.id as any)}
            style={{
              flex: 1, padding: '16px 24px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: activePhase === ph.id ? ph.color : 'var(--bg-card)',
              color: activePhase === ph.id ? '#fff' : 'var(--text)',
              fontWeight: 700, fontSize: 15, transition: 'all 0.2s',
              boxShadow: activePhase === ph.id ? '0 4px 16px rgba(26,115,232,0.35)' : '0 2px 8px rgba(0,0,0,0.05)',
            }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>المستوى {ph.label}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>{ph.description}</div>
            <div style={{ marginTop: 8, background: 'rgba(255,255,255,0.25)', borderRadius: 99, height: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: activePhase === ph.id ? '#fff' : ph.color, width: `${phasePct(ph)}%`, borderRadius: 99, transition: 'width 0.8s' }} />
            </div>
            <div style={{ fontSize: 11, marginTop: 4, opacity: 0.8 }}>{phasePct(ph)}% مكتمل</div>
          </button>
        ))}
      </div>

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {phase.sections.map((sec, si) => {
          const pct = sectionPct(sec);
          return (
            <div key={sec.id} className="card animate-fade-up" style={{ padding: 0, overflow: 'hidden', animationDelay: `${si * 0.08}s` }}>
              <div style={{ padding: '20px 24px', background: `${phase.color}0d`, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 28 }}>{sec.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{sec.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, direction: 'ltr', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{sec.titleTr}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: phase.color }}>{pct}%</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sec.lessons.filter(l => progress[l.id]).length}/{sec.lessons.length} دروس</div>
                </div>
              </div>
              <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sec.lessons.map((lesson, li) => {
                  const done = progress[lesson.id];
                  const unlocked = li === 0 || progress[sec.lessons[li - 1].id];
                  return (
                    <div key={lesson.id} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: done ? '#22C55E' : unlocked ? phase.color : 'var(--border)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                        {done ? '✓' : !unlocked ? '🔒' : li + 1}
                      </div>
                      {unlocked ? (
                        <Link href={`/learn/${phase.id}/${lesson.id}`} style={{ flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderRadius: 10, background: done ? 'rgba(34,197,94,0.06)' : 'var(--bg)', border: `1px solid ${done ? 'rgba(34,197,94,0.2)' : 'var(--border)'}`, transition: 'all 0.2s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = phase.color}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = done ? 'rgba(34,197,94,0.2)' : 'var(--border)'}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{lesson.title}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', direction: 'ltr', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{lesson.titleTr}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="badge badge-blue">{lesson.vocabulary.length} كلمة</span>
                            <span style={{ color: phase.color }}>◀</span>
                          </div>
                        </Link>
                      ) : (
                        <div style={{ flex: 1, padding: '10px 16px', borderRadius: 10, background: 'var(--border)', opacity: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{lesson.title}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>أكمل الدرس السابق أولاً</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
