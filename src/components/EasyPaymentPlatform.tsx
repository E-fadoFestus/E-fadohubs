import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Copy, 
  Check, 
  ShieldCheck, 
  Lock, 
  Zap, 
  Coins, 
  ArrowRight,
  ArrowLeft,
  User,
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
  CreditCard,
  Globe,
  FileText,
  Printer,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Transaction } from '../types';
import { useCurrency } from '../lib/CurrencyContext';
import { getFlutterwavePublicKey, createFlutterwavePaymentLink } from '../utils/flutterwave';
import { TransactionPinModal } from './SecurityGuard';
import { TransactionService } from '../services/TransactionService';
import { StrategicReceipt } from './StrategicReceipt';
import { CEO_BANK_ACCOUNTS } from '../constants/businessProfile';
import { auth, db, doc, updateDoc } from '../firebase';
import { resolveBankAccount, NIGERIAN_BANKS, BankItem } from '../utils/bankVerification';
import { getBackendUrl } from '../config/backend';
import {
  ACTIVE_WALLET_CURRENCIES,
  FUTURE_WALLET_CURRENCIES,
  formatCurrencyAmount,
  getMinDepositForCurrency,
  getWalletCurrencyMeta,
  isDisabledFutureCurrency,
  normalizeCurrencyCode
} from '../constants/walletCurrencies';
import { extractErrorMessage, readResponseSafely } from '../utils/errorFormat';

export interface EasyPaymentPlatformProps {
  user: UserProfile;
  type: 'deposit' | 'withdraw';
  onComplete?: (amount: number, method: string) => Promise<void>;
  onClose: () => void;
  amount?: number;
  onSuccess?: () => void;
  purpose?: string;
  hub?: string;
}

