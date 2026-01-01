import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import AIFormBuilder from './pages/AIFormBuilder';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import DashboardPage from './pages/DashboardPage';
import FormEditorPage from './pages/FormEditorPage.tsx';
import PublicFormPage from './pages/PublicFormPage';

/**
 * Main App Component
 * Handles routing and authentication for the AI Form Builder application
 */
function App() {
  return (
    <BrowserRouter>
      {/* Global Toast Notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f2937',
            color: '#fff',
            borderRadius: '8px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-form-builder"
            element={
              <ProtectedRoute>
                <AIFormBuilder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/builder/ai/:formType"
            element={
              <ProtectedRoute>
                <AIFormBuilder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/editor/:formId"
            element={
              <ProtectedRoute>
                <FormEditorPage />
              </ProtectedRoute>
            }
          />

          {/* Public Form View Route */}
          <Route path="/forms/:slug" element={<PublicFormPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
