import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { DEMO_USER, getDemoStorage } from '../data/demoData';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const isDemo = localStorage.getItem('nutritrack_demo_mode') === 'true';
      if (isDemo) {
        setIsDemoMode(true);
        const storedDemoUser = localStorage.getItem('nutritrack_demo_user');
        setUser(storedDemoUser ? JSON.parse(storedDemoUser) : DEMO_USER);
        getDemoStorage(); // Ensure initial demo meals seeded
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (err) {
          console.error('Error fetching user profile:', err);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const loginDemoUser = () => {
    localStorage.setItem('nutritrack_demo_mode', 'true');
    localStorage.setItem('token', 'demo-token-active-2025');
    localStorage.setItem('nutritrack_demo_user', JSON.stringify(DEMO_USER));
    getDemoStorage(); // seed meals
    setIsDemoMode(true);
    setUser(DEMO_USER);
    setError(null);
    return { success: true };
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const res = await api.post('/auth/login', { email, password });
      localStorage.removeItem('nutritrack_demo_mode');
      localStorage.setItem('token', res.data.token);
      setIsDemoMode(false);
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const res = await api.post('/auth/register', userData);
      localStorage.removeItem('nutritrack_demo_mode');
      localStorage.setItem('token', res.data.token);
      setIsDemoMode(false);
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('nutritrack_demo_mode');
    setIsDemoMode(false);
    setUser(null);
  };

  const updateUserProfile = async (userData) => {
    if (isDemoMode) {
      // Calculate BMR and TDEE locally for demo user
      const weight = Number(userData.weight) || user.weight;
      const height = Number(userData.height) || user.height;
      const age = Number(userData.age) || user.age;
      const gender = userData.gender || user.gender;
      const activityLevel = userData.activityLevel || user.activityLevel;

      let bmr = gender === 'male'
        ? Math.round(10 * weight + 6.25 * height - 5 * age + 5)
        : Math.round(10 * weight + 6.25 * height - 5 * age - 161);

      const multipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9
      };
      const tdee = Math.round(bmr * (multipliers[activityLevel] || 1.55));
      const dailyCalorieGoal = Number(userData.dailyCalorieGoal) || tdee;

      const updated = {
        ...user,
        ...userData,
        bmr,
        tdee,
        dailyCalorieGoal
      };

      setUser(updated);
      localStorage.setItem('nutritrack_demo_user', JSON.stringify(updated));
      return { success: true };
    }

    try {
      setError(null);
      const res = await api.put('/users/profile', userData);
      setUser(res.data);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Profile update failed';
      setError(message);
      return { success: false, message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isDemoMode,
        loginDemoUser,
        login,
        register,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
