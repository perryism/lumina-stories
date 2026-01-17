
import React, { useState } from 'react';
import { Chapter } from '../types';

interface ChapterSuggestion {
  title: string;
  summary: string;
}

interface OutlineEditorProps {
  chapters: Chapter[];
  onUpdate: (updated: Chapter[]) => void;
  onConfirm: () => void;
  onManualMode: () => void;
  onSave?: () => void;
  onRequestSuggestions?: (chapterIndex: number, userPrompt: string) => Promise<ChapterSuggestion[]>;
}

export const OutlineEditor: React.FC<OutlineEditorProps> = ({
  chapters,
  onUpdate,
  onConfirm,
  onManualMode,
  onSave,
  onRequestSuggestions
}) => {
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
  const [suggestionPrompts, setSuggestionPrompts] = useState<{ [key: number]: string }>({});
  const [suggestions, setSuggestions] = useState<{ [key: number]: ChapterSuggestion[] }>({});
  const [loadingSuggestions, setLoadingSuggestions] = useState<{ [key: number]: boolean }>({});

  const handleChange = (index: number, field: keyof Chapter, value: string) => {
    const next = [...chapters];
    next[index] = { ...next[index], [field]: value };
    onUpdate(next);
  };

  const handleRequestSuggestions = async (index: number) => {
    if (!onRequestSuggestions) return;

    const prompt = suggestionPrompts[index] || '';
    setLoadingSuggestions({ ...loadingSuggestions, [index]: true });

    try {
      const newSuggestions = await onRequestSuggestions(index, prompt);
      setSuggestions({ ...suggestions, [index]: newSuggestions });
    } catch (error) {
      console.error('Failed to get suggestions:', error);
    } finally {
      setLoadingSuggestions({ ...loadingSuggestions, [index]: false });
    }
  };

  const handleApplySuggestion = (chapterIndex: number, suggestion: ChapterSuggestion) => {
    const next = [...chapters];
    next[chapterIndex] = {
      ...next[chapterIndex],
      title: suggestion.title,
      summary: suggestion.summary
    };
    onUpdate(next);
    // Clear suggestions after applying
    const newSuggestions = { ...suggestions };
    delete newSuggestions[chapterIndex];
    setSuggestions(newSuggestions);
  };

  const toggleExpanded = (index: number) => {
    setExpandedChapter(expandedChapter === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Story Map</h2>
          <p className="text-slate-500">Fine-tune the narrative beats before generating full prose.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {onSave && (
            <button
              onClick={onSave}
              className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
              </svg>
              Save Progress
            </button>
          )}
          <button
            onClick={onManualMode}
            className="bg-slate-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            One by One
          </button>
          <button
            onClick={onConfirm}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Write All
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {chapters.map((chapter, index) => (
          <div key={chapter.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group hover:border-indigo-200 transition-colors">
            <div className="flex gap-6">
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

                {/* Suggestions Toggle Button */}
                {onRequestSuggestions && (
                  <button
                    onClick={() => toggleExpanded(index)}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                    </svg>
                    {expandedChapter === index ? 'Hide Suggestions' : 'Get AI Suggestions'}
                  </button>
                )}
              </div>
            </div>

            {/* Suggestions Panel */}
            {expandedChapter === index && onRequestSuggestions && (
              <div className="mt-6 pl-18 space-y-4">
                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <label className="text-sm font-semibold text-slate-700">
                    What would you like to improve? (optional)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-y min-h-[80px] text-sm"
                    placeholder="E.g., 'Make it more suspenseful', 'Add a plot twist', 'Focus more on character development', or leave blank for general improvements"
                    value={suggestionPrompts[index] || ''}
                    onChange={(e) => setSuggestionPrompts({ ...suggestionPrompts, [index]: e.target.value })}
                    disabled={loadingSuggestions[index]}
                  />
                  <button
                    onClick={() => handleRequestSuggestions(index)}
                    disabled={loadingSuggestions[index]}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loadingSuggestions[index] ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                        <span>Generate Suggestions</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Display Suggestions */}
                {suggestions[index] && suggestions[index].length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-700">AI Suggestions:</h4>
                    {suggestions[index].map((suggestion, suggestionIndex) => (
                      <div
                        key={suggestionIndex}
                        className="bg-white border-2 border-indigo-100 rounded-xl p-4 space-y-3 hover:border-indigo-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-2">
                            <div className="text-sm font-semibold text-indigo-600">
                              Option {suggestionIndex + 1}
                            </div>
                            <div className="font-bold text-slate-800">{suggestion.title}</div>
                            <div className="text-sm text-slate-600 leading-relaxed">{suggestion.summary}</div>
                          </div>
                          <button
                            onClick={() => handleApplySuggestion(index, suggestion)}
                            className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-all flex items-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Apply
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
