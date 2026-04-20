import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { fmtDateTime } from '../utils/dateUtils';
import { exportCsv } from '../utils/exportCsv';
import toast from 'react-hot-toast';
import ReceiptModal from '../components/sales/ReceiptModal';

const fmt = (n) => `₦${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

export default function SalesHistoryPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewSale, setViewSale] = useState(null);
  const [loadingReceipt, setLoadingReceipt] = useState(null);

  const handleExport = async () => {
    try {
      const params = { limit: 10000, page: 1 };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get('/sales', { params });
      const rows = res.data.sales.map(s => ({
        'Receipt #': s.receipt_number,
        'Customer': s.customer_name || 'Walk-in',
        'Cashier': s.processed_by_name,
        'Payment Method': s.payment_method,
        'Subtotal (₦)': s.subtotal,
        'Discount (₦)': s.discount,
        'Total (₦)': s.total,
        'Amount Paid (₦)': s.amount_paid,
        'Change (₦)': s.change_given,
        'Date': fmtDateTime(s.created_at),
      }));
      exportCsv(`sales-${startDate || 'all'}-to-${endDate || 'today'}.csv`, rows);
    } catch { toast.error('Export failed'); }
  };

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get('/sales', { params });
      setSales(res.data.sales);
      setTotalPages(res.data.totalPages);
    } catch { toast.error('Failed to load sales'); }
    finally { setLoading(false); }
  }, [page, startDate, endDate]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const viewReceipt = async (sale) => {
    setLoadingReceipt(sale.id);
    try {
      const res = await api.get(`/sales/${sale.id}`);
      setViewSale(res.data);
    } catch { toast.error('Failed to load receipt'); }
    finally { setLoadingReceipt(null); }
  };

  const methodBadge = (m) => {
    const colors = { cash: 'bg-green-100 text-green-700', transfer: 'bg-blue-100 text-blue-700', card: 'bg-purple-100 text-purple-700' };
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${colors[m] || 'bg-gray-100 text-gray-600'}`}>{m}</span>;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales History</h1>
          <p className="text-sm text-gray-500">All completed transactions</p>
        </div>
        <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
          ⬇️ Export CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="label">From</label>
          <input type="date" className="input" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" className="input" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} />
        </div>
        {(startDate || endDate) && (
          <button onClick={() => { setStartDate(''); setEndDate(''); setPage(1); }} className="btn-secondary mt-5">Clear filters</button>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Receipt #</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Customer</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Cashier</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600">Payment</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">Total</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">Date</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="py-10 text-center text-gray-400">Loading…</td></tr>
              ) : sales.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-gray-400">No sales found</td></tr>
              ) : sales.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs text-brand-600 font-semibold">{s.receipt_number}</td>
                  <td className="py-3 px-4">{s.customer_name || 'Walk-in'}</td>
                  <td className="py-3 px-4 text-gray-500">{s.processed_by_name}</td>
                  <td className="py-3 px-4 text-center">{methodBadge(s.payment_method)}</td>
                  <td className="py-3 px-4 text-right font-semibold">{fmt(s.total)}</td>
                  <td className="py-3 px-4 text-right text-gray-400 text-xs">{fmtDateTime(s.created_at)}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => viewReceipt(s)}
                      disabled={loadingReceipt === s.id}
                      className="text-xs px-2 py-1 rounded border border-brand-200 text-brand-600 hover:bg-brand-50"
                    >
                      {loadingReceipt === s.id ? '…' : 'View'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1 text-sm">← Prev</button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary px-3 py-1 text-sm">Next →</button>
        </div>
      )}

      {viewSale && <ReceiptModal sale={viewSale} onClose={() => setViewSale(null)} mode="view" />}
    </div>
  );
}
