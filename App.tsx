
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { StoryForm } from './components/StoryForm';
import { OutlineEditor } from './components/OutlineEditor';
import { ManualChapterGenerator } from './components/ManualChapterGenerator';
import { StoryViewer } from './components/StoryViewer';
import { StoryState, Chapter, Character } from './types';
import { generateOutline, generateChapterContent, summarizePreviousChapters, buildChapterPrompt } from './services/aiService';

const App: React.FC = () => {
  const [state, setState] = useState<StoryState>({
    title: '',
    genre: 'Fantasy',
    numChapters: 5,
    characters: [],
    outline: [],
    currentStep: 'setup',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentWritingIndex, setCurrentWritingIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');

  const handleStartStory = async (data: { title: string; genre: string; numChapters: number; characters: Character[]; initialIdea: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const outline = await generateOutline(data.title, data.genre, data.numChapters, data.characters, data.initialIdea);
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

  const handleConfirmOutline = () => {
    setState(prev => ({ ...prev, currentStep: 'generating' }));
  };

  const handleManualMode = () => {
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

    const defaultPrompt = buildChapterPrompt(
      state.title,
      state.genre,
      state.characters,
      nextIndex,
      state.outline,
      previousSummary
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
      const previousSummary = completedChapters.length > 0
        ? await summarizePreviousChapters(completedChapters)
        : "";

      // Generate content with custom prompt if provided
      const content = await generateChapterContent(
        state.title,
        state.genre,
        state.characters,
        nextIndex,
        updatedOutline,
        previousSummary,
        customPrompt || undefined
      );

      // Update with completed content
      updatedOutline[nextIndex] = { ...updatedOutline[nextIndex], content, status: 'completed' };
      setState(prev => ({ ...prev, outline: [...updatedOutline] }));

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
            previousSummary
          );

          updatedOutline[i] = { ...updatedOutline[i], content, status: 'completed' };
          setState(prev => ({ ...prev, outline: [...updatedOutline] }));

          // Update summary for next chapter
          if (i < state.outline.length - 1) {
            previousSummary = await summarizePreviousChapters(updatedOutline.filter(c => c.status === 'completed'));
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

  return (
    <Layout>
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
        <StoryForm onStart={handleStartStory} isLoading={isLoading} />
      )}

      {state.currentStep === 'outline' && (
        <OutlineEditor
          chapters={state.outline}
          onUpdate={handleUpdateOutline}
          onConfirm={handleConfirmOutline}
          onManualMode={handleManualMode}
        />
      )}

      {state.currentStep === 'manual-generation' && (
        <ManualChapterGenerator
          title={state.title}
          chapters={state.outline}
          currentPrompt={currentPrompt}
          onUpdateChapter={handleUpdateChapter}
          onUpdatePrompt={setCurrentPrompt}
          onGenerateNext={handleGenerateNextChapter}
          onViewStory={handleViewStory}
          isGenerating={isLoading}
        />
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
        </div>
      )}

      {state.currentStep === 'reader' && (
        <StoryViewer title={state.title} chapters={state.outline} genre={state.genre} />
      )}
    </Layout>
  );
};

export default App;
