
import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from "openai";
import { Character, Chapter, ReadingLevel, ChapterOutcome } from "../types";

// Configuration
export type AIProvider = "gemini" | "openai" | "local";

const AI_PROVIDER: AIProvider = (process.env.AI_PROVIDER as AIProvider) || "gemini";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const LOCAL_API_URL = process.env.LOCAL_API_URL || 'http://localhost:1234/v1';
const LOCAL_API_KEY = process.env.LOCAL_API_KEY || 'not-needed';

// Initialize clients
const geminiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const openaiClient = new OpenAI({ apiKey: OPENAI_API_KEY, dangerouslyAllowBrowser: true });
const localClient = new OpenAI({
  apiKey: LOCAL_API_KEY,
  baseURL: LOCAL_API_URL,
  dangerouslyAllowBrowser: true
});

// Model configurations
const MODELS = {
  gemini: {
    outline: "gemini-3-flash-preview",
    chapter: "gemini-3-pro-preview",
    summary: "gemini-3-flash-preview",
  },
  openai: {
    outline: "gpt-4o-mini",
    chapter: "gpt-4o",
    summary: "gpt-4o-mini",
  },
  local: {
    outline: process.env.LOCAL_MODEL_OUTLINE || process.env.LOCAL_MODEL || "local-model",
    chapter: process.env.LOCAL_MODEL_CHAPTER || process.env.LOCAL_MODEL || "local-model",
    summary: process.env.LOCAL_MODEL_SUMMARY || process.env.LOCAL_MODEL || "local-model",
  },
};

// Helper function to get reading level instructions
const getReadingLevelInstructions = (readingLevel: ReadingLevel): string => {
  const instructions = {
    'elementary': `
- Use simple, clear vocabulary appropriate for ages 6-10
- Keep sentences short and straightforward
- Focus on concrete concepts and clear cause-and-effect
- Use age-appropriate themes and content
- Avoid complex metaphors or abstract ideas
- Include descriptive but simple language`,
    'middle-grade': `
- Use moderate vocabulary appropriate for ages 8-12
- Mix simple and compound sentences for variety
- Include relatable themes and age-appropriate challenges
- Use some figurative language and descriptive details
- Balance action with character development
- Keep content appropriate for pre-teens`,
    'young-adult': `
- Use sophisticated vocabulary appropriate for ages 12-18
- Employ varied sentence structures and pacing
- Explore complex themes like identity, relationships, and moral dilemmas
- Include nuanced character development and emotional depth
- Use literary devices like metaphor, symbolism, and foreshadowing
- Address mature themes while remaining age-appropriate`,
    'adult': `
- Use advanced vocabulary and literary techniques
- Employ complex sentence structures and varied pacing
- Explore nuanced, mature themes without restriction
- Include sophisticated character psychology and motivations
- Use literary devices extensively (symbolism, metaphor, irony, etc.)
- Address any themes or content as appropriate for the story`
  };
  return instructions[readingLevel];
};

