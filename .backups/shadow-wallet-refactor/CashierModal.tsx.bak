import React, { useState } from 'react';
import { DeepSeaCurrency } from '../types';
import { X, ShieldCheck, CreditCard, QrCode, ArrowDownRight, ArrowUpRight, Copy, Check, Sparkles, Wallet, RefreshCw } from 'lucide-react';
import { soundManager } from '../services/sound';

interface CashierModalProps {
  onClose: () => void;
  activeCurrency: DeepSeaCurrency;
  onSelectCurrency: (c: DeepSeaCurrency) => void;
  realBalance: number;
  practiceBalance: number;
  isPracticeMode: boolean;
  onTogglePracticeMode: (practice: boolean) => void;
  onDeposit: (amount: number, currency: DeepSeaCurrency) => void;
  onWithdraw: (amount: number, currency: DeepSeaCurrency, address: string) => void;
  onResetPracticeBalance: () => void;
}

export const CashierModal: React.FC<CashierModalProps> = ({
  onClose,
  activeCurrency,
  onSelectCurrency,
  realBalance,
  practiceBalance,
  isPracticeMode,
  onTogglePracticeMode,
  onDeposit,
  onWithdraw,
  onResetPracticeBalance,
}) => {
  const [tab, setTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');
  const [method, setMethod] = useState<'crypto' | 'card' | 'wallet'>('crypto');
  const [amount, setAmount] = useState<number>(1000);
  const [cryptoNetwork, setCryptoNetwork] = useState<'TRC20' | 'ERC20' | 'BEP20' | 'SEGWIT'>('TRC20');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const currencies: { code: DeepSeaCurrency; symbol: string; name: string }[] = [
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'USDT', symbol: '₮', name: 'Tether USD' },
    { code: 'BTC', symbol: '₿', name: 'Bitcoin' },
    { code: 'ETH', symbol: 'Ξ', name: 'Ethereum' }
  ];

  const depositAddresses: Record<string, string> = {
    TRC20: 'TNg7W9DkX3Pq8L2mVb6C4Z1yRt8Es7K4Hq',
    ERC20: '0x71C...b529F47C6287f3A9e',
    BEP20: '0x39E...9D42F17C6418b76A1',
    SEGWIT: 'bc1q9d...k84a37f90q2c5p8w'
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    soundManager.playClick();
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleExecuteDeposit = () => {
    if (amount <= 0) return;
    setIsProcessing(true);
    soundManager.playClick();

    setTimeout(() => {
      onDeposit(amount, activeCurrency);
      setIsProcessing(false);
      setStatusMessage(`Successfully funded ${amount.toLocaleString()} ${activeCurrency} to your Deep Sea Vault!`);
      soundManager.playCashoutChime();
      setTimeout(() => setStatusMessage(null), 4000);
    }, 1200);
  };

  const handleExecuteWithdraw = () => {
    if (amount <= 0 || !withdrawAddress) return;
    if (amount > (isPracticeMode ? practiceBalance : realBalance)) {
      alert('Insufficient available vault balance.');
      return;
    }

    setIsProcessing(true);
    soundManager.playClick();

    setTimeout(() => {
      onWithdraw(amount, activeCurrency, withdrawAddress);
      setIsProcessing(false);
      setStatusMessage(`Withdrawal of ${amount.toLocaleString()} ${activeCurrency} processed successfully!`);
      soundManager.playCashoutChime();
      setTimeout(() => setStatusMessage(null), 4000);
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-cyan-500/30 rounded-[2.5rem] shadow-[0_25px_70px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                Deep Sea Secure Cashier
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Multi-Currency Gateway & Liquidity Bridge
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Currency Switcher & Mode Bar */}
        <div className="px-6 py-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Practice Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTogglePracticeMode(false)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                !isPracticeMode
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Real Stakes
            </button>
            <button
              onClick={() => onTogglePracticeMode(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                isPracticeMode
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Practice Demo</span>
            </button>

            {isPracticeMode && (
              <button
                onClick={onResetPracticeBalance}
                title="Reset Demo Credits to $1,000"
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Active Balance Display */}
          <div className="text-right">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Available Balance
            </div>
            <div className="text-sm font-black text-cyan-300">
              {activeCurrency}{' '}
              {(isPracticeMode ? practiceBalance : realBalance).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        </div>

        {/* Currencies Pills */}
        <div className="px-6 py-2.5 bg-slate-900 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider mr-1 shrink-0">
            Currency:
          </span>
          {currencies.map((c) => (
            <button
              key={c.code}
              onClick={() => {
                soundManager.playClick();
                onSelectCurrency(c.code);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-black shrink-0 transition-all ${
                activeCurrency === c.code
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {c.symbol} {c.code}
            </button>
          ))}
        </div>

        {/* Deposit / Withdraw Sub-Tabs */}
        <div className="p-6 overflow-y-auto no-scrollbar flex-1 space-y-5">
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => {
                soundManager.playClick();
                setTab('deposit');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                tab === 'deposit'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Instant Deposit</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setTab('withdraw');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                tab === 'withdraw'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Secure Withdraw</span>
            </button>
          </div>

          {statusMessage && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-black text-center animate-pulse">
              {statusMessage}
            </div>
          )}

          {/* DEPOSIT TAB */}
          {tab === 'deposit' && (
            <div className="space-y-4">
              {/* Payment Methods */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setMethod('crypto')}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                    method === 'crypto'
                      ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                  <span className="text-[11px] font-black uppercase">Crypto Gateway</span>
                </button>

                <button
                  onClick={() => setMethod('card')}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                    method === 'card'
                      ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-[11px] font-black uppercase">Card / 3D Sec</span>
                </button>

                <button
                  onClick={() => setMethod('wallet')}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                    method === 'wallet'
                      ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Wallet className="w-5 h-5" />
                  <span className="text-[11px] font-black uppercase">EFADO Bridge</span>
                </button>
              </div>

              {/* Amount Selector */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Deposit Amount ({activeCurrency})
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[500, 1000, 5000, 20000].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAmount(val)}
                      className={`py-2 rounded-xl text-xs font-black border transition-all ${
                        amount === val
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      +{val.toLocaleString()}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-2xl py-3 px-4 text-white font-black text-lg focus:outline-none transition-all"
                />
              </div>

              {/* Crypto Method specifics */}
              {method === 'crypto' && (
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="text-slate-400 uppercase">Select Network:</span>
                    <div className="flex gap-1.5">
                      {(['TRC20', 'ERC20', 'BEP20'] as const).map((net) => (
                        <button
                          key={net}
                          onClick={() => setCryptoNetwork(net)}
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            cryptoNetwork === net
                              ? 'bg-cyan-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {net}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">
                      Dedicated Deep Sea Vault Address:
                    </span>
                    <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="font-mono text-xs text-cyan-400 truncate mr-2">
                        {depositAddresses[cryptoNetwork]}
                      </span>
                      <button
                        onClick={() => handleCopy(depositAddresses[cryptoNetwork])}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs shrink-0 flex items-center gap-1"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="text-[10px]">{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                disabled={isProcessing}
                onClick={handleExecuteDeposit}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black rounded-2xl shadow-[0_10px_30px_rgba(6,182,212,0.3)] transform active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isProcessing ? 'CONFIRMING GATEWAY...' : `DEPOSIT ${amount.toLocaleString()} ${activeCurrency}`}</span>
              </button>
            </div>
          )}

          {/* WITHDRAW TAB */}
          {tab === 'withdraw' && (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Withdrawal Amount ({activeCurrency})
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-2xl py-3 px-4 text-white font-black text-lg focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Destination Address / EFADO Account Tag
                </label>
                <input
                  type="text"
                  placeholder="e.g. TRC-20 Address or EFADO Username"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-2xl py-3 px-4 text-white text-xs font-mono focus:outline-none transition-all"
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 font-medium">
                ⚡ Instant Automated Execution: Withdrawals are processed with 0% network slippage directly to your destination account.
              </div>

              <button
                disabled={isProcessing}
                onClick={handleExecuteWithdraw}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-2xl shadow-[0_10px_30px_rgba(245,158,11,0.3)] transform active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>{isProcessing ? 'DISPATCHING PAYOUT...' : `WITHDRAW ${amount.toLocaleString()} ${activeCurrency}`}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
