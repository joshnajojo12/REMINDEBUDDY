
'use client';

import { useState, useEffect } from 'react';
import AuthPage from '../components/AuthPage';
import RoleSelection from '../components/RoleSelection';
import CaregiverDashboard from '../components/CaregiverDashboard';
import PatientDashboard from '../components/PatientDashboard';

type AppState = 'auth' | 'role-selection' | 'caregiver-dashboard' | 'patient-dashboard';

interface User {
  email: string;
  gender: 'male' | 'female';
  role?: 'patient' | 'caregiver';
}

export default function Home() {
  const [currentState, setCurrentState] = useState<AppState>('auth');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('reminder_buddy_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      if (userData.role === 'caregiver') {
        setCurrentState('caregiver-dashboard');
      } else if (userData.role === 'patient') {
        setCurrentState('patient-dashboard');
      } else {
        setCurrentState('role-selection');
      }
    }
  }, []);

  const handleLogin = (email: string, password: string, gender?: 'male' | 'female') => {
    const userData: User = {
      email,
      gender: gender || 'male'
    };
    setUser(userData);
    setCurrentState('role-selection');
  };

  const handleRoleSelection = (role: 'patient' | 'caregiver') => {
    if (user) {
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      localStorage.setItem('reminder_buddy_user', JSON.stringify(updatedUser));
      
      if (role === 'caregiver') {
        setCurrentState('caregiver-dashboard');
      } else {
        setCurrentState('patient-dashboard');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('reminder_buddy_user');
    setUser(null);
    setCurrentState('auth');
  };

  if (currentState === 'auth') {
    return <AuthPage onLogin={handleLogin} />;
  }

  if (currentState === 'role-selection' && user) {
    return <RoleSelection gender={user.gender} onRoleSelect={handleRoleSelection} />;
  }

  if (currentState === 'caregiver-dashboard' && user) {
    return <CaregiverDashboard userEmail={user.email} onLogout={handleLogout} />;
  }

  if (currentState === 'patient-dashboard' && user) {
    return <PatientDashboard userEmail={user.email} gender={user.gender} onLogout={handleLogout} />;
  }

  return <AuthPage onLogin={handleLogin} />;
}
