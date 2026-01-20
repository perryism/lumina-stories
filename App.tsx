
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { StoryForm } from './components/StoryForm';
import { OutlineEditor } from './components/OutlineEditor';
import { ManualChapterGenerator } from './components/ManualChapterGenerator';
import { StoryViewer } from './components/StoryViewer';
import { TemplateBrowser } from './components/TemplateBrowser';
import { ForeshadowingManager } from './components/ForeshadowingManager';
import { Library } from './components/Library';
import { StoryState, Chapter, Character, ReadingLevel, ChapterOutcome, StoryTemplate, ForeshadowingNote } from './types';
import { generateOutline, generateChapterContent, summarizePreviousChapters, buildChapterPrompt, regenerateChapterContent, generateNextChapterOutcomes, validateChapterContent, generateChapterSuggestions, generateDetailedChapterSummary } from './services/aiService';
import { saveStory, loadStory } from './services/libraryService';

// Helper function to add foreshadowing notes to target chapter's acceptance criteria
const addForeshadowingToAcceptanceCriteria = (outline: Chapter[], foreshadowingNotes: ForeshadowingNote[]): Chapter[] => {
  return outline.map((chapter, index) => {
    const chapterNumber = index + 1;

    // Find notes that should be revealed in this chapter
    const notesToReveal = foreshadowingNotes.filter(
      note => note.targetChapterId === chapterNumber
    );

    if (notesToReveal.length === 0) {
      return chapter;
    }

    // Build foreshadowing criteria text
    const foreshadowingCriteria = notesToReveal
      .map(note => `- MUST reveal: ${note.revealDescription}`)
      .join('\n');

    // Check if acceptance criteria already contains foreshadowing reveals
    const existingCriteria = chapter.acceptanceCriteria || '';

    // Remove old foreshadowing section if it exists
    const criteriaWithoutForeshadowing = existingCriteria
      .replace(/\n*Foreshadowing Reveals:\n[\s\S]*?(?=\n\n|$)/g, '')
      .trim();

    // Add new foreshadowing section
    const updatedCriteria = criteriaWithoutForeshadowing
      ? `${criteriaWithoutForeshadowing}\n\nForeshadowing Reveals:\n${foreshadowingCriteria}`
      : `Foreshadowing Reveals:\n${foreshadowingCriteria}`;

    return {
      ...chapter,
      acceptanceCriteria: updatedCriteria,
    };
  });
};

