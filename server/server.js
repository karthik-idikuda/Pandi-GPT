const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['POST'],
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));

// Check for API key
if (!process.env.GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

// Gemini AI Configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Serverless-style handler function
const messageHandler = async (req, res) => {
  const { message, sender } = req.body;

  if (!message || !sender) {
    return res.status(400).json({ error: 'Message and sender are required' });
  }

  try {
    // Log user message
    console.log(`User: ${message}`);

    // Get the correct model - use gemini-1.5-pro (check available models)
    // This might need to be adjusted based on available models in your API access
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Generate content with proper error handling
    const result = await model.generateContent(message);
    
    // Safely extract the response
    const response = result.response;
    const botReply = response.text();

    // Log bot response
    console.log(`Bot: ${botReply}`);

    // Send bot reply as response
    return res.json({ botReply });
  } catch (error) {
    // Enhanced error logging
    console.error('Error details:', error);
    
    // Return appropriate error message
    return res.status(500).json({
      error: 'Failed to process request',
      details: error.message || 'Unknown error'
    });
  }
};

// Use the handler in Express route
app.post('/api/message', messageHandler);

// Add a test route to check available models
app.get('/api/models', async (req, res) => {
  try {
    const models = await genAI.listModels();
    res.json({ models });
  } catch (error) {
    console.error('Error listing models:', error);
    res.status(500).json({ error: 'Failed to list models', details: error.message });
  }
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));