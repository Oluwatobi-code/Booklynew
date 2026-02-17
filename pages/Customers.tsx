
import React, { useState } from 'react';
import { AppState } from '../types';

interface CustomersProps {
  state: AppState;
}

const Customers: React.FC<CustomersProps> = ({ state }) => {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('All');

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

  const customers = customersFromOrders()
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .filter(c => tierFilter === 'All' || c.tier === tierFilter)
    .filter(c => {
      if (!search) return true;
      return c.name.toLowerCase().includes(search.toLowerCase());
    });

  const tierCounts = {
    All: customersFromOrders().length,
    VIP: customersFromOrders().filter(c => c.tier === 'VIP').length,
    Returning: customersFromOrders().filter(c => c.tier === 'Returning').length,
    New: customersFromOrders().filter(c => c.tier === 'New').length
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
        new Date(c.lastOrderDate).toLocaleDateString(),
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

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Customers</h2>
          <p className="text-slate-500 text-xs font-medium">Sorted by lifetime value</p>
        </div>
        {customers.length > 0 && (
          <button onClick={exportCRM} className="bg-slate-900 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
            <i className="fa-solid fa-download"></i> Export
          </button>
        )}
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
              {state.orders.length === 0 ? 'No customers yet' : 'No matching customers'}
            </p>
            <p className="text-xs text-slate-300">
              {state.orders.length === 0 ? 'Customers are created from sales.' : 'Try adjusting your search or filters.'}
            </p>
          </div>
        ) : (
          customers.map((customer, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex justify-between items-center">
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
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest ${tierStyles[customer.tier]}`}>
                      {customer.tier}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                    <span>{customer.orderCount} order{customer.orderCount > 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span>{customer.channels.join(', ')}</span>
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
    </div>
  );
};

export default Customers;
