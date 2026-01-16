
import React, { useState } from 'react';
import { Chapter } from '../types';

interface StoryViewerProps {
  title: string;
  chapters: Chapter[];
}

export const StoryViewer: React.FC<StoryViewerProps> = ({ title, chapters }) => {
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);

  const activeChapter = chapters[activeChapterIndex];

  return (
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 pb-12">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 space-y-2">
        <h3 className="px-4 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Contents</h3>
        {chapters.map((chapter, index) => (
          <button
            key={chapter.id}
            onClick={() => setActiveChapterIndex(index)}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${
              activeChapterIndex === index 
                ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-100' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className={`text-xs w-6 h-6 rounded-full flex items-center justify-center ${activeChapterIndex === index ? 'bg-indigo-500' : 'bg-slate-200 text-slate-500'}`}>
              {index + 1}
            </span>
            <span className="truncate">{chapter.title}</span>
          </button>
        ))}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12 prose-font">
          <header className="mb-12 border-b border-slate-100 pb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">{title}</h1>
            <div className="flex items-center gap-4 text-slate-400 text-sm italic">
              <span>Chapter {activeChapterIndex + 1}</span>
              <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
              <span>{activeChapter.title}</span>
            </div>
          </header>

          <article className="prose prose-slate prose-lg max-w-none">
            {activeChapter.content.split('\n').map((para, i) => (
              para.trim() ? (
                <p key={i} className="mb-6 leading-relaxed text-slate-800 text-lg md:text-xl">
                  {para}
                </p>
              ) : <br key={i} />
            ))}
          </article>
          
          <div className="mt-16 pt-8 border-t border-slate-100 flex justify-between items-center">
            <button
              disabled={activeChapterIndex === 0}
              onClick={() => setActiveChapterIndex(prev => prev - 1)}
              className="text-indigo-600 font-bold disabled:opacity-30 flex items-center gap-2"
            >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Previous
            </button>
            <button
              disabled={activeChapterIndex === chapters.length - 1}
              onClick={() => setActiveChapterIndex(prev => prev + 1)}
              className="text-indigo-600 font-bold disabled:opacity-30 flex items-center gap-2"
            >
              Next
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
