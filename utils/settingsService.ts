/**
 * Service for managing user settings in localStorage
 */

export interface AISettings {
  provider: 'gemini' | 'openai' | 'local';
  geminiApiKey?: string;
  openaiApiKey?: string;
  localApiUrl?: string;
  localApiKey?: string;
  debugMode?: boolean;
  models: {
    gemini: {
      outline: string;
      chapter: string;
      summary: string;
    };
    openai: {
      outline: string;
      chapter: string;
      summary: string;
    };
    local: {
      outline: string;
      chapter: string;
      summary: string;
    };
  };
  maxTokens: {
    gemini: {
      outline: number;
      chapter: number;
      summary: number;
    };
    openai: {
      outline: number;
      chapter: number;
      summary: number;
    };
    local: {
      outline: number;
      chapter: number;
      summary: number;
    };
  };
}

const SETTINGS_KEY = 'lumina-ai-settings';

// Default settings based on environment variables
const getDefaultSettings = (): AISettings => ({
  provider: (process.env.AI_PROVIDER as 'gemini' | 'openai' | 'local') || 'gemini',
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  localApiUrl: process.env.LOCAL_API_URL || 'http://localhost:1234/v1',
  localApiKey: process.env.LOCAL_API_KEY || 'not-needed',
  debugMode: false,
  models: {
    gemini: {
      outline: 'gemini-3-flash-preview',
      chapter: 'gemini-3-pro-preview',
      summary: 'gemini-3-flash-preview',
    },
    openai: {
      outline: 'gpt-4o-mini',
      chapter: 'gpt-4o',
      summary: 'gpt-4o-mini',
    },
    local: {
      outline: process.env.LOCAL_MODEL_OUTLINE || process.env.LOCAL_MODEL?.split(',')[0] || 'local-model',
      chapter: process.env.LOCAL_MODEL_CHAPTER || process.env.LOCAL_MODEL?.split(',')[0] || 'local-model',
      summary: process.env.LOCAL_MODEL_SUMMARY || process.env.LOCAL_MODEL?.split(',')[0] || 'local-model',
    },
  },
  maxTokens: {
    gemini: {
      outline: 8192,
      chapter: 8192,
      summary: 4096,
    },
    openai: {
      outline: 4096,
      chapter: 16384,
      summary: 4096,
    },
    local: {
      outline: 4096,
      chapter: 8192,
      summary: 2048,
    },
  },
});

/**
 * Get current AI settings from localStorage or defaults
 */
export const getSettings = (): AISettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all fields exist
      const defaults = getDefaultSettings();
      return {
        ...defaults,
        ...parsed,
        models: {
          gemini: { ...defaults.models.gemini, ...parsed.models?.gemini },
          openai: { ...defaults.models.openai, ...parsed.models?.openai },
          local: { ...defaults.models.local, ...parsed.models?.local },
        },
      };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return getDefaultSettings();
};

/**
 * Save AI settings to localStorage
 */
export const saveSettings = (settings: AISettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw new Error('Failed to save settings');
  }
};

/**
 * Reset settings to defaults
 */
export const resetSettings = (): AISettings => {
  const defaults = getDefaultSettings();
  saveSettings(defaults);
  return defaults;
};

/**
 * Check if settings have been customized
 */
export const hasCustomSettings = (): boolean => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored !== null;
  } catch {
    return false;
  }
};

