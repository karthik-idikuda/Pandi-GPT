import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Copy, Check, Loader, X } from 'lucide-react';
import axios from 'axios';
import './App.css';

// Animation variants for message transitions
const messageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

const containerVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } }
};

// API configuration - use environment variable if available
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const App = () => {
  // Load messages from localStorage if available
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [greeting, setGreeting] = useState('');
  const messagesEndRef = useRef(null);
  const [textareaHeight, setTextareaHeight] = useState('auto');
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  // Update greeting based on time of day
  useEffect(() => {
    setGreeting(getGreeting());
    const interval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    if (hour >= 17 && hour < 21) return "Good Evening";
    return "Good Night";
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const adjustTextareaHeight = (e) => {
    const element = e.target;
    setTextareaHeight('auto');
    const scrollHeight = element.scrollHeight;
    setTextareaHeight(`${scrollHeight}px`);
  };

  const handleCopy = (messageId, messageText) => {
    try {
      navigator.clipboard.writeText(messageText);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      setError('Failed to copy message');
      setTimeout(() => setError(null), 3000);
    }
  };

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear all messages?')) {
      setMessages([]);
      localStorage.removeItem('chatMessages');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const userMessage = {
        id: Date.now(),
        text: newMessage.trim(),
        isUser: true,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, userMessage]);
      setNewMessage('');
      setTextareaHeight('auto');

      // Make API request with proper timeout
      const response = await axios.post(`${API_URL}/api/message`, {
        message: userMessage.text,
        sender: 'user'
      }, {
        timeout: 15000 // 15 seconds timeout
      });

      // Check if response contains expected data
      if (!response.data || !response.data.botReply) {
        throw new Error('Invalid response from server');
      }

      const botMessage = {
        id: Date.now() + 1,
        text: response.data.botReply,
        isUser: false,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      
      // Detailed error message based on the error type
      let errorMessage = 'Failed to connect to server';
      
      if (error.response) {
        // Server responded with an error status
        const serverError = error.response.data?.error || 'Unknown server error';
        const details = error.response.data?.details || '';
        errorMessage = `Server Error (${error.response.status}): ${serverError}${details ? ` - ${details}` : ''}`;
      } else if (error.request) {
        // Request made but no response received
        errorMessage = 'No response from server. Please check your connection.';
      } else if (error.message) {
        // Error setting up the request
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="app-container"
      initial="initial"
      animate="animate"
      variants={containerVariants}
    >
      <motion.div 
        className="greeting-container"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="greeting">
          {greeting}, <span className="user-name">Karthik</span> 👋
        </h2>
        {messages.length > 0 && (
          <motion.button
            className="clear-chat-button"
            onClick={clearChat}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <X size={16} /> Clear Chat
          </motion.button>
        )}
      </motion.div>

      <div className="chat-container">
        <motion.div 
          className="chat-header"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h1>AI Chat Assistant</h1>
        </motion.div>

        <div className="messages-container">
          {messages.length === 0 && (
            <motion.div 
              className="empty-chat-message"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.5 } }}
            >
              Send a message to start chatting with the AI
            </motion.div>
          )}
          
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                className={`message-wrapper ${message.isUser ? 'user' : 'bot'}`}
                variants={messageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                layout
              >
                <div className={`avatar ${message.isUser ? 'user' : 'bot'}`}>
                  {message.isUser ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div className={`message ${message.isUser ? 'user' : 'bot'}`}>
                  <div className="message-content">
                    {message.text}
                    {!message.isUser && (
                      <button 
                        className="copy-button"
                        onClick={() => handleCopy(message.id, message.text)}
                        title="Copy message"
                      >
                        {copiedMessageId === message.id ? (
                          <Check size={16} className="copied-icon" />
                        ) : (
                          <Copy size={16} className="copy-icon" />
                        )}
                      </button>
                    )}
                  </div>
                  <div className="message-timestamp">
                    {new Date(message.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div 
              className="message-wrapper bot"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="avatar bot">
                <Bot size={20} />
              </div>
              <div className="message bot">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              className="error-banner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              {error}
              <button 
                className="error-close"
                onClick={() => setError(null)}
              >
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          className="input-area"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <form onSubmit={handleSubmit} className="input-form">
            <textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                adjustTextareaHeight(e);
              }}
              style={{ height: textareaHeight }}
              placeholder="Type your message here..."
              disabled={loading}
              className="message-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <motion.button 
              type="submit" 
              disabled={loading || !newMessage.trim()}
              className="send-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {loading ? (
                <Loader className="spin" size={20} />
              ) : (
                <Send size={20} />
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default App;