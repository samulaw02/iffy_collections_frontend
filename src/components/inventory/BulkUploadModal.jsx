import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { exportCsv } from '../../utils/exportCsv';

const TEMPLATE_ROWS = [
  {
    name: 'Floral Summer Dress',
    sku: 'FSD-001',
    category: 'Adult Wear',
    size: 'M',
    color: 'Red',
    gender: 'female',
    retail_price: 8500,
    wholesale_price: 6000,
    cost_price: 4500,
    quantity: 10,
    low_stock_threshold: 3,
    description: 'Light floral dress for summer',
  },
  {
    name: 'Kids Polo Shirt',
    sku: 'KPS-002',
    category: 'Kiddies Wear',
    size: '4-5yrs',
    color: 'Blue',
    gender: 'male',
    retail_price: 3500,
    wholesale_price: 2500,
    cost_price: 1800,
    quantity: 20,
    low_stock_threshold: 5,
    description: '',
  },
];

const COLUMNS = [
  { key: 'name', label: 'Name', required: true },
  { key: 'sku', label: 'SKU' },
  { key: 'category', label: 'Category' },
  { key: 'size', label: 'Size' },
  { key: 'color', label: 'Color' },
  { key: 'gender', label: 'Gender' },
  { key: 'retail_price', label: 'Retail Price (₦)', required: true },
  { key: 'wholesale_price', label: 'Wholesale Price (₦)' },
  { key: 'cost_price', label: 'Cost Price (₦)' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'low_stock_threshold', label: 'Low Stock Threshold' },
  { key: 'description', label: 'Description' },
];

function validateRow(row) {
  const errors = [];
  if (!row.name?.trim()) errors.push('Name required');
  const price = parseFloat(row.retail_price);
  if (isNaN(price) || price < 0) errors.push('Valid retail price required');
  return errors;
}