const App: React.FC = () => {
  const [state, setState] = useState<StoryState>({
    title: '',
    genre: 'Fantasy',
    numChapters: 5,
    readingLevel: 'young-adult',
    characters: [],
    outline: [],
    currentStep: 'setup',
    foreshadowingNotes: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentWritingIndex, setCurrentWritingIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [chapterOutcomes, setChapterOutcomes] = useState<ChapterOutcome[]>([]);
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const [initialChapterCount, setInitialChapterCount] = useState(0);
  const [showTemplateBrowser, setShowTemplateBrowser] = useState(false);
  const [templateToLoad, setTemplateToLoad] = useState<StoryTemplate | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
  const [validationPrompt, setValidationPrompt] = useState<{
    chapterIndex: number;
    content: string;
    validationResult: { passed: boolean; feedback: string };
  } | null>(null);

  const handleStartStory = async (data: { title: string; genre: string; numChapters: number; readingLevel: ReadingLevel; characters: Character[]; initialIdea: string; systemPrompt?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const outline = await generateOutline(data.title, data.genre, data.numChapters, data.characters, data.initialIdea, data.readingLevel, data.systemPrompt);
      setState(prev => ({
        ...prev,
        ...data,
        outline: outline as Chapter[],
        currentStep: 'outline'
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to generate outline. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOutline = (updated: Chapter[]) => {
    setState(prev => ({ ...prev, outline: updated }));
  };

  const handleRequestChapterSuggestions = async (chapterIndex: number, userPrompt: string): Promise<Array<{ title: string; summary: string }>> => {
    try {
      const suggestions = await generateChapterSuggestions(
        state.title,
        state.genre,
        state.characters,
        state.outline,
        chapterIndex,
        userPrompt,
        state.readingLevel,
        state.systemPrompt
      );
      return suggestions;
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      throw error;
    }
  };

  const handleAddForeshadowingNote = (note: Omit<ForeshadowingNote, 'id' | 'createdAt'>) => {
    const newNote: ForeshadowingNote = {
      ...note,
      id: `foreshadow-${Date.now()}-${Math.random()}`,
      createdAt: Date.now(),
    };
    setState(prev => {
      const updatedNotes = [...(prev.foreshadowingNotes || []), newNote];
      const updatedOutline = addForeshadowingToAcceptanceCriteria(prev.outline, updatedNotes);
      return {
        ...prev,
        foreshadowingNotes: updatedNotes,
        outline: updatedOutline,
      };
    });
  };

  const handleDeleteForeshadowingNote = (noteId: string) => {
    setState(prev => {
      const updatedNotes = (prev.foreshadowingNotes || []).filter(note => note.id !== noteId);
      const updatedOutline = addForeshadowingToAcceptanceCriteria(prev.outline, updatedNotes);
      return {
        ...prev,
        foreshadowingNotes: updatedNotes,
        outline: updatedOutline,
      };
    });
  };

  const handleUpdateForeshadowingNote = (noteId: string, updatedNote: Omit<ForeshadowingNote, 'id' | 'createdAt'>) => {
    setState(prev => {
      const updatedNotes = (prev.foreshadowingNotes || []).map(note =>
        note.id === noteId
          ? { ...note, ...updatedNote }
          : note
      );
      const updatedOutline = addForeshadowingToAcceptanceCriteria(prev.outline, updatedNotes);
      return {
        ...prev,
        foreshadowingNotes: updatedNotes,
        outline: updatedOutline,
      };
    });
  };

  const handleConfirmOutline = () => {
    setState(prev => ({ ...prev, currentStep: 'generating' }));
  };

  const handleManualMode = () => {
    // Check if this is continuous mode (only 1 chapter initially)
    const isContinuous = state.outline.length === 1;
    setIsContinuousMode(isContinuous);
    setInitialChapterCount(state.outline.length);
    setState(prev => ({ ...prev, currentStep: 'manual-generation' }));
    // Initialize prompt for the first chapter
    updatePromptForNextChapter();
  };

  const updatePromptForNextChapter = () => {
    const nextIndex = state.outline.findIndex(ch => ch.status === 'pending');
    if (nextIndex === -1) return;

    const completedChapters = state.outline.slice(0, nextIndex).filter(c => c.status === 'completed');
    const previousSummary = completedChapters.length > 0
      ? "Previous chapters summary will be generated..."
      : "";

    const nextChapter = state.outline[nextIndex];
    const selectedCharacterIds = nextChapter.characterIds;

    const defaultPrompt = buildChapterPrompt(
      state.title,
      state.genre,
      state.characters,
      nextIndex,
      state.outline,
      previousSummary,
      selectedCharacterIds,
      state.readingLevel,
      state.foreshadowingNotes
    );

    setCurrentPrompt(defaultPrompt);
  };

  const handleUpdateChapter = (index: number, field: keyof Chapter, value: string) => {
    const updatedOutline = [...state.outline];
    updatedOutline[index] = { ...updatedOutline[index], [field]: value };
    setState(prev => ({ ...prev, outline: updatedOutline }));
  };

  const handleGenerateNextChapter = async (customPrompt: string) => {
    const nextIndex = state.outline.findIndex(ch => ch.status === 'pending');
    if (nextIndex === -1) return;

    setIsLoading(true);
    setError(null);

    try {
      const updatedOutline = [...state.outline];

      // Mark as generating
      updatedOutline[nextIndex] = { ...updatedOutline[nextIndex], status: 'generating' };
      setState(prev => ({ ...prev, outline: [...updatedOutline] }));

      // Get previous chapters summary
      const completedChapters = updatedOutline.slice(0, nextIndex).filter(c => c.status === 'completed');
      console.log(`[Chapter ${nextIndex + 1}] Found ${completedChapters.length} completed chapters before this one`);

      // Log chapter details for debugging
      completedChapters.forEach((ch) => {
        console.log(`  - Chapter ${ch.id}: "${ch.title}" (${ch.content ? ch.content.length : 0} chars)`);
      });

      const previousSummary = completedChapters.length > 0
        ? await summarizePreviousChapters(completedChapters)
        : "";

      // Update the outline with any newly generated detailed summaries
      // (summarizePreviousChapters may have generated summaries for chapters that didn't have them)
      completedChapters.forEach((ch) => {
        const index = updatedOutline.findIndex(c => c.id === ch.id);
        if (index !== -1 && ch.detailedSummary) {
          updatedOutline[index] = { ...updatedOutline[index], detailedSummary: ch.detailedSummary };
        }
      });
      setState(prev => ({ ...prev, outline: [...updatedOutline] }));

      console.log(`[Chapter ${nextIndex + 1}] Previous summary length: ${previousSummary.length} chars`);

      // Generate content with custom prompt if provided
      const content = await generateChapterContent(
        state.title,
        state.genre,
        state.characters,
        nextIndex,
        updatedOutline,
        previousSummary,
        customPrompt || undefined,
        state.readingLevel,
        state.systemPrompt,
        state.foreshadowingNotes
      );

      // Validate chapter if acceptance criteria is defined
      const currentChapter = updatedOutline[nextIndex];
      let validationResult: { passed: boolean; feedback: string } | undefined;

      if (currentChapter.acceptanceCriteria && currentChapter.acceptanceCriteria.trim()) {
        try {
          validationResult = await validateChapterContent(
            content,
            currentChapter.acceptanceCriteria,
            currentChapter.title,
            currentChapter.summary,
            previousSummary,
            state.genre
          );

          // Store validation result in chapter
          updatedOutline[nextIndex] = {
            ...updatedOutline[nextIndex],
            validationResult: {
              ...validationResult,
              timestamp: Date.now()
            }
          };

          // If validation failed, prompt user for retry
          if (!validationResult.passed) {
            updatedOutline[nextIndex] = {
              ...updatedOutline[nextIndex],
              content,
              status: 'completed'
            };
            setState(prev => ({ ...prev, outline: [...updatedOutline] }));
            setValidationPrompt({
              chapterIndex: nextIndex,
              content,
              validationResult
            });
            setIsLoading(false);
            return; // Exit early to show validation prompt
          }
        } catch (err) {
          console.error("Validation failed:", err);
          // Continue even if validation fails
        }
      }

      // Update with completed content
      updatedOutline[nextIndex] = { ...updatedOutline[nextIndex], content, status: 'completed' };
      setState(prev => ({ ...prev, outline: [...updatedOutline] }));

      // Generate detailed summary for this chapter
      try {
        console.log(`[Chapter ${nextIndex + 1}] Generating detailed summary...`);
        const detailedSummary = await generateDetailedChapterSummary(updatedOutline[nextIndex]);
        updatedOutline[nextIndex] = { ...updatedOutline[nextIndex], detailedSummary };
        setState(prev => ({ ...prev, outline: [...updatedOutline] }));
        console.log(`[Chapter ${nextIndex + 1}] Detailed summary generated (${detailedSummary.length} chars)`);
      } catch (err) {
        console.error(`[Chapter ${nextIndex + 1}] Failed to generate detailed summary:`, err);
        // Continue even if summary generation fails
      }

      // In continuous mode, generate outcomes after completing a chapter
      if (isContinuousMode) {
        try {
          const completedChaptersForOutcomes = updatedOutline.filter(c => c.status === 'completed');
          const outcomes = await generateNextChapterOutcomes(
            state.title,
            state.genre,
            state.characters,
            completedChaptersForOutcomes,
            state.readingLevel,
            state.systemPrompt,
            state.foreshadowingNotes
          );
          setChapterOutcomes(outcomes);
          // Update state with outcomes for persistence
          setState(prev => ({ ...prev, chapterOutcomes: outcomes }));
        } catch (err: any) {
          console.error("Failed to generate outcomes", err);
          // Don't fail the whole operation if outcomes fail
          setChapterOutcomes([]);
          setState(prev => ({ ...prev, chapterOutcomes: [] }));
        }
      }

      // Update prompt for next chapter
      setTimeout(() => {
        updatePromptForNextChapter();
      }, 100);
    } catch (err: any) {
      console.error("Chapter generation failed", err);
      const updatedOutline = [...state.outline];
      updatedOutline[nextIndex] = { ...updatedOutline[nextIndex], status: 'error' };
      setState(prev => ({ ...prev, outline: [...updatedOutline] }));
      setError(`Failed to generate chapter ${nextIndex + 1}.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewStory = () => {
    setState(prev => ({ ...prev, currentStep: 'reader' }));
  };

  const handleBackFromReader = () => {
    setState(prev => ({ ...prev, currentStep: 'manual-generation' }));
  };

  const handleSelectOutcome = (outcome: ChapterOutcome) => {
    // Add a new chapter based on the selected outcome
    const newChapterId = state.outline.length + 1;
    const newChapter: Chapter = {
      id: newChapterId,
      title: outcome.title,
      summary: outcome.summary,
      content: '',
      status: 'pending',
    };

    setState(prev => {
      const updatedOutline = [...prev.outline, newChapter];
      // Apply foreshadowing to acceptance criteria for the new outline
      const outlineWithForeshadowing = addForeshadowingToAcceptanceCriteria(
        updatedOutline,
        prev.foreshadowingNotes || []
      );
      return {
        ...prev,
        outline: outlineWithForeshadowing,
        chapterOutcomes: [], // Clear outcomes after selection
      };
    });

    // Clear outcomes after selection
    setChapterOutcomes([]);

    // Update prompt for the new chapter
    setTimeout(() => {
      updatePromptForNextChapter();
    }, 100);
  };

  const handleGenerateOutcomes = async () => {
    if (!isContinuousMode) return;

    setIsLoading(true);
    try {
      const completedChapters = state.outline.filter(c => c.status === 'completed');
      const outcomes = await generateNextChapterOutcomes(
        state.title,
        state.genre,
        state.characters,
        completedChapters,
        state.readingLevel,
        state.systemPrompt,
        state.foreshadowingNotes
      );
      setChapterOutcomes(outcomes);
      // Update state with outcomes for persistence
      setState(prev => ({ ...prev, chapterOutcomes: outcomes }));
    } catch (err: any) {
      console.error("Failed to generate outcomes", err);
      setError('Failed to generate chapter suggestions. Please try again.');
      setChapterOutcomes([]);
      setState(prev => ({ ...prev, chapterOutcomes: [] }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptValidation = () => {
    // User accepts the chapter despite validation issues
    setValidationPrompt(null);
    // Update prompt for next chapter
    setTimeout(() => {
      updatePromptForNextChapter();
    }, 100);
  };

  const handleRetryGeneration = async () => {
    if (!validationPrompt) return;

    const { chapterIndex, validationResult } = validationPrompt;
    setValidationPrompt(null);

    // Use the validation feedback as regeneration feedback
    await handleRegenerateChapter(chapterIndex, validationResult.feedback);
  };

  const handleRegenerateChapter = async (chapterIndex: number, feedback: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedOutline = [...state.outline];

      // Mark as generating
      updatedOutline[chapterIndex] = { ...updatedOutline[chapterIndex], status: 'generating' };
      setState(prev => ({ ...prev, outline: [...updatedOutline] }));

      // Get previous chapters summary
      const completedChapters = updatedOutline.slice(0, chapterIndex).filter(c => c.status === 'completed');
      console.log(`[Regenerate Chapter ${chapterIndex + 1}] Found ${completedChapters.length} completed chapters before this one`);

      // Log chapter details for debugging
      completedChapters.forEach((ch) => {
        console.log(`  - Chapter ${ch.id}: "${ch.title}" (${ch.content ? ch.content.length : 0} chars)`);
      });

      const previousSummary = completedChapters.length > 0
        ? await summarizePreviousChapters(completedChapters)
        : "";

      // Update the outline with any newly generated detailed summaries
      // (summarizePreviousChapters may have generated summaries for chapters that didn't have them)
      completedChapters.forEach((ch) => {
        const index = updatedOutline.findIndex(c => c.id === ch.id);
        if (index !== -1 && ch.detailedSummary) {
          updatedOutline[index] = { ...updatedOutline[index], detailedSummary: ch.detailedSummary };
        }
      });
      setState(prev => ({ ...prev, outline: [...updatedOutline] }));

      console.log(`[Regenerate Chapter ${chapterIndex + 1}] Previous summary length: ${previousSummary.length} chars`);

      // Regenerate content with user feedback
      const content = await regenerateChapterContent(
        state.title,
        state.genre,
        state.characters,
        chapterIndex,
        updatedOutline,
        previousSummary,
        feedback,
        state.readingLevel,
        state.systemPrompt,
        state.foreshadowingNotes
      );

      // Update with regenerated content
      updatedOutline[chapterIndex] = { ...updatedOutline[chapterIndex], content, status: 'completed' };
      setState(prev => ({ ...prev, outline: [...updatedOutline] }));

      // Generate detailed summary for the regenerated chapter
      try {
        console.log(`[Regenerate Chapter ${chapterIndex + 1}] Generating detailed summary...`);
        const detailedSummary = await generateDetailedChapterSummary(updatedOutline[chapterIndex]);
        updatedOutline[chapterIndex] = { ...updatedOutline[chapterIndex], detailedSummary };
        setState(prev => ({ ...prev, outline: [...updatedOutline] }));
        console.log(`[Regenerate Chapter ${chapterIndex + 1}] Detailed summary generated (${detailedSummary.length} chars)`);
      } catch (err) {
        console.error(`[Regenerate Chapter ${chapterIndex + 1}] Failed to generate detailed summary:`, err);
        // Continue even if summary generation fails
      }
    } catch (err: any) {
      console.error("Chapter regeneration failed", err);
      const updatedOutline = [...state.outline];
      updatedOutline[chapterIndex] = { ...updatedOutline[chapterIndex], status: 'completed' }; // Keep as completed with old content
      setState(prev => ({ ...prev, outline: [...updatedOutline] }));
      setError(`Failed to regenerate chapter ${chapterIndex + 1}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Update prompt when chapter outline changes in manual mode
  useEffect(() => {
    if (state.currentStep === 'manual-generation') {
      updatePromptForNextChapter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.outline, state.currentStep]);

  // Automated writing effect
  useEffect(() => {
    if (state.currentStep !== 'generating') return;

    const writeChapters = async () => {
      let previousSummary = "";
      const updatedOutline = [...state.outline];

      for (let i = 0; i < state.outline.length; i++) {
        setCurrentWritingIndex(i);
        setGenerationProgress(((i) / state.outline.length) * 100);

        try {
          // Mark as generating
          updatedOutline[i] = { ...updatedOutline[i], status: 'generating' };
          setState(prev => ({ ...prev, outline: [...updatedOutline] }));

          const content = await generateChapterContent(
            state.title,
            state.genre,
            state.characters,
            i,
            updatedOutline,
            previousSummary,
            undefined,
            state.readingLevel,
            state.systemPrompt,
            state.foreshadowingNotes
          );

          updatedOutline[i] = { ...updatedOutline[i], content, status: 'completed' };
          setState(prev => ({ ...prev, outline: [...updatedOutline] }));

          // Generate detailed summary for this chapter
          try {
            console.log(`[Batch Chapter ${i + 1}] Generating detailed summary...`);
            const detailedSummary = await generateDetailedChapterSummary(updatedOutline[i]);
            updatedOutline[i] = { ...updatedOutline[i], detailedSummary };
            setState(prev => ({ ...prev, outline: [...updatedOutline] }));
            console.log(`[Batch Chapter ${i + 1}] Detailed summary generated (${detailedSummary.length} chars)`);
          } catch (err) {
            console.error(`[Batch Chapter ${i + 1}] Failed to generate detailed summary:`, err);
            // Continue even if summary generation fails
          }

          // Update summary for next chapter
          if (i < state.outline.length - 1) {
            const completedChapters = updatedOutline.filter(c => c.status === 'completed');
            previousSummary = await summarizePreviousChapters(completedChapters);

            // Update the outline with any newly generated detailed summaries
            // (summarizePreviousChapters may have generated summaries for chapters that didn't have them)
            completedChapters.forEach((ch) => {
              const index = updatedOutline.findIndex(c => c.id === ch.id);
              if (index !== -1 && ch.detailedSummary) {
                updatedOutline[index] = { ...updatedOutline[index], detailedSummary: ch.detailedSummary };
              }
            });
            setState(prev => ({ ...prev, outline: [...updatedOutline] }));
          }
        } catch (err: any) {
          console.error("Chapter generation failed", err);
          updatedOutline[i] = { ...updatedOutline[i], status: 'error' };
          setState(prev => ({ ...prev, outline: [...updatedOutline] }));
          setError(`Failed to write chapter ${i + 1}.`);
          break;
        }
      }

      setGenerationProgress(100);
      setCurrentWritingIndex(-1);

      // Delay transition for visual satisfaction
      setTimeout(() => {
        setState(prev => ({ ...prev, currentStep: 'reader' }));
      }, 1500);
    };

    writeChapters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentStep]);

  const handleTemplatesClick = () => {
    setShowTemplateBrowser(true);
  };

  const handleNewStoryClick = () => {
    // Reset to setup step
    setState({
      title: '',
      genre: 'Fantasy',
      numChapters: 5,
      readingLevel: 'young-adult',
      characters: [],
      outline: [],
      currentStep: 'setup',
    });
    setError(null);
    setTemplateToLoad(null);
  };

  const handleSelectTemplate = (template: StoryTemplate) => {
    setTemplateToLoad(template);
    setShowTemplateBrowser(false);
  };

  const handleLibraryClick = () => {
    setShowLibrary(true);
  };

  const handleLoadStory = async (storyId: string) => {
    const loadedState = await loadStory(storyId);
    if (loadedState) {
      // Apply foreshadowing to acceptance criteria after loading
      const outlineWithForeshadowing = addForeshadowingToAcceptanceCriteria(
        loadedState.outline,
        loadedState.foreshadowingNotes || []
      );

      // Detect if this is continuous mode (story has completed chapters and can continue)
      const hasCompletedChapters = loadedState.outline.some(ch => ch.status === 'completed');
      const hasIncompleteChapters = loadedState.outline.some(ch => ch.status === 'pending');
      const isContinuous = hasCompletedChapters && !hasIncompleteChapters;

      setIsContinuousMode(isContinuous);
      setInitialChapterCount(loadedState.outline.length);

      setState({
        ...loadedState,
        outline: outlineWithForeshadowing,
        // If story has completed chapters, set to manual-generation to show continue options
        currentStep: hasCompletedChapters ? 'manual-generation' : loadedState.currentStep,
      });

      // Restore chapter outcomes if they exist
      if (loadedState.chapterOutcomes && loadedState.chapterOutcomes.length > 0) {
        setChapterOutcomes(loadedState.chapterOutcomes);
      } else {
        setChapterOutcomes([]);
      }

      // Initialize prompt for next chapter if in manual mode
      if (hasCompletedChapters) {
        setTimeout(() => {
          updatePromptForNextChapter();
        }, 100);
      }

      setCurrentStoryId(storyId);
      setError(null);
      setShowLibrary(false);
    } else {
      setError('Failed to load story');
    }
  };

  const handleSaveStory = async () => {
    try {
      const savedStory = await saveStory(state);
      setCurrentStoryId(savedStory.id);
      alert('Story saved successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to save story');
    }
  };

  // Auto-save when state changes (debounced)
  useEffect(() => {
    // Only auto-save if we have a title and outline
    if (state.title && state.outline.length > 0) {
      const timeoutId = setTimeout(async () => {
        try {
          const savedStory = await saveStory(state);
          setCurrentStoryId(savedStory.id);
          console.log('Story auto-saved');
        } catch (err) {
          console.error('Auto-save failed:', err);
        }
      }, 2000); // Debounce for 2 seconds

      return () => clearTimeout(timeoutId);
    }
  }, [state]);

  return (
    <Layout
      onTemplatesClick={handleTemplatesClick}
      onNewStoryClick={handleNewStoryClick}
      onLibraryClick={handleLibraryClick}
    >
      {error && (
        <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L10 8.586 8.707 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {state.currentStep === 'setup' && (
        <StoryForm
          onStart={handleStartStory}
          isLoading={isLoading}
          initialTemplate={templateToLoad || undefined}
        />
      )}

      {showTemplateBrowser && (
        <TemplateBrowser
          onSelectTemplate={handleSelectTemplate}
          onClose={() => setShowTemplateBrowser(false)}
        />
      )}

      {showLibrary && (
        <Library
          onLoadStory={handleLoadStory}
          onClose={() => setShowLibrary(false)}
        />
      )}

      {state.currentStep === 'outline' && (
        <>
          <ForeshadowingManager
            foreshadowingNotes={state.foreshadowingNotes || []}
            numChapters={state.numChapters}
            onAddNote={handleAddForeshadowingNote}
            onDeleteNote={handleDeleteForeshadowingNote}
            onUpdateNote={handleUpdateForeshadowingNote}
          />
          <OutlineEditor
            chapters={state.outline}
            onUpdate={handleUpdateOutline}
            onConfirm={handleConfirmOutline}
            onManualMode={handleManualMode}
            onSave={handleSaveStory}
            onRequestSuggestions={handleRequestChapterSuggestions}
          />
        </>
      )}

      {state.currentStep === 'manual-generation' && (
        <>
          <ManualChapterGenerator
            title={state.title}
            chapters={state.outline}
            characters={state.characters}
            currentPrompt={currentPrompt}
            systemPrompt={state.systemPrompt}
            genre={state.genre}
            onUpdateChapter={handleUpdateChapter}
            onUpdatePrompt={setCurrentPrompt}
            onUpdateSystemPrompt={(prompt) => setState(prev => ({ ...prev, systemPrompt: prompt }))}
            onGenerateNext={handleGenerateNextChapter}
            onRegenerateChapter={handleRegenerateChapter}
            onViewStory={handleViewStory}
            isGenerating={isLoading}
            isContinuousMode={isContinuousMode}
            chapterOutcomes={chapterOutcomes}
            onSelectOutcome={handleSelectOutcome}
            onGenerateOutcomes={handleGenerateOutcomes}
            onSave={handleSaveStory}
            foreshadowingNotes={state.foreshadowingNotes}
            onAddForeshadowingNote={handleAddForeshadowingNote}
            onUpdateForeshadowingNote={handleUpdateForeshadowingNote}
            onDeleteForeshadowingNote={handleDeleteForeshadowingNote}
          />

          {/* Validation Prompt Modal */}
          {validationPrompt && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 mb-1">
                        Chapter Validation Issues
                      </h3>
                      <p className="text-sm text-slate-600">
                        Chapter {validationPrompt.chapterIndex + 1}: {state.outline[validationPrompt.chapterIndex]?.title}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-amber-900 mb-1">Validation Feedback</h4>
                        <p className="text-sm text-amber-800">{validationPrompt.validationResult.feedback}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Acceptance Criteria</h4>
                    <p className="text-sm text-slate-700">
                      {state.outline[validationPrompt.chapterIndex]?.acceptanceCriteria}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-600 mb-4">
                      The generated chapter doesn't fully meet the acceptance criteria or has cohesion issues with previous chapters.
                      You can either accept the chapter as-is or regenerate it with the validation feedback.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleAcceptValidation}
                        className="flex-1 px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Accept Chapter
                      </button>
                      <button
                        onClick={handleRetryGeneration}
                        className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                        Regenerate Chapter
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {state.currentStep === 'generating' && (
        <div className="max-w-2xl mx-auto space-y-12 py-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-slate-900">Your story is being written...</h2>
            <p className="text-slate-500">The Lumina engine is weaving your plot threads into a masterpiece.</p>
          </div>

          <div className="relative pt-1">
            <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-slate-200">
              <div
                style={{ width: `${generationProgress}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600 transition-all duration-500"
              />
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-400">
              <span>PROLOGUE</span>
              <span>EPILOGUE</span>
            </div>
          </div>

          <div className="space-y-4">
            {state.outline.map((ch, idx) => (
              <div key={ch.id} className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                idx === currentWritingIndex ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-100'
              }`}>
                <div className="flex items-center gap-4">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                     ch.status === 'completed' ? 'bg-green-100 text-green-600' :
                     ch.status === 'generating' ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-100 text-slate-400'
                   }`}>
                     {ch.status === 'completed' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                     ) : idx + 1}
                   </div>
                   <div>
                     <h4 className="font-bold text-slate-800">{ch.title}</h4>
                     <p className="text-xs text-slate-500">{ch.status === 'generating' ? 'Writing...' : ch.status === 'completed' ? 'Finished' : 'Waiting...'}</p>
                   </div>
                </div>
                {ch.status === 'generating' && (
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Save Progress Button */}
          <div className="flex justify-center pt-6">
            <button
              onClick={handleSaveStory}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
              </svg>
              Save Progress
            </button>
          </div>
        </div>
      )}

      {state.currentStep === 'reader' && (
        <StoryViewer
          title={state.title}
          chapters={state.outline}
          genre={state.genre}
          onRegenerateChapter={handleRegenerateChapter}
          isRegenerating={isLoading}
          onSave={handleSaveStory}
          onBack={handleBackFromReader}
          foreshadowingNotes={state.foreshadowingNotes}
        />
      )}
    </Layout>
  );
};

export default App;
