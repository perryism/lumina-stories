import { SavedStory, StoryState } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Convert a SavedStory to YAML format
 */
const storyToYAML = (story: SavedStory): string => {
  const lines: string[] = [];
  const { state } = story;

  lines.push('# Lumina Stories - Saved Story');
  lines.push(`# ID: ${story.id}`);
  lines.push(`# Saved: ${new Date(story.savedAt).toISOString()}`);
  lines.push(`# Last Modified: ${new Date(story.lastModified).toISOString()}`);
  lines.push(`# Progress: ${story.progress}%`);
  lines.push('');

  lines.push(`title: "${escapeYAMLString(state.title)}"`);
  lines.push(`genre: "${escapeYAMLString(state.genre)}"`);
  lines.push(`readingLevel: "${state.readingLevel}"`);
  lines.push(`currentStep: "${state.currentStep}"`);
  lines.push(`numChapters: ${state.numChapters}`);
  lines.push('');

  if (state.plotOutline) {
    lines.push('plotOutline: |');
    state.plotOutline.split('\n').forEach(line => {
      lines.push(`  ${line}`);
    });
    lines.push('');
  } else {
    lines.push('plotOutline: ""');
    lines.push('');
  }

  if (state.systemPrompt) {
    lines.push('systemPrompt: |');
    state.systemPrompt.split('\n').forEach(line => {
      lines.push(`  ${line}`);
    });
    lines.push('');
  }

  lines.push('characters:');
  if (state.characters.length === 0) {
    lines.push('  []');
  } else {
    state.characters.forEach((char) => {
      lines.push(`  - id: "${escapeYAMLString(char.id)}"`);
      lines.push(`    name: "${escapeYAMLString(char.name)}"`);
      lines.push(`    attributes: "${escapeYAMLString(char.attributes)}"`);
    });
  }
  lines.push('');

  lines.push('outline:');
  if (state.outline.length === 0) {
    lines.push('  []');
  } else {
    state.outline.forEach((chapter, index) => {
      lines.push(`  - id: ${chapter.id}`);
      lines.push(`    title: "${escapeYAMLString(chapter.title || '')}"`);
      lines.push(`    summary: |`);
      if (chapter.summary) {
        chapter.summary.split('\n').forEach(line => {
          lines.push(`      ${line}`);
        });
      }
      lines.push(`    status: "${chapter.status}"`);
      // Always include content field, even if empty
      lines.push(`    content: |`);
      if (chapter.content) {
        chapter.content.split('\n').forEach(line => {
          lines.push(`      ${line}`);
        });
      } else {
        // Add an empty line to maintain proper YAML structure when content is empty
        lines.push('');
      }
      // Add acceptance criteria if it exists
      if (chapter.acceptanceCriteria) {
        lines.push(`    acceptanceCriteria: |`);
        chapter.acceptanceCriteria.split('\n').forEach(line => {
          lines.push(`      ${line}`);
        });
      }
      if (chapter.foreshadowing && chapter.foreshadowing.length > 0) {
        lines.push(`    foreshadowing:`);
        chapter.foreshadowing.forEach(f => {
          lines.push(`      - "${escapeYAMLString(f)}"`);
        });
      }
      // Add blank line between chapters for readability
      if (index < state.outline.length - 1) {
        lines.push('');
      }
    });
  }
  lines.push('');

  // Add foreshadowing notes if they exist
  if (state.foreshadowingNotes && state.foreshadowingNotes.length > 0) {
    lines.push('foreshadowingNotes:');
    state.foreshadowingNotes.forEach((note) => {
      lines.push(`  - id: "${escapeYAMLString(note.id)}"`);
      lines.push(`    targetChapterId: ${note.targetChapterId}`);
      lines.push(`    revealDescription: "${escapeYAMLString(note.revealDescription)}"`);
      lines.push(`    foreshadowingHint: "${escapeYAMLString(note.foreshadowingHint)}"`);
      lines.push(`    createdAt: ${note.createdAt}`);
    });
  }

  // Add chapter outcomes if they exist
  if (state.chapterOutcomes && state.chapterOutcomes.length > 0) {
    lines.push('');
    lines.push('chapterOutcomes:');
    state.chapterOutcomes.forEach((outcome) => {
      lines.push(`  - title: "${escapeYAMLString(outcome.title)}"`);
      lines.push(`    summary: "${escapeYAMLString(outcome.summary)}"`);
      lines.push(`    description: "${escapeYAMLString(outcome.description)}"`);
    });
  }

  return lines.join('\n');
};

/**
 * Parse YAML content into a SavedStory
 */
