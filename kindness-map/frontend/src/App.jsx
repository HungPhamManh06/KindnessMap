import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModals } from './components/AuthModals';
import { NotificationToast } from './components/NotificationToast';

// Pages
import { Home } from './pages/Home';
import { ExploreMap } from './pages/ExploreMap';
import { KindnessStories } from './pages/KindnessStories';
import { SubmitKindness } from './pages/SubmitKindness';
import { Leaderboard } from './pages/Leaderboard';
import { UserProfile } from './pages/UserProfile';
import { AdminDashboard } from './pages/AdminDashboard';
import { MonthlyAwards } from './pages/MonthlyAwards';

export const App = () => {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen flex flex-col justify-between bg-[var(--app-bg)] text-[var(--app-text)] transition-colors duration-300">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/explore" element={<ExploreMap />} />
                  <Route path="/stories" element={<KindnessStories />} />
                  <Route path="/submit" element={<SubmitKindness />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/profile" element={<UserProfile />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/awards" element={<MonthlyAwards />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
              <AuthModals />
              <NotificationToast />
            </div>
          </Router>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default App;
