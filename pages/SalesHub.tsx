
import React, { useState } from 'react';
import { AppState, Order, SalesSource } from '../types';

interface SalesHubProps {
  state: AppState;
  onUpdateOrder: (order: Order) => void;
  onNav: (tab: string) => void;
}

const SalesHub: React.FC<SalesHubProps> = ({ state, onUpdateOrder, onNav }) => {
  const [activeTab, setActiveTab] = useState<'Insights' | 'Log'>('Insights');
  const [platformFilter, setPlatformFilter] = useState<SalesSource | 'All'>('All');

  const filteredOrders = state.orders.filter(o => platformFilter === 'All' || o.source === platformFilter);
  const totalRevenue = filteredOrders.reduce((s, o) => s + o.total, 0);

  const exportPDF = () => {
    // Basic receipt/report generation simulation
    const content = `
      BOOKLY SALES REPORT
      -------------------
      Date: ${new Date().toLocaleDateString()}
      Business: ${state.profile.name}
      Filter: ${platformFilter}
      
      Total Revenue: ${state.profile.currency}${totalRevenue.toLocaleString()}
      Total Orders: ${filteredOrders.length}
      
      ORDERS:
      ${filteredOrders.map(o => `[${new Date(o.date).toLocaleDateString()}] ${o.customerName} - ${state.profile.currency}${o.total} (${o.source})`).join('\n')}
    `;

    // Create a temporary window to print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<pre style="font-family: monospace; white-space: pre-wrap;">${content}</pre>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const sourceStats = ['WhatsApp', 'Instagram', 'Facebook', 'TikTok', 'Other'].map(source => {
    const orders = state.orders.filter(o => o.source === source);
    return { name: source, count: orders.length, revenue: orders.reduce((s, o) => s + o.total, 0) };
  });

  const maxRevenue = Math.max(...sourceStats.map(s => s.revenue), 1); // Avoid div by zero

  const generateReceipt = (order: Order) => {
    const content = `
      RECEIPT - ${state.profile.name}
      ------------------------------
      Order ID: ${order.id}
      Date: ${new Date(order.date).toLocaleDateString()}
      Customer: ${order.customerName}
      
      ITEMS:
      ${order.items.map(i => `${i.quantity}x ${i.name} - ${state.profile.currency}${i.price}`).join('\n')}
      
      ------------------------------
      TOTAL: ${state.profile.currency}${order.total.toLocaleString()}
      Payment: ${order.paymentMethod}
      
      ${state.profile.footerNote}
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<pre style="font-family: monospace; padding: 20px;">${content}</pre>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Sales Hub</h2>
        <button onClick={exportPDF} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          <i className="fa-solid fa-file-pdf"></i> Report
        </button>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
        <button onClick={() => setActiveTab('Insights')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'Insights' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Insights</button>
        <button onClick={() => setActiveTab('Log')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'Log' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Sales Log</button>
      </div>

      <div className="overflow-x-auto pb-2 flex gap-2 no-scrollbar">
        {['All', 'WhatsApp', 'Instagram', 'Facebook', 'TikTok'].map(p => (
          <button
            key={p}
            onClick={() => setPlatformFilter(p as any)}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border shrink-0 transition-all ${platformFilter === p ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500'}`}
          >
            {p}
          </button>
        ))}
      </div>

      {activeTab === 'Insights' ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue Impact ({platformFilter})</p>
                <p className="text-3xl font-black text-slate-900">{state.profile.currency} {totalRevenue.toLocaleString()}</p>
              </div>
            </div>

            {/* CSS Bar Chart */}
            <div className="mt-4 space-y-3">
              {sourceStats.filter(s => s.revenue > 0).map(stat => (
                <div key={stat.name} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                    <span>{stat.name}</span>
                    <span>{state.profile.currency}{stat.revenue.toLocaleString()}</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(stat.revenue / maxRevenue) * 100}%` }}></div>
                  </div>
                </div>
              ))}
              {totalRevenue === 0 && <p className="text-xs text-slate-400 text-center py-4">No revenue data.</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {sourceStats.map(stat => (
              <div key={stat.name} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <i className={`fa-brands fa-${stat.name.toLowerCase().replace(' ', '-')}`}></i>
                  <span className="text-[10px] font-black uppercase">{stat.name}</span>
                </div>
                <p className="text-lg font-black text-slate-900">{state.profile.currency}{stat.revenue.toLocaleString()}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase">{stat.count} Sales</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.length > 0 ? filteredOrders.map(order => (
            <div key={order.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center group active:scale-[0.98] transition-all">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl bg-slate-100 text-slate-500">
                  <i className={`fa-brands fa-${order.source.toLowerCase().replace(' ', '-')}`}></i>
                </div>
                <div>
                  <p className="font-bold text-slate-900">{order.customerName}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(order.date).toLocaleDateString()} • {order.source}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-slate-900">{state.profile.currency}{order.total.toLocaleString()}</p>
                <button onClick={() => generateReceipt(order)} className="text-[9px] font-black text-indigo-600 uppercase mt-1 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition-colors">
                  <i className="fa-solid fa-receipt mr-1"></i> Receipt
                </button>
              </div>
            </div>
          )) : (
            <div className="text-center py-20 opacity-30">
              <i className="fa-solid fa-receipt text-5xl mb-4"></i>
              <p className="font-black text-xs uppercase">No sales found for this filter</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SalesHub;
