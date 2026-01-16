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
