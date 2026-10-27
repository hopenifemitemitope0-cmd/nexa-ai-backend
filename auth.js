const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { sendVerificationCode } = require('../utils/email');

const USERS_FILE = path.join(__dirname, '../data/users.json');
const CODES_FILE = path.join(__dirname, '../data/codes.json');

// Helper functions
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function readCodes() {
  if (!fs.existsSync(CODES_FILE)) return {};
  return JSON.parse(fs.readFileSync(CODES_FILE, 'utf8'));
}

function saveCodes(codes) {
  fs.writeFileSync(CODES_FILE, JSON.stringify(codes, null, 2));
}

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, age, password } = req.body;

    if (!name || !email || !age || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (age < 13) {
      return res.status(400).json({ success: false, message: 'You must be at least 13 years old' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const users = readUsers();
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Generate verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codes = readCodes();
    codes[email.toLowerCase()] = {
      code,
      name,
      age,
      password,
      createdAt: Date.now()
    };
    saveCodes(codes);

    // Send code (simulated)
    sendVerificationCode(email, code);

    res.json({
      success: true,
      message: 'Verification code sent to your email',
      // Only for development
      demoCode: code
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// VERIFY EMAIL & CREATE ACCOUNT
router.post('/verify', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and code are required' });
    }

    const codes = readCodes();
    const pending = codes[email.toLowerCase()];

    if (!pending) {
      return res.status(400).json({ success: false, message: 'No verification pending for this email' });
    }

    if (pending.code !== code) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    // Create user
    const hashedPassword = await bcrypt.hash(pending.password, 10);
    const users = readUsers();

    const newUser = {
      id: uuidv4(),
      name: pending.name,
      email: email.toLowerCase(),
      age: pending.age,
      password: hashedPassword,
      voiceEnabled: true,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    // Remove used code
    delete codes[email.toLowerCase()];
    saveCodes(codes);

    // Generate token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.name },
      process.env.JWT_SECRET || 'nexa_super_secret_key_change_this_in_production_12345',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        age: newUser.age,
        voiceEnabled: newUser.voiceEnabled
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const users = readUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET || 'nexa_super_secret_key_change_this_in_production_12345',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        age: user.age,
        voiceEnabled: user.voiceEnabled
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET CURRENT USER
router.get('/me', require('../middleware/auth'), (req, res) => {
  const users = readUsers();
  const user = users.find(u => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      age: user.age,
      voiceEnabled: user.voiceEnabled
    }
  });
});

module.exports = router;