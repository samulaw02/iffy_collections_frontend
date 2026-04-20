import React, { useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function StockModal({ product, onClose, onSaved }) {
  const [newQty, setNewQty] = useState(product.quantity);
  const [reason, setReason] = useState('');
  const [type, setType] = useState('restock');
  const [saving, setSaving] = useState(false);

  const diff = parseInt(newQty) - product.quantity;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newQty === '' || parseInt(newQty) < 0) return toast.error('Enter a valid quantity');
    setSaving(true);
    try {
      await api.post('/stock/adjust', {
        product_id: product.id,
        new_quantity: parseInt(newQty),
        reason: reason || `${type} adjustment`,
        type,
      });
      toast.success('Stock updated successfully');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update stock');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Adjust Stock</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="font-semibold text-gray-800">{product.name}</p>
            <p className="text-sm text-gray-500 mt-0.5">SKU: {product.sku || 'N/A'} · Current qty: <span className="font-bold text-gray-800">{product.quantity}</span></p>
          </div>

          <div>
            <label className="label">Adjustment Type</label>
            <select className="input" value={type} onChange={e => setType(e.target.value)}>
              <option value="restock">Restock (New delivery)</option>
              <option value="manual">Manual correction</option>
              <option value="return">Customer return</option>
              <option value="damaged">Damaged/Written off</option>
            </select>
          </div>

          <div>
            <label className="label">New Quantity</label>
            <input className="input" type="number" min="0" value={newQty} onChange={e => setNewQty(e.target.value)} required />
          </div>

          {diff !== 0 && (
            <div className={`text-sm font-medium px-3 py-2 rounded-lg ${diff > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {diff > 0 ? `+${diff} units will be added` : `${diff} units will be removed`}
            </div>
          )}

          <div>
            <label className="label">Reason / Notes</label>
            <input className="input" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. New delivery from supplier" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Update Stock'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
