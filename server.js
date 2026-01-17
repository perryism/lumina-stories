import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// API endpoint to save template
app.post('/api/save-template', async (req, res) => {
  try {
    const { filename, content } = req.body;

    if (!filename || !content) {
      return res.status(400).json({ error: 'Filename and content are required' });
    }

    // Validate filename
    if (!/^[a-z0-9-]+\.yaml$/.test(filename)) {
      return res.status(400).json({ error: 'Invalid filename format' });
    }

    const templatesDir = path.join(__dirname, 'templates');
    const filePath = path.join(templatesDir, filename);

    // Ensure templates directory exists
    await fs.mkdir(templatesDir, { recursive: true });

    // Write the file
    await fs.writeFile(filePath, content, 'utf-8');

    res.json({ success: true, filename, path: filePath });
  } catch (error) {
    console.error('Error saving template:', error);
    res.status(500).json({ error: 'Failed to save template', message: error.message });
  }
});

// API endpoint to save story to libraries folder
app.post('/api/save-story', async (req, res) => {
  try {
    const { filename, content } = req.body;

    if (!filename || !content) {
      return res.status(400).json({ error: 'Filename and content are required' });
    }

    // Validate filename
    if (!/^[a-z0-9-]+\.yaml$/.test(filename)) {
      return res.status(400).json({ error: 'Invalid filename format' });
    }

    const librariesDir = path.join(__dirname, 'libraries');
    const filePath = path.join(librariesDir, filename);

    // Ensure libraries directory exists
    await fs.mkdir(librariesDir, { recursive: true });

    // Write the file
    await fs.writeFile(filePath, content, 'utf-8');

    res.json({ success: true, filename, path: filePath });
  } catch (error) {
    console.error('Error saving story:', error);
    res.status(500).json({ error: 'Failed to save story', message: error.message });
  }
});

// API endpoint to list all stories
app.get('/api/list-stories', async (req, res) => {
  try {
    const librariesDir = path.join(__dirname, 'libraries');

    // Ensure libraries directory exists
    await fs.mkdir(librariesDir, { recursive: true });

    const files = await fs.readdir(librariesDir);
    const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

    res.json({ success: true, files: yamlFiles });
  } catch (error) {
    console.error('Error listing stories:', error);
    res.status(500).json({ error: 'Failed to list stories', message: error.message });
  }
});

// API endpoint to load a story
app.get('/api/load-story/:filename', async (req, res) => {
  try {
    const { filename } = req.params;

    // Validate filename
    if (!/^[a-z0-9-]+\.yaml$/.test(filename)) {
      return res.status(400).json({ error: 'Invalid filename format' });
    }

    const librariesDir = path.join(__dirname, 'libraries');
    const filePath = path.join(librariesDir, filename);

    // Read the file
    const content = await fs.readFile(filePath, 'utf-8');

    res.json({ success: true, filename, content });
  } catch (error) {
    console.error('Error loading story:', error);
    res.status(500).json({ error: 'Failed to load story', message: error.message });
  }
});

// API endpoint to delete a story
app.delete('/api/delete-story/:filename', async (req, res) => {
  try {
    const { filename } = req.params;

    // Validate filename
    if (!/^[a-z0-9-]+\.yaml$/.test(filename)) {
      return res.status(400).json({ error: 'Invalid filename format' });
    }

    const librariesDir = path.join(__dirname, 'libraries');
    const filePath = path.join(librariesDir, filename);

    // Delete the file
    await fs.unlink(filePath);

    res.json({ success: true, filename });
  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({ error: 'Failed to delete story', message: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Template server running on http://localhost:${PORT}`);
});

