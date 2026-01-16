import { SavedStory, StoryState } from '../types';

const LIBRARY_STORAGE_KEY = 'lumina-stories-library';

/**
 * Get all saved stories from localStorage
 */
export const getAllSavedStories = (): SavedStory[] => {
  try {
    const stored = localStorage.getItem(LIBRARY_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load saved stories:', error);
    return [];
  }
};

/**
 * Save a story to the library
 */
export const saveStory = (state: StoryState): SavedStory => {
  const stories = getAllSavedStories();
  
  // Calculate progress
  const completedChapters = state.outline.filter(ch => ch.status === 'completed').length;
  const progress = state.outline.length > 0 
    ? Math.round((completedChapters / state.outline.length) * 100)
    : 0;

  // Check if story already exists (by title)
  const existingIndex = stories.findIndex(s => s.state.title === state.title);
  
  const savedStory: SavedStory = {
    id: existingIndex >= 0 ? stories[existingIndex].id : `story-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    state,
    savedAt: existingIndex >= 0 ? stories[existingIndex].savedAt : Date.now(),
    lastModified: Date.now(),
    progress,
  };

  if (existingIndex >= 0) {
    // Update existing story
    stories[existingIndex] = savedStory;
  } else {
    // Add new story
    stories.push(savedStory);
  }

  // Save to localStorage
  try {
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(stories));
  } catch (error) {
    console.error('Failed to save story:', error);
    throw new Error('Failed to save story. Storage might be full.');
  }

  return savedStory;
};

/**
 * Load a story from the library
 */
export const loadStory = (storyId: string): StoryState | null => {
  const stories = getAllSavedStories();
  const story = stories.find(s => s.id === storyId);
  return story ? story.state : null;
};

/**
 * Delete a story from the library
 */
export const deleteStory = (storyId: string): void => {
  const stories = getAllSavedStories();
  const filtered = stories.filter(s => s.id !== storyId);
  
  try {
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete story:', error);
    throw new Error('Failed to delete story.');
  }
};

/**
 * Export a story as JSON file
 */
export const exportStory = (storyId: string): void => {
  const stories = getAllSavedStories();
  const story = stories.find(s => s.id === storyId);
  
  if (!story) {
    throw new Error('Story not found');
  }

  const dataStr = JSON.stringify(story, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${story.state.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Import a story from JSON file
 */
export const importStory = (file: File): Promise<SavedStory> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedStory = JSON.parse(content) as SavedStory;
        
        // Validate the imported story structure
        if (!importedStory.state || !importedStory.state.title) {
          throw new Error('Invalid story file format');
        }

        // Generate new ID to avoid conflicts
        importedStory.id = `story-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        importedStory.lastModified = Date.now();
        
        // Save to library
        const stories = getAllSavedStories();
        stories.push(importedStory);
        localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(stories));
        
        resolve(importedStory);
      } catch (error) {
        reject(new Error('Failed to import story. Invalid file format.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file.'));
    };
    
    reader.readAsText(file);
  });
};

