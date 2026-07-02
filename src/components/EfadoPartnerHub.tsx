import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Handshake, 
  Globe, 
  ExternalLink, 
  Users, 
  TrendingUp, 
  Zap, 
  ShieldCheck, 
  Building2, 
  MessageSquare,
  ArrowRight,
  Code,
  Share2,
  PieChart,
  Target,
  Rocket,
  X,
  Upload,
  Copy,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sparkles,
  Download,
  Lock,
  Mail,
  Building,
  Check,
  FileSpreadsheet,
  Coins
} from 'lucide-react';
import { UserProfile } from '../types';

interface PartnerHubProps {
  user: UserProfile | null;
  onNavigate: (hub: string) => void;
}

// Global Form Field to avoid 1-char input losing focus issue
const PartnerFormField: React.FC<{
  label: string;
  icon?: React.ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, icon, error, hint, required = true, children }) => {
  return (
    <div className="space-y-1.5 text-left w-full">
      <div className="flex items-center justify-between">
        <label className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${error ? 'text-rose-400' : 'text-slate-400'}`}>
          {icon} {label} {!required && <span className="text-[8px] opacity-60 font-normal">(Optional)</span>}
        </label>
        {required && <div className={`w-1 h-1 rounded-full ${error ? 'bg-rose-500 animate-ping' : 'bg-indigo-400'}`} />}
      </div>
      <div className={`transition-all duration-300 rounded-2xl ${error ? 'ring-2 ring-rose-500/20' : ''}`}>
        {children}
      </div>
      {error ? (
        <motion.p initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] font-bold text-rose-400 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </motion.p>
      ) : hint && (
        <p className="text-[9px] font-medium text-slate-500 leading-tight mt-1">{hint}</p>
      )}
    </div>
  );
};

// COMPANY / ORGANIZATION REGISTRATION MODAL
const CompanyRegistrationModal: React.FC<{
  onClose: () => void;
  user: UserProfile | null;
}> = ({ onClose, user }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  
  const [form, setForm] = useState({
    businessName: '',
    registrationNumber: '',
    industry: 'Technology',
    website: '',
    contactName: user?.displayName || '',
    contactEmail: user?.email || '',
    contactPhone: '',
    country: 'Nigeria',
    address: '',
    bankName: '',
    accountNumber: '',
    currency: 'USD'
  });

  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  const validateStep = (currentStep: number): boolean => {
    const errs: Record<string, string> = {};
    if (currentStep === 1) {
      if (!form.businessName.trim()) errs.businessName = 'Business Legal Identity is required';
      if (!form.registrationNumber.trim()) errs.registrationNumber = 'CAC RC or Incorporation Number is required';
    } else if (currentStep === 2) {
      if (!form.contactName.trim()) errs.contactName = 'Contact Representative Name is required';
      if (!form.contactEmail.trim() || !form.contactEmail.includes('@')) errs.contactEmail = 'Valid secure communication email is required';
      if (!form.contactPhone.trim()) errs.contactPhone = 'Liaison phone number is required';
      if (!form.address.trim()) errs.address = 'Physical deployment core address is required';
    } else if (currentStep === 3) {
      if (!form.bankName.trim()) errs.bankName = 'Settlement bank name is mandatory';
      if (!form.accountNumber.trim() || form.accountNumber.length < 10) errs.accountNumber = 'Provide a valid 10-digit settlement account number';
    } else if (currentStep === 4) {
      if (!uploadedFiles.incorporationDoc) errs.incorporation = 'Upload certificate & legal credentials first.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => (prev + 1) as any);
    }
  };

  const handlePrev = () => {
    setStep((prev) => (prev - 1) as any);
  };

  const simulateFileUpload = (field: 'incorporationDoc' | 'taxDoc', fileName: string) => {
    setUploadProgress(prev => ({ ...prev, [field]: 10 }));
    let progress = 10;
    const interval = setInterval(() => {
      progress += 15;
      if (progress >= 100) {
        clearInterval(interval);
        setUploadProgress(prev => ({ ...prev, [field]: 100 }));
        setUploadedFiles(prev => ({ ...prev, [field]: fileName }));
      } else {
        setUploadProgress(prev => ({ ...prev, [field]: progress }));
      }
    }, 150);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>, field: 'incorporationDoc' | 'taxDoc') => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      simulateFileUpload(field, e.dataTransfer.files[0].name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'incorporationDoc' | 'taxDoc') => {
    if (e.target.files && e.target.files[0]) {
      simulateFileUpload(field, e.target.files[0].name);
    }
  };

  const handleFinalSubmit = () => {
    if (!validateStep(4)) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep(5);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-2xl h-[85vh] flex flex-col shadow-2xl overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Grid */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-950/40">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">ORGANIZATIONAL RECRUITMENT</span>
            <h3 className="text-xl font-black italic uppercase tracking-tight text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" /> Verify Corporate Entity
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Status Hub */}
        {step < 5 && (
          <div className="px-8 py-3 bg-slate-950/20 border-b border-white/5 flex justify-between items-center text-[10px] font-black tracking-wider text-slate-400">
            <span className={step >= 1 ? 'text-indigo-400' : ''}>1. BUSINESS IDENTITY</span>
            <span className="text-slate-700">➔</span>
            <span className={step >= 2 ? 'text-indigo-400' : ''}>2. LIAISON</span>
            <span className="text-slate-700">➔</span>
            <span className={step >= 3 ? 'text-indigo-400' : ''}>3. SETTLEMENT</span>
            <span className="text-slate-700">➔</span>
            <span className={step >= 4 ? 'text-indigo-400' : ''}>4. CREDENTIALS</span>
          </div>
        )}

        {/* Form Body Context */}
        <div className="flex-1 p-8 overflow-y-auto no-scrollbar space-y-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-indigo-950/20 p-4 border border-indigo-500/10 rounded-2xl flex gap-3 text-xs leading-relaxed text-indigo-200">
                  <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
                  <p>Provide your trade identification to initialize validation. Verified corporate entities receive premium badge status, decreased commission structures, and prioritized strategic placements.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PartnerFormField label="Business Legal Name" icon={<Building className="w-3.5 h-3.5" />} error={errors.businessName} hint="The official trade identity representing your business.">
                    <input 
                      type="text" 
                      value={form.businessName}
                      onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                      placeholder="e.g. Acme Corporation Ltd"
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                    />
                  </PartnerFormField>

                  <PartnerFormField label="Incorporation No. (CAC RC)" icon={<ShieldCheck className="w-3.5 h-3.5" />} error={errors.registrationNumber} hint="Corporate affairs commission or relevant license tracking node.">
                    <input 
                      type="text" 
                      value={form.registrationNumber}
                      onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                      placeholder="e.g. RC 1928471"
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                    />
                  </PartnerFormField>

                  <PartnerFormField label="Primary Industry" icon={<Globe className="w-3.5 h-3.5" />}>
                    <select
                      value={form.industry}
                      onChange={(e) => setForm({ ...form, industry: e.target.value })}
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all"
                    >
                      <option value="Technology">Software & Technology Services</option>
                      <option value="Agriculture">Agriculture & Agro-Allied Hub</option>
                      <option value="Logistics">Logistics & Supply Chain Hub</option>
                      <option value="Finance">Financial Services & Fintech</option>
                      <option value="Retail">E-Commerce & Digital Merchandising</option>
                      <option value="Energy">Energy & Natural Resources Deployment</option>
                    </select>
                  </PartnerFormField>

                  <PartnerFormField label="Corporate Website URL" icon={<ExternalLink className="w-3.5 h-3.5" />} required={false} hint="Secure homepage mapping for verification auditing.">
                    <input 
                      type="url" 
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                      placeholder="e.g. https://yourcompany.com"
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                    />
                  </PartnerFormField>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PartnerFormField label="Representative full name" icon={<Users className="w-3.5 h-3.5" />} error={errors.contactName} hint="Legal liaison representative validating documents.">
                    <input 
                      type="text" 
                      value={form.contactName}
                      onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                      placeholder="e.g. Dr. Festus Daniel"
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                    />
                  </PartnerFormField>

                  <PartnerFormField label="Sovereign Liaison Email" icon={<Mail className="w-3.5 h-3.5" />} error={errors.contactEmail} hint="Used for strict operational compliance logging.">
                    <input 
                      type="email" 
                      value={form.contactEmail}
                      onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                      placeholder="representative@domain.com"
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                    />
                  </PartnerFormField>

                  <PartnerFormField label="Verified Hotline Number" icon={<Users className="w-3.5 h-3.5" />} error={errors.contactPhone} hint="Hotline for sudden logistics validation.">
                    <input 
                      type="tel" 
                      value={form.contactPhone}
                      onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                      placeholder="+234 807 245 6836"
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                    />
                  </PartnerFormField>

                  <PartnerFormField label="Deployment Base Country" icon={<Globe className="w-3.5 h-3.5" />}>
                    <select
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all"
                    >
                      <option value="Nigeria">Nigeria</option>
                      <option value="Ghana">Ghana</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Germany">Germany</option>
                      <option value="South Africa">South Africa</option>
                    </select>
                  </PartnerFormField>

                  <div className="md:col-span-2">
                    <PartnerFormField label="Tactical Headquarters Address" icon={<MapPinIcon />} error={errors.address}>
                      <input 
                        type="text" 
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        placeholder="Street address, suite, state, postal code."
                        className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                      />
                    </PartnerFormField>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-emerald-950/20 p-4 border border-emerald-500/10 rounded-2xl flex gap-3 text-xs leading-relaxed text-emerald-200">
                  <Coins className="w-5 h-5 text-emerald-400 shrink-0" />
                  <p>Settlement Node: Commissions, directory payouts, and co-branded transaction earnings are wired directly to your designated hub on standard 14-day intervals.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PartnerFormField label="Recipient Bank Name" icon={<Building className="w-3.5 h-3.5" />} error={errors.bankName} hint="The legal banking institution hosting your settlements.">
                    <input 
                      type="text" 
                      value={form.bankName}
                      onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                      placeholder="e.g. Access Bank Pls"
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                    />
                  </PartnerFormField>

                  <PartnerFormField label="Settlement Account Number" icon={<FileSpreadsheet className="w-3.5 h-3.5" />} error={errors.accountNumber} hint="Your legal company account tracking node.">
                    <input 
                      type="text" 
                      value={form.accountNumber}
                      onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                      placeholder="10-digit Account Number"
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                    />
                  </PartnerFormField>

                  <PartnerFormField label="Preferred Accounting Currency" icon={<Coins className="w-3.5 h-3.5" />}>
                    <select
                      value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value })}
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-indigo-500 outline-none transition-all"
                    >
                      <option value="USD">USD ($) - United States Dollar</option>
                      <option value="NGN">NGN (₦) - Nigerian Naira</option>
                      <option value="GBP">GBP (£) - British Pound Sterling</option>
                      <option value="EUR">EUR (€) - Euro Currency</option>
                    </select>
                  </PartnerFormField>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div 
                key="step4" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Upload Verification Documents</h4>
                  
                  {/* File 1: Certificate */}
                  <div 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleFileDrop(e, 'incorporationDoc')}
                    className="border-2 border-dashed border-white/10 hover:border-indigo-500/40 rounded-3xl p-6 text-center transition-all bg-slate-950/25 relative overflow-hidden group cursor-pointer"
                    onClick={() => fileInputRef1.current?.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef1}
                      onChange={(e) => handleFileChange(e, 'incorporationDoc')}
                      className="hidden" 
                      accept=".pdf,.png,.jpg,.jpeg"
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 group-hover:bg-indigo-600/10 flex items-center justify-center transition-colors">
                        <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase text-white tracking-widest leading-none">CAC Incorporated Document *</p>
                        <p className="text-[9px] text-slate-500 font-bold mt-1.5 uppercase">PDF, JPG, or PNG (Max size: 5MB)</p>
                      </div>
                    </div>
                    
                    {uploadProgress.incorporationDoc !== undefined && (
                      <div className="absolute bottom-0 inset-x-0 h-1 bg-white/5">
                        <div 
                          className="h-full bg-indigo-500 transition-all duration-300"
                          style={{ width: `${uploadProgress.incorporationDoc}%` }}
                        />
                      </div>
                    )}

                    {uploadedFiles.incorporationDoc && (
                      <div className="absolute inset-0 bg-slate-900 flex items-center justify-center gap-2 p-4">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500 animate-bounce" />
                        <div className="text-left">
                          <p className="text-[10px] font-black text-white uppercase tracking-wider">Uploaded Successfully</p>
                          <p className="text-[9px] text-emerald-400 font-mono italic max-w-xs truncate">{uploadedFiles.incorporationDoc}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* File 2: Tax Clearance */}
                  <div 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleFileDrop(e, 'taxDoc')}
                    className="border-2 border-dashed border-white/10 hover:border-purple-500/40 rounded-3xl p-6 text-center transition-all bg-slate-950/25 relative overflow-hidden group cursor-pointer"
                    onClick={() => fileInputRef2.current?.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef2}
                      onChange={(e) => handleFileChange(e, 'taxDoc')}
                      className="hidden" 
                      accept=".pdf,.png,.jpg,.jpeg"
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 group-hover:bg-purple-600/10 flex items-center justify-center transition-colors">
                        <Upload className="w-6 h-6 text-slate-400 group-hover:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase text-white tracking-widest leading-none">Tax Identification Certificate </p>
                        <p className="text-[9px] text-slate-500 font-bold mt-1.5 uppercase">Optional validation booster (Max size: 5MB)</p>
                      </div>
                    </div>

                    {uploadProgress.taxDoc !== undefined && (
                      <div className="absolute bottom-0 inset-x-0 h-1 bg-white/5">
                        <div 
                          className="h-full bg-purple-500 transition-all duration-300"
                          style={{ width: `${uploadProgress.taxDoc}%` }}
                        />
                      </div>
                    )}

                    {uploadedFiles.taxDoc && (
                      <div className="absolute inset-0 bg-slate-900 flex items-center justify-center gap-2 p-4">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        <div className="text-left">
                          <p className="text-[10px] font-black text-white uppercase tracking-wider">Uploaded Successfully</p>
                          <p className="text-[9px] text-emerald-400 font-mono italic max-w-xs truncate">{uploadedFiles.taxDoc}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {errors.incorporation && (
                  <p className="text-[10px] font-black uppercase text-rose-400 tracking-wider text-center">{errors.incorporation}</p>
                )}
              </motion.div>
            )}

            {step === 5 && (
              <motion.div 
                key="step5" 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                className="text-center py-8 space-y-6"
              >
                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/10">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400">verification processing initialized</span>
                  <h3 className="text-3xl font-black italic uppercase tracking-tighter">EFADO Sovereign Onboarding Complete</h3>
                  <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
                    Sovereign validation services are processing your corporate materials. An official response with authorization credentials will be dispatched to <span className="text-white font-black">{form.contactEmail}</span> on or before 48 business hours.
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-white/5 rounded-3xl p-6 text-left max-w-md mx-auto font-mono text-xs space-y-3">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-500">SECURE TICKET ID:</span>
                    <span className="text-indigo-400 font-bold">#EFD-INC-72418-Z</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-500">ENTITY CLASSIFICATION:</span>
                    <span className="text-white font-bold">{form.industry.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">VERIFICATION PRIORITY:</span>
                    <span className="text-emerald-400 font-bold">1 - HIGH LEVEL</span>
                  </div>
                </div>

                <div className="pt-4 max-w-xs mx-auto">
                  <button 
                    onClick={onClose} 
                    className="w-full py-4 bg-white hover:bg-slate-100 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl"
                  >
                    Return to Strategic Hub
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        {step < 5 && (
          <div className="p-6 border-t border-white/5 bg-slate-950/30 flex justify-between items-center">
            <button 
              disabled={step === 1 || isSubmitting}
              onClick={handlePrev}
              className="px-6 py-3 border border-white/10 hover:border-white/20 text-slate-300 disabled:opacity-30 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Previous Step
            </button>

            {step < 4 ? (
              <button 
                onClick={handleNext}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/10"
              >
                Continue Pipeline <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/10"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying Credentials...
                  </>
                ) : (
                  <>
                    Deploy Entity <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

// MapPin icon helper
const MapPinIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);


// AFFILIATE / REFERRAL MARKETING CONTROL CENTER
const AffiliateMarketingModal: React.FC<{
  onClose: () => void;
  user: UserProfile | null;
}> = ({ onClose, user }) => {
  const [affiliateCode, setAffiliateCode] = useState('EFADOGLOBAL');
  const [isCopied, setIsCopied] = useState(false);
  const [activePromoTab, setActivePromoTab] = useState<'CARD' | 'SOCIAL' | 'EMAIL'>('CARD');

  const origin = typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
    ? window.location.origin
    : 'https://www.e-fado.com';
  const referralLink = `${origin}/#partners?ref=${affiliateCode.toUpperCase()}`;

  const copyRefLink = () => {
    navigator.clipboard.writeText(referralLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const marketingPosts = {
    SOCIAL: `🔗 Level up your business! Integrate your organization directly to the EFADO connect platform. Secure settlements, high-density traffic, global buyers.\n\nHook-up today with code "${affiliateCode.toUpperCase()}" for priority processing:\n${referralLink}`,
    EMAIL: `Subject: Invitation to Connect: EFADO Global Strategic Affiliation\n\nDear Partner,\n\nI am inviting your organization to connect with the EFADO ecosystem, a unified transaction platform designed for international growth, streamlined operations, and corporate trust.\n\nRegistering under my unique strategic link grants your enterprise priority verification, reduced transaction commissions, and featured placement in our global directories.\n\nConnect your business at:\n${referralLink}\n\nUse Code: ${affiliateCode.toUpperCase()}\n\nBest regards.`
  };

  const copyCustomText = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Strategic copy material saved to clipboard.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Grid */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-950/40">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">affiliate & partner control desk</span>
            <h3 className="text-xl font-black italic uppercase tracking-tight text-white flex items-center gap-2">
              <Rocket className="w-5 h-5 text-emerald-400 animate-pulse" /> Strategic Marketer Dashboard
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Marketer Dashboard Body */}
        <div className="flex-1 p-8 overflow-y-auto no-scrollbar space-y-8">
          
          {/* Main Code Customizer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Configure Referral Protocol</h4>
              
              <div className="bg-slate-950/40 border border-white/5 rounded-3xl p-6 space-y-4 text-left">
                <PartnerFormField label="Custom Marketing Account Handle" icon={<Users className="w-3.5 h-3.5" />} hint="Your handle creates clean links to maximize psychological click trust.">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={affiliateCode}
                      onChange={(e) => setAffiliateCode(e.target.value.replace(/[^A-Za-z0-9]/g, ''))}
                      className="flex-grow bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold uppercase text-white focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600"
                    />
                  </div>
                </PartnerFormField>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Live Affiliation Link</label>
                  <div className="relative flex items-center bg-slate-900 border border-white/5 rounded-2xl px-4 py-3.5 font-mono text-xs text-white overflow-hidden">
                    <span className="opacity-60 truncate pr-16 select-all">{referralLink}</span>
                    <button 
                      onClick={copyRefLink}
                      className="absolute right-2 top-2 bottom-2 px-4 rounded-xl bg-emerald-600 text-white font-black text-[10px] uppercase flex items-center gap-1 hover:bg-emerald-500 transition-colors"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {isCopied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Commissions Statistics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/20 border border-white/5 rounded-2xl p-4 text-left">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Affiliate Tier</span>
                  <span className="text-sm font-black text-indigo-400 uppercase tracking-tighter block mt-1 flex items-center gap-1.5">
                    Sovereign Master <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  </span>
                </div>
                <div className="bg-slate-950/20 border border-white/5 rounded-2xl p-4 text-left">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Commission Rate</span>
                  <span className="text-sm font-black text-emerald-400 font-mono block mt-1">20.5% Cash-cut</span>
                </div>
              </div>
            </div>

            {/* Visual Branding Package Display */}
            <div className="bg-slate-950/40 border border-white/5 rounded-[2rem] p-6 text-left space-y-4">
              <h4 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-1.5">
                <Target className="w-4 h-4 text-indigo-400" /> Affiliate Brand Kit Card
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">Your strategic promotional profile is ready. Share this ready-made visual branding block locally or via web platforms.</p>
              
              {/* Visual Ticket Graphic Component */}
              <div className="relative bg-gradient-to-tr from-indigo-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-16 -mt-16" />
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <span className="text-[7px] font-black uppercase tracking-[0.25em] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full inline-block mb-2">EFADO CONNECT</span>
                    <h5 className="text-[14px] font-black italic uppercase leading-none text-white tracking-tighter">GLOBAL ENTERPRISE PIPELINE</h5>
                  </div>
                  <Handshake className="w-7 h-7 text-indigo-400" />
                </div>

                <div className="my-6 border-t-2 border-dashed border-white/10" />

                <div className="flex justify-between items-end font-mono">
                  <div>
                    <span className="text-[6px] text-slate-400 uppercase tracking-widest block">strategic code</span>
                    <span className="text-xs font-black text-emerald-400 uppercase">{affiliateCode || 'PENDING'}</span>
                  </div>
                  <div>
                    <span className="text-[6px] text-slate-400 uppercase tracking-widest block">directory priority</span>
                    <span className="text-[8px] font-black text-indigo-300 tracking-wider">VERIFIED RECRUIT</span>
                  </div>
                </div>
              </div>

              <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 border border-white/5 flex items-center justify-center gap-2">
                <Download className="w-3.5 h-3.5 text-indigo-400" /> Save Co-branded Banner Image
              </button>
            </div>
          </div>

          {/* Promotional Marketing Channels Tabs */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Ready-to-Deploy Promo Campaigns</h4>
            
            <div className="flex gap-2 border-b border-white/5">
              {[
                { id: 'CARD', label: 'Campaign Hub' },
                { id: 'SOCIAL', label: 'Social Outreach Scripts' },
                { id: 'EMAIL', label: 'Sovereign Letter Blueprint' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActivePromoTab(tab.id as any)}
                  className={`pb-3 px-4 font-black text-[10px] uppercase tracking-wider transition-all border-b-2 ${
                    activePromoTab === tab.id ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-4 bg-slate-950/30 rounded-2xl border border-white/5 min-h-[160px] flex flex-col justify-between text-left">
              <AnimatePresence mode="wait">
                {activePromoTab === 'CARD' && (
                  <motion.div key="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <p className="text-xs text-slate-400 leading-relaxed font-semibold">Our high-density marketing pipelines make conversions seamless. Your custom affiliate code auto-embeds deep-link tracking cookies persistent for up to 90 days.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-mono text-[10px]">
                      <div className="p-3 bg-slate-900 border border-white/5 rounded-xl">
                        <span className="text-slate-500 uppercase block mb-1">Total Affiliated</span>
                        <span className="text-xs font-black text-indigo-400">18 Organizations</span>
                      </div>
                      <div className="p-3 bg-slate-900 border border-white/5 rounded-xl">
                        <span className="text-slate-500 uppercase block mb-1">Clicks Tracked</span>
                        <span className="text-xs font-black text-purple-400">1,429 Actions</span>
                      </div>
                      <div className="p-3 bg-slate-900 border border-white/5 rounded-xl">
                        <span className="text-slate-500 uppercase block mb-1">Verified Revenue</span>
                        <span className="text-xs font-black text-emerald-400 font-mono">$432.00 Earned</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activePromoTab === 'SOCIAL' && (
                  <motion.div key="social" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <pre className="p-4 bg-slate-950 rounded-xl font-sans text-xs text-indigo-200/90 whitespace-pre-wrap leading-relaxed border border-white/5 max-h-[150px] overflow-y-auto no-scrollbar">
                      {marketingPosts.SOCIAL}
                    </pre>
                    <button 
                      onClick={() => copyCustomText(marketingPosts.SOCIAL)}
                      className="py-3.5 px-6 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[9px] font-black uppercase tracking-widest text-white self-start flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy WhatsApp & Twitter Text
                    </button>
                  </motion.div>
                )}

                {activePromoTab === 'EMAIL' && (
                  <motion.div key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <pre className="p-4 bg-slate-950 rounded-xl font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed border border-white/5 max-h-[150px] overflow-y-auto no-scrollbar">
                      {marketingPosts.EMAIL}
                    </pre>
                    <button 
                      onClick={() => copyCustomText(marketingPosts.EMAIL)}
                      className="py-3.5 px-6 bg-purple-600 hover:bg-purple-500 rounded-xl text-[9px] font-black uppercase tracking-widest text-white self-start flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy B2B Corporate Letter
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Support hotline footer */}
        <div className="p-5 border-t border-white/5 bg-slate-950/40 text-center flex items-center justify-between text-[10px] font-black uppercase text-slate-500 tracking-widest">
          <span className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-emerald-500" /> SECURE STRATEGIC LINKING STATUS: ONLINE
          </span>
          <button onClick={onClose} className="text-white hover:text-indigo-400">Close Panel [ESC]</button>
        </div>
      </motion.div>
    </div>
  );
};


export const EfadoPartnerHub: React.FC<PartnerHubProps> = ({ user, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ORGANIZATIONS' | 'MARKETERS' | 'TOOLS'>('OVERVIEW');
  const [showRegModal, setShowRegModal] = useState(false);
  const [showMarketingModal, setShowMarketingModal] = useState(false);

  const PARTNER_BENEFITS = [
    {
      title: "Global Visibility",
      desc: "Get featured in our directory accessible to millions of global citizens.",
      icon: Globe,
      color: "text-blue-400"
    },
    {
      title: "Revenue Sharing",
      desc: "Earn commissions from every transaction made through your affiliate hook-ups.",
      icon: TrendingUp,
      color: "text-emerald-400"
    },
    {
      title: "API Hook-up",
      desc: "Connect your external website directly to our transactional backbone.",
      icon: Code,
      color: "text-purple-400"
    },
    {
      title: "Organization Status",
      desc: "Verified badges for companies and non-profits to build trust.",
      icon: ShieldCheck,
      color: "text-indigo-400"
    }
  ];

  const MOCK_PARTNERS = [
    { name: "Global Tech Solutions", sector: "Software", country: "USA", rating: 4.8 },
    { name: "African Agri-Trade", sector: "Agriculture", country: "Nigeria", rating: 4.9 },
    { name: "Euro Logistics Hub", sector: "Logistics", country: "Germany", rating: 4.7 }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      {/* Hero Section */}
      <div className="relative h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/80 to-slate-950" />
        
        <div className="relative z-10 text-center max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-6"
          >
            <Handshake className="w-4 h-4" />
            Strategic Affiliation Hub
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black italic tracking-tighter mb-6 leading-none select-none"
          >
            HOOK-UP YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">ORGANIZATION</span> TO THE GLOBE
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto"
          >
            A unified connection portal for marketers, companies, and global citizens to affiliate, patronize, and synchronize.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-[-60px] relative z-20">
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-12 overflow-x-auto pb-4 no-scrollbar">
          {[
            { id: 'OVERVIEW', label: 'Overview Hub', icon: Zap },
            { id: 'ORGANIZATIONS', label: 'Company Portal', icon: Building2 },
            { id: 'MARKETERS', label: 'Marketer Center', icon: Target },
            { id: 'TOOLS', label: 'Tech Hook-ups', icon: Code },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`px-8 py-5 rounded-[2rem] font-black tracking-widest text-xs transition-all flex items-center gap-3 whitespace-nowrap shadow-xl border ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white border-indigo-400 scale-105 shadow-indigo-500/20' 
                  : 'bg-slate-900/60 backdrop-blur-xl text-slate-400 border-white/5'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="uppercase">{item.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'OVERVIEW' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Benefits Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {PARTNER_BENEFITS.map((benefit, i) => (
                  <div key={i} className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-white/5 hover:border-indigo-500/30 transition-all group">
                    <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${benefit.color}`}>
                      <benefit.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-black text-white italic mb-3">{benefit.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{benefit.desc}</p>
                  </div>
                ))}
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                  <div className="relative z-10">
                    <h2 className="text-3xl font-black text-white mb-6 uppercase tracking-tighter italic">FOR COMPANIES & ORGANIZATIONS</h2>
                    <p className="text-indigo-100/80 mb-8 text-lg font-medium">Verify your business, connect your external platforms, and gain access to high-density global patronage.</p>
                    <button 
                      onClick={() => setShowRegModal(true)}
                      className="px-8 py-5 bg-white text-indigo-600 rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-xl hover:scale-105 transition-all"
                    >
                      Register My Organization <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 shadow-2xl group">
                  <h2 className="text-3xl font-black text-white mb-6 uppercase tracking-tighter italic">FOR MARKETERS & AFFILIATES</h2>
                  <p className="text-slate-400 mb-8 text-lg font-medium">Earn strategic commissions by connecting new users and businesses to the EFADO ecosystem across the globe.</p>
                  <button 
                    onClick={() => setShowMarketingModal(true)}
                    className="px-8 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-xl hover:scale-105 transition-all"
                  >
                    Start Marketing Now <Rocket className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Partner Directory Preview */}
              <div className="bg-slate-900/30 p-10 rounded-[3rem] border border-white/5">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Global Strategic Partners</h3>
                  <button onClick={() => setActiveTab('ORGANIZATIONS')} className="text-xs font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300">View Full Directory →</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {MOCK_PARTNERS.map((partner, i) => (
                    <div key={i} className="bg-slate-900/60 p-6 rounded-3xl border border-white/5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                        <Users className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">{partner.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{partner.sector} • {partner.country}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'MARKETERS' && (
             <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="space-y-8"
             >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-white/5">
                      <div className="flex items-center justify-between mb-6">
                        <Share2 className="w-8 h-8 text-indigo-400" />
                        <span className="px-3 py-1 bg-indigo-500/10 rounded-full text-[8px] font-black text-indigo-400 uppercase tracking-widest">Active Links</span>
                      </div>
                      <h4 className="text-xl font-black text-white uppercase italic mb-2">Invite Hubs</h4>
                      <p className="text-slate-500 text-xs mb-6">Share your unique link and earn from every new sign-up and subsequent transactions.</p>
                      <button 
                        onClick={() => setShowMarketingModal(true)}
                        className="w-full py-4 bg-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-indigo-500 transition-colors"
                      >
                        Launch Marketing Center
                      </button>
                   </div>
                   
                   <div className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-white/5">
                      <div className="flex items-center justify-between mb-6">
                        <PieChart className="w-8 h-8 text-emerald-400" />
                        <span className="px-3 py-1 bg-emerald-500/10 rounded-full text-[8px] font-black text-emerald-400 uppercase tracking-widest">Commission</span>
                      </div>
                      <h4 className="text-xl font-black text-white uppercase italic mb-2">Performance Tracker</h4>
                      <p className="text-slate-500 text-xs mb-6">Real-time tracking of your clicks, conversions, and total earnings across hubs.</p>
                      <p className="text-3xl font-black text-emerald-400 italic font-mono">$432.00</p>
                   </div>
  
                   <div className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-white/5">
                      <div className="flex items-center justify-between mb-6">
                        <Target className="w-8 h-8 text-rose-400" />
                        <span className="px-3 py-1 bg-rose-500/10 rounded-full text-[8px] font-black text-rose-400 uppercase tracking-widest">Incentives</span>
                      </div>
                      <h4 className="text-xl font-black text-white uppercase italic mb-2">Marketer Rewards</h4>
                      <p className="text-slate-500 text-xs mb-6">Reach strategic milestones to unlock higher commission rates and verified badges.</p>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-3">
                         <div className="h-full bg-rose-500 w-[65%]" />
                      </div>
                      <span className="text-[9px] font-black text-rose-400 uppercase tracking-wider block">65% Progress to Gold Elite badge</span>
                   </div>
                </div>
             </motion.div>
          )}

          {activeTab === 'ORGANIZATIONS' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 text-center max-w-3xl mx-auto">
                <Building2 className="w-20 h-20 text-indigo-400 mx-auto mb-8 animate-bounce" />
                <h3 className="text-3xl font-black text-white uppercase italic mb-4">Organizational Verification</h3>
                <p className="text-slate-400 mb-10 leading-relaxed font-medium">
                  Elevate your company status on EFADO. Verified organizations receive priority listing in market hubs, lower transaction fees, and a "Global Strategic Partner" badge.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-10">
                  {[
                    "Corporate Identity Check",
                    "Tax Registration Validation",
                    "Global Reach Analysis",
                    "Patron Trust Scoring"
                  ].map((check, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl">
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      <span className="text-xs font-black text-white/80 uppercase">{check}</span>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => setShowRegModal(true)}
                  className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] shadow-2xl hover:scale-105 transition-all"
                >
                  Verify Now & Upload Credentials
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'TOOLS' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 text-center max-w-4xl mx-auto"
            >
              <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-purple-500/10 rounded-full border border-purple-500/20 mb-8">
                <Code className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400">Developer & External Sync</span>
              </div>
              <h3 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500 select-none">
                THE EFADO <span className="text-indigo-400 italic">BACKBONE</span> HOOK-UP
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-900/60 p-10 rounded-[2.5rem] border border-white/5 text-left group hover:border-purple-500/30 transition-all">
                  <div className="w-14 h-14 bg-purple-600/20 rounded-2xl flex items-center justify-center mb-6 text-purple-400">
                    <ExternalLink className="w-7 h-7" />
                  </div>
                  <h4 className="text-xl font-black text-white uppercase italic mb-4">External Site Integration</h4>
                  <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                    Hook-up your existing e-commerce site, blog, or logistics portal to EFADO the North Star Hubs. Sync inventory and payments seamlessly.
                  </p>
                  <code className="block p-4 bg-black/40 rounded-xl text-[10px] font-mono text-purple-300 mb-8 border border-white/5 overflow-x-auto">
                    {`<script src="${typeof window !== 'undefined' ? window.location.origin : 'https://www.e-fado.com'}/api/sync.js" data-affiliate="${user?.uid || 'EFADOGLOBAL'}"></script>`}
                  </code>
                  <button 
                    onClick={() => alert(`API Integration Guidance:\n\n1. Copy the script tag above into the <head> section of your external website or e-commerce store.\n\n2. Notice the attribute data-affiliate="${user?.uid || 'EFADOGLOBAL'}". This automatically syncs all external visitor checkouts to your EFADO Partner Ledger for instant commission payouts!`)}
                    className="w-full py-4 bg-white/5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white border border-white/5 group-hover:bg-purple-600 transition-all"
                  >
                    Documentation & Setup
                  </button>
                </div>

                <div className="bg-slate-900/60 p-10 rounded-[2.5rem] border border-white/5 text-left group hover:border-indigo-500/30 transition-all">
                  <div className="w-14 h-14 bg-indigo-600/20 rounded-2xl flex items-center justify-center mb-6 text-indigo-400">
                    <Zap className="w-7 h-7" />
                  </div>
                  <h4 className="text-xl font-black text-white uppercase italic mb-4">Transaction Webhooks</h4>
                  <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                    Receive real-time notifications for affiliate sign-ups, commission payouts, and market activity directly to your server.
                  </p>
                  <div className="flex items-center gap-3 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 mb-8">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-400 uppercase">Live Webhook Status: Active</span>
                  </div>
                  <button 
                    onClick={() => {
                      const key = 'efado_sk_live_' + Math.random().toString(36).substring(2, 10).toUpperCase() + '_' + Date.now().toString().slice(-4);
                      navigator.clipboard.writeText(key);
                      alert(`🔐 Strategic Webhook Secret Key Generated:\n\n${key}\n\nThis secret key has been copied to your clipboard. Configure your receiving server to verify incoming EFADO webhook signatures using HMAC SHA-256 with this secret.`);
                    }}
                    className="w-full py-4 bg-white/5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white border border-white/5 group-hover:bg-indigo-600 transition-all"
                  >
                    Generate Secret Key
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modern Popups Context */}
      <AnimatePresence>
        {showRegModal && (
          <CompanyRegistrationModal 
            onClose={() => setShowRegModal(false)} 
            user={user} 
          />
        )}
        {showMarketingModal && (
          <AffiliateMarketingModal 
            onClose={() => setShowMarketingModal(false)} 
            user={user} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};
