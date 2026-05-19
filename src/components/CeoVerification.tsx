import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Lock, ChevronRight, X, AlertCircle } from 'lucide-react';

interface CeoVerificationProps {
  onSuccess: () => void;
  onClose: () => void;
}

export const CeoVerification: React.FC<CeoVerificationProps> = ({ onSuccess, onClose }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // The secret code: E=5, F=6, A=1, D=4, O=15 -> 5-6-1-4-1-5 (6 digits)
  // Wait, E=5, F=6, A=1, D=4, O=15. 
  // If O is 15, that's two digits. 
  // User says "6 digit number code" and "e=5, f=6, a=1 d=4 and o=15 (561415)". 
  // Ah, he explicitly wrote 561415. 
  const SECRET_CODE = "561415";

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = () => {
    const enteredCode = code.join('');
    if (enteredCode.length < 6) return;

    setIsVerifying(true);
    setError(false);

    // Artificial delay for security feel
    setTimeout(() => {
      if (enteredCode === SECRET_CODE) {
        onSuccess();
      } else {
        setError(true);
        setIsVerifying(false);
        setCode(['', '', '', '', '', '']);
        document.getElementById('code-input-0')?.focus();
      }
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-[80px]" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-[80px]" />

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-6 relative z-10">
          <div className="inline-flex p-4 bg-indigo-500/10 rounded-3xl border border-indigo-500/20">
            <ShieldCheck className="w-10 h-10 text-indigo-400" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">CEO Verification</h2>
            <p className="text-slate-400 text-sm font-medium">
              Enter your tactical secondary verification code to access the EFADO Command Hub.
            </p>
          </div>

          <div className="flex justify-center gap-3">
            {code.map((digit, i) => (
              <input
                key={i}
                id={`code-input-${i}`}
                type="text"
                inputMode="numeric"
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`
                  w-12 h-16 bg-slate-800 border-2 rounded-2xl text-center text-2xl font-black text-white focus:outline-none transition-all
                  ${error ? 'border-rose-500/50 text-rose-500 animate-shake' : 'border-white/5 focus:border-indigo-500/50'}
                `}
                autoFocus={i === 0}
              />
            ))}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-widest"
              >
                <AlertCircle className="w-4 h-4" />
                Invalid Verification Code
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleVerify}
            disabled={code.join('').length < 6 || isVerifying}
            className={`
              w-full py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all
              ${isVerifying 
                ? 'bg-slate-800 text-slate-500 cursor-wait' 
                : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'}
            `}
          >
            {isVerifying ? (
              <div className="w-5 h-5 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Verify Identity
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 pt-4">
            <Lock className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Encrypted Session Active</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
