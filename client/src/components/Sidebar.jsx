import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../styles/dashboard.css';

const Sidebar = ({ activeTab, setActiveTab, isMobileOpen, setIsMobileOpen }) => {
  const { user, logout } = useContext(AuthContext);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'logger', label: 'Log Meal', icon: '✍️' },
    { id: 'history', label: 'History', icon: '🗓️' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'profile', label: 'Profile', icon: '👤' }
  ];

  return (
    <>
      <div 
        className={`sidebar-overlay ${isMobileOpen ? 'show' : ''}`} 
        onClick={() => setIsMobileOpen(false)}
      ></div>
      
      <div className={`sidebar ${isMobileOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <span className="logo-icon">🍏</span>
          <h1>Nutri<span className="gradient-text">Track</span></h1>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileOpen(false);
              }}
            >
              <span className="nav-item-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || 'User'}</div>
              <div className="sidebar-user-email">{user?.email || 'email@example.com'}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>
            <span className="nav-item-icon">🚪</span>
            Log Out
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
