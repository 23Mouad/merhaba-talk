'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { settingsStorage } from '../../lib/localStorage';

const NAV = [
  { href: '/', icon: '🏠', label: 'الرئيسية' },
  { href: '/learn', icon: '📚', label: 'المنهج' },
  { href: '/flashcards', icon: '🃏', label: 'البطاقات' },
  { href: '/vocabulary', icon: '📖', label: 'المفردات' },
  { href: '/phrases', icon: '💬', label: 'العبارات' },
  { href: '/talk', icon: '🤖', label: 'محادثة AI' },
  { href: '/games', icon: '🎮', label: 'الألعاب' },
  { href: '/podcast', icon: '🎬', label: 'بودكاست' },
  { href: '/notes', icon: '📝', label: 'ملاحظاتي' },
  { href: '/settings', icon: '⚙️', label: 'الإعدادات' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const s = settingsStorage.get();
    setCollapsed(s.sidebarCollapsed);
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    settingsStorage.update({ sidebarCollapsed: next });
  };

  const w = collapsed ? 70 : 260;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 49 }}
        />
      )}

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          position: 'fixed', top: 16, right: 16, zIndex: 60,
          background: '#1A73E8', color: '#fff', border: 'none',
          borderRadius: 10, padding: '8px 12px', fontSize: 18, cursor: 'pointer',
          display: 'none',
        }}
        className="mobile-menu-btn"
        aria-label="فتح القائمة"
      >
        ☰
      </button>

      <aside
        style={{
          width: w,
          minHeight: '100vh',
          background: 'var(--bg-sidebar)',
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
        }}
      >
        {/* Logo */}
        <div style={{ padding: collapsed ? '20px 10px' : '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 12, justifyContent: collapsed ? 'center' : 'space-between' }}>
          {!collapsed && (
            <div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 20, color: '#fff', letterSpacing: -0.5 }}>TürkçeAI</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>تعلّم التركية بالذكاء الاصطناعي</div>
            </div>
          )}
          {collapsed && <span style={{ fontSize: 24 }}>🇹🇷</span>}
          <button onClick={toggle} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', padding: 6, fontSize: 14 }} aria-label="طي القائمة">
            {collapsed ? '◀' : '▶'}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {NAV.map(item => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: collapsed ? '12px 0' : '12px 20px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  margin: '2px 8px',
                  borderRadius: 10,
                  color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                  background: active ? 'rgba(255,255,255,0.18)' : 'transparent',
                  fontWeight: active ? 700 : 400,
                  fontSize: 14,
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  borderRight: active ? '3px solid #60A5FA' : '3px solid transparent',
                }}
              >
                <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span style={{ fontFamily: 'Cairo, sans-serif' }}>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        {!collapsed && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>TürkçeAI v1.0 · B1–B2</div>
          </div>
        )}
      </aside>

      {/* Spacer */}
      <div className="sidebar-spacer" style={{ width: w, flexShrink: 0, transition: 'width 0.3s' }} />

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
          aside { transform: ${mobileOpen ? 'translateX(0)' : 'translateX(100%)'}; }
          .sidebar-spacer { display: none; }
        }
      `}</style>
    </>
  );
}
