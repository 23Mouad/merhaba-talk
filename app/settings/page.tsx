'use client';
import { useEffect, useState } from 'react';
import { settingsStorage, profileStorage, resetAll } from '../lib/localStorage';
import type { AppSettings, UserProfile } from '../lib/types';

const AVATARS = ['🎓', '👨‍🎓', '👩‍🎓', '🦁', '🐯', '🦅', '🌟', '🚀', '🎯', '💡'];

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(settingsStorage.get());
    setProfile(profileStorage.get());
  }, []);

  if (!settings || !profile) return <div style={{ padding: 40 }}>⏳ جارٍ التحميل...</div>;

  const update = (partial: Partial<AppSettings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    settingsStorage.update(partial);
    if (partial.theme) document.documentElement.setAttribute('data-theme', partial.theme);
  };

  const updateProfile = (partial: Partial<UserProfile>) => {
    const next = { ...profile, ...partial };
    setProfile(next);
    profileStorage.update(partial);
  };

  const saveAll = () => {
    settingsStorage.set(settings);
    profileStorage.set(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="card" style={{ padding: 24, marginBottom: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>{title}</div>
      {children}
    </div>
  );

  const Row = ({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)', gap: 16 }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!value)}
      style={{ width: 48, height: 26, borderRadius: 99, border: 'none', cursor: 'pointer', position: 'relative', background: value ? '#1A73E8' : 'var(--border)', transition: 'background 0.2s' }}>
      <div style={{ position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', left: value ? 25 : 3 }} />
    </button>
  );

  return (
    <div style={{ padding: '32px 28px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="section-title"><span>⚙️</span> الإعدادات</h1>
        <p className="section-subtitle">خصّص تجربة تعلمك</p>
      </div>

      {/* Profile */}
      <Section title="👤 الملف الشخصي">
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{profile.avatar}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>اختر رمزاً</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {AVATARS.map(av => (
              <button key={av} onClick={() => updateProfile({ avatar: av })}
                style={{ width: 40, height: 40, borderRadius: 10, border: `2px solid ${profile.avatar === av ? '#1A73E8' : 'var(--border)'}`, background: profile.avatar === av ? 'rgba(26,115,232,0.1)' : 'transparent', cursor: 'pointer', fontSize: 22 }}>
                {av}
              </button>
            ))}
          </div>
        </div>
        <Row label="الاسم">
          <input className="input" value={profile.name} onChange={e => updateProfile({ name: e.target.value })} style={{ width: 200, textAlign: 'right' }} />
        </Row>
        <Row label="المستوى الحالي">
          <select className="input" value={profile.currentLevel} onChange={e => updateProfile({ currentLevel: e.target.value as 'B1' | 'B2' })} style={{ width: 100 }}>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
          </select>
        </Row>
      </Section>

      {/* AI Chat */}
      <Section title="🤖 مفتاح Gemini API">
        <Row label="مفتاح API" desc="للحصول على مفتاح مجاني: aistudio.google.com">
          <input className="input" type="password" value={settings.geminiApiKey} onChange={e => update({ geminiApiKey: e.target.value })}
            placeholder="AIzaSy..." style={{ width: 240, direction: 'ltr' }} />
        </Row>
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(26,115,232,0.06)', fontSize: 13, color: 'var(--text-muted)' }}>
          💡 مفتاح Gemini مجاني. يُخزَّن محلياً فقط ولا يُرسَل لأي خادم آخر.
        </div>
      </Section>

      {/* Learning */}
      <Section title="📚 خيارات التعلم">
        <Row label="عرض الترجمة الإنجليزية" desc="إظهار الترجمة الإنجليزية في البطاقات">
          <Toggle value={settings.showEnglish} onChange={v => update({ showEnglish: v })} />
        </Row>
        <Row label="الهدف اليومي (كلمات)" desc="عدد الكلمات المستهدفة يومياً">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="range" min={5} max={100} step={5} value={settings.dailyGoal} onChange={e => update({ dailyGoal: +e.target.value })} style={{ width: 100 }} />
            <span style={{ fontWeight: 700, color: '#1A73E8', minWidth: 36 }}>{settings.dailyGoal}</span>
          </div>
        </Row>
      </Section>

      {/* TTS */}
      <Section title="🔊 إعدادات الصوت">
        <Row label="سرعة القراءة" desc="سرعة نطق النصوص التركية">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="range" min={0.5} max={2} step={0.1} value={settings.ttsRate} onChange={e => update({ ttsRate: +e.target.value })} style={{ width: 100 }} />
            <span style={{ fontWeight: 700, color: '#1A73E8', minWidth: 30 }}>{settings.ttsRate}x</span>
          </div>
        </Row>
      </Section>

      {/* Theme */}
      <Section title="🎨 المظهر">
        <Row label="الوضع الداكن">
          <Toggle value={settings.theme === 'dark'} onChange={v => update({ theme: v ? 'dark' : 'light' })} />
        </Row>
      </Section>

      {/* Danger */}
      <Section title="⚠️ خيارات متقدمة">
        <Row label="حذف كل البيانات" desc="سيتم مسح كل تقدمك وملاحظاتك ومحادثاتك">
          <button onClick={() => { if (confirm('هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء!')) { resetAll(); window.location.reload(); } }}
            style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #EF4444', background: 'rgba(239,68,68,0.07)', color: '#EF4444', cursor: 'pointer', fontFamily: 'Cairo', fontWeight: 700, fontSize: 13 }}>
            🗑️ حذف كل شيء
          </button>
        </Row>
      </Section>

      <button className="btn btn-primary" onClick={saveAll} style={{ width: '100%', padding: '14px', fontSize: 16 }}>
        {saved ? '✅ تم الحفظ!' : '💾 حفظ الإعدادات'}
      </button>
    </div>
  );
}
