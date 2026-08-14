import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const MealHistory = () => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMeals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/meals');
      setMeals(res.data);
    } catch (err) {
      console.error('Error fetching meals:', err);
      setError('Failed to load meal history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this meal?')) return;
    
    try {
      await api.delete(`/meals/${id}`);
      setMeals(meals.filter(meal => meal._id !== id));
    } catch (err) {
      console.error('Error deleting meal:', err);
      alert('Failed to delete meal');
    }
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
        <p>Loading meal history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">⚠️</span>
        <h3>Oops!</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={fetchMeals}>Try Again</button>
      </div>
    );
  }

  if (meals.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">🍽️</span>
        <h3>No meals logged yet</h3>
        <p>Start tracking your food to see your history here.</p>
      </div>
    );
  }

  // Group meals by date
  const groupedMeals = meals.reduce((groups, meal) => {
    const date = new Date(meal.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(meal);
    return groups;
  }, {});

  const getMealIcon = (type) => {
    switch (type) {
      case 'breakfast': return '🍳';
      case 'lunch': return '🍱';
      case 'dinner': return '🍽️';
      case 'snack': return '🥪';
      default: return '🍲';
    }
  };

  return (
    <div className="meal-history">
      <div className="page-header">
        <h2>Meal History</h2>
        <p>Review your past meals and calorie intake.</p>
      </div>

      <div className="meal-history-list">
        {Object.entries(groupedMeals).map(([date, dateMeals], index) => (
          <div key={date} className={`meal-date-group delay-${(index % 5) + 1}`}>
            <h3 className="meal-date-header">{date}</h3>
            
            {dateMeals.map((meal) => (
              <div key={meal._id} className="meal-card">
                <div className="meal-card-header">
                  <div className="meal-card-type">
                    <span className="meal-card-type-icon">{getMealIcon(meal.mealType)}</span>
                    {meal.mealType}
                  </div>
                  <div className="meal-card-time">
                    {new Date(meal.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                
                <div className="meal-card-items">
                  {meal.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
                </div>
                
                <div className="meal-card-footer">
                  <div className="meal-card-macros">
                    <span className="macro-badge cal">{meal.totalCalories} kcal</span>
                    <span className="macro-badge protein">{meal.totalProtein}g P</span>
                    <span className="macro-badge carbs">{meal.totalCarbs}g C</span>
                    <span className="macro-badge fat">{meal.totalFat}g F</span>
                  </div>
                  
                  <button 
                    className="meal-card-delete"
                    onClick={() => handleDelete(meal._id)}
                    title="Delete meal"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MealHistory;
