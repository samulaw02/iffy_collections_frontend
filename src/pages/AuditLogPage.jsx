import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { fmtDateTime } from '../utils/dateUtils';
import toast from 'react-hot-toast';

const actionColors = {
  SALE_CREATED: 'bg-green-100 text-green-700',
  RETURN_PROCESSED: 'bg-red-100 text-red-700',
  STOCK_ADJUSTED: 'bg-blue-100 text-blue-700',
  PRODUCT_CREATED: 'bg-purple-100 text-purple-700',
  PRODUCT_UPDATED: 'bg-yellow-100 text-yellow-800',
  PRODUCT_DELETED: 'bg-red-100 text-red-700',
  USER_LOGIN: 'bg-gray-100 text-gray-600',
  USER_CREATED: 'bg-teal-100 text-teal-700',
  USER_UPDATED: 'bg-yellow-100 text-yellow-800',
  USER_DEACTIVATED: 'bg-red-100 text-red-700',
  USER_PASSWORD_RESET: 'bg-orange-100 text-orange-700',
  PASSWORD_CHANGED: 'bg-orange-100 text-orange-700',
  CATEGORY_CREATED: 'bg-indigo-100 text-indigo-700',
  CATEGORY_UPDATED: 'bg-indigo-100 text-indigo-700',
};

const actionLabels = {
  SALE_CREATED: '🛒 Sale Created',
  RETURN_PROCESSED: '↩️ Return Processed',
  STOCK_ADJUSTED: '📦 Stock Adjusted',
  PRODUCT_CREATED: '➕ Product Added',
  PRODUCT_UPDATED: '✏️ Product Updated',
  PRODUCT_DELETED: '🗑️ Product Deleted',
  USER_LOGIN: '🔐 User Login',
  USER_CREATED: '👤 User Created',
  USER_UPDATED: '✏️ User Updated',
  USER_DEACTIVATED: '🚫 User Deactivated',
  USER_PASSWORD_RESET: '🔑 Password Reset',
  PASSWORD_CHANGED: '🔑 Password Changed',
  CATEGORY_CREATED: '🗂️ Category Created',
  CATEGORY_UPDATED: '✏️ Category Updated',
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 30 };
      if (actionFilter) params.action = actionFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get('/audit', { params });
      setLogs(res.data.logs);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error('Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, startDate, endDate]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500">All system activity — sales, returns, stock adjustments, and more</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="label">Action</label>
          <select className="input max-w-[200px]" value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}>
            <option value="">All actions</option>
            <option value="SALE_CREATED">Sales (POS)</option>
            <option value="RETURN">Returns</option>
            <option value="STOCK_ADJUSTED">Stock Adjustments</option>
            <option value="PRODUCT_CREATED">Product Added</option>
            <option value="PRODUCT_UPDATED">Product Updated</option>
            <option value="PRODUCT_DELETED">Product Deleted</option>
            <option value="CATEGORY">Categories</option>
            <option value="USER_LOGIN">Logins</option>
            <option value="USER_CREATED">User Created</option>
            <option value="USER_UPDATED">User Updated</option>
            <option value="USER_DEACTIVATED">User Deactivated</option>
            <option value="PASSWORD">Password Changes</option>
          </select>
        </div>
        <div>
          <label className="label">From</label>
          <input type="date" className="input" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" className="input" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} />
        </div>
        {(actionFilter || startDate || endDate) && (
          <button onClick={() => { setActionFilter(''); setStartDate(''); setEndDate(''); setPage(1); }} className="btn-secondary mt-5">Clear</button>
        )}
        <button onClick={fetchLogs} className="btn-secondary mt-5">🔄 Refresh</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Time</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">User</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Action</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Entity</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="py-10 text-center text-gray-400">Loading…</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center text-gray-400">No log entries found</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-xs text-gray-400 whitespace-nowrap">{fmtDateTime(log.created_at)}</td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-800">{log.user_name || 'System'}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${actionColors[log.action] || 'bg-gray-100 text-gray-600'}`}>
                      {actionLabels[log.action] || log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500">
                    {log.entity_type && <span>{log.entity_type}</span>}
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500 max-w-xs truncate">
                    {log.details ? (
                      <span title={JSON.stringify(log.details, null, 2)}>
                        {typeof log.details === 'object'
                          ? Object.entries(log.details).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(' · ')
                          : String(log.details)}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1 text-sm">← Prev</button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary px-3 py-1 text-sm">Next →</button>
        </div>
      )}
    </div>
  );
}
