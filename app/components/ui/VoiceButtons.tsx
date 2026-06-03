'use client';
import { useState, useCallback } from 'react';

interface TTSButtonProps {
  text: string;
  lang?: string;
  size?: number;
}

export function TTSButton({ text, lang = 'tr-TR', size = 32 }: TTSButtonProps) {
  const [playing, setPlaying] = useState(false);

  const speak = useCallback(async () => {
    if (playing) return;
    setPlaying(true);
    
    // Fallback to native browser synthesis
    const fallbackSpeak = () => {
      if (!('speechSynthesis' in window)) {
        setPlaying(false);
        return;
      }
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang;
      utter.rate = 0.9;
      
      const voices = window.speechSynthesis.getVoices();
      const trVoice = voices.find(v => v.lang.includes('tr') || v.name.includes('Turkish') || v.name.includes('Türkçe'));
      if (trVoice) utter.voice = trVoice;
      
      utter.onend = () => setPlaying(false);
      utter.onerror = () => setPlaying(false);
      window.speechSynthesis.speak(utter);
    };

    // Split into chunks if text is too long
    const chunks = text.match(/.{1,190}(?:\s|$)/g) || [text];
    let currentChunk = 0;

    const playNext = async () => {
      if (currentChunk >= chunks.length) {
        setPlaying(false);
        return;
      }
      
      try {
        const res = await fetch(`https://lingva.ml/api/v1/audio/${lang.split('-')[0]}/${encodeURIComponent(chunks[currentChunk])}`);
        if (!res.ok) throw new Error('Lingva API failed');
        const data = await res.json();
        const audioData = new Uint8Array(data.audio);
        const blob = new Blob([audioData], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        
        audio.onended = () => {
          URL.revokeObjectURL(url);
          currentChunk++;
          playNext();
        };
        
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          throw new Error('Audio play failed');
        };
        
        await audio.play();
      } catch (err) {
        console.error('TTS Error:', err);
        fallbackSpeak();
      }
    };

    playNext();
  }, [text, lang, playing]);

  return (
    <button
      onClick={speak}
      aria-label="استمع للنطق"
      title="استمع للنطق"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '1.5px solid var(--border)',
        background: playing ? '#1A73E8' : 'var(--bg-card)',
        color: playing ? '#fff' : '#1A73E8',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.45,
        transition: 'all 0.2s',
        flexShrink: 0,
      }}
    >
      {playing ? '⏹' : '🔊'}
    </button>
  );
}

interface VoiceButtonProps {
  onResult: (text: string) => void;
  lang?: string;
  size?: number;
}

export function VoiceButton({ onResult, lang = 'tr-TR', size = 44 }: VoiceButtonProps) {
  const [listening, setListening] = useState(false);

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('المتصفح لا يدعم التعرف على الصوت. استخدم Chrome أو Edge.'); return; }
    const recognition = new SR();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      onResult(transcript);
    };
    recognition.start();
  }, [lang, onResult]);

  return (
    <button
      onClick={startListening}
      aria-label={listening ? 'جارٍ الاستماع...' : 'تحدث بالتركية'}
      title={listening ? 'جارٍ الاستماع...' : 'تحدث بالتركية'}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: 'none',
        background: listening ? '#EF4444' : 'linear-gradient(135deg,#1A73E8,#0D47A1)',
        color: '#fff',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.4,
        animation: listening ? 'mic-pulse 1.2s ease infinite' : 'none',
        transition: 'background 0.2s',
        flexShrink: 0,
        boxShadow: listening ? '0 0 0 4px rgba(239,68,68,0.2)' : '0 4px 12px rgba(26,115,232,0.3)',
      }}
    >
      🎤
    </button>
  );
}
