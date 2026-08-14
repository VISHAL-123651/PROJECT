const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const User = require('../models/User');
const Meal = require('../models/Meal');

const router = express.Router();

// Initialize Gemini
const getGeminiModel = () => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });
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
    console.error('Gemini text analysis error:', error);

    if (error instanceof SyntaxError) {
      return res.status(500).json({ message: 'Failed to parse AI response. Please try again.' });
    }

    res.status(500).json({ message: 'Failed to analyze meal. Please try again.' });
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

    // Return image URL for storage
    const imageUrl = `/uploads/${req.file.filename}`;

    res.json({ items: validatedItems, imageUrl });
  } catch (error) {
    console.error('Gemini image analysis error:', error);

    if (error instanceof SyntaxError) {
      return res.status(500).json({ message: 'Failed to parse AI response. Please try again.' });
    }

    res.status(500).json({ message: 'Failed to analyze image. Please try again.' });
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

    const remainingCalories = user.dailyCalorieGoal - todayTotals.calories;

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
    console.error('Gemini chat error:', error);
    res.status(500).json({ message: 'Failed to get response. Please try again.' });
  }
});

module.exports = router;
