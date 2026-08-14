const express = require('express');
const Meal = require('../models/Meal');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/meals
// @desc    Get user's meals (with optional date filtering)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { date, startDate, endDate, limit = 50 } = req.query;
    
    let query = { userId: req.user.id };

    // Filter by specific date (get all meals for that day)
    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      query.date = { $gte: dayStart, $lte: dayEnd };
    }
    // Filter by date range
    else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const meals = await Meal.find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(parseInt(limit));

    res.json(meals);
  } catch (error) {
    console.error('Get meals error:', error);
    res.status(500).json({ message: 'Server error fetching meals' });
  }
});

// @route   GET /api/meals/today
// @desc    Get today's meals with totals
// @access  Private
router.get('/today', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const meals = await Meal.find({
      userId: req.user.id,
      date: { $gte: today, $lt: tomorrow }
    }).sort({ createdAt: -1 });

    // Calculate daily totals
    const totals = meals.reduce((acc, meal) => ({
      calories: acc.calories + meal.totalCalories,
      protein: acc.protein + meal.totalProtein,
      carbs: acc.carbs + meal.totalCarbs,
      fat: acc.fat + meal.totalFat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    res.json({ meals, totals });
  } catch (error) {
    console.error('Get today meals error:', error);
    res.status(500).json({ message: 'Server error fetching today\'s meals' });
  }
});

// @route   GET /api/meals/stats
// @desc    Get meal stats for the last 7 days
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    const meals = await Meal.find({
      userId: req.user.id,
      date: { $gte: startDate, $lte: endDate }
    });

    // Group by date
    const dailyStats = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dailyStats[key] = { calories: 0, protein: 0, carbs: 0, fat: 0, mealCount: 0 };
    }

    meals.forEach(meal => {
      const key = new Date(meal.date).toISOString().split('T')[0];
      if (dailyStats[key]) {
        dailyStats[key].calories += meal.totalCalories;
        dailyStats[key].protein += meal.totalProtein;
        dailyStats[key].carbs += meal.totalCarbs;
        dailyStats[key].fat += meal.totalFat;
        dailyStats[key].mealCount += 1;
      }
    });

    // Calculate streak
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const sortedDates = Object.keys(dailyStats).sort().reverse();
    for (const date of sortedDates) {
      if (dailyStats[date].mealCount > 0) {
        streak++;
      } else if (date !== today) {
        break;
      }
    }

    res.json({ dailyStats, streak });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
});

// @route   POST /api/meals
// @desc    Log a new meal
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { items, inputType, imageUrl, mealType, date } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Meal must have at least one item' });
    }

    // Calculate totals
    const totalCalories = items.reduce((sum, item) => sum + (item.calories || 0), 0);
    const totalProtein = items.reduce((sum, item) => sum + (item.protein || 0), 0);
    const totalCarbs = items.reduce((sum, item) => sum + (item.carbs || 0), 0);
    const totalFat = items.reduce((sum, item) => sum + (item.fat || 0), 0);

    const meal = new Meal({
      userId: req.user.id,
      items,
      totalCalories: Math.round(totalCalories),
      totalProtein: Math.round(totalProtein),
      totalCarbs: Math.round(totalCarbs),
      totalFat: Math.round(totalFat),
      inputType: inputType || 'text',
      imageUrl: imageUrl || null,
      mealType: mealType || 'lunch',
      date: date ? new Date(date) : new Date()
    });

    await meal.save();
    res.status(201).json(meal);
  } catch (error) {
    console.error('Create meal error:', error);
    res.status(500).json({ message: 'Server error creating meal' });
  }
});

// @route   DELETE /api/meals/:id
// @desc    Delete a meal
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const meal = await Meal.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    await Meal.deleteOne({ _id: req.params.id });
    res.json({ message: 'Meal deleted successfully' });
  } catch (error) {
    console.error('Delete meal error:', error);
    res.status(500).json({ message: 'Server error deleting meal' });
  }
});

module.exports = router;
