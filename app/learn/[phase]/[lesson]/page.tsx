'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Lesson, Curriculum, Exercise } from '../../../lib/types';
import { lessonStorage, activityStorage, vocabStorage } from '../../../lib/localStorage';
import { TTSButton } from '../../../components/ui/VoiceButtons';

type Props = { params: Promise<{ phase: string; lesson: string }> };

export default function LessonPage({ params }: Props) {
  const { phase, lesson: lessonId } = use(params);
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [lessonData, setLessonData] = useState<Lesson | null>(null);
  const [tab, setTab] = useState<'vocab' | 'grammar' | 'exercises'>('vocab');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState<number | null>(null);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());

  useEffect(() => {
    import('../../../data/curriculum.json').then(m => {
      const c = m.default as unknown as Curriculum;
      setCurriculum(c);
      for (const ph of c.phases) {
        for (const sec of ph.sections) {
          for (const l of sec.lessons) {
            if (l.id === lessonId) { setLessonData(l); return; }
          }
        }
      }
    });
  }, [lessonId]);

  if (!lessonData) return <div style={{ padding: 40, textAlign: 'center', fontSize: 24 }}>⏳ جارٍ التحميل...</div>;

  const handleAnswer = (ex: Exercise, val: string) => setAnswers(a => ({ ...a, [ex.id]: val }));

  const checkExercises = () => {
    const results: Record<string, boolean> = {};
    lessonData.exercises.forEach(ex => {
      results[ex.id] = (answers[ex.id] || '').trim().toLowerCase() === ex.answer.toLowerCase();
    });
    setChecked(results);
    const correct = Object.values(results).filter(Boolean).length;
    const total = lessonData.exercises.length;
    const sc = total > 0 ? Math.round((correct / total) * 100) : 100;
    setScore(sc);
    lessonStorage.complete(lessonId, sc, lessonData.xpReward);
    activityStorage.record(5);
  };

  const saveWord = (id: string) => {
    const word = lessonData.vocabulary.find(v => v.id === id);
    if (word) {
      vocabStorage.addWord(word);
      setSavedWords(s => new Set([...s, id]));
    }
  };

  const TABS = [
    { id: 'vocab', label: '📖 المفردات' },
    { id: 'grammar', label: '📐 القواعد' },
    { id: 'exercises', label: '✏️ التمارين' },
  ] as const;

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/learn" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 14 }}>← المنهج</Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{lessonData.title}</span>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: 24, background: 'linear-gradient(135deg,#1A73E8,#0D47A1)', color: '#fff', border: 'none' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{lessonData.title}</h1>
        <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4, direction: 'ltr', fontFamily: 'Plus Jakarta Sans' }}>{lessonData.titleTr}</div>
        <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 99, padding: '4px 12px', fontSize: 12 }}>📖 {lessonData.vocabulary.length} كلمة</span>
          <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 99, padding: '4px 12px', fontSize: 12 }}>✏️ {lessonData.exercises.length} تمرين</span>
          <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 99, padding: '4px 12px', fontSize: 12 }}>⚡ {lessonData.xpReward} XP</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: 'var(--bg-card)', padding: 6, borderRadius: 14, border: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: 600, fontSize: 13,
              background: tab === t.id ? '#1A73E8' : 'transparent',
              color: tab === t.id ? '#fff' : 'var(--text-muted)', transition: 'all 0.2s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Vocabulary Tab */}
      {tab === 'vocab' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {lessonData.vocabulary.map(word => (
            <div key={word.id} className="card animate-fade-up" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Plus Jakarta Sans', color: '#1A73E8', direction: 'ltr' }}>{word.tr}</span>
                    <TTSButton text={word.tr} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg)', padding: '2px 8px', borderRadius: 99, direction: 'ltr', fontFamily: 'Plus Jakarta Sans' }}>{word.pronunciation}</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{word.ar}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>{word.en}</div>
                  <div style={{ borderRadius: 10, background: 'rgba(26,115,232,0.06)', padding: '10px 14px', border: '1px solid rgba(26,115,232,0.1)' }}>
                    <div style={{ direction: 'ltr', fontFamily: 'Plus Jakarta Sans', fontSize: 14, color: '#1A73E8', fontWeight: 600 }}>{word.example_tr}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{word.example_ar}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {word.tags.map(t => <span key={t} className="badge badge-blue">{t}</span>)}
                  <button onClick={() => saveWord(word.id)}
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid var(--border)', background: savedWords.has(word.id) ? 'rgba(34,197,94,0.1)' : 'transparent', color: savedWords.has(word.id) ? '#22C55E' : 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontFamily: 'Cairo', fontWeight: 600 }}>
                    {savedWords.has(word.id) ? '✓ محفوظ' : '+ حفظ'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grammar Tab */}
      {tab === 'grammar' && (
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📐</span> شرح القواعد
          </h2>
          <div style={{ lineHeight: 1.9, fontSize: 15 }} dangerouslySetInnerHTML={{ __html: lessonData.grammar }} />
        </div>
      )}

      {/* Exercises Tab */}
      {tab === 'exercises' && (
        <div>
          {lessonData.exercises.map((ex, i) => (
            <div key={ex.id} className="card" style={{ padding: 24, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, display: 'flex', gap: 8 }}>
                <span style={{ background: '#1A73E8', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>{i + 1}</span>
                <span>{ex.questionAr || ex.question}</span>
              </div>
              <div style={{ fontSize: 15, direction: 'ltr', fontFamily: 'Plus Jakarta Sans', color: '#1A73E8', marginBottom: 14, fontWeight: 600 }}>{ex.question}</div>

              {ex.type === 'multiple_choice' && ex.options ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {ex.options.map(opt => {
                    const isSelected = answers[ex.id] === opt;
                    const isCorrect = checked[ex.id] !== undefined && opt === ex.answer;
                    const isWrong = checked[ex.id] !== undefined && isSelected && !isCorrect;
                    return (
                      <button key={opt} onClick={() => !checked[ex.id] && handleAnswer(ex, opt)}
                        style={{ padding: '12px 16px', borderRadius: 10, border: `2px solid ${isCorrect ? '#22C55E' : isWrong ? '#EF4444' : isSelected ? '#1A73E8' : 'var(--border)'}`, background: isCorrect ? 'rgba(34,197,94,0.08)' : isWrong ? 'rgba(239,68,68,0.08)' : isSelected ? 'rgba(26,115,232,0.08)' : 'transparent', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: 600, color: 'var(--text)', transition: 'all 0.2s' }}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <input className="input" value={answers[ex.id] || ''} onChange={e => handleAnswer(ex, e.target.value)}
                  placeholder="اكتب إجابتك هنا..." disabled={!!checked[ex.id]}
                  style={{ direction: 'ltr', borderColor: checked[ex.id] !== undefined ? (checked[ex.id] ? '#22C55E' : '#EF4444') : undefined }} />
              )}

              {checked[ex.id] !== undefined && !checked[ex.id] && (
                <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 13 }}>
                  ✗ الإجابة الصحيحة: <strong style={{ direction: 'ltr', display: 'inline-block' }}>{ex.answer}</strong>
                </div>
              )}
            </div>
          ))}

          {score === null ? (
            <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: 15 }} onClick={checkExercises}>
              ✓ تحقق من الإجابات
            </button>
          ) : (
            <div className="card" style={{ padding: 28, textAlign: 'center', border: `2px solid ${score >= 70 ? '#22C55E' : '#F59E0B'}` }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>{score >= 70 ? '🎉' : '💪'}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: score >= 70 ? '#22C55E' : '#F59E0B' }}>{score}%</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
                {score >= 70 ? 'ممتاز! تم حفظ تقدمك.' : 'حاول مرة أخرى للحصول على نتيجة أفضل.'}
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
                <Link href="/learn" className="btn btn-ghost" style={{ padding: '10px 24px' }}>← العودة للمنهج</Link>
                {score >= 70 && <Link href="/flashcards" className="btn btn-primary" style={{ padding: '10px 24px' }}>راجع البطاقات 🃏</Link>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
