import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Typography, Box } from '@mui/material';
import { AppLayout } from './components/Layout/AppLayout';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingPage } from './components/Landing/LandingPage';
import { Dashboard } from './components/Dashboard/Dashboard';

// Placeholder for features not yet implemented (Steps 7-8+)
function Placeholder({ title }: { title: string }) {
  return (
    <Box sx={{ py: 4, textAlign: 'center' }}>
      <Typography variant="h4" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
        Coming soon...
      </Typography>
    </Box>
  );
}

function TodoPlaceholder() {
  return <Placeholder title="Todo Management" />;
}
function MatrixPlaceholder() {
  return <Placeholder title="Eisenhower Matrix" />;
}
function DiaryPlaceholder() {
  return <Placeholder title="Digital Diary" />;
}
function JournalPlaceholder() {
  return <Placeholder title="Bullet Journal" />;
}
function BlogPlaceholder() {
  return <Placeholder title="Blog" />;
}
function AnalyticsPlaceholder() {
  return <Placeholder title="Analytics Dashboard" />;
}

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
                <TodoPlaceholder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/todos/:id"
            element={
              <ProtectedRoute>
                <TodoPlaceholder />
              </ProtectedRoute>
            }
          />

          <Route
            path="/matrix"
            element={
              <ProtectedRoute>
                <MatrixPlaceholder />
              </ProtectedRoute>
            }
          />

          <Route
            path="/diary"
            element={
              <ProtectedRoute>
                <DiaryPlaceholder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/diary/:date"
            element={
              <ProtectedRoute>
                <DiaryPlaceholder />
              </ProtectedRoute>
            }
          />

          <Route
            path="/journal"
            element={
              <ProtectedRoute>
                <JournalPlaceholder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/journal/:date"
            element={
              <ProtectedRoute>
                <JournalPlaceholder />
              </ProtectedRoute>
            }
          />

          <Route
            path="/blog"
            element={
              <ProtectedRoute>
                <BlogPlaceholder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/blog/:slug"
            element={
              <ProtectedRoute>
                <BlogPlaceholder />
              </ProtectedRoute>
            }
          />

          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPlaceholder />
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
