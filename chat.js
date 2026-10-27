const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');

const CHATS_FILE = path.join(__dirname, '../data/chats.json');

function readChats() {
  if (!fs.existsSync(CHATS_FILE)) return [];
  return JSON.parse(fs.readFileSync(CHATS_FILE, 'utf8'));
}

function saveChats(chats) {
  fs.writeFileSync(CHATS_FILE, JSON.stringify(chats, null, 2));
}

// GET ALL CHATS FOR USER
router.get('/', auth, (req, res) => {
  const chats = readChats();
  const userChats = chats
    .filter(c => c.userId === req.user.id)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  res.json({ success: true, chats: userChats });
});

// CREATE NEW CHAT
router.post('/', auth, (req, res) => {
  const chats = readChats();

  const newChat = {
    id: uuidv4(),
    userId: req.user.id,
    title: 'New Chat',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  chats.push(newChat);
  saveChats(chats);

  res.json({ success: true, chat: newChat });
});

// GET SINGLE CHAT
router.get('/:id', auth, (req, res) => {
  const chats = readChats();
  const chat = chats.find(c => c.id === req.params.id && c.userId === req.user.id);

  if (!chat) {
    return res.status(404).json({ success: false, message: 'Chat not found' });
  }

  res.json({ success: true, chat });
});

// ADD MESSAGE TO CHAT
router.post('/:id/message', auth, (req, res) => {
  const { role, text, image } = req.body;

  if (!role || !text) {
    return res.status(400).json({ success: false, message: 'Role and text are required' });
  }

  const chats = readChats();
  const chatIndex = chats.findIndex(c => c.id === req.params.id && c.userId === req.user.id);

  if (chatIndex === -1) {
    return res.status(404).json({ success: false, message: 'Chat not found' });
  }

  const message = {
    id: uuidv4(),
    role,
    text,
    image: image || null,
    createdAt: new Date().toISOString()
  };

  chats[chatIndex].messages.push(message);
  chats[chatIndex].updatedAt = new Date().toISOString();

  // Auto-title from first user message
  if (chats[chatIndex].title === 'New Chat' && role === 'user') {
    chats[chatIndex].title = text.substring(0, 40) + (text.length > 40 ? '...' : '');
  }

  saveChats(chats);

  res.json({ success: true, message, chat: chats[chatIndex] });
});

// DELETE CHAT
router.delete('/:id', auth, (req, res) => {
  let chats = readChats();
  const initialLength = chats.length;

  chats = chats.filter(c => !(c.id === req.params.id && c.userId === req.user.id));

  if (chats.length === initialLength) {
    return res.status(404).json({ success: false, message: 'Chat not found' });
  }

  saveChats(chats);
  res.json({ success: true, message: 'Chat deleted' });
});

module.exports = router;