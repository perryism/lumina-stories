import React, { useState, useEffect } from 'react';
import { Chapter, Character } from '../types';

interface SelectiveChapterGeneratorProps {
  title: string;
  chapter: Chapter;
  chapterIndex: number;
  chapters: Chapter[];
  characters: Character[];
  suggestions: { title: string; summary: string }[];
  isLoadingSuggestions: boolean;
  isGenerating: boolean;
  onSelectSuggestion: (suggestionIndex: number) => void;
  onGenerateWithSuggestion: (suggestionIndex: number) => void;
  onGenerateOriginal: () => void;
  onBack: () => void;
}

export const SelectiveChapterGenerator: React.FC<SelectiveChapterGeneratorProps> = ({
  title,
  chapter,
  chapterIndex,
  chapters,
  characters,
  suggestions,
  isLoadingSuggestions,
  isGenerating,
  onSelectSuggestion,
  onGenerateWithSuggestion,
  onGenerateOriginal,
  onBack,
}) => {
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);

  const handleSelectSuggestion = (index: number) => {
    setSelectedSuggestion(index);
    onSelectSuggestion(index);
  };

  const handleGenerate = () => {
    if (selectedSuggestion !== null) {
      onGenerateWithSuggestion(selectedSuggestion);
    } else {
      onGenerateOriginal();
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-2 mb-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Outline
          </button>
          <h2 className="text-3xl font-bold text-slate-900">{title}</h2>
          <p className="text-slate-500">Chapter {chapterIndex + 1}: {chapter.title}</p>
        </div>
      </div>

      {/* Original Chapter */}
      <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-2xl shadow-sm border-2 border-slate-300">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center font-bold text-white">
            {chapterIndex + 1}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-slate-900">Original Outline</h3>
              <span className="px-3 py-1 bg-slate-600 text-white text-xs font-bold rounded-full">
                BASELINE
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed font-medium">{chapter.summary}</p>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-4">
          Choose Your Approach for Chapter {chapterIndex + 1}
        </h3>
        <p className="text-slate-600 mb-6">
          Here are 3 different ways to write <strong>this same chapter</strong>. Each variation tells the same story with a different style, tone, or focus. Select one, or use the original outline.
        </p>

        {isLoadingSuggestions ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <svg className="animate-spin h-10 w-10 text-indigo-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-slate-600 font-medium">Generating suggestions...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Visual indicator that these are variations */}
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
              <span className="font-medium">3 Variations of Chapter {chapterIndex + 1}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {suggestions.map((suggestion, index) => {
                const isSelected = selectedSuggestion === index;
                const labels = ['Variation A', 'Variation B', 'Variation C'];
                return (
                  <button
                    key={index}
                    onClick={() => handleSelectSuggestion(index)}
                    disabled={isGenerating}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                        : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md'
                    } ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {/* Variation Label */}
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {labels[index]}
                    </div>

                    {/* Title */}
                    <h4 className={`font-bold text-lg mb-3 ${isSelected ? 'text-indigo-900' : 'text-slate-900'}`}>
                      {suggestion.title}
                    </h4>

                    {/* Summary */}
                    <p className={`text-sm leading-relaxed ${isSelected ? 'text-indigo-800' : 'text-slate-600'}`}>
                      {suggestion.summary}
                    </p>

                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="mt-4 flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Selected
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onGenerateOriginal}
          disabled={isGenerating || isLoadingSuggestions}
          className="flex-1 bg-slate-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Generate with Original Outline
        </button>
        <button
          onClick={handleGenerate}
          disabled={selectedSuggestion === null || isGenerating || isLoadingSuggestions}
          className="flex-1 bg-indigo-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            'Generate with Selected Variation'
          )}
        </button>
      </div>
    </div>
  );
};

