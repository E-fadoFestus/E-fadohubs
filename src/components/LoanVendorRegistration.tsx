import React, { useState } from 'react';
import { 
  Building2, 
  FileText, 
  ShieldCheck, 
  Mail, 
  Phone, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  X, 
  Loader2,
  Briefcase,
  Scale,
  DollarSign,
  Info,
  TrendingUp,
  User,
  Globe,
  Zap,
  Target,
  Award,
  ShieldAlert,
  UploadCloud,
  Check,
  CreditCard,
  FileCheck2,
  Trash2,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import { useCurrency } from '../lib/CurrencyContext';
import { db, collection, addDoc, serverTimestamp, doc, updateDoc, increment } from '../firebase';

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
      <label className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${error ? 'text-rose-500' : 'text-slate-400'}`}>
        {icon} {label} {!required && <span className="text-[9px] opacity-60 text-slate-500">(Optional)</span>}
      </label>
      {required && <div className={`w-1.5 h-1.5 rounded-full ${error ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />}
    </div>
    <div className={`transition-all duration-300 ${error ? 'ring-2 ring-rose-500/20' : ''}`}>
      {children}
    </div>
    {error ? (
      <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] font-bold text-rose-500 flex items-center gap-1 mt-1">
        <ShieldAlert className="w-3.5 h-3.5" /> {error}
      </motion.p>
    ) : hint && (
      <p className="text-[9px] font-bold text-slate-500 leading-tight mt-1">{hint}</p>
    )}
  </div>
);

interface LoanVendorRegistrationProps {
  user: UserProfile;
  onClose: () => void;
  onSuccess: () => void;
}

interface UploadedFileState {
  name: string;
  size: string;
  progress: number;
  completed: boolean;
}

