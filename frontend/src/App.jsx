import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

function App() {
  const [currentPage, setCurrentPage] = useState('login');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setCurrentPage('dashboard');
    } else {
      setCurrentPage('login');
    }
  }, []);

  const handleAuthSuccess = () => {
    setCurrentPage('dashboard');
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentPage('login');
  };

  if (currentPage === 'login') {
    return (
      <Login 
        onAuthSuccess={handleAuthSuccess} 
        onNavigateToRegister={() => setCurrentPage('register')} 
      />
    );
  }

  if (currentPage === 'register') {
    return (
      <Register 
        onAuthSuccess={handleAuthSuccess} 
        onNavigateToLogin={() => setCurrentPage('login')} 
      />
    );
  }

  if (currentPage === 'dashboard') {
    return (
      <Dashboard 
        onSignOut={handleSignOut} 
      />
    );
  }

  return null;
}

export default App;
