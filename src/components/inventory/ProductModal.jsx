import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function ProductModal({ product, categories, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '', sku: '', category_id: '', description: '', price: '',
    wholesale_price: '', cost_price: '', quantity: '', low_stock_threshold: '5',
    size: '', color: '', gender: '', image_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [pendingImageFile, setPendingImageFile] = useState(null);
  const fileInputRef = useRef();

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        sku: product.sku || '',
        category_id: product.category_id || '',
        description: product.description || '',
        price: product.price || '',
        wholesale_price: product.wholesale_price || '',
        cost_price: product.cost_price || '',
        quantity: product.quantity ?? '',
        low_stock_threshold: product.low_stock_threshold || '5',
        size: product.size || '',
        color: product.color || '',
        gender: product.gender || '',
        image_url: product.image_url || '',
      });
      setImagePreview(product.image_url || null);
    }
  }, [product]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    if (product) {
      const fd = new FormData();
      fd.append('image', file);
      try {
        const res = await api.post(`/products/${product.id}/image`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setForm(f => ({ ...f, image_url: res.data.image_url }));
        toast.success('Image uploaded');
      } catch {
        toast.error('Image upload failed');
      }
    } else {
      setPendingImageFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return toast.error('Name and retail price are required');
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        wholesale_price: parseFloat(form.wholesale_price) || 0,
        cost_price: parseFloat(form.cost_price) || 0,
        quantity: parseInt(form.quantity) || 0,
        low_stock_threshold: parseInt(form.low_stock_threshold) || 5,
      };
      if (product) {
        await api.put(`/products/${product.id}`, payload);
        toast.success('Product updated');
      } else {
        const res = await api.post('/products', payload);
        const newId = res.data.id;
        if (pendingImageFile && newId) {
          const fd = new FormData();
          fd.append('image', pendingImageFile);
          try {
            await api.post(`/products/${newId}/image`, fd, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          } catch {
            toast.error('Product saved but image upload failed');
          }
        }
        toast.success('Product added');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const displayImage = imagePreview;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Image upload */}
          <div className="flex items-center gap-4">
            <div
              className="relative w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer overflow-hidden bg-gray-50 hover:border-brand-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {displayImage ? (
                <img src={displayImage} alt="Product" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-gray-400 text-xs">
                  <div className="text-2xl mb-1">📷</div>
                  <div>Add photo</div>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                {displayImage && <span className="opacity-0 hover:opacity-100 text-white text-xs font-medium transition-opacity">Change</span>}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              <p className="font-medium text-gray-700">Product Image</p>
              <p>Click to upload a photo</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 3MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Product Name *</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Ankara Flared Dress" required />
            </div>
            <div>
              <label className="label">SKU</label>
              <input className="input" value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="e.g. ADW-001" />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category_id} onChange={e => set('category_id', e.target.value)}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Retail Price (₦) *</label>
              <input className="input" type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} placeholder="5000" required />
            </div>
            <div>
              <label className="label">Wholesale Price (₦)</label>
              <input className="input" type="number" min="0" step="0.01" value={form.wholesale_price} onChange={e => set('wholesale_price', e.target.value)} placeholder="3500" />
            </div>
            <div>
              <label className="label">Cost Price (₦)</label>
              <input className="input" type="number" min="0" step="0.01" value={form.cost_price} onChange={e => set('cost_price', e.target.value)} placeholder="2500" />
            </div>
            {!product && (
              <div>
                <label className="label">Initial Quantity</label>
                <input className="input" type="number" min="0" value={form.quantity} onChange={e => set('quantity', e.target.value)} placeholder="0" />
              </div>
            )}
            <div>
              <label className="label">Low Stock Alert At</label>
              <input className="input" type="number" min="1" value={form.low_stock_threshold} onChange={e => set('low_stock_threshold', e.target.value)} placeholder="5" />
            </div>
            <div>
              <label className="label">Size</label>
              <input className="input" value={form.size} onChange={e => set('size', e.target.value)} placeholder="e.g. S/M/L or 3-4yrs or 38-42" />
            </div>
            <div>
              <label className="label">Color</label>
              <input className="input" value={form.color} onChange={e => set('color', e.target.value)} placeholder="e.g. Black, Red, Multi" />
            </div>
            <div>
              <label className="label">Gender</label>
              <select className="input" value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Unisex">Unisex</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea className="input" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional product description" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : product ? 'Update Product' : 'Add Product'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
