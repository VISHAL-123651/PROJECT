import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Overview from '../components/Overview';
import MealLogger from '../components/MealLogger';
import MealHistory from '../components/MealHistory';
import Analytics from '../components/Analytics';
import Profile from '../components/Profile';
import Chatbot from '../components/Chatbot';
import '../styles/dashboard.css';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview setActiveTab={setActiveTab} />;
      case 'logger':
        return <MealLogger onMealLogged={() => setActiveTab('overview')} />;
      case 'history':
        return <MealHistory />;
      case 'analytics':
        return <Analytics />;
      case 'profile':
        return <Profile />;
      default:
        return <Overview setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="dashboard">
      <button 
        className="mobile-menu-btn" 
        onClick={() => setIsMobileOpen(true)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      
      <main className="dashboard-content">
        {renderContent()}
      </main>
      
      <Chatbot />
    </div>
  );
};

export default Dashboard;
