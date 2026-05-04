import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const USERS_DB_FILE = path.join(__dirname, 'users.json');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Helper functions for user database
const loadUsers = async () => {
  try {
    const data = await fs.readFile(USERS_DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
};

const saveUsers = async (users) => {
  await fs.writeFile(USERS_DB_FILE, JSON.stringify(users, null, 2));
};

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Authentication Endpoints

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const users = await loadUsers();

    if (users[username]) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = Date.now().toString();

    users[username] = {
      id: userId,
      username,
      password: hashedPassword,
    };

    await saveUsers(users);

    const token = jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: { id: userId, username },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const users = await loadUsers();
    const user = users[username];

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify token endpoint
app.get('/api/auth/verify', verifyToken, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// API endpoint to save template
app.post('/api/save-template', verifyToken, async (req, res) => {
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
app.get('/api/list-stories', verifyToken, async (req, res) => {
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
app.get('/api/load-story/:filename', verifyToken, async (req, res) => {
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
app.delete('/api/delete-story/:filename', verifyToken, async (req, res) => {
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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Template server running on http://localhost:${PORT}`);
});

