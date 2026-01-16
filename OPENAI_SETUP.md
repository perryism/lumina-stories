# OpenAI Integration Guide

Lumina Stories now supports both **Google Gemini** and **OpenAI** as AI providers for story generation!

## Quick Start

### 1. Install Dependencies

If you haven't already, install the required packages:

```bash
npm install
```

### 2. Choose Your AI Provider

#### Option A: Use OpenAI (Recommended for GPT-4)

1. Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)

2. Create a `.env` file in the project root:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-api-key-here
```

3. Run the app:

```bash
npm run dev
```

#### Option B: Use Gemini (Default)

1. Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

2. Create a `.env` file in the project root:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key-here
```

3. Run the app:

```bash
npm run dev
```

## Model Configuration

### OpenAI Models Used

- **Outline Generation**: `gpt-4o-mini` - Fast and cost-effective for structured output
- **Chapter Writing**: `gpt-4o` - High-quality creative writing
- **Summarization**: `gpt-4o-mini` - Efficient for summarizing previous chapters

### Gemini Models Used

- **Outline Generation**: `gemini-3-flash-preview` - Fast structured generation
- **Chapter Writing**: `gemini-3-pro-preview` - Advanced creative writing with thinking
- **Summarization**: `gemini-3-flash-preview` - Quick summarization

## Switching Between Providers

You can easily switch between providers by changing the `AI_PROVIDER` environment variable:

```env
# Use OpenAI
AI_PROVIDER=openai

# Use Gemini
AI_PROVIDER=gemini
```

No code changes required! The app automatically uses the correct API based on your configuration.

## Cost Considerations

### OpenAI Pricing (as of 2024)

- **GPT-4o**: ~$2.50 per 1M input tokens, ~$10 per 1M output tokens
- **GPT-4o-mini**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens

A typical 5-chapter story (~5,000 words) costs approximately **$0.10-0.30** with OpenAI.

### Gemini Pricing

- **Gemini 3 Flash**: Free tier available with rate limits
- **Gemini 3 Pro**: Free tier available with rate limits

Check [Google AI Studio pricing](https://ai.google.dev/pricing) for current rates.

## Technical Details

### Architecture

The app uses a unified `aiService.ts` that abstracts both providers:

- **Single Interface**: Same function signatures for both providers
- **Runtime Selection**: Provider chosen at startup via environment variable
- **Graceful Fallback**: Defaults to Gemini if no provider specified

### Files Modified

1. **`services/aiService.ts`** (new) - Unified AI service supporting both providers
2. **`App.tsx`** - Updated import from `geminiService` to `aiService`
3. **`vite.config.ts`** - Added environment variable support for both providers
4. **`package.json`** - Added `openai` package dependency
5. **`.env.example`** - Configuration template for both providers

### Backward Compatibility

The original `geminiService.ts` is still available if needed. The new `aiService.ts` maintains the same API interface, so no changes to components are required.

## Troubleshooting

### "API key not found" error

Make sure your `.env` file is in the project root and contains the correct key:

```env
# For OpenAI
OPENAI_API_KEY=sk-...

# For Gemini
GEMINI_API_KEY=...
```

### "Failed to generate outline" error

1. Check that your API key is valid
2. Verify you have sufficient credits/quota
3. Check your internet connection
4. Try switching to the other provider

### TypeScript errors

Run a clean install:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Support

For issues or questions:
- Check the [OpenAI API documentation](https://platform.openai.com/docs)
- Check the [Gemini API documentation](https://ai.google.dev/docs)
- Review the code in `services/aiService.ts`

