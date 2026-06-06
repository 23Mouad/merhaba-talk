'use client';
import { useEffect, useRef, useState } from 'react';
import { conversationStorage, settingsStorage, xpStorage, activityStorage } from '../lib/localStorage';
import type { ChatMessage, Conversation } from '../lib/types';
import { VoiceButton, TTSButton } from '../components/ui/VoiceButtons';

const SYSTEM_PROMPT = `أنت مدرّس تركي ودود اسمه Ahmet. تتحدث مع طالب عربي يتعلم التركية.
ردك يجب أن يكون حصرياً بصيغة JSON صحيحة بدون أي نص إضافي، بالهيكل التالي:
{
  "score": <رقم من 0 إلى 100 يعبر عن صحة لغة الطالب وقواعده بالتركية>,
  "highlightedCorrected": "<إذا كتب الطالب بالتركية، صحح أخطاءه وضع الكلمات المصححة داخل <span> باللون الأخضر. أما إذا كتب بالعربية أو الإنجليزية، فاكتب هنا الترجمة التركية الصحيحة لما قاله>",
  "alternative": "<جملة تركية بديلة وممتازة كخيار أفضل للقول، بدون أي ترجمة>",
  "reply": "<ردك كمدرس باللغة التركية فقط بناءً على ما قاله، بدون أي عربي أو إنجليزي>"
}
إذا كان النص التركي صحيحاً تماماً، اجعل highlightedCorrected مطابقاً للنص الأصلي، و score يساوي 100. وإذا كتب بغير التركية اجعل score يساوي 0.`;

const TOPICS = [
  { label: '🍽️ الطعام', prompt: 'دعنا نتحدث عن الطعام التركي' },
  { label: '✈️ السفر', prompt: 'أريد أن أتحدث عن السفر في تركيا' },
  { label: '☀️ يومي', prompt: 'أخبرني كيف يبدو يومك المعتاد' },
  { label: '💼 العمل', prompt: 'دعنا نتحدث عن العمل والمهن' },
  { label: '🏛️ الثقافة', prompt: 'أخبرني عن الثقافة التركية' },
];

