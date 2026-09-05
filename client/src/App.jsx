import React, { useState, useEffect, useLayoutEffect } from 'react';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';

export default function App() {
  // 1. Rock-solid hash state initialized directly from the window
  const [route, setRoute] = useState(() => window.location.hash.toLowerCase());
  
  // 2. Theme management
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('spend-smart-theme');
    return savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark-mode');
      root.style.backgroundColor = '#0B0F17';
      localStorage.setItem('spend-smart-theme', 'dark');
    } else {
      root.classList.remove('dark-mode');
      root.style.backgroundColor = '#F8FAFC';
      localStorage.setItem('spend-smart-theme', 'light');
    }
  }, [isDark]);

  // 3. Perfect route synchronization capturing all browser navigation events
  useEffect(() => {
    const handleNavigation = () => {
      setRoute(window.location.hash.toLowerCase());
    };

    // Catch inline hash navigation and physical address bar changes
    window.addEventListener('hashchange', handleNavigation);
    window.addEventListener('popstate', handleNavigation);

    return () => {
      window.removeEventListener('hashchange', handleNavigation);
      window.removeEventListener('popstate', handleNavigation);
    };
  }, []);

  const toggleTheme = () => setIsDark(!isDark);

  // Normalize the route to remove any accidental slashes (e.g., #/dashboard becomes #dashboard)
  const activeRoute = route.replace('/', '');

  // 4. Absolute Routing Switch Matrix
  if (activeRoute === '#dashboard') {
    return <Dashboard isDark={isDark} onToggleTheme={toggleTheme} />;
  }
  if (activeRoute === '#login') {
    return <Login isDark={isDark} onToggleTheme={toggleTheme} />;
  }
  if (activeRoute === '#register') {
    return <Register isDark={isDark} onToggleTheme={toggleTheme} />;
  }
  if (activeRoute === '#forgot') {
    return <ForgotPassword isDark={isDark} onToggleTheme={toggleTheme} />;
  }
  
  return <Landing isDark={isDark} onToggleTheme={toggleTheme} />;
}