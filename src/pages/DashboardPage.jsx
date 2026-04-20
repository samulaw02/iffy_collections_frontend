import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import { fmtDateTime } from '../utils/dateUtils';

const StatCard = ({ label, value, sub, color = 'text-gray-900', icon, onClick }) => (
  <div
    onClick={onClick}
    className={`card p-5 ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-150' : ''}`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      <span className="text-2xl">{icon}</span>
    </div>
    {onClick && (
      <p className="text-xs text-brand-500 mt-3 font-medium">View details →</p>
    )}
  </div>
);

const fmt = (n) => `₦${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;

const COLORS = ['#d85a30', '#3b82f6', '#8b5cf6', '#10b981'];

function ManagerDashboard({ data, user }) {
  const navigate = useNavigate();
  const catQtyData = data?.categorySummary?.map(c => ({
    name: c.category.replace(' Wear', ''),
    qty: parseInt(c.total_qty || 0),
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name}! Here's your stock overview.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon="👗" label="Total Products" value={data?.summary?.totalProducts ?? 0}
          onClick={() => navigate('/inventory')} />
        <StatCard icon="⚠️" label="Low Stock" value={data?.summary?.lowStock ?? 0} color="text-amber-600"
          sub="Items need restocking" onClick={() => navigate('/inventory?stock=low')} />
        <StatCard icon="🚫" label="Out of Stock" value={data?.summary?.outOfStock ?? 0} color="text-red-600"
          sub="Immediate attention" onClick={() => navigate('/inventory?stock=out')} />
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Stock Quantity by Category</h2>
        {catQtyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={catQtyData} barSize={36}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v} units`, 'Qty']} />
              <Bar dataKey="qty" radius={[4, 4, 0, 0]}>
                {catQtyData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-gray-400 text-sm">No data</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, isManager, isSalesRep } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  if (isManager) return <ManagerDashboard data={data} user={user} />;

  const catChartData = data?.categorySummary?.map(c => ({
    name: c.category.replace(' Wear', ''),
    value: parseFloat(c.stock_value || 0),
    qty: parseInt(c.total_qty || 0),
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name}! Here's your store overview.</p>
      </div>

      {/* Inventory summary */}
      <div className={`grid grid-cols-2 gap-4 ${isSalesRep ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
        <StatCard icon="👗" label="Total Products" value={data?.summary?.totalProducts ?? 0}
          onClick={() => navigate('/inventory')} />
        {!isSalesRep && (
          <StatCard icon="💰" label="Stock Value" value={fmt(data?.summary?.stockValue)} color="text-brand-600"
            onClick={() => navigate('/inventory')} />
        )}
        <StatCard icon="⚠️" label="Low Stock" value={data?.summary?.lowStock ?? 0} color="text-amber-600"
          sub="Items need restocking" onClick={() => navigate('/inventory?stock=low')} />
        <StatCard icon="🚫" label="Out of Stock" value={data?.summary?.outOfStock ?? 0} color="text-red-600"
          sub="Immediate attention" onClick={() => navigate('/inventory?stock=out')} />
      </div>

      {/* Sales stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon="📅" label="Today's Revenue" value={fmt(data?.sales?.today?.revenue)}
          sub={`${data?.sales?.today?.count} transactions`} color="text-green-700"
          onClick={() => navigate('/sales-history')} />
        <StatCard icon="📆" label="This Week" value={fmt(data?.sales?.week?.revenue)}
          sub={`${data?.sales?.week?.count} transactions`}
          onClick={() => navigate('/sales-history')} />
        <StatCard icon="🗓️" label="This Month" value={fmt(data?.sales?.month?.revenue)}
          sub={`${data?.sales?.month?.count} transactions`}
          onClick={() => navigate('/sales-history')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category chart — hidden from sales rep */}
        {!isSalesRep && <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Stock Value by Category</h2>
          {catChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={catChartData} barSize={36}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₦${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {catChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm">No data</p>}
        </div>}

        {/* Top products */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Top Selling Products (30 days)</h2>
          {data?.topProducts?.length > 0 ? (
            <div className="space-y-3">
              {data.topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{p.product_name}</p>
                      <p className="text-xs text-gray-500">{p.units_sold} units sold</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-brand-600">{fmt(p.revenue)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm">No sales yet</p>}
        </div>
      </div>

      {/* Recent sales */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Recent Sales</h2>
          <button onClick={() => navigate('/sales-history')} className="text-xs text-brand-500 hover:text-brand-700 font-medium">
            View all →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">Receipt</th>
                <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">Customer</th>
                <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">Cashier</th>
                <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">Method</th>
                <th className="text-right py-2 px-2 text-xs text-gray-500 font-medium">Total</th>
                <th className="text-right py-2 px-2 text-xs text-gray-500 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentSales?.length > 0 ? data.recentSales.map(s => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-2 font-mono text-xs text-brand-600">{s.receipt_number}</td>
                  <td className="py-2 px-2">{s.customer_name || 'Walk-in'}</td>
                  <td className="py-2 px-2 text-gray-500">{s.cashier}</td>
                  <td className="py-2 px-2 capitalize">{s.payment_method}</td>
                  <td className="py-2 px-2 text-right font-semibold">{fmt(s.total)}</td>
                  <td className="py-2 px-2 text-right text-gray-400 text-xs">{fmtDateTime(s.created_at)}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="py-6 text-center text-gray-400">No sales yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
