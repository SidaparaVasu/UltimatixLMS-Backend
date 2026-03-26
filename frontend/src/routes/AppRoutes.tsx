import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Protected Routes inside Dashboard Layout */}
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<div>Dashboard Page Placeholder</div>} />
          {/* We will add more routes here later */}
        </Route>

        {/* Public / Auth Routes */}
        <Route path="/login" element={<div>Login Page Placeholder</div>} />
        
        {/* 404 handler */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
