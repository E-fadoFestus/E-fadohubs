import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  Globe, 
  Languages, 
  ShieldCheck, 
  ArrowRight,
  CheckCircle2,
  X,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import { db, doc, updateDoc, serverTimestamp } from '../firebase';

interface CSCCRegistrationProps {
  user: UserProfile;
  onClose: () => void;
  onSuccess: () => void;
}

export const CSCCRegistration: React.FC<CSCCRegistrationProps> = ({ user, onClose, onSuccess }) => {
  const [step, setStep] = useState<'FORM' | 'OTP' | 'SUCCESS'>('FORM');
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
        {required && <div className={`w-1 h-1 rounded-full ${error ? 'bg-rose-500 animate-ping' : 'bg-indigo-400'}`} />}
      </div>
      <div className={`transition-all duration-300 ${error ? 'ring-2 ring-rose-500/20' : ''}`}>
        {children}
      </div>
      {error ? (
        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 rotate-45" /> {error}
        </motion.p>
      ) : hint && (
        <p className="text-[9px] font-medium text-slate-400 leading-tight">{hint}</p>
      )}
    </div>
  );

  const [otpValue, setOtpValue] = useState(['', '', '', '', '', '']);
  const [formData, setFormData] = useState({
    fullName: user.displayName || '',
    phoneNumber: '',
    email: user.email,
    country: '',
    language: 'English'
  });

  const DEVELOPER_PHONE = "08072456836";
  const DEVELOPER_NAME = "Festus Okhawere Daniel";
  const DEVELOPER_CODE = "561415";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.fullName) errors.fullName = "Full legal name is required for platform identification.";
    if (!formData.phoneNumber) errors.phoneNumber = "Valid phone is needed for MFA security.";
    if (!formData.country) errors.country = "Nationality selection is mandatory.";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    
    // Developer special handle: If name/phone match, maybe pre-warn or just proceed
    
    // Simulate OTP sending
    setTimeout(() => {
      setStep('OTP');
      setLoading(false);
    }, 1500);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpValue];
    newOtp[index] = value.slice(-1);
    setOtpValue(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpValue[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const verifyOtp = async () => {
    const enteredCode = otpValue.join('');
    
    // Developer bypass check
    const isDeveloper = formData.phoneNumber === DEVELOPER_PHONE && formData.fullName === DEVELOPER_NAME;
    
    if (!isDeveloper && enteredCode.length < 6) {
      alert("Please enter a valid 6-digit code.");
      return;
    }

    if (isDeveloper && enteredCode !== DEVELOPER_CODE) {
       alert("Developer Verification failed. Incorrect Code.");
       return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        country: formData.country,
        language: formData.language,
        csccRegistered: true,
        role: isDeveloper ? 'admin' : (user.role || 'user'),
        updatedAt: serverTimestamp()
      });
      setStep('SUCCESS');
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <AnimatePresence mode="wait">
        {step === 'FORM' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="mb-8">
              <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Create EFADO Community Account</h2>
              <p className="text-gray-500 text-sm">Join the global community for collective saving and growth.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-6">
                <FormField 
                  label="Full Legal Identity" 
                  icon={<User className="w-3 h-3" />}
                  error={validationErrors.fullName}
                  hint="Your official name as shown on national identification."
                >
                  <input 
                    required
                    type="text" 
                    value={formData.fullName}
                    onChange={(e) => {
                      setFormData({...formData, fullName: e.target.value});
                      if (validationErrors.fullName) setValidationErrors({...validationErrors, fullName: ''});
                    }}
                    placeholder="Enter your full legal name" 
                    className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 font-bold transition-all ${validationErrors.fullName ? 'border-rose-500' : 'border-gray-100'}`}
                  />
                </FormField>

                <FormField 
                  label="Official Mobile Node" 
                  icon={<Phone className="w-3 h-3" />}
                  error={validationErrors.phoneNumber}
                  hint="Primary phone for security alerts and MFA."
                >
                  <input 
                    required
                    type="tel" 
                    value={formData.phoneNumber}
                    onChange={(e) => {
                      setFormData({...formData, phoneNumber: e.target.value});
                      if (validationErrors.phoneNumber) setValidationErrors({...validationErrors, phoneNumber: ''});
                    }}
                    placeholder="+1 (555) 000-0000" 
                    className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 font-bold transition-all ${validationErrors.phoneNumber ? 'border-rose-500' : 'border-gray-100'}`}
                  />
                </FormField>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField 
                    label="Current Country" 
                    icon={<Globe className="w-3 h-3" />}
                    error={validationErrors.country}
                    hint="Operational zone."
                  >
                    <select 
                      required
                      value={formData.country}
                      onChange={(e) => {
                        setFormData({...formData, country: e.target.value});
                        if (validationErrors.country) setValidationErrors({...validationErrors, country: ''});
                      }}
                      className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 font-bold transition-all cursor-pointer ${validationErrors.country ? 'border-rose-500' : 'border-gray-100'}`}
                    >
                      <option value="">Select Country</option>
                      <option value="Nigeria">Nigeria</option>
                      <option value="USA">USA</option>
                      <option value="UK">UK</option>
                      <option value="Canada">Canada</option>
                      <option value="Ghana">Ghana</option>
                    </select>
                  </FormField>
                  <FormField 
                    label="Linguistic Node" 
                    icon={<Languages className="w-3 h-3" />}
                    hint="Default UI language preference."
                  >
                    <select 
                      value={formData.language}
                      onChange={(e) => setFormData({...formData, language: e.target.value})}
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 font-bold cursor-pointer transition-all"
                    >
                      <option value="English">English</option>
                      <option value="French">French</option>
                      <option value="Spanish">Spanish</option>
                      <option value="Hausa">Hausa</option>
                      <option value="Yoruba">Yoruba</option>
                      <option value="Igbo">Igbo</option>
                    </select>
                  </FormField>
                </div>
              </div>

              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                <p className="text-[10px] text-indigo-800 leading-relaxed font-medium">
                  By joining the CSCC hub, you agree to the EFADO global security architecture. Your data is encrypted at rest and in transit.
                </p>
              </div>

              <button 
                disabled={loading}
                type="submit"
                className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Request Security Code'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </motion.div>
        )}

        {step === 'OTP' && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Verify Identity</h2>
            <p className="text-gray-500 text-sm mb-8">We've sent a 6-digit code to {formData.phoneNumber}</p>

            <div className="flex justify-center gap-2 mb-8">
              {[0, 1, 2, 3, 4, 5].map(i => (
                <input 
                  key={i}
                  id={`otp-${i}`}
                  type="text" 
                  maxLength={1}
                  value={otpValue[i]}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-12 h-14 bg-gray-50 border border-gray-200 rounded-xl text-center text-xl font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
              ))}
            </div>

            <button 
              onClick={verifyOtp}
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Create Account'}
            </button>
            
            <button 
              onClick={() => setStep('FORM')}
              className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600"
            >
              Change Phone Number
            </button>
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
            <h2 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight">Welcome to EFADO!</h2>
            <p className="text-gray-500 mb-8">Your community account has been successfully created. You can now join or create saving cycles.</p>
            
            <button 
              onClick={onSuccess}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:bg-gray-800 transition-all"
            >
              Go to Community Hub
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
