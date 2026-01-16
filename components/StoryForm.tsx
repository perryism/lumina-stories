
import React, { useState } from 'react';
import { Character } from '../types';

interface StoryFormProps {
  onStart: (data: { title: string; genre: string; numChapters: number; characters: Character[]; initialIdea: string }) => void;
  isLoading: boolean;
}

export const StoryForm: React.FC<StoryFormProps> = ({ onStart, isLoading }) => {
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Fantasy');
  const [numChapters, setNumChapters] = useState(5);
  const [initialIdea, setInitialIdea] = useState('');
  const [characters, setCharacters] = useState<Character[]>([
    { id: '1', name: '', attributes: '' }
  ]);

  const addCharacter = () => {
    setCharacters([...characters, { id: Date.now().toString(), name: '', attributes: '' }]);
  };

  const removeCharacter = (id: string) => {
    setCharacters(characters.filter(c => c.id !== id));
  };

  const updateCharacter = (id: string, field: keyof Character, value: string) => {
    setCharacters(characters.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !initialIdea) return;
    onStart({ title, genre, numChapters, characters: characters.filter(c => c.name.trim()), initialIdea });
  };

  const genres = ['Fantasy', 'Sci-Fi', 'Mystery', 'Romance', 'Horror', 'Thriller', 'Historical', 'Adventure'];

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">Create Your Epic</h2>
      <p className="text-slate-500 mb-8">Define your world, your heroes, and the spark of your story.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Story Title</label>
            <input
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="The Last Embers..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Genre</label>
            <select
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            >
              {genres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Number of Chapters (1-10)</label>
          <input
            type="range"
            min="1"
            max="10"
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            value={numChapters}
            onChange={(e) => setNumChapters(parseInt(e.target.value))}
          />
          <div className="text-center font-bold text-indigo-600">{numChapters} Chapters</div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">The Core Idea / Plot Outline</label>
          <textarea
            required
            rows={3}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            placeholder="A lost prince discovers he can manipulate time, but every use ages him a year..."
            value={initialIdea}
            onChange={(e) => setInitialIdea(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-slate-700">Characters</label>
            <button
              type="button"
              onClick={addCharacter}
              className="text-xs text-indigo-600 font-bold hover:underline"
            >
              + Add Character
            </button>
          </div>
          
          {characters.map((char, index) => (
            <div key={char.id} className="p-4 bg-slate-50 rounded-xl space-y-3 relative group">
              {characters.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCharacter(char.id)}
                  className="absolute top-2 right-2 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
              <input
                className="w-full px-3 py-1 bg-transparent border-b border-slate-300 focus:border-indigo-500 outline-none font-medium"
                placeholder="Character Name (e.g. Elara)"
                value={char.name}
                onChange={(e) => updateCharacter(char.id, 'name', e.target.value)}
              />
              <textarea
                className="w-full px-3 py-1 bg-transparent outline-none text-sm text-slate-600 resize-none"
                placeholder="Attributes (e.g. Brave, scarred, skilled Archer...)"
                rows={2}
                value={char.attributes}
                onChange={(e) => updateCharacter(char.id, 'attributes', e.target.value)}
              />
            </div>
          ))}
        </div>

        <button
          disabled={isLoading}
          type="submit"
          className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Generating Outline...</span>
            </>
          ) : (
            <span>Plan My Story</span>
          )}
        </button>
      </form>
    </div>
  );
};
