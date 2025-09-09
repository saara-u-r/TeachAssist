import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import Landing from '../pages/Landing';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Onboarding from '../pages/Onboarding';
import AITools from '../pages/AITools';
import Calendar from '../pages/Calendar';
import Resources from '../pages/Resources';
import Settings from '../pages/Settings';
import { supabase } from '../lib/supabase';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [onboardingCompleted, setOnboardingCompleted] = React.useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = React.useState(true);

  React.useEffect(() => {
    async function checkOnboarding() {
      if (user) {
        const { data, error } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setOnboardingCompleted(data.onboarding_completed);
        }
      }
      setCheckingOnboarding(false);
    }

    checkOnboarding();
  }, [user]);

  if (loading || checkingOnboarding) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (onboardingCompleted === false && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" />;
  }

  return <Layout>{children}</Layout>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/onboarding" element={<Onboarding />} />
      
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      
      <Route path="/ai-tools" element={
        <PrivateRoute>
          <AITools />
        </PrivateRoute>
      } />
      
      <Route path="/calendar" element={
        <PrivateRoute>
          <Calendar />
        </PrivateRoute>
      } />
      
      <Route path="/resources" element={
        <PrivateRoute>
          <Resources />
        </PrivateRoute>
      } />
      
      <Route path="/settings" element={
        <PrivateRoute>
          <Settings />
        </PrivateRoute>
      } />
    </Routes>
  );
}