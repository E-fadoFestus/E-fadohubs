import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  HelpCircle, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Check, 
  Building2, 
  Globe, 
  ArrowUpRight, 
  Zap, 
  CreditCard, 
  Coins, 
  Lock, 
  AlertCircle,
  FileText
} from 'lucide-react';

interface PaymentGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentGuidelinesModal: React.FC<PaymentGuidelinesModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'deposits' | 'payouts' | 'faq' | 'accounts' | 'activator'>('deposits');

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-slate-900 border-2 border-indigo-500/40 rounded-[2.5rem] shadow-2xl text-white overflow-hidden my-8"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 p-6 md:p-8 border-b border-white/10 flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-[10px] font-black uppercase text-amber-300 tracking-widest flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> OFFICIAL PAYMENT ARCHITECTURE
                </span>
                <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase text-emerald-300 tracking-widest flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% REAL & VERIFIED
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tight font-display">
                EFADO Universal Payment & Payout Guide
              </h2>
              <p className="text-xs text-slate-300 font-medium max-w-2xl leading-relaxed">
                Complete operational breakdown for seamless wallet funding, direct bank transfers, international wire deposits, seller escrow payouts, and CEO instant verification.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-3 bg-slate-800 hover:bg-rose-600/30 hover:text-rose-400 border border-white/10 rounded-2xl text-slate-400 transition-all shrink-0"
              title="Close Guide"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 px-6 pt-4 border-b border-white/10 bg-slate-950/60 overflow-x-auto">
            <button
              onClick={() => setActiveTab('deposits')}
              className={`px-5 py-3 rounded-t-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 shrink-0 ${
                activeTab === 'deposits' 
                  ? 'bg-indigo-600/30 border-indigo-400 text-indigo-300' 
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" /> Direct Bank Deposits (Default)
            </button>
            <button
              onClick={() => setActiveTab('payouts')}
              className={`px-5 py-3 rounded-t-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 shrink-0 ${
                activeTab === 'payouts' 
                  ? 'bg-emerald-600/30 border-emerald-400 text-emerald-300' 
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" /> Withdrawals & Payouts
            </button>
            <button
              onClick={() => setActiveTab('accounts')}
              className={`px-5 py-3 rounded-t-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 shrink-0 ${
                activeTab === 'accounts' 
                  ? 'bg-amber-600/30 border-amber-400 text-amber-300' 
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" /> Corporate Bank List
            </button>
            <button
              onClick={() => setActiveTab('faq')}
              className={`px-5 py-3 rounded-t-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 shrink-0 ${
                activeTab === 'faq' 
                  ? 'bg-purple-600/30 border-purple-400 text-purple-300' 
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <HelpCircle className="w-4 h-4" /> Advisory & FAQ
            </button>
            <button
              onClick={() => setActiveTab('activator')}
              className={`px-5 py-3 rounded-t-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 shrink-0 ${
                activeTab === 'activator' 
                  ? 'bg-orange-600/30 border-orange-400 text-orange-300' 
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Coins className="w-4 h-4 text-orange-400" /> Naira Manual Activator Guide
            </button>
          </div>

          {/* Modal Body Content */}
          <div className="p-6 md:p-8 space-y-6 max-h-[60vh] overflow-y-auto text-left font-sans">
            
            {/* TAB 1: DIRECT BANK DEPOSITS */}
            {activeTab === 'deposits' && (
              <div className="space-y-6">
                <div className="bg-slate-950 p-6 rounded-3xl border border-indigo-500/30 space-y-3">
                  <h3 className="text-base font-black text-indigo-400 uppercase tracking-wide flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                    How Direct Bank Deposit Works (Default Payment Method)
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    Direct Bank Transfer is configured as your <strong>primary default payment option</strong> across the EFADO ecosystem. It allows zero-fee deposits directly to EFADO verified corporate bank accounts via mobile banking apps, USSD codes, or international wire.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950/60 p-5 rounded-2xl border border-white/10 space-y-2">
                    <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">1</span>
                    <h4 className="text-xs font-black uppercase text-white">Select Currency & Deposit Amount</h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Choose NGN for local bank transfers, or USD/GBP/EUR for international domiciliary wire transfers.
                    </p>
                  </div>

                  <div className="bg-slate-950/60 p-5 rounded-2xl border border-white/10 space-y-2">
                    <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">2</span>
                    <h4 className="text-xs font-black uppercase text-amber-300">Copy Unique Transaction Reference</h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      The system auto-generates a unique reference code (e.g. <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 font-mono">EFD7937...</code>). You MUST paste this code into your mobile bank transfer narration/remark box!
                    </p>
                  </div>

                  <div className="bg-slate-950/60 p-5 rounded-2xl border border-white/10 space-y-2">
                    <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">3</span>
                    <h4 className="text-xs font-black uppercase text-white">Transfer Funds to Corporate Account</h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Transfer exact amount to GTBANK PLC Corporate (<code className="text-emerald-400 font-mono">3001964082</code>), OPay (<code className="text-emerald-400 font-mono">8072456836</code>), Access Bank, or UBA.
                    </p>
                  </div>

                  <div className="bg-slate-950/60 p-5 rounded-2xl border border-white/10 space-y-2">
                    <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">4</span>
                    <h4 className="text-xs font-black uppercase text-emerald-400">Upload Receipt & Submit Proof</h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Upload transfer screenshot or receipt. The submission lands in the CEO Command Portal, where bank alerts are confirmed and wallet balance is credited immediately!
                    </p>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-200">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-black uppercase text-amber-300">Switching Payment Gateways:</strong>
                    <p className="mt-0.5">While Direct Bank Deposit is the default, you can seamlessly switch to <strong>Paystack</strong>, <strong>Flutterwave</strong>, or <strong>Crypto/Diaspora</strong> by clicking the alternative tabs on the wallet deposit screen anytime.</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PAYOUTS & WITHDRAWALS */}
            {activeTab === 'payouts' && (
              <div className="space-y-6">
                <div className="bg-slate-950 p-6 rounded-3xl border border-emerald-500/30 space-y-3">
                  <h3 className="text-base font-black text-emerald-400 uppercase tracking-wide flex items-center gap-2">
                    <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                    How Payouts & Cash-Outs Work
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    Earnings from EFADO Marketplace sales, Domain sales, Advertising commissions, Service Gig contracts, or Wallet deposits can be withdrawn at any time directly into your local or international bank account.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-950/80 p-5 rounded-2xl border border-white/10 space-y-3">
                    <h4 className="text-xs font-black text-white uppercase flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-400" />
                      Step-by-step Cash Out Protocol:
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
                      <li>Navigate to <strong>EFADO Wallet &gt; Withdraw Funds</strong> or <strong>Easy Payment Platform &gt; Withdraw</strong>.</li>
                      <li>Select your source wallet (Main Balance, Earnings Balance, or Escrow Vault).</li>
                      <li>Enter the withdrawal amount and select/add your target bank account details (Bank Name, Account Number, Account Name).</li>
                      <li>Enter your 4-digit security transaction PIN to authorize the cash-out.</li>
                      <li>Your request is immediately registered in the live database and queued in the CEO Command Portal for instant bank wire dispatch!</li>
                    </ol>
                  </div>

                  <div className="bg-slate-950/80 p-5 rounded-2xl border border-white/10 space-y-2">
                    <h4 className="text-xs font-black text-emerald-400 uppercase">Payout Processing Times:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                      <div className="p-3 bg-slate-900 rounded-xl border border-white/5">
                        <span className="font-bold text-white block">⚡ Local Nigerian Banks & OPay:</span>
                        Instant to 15 minutes upon CEO dual-clearance authorization.
                      </div>
                      <div className="p-3 bg-slate-900 rounded-xl border border-white/5">
                        <span className="font-bold text-white block">🌐 USD/GBP/EUR Domiciliary Wire:</span>
                        1 to 24 business hours depending on international wire settlement cycles.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CORPORATE BANK ACCOUNTS */}
            {activeTab === 'accounts' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Verified Active Corporate Escrow Bank Accounts
                  </h3>
                  <p className="text-xs text-slate-400">
                    Use these official corporate accounts for direct deposit transfers. Always copy account numbers directly to avoid typographical mistakes.
                  </p>
                </div>

                {/* NGN Accounts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* GTBank NGN */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-amber-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-[9px] font-black uppercase rounded-full border border-amber-500/30">
                        Primary Corporate NGN
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-400">GTBANK PLC</span>
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">EFADO Technology Computer Engineering Training & Services</p>
                      <div className="flex items-center justify-between mt-2 bg-slate-900 p-2.5 rounded-xl border border-white/10">
                        <span className="text-sm font-mono font-black text-emerald-400">3001964082</span>
                        <button
                          onClick={() => handleCopy('3001964082', 'gtb_ngn')}
                          className="px-3 py-1 bg-amber-500 text-slate-950 font-black text-[10px] uppercase rounded-lg hover:bg-amber-400 transition-all flex items-center gap-1"
                        >
                          {copiedKey === 'gtb_ngn' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedKey === 'gtb_ngn' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* OPay NGN */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase rounded-full border border-emerald-500/30">
                        Instant Business MFB
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-400">OPAY DIGITAL MFB</span>
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">EFADO Technology Computer Engineering Training & Services</p>
                      <div className="flex items-center justify-between mt-2 bg-slate-900 p-2.5 rounded-xl border border-white/10">
                        <span className="text-sm font-mono font-black text-emerald-400">8072456836</span>
                        <button
                          onClick={() => handleCopy('8072456836', 'opay_ngn')}
                          className="px-3 py-1 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase rounded-lg hover:bg-emerald-400 transition-all flex items-center gap-1"
                        >
                          {copiedKey === 'opay_ngn' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedKey === 'opay_ngn' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Access Bank NGN */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 text-[9px] font-black uppercase rounded-full">
                        Corporate / Savings NGN
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-400">ACCESS BANK PLC</span>
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">Okhawere Festus Daniel</p>
                      <div className="flex items-center justify-between mt-2 bg-slate-900 p-2.5 rounded-xl border border-white/10">
                        <span className="text-sm font-mono font-black text-emerald-400">0001304979</span>
                        <button
                          onClick={() => handleCopy('0001304979', 'access_ngn')}
                          className="px-3 py-1 bg-slate-800 text-white font-black text-[10px] uppercase rounded-lg hover:bg-slate-700 transition-all flex items-center gap-1"
                        >
                          {copiedKey === 'access_ngn' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedKey === 'access_ngn' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* UBA Bank NGN */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 text-[9px] font-black uppercase rounded-full">
                        Corporate / Savings NGN
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-400">UBA BANK PLC</span>
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">Okhawere Festus Daniel</p>
                      <div className="flex items-center justify-between mt-2 bg-slate-900 p-2.5 rounded-xl border border-white/10">
                        <span className="text-sm font-mono font-black text-emerald-400">2120742200</span>
                        <button
                          onClick={() => handleCopy('2120742200', 'uba_ngn')}
                          className="px-3 py-1 bg-slate-800 text-white font-black text-[10px] uppercase rounded-lg hover:bg-slate-700 transition-all flex items-center gap-1"
                        >
                          {copiedKey === 'uba_ngn' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedKey === 'uba_ngn' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* International Domiciliary Wires */}
                <div className="bg-gradient-to-r from-indigo-950/60 to-slate-950 p-6 rounded-3xl border border-indigo-500/30 space-y-4">
                  <h4 className="text-xs font-black text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-400" /> International Foreign Currency Domiciliary Accounts (USD / GBP / EUR)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-slate-900/90 p-4 rounded-xl border border-white/10 space-y-1.5">
                      <span className="text-[9px] font-black text-indigo-400 uppercase">USD Wire (United States)</span>
                      <p className="font-bold text-white">GTBANK PLC USD</p>
                      <p className="font-mono text-emerald-400 text-xs">3001964109</p>
                      <p className="text-[9px] text-slate-400">SWIFT: <strong className="text-slate-200">GTBIGBLA</strong></p>
                    </div>

                    <div className="bg-slate-900/90 p-4 rounded-xl border border-white/10 space-y-1.5">
                      <span className="text-[9px] font-black text-indigo-400 uppercase">GBP Wire (United Kingdom)</span>
                      <p className="font-bold text-white">GTBANK PLC GBP</p>
                      <p className="font-mono text-emerald-400 text-xs">3001964123</p>
                      <p className="text-[9px] text-slate-400">SWIFT: <strong className="text-slate-200">GTBIGBLA</strong></p>
                    </div>

                    <div className="bg-slate-900/90 p-4 rounded-xl border border-white/10 space-y-1.5">
                      <span className="text-[9px] font-black text-indigo-400 uppercase">EUR Wire (European Union)</span>
                      <p className="font-bold text-white">GTBANK PLC EUR</p>
                      <p className="font-mono text-emerald-400 text-xs">3001964147</p>
                      <p className="text-[9px] text-slate-400">SWIFT: <strong className="text-slate-200">GTBIGBLA</strong></p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: ADVISORY & FAQ */}
            {activeTab === 'faq' && (
              <div className="space-y-6">
                <div className="bg-indigo-950/40 p-6 rounded-3xl border border-indigo-500/30 space-y-2">
                  <h3 className="text-sm font-black text-indigo-300 uppercase">
                    Can Users Start Using Payment & Payout Channels Right Now?
                  </h3>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    <strong>YES, ABSOLUTELY!</strong> The payment system is 100% operational in real-time. Deposits submitted are registered directly to your user account and monitored in real-time by the CEO Command Terminal.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-white tracking-wider">Essential Security & Best Practices Advice:</h4>
                  
                  <div className="space-y-2 text-xs">
                    <div className="p-3.5 bg-slate-950 rounded-2xl border border-white/10 flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block font-bold">1. Always Include Transaction Reference Code</strong>
                        <p className="text-slate-400 mt-0.5">When transferring via mobile banking app, copy the generated reference code and paste it into the <em>Narration / Remarks / Memo</em> field. This ensures zero delay in matching bank alerts.</p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-950 rounded-2xl border border-white/10 flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block font-bold">2. Upload Clear Receipt or Transfer Screenshot</strong>
                        <p className="text-slate-400 mt-0.5">Attaching your debit alert or transfer receipt gives instant proof of payment to the CEO desk during manual review.</p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-950 rounded-2xl border border-white/10 flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block font-bold">3. Verify Your Payout Account Name</strong>
                        <p className="text-slate-400 mt-0.5">When requesting withdrawals, ensure the recipient account name matches your EFADO profile or verified bank name to prevent security holds.</p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-950 rounded-2xl border border-white/10 flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block font-bold">4. Need Instant Support?</strong>
                        <p className="text-slate-400 mt-0.5">You can submit a ticket to the Executive Support Desk or message the CEO directly through the built-in portal messaging anytime.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: NAIRA MANUAL WALLET ACTIVATOR GUIDE */}
            {activeTab === 'activator' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-orange-950/80 via-slate-900 to-slate-950 p-6 rounded-3xl border border-orange-500/40 space-y-3">
                  <h3 className="text-base font-black text-orange-400 uppercase tracking-wide flex items-center gap-2">
                    <Coins className="w-5 h-5 text-orange-400" />
                    How Naira Manual Wallet Activator Works
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    The <strong>Naira Manual Wallet Activator</strong> is a high-speed manual settlement protocol designed for instantly funding your EFADO wallet balance and unlocking game tokens by pairing your direct CEO bank deposit with a unique, encrypted activation code (PIN).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-950/80 p-5 rounded-2xl border border-orange-500/20 space-y-2">
                    <div className="w-7 h-7 rounded-full bg-orange-600 text-white font-black text-xs flex items-center justify-center">1</div>
                    <h4 className="text-xs font-black uppercase text-amber-300">Step 1: Pay to CEO Bank Account</h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Select your preferred corporate bank account (e.g. OPay Business <code className="text-orange-400 font-mono">8072456836</code>, GTBank, UBA, or Access Bank). Copy the account details and make your bank transfer using your mobile banking app.
                    </p>
                  </div>

                  <div className="bg-slate-950/80 p-5 rounded-2xl border border-orange-500/20 space-y-2">
                    <div className="w-7 h-7 rounded-full bg-orange-600 text-white font-black text-xs flex items-center justify-center">2</div>
                    <h4 className="text-xs font-black uppercase text-amber-300">Step 2: Request & Generate PIN</h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Enter the exact amount you transferred (minimum ₦100), your email address, and phone number. Click <strong>"GENERATE ACTIVATION CODE"</strong> to create your unique PIN code (e.g. <code className="text-orange-400 font-mono">EFD-GPIN-849201</code>).
                    </p>
                  </div>

                  <div className="bg-slate-950/80 p-5 rounded-2xl border border-orange-500/20 space-y-2">
                    <div className="w-7 h-7 rounded-full bg-green-600 text-white font-black text-xs flex items-center justify-center">3</div>
                    <h4 className="text-xs font-black uppercase text-emerald-400">Step 3: Verify & Activate Wallet</h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Paste or enter your generated PIN code into the verification box and click <strong>"VERIFY & CREATE WALLET BALANCE"</strong>. Your wallet is updated immediately with the matching funds!
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-white/10 space-y-3">
                  <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Key Operational Rules & Security
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 font-black">•</span>
                      <span><strong>Exact Amount Match:</strong> Ensure the deposit amount transferred matches the amount specified when generating your PIN code.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 font-black">•</span>
                      <span><strong>Code Expiry:</strong> PIN codes remain valid for 2 hours after generation. Activate immediately after making your transfer.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 font-black">•</span>
                      <span><strong>Need Assistance?</strong> If you encounter any transfer delay, reach technical support at <code className="text-amber-300 font-mono">efadofestus@gmail.com</code> with your generated PIN.</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

          </div>

          {/* Footer Action Bar */}
          <div className="p-6 bg-slate-950 border-t border-white/10 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> EFADO SECURE FINANCIAL INFRASTRUCTURE • REAL-TIME FIRESTORE LEDGER
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30"
            >
              Got It, Continue to Payments
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
