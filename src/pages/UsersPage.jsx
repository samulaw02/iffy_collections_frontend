import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';
import { fmtDate } from '../utils/dateUtils';

const ROLES = [
  { value: 'admin', label: 'Admin / CEO', desc: 'Full access to everything' },
  { value: 'manager', label: 'Store Manager', desc: 'Add products, manage stock' },
  { value: 'sales_rep', label: 'Sales Rep / Cashier', desc: 'Process sales, generate receipts' },
];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'sales_rep' });
  const [saving, setSaving] = useState(false);
  const [resetModal, setResetModal] = useState(null);
  const [newPass, setNewPass] = useState('');
  const { user: currentUser } = useAuth();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openAdd = () => { setEditUser(null); setForm({ name: '', email: '', password: '', role: 'sales_rep' }); setShowModal(true); };
  const openEdit = (u) => { setEditUser(u); setForm({ name: u.name, email: u.email, password: '', role: u.role }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return toast.error('Name and email required');
    if (!editUser && !form.password) return toast.error('Password required for new users');
    setSaving(true);
    try {
      if (editUser) {
        const payload = { name: form.name, email: form.email, role: form.role };
        await api.put(`/users/${editUser.id}`, payload);
        toast.success('User updated');
      } else {
        await api.post('/users', form);
        toast.success('User created');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save user');
    } finally { setSaving(false); }
  };

  const handleToggleActive = async (u) => {
    if (u.id === currentUser.id) return toast.error("You can't deactivate yourself");
    try {
      await api.put(`/users/${u.id}`, { is_active: !u.is_active });
      toast.success(u.is_active ? 'User deactivated' : 'User activated');
      fetchUsers();
    } catch { toast.error('Failed'); }
  };

  const handleResetPassword = async () => {
    if (!newPass || newPass.length < 6) return toast.error('Minimum 6 characters');
    try {
      await api.put(`/users/${resetModal.id}/reset-password`, { newPassword: newPass });
      toast.success('Password reset successfully');
      setResetModal(null);
      setNewPass('');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const roleBadge = { admin: 'badge-admin', manager: 'badge-manager', sales_rep: 'badge-sales_rep' };
  const roleLabel = { admin: 'Admin / CEO', manager: 'Store Manager', sales_rep: 'Sales Rep' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500">{users.length} users registered</p>
        </div>
        <button onClick={openAdd} className="btn-primary">+ Add User</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Name</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Email</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Role</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Created</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400">Loading…</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className={`hover:bg-gray-50 ${!u.is_active ? 'opacity-50' : ''}`}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={u.name} avatarUrl={u.avatar_url} size="sm" />
                      <div>
                        <p className="font-medium">{u.name}</p>
                        {u.id === currentUser.id && <span className="text-xs text-gray-400">(you)</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{u.email}</td>
                  <td className="py-3 px-4"><span className={roleBadge[u.role]}>{roleLabel[u.role]}</span></td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{fmtDate(u.created_at)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(u)} className="text-xs px-2 py-1 rounded border border-blue-200 text-blue-600 hover:bg-blue-50">Edit</button>
                      <button onClick={() => { setResetModal(u); setNewPass(''); }} className="text-xs px-2 py-1 rounded border border-amber-200 text-amber-600 hover:bg-amber-50">Reset PW</button>
                      {u.id !== currentUser.id && (
                        <button onClick={() => handleToggleActive(u)} className={`text-xs px-2 py-1 rounded border ${u.is_active ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                          {u.is_active ? 'Disable' : 'Enable'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role guide */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-800 mb-3">Role Permissions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ROLES.map(r => (
            <div key={r.value} className="p-4 bg-gray-50 rounded-xl">
              <span className={`${roleBadge[r.value]} mb-2 inline-block`}>{r.label}</span>
              <p className="text-xs text-gray-500 mt-1">{r.desc}</p>
              <ul className="mt-2 text-xs text-gray-600 space-y-0.5">
                {r.value === 'admin' && ['View dashboard', 'Full inventory control', 'Process sales', 'Manage users', 'View all reports', 'Adjust stock'].map(p => <li key={p}>✓ {p}</li>)}
                {r.value === 'manager' && ['View dashboard', 'Add new products', 'Adjust stock levels', 'View inventory', 'View sales history'].map(p => <li key={p}>✓ {p}</li>)}
                {r.value === 'sales_rep' && ['Process sales (POS)', 'Generate receipts', 'View inventory (read)', 'View sales history'].map(p => <li key={p}>✓ {p}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{editUser ? 'Edit User' : 'Add New User'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div><label className="label">Full Name *</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Jane Doe" required /></div>
              <div><label className="label">Email *</label><input type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@iffycollections.com" required /></div>
              {!editUser && <div><label className="label">Password *</label><input type="password" className="input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" required /></div>}
              <div>
                <label className="label">Role *</label>
                <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : editUser ? 'Update User' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold mb-1">Reset Password</h2>
            <p className="text-sm text-gray-500 mb-4">For: <strong>{resetModal.name}</strong></p>
            <input type="password" className="input mb-4" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="New password (min 6 chars)" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setResetModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleResetPassword} className="btn-primary">Reset Password</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
