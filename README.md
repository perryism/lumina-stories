<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1d3oDA0BipHQ27qQFuy_MAvslB4BY3cS2

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure your AI provider:

   Create a `.env` file (or `.env.local`) based on `.env.example`:

   **Option A: Use Gemini (default)**
   ```env
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   Get your Gemini API key from: https://aistudio.google.com/app/apikey

   **Option B: Use OpenAI**
   ```env
   AI_PROVIDER=openai
   OPENAI_API_KEY=your_openai_api_key_here
   ```
   Get your OpenAI API key from: https://platform.openai.com/api-keys

   **Option C: Use Local Chat Server**
   ```env
   AI_PROVIDER=local
   LOCAL_API_URL=http://localhost:1234/v1
   LOCAL_MODEL=your-model-name
   ```
   Works with LM Studio, Ollama, LocalAI, or any OpenAI-compatible server

3. Run the app:
   ```bash
   npm run dev
   ```

## AI Provider Configuration

The app supports three AI providers:

- **Gemini** (default): Uses Google's Gemini models
  - Outline generation: `gemini-3-flash-preview`
  - Chapter writing: `gemini-3-pro-preview`
  - Summarization: `gemini-3-flash-preview`

- **OpenAI**: Uses OpenAI's GPT models
  - Outline generation: `gpt-4o-mini`
  - Chapter writing: `gpt-4o`
  - Summarization: `gpt-4o-mini`

- **Local**: Uses your local chat server (LM Studio, Ollama, LocalAI, etc.)
  - Fully customizable model names
  - Works with any OpenAI-compatible API
  - No API costs, runs on your hardware

Switch between providers by setting the `AI_PROVIDER` environment variable to `gemini`, `openai`, or `local`.

## System Prompt

The **System Prompt** you define in "Create Your Epic" is a powerful global instruction that influences the AI's behavior throughout the entire story generation process.

### Where It's Used

The system prompt you customize is used in:

1. **Story Map (Outline Generation)** - Influences how the AI generates the story outline/narrative beats
2. **Story Generator (Chapter Writing)** - Guides the AI's writing style, tone, and approach for each chapter
3. **AI Suggestions** - Shapes suggestions when you request chapter improvements in the Story Map
4. **Continuous Writing Mode** - Influences the generation of next chapter outcomes

### How to Use It

1. Go to "Create Your Epic"
2. Click **Advanced Settings** (near the bottom)
3. Edit the **System Prompt** to customize how the AI approaches your story
4. Examples:
   - "Write in a noir detective style with cynical, hardboiled prose"
   - "Focus on emotional depth and character introspection"
   - "Use vivid sensory descriptions and poetic language"
   - "Write in a fast-paced, action-oriented style"

### Default Behavior

If you don't customize the system prompt, it defaults to genre-specific instructions (e.g., "You are a professional fiction writer specializing in Fantasy stories"). The AI automatically appends format requirements for different tasks (JSON for outlines, prose for chapters, etc.).

### How It Combines with Other Instructions

The system prompt works **in combination with** many other settings and features to shape the AI's behavior:

#### **1. Reading Level**
- Your selected reading level adds specific vocabulary and complexity guidelines
- Example: If you set "Elementary (Ages 6-10)", the AI gets instructions like:
  - "Use simple, clear vocabulary appropriate for ages 6-10"
  - "Keep sentences short and straightforward"
  - "Avoid complex metaphors or abstract ideas"
- These instructions are added ALONGSIDE your system prompt

#### **2. Acceptance Criteria** (in Story Map)
- When you add acceptance criteria to a chapter, it becomes a "MUST MEET" requirement
- The AI receives both your system prompt AND the acceptance criteria
- Example: If you set acceptance criteria as "Include a plot twist in this chapter", the AI will follow both your system prompt style AND this requirement

#### **3. Foreshadowing Notes** (World Building)
- Foreshadowing hints are combined with your system prompt
- The AI gets explicit instructions to hint at future reveals or reveal planned events
- Your system prompt style guides HOW the foreshadowing is written

#### **4. Custom Prompts/Feedback** (During Chapter Generation)
- When regenerating or revising a chapter, user feedback combines with the system prompt
- Your system prompt influences the writing style while user feedback specifies what to change

#### **5. Story Context**
- Previous chapters' summaries combine with your system prompt
- The AI uses your system prompt's style to maintain continuity
- Genre, character profiles, and plot outline all work with your system prompt

### The Combined Prompt Structure

Here's how everything layers together during chapter generation:

```
🎯 System Prompt (your custom instructions + default genre guidance)
   ↓
📖 Story Context (title, genre, previous chapters summary, world-building)
   ↓
👥 Characters (selected characters for this chapter + their attributes)
   ↓
📋 Chapter Requirements (chapter title, summary)
   ↓
✅ Acceptance Criteria (if defined)
   ↓
🔮 Foreshadowing Instructions (if any notes exist)
   ↓
📚 Reading Level Guidelines (vocabulary, sentence complexity, themes)
   ↓
💬 Custom Prompts or Feedback (additional user instructions)
```

Each layer influences the AI, with your system prompt acting as the **foundational style guide** for all the layers above it.

## Core Idea / Plot Outline Flow

The **Core Idea / Plot Outline** from "Create Your Epic" plays an important role, but it's important to understand how it's used:

### **How It's Used**

1. **In Story Map** - The core idea is used to **generate** a detailed outline:
   - AI creates chapter titles based on your core idea
   - AI creates chapter summaries based on your core idea
   - You can then edit and refine this generated outline

2. **In Story Generator** - The **generated outline** is used, NOT the original core idea:
   - Each chapter uses its generated **title** and **summary** as guidance
   - Chapter generation focuses on these details plus previous chapters
   - The original core idea has been "expanded" into the outline structure

### **Example Flow**

```
Create Your Epic:
  Core Idea: "A detective investigates a series of mysterious murders in a small town"
  ↓
Story Map (Outline Generated):
  Chapter 1: "The First Victim"
    Summary: "Detective arrives in town and discovers the first body..."
  Chapter 2: "Clues and Suspicions"
    Summary: "Detective questions the townspeople and finds disturbing patterns..."
  (and so on for all chapters)
  ↓
Story Generator:
  Uses Chapter 1 title and summary to write the actual chapter prose
  Uses Chapter 2 title and summary to write the next chapter
  (The original "mysterious murders" idea is embedded in the outline)
```

### **Key Takeaway**

- Your core idea is the **foundation** for the story outline
- The **generated outline becomes the blueprint** for actual chapter writing
- You can modify the outline in the Story Map to reshape how your core idea is developed
- The story generator then follows this customized outline
