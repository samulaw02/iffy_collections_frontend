import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { exportCsv } from '../utils/exportCsv';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ProductModal from '../components/inventory/ProductModal';
import StockModal from '../components/inventory/StockModal';
import CategoryModal from '../components/inventory/CategoryModal';
import BulkUploadModal from '../components/inventory/BulkUploadModal';

const fmt = (n) => `₦${parseFloat(n || 0).toLocaleString('en-NG')}`;
const stockBadge = (s) => {
  if (s === 'out_of_stock') return <span className="badge-out_of_stock">Out of Stock</span>;
  if (s === 'low_stock') return <span className="badge-low_stock">Low Stock</span>;
  return <span className="badge-in_stock">In Stock</span>;
};
const catColor = { 'Kiddies Wear': 'bg-orange-100 text-orange-700', 'Adult Wear': 'bg-blue-100 text-blue-700', 'Bags': 'bg-purple-100 text-purple-700', 'Shoes': 'bg-green-100 text-green-700' };

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [searchParams] = useSearchParams();
  const [filterStock, setFilterStock] = useState(() => searchParams.get('stock') || '');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [stockProduct, setStockProduct] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const { isAdmin, isManager, canManageStock } = useAuth();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterCat) params.category = filterCat;
      if (filterStock === 'low') params.lowStock = true;
      const res = await api.get('/products', { params });
      let prods = res.data.products;
      if (filterStock === 'out') prods = prods.filter(p => p.stock_status === 'out_of_stock');
      if (filterStock === 'low') prods = prods.filter(p => p.stock_status === 'low_stock');
      if (filterStock === 'in') prods = prods.filter(p => p.stock_status === 'in_stock');
      setProducts(prods);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [search, filterCat, filterStock]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  const fetchCategories = useCallback(() => {
    api.get('/categories').then(r => setCategories(r.data)).catch(console.error);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      setConfirmDeleteId(null);
      fetchProducts();
    } catch { toast.error('Failed to delete'); }
  };

  const openAdd = () => { setEditProduct(null); setShowProductModal(true); };

  const handleExport = () => {
    const rows = products.map(p => ({
      'Name': p.name,
      'SKU': p.sku || '',
      'Category': p.category_name || '',
      'Size': p.size || '',
      'Color': p.color || '',
      'Gender': p.gender || '',
      'Retail Price (₦)': p.price,
      'Wholesale Price (₦)': p.wholesale_price || 0,
      'Quantity': p.quantity,
      'Status': p.stock_status,
    }));
    exportCsv('inventory.csv', rows);
  };
  const openEdit = (p) => { setEditProduct(p); setShowProductModal(true); };
  const openStock = (p) => { setStockProduct(p); setShowStockModal(true); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500">{products.length} products</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={handleExport} className="btn-secondary flex items-center gap-2">⬇️ Export CSV</button>
            <button onClick={() => setShowCategoryModal(true)} className="btn-secondary flex items-center gap-2">🗂️ Categories</button>
            <button onClick={() => setShowBulkModal(true)} className="btn-secondary flex items-center gap-2">📦 Bulk Import</button>
            <button onClick={openAdd} className="btn-primary flex items-center gap-2"><span>+</span> Add Product</button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input max-w-[180px]" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <select className="input max-w-[160px]" value={filterStock} onChange={e => setFilterStock(e.target.value)}>
          <option value="">All stock levels</option>
          <option value="in">In stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 w-12"></th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Product</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">SKU</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Category</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Size</th>
                {!isManager && <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">Retail</th>}
                {!isManager && <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">Wholesale</th>}
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600">Qty</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Status</th>
                {isAdmin && <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={isManager ? 7 : isAdmin ? 10 : 9} className="py-10 text-center text-gray-400">Loading…</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={isManager ? 7 : isAdmin ? 10 : 9} className="py-10 text-center text-gray-400">No products found</td></tr>
              ) : products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-base">👗</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{p.name}</div>
                    {p.color && <div className="text-xs text-gray-400">{p.color} · {p.gender}</div>}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">{p.sku || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColor[p.category_name] || 'bg-gray-100 text-gray-600'}`}>
                      {p.category_name || '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{p.size || '—'}</td>
                  {!isManager && <td className="py-3 px-4 text-right font-semibold">{fmt(p.price)}</td>}
                  {!isManager && <td className="py-3 px-4 text-right text-gray-500">{p.wholesale_price > 0 ? fmt(p.wholesale_price) : <span className="text-gray-300">—</span>}</td>}
                  <td className="py-3 px-4 text-center font-bold text-gray-800">{p.quantity}</td>
                  <td className="py-3 px-4">{stockBadge(p.stock_status)}</td>
                  {isAdmin && (
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        {canManageStock && (
                          <button onClick={() => openStock(p)} className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 text-gray-600">Stock</button>
                        )}
                        {isAdmin && (
                          <>
                            <button onClick={() => openEdit(p)} className="text-xs px-2 py-1 rounded border border-blue-200 hover:bg-blue-50 text-blue-600">Edit</button>
                            {confirmDeleteId === p.id ? (
                              <span className="flex items-center gap-1">
                                <button onClick={() => handleDelete(p.id)} className="text-xs px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-white">Confirm</button>
                                <button onClick={() => setConfirmDeleteId(null)} className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 text-gray-600">Cancel</button>
                              </span>
                            ) : (
                              <button onClick={() => setConfirmDeleteId(p.id)} className="text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50 text-red-600">Del</button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showBulkModal && (
        <BulkUploadModal
          onClose={() => setShowBulkModal(false)}
          onImported={() => { fetchProducts(); fetchCategories(); }}
        />
      )}
      {showCategoryModal && (
        <CategoryModal
          categories={categories}
          onClose={() => setShowCategoryModal(false)}
          onSaved={fetchCategories}
        />
      )}
      {showProductModal && (
        <ProductModal
          product={editProduct}
          categories={categories}
          onClose={() => setShowProductModal(false)}
          onSaved={() => { setShowProductModal(false); fetchProducts(); }}
        />
      )}
      {showStockModal && stockProduct && (
        <StockModal
          product={stockProduct}
          onClose={() => setShowStockModal(false)}
          onSaved={() => { setShowStockModal(false); fetchProducts(); }}
        />
      )}
    </div>
  );
}
