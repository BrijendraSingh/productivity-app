import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/Layout/AppLayout';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingPage } from './components/Landing/LandingPage';
import { Dashboard } from './components/Dashboard/Dashboard';
import { TodoView } from './components/Todo/TodoView';
import { EisenhowerMatrixView } from './components/Matrix/EisenhowerMatrixView';
import { DiaryView } from './components/Diary/DiaryView';
import { BulletJournalView } from './components/BulletJournal/BulletJournalView';
import { BlogView } from './components/Blog/BlogView';
import { AnalyticsDashboard } from './components/Analytics/AnalyticsDashboard';

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public route — Landing page for unauthenticated users */}
        <Route path="/welcome" element={<LandingPage />} />

        {/* App shell — all authenticated routes inside the layout */}
        <Route element={<AppLayout />}>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />

          <Route
            path="/todos"
            element={
              <ProtectedRoute>
                <TodoView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/todos/:id"
            element={
              <ProtectedRoute>
                <TodoView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/matrix"
            element={
              <ProtectedRoute>
                <EisenhowerMatrixView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/diary"
            element={
              <ProtectedRoute>
                <DiaryView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/diary/:date"
            element={
              <ProtectedRoute>
                <DiaryView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/journal"
            element={
              <ProtectedRoute>
                <BulletJournalView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/journal/:date"
            element={
              <ProtectedRoute>
                <BulletJournalView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/blog"
            element={
              <ProtectedRoute>
                <BlogView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/blog/:slug"
            element={
              <ProtectedRoute>
                <BlogView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsDashboard />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
