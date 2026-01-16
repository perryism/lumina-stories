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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Template server running on http://localhost:${PORT}`);
});

