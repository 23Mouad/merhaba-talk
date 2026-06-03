'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  profileStorage, streakStorage, xpStorage,
  activityStorage, lessonStorage, settingsStorage
} from './lib/localStorage';
import type { UserProfile, StreakData } from './lib/types';
import { XPBar, StatCard } from './components/ui/UIComponents';

const TIPS = [
  { tr: 'Her gün biraz Türkçe çalış!', ar: 'اعمل على التركية قليلاً كل يوم!' },
  { tr: 'Tekrar anahtardır.', ar: 'التكرار هو المفتاح.' },
  { tr: 'Hata yapmaktan korkmayın!', ar: 'لا تخف من ارتكاب الأخطاء!' },
  { tr: 'Sabır ve azimle başarırsın.', ar: 'ستنجح بالصبر والعزيمة.' },
  { tr: 'Türkçe öğrenmek eğlencelidir!', ar: 'تعلم التركية ممتع!' },
];

const QUICK_ACTIONS = [
  { href: '/learn', icon: '📚', label: 'ابدأ الدرس', color: '#1A73E8', bg: 'rgba(26,115,232,0.08)' },
  { href: '/flashcards', icon: '🃏', label: 'راجع البطاقات', color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
  { href: '/games', icon: '🎮', label: 'العب لعبة', color: '#D97706', bg: 'rgba(217,119,6,0.08)' },
  { href: '/talk', icon: '🤖', label: 'تحدث مع AI', color: '#059669', bg: 'rgba(5,150,105,0.08)' },
];

function Heatmap({ activity }: { activity: Record<string, number> }) {
  const cells = [];
  const now = new Date();
  for (let i = 51; i >= 0; i--) {
    const week = [];
    for (let d = 6; d >= 0; d--) {
      const date = new Date(now);
      date.setDate(date.getDate() - (i * 7 + d));
      const key = date.toISOString().split('T')[0];
      const val = activity[key] || 0;
      const level = val === 0 ? 0 : val < 5 ? 1 : val < 15 ? 2 : val < 30 ? 3 : 4;
      week.push(<div key={key} className="heatmap-cell" data-level={level} title={`${key}: ${val}`} />);
    }
    cells.push(<div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{week}</div>);
  }
  return (
    <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
      <div style={{ display: 'flex', gap: 2, minWidth: 'max-content' }}>{cells}</div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
        <span>أقل</span>
        {[0,1,2,3,4].map(l => <div key={l} className="heatmap-cell" data-level={l} />)}
        <span>أكثر</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [streak, setStreak] = useState<StreakData>({ current: 0, longest: 0, lastDate: '' });
  const [todayXP, setTodayXP] = useState(0);
  const [activity, setActivity] = useState<Record<string, number>>({});
  const [tip, setTip] = useState(TIPS[0]);
  const [dailyGoal, setDailyGoal] = useState(20);
  const [wordsLearned, setWordsLearned] = useState(0);

  useEffect(() => {
    const p = profileStorage.get();
    const s = streakStorage.checkAndUpdate();
    const xp = xpStorage.getTodayXP();
    const act = activityStorage.get();
    const settings = settingsStorage.get();
    const progress = lessonStorage.get();
    const completedLessons = Object.keys(progress).length;
    activityStorage.record(1);
    setProfile(p);
    setStreak(s);
    setTodayXP(xp);
    setActivity(act);
    setDailyGoal(settings.dailyGoal);
    setWordsLearned(completedLessons * 5);
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    setTip(TIPS[dayOfYear % TIPS.length]);
  }, []);

  if (!profile) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 32 }}>
      <div className="animate-spin">⏳</div>
    </div>
  );

  const goalPct = Math.min(100, Math.round((todayXP / (dailyGoal * 10)) * 100));

  const now = new Date();
  const trDate = now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
  const arDate = now.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div className="animate-fade-up card" style={{ padding: '28px 32px', marginBottom: 28, background: 'linear-gradient(135deg, #1A73E8 0%, #0D47A1 100%)', border: 'none', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 4 }}>{arDate}</div>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 800, margin: 0 }}>
            مرحباً {profile.avatar} {profile.name}!
          </h1>
          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4, fontFamily: 'Plus Jakarta Sans, sans-serif', direction: 'ltr' }}>{trDate}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: '12px 20px' }}>
          <span className="animate-streak" style={{ fontSize: 32, display: 'inline-block' }}>🔥</span>
          <div>
            <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'Sora, sans-serif', lineHeight: 1 }}>{streak.current}</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>يوم متواصل</div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="animate-fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16, marginBottom: 28, animationDelay: '0.1s' }}>
        <StatCard icon="⚡" label="XP اليوم" value={todayXP} color="#F59E0B" />
        <StatCard icon="📖" label="كلمات تعلمتها" value={wordsLearned} color="#1A73E8" />
        <StatCard icon="🏆" label="أطول سلسلة" value={`${streak.longest} يوم`} color="#7C3AED" />
        <StatCard icon="⭐" label="إجمالي XP" value={profile.totalXP} color="#059669" />
      </div>

      {/* XP + Goal */}
      <div className="animate-fade-up" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28, animationDelay: '0.15s' }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚡</span> تقدم المستوى
          </div>
          <XPBar xp={profile.totalXP} level={profile.currentLevel} />
        </div>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span>🎯</span> هدف اليوم</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{goalPct}%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={100} height={100} viewBox="0 0 100 100">
              <circle cx={50} cy={50} r={40} fill="none" stroke="var(--border)" strokeWidth={8} />
              <circle cx={50} cy={50} r={40} fill="none" stroke="#1A73E8" strokeWidth={8}
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - goalPct / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
              <text x={50} y={55} textAnchor="middle" fill="var(--text)" fontSize={18} fontWeight={700}>{goalPct}%</text>
            </svg>
          </div>
          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {todayXP} / {dailyGoal * 10} XP اليومية
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="animate-fade-up" style={{ marginBottom: 28, animationDelay: '0.2s' }}>
        <div className="section-title" style={{ marginBottom: 16 }}>⚡ وصول سريع</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
          {QUICK_ACTIONS.map(a => (
            <Link key={a.href} href={a.href} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ padding: '20px 16px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', background: a.bg, border: `1.5px solid ${a.color}22` }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                <div style={{ fontSize: 36, marginBottom: 8 }}>{a.icon}</div>
                <div style={{ fontWeight: 700, color: a.color, fontSize: 14 }}>{a.label}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Heatmap + Tip */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, marginBottom: 28 }}>
        <div className="card animate-fade-up" style={{ padding: 24, animationDelay: '0.25s' }}>
          <div className="section-title" style={{ marginBottom: 16, fontSize: 16 }}>📊 نشاطك الأسبوعي</div>
          <Heatmap activity={activity} />
        </div>
        <div className="card animate-fade-up" style={{ padding: 24, minWidth: 200, animationDelay: '0.3s', background: 'linear-gradient(135deg,rgba(26,115,232,0.05),rgba(13,71,161,0.08))' }}>
          <div className="section-title" style={{ marginBottom: 12, fontSize: 16 }}>💡 نصيحة اليوم</div>
          <div style={{ fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#1A73E8', fontWeight: 600, marginBottom: 10, direction: 'ltr', lineHeight: 1.5 }}>
            "{tip.tr}"
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>"{tip.ar}"</div>
        </div>
      </div>
    </div>
  );
}
