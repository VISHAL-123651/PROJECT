import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

const Profile = () => {
  const { user, updateUserProfile } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: '',
    height: '',
    weight: '',
    age: '',
    gender: 'male',
    activityLevel: 'moderate',
    dailyCalorieGoal: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        height: user.height || '',
        weight: user.weight || '',
        age: user.age || '',
        gender: user.gender || 'male',
        activityLevel: user.activityLevel || 'moderate',
        dailyCalorieGoal: user.dailyCalorieGoal || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (message.text) setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await updateUserProfile({
        ...formData,
        height: Number(formData.height),
        weight: Number(formData.weight),
        age: Number(formData.age),
        dailyCalorieGoal: Number(formData.dailyCalorieGoal) || user.tdee
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully! BMR and TDEE recalculated.' });
        setIsEditing(false);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to update profile' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="profile">
      <div className="page-header">
        <h2>Your Profile</h2>
        <p>Manage your personal information and goals.</p>
      </div>

      {message.text && (
        <div className={message.type === 'error' ? 'auth-error' : 'auth-error'} style={{ 
          borderColor: message.type === 'success' ? 'var(--accent-primary)' : '',
          backgroundColor: message.type === 'success' ? 'var(--accent-primary-dim)' : '',
          color: message.type === 'success' ? 'var(--accent-primary)' : ''
        }}>
          {message.text}
        </div>
      )}

      <div className="profile-stats delay-1">
        <div className="profile-stat">
          <div className="profile-stat-value">{user.bmr}</div>
          <div className="profile-stat-label">BMR (Resting kcal)</div>
        </div>
        <div className="profile-stat">
          <div className="profile-stat-value">{user.tdee}</div>
          <div className="profile-stat-label">TDEE (Maint. kcal)</div>
        </div>
        <div className="profile-stat">
          <div className="profile-stat-value" style={{ color: 'var(--accent-primary)' }}>
            {user.dailyCalorieGoal}
          </div>
          <div className="profile-stat-label">Current Goal</div>
        </div>
      </div>

      <div className="profile-card delay-2">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <h3 style={{ margin: 0, padding: 0, border: 'none' }}>Personal Information</h3>
          {!isEditing && (
            <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="profile-grid">
            <div className="input-group">
              <label>Full Name</label>
              <input 
                type="text" 
                name="name" 
                className="input-field" 
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
            
            <div className="input-group">
              <label>Email</label>
              <input 
                type="email" 
                className="input-field" 
                value={user.email}
                disabled
                style={{ opacity: 0.7 }}
              />
            </div>

            <div className="input-group">
              <label>Height (cm)</label>
              <input 
                type="number" 
                name="height" 
                className="input-field" 
                value={formData.height}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            <div className="input-group">
              <label>Weight (kg)</label>
              <input 
                type="number" 
                name="weight" 
                className="input-field" 
                value={formData.weight}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            <div className="input-group">
              <label>Age</label>
              <input 
                type="number" 
                name="age" 
                className="input-field" 
                value={formData.age}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            <div className="input-group">
              <label>Gender</label>
              <select 
                name="gender" 
                className="input-field"
                value={formData.gender}
                onChange={handleChange}
                disabled={!isEditing}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label>Activity Level</label>
              <select 
                name="activityLevel" 
                className="input-field"
                value={formData.activityLevel}
                onChange={handleChange}
                disabled={!isEditing}
              >
                <option value="sedentary">Sedentary (little to no exercise)</option>
                <option value="light">Light (exercise 1-3 days/week)</option>
                <option value="moderate">Moderate (exercise 3-5 days/week)</option>
                <option value="active">Active (exercise 6-7 days/week)</option>
                <option value="very_active">Very Active (hard exercise daily)</option>
              </select>
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label>Custom Calorie Goal (Optional)</label>
              <input 
                type="number" 
                name="dailyCalorieGoal" 
                className="input-field" 
                value={formData.dailyCalorieGoal}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder={`Leave blank to use TDEE (${user.tdee})`}
              />
              <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-1)' }}>
                To lose weight, set this 300-500 calories below your TDEE. To gain weight, set it 300-500 above.
              </p>
            </div>
          </div>

          {isEditing && (
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => {
                  setIsEditing(false);
                  // Reset form to user data
                  setFormData({
                    name: user.name,
                    height: user.height,
                    weight: user.weight,
                    age: user.age,
                    gender: user.gender,
                    activityLevel: user.activityLevel,
                    dailyCalorieGoal: user.dailyCalorieGoal
                  });
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Profile;
