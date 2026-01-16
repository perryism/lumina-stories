
import React, { useState } from 'react';
import { Chapter, Character } from '../types';

interface ManualChapterGeneratorProps {
  title: string;
  chapters: Chapter[];
  characters: Character[];
  currentPrompt: string;
  onUpdateChapter: (index: number, field: keyof Chapter, value: any) => void;
  onUpdatePrompt: (prompt: string) => void;
  onGenerateNext: (customPrompt: string) => void;
  onViewStory: () => void;
  isGenerating: boolean;
}

export const ManualChapterGenerator: React.FC<ManualChapterGeneratorProps> = ({
  title,
  chapters,
  characters,
  currentPrompt,
  onUpdateChapter,
  onUpdatePrompt,
  onGenerateNext,
  onViewStory,
  isGenerating,
}) => {
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [showCharacterSelector, setShowCharacterSelector] = useState(false);

  const nextChapterIndex = chapters.findIndex(ch => ch.status === 'pending');
  const allCompleted = chapters.every(ch => ch.status === 'completed');
  const currentGeneratingIndex = chapters.findIndex(ch => ch.status === 'generating');

  const toggleExpand = (index: number) => {
    setExpandedChapter(expandedChapter === index ? null : index);
  };

  const toggleCharacterForChapter = (chapterIndex: number, characterId: string) => {
    const chapter = chapters[chapterIndex];
    const currentIds = chapter.characterIds || [];
    const newIds = currentIds.includes(characterId)
      ? currentIds.filter(id => id !== characterId)
      : [...currentIds, characterId];
    onUpdateChapter(chapterIndex, 'characterIds', newIds);
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">{title}</h2>
        <p className="text-slate-500">Generate chapters one at a time. Edit the outline before generating each chapter.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chapter List */}
        <div className="lg:col-span-2 space-y-4">
          {chapters.map((chapter, index) => {
            const isNext = index === nextChapterIndex;
            const isGenerating = index === currentGeneratingIndex;
            const isCompleted = chapter.status === 'completed';
            const isExpanded = expandedChapter === index;

            return (
              <div
                key={chapter.id}
                className={`bg-white rounded-2xl shadow-sm border transition-all ${
                  isNext ? 'border-indigo-300 ring-2 ring-indigo-100' :
                  isGenerating ? 'border-indigo-500 ring-2 ring-indigo-200' :
                  isCompleted ? 'border-green-200' : 'border-slate-100'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      isCompleted ? 'bg-green-100 text-green-600' :
                      isGenerating ? 'bg-indigo-600 text-white animate-pulse' :
                      isNext ? 'bg-indigo-100 text-indigo-600' :
                      'bg-slate-100 text-slate-400'
                    }`}>
                      {isCompleted ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : index + 1}
                    </div>

                    {/* Chapter Content */}
                    <div className="flex-1 min-w-0">
                      <input
                        className={`w-full text-xl font-bold bg-transparent border-b pb-1 outline-none transition-colors ${
                          isNext || isGenerating ? 'text-slate-900 border-indigo-300' : 'text-slate-700 border-transparent'
                        } ${isCompleted ? 'cursor-default' : ''}`}
                        value={chapter.title}
                        onChange={(e) => !isCompleted && onUpdateChapter(index, 'title', e.target.value)}
                        disabled={isCompleted || isGenerating}
                        placeholder="Chapter Title"
                      />

                      <div className="mt-3">
                        <textarea
                          className={`w-full text-slate-600 bg-transparent outline-none leading-relaxed resize-y min-h-[80px] ${
                            isCompleted ? 'cursor-default' : ''
                          }`}
                          rows={3}
                          value={chapter.summary}
                          onChange={(e) => !isCompleted && onUpdateChapter(index, 'summary', e.target.value)}
                          disabled={isCompleted || isGenerating}
                          placeholder="Chapter summary..."
                        />
                      </div>

                      {/* Character Selection for pending/next chapters */}
                      {!isCompleted && characters.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <div className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">
                            Characters in this chapter
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {characters.map((character) => {
                              const isSelected = chapter.characterIds?.includes(character.id) ?? false;
                              return (
                                <button
                                  key={character.id}
                                  onClick={() => !isGenerating && toggleCharacterForChapter(index, character.id)}
                                  disabled={isGenerating}
                                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                    isSelected
                                      ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-300'
                                      : 'bg-slate-100 text-slate-600 border-2 border-transparent hover:border-slate-300'
                                  } ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                  {isSelected && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                  {character.name}
                                </button>
                              );
                            })}
                          </div>
                          {(!chapter.characterIds || chapter.characterIds.length === 0) && (
                            <p className="text-xs text-slate-500 mt-2 italic">
                              No characters selected. All characters will be available for generation.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Show selected characters for completed chapters */}
                      {isCompleted && chapter.characterIds && chapter.characterIds.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <div className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">
                            Characters featured
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {chapter.characterIds.map((charId) => {
                              const character = characters.find(c => c.id === charId);
                              return character ? (
                                <span
                                  key={charId}
                                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-700"
                                >
                                  {character.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}

                      {/* Show content preview for completed chapters */}
                      {isCompleted && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <button
                            onClick={() => toggleExpand(index)}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                          >
                            {isExpanded ? 'Hide' : 'Show'} Content
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                          {isExpanded && (
                            <div className="mt-3 text-sm text-slate-600 leading-relaxed max-h-64 overflow-y-auto">
                              {chapter.content.split('\n').map((para, i) => (
                                para.trim() ? <p key={i} className="mb-3">{para}</p> : <br key={i} />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {isGenerating && (
                        <div className="mt-4 flex items-center gap-2 text-indigo-600">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                          <span className="text-sm font-medium">Generating chapter...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 mb-2">Progress</h3>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-500"
                    style={{ width: `${(chapters.filter(ch => ch.status === 'completed').length / chapters.length) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-slate-600">
                  {chapters.filter(ch => ch.status === 'completed').length}/{chapters.length}
                </span>
              </div>
            </div>

            {!allCompleted && nextChapterIndex !== -1 && (
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <p className="text-sm text-slate-600">
                  Ready to generate <span className="font-bold text-slate-900">Chapter {nextChapterIndex + 1}</span>
                </p>

                {/* Character Summary */}
                {characters.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">
                      Selected Characters
                    </div>
                    {chapters[nextChapterIndex].characterIds && chapters[nextChapterIndex].characterIds!.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {chapters[nextChapterIndex].characterIds!.map((charId) => {
                          const character = characters.find(c => c.id === charId);
                          return character ? (
                            <span
                              key={charId}
                              className="px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-700"
                            >
                              {character.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">All characters available</p>
                    )}
                  </div>
                )}

                {/* Prompt Editor Toggle */}
                <button
                  onClick={() => setShowPromptEditor(!showPromptEditor)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between text-sm"
                >
                  <span className="font-medium text-slate-700">
                    {showPromptEditor ? 'Hide' : 'Edit'} Generation Prompt
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-slate-500 transition-transform ${showPromptEditor ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Prompt Editor */}
                {showPromptEditor && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                      Generation Prompt
                    </label>
                    <textarea
                      value={currentPrompt}
                      onChange={(e) => onUpdatePrompt(e.target.value)}
                      className="w-full text-sm text-slate-700 bg-white border border-slate-200 rounded-lg p-3 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-y min-h-[200px] font-mono"
                      placeholder="Enter custom generation prompt..."
                    />
                    <p className="text-xs text-slate-500">
                      Customize how the AI generates this chapter. Leave blank to use default prompt.
                    </p>
                  </div>
                )}

                {/* Generate Button */}
                <button
                  onClick={() => onGenerateNext(currentPrompt)}
                  disabled={isGenerating}
                  className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
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
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                      </svg>
                      Generate Chapter
                    </>
                  )}
                </button>
              </div>
            )}

            {allCompleted && (
              <div className="pt-4 border-t border-slate-100">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 text-green-700 mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-bold">Story Complete!</span>
                  </div>
                  <p className="text-sm text-green-600">All chapters have been generated.</p>
                </div>
                <button
                  onClick={onViewStory}
                  className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  View Complete Story
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

