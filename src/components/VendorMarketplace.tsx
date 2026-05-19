import React, { useState } from 'react';
import { 
  Store, 
  X, 
  ShoppingBag, 
  Tag, 
  CreditCard, 
  Zap, 
  Globe, 
  ShieldCheck, 
  ArrowRight, 
  Search, 
  Plus, 
  Smartphone, 
  Wifi, 
  Gift, 
  CheckCircle2,
  TrendingUp,
  Package,
  Layers,
  ArrowUpRight,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';

interface MarketplaceItem {
  id: string;
  name: string;
  category: 'EXAM_CARDS' | 'GIFT_CARDS' | 'AIRTIME_DATA' | 'OTHER';
  price: number;
  description: string;
  stock: number;
  color: string;
  icon: any;
}

const MARKETPLACE_ITEMS: MarketplaceItem[] = [
  { id: 'waec-int', name: 'WAEC Internal Pin', category: 'EXAM_CARDS', price: 3500, description: 'Direct registration pin for internal WASSCE candidates.', stock: 154, color: 'indigo', icon: Package },
  { id: 'waec-gce', name: 'WAEC GCE Card', category: 'EXAM_CARDS', price: 4000, description: 'Private candidate registration & result checking card.', stock: 89, color: 'rose', icon: Layers },
  { id: 'neco-token', name: 'NECO Result Token', category: 'EXAM_CARDS', price: 1000, description: 'Universal token for NECO result verification.', stock: 500, color: 'emerald', icon: Tag },
  { id: 'jupeb-pin', name: 'JUPEB Entry Pin', category: 'EXAM_CARDS', price: 15000, description: 'Authorized entry PIN for JUPEB foundation programme.', stock: 24, color: 'amber', icon: ShieldCheck },
  { id: 'apple-card', name: 'Apple Gift Card', category: 'GIFT_CARDS', price: 5000, description: '$10 - $500 US Region Apple Store Credit.', stock: 120, color: 'slate', icon: Gift },
  { id: 'mtn-data', name: 'MTN 10GB Data', category: 'AIRTIME_DATA', price: 3000, description: 'High-speed 4G/5G data bundle for MTN Nigeria.', stock: 999, color: 'yellow', icon: Wifi },
  { id: 'airtel-airtime', name: 'Airtel Airtime', category: 'AIRTIME_DATA', price: 500, description: 'Instant airtime top-up for Airtel network.', stock: 1000, color: 'red', icon: Smartphone },
];

export const VendorMarketplace: React.FC<{ user: UserProfile; onClose: () => void }> = ({ user, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{item: MarketplaceItem, qty: number}[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);

  const filteredItems = MARKETPLACE_ITEMS.filter(item => {
    const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const addToCart = (item: MarketplaceItem) => {
    const existing = cart.find(c => c.item.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { item, qty: 1 }]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(c => c.item.id !== id));
  };

  const totalAmount = cart.reduce((acc, curr) => acc + (curr.item.price * curr.qty), 0);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#020617] flex flex-col"
    >
      {/* Tactical Header */}
      <div className="h-24 bg-white/5 border-b border-white/10 flex items-center justify-between px-8 backdrop-blur-2xl">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white italic tracking-tighter uppercase">EFADO Global Exchange</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> Authorized Vendor Hub
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-6 px-6 py-3 bg-white/5 rounded-2xl border border-white/5">
             <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Credits</span>
                <span className="text-sm font-black text-emerald-400 italic">₦{user.depositWallet.toLocaleString()}</span>
             </div>
             <div className="w-px h-8 bg-white/10" />
             <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Reward Node</span>
                <span className="text-sm font-black text-indigo-400 italic">₦{user.cashOutWallet.toLocaleString()}</span>
             </div>
          </div>

          <button 
            onClick={onClose}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all group"
          >
            <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Filtering */}
        <div className="w-80 border-r border-white/5 p-8 overflow-y-auto no-scrollbar">
          <div className="space-y-10">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] px-2">Navigation</h3>
              {[
                { id: 'ALL', label: 'All Protocols', icon: Globe },
                { id: 'EXAM_CARDS', label: 'Academic Pins', icon: Tag },
                { id: 'GIFT_CARDS', label: 'Gift Assets', icon: Gift },
                { id: 'AIRTIME_DATA', label: 'Network Data', icon: Wifi },
                { id: 'VENDORS', label: 'Top Vendors', icon: Users },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${
                    selectedCategory === cat.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-400 hover:bg-white/5'
                  }`}
                >
                  <cat.icon className={`w-5 h-5 ${selectedCategory === cat.id ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`} />
                  <span className="text-xs font-black uppercase tracking-widest">{cat.label}</span>
                </button>
              ))}
            </div>

            <div className="p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-[2rem]">
               <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Market Pulse</span>
               </div>
               <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed italic">
                 Demand for WAEC Internal Pins increased by 24% in the last 6 hours. Stock levels optimizing.
               </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-y-auto no-scrollbar">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">Available Assets</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Operational Exchange Nodes</p>
              </div>
              
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="text"
                  placeholder="Search assets, pins, or vendors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none focus:border-indigo-500 transition-all shadow-2xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredItems.map((item, idx) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative bg-[#0B1120] border border-white/5 rounded-[2.5rem] p-8 hover:border-indigo-500/30 transition-all"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-600/10 transition-all pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-8">
                       <div className={`w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-400 transition-colors`}>
                          <item.icon className="w-7 h-7" />
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Price Unit</p>
                          <p className="text-xl font-black text-white italic">₦{item.price.toLocaleString()}</p>
                       </div>
                    </div>

                    <div className="mb-8">
                       <h3 className="text-lg font-black text-white uppercase tracking-tighter italic mb-2 group-hover:text-indigo-300 transition-colors">{item.name}</h3>
                       <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">{item.description}</p>
                    </div>

                    <div className="mt-auto space-y-6">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.stock} Units Stocked</span>
                          </div>
                          <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Verified Vendor</span>
                       </div>

                       <button 
                         onClick={() => addToCart(item)}
                         className="w-full py-4 bg-white/5 hover:bg-white text-slate-400 hover:text-slate-950 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-2 group/btn"
                       >
                         <Plus className="w-4 h-4 group-hover/btn:rotate-90 transition-transform" /> Purchase Asset
                       </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Checkout/Cart */}
        <div className="w-96 border-l border-white/5 p-8 flex flex-col bg-white/[0.01]">
          <div className="mb-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Protocol Cart</h3>
            </div>
            <span className="px-3 py-1 bg-indigo-600 rounded-full text-[10px] font-black text-white">{cart.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 mb-8">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                  <Smartphone className="w-8 h-8 text-slate-700" />
                </div>
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Cart Vacant</h4>
                <p className="text-[9px] text-slate-600 font-bold uppercase italic">Select assets from the exchange to initiate checkout.</p>
              </div>
            ) : (
              cart.map((c) => (
                <div key={c.item.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400">
                    <c.item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-white uppercase tracking-tighter truncate">{c.item.name}</p>
                    <p className="text-[10px] font-black text-indigo-400 italic">₦{c.item.price.toLocaleString()} x {c.qty}</p>
                  </div>
                  <button 
                    onClick={() => removeFromCart(c.item.id)}
                    className="p-2 opacity-0 group-hover:opacity-100 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="space-y-6 pt-6 border-t border-white/5">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-500">Payload Total</span>
                <span className="text-white">₦{totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-500">Network Fee</span>
                <span className="text-emerald-500">₦0.00 (Zero Fee)</span>
              </div>
              <div className="h-px bg-white/10 my-4" />
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategic Grand Total</span>
                <span className="text-2xl font-black text-white italic">₦{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <button 
              disabled={cart.length === 0}
              onClick={() => setShowCheckout(true)}
              className="w-full py-5 bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white rounded-[1.5rem] font-black uppercase tracking-[0.25em] text-[10px] shadow-2xl shadow-indigo-500/30 hover:bg-indigo-500 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              Authorize Exchange <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
         {showCheckout && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9, y: 20 }}
                 className="w-full max-w-xl bg-white rounded-[3rem] p-12 shadow-2xl relative overflow-hidden text-slate-950"
               >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />
                  
                  <div className="relative z-10">
                     <div className="w-16 h-16 bg-slate-950 rounded-3xl flex items-center justify-center text-white shadow-2xl mb-8">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                     </div>
                     <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-2">Final Clearance</h2>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10">Transaction protocol ready for deployment</p>

                     <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-4 mb-10">
                        <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-400">
                           <span>Account Balance</span>
                           <span className="text-slate-950">₦{user.depositWallet.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-400 border-t border-slate-200 pt-4">
                           <span>Exchange Net</span>
                           <span className="text-rose-600">-₦{totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="h-0.5 bg-slate-200 w-full" />
                        <div className="flex justify-between items-center text-sm font-black uppercase tracking-widest">
                           <span>Tactical Balance</span>
                           <span className="text-indigo-600">₦{(user.depositWallet - totalAmount).toLocaleString()}</span>
                        </div>
                     </div>

                     <div className="flex gap-4">
                        <button 
                          onClick={() => setShowCheckout(false)}
                          className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                        >
                          Abort
                        </button>
                        <button 
                          onClick={() => {
                            // Logic for successful exchange
                            alert(`SUCCESS: Assets deployed to terminal. Operation ID: EFX-${Math.random().toString(36).substring(7).toUpperCase()}`);
                            setShowCheckout(false);
                            setCart([]);
                            onClose();
                          }}
                          className="flex-3 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-indigo-100 hover:bg-indigo-500 transition-all hover:scale-[1.02] active:scale-95"
                        >
                          Confirm Tactical Purchase
                        </button>
                     </div>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </motion.div>
  );
};
