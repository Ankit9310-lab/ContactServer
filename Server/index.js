import express from 'express';
import cors from 'cors';
import { writeFile, readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT  3000;

// Create messages directory if it doesn't exist
const messagesDir = join(__dirname, 'messages');
try {
  await import('fs').then(fs => fs.mkdirSync(messagesDir, { recursive: true }));
} catch (error) {
  console.error('Error creating messages directory:', error);
}

// Configure CORS for production
const allowedOrigins = [
  'http://localhost:5173',
  'https://your-netlify-app.netlify.app' // This will be replaced with your actual Netlify URL
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin  allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get all messages
app.get('/api/messages', async (req, res) => {
  try {
    const files = await readdir(messagesDir);
    const messages = await Promise.all(
      files.map(async (file) => {
        const content = await readFile(join(messagesDir, file), 'utf-8');
        return JSON.parse(content);
      })
    );
    res.json(messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
  } catch (error) {
    console.error('Error reading messages:', error);
    res.status(500).json({ error: 'Failed to read messages' });
  }
});

// Add new message
app.post('/api/messages', async (req, res) => {
  try {
    const message = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      read: false,
      ...req.body
    };

    const filename = ${message.id}.json;
    await writeFile(
      join(messagesDir, filename),
      JSON.stringify(message, null, 2)
    );

    res.status(201).json(message);
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// Mark message as read
app.patch('/api/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filename = ${id}.json;
    const filePath = join(messagesDir, filename);
    
    const content = await readFile(filePath, 'utf-8');
    const message = JSON.parse(content);
    message.read = true;

    await writeFile(filePath, JSON.stringify(message, null, 2));
    res.json(message);
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

app.listen(port, () => {
  console.log(Server running on port ${port});
});
