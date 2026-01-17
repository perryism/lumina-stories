
import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from "openai";
import { Character, Chapter, ReadingLevel, ChapterOutcome, ForeshadowingNote } from "../types";

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

// Helper function to get the default system prompt for chapter generation
export const getDefaultSystemPrompt = (genre: string): string => {
  return `You are a professional fiction writer specializing in ${genre} stories. Write engaging, vivid prose with strong character development and compelling narrative flow.`;
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

      // Ensure we only return the requested number of chapters
      const limitedChapters = chapters.slice(0, numChapters);
      console.log(`[${AI_PROVIDER}] Limiting to ${numChapters} chapters (was ${chapters.length})`);

      return limitedChapters.map((item: any, index: number) => ({
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

      // Ensure we only return the requested number of chapters
      const limitedChapters = json.slice(0, numChapters);
      console.log(`[gemini] Limiting to ${numChapters} chapters (was ${json.length})`);

      return limitedChapters.map((item: any, index: number) => ({
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
  readingLevel?: ReadingLevel,
  foreshadowingNotes?: ForeshadowingNote[]
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

  // Build foreshadowing instructions
  let foreshadowingInstructions = '';
  if (foreshadowingNotes && foreshadowingNotes.length > 0) {
    // Find notes that should be foreshadowed in this chapter (target chapter is later)
    const notesToForeshadow = foreshadowingNotes.filter(
      note => note.targetChapterId > chapterIndex + 1
    );

    // Find notes that should be revealed in this chapter
    const notesToReveal = foreshadowingNotes.filter(
      note => note.targetChapterId === chapterIndex + 1
    );

    if (notesToForeshadow.length > 0) {
      foreshadowingInstructions += '\n\nForeshadowing (subtle hints for future reveals):';
      notesToForeshadow.forEach(note => {
        foreshadowingInstructions += `\n- Subtly hint at: "${note.revealDescription}" (will be revealed in Chapter ${note.targetChapterId})`;
        foreshadowingInstructions += `\n  Suggestion: ${note.foreshadowingHint}`;
      });
    }

    if (notesToReveal.length > 0) {
      foreshadowingInstructions += '\n\nReveals (important plot points to reveal in this chapter):';
      notesToReveal.forEach(note => {
        foreshadowingInstructions += `\n- REVEAL: ${note.revealDescription}`;
      });
    }
  }

  // Build acceptance criteria instructions
  let acceptanceCriteriaInstructions = '';
  if (currentChapter.acceptanceCriteria && currentChapter.acceptanceCriteria.trim()) {
    acceptanceCriteriaInstructions = `\n\nACCEPTANCE CRITERIA (MUST MEET):
${currentChapter.acceptanceCriteria}

IMPORTANT: Ensure the chapter content explicitly addresses and meets all the acceptance criteria listed above.`;
  }

  return `Write Chapter ${chapterIndex + 1} of the ${genre} story titled "${storyTitle}".

Chapter Title: ${currentChapter.title}
Chapter Summary: ${currentChapter.summary}

Overall Story Context:
${previousChaptersSummary ? `Previous chapters summary:
${previousChaptersSummary}

CRITICAL CONTINUITY REQUIREMENTS:
- DO NOT repeat events, revelations, or discoveries that already occurred in previous chapters
- Characters should already know information that was revealed to them in previous chapters
- Build upon and advance the story from where the previous chapter left off
- Reference previous events naturally when relevant, but move the story forward
- Maintain all established facts, character relationships, and world-building elements
- If a character learned something or experienced something in a previous chapter, they remember it in this chapter` : "This is the first chapter - establish the story world and characters."}

Characters in this chapter:
${charactersPrompt}

Instructions:
- Write in a professional, engaging literary style suited for the ${genre} genre.
- Focus on showing rather than telling.
- Include dialogue where appropriate.
- The chapter should be approximately 600-1000 words.
- Ensure strong continuity with the provided characters, plot developments, and established story elements.
- Reference previous events naturally when relevant to maintain story coherence.
- Keep character personalities, relationships, and any supernatural/fantasy elements consistent with what has been established.
- ADVANCE the plot - do not retread ground already covered in previous chapters.${characterNote}${readingLevelInstructions}${foreshadowingInstructions}${acceptanceCriteriaInstructions}`;
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
  customSystemPrompt?: string,
  foreshadowingNotes?: ForeshadowingNote[]
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
    readingLevel,
    foreshadowingNotes
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

  // Include more content from each chapter for better context
  // Use up to 2000 characters to capture key plot points and character developments
  const textToSummarize = chapters
    .map((c) => `Chapter ${c.id}: ${c.title}\n${c.content.substring(0, 2000)}...`)
    .join("\n\n");

  const prompt = `Summarize the key plot points, character developments, and important story elements in these chapters. This summary will be used to generate the next chapter, so it's critical to capture everything important. Focus on:

- Major events and plot developments (what actually happened)
- Character interactions and relationships (who met, what they discussed, how they feel about each other)
- Important revelations or discoveries (what was learned or revealed)
- Supernatural or fantasy elements introduced (magical abilities, creatures, rules of the world)
- Emotional arcs and conflicts (internal struggles, tensions between characters)
- Any foreshadowing or setup for future events
- Current state of affairs (where characters are, what they're doing, what problems they face)

IMPORTANT: Be specific and detailed. Include character names, specific events, and exact revelations. The next chapter must build on these events without repeating or contradicting them.

Chapters to summarize:

${textToSummarize}`;

  if (AI_PROVIDER === "openai" || AI_PROVIDER === "local") {
    const client = AI_PROVIDER === "local" ? localClient : openaiClient;
    const model = AI_PROVIDER === "local" ? MODELS.local.summary : MODELS.openai.summary;

    const response = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: "You are a professional story editor creating detailed chapter summaries. Your summaries must capture ALL important plot points, character developments, revelations, and story elements in detail. Be specific with names, events, and discoveries. These summaries are critical for maintaining story continuity and preventing contradictions or repetition in subsequent chapters.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3, // Lower temperature for more consistent, factual summaries
    });

    const summary = response.choices[0].message.content || "";
    console.log(`[Summary] Generated summary for ${chapters.length} chapter(s):\n${summary.substring(0, 500)}...`);
    return summary;
  } else {
    // Gemini implementation
    const response = await geminiClient.models.generateContent({
      model: MODELS.gemini.summary,
      contents: prompt,
      config: {
        temperature: 0.3, // Lower temperature for more consistent, factual summaries
      },
    });

    const summary = response.text || "";
    console.log(`[Summary] Generated summary for ${chapters.length} chapter(s):\n${summary.substring(0, 500)}...`);
    return summary;
  }
};

// Validate chapter content against acceptance criteria and cohesion with previous chapters
export const validateChapterContent = async (
  chapterContent: string,
  acceptanceCriteria: string,
  chapterTitle: string,
  chapterSummary: string,
  previousChaptersSummary: string,
  genre: string
): Promise<{ passed: boolean; feedback: string }> => {
  const prompt = `You are a professional story editor. Evaluate the following chapter content against the specified acceptance criteria and check for cohesion with previous chapters.

Chapter Title: ${chapterTitle}
Expected Summary: ${chapterSummary}

Previous Chapters Context:
${previousChaptersSummary || "This is the first chapter."}

Acceptance Criteria:
${acceptanceCriteria}

Chapter Content to Validate:
${chapterContent}

Please evaluate:
1. Does the chapter meet all the specified acceptance criteria?
2. Does the chapter maintain cohesion with the previous chapters (consistent tone, character behavior, plot continuity)?
3. Does the chapter match the expected summary and title?

Respond in JSON format with:
{
  "passed": true/false,
  "feedback": "Brief explanation of what passed or what issues were found"
}`;

  try {
    if (AI_PROVIDER === "openai" || AI_PROVIDER === "local") {
      const client = AI_PROVIDER === "local" ? localClient : openaiClient;
      const model = AI_PROVIDER === "local" ? MODELS.local.summary : MODELS.openai.summary;

      const response = await client.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content: `You are a professional story editor specializing in ${genre} stories. Evaluate chapter content objectively and provide constructive feedback.`,
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{"passed": true, "feedback": "Validation completed."}');
      return {
        passed: result.passed ?? true,
        feedback: result.feedback || "Validation completed."
      };
    } else {
      // Gemini implementation
      const response = await geminiClient.models.generateContent({
        model: MODELS.gemini.summary,
        contents: prompt,
        config: {
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      });

      const result = JSON.parse(response.text || '{"passed": true, "feedback": "Validation completed."}');
      return {
        passed: result.passed ?? true,
        feedback: result.feedback || "Validation completed."
      };
    }
  } catch (error) {
    console.error("Validation error:", error);
    // If validation fails, default to passing to not block the user
    return {
      passed: true,
      feedback: "Validation could not be completed. Please review manually."
    };
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
  customSystemPrompt?: string,
  foreshadowingNotes?: ForeshadowingNote[]
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
    readingLevel,
    foreshadowingNotes
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
  customSystemPrompt?: string,
  foreshadowingNotes?: ForeshadowingNote[]
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

  // Generate a comprehensive summary of completed chapters for better context
  let storyContext = "This is the beginning of the story.";
  if (completedChapters.length > 0) {
    // Use the same summarization approach as chapter generation for consistency
    const summary = await summarizePreviousChapters(completedChapters);
    storyContext = `Story so far (${completedChapters.length} chapter${completedChapters.length > 1 ? 's' : ''}):\n${summary}`;
  }

  // Build foreshadowing instructions for the next chapter
  const nextChapterNumber = completedChapters.length + 1;
  let foreshadowingInstructions = '';

  if (foreshadowingNotes && foreshadowingNotes.length > 0) {
    // Find notes that should be foreshadowed in the next chapter (target chapter is later)
    const notesToForeshadow = foreshadowingNotes.filter(
      note => note.targetChapterId > nextChapterNumber
    );

    // Find notes that should be revealed in the next chapter
    const notesToReveal = foreshadowingNotes.filter(
      note => note.targetChapterId === nextChapterNumber
    );

    if (notesToForeshadow.length > 0 || notesToReveal.length > 0) {
      foreshadowingInstructions = '\n\nIMPORTANT - Foreshadowing Requirements:';

      if (notesToForeshadow.length > 0) {
        foreshadowingInstructions += '\nThe next chapter should include subtle hints about:';
        notesToForeshadow.forEach(note => {
          foreshadowingInstructions += `\n- "${note.revealDescription}" (will be revealed in Chapter ${note.targetChapterId})`;
          foreshadowingInstructions += `\n  Suggestion: ${note.foreshadowingHint}`;
        });
      }

      if (notesToReveal.length > 0) {
        foreshadowingInstructions += '\nThe next chapter MUST reveal:';
        notesToReveal.forEach(note => {
          foreshadowingInstructions += `\n- ${note.revealDescription}`;
        });
      }

      foreshadowingInstructions += '\n\nEnsure ALL three outcomes incorporate these foreshadowing requirements appropriately.';
    }
  }

  const prompt = `
    You are helping to write a ${genre} story titled "${storyTitle}" for ${readingLevelNote}.

    Characters:
    ${charactersPrompt}

    ${storyContext}${foreshadowingInstructions}

    Generate THREE distinct and compelling possible directions for the next chapter. Each outcome should:
    - Offer a unique narrative direction or plot development
    - Build naturally from what has happened so far (DO NOT repeat events or revelations that already occurred)
    - Be engaging and appropriate for the target audience
    - Provide meaningful story progression that advances the plot
    - Maintain continuity with established character knowledge and relationships

    For each outcome, provide:
    1. A catchy chapter title
    2. A brief 1-2 sentence summary
    3. A more detailed 3-4 sentence description of what would happen

    Make the three outcomes distinctly different from each other - they could explore different themes, character arcs, plot twists, or emotional tones.

    IMPORTANT: Each outcome must move the story FORWARD from where it currently is. Do not retread ground already covered.
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
