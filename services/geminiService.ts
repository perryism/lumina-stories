
import { GoogleGenAI, Type } from "@google/genai";
import { Character, Chapter } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

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

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
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
    console.error("Failed to parse outline JSON", e);
    throw new Error("Failed to generate a valid outline structure.");
  }
};

export const generateChapterContent = async (
  storyTitle: string,
  genre: string,
  characters: Character[],
  chapterIndex: number,
  outline: Chapter[],
  previousChaptersSummary: string
): Promise<string> => {
  const currentChapter = outline[chapterIndex];
  const charactersPrompt = characters
    .map((c) => `${c.name}: ${c.attributes}`)
    .join("\n");

  const prompt = `
    Write Chapter ${chapterIndex + 1} of the ${genre} story titled "${storyTitle}".
    
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
    - Ensure continuity with the provided characters and plot.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      temperature: 0.8,
      topP: 0.95,
      thinkingConfig: { thinkingBudget: 16000 }
    },
  });

  return response.text || "Failed to generate content.";
};

export const summarizePreviousChapters = async (chapters: Chapter[]): Promise<string> => {
    if (chapters.length === 0) return "";
    
    const textToSummarize = chapters
        .map(c => `Chapter ${c.id}: ${c.title}\n${c.content.substring(0, 500)}...`)
        .join("\n\n");

    const prompt = `Summarize the key plot points and character developments in these chapters briefly to help write the next one:\n\n${textToSummarize}`;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
    });

    return response.text || "";
};
