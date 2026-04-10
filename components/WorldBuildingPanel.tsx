
import React, { useState } from 'react';
import { WorldBuildingNote, WorldBuildingCategory, Character, Chapter } from '../types';

const CATEGORIES: { value: WorldBuildingCategory; label: string; icon: string; color: string }[] = [
  { value: 'location', label: 'Locations', icon: '🏔️', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'magic', label: 'Magic & Systems', icon: '✨', color: 'bg-violet-100 text-violet-700' },
  { value: 'lore', label: 'Lore & History', icon: '📜', color: 'bg-amber-100 text-amber-700' },
  { value: 'faction', label: 'Factions', icon: '⚔️', color: 'bg-red-100 text-red-700' },
  { value: 'item', label: 'Items & Artifacts', icon: '💎', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'general', label: 'General Notes', icon: '📝', color: 'bg-slate-100 text-slate-700' },
];

const EMPTY_NOTE_FORM = { category: 'location' as WorldBuildingCategory, title: '', content: '' };
const EMPTY_CHAR_FORM = { role: '', backstory: '', personality: '', speakingStyle: '' };
const getCategoryConfig = (cat: WorldBuildingCategory) =>
  CATEGORIES.find(c => c.value === cat) ?? CATEGORIES[CATEGORIES.length - 1];

// ─── Notes Tab ───────────────────────────────────────────────────────────────

interface NotesTabState {
  notes: WorldBuildingNote[]; allNotes: WorldBuildingNote[];
  activeCategory: WorldBuildingCategory | 'all'; isAddingNote: boolean;
  editingNoteId: string | null; noteForm: typeof EMPTY_NOTE_FORM;
  onSetActiveCategory: (c: WorldBuildingCategory | 'all') => void;
  onStartAdd: () => void; onStartEdit: (n: WorldBuildingNote) => void;
  onDeleteNote: (id: string) => void; onSubmitNote: (e: React.FormEvent) => void;
  onCancelNote: () => void; onNoteFormChange: (f: typeof EMPTY_NOTE_FORM) => void;
}

