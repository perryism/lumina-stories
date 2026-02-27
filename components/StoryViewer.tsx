
import React, { useState } from 'react';
import { Chapter, ForeshadowingNote } from '../types';
import { exportStoryToText } from '../utils/exportStory';

interface StoryViewerProps {
  title: string;
  chapters: Chapter[];
  genre?: string;
  onRegenerateChapter?: (chapterIndex: number, feedback: string, acceptanceCriteria?: string) => void;
  onUndoRevision?: (chapterIndex: number) => void;
  onUpdateChapterContent?: (chapterIndex: number, newContent: string) => void;
  isRegenerating?: boolean;
  onSave?: () => void;
  onBack?: () => void;
  foreshadowingNotes?: ForeshadowingNote[];
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
  title,
  chapters,
  genre,
  onRegenerateChapter,
  onUndoRevision,
  onUpdateChapterContent,
  isRegenerating = false,
  onSave,
  onBack,
  foreshadowingNotes = []
}) => {
  // Filter to only show completed chapters
  const completedChapters = chapters.filter(ch => ch.status === 'completed' && ch.content);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [showForeshadowing, setShowForeshadowing] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  const activeChapter = completedChapters[activeChapterIndex];

  const handleExport = () => {
    // Export only completed chapters
    exportStoryToText(title, completedChapters, genre);
  };

  // Get foreshadowing notes relevant to the current chapter
  const getRelevantForeshadowingNotes = () => {
    if (!activeChapter || !foreshadowingNotes || foreshadowingNotes.length === 0) {
      return { hints: [], reveals: [] };
    }

    const currentChapterNumber = chapters.findIndex(ch => ch.id === activeChapter.id) + 1;

    // Notes that should be hinted at in this chapter (target chapter is later)
    const hints = foreshadowingNotes.filter(
      note => note.targetChapterId > currentChapterNumber
    );

    // Notes that are revealed in this chapter
    const reveals = foreshadowingNotes.filter(
      note => note.targetChapterId === currentChapterNumber
    );

    return { hints, reveals };
  };

  const { hints, reveals } = getRelevantForeshadowingNotes();

  const handleSubmitFeedback = () => {
    if (feedback.trim() && onRegenerateChapter && activeChapter) {
      // Find the original chapter index in the full chapters array
      const originalIndex = chapters.findIndex(ch => ch.id === activeChapter.id);
      if (originalIndex !== -1) {
        onRegenerateChapter(originalIndex, feedback, acceptanceCriteria);
      }
      setFeedback('');
      setAcceptanceCriteria('');
      setShowFeedbackForm(false);
    }
  };

  const handleChapterChange = (newIndex: number) => {
    // Save any pending edits before switching chapters
    if (isEditingContent && editedContent !== activeChapter?.content) {
      handleSaveEdit();
    }
    setActiveChapterIndex(newIndex);
    setShowFeedbackForm(false);
    setFeedback('');
    setAcceptanceCriteria('');
    setIsEditingContent(false);
    setEditedContent('');
  };

  const handleStartEdit = () => {
    setIsEditingContent(true);
    setEditedContent(activeChapter?.content || '');
  };

  const handleCancelEdit = () => {
    setIsEditingContent(false);
    setEditedContent('');
  };

  const handleSaveEdit = () => {
    if (onUpdateChapterContent && activeChapter && editedContent !== activeChapter.content) {
      const originalIndex = chapters.findIndex(ch => ch.id === activeChapter.id);
      if (originalIndex !== -1) {
        onUpdateChapterContent(originalIndex, editedContent);
      }
    }
    setIsEditingContent(false);
    setEditedContent('');
  };

  // If no completed chapters, show a message
  if (completedChapters.length === 0) {
    return (
      <div className="max-w-5xl mx-auto pb-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <div className="text-6xl mb-4">📖</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No Chapters Available Yet</h2>
          <p className="text-slate-600 mb-6">
            Generate some chapters first, then come back to read your story!
          </p>
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Editing
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 pb-12">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 space-y-2">
        <div className="px-4 mb-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Contents</h3>
          {completedChapters.length < chapters.length && (
            <p className="text-xs text-slate-500 italic">
              Showing {completedChapters.length} of {chapters.length} chapters
            </p>
          )}
        </div>
        {completedChapters.map((chapter, index) => (
          <button
            key={chapter.id}
            onClick={() => handleChapterChange(index)}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${
              activeChapterIndex === index
                ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-100'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className={`text-xs w-6 h-6 rounded-full flex items-center justify-center ${activeChapterIndex === index ? 'bg-indigo-500' : 'bg-slate-200 text-slate-500'}`}>
              {chapters.findIndex(ch => ch.id === chapter.id) + 1}
            </span>
            <span className="truncate">{chapter.title}</span>
          </button>
        ))}

        {/* Foreshadowing Section */}
        {(hints.length > 0 || reveals.length > 0) && (
          <div className="pt-4 mt-4 border-t border-slate-200">
            <button
              onClick={() => setShowForeshadowing(!showForeshadowing)}
              className="w-full px-4 py-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold transition-all flex items-center justify-between gap-2 border border-purple-200"
            >
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                <span>Foreshadowing</span>
                <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
                  {hints.length + reveals.length}
                </span>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 transition-transform ${showForeshadowing ? 'rotate-180' : ''}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {showForeshadowing && (
              <div className="mt-2 space-y-2">
                {reveals.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                      </svg>
                      Reveals in This Chapter
                    </h4>
                    <div className="space-y-2">
                      {reveals.map((note) => (
                        <div key={note.id} className="text-sm text-amber-900 bg-white rounded p-2">
                          <p className="font-medium">{note.revealDescription}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {hints.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <h4 className="text-xs font-bold text-purple-800 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Hints for Future Reveals
                    </h4>
                    <div className="space-y-2">
                      {hints.map((note) => (
                        <div key={note.id} className="text-sm text-purple-900 bg-white rounded p-2">
                          <p className="font-medium mb-1">
                            Will reveal in Chapter {note.targetChapterId}:
                          </p>
                          <p className="text-purple-700 italic">{note.foreshadowingHint}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 mt-4 border-t border-slate-200 space-y-2">
          {onBack && (
            <button
              onClick={onBack}
              className="w-full px-4 py-3 rounded-xl bg-slate-600 hover:bg-slate-700 text-white font-semibold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Editing
            </button>
          )}
          {onSave && (
            <button
              onClick={onSave}
              className="w-full px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
              </svg>
              Save Progress
            </button>
          )}
          <button
            onClick={handleExport}
            className="w-full px-4 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Export to Text
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12 prose-font">
          <header className="mb-12 border-b border-slate-100 pb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">{title}</h1>
            <div className="flex items-center gap-4 text-slate-400 text-sm italic">
              <span>Chapter {chapters.findIndex(ch => ch.id === activeChapter.id) + 1}</span>
              <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
              <span>{activeChapter.title}</span>
            </div>
          </header>

          {/* Edit Mode */}
          {isEditingContent ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">Editing Mode</h4>
                  <p className="text-sm text-blue-800">
                    Make your changes below. Each paragraph should be on a new line. Click "Save Changes" when done.
                  </p>
                </div>
              </div>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-y min-h-[500px] font-serif text-lg leading-relaxed"
                placeholder="Enter chapter content..."
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSaveEdit}
                  disabled={editedContent === activeChapter?.content}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Save Changes
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Read Mode */}
              <article className="prose prose-slate prose-lg max-w-none">
                {activeChapter.content && activeChapter.content.split('\n').map((para, i) => (
                  para.trim() ? (
                    <p key={i} className="mb-6 leading-relaxed text-slate-800 text-lg md:text-xl">
                      {para}
                    </p>
                  ) : <br key={i} />
                ))}
              </article>

              {/* Edit Button */}
              {onUpdateChapterContent && (
                <div className="mt-8 pt-8 border-t border-slate-100">
                  <button
                    onClick={handleStartEdit}
                    disabled={isRegenerating}
                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    Edit Chapter Content
                  </button>
                </div>
              )}
            </>
          )}

          {/* Regeneration Feedback Form - only show when not editing */}
          {!isEditingContent && onRegenerateChapter && (
            <div className="mt-12 pt-8 border-t border-slate-100">
              {!showFeedbackForm ? (
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setShowFeedbackForm(true);
                      // Initialize acceptance criteria with current chapter's criteria
                      setAcceptanceCriteria(activeChapter?.acceptanceCriteria || '');
                    }}
                    disabled={isRegenerating}
                    className="w-full bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    {isRegenerating ? 'Regenerating...' : 'Regenerate This Chapter'}
                  </button>

                  {/* Undo Button - only show if there's revision history */}
                  {onUndoRevision && activeChapter?.revisionHistory && activeChapter.revisionHistory.length > 0 && (
                    <button
                      onClick={() => {
                        const originalIndex = chapters.findIndex(ch => ch.id === activeChapter.id);
                        if (originalIndex !== -1) {
                          onUndoRevision(originalIndex);
                        }
                      }}
                      disabled={isRegenerating}
                      className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Undo Last Revision ({activeChapter.revisionHistory.length} version{activeChapter.revisionHistory.length !== 1 ? 's' : ''} available)
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      What would you like to improve in this chapter?
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="E.g., 'Add more dialogue between the characters', 'Make the action scene more intense', 'Develop the emotional connection more', etc."
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-y min-h-[120px]"
                      disabled={isRegenerating}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Acceptance Criteria (Optional)
                    </label>
                    <textarea
                      value={acceptanceCriteria}
                      onChange={(e) => setAcceptanceCriteria(e.target.value)}
                      placeholder="Define criteria this chapter must meet (e.g., 'Include a plot twist', 'Develop character relationship', 'Maintain suspenseful tone')..."
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-y min-h-[80px]"
                      disabled={isRegenerating}
                    />
                    <p className="text-xs text-slate-500 mt-1.5 italic">
                      {activeChapter?.acceptanceCriteria
                        ? `Current criteria: "${activeChapter.acceptanceCriteria.substring(0, 100)}${activeChapter.acceptanceCriteria.length > 100 ? '...' : ''}"`
                        : 'No acceptance criteria currently set for this chapter.'}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSubmitFeedback}
                      disabled={!feedback.trim() || isRegenerating}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isRegenerating ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                          </svg>
                          Regenerate Chapter
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowFeedbackForm(false);
                        setFeedback('');
                      }}
                      disabled={isRegenerating}
                      className="px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 pt-8 border-t border-slate-100 flex justify-between items-center">
            <button
              disabled={activeChapterIndex === 0}
              onClick={() => handleChapterChange(activeChapterIndex - 1)}
              className="text-indigo-600 font-bold disabled:opacity-30 flex items-center gap-2"
            >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Previous
            </button>
            <button
              disabled={activeChapterIndex === completedChapters.length - 1}
              onClick={() => handleChapterChange(activeChapterIndex + 1)}
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
