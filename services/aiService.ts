
import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from "openai";
import { Character, Chapter, ReadingLevel, ChapterOutcome, ForeshadowingNote } from "../types";
import { getSelectedModel } from "../utils/modelSelection";

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

// Helper function to get the selected local model
// Falls back to task-specific models if defined, otherwise uses the selected model
const getLocalModel = (taskType: 'outline' | 'chapter' | 'summary'): string => {
  // Check for task-specific model first
  const taskSpecificModel = taskType === 'outline'
    ? process.env.LOCAL_MODEL_OUTLINE
    : taskType === 'chapter'
    ? process.env.LOCAL_MODEL_CHAPTER
    : process.env.LOCAL_MODEL_SUMMARY;

  if (taskSpecificModel) {
    return taskSpecificModel;
  }

  // Otherwise use the selected model from the UI
  return getSelectedModel();
};

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
    get outline() { return getLocalModel('outline'); },
    get chapter() { return getLocalModel('chapter'); },
    get summary() { return getLocalModel('summary'); },
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

    For each chapter, provide a catchy title and a 300-word sentence summary of the plot developments.
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
  foreshadowingNotes?: ForeshadowingNote[],
  lastChapterContinuationSummary?: string
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

  // Build the last chapter continuation section if available
  let lastChapterSection = '';
  if (lastChapterContinuationSummary) {
    lastChapterSection = `

🎯 === IMMEDIATE CONTINUATION FROM LAST CHAPTER ===
${lastChapterContinuationSummary}
=== END OF LAST CHAPTER CONTINUATION ===

⚠️ CRITICAL: This chapter MUST pick up EXACTLY where the last chapter left off. Use the information above to:
- Start from the exact situation described in "HOW THIS CHAPTER ENDED"
- Continue any ongoing events and actions in progress
- Address the unresolved questions and pending decisions
- Follow through on any cliffhangers
- Do what "MUST HAPPEN NEXT"

`;
  }

  return `Write Chapter ${chapterIndex + 1} of the ${genre} story titled "${storyTitle}".

Chapter Title: ${currentChapter.title}
Chapter Summary: ${currentChapter.summary}

Overall Story Context:
${previousChaptersSummary ? `=== PREVIOUS CHAPTERS SUMMARY ===
${previousChaptersSummary}
=== END OF PREVIOUS CHAPTERS SUMMARY ===
${lastChapterSection}
⚠️ CRITICAL CONTINUITY REQUIREMENTS - READ CAREFULLY:

1. STORY CONTINUITY:
   - This chapter MUST continue directly from where the previous chapter ended
   - DO NOT repeat events, revelations, or discoveries that already occurred
   - Characters already know information that was revealed to them in previous chapters
   - Reference the previous chapter's ending and build from there

2. UNRESOLVED PLOT THREADS:
   - The summary above lists UNRESOLVED plot threads, conflicts, and questions
   - You MUST continue developing these unresolved elements in this chapter
   - Address cliffhangers and open endings from the previous chapter
   - Progress character goals and motivations that were established but not yet achieved

3. CHARACTER CONTINUITY:
   - Characters remember everything from previous chapters
   - Maintain established character relationships and dynamics
   - Characters should act consistently with their previous behavior and knowledge

4. WORLD-BUILDING CONTINUITY:
   - Maintain all established facts about the story world
   - Keep supernatural/fantasy elements consistent with what has been established
   - Don't contradict any rules or facts established in previous chapters

