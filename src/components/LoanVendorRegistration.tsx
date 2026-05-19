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
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import { useCurrency } from '../lib/CurrencyContext';
import { db, collection, addDoc, serverTimestamp } from '../firebase';

interface LoanVendorRegistrationProps {
  user: UserProfile;
  onClose: () => void;
  onSuccess: () => void;
}

export const LoanVendorRegistration: React.FC<LoanVendorRegistrationProps> = ({ user, onClose, onSuccess }) => {
  const { formatPrice, selectedCurrency } = useCurrency();
  const [step, setStep] = useState<'WELCOME' | 'IDENTITY' | 'CREDENTIALS' | 'PARAMETERS' | 'SUCCESS'>('WELCOME');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // FormField Helper Component
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
        <label className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${error ? 'text-rose-500' : 'text-gray-400'}`}>
          {icon} {label} {!required && <span className="text-[8px] opacity-60">(Optional)</span>}
        </label>
        {required && <div className={`w-1 h-1 rounded-full ${error ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />}
      </div>
      <div className={`transition-all duration-300 ${error ? 'ring-2 ring-rose-500/20' : ''}`}>
        {children}
      </div>
      {error ? (
        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
          <ShieldAlert className="w-3 h-3" /> {error}
        </motion.p>
      ) : hint && (
        <p className="text-[9px] font-medium text-slate-400 leading-tight">{hint}</p>
      )}
    </div>
  );

  const [formData, setFormData] = useState({
    vendorType: 'Organization' as 'Individual' | 'Organization',
    businessName: '',
    registrationNumber: '',
    licenseNumber: '',
    issuingAuthority: '',
    contactEmail: user.email,
    contactPhone: '',
    address: '',
    minAmount: 100,
    maxAmount: 10000,
    interestRange: '5% - 15%',
    supportedTenors: ['1 month', '3 months', '6 months'],
    lendingCapacity: '',
    targetAudience: 'All Members'
  });

  const validateStep = (currentStep: typeof step) => {
    const errors: Record<string, string> = {};
    if (currentStep === 'IDENTITY') {
      if (!formData.businessName) errors.businessName = "Legal identity is necessary for vetting.";
      if (!formData.contactPhone) errors.contactPhone = "Required for official correspondence.";
      if (formData.vendorType === 'Organization' && !formData.registrationNumber) {
        errors.registrationNumber = "RC Number is mandatory for organizations.";
      }
    }
    if (currentStep === 'CREDENTIALS') {
      if (!formData.licenseNumber) errors.licenseNumber = "Lending license is required by law.";
      if (!formData.issuingAuthority) errors.issuingAuthority = "Specify the regulating body.";
      if (!formData.address) errors.address = "Registered office location is mandatory.";
    }
    if (currentStep === 'PARAMETERS') {
      if (!formData.lendingCapacity) errors.lendingCapacity = "Total capacity helps us manage liquidity.";
      if (formData.minAmount >= formData.maxAmount) errors.maxAmount = "Max amount must exceed minimum.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (step === 'WELCOME') setStep('IDENTITY');
    else if (step === 'IDENTITY') {
      if (validateStep('IDENTITY')) setStep('CREDENTIALS');
    }
    else if (step === 'CREDENTIALS') {
      if (validateStep('CREDENTIALS')) setStep('PARAMETERS');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep('PARAMETERS')) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'loan_vendors'), {
        userId: user.uid,
        businessName: formData.businessName,
        registrationNumber: formData.registrationNumber,
        licenseNumber: formData.licenseNumber,
        issuingAuthority: formData.issuingAuthority,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        address: formData.address,
        lendingParameters: {
          minAmount: formData.minAmount,
          maxAmount: formData.maxAmount,
          interestRange: formData.interestRange,
          supportedTenors: formData.supportedTenors
        },
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setStep('SUCCESS');
    } catch (error) {
      console.error('Error registering loan vendor:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-0 overflow-hidden rounded-3xl">
      <AnimatePresence mode="wait">
        {step === 'WELCOME' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-10 bg-gradient-to-br from-emerald-600 to-teal-800 text-white"
          >
            <div className="max-w-xl mx-auto text-center space-y-8 py-10">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl">
                <ShieldCheck className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black tracking-tighter uppercase leading-tight">
                  Partner with <span className="text-emerald-300">HEPIHANDS</span>
                </h2>
                <p className="text-emerald-100/80 text-lg font-medium">
                  Join the world's most transparent lending ecosystem. Reach thousands of verified borrowers instantly.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                {[
                  { icon: Globe, title: 'Global Reach', desc: 'Access 50k+ users' },
                  { icon: Zap, title: 'Instant KYC', desc: 'Verified borrowers' },
                  { icon: Award, title: 'Secure Payouts', desc: 'Automated escrow' }
                ].map((item, i) => (
                  <div key={i} className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                    <item.icon className="w-6 h-6 text-emerald-300 mb-2" />
                    <h4 className="text-xs font-black uppercase tracking-widest mb-1">{item.title}</h4>
                    <p className="text-[10px] text-emerald-100/60 leading-tight">{item.desc}</p>
                  </div>
                ))}
              </div>

              <button 
                onClick={handleNext}
                className="w-full py-5 bg-white text-emerald-900 rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3"
              >
                Start Partner Application <ArrowRight className="w-5 h-5" />
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
            className="p-10 bg-white"
          >
            <div className="mb-8">
              <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Partner Identity</h2>
              <p className="text-gray-500 text-sm">Are you registering as an individual or an organization?</p>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setFormData({...formData, vendorType: 'Individual'})}
                  className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${
                    formData.vendorType === 'Individual' 
                      ? 'border-emerald-600 bg-emerald-50' 
                      : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                  }`}
                >
                  <User className={`w-8 h-8 ${formData.vendorType === 'Individual' ? 'text-emerald-600' : 'text-gray-400'}`} />
                  <span className={`text-xs font-black uppercase tracking-widest ${formData.vendorType === 'Individual' ? 'text-emerald-900' : 'text-gray-500'}`}>Individual</span>
                </button>
                <button 
                  onClick={() => setFormData({...formData, vendorType: 'Organization'})}
                  className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${
                    formData.vendorType === 'Organization' 
                      ? 'border-emerald-600 bg-emerald-50' 
                      : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                  }`}
                >
                  <Building2 className={`w-8 h-8 ${formData.vendorType === 'Organization' ? 'text-emerald-600' : 'text-gray-400'}`} />
                  <span className={`text-xs font-black uppercase tracking-widest ${formData.vendorType === 'Organization' ? 'text-emerald-900' : 'text-gray-500'}`}>Organization</span>
                </button>
              </div>

              <div className="space-y-6">
                <FormField 
                  label={formData.vendorType === 'Organization' ? 'Business Identity' : 'Legal Individual Name'} 
                  icon={<Building2 className="w-3 h-3" />}
                  error={validationErrors.businessName}
                  hint="Provide your full trade name as it appears on official docs."
                >
                  <input 
                    type="text" 
                    value={formData.businessName}
                    onChange={(e) => {
                      setFormData({...formData, businessName: e.target.value});
                      if (validationErrors.businessName) setValidationErrors({...validationErrors, businessName: ''});
                    }}
                    placeholder={formData.vendorType === 'Organization' ? "e.g. HepiLend Financials" : "Your Full Name"}
                    className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 font-bold transition-all ${validationErrors.businessName ? 'border-rose-500' : 'border-gray-100'}`}
                  />
                </FormField>

                {formData.vendorType === 'Organization' && (
                  <FormField 
                    label="Registration Number (CAC RC)" 
                    icon={<Briefcase className="w-3 h-3" />}
                    error={validationErrors.registrationNumber}
                    hint="Your official Corporate Affairs Commission number."
                  >
                    <input 
                      type="text" 
                      value={formData.registrationNumber}
                      onChange={(e) => {
                        setFormData({...formData, registrationNumber: e.target.value});
                        if (validationErrors.registrationNumber) setValidationErrors({...validationErrors, registrationNumber: ''});
                      }}
                      placeholder="RC-12345678" 
                      className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 font-bold transition-all ${validationErrors.registrationNumber ? 'border-rose-500' : 'border-gray-100'}`}
                    />
                  </FormField>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Official Contact Email" icon={<Mail className="w-3 h-3" />}>
                    <input 
                      type="email" 
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 font-bold"
                    />
                  </FormField>
                  <FormField label="Support Hot-Line" icon={<Phone className="w-3 h-3" />} error={validationErrors.contactPhone}>
                    <input 
                      type="tel" 
                      value={formData.contactPhone}
                      onChange={(e) => {
                        setFormData({...formData, contactPhone: e.target.value});
                        if (validationErrors.contactPhone) setValidationErrors({...validationErrors, contactPhone: ''});
                      }}
                      placeholder="+234..." 
                      className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 font-bold transition-all ${validationErrors.contactPhone ? 'border-rose-500' : 'border-gray-100'}`}
                    />
                  </FormField>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setStep('WELCOME')}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleNext}
                    className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                  >
                    Next: Credentials <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
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
            className="p-10 bg-white"
          >
            <div className="mb-8">
              <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Lending Credentials</h2>
              <p className="text-gray-500 text-sm">Verify your legal authority to provide loans.</p>
            </div>

            <div className="space-y-6">
                <FormField 
                  label="Lending License Number" 
                  icon={<Scale className="w-3 h-3" />}
                  error={validationErrors.licenseNumber}
                  hint="Required for financial sector compliance."
                >
                  <input 
                    type="text" 
                    value={formData.licenseNumber}
                    onChange={(e) => {
                      setFormData({...formData, licenseNumber: e.target.value});
                      if (validationErrors.licenseNumber) setValidationErrors({...validationErrors, licenseNumber: ''});
                    }}
                    placeholder="LIC-987654321" 
                    className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 font-bold transition-all ${validationErrors.licenseNumber ? 'border-rose-500' : 'border-gray-100'}`}
                  />
                </FormField>

                <FormField 
                  label="Issuing Regulatory Authority" 
                  icon={<ShieldCheck className="w-3 h-3" />}
                  error={validationErrors.issuingAuthority}
                  hint="Body that granted your lending license (e.g. CBN, EFCC)."
                >
                  <input 
                    type="text" 
                    value={formData.issuingAuthority}
                    onChange={(e) => {
                      setFormData({...formData, issuingAuthority: e.target.value});
                      if (validationErrors.issuingAuthority) setValidationErrors({...validationErrors, issuingAuthority: ''});
                    }}
                    placeholder="e.g. Central Bank of Nigeria" 
                    className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 font-bold transition-all ${validationErrors.issuingAuthority ? 'border-rose-500' : 'border-gray-100'}`}
                  />
                </FormField>

                <FormField 
                  label="Registered Administrative Address" 
                  icon={<MapPin className="w-3 h-3" />}
                  error={validationErrors.address}
                  hint="Full physical location of your headquarters."
                >
                  <textarea 
                    value={formData.address}
                    onChange={(e) => {
                      setFormData({...formData, address: e.target.value});
                      if (validationErrors.address) setValidationErrors({...validationErrors, address: ''});
                    }}
                    rows={3}
                    placeholder="Full business address..." 
                    className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 font-bold transition-all resize-none ${validationErrors.address ? 'border-rose-500' : 'border-gray-100'}`}
                  />
                </FormField>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setStep('IDENTITY')}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleNext}
                    className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                  >
                    Next: Parameters <ArrowRight className="w-4 h-4" />
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
            className="p-10 bg-white"
          >
            <div className="mb-8">
              <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Lending Parameters</h2>
              <p className="text-gray-500 text-sm">Define the scope of loans you wish to offer.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Min Loan Principal" icon={<DollarSign className="w-3 h-3" />}>
                  <input 
                    type="number" 
                    value={formData.minAmount}
                    onChange={(e) => setFormData({...formData, minAmount: Number(e.target.value)})}
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </FormField>
                <FormField label="Max Loan Principal" icon={<DollarSign className="w-3 h-3" />} error={validationErrors.maxAmount}>
                  <input 
                    type="number" 
                    value={formData.maxAmount}
                    onChange={(e) => {
                      setFormData({...formData, maxAmount: Number(e.target.value)});
                      if (validationErrors.maxAmount) setValidationErrors({...validationErrors, maxAmount: ''});
                    }}
                    className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 font-bold ${validationErrors.maxAmount ? 'border-rose-500' : 'border-gray-100'}`}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Interest Range / APR" icon={<TrendingUp className="w-3 h-3" />} hint="e.g. 5% - 15%">
                  <input 
                    type="text" 
                    value={formData.interestRange}
                    onChange={(e) => setFormData({...formData, interestRange: e.target.value})}
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </FormField>
                <FormField label="Tactical Target Audience" icon={<Target className="w-3 h-3" />} hint="Who can apply?">
                  <select 
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 font-bold cursor-pointer"
                  >
                    <option>All Members</option>
                    <option>Business Owners</option>
                    <option>Students</option>
                    <option>Civil Servants</option>
                  </select>
                </FormField>
              </div>

              <FormField 
                label={`Total Lending Liquidity Cap (${selectedCurrency.code})`} 
                icon={<ShieldAlert className="w-3 h-3" />} 
                error={validationErrors.lendingCapacity}
                hint="Your total available pool for lending."
              >
                <input 
                  type="number" 
                  value={formData.lendingCapacity}
                  onChange={(e) => {
                    setFormData({...formData, lendingCapacity: e.target.value});
                    if (validationErrors.lendingCapacity) setValidationErrors({...validationErrors, lendingCapacity: ''});
                  }}
                  placeholder="e.g. 1000000"
                  className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 font-bold ${validationErrors.lendingCapacity ? 'border-rose-500' : 'border-gray-100'}`}
                />
              </FormField>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-3">
                <Info className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-[10px] text-emerald-800 leading-relaxed font-medium">
                  By submitting this application, you agree to EFADO's high-trust vendor terms. Your account will be vetted by compliance before global hub activation.
                </p>
              </div>

              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setStep('CREDENTIALS')}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all"
                >
                  Back
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Finalize Application'}
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
            className="text-center py-8"
          >
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight">Application Received!</h2>
            <p className="text-gray-500 mb-8">Your request to become a HEPIHANDS Loan Vendor is now in review. We will contact you at {formData.contactEmail} within 3-5 business days.</p>
            
            <button 
              onClick={onSuccess}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:bg-gray-800 transition-all"
            >
              Return to Hub
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
