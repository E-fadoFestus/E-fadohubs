import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Briefcase, 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  Clock, 
  DollarSign,
  FileText,
  Settings,
  Search,
  Camera,
  MessageCircle,
  Building2,
  ShieldCheck,
  Zap,
  Star,
  Plus,
  ArrowRight
} from 'lucide-react';
import { UserProfile, ServiceProvider, ServiceRequest } from '../types';
import { db, collection, addDoc, serverTimestamp } from '../firebase';
import { PaymentPlatform } from './PaymentPlatform';

interface ServiceCorpsRegistrationProps {
  user: UserProfile;
  onClose: () => void;
  serviceFamilies: any[];
  initialType?: 'PROVIDER' | 'SEEKER';
  prefilledData?: any;
}

const REGISTRATION_PLANS = [
  { id: 'Free', name: 'Standard Relief', price: 0, description: 'Basic entry into the Hub. Limited exposure.', icon: <User className="w-5 h-5" />, accent: 'border-slate-200' },
  { id: 'Basic', name: 'Strategic Basic', price: 500, description: 'Enhanced visibility. Verified badge after 3 jobs.', icon: <Zap className="w-5 h-5 text-amber-500" />, accent: 'border-amber-200 bg-amber-50/30' },
  { id: 'Express', name: 'Tactical Express', price: 1500, description: 'Priority listing. Instant Verification badge. 24/7 Support.', icon: <Zap className="w-5 h-5 text-indigo-500" fill="currentColor" />, accent: 'border-indigo-200 bg-indigo-50/30' },
  { id: 'Corporate', name: 'Sovereign Corporate', price: 3500, description: 'Company profile. Multi-service listing. Direct CEO pipeline.', icon: <Building2 className="w-5 h-5 text-purple-600" />, accent: 'border-purple-200 bg-purple-50/30' }
];

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
        <AlertCircle className="w-3 h-3" /> {error}
      </motion.p>
    ) : hint && (
      <p className="text-[10px] font-medium text-slate-700 leading-tight">{hint}</p>
    )}
  </div>
);