export const generateOutline = async (
  title: string,
  genre: string,
  numChapters: number,
  characters: Character[],
  initialIdea: string,
  readingLevel: ReadingLevel,
  customSystemPrompt?: string
): Promise<Partial<Chapter>[]> => {
  const charactersPrompt = characters
    .map((c) => `${c.name}: ${c.attributes}`)
    .join("\n");

  const readingLevelNote = {
    'elementary': 'elementary school readers (ages 6-10)',
    'middle-grade': 'middle grade readers (ages 8-12)',
    'young-adult': 'young adult readers (ages 12-18)',
    'adult': 'adult readers (ages 18+)'
  }[readingLevel];

  const prompt = `
    Generate a detailed story outline for a ${genre} story titled "${title}".
    The story should have exactly ${numChapters} chapters.
    Target audience: ${readingLevelNote}

    Core Idea: ${initialIdea}

    Characters:
    ${charactersPrompt}

    For each chapter, provide a catchy title and a 2-3 sentence summary of the plot developments.
    Ensure the themes, complexity, and content are appropriate for ${readingLevelNote}.
  `;

  if (AI_PROVIDER === "openai" || AI_PROVIDER === "local") {
    const client = AI_PROVIDER === "local" ? localClient : openaiClient;
    const model = AI_PROVIDER === "local" ? MODELS.local.outline : MODELS.openai.outline;

    const defaultSystemPrompt = "You are a creative story outline generator. Return your response as a JSON array of objects with 'title' and 'summary' fields.";
    const systemPrompt = customSystemPrompt
      ? `${customSystemPrompt}\n\nIMPORTANT: Return your response as a JSON array of objects with 'title' and 'summary' fields.`
      : defaultSystemPrompt;

    const requestParams: any = {
      model: model,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    };

    // Configure structured output based on provider
    if (AI_PROVIDER === "openai") {
      requestParams.response_format = { type: "json_object" };
    } else if (AI_PROVIDER === "local") {
      // Try to use json_schema for local models (LM Studio, etc.)
      try {
        requestParams.response_format = {
          type: "json_schema",
          json_schema: {
            name: "story_outline",
            strict: true,
            schema: {
              type: "object",
              properties: {
                chapters: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      summary: { type: "string" }
                    },
                    required: ["title", "summary"],
                    additionalProperties: false
                  }
                }
              },
              required: ["chapters"],
              additionalProperties: false
            }
          }
        };
      } catch (e) {
        console.log(`[${AI_PROVIDER}] json_schema not supported, using plain text`);
      }
    }

    const response = await client.chat.completions.create(requestParams);

    try {
      let content = response.choices[0].message.content || "{}";
      console.log(`[${AI_PROVIDER}] Raw response:`, content);

      // Strip markdown code blocks if present (common with local models without structured output)
      content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      console.log(`[${AI_PROVIDER}] Cleaned content:`, content);

      const parsed = JSON.parse(content);
      console.log(`[${AI_PROVIDER}] Parsed JSON:`, parsed);

      // Try to extract chapters from various possible structures
      // 1. Structured output format: { chapters: [...] }
      // 2. Direct array format: [...]
      // 3. Other wrapper formats: { outline: [...] }
      let chapters = parsed.chapters || parsed.outline || parsed;

      // If parsed is an object with a single array property, use that
      if (!Array.isArray(chapters) && typeof chapters === 'object') {
        const values = Object.values(chapters);
        if (values.length === 1 && Array.isArray(values[0])) {
          chapters = values[0];
        }
      }

      // If still not an array, wrap it or throw error
      if (!Array.isArray(chapters)) {
        console.error(`[${AI_PROVIDER}] Expected array but got:`, typeof chapters, chapters);
        throw new Error("Response is not in expected array format");
      }

      console.log(`[${AI_PROVIDER}] Extracted ${chapters.length} chapters`);

      return chapters.map((item: any, index: number) => ({
        id: index + 1,
        title: item.title,
        summary: item.summary,
        content: "",
        status: "pending",
      }));
    } catch (e) {
      console.error(`Failed to parse ${AI_PROVIDER} outline JSON`, e);
      throw new Error("Failed to generate a valid outline structure.");
    }
  } else {
    // Gemini implementation
    const response = await geminiClient.models.generateContent({
      model: MODELS.gemini.outline,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
            },
            required: ["title", "summary"],
          },
        },
      },
    });

    try {
      const json = JSON.parse(response.text || "[]");
      return json.map((item: any, index: number) => ({
        id: index + 1,
        title: item.title,
        summary: item.summary,
        content: "",
        status: "pending",
      }));
    } catch (e) {
      console.error("Failed to parse Gemini outline JSON", e);
      throw new Error("Failed to generate a valid outline structure.");
    }
  }
};

// Helper function to build the default chapter generation prompt
export const buildChapterPrompt = (
  storyTitle: string,
  genre: string,
  characters: Character[],
  chapterIndex: number,
  outline: Chapter[],
  previousChaptersSummary: string,
  selectedCharacterIds?: string[],
  readingLevel?: ReadingLevel
): string => {
  const currentChapter = outline[chapterIndex];

  // Filter characters based on selection
  const chapterCharacters = selectedCharacterIds && selectedCharacterIds.length > 0
    ? characters.filter(c => selectedCharacterIds.includes(c.id))
    : characters;

  const charactersPrompt = chapterCharacters.length > 0
    ? chapterCharacters.map((c) => `${c.name}: ${c.attributes}`).join("\n")
    : "No specific characters selected for this chapter.";

  const characterNote = selectedCharacterIds && selectedCharacterIds.length > 0
    ? `\n- Focus on these characters: ${chapterCharacters.map(c => c.name).join(', ')}`
    : '';

  const readingLevelInstructions = readingLevel
    ? `\n\nReading Level Guidelines:${getReadingLevelInstructions(readingLevel)}`
    : '';

  return `Write Chapter ${chapterIndex + 1} of the ${genre} story titled "${storyTitle}".

Chapter Title: ${currentChapter.title}
Chapter Summary: ${currentChapter.summary}

Overall Story Context:
- Previous developments: ${previousChaptersSummary || "This is the first chapter."}

Characters in this chapter:
${charactersPrompt}

Instructions:
- Write in a professional, engaging literary style suited for the ${genre} genre.
- Focus on showing rather than telling.
- Include dialogue where appropriate.
- The chapter should be approximately 600-1000 words.
- Ensure continuity with the provided characters and plot.${characterNote}${readingLevelInstructions}`;
};

