
import React, { useState, useEffect } from 'react';
import { Chapter, Character, ChapterOutcome, ForeshadowingNote } from '../types';
import { getDefaultSystemPrompt } from '../services/aiService';
import { getGenreSystemPrompt } from '../services/genreLoader';

interface ManualChapterGeneratorProps {
  title: string;
  chapters: Chapter[];
  characters: Character[];
  currentPrompt: string;
  systemPrompt?: string;
  genre?: string;
  onUpdateChapter: (index: number, field: keyof Chapter, value: any) => void;
  onUpdatePrompt: (prompt: string) => void;
  onUpdateSystemPrompt?: (prompt: string) => void;
  onGenerateNext: (customPrompt: string) => void;
  onRegenerateChapter?: (chapterIndex: number, feedback: string) => void;
  onViewStory: () => void;
  isGenerating: boolean;
  isContinuousMode?: boolean;
  chapterOutcomes?: ChapterOutcome[];
  onSelectOutcome?: (outcome: ChapterOutcome) => void;
  onGenerateOutcomes?: () => void;
  onSave?: () => void;
  foreshadowingNotes?: ForeshadowingNote[];
  onAddForeshadowingNote?: (note: Omit<ForeshadowingNote, 'id' | 'createdAt'>) => void;
  onUpdateForeshadowingNote?: (noteId: string, note: Omit<ForeshadowingNote, 'id' | 'createdAt'>) => void;
  onDeleteForeshadowingNote?: (noteId: string) => void;
}

