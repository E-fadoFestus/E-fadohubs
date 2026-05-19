import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserPlus, 
  Package, 
  X, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Building2,
  Tag,
  Info,
  ChevronRight,
  Trash2,
  Globe,
  Truck,
  ArrowLeft,
  Camera,
  ShieldCheck
} from 'lucide-react';
import { useCurrency } from '../lib/CurrencyContext';
import { 
  db, 
  collection, 
  addDoc, 
  serverTimestamp 
} from '../firebase';
import { VendorProfile, MarketProduct } from '../types';

interface VendorRegistrationFlowProps {
  onClose: () => void;
  categories: Record<string, Record<string, Record<string, string[]>>>;
  hubName: string;
  accentColor?: string;
}

export const VendorRegistrationFlow: React.FC<VendorRegistrationFlowProps> = ({ 
  onClose, 
  categories, 
  hubName,
  accentColor = 'indigo'
}) => {
  const { selectedCurrency } = useCurrency();
  const [regStep, setRegStep] = useState<'VENDOR' | 'PRODUCTS' | 'SUCCESS'>('VENDOR');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
        <label className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${error ? 'text-rose-500' : 'text-slate-400'}`}>
          {icon} {label} {!required && <span className="text-[8px] opacity-60">(Optional)</span>}
        </label>
        {required && <div className={`w-1 h-1 rounded-full ${error ? 'bg-rose-500 animate-ping' : colorClasses.bg}`} />}
      </div>
      <div className={`transition-all duration-300 ${error ? 'ring-2 ring-rose-500/20' : ''}`}>
        {children}
      </div>
      {error ? (
        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[9px] font-bold text-rose-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </motion.p>
      ) : hint && (
        <p className="text-[8px] font-medium text-slate-500 leading-tight">{hint}</p>
      )}
    </div>
  );

  // Vendor Form State
  const [vendorForm, setVendorForm] = useState({
    fullName: '',
    businessName: '',
    vendorType: 'Individual' as 'Individual' | 'Company' | 'Organization',
    email: '',
    phone: '',
    whatsapp: '',
    country: '',
    city: '',
    village: '',
    address: '',
    landmark: '',
    registrationNumber: '',
    pickupMethod: 'Both' as 'Pickup' | 'Delivery' | 'Both',
    termsAccepted: false
  });

  // Product Form State
  const [products, setProducts] = useState<Partial<MarketProduct>[]>([]);
  const [currentProduct, setCurrentProduct] = useState<Partial<MarketProduct>>({
    title: '',
    categoryPath: { level1: '', level2: '', level3: '', level4: '' },
    condition: 'New',
    quantity: 1,
    price: 0,
    currency: 'USD',
    description: '',
    photos: [],
    location: '',
    village: '',
    landmark: '',
    whatsapp: '',
    phone: '',
    email: '',
    complianceConfirmed: false
  });

  const validateVendor = () => {
    const newErrors: Record<string, string> = {};
    if (!vendorForm.fullName) newErrors.fullName = 'Full name is required';
    if (!vendorForm.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = 'Invalid email format';
    if (vendorForm.phone.length < 8) newErrors.phone = 'Invalid phone number';
    if (!vendorForm.country) newErrors.country = 'Country is required';
    if (!vendorForm.city) newErrors.city = 'City is required';
    if (!vendorForm.termsAccepted) newErrors.terms = 'You must accept the terms';
    
    // Local requirement logic: If Country is Nigeria, require registration number for Companies
    if (vendorForm.country.toLowerCase() === 'nigeria' && vendorForm.vendorType === 'Company' && !vendorForm.registrationNumber) {
      newErrors.registrationNumber = 'CAC Registration number is required for Nigerian companies';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateProduct = () => {
    const newErrors: Record<string, string> = {};
    if (!currentProduct.title) newErrors.title = 'Product title is required';
    if (!currentProduct.categoryPath?.level4) newErrors.category = 'Select a complete category path (4 levels)';
    if ((currentProduct.price || 0) <= 0) newErrors.price = 'Price must be greater than 0';
    if ((currentProduct.photos?.length || 0) === 0) {
      // For demo purposes, we'll allow it but in real app it should be required
      // newErrors.photos = 'At least one photo is required';
    }
    if (!currentProduct.complianceConfirmed) newErrors.compliance = 'Confirm compliance';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddProduct = () => {
    if (validateProduct()) {
      // Add a placeholder photo if none provided for demo
      const productToAdd = {
        ...currentProduct,
        photos: currentProduct.photos?.length ? currentProduct.photos : [`https://picsum.photos/seed/${Math.random()}/800/600`]
      };
      setProducts([...products, productToAdd]);
      setCurrentProduct({
        title: '',
        categoryPath: { level1: '', level2: '', level3: '', level4: '' },
        condition: 'New',
        quantity: 1,
        price: 0,
        currency: 'USD',
        description: '',
        photos: [],
        location: '',
        village: '',
        landmark: '',
        whatsapp: '',
        phone: '',
        email: '',
        complianceConfirmed: false
      });
      setErrors({});
    }
  };

  const handleSubmitAll = async () => {
    if (products.length === 0) {
      setErrors({ general: 'Add at least one product before submitting' });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create Vendor
      const vendorRef = await addDoc(collection(db, 'vendors'), {
        ...vendorForm,
        hub: hubName,
        createdAt: serverTimestamp()
      });

      // 2. Create Products
      for (const product of products) {
        await addDoc(collection(db, 'marketProducts'), {
          ...product,
          vendorId: vendorRef.id,
          hub: hubName,
          createdAt: serverTimestamp()
        });
      }

      setRegStep('SUCCESS');
    } catch (e) {
      console.error("Submission error:", e);
      setErrors({ general: 'Submission failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const allColorClasses = {
    indigo: {
      bg: 'bg-indigo-600',
      hover: 'hover:bg-indigo-500',
      text: 'text-indigo-400',
      border: 'border-indigo-500/30',
      shadow: 'shadow-indigo-500/20',
      ring: 'focus:ring-indigo-500'
    },
    cyan: {
      bg: 'bg-cyan-600',
      hover: 'hover:bg-cyan-500',
      text: 'text-cyan-400',
      border: 'border-cyan-500/30',
      shadow: 'shadow-cyan-500/20',
      ring: 'focus:ring-cyan-500'
    },
    blue: {
      bg: 'bg-blue-600',
      hover: 'hover:bg-blue-500',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      shadow: 'shadow-blue-500/20',
      ring: 'focus:ring-blue-500'
    },
    emerald: {
      bg: 'bg-emerald-600',
      hover: 'hover:bg-emerald-500',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      shadow: 'shadow-emerald-500/20',
      ring: 'focus:ring-emerald-500'
    }
  };

  const colorClasses = allColorClasses[accentColor as keyof typeof allColorClasses] || allColorClasses.indigo;

  return (
    <motion.div 
      initial={{ scale: 0.9, y: 20, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ scale: 0.9, y: 20, opacity: 0 }}
      className="bg-slate-900 border border-white/10 rounded-[3rem] w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden"
    >
      {/* Modal Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl ${colorClasses.bg} flex items-center justify-center`}>
            <UserPlus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Vendor Registration</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className={`h-1 w-8 rounded-full transition-all ${regStep === 'VENDOR' ? colorClasses.bg : 'bg-white/10'}`} />
              <div className={`h-1 w-8 rounded-full transition-all ${regStep === 'PRODUCTS' ? colorClasses.bg : 'bg-white/10'}`} />
              <div className={`h-1 w-8 rounded-full transition-all ${regStep === 'SUCCESS' ? colorClasses.bg : 'bg-white/10'}`} />
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Modal Content */}
      <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
        {regStep === 'VENDOR' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center mb-8">
              <h4 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Vendor Profile</h4>
              <p className="text-slate-400 text-sm">Tell us about yourself or your business to start selling on {hubName}.</p>
            </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Full Legal Identity" icon={<UserPlus className="w-3 h-3" />} error={errors.fullName} hint="Your official name as shown on national identity.">
                  <input 
                    type="text" 
                    value={vendorForm.fullName}
                    onChange={e => {
                      setVendorForm({...vendorForm, fullName: e.target.value});
                      if (errors.fullName) setErrors({...errors, fullName: ''});
                    }}
                    placeholder="e.g. John Doe"
                    className={`w-full bg-slate-800/50 border rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold ${errors.fullName ? 'border-rose-500' : 'border-white/5'}`}
                  />
                </FormField>
                <FormField label="Business Designation" icon={<Building2 className="w-3 h-3" />} required={false} hint="Registered business name or trade name.">
                  <input 
                    type="text" 
                    value={vendorForm.businessName}
                    onChange={e => setVendorForm({...vendorForm, businessName: e.target.value})}
                    placeholder="e.g. EFADO Global Store"
                    className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold"
                  />
                </FormField>
                <FormField label="Strategic Vendor Type" icon={<Tag className="w-3 h-3" />}>
                  <select 
                    value={vendorForm.vendorType}
                    onChange={e => setVendorForm({...vendorForm, vendorType: e.target.value as any})}
                    className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all appearance-none font-bold cursor-pointer"
                  >
                    <option value="Individual">Individual Merchant</option>
                    <option value="Company">Corporate Entity</option>
                    <option value="Organization">Non-Profit / NGO</option>
                  </select>
                </FormField>
                <FormField label="Secure Communication Email" icon={<Mail className="w-3 h-3" />} error={errors.email} hint="Used for order notifications and security alerts.">
                  <input 
                    type="email" 
                    value={vendorForm.email}
                    onChange={e => {
                      setVendorForm({...vendorForm, email: e.target.value});
                      if (errors.email) setErrors({...errors, email: ''});
                    }}
                    placeholder="vendor@efado.com"
                    className={`w-full bg-slate-800/50 border rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold ${errors.email ? 'border-rose-500' : 'border-white/5'}`}
                  />
                </FormField>
                <FormField label="Verified Liaison Hotline" icon={<Phone className="w-3 h-3" />} error={errors.phone} hint="Direct mobile number for logistics.">
                  <input 
                    type="tel" 
                    value={vendorForm.phone}
                    onChange={e => {
                      setVendorForm({...vendorForm, phone: e.target.value});
                      if (errors.phone) setErrors({...errors, phone: ''});
                    }}
                    placeholder="+234 800 000 0000"
                    className={`w-full bg-slate-800/50 border rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold ${errors.phone ? 'border-rose-500' : 'border-white/5'}`}
                  />
                </FormField>
                <FormField label="WhatsApp Protocol" icon={<Globe className="w-3 h-3" />} hint="For real-time strategic engagement.">
                  <input 
                    type="tel" 
                    value={vendorForm.whatsapp}
                    onChange={e => setVendorForm({...vendorForm, whatsapp: e.target.value})}
                    placeholder="+234 800 000 0000"
                    className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold"
                  />
                </FormField>

                <div className="md:col-span-2 pt-4 border-t border-white/5">
                   <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <MapPin className="w-3 h-3" /> Geographical Deployment Coordinates
                   </h5>
                </div>

                <FormField label="Deployment Country" icon={<Globe className="w-3 h-3" />} error={errors.country}>
                  <input 
                    type="text" 
                    value={vendorForm.country}
                    onChange={e => {
                      setVendorForm({...vendorForm, country: e.target.value});
                      if (errors.country) setErrors({...errors, country: ''});
                    }}
                    placeholder="e.g. Nigeria"
                    className={`w-full bg-slate-800/50 border rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold ${errors.country ? 'border-rose-500' : 'border-white/5'}`}
                  />
                </FormField>
                <FormField label="Operational City Core" icon={<MapPin className="w-3 h-3" />} error={errors.city}>
                  <input 
                    type="text" 
                    value={vendorForm.city}
                    onChange={e => {
                      setVendorForm({...vendorForm, city: e.target.value});
                      if (errors.city) setErrors({...errors, city: ''});
                    }}
                    placeholder="e.g. Lagos Island"
                    className={`w-full bg-slate-800/50 border rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold ${errors.city ? 'border-rose-500' : 'border-white/5'}`}
                  />
                </FormField>
                <FormField label="Village / Locality / Town" icon={<MapPin className="w-3 h-3" />} required={false}>
                  <input 
                    type="text" 
                    value={vendorForm.village}
                    onChange={e => setVendorForm({...vendorForm, village: e.target.value})}
                    placeholder="e.g. Amaigbo Village, Ikorodu"
                    className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold"
                  />
                </FormField>
                <FormField label="Specific Focal Point / Landmark" icon={<Info className="w-3 h-3" />} hint="Near school, port, hospital, or market.">
                  <input 
                    type="text" 
                    value={vendorForm.landmark}
                    onChange={e => setVendorForm({...vendorForm, landmark: e.target.value})}
                    placeholder="e.g. Near Apapa Port / UNILAG Gate"
                    className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold"
                  />
                </FormField>
                <div className="md:col-span-1">
                  <FormField label="Strategic Logistics Address" icon={<Truck className="w-3 h-3" />} hint="Full physical address for pickup/delivery mapping.">
                    <input 
                      type="text" 
                      value={vendorForm.address}
                      onChange={e => setVendorForm({...vendorForm, address: e.target.value})}
                      placeholder="Street, Building, Suite..."
                      className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold"
                    />
                  </FormField>
                </div>
                <div className="md:col-span-1 grid grid-cols-2 gap-4">
                  <FormField label="Village / Community" icon={<Globe className="w-3 h-3" />}>
                    <input 
                      type="text" 
                      value={vendorForm.village}
                      onChange={e => setVendorForm({...vendorForm, village: e.target.value})}
                      placeholder="Enter Village Name"
                      className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold"
                    />
                  </FormField>
                  <FormField label="Focal Point / Landmark" icon={<MapPin className="w-3 h-3" />} hint="e.g. Near Port, School, Market">
                    <input 
                      type="text" 
                      value={vendorForm.landmark}
                      onChange={e => setVendorForm({...vendorForm, landmark: e.target.value})}
                      placeholder="Notable Landmark"
                      className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold"
                    />
                  </FormField>
                </div>
              {vendorForm.country.toLowerCase() === 'nigeria' && vendorForm.vendorType === 'Company' && (
                <FormField label="CAC Identity Node (RC Number)" icon={<ShieldCheck className="w-3 h-3" />} error={errors.registrationNumber} hint="Required for Corporate Verification in Nigeria.">
                  <input 
                    type="text" 
                    value={vendorForm.registrationNumber}
                    onChange={e => {
                      setVendorForm({...vendorForm, registrationNumber: e.target.value});
                      if (errors.registrationNumber) setErrors({...errors, registrationNumber: ''});
                    }}
                    placeholder="RC-123456"
                    className={`w-full bg-slate-800/50 border rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold ${errors.registrationNumber ? 'border-rose-500' : 'border-white/5'}`}
                  />
                </FormField>
              )}
              <FormField label="Tactical Fulfillment Method" icon={<Package className="w-3 h-3" />}>
                <select 
                  value={vendorForm.pickupMethod}
                  onChange={e => setVendorForm({...vendorForm, pickupMethod: e.target.value as any})}
                  className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all appearance-none font-bold cursor-pointer"
                >
                  <option value="Pickup">Merchant Pickup Point Only</option>
                  <option value="Delivery">Hub Delivery Network Only</option>
                  <option value="Both">Hybrid Fulfillment (Both)</option>
                </select>
              </FormField>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-2xl border border-white/5">
              <input 
                type="checkbox" 
                checked={vendorForm.termsAccepted}
                onChange={e => setVendorForm({...vendorForm, termsAccepted: e.target.checked})}
                className={`w-5 h-5 rounded border-white/10 bg-slate-900 ${colorClasses.text} ${colorClasses.ring}`}
              />
              <label className="text-xs font-bold text-slate-400">I acknowledge the account status and accept the vendor terms of service.</label>
            </div>
            {errors.terms && <p className="text-[10px] text-red-400 font-bold px-2">{errors.terms}</p>}

            <button 
              onClick={() => {
                if (validateVendor()) setRegStep('PRODUCTS');
              }}
              className={`w-full py-6 ${colorClasses.bg} ${colorClasses.hover} text-white rounded-3xl font-black uppercase tracking-widest transition-all ${colorClasses.shadow} flex items-center justify-center gap-3`}
            >
              Continue to Product Upload <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {regStep === 'PRODUCTS' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h4 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Product Inventory</h4>
              <p className="text-slate-400 text-sm">Add the items you want to list on {hubName}.</p>
            </div>

            {/* Added Products List */}
            {products.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Added Products ({products.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((p, idx) => (
                    <div key={idx} className="bg-slate-800/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                          <Package className={`w-5 h-5 ${colorClasses.text}`} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white uppercase truncate max-w-[150px]">{p.title}</p>
                          <p className={`text-[10px] font-bold ${colorClasses.text}`}>{p.currency} {p.price}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setProducts(products.filter((_, i) => i !== idx))}
                        className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Product Form */}
            <div className="bg-slate-800/30 border border-white/5 rounded-[2.5rem] p-8 space-y-8">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-10 h-10 rounded-xl ${colorClasses.bg} flex items-center justify-center`}>
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-lg font-black text-white uppercase tracking-tight">Add New Product</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Product Title" error={errors.title} hint="Identify your product clearly (e.g., Brand, Model, Capacity).">
                  <input 
                    type="text" 
                    value={currentProduct.title}
                    onChange={e => {
                      setCurrentProduct({...currentProduct, title: e.target.value});
                      if (errors.title) setErrors({...errors, title: ''});
                    }}
                    placeholder="e.g. iPhone 13 Pro Max - 256GB"
                    className={`w-full bg-slate-900/50 border rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold ${errors.title ? 'border-rose-500' : 'border-white/5'}`}
                  />
                </FormField>

                <FormField label="Tactical Category Path" error={errors.category} hint="Select 4 levels of category depth for optimal search mapping.">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <select 
                      value={currentProduct.categoryPath?.level1}
                      onChange={e => {
                        setCurrentProduct({
                          ...currentProduct, 
                          categoryPath: { level1: e.target.value, level2: '', level3: '', level4: '' }
                        });
                        if (errors.category) setErrors({...errors, category: ''});
                      }}
                      className="bg-slate-900/50 border border-white/5 rounded-xl px-2 py-3 text-[10px] font-black text-white outline-none cursor-pointer"
                    >
                      <option value="">L1</option>
                      {Object.keys(categories).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select 
                      value={currentProduct.categoryPath?.level2}
                      disabled={!currentProduct.categoryPath?.level1}
                      onChange={e => setCurrentProduct({
                        ...currentProduct, 
                        categoryPath: { ...currentProduct.categoryPath!, level2: e.target.value, level3: '', level4: '' }
                      })}
                      className="bg-slate-900/50 border border-white/5 rounded-xl px-2 py-3 text-[10px] font-black text-white outline-none disabled:opacity-30 cursor-pointer"
                    >
                      <option value="">L2</option>
                      {currentProduct.categoryPath?.level1 && Object.keys(categories[currentProduct.categoryPath.level1]).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select 
                      value={currentProduct.categoryPath?.level3}
                      disabled={!currentProduct.categoryPath?.level2}
                      onChange={e => setCurrentProduct({
                        ...currentProduct, 
                        categoryPath: { ...currentProduct.categoryPath!, level3: e.target.value, level4: '' }
                      })}
                      className="bg-slate-900/50 border border-white/5 rounded-xl px-2 py-3 text-[10px] font-black text-white outline-none disabled:opacity-30 cursor-pointer"
                    >
                      <option value="">L3</option>
                      {currentProduct.categoryPath?.level2 && Object.keys(categories[currentProduct.categoryPath.level1!][currentProduct.categoryPath.level2]).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select 
                      value={currentProduct.categoryPath?.level4}
                      disabled={!currentProduct.categoryPath?.level3}
                      onChange={e => setCurrentProduct({
                        ...currentProduct, 
                        categoryPath: { ...currentProduct.categoryPath!, level4: e.target.value }
                      })}
                      className="bg-slate-900/50 border border-white/5 rounded-xl px-2 py-3 text-[10px] font-black text-white outline-none disabled:opacity-30 cursor-pointer"
                    >
                      <option value="">L4</option>
                      {currentProduct.categoryPath?.level3 && categories[currentProduct.categoryPath.level1!][currentProduct.categoryPath.level2!][currentProduct.categoryPath.level3].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </FormField>

                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Listing Deployment Coordinates</h5>
                    <button 
                      onClick={() => setCurrentProduct({
                        ...currentProduct,
                        location: vendorForm.address,
                        village: vendorForm.village,
                        landmark: vendorForm.landmark,
                        phone: vendorForm.phone,
                        whatsapp: vendorForm.whatsapp,
                        email: vendorForm.email
                      })}
                      className={`text-[9px] font-black uppercase tracking-widest ${colorClasses.text} hover:opacity-80 transition-all flex items-center gap-1`}
                    >
                      <ShieldCheck className="w-3 h-3" /> Inherit Vendor Profile Logistics
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <input 
                      type="text" 
                      placeholder="Town / City"
                      value={currentProduct.location}
                      onChange={e => setCurrentProduct({...currentProduct, location: e.target.value})}
                      className="bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none"
                    />
                    <input 
                      type="text" 
                      placeholder="Village / Community"
                      value={currentProduct.village}
                      onChange={e => setCurrentProduct({...currentProduct, village: e.target.value})}
                      className="bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none"
                    />
                    <input 
                      type="text" 
                      placeholder="Nearby Landmark / Focal Point (Port, School, etc)"
                      value={currentProduct.landmark}
                      onChange={e => setCurrentProduct({...currentProduct, landmark: e.target.value})}
                      className="bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none lg:col-span-1 md:col-span-1"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-1">Liaison Phone</label>
                    <input 
                      type="tel" 
                      placeholder="+234..."
                      value={currentProduct.phone}
                      onChange={e => setCurrentProduct({...currentProduct, phone: e.target.value})}
                      className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-1">WhatsApp Liaison</label>
                    <input 
                      type="tel" 
                      placeholder="+234..."
                      value={currentProduct.whatsapp}
                      onChange={e => setCurrentProduct({...currentProduct, whatsapp: e.target.value})}
                      className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-1">Liaison Email</label>
                    <input 
                      type="email" 
                      placeholder="contact@efado..."
                      value={currentProduct.email}
                      onChange={e => setCurrentProduct({...currentProduct, email: e.target.value})}
                      className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none"
                    />
                  </div>
                </div>

                <FormField label="Item Condition Integrity" hint="Honest assessment of the product state.">
                  <select 
                    value={currentProduct.condition}
                    onChange={e => setCurrentProduct({...currentProduct, condition: e.target.value as any})}
                    className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all appearance-none font-bold cursor-pointer"
                  >
                    <option value="New">Factory Sealed / Brand New</option>
                    <option value="Like New">Like New (Open Box)</option>
                    <option value="Good">Gently Used (Grade A)</option>
                    <option value="Fair">Noticeable Use (Grade B)</option>
                    <option value="Used">Heavily Used (Grade C)</option>
                  </select>
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label={`Monetary Value (${currentProduct.currency})`} error={errors.price} hint="Market value mapping.">
                    <input 
                      type="number" 
                      value={currentProduct.price}
                      onChange={e => {
                        setCurrentProduct({...currentProduct, price: Number(e.target.value)});
                        if (errors.price) setErrors({...errors, price: ''});
                      }}
                      className={`w-full bg-slate-900/50 border rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold ${errors.price ? 'border-rose-500' : 'border-white/5'}`}
                    />
                  </FormField>
                  <FormField label="Trade Currency">
                    <select 
                      value={currentProduct.currency}
                      onChange={e => setCurrentProduct({...currentProduct, currency: e.target.value})}
                      className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold cursor-pointer"
                    >
                      <option value={selectedCurrency.code}>{selectedCurrency.name} ({selectedCurrency.symbol})</option>
                      <option value="NGN">Nigerian Naira (₦)</option>
                      <option value="GBP">British Pound (£)</option>
                      <option value="EUR">Euro (€)</option>
                    </select>
                  </FormField>
                </div>

                <div className="md:col-span-2">
                  <FormField label="Ecological & Functional Briefing" hint="Detailed description for buyer transparency.">
                    <textarea 
                      value={currentProduct.description}
                      onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})}
                      placeholder="Describe your product's condition, features, and any flaws..."
                      rows={4}
                      className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all resize-none font-bold placeholder:italic placeholder:font-normal"
                    />
                  </FormField>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-2xl border border-white/5 md:col-span-2">
                  <input 
                    type="checkbox" 
                    id="compliance"
                    checked={currentProduct.complianceConfirmed}
                    onChange={e => {
                      setCurrentProduct({...currentProduct, complianceConfirmed: e.target.checked});
                      if (errors.compliance) setErrors({...errors, compliance: ''});
                    }}
                    className={`w-5 h-5 rounded border-white/10 bg-slate-900 cursor-pointer ${colorClasses.text} ${colorClasses.ring}`}
                  />
                  <label htmlFor="compliance" className="text-xs font-bold text-slate-400 cursor-pointer">I verify this product meets the EFADO High-Integrity Marketplace Standards.</label>
                </div>
                {errors.compliance && <p className="text-[10px] text-red-400 font-bold px-2 md:col-span-2">{errors.compliance}</p>}

                <button 
                  onClick={handleAddProduct}
                  className={`w-full py-4 border-2 border-dashed ${colorClasses.border} rounded-2xl text-xs font-black ${colorClasses.text} uppercase tracking-widest hover:bg-white/5 transition-all flex items-center justify-center gap-2 md:col-span-2`}
                >
                  <Plus className="w-4 h-4" /> Secure & Add Product to Intelligence List
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-8">
              <button 
                onClick={() => setRegStep('VENDOR')}
                className="px-8 py-6 bg-slate-800 hover:bg-slate-700 text-white rounded-3xl font-black uppercase tracking-widest transition-all flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" /> Back
              </button>
              <button 
                onClick={handleSubmitAll}
                disabled={isSubmitting || products.length === 0}
                className={`flex-grow py-6 ${colorClasses.bg} ${colorClasses.hover} text-white rounded-3xl font-black uppercase tracking-widest transition-all ${colorClasses.shadow} flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSubmitting ? 'Submitting...' : 'Complete Registration & Upload'} <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>
            {errors.general && <p className="text-center text-red-400 font-bold text-xs">{errors.general}</p>}
          </div>
        )}

        {regStep === 'SUCCESS' && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
            <h4 className="text-3xl font-black text-white uppercase tracking-tight">Registration Successful!</h4>
            <p className="text-slate-400 font-medium">
              Welcome to the {hubName} community. Your vendor profile has been created and your products are now pending review.
            </p>
            <div className="bg-slate-800/50 p-6 rounded-3xl border border-white/5 w-full">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-black text-white uppercase tracking-widest">Next Steps</span>
              </div>
              <ul className="text-left space-y-3">
                {[
                  "Check your email for verification",
                  "Access your vendor dashboard",
                  "Set up your payment details",
                  "Start receiving orders!"
                ].map((step, i) => (
                  <li key={i} className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
            <button 
              onClick={onClose}
              className={`w-full py-6 ${colorClasses.bg} ${colorClasses.hover} text-white rounded-3xl font-black uppercase tracking-widest transition-all ${colorClasses.shadow}`}
            >
              Return to Market
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
