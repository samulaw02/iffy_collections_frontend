import React, { useState, useCallback } from 'react';
import api from '../utils/api';
import { fmtDateTime } from '../utils/dateUtils';
import { exportCsv } from '../utils/exportCsv';
import toast from 'react-hot-toast';

const fmt = (n) => `₦${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

export default function ReturnsPage() {
  const [tab, setTab] = useState('new'); // 'new' | 'history'
  const [receiptSearch, setReceiptSearch] = useState('');
  const [sale, setSale] = useState(null);
  const [saleItems, setSaleItems] = useState([]);
  const [returnQtys, setReturnQtys] = useState({});
  const [reason, setReason] = useState('');
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // History state
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const searchSale = async () => {
    if (!receiptSearch.trim()) return;
    setSearching(true);
    setSale(null);
    setSaleItems([]);
    setReturnQtys({});
    try {
      const res = await api.get(`/sales/${receiptSearch.trim()}`);
      setSale(res.data.sale);
      setSaleItems(res.data.items);
    } catch {
      toast.error('Receipt not found');
    } finally {
      setSearching(false);
    }
  };

  const refundTotal = saleItems.reduce((sum, item) => {
    const qty = parseInt(returnQtys[item.product_id] || 0);
    return sum + qty * parseFloat(item.unit_price);
  }, 0);

  const handleSubmit = async () => {
    const items = saleItems
      .map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: parseInt(returnQtys[item.product_id] || 0),
        unit_price: item.unit_price,
      }))
      .filter(i => i.quantity > 0);

    if (!items.length) return toast.error('Select at least one item to return');
    setSubmitting(true);
    try {
      await api.post('/returns', { sale_id: sale.id, items, reason });
      toast.success(`Return processed — refund: ${fmt(refundTotal)}`);
      setSale(null);
      setSaleItems([]);
      setReturnQtys({});
      setReason('');
      setReceiptSearch('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Return failed');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const params = { page, limit: 20 };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get('/returns', { params });
      setHistory(res.data.returns);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error('Failed to load returns history');
    } finally {
      setHistoryLoading(false);
    }
  }, [page, startDate, endDate]);

  const handleTabChange = (t) => {
    setTab(t);
    if (t === 'history') fetchHistory();
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/returns', { params: { limit: 10000, page: 1, startDate, endDate } });
      const rows = res.data.returns.map(r => ({
        'Date': fmtDateTime(r.created_at),
        'Receipt #': r.receipt_number,
        'Product': r.product_name,
        'Qty': r.quantity,
        'Unit Price (₦)': r.unit_price,
        'Refund (₦)': r.refund_amount,
        'Reason': r.reason,
        'Processed By': r.processed_by_name,
      }));
      exportCsv('returns-history.csv', rows);
    } catch { toast.error('Export failed'); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sales Returns</h1>
        <p className="text-sm text-gray-500">Process refunds and view return history</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {[['new', 'New Return'], ['history', 'Return History']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === key ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'new' && (
        <div className="space-y-4">
          {/* Search receipt */}
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold text-gray-800">Find Sale by Receipt Number</h3>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="e.g. IC-20260418-1234"
                value={receiptSearch}
                onChange={e => setReceiptSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchSale()}
              />
              <button onClick={searchSale} disabled={searching} className="btn-primary px-5">
                {searching ? '…' : 'Search'}
              </button>
            </div>
          </div>

          {sale && (
            <div className="space-y-4">
              {/* Sale info */}
              <div className="card p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{sale.receipt_number}</p>
                    <p className="text-sm text-gray-500">{fmtDateTime(sale.created_at)} · {sale.customer_name || 'Walk-in'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Sale Total</p>
                    <p className="font-bold text-lg">{fmt(sale.total)}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800">Select Items to Return</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {saleItems.map(item => (
                    <div key={item.product_id} className="flex items-center gap-4 px-4 py-3">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.product_name}</p>
                        <p className="text-xs text-gray-400">Qty sold: {item.quantity} · {fmt(item.unit_price)} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-500">Return:</label>
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={returnQtys[item.product_id] || ''}
                          onChange={e => setReturnQtys(r => ({ ...r, [item.product_id]: e.target.value }))}
                          className="input w-20 text-center py-1.5 text-sm"
                          placeholder="0"
                        />
                      </div>
                      <div className="text-right min-w-[90px]">
                        <p className="text-sm font-semibold text-green-700">
                          {parseInt(returnQtys[item.product_id] || 0) > 0
                            ? fmt(parseInt(returnQtys[item.product_id]) * parseFloat(item.unit_price))
                            : '—'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reason + Submit */}
              <div className="card p-4 space-y-3">
                <div>
                  <label className="label">Reason for Return</label>
                  <input
                    className="input"
                    placeholder="e.g. Wrong size, defective item…"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                  />
                </div>
                {refundTotal > 0 && (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                    <span className="font-medium text-green-800">Total Refund</span>
                    <span className="font-bold text-green-700 text-lg">{fmt(refundTotal)}</span>
                  </div>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || refundTotal === 0}
                  className="btn-primary w-full"
                >
                  {submitting ? 'Processing…' : 'Process Return'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-4">
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
              <button onClick={() => { setStartDate(''); setEndDate(''); setPage(1); }} className="btn-secondary mt-5">Clear</button>
            )}
            <button onClick={fetchHistory} className="btn-secondary mt-5">🔄 Refresh</button>
            <button onClick={handleExport} className="btn-secondary mt-5">⬇️ Export</button>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Receipt #</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Product</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600">Qty</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">Refund</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Reason</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historyLoading ? (
                    <tr><td colSpan={7} className="py-10 text-center text-gray-400">Loading…</td></tr>
                  ) : history.length === 0 ? (
                    <tr><td colSpan={7} className="py-10 text-center text-gray-400">No returns found</td></tr>
                  ) : history.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-xs text-gray-400">{fmtDateTime(r.created_at)}</td>
                      <td className="py-3 px-4 font-mono text-xs text-brand-600">{r.receipt_number}</td>
                      <td className="py-3 px-4 font-medium">{r.product_name}</td>
                      <td className="py-3 px-4 text-center">{r.quantity}</td>
                      <td className="py-3 px-4 text-right font-semibold text-red-600">{fmt(r.refund_amount)}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{r.reason || '—'}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{r.processed_by_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => { setPage(p => Math.max(1, p - 1)); fetchHistory(); }} disabled={page === 1} className="btn-secondary px-3 py-1 text-sm">← Prev</button>
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <button onClick={() => { setPage(p => Math.min(totalPages, p + 1)); fetchHistory(); }} disabled={page === totalPages} className="btn-secondary px-3 py-1 text-sm">Next →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
