import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ReceiptModal from '../components/sales/ReceiptModal';

const fmt = (n) => `₦${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

export default function SalesPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [priceType, setPriceType] = useState('retail'); // 'retail' | 'wholesale'
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '', id: null });
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [newCustomerMode, setNewCustomerMode] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });
  const [savingCustomer, setSavingCustomer] = useState(false);
  const customerSearchRef = useRef();
  const dropdownRef = useRef();
  const [discount, setDiscount] = useState('');
  const [discountType, setDiscountType] = useState('fixed'); // 'fixed' | 'percent'
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [processing, setProcessing] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const searchRef = useRef();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products', { params: { search, limit: 30 } });
        setProducts(res.data.products.filter(p => p.quantity > 0));
      } catch { }
    };
    fetchProducts();
  }, [search, refreshKey]);

  useEffect(() => {
    if (customerSearch.length < 2) { setCustomerResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await api.get('/customers', { params: { search: customerSearch, limit: 8 } });
        setCustomerResults(res.data.customers);
      } catch { }
    }, 250);
    return () => clearTimeout(t);
  }, [customerSearch]);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowCustomerDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectCustomer = (c) => {
    setCustomer({ name: c.name, phone: c.phone || '', email: c.email || '', id: c.id });
    setCustomerSearch('');
    setCustomerResults([]);
    setShowCustomerDropdown(false);
  };

  const clearCustomer = () => {
    setCustomer({ name: '', phone: '', email: '', id: null });
    setCustomerSearch('');
    setNewCustomerMode(false);
    setNewCustomer({ name: '', phone: '', email: '' });
  };

  const handleAddNewCustomer = async () => {
    if (!newCustomer.name) return toast.error('Name is required');
    if (savingCustomer) return;
    setSavingCustomer(true);
    try {
      const res = await api.post('/customers', newCustomer);
      selectCustomer(res.data);
      setNewCustomerMode(false);
      setNewCustomer({ name: '', phone: '', email: '' });
      toast.success('Customer added');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add customer');
    } finally {
      setSavingCustomer(false);
    }
  };

  const getPrice = (product) =>
    priceType === 'wholesale' && parseFloat(product.wholesale_price) > 0
      ? parseFloat(product.wholesale_price)
      : parseFloat(product.price);

  // When price type switches, update all cart item prices
  const handlePriceTypeChange = (type) => {
    setPriceType(type);
    setCart(prev => prev.map(item => {
      const newPrice = type === 'wholesale' && parseFloat(item.wholesale_price) > 0
        ? parseFloat(item.wholesale_price)
        : parseFloat(item.retail_price);
      return { ...item, price: newPrice };
    }));
  };

  const addToCart = (product) => {
    const price = getPrice(product);
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) {
        if (exists.qty >= product.quantity) { toast.error(`Only ${product.quantity} in stock`); return prev; }
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, {
        ...product,
        price,
        retail_price: parseFloat(product.price),
        wholesale_price: parseFloat(product.wholesale_price) || 0,
        qty: 1,
      }];
    });
  };

  const updateQty = (id, qty) => {
    const product = products.find(p => p.id === id) || cart.find(i => i.id === id);
    if (qty < 1) { removeFromCart(id); return; }
    if (product && qty > product.quantity) { toast.error(`Only ${product.quantity} in stock`); return; }
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };

  const updatePrice = (id, price) => {
    const val = parseFloat(price);
    setCart(prev => prev.map(i => i.id === id ? { ...i, price: isNaN(val) || val < 0 ? 0 : val } : i));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discountAmt = discountType === 'percent'
    ? subtotal * (Math.min(parseFloat(discount) || 0, 100) / 100)
    : parseFloat(discount) || 0;
  const total = Math.max(0, subtotal - discountAmt);
  const change = Math.max(0, (parseFloat(amountPaid) || 0) - total);

  useEffect(() => {
    if (cart.length > 0) setAmountPaid(total.toString());
  }, [total]);

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    if (!amountPaid || parseFloat(amountPaid) <= 0) return toast.error('Amount paid is required');
    if (parseFloat(amountPaid) < total) return toast.error('Amount paid is less than total');
    setProcessing(true);
    try {
      const res = await api.post('/sales', {
        customer_name: customer.name || 'Walk-in Customer',
        customer_phone: customer.phone,
        items: cart.map(i => ({ product_id: i.id, quantity: i.qty, unit_price: i.price })),
        discount: discountAmt,
        payment_method: paymentMethod,
        amount_paid: parseFloat(amountPaid) || total,
        price_type: priceType,
      });
      setCompletedSale(res.data);
      setCart([]);
      setCustomer({ name: '', phone: '', email: '', id: null });
      setCustomerSearch('');
      setDiscount('');
      setAmountPaid('');
      toast.success(`Sale complete! Receipt: ${res.data.sale.receipt_number}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Sale failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-full">
      {/* Product search panel */}
      <div className="flex-1 space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
            <p className="text-sm text-gray-500">Search and add items to cart</p>
          </div>
          {/* Price type toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handlePriceTypeChange('retail')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                priceType === 'retail'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Retail
            </button>
            <button
              onClick={() => handlePriceTypeChange('wholesale')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                priceType === 'wholesale'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Wholesale
            </button>
          </div>
        </div>

        <input ref={searchRef} className="input" placeholder="Search products by name or SKU…" value={search} onChange={e => setSearch(e.target.value)} autoFocus />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {products.map(p => {
            const activePrice = getPrice(p);
            const hasWholesale = parseFloat(p.wholesale_price) > 0;
            return (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="card p-3 text-left hover:border-brand-300 hover:shadow-md transition-all group flex gap-3 items-start"
              >
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-300 text-xl">👗</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm group-hover:text-brand-600 leading-tight">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.category_name} · {p.size || 'One size'}</p>
                  <div className="flex items-end justify-between mt-2">
                    <div>
                      <p className="font-bold text-brand-600 text-sm">{fmt(activePrice)}</p>
                      {hasWholesale && (
                        <p className="text-xs text-gray-400">
                          {priceType === 'retail'
                            ? `WS: ${fmt(p.wholesale_price)}`
                            : `Ret: ${fmt(p.price)}`}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{p.quantity} left</span>
                  </div>
                </div>
              </button>
            );
          })}
          {products.length === 0 && (
            <div className="col-span-3 py-12 text-center text-gray-400">
              <p className="text-4xl mb-2">🔍</p>
              <p>No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart & Checkout panel */}
      <div className="lg:w-96 flex flex-col gap-4">
        <div className="card p-4 space-y-3">
          <h2 className="font-semibold text-gray-800">Customer <span className="text-xs text-gray-400 font-normal">(optional)</span></h2>

          {customer.name ? (
            <div className="flex items-center justify-between bg-brand-50 border border-brand-200 rounded-lg px-3 py-2">
              <div>
                <p className="text-sm font-medium text-brand-800">{customer.name}</p>
                {customer.phone && <p className="text-xs text-brand-600">{customer.phone}</p>}
              </div>
              <button onClick={clearCustomer} className="text-gray-400 hover:text-red-500 text-lg leading-none ml-3">×</button>
            </div>
          ) : (
            <div ref={dropdownRef} className="relative">
              <input
                ref={customerSearchRef}
                className="input"
                placeholder="Search customer by name or phone…"
                value={customerSearch}
                onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); setNewCustomerMode(false); }}
                onFocus={() => setShowCustomerDropdown(true)}
              />
              {showCustomerDropdown && customerSearch.length >= 2 && (
                <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {customerResults.length > 0 ? (
                    <>
                      {customerResults.map(c => (
                        <button key={c.id} onClick={() => selectCustomer(c)} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-0">
                          <p className="font-medium text-gray-900">{c.name}</p>
                          {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                        </button>
                      ))}
                      <button onClick={() => { setShowCustomerDropdown(false); setNewCustomerMode(true); }} className="w-full text-left px-3 py-2 text-xs text-brand-600 hover:bg-brand-50 font-medium">
                        + Add new customer
                      </button>
                    </>
                  ) : (
                    <button onClick={() => { setShowCustomerDropdown(false); setNewCustomerMode(true); setNewCustomer(f => ({ ...f, name: customerSearch })); }} className="w-full text-left px-3 py-2 text-sm text-brand-600 hover:bg-brand-50 font-medium">
                      + Add "{customerSearch}" as new customer
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {newCustomerMode && !customer.name && (
            <div className="border border-dashed border-brand-300 rounded-lg p-3 space-y-2 bg-brand-50/40">
              <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide">New Customer</p>
              <input className="input text-sm" placeholder="Full name *" value={newCustomer.name} onChange={e => setNewCustomer(f => ({ ...f, name: e.target.value }))} />
              <input className="input text-sm" placeholder="Phone number" value={newCustomer.phone} onChange={e => setNewCustomer(f => ({ ...f, phone: e.target.value }))} />
              <input className="input text-sm" placeholder="Email (optional)" value={newCustomer.email} onChange={e => setNewCustomer(f => ({ ...f, email: e.target.value }))} />
              <div className="flex gap-2">
                <button onClick={handleAddNewCustomer} disabled={savingCustomer} className="btn-primary text-xs py-1.5 flex-1">{savingCustomer ? 'Saving…' : 'Add & Select'}</button>
                <button onClick={() => { setNewCustomerMode(false); setNewCustomer({ name: '', phone: '', email: '' }); }} className="btn-secondary text-xs py-1.5">Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="card p-4 flex-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">
              Cart ({cart.length} items)
              {cart.length > 0 && (
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                  priceType === 'wholesale' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {priceType === 'wholesale' ? 'Wholesale' : 'Retail'}
                </span>
              )}
            </h2>
            {cart.length > 0 && <button onClick={() => { setCart([]); setDiscount(''); setAmountPaid(''); setPaymentMethod('cash'); setCustomer({ name: '', phone: '', email: '', id: null }); setCustomerSearch(''); }} className="text-xs text-red-500 hover:text-red-700">Clear all</button>}
          </div>

          {cart.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <p className="text-3xl mb-2">🛒</p>
              <p className="text-sm">Cart is empty</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="p-2 bg-gray-50 rounded-lg space-y-1.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium flex-1 truncate">{item.name}</p>
                    <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 text-lg leading-none flex-shrink-0">×</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-200">−</button>
                      <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-200">+</button>
                    </div>
                    <div className="flex items-center gap-1 flex-1">
                      <span className="text-xs text-gray-400">₦</span>
                      <input
                        type="number"
                        min="0"
                        className="input py-0.5 px-1.5 text-sm w-full"
                        value={item.price}
                        onChange={e => updatePrice(item.id, e.target.value)}
                      />
                    </div>
                    <p className="text-sm font-semibold min-w-[70px] text-right">{fmt(item.price * item.qty)}</p>
                  </div>
                  {(() => {
                    const minPreset = item.wholesale_price > 0 ? Math.min(item.retail_price, item.wholesale_price) : item.retail_price;
                    return item.price < minPreset ? (
                      <p className="text-xs text-amber-600">Below min preset price of {fmt(minPreset)}</p>
                    ) : null;
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals & Payment */}
        <div className="card p-4 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">Discount</label>
              <div className="flex items-center gap-1 bg-gray-100 rounded-md p-0.5">
                <button onClick={() => setDiscountType('fixed')} className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${discountType === 'fixed' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500'}`}>₦</button>
                <button onClick={() => setDiscountType('percent')} className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${discountType === 'percent' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500'}`}>%</button>
              </div>
            </div>
            <input className="input" type="number" min="0" max={discountType === 'percent' ? 100 : undefined} value={discount} onChange={e => setDiscount(e.target.value)} placeholder={discountType === 'percent' ? '0%' : '0'} />
          </div>

          <div className="space-y-1 text-sm border-t border-gray-100 pt-3">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            {discountAmt > 0 && <div className="flex justify-between text-green-600"><span>Discount{discountType === 'percent' ? ` (${discount}%)` : ''}</span><span>−{fmt(discountAmt)}</span></div>}
            <div className="flex justify-between font-bold text-base text-gray-900 pt-1 border-t border-gray-200 mt-1"><span>Total</span><span className="text-brand-600">{fmt(total)}</span></div>
          </div>

          <div>
            <label className="label">Payment Method</label>
            <select className="input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="transfer">Bank Transfer</option>
              <option value="card">Card (POS)</option>
            </select>
          </div>

          <div>
            <label className="label">Amount Paid (₦)</label>
            <input className="input" type="number" min="0" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder={total.toString()} />
          </div>
          {amountPaid && parseFloat(amountPaid) > total && (
            <div className="flex justify-between text-sm font-semibold text-green-700 bg-green-50 px-3 py-2 rounded-lg">
              <span>Change</span><span>{fmt(change)}</span>
            </div>
          )}
          {amountPaid && parseFloat(amountPaid) < total && (
            <div className="flex justify-between text-sm font-semibold text-red-700 bg-red-50 px-3 py-2 rounded-lg">
              <span>Outstanding</span><span>{fmt(total - parseFloat(amountPaid))}</span>
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={processing || cart.length === 0}
            className="btn-primary w-full py-3 text-base"
          >
            {processing ? 'Processing…' : `Complete Sale — ${fmt(total)}`}
          </button>
        </div>
      </div>

      {completedSale && (
        <ReceiptModal sale={completedSale} onClose={() => { setCompletedSale(null); setRefreshKey(k => k + 1); }} />
      )}
    </div>
  );
}
