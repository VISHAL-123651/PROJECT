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
    height: '',
    weight: '',
    age: '',
    gender: 'male',
    activityLevel: 'moderate'
  });
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const { login, register, user, error: authError } = useContext(AuthContext);
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

  return (
    <div className="auth-page">
      {/* Background Orbs */}
      <div className="auth-orb auth-orb-1"></div>
      <div className="auth-orb auth-orb-2"></div>
      <div className="auth-orb auth-orb-3"></div>

      {/* Left Panel - Branding */}
      <div className="auth-branding">
        <div className="auth-branding-content">
          <h1 className="auth-logo">
            <span className="logo-icon">🍏</span><br />
            Nutri<span className="gradient-text">Track</span>
          </h1>
          <p className="auth-tagline">
            Your AI-powered personal nutritionist. Snap a photo of your meal and let our intelligent engine calculate the rest.
          </p>
          <div className="auth-features">
            <div className="auth-feature delay-1">
              <span className="auth-feature-icon">📸</span>
              <span>AI Image Recognition for meals</span>
            </div>
            <div className="auth-feature delay-2">
              <span className="auth-feature-icon">📊</span>
              <span>Automatic Calorie & Macro tracking</span>
            </div>
            <div className="auth-feature delay-3">
              <span className="auth-feature-icon">🤖</span>
              <span>Personalized AI meal suggestions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p>{isLogin ? 'Enter your details to access your dashboard' : 'Start your health journey today'}</p>
          </div>

          <div className="auth-tabs">
            <button 
              className={`auth-tab ${isLogin ? 'active' : ''}`} 
              onClick={() => setIsLogin(true)}
              type="button"
            >
              Login
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
                  placeholder="John Doe"
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
                    <option value="sedentary">Sedentary (little to no exercise)</option>
                    <option value="light">Light (exercise 1-3 days/week)</option>
                    <option value="moderate">Moderate (exercise 3-5 days/week)</option>
                    <option value="active">Active (exercise 6-7 days/week)</option>
                    <option value="very_active">Very Active (hard exercise daily)</option>
                  </select>
                </div>
              </>
            )}

            <button type="submit" className="btn auth-submit" disabled={loading}>
              {loading ? (
                <div className="spinner"></div>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="auth-toggle">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button onClick={toggleMode} type="button">
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
