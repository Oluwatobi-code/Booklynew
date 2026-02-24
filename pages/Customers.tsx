
import React, { useState } from 'react';
import { AppState, Customer } from '../types';

interface CustomersProps {
  state: AppState;
  onAddCustomer: (customer: Customer) => void;
}

const Customers: React.FC<CustomersProps> = ({ state, onAddCustomer }) => {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // Build customer list from orders
  const customersFromOrders = () => {
    const map: Record<string, { name: string; orderCount: number; totalSpent: number; lastOrderDate: string; sources: Set<string> }> = {};
    state.orders.forEach(o => {
      const key = o.customerName.toLowerCase().trim();
      if (!map[key]) {
        map[key] = { name: o.customerName, orderCount: 0, totalSpent: 0, lastOrderDate: o.date, sources: new Set() };
      }
      map[key].orderCount += 1;
      map[key].totalSpent += o.total;
      map[key].sources.add(o.source);
      if (new Date(o.date) > new Date(map[key].lastOrderDate)) {
        map[key].lastOrderDate = o.date;
      }
    });
    return Object.values(map).map(c => ({
      ...c,
      tier: (c.orderCount >= (state.profile.vipThreshold || 5) || c.totalSpent >= 200000) ? 'VIP' as const :
        c.orderCount > 1 ? 'Returning' as const : 'New' as const,
      channels: Array.from(c.sources)
    }));
  };

  // Merge order-derived customers with manually added customers
  const mergedCustomers = () => {
    const fromOrders = customersFromOrders();
    const orderKeys = new Set(fromOrders.map(c => c.name.toLowerCase().trim()));

    // Add manually-added customers that don't already appear from orders
    const manualOnly = (state.customers || [])
      .filter(mc => !orderKeys.has(mc.name.toLowerCase().trim()))
      .map(mc => ({
        name: mc.name,
        orderCount: mc.orderCount || 0,
        totalSpent: mc.totalSpent || 0,
        lastOrderDate: mc.lastOrderDate || '',
        tier: mc.tier || 'New' as const,
        channels: [] as string[],
        phone: mc.phone || '',
        email: mc.email || ''
      }));

    return [...fromOrders, ...manualOnly];
  };

  const allCustomers = mergedCustomers();

  const customers = allCustomers
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .filter(c => tierFilter === 'All' || c.tier === tierFilter)
    .filter(c => {
      if (!search) return true;
      return c.name.toLowerCase().includes(search.toLowerCase());
    });

  const tierCounts = {
    All: allCustomers.length,
    VIP: allCustomers.filter(c => c.tier === 'VIP').length,
    Returning: allCustomers.filter(c => c.tier === 'Returning').length,
    New: allCustomers.filter(c => c.tier === 'New').length
  };

  const tierStyles = {
    VIP: 'bg-amber-100 text-amber-700',
    Returning: 'bg-teal-50 text-teal-700',
    New: 'bg-slate-100 text-slate-500'
  };

  const exportCRM = () => {
    const rows = [
      ["Name", "Tier", "Orders", "Total Spent", "Last Order", "Channels"],
      ...customers.map(c => [
        c.name, c.tier, c.orderCount.toString(),
        c.totalSpent.toString(),
        c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : '—',
        c.channels.join(', ')
      ])
    ];
    const csv = "data:text/csv;charset=utf-8," + rows.map(r => r.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `bookly_customers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const customer: Customer = {
      id: Date.now().toString(),
      name: newName.trim(),
      phone: newPhone.trim() || undefined,
      email: newEmail.trim() || undefined,
      tier: 'New',
      totalSpent: 0,
      orderCount: 0
    };
    onAddCustomer(customer);
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Customers</h2>
          <p className="text-slate-500 text-xs font-medium">Sorted by lifetime value</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-teal-500 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-teal-200 hover:bg-teal-600 transition-all active:scale-95"
          >
            <i className="fa-solid fa-user-plus"></i> Add
          </button>
          {customers.length > 0 && (
            <button onClick={exportCRM} className="bg-slate-900 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
              <i className="fa-solid fa-download"></i> Export
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          <i className="fa-solid fa-magnifying-glass text-sm"></i>
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search customers..."
          className="w-full bg-white border border-slate-100 rounded-2xl pl-11 pr-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500 shadow-sm placeholder:text-slate-300"
        />
      </div>

      {/* Tier Filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {(['All', 'VIP', 'Returning', 'New'] as const).map(tier => (
          <button
            key={tier}
            onClick={() => setTierFilter(tier)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tierFilter === tier
              ? tier === 'VIP' ? 'bg-amber-500 text-white shadow-md' :
                tier === 'Returning' ? 'bg-teal-500 text-white shadow-md' :
                  tier === 'New' ? 'bg-slate-700 text-white shadow-md' :
                    'bg-teal-500 text-white shadow-md shadow-teal-200'
              : 'bg-white text-slate-500 border border-slate-100'
              }`}
          >
            {tier === 'All' ? '👥' : tier === 'VIP' ? '👑' : tier === 'Returning' ? '🔄' : '✨'} {tier}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[8px] ${tierFilter === tier ? 'bg-white/20' : 'bg-slate-100'}`}>
              {tierCounts[tier]}
            </span>
          </button>
        ))}
      </div>

      {/* Customer List */}
      <div className="space-y-3">
        {customers.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto flex items-center justify-center">
              <i className="fa-solid fa-users text-2xl text-slate-300"></i>
            </div>
            <p className="text-sm font-bold text-slate-400">
              {state.orders.length === 0 && (state.customers || []).length === 0 ? 'No customers yet' : 'No matching customers'}
            </p>
            <p className="text-xs text-slate-300">
              {state.orders.length === 0 && (state.customers || []).length === 0
                ? 'Add customers manually or they appear from sales.'
                : 'Try adjusting your search or filters.'}
            </p>
          </div>
        ) : (
          customers.map((customer, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedCustomer(customer)}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex justify-between items-center cursor-pointer hover:border-teal-500 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black shadow-inner ${customer.tier === 'VIP' ? 'bg-amber-50 text-amber-600' :
                  customer.tier === 'Returning' ? 'bg-teal-50 text-teal-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{customer.name}</h3>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest ${tierStyles[customer.tier as keyof typeof tierStyles]}`}>
                      {customer.tier}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                    <span>{customer.orderCount} order{customer.orderCount !== 1 ? 's' : ''}</span>
                    {customer.channels.length > 0 && (
                      <>
                        <span>•</span>
                        <span>{customer.channels.join(', ')}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-slate-900">{state.profile.currency}{customer.totalSpent.toLocaleString()}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Lifetime</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-[400px] rounded-t-[32px] sm:rounded-[32px] p-6 max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black shadow-inner ${selectedCustomer.tier === 'VIP' ? 'bg-amber-50 text-amber-600' :
                  selectedCustomer.tier === 'Returning' ? 'bg-teal-50 text-teal-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{selectedCustomer.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest ${tierStyles[selectedCustomer.tier as keyof typeof tierStyles]}`}>
                      {selectedCustomer.tier}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-6 pb-4 no-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Spent</p>
                  <p className="text-lg font-black text-slate-900">{state.profile.currency}{selectedCustomer.totalSpent.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Orders</p>
                  <p className="text-lg font-black text-slate-900">{selectedCustomer.orderCount}</p>
                </div>
              </div>

              {(selectedCustomer.phone || selectedCustomer.email) && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Info</p>
                  <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                    {selectedCustomer.phone && (
                      <div className="flex items-center gap-3">
                        <i className="fa-solid fa-phone text-teal-500 text-xs"></i>
                        <span className="text-sm font-bold text-slate-700">{selectedCustomer.phone}</span>
                      </div>
                    )}
                    {selectedCustomer.email && (
                      <div className="flex items-center gap-3">
                        <i className="fa-solid fa-envelope text-teal-500 text-xs"></i>
                        <span className="text-sm font-bold text-slate-700">{selectedCustomer.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Order History</p>
                <div className="space-y-3">
                  {state.orders
                    .filter(o => o.customerName.toLowerCase().trim() === selectedCustomer.name.toLowerCase().trim())
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(order => (
                      <div key={order.id} className="border border-slate-100 rounded-2xl p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {new Date(order.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{order.source}</span>
                          </div>
                          <p className="text-sm font-black text-teal-600">{state.profile.currency}{order.total.toLocaleString()}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-2.5 space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-[10px]">
                              <span className="text-slate-600">{item.quantity}x {item.name}</span>
                              <span className="text-slate-800 font-bold">{state.profile.currency}{(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-[400px] rounded-t-[32px] sm:rounded-[32px] p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <i className="fa-solid fa-user-plus text-teal-500"></i> Add Customer
              </h3>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Customer name"
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-300"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="Optional"
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-300"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="Optional"
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-300"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-teal-500 text-white py-4 rounded-xl font-black text-sm shadow-xl shadow-teal-200 mt-2 hover:bg-teal-600 transition-all active:scale-95"
              >
                Add Customer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
