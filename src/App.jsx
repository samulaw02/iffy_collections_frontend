import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import SalesPage from './pages/SalesPage';
import SalesHistoryPage from './pages/SalesHistoryPage';
import UsersPage from './pages/UsersPage';
import StockHistoryPage from './pages/StockHistoryPage';
import RestockPage from './pages/RestockPage';
import CashSummaryPage from './pages/CashSummaryPage';
import ProfitReportPage from './pages/ProfitReportPage';
import ReturnsPage from './pages/ReturnsPage';
import CustomersPage from './pages/CustomersPage';
import AuditLogPage from './pages/AuditLogPage';
import SettingsPage from './pages/SettingsPage';
import Layout from './components/Layout';
import Loader from './components/Loader';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="sales" element={<ProtectedRoute roles={['admin', 'sales_rep']}><SalesPage /></ProtectedRoute>} />
        <Route path="sales-history" element={<ProtectedRoute roles={['admin', 'sales_rep']}><SalesHistoryPage /></ProtectedRoute>} />
        <Route path="stock-history" element={<StockHistoryPage />} />
        <Route path="restock" element={<RestockPage />} />
        <Route path="cash-summary" element={<ProtectedRoute roles={['admin']}><CashSummaryPage /></ProtectedRoute>} />
        <Route path="profit-report" element={<ProtectedRoute roles={['admin']}><ProfitReportPage /></ProtectedRoute>} />
        <Route path="returns" element={<ProtectedRoute roles={['admin']}><ReturnsPage /></ProtectedRoute>} />
        <Route path="customers" element={<ProtectedRoute roles={['admin', 'sales_rep']}><CustomersPage /></ProtectedRoute>} />
        <Route path="audit-log" element={<ProtectedRoute roles={['admin']}><AuditLogPage /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute roles={['admin']}><UsersPage /></ProtectedRoute>} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