export const ManualChapterGenerator: React.FC<ManualChapterGeneratorProps> = ({
  title,
  chapters,
  characters,
  currentPrompt,
  systemPrompt = '',
  genre = 'Fantasy',
  onUpdateChapter,
  onUpdatePrompt,
  onUpdateSystemPrompt,
  onGenerateNext,
  onRegenerateChapter,
  onViewStory,
  isGenerating,
  isContinuousMode = false,
  chapterOutcomes = [],
  onSelectOutcome,
  onGenerateOutcomes,
  onSave,
  foreshadowingNotes = [],
  onAddForeshadowingNote,
  onUpdateForeshadowingNote,
  onDeleteForeshadowingNote,
}) => {
  const [localSystemPrompt, setLocalSystemPrompt] = useState(systemPrompt || getDefaultSystemPrompt(genre));
  const [showForeshadowingForm, setShowForeshadowingForm] = useState(false);
  const [editingForeshadowingId, setEditingForeshadowingId] = useState<string | null>(null);
  const [foreshadowingFormData, setForeshadowingFormData] = useState({
    targetChapterId: 1,
    revealDescription: '',
    foreshadowingHint: '',
  });

  // Update local system prompt when prop changes or when it's empty
  useEffect(() => {
    const updatePrompt = async () => {
      if (systemPrompt) {
        setLocalSystemPrompt(systemPrompt);
      } else if (!localSystemPrompt) {
        try {
          const prompt = await getGenreSystemPrompt(genre);
          setLocalSystemPrompt(prompt);
        } catch (error) {
          console.error('Failed to load genre system prompt:', error);
          setLocalSystemPrompt(getDefaultSystemPrompt(genre));
        }
      }
    };
    updatePrompt();
  }, [systemPrompt, genre]);

  const handleSystemPromptChange = (value: string) => {
    setLocalSystemPrompt(value);
    if (onUpdateSystemPrompt) {
      onUpdateSystemPrompt(value);
    }
  };
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [showCharacterSelector, setShowCharacterSelector] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState<{ [key: number]: string }>({});
  const [showRevisionForm, setShowRevisionForm] = useState<number | null>(null);

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

  // Foreshadowing form handlers
  const handleAddForeshadowing = () => {
    setForeshadowingFormData({
      targetChapterId: nextChapterIndex + 1,
      revealDescription: '',
      foreshadowingHint: '',
    });
    setEditingForeshadowingId(null);
    setShowForeshadowingForm(true);
  };

  const handleEditForeshadowing = (note: ForeshadowingNote) => {
    setForeshadowingFormData({
      targetChapterId: note.targetChapterId,
      revealDescription: note.revealDescription,
      foreshadowingHint: note.foreshadowingHint,
    });
    setEditingForeshadowingId(note.id);
    setShowForeshadowingForm(true);
  };

  const handleSubmitForeshadowing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddForeshadowingNote || !onUpdateForeshadowingNote) return;

    if (editingForeshadowingId) {
      onUpdateForeshadowingNote(editingForeshadowingId, foreshadowingFormData);
    } else {
      onAddForeshadowingNote(foreshadowingFormData);
    }

    setShowForeshadowingForm(false);
    setEditingForeshadowingId(null);
    setForeshadowingFormData({
      targetChapterId: nextChapterIndex + 1,
      revealDescription: '',
      foreshadowingHint: '',
    });
  };

  const handleCancelForeshadowing = () => {
    setShowForeshadowingForm(false);
    setEditingForeshadowingId(null);
    setForeshadowingFormData({
      targetChapterId: nextChapterIndex + 1,
      revealDescription: '',
      foreshadowingHint: '',
    });
  };

  // Get foreshadowing notes relevant to the next chapter
  const getRelevantForeshadowingNotes = () => {
    if (nextChapterIndex === -1 || !foreshadowingNotes || foreshadowingNotes.length === 0) {
      return { hints: [], reveals: [] };
    }

    const nextChapterNumber = nextChapterIndex + 1;

    // Notes that should be hinted at in the next chapter (target chapter is later)
    const hints = foreshadowingNotes.filter(
      note => note.targetChapterId > nextChapterNumber
    );

    // Notes that should be revealed in the next chapter
    const reveals = foreshadowingNotes.filter(
      note => note.targetChapterId === nextChapterNumber
    );

    return { hints, reveals };
  };

  const { hints, reveals } = getRelevantForeshadowingNotes();

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

                      {/* Acceptance Criteria for pending/next chapters */}
                      {!isCompleted && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <div className="flex items-center gap-2 mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                              Acceptance Criteria (Optional)
                            </label>
                          </div>
                          <textarea
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-y min-h-[60px] bg-indigo-50/30"
                            rows={2}
                            value={chapter.acceptanceCriteria || ''}
                            onChange={(e) => !isGenerating && onUpdateChapter(index, 'acceptanceCriteria', e.target.value)}
                            disabled={isGenerating}
                            placeholder="Define criteria this chapter must meet (e.g., 'Include a plot twist', 'Develop character relationship', 'Maintain suspenseful tone')..."
                          />
                          <p className="text-xs text-slate-500 mt-1.5 italic">
                            After generation, the AI will validate if the chapter meets these criteria and maintains cohesion with previous chapters.
                          </p>
                        </div>
                      )}

                      {/* Show acceptance criteria for completed chapters */}
                      {isCompleted && chapter.acceptanceCriteria && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <div className="flex items-center gap-2 mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                              Acceptance Criteria
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                            {chapter.acceptanceCriteria}
                          </p>
                          {/* Show validation result if available */}
                          {chapter.validationResult && (
                            <div className={`mt-2 px-3 py-2 rounded-lg border ${
                              chapter.validationResult.passed
                                ? 'bg-green-50 border-green-200'
                                : 'bg-amber-50 border-amber-200'
                            }`}>
                              <div className="flex items-start gap-2">
                                {chapter.validationResult.passed ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                )}
                                <div className="flex-1">
                                  <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
                                    chapter.validationResult.passed ? 'text-green-700' : 'text-amber-700'
                                  }`}>
                                    {chapter.validationResult.passed ? 'Validation Passed' : 'Validation Issues'}
                                  </div>
                                  <p className={`text-sm ${
                                    chapter.validationResult.passed ? 'text-green-700' : 'text-amber-700'
                                  }`}>
                                    {chapter.validationResult.feedback}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

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
                              {chapter.content ? (
                                chapter.content.split('\n').map((para, i) => (
                                  para.trim() ? <p key={i} className="mb-3">{para}</p> : <br key={i} />
                                ))
                              ) : (
                                <p className="text-slate-400 italic">No content generated yet</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Revision Form for completed chapters */}
                      {isCompleted && onRegenerateChapter && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          {showRevisionForm !== index ? (
                            <button
                              onClick={() => setShowRevisionForm(index)}
                              disabled={isGenerating}
                              className="w-full bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 border border-amber-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                              </svg>
                              Revise This Chapter
                            </button>
                          ) : (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                                  Revision Instructions
                                </label>
                                <textarea
                                  value={revisionFeedback[index] || ''}
                                  onChange={(e) => setRevisionFeedback({ ...revisionFeedback, [index]: e.target.value })}
                                  placeholder="Describe what you'd like to change or improve in this chapter. For example:&#10;• Add more dialogue between characters&#10;• Make the action scene more intense&#10;• Develop the emotional connection&#10;• Change the pacing or tone&#10;• Add more descriptive details"
                                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-y min-h-[100px]"
                                  disabled={isGenerating}
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    if (revisionFeedback[index]?.trim()) {
                                      onRegenerateChapter(index, revisionFeedback[index]);
                                      setRevisionFeedback({ ...revisionFeedback, [index]: '' });
                                      setShowRevisionForm(null);
                                    }
                                  }}
                                  disabled={!revisionFeedback[index]?.trim() || isGenerating}
                                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                                >
                                  {isGenerating ? (
                                    <>
                                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      Regenerating...
                                    </>
                                  ) : (
                                    <>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                                      </svg>
                                      Regenerate
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    setShowRevisionForm(null);
                                    setRevisionFeedback({ ...revisionFeedback, [index]: '' });
                                  }}
                                  disabled={isGenerating}
                                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
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

            {/* Save Progress and View Story Buttons */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              {onSave && (
                <button
                  onClick={onSave}
                  className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                  </svg>
                  Save Progress
                </button>
              )}

              {/* View Story Button - Show if at least one chapter is completed */}
              {chapters.some(ch => ch.status === 'completed') && (
                <button
                  onClick={onViewStory}
                  className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  {allCompleted ? 'View Complete Story' : 'See it in Reader'}
                </button>
              )}
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

                {/* System Prompt Editor */}
                {onUpdateSystemPrompt && (
                  <div className="space-y-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <label className="text-xs font-semibold text-amber-900 uppercase tracking-wide flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                      </svg>
                      System Prompt
                    </label>
                    <textarea
                      value={localSystemPrompt}
                      onChange={(e) => handleSystemPromptChange(e.target.value)}
                      className="w-full text-sm text-slate-700 bg-white border border-amber-300 rounded-lg p-3 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all resize-y min-h-[100px]"
                    />
                    <p className="text-xs text-amber-700">
                      Define the AI's role and writing style. Edit the text above to customize.
                    </p>
                  </div>
                )}

                {/* Foreshadowing Notes */}
                {onAddForeshadowingNote && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="text-xs font-medium text-purple-800 uppercase tracking-wide mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        Foreshadowing for Chapter {nextChapterIndex + 1}
                      </div>
                      {!showForeshadowingForm && (
                        <button
                          onClick={handleAddForeshadowing}
                          className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                        >
                          + Add
                        </button>
                      )}
                    </div>

                    {showForeshadowingForm && (
                      <form onSubmit={handleSubmitForeshadowing} className="mb-3 bg-white border border-purple-300 rounded-lg p-3 space-y-2">
                        <div>
                          <label className="text-xs font-medium text-purple-900 block mb-1">
                            Target Chapter (Reveal)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={foreshadowingFormData.targetChapterId}
                            onChange={(e) => setForeshadowingFormData({ ...foreshadowingFormData, targetChapterId: parseInt(e.target.value) })}
                            className="w-full text-xs px-2 py-1 border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required
                          />
                          <p className="text-xs text-purple-600 mt-1">
                            Can specify any chapter, even if not created yet
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-purple-900 block mb-1">
                            What to Reveal
                          </label>
                          <textarea
                            value={foreshadowingFormData.revealDescription}
                            onChange={(e) => setForeshadowingFormData({ ...foreshadowingFormData, revealDescription: e.target.value })}
                            className="w-full text-xs px-2 py-1 border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y min-h-[60px]"
                            placeholder="e.g., The witch is revealed to be the hero's mother"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-purple-900 block mb-1">
                            How to Hint (in earlier chapters)
                          </label>
                          <textarea
                            value={foreshadowingFormData.foreshadowingHint}
                            onChange={(e) => setForeshadowingFormData({ ...foreshadowingFormData, foreshadowingHint: e.target.value })}
                            className="w-full text-xs px-2 py-1 border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y min-h-[60px]"
                            placeholder="e.g., Mention the witch has the same eye color as the hero"
                            required
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="text-xs px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                          >
                            {editingForeshadowingId ? 'Update' : 'Add'}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelForeshadowing}
                            className="text-xs px-3 py-1.5 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    {reveals.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs font-semibold text-amber-800 mb-1.5 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                          </svg>
                          Reveals in This Chapter:
                        </div>
                        <div className="space-y-1.5">
                          {reveals.map((note) => (
                            <div key={note.id} className="text-xs bg-amber-50 border border-amber-200 rounded p-2">
                              <div className="flex justify-between items-start gap-2">
                                <p className="font-medium text-amber-900 flex-1">{note.revealDescription}</p>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleEditForeshadowing(note)}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="Edit"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                  </button>
                                  {onDeleteForeshadowingNote && (
                                    <button
                                      onClick={() => onDeleteForeshadowingNote(note.id)}
                                      className="text-red-600 hover:text-red-800"
                                      title="Delete"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {hints.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-purple-800 mb-1.5 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          Hints to Include:
                        </div>
                        <div className="space-y-1.5">
                          {hints.map((note) => (
                            <div key={note.id} className="text-xs bg-white border border-purple-200 rounded p-2">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1">
                                  <p className="font-medium text-purple-900 mb-0.5">
                                    For Chapter {note.targetChapterId}:
                                  </p>
                                  <p className="text-purple-700 italic">{note.foreshadowingHint}</p>
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleEditForeshadowing(note)}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="Edit"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                  </button>
                                  {onDeleteForeshadowingNote && (
                                    <button
                                      onClick={() => onDeleteForeshadowingNote(note.id)}
                                      className="text-red-600 hover:text-red-800"
                                      title="Delete"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!showForeshadowingForm && hints.length === 0 && reveals.length === 0 && (
                      <p className="text-xs text-purple-600 italic text-center py-2">
                        No foreshadowing notes yet. Click "+ Add" to create one.
                      </p>
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
                      Customize the specific instructions for this chapter. Leave blank to use default prompt.
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
          </div>
        </div>
      </div>

      {/* Chapter Outcomes Section - Only in Continuous Mode */}
      {isContinuousMode && onSelectOutcome && (
        <div className="mt-8 max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">What happens next?</h3>
              <p className="text-slate-600">
                {chapterOutcomes.length > 0
                  ? 'Choose a direction for your story to continue:'
                  : 'Generate suggestions for the next chapter:'}
              </p>
            </div>

            {chapterOutcomes.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {chapterOutcomes.map((outcome, index) => (
                    <button
                      key={index}
                      onClick={() => onSelectOutcome(outcome)}
                      disabled={isGenerating}
                      className="bg-white rounded-xl p-5 border-2 border-transparent hover:border-indigo-400 hover:shadow-lg transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          {index + 1}
                        </div>
                        <h4 className="flex-1 font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {outcome.title}
                        </h4>
                      </div>

                      <p className="text-sm text-slate-600 mb-3 font-medium">
                        {outcome.summary}
                      </p>

                      <p className="text-sm text-slate-500 leading-relaxed">
                        {outcome.description}
                      </p>

                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end gap-2 text-indigo-600 font-semibold text-sm group-hover:text-indigo-700">
                        <span>Choose this path</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-4 text-center">
                  <p className="text-xs text-slate-500 italic">
                    💡 Tip: Each option leads to a different narrative direction. Choose the one that excites you most!
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <p className="text-slate-600 mb-4">
                  No suggestions available yet. Generate ideas for what could happen next in your story!
                </p>
                {onGenerateOutcomes && (
                  <button
                    onClick={onGenerateOutcomes}
                    disabled={isGenerating}
                    className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                  >
                    {isGenerating ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                        <span>Generate Suggestions</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