export const ServiceCorpsRegistration: React.FC<ServiceCorpsRegistrationProps> = ({ 
  user, 
  onClose, 
  serviceFamilies,
  initialType = 'PROVIDER',
  prefilledData
}) => {
  const [regType, setRegType] = useState<'PROVIDER' | 'SEEKER'>(initialType);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof REGISTRATION_PLANS[0]>(REGISTRATION_PLANS[0]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Provider Form State
  const [providerData, setProviderData] = useState({
    businessName: '',
    familyId: prefilledData?.familyId || '',
    subcategory: prefilledData?.subcategory || '',
    services: [] as string[],
    country: 'Nigeria',
    state: '',
    city: '',
    village: '',
    address: '',
    scope: 'Local' as 'Local' | 'International' | 'Both',
    bio: '',
    contactEmail: user.email,
    contactPhone: '',
    whatsapp: '',
    photos: [] as string[]
  });

  // Seeker Form State
  const [seekerData, setSeekerData] = useState({
    familyId: prefilledData?.familyId || '',
    subcategory: prefilledData?.subcategory || '',
    description: prefilledData?.description || '',
    country: 'Nigeria',
    state: '',
    city: '',
    village: '',
    address: '',
    urgency: 'Medium' as 'Low' | 'Medium' | 'High' | 'Emergency',
    budget: '',
    whatsapp: '',
    photos: [] as string[]
  });

  const handleProviderSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const family = serviceFamilies.find(f => f.id === providerData.familyId);
      const newProvider: Omit<ServiceProvider, 'id'> = {
        userId: user.uid,
        businessName: providerData.businessName,
        serviceFamily: family?.name || '',
        subcategory: providerData.subcategory,
        services: providerData.services,
        location: {
          country: providerData.country,
          state: providerData.state,
          city: providerData.city,
          village: providerData.village,
          address: providerData.address
        },
        scope: providerData.scope,
        plan: selectedPlan.id as any,
        bio: providerData.bio,
        contactEmail: providerData.contactEmail,
        contactPhone: providerData.contactPhone,
        whatsapp: providerData.whatsapp,
        photos: providerData.photos,
        rating: 5.0,
        reviewsCount: 0,
        verified: selectedPlan.id === 'Express' || selectedPlan.id === 'Corporate',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'service_providers'), newProvider);
      setSuccess(true);
      setTimeout(onClose, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to register as provider');
    } finally {
      setLoading(false);
    }
  };

  const handleSeekerSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const family = serviceFamilies.find(f => f.id === seekerData.familyId);
      const newRequest: Omit<ServiceRequest, 'id'> = {
        clientId: user.uid,
        clientName: user.displayName || user.email,
        serviceFamily: family?.name || '',
        subcategory: seekerData.subcategory,
        description: seekerData.description,
        location: {
          country: seekerData.country,
          state: seekerData.state,
          city: seekerData.city,
          village: seekerData.village,
          address: seekerData.address
        },
        urgency: seekerData.urgency,
        budget: seekerData.budget,
        whatsapp: seekerData.whatsapp,
        photos: seekerData.photos,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'service_requests'), newRequest);
      setSuccess(true);
      setTimeout(onClose, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit service request');
    } finally {
      setLoading(false);
    }
  };

  const validateStep = () => {
    const errors: Record<string, string> = {};
    
    if (regType === 'PROVIDER') {
      if (step === 1) {
        if (!providerData.businessName) errors.businessName = "Business Identity is mandatory. Please enter your name or business brand.";
        if (!providerData.familyId) errors.familyId = "Domain selection required. We need to know which industry you serve.";
        if (providerData.familyId && !providerData.subcategory) errors.subcategory = "Specialty focus required. This helps our search engine index your skills.";
      }
      if (step === 2) {
        if (!providerData.state) errors.state = "State location is mandatory for regional logistics.";
        if (!providerData.city) errors.city = "City identity required. Clients search for local hubs.";
        if (!providerData.address) errors.address = "Detailed street orientation is required for tactical deployment.";
        if (!providerData.contactPhone) errors.contactPhone = "Direct hot-line required. Must be a valid mobile node.";
        if (!providerData.whatsapp) errors.whatsapp = "WhatsApp synchronization node required for coordination.";
      }
    } else {
      if (step === 1) {
        if (!seekerData.familyId) errors.familyId = "Resource domain required. Tell us what category of relief you seek.";
        if (seekerData.familyId && !seekerData.subcategory) errors.subcategory = "Specialized focus required for expert matching.";
        if (!seekerData.description) errors.description = "Mission briefing required. Describe your situation or need in detail.";
      }
      if (step === 2) {
        if (!seekerData.state) errors.state = "Regional location required.";
        if (!seekerData.city) errors.city = "Urban sector identity required.";
        if (!seekerData.address) errors.address = "Tactical destination address required for expert deployment.";
        if (!seekerData.whatsapp) errors.whatsapp = "Communication node required for field contact.";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    
    if (regType === 'PROVIDER' && step === 3) {
      if (selectedPlan.price > 0) {
        setShowPayment(true);
      } else {
        handleProviderSubmit();
      }
      return;
    }
    if (regType === 'SEEKER' && step === 2) {
      handleSeekerSubmit();
      return;
    }
    setStep(s => s + 1);
  };

  if (showPayment) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setShowPayment(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
            <X className="w-5 h-5 text-gray-400" />
          </button>
          <h2 className="text-2xl font-black text-gray-900">Secure Plan Activation</h2>
        </div>
        <PaymentPlatform 
          user={user}
          type="deposit"
          amount={selectedPlan.price}
          onSuccess={() => {
            setShowPayment(false);
            handleProviderSubmit();
          }}
          onCancel={() => setShowPayment(false)}
          onClose={() => setShowPayment(false)}
          purpose={`SCS Registration: ${selectedPlan.name}`}
        />
      </div>
    );
  }

  if (success) {
    return (
      <div className="p-12 text-center">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-100"
        >
          <CheckCircle2 className="w-10 h-10" />
        </motion.div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Sovereign Connection Established!</h2>
        <p className="text-gray-600 max-w-sm mx-auto">Your {regType === 'PROVIDER' ? 'profile' : 'request'} is now live across the global relief network.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            {regType === 'PROVIDER' ? <Briefcase className="w-8 h-8 text-indigo-600" /> : <Search className="w-8 h-8 text-indigo-600" />}
            {regType === 'PROVIDER' ? 'Provider Onboarding' : 'Relief Seek Request'}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`h-1.5 rounded-full transition-all ${step >= s ? 'bg-indigo-600' : 'bg-gray-200'} ${step === s ? 'w-8' : 'w-4'}`}
              />
            ))}
            <span className="text-xs font-bold text-gray-400 ml-2 uppercase tracking-widest">Step {step} of {regType === 'PROVIDER' ? 3 : 2}</span>
          </div>
        </div>
        
        {step === 1 && (
          <div className="flex bg-gray-100 p-1.5 rounded-2xl shadow-inner">
            <button 
              onClick={() => { setRegType('PROVIDER'); setStep(1); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${regType === 'PROVIDER' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              PROVIDER
            </button>
            <button 
              onClick={() => { setRegType('SEEKER'); setStep(1); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${regType === 'SEEKER' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              SEEKER
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm animate-pulse">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="min-h-[400px]">
        {regType === 'PROVIDER' ? (
          <div className="space-y-8">
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField 
                    label="Full Business Identity" 
                    icon={<Building2 className="w-3.5 h-3.5" />}
                    error={validationErrors.businessName}
                    hint="Your professional trade name or personal service name."
                  >
                    <input 
                      required
                      type="text"
                      className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all text-gray-950 font-bold ${validationErrors.businessName ? 'border-rose-500' : 'border-gray-100'}`}
                      placeholder="e.g. EFADO Logistics HQ"
                      value={providerData.businessName}
                      onChange={e => {
                        setProviderData({...providerData, businessName: e.target.value});
                        if (validationErrors.businessName) setValidationErrors({...validationErrors, businessName: ''});
                      }}
                    />
                  </FormField>

                  <FormField 
                    label="Service Category" 
                    icon={<Settings className="w-3.5 h-3.5" />}
                    error={validationErrors.familyId}
                    hint="The broad industry your skills belong to."
                  >
                    <select 
                      required
                      className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all text-gray-950 font-bold cursor-pointer ${validationErrors.familyId ? 'border-rose-500' : 'border-gray-100'}`}
                      value={providerData.familyId}
                      onChange={e => {
                        setProviderData({...providerData, familyId: e.target.value, subcategory: ''});
                        if (validationErrors.familyId) setValidationErrors({...validationErrors, familyId: ''});
                      }}
                    >
                      <option value="">Select Domain</option>
                      {serviceFamilies.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </FormField>

                  <FormField 
                    label="Specialized Sub-focus" 
                    icon={<Search className="w-3.5 h-3.5" />}
                    error={validationErrors.subcategory}
                    hint="Specify your exact skill for better matching."
                  >
                    <select 
                      required
                      disabled={!providerData.familyId}
                      className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all disabled:opacity-50 text-gray-950 font-bold cursor-pointer ${validationErrors.subcategory ? 'border-rose-500' : 'border-gray-100'}`}
                      value={providerData.subcategory}
                      onChange={e => {
                        setProviderData({...providerData, subcategory: e.target.value});
                        if (validationErrors.subcategory) setValidationErrors({...validationErrors, subcategory: ''});
                      }}
                    >
                      <option value="">Select Specialty</option>
                      {serviceFamilies.find(f => f.id === providerData.familyId)?.subcategories.map((s: any) => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </FormField>

                  <FormField 
                    label="Operational Reach" 
                    icon={<Globe className="w-3.5 h-3.5" />}
                    hint="Define if you work only on-site or can export your skills."
                  >
                    <select 
                      required
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all text-gray-950 font-bold cursor-pointer"
                      value={providerData.scope}
                      onChange={e => setProviderData({...providerData, scope: e.target.value as any})}
                    >
                      <option value="Local">Statewide Coverage</option>
                      <option value="International">Global Satellite Node</option>
                      <option value="Both">Omni-Channel Relief</option>
                    </select>
                  </FormField>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Country/Nation" icon={<MapPin className="w-3.5 h-3.5" />}>
                    <input 
                      type="text"
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-950 font-bold"
                      value={providerData.country}
                      readOnly
                    />
                  </FormField>
                  <FormField label="State / Region" error={validationErrors.state}>
                    <input 
                      required
                      className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all text-gray-950 font-bold ${validationErrors.state ? 'border-rose-500' : 'border-gray-100'}`}
                      placeholder="e.g. Lagos"
                      value={providerData.state}
                      onChange={e => {
                        setProviderData({...providerData, state: e.target.value});
                        if (validationErrors.state) setValidationErrors({...validationErrors, state: ''});
                      }}
                    />
                  </FormField>
                  <FormField label="City / Local Gov" error={validationErrors.city}>
                    <input 
                      required
                      className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all text-gray-950 font-bold ${validationErrors.city ? 'border-rose-500' : 'border-gray-100'}`}
                      placeholder="e.g. Ikeja"
                      value={providerData.city}
                      onChange={e => {
                        setProviderData({...providerData, city: e.target.value});
                        if (validationErrors.city) setValidationErrors({...validationErrors, city: ''});
                      }}
                    />
                  </FormField>
                  <FormField label="Village / Settlement / Zone" required={false} hint="Only applicable in rural or zoned areas.">
                    <input 
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all text-gray-950 font-bold"
                      placeholder="e.g. Alausa Estate"
                      value={providerData.village}
                      onChange={e => setProviderData({...providerData, village: e.target.value})}
                    />
                  </FormField>
                  <div className="md:col-span-2">
                    <FormField label="Detailed Street Address & Landmark" error={validationErrors.address} hint="Include street number and a known landmark for easy identification.">
                      <textarea 
                        required
                        rows={2}
                        className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all resize-none text-gray-950 font-bold ${validationErrors.address ? 'border-rose-500' : 'border-gray-100'}`}
                        placeholder="e.g. Plot 42, Kings Way. Opposite the central terminal."
                        value={providerData.address}
                        onChange={e => {
                          setProviderData({...providerData, address: e.target.value});
                          if (validationErrors.address) setValidationErrors({...validationErrors, address: ''});
                        }}
                      />
                    </FormField>
                  </div>
                  <FormField label="Direct Hot-Line" icon={<Phone className="w-3.5 h-3.5 text-blue-500" />} error={validationErrors.contactPhone}>
                    <input 
                      required
                      type="tel"
                      className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all text-gray-950 font-bold ${validationErrors.contactPhone ? 'border-rose-500' : 'border-gray-100'}`}
                      placeholder="+234..."
                      value={providerData.contactPhone}
                      onChange={e => {
                        setProviderData({...providerData, contactPhone: e.target.value});
                        if (validationErrors.contactPhone) setValidationErrors({...validationErrors, contactPhone: ''});
                      }}
                    />
                  </FormField>
                  <FormField label="WhatsApp Direct Link" icon={<MessageCircle className="w-3.5 h-3.5 text-green-500" />} error={validationErrors.whatsapp}>
                    <input 
                      required
                      type="tel"
                      className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all text-gray-950 font-bold ${validationErrors.whatsapp ? 'border-rose-500' : 'border-gray-100'}`}
                      placeholder="WhatsApp number..."
                      value={providerData.whatsapp}
                      onChange={e => {
                        setProviderData({...providerData, whatsapp: e.target.value});
                        if (validationErrors.whatsapp) setValidationErrors({...validationErrors, whatsapp: ''});
                      }}
                    />
                  </FormField>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <div className="space-y-4">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> Select Strategic Plan
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {REGISTRATION_PLANS.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlan(plan)}
                        className={`p-5 rounded-3xl border-2 transition-all text-left flex flex-col gap-2 relative overflow-hidden ${selectedPlan.id === plan.id ? 'border-indigo-600 ring-4 ring-indigo-50' : plan.accent}`}
                      >
                        {selectedPlan.id === plan.id && (
                          <div className="absolute top-4 right-4 bg-indigo-600 text-white rounded-full p-1 scale-75">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-xl shadow-sm">
                            {plan.icon}
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900 leading-none">{plan.name}</p>
                            <p className="text-[10px] font-bold text-indigo-600 mt-1 uppercase tracking-tight">
                              {plan.price === 0 ? 'Free Entry' : `₦${plan.price.toLocaleString()}`}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">{plan.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" /> Sovereign Pitch / Capabilities
                  </label>
                  <textarea 
                    required
                    rows={4}
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all resize-none text-gray-950 font-bold"
                    placeholder="Briefly state your expertise, years active, and core relief strengths..."
                    value={providerData.bio}
                    onChange={e => setProviderData({...providerData, bio: e.target.value})}
                  />
                </div>

                <div className="p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="p-4 bg-white rounded-full shadow-lg shadow-slate-100">
                      <Camera className="w-8 h-8 text-slate-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black text-slate-900">Portfolio & Identification Assets</p>
                      <p className="text-xs font-medium text-slate-500 mt-1">Upload office photos, work samples, or ID cards</p>
                    </div>
                    <button type="button" className="mt-2 px-6 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-100 transition-all">
                      Add Samples
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField 
                    label="Relief Domain" 
                    icon={<Settings className="w-3.5 h-3.5" />}
                    error={validationErrors.familyId}
                    hint="Broad category for your needs."
                  >
                    <select 
                      required
                      className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all text-gray-950 font-bold cursor-pointer ${validationErrors.familyId ? 'border-rose-500' : 'border-gray-100'}`}
                      value={seekerData.familyId}
                      onChange={e => {
                        setSeekerData({...seekerData, familyId: e.target.value, subcategory: ''});
                        if (validationErrors.familyId) setValidationErrors({...validationErrors, familyId: ''});
                      }}
                    >
                      <option value="">Select Domain</option>
                      {serviceFamilies.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </FormField>

                  <FormField 
                    label="Specific Skill-Set" 
                    icon={<Search className="w-3.5 h-3.5" />}
                    error={validationErrors.subcategory}
                    hint="Exact skill required for the task."
                  >
                    <select 
                      required
                      disabled={!seekerData.familyId}
                      className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all disabled:opacity-50 text-gray-950 font-bold cursor-pointer ${validationErrors.subcategory ? 'border-rose-500' : 'border-gray-100'}`}
                      value={seekerData.subcategory}
                      onChange={e => {
                        setSeekerData({...seekerData, subcategory: e.target.value});
                        if (validationErrors.subcategory) setValidationErrors({...validationErrors, subcategory: ''});
                      }}
                    >
                      <option value="">Select Specialty</option>
                      {serviceFamilies.find(f => f.id === seekerData.familyId)?.subcategories.map((s: any) => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </FormField>

                  <FormField 
                    label="Response Urgency" 
                    icon={<Clock className="w-3.5 h-3.5 text-amber-600" />}
                    hint="How fast do you need deployment?"
                  >
                    <select 
                      required
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all text-gray-950 font-bold cursor-pointer"
                      value={seekerData.urgency}
                      onChange={e => setSeekerData({...seekerData, urgency: e.target.value as any})}
                    >
                      <option value="Low">Low - Within a week</option>
                      <option value="Medium">Tactical - Within 72h</option>
                      <option value="High">Priority - Within 24h</option>
                      <option value="Emergency">CRITICAL - Instant Deployment</option>
                    </select>
                  </FormField>

                  <FormField 
                    label="Proposed Valuation Strategy" 
                    icon={<DollarSign className="w-3.5 h-3.5 text-emerald-600" />}
                    required={false}
                    hint="Specify your budget or if this is a grant-funded request."
                  >
                    <input 
                      type="text"
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all text-gray-950 font-bold"
                      placeholder="e.g. Relief Grant / ₦10k - ₦20k"
                      value={seekerData.budget}
                      onChange={e => setSeekerData({...seekerData, budget: e.target.value})}
                    />
                  </FormField>
                </div>

                <FormField 
                  label="Mission Objectives / Request Details" 
                  icon={<FileText className="w-3.5 h-3.5" />}
                  error={validationErrors.description}
                  hint="Clearly define the problem you need solving. Be specific."
                >
                  <textarea 
                    required
                    rows={6}
                    className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all resize-none text-gray-950 font-bold ${validationErrors.description ? 'border-rose-500' : 'border-gray-100'}`}
                    placeholder="Clearly define the relief objective or problem you need solving..."
                    value={seekerData.description}
                    onChange={e => {
                      setSeekerData({...seekerData, description: e.target.value});
                      if (validationErrors.description) setValidationErrors({...validationErrors, description: ''});
                    }}
                  />
                </FormField>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Country" icon={<MapPin className="w-3.5 h-3.5" />}>
                    <input 
                      type="text"
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-950 font-bold"
                      value={seekerData.country}
                      readOnly
                    />
                  </FormField>
                  <FormField label="State" error={validationErrors.state}>
                    <input 
                      required
                      className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl text-gray-950 font-bold focus:border-indigo-500 outline-none transition-all ${validationErrors.state ? 'border-rose-500' : 'border-gray-100'}`}
                      placeholder="e.g. Kano"
                      value={seekerData.state}
                      onChange={e => {
                        setSeekerData({...seekerData, state: e.target.value});
                        if (validationErrors.state) setValidationErrors({...validationErrors, state: ''});
                      }}
                    />
                  </FormField>
                  <FormField label="City" error={validationErrors.city}>
                    <input 
                      required
                      className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl text-gray-950 font-bold focus:border-indigo-500 outline-none transition-all ${validationErrors.city ? 'border-rose-500' : 'border-gray-100'}`}
                      placeholder="e.g. Sabon Gari"
                      value={seekerData.city}
                      onChange={e => {
                        setSeekerData({...seekerData, city: e.target.value});
                        if (validationErrors.city) setValidationErrors({...validationErrors, city: ''});
                      }}
                    />
                  </FormField>
                  <FormField label="Village / Zone" required={false} hint="Specific ward or settlement info.">
                    <input 
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-950 font-bold focus:border-indigo-500 outline-none transition-all"
                      placeholder="e.g. Ward 4"
                      value={seekerData.village}
                      onChange={e => setSeekerData({...seekerData, village: e.target.value})}
                    />
                  </FormField>
                  <div className="md:col-span-2">
                    <FormField label="Exact Relief Point Address" error={validationErrors.address} hint="Precise location where service is needed.">
                      <textarea 
                        required
                        rows={2}
                        className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl text-gray-950 font-bold focus:border-indigo-500 outline-none transition-all resize-none ${validationErrors.address ? 'border-rose-500' : 'border-gray-100'}`}
                        placeholder="The exact location where the service is needed..."
                        value={seekerData.address}
                        onChange={e => {
                          setSeekerData({...seekerData, address: e.target.value});
                          if (validationErrors.address) setValidationErrors({...validationErrors, address: ''});
                        }}
                      />
                    </FormField>
                  </div>
                  <div className="md:col-span-2">
                    <FormField label="WhatsApp for Coordination" icon={<MessageCircle className="w-3.5 h-3.5 text-green-500" />} error={validationErrors.whatsapp} hint="Coordination channel.">
                      <input 
                        required
                        type="tel"
                        className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl text-gray-950 font-bold focus:border-indigo-500 outline-none transition-all ${validationErrors.whatsapp ? 'border-rose-500' : 'border-gray-100'}`}
                        placeholder="Coordinate via WhatsApp number..."
                        value={seekerData.whatsapp}
                        onChange={e => {
                          setSeekerData({...seekerData, whatsapp: e.target.value});
                          if (validationErrors.whatsapp) setValidationErrors({...validationErrors, whatsapp: ''});
                        }}
                      />
                    </FormField>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-4 mt-12 border-t pt-8 border-gray-100 font-black">
        {step > 1 && (
          <button 
            type="button"
            onClick={() => setStep(s => s - 1)}
            className="flex-1 py-4 bg-white border-2 border-gray-200 text-gray-400 rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-xs"
          >
            Go Back
          </button>
        )}
        <button 
          onClick={nextStep}
          disabled={loading}
          className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
        >
          {loading ? 'Processing Sovereign Node...' : (
            <>
              {step === (regType === 'PROVIDER' ? 3 : 2) ? 'Initiate Deployment' : 'Next Protocol'}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
