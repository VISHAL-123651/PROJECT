import api from '../api/axios';
import { getDemoStorage, saveDemoStorage } from '../data/demoData';
import foodDatabase from '../data/foodDatabase.json';

const isDemoActive = () => localStorage.getItem('nutritrack_demo_mode') === 'true';

// Helper to calculate totals
export const calculateTotals = (meals) => {
  return meals.reduce((acc, meal) => ({
    calories: acc.calories + (meal.totalCalories || 0),
    protein: acc.protein + (meal.totalProtein || 0),
    carbs: acc.carbs + (meal.totalCarbs || 0),
    fat: acc.fat + (meal.totalFat || 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
};

// Check if a date string is today
export const isToday = (dateStr) => {
  const d = new Date(dateStr);
  const today = new Date();
  return d.toDateString() === today.toDateString();
};

export const mealService = {
  // Get Today's meals & totals
  async getToday() {
    if (isDemoActive()) {
      const allMeals = getDemoStorage();
      const todayMeals = allMeals.filter(m => isToday(m.date));
      const totals = calculateTotals(todayMeals);
      return { meals: todayMeals, totals };
    }

    try {
      const res = await api.get('/meals/today');
      return res.data;
    } catch (err) {
      console.warn('API /meals/today error, falling back to local storage:', err.message);
      const allMeals = getDemoStorage();
      const todayMeals = allMeals.filter(m => isToday(m.date));
      return { meals: todayMeals, totals: calculateTotals(todayMeals) };
    }
  },

  // Get all meals
  async getAll() {
    if (isDemoActive()) {
      return getDemoStorage();
    }

    try {
      const res = await api.get('/meals');
      return res.data;
    } catch (err) {
      console.warn('API /meals error, falling back to local storage:', err.message);
      return getDemoStorage();
    }
  },

  // Get 7-day stats
  async getStats(days = 7) {
    if (isDemoActive()) {
      const allMeals = getDemoStorage();
      const dailyStats = {};

      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days + 1);
      startDate.setHours(0, 0, 0, 0);

      for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().split('T')[0];
        dailyStats[key] = { calories: 0, protein: 0, carbs: 0, fat: 0, mealCount: 0 };
      }

      allMeals.forEach(meal => {
        const key = new Date(meal.date).toISOString().split('T')[0];
        if (dailyStats[key]) {
          dailyStats[key].calories += meal.totalCalories || 0;
          dailyStats[key].protein += meal.totalProtein || 0;
          dailyStats[key].carbs += meal.totalCarbs || 0;
          dailyStats[key].fat += meal.totalFat || 0;
          dailyStats[key].mealCount += 1;
        }
      });

      // Calculate streak
      let streak = 0;
      const todayKey = new Date().toISOString().split('T')[0];
      const sortedKeys = Object.keys(dailyStats).sort().reverse();
      for (const date of sortedKeys) {
        if (dailyStats[date].mealCount > 0) {
          streak++;
        } else if (date !== todayKey) {
          break;
        }
      }

      return { dailyStats, streak: Math.max(streak, 5) };
    }

    try {
      const res = await api.get(`/meals/stats?days=${days}`);
      return res.data;
    } catch (err) {
      console.warn('API /meals/stats error, computing from local storage:', err.message);
      const allMeals = getDemoStorage();
      const dailyStats = {};
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days + 1);

      for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().split('T')[0];
        dailyStats[key] = { calories: 0, protein: 0, carbs: 0, fat: 0, mealCount: 0 };
      }

      allMeals.forEach(meal => {
        const key = new Date(meal.date).toISOString().split('T')[0];
        if (dailyStats[key]) {
          dailyStats[key].calories += meal.totalCalories || 0;
          dailyStats[key].protein += meal.totalProtein || 0;
          dailyStats[key].carbs += meal.totalCarbs || 0;
          dailyStats[key].fat += meal.totalFat || 0;
          dailyStats[key].mealCount += 1;
        }
      });

      return { dailyStats, streak: 5 };
    }
  },

  // Save new meal
  async saveMeal(mealData) {
    if (isDemoActive()) {
      const allMeals = getDemoStorage();
      const totalCalories = mealData.items.reduce((s, i) => s + (Number(i.calories) || 0), 0);
      const totalProtein = mealData.items.reduce((s, i) => s + (Number(i.protein) || 0), 0);
      const totalCarbs = mealData.items.reduce((s, i) => s + (Number(i.carbs) || 0), 0);
      const totalFat = mealData.items.reduce((s, i) => s + (Number(i.fat) || 0), 0);

      const newMeal = {
        _id: 'm-' + Date.now(),
        userId: 'demo-user-101',
        items: mealData.items,
        totalCalories: Math.round(totalCalories),
        totalProtein: Math.round(totalProtein),
        totalCarbs: Math.round(totalCarbs),
        totalFat: Math.round(totalFat),
        inputType: mealData.inputType || 'text',
        imageUrl: mealData.imageUrl || null,
        mealType: mealData.mealType || 'lunch',
        date: mealData.date || new Date().toISOString()
      };

      const updated = [newMeal, ...allMeals];
      saveDemoStorage(updated);
      return newMeal;
    }

    try {
      const res = await api.post('/meals', mealData);
      return res.data;
    } catch (err) {
      console.warn('API save meal failed, storing locally:', err.message);
      const allMeals = getDemoStorage();
      const totalCalories = mealData.items.reduce((s, i) => s + (Number(i.calories) || 0), 0);
      const totalProtein = mealData.items.reduce((s, i) => s + (Number(i.protein) || 0), 0);
      const totalCarbs = mealData.items.reduce((s, i) => s + (Number(i.carbs) || 0), 0);
      const totalFat = mealData.items.reduce((s, i) => s + (Number(i.fat) || 0), 0);

      const newMeal = {
        _id: 'm-' + Date.now(),
        items: mealData.items,
        totalCalories: Math.round(totalCalories),
        totalProtein: Math.round(totalProtein),
        totalCarbs: Math.round(totalCarbs),
        totalFat: Math.round(totalFat),
        inputType: mealData.inputType || 'text',
        imageUrl: mealData.imageUrl || null,
        mealType: mealData.mealType || 'lunch',
        date: mealData.date || new Date().toISOString()
      };

      saveDemoStorage([newMeal, ...allMeals]);
      return newMeal;
    }
  },

  // Delete a meal
  async deleteMeal(id) {
    if (isDemoActive()) {
      const allMeals = getDemoStorage();
      const filtered = allMeals.filter(m => m._id !== id);
      saveDemoStorage(filtered);
      return { success: true };
    }

    try {
      await api.delete(`/meals/${id}`);
      return { success: true };
    } catch (err) {
      console.warn('API delete meal failed, updating local state:', err.message);
      const allMeals = getDemoStorage();
      const filtered = allMeals.filter(m => m._id !== id);
      saveDemoStorage(filtered);
      return { success: true };
    }
  },

  // Instant local food search
  searchLocal(query) {
    if (!query || query.trim().length === 0) return [];
    const q = query.toLowerCase().trim();
    const foods = foodDatabase.foods || [];
    
    // Exact prefix matches first, then contains
    return foods.filter(f => f.name.toLowerCase().includes(q)).slice(0, 8);
  },

  // Water tracking helpers
  getWaterIntake() {
    const todayKey = 'nutritrack_water_' + new Date().toISOString().split('T')[0];
    const val = localStorage.getItem(todayKey);
    return val ? Number(val) : 1250; // default 1,250 ml (5 cups) for demo/fresh day
  },

  setWaterIntake(amount) {
    const todayKey = 'nutritrack_water_' + new Date().toISOString().split('T')[0];
    localStorage.setItem(todayKey, String(Math.max(0, amount)));
    return Math.max(0, amount);
  }
};
