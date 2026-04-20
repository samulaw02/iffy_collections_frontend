import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { fmtDate } from '../utils/dateUtils';
import { exportCsv } from '../utils/exportCsv';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const fmt = (n) => `₦${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

function CustomerModal({ customer, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (customer) setForm({ name: customer.name || '', phone: customer.phone || '', email: customer.email || '', address: customer.address || '', notes: customer.notes || '' });
  }, [customer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Name is required');
    setSaving(true);
    try {
      if (customer) {
        await api.put(`/customers/${customer.id}`, form);
        toast.success('Customer updated');
      } else {
        await api.post('/customers', form);
        toast.success('Customer added');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">{customer ? 'Edit Customer' : 'Add Customer'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Amaka Johnson" required />
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="e.g. 08012345678" />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="optional" />
          </div>
          <div>
            <label className="label">Address</label>
            <input className="input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="optional" />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes about this customer" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : customer ? 'Update' : 'Add Customer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const { isAdmin } = useAuth();

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      const res = await api.get('/customers', { params });
      setCustomers(res.data.customers);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/customers/${id}`);
      toast.success('Customer deleted');
      setConfirmDeleteId(null);
      fetchCustomers();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleExport = () => {
    const rows = customers.map(c => ({
      'Name': c.name,
      'Phone': c.phone || '',
      'Email': c.email || '',
      'Address': c.address || '',
      'Total Purchases': c.total_purchases || 0,
      'Total Spent (₦)': parseFloat(c.total_spent || 0).toFixed(2),
      'Added': fmtDate(c.created_at),
    }));
    exportCsv('customers.csv', rows);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500">{customers.length} customers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2">⬇️ Export CSV</button>
          {isAdmin && (
            <button onClick={() => { setEditCustomer(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
              <span>+</span> Add Customer
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search by name, phone, email…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Name</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Phone</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Email</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600">Purchases</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">Total Spent</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">Added</th>
                {isAdmin && <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={isAdmin ? 7 : 6} className="py-10 text-center text-gray-400">Loading…</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={isAdmin ? 7 : 6} className="py-10 text-center text-gray-400">No customers found</td></tr>
              ) : customers.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900">{c.name}</p>
                    {c.address && <p className="text-xs text-gray-400 truncate max-w-[200px]">{c.address}</p>}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{c.phone || '—'}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{c.email || '—'}</td>
                  <td className="py-3 px-4 text-center font-medium">{c.total_purchases || 0}</td>
                  <td className="py-3 px-4 text-right font-semibold text-brand-600">{parseFloat(c.total_spent || 0) > 0 ? fmt(c.total_spent) : '—'}</td>
                  <td className="py-3 px-4 text-right text-xs text-gray-400">{fmtDate(c.created_at)}</td>
                  {isAdmin && (
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditCustomer(c); setShowModal(true); }} className="text-xs px-2 py-1 rounded border border-blue-200 hover:bg-blue-50 text-blue-600">Edit</button>
                        {confirmDeleteId === c.id ? (
                          <span className="flex items-center gap-1">
                            <button onClick={() => handleDelete(c.id)} className="text-xs px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-white">Confirm</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-600">Cancel</button>
                          </span>
                        ) : (
                          <button onClick={() => setConfirmDeleteId(c.id)} className="text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50 text-red-600">Del</button>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1 text-sm">← Prev</button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary px-3 py-1 text-sm">Next →</button>
        </div>
      )}

      {showModal && (
        <CustomerModal
          customer={editCustomer}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchCustomers(); }}
        />
      )}
    </div>
  );
}