export default function BulkUploadModal({ onClose, onImported }) {
  const [step, setStep] = useState('upload'); // upload | preview | result
  const [rows, setRows] = useState([]);
  const [parseError, setParseError] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  const downloadTemplate = () => {
    exportCsv('iffy_collections_product_template.csv', TEMPLATE_ROWS);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setParseError('');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: h => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
      complete: ({ data, errors }) => {
        if (errors.length && data.length === 0) {
          setParseError('Could not parse CSV. Make sure you used the template format.');
          return;
        }
        if (data.length === 0) { setParseError('The file is empty.'); return; }
        if (data.length > 500) { setParseError('Maximum 500 rows per upload.'); return; }
        setRows(data.map((r, i) => ({ ...r, _row: i + 1, _errors: validateRow(r) })));
        setStep('preview');
      },
      error: () => setParseError('Failed to read file.'),
    });
    e.target.value = '';
  };

  const validRows = rows.filter(r => r._errors.length === 0);
  const invalidRows = rows.filter(r => r._errors.length > 0);

  const handleImport = async () => {
    if (validRows.length === 0) return toast.error('No valid rows to import');
    setImporting(true);
    try {
      const payload = validRows.map(({ _row, _errors, ...rest }) => rest);
      const res = await api.post('/products/bulk-import', { products: payload });
      setResult(res.data);
      setStep('result');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Bulk Product Import</h2>
            <p className="text-sm text-gray-500">Upload a CSV file to add multiple products at once</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Step: Upload */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="border border-gray-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-brand-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">1</span>
                  <div>
                    <p className="font-semibold text-gray-800">Download the CSV template</p>
                    <p className="text-sm text-gray-500">Fill it in with your product data — two example rows are included.</p>
                  </div>
                </div>
                <button onClick={downloadTemplate} className="btn-secondary flex items-center gap-2 text-sm">
                  ⬇️ Download Template (CSV)
                </button>
              </div>

              {/* Step 2 */}
              <div className="border border-gray-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-brand-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">2</span>
                  <div>
                    <p className="font-semibold text-gray-800">Upload your filled CSV file</p>
                    <p className="text-sm text-gray-500">Max 500 products per upload. You'll get a preview before anything is saved.</p>
                  </div>
                </div>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
                <button onClick={() => fileRef.current?.click()} className="btn-primary flex items-center gap-2 text-sm">
                  📂 Choose CSV File
                </button>
                {parseError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{parseError}</p>}
              </div>

              {/* Column reference */}
              <div className="border border-dashed border-gray-200 rounded-xl p-5">
                <p className="text-sm font-semibold text-gray-700 mb-3">CSV Column Reference</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COLUMNS.map(c => (
                    <div key={c.key} className="flex items-center gap-1.5 text-xs">
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-mono">{c.key}</code>
                      {c.required && <span className="text-red-500 font-bold">*</span>}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3">* Required fields. Gender: male / female / unisex / kids</p>
              </div>
            </div>
          )}

          {/* Step: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <span className="text-green-700 font-bold text-lg">{validRows.length}</span>
                  <span className="text-sm text-green-700">ready to import</span>
                </div>
                {invalidRows.length > 0 && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <span className="text-red-700 font-bold text-lg">{invalidRows.length}</span>
                    <span className="text-sm text-red-700">rows with errors (will be skipped)</span>
                  </div>
                )}
                <button onClick={() => { setStep('upload'); setRows([]); }} className="btn-secondary text-sm ml-auto">
                  ← Change file
                </button>
              </div>

              {invalidRows.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-red-700 mb-2">Rows with errors (will not be imported):</p>
                  <div className="space-y-1">
                    {invalidRows.map(r => (
                      <p key={r._row} className="text-xs text-red-600">
                        Row {r._row} <span className="font-medium">"{r.name || '(no name)'}"</span>: {r._errors.join(', ')}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-500 font-semibold">#</th>
                      {['name', 'sku', 'category', 'size', 'color', 'gender', 'retail_price', 'quantity'].map(col => (
                        <th key={col} className="px-3 py-2 text-left text-gray-500 font-semibold whitespace-nowrap">{col}</th>
                      ))}
                      <th className="px-3 py-2 text-left text-gray-500 font-semibold">status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map(r => (
                      <tr key={r._row} className={r._errors.length ? 'bg-red-50' : 'hover:bg-gray-50'}>
                        <td className="px-3 py-2 text-gray-400">{r._row}</td>
                        {['name', 'sku', 'category', 'size', 'color', 'gender', 'retail_price', 'quantity'].map(col => (
                          <td key={col} className="px-3 py-2 text-gray-700 max-w-[120px] truncate">{r[col] || '—'}</td>
                        ))}
                        <td className="px-3 py-2">
                          {r._errors.length === 0
                            ? <span className="text-green-600 font-medium">✓ OK</span>
                            : <span className="text-red-600 font-medium">✗ {r._errors.join(', ')}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step: Result */}
          {step === 'result' && result && (
            <div className="space-y-5">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="flex-1 bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                  <p className="text-4xl font-bold text-green-700">{result.created}</p>
                  <p className="text-sm text-green-600 mt-1">Products imported successfully</p>
                </div>
                {result.failed?.length > 0 && (
                  <div className="flex-1 bg-red-50 border border-red-200 rounded-xl p-5 text-center">
                    <p className="text-4xl font-bold text-red-700">{result.failed.length}</p>
                    <p className="text-sm text-red-600 mt-1">Rows failed during import</p>
                  </div>
                )}
              </div>

              {result.failed?.length > 0 && (
                <div className="border border-red-200 rounded-xl overflow-hidden">
                  <div className="bg-red-50 px-4 py-3 border-b border-red-200">
                    <p className="text-sm font-semibold text-red-700">Failed rows</p>
                  </div>
                  <div className="divide-y divide-red-100">
                    {result.failed.map(f => (
                      <div key={f.row} className="px-4 py-2.5 flex items-center justify-between text-sm">
                        <span className="text-gray-700">Row {f.row} — <span className="font-medium">{f.name || '(no name)'}</span></span>
                        <span className="text-red-600 text-xs">{f.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.created > 0 && (
                <p className="text-sm text-gray-500 text-center">
                  Your inventory has been updated. Head back to the inventory list to review.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
          {step === 'preview' && (
            <>
              <p className="text-sm text-gray-500">{validRows.length} of {rows.length} rows will be imported</p>
              <div className="flex gap-3">
                <button onClick={onClose} className="btn-secondary">Cancel</button>
                <button
                  onClick={handleImport}
                  disabled={importing || validRows.length === 0}
                  className="btn-primary flex items-center gap-2"
                >
                  {importing ? '⏳ Importing…' : `Import ${validRows.length} Products`}
                </button>
              </div>
            </>
          )}
          {step === 'upload' && (
            <div className="ml-auto">
              <button onClick={onClose} className="btn-secondary">Cancel</button>
            </div>
          )}
          {step === 'result' && (
            <div className="flex gap-3 ml-auto">
              <button onClick={() => { setStep('upload'); setRows([]); setResult(null); }} className="btn-secondary">Import Another File</button>
              <button onClick={() => { onImported(); onClose(); }} className="btn-primary">Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
