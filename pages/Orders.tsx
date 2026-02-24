
import React, { useState } from 'react';
import { AppState } from '../types';

interface OrdersProps {
    state: AppState;
    onUpdateOrders: (orders: AppState['orders']) => void;
    onAddOrder: () => void;
}

const CHANNEL_OPTIONS = ['All', 'WhatsApp', 'Instagram', 'Facebook', 'Offline'] as const;

const Orders: React.FC<OrdersProps> = ({ state, onUpdateOrders, onAddOrder }) => {
    const [search, setSearch] = useState('');
    const [channelFilter, setChannelFilter] = useState<string>('All');

    // Derive customer tiers from order history
    const getCustomerTier = (customerName: string): 'VIP' | 'Returning' | 'New' => {
        const customerOrders = state.orders.filter(o => o.customerName === customerName);
        const totalSpent = customerOrders.reduce((s, o) => s + o.total, 0);
        if (customerOrders.length >= (state.profile.vipThreshold || 5) || totalSpent >= 200000) return 'VIP';
        if (customerOrders.length > 1) return 'Returning';
        return 'New';
    };

    const tierBadge = (tier: 'VIP' | 'Returning' | 'New') => {
        const styles = {
            VIP: 'bg-amber-100 text-amber-700',
            Returning: 'bg-teal-50 text-teal-700',
            New: 'bg-slate-100 text-slate-500'
        };
        return (
            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest ${styles[tier]}`}>
                {tier}
            </span>
        );
    };


    const filteredOrders = [...state.orders]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .filter(o => {
            if (channelFilter === 'All') return true;
            if (channelFilter === 'Offline') {
                return !['WhatsApp', 'Instagram', 'Facebook'].includes(o.source);
            }
            return o.source === channelFilter;
        })
        .filter(o => {
            if (!search) return true;
            const q = search.toLowerCase();
            return o.customerName.toLowerCase().includes(q) ||
                o.items.some(i => i.name.toLowerCase().includes(q)) ||
                o.source.toLowerCase().includes(q);
        });

    const channelCounts = {
        All: state.orders.length,
        WhatsApp: state.orders.filter(o => o.source === 'WhatsApp').length,
        Instagram: state.orders.filter(o => o.source === 'Instagram').length,
        Facebook: state.orders.filter(o => o.source === 'Facebook').length,
        Offline: state.orders.filter(o => !['WhatsApp', 'Instagram', 'Facebook'].includes(o.source)).length
    };

    return (
        <div className="space-y-5">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Orders</h2>
                    <p className="text-slate-500 text-xs font-medium">All recorded sales</p>
                </div>
                <button
                    onClick={onAddOrder}
                    className="bg-teal-500 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-teal-200 hover:bg-teal-600 transition-all active:scale-95"
                >
                    <i className="fa-solid fa-plus font-black"></i> Add Order
                </button>
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
                    placeholder="Search by customer, item, or channel..."
                    className="w-full bg-white border border-slate-100 rounded-2xl pl-11 pr-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500 shadow-sm placeholder:text-slate-300"
                />
            </div>

            {/* Channel Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {CHANNEL_OPTIONS.map(channel => (
                    <button
                        key={channel}
                        onClick={() => setChannelFilter(channel)}
                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${channelFilter === channel
                            ? 'bg-teal-500 text-white shadow-md shadow-teal-200'
                            : 'bg-white text-slate-500 border border-slate-100'
                            }`}
                    >
                        {channel}
                        <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[8px] ${channelFilter === channel ? 'bg-white/20' : 'bg-slate-100'
                            }`}>
                            {channelCounts[channel as keyof typeof channelCounts]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Order List */}
            <div className="space-y-3">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-16 space-y-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto flex items-center justify-center">
                            <i className="fa-solid fa-receipt text-2xl text-slate-300"></i>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400">
                                {search || channelFilter !== 'All' ? 'No matching orders' : 'No orders yet'}
                            </p>
                            <p className="text-xs text-slate-300 mt-1">
                                {search || channelFilter !== 'All' ? 'Try adjusting your filters' : 'Sales you record will appear here.'}
                            </p>
                        </div>
                    </div>
                ) : (
                    filteredOrders.map(order => {
                        const tier = getCustomerTier(order.customerName);
                        return (
                            <div key={order.id} className="bg-white rounded-2xl p-4 border border-slate-100/50 shadow-sm space-y-3">
                                {/* Order Header */}
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm bg-slate-100 text-slate-500 border border-slate-200">
                                            <i className="fa-solid fa-receipt"></i>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-slate-900">{order.customerName}</p>
                                                {tierBadge(tier)}
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                                                {new Date(order.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })} • {order.source}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-black text-slate-900">{state.profile.currency}{order.total.toLocaleString()}</p>
                                </div>

                                {/* Items */}
                                {order.items && order.items.length > 0 && (
                                    <div className="bg-slate-50 rounded-xl p-3 space-y-1">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-[11px]">
                                                <span className="text-slate-600">{item.quantity}x {item.name}</span>
                                                <span className="text-slate-800 font-bold">{state.profile.currency}{(item.price * item.quantity).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Footer Note */}
                                {order.note && (
                                    <div className="pt-1 border-t border-slate-50">
                                        <span className="text-[10px] text-slate-400 italic truncate block">
                                            <i className="fa-solid fa-note-sticky mr-1"></i>{order.note}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Orders;
