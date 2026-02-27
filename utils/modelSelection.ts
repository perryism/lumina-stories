/**
 * Utility for managing local model selection
 */

const SELECTED_MODEL_KEY = 'lumina-selected-local-model';

/**
 * Parse the LOCAL_MODEL environment variable into an array of model names
 * @returns Array of available model names
 */
export function getAvailableModels(): string[] {
  const localModelEnv = process.env.LOCAL_MODEL || 'local-model';
  
  // Split by comma and trim whitespace
  const models = localModelEnv
    .split(',')
    .map(model => model.trim())
    .filter(model => model.length > 0);
  
  return models.length > 0 ? models : ['local-model'];
}

/**
 * Get the currently selected model from localStorage
 * Falls back to the first available model if none is selected
 * @returns The selected model name
 */
export function getSelectedModel(): string {
  const availableModels = getAvailableModels();
  
  // Try to get from localStorage
  const stored = localStorage.getItem(SELECTED_MODEL_KEY);
  
  // If stored model is in the available list, use it
  if (stored && availableModels.includes(stored)) {
    return stored;
  }
  
  // Otherwise, return the first available model
  return availableModels[0];
}

/**
 * Set the selected model in localStorage
 * @param modelName The model name to select
 */
export function setSelectedModel(modelName: string): void {
  const availableModels = getAvailableModels();
  
  // Only set if the model is in the available list
  if (availableModels.includes(modelName)) {
    localStorage.setItem(SELECTED_MODEL_KEY, modelName);
  } else {
    console.warn(`Model "${modelName}" is not in the available models list`);
  }
}

/**
 * Check if multiple models are available
 * @returns true if more than one model is available
 */
export function hasMultipleModels(): boolean {
  return getAvailableModels().length > 1;
}

/**
 * Get the AI provider from environment
 * @returns The AI provider type
 */
export function getAIProvider(): 'gemini' | 'openai' | 'local' {
  return (process.env.AI_PROVIDER as 'gemini' | 'openai' | 'local') || 'gemini';
}

/**
 * Check if the current provider is local
 * @returns true if using local provider
 */
export function isLocalProvider(): boolean {
  return getAIProvider() === 'local';
}

