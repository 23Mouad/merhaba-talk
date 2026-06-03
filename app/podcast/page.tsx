'use client';
import { useEffect, useRef, useState } from 'react';
import type { PodcastEpisode, TranscriptSegment } from '../lib/types';
import { TTSButton, VoiceButton } from '../components/ui/VoiceButtons';

export default function PodcastPage() {
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [current, setCurrent] = useState<PodcastEpisode | null>(null);
  const [popup, setPopup] = useState<TranscriptSegment | null>(null);
  const [customUrl, setCustomUrl] = useState('');
  const [customId, setCustomId] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    import('../data/podcasts.json').then(m => {
      const eps = m.default as unknown as PodcastEpisode[];
      setEpisodes(eps);
      setCurrent(eps[0]);
    });
  }, []);

  const loadCustom = () => {
    const match = customUrl.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
    if (match) { setCustomId(match[1]); setCustomUrl(''); }
  };

  const videoId = customId || current?.youtubeId;

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="section-title"><span>🎬</span> بودكاست وفيديو</h1>
        <p className="section-subtitle">تعلم التركية من خلال المحتوى الأصيل مع نصوص تفاعلية</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
        {/* Playlist */}
        <div>
          <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>📋 قائمة التشغيل</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {episodes.map(ep => (
              <button key={ep.id} onClick={() => { setCurrent(ep); setCustomId(''); }}
                style={{ padding: '12px 14px', borderRadius: 10, border: '1.5px solid', borderColor: current?.id === ep.id ? '#1A73E8' : 'var(--border)', background: current?.id === ep.id ? 'rgba(26,115,232,0.08)' : 'var(--bg-card)', cursor: 'pointer', textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: current?.id === ep.id ? '#1A73E8' : 'var(--text)', marginBottom: 4 }}>{ep.title}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="badge badge-blue">{ep.level}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>⏱ {ep.durationMin} دقيقة</span>
                </div>
              </button>
            ))}
          </div>

          {/* Custom URL */}
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>🔗 أضف رابط YouTube</div>
            <input className="input" value={customUrl} onChange={e => setCustomUrl(e.target.value)} placeholder="الصق رابط YouTube..." style={{ marginBottom: 8, fontSize: 12 }} />
            <button className="btn btn-primary" onClick={loadCustom} style={{ width: '100%', padding: '8px', fontSize: 12 }}>تشغيل</button>
          </div>
        </div>

        {/* Player + Transcript */}
        <div>
          {videoId && (
            <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 20, aspectRatio: '16/9' }}>
              <iframe ref={iframeRef} width="100%" height="100%"
                src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
                title="YouTube" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          )}

          {current && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📜</span> النص التفاعلي — انقر على أي جملة
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {current.transcript.map((seg, i) => (
                  <div key={i} onClick={() => setPopup(popup?.time === seg.time ? null : seg)}
                    style={{ padding: '10px 14px', borderRadius: 10, cursor: 'pointer', border: '1.5px solid', borderColor: popup?.time === seg.time ? '#1A73E8' : 'var(--border)', background: popup?.time === seg.time ? 'rgba(26,115,232,0.06)' : 'transparent', transition: 'all 0.2s' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{Math.floor(seg.time / 60)}:{String(seg.time % 60).padStart(2, '0')}</div>
                    <div style={{ fontSize: 15, fontFamily: 'Plus Jakarta Sans', fontWeight: 600, color: '#1A73E8', direction: 'ltr' }}>{seg.tr}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{seg.ar}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Popup */}
      {popup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ maxWidth: 440, width: '100%', padding: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontFamily: 'Plus Jakarta Sans', fontWeight: 700, color: '#1A73E8', direction: 'ltr', marginBottom: 12, lineHeight: 1.5 }}>{popup.tr}</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{popup.ar}</div>
            {popup.en && <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>{popup.en}</div>}
            <TTSButton text={popup.tr} size={44} />
            <button onClick={() => setPopup(null)} className="btn btn-ghost" style={{ width: '100%', marginTop: 16, padding: '10px' }}>إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
}
