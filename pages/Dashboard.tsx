
import React from 'react';
import { AppState, SalesSource } from '../types';

interface DashboardProps {
  state: AppState;
  onNav: (tab: string) => void;
}

const COLORS = ['bg-indigo-500', 'bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-rose-500', 'bg-slate-500', 'bg-purple-500'];

const Dashboard: React.FC<DashboardProps> = ({ state, onNav }) => {
  const totalRevenue = state.orders.reduce((sum, o) => sum + o.total, 0);
  const totalExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate COGS approximately
  const calculateCOGS = () => {
    let cogs = 0;
    state.orders.forEach(o => {
      o.items.forEach(i => {
        const product = state.products.find(p => p.id === i.id || p.name === i.name);
        if (product) {
          cogs += (product.costPrice * i.quantity);
        } else {
          // If manual sale without items, assume 50% profit margin as filler logic or 0 cost
          // For strict MVP, maybe 0 cost if unknown
        }
      });
    });
    return cogs;
  };

  const cogs = calculateCOGS();
  const profit = totalRevenue - totalExpenses - cogs;

  const platformData = state.orders.reduce((acc, order) => {
    acc[order.source] = (acc[order.source] || 0) + 1;
    return acc;
  }, {} as Record<SalesSource, number>);

  const chartData = Object.entries(platformData).map(([name, value]) => ({ name, value }));
  const totalCount = state.orders.length;

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard</h2>
        <p className="text-slate-500 text-xs font-medium">Business performance at a glance</p>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 gap-4">
        <KPICard
          label="Net Profit"
          amount={profit}
          currency={state.profile.currency}
          icon="fa-arrow-trend-up"
          className="bg-slate-900 text-white col-span-2"
          subtext="After expenses & cost of goods"
        />
        <KPICard
          label="Total Revenue"
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

      {/* Sales by Platform */}
      <div className="bg-white p-6 rounded-[28px] shadow-sm border border-slate-100 space-y-5">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Sales Channel</h3>
          <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded text-slate-500">{totalCount} Orders</span>
        </div>

        {chartData.length > 0 ? (
          <div className="space-y-4">
            {chartData.sort((a, b) => b.value - a.value).map((entry, index) => (
              <div key={entry.name} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${COLORS[index % COLORS.length]}`}></span>
                    {entry.name}
                  </span>
                  <span>{Math.round((entry.value / totalCount) * 100)}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${COLORS[index % COLORS.length]} rounded-full`}
                    style={{ width: `${(entry.value / totalCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <i className="fa-solid fa-chart-simple text-3xl mb-2 opacity-50"></i>
            <p className="text-xs">No sales recorded yet</p>
          </div>
        )}
      </div>

      {/* Recent Transactions Preview */}
      <div className="space-y-3">
        <div className="flex justify-between items-end px-1">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Recent Activity</h3>
        </div>
        <div className="space-y-3">
          {[...state.orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3).map(order => (
            <div key={order.id} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-slate-100/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <i className="fa-solid fa-arrow-down-long rotate-45"></i>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{order.source} Sale</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(order.date).toLocaleDateString()}</p>
                </div>
              </div>
              <span className="text-sm font-black text-slate-900">+{state.profile.currency}{order.total.toLocaleString()}</span>
            </div>
          ))}
          {state.orders.length === 0 && <p className="text-xs text-slate-400 text-center py-2">No recent activity.</p>}
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ label, amount, currency, icon, className, subtext }: { label: string, amount: number, currency: string, icon: string, className?: string, subtext?: string }) => (
  <div className={`p-5 rounded-[24px] space-y-1 relative overflow-hidden flex flex-col justify-center min-h-[120px] shadow-lg ${className}`}>
    <div className="flex justify-between items-start z-10 opacity-80">
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      <i className={`fa-solid ${icon}`}></i>
    </div>
    <h2 className="text-2xl font-black z-10 relative">
      <span className="text-lg align-top opacity-70 mr-0.5">{currency}</span>
      {amount.toLocaleString()}
    </h2>
    {subtext && <p className="text-[10px] opacity-60 z-10">{subtext}</p>}

    {/* Decorative */}
    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
  </div>
);

export default Dashboard;
