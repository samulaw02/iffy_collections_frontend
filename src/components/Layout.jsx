import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserAvatar from './UserAvatar';
import toast from 'react-hot-toast';

const NavItem = ({ to, icon, label, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive ? 'bg-brand-500 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`
    }
  >
    <span className="text-lg">{icon}</span>
    <span>{label}</span>
  </NavLink>
);

export default function Layout() {
  const { user, logout, isAdmin, isManager, canManageStock, canAddProducts } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const roleLabel = { admin: 'Admin / CEO', manager: 'Store Manager', sales_rep: 'Sales Rep' };
  const roleBadge = { admin: 'badge-admin', manager: 'badge-manager', sales_rep: 'badge-sales_rep' };

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Iffy Collections" className="w-10 h-10 object-contain flex-shrink-0" />
          <div>
            <h1 className="text-sm font-bold text-brand-600 leading-tight">Iffy Collections</h1>
            <p className="text-xs text-gray-400 leading-tight">Inventory Management</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavItem to="/" icon="📊" label="Dashboard" end />
        <NavItem to="/inventory" icon="👗" label="Inventory" />
        {!isManager && <NavItem to="/sales" icon="🛒" label="New Sale (POS)" />}
        {!isManager && <NavItem to="/sales-history" icon="📋" label="Sales History" />}
        {canManageStock && <NavItem to="/stock-history" icon="📦" label="Stock Log" />}
        {canManageStock && <NavItem to="/restock" icon="🔴" label="Restock List" />}
        {isAdmin && <NavItem to="/cash-summary" icon="💰" label="Cash Summary" />}
        {isAdmin && <NavItem to="/profit-report" icon="📈" label="Profit Report" />}
        {isAdmin && <NavItem to="/returns" icon="↩️" label="Sales Returns" />}
        {!isManager && <NavItem to="/customers" icon="👤" label="Customers" />}
        {isAdmin && <NavItem to="/audit-log" icon="🔍" label="Audit Log" />}
        {isAdmin && <NavItem to="/users" icon="👥" label="User Management" />}
        <NavItem to="/settings" icon="⚙️" label="Settings" />
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <UserAvatar name={user?.name} avatarUrl={user?.avatar_url} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <span className={`${roleBadge[user?.role]} mt-0.5`}>{roleLabel[user?.role]}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full text-left text-sm text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-60 bg-white border-r border-gray-200 flex-shrink-0">
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-60 bg-white border-r border-gray-200 z-50">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Iffy Collections" className="w-8 h-8 object-contain" />
            <h1 className="text-sm font-bold text-brand-600">Iffy Collections</h1>
          </div>
          <div className="w-6" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
