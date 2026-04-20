import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { fmtDateTime } from '../utils/dateUtils';
import toast from 'react-hot-toast';

export default function StockHistoryPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/stock/history', { params: { limit: 100 } });
      setLogs(res.data);
    } catch { toast.error('Failed to load stock history'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const typeBadge = (t) => {
    const colors = {
      initial: 'bg-blue-100 text-blue-700',
      restock: 'bg-green-100 text-green-700',
      sale: 'bg-brand-100 text-brand-700',
      manual: 'bg-gray-100 text-gray-700',
      return: 'bg-purple-100 text-purple-700',
      damaged: 'bg-red-100 text-red-700',
    };
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${colors[t] || 'bg-gray-100 text-gray-600'}`}>{t}</span>;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stock Adjustment Log</h1>
        <p className="text-sm text-gray-500">Full audit trail of all stock changes</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Product</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Type</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600">Before</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600">Change</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600">After</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Reason</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">By</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="py-10 text-center text-gray-400">Loading…</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={8} className="py-10 text-center text-gray-400">No stock adjustments yet</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <p className="font-medium">{log.product_name}</p>
                    <p className="text-xs text-gray-400 font-mono">{log.sku}</p>
                  </td>
                  <td className="py-3 px-4">{typeBadge(log.type)}</td>
                  <td className="py-3 px-4 text-center text-gray-600">{log.previous_qty}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-bold ${log.adjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {log.adjustment > 0 ? '+' : ''}{log.adjustment}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-gray-900">{log.new_qty}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{log.reason}</td>
                  <td className="py-3 px-4 text-gray-500">{log.adjusted_by_name}</td>
                  <td className="py-3 px-4 text-right text-gray-400 text-xs">{fmtDateTime(log.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
