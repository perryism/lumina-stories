# Template Server

The template server is a simple Express.js backend that allows the application to save templates directly to the `templates/` folder.

## Why is this needed?

Browser applications cannot directly write files to the file system due to security restrictions. The template server provides an API endpoint that the frontend can call to save templates.

## Starting the Server

### Option 1: Run both frontend and server together
```bash
npm run dev:all
```

### Option 2: Run them separately

In one terminal:
```bash
npm run server
```

In another terminal:
```bash
npm run dev
```

## How it works

1. When you click "Save" in the story form, the template is:
   - Saved to localStorage (for immediate use in "My Saved Templates")
   - Sent to the template server API at `http://localhost:3001/api/save-template`

2. The server saves the template as a YAML file in the `templates/` folder

3. Vite automatically detects the new file and includes it in the template browser

4. Refresh the page to see the new template in the "Built-in Templates" section

## API Endpoints

### POST /api/save-template
Saves a template to the templates folder.

**Request Body:**
```json
{
  "filename": "my-template.yaml",
  "content": "# YAML content here..."
}
```

**Response:**
```json
{
  "success": true,
  "filename": "my-template.yaml",
  "path": "/path/to/templates/my-template.yaml"
}
```

### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

## Fallback Behavior

If the template server is not running, the application will fall back to downloading the template file. You'll need to manually save it to the `templates/` folder.

