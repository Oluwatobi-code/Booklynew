
import React, { useState } from 'react';
import { AppState, Product } from '../types';

interface InventoryProps {
  state: AppState;
  onUpdateProducts: (products: Product[]) => void;
}

const Inventory: React.FC<InventoryProps> = ({ state, onUpdateProducts }) => {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const lowStockProducts = state.products.filter(p => p.stock <= p.lowStockThreshold);
  const totalCostValue = state.products.reduce((s, p) => s + (p.costPrice * p.stock), 0);
  const totalRetailValue = state.products.reduce((s, p) => s + (p.sellingPrice * p.stock), 0);

  const profitMargin = (p: Product) => {
    if (p.costPrice === 0) return 0;
    return Math.round(((p.sellingPrice - p.costPrice) / p.costPrice) * 100);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const existingIndex = state.products.findIndex(p => p.id === editingProduct.id);
    let newProducts;
    if (existingIndex >= 0) {
      newProducts = state.products.map(p => p.id === editingProduct.id ? editingProduct : p);
    } else {
      newProducts = [editingProduct, ...state.products];
    }
    onUpdateProducts(newProducts);
    setEditingProduct(null);
  };

  const deleteProduct = (id: string) => {
    if (confirm('Delete this product?')) {
      onUpdateProducts(state.products.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Inventory</h2>
          <p className="text-slate-500 text-xs font-medium">Manage products & stock</p>
        </div>
        <button
          onClick={() => setEditingProduct({ id: Date.now().toString(), name: '', costPrice: 0, sellingPrice: 0, stock: 0, lowStockThreshold: 5 })}
          className="bg-teal-500 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-teal-200 hover:scale-105 transition-transform"
        >
          <i className="fa-solid fa-plus"></i>
        </button>
      </div>

      {/* Inventory Value Summary */}
      <div className="bg-slate-900 rounded-[24px] p-5 text-white space-y-3 shadow-xl">
        <h3 className="font-bold flex items-center gap-2 uppercase text-[10px] tracking-widest text-teal-300">
          <i className="fa-solid fa-chart-pie"></i>
          Inventory Value
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Total Cost</p>
            <p className="text-xl font-black">{state.profile.currency}{totalCostValue.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Retail Value</p>
            <p className="text-xl font-black text-emerald-400">{state.profile.currency}{totalRetailValue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center text-xs">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div>
              <p className="text-xs font-black text-red-700 uppercase tracking-wide">Low Stock Alert</p>
              <p className="text-[10px] text-red-500">{lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} below threshold</p>
            </div>
          </div>
          <div className="space-y-2">
            {lowStockProducts.map(p => (
              <div key={p.id} className="flex justify-between items-center bg-white rounded-xl px-3 py-2">
                <span className="text-xs font-bold text-slate-800">{p.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-red-600">{p.stock} left</span>
                  <span className="text-[9px] text-slate-400">(min: {p.lowStockThreshold})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product List */}
      <div className="space-y-3">
        {state.products.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto flex items-center justify-center">
              <i className="fa-solid fa-box-open text-2xl text-slate-300"></i>
            </div>
            <p className="text-sm font-bold text-slate-400">No products yet</p>
            <p className="text-xs text-slate-300">Tap + to add your first product</p>
          </div>
        ) : (
          state.products.map(product => {
            const margin = profitMargin(product);
            const isLowStock = product.stock <= product.lowStockThreshold;
            return (
              <div key={product.id} className={`bg-white rounded-[20px] p-4 border shadow-sm space-y-3 relative ${isLowStock ? 'border-red-200' : 'border-slate-100'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shadow-inner ${isLowStock ? 'bg-red-50 text-red-500' : 'bg-teal-50 text-teal-600'}`}>
                      <i className="fa-solid fa-box-open"></i>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{product.name}</h3>
                      <div className="flex gap-2 items-center mt-0.5">
                        <span className="text-[10px] text-slate-400 font-medium">Cost: {state.profile.currency}{product.costPrice.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-700 font-bold">Sell: {state.profile.currency}{product.sellingPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => setEditingProduct(product)} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-xs hover:bg-slate-200">
                      <i className="fa-solid fa-pen"></i>
                    </button>
                    <button onClick={() => deleteProduct(product.id)} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center text-xs hover:bg-red-100 hover:text-red-500">
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>

                {/* Bottom Row: Stock + Margin */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Stock</span>
                      <span className={`text-lg font-black ${isLowStock ? 'text-red-500' : 'text-slate-900'}`}>
                        {product.stock}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Margin</span>
                      <span className={`text-lg font-black ${margin >= 50 ? 'text-emerald-500' : margin >= 20 ? 'text-amber-500' : 'text-red-500'}`}>
                        {margin}%
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const amt = prompt(`Add stock for ${product.name}:`);
                      if (amt && !isNaN(parseInt(amt))) {
                        onUpdateProducts(state.products.map(p => p.id === product.id ? { ...p, stock: p.stock + parseInt(amt) } : p));
                      }
                    }}
                    className="bg-teal-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-teal-200 hover:bg-teal-600 transition-all"
                  >
                    + Restock
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-[400px] rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col p-6 space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                {state.products.some(p => p.id === editingProduct.id) ? 'Edit Product' : 'New Product'}
              </h3>
              <button type="button" onClick={() => setEditingProduct(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Name</label>
                <input type="text" required value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g. Ankara Fabric" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cost Price</label>
                  <input type="number" required value={editingProduct.costPrice || ''} onChange={e => setEditingProduct({ ...editingProduct, costPrice: parseFloat(e.target.value) })} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Selling Price</label>
                  <input type="number" required value={editingProduct.sellingPrice || ''} onChange={e => setEditingProduct({ ...editingProduct, sellingPrice: parseFloat(e.target.value) })} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              {/* Live Margin Preview */}
              {editingProduct.costPrice > 0 && editingProduct.sellingPrice > 0 && (
                <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Profit Margin</span>
                  <span className={`text-sm font-black ${profitMargin(editingProduct) >= 50 ? 'text-emerald-500' : profitMargin(editingProduct) >= 20 ? 'text-amber-500' : 'text-red-500'}`}>
                    {profitMargin(editingProduct)}% ({state.profile.currency}{(editingProduct.sellingPrice - editingProduct.costPrice).toLocaleString()} profit)
                  </span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock Level</label>
                  <input type="number" value={editingProduct.stock} onChange={e => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Low Alert At</label>
                  <input type="number" value={editingProduct.lowStockThreshold} onChange={e => setEditingProduct({ ...editingProduct, lowStockThreshold: parseInt(e.target.value) })} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <button type="submit" className="w-full bg-teal-500 text-white py-4 rounded-xl font-black text-sm shadow-xl shadow-teal-200 hover:bg-teal-600 transition-all active:scale-95">
                Save Product
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
