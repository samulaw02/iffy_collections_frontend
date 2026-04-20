import React, { useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function CategoryModal({ categories, onClose, onSaved }) {
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await api.post('/categories', { name: newName.trim(), description: newDesc.trim() });
      toast.success('Category added');
      setNewName('');
      setNewDesc('');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add category');
    } finally { setAdding(false); }
  };

  const startEdit = (cat) => {
    setEditId(cat.id);
    setEditName(cat.name);
    setEditDesc(cat.description || '');
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await api.put(`/categories/${id}`, { name: editName.trim(), description: editDesc.trim() });
      toast.success('Category updated');
      setEditId(null);
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Manage Categories</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Add new */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Add New Category</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <input
                className="input"
                placeholder="Category name *"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
              />
              <input
                className="input"
                placeholder="Description (optional)"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
              />
              <button type="submit" disabled={adding || !newName.trim()} className="btn-primary w-full">
                {adding ? 'Adding…' : '+ Add Category'}
              </button>
            </form>
          </div>

          {/* Existing */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Existing Categories ({categories.length})</h3>
            <div className="space-y-2">
              {categories.map(cat => (
                <div key={cat.id} className="border border-gray-200 rounded-lg p-3">
                  {editId === cat.id ? (
                    <div className="space-y-2">
                      <input
                        className="input"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                      />
                      <input
                        className="input"
                        placeholder="Description (optional)"
                        value={editDesc}
                        onChange={e => setEditDesc(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(cat.id)}
                          disabled={saving}
                          className="btn-primary text-xs px-3 py-1.5"
                        >
                          {saving ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="btn-secondary text-xs px-3 py-1.5"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                        {cat.description && <p className="text-xs text-gray-400">{cat.description}</p>}
                      </div>
                      <button
                        onClick={() => startEdit(cat)}
                        className="text-xs px-2 py-1 rounded border border-blue-200 hover:bg-blue-50 text-blue-600"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No categories yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
