import React from 'react';
import { Shield, Lock, ShieldCheck, ShieldAlert, Fingerprint } from 'lucide-react';
import { motion } from 'motion/react';

export const SecurityGuard: React.FC<{ 
  level?: 'basic' | 'high' | 'ultra',
  showBadge?: boolean,
  compact?: boolean
}> = ({ level = 'high', showBadge = true, compact = false }) => {
  const colors = {
    basic: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    high: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    ultra: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20'
  };

  return (
    <div className={`flex flex-col gap-2 ${compact ? 'p-2' : 'p-4'} rounded-2xl border ${colors[level]} backdrop-blur-md`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${level === 'ultra' ? 'bg-indigo-500 text-white' : 'bg-current/10'}`}>
          {level === 'ultra' ? <Fingerprint className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
        </div>
        <div>
          <h4 className={`font-black uppercase tracking-tighter ${compact ? 'text-[10px]' : 'text-xs'}`}>
            EFADO Guard & Shield
          </h4>
          <p className={`font-bold opacity-70 uppercase tracking-widest ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
            {level === 'ultra' ? 'Military-Grade Encryption' : 'End-to-End Protected'}
          </p>
        </div>
      </div>
      {!compact && (
        <div className="flex items-center gap-2 mt-1">
          <div className="flex -space-x-1">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-4 h-4 rounded-full border border-white bg-current flex items-center justify-center">
                <Lock className="w-2 h-2 text-white" />
              </div>
            ))}
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Verified Secure Transaction</span>
        </div>
      )}
    </div>
  );
};

export const TransactionPinModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => void;
  amount: number;
  action: string;
}> = ({ isOpen, onClose, onConfirm, amount, action }) => {
  const [pin, setPin] = React.useState(['', '', '', '']);
  const inputRefs = [
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null)
  ];

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleConfirm = () => {
    if (pin.every(p => p !== '')) {
      onConfirm(pin.join(''));
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-100"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-200 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-black text-gray-950 uppercase tracking-tighter">Authorize Transaction</h3>
          <p className="text-xs text-gray-700 font-bold uppercase tracking-widest mt-1">Guard & Shield Protection</p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 mb-8 border border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Action</span>
            <span className="text-xs font-black text-gray-950 uppercase tracking-tight">{action}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Amount</span>
            <span className="text-lg font-black text-indigo-600">${amount.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex justify-center gap-3 mb-4">
          {pin.map((p, i) => (
            <input
              key={i}
              ref={inputRefs[i]}
              type="password"
              maxLength={1}
              value={p}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-16 bg-gray-100 border-2 border-transparent focus:border-indigo-500 rounded-xl text-center text-2xl font-black focus:outline-none transition-all"
            />
          ))}
        </div>

        <div className="bg-indigo-50/60 rounded-xl p-3 text-center mb-6 border border-indigo-100/50">
          <p className="text-[10px] text-indigo-700 font-bold leading-normal">
            💡 For Security protection, please enter any 4-digit code of your choice (e.g., <span className="font-extrabold text-indigo-900">1234</span>) to verify and authorize this transaction safely.
          </p>
        </div>

        <div className="space-y-3">
          <button 
            onClick={handleConfirm}
            disabled={pin.some(p => p === '')}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            Confirm & Pay
          </button>
          <button 
            onClick={onClose}
            className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all font-inter"
          >
            Cancel
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-emerald-500">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Secured by EFADO Shield</span>
        </div>
      </motion.div>
    </motion.div>
  );
};
