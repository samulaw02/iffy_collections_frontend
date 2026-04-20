import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { exportCsv } from '../utils/exportCsv';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const stockBadge = (s) => {
  if (s === 'out_of_stock') return <span className="badge-out_of_stock">Out of Stock</span>;
  return <span className="badge-low_stock">Low Stock</span>;
};

export default function RestockPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restockQtys, setRestockQtys] = useState({});
  const [restocking, setRestocking] = useState({});
  const { canManageStock } = useAuth();

  const fetchLowStock = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/products', { params: { limit: 200 } });
      const low = res.data.products.filter(p =>
        p.stock_status === 'low_stock' || p.stock_status === 'out_of_stock'
      );
      setProducts(low);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLowStock(); }, [fetchLowStock]);

  const handleRestock = async (product) => {
    const qty = parseInt(restockQtys[product.id] || '');
    if (!qty || qty <= 0) return toast.error('Enter a valid quantity');
    setRestocking(r => ({ ...r, [product.id]: true }));
    try {
      await api.post('/stock/adjust', {
        product_id: product.id,
        new_quantity: product.quantity + qty,
        reason: 'Restock',
        type: 'restock',
      });
      toast.success(`Restocked ${product.name} +${qty}`);
      setRestockQtys(r => ({ ...r, [product.id]: '' }));
      fetchLowStock();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Restock failed');
    } finally {
      setRestocking(r => ({ ...r, [product.id]: false }));
    }
  };

  const handleExport = () => {
    const rows = products.map(p => ({
      'Product': p.name,
      'SKU': p.sku || '',
      'Category': p.category_name || '',
      'Current Qty': p.quantity,
      'Reorder At': p.low_stock_threshold,
      'Status': p.stock_status,
    }));
    exportCsv('restock-list.csv', rows);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Restock List</h1>
          <p className="text-sm text-gray-500">{products.length} item{products.length !== 1 ? 's' : ''} need restocking</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2">⬇️ Export CSV</button>
          <button onClick={fetchLowStock} className="btn-secondary flex items-center gap-2">🔄 Refresh</button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {products.filter(p => p.stock_status === 'out_of_stock').length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Low Stock</p>
          <p className="text-2xl font-bold text-orange-500 mt-1">
            {products.filter(p => p.stock_status === 'low_stock').length}
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Product</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Category</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600">Current Qty</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600">Reorder At</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Status</th>
                {canManageStock && (
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">Restock</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={canManageStock ? 6 : 5} className="py-10 text-center text-gray-400">Loading…</td></tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={canManageStock ? 6 : 5} className="py-16 text-center">
                    <p className="text-4xl mb-2">✅</p>
                    <p className="text-gray-500 font-medium">All products are well stocked!</p>
                  </td>
                </tr>
              ) : products.map(p => (
                <tr key={p.id} className={`hover:bg-gray-50 ${p.stock_status === 'out_of_stock' ? 'bg-red-50/40' : ''}`}>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{p.name}</div>
                    {p.sku && <div className="text-xs font-mono text-gray-400">{p.sku}</div>}
                    {p.size && <div className="text-xs text-gray-400">{p.size}{p.color ? ` · ${p.color}` : ''}</div>}
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-xs">{p.category_name || '—'}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-bold text-lg ${p.stock_status === 'out_of_stock' ? 'text-red-600' : 'text-orange-500'}`}>
                      {p.quantity}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-500">{p.low_stock_threshold}</td>
                  <td className="py-3 px-4">{stockBadge(p.stock_status)}</td>
                  {canManageStock && (
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={restockQtys[p.id] || ''}
                          onChange={e => setRestockQtys(r => ({ ...r, [p.id]: e.target.value }))}
                          className="input w-20 text-center py-1.5 text-sm"
                          onKeyDown={e => e.key === 'Enter' && handleRestock(p)}
                        />
                        <button
                          onClick={() => handleRestock(p)}
                          disabled={restocking[p.id]}
                          className="btn-primary py-1.5 px-3 text-sm whitespace-nowrap"
                        >
                          {restocking[p.id] ? '…' : '+ Add Stock'}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
