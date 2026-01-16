
import React from 'react';
import { Chapter } from '../types';

interface OutlineEditorProps {
  chapters: Chapter[];
  onUpdate: (updated: Chapter[]) => void;
  onConfirm: () => void;
}

export const OutlineEditor: React.FC<OutlineEditorProps> = ({ chapters, onUpdate, onConfirm }) => {
  const handleChange = (index: number, field: keyof Chapter, value: string) => {
    const next = [...chapters];
    next[index] = { ...next[index], [field]: value };
    onUpdate(next);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Story Map</h2>
          <p className="text-slate-500">Fine-tune the narrative beats before generating full prose.</p>
        </div>
        <button
          onClick={onConfirm}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"
        >
          Write Chapters
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        {chapters.map((chapter, index) => (
          <div key={chapter.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex gap-6 group hover:border-indigo-200 transition-colors">
            <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
              {index + 1}
            </div>
            <div className="flex-1 space-y-4">
              <input
                className="w-full text-xl font-bold text-slate-800 bg-transparent border-b border-transparent focus:border-indigo-500 outline-none pb-1"
                value={chapter.title}
                onChange={(e) => handleChange(index, 'title', e.target.value)}
                placeholder="Chapter Title"
              />
              <textarea
                className="w-full text-slate-600 bg-transparent outline-none resize-y leading-relaxed min-h-[120px]"
                rows={5}
                value={chapter.summary}
                onChange={(e) => handleChange(index, 'summary', e.target.value)}
                placeholder="What happens in this chapter?"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
