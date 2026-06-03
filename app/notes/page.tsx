'use client';
import { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import type { Note } from '../lib/types';
import { notesStorage } from '../lib/localStorage';

const TEMPLATES = {
  lesson: '<h1>📖 درس جديد</h1><h2>الكلمات الجديدة:</h2><ul><li></li></ul><h2>القاعدة:</h2><p></p><h2>ملاحظاتي:</h2><p></p>',
  grammar: '<h1>💡 قاعدة مهمة</h1><h2>الشرح:</h2><p></p><h2>أمثلة:</h2><ul><li></li></ul>',
  conversation: '<h1>🗣️ محادثة</h1><p><strong>الموضوع:</strong> </p><p><strong>المفردات الجديدة:</strong></p><ul><li></li></ul>',
};

const TAGS = ['#grammar', '#vocab', '#phrase', '#B1', '#B2', '#conversation', '#culture'];

function newNote(template?: keyof typeof TEMPLATES): Note {
  return {
    id: `note_${Date.now()}`,
    title: 'ملاحظة جديدة',
    content: template ? TEMPLATES[template] : '<p></p>',
    tags: [],
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [active, setActive] = useState<Note | null>(null);
  const [search, setSearch] = useState('');
  const [saveTimer, setSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      Underline,
      Placeholder.configure({ placeholder: 'ابدأ الكتابة هنا...' }),
    ],
    content: active?.content || '<p></p>',
    onUpdate: ({ editor }) => {
      if (!active) return;
      const updated = { ...active, content: editor.getHTML(), updatedAt: new Date().toISOString() };
      setActive(updated);
      if (saveTimer) clearTimeout(saveTimer);
      setSaveTimer(setTimeout(() => { notesStorage.save(updated); setNotes(notesStorage.getAll()); }, 2000));
    },
    editorProps: { attributes: { class: 'tiptap-editor' } },
  });

  useEffect(() => {
    const all = notesStorage.getAll();
    setNotes(all);
    if (all.length > 0) { setActive(all[0]); editor?.commands.setContent(all[0].content); }
  }, []);

  const openNote = (note: Note) => { setActive(note); editor?.commands.setContent(note.content); };

  const createNote = (template?: keyof typeof TEMPLATES) => {
    const n = newNote(template);
    notesStorage.save(n);
    setNotes(notesStorage.getAll());
    openNote(n);
  };

  const deleteNote = (id: string) => {
    notesStorage.delete(id);
    const all = notesStorage.getAll();
    setNotes(all);
    if (active?.id === id) { setActive(all[0] || null); editor?.commands.setContent(all[0]?.content || ''); }
  };

  const togglePin = () => {
    if (!active) return;
    const updated = { ...active, pinned: !active.pinned, updatedAt: new Date().toISOString() };
    notesStorage.save(updated);
    setActive(updated);
    setNotes(notesStorage.getAll());
  };

  const toggleTag = (tag: string) => {
    if (!active) return;
    const tags = active.tags.includes(tag) ? active.tags.filter(t => t !== tag) : [...active.tags, tag];
    const updated = { ...active, tags, updatedAt: new Date().toISOString() };
    notesStorage.save(updated);
    setActive(updated);
    setNotes(notesStorage.getAll());
  };

  const updateTitle = (title: string) => {
    if (!active) return;
    const updated = { ...active, title, updatedAt: new Date().toISOString() };
    notesStorage.save(updated);
    setActive(updated);
    setNotes(notesStorage.getAll());
  };

  const filtered = notes.filter(n => !search || n.title.includes(search) || n.content.includes(search) || n.tags.some(t => t.includes(search)));
  const sorted = [...filtered].sort((a, b) => (b.pinned ? 1 : -1) - (a.pinned ? 1 : -1) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const ToolBtn = ({ onClick, active: isActive, children }: { onClick: () => void; active?: boolean; children: React.ReactNode }) => (
    <button onClick={onClick} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: isActive ? '#1A73E8' : 'transparent', color: isActive ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>{children}</button>
  );

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, height: 'calc(100vh - 64px)' }}>
      {/* Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث في الملاحظات..." />

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => createNote()} style={{ flex: 1, padding: '8px', fontSize: 12 }}>+ جديد</button>
          <select className="input" style={{ flex: 1, padding: '8px', fontSize: 12 }} onChange={e => { if (e.target.value) createNote(e.target.value as any); e.target.value = ''; }}>
            <option value="">📋 قالب</option>
            <option value="lesson">📖 درس</option>
            <option value="grammar">💡 قاعدة</option>
            <option value="conversation">🗣️ محادثة</option>
          </select>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sorted.map(note => (
            <div key={note.id} onClick={() => openNote(note)}
              style={{ padding: '12px 14px', borderRadius: 10, cursor: 'pointer', border: '1.5px solid', borderColor: active?.id === note.id ? '#1A73E8' : 'var(--border)', background: active?.id === note.id ? 'rgba(26,115,232,0.06)' : 'var(--bg-card)', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 700, fontSize: 13, flex: 1, marginLeft: 8 }}>{note.pinned ? '📌 ' : ''}{note.title}</div>
                <button onClick={e => { e.stopPropagation(); deleteNote(note.id); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, padding: 2 }}>×</button>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{new Date(note.updatedAt).toLocaleDateString('ar')}</div>
              {note.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                  {note.tags.map(t => <span key={t} style={{ fontSize: 10, background: 'rgba(26,115,232,0.1)', color: '#1A73E8', padding: '2px 6px', borderRadius: 99 }}>{t}</span>)}
                </div>
              )}
            </div>
          ))}
          {sorted.length === 0 && <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>لا توجد ملاحظات</div>}
        </div>
      </div>

      {/* Editor */}
      {active ? (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
          {/* Title */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <input value={active.title} onChange={e => updateTitle(e.target.value)}
              style={{ width: '100%', border: 'none', outline: 'none', fontSize: 18, fontWeight: 700, background: 'transparent', color: 'var(--text)', fontFamily: 'Cairo, sans-serif' }} />
          </div>

          {/* Toolbar */}
          <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
            <ToolBtn onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')}>B</ToolBtn>
            <ToolBtn onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')}><em>I</em></ToolBtn>
            <ToolBtn onClick={() => editor?.chain().focus().toggleUnderline().run()} active={editor?.isActive('underline')}><u>U</u></ToolBtn>
            <ToolBtn onClick={() => editor?.chain().focus().toggleHighlight().run()} active={editor?.isActive('highlight')}>🖊</ToolBtn>
            <ToolBtn onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')}>• List</ToolBtn>
            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
            <ToolBtn onClick={togglePin}>{active.pinned ? '📌 تثبيت' : '📍 تثبيت'}</ToolBtn>
            <button onClick={() => { const text = editor?.getText() || ''; navigator.clipboard.writeText(text); }}
              style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>📋 نسخ</button>
            <div style={{ marginRight: 'auto', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {TAGS.map(tag => (
                <button key={tag} onClick={() => toggleTag(tag)}
                  style={{ padding: '3px 8px', borderRadius: 99, fontSize: 11, cursor: 'pointer', border: '1px solid', borderColor: active.tags.includes(tag) ? '#1A73E8' : 'var(--border)', background: active.tags.includes(tag) ? 'rgba(26,115,232,0.1)' : 'transparent', color: active.tags.includes(tag) ? '#1A73E8' : 'var(--text-muted)' }}>
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Editor */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 4px' }}>
            <EditorContent editor={editor} />
          </div>

          <div style={{ padding: '8px 20px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)' }}>
            💾 يتم الحفظ تلقائياً • {new Date(active.updatedAt).toLocaleTimeString('ar')}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 64 }}>📝</div>
          <p style={{ color: 'var(--text-muted)' }}>اختر ملاحظة أو أنشئ واحدة جديدة</p>
          <button className="btn btn-primary" onClick={() => createNote()}>+ ملاحظة جديدة</button>
        </div>
      )}
    </div>
  );
}
