import { StoryTemplate } from '../types';

export interface TemplateFile {
  id: string;
  filename: string;
  template: StoryTemplate;
}

/**
 * Parse YAML content into a StoryTemplate
 * This is a simplified parser for our specific YAML structure
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
    if (currentKey && (line.startsWith('  ') || line.startsWith('\t')) && !inCharacters) {
      currentMultiline.push(line.replace(/^  /, ''));
      continue;
    } else if (currentKey && currentMultiline.length > 0 && !inCharacters) {
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
 * Load all templates from the templates folder
 * Uses Vite's import.meta.glob to load YAML files at build time
 */
export const loadAllTemplates = async (): Promise<TemplateFile[]> => {
  // Use Vite's glob import to load all YAML files from templates folder
  const templateModules = import.meta.glob('/templates/*.yaml', { 
    query: '?raw',
    import: 'default'
  });
  
  const templates: TemplateFile[] = [];
  
  for (const path in templateModules) {
    try {
      const content = await templateModules[path]() as string;
      const filename = path.split('/').pop() || 'unknown.yaml';
      const id = filename.replace('.yaml', '');
      
      const template = parseYAMLTemplate(content);
      
      templates.push({
        id,
        filename,
        template
      });
    } catch (error) {
      console.error(`Failed to load template ${path}:`, error);
    }
  }
  
  return templates;
};

/**
 * Load a specific template by ID
 */
export const loadTemplateById = async (id: string): Promise<StoryTemplate | null> => {
  const templates = await loadAllTemplates();
  const found = templates.find(t => t.id === id);
  return found ? found.template : null;
};

