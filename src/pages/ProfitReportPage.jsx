import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { exportCsv } from '../utils/exportCsv';
import toast from 'react-hot-toast';

const fmt = (n) => `₦${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
const fmtPct = (profit, revenue) => {
  const r = parseFloat(revenue);
  const p = parseFloat(profit);
  if (!r) return '—';
  return ((p / r) * 100).toFixed(1) + '%';
};

export default function ProfitReportPage() {
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
      const res = await api.get('/reports/profit', { params: { startDate, endDate } });
      setData(res.data);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to load profit report';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = () => {
    if (!data?.items?.length) return;
    const rows = data.items.map(i => ({
      'Product': i.product_name,
      'Units Sold': i.units_sold,
      'Revenue (₦)': parseFloat(i.revenue).toFixed(2),
      'Cost (₦)': parseFloat(i.cost).toFixed(2),
      'Profit (₦)': parseFloat(i.profit).toFixed(2),
      'Margin': fmtPct(i.profit, i.revenue),
    }));
    exportCsv(`profit-report-${startDate}-to-${endDate}.csv`, rows);
  };

  const totalRevenue = parseFloat(data?.summary?.total_revenue || 0);
  const totalCost = parseFloat(data?.summary?.total_cost || 0);
  const totalProfit = parseFloat(data?.summary?.total_profit || 0);
  const margin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profit Report</h1>
          <p className="text-sm text-gray-500">Revenue vs cost per product — requires cost prices to be set</p>
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
          <p className="text-gray-700 font-medium mb-1">Could not load profit report</p>
          <p className="text-sm text-gray-400 mb-4">{error}</p>
          <button onClick={fetchData} className="btn-secondary">Try again</button>
        </div>
      ) : data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(totalRevenue)}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-gray-500">Total Cost</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(totalCost)}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-gray-500">Gross Profit</p>
              <p className={`text-2xl font-bold mt-1 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {fmt(totalProfit)}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-gray-500">Gross Margin</p>
              <p className={`text-2xl font-bold mt-1 ${parseFloat(margin) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {margin}%
              </p>
            </div>
          </div>

          {totalCost === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              ⚠️ No cost prices are set on your products. Add cost prices in Inventory → Edit Product to see accurate profit calculations.
            </div>
          )}

          {/* Product breakdown */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Profit by Product</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Product</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600">Units</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">Revenue</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">Cost</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">Profit</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.items.length === 0 ? (
                    <tr><td colSpan={6} className="py-10 text-center text-gray-400">No sales in this period</td></tr>
                  ) : data.items.map((item, i) => {
                    const profit = parseFloat(item.profit);
                    return (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{item.product_name}</td>
                        <td className="py-3 px-4 text-center text-gray-600">{item.units_sold}</td>
                        <td className="py-3 px-4 text-right">{fmt(item.revenue)}</td>
                        <td className="py-3 px-4 text-right text-gray-500">{fmt(item.cost)}</td>
                        <td className={`py-3 px-4 text-right font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {fmt(item.profit)}
                        </td>
                        <td className={`py-3 px-4 text-right text-sm ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {fmtPct(item.profit, item.revenue)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