export const generateChapterContent = async (
  storyTitle: string,
  genre: string,
  characters: Character[],
  chapterIndex: number,
  outline: Chapter[],
  previousChaptersSummary: string,
  customPrompt?: string,
  readingLevel?: ReadingLevel,
  customSystemPrompt?: string
): Promise<string> => {
  const currentChapter = outline[chapterIndex];
  const selectedCharacterIds = currentChapter.characterIds;

  const prompt = customPrompt || buildChapterPrompt(
    storyTitle,
    genre,
    characters,
    chapterIndex,
    outline,
    previousChaptersSummary,
    selectedCharacterIds,
    readingLevel
  );

  if (AI_PROVIDER === "openai" || AI_PROVIDER === "local") {
    const client = AI_PROVIDER === "local" ? localClient : openaiClient;
    const model = AI_PROVIDER === "local" ? MODELS.local.chapter : MODELS.openai.chapter;

    const defaultSystemPrompt = `You are a professional fiction writer specializing in ${genre} stories. Write engaging, vivid prose with strong character development and compelling narrative flow.`;
    const systemPrompt = customSystemPrompt || defaultSystemPrompt;

    const response = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      top_p: 0.95,
    });

    return response.choices[0].message.content || "Failed to generate content.";
  } else {
    // Gemini implementation
    const response = await geminiClient.models.generateContent({
      model: MODELS.gemini.chapter,
      contents: prompt,
      config: {
        temperature: 0.8,
        topP: 0.95,
        thinkingConfig: { thinkingBudget: 16000 },
      },
    });

    return response.text || "Failed to generate content.";
  }
};

export const summarizePreviousChapters = async (chapters: Chapter[]): Promise<string> => {
  if (chapters.length === 0) return "";

  const textToSummarize = chapters
    .map((c) => `Chapter ${c.id}: ${c.title}\n${c.content.substring(0, 500)}...`)
    .join("\n\n");

  const prompt = `Summarize the key plot points and character developments in these chapters briefly to help write the next one:\n\n${textToSummarize}`;

  if (AI_PROVIDER === "openai" || AI_PROVIDER === "local") {
    const client = AI_PROVIDER === "local" ? localClient : openaiClient;
    const model = AI_PROVIDER === "local" ? MODELS.local.summary : MODELS.openai.summary;

    const response = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that summarizes story chapters concisely.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
    });

    return response.choices[0].message.content || "";
  } else {
    // Gemini implementation
    const response = await geminiClient.models.generateContent({
      model: MODELS.gemini.summary,
      contents: prompt,
    });

    return response.text || "";
  }
};

// Regenerate a chapter based on user feedback
export const regenerateChapterContent = async (
  storyTitle: string,
  genre: string,
  characters: Character[],
  chapterIndex: number,
  outline: Chapter[],
  previousChaptersSummary: string,
  userFeedback: string,
  readingLevel?: ReadingLevel,
  customSystemPrompt?: string
): Promise<string> => {
  const currentChapter = outline[chapterIndex];
  const selectedCharacterIds = currentChapter.characterIds;

  // Build the base prompt similar to the original generation
  const basePrompt = buildChapterPrompt(
    storyTitle,
    genre,
    characters,
    chapterIndex,
    outline,
    previousChaptersSummary,
    selectedCharacterIds,
    readingLevel
  );

  // Add the user feedback and regeneration instructions
  const regenerationPrompt = `${basePrompt}

IMPORTANT: This is a REGENERATION of the chapter based on user feedback.

Previous version of the chapter:
${currentChapter.content}

User Feedback:
${userFeedback}

Please rewrite the chapter taking the user's feedback into account. Make sure to:
1. Address all points mentioned in the feedback
2. Maintain consistency with the story's tone, style, and previous chapters
3. Keep the core plot points from the chapter summary
4. Improve upon the previous version based on the specific feedback provided

Generate the improved chapter content now:`;

  if (AI_PROVIDER === "openai" || AI_PROVIDER === "local") {
    const client = AI_PROVIDER === "local" ? localClient : openaiClient;
    const model = AI_PROVIDER === "local" ? MODELS.local.chapter : MODELS.openai.chapter;

    const defaultSystemPrompt = `You are a professional fiction writer specializing in ${genre} stories. You are revising a chapter based on user feedback. Write engaging, vivid prose with strong character development and compelling narrative flow.`;
    const systemPrompt = customSystemPrompt || defaultSystemPrompt;

    const response = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        { role: "user", content: regenerationPrompt },
      ],
      temperature: 0.8,
      top_p: 0.95,
    });

    return response.choices[0].message.content || "Failed to regenerate content.";
  } else {
    // Gemini implementation
    const response = await geminiClient.models.generateContent({
      model: MODELS.gemini.chapter,
      contents: regenerationPrompt,
      config: {
        temperature: 0.8,
        topP: 0.95,
        thinkingConfig: { thinkingBudget: 16000 },
      },
    });

    return response.text || "Failed to regenerate content.";
  }
};

