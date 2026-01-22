
import React, { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  onTemplatesClick?: () => void;
  onNewStoryClick?: () => void;
  onLibraryClick?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onTemplatesClick, onNewStoryClick, onLibraryClick }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLibraryClick = () => {
    onLibraryClick?.();
    setIsMobileMenuOpen(false);
  };

  const handleTemplatesClick = () => {
    onTemplatesClick?.();
    setIsMobileMenuOpen(false);
  };

  const handleNewStoryClick = () => {
    onNewStoryClick?.();
    setIsMobileMenuOpen(false);
  };

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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <span
              onClick={onLibraryClick}
              className="text-sm font-medium text-slate-500 hover:text-indigo-600 cursor-pointer transition-colors"
            >
              Library
            </span>
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-indigo-600 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <nav className="max-w-6xl mx-auto px-4 py-4 flex flex-col space-y-3">
              <span
                onClick={handleLibraryClick}
                className="text-sm font-medium text-slate-500 hover:text-indigo-600 cursor-pointer transition-colors py-2"
              >
                Library
              </span>
              <span
                onClick={handleTemplatesClick}
                className="text-sm font-medium text-slate-500 hover:text-indigo-600 cursor-pointer transition-colors py-2"
              >
                Templates
              </span>
              <button
                onClick={handleNewStoryClick}
                className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold hover:bg-indigo-100 transition-colors text-left"
              >
                New Story
              </button>
            </nav>
          </div>
        )}
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
