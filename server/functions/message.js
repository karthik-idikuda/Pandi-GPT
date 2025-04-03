// server/functions/message.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

module.exports.handler = async (event, context) => {
  const { message, sender } = JSON.parse(event.body);

  // Check if both message and sender are provided
  if (!message || !sender) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Message and sender are required' })
    };
  }

  try {
    // Log the user message
    console.log(`User: ${message}`);

    // Get Gemini response
    const result = await model.generateContent(message);
    const botReply = result.response.text();

    // Log bot response
    console.log(`Bot: ${botReply}`);

    // Send the bot response
    return {
      statusCode: 200,
      body: JSON.stringify({ botReply })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process request',
        details: error.message
      })
    };
  }
};