// Generate three possible outcomes for the next chapter in continuous writing mode
export const generateNextChapterOutcomes = async (
  storyTitle: string,
  genre: string,
  characters: Character[],
  completedChapters: Chapter[],
  readingLevel?: ReadingLevel,
  customSystemPrompt?: string
): Promise<ChapterOutcome[]> => {
  const charactersPrompt = characters
    .map((c) => `${c.name}: ${c.attributes}`)
    .join("\n");

  const readingLevelNote = readingLevel ? {
    'elementary': 'elementary school readers (ages 6-10)',
    'middle-grade': 'middle grade readers (ages 8-12)',
    'young-adult': 'young adult readers (ages 12-18)',
    'adult': 'adult readers (ages 18+)'
  }[readingLevel] : 'general audience';

  const storyContext = completedChapters.length > 0
    ? completedChapters.map((ch, idx) =>
        `Chapter ${idx + 1}: ${ch.title}\n${ch.summary}\n${ch.content.substring(0, 300)}...`
      ).join("\n\n")
    : "This is the beginning of the story.";

  const prompt = `
    You are helping to write a ${genre} story titled "${storyTitle}" for ${readingLevelNote}.

    Characters:
    ${charactersPrompt}

    Story so far:
    ${storyContext}

    Generate THREE distinct and compelling possible directions for the next chapter. Each outcome should:
    - Offer a unique narrative direction or plot development
    - Build naturally from what has happened so far
    - Be engaging and appropriate for the target audience
    - Provide meaningful story progression

    For each outcome, provide:
    1. A catchy chapter title
    2. A brief 1-2 sentence summary
    3. A more detailed 3-4 sentence description of what would happen

    Make the three outcomes distinctly different from each other - they could explore different themes, character arcs, plot twists, or emotional tones.
  `;

  if (AI_PROVIDER === "openai" || AI_PROVIDER === "local") {
    const client = AI_PROVIDER === "local" ? localClient : openaiClient;
    const model = AI_PROVIDER === "local" ? MODELS.local.outline : MODELS.openai.outline;

    const defaultSystemPrompt = "You are a creative story planner. Return your response as a JSON array of objects with 'title', 'summary', and 'description' fields.";
    const systemPrompt = customSystemPrompt
      ? `${customSystemPrompt}\n\nIMPORTANT: Return your response as a JSON array of objects with 'title', 'summary', and 'description' fields.`
      : defaultSystemPrompt;

    const requestParams: any = {
      model: model,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
    };

    // Use structured output for OpenAI if available
    if (AI_PROVIDER === "openai") {
      requestParams.response_format = {
        type: "json_schema",
        json_schema: {
          name: "chapter_outcomes",
          strict: true,
          schema: {
            type: "object",
            properties: {
              outcomes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    summary: { type: "string" },
                    description: { type: "string" },
                  },
                  required: ["title", "summary", "description"],
                  additionalProperties: false,
                },
              },
            },
            required: ["outcomes"],
            additionalProperties: false,
          },
        },
      };
    }

    const response = await client.chat.completions.create(requestParams);

    try {
      let content = response.choices[0].message.content || "{}";
      console.log(`[${AI_PROVIDER}] Raw outcomes response:`, content);

      // Strip markdown code blocks if present
      content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

      const parsed = JSON.parse(content);
      console.log(`[${AI_PROVIDER}] Parsed outcomes:`, parsed);

      // Extract outcomes from various possible structures
      let outcomes = parsed.outcomes || parsed;

      if (!Array.isArray(outcomes)) {
        console.error(`[${AI_PROVIDER}] Expected array but got:`, typeof outcomes, outcomes);
        throw new Error("Response is not in expected array format");
      }

      // Ensure we have exactly 3 outcomes
      if (outcomes.length < 3) {
        console.warn(`[${AI_PROVIDER}] Only got ${outcomes.length} outcomes, expected 3`);
      }

      return outcomes.slice(0, 3).map((item: any) => ({
        title: item.title,
        summary: item.summary,
        description: item.description,
      }));
    } catch (e) {
      console.error(`Failed to parse ${AI_PROVIDER} outcomes JSON`, e);
      throw new Error("Failed to generate valid chapter outcomes.");
    }
  } else {
    // Gemini implementation
    const response = await geminiClient.models.generateContent({
      model: MODELS.gemini.outline,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            outcomes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ["title", "summary", "description"],
              },
            },
          },
          required: ["outcomes"],
        },
      },
    });

    const parsed = JSON.parse(response.text);
    const outcomes = parsed.outcomes || [];

    return outcomes.slice(0, 3).map((item: any) => ({
      title: item.title,
      summary: item.summary,
      description: item.description,
    }));
  }
};