export default function TalkPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<Conversation[]>([]);
  const [convId, setConvId] = useState(() => `conv_${Date.now()}`);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const [popup, setPopup] = useState<{ text: string; x: number; y: number; translation: string; loading: boolean } | null>(null);

  useEffect(() => {
    setHistory(conversationStorage.getAll());
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleMouseUp = async () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (!text || text.length === 0) {
        setPopup(null);
        return;
      }
      
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      if (!rect) return;

      const x = rect.left + rect.width / 2;
      const y = rect.top - 10;
      
      setPopup({ text, x, y, translation: '', loading: true });

      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error);
        
        const trans = data.translation || 'خطأ في الترجمة';
        setPopup(prev => prev ? { ...prev, translation: trans, loading: false } : null);
      } catch {
        setPopup(prev => prev ? { ...prev, translation: 'خطأ', loading: false } : null);
      }
    };
    
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      contentTr: text,
      timestamp: new Date().toISOString(),
    };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          contents: newMsgs.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.contentTr }]
          }))
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('API Error:', data.error);
        throw new Error(data.error || 'API Error');
      }
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      let parsed;
      try {
        parsed = JSON.parse(cleanJson);
      } catch (e) {
        parsed = { reply: rawText, score: 0, highlightedCorrected: text, alternative: '' };
      }

      const updatedUserMsg: ChatMessage = {
        ...userMsg,
        correction: {
          score: parsed.score || 0,
          highlightedCorrected: parsed.highlightedCorrected || text,
          betterAlternative: parsed.alternative
        }
      };

      const aiMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        contentTr: parsed.reply || '...',
        timestamp: new Date().toISOString(),
      };
      const finalMsgs = [...messages, updatedUserMsg, aiMsg];
      setMessages(finalMsgs);
      const conv: Conversation = { id: convId, title: text.slice(0, 40), messages: finalMsgs, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      conversationStorage.save(conv);
      xpStorage.add(5, 'chat');
      activityStorage.record(3);
    } catch {
      setMessages(prev => [...prev, { id: `err_${Date.now()}`, role: 'assistant', contentTr: 'خطأ في الاتصال. تحقق من مفتاح API.', timestamp: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  const newConversation = () => {
    setMessages([]);
    setConvId(`conv_${Date.now()}`);
    setShowHistory(false);
  };

  return (
    <div style={{ padding: '0', maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {popup && (
        <div style={{
          position: 'fixed', left: popup.x, top: popup.y, transform: 'translate(-50%, -100%)',
          background: '#1A73E8', color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 14,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 1000, pointerEvents: 'none',
          whiteSpace: 'nowrap', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis'
        }}>
          {popup.loading ? '⏳ جارٍ الترجمة...' : popup.translation}
          <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', borderWidth: '6px 6px 0', borderStyle: 'solid', borderColor: '#1A73E8 transparent transparent transparent' }} />
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg,#1A73E8,#0D47A1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, fontFamily: 'Sora' }}>🤖 Ahmet - مدرسك التركي</h1>
          <p style={{ fontSize: 12, opacity: 0.8, margin: '4px 0 0' }}>يتحدث التركية ويصحح أخطاءك</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowHistory(!showHistory)} style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 13 }}>📋 السجل</button>
          <button onClick={newConversation} style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 13 }}>+ جديد</button>
        </div>
      </div>

      {/* Topic chips */}
      {messages.length === 0 && (
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>ابدأ محادثة بالنقر على موضوع:</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TOPICS.map(t => (
              <button key={t.label} onClick={() => sendMessage(t.prompt)} className="topic-chip">{t.label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 6 }}>
            {msg.role === 'assistant' ? (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#1A73E8,#0D47A1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🤖</div>
                <div>
                  <div className="chat-bubble-ai" style={{ cursor: 'text' }}>
                    <div style={{ direction: 'ltr', fontFamily: 'Plus Jakarta Sans', fontSize: 15, lineHeight: 1.7 }}>{msg.contentTr}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <TTSButton text={msg.contentTr} size={28} />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', maxWidth: '85%' }}>
                {msg.correction && msg.correction.score !== undefined && (
                  <div style={{ 
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, marginBottom: 4,
                    background: msg.correction.score >= 90 ? '#DCFCE7' : msg.correction.score >= 50 ? '#FEF3C7' : '#FEE2E2',
                    color: msg.correction.score >= 90 ? '#166534' : msg.correction.score >= 50 ? '#92400E' : '#991B1B'
                  }}>
                    {msg.correction.score}%
                  </div>
                )}
                <div className="chat-bubble-user" style={{ cursor: 'text' }}>
                  <div style={{ direction: 'ltr', fontFamily: 'Plus Jakarta Sans', fontSize: 15 }}>{msg.contentTr}</div>
                </div>
                {msg.correction && msg.correction.highlightedCorrected && msg.correction.highlightedCorrected !== msg.contentTr && (
                  <div style={{ marginTop: 6, padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, width: '100%' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>✅ التصحيح:</div>
                    <div style={{ direction: 'ltr', fontFamily: 'Plus Jakarta Sans', fontSize: 14 }} dangerouslySetInnerHTML={{ __html: msg.correction.highlightedCorrected }} />
                    
                    {msg.correction.betterAlternative && (
                      <>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', marginBottom: 4 }}>💡 بديل أفضل:</div>
                        <div style={{ direction: 'ltr', fontFamily: 'Plus Jakarta Sans', fontSize: 14, color: '#1A73E8' }}>{msg.correction.betterAlternative}</div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#1A73E8,#0D47A1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
            <div className="chat-bubble-ai" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#1A73E8', animation: `bounce-in 1s ${i * 0.2}s ease infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <VoiceButton onResult={text => setInput(text)} size={44} />
          <input
            className="input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder="اكتب بالتركية أو العربية..."
            style={{ flex: 1, direction: 'auto' as any, fontSize: 15, padding: '12px 16px' }}
          />
          <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()}
            style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg,#1A73E8,#0D47A1)', color: '#fff', cursor: 'pointer', fontSize: 18, opacity: (!input.trim() || loading) ? 0.5 : 1 }}>
            ◀
          </button>
        </div>
      </div>

      {/* History panel */}
      {showHistory && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }} onClick={() => setShowHistory(false)}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 320, background: 'var(--bg-card)', overflowY: 'auto', padding: 20 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>📋 سجل المحادثات</div>
            {history.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>لا توجد محادثات سابقة</p>}
            {history.map(c => (
              <div key={c.id} onClick={() => { setMessages(c.messages); setConvId(c.id); setShowHistory(false); }}
                style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 8, cursor: 'pointer', background: convId === c.id ? 'rgba(26,115,232,0.08)' : 'transparent' }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{new Date(c.createdAt).toLocaleDateString('ar')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
