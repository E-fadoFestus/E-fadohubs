import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  CreditCard, 
  Info, 
  ShieldCheck, 
  AlertCircle, 
  Smartphone, 
  User, 
  Copy, 
  FileText, 
  Check, 
  ArrowRight,
  Wallet,
  Sparkles,
  Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../../types';

interface JambPaymentPortalProps {
  onClose: () => void;
  user: UserProfile;
}

interface SavedEPin {
  epin: string;
  serial: string;
  candidateName: string;
  profileCode: string;
  nin: string;
  examType: string;
  amount: number;
  date: string;
  method: string;
}

export const JambPaymentPortal: React.FC<JambPaymentPortalProps> = ({ onClose, user }) => {
  const [step, setStep] = useState<'details' | 'processing' | 'success'>('details');
  const [examType, setExamType] = useState<'UTME' | 'DIRECT_ENTRY'>('UTME');
  const [nin, setNin] = useState('');
  const [profileCode, setProfileCode] = useState('');
  const [fullName, setFullName] = useState(user.fullName || user.displayName || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'bank_transfer'>('wallet');
  const [bankRef, setBankRef] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulated active e-PINs
  const [generatedEpin, setGeneratedEpin] = useState<SavedEPin | null>(null);

  // Load history
  const [history, setHistory] = useState<SavedEPin[]>(() => {
    try {
      const saved = localStorage.getItem('efado_jamb_payments_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const totalAmount = 5700; // ₦3,500 e-PIN + ₦1,000 text + ₦700 CBT fee + ₦500 network fee

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInitiatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!nin.trim() || nin.length !== 11 || isNaN(Number(nin))) {
      setError('Please enter a valid 11-digit National Identification Number (NIN)');
      return;
    }
    if (!profileCode.trim() || profileCode.length !== 10) {
      setError('Please enter a valid 10-character JAMB Profile Code');
      return;
    }
    if (!fullName.trim()) {
      setError('Candidate full name is required');
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      setError('Please enter a valid mobile phone number');
      return;
    }

    if (paymentMethod === 'wallet' && (user.playerWallet || 0) < totalAmount) {
      setError(`Insufficient funds in your EFADO active wallet. Required: ₦${totalAmount.toLocaleString()}. Your Balance: ₦${(user.playerWallet || 0).toLocaleString()}. Please select "Direct Bank Transfer" or top up your wallet.`);
      return;
    }

    if (paymentMethod === 'bank_transfer' && !bankRef.trim()) {
      setError('Please provide the transaction reference/code of your bank transfer for validation');
      return;
    }

    // Move to processing
    setStep('processing');
    
    // Simulate API callback network delays
    setTimeout(() => {
      const randomEpin = `EPIN-${Math.floor(100000 + Math.random() * 900000)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${examType}`;
      const randomSerial = `SER-${Math.floor(100000000 + Math.random() * 900000000)}`;
      const newEpinRecord: SavedEPin = {
        epin: randomEpin,
        serial: randomSerial,
        candidateName: fullName.toUpperCase(),
        profileCode: profileCode.toUpperCase(),
        nin: nin,
        examType: examType === 'UTME' ? 'JAMB UTME 2026' : 'JAMB DIRECT ENTRY 2026',
        amount: totalAmount,
        date: new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        method: paymentMethod === 'wallet' ? 'EFADO Sovereign Wallet' : 'Direct Bank Vault'
      };

      setGeneratedEpin(newEpinRecord);
      
      const updatedHistory = [newEpinRecord, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('efado_jamb_payments_history', JSON.stringify(updatedHistory));
      
      // Update simulated wallet deduction
      if (paymentMethod === 'wallet') {
        try {
          // If custom balance is stored in parent, trigger update or local simulated persistence
          const currentBal = Number(localStorage.getItem('efado_simulated_balance') || user.playerWallet);
          localStorage.setItem('efado_simulated_balance', String(Math.max(0, currentBal - totalAmount)));
        } catch (err) {
          console.error(err);
        }
      }

      setStep('success');
    }, 4500);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md p-4 md:p-8 flex items-center justify-center overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-4xl bg-slate-900 border border-white/5 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
      >
        
        {/* Decorative corner glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Sidebar / Informational Guide */}
        <div className="w-full md:w-1/3 bg-slate-950/60 p-8 border-b md:border-b-0 md:border-r border-white/5 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-6 border border-indigo-500/20 shadow-md shadow-indigo-500/5">
              <CreditCard className="w-6 h-6" />
            </div>
            
            <h2 className="text-xl font-black text-white uppercase tracking-tight italic mb-3">JAMB e-PIN Portal</h2>
            <p className="text-xs text-slate-400 leading-relaxed font-bold uppercase mb-6 tracking-wide">
              Secure national gateway to generate and buy 2026 JAMB Unified Tertiary Matriculation Examination (UTME) registration pin.
            </p>

            <div className="space-y-4">
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/5">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Pricing Breakdown</span>
                <ul className="space-y-2 text-[10px] font-black text-slate-300 uppercase tracking-wide">
                  <li className="flex justify-between">
                    <span>JAMB e-PIN Code:</span>
                    <span className="text-white">₦3,500</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Official Novel Text:</span>
                    <span className="text-white">₦1,000</span>
                  </li>
                  <li className="flex justify-between">
                    <span>CBT Registration Fee:</span>
                    <span className="text-white">₦700</span>
                  </li>
                  <li className="flex justify-between">
                    <span>EFADO Network Charge:</span>
                    <span className="text-white">₦500</span>
                  </li>
                  <li className="flex justify-between border-t border-white/10 pt-2 text-indigo-300 font-extrabold text-xs">
                    <span>TOTAL REQUIRED:</span>
                    <span className="text-white">₦5,700</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-300 leading-normal font-bold uppercase tracking-tight">
                  Your profile code MUST be tied to your 11-digit NIN. Make sure you have texted "NIN [space] your-NIN" to 55019 before continuing.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 hidden md:block">
            <span className="text-[8.5px] font-mono text-slate-500 uppercase tracking-widest block">SECURE LOGISTICS SHIELD PRO</span>
            <span className="text-[8.5px] font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-1 mt-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 256-BIT ENCRYPTION ACTIVE
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-8 md:p-10 flex flex-col justify-between overflow-y-auto max-h-[80vh] md:max-h-full">
          
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
              <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest">UTME_EPIN_DISPATCH_v2.0</span>
            </div>
            
            <button 
              onClick={onClose}
              className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {step === 'details' && (
              <motion.form 
                key="details"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleInitiatePayment}
                className="space-y-6 flex-grow flex flex-col justify-between"
              >
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-black text-white uppercase italic">Validate Profile & Select Payment Node</h3>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wide">Complete the candidate dossier to generate the e-PIN code.</p>
                  </div>

                  {error && (
                    <div className="p-4 bg-rose-650/10 border border-rose-500/25 text-rose-200 text-xs rounded-2xl flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                      <span className="font-semibold uppercase tracking-wide leading-tight">{error}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9.5px] font-black text-indigo-400 block uppercase mb-1.5 tracking-wider">Candidate NIN (11 Digits)</label>
                      <input 
                        type="text"
                        maxLength={11}
                        placeholder="e.g. 12345678901"
                        value={nin}
                        onChange={(e) => setNin(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-xs font-semibold uppercase outline-none focus:border-indigo-500 text-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[9.5px] font-black text-indigo-400 block uppercase mb-1.5 tracking-wider">JAMB Profile Code (10 Characters)</label>
                      <input 
                        type="text"
                        maxLength={10}
                        placeholder="e.g. 55019A12BC"
                        value={profileCode}
                        onChange={(e) => setProfileCode(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-xs font-semibold uppercase outline-none focus:border-indigo-500 text-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9.5px] font-black text-indigo-400 block uppercase mb-1.5 tracking-wider">Candidate Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                          type="text"
                          placeholder="e.g. CHIDI OLUWASEUN IBRAHIM"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-xs font-semibold uppercase outline-none focus:border-indigo-500 text-white transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9.5px] font-black text-indigo-400 block uppercase mb-1.5 tracking-wider">Candidate Email Address</label>
                      <input 
                        type="email"
                        placeholder="e.g. candidate@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-xs font-semibold outline-none focus:border-indigo-500 text-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9.5px] font-black text-indigo-400 block uppercase mb-1.5 tracking-wider">Candidate Phone Number</label>
                      <div className="relative">
                        <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                          type="text"
                          placeholder="e.g. 08031234567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                          className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-xs font-semibold outline-none focus:border-indigo-500 text-white transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9.5px] font-black text-indigo-400 block uppercase mb-1.5 tracking-wider">Exam Application Type</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setExamType('UTME')}
                          className={`py-3 rounded-xl border font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                            examType === 'UTME' 
                              ? 'bg-indigo-600 text-white border-indigo-500' 
                              : 'bg-slate-950 text-slate-400 border-white/5 hover:border-white/15'
                          }`}
                        >
                          UTME Registration
                        </button>
                        <button
                          type="button"
                          onClick={() => setExamType('DIRECT_ENTRY')}
                          className={`py-3 rounded-xl border font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                            examType === 'DIRECT_ENTRY' 
                              ? 'bg-indigo-600 text-white border-indigo-500' 
                              : 'bg-slate-950 text-slate-400 border-white/5 hover:border-white/15'
                          }`}
                        >
                          Direct Entry
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9.5px] font-black text-indigo-400 block uppercase mb-2 tracking-wider">Choose Payment Track</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('wallet')}
                        className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                          paymentMethod === 'wallet' 
                            ? 'bg-indigo-600/10 border-indigo-500/50 shadow-lg shadow-indigo-600/5' 
                            : 'bg-slate-950/60 border-white/5 hover:border-white/15'
                        }`}
                      >
                        <Wallet className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-xs font-black text-white uppercase block">EFADO Active Wallet</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase mt-1 block">
                            Pay instantly using your sovereign wallet balance. Balance: <span className="text-indigo-300 font-extrabold">₦{(user.playerWallet || 0).toLocaleString()}</span>
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('bank_transfer')}
                        className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                          paymentMethod === 'bank_transfer' 
                            ? 'bg-indigo-600/10 border-indigo-500/50 shadow-lg shadow-indigo-600/5' 
                            : 'bg-slate-950/60 border-white/5 hover:border-white/15'
                        }`}
                      >
                        <Building className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-xs font-black text-white uppercase block">Direct Bank Transfer</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase mt-1 block">
                            Transfer ₦5,700 directly to the EFADO central verification vault.
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {paymentMethod === 'bank_transfer' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 bg-slate-950 rounded-2xl border border-white/5 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-3">
                        <div>
                          <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest block">Bank Destination</span>
                          <span className="text-[11px] font-black text-white uppercase tracking-wide">GUARANTY TRUST BANK (GTBank)</span>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Account Number</span>
                          <span className="text-sm font-mono font-black text-indigo-400 flex items-center gap-1.5 mt-0.5">
                            0122938841 
                            <button type="button" onClick={() => handleCopy('0122938841')} className="hover:text-white"><Copy className="w-3.5 h-3.5" /></button>
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-black text-slate-400 uppercase tracking-wide">ACCOUNT NAME:</span>
                        <span className="font-extrabold text-white">EFADO GLOBAL LTD</span>
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-indigo-400 block uppercase mb-1 tracking-wider">Insert Bank Transfer Reference / Code</label>
                        <input 
                          type="text"
                          placeholder="e.g. TXN-928374928174 or Ref Code"
                          value={bankRef}
                          onChange={(e) => setBankRef(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs font-semibold uppercase outline-none focus:border-indigo-500 text-white transition-all"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
                  <div className="text-left">
                    <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">Amount to Dispatch</span>
                    <span className="text-2xl font-black italic text-white">₦{totalAmount.toLocaleString()} <span className="text-[10px] font-bold text-indigo-400">NGN</span></span>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-10 py-4.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-[1.3rem] text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-600/10 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Authorize & Generate Pin</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.form>
            )}

            {step === 'processing' && (
              <motion.div 
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-16 text-center space-y-8 flex-grow flex flex-col items-center justify-center"
              >
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin mx-auto" />
                  <Sparkles className="w-8 h-8 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tight animate-pulse">Initializing Dispatch Node...</h3>
                  <div className="max-w-md mx-auto space-y-1">
                    <p className="text-[9.5px] font-mono text-slate-500 uppercase tracking-widest">CONNECTING TO COGNITIVE GATEWAY: SOVEREIGN PROTOCOL ACTIVE</p>
                    <p className="text-[9.5px] font-mono text-indigo-400 uppercase tracking-widest">DEDUCTING FEES & VALIDATING NIN DOSSIER...</p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'success' && generatedEpin && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-6 flex-grow flex flex-col justify-between"
              >
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/5">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">e-PIN Generation Successful!</h3>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">The registration parameters are secured and validated.</p>
                  </div>
                </div>

                <div className="p-8 bg-slate-950 rounded-[2.5rem] border border-white/5 space-y-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-[80px]" />
                  
                  <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-white/5 pb-4">
                    <div>
                      <span className="text-[8px] font-mono text-slate-400 uppercase block">CANDIDATE DOSSIER</span>
                      <span className="text-sm font-black text-white uppercase tracking-wide block mt-1">{generatedEpin.candidateName}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-mono text-slate-400 uppercase block">EXAMINATION DISPATCH</span>
                      <span className="text-xs font-black text-indigo-400 uppercase tracking-widest block mt-1">{generatedEpin.examType}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <span className="text-[8px] font-mono text-slate-400 uppercase block">NIN PROTOCOL CODE</span>
                      <span className="text-xs font-mono font-bold text-white block mt-1">{generatedEpin.nin}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-mono text-slate-400 uppercase block">JAMB PROFILE CODE</span>
                      <span className="text-xs font-mono font-black text-white uppercase block mt-1">{generatedEpin.profileCode}</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 p-6 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="w-full text-center sm:text-left">
                      <span className="text-[8px] font-mono text-emerald-400 uppercase tracking-widest block">OFFICIAL JAMB UTME E-PIN</span>
                      <span className="text-lg sm:text-2xl font-mono font-black tracking-wider text-white select-all block mt-1">
                        {generatedEpin.epin}
                      </span>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => handleCopy(generatedEpin.epin)}
                      className="w-full sm:w-auto px-5 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy Pin'}</span>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                    <div>
                      <span>SERIAL NUMBER: </span>
                      <span className="text-white font-mono">{generatedEpin.serial}</span>
                    </div>
                    <div>
                      <span>GATEWAY TRACK: </span>
                      <span className="text-white font-mono">{generatedEpin.method}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4.5 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-start gap-3">
                  <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-[9.5px] text-slate-300 leading-normal font-medium uppercase tracking-wide">
                    Next Protocol: Take this copied <span className="text-white font-extrabold">{generatedEpin.epin}</span> and your <span className="text-white font-extrabold">{generatedEpin.profileCode}</span> to any accredited JAMB CBT registration center to finalize biometric scanning and institutional data input. No other payment is required there.
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('details');
                      setNin('');
                      setProfileCode('');
                      setPhone('');
                      setBankRef('');
                    }}
                    className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Generate Another Pin
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </motion.div>
    </div>
  );
};
