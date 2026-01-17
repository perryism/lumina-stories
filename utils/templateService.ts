import { StoryTemplate } from '../types';

const TEMPLATES_STORAGE_KEY = 'lumina-stories-templates';

export interface SavedTemplate extends StoryTemplate {
  id: string;
  savedAt: string;
}

/**
 * Save a story template to a YAML file in the templates folder
 * Uses the backend API to save directly to the templates folder
 */
export const saveTemplateToTemplatesFolder = async (template: StoryTemplate): Promise<string> => {
  // Generate filename from title
  const filename = `${template.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.yaml`;

  // Convert template to YAML format
  const yamlContent = templateToYAML(template);

  try {
    // Try to save via API first
    const API_SERVER_URL = process.env.API_SERVER_URL || 'http://localhost:3001';
    const response = await fetch(`${API_SERVER_URL}/api/save-template`, {
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
      throw new Error(error.message || 'Failed to save template');
    }

    return filename;
  } catch (error) {
    // If API is not available, fall back to download
    if ((error as Error).message.includes('fetch')) {
      console.warn('Template server not running, falling back to download');
      const blob = new Blob([yamlContent], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      throw new Error('Template server not running. Please start it with: npm run server');
    }
    throw error;
  }
};

/**
 * Save a story template to a YAML file
 * Uses the File System Access API to allow users to save files locally
 */
export const saveTemplateToFile = async (template: StoryTemplate, filename?: string): Promise<void> => {
  try {
    // Convert template to YAML format (manual serialization to avoid external dependencies)
    const yamlContent = templateToYAML(template);

    // Create a blob with the YAML content
    const blob = new Blob([yamlContent], { type: 'text/yaml' });

    // Use File System Access API if available, otherwise fall back to download
    if ('showSaveFilePicker' in window) {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename || 'story-template.yaml',
        types: [{
          description: 'YAML Template',
          accept: { 'text/yaml': ['.yaml', '.yml'] },
        }],
      });

      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
    } else {
      // Fallback: trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'story-template.yaml';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    if ((error as any).name === 'AbortError') {
      // User cancelled the save dialog
      return;
    }
    throw new Error(`Failed to save template: ${(error as Error).message}`);
  }
};

/**
 * Load a story template from a YAML file
 * Uses the File System Access API to allow users to select files
 */
export const loadTemplateFromFile = async (): Promise<StoryTemplate> => {
  try {
    let fileContent: string;

    // Use File System Access API if available, otherwise fall back to file input
    if ('showOpenFilePicker' in window) {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [{
          description: 'YAML Template',
          accept: { 'text/yaml': ['.yaml', '.yml'] },
        }],
        multiple: false,
      });

      const file = await handle.getFile();
      fileContent = await file.text();
    } else {
      // Fallback: use file input
      fileContent = await new Promise<string>((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.yaml,.yml';
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) {
            reject(new Error('No file selected'));
            return;
          }
          const text = await file.text();
          resolve(text);
        };
        input.click();
      });
    }

    // Parse YAML content
    const template = parseYAMLTemplate(fileContent);
    return template;
  } catch (error) {
    if ((error as any).name === 'AbortError') {
      throw new Error('File selection cancelled');
    }
    throw new Error(`Failed to load template: ${(error as Error).message}`);
  }
};

/**
 * Convert a StoryTemplate to YAML format
 */
const templateToYAML = (template: StoryTemplate): string => {
  const lines: string[] = [];

  lines.push('# Lumina Stories Template');
  lines.push('# Generated: ' + new Date().toISOString());
  lines.push('');
  lines.push(`title: "${escapeYAMLString(template.title)}"`);
  lines.push(`genre: "${escapeYAMLString(template.genre)}"`);
  lines.push(`numChapters: ${template.numChapters}`);
  lines.push(`readingLevel: "${template.readingLevel}"`);
  lines.push('');
  lines.push('plotOutline: |');
  template.plotOutline.split('\n').forEach(line => {
    lines.push(`  ${line}`);
  });
  lines.push('');

  if (template.systemPrompt) {
    lines.push('systemPrompt: |');
    template.systemPrompt.split('\n').forEach(line => {
      lines.push(`  ${line}`);
    });
    lines.push('');
  }

  lines.push('characters:');
  if (template.characters.length === 0) {
    lines.push('  []');
  } else {
    template.characters.forEach((char, index) => {
      lines.push(`  - id: "${escapeYAMLString(char.id)}"`);
      lines.push(`    name: "${escapeYAMLString(char.name)}"`);
      lines.push(`    attributes: "${escapeYAMLString(char.attributes)}"`);
    });
  }

  return lines.join('\n');
};

