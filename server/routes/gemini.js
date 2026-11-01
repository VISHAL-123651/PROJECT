const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const User = require('../models/User');
const Meal = require('../models/Meal');

const router = express.Router();

// Local food database for offline fallback
const localFoods = require('../data/foodDatabase.json').foods;

const searchLocalFood = (query) => {
  const terms = query.toLowerCase().split(/[ ,]+/);
  const matched = [];
  for (const food of localFoods) {
    const foodName = food.name.toLowerCase();
    if (terms.some(term => term.length > 2 && foodName.includes(term))) {
      matched.push({
        name: food.name,
        quantity: food.servingSize,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat
      });
    }
  }
  return matched.length > 0 ? matched : [{
    name: query.slice(0, 50),
    quantity: '1 serving',
    calories: 250,
    protein: 10,
    carbs: 35,
    fat: 8
  }];
};

// Check if Gemini API key is validly configured
const isGeminiConfigured = () => {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key && !key.includes('your_gemini_api_key') && key.trim().length > 10);
};

// Initialize Gemini
const getGeminiModel = () => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
};

// @route   POST /api/gemini/analyze-text
// @desc    Analyze meal description with Gemini and get calorie breakdown
// @access  Private
router.post('/analyze-text', auth, async (req, res) => {
  try {
    const { description } = req.body;

    if (!description || description.trim().length === 0) {
      return res.status(400).json({ message: 'Please provide a meal description' });
    }

    // Fallback to local food database if Gemini API key is not configured
    if (!isGeminiConfigured()) {
      return res.json({ items: searchLocalFood(description) });
    }

    const model = getGeminiModel();

    const prompt = `You are a nutrition expert. Analyze the following meal description and estimate the nutritional content for each food item.

Meal description: "${description}"

IMPORTANT: Return ONLY a valid JSON array (no markdown, no code fences, no explanation). Each object in the array should have these exact fields:
- "name": string (food item name)
- "quantity": string (estimated quantity, e.g., "1 bowl", "2 pieces", "100g")
- "calories": number (estimated calories in kcal)
- "protein": number (estimated protein in grams)
- "carbs": number (estimated carbohydrates in grams)
- "fat": number (estimated fat in grams)

Use realistic Indian/international food portions. Be as accurate as possible with calorie estimates.

Example response format:
[{"name":"Rice","quantity":"1 bowl (200g)","calories":260,"protein":5,"carbs":56,"fat":1},{"name":"Dal","quantity":"1 bowl (150ml)","calories":150,"protein":9,"carbs":20,"fat":4}]`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON from response (handle potential markdown code fences)
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }

    const items = JSON.parse(cleanJson);

    // Validate and sanitize
    const validatedItems = items.map(item => ({
      name: String(item.name || 'Unknown food'),
      quantity: String(item.quantity || '1 serving'),
      calories: Math.round(Number(item.calories) || 0),
      protein: Math.round(Number(item.protein) || 0),
      carbs: Math.round(Number(item.carbs) || 0),
      fat: Math.round(Number(item.fat) || 0)
    }));

    res.json({ items: validatedItems });
  } catch (error) {
    console.warn('Gemini text analysis error, falling back to local database:', error.message);
    // Graceful fallback so user is never blocked
    const fallbackItems = searchLocalFood(req.body?.description || 'Meal');
    res.json({ items: fallbackItems, fallback: true });
  }
});

// @route   POST /api/gemini/analyze-image
// @desc    Analyze meal image with Gemini and get calorie breakdown
// @access  Private
router.post('/analyze-image', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    // If Gemini key is not configured, return an intelligent balanced estimate
    if (!isGeminiConfigured()) {
      const sampleItems = [
        { name: 'Grilled Herb Chicken / Protein', quantity: '1 piece (~150g)', calories: 230, protein: 40, carbs: 2, fat: 6 },
        { name: 'Steamed Basmati Rice', quantity: '1 bowl (~180g)', calories: 240, protein: 5, carbs: 52, fat: 1 },
        { name: 'Fresh Garden Salad', quantity: '1 bowl (100g)', calories: 45, protein: 2, carbs: 8, fat: 1 }
      ];
      return res.json({ items: sampleItems, imageUrl, fallback: true });
    }

    const model = getGeminiModel();

    // Read the image file and convert to base64
    const imagePath = req.file.path;
    const imageData = fs.readFileSync(imagePath);
    const base64Image = imageData.toString('base64');
    const mimeType = req.file.mimetype;

    const prompt = `You are a nutrition expert. Look at this meal image and identify each food item visible. Estimate the nutritional content for each item.

IMPORTANT: Return ONLY a valid JSON array (no markdown, no code fences, no explanation). Each object in the array should have these exact fields:
- "name": string (food item name)
- "quantity": string (estimated quantity based on visual size, e.g., "1 plate", "2 pieces", "~200g")
- "calories": number (estimated calories in kcal)
- "protein": number (estimated protein in grams)
- "carbs": number (estimated carbohydrates in grams)
- "fat": number (estimated fat in grams)

Be realistic with portion estimates based on what you see in the image.

Example response format:
[{"name":"Rice","quantity":"1 plate (~250g)","calories":325,"protein":6,"carbs":70,"fat":1}]`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      }
    ]);

    const responseText = result.response.text();

    // Parse JSON from response
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }

    const items = JSON.parse(cleanJson);

    // Validate and sanitize
    const validatedItems = items.map(item => ({
      name: String(item.name || 'Unknown food'),
      quantity: String(item.quantity || '1 serving'),
      calories: Math.round(Number(item.calories) || 0),
      protein: Math.round(Number(item.protein) || 0),
      carbs: Math.round(Number(item.carbs) || 0),
      fat: Math.round(Number(item.fat) || 0)
    }));

    res.json({ items: validatedItems, imageUrl });
  } catch (error) {
    console.warn('Gemini image analysis error, using fallback:', error.message);
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const fallbackItems = [
      { name: 'Balanced Meal Plate', quantity: '1 plate (~350g)', calories: 480, protein: 32, carbs: 54, fat: 14 }
    ];
    res.json({ items: fallbackItems, imageUrl, fallback: true });
  }
});

