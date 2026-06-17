import React, { useState, useEffect } from 'react';
import { 
  Building2,
  Smartphone,
  Copy,
  Store, 
  Users, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  CheckCircle2,
  Lock,
  Globe,
  CreditCard,
  Target,
  BarChart3,
  Loader2,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import { db, doc, updateDoc, addDoc, collection, serverTimestamp } from '../firebase';
import { useCurrency } from '../lib/CurrencyContext';

interface VendorRegistrationProps {
  user: UserProfile;
  onSuccess: () => void;
}

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
      <label className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${error ? 'text-rose-500' : 'text-gray-700'}`}>
        {icon} {label} {!required && <span className="text-[10px] opacity-80">(Optional)</span>}
      </label>
      {required && <div className={`w-1 h-1 rounded-full ${error ? 'bg-rose-500 animate-ping' : 'bg-indigo-400'}`} />}
    </div>
    <div className={`transition-all duration-300 ${error ? 'ring-2 ring-rose-500/20' : ''}`}>
      {children}
    </div>
    {error ? (
      <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3 rotate-45" /> {error}
      </motion.p>
    ) : hint && (
      <p className="text-[10px] font-medium text-slate-700 leading-tight">{hint}</p>
    )}
  </div>
);

type PlanType = 'STARTER' | 'PRO' | 'ENTERPRISE';

export const VendorRegistration: React.FC<VendorRegistrationProps> = ({ user, onSuccess }) => {
  const { formatPrice } = useCurrency();
  const [step, setStep] = useState<'PLAN' | 'FORM' | 'PAYMENT' | 'SUCCESS'>('PLAN');
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'BANK' | 'USSD'>('CARD');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    industry: '',
    description: '',
    targetAudience: '',
    estimatedTraffic: ''
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const PLANS = [
    {
      id: 'STARTER' as PlanType,
      name: 'Starter Hub',
      price: 15.00,
      oldPrice: 25.00,
      description: 'Perfect for individuals & small vendors.',
      features: [
        'Collective Saving Hub Access',
        'Direct Peer Transactions',
        'Standard Business Profile',
        'Basic ROI Analytics',
        'Community Support'
      ],
      reach: 'Up to 500 users',
      icon: Store,
      color: 'indigo'
    },
    {
      id: 'PRO' as PlanType,
      name: 'Professional',
      price: 49.99,
      oldPrice: 75.00,
      description: 'For established firms and active teams.',
      features: [
        'Everything in Starter',
        'Priority Hub Visibility',
        'Advanced Team Management',
        'Whitelisted API Access',
        'Custom Payout Cycles',
        '24/7 Priority Intel'
      ],
      reach: 'Up to 5,000 users',
      icon: Zap,
      color: 'purple',
      popular: true
    },
    {
      id: 'ENTERPRISE' as PlanType,
      name: 'Global Enterprise',
      price: 199.99,
      oldPrice: 350.00,
      description: 'Military-grade infrastructure for major companies.',
      features: [
        'Unlimited Hub Integration',
        'Full White-Label Support',
        'Global Domain Management',
        'Custom Security Protocols',
        'Dedicated Hub Account Manager',
        'Direct CEO Integration'
      ],
      reach: 'Unlimited Reach',
      icon: ShieldCheck,
      color: 'slate'
    }
  ];

  const handlePlanSelect = (plan: PlanType) => {
    setSelectedPlan(plan);
    setStep('FORM');
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.businessName) errors.businessName = "Business name identifies you in the marketplace.";
    if (!formData.industry) errors.industry = "Required for proper hub categorization.";
    if (!formData.estimatedTraffic) errors.estimatedTraffic = "Helps us allocate hub resources.";
    if (!formData.description) errors.description = "Critical for vetting your application.";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setStep('PAYMENT');
  };

  const [paystackInited, setPaystackInited] = useState(false);

  // Dynamically load Paystack Inline JS script
  useEffect(() => {
    if ((window as any).PaystackPop) {
      setPaystackInited(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setPaystackInited(true);
    document.body.appendChild(script);
  }, []);

  const completeRegistration = async (paystackRef?: string) => {
    setLoading(true);
    try {
      const plan = PLANS.find(p => p.id === selectedPlan);
      
      // Update user document
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        vendorStatus: 'pending',
        vendorPlan: selectedPlan,
        vendorId: `V-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        updatedAt: serverTimestamp()
      });

      // Create transaction for registration
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'payment',
        amount: plan?.price || 0,
        currency: 'USD',
        status: paymentMethod === 'CARD' ? 'completed' : 'pending',
        paymentMethod: paymentMethod,
        paystackRef: paystackRef || null,
        description: `Vendor Registration - ${plan?.name} Plan`,
        timestamp: serverTimestamp()
      });

      // Create vendor application document
      await addDoc(collection(db, 'vendor_applications'), {
        userId: user.uid,
        userName: user.displayName || user.email,
        ...formData,
        plan: selectedPlan,
        paymentMethod: paymentMethod,
        paystackRef: paystackRef || null,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      setStep('SUCCESS');
    } catch (error) {
      console.error('Vendor registration error:', error);
      alert('Registration failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedPlan) return;
    const plan = PLANS.find(p => p.id === selectedPlan);
    const planPrice = plan?.price || 0;

    if (paymentMethod === 'CARD') {
      if (!(window as any).PaystackPop) {
        alert("Paystack secure gateway is initializing. Please wait a brief moment and retry.");
        return;
      }
      setLoading(true);
      const ngnAmount = planPrice * 1450;
      const paystackKey = (import.meta as any).env?.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_d3bd3cdb2b2b10931eb6ea637be5c0d68fbd6e78';
      const reference = `EFD_VEND_REG_${Math.floor(100 + Math.random() * 900)}_${Date.now()}`;

      try {
        const handler = (window as any).PaystackPop.setup({
          key: paystackKey,
          email: user.email,
          amount: Math.round(ngnAmount * 100), // convert kobo
          currency: 'NGN',
          ref: reference,
          callback: async (response: any) => {
            if (response && (response.status === 'success' || response.message === 'Approved')) {
              await completeRegistration(response.reference || reference);
            } else {
              setLoading(false);
              alert("Payment not approved. Please verify card details and try again.");
            }
          },
          onClose: () => {
            setLoading(false);
            alert("Secure checkout closed by user.");
          }
        });
        handler.openIframe();
      } catch (err) {
        setLoading(false);
        console.error("Paystack launch error:", err);
        alert("Could not initialize Paystack secure checkout. Verify network.");
      }
    } else {
      await completeRegistration();
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <AnimatePresence mode="wait">
        {step === 'PLAN' && (
          <motion.div
            key="plan"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            <div className="text-center space-y-4">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100">
                Partner with EFADO
              </span>
              <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Choose Your <span className="text-indigo-600">Growth Plan</span></h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Scale your business, manage your saving groups, and engage with the global community through our dedicated vendor solutions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {PLANS.map((plan) => (
                <motion.div
                  key={plan.id}
                  whileHover={{ y: -10 }}
                  className={`bg-white rounded-[2.5rem] border-2 p-8 transition-all flex flex-col h-full relative ${
                    plan.popular ? 'border-indigo-600 shadow-xl shadow-indigo-100' : 'border-gray-100 shadow-sm'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                      Most Popular
                    </div>
                  )}
                  <div className={`w-14 h-14 bg-${plan.color}-50 rounded-2xl flex items-center justify-center mb-6`}>
                    <plan.icon className={`w-8 h-8 text-${plan.color}-600`} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-sm text-gray-400 mb-6">{plan.description}</p>
                  
                  <div className="mb-8">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-gray-900">${plan.price}</span>
                      <span className="text-sm text-gray-400">/one-time</span>
                    </div>
                    {plan.oldPrice && (
                      <span className="text-xs text-gray-400 line-through font-bold">Was ${plan.oldPrice}</span>
                    )}
                  </div>

                  <div className="space-y-4 flex-1 mb-10">
                    <div className="flex items-center gap-2 text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl">
                      <Users className="w-4 h-4" />
                      Reach: {plan.reach}
                    </div>
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handlePlanSelect(plan.id)}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
                      plan.popular 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700' 
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    Select Plan
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'FORM' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-2xl mx-auto"
          >
            <button 
              onClick={() => setStep('PLAN')}
              className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-8 hover:underline"
            >
              ← Back to plans
            </button>
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-xl">
              <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tighter">Business Intelligence</h2>
              <p className="text-gray-500 mb-10">Provide your business details to customize your hub experience.</p>
              
              <form onSubmit={handleSubmitForm} className="space-y-6">
                <FormField 
                  label="Business/Firm Identity" 
                  error={validationErrors.businessName}
                  hint="The official name of your service or trade."
                >
                  <input 
                    required
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => {
                      setFormData({...formData, businessName: e.target.value});
                      if (validationErrors.businessName) setValidationErrors({...validationErrors, businessName: ''});
                    }}
                    placeholder="Enter legal entity name"
                    className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 font-bold transition-all ${validationErrors.businessName ? 'border-rose-500' : 'border-gray-100'}`}
                  />
                </FormField>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField 
                    label="Core Industry" 
                    error={validationErrors.industry}
                    hint="Sector you operate in."
                  >
                    <input 
                      required
                      type="text"
                      value={formData.industry}
                      onChange={(e) => {
                        setFormData({...formData, industry: e.target.value});
                        if (validationErrors.industry) setValidationErrors({...validationErrors, industry: ''});
                      }}
                      placeholder="e.g. Fintech, Retail"
                      className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 font-bold transition-all ${validationErrors.industry ? 'border-rose-500' : 'border-gray-100'}`}
                    />
                  </FormField>
                  <FormField 
                    label="Planned Userbase Range" 
                    error={validationErrors.estimatedTraffic}
                    hint="Approximate number of users/clients."
                  >
                    <input 
                      required
                      type="text"
                      value={formData.estimatedTraffic}
                      onChange={(e) => {
                        setFormData({...formData, estimatedTraffic: e.target.value});
                        if (validationErrors.estimatedTraffic) setValidationErrors({...validationErrors, estimatedTraffic: ''});
                      }}
                      placeholder="e.g. 500+"
                      className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 font-bold transition-all ${validationErrors.estimatedTraffic ? 'border-rose-500' : 'border-gray-100'}`}
                    />
                  </FormField>
                </div>

                <FormField 
                  label="Target Market Reach" 
                  required={false}
                  hint="Only applicable if targeting specific zones."
                >
                  <input 
                    type="text"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
                    placeholder="e.g. Youth, Farmers, Techies"
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 font-bold transition-all"
                  />
                </FormField>

                <FormField 
                  label="Mission Statement & Capability Description" 
                  error={validationErrors.description}
                  hint="A clear summary of what your business brings to the EFADO network."
                >
                  <textarea 
                    required
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({...formData, description: e.target.value});
                      if (validationErrors.description) setValidationErrors({...validationErrors, description: ''});
                    }}
                    placeholder="Describe your services and how you intend to use the Hub..."
                    className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 font-bold transition-all h-32 resize-none ${validationErrors.description ? 'border-rose-500' : 'border-gray-100'}`}
                  />
                </FormField>

                <button 
                  type="submit"
                  className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  Continue to Secure Payment <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {step === 'PAYMENT' && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-xl mx-auto"
          >
            <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-2xl">
              <div className="p-8 bg-gray-900 text-white">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Secure Terminal</p>
                    <h3 className="text-2xl font-black">Checkout Nexus</h3>
                  </div>
                  <Lock className="w-6 h-6 text-indigo-400" />
                </div>
                
                <div className="p-6 bg-white/10 rounded-3xl border border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-400">Hub License</span>
                    <span className="text-xs font-black uppercase tracking-widest text-indigo-300">{selectedPlan}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold">{formData.businessName}</span>
                    <span className="text-2xl font-black">${PLANS.find(p => p.id === selectedPlan)?.price}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-8">
                  {(['CARD', 'BANK', 'USSD'] as const).map(method => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`flex-1 py-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                        paymentMethod === method 
                          ? 'bg-indigo-600 border-indigo-600 text-white' 
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {method === 'CARD' && <CreditCard className="w-4 h-4" />}
                      {method === 'BANK' && <Building2 className="w-4 h-4" />}
                      {method === 'USSD' && <Smartphone className="w-4 h-4" />}
                      <span className="text-[8px] font-black uppercase tracking-widest leading-none">{method}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-8 space-y-6">
                {paymentMethod === 'CARD' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Card Number" 
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-bold placeholder:text-gray-400"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input 
                        type="text" 
                        placeholder="MM/YY" 
                        className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-bold placeholder:text-gray-400"
                      />
                      <input 
                        type="text" 
                        placeholder="CVC" 
                        className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-bold placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'BANK' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-black text-indigo-900 uppercase">EFADO Global Account</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center group cursor-pointer" onClick={() => navigator.clipboard.writeText('0923847551')}>
                          <span className="text-[10px] font-bold text-gray-500 uppercase">Account Number</span>
                          <span className="text-sm font-black text-gray-900 flex items-center gap-2">
                            0923847551 <Copy className="w-3 h-3 text-indigo-400 group-hover:text-indigo-600" />
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-gray-500 uppercase">Bank Name</span>
                          <span className="text-sm font-black text-gray-900">EFADO Digital Trust</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-gray-500 uppercase">Recipient</span>
                          <span className="text-sm font-black text-gray-900">EFADO LTD - PARTNERS</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[9px] text-gray-400 text-center font-bold uppercase tracking-tighter">
                      Please use your full name as the transfer subject
                    </p>
                  </div>
                )}

                {paymentMethod === 'USSD' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 text-center py-4">
                    <div className="inline-block p-4 bg-indigo-50 rounded-full mb-2">
                      <Smartphone className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-900 mb-1">Mobile Banking Code</h4>
                      <p className="text-xs text-gray-500 mb-4">Dial the code below on your registered phone</p>
                    </div>
                    <div className="p-5 bg-gray-900 text-white rounded-2xl relative overflow-hidden group mb-4">
                      <div className="absolute inset-0 bg-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity" />
                      <span className="text-2xl font-black tracking-[0.2em] relative z-10">*920*88*82#</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-emerald-600">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Waiting for session...</span>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="text-[10px] text-emerald-800 leading-relaxed font-medium">
                    {paymentMethod === 'CARD' ? 
                      'Your payment is processed through EFADO\'s military-grade encryption. Instant activation.' : 
                      'Our system will auto-verify your transaction details. Verification usually takes 5-10 minutes.'}
                  </p>
                </div>

                <button 
                  onClick={handlePayment}
                  disabled={loading}
                  className={`w-full py-5 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all flex items-center justify-center gap-2 ${
                    paymentMethod === 'CARD' 
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-100 animate-pulse' 
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                  }`}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                   paymentMethod === 'CARD' ? 'Confirm & Activate Hub' : 'I have completed the payment'}
                </button>
                
                <button 
                  onClick={() => setStep('FORM')}
                  className="w-full text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-600"
                >
                  Cancel and Edit Details
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'SUCCESS' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto text-center py-12"
          >
            <div className="w-24 h-24 bg-emerald-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            </div>
            <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter">Welcome to the Inner Circle!</h2>
            <p className="text-gray-500 text-lg mb-10 max-w-lg mx-auto">
              Your vendor application for the <span className="text-indigo-600 font-bold">{selectedPlan}</span> plan has been received. Our team will verify your business within 24 hours.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="p-6 bg-white rounded-3xl border border-gray-100 text-left">
                <Target className="w-6 h-6 text-indigo-600 mb-3" />
                <h4 className="font-black text-gray-900 mb-1">Active Hub ID</h4>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">ID: V-HUB-X920</p>
              </div>
              <div className="p-6 bg-white rounded-3xl border border-gray-100 text-left">
                <BarChart3 className="w-6 h-6 text-purple-600 mb-3" />
                <h4 className="font-black text-gray-900 mb-1">Analytics Ready</h4>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Status: Monitoring</p>
              </div>
            </div>

            <button 
              onClick={onSuccess}
              className="w-full md:w-auto px-12 py-5 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-gray-800 transition-all"
            >
              Access Community Hub
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
