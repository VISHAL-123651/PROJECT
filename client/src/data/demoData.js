// NutriTrack — Rich Demo State & Mock Storage
// Allows immediate full-featured testing without requiring a live MongoDB server

export const DEMO_USER = {
  _id: 'demo-user-101',
  id: 'demo-user-101',
  name: 'Alex Morgan',
  email: 'alex.demo@nutritrack.io',
  height: 178,
  weight: 72,
  age: 27,
  gender: 'male',
  activityLevel: 'moderate',
  dailyCalorieGoal: 2300,
  bmr: 1720,
  tdee: 2350
};

const getDaysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

export const INITIAL_DEMO_MEALS = [
  // Today's Meals
  {
    _id: 'm-today-1',
    userId: 'demo-user-101',
    mealType: 'breakfast',
    inputType: 'text',
    date: new Date(new Date().setHours(8, 30, 0, 0)).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=400&q=80',
    totalCalories: 420,
    totalProtein: 14,
    totalCarbs: 58,
    totalFat: 15,
    items: [
      { name: 'Oats with Almond Butter & Berries', quantity: '1 bowl (200g)', calories: 340, protein: 11, carbs: 48, fat: 12 },
      { name: 'Black Coffee with Cinnamon', quantity: '1 mug (250ml)', calories: 10, protein: 0, carbs: 2, fat: 0 },
      { name: 'Boiled Egg', quantity: '1 large', calories: 70, protein: 6, carbs: 1, fat: 5 }
    ]
  },
  {
    _id: 'm-today-2',
    userId: 'demo-user-101',
    mealType: 'lunch',
    inputType: 'image',
    date: new Date(new Date().setHours(13, 15, 0, 0)).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
    totalCalories: 650,
    totalProtein: 48,
    totalCarbs: 62,
    totalFat: 12,
    items: [
      { name: 'Grilled Herb Chicken Breast', quantity: '1 fillet (160g)', calories: 240, protein: 42, carbs: 0, fat: 6 },
      { name: 'Steamed Brown Rice', quantity: '1 bowl (180g)', calories: 210, protein: 5, carbs: 44, fat: 2 },
      { name: 'Roasted Broccoli & Bell Peppers', quantity: '1 plate (150g)', calories: 75, protein: 4, carbs: 12, fat: 2 },
      { name: 'Olive Oil Drizzle', quantity: '1 tsp (5ml)', calories: 45, protein: 0, carbs: 0, fat: 5 }
    ]
  },
  {
    _id: 'm-today-3',
    userId: 'demo-user-101',
    mealType: 'snack',
    inputType: 'text',
    date: new Date(new Date().setHours(16, 45, 0, 0)).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80',
    totalCalories: 210,
    totalProtein: 18,
    totalCarbs: 18,
    totalFat: 7,
    items: [
      { name: 'Greek Yogurt with Walnuts & Honey', quantity: '1 bowl (150g)', calories: 180, protein: 17, carbs: 15, fat: 6 },
      { name: 'Green Tea with Lemon', quantity: '1 cup', calories: 5, protein: 0, carbs: 1, fat: 0 }
    ]
  },

  // 1 Day Ago (Yesterday)
  {
    _id: 'm-day1-1',
    userId: 'demo-user-101',
    mealType: 'breakfast',
    inputType: 'text',
    date: new Date(getDaysAgo(1).setHours(8, 45, 0, 0)).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&q=80',
    totalCalories: 450,
    totalProtein: 22,
    totalCarbs: 45,
    totalFat: 16,
    items: [
      { name: 'Scrambled Eggs on Whole Grain Toast', quantity: '2 slices + 2 eggs', calories: 380, protein: 20, carbs: 32, fat: 15 },
      { name: 'Fresh Orange', quantity: '1 medium', calories: 70, protein: 2, carbs: 17, fat: 0 }
    ]
  },
  {
    _id: 'm-day1-2',
    userId: 'demo-user-101',
    mealType: 'lunch',
    inputType: 'image',
    date: new Date(getDaysAgo(1).setHours(13, 30, 0, 0)).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
    totalCalories: 680,
    totalProtein: 42,
    totalCarbs: 70,
    totalFat: 18,
    items: [
      { name: 'Quinoa Power Salad with Chickpeas', quantity: '1 large bowl', calories: 420, protein: 18, carbs: 62, fat: 12 },
      { name: 'Grilled Salmon fillet', quantity: '1 piece (120g)', calories: 260, protein: 24, carbs: 0, fat: 17 }
    ]
  },
  {
    _id: 'm-day1-3',
    userId: 'demo-user-101',
    mealType: 'dinner',
    inputType: 'text',
    date: new Date(getDaysAgo(1).setHours(19, 45, 0, 0)).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1547496502-affa22d38842?w=400&q=80',
    totalCalories: 560,
    totalProtein: 38,
    totalCarbs: 52,
    totalFat: 14,
    items: [
      { name: 'Chicken Tikka & Mixed Lentil Soup', quantity: '1 bowl', calories: 380, protein: 32, carbs: 24, fat: 10 },
      { name: 'Garlic Roti', quantity: '1 piece (50g)', calories: 140, protein: 4, carbs: 26, fat: 3 },
      { name: 'Cucumber Raita', quantity: '1 bowl (100g)', calories: 60, protein: 3, carbs: 6, fat: 2 }
    ]
  },

  // 2 Days Ago
  {
    _id: 'm-day2-1',
    userId: 'demo-user-101',
    mealType: 'breakfast',
    inputType: 'text',
    date: new Date(getDaysAgo(2).setHours(9, 0, 0, 0)).toISOString(),
    imageUrl: null,
    totalCalories: 410,
    totalProtein: 25,
    totalCarbs: 48,
    totalFat: 12,
    items: [
      { name: 'Berry Protein Smoothie Bowl', quantity: '1 bowl', calories: 350, protein: 24, carbs: 42, fat: 8 },
      { name: 'Chia Seeds', quantity: '1 tbsp', calories: 60, protein: 2, carbs: 5, fat: 4 }
    ]
  },
  {
    _id: 'm-day2-2',
    userId: 'demo-user-101',
    mealType: 'lunch',
    inputType: 'text',
    date: new Date(getDaysAgo(2).setHours(13, 0, 0, 0)).toISOString(),
    imageUrl: null,
    totalCalories: 720,
    totalProtein: 46,
    totalCarbs: 76,
    totalFat: 20,
    items: [
      { name: 'Chicken Biryani with Raita', quantity: '1 plate (350g)', calories: 620, protein: 38, carbs: 68, fat: 18 },
      { name: 'Green Salad', quantity: '1 plate', calories: 40, protein: 2, carbs: 6, fat: 0 }
    ]
  },
  {
    _id: 'm-day2-3',
    userId: 'demo-user-101',
    mealType: 'dinner',
    inputType: 'text',
    date: new Date(getDaysAgo(2).setHours(20, 0, 0, 0)).toISOString(),
    imageUrl: null,
    totalCalories: 510,
    totalProtein: 34,
    totalCarbs: 46,
    totalFat: 15,
    items: [
      { name: 'Tofu Vegetable Stir Fry with Soba Noodles', quantity: '1 plate', calories: 440, protein: 28, carbs: 42, fat: 12 },
      { name: 'Miso Soup', quantity: '1 bowl', calories: 45, protein: 3, carbs: 4, fat: 1 }
    ]
  },

  // 3 Days Ago
  {
    _id: 'm-day3-1',
    userId: 'demo-user-101',
    mealType: 'breakfast',
    inputType: 'text',
    date: new Date(getDaysAgo(3).setHours(8, 30, 0, 0)).toISOString(),
    imageUrl: null,
    totalCalories: 380,
    totalProtein: 16,
    totalCarbs: 48,
    totalFat: 10,
    items: [{ name: 'Idli with Sambar & Coconut Chutney', quantity: '3 pieces', calories: 380, protein: 16, carbs: 48, fat: 10 }]
  },
  {
    _id: 'm-day3-2',
    userId: 'demo-user-101',
    mealType: 'lunch',
    inputType: 'text',
    date: new Date(getDaysAgo(3).setHours(13, 0, 0, 0)).toISOString(),
    imageUrl: null,
    totalCalories: 640,
    totalProtein: 40,
    totalCarbs: 65,
    totalFat: 16,
    items: [{ name: 'Paneer Butter Masala with 2 Rotis', quantity: '1 serving', calories: 640, protein: 40, carbs: 65, fat: 16 }]
  },
  {
    _id: 'm-day3-3',
    userId: 'demo-user-101',
    mealType: 'dinner',
    inputType: 'text',
    date: new Date(getDaysAgo(3).setHours(19, 30, 0, 0)).toISOString(),
    imageUrl: null,
    totalCalories: 580,
    totalProtein: 36,
    totalCarbs: 54,
    totalFat: 18,
    items: [{ name: 'Grilled Fish with Mashed Sweet Potatoes', quantity: '1 plate', calories: 580, protein: 36, carbs: 54, fat: 18 }]
  },

  // 4 Days Ago
  {
    _id: 'm-day4-1',
    userId: 'demo-user-101',
    mealType: 'breakfast',
    inputType: 'text',
    date: new Date(getDaysAgo(4).setHours(8, 15, 0, 0)).toISOString(),
    imageUrl: null,
    totalCalories: 410,
    totalProtein: 22,
    totalCarbs: 46,
    totalFat: 12,
    items: [{ name: 'Avocado Toast with Poached Eggs', quantity: '2 slices', calories: 410, protein: 22, carbs: 46, fat: 12 }]
  },
  {
    _id: 'm-day4-2',
    userId: 'demo-user-101',
    mealType: 'lunch',
    inputType: 'text',
    date: new Date(getDaysAgo(4).setHours(13, 10, 0, 0)).toISOString(),
    imageUrl: null,
    totalCalories: 690,
    totalProtein: 44,
    totalCarbs: 68,
    totalFat: 20,
    items: [{ name: 'Mediterranean Chicken Wrap with Hummus', quantity: '1 wrap', calories: 690, protein: 44, carbs: 68, fat: 20 }]
  },
  {
    _id: 'm-day4-3',
    userId: 'demo-user-101',
    mealType: 'dinner',
    inputType: 'text',
    date: new Date(getDaysAgo(4).setHours(20, 15, 0, 0)).toISOString(),
    imageUrl: null,
    totalCalories: 520,
    totalProtein: 30,
    totalCarbs: 58,
    totalFat: 14,
    items: [{ name: 'Dal Tadka with Jeera Rice', quantity: '1 plate', calories: 520, protein: 30, carbs: 58, fat: 14 }]
  }
];

export const getDemoStorage = () => {
  try {
    const stored = localStorage.getItem('nutritrack_demo_meals');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed reading demo storage', e);
  }
  localStorage.setItem('nutritrack_demo_meals', JSON.stringify(INITIAL_DEMO_MEALS));
  return INITIAL_DEMO_MEALS;
};

export const saveDemoStorage = (meals) => {
  try {
    localStorage.setItem('nutritrack_demo_meals', JSON.stringify(meals));
  } catch (e) {
    console.error('Failed writing demo storage', e);
  }
};
