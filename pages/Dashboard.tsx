
import React from 'react';
import { AppState, SalesSource } from '../types';

interface DashboardProps {
  state: AppState;
  onNav: (tab: string) => void;
}

const CHANNEL_COLORS: Record<string, string> = {
  'WhatsApp': 'bg-emerald-500',
  'Instagram': 'bg-pink-500',
  'Facebook': 'bg-blue-500',
  'TikTok': 'bg-slate-800',
  'Walk-in': 'bg-amber-500',
  'Phone Call': 'bg-purple-500',
  'Other': 'bg-slate-400'
};

const Dashboard: React.FC<DashboardProps> = ({ state, onNav }) => {
  const totalRevenue = state.orders.reduce((sum, o) => sum + o.total, 0);
  const totalExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);

  const calculateCOGS = () => {
    let cogs = 0;
    state.orders.forEach(o => {
      o.items.forEach(i => {
        const product = state.products.find(p => p.id === i.id || p.name === i.name);
        if (product) cogs += product.costPrice * i.quantity;
      });
    });
    return cogs;
  };

  const cogs = calculateCOGS();
  const profit = totalRevenue - totalExpenses - cogs;

  // --- Weekly Revenue Trend (last 7 days) ---
  const getWeeklyData = () => {
    const days: { label: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en', { weekday: 'short' });
      const dayRevenue = state.orders
        .filter(o => o.date.startsWith(dayStr))
        .reduce((s, o) => s + o.total, 0);
      days.push({ label: dayLabel, revenue: dayRevenue });
    }
    return days;
  };

  const weeklyData = getWeeklyData();
  const maxRevenue = Math.max(...weeklyData.map(d => d.revenue), 1);

  // --- Sales by Channel ---
  const channelData = state.orders.reduce((acc, order) => {
    acc[order.source] = (acc[order.source] || 0) + order.total;
    return acc;
  }, {} as Record<string, number>);

  const channelEntries = Object.entries(channelData).sort((a, b) => (b[1] as number) - (a[1] as number)) as [string, number][];
  const channelTotal = channelEntries.reduce((s, [, v]) => s + v, 0) || 1;

  // --- Recent Orders ---
  const recentOrders = [...state.orders]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard</h2>
        <p className="text-slate-500 text-xs font-medium">Business performance at a glance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <KPICard
          label="Net Profit"
          amount={profit}
          currency={state.profile.currency}
          icon="fa-arrow-trend-up"
          className="bg-slate-900 text-white col-span-2"
          subtext="After expenses & COGS"
        />
        <KPICard
          label="Revenue"
          amount={totalRevenue}
          currency={state.profile.currency}
          icon="fa-sack-dollar"
          className="bg-teal-500 text-white"
        />
        <KPICard
          label="Expenses"
          amount={totalExpenses}
          currency={state.profile.currency}
          icon="fa-receipt"
          className="bg-white text-slate-900 border border-slate-100"
        />
      </div>

      {/* Weekly Revenue Trends Chart */}
      <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Weekly Trends</h3>
          <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded text-slate-500">Last 7 days</span>
        </div>

        {state.orders.length > 0 ? (
          <div className="flex items-end justify-between gap-2 h-32 pt-2">
            {weeklyData.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[9px] font-bold text-slate-500">
                  {day.revenue > 0 ? `${(day.revenue / 1000).toFixed(0)}k` : ''}
                </span>
                <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
                  <div
                    className="w-full max-w-[28px] rounded-lg transition-all bg-gradient-to-t from-teal-500 to-teal-400"
                    style={{
                      height: day.revenue > 0 ? `${Math.max((day.revenue / maxRevenue) * 100, 8)}%` : '4px',
                      opacity: day.revenue > 0 ? 1 : 0.2
                    }}
                  ></div>
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase">{day.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <i className="fa-solid fa-chart-line text-3xl mb-2 opacity-50"></i>
            <p className="text-xs">Record sales to see trends</p>
          </div>
        )}
      </div>

      {/* Sales by Channel – Pie-style bar breakdown */}
      <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Sales by Channel</h3>
          <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded text-slate-500">{state.orders.length} Orders</span>
        </div>

        {channelEntries.length > 0 ? (
          <>
            {/* Visual pie ring */}
            <div className="flex justify-center py-2">
              <div className="relative w-28 h-28">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  {(() => {
                    let cumulative = 0;
                    const colorMap: Record<string, string> = {
                      'WhatsApp': '#10b981', 'Instagram': '#ec4899', 'Facebook': '#3b82f6',
                      'TikTok': '#1e293b', 'Walk-in': '#f59e0b', 'Phone Call': '#a855f7', 'Other': '#94a3b8'
                    };
                    return channelEntries.map(([name, val]: [string, number]) => {
                      const pct = (val / channelTotal) * 100;
                      const offset = cumulative;
                      cumulative += pct;
                      return (
                        <circle
                          key={name}
                          cx="18" cy="18" r="15.5"
                          fill="none"
                          stroke={colorMap[name] || '#94a3b8'}
                          strokeWidth="5"
                          strokeDasharray={`${pct} ${100 - pct}`}
                          strokeDashoffset={-offset}
                          strokeLinecap="round"
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-black text-slate-900">{state.orders.length}</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">orders</span>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2">
              {channelEntries.map(([name, val]: [string, number]) => (
                <div key={name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${CHANNEL_COLORS[name] || 'bg-slate-400'}`}></span>
                    <span className="font-bold text-slate-700">{name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-medium">{state.profile.currency}{val.toLocaleString()}</span>
                    <span className="font-black text-slate-600 w-10 text-right">{Math.round((val / channelTotal) * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <i className="fa-solid fa-chart-pie text-3xl mb-2 opacity-50"></i>
            <p className="text-xs">No sales recorded yet</p>
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div className="space-y-3">
        <div className="flex justify-between items-end px-1">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Recent Orders</h3>
          {state.orders.length > 0 && (
            <button onClick={() => onNav('orders')} className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">
              View All →
            </button>
          )}
        </div>
        <div className="space-y-2">
          {recentOrders.length > 0 ? recentOrders.map(order => (
            <div key={order.id} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-100/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center border bg-slate-50 text-slate-500 border-slate-100">
                  <i className="fa-solid fa-receipt"></i>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{order.customerName}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    {order.source} • {new Date(order.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
              <span className="text-sm font-black text-slate-900">+{state.profile.currency}{order.total.toLocaleString()}</span>
            </div>
          )) : (
            <p className="text-xs text-slate-400 text-center py-4">No orders yet. Record a sale to get started!</p>
          )}
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ label, amount, currency, icon, className, subtext }: { label: string; amount: number; currency: string; icon: string; className?: string; subtext?: string }) => (
  <div className={`p-5 rounded-[24px] space-y-1 relative overflow-hidden flex flex-col justify-center min-h-[110px] shadow-lg ${className}`}>
    <div className="flex justify-between items-start z-10 opacity-80">
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      <i className={`fa-solid ${icon}`}></i>
    </div>
    <h2 className="text-2xl font-black z-10 relative">
      <span className="text-lg align-top opacity-70 mr-0.5">{currency}</span>
      {amount.toLocaleString()}
    </h2>
    {subtext && <p className="text-[10px] opacity-60 z-10">{subtext}</p>}
    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
  </div>
);

export default Dashboard;
