import React, { useState, useEffect } from 'react';
import { mealService } from '../services/mealService';

const MealHistory = () => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week'
  
  // Lightbox Modal State
  const [activeLightboxMeal, setActiveLightboxMeal] = useState(null);

  // Accordion collapsed state per category
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const fetchMeals = async () => {
    try {
      setLoading(true);
      const data = await mealService.getAll();
      setMeals(data);
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
      await mealService.deleteMeal(id);
      setMeals(prev => prev.filter(meal => meal._id !== id));
      if (activeLightboxMeal?._id === id) {
        setActiveLightboxMeal(null);
      }
    } catch (err) {
      console.error('Error deleting meal:', err);
      alert('Failed to delete meal');
    }
  };

  const toggleGroupCollapse = (key) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
        <p>Retrieving your meal history...</p>
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

  // Filter meals
  const now = new Date();
  const todayStr = now.toDateString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const filteredMeals = meals.filter(meal => {
    const mealDate = new Date(meal.date);
    
    // Date filter
    if (dateFilter === 'today' && mealDate.toDateString() !== todayStr) {
      return false;
    }
    if (dateFilter === 'week' && mealDate < sevenDaysAgo) {
      return false;
    }

    // Search term filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchType = meal.mealType?.toLowerCase().includes(q);
      const matchItems = meal.items?.some(i => i.name?.toLowerCase().includes(q));
      if (!matchType && !matchItems) return false;
    }

    return true;
  });

  // Calculate totals for filtered meals
  const totalFilteredCalories = filteredMeals.reduce((acc, m) => acc + (m.totalCalories || 0), 0);
  const totalFilteredProtein = filteredMeals.reduce((acc, m) => acc + (m.totalProtein || 0), 0);
  const totalFilteredCarbs = filteredMeals.reduce((acc, m) => acc + (m.totalCarbs || 0), 0);
  const totalFilteredFat = filteredMeals.reduce((acc, m) => acc + (m.totalFat || 0), 0);

  // Group meals by date, then within each date group by mealType (Breakfast, Lunch, Dinner, Snack)
  const groupedMeals = filteredMeals.reduce((groups, meal) => {
    const dateKey = new Date(meal.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    if (!groups[dateKey]) {
      groups[dateKey] = {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: [],
        other: []
      };
    }
    
    const type = meal.mealType?.toLowerCase() || 'other';
    if (groups[dateKey][type]) {
      groups[dateKey][type].push(meal);
    } else {
      groups[dateKey].other.push(meal);
    }
    return groups;
  }, {});

  const getMealCategoryMeta = (type) => {
    switch (type) {
      case 'breakfast': return { icon: '🍳', label: 'Breakfast', badgeClass: 'p' };
      case 'lunch': return { icon: '🍱', label: 'Lunch', badgeClass: 'c' };
      case 'dinner': return { icon: '🍽️', label: 'Dinner', badgeClass: 'f' };
      case 'snack': return { icon: '🥪', label: 'Snacks', badgeClass: 'cal' };
      default: return { icon: '🍲', label: 'Other Meals', badgeClass: 'p' };
    }
  };

  return (
    <div className="meal-history">
      {/* Lightbox Modal */}
      {activeLightboxMeal && (
        <div className="lightbox-overlay" onClick={() => setActiveLightboxMeal(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setActiveLightboxMeal(null)}>✕</button>
            <div className="lightbox-image-wrap">
              <img src={activeLightboxMeal.imageUrl} alt={activeLightboxMeal.mealType} className="lightbox-img" />
            </div>
            <div className="lightbox-info">
              <div className="lightbox-header">
                <span className="today-meal-type-pill">{activeLightboxMeal.mealType}</span>
                <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                  {new Date(activeLightboxMeal.date).toLocaleString()}
                </span>
              </div>
              <h4 style={{ margin: 'var(--space-2) 0' }}>Food Items:</h4>
              <ul className="lightbox-items-list">
                {activeLightboxMeal.items.map((item, i) => (
                  <li key={i}>
                    <strong>{item.name}</strong> - {item.quantity} ({item.calories} kcal)
                  </li>
                ))}
              </ul>
              <div className="lightbox-macros-row">
                <span className="macro-summary-pill cal">{activeLightboxMeal.totalCalories} kcal</span>
                <span className="macro-summary-pill protein">{activeLightboxMeal.totalProtein}g Protein</span>
                <span className="macro-summary-pill carbs">{activeLightboxMeal.totalCarbs}g Carbs</span>
                <span className="macro-summary-pill fat">{activeLightboxMeal.totalFat}g Fat</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <h2>Meal History & Diary</h2>
        <p>Review past nutritional logs with category subtotals and photo zooms.</p>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="history-toolbar delay-1">
        <div className="history-search-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="history-search-input"
            placeholder="Search meals by food name (e.g. 'Chicken', 'Oats', 'Salad')..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm('')}>✕</button>
          )}
        </div>

        <div className="history-filter-pills">
          <button 
            className={`filter-pill ${dateFilter === 'all' ? 'active' : ''}`}
            onClick={() => setDateFilter('all')}
          >
            All History
          </button>
          <button 
            className={`filter-pill ${dateFilter === 'today' ? 'active' : ''}`}
            onClick={() => setDateFilter('today')}
          >
            Today Only
          </button>
          <button 
            className={`filter-pill ${dateFilter === 'week' ? 'active' : ''}`}
            onClick={() => setDateFilter('week')}
          >
            Past 7 Days
          </button>
        </div>
      </div>

      {/* Summary Filter Banner */}
      <div className="history-summary-banner delay-2">
        <div className="summary-meta">
          <strong>Showing {filteredMeals.length} recorded meal{filteredMeals.length === 1 ? '' : 's'}</strong>
          <span>(Filter: {dateFilter === 'all' ? 'All dates' : dateFilter === 'today' ? 'Today' : 'Past 7 days'})</span>
        </div>
        <div className="summary-macros">
          <span className="macro-summary-pill cal">{totalFilteredCalories} Total kcal</span>
          <span className="macro-summary-pill protein">{totalFilteredProtein}g P</span>
          <span className="macro-summary-pill carbs">{totalFilteredCarbs}g C</span>
          <span className="macro-summary-pill fat">{totalFilteredFat}g F</span>
        </div>
      </div>

      {filteredMeals.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🍽️</span>
          <h3>No matching meals found</h3>
          <p>Try adjusting your search query or date filters.</p>
          <button className="btn btn-secondary btn-sm" onClick={() => { setSearchTerm(''); setDateFilter('all'); }}>
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="meal-history-list">
          {Object.entries(groupedMeals).map(([date, categories], index) => {
            // Count total calories for this date
            const allDayMeals = Object.values(categories).flat();
            if (allDayMeals.length === 0) return null;

            const dayTotalKcal = allDayMeals.reduce((s, m) => s + (m.totalCalories || 0), 0);

            return (
              <div key={date} className={`meal-date-group delay-${(index % 4) + 1}`}>
                <div className="meal-date-banner">
                  <div className="meal-date-header-text">
                    <span className="date-icon">📅</span>
                    <h3>{date}</h3>
                  </div>
                  <span className="day-total-badge">
                    {dayTotalKcal} kcal total
                  </span>
                </div>

                {/* Categorized Collapsible Accordions for Breakfast, Lunch, Dinner, Snack */}
                {['breakfast', 'lunch', 'dinner', 'snack', 'other'].map(catKey => {
                  const catMeals = categories[catKey];
                  if (!catMeals || catMeals.length === 0) return null;

                  const meta = getMealCategoryMeta(catKey);
                  const catKcal = catMeals.reduce((s, m) => s + (m.totalCalories || 0), 0);
                  const catProtein = catMeals.reduce((s, m) => s + (m.totalProtein || 0), 0);
                  const catCarbs = catMeals.reduce((s, m) => s + (m.totalCarbs || 0), 0);
                  const catFat = catMeals.reduce((s, m) => s + (m.totalFat || 0), 0);

                  const groupKey = `${date}_${catKey}`;
                  const isCollapsed = collapsedGroups[groupKey];

                  return (
                    <div key={catKey} className="meal-category-accordion">
                      {/* Accordion Header with Subtotals */}
                      <button 
                        type="button" 
                        className="category-accordion-header"
                        onClick={() => toggleGroupCollapse(groupKey)}
                      >
                        <div className="category-title-left">
                          <span className="cat-icon">{meta.icon}</span>
                          <span className="cat-label">{meta.label}</span>
                          <span className="cat-count">({catMeals.length})</span>
                        </div>

                        <div className="category-subtotals-right">
                          <span className="subtotal-cal">{catKcal} kcal</span>
                          <span className="subtotal-macros">P: {catProtein}g | C: {catCarbs}g | F: {catFat}g</span>
                          <span className="accordion-arrow">{isCollapsed ? '▼' : '▲'}</span>
                        </div>
                      </button>

                      {/* Accordion Content */}
                      {!isCollapsed && (
                        <div className="category-accordion-content">
                          {catMeals.map(meal => (
                            <div key={meal._id} className="history-meal-card">
                              <div className="history-card-left">
                                {meal.imageUrl ? (
                                  <div 
                                    className="history-thumb-zoomable"
                                    onClick={() => setActiveLightboxMeal(meal)}
                                    title="Click to view full photo"
                                  >
                                    <img src={meal.imageUrl} alt={meal.mealType} className="history-thumb-img" />
                                    <span className="thumb-zoom-badge">🔍</span>
                                  </div>
                                ) : (
                                  <div className="history-thumb-fallback">
                                    <span>{meta.icon}</span>
                                  </div>
                                )}

                                <div className="history-meal-details">
                                  <div className="history-meal-time">
                                    {new Date(meal.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                  <div className="history-items-summary">
                                    {meal.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
                                  </div>
                                </div>
                              </div>

                              <div className="history-card-right">
                                <div className="history-card-macros">
                                  <span className="macro-badge cal">{meal.totalCalories} kcal</span>
                                  <span className="macro-badge protein">{meal.totalProtein}g P</span>
                                  <span className="macro-badge carbs">{meal.totalCarbs}g C</span>
                                  <span className="macro-badge fat">{meal.totalFat}g F</span>
                                </div>

                                <button 
                                  className="meal-card-delete"
                                  onClick={() => handleDelete(meal._id)}
                                  title="Delete meal from history"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MealHistory;
