import React, { useState, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success('Password changed successfully');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally { setSaving(false); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error('Image must be under 2MB');
    setUploadingAvatar(true);
    setConfirmRemove(false);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.post('/auth/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser({ avatar_url: res.data.avatar_url });
      toast.success('Photo updated');
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setRemovingAvatar(true);
    try {
      await api.delete('/auth/avatar');
      updateUser({ avatar_url: null });
      toast.success('Photo removed');
      setConfirmRemove(false);
    } catch {
      toast.error('Failed to remove photo');
    } finally { setRemovingAvatar(false); }
  };

  const roleLabel = { admin: 'Admin / CEO', manager: 'Store Manager', sales_rep: 'Sales Rep / Cashier' };
  const roleBadge = { admin: 'badge-admin', manager: 'badge-manager', sales_rep: 'badge-sales_rep' };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Manage your account</p>
      </div>

      {/* Profile card */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-800 mb-4">My Profile</h2>
        <div className="flex items-start gap-5">
          {/* Avatar with upload overlay */}
          <div className="relative flex-shrink-0">
            <UserAvatar name={user?.name} avatarUrl={user?.avatar_url} size="lg" />
            {uploadingAvatar && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                <img src="/logo.png" alt="" className="w-7 h-7 object-contain animate-spin" style={{ animationDuration: '1.2s' }} />
              </div>
            )}
            {/* Camera icon overlay to trigger upload */}
            {!uploadingAvatar && (
              <button
                onClick={() => { setConfirmRemove(false); fileInputRef.current?.click(); }}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center shadow-md transition-colors"
                title="Change photo"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-lg font-semibold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className={`${roleBadge[user?.role]} mt-1 inline-block`}>{roleLabel[user?.role]}</span>

            <div className="mt-3 space-y-2">
              <p className="text-xs text-gray-400">JPG, PNG or GIF · max 2MB</p>

              {/* Inline remove confirmation */}
              {user?.avatar_url && !confirmRemove && (
                <button
                  onClick={() => setConfirmRemove(true)}
                  disabled={uploadingAvatar}
                  className="text-xs text-red-500 hover:text-red-700 font-medium underline-offset-2 hover:underline disabled:opacity-40"
                >
                  Remove photo
                </button>
              )}

              {confirmRemove && (
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-xs text-red-700 flex-1">Remove your profile photo?</p>
                  <button
                    onClick={handleRemoveAvatar}
                    disabled={removingAvatar}
                    className="text-xs px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white font-medium disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {removingAvatar && <img src="/logo.png" alt="" className="w-3 h-3 animate-spin" style={{ animationDuration: '1.2s' }} />}
                    {removingAvatar ? 'Removing…' : 'Yes, remove'}
                  </button>
                  <button
                    onClick={() => setConfirmRemove(false)}
                    className="text-xs px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 text-gray-600 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
      </div>

      {/* Change password */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" value={form.currentPassword} onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))} required />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="Min 6 characters" required />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" className="input" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} required />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Update Password'}</button>
        </form>
      </div>

      {/* System info */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-800 mb-4">System Information</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 bg-gray-50 rounded-lg"><p className="text-gray-500 text-xs">Store Name</p><p className="font-medium mt-0.5">Iffy Collections</p></div>
          <div className="p-3 bg-gray-50 rounded-lg"><p className="text-gray-500 text-xs">Location</p><p className="font-medium mt-0.5">Bodija, Ibadan</p></div>
          <div className="p-3 bg-gray-50 rounded-lg"><p className="text-gray-500 text-xs">Currency</p><p className="font-medium mt-0.5">Nigerian Naira (₦)</p></div>
          <div className="p-3 bg-gray-50 rounded-lg"><p className="text-gray-500 text-xs">Version</p><p className="font-medium mt-0.5">1.0.0</p></div>
        </div>
      </div>
    </div>
  );
}