const NotesTab: React.FC<NotesTabState> = ({
  notes, allNotes, activeCategory, isAddingNote, editingNoteId, noteForm,
  onSetActiveCategory, onStartAdd, onStartEdit, onDeleteNote, onSubmitNote, onCancelNote, onNoteFormChange,
}) => (
  <div className="flex h-full overflow-hidden">
    <div className="w-44 flex-shrink-0 border-r border-slate-100 p-3 overflow-y-auto">
      <button onClick={() => onSetActiveCategory('all')}
        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium mb-1 flex justify-between items-center transition-colors ${activeCategory === 'all' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
        <span>All</span><span className="text-xs bg-slate-200 text-slate-600 px-1.5 rounded-full">{allNotes.length}</span>
      </button>
      {CATEGORIES.map(cat => {
        const count = allNotes.filter(n => n.category === cat.value).length;
        return (
          <button key={cat.value} onClick={() => onSetActiveCategory(cat.value)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium mb-1 flex items-center gap-2 transition-colors ${activeCategory === cat.value ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <span>{cat.icon}</span><span className="flex-1 truncate text-xs">{cat.label}</span>
            {count > 0 && <span className="text-xs bg-slate-200 text-slate-600 px-1.5 rounded-full">{count}</span>}
          </button>
        );
      })}
    </div>
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
          {activeCategory === 'all' ? 'All Notes' : CATEGORIES.find(c => c.value === activeCategory)?.label}
        </h3>
        {!isAddingNote && (
          <button onClick={onStartAdd} className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>Add Note
          </button>
        )}
      </div>
      {isAddingNote && (
        <form onSubmit={onSubmitNote} className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-4 space-y-3">
          <h4 className="font-semibold text-slate-800 text-sm">{editingNoteId ? 'Edit Note' : 'New Note'}</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Category</label>
              <select value={noteForm.category} onChange={e => onNoteFormChange({ ...noteForm, category: e.target.value as WorldBuildingCategory })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Title</label>
              <input required value={noteForm.title} onChange={e => onNoteFormChange({ ...noteForm, title: e.target.value })}
                placeholder="e.g. The Forbidden Forest" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Content</label>
            <textarea required rows={4} value={noteForm.content} onChange={e => onNoteFormChange({ ...noteForm, content: e.target.value })}
              placeholder="Describe this element of your world..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg">{editingNoteId ? 'Save Changes' : 'Add Note'}</button>
            <button type="button" onClick={onCancelNote} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50">Cancel</button>
          </div>
        </form>
      )}
      {notes.length === 0 && !isAddingNote ? (
        <div className="text-center py-16"><div className="text-5xl mb-3">🌍</div>
          <p className="font-medium text-slate-500">No notes yet</p>
          <p className="text-sm text-slate-400 mt-1">Add your first world-building note above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => {
            const cat = getCategoryConfig(note.category);
            return (
              <div key={note.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cat.color} mb-2 inline-block`}>{cat.icon} {cat.label}</span>
                    <h4 className="font-semibold text-slate-900 mb-1">{note.title}</h4>
                    <p className="text-sm text-slate-600 line-clamp-3">{note.content}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => onStartEdit(note)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors" title="Edit">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                    </button>
                    <button onClick={() => onDeleteNote(note.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
);


// ─── Characters Tab ──────────────────────────────────────────────────────────

interface CharactersTabState {
  characters: Character[]; editingCharId: string | null; charForm: typeof EMPTY_CHAR_FORM;
  onStartEdit: (c: Character) => void; onSaveChar: (id: string) => void;
  onCancelEdit: () => void; onCharFormChange: (f: typeof EMPTY_CHAR_FORM) => void;
}

const CharactersTab: React.FC<CharactersTabState> = ({
  characters, editingCharId, charForm, onStartEdit, onSaveChar, onCancelEdit, onCharFormChange,
}) => (
  <div className="overflow-y-auto h-full p-4">
    {characters.length === 0 ? (
      <div className="text-center py-16">
        <div className="text-5xl mb-3">👤</div>
        <p className="font-medium text-slate-500">No characters yet</p>
        <p className="text-sm text-slate-400 mt-1">Add characters in the story setup</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {characters.map(char => (
          <div key={char.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                  {(char.name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{char.name || 'Unnamed'}</h4>
                  {char.role && <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{char.role}</span>}
                </div>
              </div>
              {editingCharId !== char.id && (
                <button onClick={() => onStartEdit(char)} className="px-2.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                  Edit Profile
                </button>
              )}
            </div>
            {char.attributes && <p className="text-xs text-slate-500 italic mb-3">{char.attributes}</p>}

            {editingCharId === char.id ? (
              <div className="space-y-3 border-t border-slate-100 pt-3">
                {[
                  { key: 'role', label: 'Role / Title', placeholder: 'e.g. Protagonist, Mentor, Villain', rows: 1 },
                  { key: 'backstory', label: 'Backstory', placeholder: "Character's history and background...", rows: 3 },
                  { key: 'personality', label: 'Personality', placeholder: 'Key traits and quirks...', rows: 2 },
                  { key: 'speakingStyle', label: 'Speaking Style', placeholder: 'How they talk, vocabulary, catchphrases...', rows: 2 },
                ].map(({ key, label, placeholder, rows }) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">{label}</label>
                    {rows === 1
                      ? <input value={charForm[key as keyof typeof charForm]}
                          onChange={e => onCharFormChange({ ...charForm, [key]: e.target.value })}
                          placeholder={placeholder} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                      : <textarea rows={rows} value={charForm[key as keyof typeof charForm]}
                          onChange={e => onCharFormChange({ ...charForm, [key]: e.target.value })}
                          placeholder={placeholder} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
                    }
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => onSaveChar(char.id)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">Save Profile</button>
                  <button onClick={onCancelEdit} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 border-t border-slate-100 pt-3">
                {[['Backstory', char.backstory], ['Personality', char.personality], ['Speaking Style', char.speakingStyle]].map(([lbl, val]) =>
                  val ? (
                    <div key={lbl}>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">{lbl}</p>
                      <p className="text-sm text-slate-700 line-clamp-2">{val}</p>
                    </div>
                  ) : null
                )}
                {!char.backstory && !char.personality && !char.speakingStyle && (
                  <p className="text-xs text-slate-400 italic">No profile details yet — click Edit Profile to add them.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

// ─── Timeline Tab ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-green-100 border-green-300 text-green-700',
  generating: 'bg-indigo-100 border-indigo-300 text-indigo-700 animate-pulse',
  error: 'bg-red-100 border-red-300 text-red-700',
  pending: 'bg-slate-100 border-slate-300 text-slate-500',
};
const STATUS_LABELS: Record<string, string> = {
  completed: 'Done', generating: 'Writing…', error: 'Error', pending: 'Pending',
};

const TimelineTab: React.FC<{ chapters: Chapter[]; characters: Character[] }> = ({ chapters, characters }) => {
  const wordCount = (content?: string) =>
    content ? content.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="overflow-x-auto overflow-y-hidden h-full p-4">
      {chapters.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🗺️</div>
          <p className="font-medium text-slate-500">No chapters yet</p>
          <p className="text-sm text-slate-400 mt-1">Generate an outline to see the timeline</p>
        </div>
      ) : (
        <div className="flex gap-4 min-w-max pb-2">
          {chapters.map((ch, idx) => {
            const statusStyle = STATUS_STYLES[ch.status] ?? STATUS_STYLES.pending;
            const chapterCharacters = characters.filter(c => ch.characterIds?.includes(c.id));
            const wc = wordCount(ch.content);

            return (
              <div key={ch.id} className="flex flex-col items-center gap-2 w-52 flex-shrink-0">
                {/* Connector line */}
                <div className="flex items-center w-full">
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold flex-shrink-0 ${statusStyle}`}>
                    {ch.status === 'completed'
                      ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      : ch.status === 'error'
                      ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      : idx + 1}
                  </div>
                  {idx < chapters.length - 1 && <div className="flex-1 h-0.5 bg-slate-200 mx-1" />}
                </div>

                {/* Chapter card */}
                <div className="w-full bg-white border border-slate-200 rounded-xl p-3 hover:shadow-sm transition-shadow">
                  <div className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mb-2 border ${statusStyle}`}>
                    {STATUS_LABELS[ch.status] ?? 'Pending'}
                  </div>
                  <h4 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 mb-1">{ch.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-3">{ch.summary}</p>

                  {wc > 0 && (
                    <p className="text-xs text-slate-400 mt-2">~{wc.toLocaleString()} words</p>
                  )}

                  {chapterCharacters.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {chapterCharacters.map(c => (
                        <span key={c.id} className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full">
                          {c.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Main WorldBuildingPanel ──────────────────────────────────────────────────

export interface WorldBuildingPanelProps {
  worldBuilding: WorldBuildingNote[];
  characters: Character[];
  chapters: Chapter[];
  onAddNote: (note: Omit<WorldBuildingNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateNote: (id: string, note: Omit<WorldBuildingNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteNote: (id: string) => void;
  onUpdateCharacter: (id: string, updates: Partial<Character>) => void;
  onClose: () => void;
}

export const WorldBuildingPanel: React.FC<WorldBuildingPanelProps> = ({
  worldBuilding, characters, chapters, onAddNote, onUpdateNote, onDeleteNote, onUpdateCharacter, onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'characters' | 'timeline'>('notes');
  const [activeCategory, setActiveCategory] = useState<WorldBuildingCategory | 'all'>('all');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteForm, setNoteForm] = useState(EMPTY_NOTE_FORM);
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const [charForm, setCharForm] = useState(EMPTY_CHAR_FORM);

  const handleStartAdd = () => { setNoteForm(EMPTY_NOTE_FORM); setEditingNoteId(null); setIsAddingNote(true); };
  const handleStartEdit = (note: WorldBuildingNote) => { setNoteForm({ category: note.category, title: note.title, content: note.content }); setEditingNoteId(note.id); setIsAddingNote(true); };
  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteForm.title.trim()) return;
    editingNoteId ? onUpdateNote(editingNoteId, noteForm) : onAddNote(noteForm);
    setIsAddingNote(false); setEditingNoteId(null); setNoteForm(EMPTY_NOTE_FORM);
  };
  const handleCancelNote = () => { setIsAddingNote(false); setEditingNoteId(null); setNoteForm(EMPTY_NOTE_FORM); };
  const handleStartEditChar = (char: Character) => {
    setCharForm({ role: char.role || '', backstory: char.backstory || '', personality: char.personality || '', speakingStyle: char.speakingStyle || '' });
    setEditingCharId(char.id);
  };
  const handleSaveChar = (charId: string) => { onUpdateCharacter(charId, charForm); setEditingCharId(null); setCharForm(EMPTY_CHAR_FORM); };

  const filteredNotes = activeCategory === 'all' ? worldBuilding : worldBuilding.filter(n => n.category === activeCategory);
  const tabs = [
    { id: 'notes' as const, label: 'Notes', count: worldBuilding.length },
    { id: 'characters' as const, label: 'Characters', count: characters.length },
    { id: 'timeline' as const, label: 'Timeline', count: chapters.length },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-xl">🌍</div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">World Building</h2>
                <p className="text-sm text-slate-500">Build your story's world, characters, and timeline</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {activeTab === 'notes' && (
            <NotesTab notes={filteredNotes} allNotes={worldBuilding} activeCategory={activeCategory}
              isAddingNote={isAddingNote} editingNoteId={editingNoteId} noteForm={noteForm}
              onSetActiveCategory={setActiveCategory} onStartAdd={handleStartAdd} onStartEdit={handleStartEdit}
              onDeleteNote={onDeleteNote} onSubmitNote={handleSubmitNote} onCancelNote={handleCancelNote}
              onNoteFormChange={setNoteForm} />
          )}
          {activeTab === 'characters' && (
            <CharactersTab characters={characters} editingCharId={editingCharId} charForm={charForm}
              onStartEdit={handleStartEditChar} onSaveChar={handleSaveChar}
              onCancelEdit={() => { setEditingCharId(null); setCharForm(EMPTY_CHAR_FORM); }}
              onCharFormChange={setCharForm} />
          )}
          {activeTab === 'timeline' && <TimelineTab chapters={chapters} characters={characters} />}
        </div>
      </div>
    </div>
  );
};

