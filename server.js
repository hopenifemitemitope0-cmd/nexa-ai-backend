const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Create data folder if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Nexa AI Backend is running',
    version: '1.0.0'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Nexa AI Backend running on http://localhost:${PORT}`);
});