5. NARRATIVE FLOW:
   - The story should flow naturally from the previous chapter's ending
   - Pick up where the story left off - don't jump ahead without explanation
   - Reference previous events naturally when relevant
   - Move the story forward - don't retread covered ground` : "This is the first chapter - establish the story world and characters."}

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

  console.log(`[generateChapterContent] Chapter ${chapterIndex + 1}: "${currentChapter.title}"`);
  console.log(`[generateChapterContent] Previous summary length: ${previousChaptersSummary.length} chars`);
  if (previousChaptersSummary.length > 0) {
    console.log(`[generateChapterContent] Previous summary preview: ${previousChaptersSummary.substring(0, 200)}...`);
  } else {
    console.log(`[generateChapterContent] WARNING: No previous summary provided!`);
  }

  // Generate a special continuation summary for the last chapter (if not first chapter)
  let lastChapterContinuationSummary = '';
  if (chapterIndex > 0) {
    const lastChapter = outline[chapterIndex - 1];
    console.log(`[generateChapterContent] Checking last chapter (Chapter ${chapterIndex}):`, {
      exists: !!lastChapter,
      hasContent: !!lastChapter?.content,
      contentLength: lastChapter?.content?.length || 0,
      status: lastChapter?.status
    });

    if (lastChapter && lastChapter.content && lastChapter.status === 'completed') {
      console.log(`[generateChapterContent] ✅ Generating continuation summary for last chapter (Chapter ${lastChapter.id})...`);
      try {
        lastChapterContinuationSummary = await generateLastChapterContinuationSummary(lastChapter);
        console.log(`[generateChapterContent] ✅ Last chapter continuation summary generated (${lastChapterContinuationSummary.length} chars)`);
        console.log(`[generateChapterContent] Continuation summary preview: ${lastChapterContinuationSummary.substring(0, 200)}...`);
      } catch (error) {
        console.error(`[generateChapterContent] ❌ Failed to generate last chapter continuation summary:`, error);
        // Continue without it - we still have the general summary
      }
    } else {
      console.warn(`[generateChapterContent] ⚠️ Cannot generate continuation summary - last chapter not ready:`, {
        hasLastChapter: !!lastChapter,
        hasContent: !!lastChapter?.content,
        status: lastChapter?.status
      });
    }
  }

  // Always build the base prompt with previous chapters summary for context
  console.log(`[generateChapterContent] Building chapter prompt with:`, {
    chapterIndex,
    hasPreviousSummary: !!previousChaptersSummary,
    previousSummaryLength: previousChaptersSummary.length,
    hasLastChapterContinuation: !!lastChapterContinuationSummary,
    lastChapterContinuationLength: lastChapterContinuationSummary.length,
    hasCustomPrompt: !!customPrompt,
    selectedCharacterIds: selectedCharacterIds || 'all characters'
  });

  const basePrompt = buildChapterPrompt(
    storyTitle,
    genre,
    characters,
    chapterIndex,
    outline,
    previousChaptersSummary,
    selectedCharacterIds,
    readingLevel,
    foreshadowingNotes,
    lastChapterContinuationSummary
  );

  // If custom prompt is provided, append it to the base prompt to maintain continuity
  const prompt = customPrompt
    ? `${basePrompt}\n\nADDITIONAL INSTRUCTIONS:\n${customPrompt}\n\nGenerate the chapter content now, following both the base requirements above and these additional instructions:`
    : basePrompt;

  console.log(`[generateChapterContent] Final prompt length: ${prompt.length} chars`);

  // Log summary usage for debugging
  if (previousChaptersSummary) {
    console.log(`[Chapter ${chapterIndex + 1}] Using previous chapters summary (${previousChaptersSummary.length} chars):\n${previousChaptersSummary.substring(0, 300)}...`);
  } else {
    console.log(`[Chapter ${chapterIndex + 1}] No previous chapters - this is the first chapter`);
  }

  if (AI_PROVIDER === "openai" || AI_PROVIDER === "local") {
    const client = AI_PROVIDER === "local" ? localClient : openaiClient;
    const model = AI_PROVIDER === "local" ? MODELS.local.chapter : MODELS.openai.chapter;

    const defaultSystemPrompt = `You are a professional fiction writer specializing in ${genre} stories. Write engaging, vivid prose with strong character development and compelling narrative flow.

CRITICAL: When writing chapters that follow previous chapters, you MUST maintain perfect story continuity. This means:
- Continue the story from where it left off - don't start fresh or repeat what already happened
- Develop unresolved plot threads and conflicts from previous chapters
- Characters remember and reference events from previous chapters
- The narrative should flow seamlessly from the previous chapter's ending
- Address any cliffhangers or open questions from previous chapters

Your goal is to write a chapter that feels like a natural continuation of the story, not a standalone piece.`;
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

// Generate a continuation-focused summary of the last chapter to help write the next one
export const generateLastChapterContinuationSummary = async (chapter: Chapter): Promise<string> => {
  if (!chapter.content) {
    console.log('[generateLastChapterContinuationSummary] No content to summarize');
    return '';
  }

  console.log(`[generateLastChapterContinuationSummary] Generating continuation summary for Chapter ${chapter.id}: "${chapter.title}"`);

  const prompt = `You are analyzing the LAST chapter of a story to help write the NEXT chapter. Focus on continuity and what needs to happen next.

CHAPTER TITLE: ${chapter.title}

CHAPTER CONTENT:
${chapter.content}

Generate a focused summary that helps the next chapter continue seamlessly. Include:

### **1. HOW THIS CHAPTER ENDED**
Describe the exact situation at the end of this chapter:
- Where are the characters physically?
- What were they doing in the final scene?
- What was the emotional state/mood?
- What was the last thing that happened?

### **2. ONGOING EVENTS & ACTIONS IN PROGRESS**
List any events, conversations, or actions that were happening but NOT completed:
- Conversations that were interrupted or ongoing
- Actions that were started but not finished
- Situations that are still developing
- Immediate dangers or tensions that are active

### **3. UNRESOLVED QUESTIONS & MYSTERIES**
List questions that were raised but NOT answered:
- Questions asked by characters that weren't answered
- Mysteries introduced but not solved
- Information hinted at but not revealed
- Suspicions or theories not yet confirmed

### **4. PENDING DECISIONS & COMMITMENTS**
List what characters need to do or decide next:
- Decisions that need to be made
- Plans that were made but not executed
- Promises or commitments not yet fulfilled
- Goals stated but not achieved

### **5. CLIFFHANGERS & HOOKS**
Identify any cliffhangers or dramatic moments that need immediate follow-up:
- Sudden revelations or discoveries at chapter end
- Dramatic arrivals or departures
- Threats or dangers that just appeared
- Emotional moments that need resolution

### **6. WHAT MUST HAPPEN NEXT**
Based on the chapter ending, what logically needs to happen in the next chapter:
- Immediate next actions
- Conversations that need to continue
- Situations that need to be addressed
- Natural story progression from this point

Be specific and concrete. The next chapter writer needs to know EXACTLY where to pick up the story.`;

  try {
    if (AI_PROVIDER === "openai" || AI_PROVIDER === "local") {
      const client = AI_PROVIDER === "local" ? localClient : openaiClient;
      const model = AI_PROVIDER === "local" ? MODELS.local.summary : MODELS.openai.summary;

      const response = await client.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content: "You are a story continuity specialist. Your job is to analyze how a chapter ends and identify exactly what needs to happen next to maintain seamless story flow."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
      });

      const summary = response.choices[0].message.content || '';
      console.log(`[generateLastChapterContinuationSummary] Generated continuation summary length: ${summary.length} chars`);
      return summary;
    } else {
      // Gemini implementation
      const response = await geminiClient.models.generateContent({
        model: MODELS.gemini.summary,
        contents: prompt,
        config: {
          temperature: 0.3,
        },
      });

      const summary = response.text || '';
      console.log(`[generateLastChapterContinuationSummary] Generated continuation summary length: ${summary.length} chars`);
      return summary;
    }
  } catch (error) {
    console.error('[generateLastChapterContinuationSummary] Error:', error);
    throw error;
  }
};

