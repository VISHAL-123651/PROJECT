import React, { useState, useRef, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import '../styles/chatbot.css';

const Chatbot = () => {
  const { user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  
  const messagesEndRef = useRef(null);
  
  // Quick prompts
  const quickPrompts = [
    "What should I eat for dinner?",
    "How many calories are left?",
    "Suggest a high protein snack",
    "How many calories in an apple?"
  ];

  // Initial greeting
  useEffect(() => {
    if (user && messages.length === 0) {
      setMessages([
        {
          id: 1,
          role: 'model',
          content: `Hi ${user.name.split(' ')[0]}! 👋 I'm NutriBot, your personal AI nutritionist. I know your daily goal is ${user.dailyCalorieGoal} calories. How can I help you today?`
        }
      ]);
      setHasUnread(true);
    }
  }, [user, messages.length]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasUnread(false);
    }
  };

  const formatText = (text) => {
    // Simple formatter for markdown bold (**text**)
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const handleSendMessage = async (text = inputValue) => {
    if (!text.trim()) return;

    // Add user message
    const newUserMessage = {
      id: Date.now(),
      role: 'user',
      content: text
    };
    
    // Prepare history for API
    const conversationHistory = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const res = await api.post('/gemini/chat', {
        message: text,
        conversationHistory
      });

      const newBotMessage = {
        id: Date.now() + 1,
        role: 'model',
        content: res.data.reply
      };

      setMessages(prev => [...prev, newBotMessage]);
      if (!isOpen) setHasUnread(true);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'model',
        content: "Sorry, I'm having trouble connecting right now. Please try again later."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  if (!user) return null;

  return (
    <div className="chatbot-wrapper">
      {/* Chat Window */}
      <div className={`chatbot-window ${isOpen ? 'open' : ''}`}>
        <div className="chatbot-header">
          <div className="chatbot-title">
            <div className="chatbot-avatar">🤖</div>
            <div>
              <div className="chatbot-name">NutriBot AI</div>
              <div className="chatbot-status">Online</div>
            </div>
          </div>
          <button className="chatbot-close" onClick={toggleChat}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="chatbot-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-message chat-message-${msg.role === 'user' ? 'user' : 'bot'}`}>
              <div className="chat-bubble">
                {formatText(msg.content)}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="chat-message chat-message-bot">
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length < 3 && (
          <div className="chat-quick-prompts">
            {quickPrompts.map((prompt, idx) => (
              <button 
                key={idx} 
                className="quick-prompt-btn"
                onClick={() => handleSendMessage(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <div className="chatbot-input-area">
          <input
            type="text"
            className="chatbot-input"
            placeholder="Ask NutriBot..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button 
            className="chatbot-send" 
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isTyping}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>

      {/* Floating Trigger Button */}
      <button className={`chatbot-trigger ${isOpen ? 'open' : ''}`} onClick={toggleChat}>
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        ) : (
          <span style={{ fontSize: '1.5rem' }}>✨</span>
        )}
        {!isOpen && hasUnread && <div className="chatbot-badge"></div>}
      </button>
    </div>
  );
};

export default Chatbot;
