
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  onTemplatesClick?: () => void;
  onNewStoryClick?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onTemplatesClick, onNewStoryClick }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">L</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Lumina Stories</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <span className="text-sm font-medium text-slate-500 hover:text-indigo-600 cursor-pointer">Library</span>
            <span
              onClick={onTemplatesClick}
              className="text-sm font-medium text-slate-500 hover:text-indigo-600 cursor-pointer transition-colors"
            >
              Templates
            </span>
            <button
              onClick={onNewStoryClick}
              className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold hover:bg-indigo-100 transition-colors"
            >
              New Story
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8">
        {children}
      </main>
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-slate-400 text-sm">
        &copy; {new Date().getFullYear()} Lumina Stories AI. Crafted for writers.
      </footer>
    </div>
  );
};
