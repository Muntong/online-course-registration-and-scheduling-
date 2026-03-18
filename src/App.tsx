/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Courses } from './pages/Courses';
import { Schedule } from './pages/Schedule';
import { Users } from './pages/Users';
import { Enrollments } from './pages/Enrollments';
import { Faculties } from './pages/Faculties';
import { Reports } from './pages/Reports';
import { ChangePassword } from './pages/ChangePassword';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses"
          element={
            <ProtectedRoute>
              <Courses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedule"
          element={
            <ProtectedRoute>
              <Schedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/enrollments"
          element={
            <ProtectedRoute>
              <Enrollments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculties"
          element={
            <ProtectedRoute>
              <Faculties />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}
