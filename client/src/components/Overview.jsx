import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { mealService } from '../services/mealService';

const Overview = ({ setActiveTab }) => {
  const { user } = useContext(AuthContext);
  const [todayData, setTodayData] = useState({ meals: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0 } });
  const [loading, setLoading] = useState(true);
  const [displayMode, setDisplayMode] = useState('remaining'); // 'remaining' or 'consumed'
  const [waterIntake, setWaterIntake] = useState(1250);
  const [quickActionNotice, setQuickActionNotice] = useState('');

  const fetchTodayData = async () => {
    try {
      setLoading(true);
      const data = await mealService.getToday();
      setTodayData(data);
    } catch (err) {
      console.error("Error loading today's data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayData();
    setWaterIntake(mealService.getWaterIntake());
  }, []);

  const handleWaterClick = (cupIndex) => {
    const newAmount = (cupIndex + 1) * 250;
    const updated = mealService.setWaterIntake(newAmount);
    setWaterIntake(updated);
  };

  const adjustWater = (delta) => {
    const updated = mealService.setWaterIntake(waterIntake + delta);
    setWaterIntake(updated);
  };

  const handleQuickAddCalories = async (kcal) => {
    try {
      await mealService.saveMeal({
        items: [{ name: 'Quick Calorie Snack', quantity: '1 serving', calories: kcal, protein: 4, carbs: 14, fat: 3 }],
        mealType: 'snack',
        inputType: 'text'
      });
      setQuickActionNotice(`⚡ Added +${kcal} kcal snack to your diary!`);
      setTimeout(() => setQuickActionNotice(''), 3000);
      fetchTodayData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRepeatMeal = async () => {
    try {
      await mealService.saveMeal({
        items: [
          { name: 'Oatmeal with Berries & Almond Butter', quantity: '1 bowl (200g)', calories: 340, protein: 11, carbs: 48, fat: 12 },
          { name: 'Boiled Egg', quantity: '1 large', calories: 70, protein: 6, carbs: 1, fat: 5 }
        ],
        mealType: 'breakfast',
        inputType: 'text'
      });
      setQuickActionNotice('🔄 Repeated Yesterday\'s Healthy Breakfast!');
      setTimeout(() => setQuickActionNotice(''), 3000);
      fetchTodayData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
        <p>Crunching today's nutritional summary...</p>
      </div>
    );
  }

  const { totals, meals } = todayData;
  const goal = user?.dailyCalorieGoal || 2000;
  
  // Targets
  const proteinGoal = Math.round(user?.weight ? user.weight * 1.8 : 130);
  const carbsGoal = Math.round((goal * 0.45) / 4); // 45% of calories
  const fatGoal = Math.round((goal * 0.25) / 9); // 25% of calories

  // Triple Concentric Rings Math (viewBox="0 0 240 240")
  // Outer: Calories (r=95)
  const c1 = 2 * Math.PI * 95;
  const calPercent = Math.min(totals.calories / goal, 1);
  const offset1 = c1 - calPercent * c1;

  // Middle: Protein (r=75)
  const c2 = 2 * Math.PI * 75;
  const proteinPercent = Math.min(totals.protein / proteinGoal, 1);
  const offset2 = c2 - proteinPercent * c2;

  // Inner: Carbs & Fat balance (r=55)
  const c3 = 2 * Math.PI * 55;
  const carbsFatPercent = Math.min((totals.carbs + totals.fat) / (carbsGoal + fatGoal), 1);
  const offset3 = c3 - carbsFatPercent * c3;

  const remainingKcal = goal - totals.calories;
  const waterGoal = 2000;
  const waterPercent = Math.min(Math.round((waterIntake / waterGoal) * 100), 100);

  return (
    <div className="overview">
      {/* Page Header with Streak Badge */}
      <div className="overview-header-row">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2>Hello, {user?.name?.split(' ')[0]} 👋</h2>
          <p>Here's your nutritional summary and habit tracker for today.</p>
        </div>

        <div className="header-streak-badge">
          <span className="streak-flame">🔥</span>
          <div className="header-streak-info">
            <span className="header-streak-val">5-Day Streak</span>
            <span className="header-streak-sub">Consistency champion</span>
          </div>
        </div>
      </div>

      {quickActionNotice && (
        <div className="quick-action-toast">
          {quickActionNotice}
        </div>
      )}

      {/* Quick Action Floating Bar */}
      <div className="quick-actions-bar delay-1">
        <span className="quick-actions-title">⚡ Quick Actions:</span>
        <div className="quick-actions-btns">
          <button className="quick-action-pill" onClick={() => handleQuickAddCalories(100)}>
            <span>⚡ +100 kcal Snack</span>
          </button>
          <button className="quick-action-pill" onClick={() => adjustWater(250)}>
            <span>💧 +250ml Water</span>
          </button>
          <button className="quick-action-pill" onClick={() => setActiveTab('logger')}>
            <span>📸 Snap Meal</span>
          </button>
          <button className="quick-action-pill" onClick={handleRepeatMeal}>
            <span>🔄 Repeat Breakfast</span>
          </button>
        </div>
      </div>

      {/* Stat Cards Row with Color Coding */}
      <div className="overview-grid delay-2">
        {/* Calories Card (Amber) */}
        <div className="stat-card calories">
          <div className="stat-card-header">
            <span className="stat-card-icon">🔥</span>
            <span className="stat-card-label">Calories</span>
          </div>
          <div className="stat-card-value" style={{ color: 'var(--macro-cal)' }}>
            {totals.calories}
          </div>
          <div className="stat-card-unit">kcal consumed / {goal} kcal goal</div>
          <div className="stat-card-progress">
            <div 
              className="stat-card-progress-fill" 
              style={{ width: `${Math.min((totals.calories / goal) * 100, 100)}%`, background: 'var(--macro-cal-grad)' }}
            ></div>
          </div>
        </div>

        {/* Protein Card (Crimson) */}
        <div className="stat-card protein">
          <div className="stat-card-header">
            <span className="stat-card-icon">🥩</span>
            <span className="stat-card-label">Protein</span>
          </div>
          <div className="stat-card-value" style={{ color: 'var(--macro-protein)' }}>
            {totals.protein}g
          </div>
          <div className="stat-card-unit">{proteinGoal}g daily goal ({Math.round((totals.protein / proteinGoal) * 100)}%)</div>
          <div className="stat-card-progress">
            <div 
              className="stat-card-progress-fill" 
              style={{ width: `${Math.min((totals.protein / proteinGoal) * 100, 100)}%`, background: 'var(--macro-protein-grad)' }}
            ></div>
          </div>
        </div>

        {/* Carbs Card (Yellow) */}
        <div className="stat-card carbs">
          <div className="stat-card-header">
            <span className="stat-card-icon">🌾</span>
            <span className="stat-card-label">Carbohydrates</span>
          </div>
          <div className="stat-card-value" style={{ color: 'var(--macro-carbs)' }}>
            {totals.carbs}g
          </div>
          <div className="stat-card-unit">{carbsGoal}g target ({Math.round((totals.carbs / carbsGoal) * 100)}%)</div>
          <div className="stat-card-progress">
            <div 
              className="stat-card-progress-fill" 
              style={{ width: `${Math.min((totals.carbs / carbsGoal) * 100, 100)}%`, background: 'var(--macro-carbs-grad)' }}
            ></div>
          </div>
        </div>

        {/* Fat Card (Emerald) */}
        <div className="stat-card fat">
          <div className="stat-card-header">
            <span className="stat-card-icon">🥑</span>
            <span className="stat-card-label">Healthy Fats</span>
          </div>
          <div className="stat-card-value" style={{ color: 'var(--macro-fat)' }}>
            {totals.fat}g
          </div>
          <div className="stat-card-unit">{fatGoal}g target ({Math.round((totals.fat / fatGoal) * 100)}%)</div>
          <div className="stat-card-progress">
            <div 
              className="stat-card-progress-fill" 
              style={{ width: `${Math.min((totals.fat / fatGoal) * 100, 100)}%`, background: 'var(--macro-fat-grad)' }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Visual Hub: Concentric Triple Ring & Hydration Card */}
      <div className="overview-hub-grid delay-3">
        {/* Segmented Concentric Macro Gauge */}
        <div className="triple-ring-card">
          <div className="triple-ring-header">
            <h3>Concentric Macro Balance</h3>
            <button 
              className="ring-toggle-pill"
              onClick={() => setDisplayMode(displayMode === 'remaining' ? 'consumed' : 'remaining')}
            >
              Mode: {displayMode === 'remaining' ? 'Remaining' : 'Consumed'} 🔄
            </button>
          </div>

          <div className="triple-ring-body">
            <div className="concentric-ring-container">
              <svg viewBox="0 0 240 240" className="concentric-svg">
                <defs>
                  {/* Calorie Gradient (Amber) */}
                  <linearGradient id="calGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#fbbf24" />
                  </linearGradient>
                  {/* Protein Gradient (Crimson) */}
                  <linearGradient id="proteinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#f87171" />
                  </linearGradient>
                  {/* Carbs/Fat Gradient (Yellow/Emerald) */}
                  <linearGradient id="carbsFatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>

                {/* Outer Ring Background (Calories) */}
                <circle cx="120" cy="120" r="95" className="ring-track" strokeWidth="11" />
                {/* Outer Ring Fill */}
                <circle 
                  cx="120" cy="120" r="95" 
                  className="ring-animated-fill" 
                  strokeWidth="11"
                  stroke="url(#calGradient)"
                  strokeDasharray={c1}
                  strokeDashoffset={offset1}
                />

                {/* Middle Ring Background (Protein) */}
                <circle cx="120" cy="120" r="75" className="ring-track" strokeWidth="9" />
                {/* Middle Ring Fill */}
                <circle 
                  cx="120" cy="120" r="75" 
                  className="ring-animated-fill" 
                  strokeWidth="9"
                  stroke="url(#proteinGradient)"
                  strokeDasharray={c2}
                  strokeDashoffset={offset2}
                />

                {/* Inner Ring Background (Carbs & Fat) */}
                <circle cx="120" cy="120" r="55" className="ring-track" strokeWidth="8" />
                {/* Inner Ring Fill */}
                <circle 
                  cx="120" cy="120" r="55" 
                  className="ring-animated-fill" 
                  strokeWidth="8"
                  stroke="url(#carbsFatGradient)"
                  strokeDasharray={c3}
                  strokeDashoffset={offset3}
                />
              </svg>

              {/* Center Display */}
              <div className="concentric-ring-center">
                <div className="center-value" style={{ color: remainingKcal < 0 ? 'var(--macro-protein)' : 'var(--text-primary)' }}>
                  {displayMode === 'remaining' ? Math.max(0, remainingKcal) : totals.calories}
                </div>
                <div className="center-label">
                  {displayMode === 'remaining' ? 'kcal left' : 'kcal eaten'}
                </div>
                <span className="center-sub">Target: {goal}</span>
              </div>
            </div>

            {/* Ring Legend & Macro Breakdown */}
            <div className="triple-ring-legend">
              <div className="ring-legend-item">
                <div className="legend-indicator" style={{ background: 'var(--macro-cal)' }}></div>
                <div className="legend-meta">
                  <span className="legend-title">Outer: Calories</span>
                  <span className="legend-detail">{totals.calories} / {goal} kcal ({Math.round(calPercent * 100)}%)</span>
                </div>
              </div>

              <div className="ring-legend-item">
                <div className="legend-indicator" style={{ background: 'var(--macro-protein)' }}></div>
                <div className="legend-meta">
                  <span className="legend-title">Middle: Protein</span>
                  <span className="legend-detail">{totals.protein} / {proteinGoal}g ({Math.round(proteinPercent * 100)}%)</span>
                </div>
              </div>

              <div className="ring-legend-item">
                <div className="legend-indicator" style={{ background: 'var(--macro-carbs)' }}></div>
                <div className="legend-meta">
                  <span className="legend-title">Inner: Carbs & Fat</span>
                  <span className="legend-detail">{totals.carbs}g C • {totals.fat}g F</span>
                </div>
              </div>

              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: 'var(--space-2)' }}
                onClick={() => setActiveTab('logger')}
              >
                + Log Food Item
              </button>
            </div>
          </div>
        </div>

        {/* Daily Hydration Card (Water Tracker Widget) */}
        <div className="water-tracker-card">
          <div className="water-tracker-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: '1.4rem' }}>💧</span>
              <div>
                <h3 style={{ margin: 0, fontSize: 'var(--fs-base)' }}>Daily Hydration</h3>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>Goal: 2,000 ml</span>
              </div>
            </div>
            <span className="water-intake-badge" style={{ color: 'var(--macro-water)' }}>
              {waterIntake} ml ({waterPercent}%)
            </span>
          </div>

          {/* Fluid Wave Animation Fill Bar */}
          <div className="water-fluid-container">
            <div className="water-fluid-fill" style={{ width: `${waterPercent}%` }}>
              <div className="water-wave-wave"></div>
            </div>
            <div className="water-fluid-text">
              {waterIntake >= waterGoal ? '🎉 Daily Hydration Goal Achieved!' : `${waterGoal - waterIntake} ml remaining`}
            </div>
          </div>

          {/* Interactive 8-Cup Selector */}
          <div className="water-cups-grid">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => {
              const isFilled = waterIntake >= (idx + 1) * 250;
              return (
                <button
                  key={idx}
                  className={`water-cup-btn ${isFilled ? 'filled' : ''}`}
                  onClick={() => handleWaterClick(idx)}
                  title={`${(idx + 1) * 250} ml`}
                >
                  <span className="cup-icon">{isFilled ? '🥛' : '🥤'}</span>
                  <span className="cup-label">{(idx + 1) * 250}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Increment Buttons */}
          <div className="water-quick-controls">
            <button className="water-adj-btn" onClick={() => adjustWater(-250)} disabled={waterIntake <= 0}>
              - 250ml
            </button>
            <button className="water-adj-btn primary" onClick={() => adjustWater(250)}>
              + 250ml Cup
            </button>
            <button className="water-adj-btn" onClick={() => adjustWater(500)}>
              + 500ml Bottle
            </button>
          </div>
        </div>
      </div>

      {/* Today's Meals Timeline with Macros & Image Preview */}
      <div className="today-meals-card delay-4">
        <div className="today-meals-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: '1.4rem' }}>🍽️</span>
            <div>
              <h3 style={{ margin: 0 }}>Today's Food Diary</h3>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
                {meals.length} meal{meals.length === 1 ? '' : 's'} recorded today
              </span>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('history')}>
            View Full History →
          </button>
        </div>

        {meals.length === 0 ? (
          <div className="empty-state-card">
            <p>No meals logged yet today. Use the Quick Actions above or snap a photo of your meal!</p>
            <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('logger')}>
              + Log Your First Meal
            </button>
          </div>
        ) : (
          <div className="today-meals-list">
            {meals.map((meal) => (
              <div key={meal._id} className="today-meal-row">
                {meal.imageUrl && (
                  <div className="today-meal-thumb-wrapper">
                    <img src={meal.imageUrl} alt={meal.mealType} className="today-meal-thumb" />
                  </div>
                )}
                <div className="today-meal-main">
                  <div className="today-meal-title-row">
                    <span className="today-meal-type-pill">{meal.mealType}</span>
                    <span className="today-meal-time">
                      {meal.date ? new Date(meal.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                    </span>
                  </div>
                  <div className="today-meal-desc">
                    {meal.items.map(i => `${i.name} (${i.quantity})`).join(', ')}
                  </div>
                </div>

                <div className="today-meal-right">
                  <div className="today-meal-cal">{meal.totalCalories} kcal</div>
                  <div className="today-meal-badges">
                    <span className="macro-pill p">{meal.totalProtein}g P</span>
                    <span className="macro-pill c">{meal.totalCarbs}g C</span>
                    <span className="macro-pill f">{meal.totalFat}g F</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Overview;