/**
 * Parse YAML content into a StoryTemplate
 */
const parseYAMLTemplate = (yamlContent: string): StoryTemplate => {
  const lines = yamlContent.split('\n');
  const template: any = {
    characters: []
  };

  let currentKey: string | null = null;
  let currentMultiline: string[] = [];
  let inCharacters = false;
  let currentCharacter: any = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (trimmed.startsWith('#') || trimmed === '') {
      continue;
    }

    // Handle multiline strings
    if (currentKey && (line.startsWith('  ') || line.startsWith('\t'))) {
      currentMultiline.push(line.replace(/^  /, ''));
      continue;
    } else if (currentKey && currentMultiline.length > 0) {
      template[currentKey] = currentMultiline.join('\n');
      currentKey = null;
      currentMultiline = [];
    }

    // Parse key-value pairs
    if (trimmed.includes(':')) {
      const colonIndex = trimmed.indexOf(':');
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      if (key === 'characters') {
        inCharacters = true;
        if (value === '[]') {
          template.characters = [];
        }
        continue;
      }

      if (inCharacters && line.startsWith('  - ')) {
        // New character
        if (currentCharacter) {
          template.characters.push(currentCharacter);
        }
        currentCharacter = {};
        const charKey = key.replace('- ', '');
        currentCharacter[charKey] = unescapeYAMLString(value);
      } else if (inCharacters && line.startsWith('    ')) {
        // Character property
        if (currentCharacter) {
          currentCharacter[key] = unescapeYAMLString(value);
        }
      } else if (value === '|') {
        // Multiline string
        currentKey = key;
        currentMultiline = [];
      } else if (value) {
        // Simple value
        const unquoted = unescapeYAMLString(value);
        if (key === 'numChapters') {
          template[key] = parseInt(unquoted);
        } else {
          template[key] = unquoted;
        }
      }
    }
  }

  // Add last character if exists
  if (currentCharacter) {
    template.characters.push(currentCharacter);
  }

  // Add last multiline if exists
  if (currentKey && currentMultiline.length > 0) {
    template[currentKey] = currentMultiline.join('\n');
  }

  // Validate required fields
  if (!template.title || !template.genre || !template.numChapters || !template.readingLevel || !template.plotOutline) {
    throw new Error('Invalid template: missing required fields');
  }

  return template as StoryTemplate;
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
  // Remove quotes if present
  let result = str.replace(/^["']|["']$/g, '');
  // Unescape special characters
  result = result.replace(/\\"/g, '"').replace(/\\n/g, '\n');
  return result;
};

/**
 * Save a template to localStorage
 */
export const saveTemplateToStorage = (template: StoryTemplate, name?: string): SavedTemplate => {
  const savedTemplate: SavedTemplate = {
    ...template,
    id: Date.now().toString(),
    savedAt: new Date().toISOString(),
  };

  const templates = getTemplatesFromStorage();
  templates.push(savedTemplate);
  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));

  return savedTemplate;
};

/**
 * Get all templates from localStorage
 */
export const getTemplatesFromStorage = (): SavedTemplate[] => {
  try {
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load templates from storage:', error);
    return [];
  }
};

/**
 * Delete a template from localStorage
 */
export const deleteTemplateFromStorage = (id: string): void => {
  const templates = getTemplatesFromStorage();
  const filtered = templates.filter(t => t.id !== id);
  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(filtered));
};

/**
 * Update a template in localStorage
 */
export const updateTemplateInStorage = (id: string, template: StoryTemplate): SavedTemplate | null => {
  const templates = getTemplatesFromStorage();
  const index = templates.findIndex(t => t.id === id);

  if (index === -1) return null;

  const updated: SavedTemplate = {
    ...template,
    id,
    savedAt: templates[index].savedAt,
  };

  templates[index] = updated;
  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));

  return updated;
};

/**
 * Import a template from file and save to storage
 */
export const importTemplateToStorage = async (): Promise<SavedTemplate> => {
  const template = await loadTemplateFromFile();
  return saveTemplateToStorage(template);
};

/**
 * Export a template from storage to file
 */
export const exportTemplateFromStorage = async (savedTemplate: SavedTemplate): Promise<void> => {
  const { id, savedAt, ...template } = savedTemplate;
  const filename = `${template.title.toLowerCase().replace(/\s+/g, '-')}-template.yaml`;
  await saveTemplateToFile(template, filename);
};