// Generate a detailed summary of a single chapter from its full content
export const generateDetailedChapterSummary = async (chapter: Chapter): Promise<string> => {
  if (!chapter.content) {
    console.log('[generateDetailedChapterSummary] No content to summarize');
    return '';
  }

  console.log(`[generateDetailedChapterSummary] Generating detailed summary for Chapter ${chapter.id}: "${chapter.title}"`);
  console.log(`[generateDetailedChapterSummary] Full content length: ${chapter.content.length} chars`);

  const prompt = `You are analyzing a chapter from a story to create a comprehensive summary that will help maintain continuity in future chapters.

CHAPTER TITLE: ${chapter.title}

CHAPTER CONTENT (FULL):
${chapter.content}

Generate a detailed summary that includes:

### **1. MAJOR EVENTS AND PLOT DEVELOPMENTS**
List all significant events that occurred in this chapter in chronological order.

### **2. CHARACTER INTERACTIONS AND RELATIONSHIPS**
Describe how characters interacted, what they learned about each other, and how relationships changed.

### **3. IMPORTANT REVELATIONS OR DISCOVERIES**
List all new information revealed to characters or readers.

### **4. SUPERNATURAL/FANTASY/SPECIAL ELEMENTS**
Document any magical, supernatural, or genre-specific elements introduced or used.

### **5. EMOTIONAL ARCS AND CONFLICTS**
Describe character emotional states, internal conflicts, and how they evolved.

### **6. CURRENT STATE OF AFFAIRS**
Describe where characters are, what they're doing, and the immediate situation at chapter end.

### **7. RESOLVED ELEMENTS**
List plot threads, questions, or conflicts that were RESOLVED in this chapter.

### **8. UNRESOLVED ELEMENTS (CRITICAL FOR NEXT CHAPTER)**
List all:
- Unanswered questions
- Pending decisions or actions
- Cliffhangers or open endings
- Goals not yet achieved
- Conflicts not yet resolved
- Promises or commitments made but not fulfilled

### **9. CHARACTER KNOWLEDGE STATE**
For each major character, list:
- What they NOW KNOW (learned in this chapter)
- What they STILL DON'T KNOW (but reader might know)
- What they BELIEVE (that may or may not be true)

### **10. CRITICAL CONTINUITY NOTES**
List specific facts, details, or constraints that MUST be maintained in future chapters (e.g., injuries, time of day, weather, locations, promises made, deadlines established).

Be thorough and specific. This summary will be used to ensure the next chapter continues seamlessly from where this one ended.`;

  try {
    if (AI_PROVIDER === "openai" || AI_PROVIDER === "local") {
      const client = AI_PROVIDER === "local" ? localClient : openaiClient;
      const model = AI_PROVIDER === "local" ? MODELS.local.summary : MODELS.openai.summary;

      const response = await client.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content: "You are a professional story analyst specializing in maintaining narrative continuity. Generate comprehensive, detailed summaries that capture all important information for future chapters."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
      });

      const summary = response.choices[0].message.content || '';
      console.log(`[generateDetailedChapterSummary] Generated summary length: ${summary.length} chars`);
      return summary;
    } else {
      // Gemini implementation
      const response = await geminiClient.models.generateContent({
        model: MODELS.gemini.summary,
        contents: prompt,
        config: {
          temperature: 0.3,
        },
      });

      const summary = response.text || '';
      console.log(`[generateDetailedChapterSummary] Generated summary length: ${summary.length} chars`);
      return summary;
    }
  } catch (error) {
    console.error('[generateDetailedChapterSummary] Error:', error);
    throw error;
  }
};

