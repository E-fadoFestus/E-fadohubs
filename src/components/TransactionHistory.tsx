import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  FileText, 
  Download,
  Calendar,
  Filter,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { db, collection, query, where, orderBy, onSnapshot } from '../firebase';
import { Transaction, UserProfile } from '../types';
import { useCurrency } from '../lib/CurrencyContext';
import { StrategicReceipt } from './StrategicReceipt';

interface TransactionHistoryProps {
  user: UserProfile;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ user }) => {
  const { formatPrice } = useCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PAYMENT' | 'DEPOSIT' | 'WITHDRAWAL'>('ALL');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      setTransactions(txs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredTxs = transactions.filter(tx => {
    if (filter === 'ALL') return true;
    return tx.type.toUpperCase() === filter;
  });

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
            <History className="w-8 h-8 text-amber-500" /> Transaction Intel
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Sovereign Ledger History</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-2xl border border-white/5">
          {(['ALL', 'PAYMENT', 'DEPOSIT', 'WITHDRAWAL'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === f ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Accessing Ledger...</p>
        </div>
      ) : filteredTxs.length === 0 ? (
        <div className="p-20 text-center glass-card-ultra rounded-[2.5rem] border border-dashed border-white/10">
          <History className="w-16 h-16 text-slate-800 mx-auto mb-6 opacity-20" />
          <p className="text-slate-500 font-bold uppercase tracking-tighter">No transactions recorded in the neural grid.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredTxs.map((tx) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-all rounded-[1.5rem]" />
                <div className="relative glass-card-ultra p-6 rounded-[1.5rem] border border-white/5 flex items-center justify-between gap-6 hover:translate-x-2 transition-all">
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                      tx.type === 'deposit' ? 'bg-emerald-500/20 text-emerald-400' :
                      tx.type === 'withdrawal' ? 'bg-rose-500/20 text-rose-400' :
                      'bg-indigo-500/20 text-indigo-400'
                    }`}>
                      {tx.type === 'deposit' ? <ArrowDownLeft className="w-6 h-6" /> :
                       tx.type === 'withdrawal' ? <ArrowUpRight className="w-6 h-6" /> :
                       <CreditCard className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-lg font-black text-white uppercase tracking-tighter italic">
                          {tx.purpose || tx.description || 'Verified Operation'}
                        </h4>
                        {tx.hub && (
                          <span className="px-2 py-0.5 bg-white/5 text-[8px] font-black text-slate-500 rounded border border-white/5 uppercase">
                            {tx.hub}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {tx.timestamp?.toDate ? tx.timestamp.toDate().toLocaleDateString() : 'Recent'}</span>
                        <span className="font-mono opacity-50">Ref: {tx.reference}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className={`text-2xl font-black font-display ${
                        tx.type === 'deposit' || tx.type === 'game_win' ? 'text-emerald-400' : 'text-white'
                      }`}>
                        {tx.type === 'deposit' || tx.type === 'game_win' ? '+' : '-'}{formatPrice(tx.amount)}
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Secured</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setSelectedTx(tx)}
                      className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-amber-500 transition-all border border-white/5 group/btn"
                    >
                      <Download className="w-5 h-5 group-hover/btn:scale-110 transition-all" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Global Security Disclaimer */}
      <div className="p-8 bg-amber-500/5 rounded-[2rem] border border-amber-500/10 flex items-center gap-6">
        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/20">
          <Zap className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1 italic">Ledger Integrity Protocol</h4>
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase tracking-tighter">
            Every entry in the EFADO ledger is encrypted and mirrored across three verification nodes. Strategic receipts are generated automatically to provide sovereign proof of equity.
          </p>
        </div>
      </div>

      {/* Receipt Modal */}
      <AnimatePresence>
        {selectedTx && (
          <StrategicReceipt 
            transaction={selectedTx}
            userEmail={user.email}
            onClose={() => setSelectedTx(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
