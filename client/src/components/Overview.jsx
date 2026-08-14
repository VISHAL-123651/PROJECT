import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

const Overview = ({ setActiveTab }) => {
  const { user } = useContext(AuthContext);
  const [todayData, setTodayData] = useState({ meals: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0 } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodayData = async () => {
      try {
        const res = await api.get('/meals/today');
        setTodayData(res.data);
      } catch (err) {
        console.error('Error fetching today\'s data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayData();
  }, []);

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
        <p>Loading your daily summary...</p>
      </div>
    );
  }

  const { totals, meals } = todayData;
  const goal = user?.dailyCalorieGoal || 2000;
  
  // Calculate progress ring variables
  const progressPercent = Math.min((totals.calories / goal) * 100, 100);
  const circumference = 2 * Math.PI * 90; // r=90
  const offset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="overview">
      <div className="page-header">
        <h2>Hello, {user?.name?.split(' ')[0]} 👋</h2>
        <p>Here's your nutritional summary for today.</p>
      </div>

      <div className="overview-grid">
        <div className="stat-card calories delay-1">
          <div className="stat-card-header">
            <span className="stat-card-icon">🔥</span>
            <span className="stat-card-label">Calories</span>
          </div>
          <div className="stat-card-value">{totals.calories}</div>
          <div className="stat-card-unit">kcal consumed / {goal} kcal goal</div>
          <div className="stat-card-progress">
            <div 
              className="stat-card-progress-fill" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        <div className="stat-card protein delay-2">
          <div className="stat-card-header">
            <span className="stat-card-icon">🥩</span>
            <span className="stat-card-label">Protein</span>
          </div>
          <div className="stat-card-value">{totals.protein}</div>
          <div className="stat-card-unit">grams today</div>
        </div>

        <div className="stat-card carbs delay-3">
          <div className="stat-card-header">
            <span className="stat-card-icon">🌾</span>
            <span className="stat-card-label">Carbs</span>
          </div>
          <div className="stat-card-value">{totals.carbs}</div>
          <div className="stat-card-unit">grams today</div>
        </div>

        <div className="stat-card fat delay-4">
          <div className="stat-card-header">
            <span className="stat-card-icon">🥑</span>
            <span className="stat-card-label">Fat</span>
          </div>
          <div className="stat-card-value">{totals.fat}</div>
          <div className="stat-card-unit">grams today</div>
        </div>
      </div>

      <div className="calorie-ring-section delay-5">
        <div className="calorie-ring-container">
          <svg viewBox="0 0 200 200">
            <circle 
              className="ring-bg" 
              cx="100" cy="100" r="90" 
              strokeWidth="12"
            />
            <circle 
              className="ring-fill" 
              cx="100" cy="100" r="90" 
              strokeWidth="12" 
              strokeDasharray={circumference}
              style={{ 
                strokeDashoffset: offset,
                stroke: totals.calories > goal ? 'var(--accent-danger)' : 'url(#gradient-ring)'
              }}
            />
            <defs>
              <linearGradient id="gradient-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00ff88" />
                <stop offset="100%" stopColor="#00d4ff" />
              </linearGradient>
            </defs>
          </svg>
          <div className="calorie-ring-info">
            <div className="calorie-ring-value">
              {Math.max(0, goal - totals.calories)}
            </div>
            <div className="calorie-ring-label">kcal remaining</div>
          </div>
        </div>

        <div className="calorie-ring-details">
          <div className="calorie-detail-item">
            <div className="calorie-detail-dot" style={{ background: 'var(--accent-primary)' }}></div>
            <div className="calorie-detail-label">Goal</div>
            <div className="calorie-detail-value">{goal}</div>
          </div>
          <div className="calorie-detail-item">
            <div className="calorie-detail-dot" style={{ background: 'var(--text-tertiary)' }}></div>
            <div className="calorie-detail-label">Consumed</div>
            <div className="calorie-detail-value">{totals.calories}</div>
          </div>
          <button 
            className="btn btn-primary" 
            style={{ marginTop: 'var(--space-2)' }}
            onClick={() => setActiveTab('logger')}
          >
            + Log a Meal
          </button>
        </div>
      </div>

      {meals.length > 0 && (
        <div className="today-meals delay-5">
          <h3><span className="icon">🍽️</span> Today's Meals</h3>
          {meals.map((meal) => (
            <div key={meal._id} className="today-meal-item">
              <div className="today-meal-info">
                <span style={{textTransform: 'capitalize', fontWeight: '500', color: 'var(--text-primary)'}}>
                  {meal.mealType}:
                </span>
                <span style={{color: 'var(--text-secondary)'}}>
                  {meal.items.map(i => i.name).join(', ')}
                </span>
              </div>
              <div className="today-meal-calories">
                {meal.totalCalories} kcal
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Overview;
