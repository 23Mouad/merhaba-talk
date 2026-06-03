'use client';

interface XPBarProps {
  xp: number;
  maxXP?: number;
  level?: string;
  showLabel?: boolean;
}

export function XPBar({ xp, maxXP = 1000, level = 'B1', showLabel = true }: XPBarProps) {
  const pct = Math.min(100, Math.round((xp % maxXP) / maxXP * 100));
  return (
    <div style={{ width: '100%' }}>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>المستوى {level}</span>
          <span style={{ color: 'var(--text-muted)' }}>{xp} XP</span>
        </div>
      )}
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      {showLabel && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'left' }}>
          {pct}% نحو المستوى التالي
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
  subtitle?: string;
}

export function StatCard({ icon, label, value, color = '#1A73E8', subtitle }: StatCardProps) {
  return (
    <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center', minWidth: 100 }}>
      <span style={{ fontSize: 32 }}>{icon}</span>
      <span style={{ fontSize: 28, fontWeight: 800, color, fontFamily: 'Sora, sans-serif' }}>{value}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</span>
      {subtitle && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{subtitle}</span>}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  emoji?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, emoji, children }: PageHeaderProps) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="section-title">
            {emoji && <span style={{ fontSize: 28 }}>{emoji}</span>}
            {title}
          </h1>
          {subtitle && <p className="section-subtitle">{subtitle}</p>}
        </div>
        {children && <div style={{ display: 'flex', gap: 8 }}>{children}</div>}
      </div>
    </div>
  );
}
