import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { fmtDate } from '../utils/dateUtils';
import { exportCsv } from '../utils/exportCsv';
import toast from 'react-hot-toast';

const fmt = (n) => `₦${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
const pct = (a, b) => (b > 0 ? ((a / b) * 100).toFixed(1) + '%' : '—');

const methodColor = { cash: 'text-green-700 bg-green-100', transfer: 'text-blue-700 bg-blue-100', card: 'text-purple-700 bg-purple-100' };

export default function CashSummaryPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 29 * 86400000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/reports/cash-summary', { params: { startDate, endDate } });
      setData(res.data);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to load cash summary';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = () => {
    if (!data?.daily?.length) return;
    const rows = data.daily.map(d => ({
      'Date': fmtDate(d.date),
      'Transactions': d.transactions,
      'Revenue (₦)': parseFloat(d.revenue).toFixed(2),
      'Cash (₦)': parseFloat(d.cash).toFixed(2),
      'Transfer (₦)': parseFloat(d.transfer).toFixed(2),
      'Card (₦)': parseFloat(d.card).toFixed(2),
      'Discounts (₦)': parseFloat(d.discounts).toFixed(2),
    }));
    exportCsv(`cash-summary-${startDate}-to-${endDate}.csv`, rows);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cash Summary</h1>
          <p className="text-sm text-gray-500">Daily revenue breakdown by payment method</p>
        </div>
        <button onClick={handleExport} className="btn-secondary flex items-center gap-2">⬇️ Export CSV</button>
      </div>

      {/* Date filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="label">From</label>
          <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <button onClick={() => { setStartDate(today); setEndDate(today); }} className="btn-secondary mt-5">Today</button>
        <button onClick={() => { setStartDate(thirtyDaysAgo); setEndDate(today); }} className="btn-secondary mt-5">Last 30 days</button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400">Loading…</div>
      ) : error ? (
        <div className="card p-8 text-center">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="text-gray-700 font-medium mb-1">Could not load cash summary</p>
          <p className="text-sm text-gray-400 mb-4">{error}</p>
          <button onClick={fetchData} className="btn-secondary">Try again</button>
        </div>
      ) : data && (
        <>
          {/* Summary totals */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(data.totals.revenue)}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-gray-500">Transactions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{data.totals.transactions}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-gray-500">Avg per Sale</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data.totals.transactions > 0 ? fmt(data.totals.revenue / data.totals.transactions) : '—'}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-gray-500">Total Discounts</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{fmt(data.totals.discounts)}</p>
            </div>
          </div>

          {/* By payment method + By cashier */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-4">
              <h3 className="font-semibold text-gray-800 mb-3">By Payment Method</h3>
              {data.byMethod.length === 0 ? (
                <p className="text-sm text-gray-400">No sales in period</p>
              ) : (
                <div className="space-y-2">
                  {data.byMethod.map(m => (
                    <div key={m.payment_method} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${methodColor[m.payment_method] || 'bg-gray-100 text-gray-600'}`}>
                          {m.payment_method}
                        </span>
                        <span className="text-sm text-gray-500">{m.transactions} sales</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{fmt(m.revenue)}</p>
                        <p className="text-xs text-gray-400">{pct(parseFloat(m.revenue), data.totals.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="card p-4">
              <h3 className="font-semibold text-gray-800 mb-3">By Cashier</h3>
              {data.byCashier.length === 0 ? (
                <p className="text-sm text-gray-400">No sales in period</p>
              ) : (
                <div className="space-y-2">
                  {data.byCashier.map(c => (
                    <div key={c.cashier} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{c.cashier || 'Unknown'}</p>
                        <p className="text-xs text-gray-400">{c.transactions} transactions</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{fmt(c.revenue)}</p>
                        <p className="text-xs text-gray-400">{pct(parseFloat(c.revenue), data.totals.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Daily breakdown table */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Daily Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Date</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600">Sales</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">Revenue</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-green-700">Cash</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-blue-700">Transfer</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-purple-700">Card</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">Discounts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.daily.length === 0 ? (
                    <tr><td colSpan={7} className="py-10 text-center text-gray-400">No sales in this period</td></tr>
                  ) : data.daily.map(d => (
                    <tr key={d.date} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{fmtDate(d.date)}</td>
                      <td className="py-3 px-4 text-center text-gray-600">{d.transactions}</td>
                      <td className="py-3 px-4 text-right font-semibold">{fmt(d.revenue)}</td>
                      <td className="py-3 px-4 text-right text-green-700">{parseFloat(d.cash) > 0 ? fmt(d.cash) : <span className="text-gray-300">—</span>}</td>
                      <td className="py-3 px-4 text-right text-blue-700">{parseFloat(d.transfer) > 0 ? fmt(d.transfer) : <span className="text-gray-300">—</span>}</td>
                      <td className="py-3 px-4 text-right text-purple-700">{parseFloat(d.card) > 0 ? fmt(d.card) : <span className="text-gray-300">—</span>}</td>
                      <td className="py-3 px-4 text-right text-orange-600">{parseFloat(d.discounts) > 0 ? fmt(d.discounts) : <span className="text-gray-300">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
