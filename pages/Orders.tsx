
import React from 'react';
import { AppState } from '../types';

interface OrdersProps {
    state: AppState;
}

const Orders: React.FC<OrdersProps> = ({ state }) => {
    const sortedOrders = [...state.orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Orders</h2>
                <p className="text-slate-500 text-xs font-medium">All recorded sales</p>
            </div>

            {/* Summary Bar */}
            {sortedOrders.length > 0 && (
                <div className="flex gap-3">
                    <div className="flex-1 bg-teal-50 rounded-2xl p-4 text-center">
                        <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Total Orders</p>
                        <p className="text-2xl font-black text-teal-700">{sortedOrders.length}</p>
                    </div>
                    <div className="flex-1 bg-slate-900 rounded-2xl p-4 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue</p>
                        <p className="text-2xl font-black text-white">
                            {state.profile.currency}{sortedOrders.reduce((s, o) => s + o.total, 0).toLocaleString()}
                        </p>
                    </div>
                </div>
            )}

            {/* Order List */}
            <div className="space-y-3">
                {sortedOrders.length === 0 ? (
                    <div className="text-center py-16 space-y-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto flex items-center justify-center">
                            <i className="fa-solid fa-receipt text-2xl text-slate-300"></i>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400">No orders yet</p>
                            <p className="text-xs text-slate-300 mt-1">Sales you record will appear here.</p>
                        </div>
                    </div>
                ) : (
                    sortedOrders.map(order => (
                        <div key={order.id} className="bg-white rounded-2xl p-4 border border-slate-100/50 shadow-sm space-y-3">
                            {/* Order Header */}
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${order.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                        <i className={`fa-solid ${order.status === 'Paid' ? 'fa-check' : 'fa-clock'}`}></i>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{order.customerName}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                                            {new Date(order.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })} • {order.source}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-slate-900">{state.profile.currency}{order.total.toLocaleString()}</p>
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${order.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>

                            {/* Items */}
                            {order.items && order.items.length > 0 && (
                                <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-xs">
                                            <span className="text-slate-600 font-medium">{item.quantity}x {item.name}</span>
                                            <span className="text-slate-800 font-bold">{state.profile.currency}{(item.price * item.quantity).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Note */}
                            {order.note && (
                                <p className="text-[11px] text-slate-400 italic pl-1">
                                    <i className="fa-solid fa-note-sticky mr-1 text-slate-300"></i>
                                    {order.note}
                                </p>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Orders;
