import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { mealService } from '../services/mealService';

const Analytics = () => {
  const { user } = useContext(AuthContext);
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredBar, setHoveredBar] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await mealService.getStats(7);
        setStatsData(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
        <p>Analyzing nutritional trends and metabolic balance...</p>
      </div>
    );
  }

  if (!statsData || Object.keys(statsData.dailyStats || {}).length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">📈</span>
        <h3>No nutritional data available yet</h3>
        <p>Log your meals for a few days to visualize your calorie and macro trends here.</p>
      </div>
    );
  }

  const { dailyStats, streak } = statsData;
  const days = Object.keys(dailyStats).sort();
  const goal = user?.dailyCalorieGoal || 2000;
  
  // Calculate max calories for chart scaling
  const maxCalories = Math.max(
    goal, 
    ...Object.values(dailyStats).map(d => d.calories),
    2400
  );
  
  // Calculate averages and 7-day total deficit/surplus
  const activeDays = Object.values(dailyStats).filter(d => d.calories > 0);
  const totalCaloriesWeek = activeDays.reduce((sum, d) => sum + d.calories, 0);
  const avgCalories = activeDays.length ? Math.round(totalCaloriesWeek / activeDays.length) : 0;
  
  // Net deficit/surplus across active days
  // 3,500 kcal ~= 0.45 kg (1 lb) of fat
  const expectedTotalTarget = goal * (activeDays.length || 7);
  const netCalorieDiff = totalCaloriesWeek - expectedTotalTarget;
  const estimatedFatChangeKg = ((netCalorieDiff / 3500) * 0.453592).toFixed(2);

  // Total macros for donut chart
  const totalMacros = Object.values(dailyStats).reduce((acc, d) => ({
    protein: acc.protein + d.protein,
    carbs: acc.carbs + d.carbs,
    fat: acc.fat + d.fat
  }), { protein: 0, carbs: 0, fat: 0 });

  const totalGrams = totalMacros.protein + totalMacros.carbs + totalMacros.fat || 1;
  const pPercent = Math.round((totalMacros.protein / totalGrams) * 100);
  const cPercent = Math.round((totalMacros.carbs / totalGrams) * 100);
  const fPercent = Math.round((totalMacros.fat / totalGrams) * 100);

  const circumference = 2 * Math.PI * 60; // r=60

  return (
    <div className="analytics">
      <div className="page-header">
        <h2>Analytics & Trends</h2>
        <p>Deep-dive nutritional metrics, caloric deficit estimator, and macronutrient balance.</p>
      </div>

      {/* Weekly Deficit & Metabolic Reinforcement Banner */}
      <div className="weekly-deficit-card delay-1">
        <div className="deficit-card-left">
          <div className="deficit-icon-wrap">
            {netCalorieDiff <= 0 ? '📉' : '📈'}
          </div>
          <div>
            <div className="deficit-title">
              7-Day Caloric Balance: {netCalorieDiff <= 0 ? (
                <span style={{ color: 'var(--macro-fat)' }}>{Math.abs(netCalorieDiff)} kcal Deficit</span>
              ) : (
                <span style={{ color: 'var(--macro-cal)' }}>+{netCalorieDiff} kcal Surplus</span>
              )}
            </div>
            <p className="deficit-desc">
              {netCalorieDiff <= 0 ? (
                <>Estimated fat loss: <strong style={{ color: 'var(--macro-fat)' }}>~{Math.abs(estimatedFatChangeKg)} kg</strong> of body fat this week (based on a 3,500 kcal/lb metabolic rate).</>
              ) : (
                <>Estimated surplus: <strong style={{ color: 'var(--macro-cal)' }}>+{estimatedFatChangeKg} kg</strong> (ideal for muscle hyper-trophy or lean bulk).</>
              )}
            </p>
          </div>
        </div>

        <div className="deficit-card-right">
          <div className="deficit-metric-pill">
            <span className="deficit-pill-val">{avgCalories}</span>
            <span className="deficit-pill-lbl">Avg kcal / Day</span>
          </div>
          <div className="deficit-metric-pill">
            <span className="deficit-pill-val" style={{ color: 'var(--macro-fat)' }}>🔥 {streak} Days</span>
            <span className="deficit-pill-lbl">Habit Streak</span>
          </div>
        </div>
      </div>

      <div className="analytics-grid delay-2">
        {/* Interactive 7-Day Calorie Bar Chart with Rich Floating Tooltip */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3>Calorie Intake (Past 7 Days)</h3>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
                Hover over bars to inspect macro breakdowns and deficit/surplus stats
              </span>
            </div>
            <div className="chart-legend-dots">
              <span className="legend-dot-label">
                <span className="legend-dot" style={{ background: 'var(--macro-cal)' }}></span> Normal
              </span>
              <span className="legend-dot-label">
                <span className="legend-dot" style={{ background: 'var(--macro-protein)' }}></span> Over Goal
              </span>
            </div>
          </div>
          
          <div className="interactive-bar-chart-container">
            {/* Goal reference dashed line */}
            <div 
              className="chart-goal-line" 
              style={{ bottom: `${(goal / (maxCalories * 1.15)) * 100}%` }}
            >
              <span className="goal-line-label">Goal: {goal} kcal</span>
            </div>

            <div className="bar-chart-bars">
              {days.map(date => {
                const data = dailyStats[date];
                const height = maxCalories > 0 ? (data.calories / (maxCalories * 1.15)) * 100 : 0;
                const dateObj = new Date(date);
                const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                const fullDateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'long' });
                const diffFromGoal = data.calories - goal;
                const isOver = data.calories > goal;
                const isHovered = hoveredBar === date;

                return (
                  <div 
                    key={date} 
                    className="bar-chart-item"
                    onMouseEnter={() => setHoveredBar(date)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    <div 
                      className={`bar-chart-bar ${isOver ? 'over-goal' : ''} ${isHovered ? 'active' : ''}`}
                      style={{ 
                        height: `${Math.max(height, 8)}%`,
                        background: data.calories === 0 
                          ? 'var(--bg-glass)' 
                          : isOver 
                            ? 'var(--macro-protein-grad)' 
                            : 'var(--macro-cal-grad)'
                      }}
                    >
                      {/* Rich Glassmorphic Interactive Floating Tooltip */}
                      {isHovered && data.calories > 0 && (
                        <div className="bar-rich-tooltip">
                          <div className="tooltip-title">{fullDateStr}</div>
                          <div className="tooltip-calories">
                            <strong>{data.calories} kcal</strong>
                            <span className={diffFromGoal <= 0 ? 'tooltip-deficit' : 'tooltip-surplus'}>
                              {diffFromGoal <= 0 ? `${diffFromGoal} kcal deficit` : `+${diffFromGoal} kcal surplus`}
                            </span>
                          </div>
                          <div className="tooltip-macros">
                            <span className="macro-pill p">{data.protein}g P</span>
                            <span className="macro-pill c">{data.carbs}g C</span>
                            <span className="macro-pill f">{data.fat}g F</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="bar-chart-label">{dayName}</div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="chart-footer-note">
            Target benchmark: {goal} kcal / day • Green indicates safe deficit range
          </div>
        </div>

        {/* Right Column: Macro Donut & Nutrition Efficiency */}
        <div className="analytics-side-col">
          {/* Macronutrient Distribution Donut */}
          <div className="chart-card">
            <h3>7-Day Macro Distribution</h3>
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
              Total grams consumed across all recorded meals
            </span>
            
            <div className="donut-chart-wrapper">
              {totalGrams > 1 ? (
                <div className="donut-chart-visual">
                  <svg viewBox="0 0 160 160" className="donut-svg">
                    {/* Fat (Emerald/Avocado) */}
                    <circle 
                      cx="80" cy="80" r="60" fill="none" 
                      stroke="var(--macro-fat)" strokeWidth="16" 
                      strokeDasharray={`${(fPercent / 100) * circumference} ${circumference}`} 
                    />
                    
                    {/* Carbs (Sun Yellow) */}
                    <circle 
                      cx="80" cy="80" r="60" fill="none" 
                      stroke="var(--macro-carbs)" strokeWidth="16" 
                      strokeDasharray={`${(cPercent / 100) * circumference} ${circumference}`} 
                      strokeDashoffset={-(fPercent / 100) * circumference} 
                    />
                    
                    {/* Protein (Crimson Red) */}
                    <circle 
                      cx="80" cy="80" r="60" fill="none" 
                      stroke="var(--macro-protein)" strokeWidth="16" 
                      strokeDasharray={`${(pPercent / 100) * circumference} ${circumference}`} 
                      strokeDashoffset={-((fPercent + cPercent) / 100) * circumference} 
                    />
                  </svg>
                  <div className="donut-chart-center">
                    <span className="donut-center-lbl">Daily Avg</span>
                    <span className="donut-center-val">{avgCalories}</span>
                    <span className="donut-center-unit">kcal</span>
                  </div>
                </div>
              ) : (
                <div style={{ padding: 'var(--space-4)', color: 'var(--text-tertiary)' }}>No data logged</div>
              )}
              
              <div className="donut-chart-legend">
                <div className="donut-legend-item">
                  <div className="donut-legend-dot" style={{ background: 'var(--macro-protein)' }}></div>
                  <div style={{ flex: 1 }}>Protein</div>
                  <div style={{ fontWeight: '600', color: 'var(--macro-protein)' }}>{pPercent}%</div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginLeft: 8 }}>
                    {totalMacros.protein}g
                  </div>
                </div>

                <div className="donut-legend-item">
                  <div className="donut-legend-dot" style={{ background: 'var(--macro-carbs)' }}></div>
                  <div style={{ flex: 1 }}>Carbohydrates</div>
                  <div style={{ fontWeight: '600', color: 'var(--macro-carbs)' }}>{cPercent}%</div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginLeft: 8 }}>
                    {totalMacros.carbs}g
                  </div>
                </div>

                <div className="donut-legend-item">
                  <div className="donut-legend-dot" style={{ background: 'var(--macro-fat)' }}></div>
                  <div style={{ flex: 1 }}>Healthy Fats</div>
                  <div style={{ fontWeight: '600', color: 'var(--macro-fat)' }}>{fPercent}%</div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginLeft: 8 }}>
                    {totalMacros.fat}g
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Dietary Insight Card */}
          <div className="dietary-insight-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: '1.2rem' }}>💡</span>
              <strong style={{ fontSize: 'var(--fs-sm)' }}>Nutritional Advice</strong>
            </div>
            <p style={{ margin: 0, fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Your protein intake is maintaining at <strong>{pPercent}%</strong> of total macronutrients. For optimal lean mass preservation during a deficit, aim to keep protein above <strong>25-30%</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
