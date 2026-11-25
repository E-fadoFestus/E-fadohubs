import React, { useEffect, useState } from 'react';
import { Shield, Lock, ShieldCheck, Fingerprint, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const SecurityGuard: React.FC<{
  level?: 'basic' | 'high' | 'ultra';
  showBadge?: boolean;
  compact?: boolean;
}> = ({ level = 'high', compact = false }) => {
  const styles = {
    basic: 'text-[#7C3AED] bg-purple-50 border-purple-200',
    high: 'text-[#16A34A] bg-emerald-50 border-emerald-200',
    ultra: 'text-[#7C3AED] bg-purple-50 border-purple-200'
  };

  return (
    <div className={`flex flex-col gap-2 ${compact ? 'p-2.5' : 'p-4'} rounded-2xl border ${styles[level]}`}>
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-xl shrink-0 ${
            level === 'ultra' ? 'bg-[#7C3AED] text-white' : 'bg-[#16A34A] text-white'
          }`}
        >
          {level === 'ultra' ? <Fingerprint className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
        </div>
        <div className="min-w-0">
          <h4 className={`font-bold text-slate-900 m-0 ${compact ? 'text-xs' : 'text-sm'}`}>
            Your Money is Safe
          </h4>
          <p className={`font-medium text-slate-600 m-0 max-w-none ${compact ? 'text-[11px]' : 'text-xs'}`}>
            Protected by 256-bit encryption
          </p>
        </div>
      </div>
      {!compact && (
        <div className="flex items-center gap-2 mt-1">
          <div className="flex -space-x-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-full border border-white bg-[#16A34A] flex items-center justify-center"
              >
                <Lock className="w-2.5 h-2.5 text-white" />
              </div>
            ))}
          </div>
          <span className="text-xs font-semibold text-[#16A34A]">Secure Payment - Verified</span>
        </div>
      )}
    </div>
  );
};

export const TransactionPinModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pin: string, otpCode?: string) => void | Promise<void>;
  amount: number;
  action: string;
  currencySymbol?: string;
  subtitle?: string;
  errorMessage?: string | null;
  isSubmitting?: boolean;
  requiresOtp?: boolean;
  otpDeliveryNotice?: string;
}> = ({
  isOpen,
  onClose,
  onConfirm,
  amount,
  action,
  currencySymbol = '₦',
  subtitle = 'Enter your 4-digit Transaction PIN to continue',
  errorMessage = null,
  isSubmitting = false,
  requiresOtp = false,
  otpDeliveryNotice
}) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [otp, setOtp] = useState('');
  const inputRefs = [
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null)
  ];

  useEffect(() => {
    if (isOpen) {
      setPin(['', '', '', '']);
      setOtp('');
      setTimeout(() => inputRefs[0].current?.focus(), 80);
    }
  }, [isOpen]);

  const handleChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '');
    const char = clean ? clean[clean.length - 1] : '';
    const newPin = [...pin];
    newPin[index] = char;
    setPin(newPin);

    if (char && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleConfirm = () => {
    if (isSubmitting) return;
    if (pin.every((p) => p !== '')) {
      onConfirm(pin.join(''), requiresOtp ? otp.trim() : undefined);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.96, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl border border-purple-100"
      >
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-[#7C3AED] flex items-center justify-center shadow-md mb-3">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 m-0">Authorize Transaction</h3>
          <p className="text-xs text-slate-600 font-medium mt-1 mb-0 max-w-none">{subtitle}</p>
        </div>

        <div className="bg-purple-50/70 rounded-2xl p-4 mb-5 border border-purple-100 space-y-2">
          <div className="flex justify-between items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Action</span>
            <span className="text-xs font-bold text-slate-900 text-right truncate max-w-[180px]">{action}</span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Amount</span>
            <span className="text-lg font-bold text-[#7C3AED] tabular-nums">
              {currencySymbol}
              {Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="flex justify-center gap-3 mb-4">
          {pin.map((p, i) => (
            <input
              key={i}
              ref={inputRefs[i]}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={p}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              aria-label={`PIN digit ${i + 1}`}
              className="w-12 h-14 bg-slate-50 border border-slate-300 focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-200 rounded-xl text-center text-2xl font-bold text-slate-900 focus:outline-none transition-all tabular-nums"
            />
          ))}
        </div>

        {requiresOtp && (
          <div className="mb-4 space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              6-Digit Security Code (Sent via SMS / Email)
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 6-digit code"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 text-center tracking-widest tabular-nums focus:outline-none focus:border-[#7C3AED]"
            />
            <p className="text-xs text-[#7C3AED] font-semibold text-center mb-0 max-w-none">
              {otpDeliveryNotice || 'Check your registered Email or SMS for your 6-digit verification code.'}
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pin.some((p) => p === '') || (requiresOtp && otp.length < 6) || isSubmitting}
            className="w-full py-3.5 bg-[#16A34A] hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Confirm</span>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all"
          >
            Cancel
          </button>
        </div>

        <div className="mt-5 flex items-center justify-center gap-1.5 text-[#16A34A]">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-xs font-semibold">Protected by 256-bit encryption</span>
        </div>
      </motion.div>
    </motion.div>
  );
};
