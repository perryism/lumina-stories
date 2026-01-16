# Local Chat Server Setup Guide

Lumina Stories now supports running with your own local LLM server! This means:
- ✅ **No API costs** - Run completely free on your hardware
- ✅ **Privacy** - Your stories never leave your machine
- ✅ **Offline** - No internet connection required
- ✅ **Customizable** - Use any model you prefer

## Supported Local Servers

Any OpenAI-compatible API server will work, including:
- **LM Studio** (Recommended for beginners)
- **Ollama**
- **LocalAI**
- **text-generation-webui (oobabooga)**
- **vLLM**
- **llama.cpp server**

## Quick Start with LM Studio

### 1. Install LM Studio

Download from: https://lmstudio.ai/

### 2. Download a Model

In LM Studio:
1. Go to the "Discover" tab
2. Search for and download a model (recommended: `mistral-7b-instruct` or `llama-3-8b-instruct`)
3. Wait for the download to complete

### 3. Start the Local Server

1. Go to the "Local Server" tab in LM Studio
2. Select your downloaded model
3. Click "Start Server"
4. Note the server URL (usually `http://localhost:1234/v1`)

### 4. Configure Lumina Stories

Create a `.env` file in the project root:

```env
AI_PROVIDER=local
LOCAL_API_URL=http://localhost:1234/v1
LOCAL_MODEL=your-model-name
```

The model name should match what's shown in LM Studio (e.g., `mistral-7b-instruct-v0.2`).

### 5. Run the App

```bash
npm run dev
```

That's it! Your stories will now be generated using your local model.

## Setup with Ollama

### 1. Install Ollama

Download from: https://ollama.ai/

### 2. Pull a Model

```bash
ollama pull mistral
# or
ollama pull llama3
```

### 3. Start Ollama Server

Ollama runs automatically after installation. The API is at `http://localhost:11434/v1`

### 4. Configure Lumina Stories

```env
AI_PROVIDER=local
LOCAL_API_URL=http://localhost:11434/v1
LOCAL_MODEL=mistral
```

## Setup with LocalAI

### 1. Install LocalAI

Using Docker:

```bash
docker run -p 8080:8080 -v $PWD/models:/models localai/localai:latest
```

### 2. Download Models

Place your GGUF model files in the `models` directory.

### 3. Configure Lumina Stories

```env
AI_PROVIDER=local
LOCAL_API_URL=http://localhost:8080/v1
LOCAL_MODEL=your-model-filename
```

## Advanced Configuration

### Using Different Models for Different Tasks

You can optimize performance by using different models for different tasks:

```env
AI_PROVIDER=local
LOCAL_API_URL=http://localhost:1234/v1

# Fast model for outlines and summaries
LOCAL_MODEL_OUTLINE=mistral-7b-instruct
LOCAL_MODEL_SUMMARY=mistral-7b-instruct

# Larger, more creative model for chapter writing
LOCAL_MODEL_CHAPTER=llama-3-70b-instruct
```

### Custom Server Ports

If your server runs on a different port:

```env
LOCAL_API_URL=http://localhost:8080/v1
```

### API Key (if required)

Some local servers require authentication:

```env
LOCAL_API_KEY=your-api-key-here
```

## Recommended Models

### For Fast Generation (4-8GB VRAM)
- **Mistral 7B Instruct** - Great balance of speed and quality
- **Llama 3 8B Instruct** - Excellent instruction following
- **Phi-3 Medium** - Compact but capable

### For Best Quality (16GB+ VRAM)
- **Llama 3 70B Instruct** - Top-tier creative writing
- **Mixtral 8x7B** - Excellent for diverse genres
- **Command R+** - Strong at following complex instructions

### For Low-End Hardware (2-4GB VRAM)
- **Phi-3 Mini** - Surprisingly capable for its size
- **TinyLlama** - Basic but functional
- **Gemma 2B** - Good for simple stories

## Troubleshooting

### "Connection refused" error

1. Make sure your local server is running
2. Check the server URL in your `.env` file
3. Try accessing the URL in your browser: `http://localhost:1234/v1/models`

### "Model not found" error

1. Verify the model name matches exactly what's in your server
2. Check available models: `curl http://localhost:1234/v1/models`
3. Update `LOCAL_MODEL` in your `.env` file

### Slow generation

1. Use a smaller model (7B instead of 70B)
2. Enable GPU acceleration in your server settings
3. Reduce context length in server configuration
4. Use quantized models (Q4 or Q5)

### Poor quality output

1. Try a larger or more recent model
2. Adjust temperature settings in `aiService.ts`
3. Use instruction-tuned models (models with "instruct" in the name)
4. Ensure your model is fully loaded (check server logs)

## Performance Tips

1. **Use GPU acceleration** - Dramatically faster than CPU
2. **Quantize models** - Q4 or Q5 quantization reduces memory usage with minimal quality loss
3. **Adjust context length** - Shorter context = faster generation
4. **Batch processing** - Some servers support batching multiple requests

## Support

For server-specific issues:
- **LM Studio**: https://lmstudio.ai/docs
- **Ollama**: https://github.com/ollama/ollama
- **LocalAI**: https://localai.io/docs/

For Lumina Stories integration issues, check `services/aiService.ts`.

