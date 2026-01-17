# Docker Setup for Lumina Stories

This guide explains how to run Lumina Stories using Docker Compose.

## Prerequisites

- Docker installed on your system
- Docker Compose installed (usually comes with Docker Desktop)

## Quick Start

1. **Configure your AI provider** by creating a `.env` file in the project root:

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` with your preferred AI provider configuration:

   **Option A: Use Gemini (default)**
   ```env
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

   **Option B: Use OpenAI**
   ```env
   AI_PROVIDER=openai
   OPENAI_API_KEY=your_openai_api_key_here
   ```

   **Option C: Use Local Chat Server**
   ```env
   AI_PROVIDER=local
   LOCAL_API_URL=http://localhost:1234/v1
   LOCAL_MODEL=your-model-name
   ```

2. **Start the application**:

   ```bash
   docker-compose up -d
   ```

   This will:
   - Build and start the API server on port 3001
   - Build and start the frontend server on port 3000

3. **Access the application**:

   Open your browser and navigate to: http://localhost:3000

## Docker Compose Commands

### Start the services
```bash
docker-compose up -d
```

### View logs
```bash
# All services
docker-compose logs -f

# API server only
docker-compose logs -f api

# Frontend only
docker-compose logs -f frontend
```

### Stop the services
```bash
docker-compose down
```

### Rebuild the containers (after code changes)
```bash
docker-compose up -d --build
```

### Restart a specific service
```bash
docker-compose restart api
docker-compose restart frontend
```

## Architecture

The Docker setup consists of two services:

1. **API Service** (`lumina-api`)
   - Runs the Express.js backend server
   - Handles template and story file management
   - Exposes port 3001
   - Persists data in `./templates` and `./libraries` directories

2. **Frontend Service** (`lumina-frontend`)
   - Runs the Vite development server with React
   - Serves the web application
   - Exposes port 3000
   - Connects to the API service for file operations

## Volumes

The following directories are mounted as volumes to persist data:

- `./templates` - Story templates
- `./libraries` - Saved stories
- `./genres.yaml` - Genre definitions

## Environment Variables

All environment variables from `.env` are automatically passed to the containers. See `.env.example` for available options.

## Troubleshooting

### Port already in use
If ports 3000 or 3001 are already in use, you can modify them in `docker-compose.yml`:

```yaml
ports:
  - "8080:3000"  # Change 8080 to your preferred port
```

### Containers won't start
Check the logs:
```bash
docker-compose logs
```

### Reset everything
```bash
docker-compose down -v
docker-compose up -d --build
```

## Production Deployment

For production deployment, consider:

1. **Build the frontend** for better performance:
   - Uncomment the build step in `Dockerfile.frontend`
   - Change the CMD to use `npm run preview`

2. **Use environment-specific configurations**:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

3. **Add a reverse proxy** (nginx/traefik) for SSL and routing

4. **Set up proper secrets management** instead of using `.env` files

## Development

For development with hot-reload:

1. The frontend container runs in development mode by default
2. Code changes will be reflected automatically
3. For API changes, restart the API container:
   ```bash
   docker-compose restart api
   ```

## Support

For issues or questions, refer to the main README.md or open an issue on the project repository.

