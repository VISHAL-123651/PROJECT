import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

const Analytics = () => {
  const { user } = useContext(AuthContext);
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/meals/stats?days=7');
        setStatsData(res.data);
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
        <p>Crunching the numbers...</p>
      </div>
    );
  }

  if (!statsData || Object.keys(statsData.dailyStats || {}).length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">📈</span>
        <h3>No data available yet</h3>
        <p>Log your meals for a few days to see your trends here.</p>
      </div>
    );
  }

  const { dailyStats, streak } = statsData;
  const days = Object.keys(dailyStats).sort();
  
  // Calculate max calories for chart scaling
  const maxCalories = Math.max(
    user?.dailyCalorieGoal || 2000, 
    ...Object.values(dailyStats).map(d => d.calories)
  );
  
  // Calculate averages
  const activeDays = Object.values(dailyStats).filter(d => d.calories > 0);
  const avgCalories = activeDays.length 
    ? Math.round(activeDays.reduce((sum, d) => sum + d.calories, 0) / activeDays.length) 
    : 0;

  // Calculate total macros for donut chart
  const totalMacros = Object.values(dailyStats).reduce((acc, d) => ({
    protein: acc.protein + d.protein,
    carbs: acc.carbs + d.carbs,
    fat: acc.fat + d.fat
  }), { protein: 0, carbs: 0, fat: 0 });

  const totalGrams = totalMacros.protein + totalMacros.carbs + totalMacros.fat || 1;
  const pPercent = (totalMacros.protein / totalGrams) * 100;
  const cPercent = (totalMacros.carbs / totalGrams) * 100;
  const fPercent = (totalMacros.fat / totalGrams) * 100;

  // SVG Donut Chart variables
  const circumference = 2 * Math.PI * 60; // r=60
  const pOffset = circumference - (pPercent / 100) * circumference;
  const cOffset = circumference - (cPercent / 100) * circumference;
  const fOffset = circumference - (fPercent / 100) * circumference;

  return (
    <div className="analytics">
      <div className="page-header">
        <h2>Analytics & Trends</h2>
        <p>Your nutrition journey over the last 7 days.</p>
      </div>

      <div className="analytics-grid">
        <div className="chart-card delay-1">
          <h3>Calorie Intake (7 Days)</h3>
          
          <div className="bar-chart">
            {days.map(date => {
              const data = dailyStats[date];
              const height = maxCalories > 0 ? (data.calories / (maxCalories * 1.1)) * 100 : 0;
              const dateObj = new Date(date);
              const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
              
              // Determine bar color based on goal
              let bg = 'var(--gradient-primary)';
              if (data.calories === 0) bg = 'var(--bg-glass)';
              else if (data.calories > user.dailyCalorieGoal) bg = 'linear-gradient(135deg, #f87171, #ef4444)';
              
              return (
                <div key={date} className="bar-chart-item">
                  <div 
                    className="bar-chart-bar" 
                    style={{ height: `${height}%`, background: bg }}
                  >
                    {data.calories > 0 && (
                      <div className="bar-tooltip">
                        {data.calories} kcal
                      </div>
                    )}
                  </div>
                  <div className="bar-chart-label">{dayName}</div>
                </div>
              );
            })}
          </div>
          
          <div style={{ marginTop: 'var(--space-4)', fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
            Goal: {user.dailyCalorieGoal} kcal
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="streak-card delay-2">
            <h3>Current Streak</h3>
            <div className="streak-value">{streak} {streak === 1 ? 'Day' : 'Days'}</div>
            <div className="streak-label">Logging consistently</div>
          </div>
          
          <div className="chart-card delay-3">
            <h3>Avg Macros (7 Days)</h3>
            
            <div className="donut-chart">
              {totalGrams > 1 ? (
                <div className="donut-chart-visual">
                  <svg viewBox="0 0 150 150">
                    {/* Fat (Orange/Yellow) */}
                    <circle cx="75" cy="75" r="60" fill="none" stroke="var(--accent-warning)" strokeWidth="15" 
                      strokeDasharray={`${(fPercent / 100) * circumference} ${circumference}`} />
                    
                    {/* Carbs (Pink/Purple) - Offset by Fat */}
                    <circle cx="75" cy="75" r="60" fill="none" stroke="var(--accent-tertiary)" strokeWidth="15" 
                      strokeDasharray={`${(cPercent / 100) * circumference} ${circumference}`} 
                      strokeDashoffset={-(fPercent / 100) * circumference} />
                    
                    {/* Protein (Blue/Indigo) - Offset by Fat + Carbs */}
                    <circle cx="75" cy="75" r="60" fill="none" stroke="var(--accent-secondary)" strokeWidth="15" 
                      strokeDasharray={`${(pPercent / 100) * circumference} ${circumference}`} 
                      strokeDashoffset={-((fPercent + cPercent) / 100) * circumference} />
                  </svg>
                  <div className="donut-chart-center">
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>Avg</div>
                    <div style={{ fontWeight: 'bold' }}>{avgCalories}</div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>kcal</div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: 'var(--space-4)', color: 'var(--text-tertiary)' }}>No data</div>
              )}
              
              <div className="donut-chart-legend">
                <div className="donut-legend-item">
                  <div className="donut-legend-dot" style={{ background: 'var(--accent-secondary)' }}></div>
                  <div style={{ flex: 1 }}>Protein</div>
                  <div style={{ fontWeight: '500' }}>{Math.round(pPercent || 0)}%</div>
                </div>
                <div className="donut-legend-item">
                  <div className="donut-legend-dot" style={{ background: 'var(--accent-tertiary)' }}></div>
                  <div style={{ flex: 1 }}>Carbs</div>
                  <div style={{ fontWeight: '500' }}>{Math.round(cPercent || 0)}%</div>
                </div>
                <div className="donut-legend-item">
                  <div className="donut-legend-dot" style={{ background: 'var(--accent-warning)' }}></div>
                  <div style={{ flex: 1 }}>Fat</div>
                  <div style={{ fontWeight: '500' }}>{Math.round(fPercent || 0)}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
