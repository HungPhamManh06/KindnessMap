import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModals } from './components/AuthModals';
import { NotificationToast } from './components/NotificationToast';
import { FloatingChatbot } from './components/FloatingChatbot';

const Home = lazy(() => import('./pages/Home').then((module) => ({ default: module.Home })));
const ExploreMap = lazy(() => import('./pages/ExploreMap').then((module) => ({ default: module.ExploreMap })));
const KindnessStories = lazy(() => import('./pages/KindnessStories').then((module) => ({ default: module.KindnessStories })));
const SubmitKindness = lazy(() => import('./pages/SubmitKindness').then((module) => ({ default: module.SubmitKindness })));
const Leaderboard = lazy(() => import('./pages/Leaderboard').then((module) => ({ default: module.Leaderboard })));
const AIMatchingEngine = lazy(() => import('./pages/AIMatchingEngine').then((module) => ({ default: module.AIMatchingEngine })));
const UserProfile = lazy(() => import('./pages/UserProfile').then((module) => ({ default: module.UserProfile })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));
const MonthlyAwards = lazy(() => import('./pages/MonthlyAwards').then((module) => ({ default: module.MonthlyAwards })));

const PageLoader = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div className="km-panel-hero p-8 sm:p-12 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_30%)] pointer-events-none" />
      <div className="relative z-10 flex flex-col gap-5 animate-pulse">
        <div className="h-7 w-44 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-12 w-full max-w-3xl rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-12 w-full max-w-2xl rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-5 w-full max-w-4xl rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-5 w-full max-w-3xl rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="h-28 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-28 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-28 rounded-3xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  </div>
);

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/explore" element={<ExploreMap />} />
    <Route path="/stories" element={<KindnessStories />} />
    <Route path="/submit" element={<SubmitKindness />} />
    <Route path="/leaderboard" element={<Leaderboard />} />
    <Route path="/matching" element={<AIMatchingEngine />} />
    <Route path="/profile" element={<UserProfile />} />
    <Route path="/admin" element={<AdminDashboard />} />
    <Route path="/awards" element={<MonthlyAwards />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export const App = () => {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <Router>
              <div className="min-h-screen flex flex-col justify-between bg-[var(--app-bg)] text-[var(--app-text)] transition-colors duration-300">
                <Navbar />
                <main className="flex-1">
                  <Suspense fallback={<PageLoader />}>
                    <AppRoutes />
                  </Suspense>
                </main>
                <Footer />
                <AuthModals />
                <NotificationToast />
                <FloatingChatbot />
              </div>
            </Router>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
};

export default App;
