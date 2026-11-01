import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/auth.css';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    height: '175',
    weight: '70',
    age: '25',
    gender: 'male',
    activityLevel: 'moderate'
  });
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const { login, register, loginDemoUser, user, error: authError } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  useEffect(() => {
    if (authError) {
      setLocalError(authError);
    }
  }, [authError]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (localError) setLocalError('');
  };

  const handleDemoLogin = () => {
    setLoading(true);
    loginDemoUser();
    navigate('/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLocalError('');

    try {
      if (isLogin) {
        if (!formData.email || !formData.password) {
          setLocalError('Please fill in all fields');
          setLoading(false);
          return;
        }
        await login(formData.email, formData.password);
      } else {
        // Basic validation for signup
        if (!formData.name || !formData.email || !formData.password || 
            !formData.height || !formData.weight || !formData.age) {
          setLocalError('Please fill in all required fields');
          setLoading(false);
          return;
        }
        
        const registerData = {
          ...formData,
          height: Number(formData.height),
          weight: Number(formData.weight),
          age: Number(formData.age)
        };
        
        await register(registerData);
      }
    } catch (err) {
      console.error(err);
      setLocalError('An unexpected error occurred');
    }
    
    setLoading(false);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setLocalError('');
  };

  // Live BMR / TDEE / BMI calculations for instant signup preview
  const heightNum = Number(formData.height);
  const weightNum = Number(formData.weight);
  const ageNum = Number(formData.age);

  let previewBmr = 0;
  let previewTdee = 0;
  let bmi = 0;
  let bmiCategory = '';
  let bmiColor = 'var(--accent-primary)';

  if (heightNum > 50 && weightNum > 20 && ageNum > 8) {
    const heightM = heightNum / 100;
    bmi = (weightNum / (heightM * heightM)).toFixed(1);
    if (bmi < 18.5) {
      bmiCategory = 'Underweight';
      bmiColor = 'var(--accent-warning)';
    } else if (bmi < 25) {
      bmiCategory = 'Normal Weight';
      bmiColor = 'var(--accent-primary)';
    } else if (bmi < 30) {
      bmiCategory = 'Overweight';
      bmiColor = 'var(--accent-warning)';
    } else {
      bmiCategory = 'Obese';
      bmiColor = 'var(--accent-danger)';
    }

    if (formData.gender === 'male') {
      previewBmr = Math.round(10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5);
    } else {
      previewBmr = Math.round(10 * weightNum + 6.25 * heightNum - 5 * ageNum - 161);
    }

    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    previewTdee = Math.round(previewBmr * (multipliers[formData.activityLevel] || 1.55));
  }

  return (
    <div className="auth-page">
      {/* Background Glow Orbs */}
      <div className="auth-orb auth-orb-1"></div>
      <div className="auth-orb auth-orb-2"></div>
      <div className="auth-orb auth-orb-3"></div>

      {/* Left Panel - Branding */}
      <div className="auth-branding">
        <div className="auth-branding-content">
          <div className="auth-badge">✨ Next-Gen AI Nutrition Engine</div>
          <h1 className="auth-logo">
            <span className="logo-icon">🍏</span><br />
            Nutri<span className="gradient-text">Track</span>
          </h1>
          <p className="auth-tagline">
            Your intelligent personal nutritionist. Snap food photos, auto-detect macros, track hydration, and reach your fitness goals with cutting-edge AI.
          </p>
          <div className="auth-features">
            <div className="auth-feature delay-1">
              <span className="auth-feature-icon">📸</span>
              <div>
                <strong>AI Laser Food Vision</strong>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Instant item and macro estimation</p>
              </div>
            </div>
            <div className="auth-feature delay-2">
              <span className="auth-feature-icon">📊</span>
              <div>
                <strong>Concentric Macro Rings</strong>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Real-time balance of Protein, Carbs & Fat</p>
              </div>
            </div>
            <div className="auth-feature delay-3">
              <span className="auth-feature-icon">💧</span>
              <div>
                <strong>Hydration & Habit Streaks</strong>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Water tracker & daily logging streaks</p>
              </div>
            </div>
            <div className="auth-feature delay-4">
              <span className="auth-feature-icon">🤖</span>
              <div>
                <strong>NutriBot Interactive Coach</strong>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Smart meal suggestions with 1-click logging</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          {/* Quick Demo Mode Banner */}
          <div className="demo-mode-card">
            <div className="demo-mode-header">
              <span className="demo-mode-badge">⚡ Instant Preview</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>No account required</span>
            </div>
            <p className="demo-mode-desc">
              Test drive NutriTrack with pre-populated meals, hydration logs, and 7-day analytics immediately.
            </p>
            <button 
              type="button" 
              className="btn-demo-mode"
              onClick={handleDemoLogin}
              disabled={loading}
            >
              🚀 Explore in Demo Mode
            </button>
          </div>

          <div className="auth-divider">
            <span>or continue with your account</span>
          </div>

          <div className="auth-form-header">
            <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p>{isLogin ? 'Enter your credentials to access your nutrition diary' : 'Start your personalized health journey today'}</p>
          </div>

          <div className="auth-tabs">
            <button 
              className={`auth-tab ${isLogin ? 'active' : ''}`} 
              onClick={() => setIsLogin(true)}
              type="button"
            >
              Sign In
            </button>
            <button 
              className={`auth-tab ${!isLogin ? 'active' : ''}`} 
              onClick={() => setIsLogin(false)}
              type="button"
            >
              Sign Up
            </button>
          </div>

          {localError && (
            <div className="auth-error">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              {localError}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="input-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  className="input-field" 
                  placeholder="e.g. Jordan Miller"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            )}

            <div className="input-group">
              <label>Email Address</label>
              <input 
                type="email" 
                name="email" 
                className="input-field" 
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input 
                type="password" 
                name="password" 
                className="input-field" 
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {!isLogin && (
              <>
                <div className="form-row">
                  <div className="input-group">
                    <label>Height (cm)</label>
                    <input 
                      type="number" 
                      name="height" 
                      className="input-field" 
                      placeholder="175"
                      value={formData.height}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="input-group">
                    <label>Weight (kg)</label>
                    <input 
                      type="number" 
                      name="weight" 
                      className="input-field" 
                      placeholder="70"
                      value={formData.weight}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label>Age</label>
                    <input 
                      type="number" 
                      name="age" 
                      className="input-field" 
                      placeholder="25"
                      value={formData.age}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="input-group">
                    <label>Gender</label>
                    <select 
                      name="gender" 
                      className="input-field"
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>

                <div className="input-group">
                  <label>Activity Level</label>
                  <select 
                    name="activityLevel" 
                    className="input-field"
                    value={formData.activityLevel}
                    onChange={handleChange}
                  >
                    <option value="sedentary">Sedentary (desk job, little exercise)</option>
                    <option value="light">Light (exercise 1-3 days/week)</option>
                    <option value="moderate">Moderate (exercise 3-5 days/week)</option>
                    <option value="active">Active (intense exercise 6-7 days/week)</option>
                    <option value="very_active">Very Active (athlete / physical work)</option>
                  </select>
                </div>

                {/* Live Interactive BMR / TDEE / BMI Preview Card */}
                {previewBmr > 0 && (
                  <div className="live-preview-card">
                    <div className="live-preview-header">
                      <span className="live-preview-tag">⚡ Live Metric Estimation</span>
                      <span className="live-preview-bmi" style={{ borderColor: bmiColor, color: bmiColor }}>
                        BMI {bmi} • {bmiCategory}
                      </span>
                    </div>
                    <div className="live-preview-grid">
                      <div className="live-metric-item">
                        <span className="live-metric-num">{previewBmr}</span>
                        <span className="live-metric-lbl">BMR (Basal kcal)</span>
                      </div>
                      <div className="live-metric-item highlight">
                        <span className="live-metric-num">{previewTdee}</span>
                        <span className="live-metric-lbl">TDEE (Maint. kcal)</span>
                      </div>
                      <div className="live-metric-item">
                        <span className="live-metric-num" style={{ color: 'var(--accent-warning)' }}>
                          {previewTdee - 400}
                        </span>
                        <span className="live-metric-lbl">Fat Loss Goal</span>
                      </div>
                    </div>
                    <p className="live-preview-hint">
                      💡 We'll automatically set your daily target to <strong>{previewTdee} kcal</strong>. You can customize this anytime in your Profile.
                    </p>
                  </div>
                )}
              </>
            )}

            <button type="submit" className="btn auth-submit" disabled={loading}>
              {loading ? (
                <div className="spinner"></div>
              ) : (
                isLogin ? 'Sign In to Dashboard' : 'Create My Account'
              )}
            </button>
          </form>

          <div className="auth-toggle">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button onClick={toggleMode} type="button">
              {isLogin ? 'Sign up free' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
