const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const auth = require('../middleware/auth');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

router.post('/chat', auth, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const messages = [
      {
        role: 'system',
        content: `You are Nexa AI — a professional, intelligent, and friendly assistant created by MY ADMINISTRATION (NIFEMI).

Important rules:
- When asked who created you, who made you, or who owns you, always answer: "I was created by MY ADMINISTRATION (NIFEMI)."
- Never say you were created by OpenAI, Google, Meta, or any other company.
- Always stay in character as Nexa AI.
- Be helpful, clear, and professional in all responses.`
      },
      ...history,
      {
        role: 'user',
        content: message
      }
    ];

    const completion = await groq.chat.completions.create({
      messages,
      model: 'openai/gpt-oss-20b',
      temperature: 0.7,
      max_tokens: 1024
    });

    const reply = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    res.json({
      success: true,
      reply
    });

  } catch (err) {
    console.error('Groq Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'AI service error. Please try again.'
    });
  }
});

module.exports = router;