export const EasyPaymentPlatform: React.FC<EasyPaymentPlatformProps> = ({
  user,
  type: initialType,
  onClose,
  amount: fixedAmount,
  onSuccess,
  purpose: intentPurpose,
  hub = 'WALLET'
}) => {
  useCurrency();

  // Active Tab Mode
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>(initialType);
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'flutterwave' | 'bank_transfer' | 'crypto'>('paystack');
  const [depositCurrency, setDepositCurrency] = useState<string>('NGN');
  const [payoutGateway, setPayoutGateway] = useState<'paystack' | 'flutterwave'>('paystack');
  const [withdrawSource, setWithdrawSource] = useState<'depositWallet' | 'playerWallet' | 'cashOutWallet'>('depositWallet');
  const [withdrawCurrency, setWithdrawCurrency] = useState<string>('NGN');

  // Input States
  const [amount, setAmount] = useState<string>(fixedAmount ? fixedAmount.toString() : '5000');
  const [bankName, setBankName] = useState(user.bankName || 'Guaranty Trust Bank (GTBank)');
  const [bankCode, setBankCode] = useState('058');
  const [accountNumber, setAccountNumber] = useState(user.accountNumber || '');
  const [accountName, setAccountName] = useState(user.accountName || '');
  const [proofNote, setProofNote] = useState('');

  // Live Bank Directories
  const [paystackBanks, setPaystackBanks] = useState<BankItem[]>(NIGERIAN_BANKS);
  const [flutterwaveBanks, setFlutterwaveBanks] = useState<BankItem[]>(NIGERIAN_BANKS);

  // UI & Flow Control States
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'failed'>('form');
  const [createdTx, setCreatedTx] = useState<Transaction | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [reference] = useState(() => `EFD-PAY-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString().slice(-4)}`);

  // Live Bank Account Resolution State
  const [isResolvingName, setIsResolvingName] = useState(false);
  const [verifiedAccountName, setVerifiedAccountName] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Preset deposit amount choices
  const PRESET_AMOUNTS = [2000, 5000, 10000, 20000, 50000, 100000];

  const activeCurrencyMeta = getWalletCurrencyMeta(depositCurrency);
  const withdrawCurrencyMeta = getWalletCurrencyMeta(
    withdrawSource === 'depositWallet' ? withdrawCurrency : 'NGN'
  );

  const availableWithdrawBalance =
    withdrawSource === 'depositWallet'
      ? Number(
          user.walletPockets?.[withdrawCurrency] ??
            (withdrawCurrency === 'NGN' ? user.depositWallet || 0 : 0)
        )
      : withdrawSource === 'playerWallet'
        ? Number(user.playerWallet || 0)
        : Number(user.cashOutWallet || 0);

  const activeBankDirectory = payoutGateway === 'paystack' ? paystackBanks : flutterwaveBanks;
  const parsedWithdrawAmount = Number(amount) || 0;
  const isWithdrawInsufficient =
    activeTab === 'withdraw' &&
    parsedWithdrawAmount > 0 &&
    parsedWithdrawAmount > availableWithdrawBalance;

  // Auto pre-populate user details
  useEffect(() => {
    if (user) {
      if (user.accountNumber) setAccountNumber(user.accountNumber);
      if (user.accountName) setAccountName(user.accountName);
      if (user.bankName) setBankName(user.bankName);
    }
  }, [user]);

  // Fetch live Paystack & Flutterwave bank lists
  useEffect(() => {
    let mounted = true;
    const loadBanks = async () => {
      try {
        const flwRes = await fetch(getBackendUrl('/api/payments/banks?country=NG'));
        const flwData = await flwRes.json().catch(() => null);
        if (mounted && flwRes.ok && Array.isArray(flwData?.banks) && flwData.banks.length > 0) {
          setFlutterwaveBanks(
            flwData.banks.map((b: any) => ({
              code: String(b.code || ''),
              name: String(b.name || '')
            }))
          );
        }
      } catch {
        // Fallback to NIGERIAN_BANKS
      }

      try {
        const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
        if (!token) return;
        const psRes = await fetch(getBackendUrl('/api/paystack/banks?currency=NGN'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const psData = await psRes.json().catch(() => null);
        if (mounted && psRes.ok && Array.isArray(psData?.banks) && psData.banks.length > 0) {
          setPaystackBanks(
            psData.banks.map((b: any) => ({
              code: String(b.code || ''),
              name: String(b.name || '')
            }))
          );
        }
      } catch {
        // Fallback to NIGERIAN_BANKS
      }
    };
    void loadBanks();
    return () => {
      mounted = false;
    };
  }, []);

  // Explicitly resolve bank account — works EVEN at ₦0.00 balance, never hangs forever
  const handleVerifyAccount = async (gatewayOverride?: 'paystack' | 'flutterwave') => {
    const cleanAcct = accountNumber.replace(/\D/g, '');
    const selectedGw = gatewayOverride || (activeTab === 'withdraw' ? payoutGateway : 'paystack');
    if (cleanAcct.length !== 10) {
      setVerifiedAccountName(null);
      setVerifyError('Please enter a valid 10-digit account number first.');
      return;
    }

    setIsResolvingName(true);
    setVerifyError(null);
    setVerifiedAccountName(null);
    setError(null);

    try {
      const res = await resolveBankAccount(cleanAcct, bankCode, bankName, selectedGw);
      if (res.success && res.accountName) {
        setVerifiedAccountName(res.accountName);
        setAccountName(res.accountName);
        setVerifyError(null);
      } else {
        setVerifiedAccountName(null);
        setVerifyError(res.message || 'Invalid account number or bank not responding.');
      }
    } catch (err: any) {
      setVerifiedAccountName(null);
      setVerifyError(err?.message || 'Bank not responding. Please try again.');
    } finally {
      setIsResolvingName(false);
    }
  };

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(id);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  // Paystack Script Loader & Checkout
  const loadPaystackScript = () => {
    return new Promise<boolean>((resolve, reject) => {
      if ((window as any).PaystackPop) return resolve(true);
      const timer = setTimeout(() => reject(new Error('Timed out loading Paystack SDK.')), 10000);
      const existing = document.querySelector('script[src*="js.paystack.co/v1/inline.js"]') as HTMLScriptElement | null;
      if (existing) {
        const poll = setInterval(() => {
          if ((window as any).PaystackPop) {
            clearInterval(poll);
            clearTimeout(timer);
            resolve(true);
          }
        }, 100);
        existing.addEventListener('error', () => {
          clearInterval(poll);
          clearTimeout(timer);
          reject(new Error('Failed to load Paystack SDK.'));
        }, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => {
        clearTimeout(timer);
        resolve(true);
      };
      script.onerror = () => {
        clearTimeout(timer);
        reject(new Error('Failed to load Paystack SDK.'));
      };
      document.head.appendChild(script);
    });
  };

  const handlePaystackCheckout = async () => {
    setError(null);
    const chosenCurrency = normalizeCurrencyCode(depositCurrency);
    if (isDisabledFutureCurrency(chosenCurrency)) {
      setError(`${chosenCurrency} is Coming Soon and disabled for deposits.`);
      return;
    }

    const minDeposit = getMinDepositForCurrency(chosenCurrency);
    const parsedAmt = Number(amount);
    if (!amount || !Number.isFinite(parsedAmt) || parsedAmt < minDeposit) {
      setError(`Please enter a valid amount of at least ${formatCurrencyAmount(minDeposit, chosenCurrency)}.`);
      return;
    }

    const amountInSmallestUnit = Math.round(parsedAmt * 100);
    if (!Number.isInteger(amountInSmallestUnit) || amountInSmallestUnit <= 0) {
      setError('Invalid payment amount.');
      return;
    }

    const rawEmail = (user?.email || auth.currentUser?.email || '').trim().toLowerCase();
    const customerEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)
      ? rawEmail
      : (user?.uid ? `${user.uid}@efado.com` : '');
    if (!customerEmail) {
      setError('A valid email address is required for Paystack checkout.');
      return;
    }

    if (!auth.currentUser) {
      setError('Please sign in with a valid account to pay with Paystack.');
      return;
    }

    setStep('processing');
    setProcessingProgress(25);

    try {
      const token = await auth.currentUser.getIdToken();
      const rawKey = (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '').trim();
      const pstKey = /^pk_(test|live)_[a-zA-Z0-9]+$/.test(rawKey) ? rawKey : '';

      // If frontend public key isn't set, use backend Paystack initialize redirect
      if (!pstKey) {
        setProcessingProgress(55);
        const initRes = await fetch(getBackendUrl('/api/paystack/initialize'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            amount: parsedAmt,
            amount_in_kobo: amountInSmallestUnit,
            currency: chosenCurrency
          })
        });
        const { data: initData, rawText } = await readResponseSafely(initRes);
        const authUrl = initData?.authorization_url || initData?.data?.authorization_url;
        if (!initRes.ok || !authUrl) {
          throw new Error(
            extractErrorMessage(
              initData ?? rawText,
              'Paystack keys are not configured. Set VITE_PAYSTACK_PUBLIC_KEY or PAYSTACK_SECRET_KEY in Vercel.'
            )
          );
        }
        setProcessingProgress(100);
        window.location.assign(authUrl);
        return;
      }

      await loadPaystackScript();
      setProcessingProgress(60);

      const paymentRef = `EFD-PST-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString().slice(-4)}`;

      if (typeof (window as any).PaystackPop !== 'undefined') {
        const handler = (window as any).PaystackPop.setup({
          key: pstKey,
          email: customerEmail,
          amount: amountInSmallestUnit,
          currency: chosenCurrency,
          ref: paymentRef,
          metadata: {
            userId: user.uid,
            userName: user.displayName || customerEmail,
            currency: chosenCurrency,
            purpose: intentPurpose || 'Wallet Funding'
          },
          callback: (response: any) => {
            void (async () => {
              try {
                setProcessingProgress(85);
                const returnedRef = response?.reference || paymentRef;
                const verifyRes = await fetch(
                  getBackendUrl(`/api/paystack/verify?reference=${encodeURIComponent(returnedRef)}`),
                  {
                    headers: { Authorization: `Bearer ${token}` }
                  }
                );
                const { data: verifyData, rawText: verifyRaw } = await readResponseSafely(verifyRes);
                if (!verifyRes.ok || !verifyData?.success || verifyData?.credited === false) {
                  throw new Error(
                    extractErrorMessage(
                      verifyData ?? verifyRaw,
                      'Server verification did not credit wallet. Balance was NOT updated.'
                    )
                  );
                }

                const verifiedCurrency = normalizeCurrencyCode(verifyData.currency || chosenCurrency);
                const verifiedAmount = Number(verifyData.amount || parsedAmt);

                setCreatedTx({
                  id: returnedRef,
                  userId: user.uid,
                  userEmail: customerEmail,
                  type: 'deposit',
                  amount: verifiedAmount,
                  fee: 0,
                  currency: verifiedCurrency,
                  status: 'completed',
                  method: 'Paystack Instant Gateway',
                  hub: hub as any,
                  purpose: intentPurpose || 'Wallet Funding',
                  reference: returnedRef,
                  description: `Verified Deposit via Paystack Gateway (${verifiedCurrency}) [Ref: ${returnedRef}]`,
                  timestamp: new Date().toISOString()
                } as any);

                setProcessingProgress(100);
                setStep('success');

                if (onSuccess) onSuccess();
              } catch (cbErr: any) {
                console.error('Paystack callback verification error:', cbErr);
                setError(extractErrorMessage(cbErr, 'Payment verification failed.'));
                setStep('form');
              }
            })();
          },
          onClose: () => {
            setStep('form');
            setError('Checkout window closed before payment completion.');
          }
        });
        handler.openIframe();
      } else {
        throw new Error('Paystack SDK failed to load.');
      }
    } catch (err: any) {
      console.error('Paystack checkout initialization error:', err);
      setError(extractErrorMessage(err, 'Could not initialize Paystack checkout.'));
      setStep('form');
    }
  };

  const handleFlutterwaveCheckout = async () => {
    setError(null);
    const chosenCurrency = normalizeCurrencyCode(depositCurrency);
    if (isDisabledFutureCurrency(chosenCurrency)) {
      setError(`${chosenCurrency} is Coming Soon and disabled for deposits.`);
      return;
    }

    const minDeposit = getMinDepositForCurrency(chosenCurrency);
    const parsedAmt = Number(amount);
    if (!amount || !Number.isFinite(parsedAmt) || parsedAmt < minDeposit) {
      setError(`Please enter a valid amount of at least ${formatCurrencyAmount(minDeposit, chosenCurrency)}.`);
      return;
    }

    setStep('processing');
    setProcessingProgress(35);

    const paymentRef = `EFD-FLW-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    try {
      setProcessingProgress(65);
      const result = await createFlutterwavePaymentLink({
        email: user.email || `${user.uid}@efado.com`,
        name: user.displayName || 'EFADO Member',
        userId: user.uid,
        amount: parsedAmt,
        currency: chosenCurrency,
        tx_ref: paymentRef,
        purpose: intentPurpose || 'Wallet Funding',
        meta: {
          userId: user.uid,
          hub: hub || 'main',
          currency: chosenCurrency
        },
        customizations: {
          title: 'EFADO Wallet Checkout',
          description: intentPurpose || 'Instant Wallet Funding',
          logo: `${window.location.origin}/efado_logo_192.jpg`
        }
      });

      if (result.status && result.link) {
        setProcessingProgress(100);
        window.location.assign(result.link);
        return;
      }

      throw new Error(result.message || 'Could not generate Flutterwave checkout link.');
    } catch (err: any) {
      console.error('Flutterwave checkout initialization error:', err);
      setError(err?.message || 'Unable to connect to Flutterwave gateway. Please try again.');
      setStep('form');
    }
  };

  // Handle Submit for Direct Bank Transfer & Real API Withdrawal
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmt = Number(amount);
    if (!amount || isNaN(parsedAmt) || parsedAmt <= 0) {
      setError('Please enter a valid transaction amount.');
      return;
    }

    if (activeTab === 'withdraw') {
      const cleanAcct = accountNumber.replace(/\D/g, '');
      if (cleanAcct.length !== 10) {
        setError('Please enter a valid 10-digit receiving account number.');
        return;
      }
      if (!verifiedAccountName) {
        setError('Please verify your bank account first and confirm the account holder name.');
        return;
      }
      if (parsedAmt > availableWithdrawBalance) {
        setError(
          `INSUFFICIENT FUNDS: Requested ${formatCurrencyAmount(parsedAmt, withdrawCurrencyMeta.code)}, available ${formatCurrencyAmount(availableWithdrawBalance, withdrawCurrencyMeta.code)}.`
        );
        return;
      }
    } else if (paymentMethod === 'bank_transfer') {
      const chosenCurrency = normalizeCurrencyCode(depositCurrency);
      if (isDisabledFutureCurrency(chosenCurrency)) {
        setError(`${chosenCurrency} is Coming Soon and disabled.`);
        return;
      }
      if (!accountNumber || accountNumber.length < 8) {
        setError('Please enter your 10-digit sender account number.');
        return;
      }
      if (!accountName) {
        setError('Please enter your sender account holder name.');
        return;
      }
    }

    setShowPinModal(true);
  };

  // Triggered after PIN modal confirmation
  const handlePinConfirmed = () => {
    setShowPinModal(false);
    setStep('processing');
    setProcessingProgress(25);
    void processConfirmedTransaction();
  };

  // Execute Real Paystack/Flutterwave Withdrawal OR Pending Direct Bank Transfer Proof
  const processConfirmedTransaction = async () => {
    try {
      const parsedAmt = Number(amount);
      const isDeposit = activeTab === 'deposit';

      if (!isDeposit) {
        if (!auth.currentUser) {
          throw new Error('Authentication required for withdrawals.');
        }

        const wdCurrency =
          withdrawSource === 'depositWallet' ? normalizeCurrencyCode(withdrawCurrency) : 'NGN';
        if (isDisabledFutureCurrency(wdCurrency)) {
          throw new Error(`${wdCurrency} is Coming Soon and cannot be withdrawn.`);
        }

        const token = await auth.currentUser.getIdToken();
        setProcessingProgress(60);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);

        let endpoint = '/api/paystack/withdraw';
        let body: Record<string, any> = {
          amount: parsedAmt,
          account_number: accountNumber.replace(/\D/g, ''),
          bank_code: bankCode,
          account_name: verifiedAccountName || accountName,
          bank_name: bankName,
          source_wallet: withdrawSource,
          currency: wdCurrency
        };

        if (payoutGateway === 'flutterwave') {
          endpoint = '/api/payments/withdraw';
          body = {
            amount: parsedAmt,
            bankCode,
            accountNumber: accountNumber.replace(/\D/g, ''),
            accountName: verifiedAccountName || accountName,
            bankName,
            currency: wdCurrency,
            sourceWallet: withdrawSource
          };
        }

        const res = await fetch(getBackendUrl(endpoint), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(body),
          signal: controller.signal
        });
        clearTimeout(timer);

        const { data, rawText } = await readResponseSafely(res);
        if (!res.ok || !data?.success) {
          throw new Error(extractErrorMessage(data ?? rawText, 'Withdrawal failed.'));
        }

        // Save preferred payout bank details
        if (bankName !== user.bankName || accountNumber !== user.accountNumber || (verifiedAccountName || accountName) !== user.accountName) {
          try {
            await updateDoc(doc(db, 'users', user.uid), {
              bankName,
              accountNumber: accountNumber.replace(/\D/g, ''),
              accountName: verifiedAccountName || accountName
            });
          } catch {
            // non-fatal
          }
        }

        setProcessingProgress(100);
        setCreatedTx({
          id: data.reference || reference,
          userId: user.uid,
          userEmail: user.email,
          type: 'withdrawal',
          amount: parsedAmt,
          fee: 0,
          currency: wdCurrency,
          status: data.status || 'completed',
          method: payoutGateway === 'paystack' ? 'Paystack Instant Transfer' : 'Flutterwave Bank Payout',
          hub: hub as any,
          purpose: intentPurpose || 'Wallet Withdrawal',
          reference: data.reference || reference,
          description: `Payout to ${verifiedAccountName || accountName} (${bankName})`,
          timestamp: new Date().toISOString()
        } as any);
        setStep('success');
        if (onSuccess) onSuccess();
        return;
      }

      // Direct Bank Transfer / Crypto manual proof (remains pending until CEO approval)
      const chosenCurrency = normalizeCurrencyCode(depositCurrency);
      if (bankName !== user.bankName || accountNumber !== user.accountNumber || accountName !== user.accountName) {
        try {
          await updateDoc(doc(db, 'users', user.uid), { bankName, accountNumber, accountName });
        } catch (e) {
          console.warn('Bank detail sync warning:', e);
        }
      }

      setProcessingProgress(70);
      const txDescription =
        paymentMethod === 'crypto'
          ? `Pending USDT / Wire Deposit [Ref: ${reference}]`
          : `Pending Bank Transfer Verification: Sender [${bankName} / ${accountNumber} / ${accountName}] ${proofNote ? `(${proofNote})` : ''}`;

      const txData = {
        userId: user.uid,
        userEmail: user.email,
        type: 'deposit' as const,
        amount: parsedAmt,
        fee: 0,
        currency: chosenCurrency,
        status: 'pending' as const,
        method: paymentMethod === 'crypto' ? 'USDT / SWIFT Wire' : 'Direct Bank Transfer',
        hub: hub as any,
        purpose: intentPurpose || 'Wallet Funding',
        reference,
        description: txDescription,
        ledgerOnly: true,
        metadata: {
          bankName,
          accountNumber,
          accountName,
          currency: chosenCurrency,
          transactionRef: reference
        }
      };

      const txId = await TransactionService.recordTransaction(txData);
      setProcessingProgress(100);
      setCreatedTx({
        id: txId,
        ...txData,
        timestamp: new Date().toISOString()
      } as any);

      setStep('success');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Transaction execution failure:', err);
      setError(
        err?.name === 'AbortError'
          ? 'Payout gateway timed out. Check your transaction history before retrying.'
          : extractErrorMessage(err, 'Transaction submission failed. Please try again.')
      );
      setStep('form');
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 font-sans text-slate-900 text-left flex flex-col max-h-[90vh]">
      
      {/* 1. Header Bar */}
      <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              EFADO Payment Gateway
            </h2>
            <p className="text-xs text-slate-400 font-medium truncate max-w-[220px]">
              {intentPurpose || 'Secure Wallet Checkout'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Deposit vs Withdraw Navigation Segment */}
      <div className="p-2 bg-slate-100 border-b border-slate-200 shrink-0 grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setActiveTab('deposit');
          }}
          className={`py-2.5 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'deposit'
              ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/80 font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Coins className="w-4 h-4 text-emerald-600" />
          <span>Fund Account</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setActiveTab('withdraw');
          }}
          className={`py-2.5 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'withdraw'
              ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80 font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-blue-600" />
          <span>Withdraw Earnings</span>
        </button>
      </div>

      {/* 3. Main Form Body */}
      <div className="p-6 overflow-y-auto space-y-5 flex-1">
        {step === 'form' && (
          <form onSubmit={handleFormSubmit} className="space-y-5">
            
            {/* Error Message Alert */}
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Deposit Currency Selector (9 Active + 1 Coming Soon SIRA) */}
            {activeTab === 'deposit' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Wallet Pocket Currency</label>
                  <span className="text-[10px] font-bold text-emerald-700">
                    Pocket: {formatCurrencyAmount(
                      user.walletPockets?.[depositCurrency] ?? (depositCurrency === 'NGN' ? (user.depositWallet || 0) : 0),
                      depositCurrency
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {ACTIVE_WALLET_CURRENCIES.map((cur) => (
                    <button
                      key={cur.code}
                      type="button"
                      onClick={() => {
                        setDepositCurrency(cur.code);
                        setError(null);
                      }}
                      className={`py-2 px-1 rounded-xl text-[10px] font-black border transition-all flex items-center justify-center gap-1 ${
                        depositCurrency === cur.code
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{cur.flag}</span>
                      <span>{cur.code}</span>
                    </button>
                  ))}
                  {FUTURE_WALLET_CURRENCIES.map((cur) => (
                    <button
                      key={cur.code}
                      type="button"
                      disabled
                      title={cur.note}
                      className="py-2 px-1 rounded-xl text-[10px] font-black border bg-slate-100 text-slate-400 border-slate-200 opacity-60 cursor-not-allowed flex flex-col items-center justify-center"
                    >
                      <span>{cur.code}</span>
                      <span className="text-[7px] uppercase tracking-tight">Soon</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Deposit Amount Input Block (Withdraw puts Amount after Bank Verify) */}
            {activeTab === 'deposit' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Amount to Fund ({activeCurrencyMeta.code} {activeCurrencyMeta.symbol})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                    {activeCurrencyMeta.symbol}
                  </span>
                  <input
                    type="text"
                    pattern="[0-9.]*"
                    disabled={!!fixedAmount}
                    placeholder={`Min ${getMinDepositForCurrency(depositCurrency)}`}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-base font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all disabled:opacity-60"
                    value={amount}
                    onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  />
                </div>

                {!fixedAmount && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {PRESET_AMOUNTS.map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmount(preset.toString())}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                          amount === preset.toString()
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {activeCurrencyMeta.symbol}{preset.toLocaleString()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Deposit Payment Method Selector */}
            {activeTab === 'deposit' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Select Payment Method</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('paystack')}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      paymentMethod === 'paystack'
                        ? 'bg-indigo-50/60 border-indigo-600 text-indigo-950 ring-2 ring-indigo-600/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      <div>
                        <p className="text-xs font-bold">Paystack</p>
                        <p className="text-[10px] text-slate-500">Cards, USSD, App</p>
                      </div>
                    </div>
                    {paymentMethod === 'paystack' && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('flutterwave')}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      paymentMethod === 'flutterwave'
                        ? 'bg-emerald-50/60 border-emerald-600 text-emerald-950 ring-2 ring-emerald-600/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Zap className="w-4 h-4 text-emerald-600" />
                      <div>
                        <p className="text-xs font-bold">Flutterwave</p>
                        <p className="text-[10px] text-slate-500">Cards, Mobile Money</p>
                      </div>
                    </div>
                    {paymentMethod === 'flutterwave' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      paymentMethod === 'bank_transfer'
                        ? 'bg-blue-50/60 border-blue-600 text-blue-950 ring-2 ring-blue-600/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-xs font-bold">Bank Transfer</p>
                        <p className="text-[10px] text-slate-500">CEO Accounts</p>
                      </div>
                    </div>
                    {paymentMethod === 'bank_transfer' && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('crypto')}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      paymentMethod === 'crypto'
                        ? 'bg-purple-50/60 border-purple-600 text-purple-950 ring-2 ring-purple-600/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Globe className="w-4 h-4 text-purple-600" />
                      <div>
                        <p className="text-xs font-bold">USDT / SWIFT</p>
                        <p className="text-[10px] text-slate-500">Global Wire</p>
                      </div>
                    </div>
                    {paymentMethod === 'crypto' && <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />}
                  </button>
                </div>
              </div>
            )}

            {/* Direct Bank Transfer Account Details Display */}
            {activeTab === 'deposit' && paymentMethod === 'bank_transfer' && (
              <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-xs font-bold text-slate-800">Automated Bank Transfer Settlement (Paystack):</p>
                <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-sm space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Paystack Dynamic Virtual Transfer
                  </span>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-1">
                    Manual hardcoded accounts have been retired. Switch to <strong>Paystack</strong> above for an instant virtual transfer account settled directly via Paystack Settlement Bank, or submit your verified transfer proof below.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-slate-200">
                  <p className="text-xs font-bold text-slate-800">Your Sender Proof Details:</p>

                  <select
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={bankName}
                    onChange={e => {
                      setBankName(e.target.value);
                      const matched = NIGERIAN_BANKS.find(b => b.name === e.target.value);
                      if (matched) setBankCode(matched.code);
                    }}
                  >
                    {NIGERIAN_BANKS.map(b => (
                      <option key={b.code} value={b.name}>{b.name}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    maxLength={10}
                    placeholder="10-Digit Sender Account Number"
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  />

                  <input
                    type="text"
                    placeholder="Sender Account Holder Name"
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                  />

                  <input
                    type="text"
                    placeholder="Transfer Reference / Note (Optional)"
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={proofNote}
                    onChange={e => setProofNote(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Crypto / Wire Info Card */}
            {activeTab === 'deposit' && paymentMethod === 'crypto' && (
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 text-purple-950 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold">USDT (TRC-20) Deposit Address</p>
                  <span className="text-[9px] bg-purple-200 px-2 py-0.5 rounded font-black">Crypto</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-purple-200 flex items-center justify-between font-mono text-xs">
                  <span className="truncate pr-2 font-bold text-slate-900">TJ8Y9eFADoCRyPToW281xM9</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('TJ8Y9eFADoCRyPToW281xM9', 'usdt')}
                    className="px-3 py-1 bg-purple-700 text-white rounded-lg text-xs font-bold hover:bg-purple-800 shrink-0"
                  >
                    {copySuccess === 'usdt' ? 'Copied ✓' : 'Copy'}
                  </button>
                </div>
                <p className="text-[10px] text-purple-700 font-medium">
                  After sending USDT or SWIFT Wire, click below to log your transaction reference for support approval.
                </p>
              </div>
            )}

            {/* Ordered Withdrawal Flow: Gateway -> Bank -> 10-Digit Account -> Verify (works at ₦0) -> Account Name -> Source Pocket -> Amount & INSUFFICIENT FUNDS -> Confirm */}
            {activeTab === 'withdraw' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <p className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    1. Gateway & Receiving Bank
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPayoutGateway('paystack');
                        setVerifiedAccountName(null);
                        setVerifyError(null);
                      }}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black border transition-all ${
                        payoutGateway === 'paystack'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      Paystack Transfer
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPayoutGateway('flutterwave');
                        setVerifiedAccountName(null);
                        setVerifyError(null);
                      }}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black border transition-all ${
                        payoutGateway === 'flutterwave'
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      Flutterwave Transfer
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold block">2. Select Bank</label>
                    <select
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={bankCode}
                      onChange={e => {
                        const chosen = activeBankDirectory.find(b => b.code === e.target.value);
                        setBankCode(e.target.value);
                        if (chosen) setBankName(chosen.name);
                        setVerifiedAccountName(null);
                        setVerifyError(null);
                      }}
                    >
                      {activeBankDirectory.map((b, idx) => (
                        <option key={`${b.code}-${idx}`} value={b.code}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold block">3. 10-Digit Account Number</label>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="e.g. 0123456789"
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={accountNumber}
                      onChange={e => {
                        setAccountNumber(e.target.value.replace(/\D/g, ''));
                        setVerifiedAccountName(null);
                        setVerifyError(null);
                      }}
                    />
                  </div>

                  {/* Verify Bank Account Button — works EVEN when balance is ₦0.00 */}
                  <button
                    type="button"
                    disabled={isResolvingName || accountNumber.replace(/\D/g, '').length !== 10}
                    onClick={() => handleVerifyAccount(payoutGateway)}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isResolvingName ? 'animate-spin' : ''}`} />
                    <span>{isResolvingName ? 'Verifying Account with Bank...' : '4. Verify Bank Account'}</span>
                  </button>

                  {verifiedAccountName && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-[10px] font-black uppercase text-emerald-700">Account Verified</p>
                        <p className="text-xs font-black">{verifiedAccountName}</p>
                      </div>
                    </div>
                  )}

                  {verifyError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{verifyError}</span>
                    </div>
                  )}
                </div>

                {/* Source Pocket & Balance + Amount */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3 border border-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      5. Source Pocket
                    </span>
                    <span className="text-xs font-mono font-black text-emerald-400">
                      Avail: {formatCurrencyAmount(availableWithdrawBalance, withdrawCurrencyMeta.code)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setWithdrawSource('depositWallet')}
                      className={`py-2 px-2 rounded-xl text-[10px] font-black border transition-all ${
                        withdrawSource === 'depositWallet'
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      Deposit Pocket
                    </button>
                    <button
                      type="button"
                      onClick={() => setWithdrawSource('playerWallet')}
                      className={`py-2 px-2 rounded-xl text-[10px] font-black border transition-all ${
                        withdrawSource === 'playerWallet'
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      Play Wallet
                    </button>
                    <button
                      type="button"
                      onClick={() => setWithdrawSource('cashOutWallet')}
                      className={`py-2 px-2 rounded-xl text-[10px] font-black border transition-all ${
                        withdrawSource === 'cashOutWallet'
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      Cash Out
                    </button>
                  </div>

                  {withdrawSource === 'depositWallet' && (
                    <select
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white"
                      value={withdrawCurrency}
                      onChange={e => setWithdrawCurrency(e.target.value)}
                    >
                      {ACTIVE_WALLET_CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code} — Avail: {formatCurrencyAmount(user.walletPockets?.[c.code] ?? (c.code === 'NGN' ? (user.depositWallet || 0) : 0), c.code)}
                        </option>
                      ))}
                    </select>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      6. Amount to Withdraw ({withdrawCurrencyMeta.code})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                        {withdrawCurrencyMeta.symbol}
                      </span>
                      <input
                        type="text"
                        pattern="[0-9.]*"
                        disabled={!!fixedAmount}
                        placeholder="Enter withdrawal amount"
                        className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-base font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={amount}
                        onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                      />
                    </div>
                  </div>

                  {isWithdrawInsufficient && (
                    <div className="p-3 bg-rose-950/90 border border-rose-500 rounded-xl text-rose-200 text-xs font-black flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>
                        INSUFFICIENT FUNDS — Available: {formatCurrencyAmount(availableWithdrawBalance, withdrawCurrencyMeta.code)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action CTA Button */}
            {activeTab === 'deposit' && paymentMethod === 'paystack' && (
              <button
                type="button"
                onClick={handlePaystackCheckout}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Proceed with Paystack ({formatCurrencyAmount(Number(amount) || 0, depositCurrency)})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {activeTab === 'deposit' && paymentMethod === 'flutterwave' && (
              <button
                type="button"
                onClick={handleFlutterwaveCheckout}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Proceed with Flutterwave ({formatCurrencyAmount(Number(amount) || 0, depositCurrency)})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {(activeTab === 'withdraw' || (activeTab === 'deposit' && (paymentMethod === 'bank_transfer' || paymentMethod === 'crypto'))) && (
              <button
                type="submit"
                disabled={activeTab === 'withdraw' && (!verifiedAccountName || isWithdrawInsufficient)}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <span>
                  {activeTab === 'deposit'
                    ? 'Submit Deposit Proof'
                    : `Confirm ${payoutGateway === 'paystack' ? 'Paystack' : 'Flutterwave'} Withdrawal`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

          </form>
        )}

        {/* 4. Processing State */}
        {step === 'processing' && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-emerald-600 animate-spin flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-600 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Processing Your Settlement...</p>
              <p className="text-xs text-slate-500 mt-1">Connecting Interbank API Switch & Ledger</p>
            </div>
            
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden max-w-xs">
              <div 
                className="bg-emerald-600 h-full transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* 5. Success Screen */}
        {step === 'success' && createdTx && (
          <div className="py-6 flex flex-col items-center text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Transaction Submitted!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Reference ID: <span className="font-mono font-bold text-slate-800">{createdTx.reference}</span>
              </p>
            </div>

            <div className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <span className="font-mono font-bold text-slate-900">₦{(createdTx.amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-bold text-slate-900">{createdTx.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  {createdTx.status}
                </span>
              </div>
            </div>

            <div className="flex gap-2 w-full pt-2">
              <button
                type="button"
                onClick={() => setShowReceiptModal(true)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>View Receipt</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl transition-all shadow-md shadow-emerald-600/20"
              >
                <span>Done</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Transaction PIN Confirmation Dialog */}
      <TransactionPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onConfirm={handlePinConfirmed}
        amount={Number(amount) || 0}
        action={activeTab === 'deposit' ? 'Wallet Funding' : 'Earnings Cashout'}
      />

      {/* Receipt Modal */}
      {showReceiptModal && createdTx && (
        <StrategicReceipt
          transaction={createdTx}
          userEmail={user.email}
          onClose={() => setShowReceiptModal(false)}
        />
      )}

    </div>
  );
};