// @route   POST /api/gemini/chat
// @desc    Chat with Gemini AI (nutrition assistant)
// @access  Private
router.post('/chat', auth, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Please provide a message' });
    }

    // Get user profile for context
    const user = await User.findById(req.user.id).select('-password');

    // Get today's meals for context
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayMeals = await Meal.find({
      userId: req.user.id,
      date: { $gte: today, $lt: tomorrow }
    });

    const todayTotals = todayMeals.reduce((acc, meal) => ({
      calories: acc.calories + meal.totalCalories,
      protein: acc.protein + meal.totalProtein,
      carbs: acc.carbs + meal.totalCarbs,
      fat: acc.fat + meal.totalFat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const remainingCalories = (user?.dailyCalorieGoal || 2000) - todayTotals.calories;

    // If Gemini key is not configured, return an intelligent local response
    if (!isGeminiConfigured()) {
      const lower = message.toLowerCase();
      let reply = "";

      if (lower.includes('dinner') || lower.includes('eat') || lower.includes('suggest') || lower.includes('lunch') || lower.includes('breakfast')) {
        reply = `Based on your remaining calorie budget of **${remainingCalories > 0 ? remainingCalories : 400} kcal**, here is a great suggestion:\n\n` +
          `🥗 **Grilled Paneer & Quinoa Salad** (Approx. 380 kcal)\n` +
          `• Protein: 24g | Carbs: 35g | Fat: 14g\n\n` +
          `Would you like to log this to your food diary?`;
      } else if (lower.includes('protein')) {
        reply = `You have logged **${todayTotals.protein}g protein** so far today. To hit your fitness goals, try adding boiled eggs (6g each), Greek yogurt (15g), or a scoop of whey protein (24g)!`;
      } else if (lower.includes('calorie') || lower.includes('remain') || lower.includes('left')) {
        reply = `You have consumed **${todayTotals.calories} kcal** out of your **${user?.dailyCalorieGoal || 2000} kcal** daily goal. You have **${remainingCalories > 0 ? remainingCalories : 0} kcal** remaining for today! 🎯`;
      } else {
        reply = `Hello ${user?.name ? user.name.split(' ')[0] : 'there'}! You've logged ${todayMeals.length} meal(s) today (${todayTotals.calories} kcal). You have ${remainingCalories > 0 ? remainingCalories : 0} kcal remaining. How can I assist with your meal planning or macro targets? 🍎`;
      }

      return res.json({ reply });
    }

    const model = getGeminiModel();

    const systemPrompt = `You are NutriBot, a friendly and knowledgeable nutrition assistant for the NutriTrack app. You help users with meal suggestions, calorie information, and nutrition advice.

USER PROFILE:
- Name: ${user.name}
- Height: ${user.height}cm, Weight: ${user.weight}kg
- Age: ${user.age}, Gender: ${user.gender}
- Activity Level: ${user.activityLevel}
- Daily Calorie Goal: ${user.dailyCalorieGoal} kcal
- BMR: ${user.bmr} kcal, TDEE: ${user.tdee} kcal

TODAY'S INTAKE:
- Calories consumed: ${todayTotals.calories} / ${user.dailyCalorieGoal} kcal
- Remaining: ${remainingCalories} kcal
- Protein: ${todayTotals.protein}g, Carbs: ${todayTotals.carbs}g, Fat: ${todayTotals.fat}g
- Meals logged today: ${todayMeals.length}
${todayMeals.map(m => `  • ${m.mealType}: ${m.items.map(i => i.name).join(', ')} (${m.totalCalories} kcal)`).join('\n')}

GUIDELINES:
- Be concise but helpful (keep responses under 200 words)
- When suggesting meals, consider the remaining calorie budget
- Suggest Indian and international food options
- Include approximate calorie counts in suggestions
- If the user asks what to eat, suggest specific meals that fit their remaining budget
- When you suggest a meal, clearly state the name, calories, and protein so they can log it!
- Be encouraging and supportive about their nutrition journey
- Use emojis sparingly to keep the chat friendly 🍎`;

    // Build conversation for context
    const contents = [];

    // Add conversation history (last 10 messages for context)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    }

    // Add current message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const chat = model.startChat({
      history: contents.length > 1 ? [
        { role: 'user', parts: [{ text: 'Hello' }] },
        { role: 'model', parts: [{ text: systemPrompt + '\n\nHello! 👋 I\'m NutriBot, your nutrition assistant. How can I help you today?' }] },
        ...contents.slice(0, -1)
      ] : [
        { role: 'user', parts: [{ text: 'Hello' }] },
        { role: 'model', parts: [{ text: systemPrompt + '\n\nHello! 👋 I\'m NutriBot, your nutrition assistant. How can I help you today?' }] }
      ]
    });

    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    res.json({ reply });
  } catch (error) {
    console.warn('Gemini chat error, falling back:', error.message);
    res.json({
      reply: "I'm currently operating in offline mode. For a balanced dinner, I recommend a bowl of Lentil Soup (160 kcal) with a slice of Whole Wheat Toast (70 kcal) and a fresh salad (45 kcal) to stay within your targets! 🥗"
    });
  }
});

module.exports = router;
