/**
 * Genre Loader Service
 * Loads and parses the genres.yaml configuration file
 */

export interface GenreConfig {
  [genre: string]: string; // genre name -> system prompt
}

/**
 * Parse YAML content for genres configuration
 * Simple parser that handles multiline strings with | syntax
 */
const parseGenresYAML = (content: string): GenreConfig => {
  const lines = content.split('\n');
  const genres: GenreConfig = {};
  
  let currentGenre: string | null = null;
  let currentPrompt: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || line.trim() === '') {
      continue;
    }
    
    // Check if this is a genre key (no leading spaces, ends with: |)
    if (!line.startsWith(' ') && line.includes(':')) {
      // Save previous genre if exists
      if (currentGenre && currentPrompt.length > 0) {
        genres[currentGenre] = currentPrompt.join('\n').trim();
      }
      
      // Start new genre
      const [genre, rest] = line.split(':').map(s => s.trim());
      currentGenre = genre;
      currentPrompt = [];
      
      // Check if it's a multiline string indicator
      if (rest !== '|') {
        // Single line value
        genres[genre] = rest;
        currentGenre = null;
      }
    } else if (currentGenre && line.startsWith('  ')) {
      // This is part of a multiline string
      currentPrompt.push(line.substring(2)); // Remove the 2-space indent
    }
  }
  
  // Add last genre if exists
  if (currentGenre && currentPrompt.length > 0) {
    genres[currentGenre] = currentPrompt.join('\n').trim();
  }
  
  return genres;
};

/**
 * Load genres configuration from genres.yaml
 * Uses Vite's import.meta.glob to load the YAML file at build time
 */
export const loadGenresConfig = async (): Promise<GenreConfig> => {
  try {
    // Use Vite's glob import to load the genres.yaml file
    const genreModule = import.meta.glob('/genres.yaml', { 
      query: '?raw',
      import: 'default'
    });
    
    const genrePath = '/genres.yaml';
    if (genreModule[genrePath]) {
      const content = await genreModule[genrePath]() as string;
      return parseGenresYAML(content);
    }
    
    // Fallback to default genres if file not found
    console.warn('genres.yaml not found, using default genres');
    return getDefaultGenres();
  } catch (error) {
    console.error('Failed to load genres.yaml:', error);
    return getDefaultGenres();
  }
};

/**
 * Get list of available genre names
 */
export const getGenreNames = async (): Promise<string[]> => {
  const config = await loadGenresConfig();
  return Object.keys(config);
};

/**
 * Get system prompt for a specific genre
 */
export const getGenreSystemPrompt = async (genre: string): Promise<string> => {
  const config = await loadGenresConfig();
  return config[genre] || getDefaultSystemPrompt(genre);
};

/**
 * Default genres fallback (in case config file is not available)
 */
const getDefaultGenres = (): GenreConfig => {
  return {
    'Fantasy': 'You are a professional fiction writer specializing in Fantasy stories. Write engaging, vivid prose with strong character development and compelling narrative flow.',
    'Sci-Fi': 'You are a professional fiction writer specializing in Sci-Fi stories. Write engaging, vivid prose with strong character development and compelling narrative flow.',
    'Mystery': 'You are a professional fiction writer specializing in Mystery stories. Write engaging, vivid prose with strong character development and compelling narrative flow.',
    'Romance': 'You are a professional fiction writer specializing in Romance stories. Write engaging, vivid prose with strong character development and compelling narrative flow.',
    'Horror': 'You are a professional fiction writer specializing in Horror stories. Write engaging, vivid prose with strong character development and compelling narrative flow.',
    'Thriller': 'You are a professional fiction writer specializing in Thriller stories. Write engaging, vivid prose with strong character development and compelling narrative flow.',
    'Historical': 'You are a professional fiction writer specializing in Historical stories. Write engaging, vivid prose with strong character development and compelling narrative flow.',
    'Adventure': 'You are a professional fiction writer specializing in Adventure stories. Write engaging, vivid prose with strong character development and compelling narrative flow.',
  };
};

/**
 * Default system prompt for a genre (fallback)
 */
const getDefaultSystemPrompt = (genre: string): string => {
  return `You are a professional fiction writer specializing in ${genre} stories. Write engaging, vivid prose with strong character development and compelling narrative flow.`;
};

