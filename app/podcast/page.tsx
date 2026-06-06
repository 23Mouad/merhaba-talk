'use client';
import { useEffect, useRef, useState } from 'react';
import type { PodcastEpisode, TranscriptSegment } from '../lib/types';
import { TTSButton } from '../components/ui/VoiceButtons';
import YouTube from 'react-youtube';

export default function PodcastPage() {
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [current, setCurrent] = useState<PodcastEpisode | null>(null);
  const [customUrl, setCustomUrl] = useState('');
  const [customId, setCustomId] = useState('');
  const [customTranscript, setCustomTranscript] = useState<TranscriptSegment[] | null>(null);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [selectionPopup, setSelectionPopup] = useState<{ text: string; translation: string; loading: boolean } | null>(null);

  useEffect(() => {
    import('../data/podcasts.json').then(m => {
      const eps = m.default as unknown as PodcastEpisode[];
      setEpisodes(eps);
      setCurrent(eps[0]);
    });
  }, []);

  const handleStateChange = (e: any) => {
    if (e.data === 1) { // PLAYING
      intervalRef.current = setInterval(() => {
        setCurrentTime(e.target.getCurrentTime() || 0);
      }, 100);
    } else {
      clearInterval(intervalRef.current);
    }
  };

  useEffect(() => {
    const handleMouseUp = async () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (!text || text.length === 0) return;
      
      if (playerRef.current) {
        try { playerRef.current.pauseVideo(); } catch (e) {}
      }
      
      setSelectionPopup({ text, translation: '', loading: true });

      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        const trans = data.translation || 'خطأ في الترجمة';
        setSelectionPopup(prev => prev ? { ...prev, translation: trans, loading: false } : null);
      } catch {
        setSelectionPopup(prev => prev ? { ...prev, translation: 'خطأ', loading: false } : null);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  const loadCustom = async () => {
    const match = customUrl.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
    if (match) { 
      const vId = match[1];
      setCustomId(vId); 
      setCustomUrl('');
      setCurrent(null);
      setCustomTranscript(null);
      setLoadingTranscript(true);
      setCurrentTime(0);
      setSelectionPopup(null);
      
      try {
        const res = await fetch(`/api/transcript?videoId=${vId}`);
        const data = await res.json();
        if (res.ok && data.transcript) {
          setCustomTranscript(data.transcript);
        } else {
          console.error("Transcript fetch error:", data.error);
        }
      } catch (err) {
        console.error("Failed to fetch custom transcript", err);
      } finally {
        setLoadingTranscript(false);
      }
    }
  };

  const videoId = customId || current?.youtubeId;
  const activeTranscript = current ? current.transcript : customTranscript;

  const activeSegment = activeTranscript?.find((s, i) => {
    const nextTime = activeTranscript[i + 1]?.time || Infinity;
    return currentTime >= s.time && currentTime < nextTime;
  });

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1200, margin: '0 auto' }}>
      
      <div style={{ marginBottom: 24 }}>
        <h1 className="section-title"><span>🎬</span> بودكاست وفيديو</h1>
        <p className="section-subtitle">تعلم التركية من خلال المحتوى الأصيل مع نصوص تفاعلية. ظلل أي كلمة للترجمة.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-5">
        
        {/* Playlist Sidebar */}
        <div className="w-full md:w-[280px] shrink-0 order-2 md:order-1">
          <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>📋 قائمة التشغيل</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {episodes.map(ep => (
              <button key={ep.id} onClick={() => { setCurrent(ep); setCustomId(''); setCustomTranscript(null); setCurrentTime(0); setSelectionPopup(null); }}
                style={{ padding: '12px 14px', borderRadius: 10, border: '1.5px solid', borderColor: current?.id === ep.id ? '#1A73E8' : 'var(--border)', background: current?.id === ep.id ? 'rgba(26,115,232,0.08)' : 'var(--bg-card)', cursor: 'pointer', textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: current?.id === ep.id ? '#1A73E8' : 'var(--text)', marginBottom: 4 }}>{ep.title}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="badge badge-blue">{ep.level}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>⏱ {ep.durationMin} دقيقة</span>
                </div>
              </button>
            ))}
          </div>

          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>🔗 أضف رابط YouTube</div>
            <input className="input" value={customUrl} onChange={e => setCustomUrl(e.target.value)} placeholder="الصق رابط YouTube..." style={{ marginBottom: 8, fontSize: 12, direction: 'ltr' }} />
            <button className="btn btn-primary" onClick={loadCustom} style={{ width: '100%', padding: '8px', fontSize: 12 }}>
              {loadingTranscript ? 'جارٍ التحميل...' : 'تشغيل'}
            </button>
          </div>
        </div>

        {/* Player Area */}
        <div className="flex-1 order-1 md:order-2 w-full min-w-0 flex flex-col gap-5">
          {videoId && (
            <div 
              ref={containerRef}
              style={{ borderRadius: isFullscreen ? 0 : 16, overflow: 'hidden', position: 'relative', aspectRatio: isFullscreen ? 'auto' : '16/9', width: '100%', height: isFullscreen ? '100vh' : 'auto', background: '#000', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
            >
              <YouTube 
                videoId={videoId} 
                onReady={(event) => { playerRef.current = event.target; }}
                onStateChange={handleStateChange}
                opts={{
                  width: '100%',
                  height: '100%',
                  playerVars: {
                    autoplay: 0,
                    rel: 0,
                    controls: 1,
                    modestbranding: 1,
                    fs: 0, // Disable native YouTube fullscreen
                  },
                }}
                className="w-full h-full"
                iframeClassName="w-full h-full"
                style={{ width: '100%', height: '100%' }}
              />

              {/* Custom Fullscreen Button */}
              <button 
                onClick={toggleFullscreen}
                style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 60, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', padding: '6px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 18 }}
                title="Fullscreen"
              >
                {isFullscreen ? '↙' : '↗'}
              </button>

              {/* Translation Popup Overlay inside the video player! */}
              {selectionPopup && (
                <div style={{
                  position: 'absolute', left: 20, top: 20, background: '#0a0a0a', border: '1px solid #333', color: '#fff', 
                  padding: 20, borderRadius: 12, fontSize: 14, boxShadow: '0 10px 30px rgba(0,0,0,0.8)', zIndex: 50,
                  maxWidth: 320, fontFamily: 'Plus Jakarta Sans, sans-serif'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid #222', paddingBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#f43f5e', letterSpacing: 1 }}>WORD INSIGHT</div>
                    <button onClick={() => setSelectionPopup(null)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: 14 }}>[X]</button>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, direction: 'ltr' }}>{selectionPopup.text}</div>
                  <div style={{ background: '#111', padding: 12, borderRadius: 8, border: '1px solid #222', borderLeft: '3px solid #f43f5e' }}>
                    <div style={{ fontSize: 10, color: '#888', marginBottom: 4, textTransform: 'uppercase' }}>Translation</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#e5e5e5', fontFamily: 'Cairo, sans-serif' }}>
                      {selectionPopup.loading ? '⏳ جارٍ الترجمة...' : selectionPopup.translation}
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <TTSButton text={selectionPopup.text} size={30} />
                  </div>
                </div>
              )}

              {/* Subtitles Overlay */}
              {activeSegment && (
                <div style={{
                  position: 'absolute', bottom: '15%', left: 0, right: 0, 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', 
                  pointerEvents: 'auto', zIndex: 40, padding: '0 40px'
                }}>
                  <div style={{
                    fontSize: 'clamp(18px, 3.5vw, 36px)', fontWeight: 800, fontFamily: 'Plus Jakarta Sans, sans-serif', 
                    color: '#fff', textAlign: 'center', textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 4px 12px rgba(0,0,0,0.8)',
                    direction: 'ltr', lineHeight: 1.2
                  }}>
                    {activeSegment.tr}
                  </div>
                  {(activeSegment.ar && activeSegment.ar !== '...') && (
                    <div style={{
                      fontSize: 'clamp(14px, 2.5vw, 24px)', fontWeight: 700, fontFamily: 'Cairo, sans-serif', 
                      color: '#f43f5e', textAlign: 'center', marginTop: 8, fontStyle: 'italic',
                      textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 2px 8px rgba(0,0,0,0.8)'
                    }}>
                      {activeSegment.ar}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Transcript List (Hidden on mobile, visible on desktop as a reference) */}
          {activeTranscript && (
            <div className="card hidden md:block" style={{ padding: 20, maxHeight: 400, overflowY: 'auto' }}>
              <div style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📜</span> السجل الكامل
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activeTranscript.map((seg, i) => {
                  const isActive = activeSegment?.time === seg.time;
                  return (
                    <div key={i} onClick={() => { playerRef.current?.seekTo(seg.time); playerRef.current?.playVideo(); }}
                      style={{ padding: '8px 12px', borderRadius: 8, cursor: 'pointer', border: '1.5px solid', borderColor: isActive ? '#f43f5e' : 'transparent', background: isActive ? 'rgba(244,63,94,0.06)' : 'transparent', transition: 'all 0.2s' }}>
                      <div style={{ fontSize: 14, fontFamily: 'Plus Jakarta Sans', fontWeight: isActive ? 700 : 500, color: isActive ? '#f43f5e' : 'var(--text)', direction: 'ltr' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 8, fontWeight: 400 }}>{Math.floor(seg.time / 60)}:{String(seg.time % 60).padStart(2, '0')}</span>
                        {seg.tr}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
