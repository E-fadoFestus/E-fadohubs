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
  Zap,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowUp
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

  // States for enhanced collapsible search/filtering & pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterSender, setFilterSender] = useState('');
  const [filterReceiver, setFilterReceiver] = useState('');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [highlightedTxId, setHighlightedTxId] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    // 1. Basic Type Filter (ALL, PAYMENT, DEPOSIT, WITHDRAWAL) from tab buttons
    if (filter !== 'ALL') {
      if (tx.type?.toUpperCase() !== filter) return false;
    }

    // 2. Text Search Query matching multiple fields
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const hasMatch = 
        (tx.type && tx.type.toLowerCase().includes(q)) ||
        (tx.purpose && tx.purpose.toLowerCase().includes(q)) ||
        (tx.description && tx.description.toLowerCase().includes(q)) ||
        (tx.reference && tx.reference.toLowerCase().includes(q)) ||
        (tx.hub && tx.hub.toLowerCase().includes(q)) ||
        (tx.status && tx.status.toLowerCase().includes(q)) ||
        (tx.amount && String(tx.amount).includes(q)) ||
        (tx.metadata?.senderName && tx.metadata.senderName.toLowerCase().includes(q)) ||
        (tx.metadata?.receiverName && tx.metadata.receiverName.toLowerCase().includes(q));
      if (!hasMatch) return false;
    }

    // 3. Sender Name Filter
    if (filterSender.trim()) {
      const s = filterSender.toLowerCase();
      const matchSender = 
        (tx.metadata?.senderName && tx.metadata.senderName.toLowerCase().includes(s)) ||
        (tx.purpose && tx.purpose.toLowerCase().includes(s)) ||
        (tx.description && tx.description.toLowerCase().includes(s));
      if (!matchSender) return false;
    }

    // 4. Receiver Name Filter
    if (filterReceiver.trim()) {
      const r = filterReceiver.toLowerCase();
      const matchReceiver = 
        (tx.metadata?.receiverName && tx.metadata.receiverName.toLowerCase().includes(r)) ||
        (tx.purpose && tx.purpose.toLowerCase().includes(r)) ||
        (tx.description && tx.description.toLowerCase().includes(r));
      if (!matchReceiver) return false;
    }

    // 5. Status Filter
    if (filterStatus !== 'ALL') {
      if (tx.status?.toLowerCase() !== filterStatus.toLowerCase()) return false;
    }

    // 6. Min Amount Filter
    if (filterMinAmount) {
      const minAm = parseFloat(filterMinAmount);
      if (!isNaN(minAm) && (tx.amount || 0) < minAm) return false;
    }

    // 7. Max Amount Filter
    if (filterMaxAmount) {
      const maxAm = parseFloat(filterMaxAmount);
      if (!isNaN(maxAm) && (tx.amount || 0) > maxAm) return false;
    }

    // 8. Date Range Filter
    if (filterStartDate) {
      const start = new Date(filterStartDate);
      const txDate = tx.timestamp?.toDate ? tx.timestamp.toDate() : new Date();
      start.setHours(0,0,0,0);
      if (txDate < start) return false;
    }
    if (filterEndDate) {
      const end = new Date(filterEndDate);
      const txDate = tx.timestamp?.toDate ? tx.timestamp.toDate() : new Date();
      end.setHours(23,59,59,999);
      if (txDate > end) return false;
    }

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTxs.length / 20));
  const activePage = Math.min(currentPage, totalPages);
  const startIdx = (activePage - 1) * 20;
  const paginatedTxs = filteredTxs.slice(startIdx, startIdx + 20);

  return (
    <div className="space-y-8 relative">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
            <History className="w-8 h-8 text-amber-500" /> Transaction Intel
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Sovereign Ledger History</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Main quick-tabs */}
          <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-2xl border border-white/5">
            {(['ALL', 'PAYMENT', 'DEPOSIT', 'WITHDRAWAL'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setFilter(f);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === f ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Search Inputs & Toggle Buttons */}
          <div className="flex items-center gap-1.5 ml-auto sm:ml-0 mt-2 sm:mt-0">
            <div className="relative">
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search ledger..."
                className="w-40 sm:w-48 pl-8 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
            <button
              type="button"
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className={`p-2 border rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1 ${
                isFilterExpanded 
                  ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' 
                  : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Advanced</span>
              {isFilterExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Collapsible Filter options */}
      {isFilterExpanded && (
        <div className="p-6 bg-slate-950 border border-white/10 rounded-[2rem] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in animate-duration-300 shadow-2xl">
          {/* Date Picker Input Row */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Start Date</label>
            <input 
              type="date"
              value={filterStartDate}
              onChange={(e) => {
                setFilterStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold inline-block"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider">End Date</label>
            <input 
              type="date"
              value={filterEndDate}
              onChange={(e) => {
                setFilterEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold inline-block"
            />
          </div>

          {/* Senders & Receivers */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Sender Name</label>
            <input 
              type="text"
              placeholder="Filter sender name..."
              value={filterSender}
              onChange={(e) => {
                setFilterSender(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Receiver Name</label>
            <input 
              type="text"
              placeholder="Filter receiver name..."
              value={filterReceiver}
              onChange={(e) => {
                setFilterReceiver(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold"
            />
          </div>

          {/* Min & Max Amount boundaries */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Min Amount</label>
            <input 
              type="number"
              placeholder="Min Price $"
              value={filterMinAmount}
              onChange={(e) => {
                setFilterMinAmount(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Max Amount</label>
            <input 
              type="number"
              placeholder="Max Price $"
              value={filterMaxAmount}
              onChange={(e) => {
                setFilterMaxAmount(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold"
            />
          </div>

          {/* Status Switcher option */}
          <div className="space-y-1 col-span-1 sm:col-span-2">
            <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Secured Status State</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none"
            >
              <option value="ALL">All States</option>
              <option value="completed">Completed Status</option>
              <option value="pending">Pending Status</option>
              <option value="failed">Failed Status</option>
            </select>
          </div>

          {/* Quick Clear Controls */}
          <div className="col-span-1 sm:col-span-2 md:col-span-4 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setFilterStartDate('');
                setFilterEndDate('');
                setFilterSender('');
                setFilterReceiver('');
                setFilterMinAmount('');
                setFilterMaxAmount('');
                setFilterStatus('ALL');
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-amber-500 border border-white/10 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
            >
              Reset Advanced Filter Parameters
            </button>
          </div>
        </div>
      )}

      {/* Select Search Matches Direct Jumper Tray */}
      {searchQuery.trim() && filteredTxs.length > 0 && (
        <div className="p-4 bg-amber-500/5 border border-amber-500/25 rounded-2xl">
          <span className="text-[9px] font-black uppercase text-amber-500 tracking-widest block mb-2">
            🎯 Quick Select Search Results ({filteredTxs.length} Matches Found)
          </span>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto no-scrollbar">
            {filteredTxs.slice(0, 10).map((tx, idx) => {
              const uniqueId = tx.id || String(tx.timestamp?.seconds || idx);
              return (
                <button
                  key={`history-suggestion-${uniqueId}`}
                  type="button"
                  onClick={() => {
                    const indexInFiltered = filteredTxs.findIndex(t => (t.id && t.id === tx.id) || t.timestamp?.seconds === tx.timestamp?.seconds);
                    if (indexInFiltered !== -1) {
                      const pageNum = Math.floor(indexInFiltered / 20) + 1;
                      setCurrentPage(pageNum);
                      setHighlightedTxId(uniqueId);
                      setTimeout(() => {
                        const rowEl = document.getElementById(`tx-row-${uniqueId}`);
                        if (rowEl) {
                          rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }, 150);
                      setTimeout(() => setHighlightedTxId(null), 3500);
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-900 border border-white/10 hover:border-amber-500 rounded-xl text-left text-[10px] font-bold text-slate-300 hover:text-amber-500 flex items-center gap-1.5 transition-all shadow-md max-w-xs truncate"
                >
                  <span className="capitalize text-amber-500">{tx.type.replace('_', ' ')}:</span>
                  <span>{formatPrice(tx.amount)}</span>
                  <span className="text-[8px] text-slate-500 truncate max-w-[80px]">({tx.purpose || tx.id || 'Operation'})</span>
                </button>
              );
            })}
            {filteredTxs.length > 10 && (
              <span className="text-[8.5px] font-bold text-slate-400 self-center leading-none pl-1">
                + {filteredTxs.length - 10} more matches
              </span>
            )}
          </div>
        </div>
      )}

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
        <div className="space-y-4 animate-duration-300 animate-fade-in animate-ease-in-out">
          <AnimatePresence mode="popLayout">
            {paginatedTxs.map((tx, idx) => {
              const uniqueId = tx.id || String(tx.timestamp?.seconds || startIdx + idx);
              const isHighlighted = highlightedTxId === uniqueId;
              return (
                <motion.div
                  key={`${uniqueId}-${idx}`}
                  id={`tx-row-${uniqueId}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`group relative duration-500 rounded-[1.5rem] transition-all ${
                    isHighlighted ? 'ring-4 ring-amber-500 bg-amber-500/10 shadow-2xl scale-[1.01]' : ''
                  }`}
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
                        <div className="flex items-center gap-2 mb-1 col">
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
                          <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">
                            {tx.status || 'Secured'}
                          </span>
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
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination controls for Profile Transactions */}
      {filteredTxs.length > 20 && (
        <div className="flex items-center justify-between bg-slate-900/40 border border-white/5 rounded-2xl px-6 py-4">
          <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
            Showing {startIdx + 1} - {Math.min(startIdx + 20, filteredTxs.length)} of {filteredTxs.length} Operations
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={activePage === 1}
              className="p-2 border border-white/10 bg-slate-950 rounded-xl text-slate-400 disabled:opacity-30 transition-all hover:bg-slate-900"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {Array.from({ length: totalPages }).map((_, pIdx) => {
              const pageNum = pIdx + 1;
              const isCurrent = pageNum === activePage;
              if (totalPages > 5 && Math.abs(pageNum - activePage) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                if (pageNum === 2 || pageNum === totalPages - 1) {
                  return <span key={pageNum} className="px-1 text-xs text-slate-500">...</span>;
                }
                return null;
              }
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 flex items-center justify-center text-[10px] font-black tracking-widest rounded-xl border transition-all ${
                    isCurrent 
                      ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={activePage === totalPages}
              className="p-2 border border-white/10 bg-slate-950 rounded-xl text-slate-400 disabled:opacity-30 transition-all hover:bg-slate-900"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
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

      {/* Scroll to Top helper for Profile Transactions */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-4 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all text-xs flex items-center justify-center align-middle focus:ring-4 focus:ring-amber-500/20 shadow-amber-500/40"
          title="Scroll back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

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
