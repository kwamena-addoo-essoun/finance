import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { authAPI } from '../utils/api';
import FinsightLogo from './FinsightLogo';
import AIChatPanel from './AIChatPanel';
import NotificationBell from './NotificationBell';
import './Navbar.css';

function Navbar() {
  const { isAuthenticated, logout } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
  const navigate = useNavigate();
  const [aiOpen, setAiOpen] = useState(false);

  const handleLogout = async () => {
    try {
      // Ask the server to expire the httpOnly cookies (JS can't do it directly)
      await authAPI.logout();
    } catch {
      // Continue with local logout even if the network call fails
    }
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo" onClick={() => navigate('/')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/')}>
          <FinsightLogo size="sm" />
        </div>
        {isAuthenticated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="theme-toggle-btn" onClick={toggle} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'} aria-label="Toggle theme">{isDark ? '☀' : '🌙'}</button>
            <NotificationBell />
            <button className="ai-coach-btn" onClick={() => setAiOpen(true)}>✦ AI Coach</button>
            <button className="nav-link-btn" onClick={() => navigate('/analytics')}>Analytics</button>
            <button className="nav-link-btn" onClick={() => navigate('/goals')}>Goals</button>
            <button className="nav-link-btn" onClick={() => navigate('/accounts')}>Accounts</button>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        )}
      </div>
    </nav>
    {isAuthenticated && aiOpen && <AIChatPanel onClose={() => setAiOpen(false)} />}
  );
}

export default Navbar;
