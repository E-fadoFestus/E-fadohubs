import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileEdit, 
  CreditCard, 
  Calendar, 
  ShieldCheck, 
  Lightbulb, 
  Plus, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Wallet, 
  History, 
  FileText, 
  ChevronRight, 
  Info, 
  Lock, 
  HelpCircle,
  TrendingUp,
  Download,
  Search,
  X,
  Loader2,
  Banknote,
  UserCheck,
  MapPin,
  Briefcase,
  Phone,
  Mail,
  Scale,
  DollarSign,
  Fingerprint,
  Building2,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Loan, LoanApplication, LoanRepayment, LoanOffer, LoanVendor } from '../types';
import { db, auth, collection, onSnapshot, query, where, addDoc, serverTimestamp, doc, updateDoc } from '../firebase';
import { useCurrency } from '../lib/CurrencyContext';
import { SUPPORT_EMAILS, PHONE_NUMBERS, OFFICE_ADDRESSES } from '../constants/businessProfile';
import { LoanVendorRegistration } from './LoanVendorRegistration';
import { PaymentPlatform } from './PaymentPlatform';
import { increment } from '../firebase';

const FormField: React.FC<{
  label: string,
  icon?: React.ReactNode,
  error?: string,
  hint?: string,
  required?: boolean,
  children: React.ReactNode
}> = ({ label, icon, error, hint, required = true, children }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${error ? 'text-rose-500' : 'text-gray-600'}`}>
        {icon} {label} {!required && <span className="text-[8px] opacity-60">(Optional)</span>}
      </label>
      {required && <div className={`w-1 h-1 rounded-full ${error ? 'bg-rose-500 animate-ping' : 'bg-indigo-400'}`} />}
    </div>
    <div className={`transition-all duration-300 ${error ? 'ring-2 ring-rose-500/20' : ''}`}>
      {children}
    </div>
    {error ? (
      <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" /> {error}
      </motion.p>
    ) : hint && (
      <p className="text-[9px] font-bold text-slate-500 leading-tight">{hint}</p>
    )}
  </div>
);

interface EfadoHepiHandsLoanProps {
  user: UserProfile;
}

type LoanTab = 'DASHBOARD' | 'APPLY' | 'MY_LOANS' | 'REPAYMENT' | 'TRUST' | 'COMMUNITY';

export const EfadoHepiHandsLoan: React.FC<EfadoHepiHandsLoanProps> = ({ user }) => {
  const { formatPrice, selectedCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState<LoanTab>('DASHBOARD');
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [repayments, setRepayments] = useState<LoanRepayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showVendorReg, setShowVendorReg] = useState(false);
  const [myVendorProfile, setMyVendorProfile] = useState<LoanVendor | null>(null);
  const [showSystemGuide, setShowSystemGuide] = useState(false);

  // Robust Repayment States
  const [selectedRepaymentMethod, setSelectedRepaymentMethod] = useState<'wallet' | 'paystack' | 'bank_transfer'>('wallet');
  const [selectedLoanId, setSelectedLoanId] = useState<string>('');
  const [payingRepayment, setPayingRepayment] = useState(false);
  const [showPaymentPlatform, setShowPaymentPlatform] = useState(false);
  const [repaymentFeedback, setRepaymentFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Mock offers for now
  const loanOffers: LoanOffer[] = [
    { id: '1', amount: 500, tenor: '1 month', interestRate: 5, fees: 10, description: 'Starter Loan' },
    { id: '2', amount: 2000, tenor: '3 months', interestRate: 8, fees: 25, description: 'Growth Loan' },
    { id: '3', amount: 5000, tenor: '6 months', interestRate: 12, fees: 50, description: 'Business Expansion' },
  ];

  // Application State
  const [loanAmount, setLoanAmount] = useState(1000);
  const [loanTenor, setLoanTenor] = useState(3); // months
  const [loanPurpose, setLoanPurpose] = useState('Business Expansion');
  const [kycData, setKycData] = useState({
    fullName: user.displayName || '',
    bvn: '',
    nin: '',
    address: '',
    employmentStatus: 'Employed',
    monthlyIncome: '',
    employerName: '',
    nextOfKinName: '',
    nextOfKinPhone: '',
    guarantorName: '',
    guarantorPhone: ''
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const calculateInterest = (amount: number, tenor: number) => {
    // Base rate 5% + 1% per 3 months
    const baseRate = 0.05;
    const tenorPremium = (tenor / 3) * 0.01;
    const rate = baseRate + tenorPremium;
    return amount * rate;
  };

  const interest = calculateInterest(loanAmount, loanTenor);
  const totalRepayment = loanAmount + interest;
  const monthlyInstallment = totalRepayment / loanTenor;

  const handleApply = async () => {
    const errors: Record<string, string> = {};
    if (!kycData.fullName) errors.fullName = "Full name is required for legal documentation.";
    if (!kycData.bvn) errors.bvn = "BVN is critical for identity verification.";
    if (!kycData.nin) errors.nin = "NIN is mandatory for regulatory compliance.";
    if (!kycData.monthlyIncome) errors.monthlyIncome = "Income info helps determine capacity.";
    if (!kycData.address) errors.address = "Verified residence is required.";
    if (!kycData.guarantorName) errors.guarantorName = "Guarantor is needed for security.";
    if (!kycData.guarantorPhone) errors.guarantorPhone = "Active phone for the guarantor is required.";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'loan_applications'), {
        userId: user.uid,
        userName: user.displayName || user.email,
        amount: loanAmount,
        tenor: `${loanTenor} Months`,
        purpose: loanPurpose,
        interest,
        totalRepayment,
        monthlyInstallment,
        kyc: kycData,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      alert('Application submitted successfully! Our agents will verify your details.');
      setActiveTab('DASHBOARD');
    } catch (error) {
      console.error('Error applying for loan:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubLoans = onSnapshot(
      query(collection(db, 'loans'), where('userId', '==', user.uid)),
      (snapshot) => {
        setActiveLoans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Loan)));
        setLoading(false);
      }
    );

    const unsubApps = onSnapshot(
      query(collection(db, 'loan_applications'), where('userId', '==', user.uid)),
      (snapshot) => {
        setApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoanApplication)));
      }
    );

    return () => {
      unsubLoans();
      unsubApps();
    };
  }, [user.uid]);

  useEffect(() => {
    const unsubVendor = onSnapshot(
      query(collection(db, 'loan_vendors'), where('userId', '==', user.uid)),
      (snapshot) => {
        if (!snapshot.empty) {
          setMyVendorProfile({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as LoanVendor);
        }
      }
    );
    return () => unsubVendor();
  }, [user.uid]);

  const handlePerformRepayment = async (amountOverride?: number) => {
    const activeLoan = activeLoans.find(l => l.id === selectedLoanId) || activeLoans[0];
    if (!activeLoan) {
      setRepaymentFeedback({ success: false, message: 'No active loan found to repay.' });
      return;
    }
    
    // Find next pending installment
    const scheduleIndex = activeLoan.repaymentSchedule.findIndex(s => s.status === 'pending');
    if (scheduleIndex === -1) {
      setRepaymentFeedback({ success: false, message: 'You have no pending scheduled installments!' });
      return;
    }
    
    const installment = activeLoan.repaymentSchedule[scheduleIndex];
    const amountToPay = amountOverride || installment.amount;
    
    setPayingRepayment(true);
    setRepaymentFeedback(null);
    try {
      if (selectedRepaymentMethod === 'wallet') {
        const currentBalance = user.playerWallet || 0;
        if (currentBalance < amountToPay) {
          setRepaymentFeedback({
            success: false,
            message: `Insufficient wallet balance. You need ${formatPrice(amountToPay)} but your wallet has ${formatPrice(currentBalance)}. Please fund your wallet first.`
          });
          setPayingRepayment(false);
          return;
        }
        
        await updateDoc(doc(db, 'users', user.uid), {
          playerWallet: increment(-amountToPay)
        });
      }
      
      const updatedSchedule = [...activeLoan.repaymentSchedule];
      updatedSchedule[scheduleIndex] = {
        ...updatedSchedule[scheduleIndex],
        status: 'paid'
      };
      
      const newRemainingAmt = Math.max(0, activeLoan.remainingAmount - amountToPay);
      const isClosed = newRemainingAmt <= 0;
      
      await updateDoc(doc(db, 'loans', activeLoan.id!), {
        repaymentSchedule: updatedSchedule,
        remainingAmount: newRemainingAmt,
        status: isClosed ? 'closed' : activeLoan.status
      });
      
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'payment',
        amount: amountToPay,
        currency: selectedCurrency.code,
        status: 'completed',
        purpose: 'Loan Repayment',
        description: `Installment repayment successfully settled via ${selectedRepaymentMethod === 'wallet' ? 'EFADO Wallet' : 'Paystack Core'}.`,
        timestamp: serverTimestamp()
      });
      
      await addDoc(collection(db, 'repayments'), {
        userId: user.uid,
        loanId: activeLoan.id,
        amount: amountToPay,
        method: selectedRepaymentMethod,
        timestamp: serverTimestamp(),
        installmentNumber: scheduleIndex + 1
      });
      
      setRepaymentFeedback({
        success: true,
        message: `Success! Repayment of ${formatPrice(amountToPay)} was processed. Your loan balance has been reduced.`
      });
      
    } catch (e: any) {
      console.error(e);
      setRepaymentFeedback({ success: false, message: e?.message || 'Failed to authorize repayment.' });
    } finally {
      setPayingRepayment(false);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Hero Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <TrendingUp className="w-32 h-32 text-indigo-600" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-md">Eligible</span>
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Credit Score: 720</p>
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-6 tracking-tight">Loan Dashboard</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                  <p className="text-xs font-black text-gray-500 uppercase mb-1">Active Balance</p>
                  <p className="text-2xl font-black text-gray-900">
                    {formatPrice(activeLoans.reduce((acc, l) => acc + l.remainingAmount, 0))}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-black text-gray-500 uppercase mb-1">Next Payment</p>
                  <p className="text-2xl font-black text-indigo-600">
                    {activeLoans.length > 0 ? formatPrice(activeLoans[0].repaymentSchedule.find(s => s.status === 'pending')?.amount || 0) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-black text-gray-500 uppercase mb-1">Due Date</p>
                  <p className="text-2xl font-black text-orange-600">
                    {activeLoans.length > 0 ? '12 Days' : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => setActiveTab('APPLY')}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-100 hover:scale-105 transition-all"
                >
                  Request Loan
                </button>
                <button 
                  onClick={() => setActiveTab('REPAYMENT')}
                  className="px-6 py-3 bg-white text-gray-900 border border-gray-200 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 transition-all"
                >
                  Make Payment
                </button>
              </div>
            </div>
          </div>

          {/* Smart Offers */}
          <section>
            <h3 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tight">Personalized Offers</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {loanOffers.map(offer => (
                <div key={offer.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h4 className="font-black text-gray-900 mb-1">{offer.description}</h4>
                  <p className="text-2xl font-black text-indigo-600 mb-4">{formatPrice(offer.amount)}</p>
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-[10px] font-black uppercase">
                      <span className="text-gray-500">Tenor</span>
                      <span className="text-gray-900">{offer.tenor}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase">
                      <span className="text-gray-500">Interest</span>
                      <span className="text-gray-900">{offer.interestRate}%</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('APPLY')}
                    className="w-full py-3 bg-gray-50 text-gray-900 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    Apply Now
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {/* Interactive Guide Trigger */}
          <motion.div 
            whileHover={{ y: -5 }}
            onClick={() => setShowSystemGuide(true)}
            className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group border border-white/5 cursor-pointer"
          >
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/20 rounded-full blur-[80px]" />
            <div className="relative z-10">
              <h3 className="text-xl font-black mb-2 uppercase tracking-tight">System Intelligence</h3>
              <p className="text-xs text-indigo-200/60 mb-6 leading-relaxed">
                New to EFADO? Master the ecosystem loop from deposits to strategic withdrawals for a seamless experience.
              </p>
              
              <div className="w-full py-5 bg-white text-slate-950 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 group-hover:bg-indigo-50 transition-all shadow-xl">
                <HelpCircle className="w-4 h-4" />
                Launch Interactive Guide
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {showSystemGuide && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowSystemGuide(false)}
                  className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                />
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="relative w-full max-w-2xl bg-white rounded-[3rem] p-10 shadow-3xl overflow-hidden"
                >
                  <button 
                    onClick={() => setShowSystemGuide(false)}
                    className="absolute top-8 right-8 p-3 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="mb-12">
                    <h2 className="text-4xl font-black text-slate-950 tracking-tighter mb-2">How it works</h2>
                    <p className="text-slate-500 font-medium">Master the EFADO ecosystem flow</p>
                  </div>

                  <div className="space-y-10">
                    {[
                      {
                        step: '1',
                        title: 'Deposit funds into your **Deposit Wallet**.',
                        what: 'Access your secure funding terminal.',
                        how: 'Select "Deposit" in the Wallet Hub and choose your preferred gateway (Stripe, Crypto, or Bank Transfer).',
                        benefits: 'Instant liquidity access across all EFADO platforms with neural-grade security.'
                      },
                      {
                        step: '2',
                        title: 'Play the Lucky Spin using your **Player Wallet**.',
                        what: 'Activate your interactive experience.',
                        how: 'Move funds from your Deposit Wallet to your Player Wallet via the internal transfer bridge. Navigate to the Gist or Game hub to deploy your spins.',
                        benefits: 'Access to exclusive high-multiplier multipliers and early-bird raffle entries.'
                      },
                      {
                        step: '3',
                        title: 'Winnings are sent to your **Cash Out Wallet** for withdrawal.',
                        what: 'Seamlessly extract your success.',
                        how: 'Request a payout from your Cash Out wallet to your external linked accounts. Approval is fast-tracked for verified elite users.',
                        benefits: 'Global liquidity at your fingertips with zero-fee fast-track processing.'
                      }
                    ].map((item, idx) => (
                      <div key={idx} className="flex gap-6 group">
                        <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-black text-xl shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
                          {item.step}
                        </div>
                        <div className="space-y-4">
                          <h4 className="text-xl font-bold text-slate-900 leading-tight">
                            {item.title.split('**').map((text, i) => i % 2 === 1 ? <span key={i} className="text-indigo-600 font-black">{text}</span> : text)}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                             <div className="space-y-1">
                               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">What to do</p>
                               <p className="text-xs text-slate-600 font-medium leading-relaxed">{item.what}</p>
                             </div>
                             <div className="space-y-1">
                               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">How to do it</p>
                               <p className="text-xs text-slate-600 font-medium leading-relaxed">{item.how}</p>
                             </div>
                             <div className="space-y-1">
                               <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Your Benefits</p>
                               <p className="text-xs text-slate-600 font-medium leading-relaxed">{item.benefits}</p>
                             </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-12 pt-10 border-t border-gray-100">
                     <button 
                       onClick={() => setShowSystemGuide(false)}
                       className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-600 transition-all"
                     >
                       I Understood the Flow
                     </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Overdue Prevention */}
          <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <h4 className="font-bold text-orange-900">Safety Check</h4>
            </div>
            <p className="text-xs text-orange-800 leading-relaxed mb-4">
              Your next payment is due in 12 days. Keep your account funded to avoid late fees and maintain your high credit score.
            </p>
            <div className="w-full bg-orange-200 h-2 rounded-full overflow-hidden">
              <div className="bg-orange-600 h-full w-[70%]" />
            </div>
          </div>

          {/* Vendor Section */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Building2 className="w-32 h-32 text-white" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Lend on HEPIHANDS</h3>
              <p className="text-xs text-emerald-100/80 mb-6 leading-relaxed">
                Are you a licensed lender or an organization looking to grow your portfolio? Join our elite vendor network.
              </p>
              
              <div className="space-y-3 mb-8">
                {[
                  { icon: ShieldCheck, text: 'Verified Borrowers' },
                  { icon: Zap, text: 'Automated Collections' },
                  { icon: TrendingUp, text: 'High ROI Potential' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/90">
                    <item.icon className="w-4 h-4 text-emerald-300" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{item.text}</span>
                  </div>
                ))}
              </div>

              {myVendorProfile ? (
                <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                    <span className="text-[10px] font-black uppercase text-emerald-300">Status: {myVendorProfile.status}</span>
                  </div>
                  <p className="text-[10px] text-emerald-100/60">Your application is being processed by our compliance team.</p>
                </div>
              ) : (
                <button 
                  onClick={() => setShowVendorReg(true)}
                  className="w-full py-4 bg-white text-emerald-900 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  Apply as a Vendor <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderApply = () => (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <FileEdit className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Standard Loan Application</h2>
              <p className="text-gray-500 text-sm">International standard verification & flexible credit terms.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left: Form */}
            <div className="lg:col-span-2 space-y-12">
              {/* Loan Configuration */}
              <section className="space-y-6">
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> 01. Loan Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label={`Desired Amount (${selectedCurrency.code})`} icon={<DollarSign className="w-3 h-3" />}>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(Number(e.target.value))}
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-lg font-black focus:outline-none focus:border-indigo-500 transition-all"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">{selectedCurrency.code}</div>
                    </div>
                  </FormField>
                  <FormField label="Duration (Months)" icon={<Clock className="w-3 h-3" />}>
                    <select 
                      value={loanTenor}
                      onChange={(e) => setLoanTenor(Number(e.target.value))}
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-lg font-black focus:outline-none focus:border-indigo-500 appearance-none transition-all cursor-pointer"
                    >
                      <option value={1}>1 Month</option>
                      <option value={3}>3 Months</option>
                      <option value={6}>6 Months</option>
                      <option value={12}>12 Months</option>
                      <option value={24}>24 Months</option>
                    </select>
                  </FormField>
                </div>
              </section>

              {/* Borrower Integrity Form */}
              <section className="space-y-6">
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
                  <UserCheck className="w-4 h-4" /> 02. Borrower Integrity Profile
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField 
                    label="Full Legal Identity" 
                    error={validationErrors.fullName}
                    hint="Your official name as shown on national ID."
                  >
                    <input 
                      type="text" 
                      value={kycData.fullName}
                      onChange={(e) => {
                        setKycData({...kycData, fullName: e.target.value});
                        if (validationErrors.fullName) setValidationErrors({...validationErrors, fullName: ''});
                      }}
                      className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 font-bold transition-all ${validationErrors.fullName ? 'border-rose-500' : 'border-gray-100'}`}
                    />
                  </FormField>
                  <FormField 
                    label="BVN Verification Node" 
                    error={validationErrors.bvn}
                    hint="Strategic identity identifier for financial mapping."
                  >
                    <input 
                      type="text" 
                      placeholder="222********"
                      value={kycData.bvn}
                      onChange={(e) => {
                        setKycData({...kycData, bvn: e.target.value});
                        if (validationErrors.bvn) setValidationErrors({...validationErrors, bvn: ''});
                      }}
                      className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 font-bold transition-all ${validationErrors.bvn ? 'border-rose-500' : 'border-gray-100'}`}
                    />
                  </FormField>
                  <FormField 
                    label="NIN Authentication" 
                    error={validationErrors.nin}
                    hint="National Identity Number for cross-hub verification."
                  >
                    <input 
                      type="text" 
                      placeholder="123********"
                      value={kycData.nin}
                      onChange={(e) => {
                        setKycData({...kycData, nin: e.target.value});
                        if (validationErrors.nin) setValidationErrors({...validationErrors, nin: ''});
                      }}
                      className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 font-bold transition-all ${validationErrors.nin ? 'border-rose-500' : 'border-gray-100'}`}
                    />
                  </FormField>
                  <FormField 
                    label={`Declared Monthly Revenue (${selectedCurrency.code})`} 
                    error={validationErrors.monthlyIncome}
                    hint="Average monthly earnings for repayment assessment."
                  >
                    <input 
                      type="number" 
                      value={kycData.monthlyIncome}
                      onChange={(e) => {
                        setKycData({...kycData, monthlyIncome: e.target.value});
                        if (validationErrors.monthlyIncome) setValidationErrors({...validationErrors, monthlyIncome: ''});
                      }}
                      className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 font-bold transition-all ${validationErrors.monthlyIncome ? 'border-rose-500' : 'border-gray-100'}`}
                    />
                  </FormField>
                  <div className="md:col-span-2">
                    <FormField 
                      label="Primary Residential Deployment Point" 
                      error={validationErrors.address}
                      hint="Detailed street and landmark info for location mapping."
                    >
                      <textarea 
                        rows={2}
                        value={kycData.address}
                        onChange={(e) => {
                          setKycData({...kycData, address: e.target.value});
                          if (validationErrors.address) setValidationErrors({...validationErrors, address: ''});
                        }}
                        className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 font-bold transition-all resize-none ${validationErrors.address ? 'border-rose-500' : 'border-gray-100'}`}
                      />
                    </FormField>
                  </div>
                </div>
              </section>

              {/* Anti-Absconding Verification */}
              <section className="space-y-6">
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> 03. Tactical Verification Nodes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField 
                    label="Guarantor Identity Name" 
                    error={validationErrors.guarantorName}
                    hint="Responsible party to verify your integrity."
                  >
                    <input 
                      type="text" 
                      value={kycData.guarantorName}
                      onChange={(e) => {
                        setKycData({...kycData, guarantorName: e.target.value});
                        if (validationErrors.guarantorName) setValidationErrors({...validationErrors, guarantorName: ''});
                      }}
                      className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 font-bold transition-all ${validationErrors.guarantorName ? 'border-rose-500' : 'border-gray-100'}`}
                    />
                  </FormField>
                  <FormField 
                    label="Guarantor Strategic Hot-Line" 
                    error={validationErrors.guarantorPhone}
                    hint="Active mobile number for verification dispatch."
                  >
                    <input 
                      type="tel" 
                      value={kycData.guarantorPhone}
                      onChange={(e) => {
                        setKycData({...kycData, guarantorPhone: e.target.value});
                        if (validationErrors.guarantorPhone) setValidationErrors({...validationErrors, guarantorPhone: ''});
                      }}
                      className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 font-bold transition-all ${validationErrors.guarantorPhone ? 'border-rose-500' : 'border-gray-100'}`}
                    />
                  </FormField>
                </div>
              </section>

              <button 
                onClick={handleApply}
                disabled={loading}
                className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    Confirm & Submit Application
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            {/* Right: Summary Card */}
            <div className="space-y-6">
              <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-2xl sticky top-8">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 mb-8">Loan Summary</h4>
                
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase text-gray-400">Principal</span>
                    <span className="text-2xl font-black">{formatPrice(loanAmount)}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase text-gray-400">Interest (Calculated)</span>
                    <span className="text-lg font-black text-emerald-400">+{formatPrice(interest)}</span>
                  </div>
                  <div className="pt-6 border-t border-white/10">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] font-black uppercase text-gray-400">Total Repayment</span>
                      <span className="text-3xl font-black text-white">{formatPrice(totalRepayment)}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black uppercase text-gray-400">Monthly Installment</span>
                      <span className="text-sm font-bold text-indigo-300">{formatPrice(monthlyInstallment)} / mo</span>
                    </div>
                  </div>
                </div>

                <div className="mt-10 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <Fingerprint className="w-4 h-4 text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Integrity Lock</span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    This application is cryptographically linked to your BVN/NIN. Absconding will result in automatic reporting to global credit bureaus.
                  </p>
                </div>
              </div>

              <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                <div className="flex items-center gap-3 mb-3">
                  <Info className="w-5 h-5 text-indigo-600" />
                  <h5 className="text-xs font-black text-indigo-900 uppercase">Transparency Note</h5>
                </div>
                <p className="text-[10px] text-indigo-700 leading-relaxed">
                  Interest rates are calculated dynamically based on duration. Longer tenors attract a small premium for risk management.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMyLoans = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Account Center</h2>
        <div className="flex gap-2">
          <button className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-indigo-600 transition-colors">
            <Download className="w-5 h-5" />
          </button>
          <button className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-indigo-600 transition-colors">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section>
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Active Loans</h3>
            {activeLoans.length === 0 ? (
              <div className="p-12 bg-white rounded-3xl border border-gray-100 text-center">
                <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No active loans found.</p>
              </div>
            ) : (
              activeLoans.map(loan => (
                <div key={loan.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-4">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="font-black text-gray-900">{loan.tenor} Growth Loan</h4>
                      <p className="text-xs text-gray-400">ID: {loan.id?.slice(0, 8)}</p>
                    </div>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase rounded-full">
                      {loan.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase">Remaining</p>
                      <p className="text-lg font-black text-gray-900">{formatPrice(loan.remainingAmount)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase">Principal</p>
                      <p className="text-lg font-black text-gray-900">{formatPrice(loan.principal)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase">Interest</p>
                      <p className="text-lg font-black text-gray-900">{formatPrice(loan.interest)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase">Next Due</p>
                      <p className="text-lg font-black text-orange-600">Apr 24</p>
                    </div>
                  </div>
                  <button className="w-full py-3 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-800 transition-all">
                    View Installment Breakdown
                  </button>
                </div>
              ))
            )}
          </section>

          <section>
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Repayment History</h3>
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Method</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-gray-900">Apr 10, 2026</td>
                    <td className="px-6 py-4 text-xs font-black text-gray-900">{formatPrice(250)}</td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-500 capitalize">Wallet</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-md">Completed</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-600 text-white p-6 rounded-3xl shadow-lg">
            <h4 className="font-black uppercase tracking-widest text-xs mb-4">Loan Statements</h4>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/10 rounded-2xl border border-white/10 hover:bg-white/20 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-indigo-200" />
                    <span className="text-xs font-bold">Statement_Apr_2026.pdf</span>
                  </div>
                  <Download className="w-4 h-4 text-indigo-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRepayment = () => {
    const activeLoan = activeLoans.find(l => l.id === selectedLoanId) || activeLoans[0];
    const nextInstallment = activeLoan?.repaymentSchedule.find(s => s.status === 'pending');
    const paymentAmount = nextInstallment?.amount || 0;

    return (
      <div className="space-y-8">
        {activeLoans.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm text-center max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">No Active Loans</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              You currently do not have any outstanding loans or upcoming payment installments. Your financial status is fully clear.
            </p>
            <button
              onClick={() => setActiveTab('APPLY')}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
            >
              Get a Fast Loan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Active Loan Selector if multiple */}
              {activeLoans.length > 1 && (
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-400">Select Loan Facility</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeLoans.map((l, i) => (
                      <button
                        key={l.id || i}
                        onClick={() => setSelectedLoanId(l.id || '')}
                        className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                          (l.id === selectedLoanId || (!selectedLoanId && i === 0))
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-2 ring-indigo-600/5'
                            : 'border-gray-150 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-xs font-black uppercase">{l.tenor} Loan Facility</span>
                        <span className="text-sm font-bold text-gray-800 mt-2">Remaining: {formatPrice(l.remainingAmount)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Repayment Calendar */}
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Repayment Schedule</h3>
                  <span className="text-xs font-black text-amber-600 uppercase bg-amber-50 px-3 py-1 rounded-full">
                    {activeLoan.repaymentSchedule.filter(s => s.status === 'paid').length} / {activeLoan.repaymentSchedule.length} Settled
                  </span>
                </div>
                
                <div className="space-y-3 mt-6">
                  {activeLoan.repaymentSchedule.map((s, index) => (
                    <div 
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        s.status === 'paid' 
                          ? 'border-emerald-100 bg-emerald-50/40 text-emerald-900' 
                          : s.status === 'overdue'
                          ? 'border-rose-100 bg-rose-50/40 text-rose-900'
                          : 'border-gray-100 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black uppercase ${
                          s.status === 'paid' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase text-gray-800">Installment #{index + 1}</p>
                          <p className="text-[10px] text-gray-500 font-semibold uppercase">Due: 12 Days</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black">{formatPrice(s.amount)}</p>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block mt-1 ${
                          s.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {s.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Make a Payment Component */}
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-tight">Perform Clear Payment</h3>
                
                {repaymentFeedback && (
                  <div className={`p-4 rounded-2xl border mb-6 text-xs font-semibold leading-relaxed flex items-start gap-2.5 ${
                    repaymentFeedback.success 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                      : 'bg-rose-50 border-rose-100 text-rose-800'
                  }`}>
                    {repaymentFeedback.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                    <p>{repaymentFeedback.message}</p>
                  </div>
                )}

                {!nextInstallment ? (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <p className="text-xs font-black text-emerald-900 uppercase">You are completely Paid Up!</p>
                    <p className="text-[10px] text-emerald-700">All scheduled installments for this loan facility have been resolved.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Repayment Amount</span>
                        <h4 className="text-lg font-black text-gray-900">Installment #{activeLoan.repaymentSchedule.filter(s => s.status === 'paid').length + 1}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-indigo-600">{formatPrice(paymentAmount)}</span>
                        <p className="text-[9px] text-gray-400 font-mono">No hidden interest additions</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* EFADO Balance Wallet */}
                      <button
                        type="button"
                        onClick={() => setSelectedRepaymentMethod('wallet')}
                        className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                          selectedRepaymentMethod === 'wallet'
                            ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/5'
                            : 'border-gray-100 hover:bg-gray-50'
                        }`}
                      >
                        <Wallet className="w-6 h-6 text-indigo-600 mb-2" />
                        <h4 className="font-bold text-sm text-gray-900">EFADO Wallet</h4>
                        <p className="text-[10px] text-indigo-600 font-bold mt-1">Balance: {formatPrice(user.playerWallet)}</p>
                      </button>

                      {/* Paystack instant */}
                      <button
                        type="button"
                        onClick={() => setSelectedRepaymentMethod('paystack')}
                        className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                          selectedRepaymentMethod === 'paystack'
                            ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/5'
                            : 'border-gray-100 hover:bg-gray-50'
                        }`}
                      >
                        <CreditCard className="w-6 h-6 text-gray-400 mb-2" />
                        <h4 className="font-bold text-sm text-gray-900">Debit Card / USSD</h4>
                        <p className="text-[10px] text-gray-500 font-semibold mt-1">Instant Paystack</p>
                      </button>

                      {/* Bank transfer */}
                      <button
                        type="button"
                        onClick={() => setSelectedRepaymentMethod('bank_transfer')}
                        className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                          selectedRepaymentMethod === 'bank_transfer'
                            ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/5'
                            : 'border-gray-100 hover:bg-gray-50'
                        }`}
                      >
                        <History className="w-6 h-6 text-gray-400 mb-2" />
                        <h4 className="font-bold text-sm text-gray-900">Bank Transfer</h4>
                        <p className="text-[10px] text-gray-500 font-semibold mt-1">DVA Instant Credit</p>
                      </button>
                    </div>

                    <button 
                      onClick={() => {
                        if (selectedRepaymentMethod === 'wallet') {
                          handlePerformRepayment();
                        } else {
                          setShowPaymentPlatform(true);
                        }
                      }}
                      disabled={payingRepayment}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                    >
                      {payingRepayment ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          Processing Repayment...
                        </>
                      ) : (
                        <>
                          <span>Pay {formatPrice(paymentAmount)} Installment & Get Receipt</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-black uppercase tracking-widest text-xs text-gray-900">Autopay Control</h4>
                  <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-6">
                  Autopay is active. We will automatically collect your upcoming installments from your EFADO Wallet precisely on the due date.
                </p>
                <button className="w-full py-3 bg-gray-50 text-gray-900 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-all">
                  Manage Autopay Terms
                </button>
              </div>

              <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                <h4 className="font-black uppercase tracking-widest text-xs text-emerald-900 mb-4 font-black">Refuel Wallet Savings</h4>
                <p className="text-xs text-emerald-800 mb-4 leading-normal">
                  Refuel your main wallet instantly using card checkout or unique dedicated accounts so we autoexecute future installments.
                </p>
                <button 
                  onClick={() => {
                    setSelectedRepaymentMethod('paystack');
                    setShowPaymentPlatform(true);
                  }}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                >
                  Top Up Wallet Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTrust = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-2 uppercase tracking-tight">Safety Center</h3>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Your security is our priority. Learn how we protect your data and how to stay safe from scams.
          </p>
          <ul className="space-y-3">
            <li className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:underline cursor-pointer">
              <ArrowRight className="w-3 h-3" /> Anti-fraud tips
            </li>
            <li className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:underline cursor-pointer">
              <ArrowRight className="w-3 h-3" /> Security checklist
            </li>
            <li className="flex items-center gap-2 text-xs font-bold text-red-600 hover:underline cursor-pointer">
              <ArrowRight className="w-3 h-3" /> Report a scam
            </li>
          </ul>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
            <Info className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-2 uppercase tracking-tight">Rates & Fees</h3>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            We believe in 100% transparency. No hidden charges, ever.
          </p>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-bottom border-gray-50">
              <span className="text-xs font-black text-gray-600 uppercase">Interest Rate</span>
              <span className="text-sm font-black text-gray-900">5% - 15% APR</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-bottom border-gray-50">
              <span className="text-xs font-black text-gray-600 uppercase">Processing Fee</span>
              <span className="text-sm font-black text-gray-900">1% of Principal</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-gray-600 uppercase">Late Penalty</span>
              <span className="text-sm font-black text-orange-600">0.5% / Day</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Support</h3>
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Tactical Help Desk</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <div className="flex items-center gap-3 text-slate-900 mb-1">
                  <Phone className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Global Support</span>
               </div>
               <p className="text-[10px] font-bold text-slate-500 uppercase">{PHONE_NUMBERS.CONTACT_1}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <div className="flex items-center gap-3 text-slate-900 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Head Office</span>
               </div>
               <p className="text-[10px] font-bold text-slate-500 uppercase leading-tight line-clamp-2">
                 {OFFICE_ADDRESSES.HEAD_OFFICE}
               </p>
            </div>
          </div>

          <button 
            onClick={() => window.location.href = `mailto:${SUPPORT_EMAILS.HEPIHANDS_LOAN}`}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <Mail className="w-4 h-4" /> Open Support Ticket
          </button>
        </div>
      </div>
    </div>
  );

  const renderCommunity = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-12 rounded-3xl text-white text-center">
        <Lightbulb className="w-16 h-16 text-indigo-200 mx-auto mb-6 animate-pulse" />
        <h2 className="text-3xl font-black mb-4 tracking-tight uppercase">HEPIHANDS Money Tips</h2>
        <p className="text-indigo-100 text-lg max-w-2xl mx-auto mb-8">
          Master your finances with short, actionable lessons from our community experts.
        </p>
        <div className="flex justify-center gap-4">
          <button className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl">
            Start Learning
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section>
          <h3 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-tight">Recent Lessons</h3>
          <div className="space-y-4">
            {[
              { title: 'Budgeting 101', duration: '5 min', category: 'Basics' },
              { title: 'Understanding Interest', duration: '8 min', category: 'Finance' },
              { title: 'Building Credit', duration: '10 min', category: 'Growth' },
            ].map((lesson, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                    <FileText className="w-6 h-6 text-gray-400 group-hover:text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{lesson.title}</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">{lesson.category} • {lesson.duration}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-600 transition-all" />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-tight">Challenges</h3>
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-black text-gray-900">Savings-to-Repay</h4>
                <p className="text-xs text-gray-500">Save {formatPrice(100)} this week towards your loan.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black uppercase">
                <span className="text-gray-500">Progress</span>
                <span className="text-emerald-600">{formatPrice(65)} / {formatPrice(100)}</span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[65%]" />
              </div>
              <p className="text-[10px] text-gray-500 font-bold italic">
                Completing this challenge earns you a 0.5% interest rate discount on your next loan!
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">EFADO HepiHands Loan</h1>
            <p className="text-gray-500 text-lg">Empowering your growth with transparent, accessible credit.</p>
          </div>
          <div className="flex items-center gap-4 p-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Wallet Balance</p>
              <p className="text-lg font-black text-gray-900">{formatPrice(user.playerWallet)}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mb-12 overflow-x-auto pb-4 no-scrollbar">
          {[
            { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'APPLY', label: 'Apply for Loan', icon: FileEdit },
            { id: 'MY_LOANS', label: 'My Loans', icon: CreditCard },
            { id: 'REPAYMENT', label: 'Repayment', icon: Calendar },
            { id: 'TRUST', label: 'Trust & Safety', icon: ShieldCheck },
            { id: 'COMMUNITY', label: 'Community', icon: Lightbulb },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as LoanTab)}
              className={`px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-3 whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                  : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'DASHBOARD' && renderDashboard()}
          {activeTab === 'APPLY' && renderApply()}
          {activeTab === 'MY_LOANS' && renderMyLoans()}
          {activeTab === 'REPAYMENT' && renderRepayment()}
          {activeTab === 'TRUST' && renderTrust()}
          {activeTab === 'COMMUNITY' && renderCommunity()}
        </motion.div>

        {/* Vendor Registration Modal */}
        <AnimatePresence>
          {showVendorReg && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
              >
                <button 
                  onClick={() => setShowVendorReg(false)}
                  className="absolute top-4 right-4 z-10 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <LoanVendorRegistration 
                  user={user}
                  onClose={() => setShowVendorReg(false)}
                  onSuccess={() => setShowVendorReg(false)}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unified Payment Platform Modal for Repayments */}
        <AnimatePresence>
          {showPaymentPlatform && (
            <PaymentPlatform
              user={user}
              type="deposit"
              amount={(activeLoans.find(l => l.id === selectedLoanId) || activeLoans[0])?.repaymentSchedule.find(s => s.status === 'pending')?.amount || 1000}
              purpose="Loan Facility Installment Repayment"
              hub="HEPIHANDS_LOANS"
              onSuccess={async () => {
                setShowPaymentPlatform(false);
                await handlePerformRepayment((activeLoans.find(l => l.id === selectedLoanId) || activeLoans[0])?.repaymentSchedule.find(s => s.status === 'pending')?.amount);
              }}
              onCancel={() => setShowPaymentPlatform(false)}
              onClose={() => setShowPaymentPlatform(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Footer Branding */}
      <div className="max-w-7xl mx-auto px-4 py-12 mt-12 border-t border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tighter">EFADO HEPIHANDS Loan Hub</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">A Product of EFADO Hubs</p>
            </div>
          </div>
          <div className="flex gap-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Responsible Lending</a>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for Zap icon if not imported
const Zap = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