const parseYAMLStory = (yamlContent: string): SavedStory => {
  console.log('[parseYAMLStory] Starting parse, content length:', yamlContent.length);
  const lines = yamlContent.split('\n');
  const story: any = {
    state: {
      characters: [],
      outline: [],
      foreshadowingNotes: [],
      chapterOutcomes: []
    }
  };

  let currentKey: string | null = null;
  let currentMultiline: string[] = [];
  let inCharacters = false;
  let inOutline = false;
  let inForeshadowingNotes = false;
  let inChapterOutcomes = false;
  let currentCharacter: any = null;
  let currentChapter: any = null;
  let currentChapterKey: string | null = null;
  let inForeshadowing = false;
  let currentForeshadowingNote: any = null;
  let currentChapterOutcome: any = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Parse metadata from comments
    if (trimmed.startsWith('# ID:')) {
      story.id = trimmed.replace('# ID:', '').trim();
      continue;
    }
    if (trimmed.startsWith('# Saved:')) {
      story.savedAt = new Date(trimmed.replace('# Saved:', '').trim()).getTime();
      continue;
    }
    if (trimmed.startsWith('# Last Modified:')) {
      story.lastModified = new Date(trimmed.replace('# Last Modified:', '').trim()).getTime();
      continue;
    }
    if (trimmed.startsWith('# Progress:')) {
      story.progress = parseInt(trimmed.replace('# Progress:', '').replace('%', '').trim());
      continue;
    }

    // Skip other comments and empty lines (but handle multiline finalization first)
    if (trimmed.startsWith('#') || trimmed === '') {
      // If we're in a multiline context and hit an empty line, it might signal the end
      // Check if the next non-empty line would start a new section
      continue;
    }

    // Handle multiline strings
    if (currentKey && (line.startsWith('  ') || line.startsWith('\t'))) {
      const indent = line.match(/^(\s*)/)?.[0].length || 0;

      // Check if this line starts a new key (has a colon and proper indentation)
      const isNewKey = line.trim().includes(':') && !line.trim().startsWith('-');
      const expectedIndent = currentChapterKey ? 4 : 2;

      // Check if this line starts a new chapter (list item at indent 2)
      const isNewChapter = line.trim().startsWith('- ') && indent === 2;

      if (isNewChapter && currentChapterKey) {
        // Finalize the current chapter's multiline content before starting new chapter
        currentChapter[currentChapterKey] = currentMultiline.join('\n');
        currentChapterKey = null;
        currentKey = null;
        currentMultiline = [];
        // Don't continue, let this line be processed as a new chapter
      } else if (isNewKey && indent === expectedIndent) {
        // This is a new key, finish the multiline
        if (currentChapterKey) {
          currentChapter[currentChapterKey] = currentMultiline.join('\n');
          currentChapterKey = null;
        } else {
          story.state[currentKey] = currentMultiline.join('\n');
        }
        currentKey = null;
        currentMultiline = [];
        // Don't continue, let this line be processed as a new key
      } else if (!line.trim().startsWith('-')) {
        // Continue multiline content
        if (currentChapterKey && indent >= 6) {
          currentMultiline.push(line.replace(/^\s{6}/, ''));
        } else if (indent >= 2) {
          currentMultiline.push(line.replace(/^\s{2}/, ''));
        }
        continue;
      }
    } else if (currentKey) {
      // Finalize multiline content even if empty
      if (currentChapterKey) {
        currentChapter[currentChapterKey] = currentMultiline.join('\n');
        currentChapterKey = null;
      } else {
        story.state[currentKey] = currentMultiline.join('\n');
      }
      currentKey = null;
      currentMultiline = [];
    }

    // Parse key-value pairs
    if (trimmed.includes(':')) {
      const colonIndex = trimmed.indexOf(':');
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      // Top-level keys
      if (key === 'characters') {
        inCharacters = true;
        inOutline = false;
        inForeshadowingNotes = false;
        inChapterOutcomes = false;
        if (value === '[]') {
          story.state.characters = [];
        }
        continue;
      }

      if (key === 'outline') {
        inOutline = true;
        inCharacters = false;
        inForeshadowingNotes = false;
        inChapterOutcomes = false;
        if (value === '[]') {
          story.state.outline = [];
        }
        continue;
      }

      if (key === 'foreshadowingNotes') {
        inForeshadowingNotes = true;
        inCharacters = false;
        inOutline = false;
        inChapterOutcomes = false;
        story.state.foreshadowingNotes = [];
        if (value === '[]') {
          story.state.foreshadowingNotes = [];
        }
        continue;
      }

      if (key === 'chapterOutcomes') {
        inChapterOutcomes = true;
        inForeshadowingNotes = false;
        inCharacters = false;
        inOutline = false;
        story.state.chapterOutcomes = [];
        if (value === '[]') {
          story.state.chapterOutcomes = [];
        }
        continue;
      }

      // Character parsing
      if (inCharacters && line.startsWith('  - ')) {
        if (currentCharacter) {
          story.state.characters.push(currentCharacter);
        }
        currentCharacter = {};
        const charKey = key.replace('- ', '');
        currentCharacter[charKey] = unescapeYAMLString(value);
      } else if (inCharacters && line.startsWith('    ')) {
        if (currentCharacter) {
          currentCharacter[key] = unescapeYAMLString(value);
        }
      }
      // Outline parsing
      else if (inOutline && line.startsWith('  - ')) {
        if (currentChapter) {
          story.state.outline.push(currentChapter);
        }
        currentChapter = { foreshadowing: [], content: '' };
        const chapterKey = key.replace('- ', '');
        if (chapterKey === 'id') {
          currentChapter[chapterKey] = parseInt(value);
        } else {
          currentChapter[chapterKey] = unescapeYAMLString(value);
        }
      } else if (inOutline && line.startsWith('    ')) {
        if (currentChapter) {
          if (key === 'foreshadowing') {
            inForeshadowing = true;
            continue;
          }
          if (value === '|') {
            currentChapterKey = key;
            currentMultiline = [];
            currentKey = 'chapter';
          } else if (key === 'id') {
            currentChapter[key] = parseInt(value);
          } else {
            currentChapter[key] = unescapeYAMLString(value);
          }
        }
      } else if (inOutline && inForeshadowing && line.startsWith('      - ')) {
        if (currentChapter) {
          currentChapter.foreshadowing.push(unescapeYAMLString(value));
        }
      }
      // ForeshadowingNotes parsing
      else if (inForeshadowingNotes && line.startsWith('  - ')) {
        if (currentForeshadowingNote) {
          story.state.foreshadowingNotes.push(currentForeshadowingNote);
        }
        currentForeshadowingNote = {};
        const noteKey = key.replace('- ', '');
        currentForeshadowingNote[noteKey] = unescapeYAMLString(value);
      } else if (inForeshadowingNotes && line.startsWith('    ')) {
        if (currentForeshadowingNote) {
          if (key === 'targetChapterId' || key === 'createdAt') {
            currentForeshadowingNote[key] = parseInt(value);
          } else {
            currentForeshadowingNote[key] = unescapeYAMLString(value);
          }
        }
      }
      // ChapterOutcomes parsing
      else if (inChapterOutcomes && line.startsWith('  - ')) {
        if (currentChapterOutcome) {
          story.state.chapterOutcomes.push(currentChapterOutcome);
        }
        currentChapterOutcome = {};
        const outcomeKey = key.replace('- ', '');
        currentChapterOutcome[outcomeKey] = unescapeYAMLString(value);
      } else if (inChapterOutcomes && line.startsWith('    ')) {
        if (currentChapterOutcome) {
          currentChapterOutcome[key] = unescapeYAMLString(value);
        }
      }
      // State-level keys
      else if (!inCharacters && !inOutline && !inForeshadowingNotes && !inChapterOutcomes) {
        if (value === '|') {
          currentKey = key;
          currentMultiline = [];
        } else if (value) {
          // Parse numeric fields
          if (key === 'numChapters') {
            story.state[key] = parseInt(unescapeYAMLString(value));
          } else {
            story.state[key] = unescapeYAMLString(value);
          }
        }
      }
    }
  }

  // Add last character if exists
  if (currentCharacter) {
    story.state.characters.push(currentCharacter);
  }

  // Add last chapter if exists
  if (currentChapter) {
    story.state.outline.push(currentChapter);
  }

  // Add last foreshadowing note if exists
  if (currentForeshadowingNote) {
    story.state.foreshadowingNotes = story.state.foreshadowingNotes || [];
    story.state.foreshadowingNotes.push(currentForeshadowingNote);
  }

  // Add last chapter outcome if exists
  if (currentChapterOutcome) {
    story.state.chapterOutcomes = story.state.chapterOutcomes || [];
    story.state.chapterOutcomes.push(currentChapterOutcome);
  }

  // Add last multiline if exists
  if (currentKey && currentMultiline.length > 0) {
    if (currentChapterKey) {
      currentChapter[currentChapterKey] = currentMultiline.join('\n');
    } else {
      story.state[currentKey] = currentMultiline.join('\n');
    }
  }

  console.log('[parseYAMLStory] Parsed story:', {
    id: story.id,
    title: story.state?.title,
    charactersCount: story.state?.characters?.length,
    outlineCount: story.state?.outline?.length,
    foreshadowingNotesCount: story.state?.foreshadowingNotes?.length
  });

  return story as SavedStory;
};

