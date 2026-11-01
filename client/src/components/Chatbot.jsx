import React, { useState, useRef, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { mealService } from '../services/mealService';
import '../styles/chatbot.css';

const Chatbot = () => {
  const { user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [loggedMealToast, setLoggedMealToast] = useState('');
  
  const messagesEndRef = useRef(null);

  // Time-of-day dynamic prompt generation
  const getDynamicPrompts = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return [
        "What should I eat for breakfast under 400 kcal?",
        "High-protein breakfast ideas",
        "How many calories are left today?",
        "Is black coffee healthy with oats?"
      ];
    } else if (hour < 17) {
      return [
        "High-protein lunch under 600 kcal",
        "Post-workout recovery snack",
        "How are my macros looking today?",
        "Suggest a quick 200 kcal bite"
      ];
    } else {
      return [
        "What should I eat for dinner under 500 kcal?",
        "Low-carb late night snack",
        "Did I hit my protein goal today?",
        "How to balance my remaining calories?"
      ];
    }
  };

  const dynamicPrompts = getDynamicPrompts();

  // Initial greeting
  useEffect(() => {
    if (user && messages.length === 0) {
      const remaining = user.dailyCalorieGoal ? user.dailyCalorieGoal - 1280 : 800;
      setMessages([
        {
          id: 1,
          role: 'model',
          content: `Hi ${user.name.split(' ')[0]}! 👋 I'm NutriBot, your AI nutritionist. Your daily goal is ${user.dailyCalorieGoal || 2000} kcal. You have plenty of budget left today! Ask me what to eat, or click any prompt below. 🥗`,
          suggestedMeal: {
            name: 'Grilled Herb Chicken & Steamed Rice',
            calories: 480,
            protein: 42,
            carbs: 52,
            fat: 8
          }
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

  // Extract meal suggestion from text to render 1-click Log button
  const extractMealSuggestion = (text) => {
    // Look for patterns like "Grilled Paneer & Quinoa Salad (Approx. 380 kcal)" or "380 kcal"
    const match = text.match(/(?:[•*#\n]|^)\s*([A-Za-z0-9 ,/&'-]+?)\s*(?:\(|approx\.?|~)?\s*(\d{2,4})\s*kcal/i);
    if (match && match[1] && match[2]) {
      const name = match[1].replace(/[*_#🥗🍗🥣🍳]/g, '').trim();
      const calories = parseInt(match[2], 10);
      if (name.length > 3 && calories > 50 && calories < 2000) {
        return { name, calories, protein: 24, carbs: 38, fat: 10 };
      }
    }
    return null;
  };

  const handleLogSuggestedMeal = async (meal) => {
    try {
      await mealService.saveMeal({
        items: [{
          name: meal.name,
          quantity: '1 serving',
          calories: meal.calories,
          protein: meal.protein || 20,
          carbs: meal.carbs || 35,
          fat: meal.fat || 8
        }],
        mealType: new Date().getHours() >= 17 ? 'dinner' : 'lunch',
        inputType: 'text'
      });

      setLoggedMealToast(`✓ Successfully logged "${meal.name}" (${meal.calories} kcal) to today's diary!`);
      setTimeout(() => setLoggedMealToast(''), 4000);
    } catch (err) {
      console.error('Log suggested meal error:', err);
      alert('Could not log meal. Please try again.');
    }
  };

  const formatText = (text) => {
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

    const newUserMessage = {
      id: Date.now(),
      role: 'user',
      content: text
    };
    
    const conversationHistory = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const isDemo = localStorage.getItem('nutritrack_demo_mode') === 'true';
      if (isDemo) {
        // Fast intelligent response tailored to Alex's remaining calories
        await new Promise(r => setTimeout(r, 800));
        const lower = text.toLowerCase();
        let reply = "";
        let suggested = null;

        if (lower.includes('dinner') || lower.includes('eat') || lower.includes('suggest') || lower.includes('meal')) {
          reply = `With ~1,020 kcal left in your daily budget, I recommend **Grilled Paneer & Quinoa Salad** (Approx. 380 kcal). It delivers 24g of protein and healthy complex carbs!`;
          suggested = { name: 'Grilled Paneer & Quinoa Salad', calories: 380, protein: 24, carbs: 35, fat: 12 };
        } else if (lower.includes('protein')) {
          reply = `You've had 80g of protein today against your 130g target. Adding a **Greek Yogurt with Blueberries & Chia** (210 kcal, 18g Protein) will keep you in the optimal muscle repair zone!`;
          suggested = { name: 'Greek Yogurt with Blueberries & Chia', calories: 210, protein: 18, carbs: 20, fat: 6 };
        } else if (lower.includes('calorie') || lower.includes('left') || lower.includes('remain')) {
          reply = `You've consumed 1,280 kcal out of your 2,300 kcal target. That leaves **1,020 kcal** for dinner and an evening snack! 🎯`;
        } else {
          reply = `Great choice! To keep your energy high and stay on track with your 2,300 kcal goal, try pairing lean protein with fresh colorful greens. What would you like to prepare next? 🍎`;
        }

        const newBotMessage = {
          id: Date.now() + 1,
          role: 'model',
          content: reply,
          suggestedMeal: suggested
        };
        setMessages(prev => [...prev, newBotMessage]);
        if (!isOpen) setHasUnread(true);
      } else {
        const res = await api.post('/gemini/chat', {
          message: text,
          conversationHistory
        });

        const reply = res.data.reply;
        const suggested = extractMealSuggestion(reply);

        const newBotMessage = {
          id: Date.now() + 1,
          role: 'model',
          content: reply,
          suggestedMeal: suggested
        };

        setMessages(prev => [...prev, newBotMessage]);
        if (!isOpen) setHasUnread(true);
      }
    } catch (err) {
      console.warn('Chat request failed, using local advice:', err);
      const fallbackReply = "Based on your remaining calorie budget, I recommend a wholesome **Mediterranean Lentil Soup with Feta** (Approx. 340 kcal). It's filling, high-fiber, and delicious! 🥣";
      const newBotMessage = {
        id: Date.now() + 1,
        role: 'model',
        content: fallbackReply,
        suggestedMeal: { name: 'Mediterranean Lentil Soup with Feta', calories: 340, protein: 18, carbs: 42, fat: 9 }
      };
      setMessages(prev => [...prev, newBotMessage]);
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
      {/* Toast Notification for 1-Click Logged Meal */}
      {loggedMealToast && (
        <div className="chatbot-logged-toast">
          {loggedMealToast}
        </div>
      )}

      {/* Chat Window */}
      <div className={`chatbot-window ${isOpen ? 'open' : ''}`}>
        <div className="chatbot-header">
          <div className="chatbot-title">
            <div className="chatbot-avatar">🍏</div>
            <div>
              <div className="chatbot-name">NutriBot AI Coach</div>
              <div className="chatbot-status">
                <span className="online-dot"></span> Online & Personalized
              </div>
            </div>
          </div>
          <button className="chatbot-close" onClick={toggleChat} title="Close chat">
            ✕
          </button>
        </div>

        <div className="chatbot-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-message chat-message-${msg.role === 'user' ? 'user' : 'bot'}`}>
              <div className="chat-bubble">
                <div className="chat-bubble-text">{formatText(msg.content)}</div>

                {/* One-Click "Log Suggested Meal" Button */}
                {msg.suggestedMeal && (
                  <div className="chat-suggested-meal-box">
                    <div className="suggested-meal-meta">
                      <span className="suggested-icon">🍽️</span>
                      <div>
                        <strong>{msg.suggestedMeal.name}</strong>
                        <span className="suggested-kcal"> ~{msg.suggestedMeal.calories} kcal</span>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      className="btn-log-suggested"
                      onClick={() => handleLogSuggestedMeal(msg.suggestedMeal)}
                    >
                      + Log this meal ({msg.suggestedMeal.calories} kcal)
                    </button>
                  </div>
                )}
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

        {/* Dynamic Time-of-Day Quick Suggestion Chips */}
        <div className="chat-quick-prompts">
          <span className="quick-prompts-label">Suggested Topics:</span>
          <div className="quick-prompts-scroll">
            {dynamicPrompts.map((prompt, idx) => (
              <button 
                key={idx} 
                className="quick-prompt-btn"
                onClick={() => handleSendMessage(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="chatbot-input-area">
          <input
            type="text"
            className="chatbot-input"
            placeholder="Ask NutriBot (e.g. 'What can I eat for dinner?')..."
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

      {/* Floating Glass Pill Indicator Badge */}
      <button 
        className={`chatbot-trigger-pill ${isOpen ? 'open' : ''}`} 
        onClick={toggleChat}
        title="Open NutriBot AI"
      >
        <span className="trigger-pill-icon">🍏</span>
        <div className="trigger-pill-text">
          <span className="trigger-pill-title">NutriBot</span>
          <span className="trigger-pill-prompt">
            {new Date().getHours() >= 17 ? 'Ask what to eat for dinner' : 'Ask what to eat'}
          </span>
        </div>
        {hasUnread && !isOpen && <span className="trigger-pill-badge"></span>}
      </button>
    </div>
  );
};

export default Chatbot;
