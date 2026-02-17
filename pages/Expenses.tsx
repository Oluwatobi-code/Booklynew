
import React, { useState } from 'react';
import { AppState, Expense } from '../types';

interface ExpensesProps {
    state: AppState;
    onAddExpense: (expense: Expense) => void;
}

const CATEGORIES = [
    { name: 'Rent', icon: 'fa-house', color: 'bg-blue-50 text-blue-600' },
    { name: 'Utilities', icon: 'fa-bolt', color: 'bg-amber-50 text-amber-600' },
    { name: 'Transport', icon: 'fa-truck', color: 'bg-purple-50 text-purple-600' },
    { name: 'Marketing', icon: 'fa-bullhorn', color: 'bg-pink-50 text-pink-600' },
    { name: 'Salaries', icon: 'fa-users', color: 'bg-teal-50 text-teal-600' },
    { name: 'Data', icon: 'fa-wifi', color: 'bg-indigo-50 text-indigo-600' },
    { name: 'Inventory', icon: 'fa-box', color: 'bg-emerald-50 text-emerald-600' },
    { name: 'Other', icon: 'fa-ellipsis', color: 'bg-slate-100 text-slate-500' }
];

const getCategoryMeta = (cat: string) => CATEGORIES.find(c => c.name === cat) || CATEGORIES[CATEGORIES.length - 1];

const Expenses: React.FC<ExpensesProps> = ({ state, onAddExpense }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newExpense, setNewExpense] = useState<Partial<Expense>>({ category: 'Other', amount: 0, note: '' });

    const totalExpenses = state.expenses.reduce((s, e) => s + e.amount, 0);
    const totalRevenue = state.orders.reduce((s, o) => s + o.total, 0);
    const trueProfit = totalRevenue - totalExpenses;

    // Expenses by category
    const byCategory = state.expenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
    }, {} as Record<string, number>);

    const categoryEntries = Object.entries(byCategory).sort((a, b) => (b[1] as number) - (a[1] as number)) as [string, number][];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newExpense.amount! > 0) {
            onAddExpense({
                id: Date.now().toString(),
                category: newExpense.category || 'Other',
                amount: newExpense.amount || 0,
                date: new Date().toISOString(),
                note: newExpense.note
            });
            setIsAdding(false);
            setNewExpense({ category: 'Other', amount: 0, note: '' });
        }
    };

    const sortedExpenses = [...state.expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Expenses</h2>
                    <p className="text-slate-500 text-xs font-medium">Track spending for true profit</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="bg-teal-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-teal-200 hover:bg-teal-600 transition-colors"
                >
                    <i className="fa-solid fa-plus mr-2"></i>Log Expense
                </button>
            </div>

            {/* Profit Overview */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-900 rounded-2xl p-4 text-white text-center col-span-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">True Profit</p>
                    <p className={`text-2xl font-black ${trueProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {state.profile.currency}{trueProfit.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">Revenue ({state.profile.currency}{totalRevenue.toLocaleString()}) − Expenses ({state.profile.currency}{totalExpenses.toLocaleString()})</p>
                </div>
            </div>

            {/* Expense Breakdown by Category */}
            {categoryEntries.length > 0 && (
                <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm space-y-3">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">Breakdown by Category</h3>
                    <div className="space-y-2">
                        {categoryEntries.map(([cat, amount]: [string, number]) => {
                            const meta = getCategoryMeta(cat);
                            const pct = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
                            return (
                                <div key={cat} className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${meta.color}`}>
                                        <i className={`fa-solid ${meta.icon}`}></i>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-bold text-slate-700">{cat}</span>
                                            <span className="font-black text-slate-900">{state.profile.currency}{amount.toLocaleString()} <span className="text-slate-400 font-medium">({pct}%)</span></span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-teal-500 rounded-full" style={{ width: `${pct}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Add Expense Form */}
            {isAdding && (
                <div className="bg-white p-5 rounded-[24px] shadow-lg border border-teal-100 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">New Expense</h3>
                        <button onClick={() => setIsAdding(false)} className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</label>
                                <input
                                    type="number" required
                                    value={newExpense.amount || ''}
                                    onChange={e => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) })}
                                    className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                                <select
                                    value={newExpense.category}
                                    onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                                    className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                                >
                                    {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Note (Optional)</label>
                            <input
                                type="text"
                                value={newExpense.note}
                                onChange={e => setNewExpense({ ...newExpense, note: e.target.value })}
                                className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                                placeholder="What was this for?"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">Cancel</button>
                            <button type="submit" className="flex-1 py-3 rounded-xl bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-200">Save Expense</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Expense History */}
            <div className="space-y-2">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide px-1">History</h3>
                {sortedExpenses.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300 mb-3">
                            <i className="fa-solid fa-receipt text-2xl"></i>
                        </div>
                        <p className="text-slate-400 text-sm font-medium">No expenses logged yet</p>
                        <p className="text-xs text-slate-300 mt-1">Log rent, transport, data costs, etc.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden">
                        {sortedExpenses.map((expense, i) => {
                            const meta = getCategoryMeta(expense.category);
                            return (
                                <div key={expense.id} className={`p-4 flex justify-between items-center hover:bg-slate-50 transition-colors ${i !== sortedExpenses.length - 1 ? 'border-b border-slate-50' : ''}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm ${meta.color}`}>
                                            <i className={`fa-solid ${meta.icon}`}></i>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{expense.category}</p>
                                            <p className="text-[10px] text-slate-400">
                                                {expense.note || 'No description'} • {new Date(expense.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="font-black text-red-500 text-sm">-{state.profile.currency}{expense.amount.toLocaleString()}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Expenses;
