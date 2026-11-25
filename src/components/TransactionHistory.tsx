import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  History,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Download,
  Calendar,
  Filter,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  FileText,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { auth, db, collection, query, where, orderBy, onSnapshot } from '../firebase';
import { Transaction, UserProfile } from '../types';
import { StrategicReceipt } from './StrategicReceipt';
import { ACTIVE_WALLET_CURRENCIES, formatCurrencyAmount } from '../constants/walletCurrencies';

interface TransactionHistoryProps {
  user: UserProfile;
  onFundAccount?: () => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ user, onFundAccount }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PAYMENT' | 'DEPOSIT' | 'WITHDRAWAL'>('ALL');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM'>('ALL');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterCurrency, setFilterCurrency] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [expandedTxIds, setExpandedTxIds] = useState<Record<string, boolean>>({});
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [reconciliation, setReconciliation] = useState<{
    byCurrency: Record<
      string,
      {
        inflows: number;
        outflows: number;
        fees: number;
        ledgerNet: number;
        storedBalance: number;
        delta: number;
        matches: boolean;
      }
    >;
    allMatched: boolean;
  } | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedTxIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const fetchReconciliation = async () => {
      try {
        const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
        if (!token) return;
        const r = await fetch('/api/wallet/history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await r.json().catch(() => ({}));
        if (active && data?.success) {
          if (data.reconciliation) setReconciliation(data.reconciliation);
          if (Array.isArray(data.transactions) && data.transactions.length > 0) {
            setTransactions((prev) => (prev.length === 0 ? data.transactions : prev));
          }
        }
      } catch {
        // Silent fallback
      }
    };

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!active) return;
        const txs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data()
        })) as Transaction[];
        setTransactions(txs);
        setLoading(false);
        void fetchReconciliation();
      },
      async () => {
        // Fallback to authenticated server history endpoint if composite index or rule misses
        try {
          await fetchReconciliation();
        } finally {
          if (active) setLoading(false);
        }
      }
    );

    void fetchReconciliation();

    return () => {
      active = false;
      unsubscribe();
    };
  }, [user?.uid]);

  const applyDatePreset = (preset: 'ALL' | 'TODAY' | 'WEEK' | 'MONTH') => {
    setDatePreset(preset);
    const now = new Date();
    const toStr = now.toISOString().slice(0, 10);
    if (preset === 'ALL') {
      setFilterStartDate('');
      setFilterEndDate('');
    } else if (preset === 'TODAY') {
      setFilterStartDate(toStr);
      setFilterEndDate(toStr);
    } else if (preset === 'WEEK') {
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      setFilterStartDate(weekAgo.toISOString().slice(0, 10));
      setFilterEndDate(toStr);
    } else if (preset === 'MONTH') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      setFilterStartDate(monthStart.toISOString().slice(0, 10));
      setFilterEndDate(toStr);
    }
    setCurrentPage(1);
  };

  const getTxDate = (tx: Transaction): Date => {
    if (typeof (tx as any)?.createdAtIso === 'string') return new Date((tx as any).createdAtIso);
    if (tx.timestamp?.toDate) return tx.timestamp.toDate();
    if (typeof tx.timestamp?.seconds === 'number') return new Date(tx.timestamp.seconds * 1000);
    return new Date();
  };

  const filteredTxs = transactions.filter((tx) => {
    const typeUpper = String(tx.type || '').toUpperCase();
    if (filter !== 'ALL') {
      if (filter === 'PAYMENT') {
        if (!['PAYMENT', 'GAME_BET', 'SWAP'].includes(typeUpper)) return false;
      } else if (filter === 'DEPOSIT') {
        if (!['DEPOSIT', 'REWARD', 'GAME_WIN'].includes(typeUpper)) return false;
      } else if (typeUpper !== filter) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        (tx.type && tx.type.toLowerCase().includes(q)) ||
        (tx.purpose && tx.purpose.toLowerCase().includes(q)) ||
        (tx.description && tx.description.toLowerCase().includes(q)) ||
        (tx.reference && tx.reference.toLowerCase().includes(q)) ||
        (tx.status && tx.status.toLowerCase().includes(q)) ||
        (tx.amount && String(tx.amount).includes(q));
      if (!match) return false;
    }

    if (filterCurrency !== 'ALL') {
      if (String(tx.currency || 'NGN').toUpperCase() !== filterCurrency) return false;
    }

    if (filterStatus !== 'ALL') {
      const st = String(tx.status || '').toLowerCase();
      if (filterStatus === 'completed') {
        if (st !== 'completed' && st !== 'success') return false;
      } else if (st !== filterStatus.toLowerCase()) {
        return false;
      }
    }

    const txDate = getTxDate(tx);
    if (filterStartDate) {
      const start = new Date(filterStartDate);
      start.setHours(0, 0, 0, 0);
      if (txDate < start) return false;
    }
    if (filterEndDate) {
      const end = new Date(filterEndDate);
      end.setHours(23, 59, 59, 999);
      if (txDate > end) return false;
    }

    return true;
  });

  const handleDownloadStatement = async () => {
    setDownloadingPdf(true);
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
      const params = new URLSearchParams();
      if (filterCurrency !== 'ALL') params.set('currency', filterCurrency);
      if (filterStartDate) params.set('from', filterStartDate);
      if (filterEndDate) params.set('to', filterEndDate);

      const resp = await fetch(`/api/wallet/statement.pdf?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!resp.ok) throw new Error('Could not download PDF statement');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `EFADO-Statement-${filterCurrency === 'ALL' ? 'NGN' : filterCurrency}-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Statement download error:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredTxs.length / 15));
  const activePage = Math.min(currentPage, totalPages);
  const startIdx = (activePage - 1) * 15;
  const paginatedTxs = filteredTxs.slice(startIdx, startIdx + 15);

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 m-0 flex items-center gap-2">
            <History className="w-5 h-5 text-[#7C3AED]" />
            <span>Complete Account Activity</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5 mb-0 max-w-none">
            Track deposits, payouts, swaps, and receipts
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadStatement}
          disabled={downloadingPdf}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#7C3AED] hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-60"
        >
          {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span>{downloadingPdf ? 'Generating PDF...' : 'Download Statement (PDF)'}</span>
        </button>
      </div>

      {/* History & Balance Verification Summary */}
      {reconciliation?.byCurrency?.NGN && (
        <div
          className={`rounded-2xl p-4 border shadow-sm flex flex-wrap items-center justify-between gap-3 ${
            reconciliation.allMatched
              ? 'bg-emerald-50/70 border-emerald-200'
              : 'bg-purple-50/70 border-purple-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#16A34A] text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-extrabold text-slate-900">
                {reconciliation.allMatched ? 'History & Balance Matched' : 'Account Balance Summary'}
              </div>
              <div className="text-[11px] font-semibold text-slate-600">
                Money In:{' '}
                <span className="font-bold text-[#16A34A] tabular-nums">
                  {formatCurrencyAmount(reconciliation.byCurrency.NGN.inflows, 'NGN')}
                </span>{' '}
                • Money Out &amp; Fees:{' '}
                <span className="font-bold text-[#DC2626] tabular-nums">
                  {formatCurrencyAmount(reconciliation.byCurrency.NGN.outflows, 'NGN')}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase text-slate-500">Current Balance</div>
            <div className="text-sm font-extrabold text-slate-900 tabular-nums">
              {formatCurrencyAmount(reconciliation.byCurrency.NGN.storedBalance, 'NGN')}
            </div>
          </div>
        </div>
      )}

      {/* Tabs + Search + Advanced */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-purple-50 p-1 rounded-xl border border-purple-100">
          {(['ALL', 'PAYMENT', 'DEPOSIT', 'WITHDRAWAL'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setFilter(f);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                filter === f ? 'bg-[#7C3AED] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-52">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search reference or title..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <button
            type="button"
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className={`px-3 py-2 border rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              isFilterExpanded
                ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                : 'bg-white text-slate-700 border-slate-200 hover:border-[#7C3AED]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>ADVANCED</span>
            {isFilterExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {isFilterExpanded && (
        <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'ALL', label: 'All Time' },
                { id: 'TODAY', label: 'Today' },
                { id: 'WEEK', label: 'This Week' },
                { id: 'MONTH', label: 'This Month' }
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyDatePreset(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                  datePreset === p.id
                    ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">From Date</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => {
                  setDatePreset('CUSTOM');
                  setFilterStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">To Date</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => {
                  setDatePreset('CUSTOM');
                  setFilterEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Currency</label>
              <select
                value={filterCurrency}
                onChange={(e) => {
                  setFilterCurrency(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
              >
                <option value="ALL">All Currencies</option>
                {ACTIVE_WALLET_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
              >
                <option value="ALL">All Statuses</option>
                <option value="completed">Success</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* List / Empty State */}
      {loading ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-purple-100">
          <Loader2 className="w-8 h-8 text-[#7C3AED] animate-spin mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-500 mb-0 max-w-none">Loading activity...</p>
        </div>
      ) : filteredTxs.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-purple-100 shadow-sm space-y-3">
          <div className="w-14 h-14 bg-purple-50 text-[#7C3AED] rounded-2xl flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-slate-900 m-0">No transactions yet</h4>
          <p className="text-xs text-slate-500 font-medium mb-0 max-w-sm mx-auto">
            Your deposits, withdrawals, and currency swaps will appear here once you make your first transfer.
          </p>
          {onFundAccount && (
            <button
              type="button"
              onClick={onFundAccount}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7C3AED] hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              <span>Fund Your Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedTxs.map((tx, idx) => {
            const uniqueId = tx.id || tx.reference || String(idx);
            const isExpanded = !!expandedTxIds[uniqueId];
            const isMoneyIn = tx.type === 'deposit' || tx.type === 'reward' || tx.type === 'game_win';
            const statusStr = String(tx.status || 'completed').toLowerCase();
            const statusLabel = statusStr === 'completed' || statusStr === 'success' ? 'SUCCESS' : statusStr.toUpperCase();
            const statusStyle =
              statusLabel === 'SUCCESS'
                ? 'bg-emerald-50 text-[#16A34A] border-emerald-200'
                : statusLabel === 'FAILED'
                  ? 'bg-red-50 text-[#DC2626] border-red-200'
                  : 'bg-purple-50 text-[#7C3AED] border-purple-200';
            const txDate = getTxDate(tx);

            return (
              <motion.div
                key={`${uniqueId}-${idx}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
              >
                <div
                  onClick={() => toggleExpand(uniqueId)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-purple-50/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isMoneyIn
                          ? 'bg-emerald-50 text-[#16A34A]'
                          : tx.type === 'withdrawal'
                            ? 'bg-red-50 text-[#DC2626]'
                            : 'bg-purple-50 text-[#7C3AED]'
                      }`}
                    >
                      {isMoneyIn ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : tx.type === 'withdrawal' ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <CreditCard className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-900 m-0 truncate">
                        {tx.purpose || tx.description || tx.type || 'Transaction'}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#7C3AED]" />
                          {txDate.toLocaleDateString()} • {txDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="font-mono text-slate-400 truncate max-w-[140px]">
                          {tx.reference || uniqueId}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <p
                        className={`text-sm font-bold tabular-nums mb-0 max-w-none ${
                          isMoneyIn ? 'text-[#16A34A]' : 'text-[#DC2626]'
                        }`}
                      >
                        {isMoneyIn ? '+' : '-'}
                        {formatCurrencyAmount(Number(tx.amount || 0), tx.currency || 'NGN')}
                      </p>
                      {tx.type === 'withdrawal' && Number((tx as any).fee || 0) > 0 && (
                        <div className="text-[10px] font-semibold text-slate-500 tabular-nums">
                          + {formatCurrencyAmount(Number((tx as any).fee || 0), tx.currency || 'NGN')} fee
                        </div>
                      )}
                      <span
                        className={`inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusStyle}`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTx(tx);
                      }}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-[#7C3AED] text-[#7C3AED] hover:text-white rounded-xl text-xs font-bold border border-purple-100 transition-colors shrink-0"
                    >
                      View Receipt
                    </button>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-xs text-slate-600 space-y-1.5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 block">Reference ID</span>
                          <span className="font-mono font-bold text-slate-900 break-all">{tx.reference || uniqueId}</span>
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 block">Method</span>
                          <span className="font-bold text-slate-900">{tx.method || 'EFADO Wallet'}</span>
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 block">Security</span>
                          <span className="font-bold text-[#16A34A] flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Protected by 256-bit encryption
                          </span>
                        </div>
                      </div>
                      {tx.description && (
                        <p className="text-xs text-slate-600 pt-1 mb-0 max-w-none">{tx.description}</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {filteredTxs.length > 15 && (
        <div className="flex items-center justify-between bg-white border border-purple-100 rounded-2xl px-4 py-3">
          <span className="text-xs font-semibold text-slate-500">
            Page {activePage} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={activePage === 1}
              className="p-2 border border-slate-200 rounded-xl text-slate-600 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={activePage === totalPages}
              className="p-2 border border-slate-200 rounded-xl text-slate-600 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