/**
 * Escape special characters in YAML strings
 */
const escapeYAMLString = (str: string): string => {
  return str.replace(/"/g, '\\"').replace(/\n/g, '\\n');
};

/**
 * Unescape YAML strings
 */
const unescapeYAMLString = (str: string): string => {
  let result = str.replace(/^["']|["']$/g, '');
  result = result.replace(/\\"/g, '"').replace(/\\n/g, '\n');
  return result;
};

/**
 * Get all saved stories from the libraries folder
 */
export const getAllSavedStories = async (): Promise<SavedStory[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/list-stories`);
    if (!response.ok) {
      throw new Error('Failed to list stories');
    }

    const { files } = await response.json();
    const stories: SavedStory[] = [];

    // Load each story file
    for (const filename of files) {
      try {
        const loadResponse = await fetch(`${API_BASE_URL}/load-story/${filename}`);
        if (loadResponse.ok) {
          const { content } = await loadResponse.json();
          const story = parseYAMLStory(content);
          stories.push(story);
        }
      } catch (error) {
        console.error(`Failed to load story ${filename}:`, error);
      }
    }

    return stories;
  } catch (error) {
    console.error('Failed to load saved stories:', error);
    return [];
  }
};

/**
 * Save a story to the library as a YAML file
 */
export const saveStory = async (state: StoryState): Promise<SavedStory> => {
  // Calculate progress
  const completedChapters = state.outline.filter(ch => ch.status === 'completed').length;
  const progress = state.outline.length > 0
    ? Math.round((completedChapters / state.outline.length) * 100)
    : 0;

  // Generate filename from title
  const filename = `${state.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.yaml`;

  // Check if story already exists
  const stories = await getAllSavedStories();
  const existingStory = stories.find(s => s.state.title === state.title);

  const savedStory: SavedStory = {
    id: existingStory ? existingStory.id : `story-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    state,
    savedAt: existingStory ? existingStory.savedAt : Date.now(),
    lastModified: Date.now(),
    progress,
  };

  // Convert to YAML
  const yamlContent = storyToYAML(savedStory);

  // Save via API
  try {
    const response = await fetch(`${API_BASE_URL}/save-story`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename,
        content: yamlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save story');
    }

    return savedStory;
  } catch (error) {
    console.error('Failed to save story:', error);
    throw new Error('Failed to save story. Make sure the server is running (npm run server).');
  }
};

/**
 * Load a story from the library
 */
export const loadStory = async (storyId: string): Promise<StoryState | null> => {
  console.log('[loadStory] Loading story with ID:', storyId);
  const stories = await getAllSavedStories();
  console.log('[loadStory] Found', stories.length, 'stories');
  const story = stories.find(s => s.id === storyId);
  console.log('[loadStory] Story found:', !!story);
  if (story) {
    console.log('[loadStory] Story state:', {
      title: story.state.title,
      currentStep: story.state.currentStep,
      outlineLength: story.state.outline?.length
    });
  }
  return story ? story.state : null;
};

/**
 * Delete a story from the library
 */
export const deleteStory = async (storyId: string): Promise<void> => {
  const stories = await getAllSavedStories();
  const story = stories.find(s => s.id === storyId);

  if (!story) {
    throw new Error('Story not found');
  }

  // Generate filename from title
  const filename = `${story.state.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.yaml`;

  try {
    const response = await fetch(`${API_BASE_URL}/delete-story/${filename}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete story');
    }
  } catch (error) {
    console.error('Failed to delete story:', error);
    throw new Error('Failed to delete story. Make sure the server is running (npm run server).');
  }
};

/**
 * Export a story as YAML file
 */
export const exportStory = async (storyId: string): Promise<void> => {
  const stories = await getAllSavedStories();
  const story = stories.find(s => s.id === storyId);

  if (!story) {
    throw new Error('Story not found');
  }

  const yamlContent = storyToYAML(story);
  const dataBlob = new Blob([yamlContent], { type: 'text/yaml' });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${story.state.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.yaml`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Import a story from YAML file
 */
export const importStory = (file: File): Promise<SavedStory> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const importedStory = parseYAMLStory(content);

        // Validate the imported story structure
        if (!importedStory.state || !importedStory.state.title) {
          throw new Error('Invalid story file format');
        }

        // Generate new ID to avoid conflicts
        importedStory.id = `story-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        importedStory.lastModified = Date.now();

        // Save to library
        await saveStory(importedStory.state);

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

