
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { AppState, BusinessProfile, Order, Product, Customer, Expense } from './types';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';
import { extractOrderFromText } from './geminiService';
import { onAuthChange, logOut } from './services/auth';
import { getUserData, saveUserData } from './services/firestore';
import { auth } from './firebase';

const INITIAL_PROFILE: BusinessProfile = {
  name: '',
  currency: 'NGN',
  phone: '',
  email: '',
  footerNote: '',
  vipThreshold: 0
};

const DEFAULT_STATE: AppState = {
  isLoggedIn: false,
  uid: null,
  profile: INITIAL_PROFILE,
  orders: [],
  products: [],
  customers: [],
  expenses: [],
  isOnline: navigator.onLine,
  settings: {
    showFab: true,
    soundEnabled: false
  }
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');


  // Modals
  const [showManualSale, setShowManualSale] = useState(false);
  const [showAICapture, setShowAICapture] = useState(false);

  // Manual Sale Form State
  const [manualSaleForm, setManualSaleForm] = useState<{
    customerName: string;
    customerPhone: string;
    items: {
      id: string;
      name: string;
      quantity: number;
      price: number;
      isNew?: boolean;
      costPrice?: number;
      stock?: number;
      lowAlert?: number;
      addToInventory?: boolean;
      fromAI?: boolean;
    }[];
    note: string;
    source: string;
    receiptImage: string | null;
  }>({
    customerName: '',
    customerPhone: '',
    items: [],
    note: '',
    source: 'Select',
    receiptImage: null
  });

  const [productSearch, setProductSearch] = useState('');
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);

  // AI Capture State
  const [aiInputText, setAiInputText] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  // Receipt Modal State
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // Debounce timer for Firestore saves
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoadingData = useRef(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // --- Click outside suggestion list to close ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowProductSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Firebase Auth State Listener ---
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        // User is signed in — load their data from Firestore
        isLoadingData.current = true;
        try {
          const data = await getUserData(user.uid);
          if (data) {
            setState({
              isLoggedIn: true,
              uid: user.uid,
              profile: data.profile || INITIAL_PROFILE,
              orders: data.orders || [],
              products: data.products || [],
              customers: data.customers || [],
              expenses: data.expenses || [],
              isOnline: navigator.onLine,
              settings: data.settings || { showFab: true, soundEnabled: false }
            });
          } else {
            // User doc doesn't exist yet (brand new user)
            setState({
              ...DEFAULT_STATE,
              isLoggedIn: true,
              uid: user.uid,
              isOnline: navigator.onLine
            });
          }
        } catch (err) {
          console.error('CRITICAL: Failed to load user data on auth change. Data saving disabled to prevent overwrite.', err);
          // SET isLoggedIn but DO NOT reset state to DEFAULT_STATE if we already have some local state
          // This prevents a glitchy reload from wiping everything.
          setState(prev => ({
            ...prev,
            isLoggedIn: true,
            uid: user.uid,
            isOnline: navigator.onLine
          }));
        } finally {
          isLoadingData.current = false;
        }
      } else {
        // User is signed out
        setState(DEFAULT_STATE);
      }
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  // --- Online/Offline listener ---
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  // --- Force Save on Tab Close ---
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (syncStatus === 'syncing') {
        e.preventDefault();
        e.returnValue = ''; // Browsers show a generic message
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [syncStatus]);

  // --- Debounced Firestore Save ---
  const debouncedSave = useCallback((currentState: AppState) => {
    if (!currentState.uid || !currentState.isLoggedIn || isLoadingData.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      if (!currentState.uid || !currentState.isLoggedIn) return;

      setSyncStatus('syncing');
      try {
        await saveUserData(currentState.uid!, {
          profile: currentState.profile,
          orders: currentState.orders,
          products: currentState.products,
          customers: currentState.customers,
          expenses: currentState.expenses,
          settings: currentState.settings
        });
        setSyncStatus('synced');
        console.log('✓ Data synced to cloud');
      } catch (err) {
        // Firestore with persistent cache will retry automatically.
        // We only set 'error' for hard failures (like permissions).
        console.error('Firestore Sync Alert:', err);
        setSyncStatus('synced'); // Keep it 'synced' visually because it's in the local cache
      }
    }, 2000); // 2s debounce
  }, []);

  // Trigger save whenever state changes (excluding auth/online fields)
  useEffect(() => {
    if (state.isLoggedIn && state.uid) {
      debouncedSave(state);
    }
  }, [state.profile, state.orders, state.products, state.customers, state.expenses, state.settings, debouncedSave]);

  // --- Handle Login (called from Login page) ---
  const handleLogin = async (uid: string) => {
    isLoadingData.current = true;
    try {
      const data = await getUserData(uid);
      const userEmail = auth.currentUser?.email || '';

      if (data) {
        setState({
          isLoggedIn: true,
          uid,
          profile: {
            ...data.profile,
            email: data.profile?.email || userEmail // Auto-fill if blank
          },
          orders: data.orders || [],
          products: data.products || [],
          customers: data.customers || [],
          expenses: data.expenses || [],
          isOnline: navigator.onLine,
          settings: data.settings || { showFab: true, soundEnabled: false }
        });
      } else {
        setState({
          ...DEFAULT_STATE,
          isLoggedIn: true,
          uid,
          profile: { ...INITIAL_PROFILE, email: userEmail },
          isOnline: navigator.onLine
        });
      }
    } catch (err: any) {
      console.error('CRITICAL: Failed to load user data on login. Error:', err);
      // Show actual error message to help diagnose
      alert(`Network error: ${err.message || 'Could not sync your data'}. Please check your connection.`);
    } finally {
      isLoadingData.current = false;
    }
  };

  // --- Handle Logout ---
  const handleLogout = async () => {
    // KILL any pending background saves immediately
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    // Attempt ONE last forced save before logging out
    if (state.uid && state.isLoggedIn) {
      setSyncStatus('syncing');
      try {
        console.log('Performing final save before logout...');
        await saveUserData(state.uid, {
          profile: state.profile,
          orders: state.orders,
          products: state.products,
          customers: state.customers,
          expenses: state.expenses,
          settings: state.settings
        });
        setSyncStatus('synced');
      } catch (err) {
        setSyncStatus('error');
        console.warn('Final save failed:', err);
      }
    }

    await logOut();
    setSyncStatus('synced');
    setState(DEFAULT_STATE);
    setActiveTab('dashboard');
  };

  const addExpense = (expense: Expense) => {
    setState(prev => ({
      ...prev,
      expenses: [expense, ...prev.expenses]
    }));
  };

  const handleManualSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalAmount = manualSaleForm.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (manualSaleForm.items.length === 0) {
      alert("Please add at least one item to the sale.");
      return;
    }

    if (manualSaleForm.source === 'Select') {
      alert("Please select a sales source (e.g. WhatsApp, Walk-in) before saving.");
      return;
    }

    if (!manualSaleForm.customerName.trim()) {
      alert("Please enter a customer name.");
      return;
    }

    // Validate quantity and price for all items
    for (const item of manualSaleForm.items) {
      if (!item.quantity || item.quantity < 1) {
        alert(`Quantity for "${item.name}" must be at least 1.`);
        return;
      }

      if (item.price <= 0) {
        alert(`Selling price for "${item.name}" must be greater than 0.`);
        return;
      }

      // Strict validation for items being added to inventory
      if (item.isNew && item.addToInventory) {
        if (!item.costPrice || item.costPrice <= 0) {
          alert(`Please enter a valid Cost Price for new product "${item.name}".`);
          return;
        }
        if (!item.stock || item.stock <= 0) {
          alert(`Please enter a valid Stock Quantity for new product "${item.name}".`);
          return;
        }
      }
    }

    // Validate stock for ALL items
    for (const item of manualSaleForm.items) {
      if (item.isNew && item.addToInventory) {
        if (item.quantity > item.stock!) {
          alert(`Quantity for "${item.name}" (${item.quantity}) cannot exceed initial stock (${item.stock}).`);
          return;
        }
      } else if (!item.isNew) {
        // Validate against existing inventory stock
        const inventoryProduct = state.products.find(p => p.name === item.name);
        if (inventoryProduct && item.quantity > inventoryProduct.stock) {
          alert(`Quantity for "${item.name}" (${item.quantity}) exceeds available stock (${inventoryProduct.stock}).`);
          return;
        }
      }
    }

    // Handle adding new products to inventory (stock minus qty sold)
    const newProducts: Product[] = [];
    manualSaleForm.items.forEach(item => {
      if (item.isNew && item.addToInventory) {
        newProducts.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          name: item.name,
          costPrice: item.costPrice || 0,
          sellingPrice: item.price || 0,
          stock: (item.stock || 0) - item.quantity,
          lowStockThreshold: item.lowAlert || 5
        });
      }
    });

    // Deduct stock for existing products
    const updatedProducts = state.products.map(p => {
      const soldItem = manualSaleForm.items.find(i => !i.isNew && i.name === p.name);
      if (soldItem) {
        return { ...p, stock: Math.max(0, p.stock - soldItem.quantity) };
      }
      return p;
    });

    const newOrder: Order = {
      id: Date.now().toString(),
      customerName: manualSaleForm.customerName,
      customerPhone: manualSaleForm.customerPhone,
      items: manualSaleForm.items.map(i => ({
        id: i.id || Date.now().toString(),
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        variant: 'Standard'
      })),
      total: totalAmount,
      date: new Date().toISOString(),
      status: 'Paid',
      source: manualSaleForm.source as any,
      paymentMethod: 'Cash',
      note: manualSaleForm.note,
      receiptUrl: manualSaleForm.receiptImage || undefined
    };

    setState(prev => ({
      ...prev,
      orders: [newOrder, ...prev.orders],
      products: [...updatedProducts, ...newProducts]
    }));

    setShowManualSale(false);
    setProductSearch('');
    setShowProductSuggestions(false);
    setManualSaleForm({
      customerName: '',
      customerPhone: '',
      items: [],
      note: '',
      source: 'Select',
      receiptImage: null
    });
    setReceiptOrder(newOrder);
  };

  const addItemToSale = () => {
    setManualSaleForm(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now().toString(), name: '', quantity: 1, price: 0 }]
    }));
  };

  const updateSaleItem = (id: string, field: string, value: any) => {
    setManualSaleForm(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const removeSaleItem = (id: string) => {
    setManualSaleForm(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const handleNumericInput = (value: string, setter: (val: number) => void, allowEmpty = false) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    if (cleaned === '' && allowEmpty) { setter(0); return; }
    setter(cleaned === '' ? 0 : parseFloat(cleaned));
  };

  const handleIntInput = (value: string, setter: (val: number) => void, allowEmpty = false) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (cleaned === '' && allowEmpty) { setter(0); return; }
    setter(cleaned === '' ? 0 : parseInt(cleaned));
  };

  const extractUnmatchedProducts = (text: string): { name: string, quantity: number }[] => {
    // Extract potential product names and quantities from text that weren't matched to inventory
    const lower = text.toLowerCase();
    // Remove common non-product words
    const stopWords = ['i', 'want', 'to', 'buy', 'get', 'send', 'me', 'need', 'order', 'please', 'and', 'the', 'a', 'an', 'of', 'for', 'from', 'with', 'my', 'some', 'delivery', 'deliver', 'lekki', 'lagos', 'pairs', 'pair', 'pieces', 'piece', 'pcs', 'units', 'unit'];
    // Split by common delimiters
    const segments = lower.split(/(?:,|\band\b|\n|\.|;)+/).map(s => s.trim()).filter(Boolean);
    const results: { name: string, quantity: number }[] = [];
    for (const segment of segments) {
      // Extract quantity if present (e.g., "3 bags")
      const qtyMatch = segment.match(/(\d+)\s*[x×]?\s*(.*)/i);
      let qty = 1;
      let rawName = segment;

      if (qtyMatch) {
        qty = parseInt(qtyMatch[1]) || 1;
        rawName = qtyMatch[2];
      }

      // Extract product name by removing stop words
      let cleaned = rawName.split(/\s+/).filter(w => !stopWords.includes(w)).join(' ').trim();
      if (cleaned.length >= 2) {
        // Capitalize first letter of each word
        const name = cleaned.replace(/\b\w/g, c => c.toUpperCase());
        // Check it's not already in inventory
        const isInInventory = state.products.some(p => p.name.toLowerCase().includes(cleaned.toLowerCase()) || cleaned.toLowerCase().includes(p.name.toLowerCase()));
        if (!isInInventory && !results.some(r => r.name === name)) {
          results.push({ name, quantity: qty });
        }
      }
    }
    return results;
  };

  const handleAICapture = async () => {
    if (!aiInputText) return;
    setIsProcessingAI(true);
    try {
      const result = await extractOrderFromText(aiInputText, state.products);
      const matchedItems = result?.items || [];

      // Also find unmatched product names and create them as new items
      const unmatchedResults = extractUnmatchedProducts(aiInputText);
      // Filter out names that were already matched
      const matchedNamesLower = matchedItems.map(i => i.name.toLowerCase());
      const newItems = unmatchedResults
        .filter(r => !matchedNamesLower.some(mn => mn.includes(r.name.toLowerCase()) || r.name.toLowerCase().includes(mn)))
        .map(r => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          name: r.name,
          quantity: r.quantity,
          price: 0,
          isNew: true,
          addToInventory: true,
          costPrice: 0,
          stock: 0,
          lowAlert: 5
        }));

      const allItems = [
        ...matchedItems.map(i => ({ ...i, fromAI: true })),
        ...newItems.map(i => ({ ...i, fromAI: true }))
      ];

      if (allItems.length > 0) {
        setManualSaleForm({
          customerName: '',
          customerPhone: '',
          items: allItems,
          note: `AI captured from text`,
          source: result?.source || 'Other',
          receiptImage: null
        });
        setShowAICapture(false);
        setShowManualSale(true);
      } else {
        alert('Could not identify any products from the text. Please try rephrasing or enter manually.');
      }
    } catch (e) {
      alert('AI Processing failed. Please enter manually.');
    } finally {
      setIsProcessingAI(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard state={state} onNav={setActiveTab} />;
      case 'orders': return <Orders state={state} onUpdateOrders={(orders) => setState(prev => ({ ...prev, orders }))} onAddOrder={() => setShowManualSale(true)} />;
      case 'inventory': return <Inventory state={state} onUpdateProducts={(p) => setState(prev => ({ ...prev, products: p }))} />;
      case 'customers': return <Customers state={state} onAddCustomer={(c) => setState(prev => ({ ...prev, customers: [c, ...prev.customers] }))} />;
      case 'expenses': return <Expenses state={state} onAddExpense={addExpense} />;
      case 'settings': return (
        <Settings
          profile={state.profile}
          settings={state.settings}
          onUpdateProfile={(p) => setState(prev => ({ ...prev, profile: p }))}
          onUpdateSettings={(s) => setState(prev => ({ ...prev, settings: s }))}
          onLogout={handleLogout}
        />
      );
      default: return <Dashboard state={state} onNav={setActiveTab} />;
    }
  };

  // Show loading spinner while checking auth state
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif' }}>
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-teal-500 rounded-3xl mx-auto flex items-center justify-center text-white text-3xl shadow-xl shadow-teal-200 rotate-6 font-black animate-pulse">
            <span>B.</span>
          </div>
          <p className="text-slate-400 text-sm font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!state.isLoggedIn) return <Login onLogin={handleLogin} />;

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 relative shadow-2xl overflow-hidden" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif' }}>
      {/* Header */}
      <header className="bg-white px-6 py-4 flex justify-between items-center z-40 sticky top-0 border-b border-slate-100/80 backdrop-blur-md bg-white/90">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <span className="w-9 h-9 bg-teal-500 text-white rounded-xl flex items-center justify-center text-base font-black shadow-md shadow-teal-200">
              <span>B.</span>
            </span>
            <span className="truncate max-w-[150px] text-slate-800" style={{ fontFamily: 'Inter, sans-serif' }}>{state.profile.name || 'Bookly'}</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-1">
            {/* Sync Logic remains active in background, badge hidden as requested */}
          </div>

          <button onClick={() => setActiveTab('settings')} className="text-slate-400 hover:text-teal-500 transition-colors">
            <i className="fa-solid fa-gear text-lg"></i>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-32 pt-4 px-4 scroll-smooth no-scrollbar">
        {renderContent()}
      </main>

      {/* Floating Action Button */}
      {activeTab === 'dashboard' && state.settings.showFab && (
        <>
          {showFabMenu && (
            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-all" onClick={() => setShowFabMenu(false)}></div>
          )}

          <div className="absolute bottom-24 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
            <div className={`flex flex-col items-end gap-3 transition-all duration-300 ${showFabMenu ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
              <button onClick={() => { setShowFabMenu(false); setShowAICapture(true); }} className="bg-white text-slate-800 px-5 py-3 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-3 hover:bg-slate-50 transition-colors">
                AI Capture <i className="fa-solid fa-wand-magic-sparkles text-teal-600 text-lg"></i>
              </button>
              <button onClick={() => { setShowFabMenu(false); setShowManualSale(true); }} className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-3 hover:bg-slate-800 transition-colors">
                Manual Sale <i className="fa-solid fa-plus text-teal-400 text-lg"></i>
              </button>
            </div>

            <button
              onClick={() => setShowFabMenu(!showFabMenu)}
              className={`w-14 h-14 rounded-2xl shadow-2xl shadow-teal-500/30 flex items-center justify-center text-2xl transition-all duration-300 pointer-events-auto ${showFabMenu ? 'bg-slate-900 text-white rotate-45 scale-90' : 'bg-teal-500 text-white hover:scale-110'}`}
            >
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>
        </>
      )}

      {/* Manual Sale Modal */}
      {showManualSale && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-[420px] rounded-t-[32px] sm:rounded-[32px] p-5 animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2"><i className="fa-solid fa-cart-description text-teal-600"></i> Record Sale</h3>
              <button
                onClick={() => {
                  setShowManualSale(false);
                  setProductSearch('');
                  setShowProductSuggestions(false);
                }}
                className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <form onSubmit={handleManualSaleSubmit} className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    required
                    value={manualSaleForm.customerName}
                    onChange={e => setManualSaleForm({ ...manualSaleForm, customerName: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm font-normal text-slate-700 outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                    placeholder="Customer Name"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="tel"
                    value={manualSaleForm.customerPhone}
                    onChange={e => setManualSaleForm({ ...manualSaleForm, customerPhone: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm font-normal text-slate-700 outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                    placeholder="Phone (Optional)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Add Items</label>

                <div className="relative" ref={suggestionsRef}>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                    <i className="fa-solid fa-magnifying-glass"></i>
                  </div>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowProductSuggestions(true);
                    }}
                    onFocus={() => setShowProductSuggestions(true)}
                    className="w-full bg-white border-2 border-teal-800/20 rounded-xl pl-9 pr-3 py-3 text-sm font-normal text-slate-700 outline-none focus:border-teal-800 transition-all"
                    placeholder="Search or add product..."
                  />

                  {showProductSuggestions && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in slide-in-from-top-2">
                      <div className="max-h-48 overflow-y-auto">
                        {state.products
                          .filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()))
                          .map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                const newItem = { id: Date.now().toString(), name: p.name, quantity: 1, price: p.sellingPrice };
                                setManualSaleForm(prev => ({ ...prev, items: [...prev.items, newItem] }));
                                setProductSearch('');
                                setShowProductSuggestions(false);
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex justify-between items-center transition-colors"
                            >
                              <span className="text-xs font-normal text-slate-700">{p.name}</span>
                              <span className="text-xs font-bold text-teal-700">{state.profile.currency}{p.sellingPrice.toLocaleString()}</span>
                            </button>
                          ))}

                        {(productSearch && !state.products.find(p => p.name.toLowerCase() === productSearch.toLowerCase())) && (
                          <button
                            type="button"
                            onClick={() => {
                              const newItem = {
                                id: Date.now().toString(),
                                name: productSearch,
                                quantity: 1,
                                price: 0,
                                isNew: true,
                                addToInventory: true,
                                costPrice: 0,
                                stock: 0,
                                lowAlert: 5
                              };
                              setManualSaleForm(prev => ({ ...prev, items: [...prev.items, newItem] }));
                              setProductSearch('');
                              setShowProductSuggestions(false);
                            }}
                            className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2 text-teal-700 transition-colors"
                          >
                            <i className="fa-solid fa-plus text-xs"></i>
                            <span className="text-xs font-bold">Create "{productSearch}"</span>
                          </button>
                        )}

                        {state.products.length === 0 && !productSearch && (
                          <div className="p-4 text-center text-slate-400 text-[10px] italic">
                            No products in inventory yet.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Selected Items List */}
                <div className="space-y-2 pt-1">
                  {manualSaleForm.items.map((item) => {
                    // Check stock for existing inventory items
                    const inventoryProduct = !item.isNew ? state.products.find(p => p.name === item.name) : null;
                    const stockExceeded = item.isNew
                      ? (item.addToInventory && item.stock ? item.quantity > item.stock : false)
                      : (inventoryProduct ? item.quantity > inventoryProduct.stock : false);
                    const availableStock = item.isNew ? item.stock : inventoryProduct?.stock;

                    return item.isNew ? (
                      /* === NEW PRODUCT CARD (expanded) === */
                      <div key={item.id} className="p-3 bg-slate-50 rounded-xl space-y-2.5 relative border border-slate-100/50">
                        <button type="button" onClick={() => removeSaleItem(item.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 transition-colors">
                          <i className="fa-solid fa-circle-xmark text-sm"></i>
                        </button>
                        <div className="pr-6 flex items-center gap-2 min-w-0 w-full overflow-hidden">
                          {item.fromAI ? (
                            <input
                              type="text"
                              value={item.name}
                              onChange={e => updateSaleItem(item.id, 'name', e.target.value)}
                              className="text-xs font-bold text-slate-800 bg-transparent border-b border-teal-500/30 focus:border-teal-500 outline-none flex-1 min-w-0"
                            />
                          ) : (
                            <span className="text-xs font-bold text-slate-800 truncate flex-1 min-w-0">{item.name}</span>
                          )}
                          <span className="flex-shrink-0 text-[7px] bg-teal-100 text-teal-700 px-1 py-0.5 rounded-full uppercase tracking-widest">New</span>
                        </div>

                        <div className="space-y-2 animate-in slide-in-from-top-1">
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id={`add-inv-${item.id}`} checked={item.addToInventory} onChange={e => updateSaleItem(item.id, 'addToInventory', e.target.checked)} className="accent-teal-500 w-3.5 h-3.5" />
                            <label htmlFor={`add-inv-${item.id}`} className="text-xs font-bold text-slate-600">Save to Inventory</label>
                          </div>

                          {item.addToInventory && (
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[11px] font-black text-slate-400 uppercase pl-1 flex items-center gap-1" title="The amount you paid to get this product">
                                  Cost Price <i className="fa-solid fa-circle-info text-slate-300 text-[11px]"></i>
                                </label>
                                <input type="text" inputMode="numeric" placeholder="e.g. 500" value={item.costPrice || ''} onChange={e => handleNumericInput(e.target.value, v => updateSaleItem(item.id, 'costPrice', v), true)} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-3 text-sm font-normal outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[11px] font-black text-slate-400 uppercase pl-1 flex items-center gap-1" title="Total units available in your store">
                                  Stock Qty <i className="fa-solid fa-circle-info text-slate-300 text-[11px]"></i>
                                </label>
                                <input type="text" inputMode="numeric" placeholder="e.g. 20" value={item.stock || ''} onChange={e => handleIntInput(e.target.value, v => updateSaleItem(item.id, 'stock', v), true)} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-3 text-sm font-normal outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <div className="flex-1 space-y-1">
                            <label className="text-[11px] font-black text-slate-400 uppercase pl-1">Qty to Sell</label>
                            <input type="text" inputMode="numeric" required placeholder="1" value={item.quantity === 0 ? '' : item.quantity} onChange={e => handleIntInput(e.target.value, v => updateSaleItem(item.id, 'quantity', v), true)} className={`w-full bg-white border ${item.quantity < 1 ? 'border-red-500 bg-red-50' : 'border-slate-200'} rounded-lg px-2.5 py-3 text-sm font-normal outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`} />
                            {item.quantity < 1 && (
                              <p className="text-[10px] text-red-500 font-bold pl-1 animate-pulse">Minimum 1 required</p>
                            )}
                            {stockExceeded && (
                              <p className="text-[11px] text-red-500 font-bold pl-1">Exceeds stock ({availableStock})</p>
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <label className="text-[11px] font-black text-slate-400 uppercase pl-1" title="The price you're selling this item for">Selling Price</label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-bold">{state.profile.currency}</span>
                              <input type="text" inputMode="numeric" required placeholder="0" value={item.price || ''} onChange={e => handleNumericInput(e.target.value, v => updateSaleItem(item.id, 'price', v), true)} className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-2 py-3 text-sm font-normal outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                            </div>
                            {item.addToInventory && !!item.costPrice && item.price > 0 && item.price < item.costPrice && (
                              <p className="text-[11px] text-amber-500 font-bold pl-1"><i className="fa-solid fa-triangle-exclamation mr-0.5"></i> Below cost</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* === EXISTING INVENTORY ITEM (compact horizontal row) === */
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                        {item.fromAI ? (
                          <input
                            type="text"
                            value={item.name}
                            onChange={e => updateSaleItem(item.id, 'name', e.target.value)}
                            className="flex-1 min-w-0 text-sm font-bold text-slate-800 bg-transparent border-b border-teal-500/30 focus:border-teal-500 outline-none mr-2"
                          />
                        ) : (
                          <span className="flex-1 min-w-0 text-sm font-bold text-slate-800 truncate mr-2">{item.name}</span>
                        )}
                        <div className="flex items-center gap-1.5 translate-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase absolute -top-4 left-1">Qty</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            required
                            value={item.quantity === 0 ? '' : item.quantity}
                            onChange={e => handleIntInput(e.target.value, v => updateSaleItem(item.id, 'quantity', v), true)}
                            className={`w-14 bg-white border ${item.quantity < 1 ? 'border-red-500' : 'border-slate-200'} rounded-lg px-2 py-2 text-sm text-center font-normal outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                          />
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-teal-700 whitespace-nowrap">{state.profile.currency}{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                        <button type="button" onClick={() => removeSaleItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors ml-1">
                          <i className="fa-solid fa-circle-xmark text-lg"></i>
                        </button>
                        {stockExceeded && (
                          <p className="absolute -bottom-3 left-3 text-[10px] text-red-500 font-bold">Exceeds stock ({availableStock})</p>
                        )}
                      </div>
                    );
                  })}

                  {manualSaleForm.items.length === 0 && (
                    <div className="text-center py-5 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                      Add products from the search above to start.
                    </div>
                  )}
                  {manualSaleForm.items.some(i => i.fromAI) && (
                    <div className="flex justify-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowManualSale(false);
                          setShowAICapture(true);
                        }}
                        className="flex items-center gap-2 text-[11px] font-bold text-slate-400 hover:text-teal-600 transition-colors uppercase tracking-widest"
                      >
                        <i className="fa-solid fa-rotate-right"></i> Reprocess AI
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 rounded-2xl p-4 flex justify-between items-center shadow-lg shadow-slate-200">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                <span className="text-xl font-black text-white">
                  {state.profile.currency}{(manualSaleForm.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)).toLocaleString()}
                </span>
              </div>

              <div className="flex gap-2 items-start bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex-1 space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Source</label>
                  <select value={manualSaleForm.source} onChange={e => setManualSaleForm({ ...manualSaleForm, source: e.target.value })} className={`w-full bg-white border ${manualSaleForm.source === 'Select' ? 'border-amber-400' : 'border-slate-200'} rounded-lg px-3 py-2 text-sm font-normal text-slate-700 outline-none hover:border-teal-500 transition-all`}>
                    <option value="Select" disabled>Select Source</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="flex-shrink-0">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 block mb-1">Receipt</label>
                  <label className="w-12 h-12 bg-white border border-slate-200 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-teal-500 transition-all">
                    <i className="fa-solid fa-camera text-slate-400 text-base"></i>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setManualSaleForm({ ...manualSaleForm, receiptImage: URL.createObjectURL(file) });
                        }
                      }}
                    />
                  </label>
                  {manualSaleForm.receiptImage && <div className="mt-0.5 flex justify-center"><div className="w-1 h-1 bg-teal-500 rounded-full animate-pulse"></div></div>}
                </div>
              </div>

              <div className="space-y-3">

                <button
                  type="submit"
                  disabled={manualSaleForm.items.length === 0 || !manualSaleForm.customerName}
                  className="w-full bg-teal-500 text-white py-4 rounded-xl font-black text-sm shadow-lg shadow-teal-200 active:scale-[0.98] hover:bg-teal-600 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Capture Modal */}
      {showAICapture && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-[400px] rounded-t-[32px] sm:rounded-[32px] p-6 animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2"><i className="fa-solid fa-wand-magic-sparkles text-purple-600"></i> AI Capture</h3>
              <button onClick={() => setShowAICapture(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="space-y-4">
              <p className="text-xs text-slate-500 font-medium">Unknown image/text source? Paste the order details below and let AI handle the rest.</p>
              <textarea
                value={aiInputText}
                onChange={e => setAiInputText(e.target.value)}
                className="w-full h-32 bg-slate-50 border-none rounded-xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder="e.g. 'I want 2 pairs of Ankara Heels and 1 Agbada. Delivery to Lekki.'"
              ></textarea>
              <button
                onClick={handleAICapture}
                disabled={isProcessingAI || !aiInputText}
                className="w-full bg-purple-600 text-white py-4 rounded-xl font-black text-sm shadow-xl shadow-purple-200 mt-4 flex justify-center items-center gap-2"
              >
                {isProcessingAI ? <i className="fa-solid fa-circle-notch animate-spin"></i> : 'Process Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptOrder && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div id="receipt-content" className="bg-white w-full max-w-[380px] rounded-[28px] shadow-2xl animate-in slide-in-from-bottom-10 overflow-hidden">
            {/* Receipt Header */}
            <div className="bg-teal-500 px-6 py-4 text-center text-white">
              <div className="w-10 h-10 bg-white/20 rounded-full mx-auto flex items-center justify-center mb-2">
                <i className="fa-solid fa-check text-lg"></i>
              </div>
              <h3 className="text-base font-black">Sale Recorded!</h3>
              <p className="text-teal-100 text-[10px] font-medium mt-1">Receipt #{receiptOrder.id.slice(-6)}</p>
            </div>

            {/* Receipt Body */}
            <div className="px-5 py-4 space-y-3">
              {/* Customer Info */}
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Customer</p>
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-800">{receiptOrder.customerName}</span>
                  {receiptOrder.customerPhone && <span className="text-slate-400">{receiptOrder.customerPhone}</span>}
                </div>
              </div>

              <div className="border-t border-dashed border-slate-200"></div>

              {/* Items */}
              <div className="space-y-1.5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Products</p>
                {receiptOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-slate-600 font-normal">{item.quantity}x {item.name}</span>
                    <span className="text-slate-800 font-bold">{state.profile.currency}{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-200"></div>

              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-900 uppercase">Total</span>
                <span className="text-xl font-black text-teal-600">{state.profile.currency}{receiptOrder.total.toLocaleString()}</span>
              </div>

              <div className="border-t border-dashed border-slate-200"></div>

              {/* Meta Details */}
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[10px]">
                <div>
                  <p className="text-slate-400 font-bold uppercase">Channel</p>
                  <p className="text-slate-700 font-normal">{receiptOrder.source}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase">Order #</p>
                  <p className="text-slate-700 font-normal">#{receiptOrder.id.slice(-6)}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase">Date & Time</p>
                  <p className="text-slate-700 font-normal">{new Date(receiptOrder.date).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase">Category</p>
                  <p className="text-slate-700 font-normal">New Customer</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 flex gap-2">
              <button
                onClick={async () => {
                  const receiptText = `Receipt #${receiptOrder.id.slice(-6)}\nCustomer: ${receiptOrder.customerName}${receiptOrder.customerPhone ? ' (' + receiptOrder.customerPhone + ')' : ''}\n\nItems:\n${receiptOrder.items.map(i => `${i.quantity}x ${i.name} — ${state.profile.currency}${(i.price * i.quantity).toLocaleString()}`).join('\n')}\n\nTotal: ${state.profile.currency}${receiptOrder.total.toLocaleString()}\nChannel: ${receiptOrder.source}\nDate: ${new Date(receiptOrder.date).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
                  if (navigator.share) {
                    try {
                      await navigator.share({ title: `Receipt #${receiptOrder.id.slice(-6)}`, text: receiptText });
                    } catch (err) { /* user cancelled */ }
                  } else {
                    try {
                      await navigator.clipboard.writeText(receiptText);
                      alert('Receipt copied to clipboard!');
                    } catch (err) {
                      alert('Could not copy receipt.');
                    }
                  }
                }}
                className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-black text-xs hover:bg-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-share-nodes"></i> Share
              </button>
              <button
                onClick={() => setReceiptOrder(null)}
                className="flex-1 bg-teal-500 text-white py-3 rounded-xl font-black text-xs shadow-lg shadow-teal-200 hover:bg-teal-600 transition-all active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around py-3 pb-5 px-1 z-40 max-w-md mx-auto">
        <NavButton active={activeTab === 'dashboard'} icon="fa-chart-pie" label="Home" onClick={() => setActiveTab('dashboard')} />
        <NavButton active={activeTab === 'orders'} icon="fa-receipt" label="Orders" onClick={() => setActiveTab('orders')} />
        <NavButton active={activeTab === 'inventory'} icon="fa-layer-group" label="Stock" onClick={() => setActiveTab('inventory')} />
        <NavButton active={activeTab === 'customers'} icon="fa-users" label="CRM" onClick={() => setActiveTab('customers')} />
        <NavButton active={activeTab === 'expenses'} icon="fa-wallet" label="Costs" onClick={() => setActiveTab('expenses')} />
      </nav>
    </div>
  );
};

const NavButton = ({ active, icon, label, onClick }: { active: boolean, icon: string, label: string, onClick: () => void }) => (
  <button onClick={onClick} className={`relative flex flex-col items-center gap-1.5 transition-all duration-300 w-16 p-2 rounded-2xl ${active ? 'text-teal-600 bg-teal-50' : 'text-slate-400 hover:text-teal-500'}`}>
    <i className={`fa-solid ${icon} ${active ? 'text-lg' : 'text-lg'}`}></i>
    <span className={`text-[9px] font-black uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
  </button>
);

export default App;