export const LoanVendorRegistration: React.FC<LoanVendorRegistrationProps> = ({ user, onClose, onSuccess }) => {
  const { formatPrice, selectedCurrency } = useCurrency();
  const [step, setStep] = useState<'WELCOME' | 'SUBSCRIPTION' | 'IDENTITY' | 'CREDENTIALS' | 'CERTIFICATES' | 'PARAMETERS' | 'SUCCESS'>('WELCOME');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Subscription Tiers
  const subscriptionTiers = [
    {
      id: 'silver',
      name: 'Silver Partner Pool',
      price: 49,
      limit: 25000,
      fee: '1.0%',
      color: 'from-slate-700 to-slate-900 border-slate-700',
      badgeColor: 'bg-slate-500 text-slate-100',
      features: ['Lending pool up to $25,000', '24-hour verification', 'Standard credit reporting integration', 'Priority client support']
    },
    {
      id: 'gold',
      name: 'Gold Sovereign Pool',
      price: 149,
      limit: 100000,
      fee: '0.5%',
      color: 'from-amber-600 to-amber-950 border-amber-500/40',
      badgeColor: 'bg-amber-500 text-white animate-pulse',
      features: ['Lending pool up to $100,000', '12-hour fast-track audit', 'Automated escrow collection split', 'Verified Premium Vendor Badge', 'Direct client matching index']
    },
    {
      id: 'titanium',
      name: 'Titanium Institutional Pool',
      price: 299,
      limit: 500000,
      fee: '0.1%',
      color: 'from-emerald-800 to-slate-950 border-emerald-500/30',
      badgeColor: 'bg-emerald-500 text-white',
      features: ['Lending pool up to $500,000', 'Instant compliance routing', 'Zero platform split escrow fees', 'Full API webhook access', 'Dedicated Account Manager Partner']
    }
  ];

  const [selectedTier, setSelectedTier] = useState('gold');

  const [formData, setFormData] = useState({
    vendorType: 'Organization' as 'Individual' | 'Organization',
    businessName: '',
    registrationNumber: '',
    licenseNumber: '',
    issuingAuthority: '',
    contactEmail: user.email || '',
    contactPhone: '',
    address: '',
    minAmount: 100,
    maxAmount: 10000,
    interestRange: '8% - 15%',
    supportedTenors: ['3 months', '6 months', '12 months'],
    lendingCapacity: '50000',
    targetAudience: 'All Members',
    // Settlement Account Fields
    settlementBank: '',
    settlementAccountName: '',
    settlementAccountNumber: '',
    escrowOptIn: true,
    webhookUrl: '',
  });

  // Certificates Upload Simulation States
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFileState>>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const simulateFileUpload = (fieldId: string, fileName: string) => {
    setUploadingField(fieldId);
    setUploadedFiles(prev => ({
      ...prev,
      [fieldId]: { name: fileName, size: '2.4 MB', progress: 10, completed: false }
    }));

    let progress = 10;
    const interval = setInterval(() => {
      progress += 30;
      if (progress >= 100) {
        clearInterval(interval);
        setUploadedFiles(prev => ({
          ...prev,
          [fieldId]: { ...prev[fieldId], progress: 100, completed: true }
        }));
        setUploadingField(null);
      } else {
        setUploadedFiles(prev => ({
          ...prev,
          [fieldId]: { ...prev[fieldId], progress }
        }));
      }
    }, 200);
  };

  const removeUploadedFile = (fieldId: string) => {
    setUploadedFiles(prev => {
      const copy = { ...prev };
      delete copy[fieldId];
      return copy;
    });
  };

  const validateStep = (currentStep: typeof step) => {
    const errors: Record<string, string> = {};
    if (currentStep === 'IDENTITY') {
      if (!formData.businessName) errors.businessName = "Legal trade name/identity is necessary for security vetting.";
      if (!formData.contactPhone) errors.contactPhone = "Support hotline phone number is required.";
      if (formData.vendorType === 'Organization' && !formData.registrationNumber) {
        errors.registrationNumber = "Corporate Registration RC Number is mandatory for organizations.";
      }
      if (!formData.settlementBank) errors.settlementBank = "Receiving Bank selection is mandatory.";
      if (!formData.settlementAccountNumber || formData.settlementAccountNumber.length < 9) {
        errors.settlementAccountNumber = "Valid Account Number is required for automated payouts.";
      }
      if (!formData.settlementAccountName) errors.settlementAccountName = "Settlement account name must match legal profile.";
    }
    if (currentStep === 'CREDENTIALS') {
      if (!formData.licenseNumber) errors.licenseNumber = "Authorized Lending License Number is required by law.";
      if (!formData.issuingAuthority) errors.issuingAuthority = "Specify the regulating financial authority body.";
      if (!formData.address) errors.address = "Registered administrative office physical location is mandatory.";
    }
    if (currentStep === 'CERTIFICATES') {
      if (!uploadedFiles['licenseCert']?.completed) {
        errors.licenseCert = "Lender License Certificate document is mandatory for validation.";
      }
      if (formData.vendorType === 'Organization' && !uploadedFiles['cacCert']?.completed) {
        errors.cacCert = "Certificate of Corporate Incorporation is required for registered organizations.";
      }
      if (!uploadedFiles['amlCert']?.completed) {
        errors.amlCert = "An signed AML / CFT Compliance Policy Confirmation is mandatory.";
      }
    }
    if (currentStep === 'PARAMETERS') {
      if (!formData.lendingCapacity || Number(formData.lendingCapacity) <= 0) {
        errors.lendingCapacity = "Total lending pool cap capacity is required.";
      }
      if (Number(formData.minAmount) >= Number(formData.maxAmount)) {
        errors.maxAmount = "Maximum loan amount must exceed the minimum loan amount.";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (step === 'WELCOME') setStep('SUBSCRIPTION');
    else if (step === 'SUBSCRIPTION') {
      // Deduct wallet balance check can happen later on finalization, but let's notify them of the pricing
      setStep('IDENTITY');
    }
    else if (step === 'IDENTITY') {
      if (validateStep('IDENTITY')) setStep('CREDENTIALS');
    }
    else if (step === 'CREDENTIALS') {
      if (validateStep('CREDENTIALS')) setStep('CERTIFICATES');
    }
    else if (step === 'CERTIFICATES') {
      if (validateStep('CERTIFICATES')) setStep('PARAMETERS');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep('PARAMETERS')) return;

    // Check Wallet Balance for Subscription Tier
    const tier = subscriptionTiers.find(t => t.id === selectedTier);
    const cost = tier ? tier.price : 99;
    const playerWalletBalance = user.playerWallet || 0;

    if (playerWalletBalance < cost) {
      alert(`Insufficient funds in your Player Wallet! Your current balance is ${formatPrice(playerWalletBalance)}, but the ${tier?.name} subscription costs ${formatPrice(cost)}. Please fund your wallet to proceed.`);
      return;
    }

    setLoading(true);
    try {
      // 1. Deduct subscription fee from playerWallet dynamically for real integration!
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        playerWallet: increment(-cost)
      });

      // 2. Insert into collection
      await addDoc(collection(db, 'loan_vendors'), {
        userId: user.uid,
        userName: user.displayName || user.email,
        businessName: formData.businessName,
        vendorType: formData.vendorType,
        registrationNumber: formData.registrationNumber,
        licenseNumber: formData.licenseNumber,
        issuingAuthority: formData.issuingAuthority,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        address: formData.address,
        subscriptionTier: selectedTier,
        subscriptionPrice: cost,
        settlement: {
          bank: formData.settlementBank,
          accountName: formData.settlementAccountName,
          accountNumber: formData.settlementAccountNumber,
          escrowOptIn: formData.escrowOptIn
        },
        lendingParameters: {
          minAmount: Number(formData.minAmount),
          maxAmount: Number(formData.maxAmount),
          interestRange: formData.interestRange,
          supportedTenors: formData.supportedTenors,
          capacity: Number(formData.lendingCapacity),
          targetAudience: formData.targetAudience,
          webhookUrl: formData.webhookUrl
        },
        documents: Object.keys(uploadedFiles).reduce((acc, key) => {
          acc[key] = {
            fileName: uploadedFiles[key].name,
            fileSize: uploadedFiles[key].size,
            uploadedAt: new Date().toISOString()
          };
          return acc;
        }, {} as Record<string, any>),
        status: 'verified', // Auto-approve as requested: "no need to be checking the form one by one so on a holistic capacity, create all perfectly suitable"
        createdAt: serverTimestamp()
      });

      // 3. Log transaction
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'subscription',
        amount: cost,
        currency: selectedCurrency.code,
        status: 'completed',
        purpose: 'Loan Vendor Subscription',
        description: `Subscribed to ${tier?.name} to unlock lending capabilities. Payout escrow active.`,
        timestamp: serverTimestamp()
      });

      setStep('SUCCESS');
    } catch (error) {
      console.error('Error registering loan vendor:', error);
      alert('An unexpected error occurred during database integration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-0 overflow-y-auto max-h-[85vh] no-scrollbar rounded-3xl text-slate-800 bg-slate-900 border border-slate-800">
      <AnimatePresence mode="wait">
        {step === 'WELCOME' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-8 md:p-12 text-white"
          >
            <div className="max-w-xl mx-auto text-center space-y-8 py-4">
              <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-3xl flex items-center justify-center mx-auto shadow-2xl relative">
                <ShieldCheck className="w-10 h-10 text-slate-950" />
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full flex items-center justify-center animate-bounce">
                  $
                </div>
              </div>
              
              <div className="space-y-3">
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-emerald-300 text-[10px] font-black uppercase tracking-widest inline-block">
                  Institutional Dispatch Node
                </span>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">
                  LEND ON <span className="text-emerald-400">EFADO HEPIHANDS</span>
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
                  Deploy liquidity, subscribe to specialized institutional pools, upload compliance credentials, and earn steady returns backed by automated escrow recovery.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-2">
                {[
                  { icon: Globe, title: 'High Ingress', desc: 'Matched directly with active loan seekers.' },
                  { icon: Scale, title: 'Compliance Hub', desc: 'Secure legal binding and credentials validation.' },
                  { icon: Award, title: 'Protected Escrow', desc: 'Automated settlement allocations split.' }
                ].map((item, i) => (
                  <div key={i} className="p-4 bg-slate-800/60 border border-slate-800 rounded-2xl flex flex-col items-start">
                    <item.icon className="w-5 h-5 text-emerald-400 mb-2" />
                    <h4 className="text-[10px] font-black uppercase tracking-wider mb-1 text-slate-200">{item.title}</h4>
                    <p className="text-[9px] text-slate-400 font-bold leading-tight">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleNext}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/15 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Configure Partnership <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'SUBSCRIPTION' && (
          <motion.div
            key="subscription"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-8 md:p-10 text-white"
          >
            <div className="mb-6 text-center">
              <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-md">Step 1 of 5</span>
              <h2 className="text-2xl font-black uppercase tracking-tight mt-3">Lender Subscription Tiers</h2>
              <p className="text-slate-400 text-xs mt-1">Select an active credit partner subscription pool to host your fund portfolio.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {subscriptionTiers.map(tier => (
                <div 
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
                  className={`border-2 rounded-3xl p-6 transition-all flex flex-col justify-between cursor-pointer relative overflow-hidden ${
                    selectedTier === tier.id 
                      ? 'bg-slate-800/80 border-emerald-500 shadow-xl shadow-emerald-500/5 scale-[1.02]' 
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  {selectedTier === tier.id && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                    </div>
                  )}
                  
                  <div>
                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded ${tier.badgeColor}`}>
                      {tier.name.split(' ')[0]}
                    </span>
                    <h3 className="text-lg font-black uppercase mt-2">{tier.name}</h3>
                    
                    <div className="my-4 flex items-baseline gap-1">
                      <span className="text-2xl font-black text-emerald-400">{formatPrice(tier.price)}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">/ month</span>
                    </div>

                    <div className="border-t border-slate-800 py-3 space-y-2">
                      <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                        <span>Max Credit Pool</span>
                        <span className="text-slate-100">{formatPrice(tier.limit)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                        <span>Platform Fee Split</span>
                        <span className="text-emerald-400">{tier.fee}</span>
                      </div>
                    </div>

                    <ul className="space-y-2 pt-2 border-t border-slate-800">
                      {tier.features.map((feat, index) => (
                        <li key={index} className="text-[10px] text-slate-300 font-bold flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setStep('WELCOME')}
                className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
              >
                Back
              </button>
              <button 
                onClick={handleNext}
                className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg transition-all flex items-center justify-center gap-2"
              >
                Next: Business Profile <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'IDENTITY' && (
          <motion.div
            key="identity"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-8 md:p-10 text-white"
          >
            <div className="mb-6">
              <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-md">Step 2 of 5</span>
              <h2 className="text-2xl font-black text-white mb-1 uppercase tracking-tight mt-3">Business Profile & Settlement</h2>
              <p className="text-slate-400 text-xs">Configure your primary legal credentials and payout account node.</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setFormData({...formData, vendorType: 'Individual'})}
                  className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                    formData.vendorType === 'Individual' 
                      ? 'border-emerald-500 bg-emerald-500/5' 
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                  }`}
                >
                  <User className={`w-6 h-6 ${formData.vendorType === 'Individual' ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${formData.vendorType === 'Individual' ? 'text-slate-100' : 'text-slate-400'}`}>Licensed Individual</span>
                </button>
                <button 
                  onClick={() => setFormData({...formData, vendorType: 'Organization'})}
                  className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                    formData.vendorType === 'Organization' 
                      ? 'border-emerald-500 bg-emerald-500/5' 
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                  }`}
                >
                  <Building2 className={`w-6 h-6 ${formData.vendorType === 'Organization' ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${formData.vendorType === 'Organization' ? 'text-slate-100' : 'text-slate-400'}`}>Corporate Entity</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField 
                  label={formData.vendorType === 'Organization' ? 'Registered Company Name' : 'Licensed Individual Name'} 
                  icon={<Building2 className="w-3.5 h-3.5 text-slate-400" />}
                  error={validationErrors.businessName}
                  hint="Provide full trade name as it appears on official docs."
                >
                  <input 
                    type="text" 
                    value={formData.businessName}
                    onChange={(e) => {
                      setFormData({...formData, businessName: e.target.value});
                      if (validationErrors.businessName) setValidationErrors({...validationErrors, businessName: ''});
                    }}
                    placeholder={formData.vendorType === 'Organization' ? "e.g. Apex Credit Cooperative" : "Your Full Legal Name"}
                    className="w-full px-5 py-3.5 bg-slate-800/60 border-2 border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </FormField>

                <FormField 
                  label={formData.vendorType === 'Organization' ? "Corporate Registration No. (CAC RC)" : "National Identification Number (NIN)"}
                  icon={<Briefcase className="w-3.5 h-3.5 text-slate-400" />}
                  error={validationErrors.registrationNumber}
                  hint={formData.vendorType === 'Organization' ? "CAC Registration RC number of organization" : "National ID for legal compliance validation"}
                >
                  <input 
                    type="text" 
                    value={formData.registrationNumber}
                    onChange={(e) => {
                      setFormData({...formData, registrationNumber: e.target.value});
                      if (validationErrors.registrationNumber) setValidationErrors({...validationErrors, registrationNumber: ''});
                    }}
                    placeholder={formData.vendorType === 'Organization' ? "RC-9837483" : "NIN-29384729384"} 
                    className="w-full px-5 py-3.5 bg-slate-800/60 border-2 border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Official Operations Email" icon={<Mail className="w-3.5 h-3.5 text-slate-400" />}>
                  <input 
                    type="email" 
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-800/60 border-2 border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none"
                  />
                </FormField>
                <FormField label="Corporate Hotline Support" icon={<Phone className="w-3.5 h-3.5 text-slate-400" />} error={validationErrors.contactPhone}>
                  <input 
                    type="tel" 
                    value={formData.contactPhone}
                    onChange={(e) => {
                      setFormData({...formData, contactPhone: e.target.value});
                      if (validationErrors.contactPhone) setValidationErrors({...validationErrors, contactPhone: ''});
                    }}
                    placeholder="+234 812..." 
                    className="w-full px-5 py-3.5 bg-slate-800/60 border-2 border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </FormField>
              </div>

              {/* Settlement banking section */}
              <div className="border-t border-slate-800 pt-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Settlement Bank node Configuration
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField label="Settlement Bank Name" error={validationErrors.settlementBank}>
                    <select 
                      value={formData.settlementBank}
                      onChange={(e) => {
                        setFormData({...formData, settlementBank: e.target.value});
                        if (validationErrors.settlementBank) setValidationErrors({...validationErrors, settlementBank: ''});
                      }}
                      className="w-full px-5 py-3.5 bg-slate-800/60 border-2 border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="">Select Settlement Bank</option>
                      <option value="access">Access Bank</option>
                      <option value="gtb">Guaranty Trust Bank (GTB)</option>
                      <option value="zenith">Zenith Bank</option>
                      <option value="uba">United Bank for Africa (UBA)</option>
                      <option value="firstbank">First Bank of Nigeria</option>
                      <option value="sterling">Sterling Bank</option>
                      <option value="kuda">Kuda Microfinance</option>
                      <option value="providus">Providus Bank</option>
                    </select>
                  </FormField>

                  <FormField label="Settlement Account No." error={validationErrors.settlementAccountNumber}>
                    <input 
                      type="text" 
                      maxLength={10}
                      value={formData.settlementAccountNumber}
                      onChange={(e) => {
                        setFormData({...formData, settlementAccountNumber: e.target.value.replace(/\D/g, '')});
                        if (validationErrors.settlementAccountNumber) setValidationErrors({...validationErrors, settlementAccountNumber: ''});
                      }}
                      placeholder="e.g. 0123456789"
                      className="w-full px-5 py-3.5 bg-slate-800/60 border-2 border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </FormField>

                  <FormField label="Settlement Account Name" error={validationErrors.settlementAccountName}>
                    <input 
                      type="text" 
                      value={formData.settlementAccountName}
                      onChange={(e) => {
                        setFormData({...formData, settlementAccountName: e.target.value});
                        if (validationErrors.settlementAccountName) setValidationErrors({...validationErrors, settlementAccountName: ''});
                      }}
                      placeholder="e.g. Apex cooperative Ltd"
                      className="w-full px-5 py-3.5 bg-slate-800/60 border-2 border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </FormField>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setStep('SUBSCRIPTION')}
                  className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
                >
                  Back
                </button>
                <button 
                  onClick={handleNext}
                  className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  Next: License Credentials <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'CREDENTIALS' && (
          <motion.div
            key="credentials"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-8 md:p-10 text-white"
          >
            <div className="mb-6">
              <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-md">Step 3 of 5</span>
              <h2 className="text-2xl font-black text-white mb-1 uppercase tracking-tight mt-3">Lending License credentials</h2>
              <p className="text-slate-400 text-xs">Verify your structural legal authority to issue microloans and commercial loans.</p>
            </div>

            <div className="space-y-6">
              <FormField 
                label="Lending License Permit Number" 
                icon={<Scale className="w-3.5 h-3.5 text-slate-400" />}
                error={validationErrors.licenseNumber}
                hint="Assigned micro-finance or money lending license number."
              >
                <input 
                  type="text" 
                  value={formData.licenseNumber}
                  onChange={(e) => {
                    setFormData({...formData, licenseNumber: e.target.value});
                    if (validationErrors.licenseNumber) setValidationErrors({...validationErrors, licenseNumber: ''});
                  }}
                  placeholder="e.g. CBN/MFI-837493" 
                  className="w-full px-5 py-3.5 bg-slate-800/60 border-2 border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition-all"
                />
              </FormField>

              <FormField 
                label="Issuing Financial Regulatory Body" 
                icon={<ShieldCheck className="w-3.5 h-3.5 text-slate-400" />}
                error={validationErrors.issuingAuthority}
                hint="The commission that granted your lending authority (e.g. Central Bank, Ministry of Justice)."
              >
                <input 
                  type="text" 
                  value={formData.issuingAuthority}
                  onChange={(e) => {
                    setFormData({...formData, issuingAuthority: e.target.value});
                    if (validationErrors.issuingAuthority) setValidationErrors({...validationErrors, issuingAuthority: ''});
                  }}
                  placeholder="e.g. Central Bank of Nigeria (CBN) / State Ministry of Finance" 
                  className="w-full px-5 py-3.5 bg-slate-800/60 border-2 border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition-all"
                />
              </FormField>

              <FormField 
                label="Registered Headquarters physical Address" 
                icon={<MapPin className="w-3.5 h-3.5 text-slate-400" />}
                error={validationErrors.address}
                hint="Your formal administrative office address for compliance mail delivery."
              >
                <textarea 
                  value={formData.address}
                  onChange={(e) => {
                    setFormData({...formData, address: e.target.value});
                    if (validationErrors.address) setValidationErrors({...validationErrors, address: ''});
                  }}
                  rows={3}
                  placeholder="Full physical headquarters location..." 
                  className="w-full px-5 py-3.5 bg-slate-800/60 border-2 border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition-all resize-none"
                />
              </FormField>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setStep('IDENTITY')}
                  className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
                >
                  Back
                </button>
                <button 
                  onClick={handleNext}
                  className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  Next: Certificates Upload <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'CERTIFICATES' && (
          <motion.div
            key="certificates"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-8 md:p-10 text-white"
          >
            <div className="mb-6">
              <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-md">Step 4 of 5</span>
              <h2 className="text-2xl font-black text-white mb-1 uppercase tracking-tight mt-3">Compliance & Certificates Upload</h2>
              <p className="text-slate-400 text-xs">Upload matching certificates to bolster portfolio integrity. Drag-and-drop or select documents.</p>
            </div>

            <div className="space-y-6">
              {/* License certificate */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-200 flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-emerald-400" /> Authorized Money Lender Permit Certificate
                  </span>
                  <span className="text-[8.5px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">MANDATORY</span>
                </div>
                {validationErrors.licenseCert && (
                  <p className="text-[9.5px] text-rose-500 font-bold mb-2 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> {validationErrors.licenseCert}</p>
                )}
                {uploadedFiles['licenseCert'] ? (
                  <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-emerald-400" />
                      <div>
                        <p className="text-xs font-bold text-white">{uploadedFiles['licenseCert'].name}</p>
                        <p className="text-[10px] text-slate-400">{uploadedFiles['licenseCert'].size} • {uploadedFiles['licenseCert'].completed ? 'Verified Match' : `Uploading ${uploadedFiles['licenseCert'].progress}%`}</p>
                      </div>
                    </div>
                    {uploadedFiles['licenseCert'].completed ? (
                      <button 
                        onClick={() => removeUploadedFile('licenseCert')}
                        className="p-1.5 bg-slate-700 hover:bg-rose-950 hover:text-rose-400 rounded-lg text-slate-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                    )}
                  </div>
                ) : (
                  <div 
                    onClick={() => simulateFileUpload('licenseCert', 'Lending_Authority_License_2026.pdf')}
                    className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-900/60 p-6 rounded-2xl text-center cursor-pointer transition-all hover:bg-slate-800/20 group"
                  >
                    <UploadCloud className="w-8 h-8 text-slate-500 group-hover:text-emerald-400 mx-auto mb-2 transition-colors" />
                    <p className="text-xs font-bold text-slate-300">Drag & Drop or Click to Upload License Certificate</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Accepted Formats: PDF, PNG, JPG (Max 5MB)</p>
                  </div>
                )}
              </div>

              {/* CAC certificate for Organizations */}
              {formData.vendorType === 'Organization' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-200 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-400" /> CAC Certificate of Incorporation
                    </span>
                    <span className="text-[8.5px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">MANDATORY</span>
                  </div>
                  {validationErrors.cacCert && (
                    <p className="text-[9.5px] text-rose-500 font-bold mb-2 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> {validationErrors.cacCert}</p>
                  )}
                  {uploadedFiles['cacCert'] ? (
                    <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-indigo-400" />
                        <div>
                          <p className="text-xs font-bold text-white">{uploadedFiles['cacCert'].name}</p>
                          <p className="text-[10px] text-slate-400">{uploadedFiles['cacCert'].size} • {uploadedFiles['cacCert'].completed ? 'Verified Match' : `Uploading ${uploadedFiles['cacCert'].progress}%`}</p>
                        </div>
                      </div>
                      {uploadedFiles['cacCert'].completed ? (
                        <button 
                          onClick={() => removeUploadedFile('cacCert')}
                          className="p-1.5 bg-slate-700 hover:bg-rose-950 hover:text-rose-400 rounded-lg text-slate-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                      )}
                    </div>
                  ) : (
                    <div 
                      onClick={() => simulateFileUpload('cacCert', 'CAC_Incorporation_Certificate.pdf')}
                      className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-900/60 p-6 rounded-2xl text-center cursor-pointer transition-all hover:bg-slate-800/20 group"
                    >
                      <UploadCloud className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 mx-auto mb-2 transition-colors" />
                      <p className="text-xs font-bold text-slate-300">Drag & Drop or Click to Upload Corporate Registration</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Accepted Formats: PDF, PNG, JPG (Max 5MB)</p>
                    </div>
                  )}
                </div>
              )}

              {/* AML / KYC Pledge Document */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-200 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-amber-400" /> Signed AML / CFT Anti-Money Laundering Pledge
                  </span>
                  <span className="text-[8.5px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">MANDATORY</span>
                </div>
                {validationErrors.amlCert && (
                  <p className="text-[9.5px] text-rose-500 font-bold mb-2 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> {validationErrors.amlCert}</p>
                )}
                {uploadedFiles['amlCert'] ? (
                  <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-amber-400" />
                      <div>
                        <p className="text-xs font-bold text-white">{uploadedFiles['amlCert'].name}</p>
                        <p className="text-[10px] text-slate-400">{uploadedFiles['amlCert'].size} • {uploadedFiles['amlCert'].completed ? 'Compliance Verified' : `Uploading ${uploadedFiles['amlCert'].progress}%`}</p>
                      </div>
                    </div>
                    {uploadedFiles['amlCert'].completed ? (
                      <button 
                        onClick={() => removeUploadedFile('amlCert')}
                        className="p-1.5 bg-slate-700 hover:bg-rose-950 hover:text-rose-400 rounded-lg text-slate-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                    )}
                  </div>
                ) : (
                  <div 
                    onClick={() => simulateFileUpload('amlCert', 'Anti_Money_Laundering_Compliance_Pledge.pdf')}
                    className="border-2 border-dashed border-slate-800 hover:border-amber-500/50 bg-slate-900/60 p-6 rounded-2xl text-center cursor-pointer transition-all hover:bg-slate-800/20 group"
                  >
                    <UploadCloud className="w-8 h-8 text-slate-500 group-hover:text-amber-400 mx-auto mb-2 transition-colors" />
                    <p className="text-xs font-bold text-slate-300">Drag & Drop or Click to Upload AML/CFT Compliance Pledge</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Accepted Formats: PDF, PNG, JPG (Max 5MB)</p>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setStep('CREDENTIALS')}
                  className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
                >
                  Back
                </button>
                <button 
                  onClick={handleNext}
                  className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  Next: Lending Limits & Parameters <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'PARAMETERS' && (
          <motion.div
            key="parameters"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-8 md:p-10 text-white"
          >
            <div className="mb-6">
              <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-md">Step 5 of 5</span>
              <h2 className="text-2xl font-black text-white mb-1 uppercase tracking-tight mt-3">Lending Limits & Webhook Config</h2>
              <p className="text-slate-400 text-xs">Define your specific credit parameters, risk appetite, and automation webhook endpoints.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Min Loan Principal Offered" icon={<DollarSign className="w-3.5 h-3.5 text-slate-400" />}>
                  <input 
                    type="number" 
                    value={formData.minAmount}
                    onChange={(e) => setFormData({...formData, minAmount: Number(e.target.value)})}
                    className="w-full px-5 py-3.5 bg-slate-800/60 border-2 border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none"
                  />
                </FormField>
                <FormField label="Max Loan Principal Offered" icon={<DollarSign className="w-3.5 h-3.5 text-slate-400" />} error={validationErrors.maxAmount}>
                  <input 
                    type="number" 
                    value={formData.maxAmount}
                    onChange={(e) => {
                      setFormData({...formData, maxAmount: Number(e.target.value)});
                      if (validationErrors.maxAmount) setValidationErrors({...validationErrors, maxAmount: ''});
                    }}
                    className="w-full px-5 py-3.5 bg-slate-800/60 border-2 border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Expected Interest APR Range" icon={<TrendingUp className="w-3.5 h-3.5 text-slate-400" />} hint="e.g. 8% - 15% Monthly/Annualized">
                  <input 
                    type="text" 
                    value={formData.interestRange}
                    onChange={(e) => setFormData({...formData, interestRange: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-800/60 border-2 border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none"
                  />
                </FormField>
                <FormField label="Target borrower Sector" icon={<Target className="w-3.5 h-3.5 text-slate-400" />} hint="Target segment focus">
                  <select 
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-800/60 border-2 border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none cursor-pointer"
                  >
                    <option>All Members</option>
                    <option>Small Business Owners</option>
                    <option>Agricultural Cooperatives</option>
                    <option>Import/Export Logistics</option>
                    <option>Students & Educators</option>
                    <option>Civil Servants</option>
                  </select>
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField 
                  label={`Lending Capital Liquidity Cap (${selectedCurrency.code})`} 
                  icon={<ShieldAlert className="w-3.5 h-3.5 text-slate-400" />} 
                  error={validationErrors.lendingCapacity}
                  hint="Your total dedicated active capital pool for lending."
                >
                  <input 
                    type="number" 
                    value={formData.lendingCapacity}
                    onChange={(e) => {
                      setFormData({...formData, lendingCapacity: e.target.value});
                      if (validationErrors.lendingCapacity) setValidationErrors({...validationErrors, lendingCapacity: ''});
                    }}
                    placeholder="e.g. 50000"
                    className="w-full px-5 py-3.5 bg-slate-800/60 border-2 border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </FormField>

                <FormField 
                  label="API Dispatch Webhook URL" 
                  icon={<Globe className="w-3.5 h-3.5 text-slate-400" />} 
                  required={false}
                  hint="To send real-time loan application JSON payloads."
                >
                  <input 
                    type="url" 
                    value={formData.webhookUrl}
                    onChange={(e) => setFormData({...formData, webhookUrl: e.target.value})}
                    placeholder="https://yourserver.com/api/loans"
                    className="w-full px-5 py-3.5 bg-slate-800/60 border-2 border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </FormField>
              </div>

              {/* Automated escrow checkbox */}
              <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800/80 flex items-start gap-3">
                <input 
                  id="escrowCheckbox"
                  type="checkbox" 
                  checked={formData.escrowOptIn}
                  onChange={(e) => setFormData({...formData, escrowOptIn: e.target.checked})}
                  className="w-4.5 h-4.5 rounded text-emerald-500 bg-slate-950 border-slate-800 mt-0.5 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <label htmlFor="escrowCheckbox" className="text-xs font-black uppercase text-slate-100 tracking-wider cursor-pointer">
                    Opt-In to Automated Platform Repayment Escrow Split
                  </label>
                  <p className="text-[9.5px] text-slate-400 font-bold leading-relaxed">
                    By checking this, EFADO automatically routes payments made by borrowers back to your settlement bank account/wallet minus standard pool processing split fees.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex gap-3">
                <Info className="w-5 h-5 text-emerald-400 shrink-0" />
                <p className="text-[10px] text-emerald-300 leading-relaxed font-bold">
                  Deduction Notice: Finalizing this application will subscribe your profile and deduct the selected tier subscription fee ({formatPrice(subscriptionTiers.find(t => t.id === selectedTier)?.price || 99)}) from your Player Wallet.
                </p>
              </div>

              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setStep('CERTIFICATES')}
                  className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
                >
                  Back
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Finalize & Subscribe Portfolio'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {step === 'SUCCESS' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-8 md:p-12 text-white"
          >
            <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Ecosystem Partnership Activated!</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-8 font-medium">
              Your subscription to the <span className="text-emerald-400 font-bold uppercase">{subscriptionTiers.find(t => t.id === selectedTier)?.name}</span> was authorized successfully. Your lender parameters and API webhooks are now online!
            </p>
            
            <button 
              onClick={onSuccess}
              className="w-full max-w-sm py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg transition-all"
            >
              Enter Lender Control Center
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
