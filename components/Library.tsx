import React, { useState, useEffect } from 'react';
import { SavedStory } from '../types';
import { getAllSavedStories, deleteStory, exportStory, importStory } from '../services/libraryService';

interface LibraryProps {
  onLoadStory: (storyId: string) => void;
  onClose: () => void;
}

export const Library: React.FC<LibraryProps> = ({ onLoadStory, onClose }) => {
  const [stories, setStories] = useState<SavedStory[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'progress'>('recent');
  const [filterProgress, setFilterProgress] = useState<'all' | 'in-progress' | 'completed'>('all');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = () => {
    const allStories = getAllSavedStories();
    setStories(allStories);
  };

  const handleDelete = (storyId: string, storyTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${storyTitle}"? This cannot be undone.`)) {
      try {
        deleteStory(storyId);
        loadStories();
      } catch (error: any) {
        alert(error.message || 'Failed to delete story');
      }
    }
  };

  const handleExport = (storyId: string) => {
    try {
      exportStory(storyId);
    } catch (error: any) {
      alert(error.message || 'Failed to export story');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      await importStory(file);
      loadStories();
      alert('Story imported successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to import story');
    } finally {
      setIsImporting(false);
      event.target.value = ''; // Reset file input
    }
  };

  const getSortedAndFilteredStories = () => {
    let filtered = [...stories];

    // Apply filter
    if (filterProgress === 'in-progress') {
      filtered = filtered.filter(s => s.progress > 0 && s.progress < 100);
    } else if (filterProgress === 'completed') {
      filtered = filtered.filter(s => s.progress === 100);
    }

    // Apply sort
    filtered.sort((a, b) => {
      if (sortBy === 'recent') {
        return b.lastModified - a.lastModified;
      } else if (sortBy === 'title') {
        return a.state.title.localeCompare(b.state.title);
      } else {
        return b.progress - a.progress;
      }
    });

    return filtered;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const displayedStories = getSortedAndFilteredStories();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900">Story Library</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="recent">Most Recent</option>
                <option value="title">Title (A-Z)</option>
                <option value="progress">Progress</option>
              </select>

              <select
                value={filterProgress}
                onChange={(e) => setFilterProgress(e.target.value as any)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Stories</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <label className="ml-auto cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                disabled={isImporting}
              />
              <span className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors inline-block">
                {isImporting ? 'Importing...' : '📥 Import Story'}
              </span>
            </label>
          </div>
        </div>

        {/* Story List */}
        <div className="flex-1 overflow-y-auto p-6">
          {displayedStories.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No stories found</h3>
              <p className="text-slate-500">
                {stories.length === 0
                  ? 'Start creating your first story!'
                  : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {displayedStories.map((story) => (
                <div
                  key={story.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-900 mb-1 truncate">
                        {story.state.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded">
                          {story.state.genre}
                        </span>
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded">
                          {story.state.readingLevel}
                        </span>
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded">
                          {story.state.outline.filter(ch => ch.status === 'completed').length}/{story.state.outline.length} chapters
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span>Progress</span>
                          <span className="font-semibold">{story.progress}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              story.progress === 100 ? 'bg-green-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${story.progress}%` }}
                          />
                        </div>
                      </div>

                      <p className="text-xs text-slate-500">
                        Last modified: {formatDate(story.lastModified)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          onLoadStory(story.id);
                          onClose();
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors whitespace-nowrap"
                      >
                        Load Story
                      </button>
                      <button
                        onClick={() => handleExport(story.id)}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors whitespace-nowrap"
                      >
                        📤 Export
                      </button>
                      <button
                        onClick={() => handleDelete(story.id, story.state.title)}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors whitespace-nowrap"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-center text-sm text-slate-500">
          {stories.length} {stories.length === 1 ? 'story' : 'stories'} in your library
        </div>
      </div>
    </div>
  );
};

