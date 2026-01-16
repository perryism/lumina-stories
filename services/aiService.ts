
import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from "openai";
import { Character, Chapter } from "../types";

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

export const generateOutline = async (
  title: string,
  genre: string,
  numChapters: number,
  characters: Character[],
  initialIdea: string
): Promise<Partial<Chapter>[]> => {
  const charactersPrompt = characters
    .map((c) => `${c.name}: ${c.attributes}`)
    .join("\n");

  const prompt = `
    Generate a detailed story outline for a ${genre} story titled "${title}".
    The story should have exactly ${numChapters} chapters.

    Core Idea: ${initialIdea}

    Characters:
    ${charactersPrompt}

    For each chapter, provide a catchy title and a 2-3 sentence summary of the plot developments.
  `;

  if (AI_PROVIDER === "openai" || AI_PROVIDER === "local") {
    const client = AI_PROVIDER === "local" ? localClient : openaiClient;
    const model = AI_PROVIDER === "local" ? MODELS.local.outline : MODELS.openai.outline;

    const requestParams: any = {
      model: model,
      messages: [
        {
          role: "system",
          content: "You are a creative story outline generator. Return your response as a JSON array of objects with 'title' and 'summary' fields.",
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
  previousChaptersSummary: string
): string => {
  const currentChapter = outline[chapterIndex];
  const charactersPrompt = characters
    .map((c) => `${c.name}: ${c.attributes}`)
    .join("\n");

  return `Write Chapter ${chapterIndex + 1} of the ${genre} story titled "${storyTitle}".

Chapter Title: ${currentChapter.title}
Chapter Summary: ${currentChapter.summary}

Overall Story Context:
- Previous developments: ${previousChaptersSummary || "This is the first chapter."}

Characters:
${charactersPrompt}

Instructions:
- Write in a professional, engaging literary style suited for the ${genre} genre.
- Focus on showing rather than telling.
- Include dialogue where appropriate.
- The chapter should be approximately 600-1000 words.
- Ensure continuity with the provided characters and plot.`;
};

export const generateChapterContent = async (
  storyTitle: string,
  genre: string,
  characters: Character[],
  chapterIndex: number,
  outline: Chapter[],
  previousChaptersSummary: string,
  customPrompt?: string
): Promise<string> => {
  const prompt = customPrompt || buildChapterPrompt(
    storyTitle,
    genre,
    characters,
    chapterIndex,
    outline,
    previousChaptersSummary
  );

  if (AI_PROVIDER === "openai" || AI_PROVIDER === "local") {
    const client = AI_PROVIDER === "local" ? localClient : openaiClient;
    const model = AI_PROVIDER === "local" ? MODELS.local.chapter : MODELS.openai.chapter;

    const response = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: `You are a professional fiction writer specializing in ${genre} stories. Write engaging, vivid prose with strong character development and compelling narrative flow.`,
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