export const summarizePreviousChapters = async (chapters: Chapter[]): Promise<string> => {
  if (chapters.length === 0) return "";

  // Filter out chapters without content and log warning
  const chaptersWithContent = chapters.filter(c => c.content && c.content.trim().length > 0);

  if (chaptersWithContent.length === 0) {
    console.warn('[summarizePreviousChapters] No chapters with content found!');
    return "";
  }

  console.log(`[summarizePreviousChapters] Processing ${chaptersWithContent.length} chapters with content`);

  // Use detailed summaries if available, otherwise generate them on-the-fly
  // This allows us to accumulate comprehensive summaries as the story progresses
  const summaries: string[] = [];

  for (const chapter of chaptersWithContent) {
    if (chapter.detailedSummary) {
      console.log(`[summarizePreviousChapters] Using existing detailed summary for Chapter ${chapter.id}`);
      summaries.push(`=== CHAPTER ${chapter.id}: ${chapter.title} ===\n${chapter.detailedSummary}`);
    } else {
      console.log(`[summarizePreviousChapters] No detailed summary found for Chapter ${chapter.id}, generating now...`);
      // Generate detailed summary if it doesn't exist
      try {
        const detailedSummary = await generateDetailedChapterSummary(chapter);
        // Update the chapter object with the new summary (will be persisted by caller)
        chapter.detailedSummary = detailedSummary;
        summaries.push(`=== CHAPTER ${chapter.id}: ${chapter.title} ===\n${detailedSummary}`);
        console.log(`[summarizePreviousChapters] Generated and stored detailed summary for Chapter ${chapter.id} (${detailedSummary.length} chars)`);
      } catch (error) {
        console.error(`[summarizePreviousChapters] Failed to generate detailed summary for Chapter ${chapter.id}:`, error);
        // Fallback to using full content if summary generation fails
        console.log(`[summarizePreviousChapters] Falling back to full content for Chapter ${chapter.id}`);
        summaries.push(`=== CHAPTER ${chapter.id}: ${chapter.title} ===\n${chapter.content}`);
      }
    }
  }

  const textToSummarize = summaries.join("\n\n");

  const hasDetailedSummaries = chaptersWithContent.every(c => c.detailedSummary);

  const prompt = hasDetailedSummaries
    ? `You are combining detailed chapter summaries into a comprehensive story summary for generating the next chapter.

The following are detailed summaries of previous chapters. Combine them into a single, cohesive summary that:

1. Maintains all critical information from each chapter
2. Clearly shows the progression of events across chapters
3. Highlights connections between chapters
4. Emphasizes UNRESOLVED elements that need to be addressed in the next chapter
5. Shows the current state of each character's knowledge and goals

PREVIOUS CHAPTER SUMMARIES:

${textToSummarize}

Create a comprehensive summary that preserves all important details while showing how the story has progressed. Make sure to clearly identify what is RESOLVED vs UNRESOLVED across all chapters.`
    : `Summarize the key plot points, character developments, and important story elements in these chapters. This summary will be used to generate the next chapter, so it's critical to capture everything important. Focus on:

- Major events and plot developments (what actually happened)
- Character interactions and relationships (who met, what they discussed, how they feel about each other)
- Important revelations or discoveries (what was learned or revealed)
- Supernatural or fantasy elements introduced (magical abilities, creatures, rules of the world)
- Emotional arcs and conflicts (internal struggles, tensions between characters)
- Any foreshadowing or setup for future events
- Current state of affairs (where characters are, what they're doing, what problems they face)
- **UNRESOLVED PLOT THREADS**: Questions raised but not answered, conflicts started but not resolved, goals set but not achieved
- **CLIFFHANGERS AND OPEN ENDINGS**: How the last chapter ended, what's left hanging, what needs to happen next
- **CHARACTER GOALS AND MOTIVATIONS**: What each character wants, what they're trying to accomplish, what obstacles they face
- **PENDING DECISIONS OR ACTIONS**: Choices that need to be made, actions that were planned but not yet taken

CRITICAL: The next chapter needs to CONTINUE the story from where it left off. Your summary must make it clear:
1. What has been RESOLVED (so it's not repeated)
2. What is UNRESOLVED (so it can be developed further)
3. What the characters are CURRENTLY doing or planning to do
4. What NEEDS TO HAPPEN NEXT for the story to progress logically

IMPORTANT DISTINCTION - Narrator Knowledge vs Character Knowledge:
- If a question is asked but NOT answered in dialogue, it is UNRESOLVED even if the narrator reveals the answer
- Example: "What is your name?" he asked the cat named Fluffy. → The READER knows the name is Fluffy, but the CHARACTER doesn't know yet because the cat hasn't answered. This is UNRESOLVED.
- Only mark something as RESOLVED if the characters in the story actually learned it through dialogue or action

Be specific and detailed. Include character names, specific events, exact revelations, and most importantly, what's still pending or unresolved. The next chapter must build on these events without repeating or contradicting them.

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
          content: "You are a professional story editor creating detailed chapter summaries for story continuity. Your summaries must capture ALL important plot points, character developments, revelations, and story elements in detail. CRITICALLY, you must clearly distinguish between what has been RESOLVED and what remains UNRESOLVED. The next chapter writer needs to know what plot threads to continue, what questions to answer, and what conflicts to develop. Be specific with names, events, discoveries, and especially with unresolved plot threads, pending decisions, and cliffhangers. These summaries are critical for maintaining story continuity and ensuring the next chapter continues the story logically.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3, // Lower temperature for more consistent, factual summaries
    });

    const summary = response.choices[0].message.content || "";
    console.log(`[Summary] Generated summary for ${chaptersWithContent.length} chapter(s) (${summary.length} chars):`);
    console.log(summary);
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
    console.log(`[Summary] Generated summary for ${chaptersWithContent.length} chapter(s) (${summary.length} chars):`);
    console.log(summary);
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

  console.log(`[regenerateChapterContent] Regenerating Chapter ${chapterIndex + 1}: "${currentChapter.title}"`);
  console.log(`[regenerateChapterContent] Previous summary length: ${previousChaptersSummary.length} chars`);
  console.log(`[regenerateChapterContent] User feedback: ${userFeedback.substring(0, 100)}...`);

  // Generate a special continuation summary for the last chapter (if not first chapter)
  let lastChapterContinuationSummary = '';
  if (chapterIndex > 0) {
    const lastChapter = outline[chapterIndex - 1];
    if (lastChapter && lastChapter.content && lastChapter.status === 'completed') {
      console.log(`[regenerateChapterContent] Generating continuation summary for last chapter (Chapter ${lastChapter.id})...`);
      try {
        lastChapterContinuationSummary = await generateLastChapterContinuationSummary(lastChapter);
        console.log(`[regenerateChapterContent] Last chapter continuation summary generated (${lastChapterContinuationSummary.length} chars)`);
      } catch (error) {
        console.error(`[regenerateChapterContent] Failed to generate last chapter continuation summary:`, error);
        // Continue without it - we still have the general summary
      }
    }
  }

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
    foreshadowingNotes,
    lastChapterContinuationSummary
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
2. MAINTAIN FULL CONTINUITY with previous chapters - do not repeat events, revelations, or discoveries that already occurred
3. Characters should remember and build upon what they learned in previous chapters
4. Keep the core plot points from the chapter summary
5. Maintain consistency with the story's tone, style, and established facts
6. Improve upon the previous version based on the specific feedback provided

CRITICAL: The previous chapters summary above contains everything that has already happened in the story. Do NOT repeat or contradict any of those events. Build upon them naturally while addressing the user's feedback.

Generate the improved chapter content now:`;

  if (AI_PROVIDER === "openai" || AI_PROVIDER === "local") {
    const client = AI_PROVIDER === "local" ? localClient : openaiClient;
    const model = AI_PROVIDER === "local" ? MODELS.local.chapter : MODELS.openai.chapter;

    const defaultSystemPrompt = `You are a professional fiction writer specializing in ${genre} stories. You are revising a chapter based on user feedback while maintaining perfect continuity with previous chapters. Write engaging, vivid prose with strong character development and compelling narrative flow. CRITICAL: Never repeat events or revelations that already occurred in previous chapters. Characters must remember what they learned and experienced before.`;
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

// Generate suggestions for improving a chapter in the outline
export const generateChapterSuggestions = async (
  storyTitle: string,
  genre: string,
  characters: Character[],
  allChapters: Chapter[],
  chapterIndex: number,
  userPrompt: string,
  readingLevel?: ReadingLevel,
  customSystemPrompt?: string
): Promise<Array<{ title: string; summary: string }>> => {
  const currentChapter = allChapters[chapterIndex];
  const charactersPrompt = characters
    .map((c) => `${c.name}: ${c.attributes}`)
    .join("\n");

  const readingLevelNote = readingLevel ? {
    'elementary': 'elementary school readers (ages 6-10)',
    'middle-grade': 'middle grade readers (ages 8-12)',
    'young-adult': 'young adult readers (ages 12-18)',
    'adult': 'adult readers (ages 18+)'
  }[readingLevel] : 'general audience';

  // Build context from surrounding chapters
  const previousChapters = allChapters.slice(0, chapterIndex);
  const nextChapters = allChapters.slice(chapterIndex + 1);

  let contextPrompt = '';
  if (previousChapters.length > 0) {
    contextPrompt += '\n\nPrevious chapters:\n';
    previousChapters.forEach((ch, idx) => {
      contextPrompt += `Chapter ${idx + 1}: ${ch.title}\n${ch.summary}\n\n`;
    });
  }

  if (nextChapters.length > 0) {
    contextPrompt += '\n\nUpcoming chapters:\n';
    nextChapters.forEach((ch, idx) => {
      contextPrompt += `Chapter ${chapterIndex + idx + 2}: ${ch.title}\n${ch.summary}\n\n`;
    });
  }

  const userGuidance = userPrompt.trim()
    ? `\n\nUser's specific request: ${userPrompt}\n\nMake sure to address the user's request in your suggestions.`
    : '';

  const prompt = `
    You are helping to improve the outline for a ${genre} story titled "${storyTitle}" for ${readingLevelNote}.

    Characters:
    ${charactersPrompt}
    ${contextPrompt}

    Current Chapter ${chapterIndex + 1}:
    Title: ${currentChapter.title}
    Summary: ${currentChapter.summary}
    ${userGuidance}

    Generate THREE distinct alternative versions for this chapter that:
    - Maintain the overall story flow and continuity with other chapters
    - Offer creative improvements or different narrative approaches
    - Are appropriate for the target audience
    - Keep the chapter's general position and purpose in the story arc
    ${userPrompt.trim() ? '- Address the specific improvements requested by the user' : '- Enhance drama, character development, or plot progression'}

    Each suggestion should have a compelling title and a 300-words sentence summary.
  `;

  if (AI_PROVIDER === "openai" || AI_PROVIDER === "local") {
    const client = AI_PROVIDER === "local" ? localClient : openaiClient;
    const model = AI_PROVIDER === "local" ? MODELS.local.outline : MODELS.openai.outline;

    const defaultSystemPrompt = "You are a creative story editor. Return your response as a JSON array of objects with 'title' and 'summary' fields.";
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
      temperature: 0.8,
    };

    // Add structured output for OpenAI if available
    if (AI_PROVIDER === "openai") {
      requestParams.response_format = {
        type: "json_schema",
        json_schema: {
          name: "chapter_suggestions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    summary: { type: "string" },
                  },
                  required: ["title", "summary"],
                  additionalProperties: false,
                },
              },
            },
            required: ["suggestions"],
            additionalProperties: false,
          },
        },
      };
    }

    const response = await client.chat.completions.create(requestParams);

    try {
      let content = response.choices[0].message.content || "{}";
      console.log(`[${AI_PROVIDER}] Raw suggestions response:`, content);

      // Strip markdown code blocks if present
      content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

      const parsed = JSON.parse(content);
      console.log(`[${AI_PROVIDER}] Parsed suggestions:`, parsed);

      // Try to extract suggestions from various possible structures
      let suggestions = parsed.suggestions || parsed;

      if (!Array.isArray(suggestions)) {
        console.error(`[${AI_PROVIDER}] Expected array but got:`, typeof suggestions);
        throw new Error("Invalid response format");
      }

      console.log(`[${AI_PROVIDER}] Extracted ${suggestions.length} suggestions`);

      return suggestions.slice(0, 3).map((item: any) => ({
        title: item.title,
        summary: item.summary,
      }));
    } catch (e) {
      console.error(`Failed to parse ${AI_PROVIDER} suggestions JSON`, e);
      throw new Error("Failed to generate valid suggestions.");
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
            suggestions: {
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
          required: ["suggestions"],
        },
        temperature: 0.8,
      },
    });

    const parsed = JSON.parse(response.text);
    const suggestions = parsed.suggestions || [];

    return suggestions.slice(0, 3).map((item: any) => ({
      title: item.title,
      summary: item.summary,
    }));
  }
};
