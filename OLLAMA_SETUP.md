# Ollama Setup Instructions

This project now uses **Ollama with Llama 3.2** as a FREE local AI model for generating interview questions. This eliminates API costs and timeout issues.

## Why Ollama?

- **100% FREE** - No API keys required
- **Fast** - Runs locally on your machine
- **No Timeouts** - Works within Netlify's 10-second function limit
- **Privacy** - Your data stays on your machine

## Installation Steps

### 1. Install Ollama

#### Windows
1. Download Ollama from [https://ollama.com/download](https://ollama.com/download)
2. Run the installer
3. Ollama will automatically start

#### Mac
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

#### Linux
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 2. Pull Llama 3.2 Model

Once Ollama is installed, open a terminal and run:

```bash
ollama pull llama3.2
```

This will download the Llama 3.2 model (approximately 2GB).

### 3. Verify Installation

Check if Ollama is running:

```bash
ollama list
```

You should see `llama3.2` in the list.

### 4. Start Your Application

#### For Local Development (server.js)

1. Make sure Ollama is running (it should auto-start after installation)
2. Start your Node.js server:
   ```bash
   npm run server
   ```

The app will automatically connect to Ollama at `http://localhost:11434`

#### For Netlify Functions

For Netlify deployment, you have two options:

**Option A: Use a Remote Ollama Instance**
1. Deploy Ollama on a cloud server (e.g., Railway, Render, or your own VPS)
2. Set the environment variable in Netlify:
   ```
   OLLAMA_ENDPOINT=https://your-ollama-instance.com
   ```

**Option B: Use Alternative Free APIs**
- The code defaults to localhost, which won't work in Netlify's serverless environment
- Consider using free-tier APIs like:
  - HuggingFace Inference API (free tier available)
  - Groq API (very fast, generous free tier)

## Configuration

### Environment Variables

You can customize the Ollama endpoint by setting:

```env
OLLAMA_ENDPOINT=http://localhost:11434
```

Or for remote deployment:

```env
OLLAMA_ENDPOINT=https://your-remote-ollama-url
```

## Troubleshooting

### Ollama Not Starting

**Windows:**
- Check Task Manager for "ollama" process
- Restart Ollama from Start Menu

**Mac/Linux:**
```bash
ollama serve
```

### "Connection Refused" Error

Make sure Ollama is running:
```bash
# Check if Ollama is accessible
curl http://localhost:11434/api/version
```

You should get a version response. If not, start Ollama:
```bash
ollama serve
```

### Model Not Found

Make sure you've pulled the model:
```bash
ollama pull llama3.2
```

### Slow Generation

- **First run** is always slower as the model loads into memory
- **Subsequent runs** are much faster
- Consider upgrading RAM if you have less than 8GB

## Performance Tips

1. **Keep Ollama Running**: Don't stop the Ollama service between requests
2. **Use SSD**: Store models on SSD for faster loading
3. **Adequate RAM**: 8GB+ recommended
4. **GPU Acceleration**: Ollama automatically uses GPU if available (NVIDIA/AMD)

## Token Optimization

The code has been optimized to reduce token usage:

- Resume text truncated to 1500 characters
- Job description truncated to 800 characters
- Simplified prompt format
- Reduced response length (2048 tokens max)

This ensures fast generation times (typically 5-15 seconds).

## Alternative: Deploy Ollama to Cloud

If you want to use Ollama in production with Netlify:

### Railway Deployment

1. Create account on [Railway](https://railway.app/)
2. Click "New Project"
3. Select "Deploy from Docker"
4. Use this Docker image: `ollama/ollama`
5. Add environment variable: `OLLAMA_MODELS=llama3.2`
6. Deploy and get your public URL
7. Set `OLLAMA_ENDPOINT` in Netlify to your Railway URL

### Cost Comparison

| Service | Cost | Speed | Privacy |
|---------|------|-------|---------|
| **Ollama (Local)** | FREE | Fast | High |
| **Ollama (Railway)** | ~$5-10/mo | Fast | Medium |
| Gemini API | $0.125/1M tokens | Medium | Low |
| OpenAI API | $0.30/1M tokens | Fast | Low |

## Support

If you encounter issues:
1. Check [Ollama Documentation](https://github.com/ollama/ollama)
2. Verify Ollama is running: `ollama list`
3. Test with: `curl http://localhost:11434/api/version`
4. Check server logs for detailed errors
