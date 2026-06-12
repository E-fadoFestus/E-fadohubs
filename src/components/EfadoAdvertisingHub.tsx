import React, { useState, useEffect, useRef } from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'motion/react';
import { 
  Megaphone, 
  ShoppingBag, 
  Hotel, 
  Sprout, 
  Map, 
  Home, 
  Utensils, 
  Car, 
  Store,
  Mic2,
  Hammer,
  ChevronRight, 
  ChevronLeft,
  X,
  Upload,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Plus,
  Landmark,
  Plane,
  Laptop,
  Gavel,
  Calendar,
  Heart,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Package,
  Truck,
  Phone,
  Mail,
  MessageCircle,
  Info,
  MapPin,
  Shield,
  ShieldCheck,
  LayoutGrid,
  Globe
} from 'lucide-react';
import { UserProfile, AdListing, AdPlan } from '../types';
import { db, collection, addDoc, serverTimestamp, query, where, onSnapshot, doc, updateDoc } from '../firebase';
import { useCurrency } from '../lib/CurrencyContext';
import { CurrencySelector } from './CurrencySelector';
import { PaymentPlatform } from './PaymentPlatform';
import { EfadoPromoKit } from './EfadoPromoKit';

interface EfadoAdvertisingHubProps {
  user: UserProfile;
  onClose: () => void;
  onNavigate?: (hub: any, subview?: any) => void;
  initialType?: 'ADVERT' | 'SELL';
}

const AD_CATEGORIES = [
  { id: 'HOTEL', label: 'Hotel Advertising', icon: Hotel, description: 'Luxury stays, resort rooms, motels, eateries, and guest houses.' },
  { id: 'FARM', label: 'Farmers & Agri-Hub', icon: Sprout, description: 'Crops, livestock, poultry, fishery, and raw produce from rural & urban farms.' },
  { id: 'TALENT', label: 'Voice & Talents', icon: Mic2, description: 'Musicians, voice artists, actors, and creative talents globally.' },
  { id: 'ARTISAN', label: 'Artisans & Handcraft', icon: Hammer, description: 'Weavers, potters, blacksmiths, tailors, and local craftsmen.' },
  { id: 'CHURCH', label: 'Church & Programs', icon: Landmark, description: 'Religious events, church programs, crusades, and anniversaries.' },
  { id: 'EVENTS', label: 'Events & Functions', icon: Calendar, description: 'Weddings, birthdays, burials, parties, and anniversaries.' },
  { id: 'PROPERTIES', label: 'Landed Properties', icon: Map, description: 'Land, houses, apartments, and commercial properties.' },
  { id: 'RENTALS', label: 'Logistics & Rentals', icon: Truck, description: 'Trucks, trailers, vehicles, tractors, bikes, and machinery.' },
  { id: 'BUSINESS', label: 'Retail & Business', icon: Store, description: 'Supermarkets, eateris, buka, retailers, and warehouses.' },
  { id: 'MORTGAGE', label: 'Mortgage & Housing', icon: Home, description: 'House mortgaging, room renting, and property leasing.' },
  { id: 'EDUCATION', label: 'Educational Services', icon: BookOpen, description: 'Schools, coaching centers, online courses, and book shops.' },
  { id: 'TECHNICAL', label: 'Technical & Engineering', icon: Zap, description: 'Electricians, plumbers, tech repairs, and engineering services.' },
  { id: 'TRANSPORT', label: 'Transportation Hub', icon: Car, description: 'Inter-state travel, local taxis, car hire, and flight bookings.' },
  { id: 'AUCTION', label: 'Auction & Gavel', icon: Gavel, description: 'Live auctions, bidding wars, and rapid asset liquidation.' },
  { id: 'MEDICAL', label: 'Medical & Health', icon: Heart, description: 'Hospitals, clinics, pharmacies, and health consultancy.' },
  { id: 'FASHION', label: 'Fashion & Style', icon: ShoppingBag, description: 'Clothing, accessories, fashion designers, and boutiques.' },
  { id: 'LEGAL', label: 'Legal & Judiciary', icon: Shield, description: 'Lawyers, legal advice, notary public, and chambers.' },
  { id: 'SECURITY', label: 'Security Protocols', icon: ShieldCheck, description: 'Private security, alarms, surveillance, and guard services.' },
  { id: 'CONSULTANCY', label: 'Consultancy Hub', icon: Info, description: 'Professional advice, business strategy, and experts.' },
  { id: 'OTHER', label: 'Other Specializations', icon: Globe, description: 'Type your area of specialization directly into the form.' },
];

const AD_PLANS: AdPlan[] = [
  { id: 'Free', name: 'Free Protocol', price: 0, durationDays: 3, features: ['3 Day Visibility', 'Basic Listing'] },
  { id: 'Weekly', name: 'Tactical Week', price: 2000, durationDays: 7, features: ['7 Day Visibility', 'Standard Ranking'] },
  { id: 'Monthly', name: 'Strategic Month', price: 7500, durationDays: 30, features: ['30 Day Visibility', 'Priority Listing'] },
  { id: 'Quarterly', name: 'Elite 3-Month', price: 20000, durationDays: 90, features: ['90 Day Visibility', 'Enhanced Exposure'] },
  { id: 'BiAnnual', name: 'Sovereign 6-Month', price: 35000, durationDays: 180, features: ['180 Day Visibility', 'Maximum Reach'] },
  { id: 'Yearly', name: 'Universal Year', price: 60000, durationDays: 365, features: ['365 Day Visibility', 'Infinite Re-listing'] },
  { id: 'Express', name: 'Express Viral', price: 5000, durationDays: 3, features: ['Instant Propagation', 'Top of Category Search'] },
];

// ... (AD_CATEGORIES and AD_PLANS stay same)

const CATEGORY_FIELDS: Record<string, { label: string; type: string; placeholder: string; key: string; optional?: boolean; options?: string[] }[]> = {
  HOTEL: [
    { label: 'Room Category', type: 'text', placeholder: 'Single, Suite, Studio, Penthouse', key: 'roomCategory' },
    { label: 'Hotel Facilities', type: 'text', placeholder: 'WiFi, Pool, Restaurant, Spa', key: 'facilities', optional: true },
    { label: 'Check-in Time', type: 'text', placeholder: 'Standard check-in time (e.g. 2:00 PM)', key: 'checkIn', optional: true }
  ],
  FARM: [
    { label: 'Farming Vertical', type: 'text', placeholder: 'Crop Farming, Poultry, Fishery, Cattle, Snailery, Bee Keeping', key: 'farmingType' },
    { label: 'Specific Product/Produce', type: 'text', placeholder: 'Maize, Eggs, Catfish, Cow, Honey, Cocoa, etc.', key: 'product' },
    { label: 'Bulk Quantity Available', type: 'text', placeholder: 'e.g. 50 Bags, 100 Birds, 5 Tons', key: 'quantity' },
    { label: 'Harvest Date / Age', type: 'text', placeholder: 'When was it harvested? Or age of livestock', key: 'age', optional: true },
    { label: 'Farm Location Type', type: 'select', placeholder: 'Rural Farm, Urban Farm, Greenhouse', key: 'locType', options: ['Rural Farm', 'Urban Farm', 'Home Based', 'Greenhouse'], optional: true },
    { label: 'Certifications', type: 'text', placeholder: 'Organic, NAFDAC, Local Market Board (If any)', key: 'certs', optional: true },
    { label: 'Logistics Options', type: 'text', placeholder: 'Pickup only, Delivery available, Group shipping?', key: 'logistics', optional: true }
  ],
  TALENT: [
    { label: 'Talent Category', type: 'text', placeholder: 'Vocalist, Instrumentalist, Voice-over, Actor', key: 'talentType' },
    { label: 'Experience Level', type: 'text', placeholder: 'Beginner, Intermediate, Pro', key: 'level', optional: true },
    { label: 'YouTube/Portfolio Link', type: 'text', placeholder: 'Link to your work (Optional)', key: 'link', optional: true }
  ],
  ARTISAN: [
    { label: 'Craft Type', type: 'text', placeholder: 'Tailoring, Carpentry, Blacksmithing, etc.', key: 'craftType' },
    { label: 'Material Source', type: 'text', placeholder: 'Local materials, Imported, etc.', key: 'source', optional: true },
    { label: 'Production Time', type: 'text', placeholder: 'How long to complete an order', key: 'leadTime', optional: true }
  ],
  CHURCH: [
    { label: 'Program Name', type: 'text', placeholder: 'Annual Convention, Crusade, Service', key: 'programName' },
    { label: 'Ministers Involved', type: 'text', placeholder: 'Host and Guest Speakers', key: 'ministers', optional: true },
    { label: 'Program Theme', type: 'text', placeholder: 'The main theme of the event', key: 'theme', optional: true }
  ],
  EVENTS: [
    { label: 'Function Type', type: 'text', placeholder: 'Wedding, Birthday, Burial, Reunion', key: 'functionType' },
    { label: 'Guest Capacity', type: 'text', placeholder: 'Number of expected attendees', key: 'capacity', optional: true },
    { label: 'Special Requirements', type: 'text', placeholder: 'Food, Music, Hall type', key: 'needs', optional: true }
  ],
  PROPERTIES: [
    { label: 'Property Class', type: 'text', placeholder: 'Residential, Commercial, Industrial', key: 'propClass' },
    { label: 'Title Documents', type: 'text', placeholder: 'C of O, Survey, Deed (If available)', key: 'titleDocs', optional: true },
    { label: 'Land Size', type: 'text', placeholder: 'Square meters or Acres', key: 'size' }
  ],
  RENTALS: [
    { label: 'Vehicle/Machinery Type', type: 'text', placeholder: 'Trucks, Trailers, Tractors, Wheelbarrows', key: 'assetType' },
    { label: 'Rental Duration', type: 'text', placeholder: 'Daily, Hourly, Per Trip', key: 'duration' },
    { label: 'Inclusions', type: 'text', placeholder: 'Driver, Fuel, Maintenance included?', key: 'inc', optional: true }
  ],
  BUSINESS: [
    { label: 'Business Vertical', type: 'text', placeholder: 'Eatery, Computer Store, Phone Shop', key: 'vertical' },
    { label: 'Stock Description', type: 'text', placeholder: 'Retail individual items or bulk warehouse', key: 'stockDesc', optional: true },
    { label: 'RC Number / Reg', type: 'text', placeholder: 'CAC Registration (Optional)', key: 'rcNumber', optional: true }
  ],
  MORTGAGE: [
    { label: 'Plan Type', type: 'text', placeholder: 'Mortgage, Renting, Short-let', key: 'planType' },
    { label: 'Financial Terms', type: 'text', placeholder: 'Upfront, Installments, Monthly', key: 'terms', optional: true },
    { label: 'Down Payment', type: 'text', placeholder: 'Minimum required deposit', key: 'deposit', optional: true }
  ],
  EDUCATION: [
    { label: 'Service Category', type: 'text', placeholder: 'Pre-school, University, Skills training', key: 'serviceCat' },
    { label: 'Curriculum', type: 'text', placeholder: 'British, American, Nigerian, Hybrid', key: 'curriculum', optional: true },
    { label: 'Govt Approval No', type: 'text', placeholder: 'Registration No (Optional)', key: 'govNo', optional: true }
  ],
  TECHNICAL: [
    { label: 'Specialty Area', type: 'text', placeholder: 'Solar, Plumbing, Software, Mechanical', key: 'specialty' },
    { label: 'Certifications', type: 'text', placeholder: 'Trade test, BSc, COREN (Optional)', key: 'certs', optional: true }
  ],
  TRANSPORT: [
    { label: 'Transport Route', type: 'text', placeholder: 'Lagos to Abuja, Local courier, etc.', key: 'route' },
    { label: 'Fleet Type', type: 'text', placeholder: 'Minibus, Luxury bus, Bike, Air', key: 'fleet' },
    { label: 'License Class', type: 'text', placeholder: 'Professional, Commercial, etc.', key: 'license', optional: true }
  ],
  AUCTION: [
    { label: 'Auction Type', type: 'text', placeholder: 'Public, Timed, Sealed bid', key: 'auctionType' },
    { label: 'Official Gavel Date', type: 'date', placeholder: 'The scheduled day of auction', key: 'auctionDate' }
  ],
  MEDICAL: [
    { label: 'Facility Type', type: 'text', placeholder: 'General Hospital, Clinic, Pharmacy, Labs', key: 'facilityType' },
    { label: 'Specializations', type: 'text', placeholder: 'Cardiology, Surgery, Pediatrics, etc.', key: 'specialties', optional: true },
    { label: 'Operating Hours', type: 'text', placeholder: 'e.g. 24/7 or 8am - 5pm', key: 'hours', optional: true }
  ],
  FASHION: [
    { label: 'Brand Name', type: 'text', placeholder: 'Your fashion house name', key: 'brandName' },
    { label: 'Category', type: 'text', placeholder: 'Menswear, Womenswear, Kids, Accessories', key: 'fashionCat' },
    { label: 'Custom Orders', type: 'text', placeholder: 'Do you take bespoke/custom orders?', key: 'bespoke', optional: true }
  ],
  LEGAL: [
    { label: 'Practice Area', type: 'text', placeholder: 'Criminal, Civil, Corporate, Property Law', key: 'practiceArea' },
    { label: 'Years of Bar', type: 'text', placeholder: 'e.g. 10 years experience', key: 'exp', optional: true },
    { label: 'Consultation Fee', type: 'text', placeholder: 'Initial consultation charge (Optional)', key: 'refFee', optional: true }
  ],
  SECURITY: [
    { label: 'Service Scope', type: 'text', placeholder: 'Personnel, Electronic, Rapid Response', key: 'scope' },
    { label: 'Certification', type: 'text', placeholder: 'Licensed security agent, etc.', key: 'cert', optional: true }
  ],
  CONSULTANCY: [
    { label: 'Expertise', type: 'text', placeholder: 'IT, Finance, Strategy, Human Resources', key: 'expertise' },
    { label: 'Consultation Format', type: 'text', placeholder: 'Online, Physical, Hybrid', key: 'format', optional: true }
  ],
  OTHER: [
    { label: 'Your Specific Specialization', type: 'text', placeholder: 'Type your area of specialization here', key: 'otherType' },
    { label: 'Overview of Offering', type: 'text', placeholder: 'Describe your unique reach or product', key: 'overview' },
    { label: 'Relevant Details', type: 'text', placeholder: 'Any other information you want to add', key: 'details', optional: true }
  ]
};

export const EfadoAdvertisingHub: React.FC<EfadoAdvertisingHubProps> = ({ user, onClose, onNavigate, initialType }) => {
  const { formatPrice } = useCurrency();
  const [view, setView] = useState<'BROWSE' | 'REGISTER' | 'PROMO'>('REGISTER');
  const [adType, setAdType] = useState<'ADVERT' | 'SELL'>(initialType || 'ADVERT');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [registerStep, setRegisterStep] = useState<'CATEGORY' | 'DETAILS' | 'PREVIEW' | 'PLAN'>('CATEGORY');
  const [listings, setListings] = useState<AdListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<AdPlan | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Photo uploading refs and handlers
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Engagement modal / terminal states
  const [selectedAdForEngagement, setSelectedAdForEngagement] = useState<AdListing | null>(null);
  const [engagementMessage, setEngagementMessage] = useState('');
  const [engagementSending, setEngagementSending] = useState(false);
  const [engagementSuccess, setEngagementSuccess] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const base64Data = reader.result;
          setFormData(prev => ({
            ...prev,
            photos: [...prev.photos, base64Data]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const SELLER_BENEFITS = [
    { title: "Global Neural Reach", desc: "Instantly propagate your assets to millions of active nodes in 190+ jurisdictions.", icon: Globe },
    { title: "Escrow Secured", desc: "All transactions are shielded by EFADO's tactical escrow protocols for total peace of mind.", icon: Shield },
    { title: "Unified Inventory", desc: "List once, appear everywhere. Gist Hub, Market Hubs, and search results synchronously.", icon: LayoutGrid },
    { title: "Instant Liquidity", desc: "Convert assets to capital rapidly with our high-velocity patronage matching engine.", icon: TrendingUp }
  ];

  const MARKETPLACE_HUBS = [
    { id: 'MODERN_MARKET', name: 'Tactical Modern Market', desc: 'Premium retail & high-end consumer goods.', icon: ShoppingBag, hub: 'MARKET' },
    { id: 'FAIRLY_USED', name: 'Sovereign Used Market', desc: 'Pre-owned assets with vetted history.', icon: Package, hub: 'FAIRLY_USED' },
    { id: 'AGRI_HUB', name: 'Agri-Sovereign Hub', desc: 'Direct connection to rural & urban farm produce.', icon: Sprout, hub: 'AGRI_HUB' },
    { id: 'TALENT_HUB', name: 'Voice & Talent Hub', icon: Mic2, desc: 'Global stage for reachable creative voices.', hub: 'TALENT_HUB' },
    { id: 'DOMAIN_HUB', name: 'Digital Domain Hub', desc: 'Virtual real-estate & digital assets.', icon: Globe, hub: 'DOMAIN_HUB' }
  ];

  // Handle type switching within the component
  const handleTypeSwitch = (type: 'ADVERT' | 'SELL') => {
    setAdType(type);
    setFormData({
      ...formData,
      category: '',
      details: {}
    });
    setSelectedCategory(null);
    setRegisterStep('CATEGORY');
    setView('REGISTER');
  };

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    state: '',
    city: '',
    village: '',
    address: '',
    landmark: '',
    phone: '',
    whatsapp: '',
    email: '',
    category: '',
    details: {} as any,
    photos: [] as string[]
  });

  useEffect(() => {
    const q = query(collection(db, 'ad_listings'), where('status', '==', 'active'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AdListing));
      setListings(docs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateAd = async () => {
    if (!selectedPlan) return;
    
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + selectedPlan.durationDays);

      await addDoc(collection(db, 'ad_listings'), {
        vendorId: user.uid,
        type: adType,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        location: {
          state: formData.state,
          city: formData.city,
          village: formData.village,
          address: formData.address,
          landmark: formData.landmark
        },
        contact: {
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          email: formData.email
        },
        details: formData.details,
        photos: formData.photos,
        plan: selectedPlan.id,
        expiryDate: expiryDate.getTime(),
        status: adType === 'ADVERT' ? 'active' : 'pending',
        createdAt: serverTimestamp()
      });
      
      setView('BROWSE');
      // Reset form
    } catch (err) {
      console.error("Error creating ad:", err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-white overflow-y-auto custom-scrollbar"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${adType === 'ADVERT' ? 'bg-indigo-600' : 'bg-rose-600'} text-white shadow-lg shadow-indigo-200`}>
              {adType === 'ADVERT' ? <Megaphone className="w-6 h-6" /> : <ShoppingBag className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic">
                {adType === 'ADVERT' ? 'Advert at EFADO' : 'Sell it at EFADO'}
              </h2>
              <p className="text-[10px] font-black text-gray-950 uppercase tracking-[0.2em]">Sovereign Connection Engine</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setView(view === 'PROMO' ? 'BROWSE' : 'PROMO')}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:scale-105 duration-300 ${view === 'PROMO' ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-lg shadow-amber-500/20 animate-pulse' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'}`}
            >
              🚀 Global Promo Kit
            </button>
            <button 
              onClick={() => {
                setView('REGISTER');
                setRegisterStep('CATEGORY');
              }}
              className={`hidden md:flex items-center gap-2 px-6 py-2 ${adType === 'ADVERT' ? 'bg-indigo-600' : 'bg-rose-600'} text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-indigo-100`}
            >
              <Plus className="w-4 h-4" /> Register {adType === 'ADVERT' ? 'Ad' : 'Listing'}
            </button>
            <div className="flex bg-gray-200 p-1 rounded-xl">
               <button 
                onClick={() => {
                  setView('BROWSE');
                  handleTypeSwitch('ADVERT');
                }}
                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${view === 'BROWSE' && adType === 'ADVERT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-950 hover:text-black'}`}
              >
                Advertise
              </button>
              <button 
                onClick={() => {
                  setView('BROWSE');
                  handleTypeSwitch('SELL');
                }}
                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${view === 'BROWSE' && adType === 'SELL' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-950 hover:text-black'}`}
              >
                Sell Now
              </button>
            </div>
            <div className="flex items-center gap-2">
              <CurrencySelector />
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-950" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {view === 'BROWSE' ? (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="relative rounded-[2rem] md:rounded-[4rem] bg-gray-950 p-8 md:p-16 overflow-hidden min-h-[450px] flex flex-col justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-transparent to-rose-500/10" />
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -mr-64 -mt-64" />
              
                <div className="relative z-10 max-w-4xl mx-auto">
                   <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className={`inline-block px-4 py-2 ${adType === 'SELL' ? 'bg-rose-600' : 'bg-indigo-600'} text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8 shadow-lg`}
                   >
                     {adType === 'SELL' ? 'Universal Marketplace Protocol' : 'Global Reach Protocol'}
                   </motion.div>
                   <h1 className="text-4xl md:text-8xl font-black text-white uppercase tracking-tighter italic leading-none mb-8">
                      {adType === 'SELL' ? (
                        <>Monetize Your <span className="text-transparent bg-clip-text bg-linear-to-r from-rose-400 to-amber-400">Inventory</span> Globally.</>
                      ) : (
                        <>Targeted <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 to-indigo-400">Visibility</span> For Missions.</>
                      )}
                   </h1>
                   <p className="text-gray-300 text-sm md:text-xl font-bold mb-12 leading-relaxed max-w-2xl">
                     {adType === 'SELL' 
                       ? "The world's first decentralized tactical marketplace. Connect your products to high-intent global buyers with sovereign security and instant payout settlement."
                       : "Connect your programs, services, and events to millions of active nodes across the EFADO ecosystem. Precision impact, hyper-growth propagation."}
                   </p>

                   {adType === 'SELL' && (
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                        {SELLER_BENEFITS.map((benefit, i) => (
                          <div key={i} className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] group hover:bg-white/10 transition-all">
                             <benefit.icon className="w-8 h-8 text-rose-500 mb-4 group-hover:scale-110 transition-transform" />
                             <h4 className="text-[12px] font-black text-white uppercase tracking-tight mb-2">{benefit.title}</h4>
                             <p className="text-[10px] text-gray-300 font-black leading-relaxed">{benefit.desc}</p>
                          </div>
                        ))}
                     </div>
                   )}

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <button 
                        onClick={() => { 
                          setAdType('ADVERT'); 
                          setFormData({ ...formData, category: '' });
                          setSelectedCategory(null);
                          setRegisterStep('CATEGORY');
                          setView('REGISTER'); 
                        }}
                        className={`px-10 py-7 rounded-[2.5rem] font-black uppercase tracking-widest text-[14px] shadow-2xl hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-4 group ${adType === 'ADVERT' ? 'bg-indigo-600 text-white shadow-indigo-600/20' : 'bg-white/20 text-white backdrop-blur-xl border border-white/20'}`}
                      >
                        <Megaphone className="w-7 h-7 group-hover:rotate-12 transition-transform" /> 
                        <div className="text-left">
                          <span className="block text-[9px] text-indigo-200">Boost Impact</span>
                          Advertise @ EFADO
                        </div>
                      </button>
                      <button 
                        onClick={() => { 
                          setAdType('SELL'); 
                          setFormData({ ...formData, category: '' });
                          setSelectedCategory(null);
                          setRegisterStep('CATEGORY');
                          setView('REGISTER'); 
                        }}
                        className={`px-10 py-7 rounded-[2.5rem] font-black uppercase tracking-widest text-[14px] shadow-2xl hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-4 group ${adType === 'SELL' ? 'bg-rose-600 text-white shadow-rose-600/20' : 'bg-white/20 text-white backdrop-blur-xl border border-white/20'}`}
                      >
                        <ShoppingBag className="w-7 h-7 group-hover:rotate-12 transition-transform" /> 
                        <div className="text-left">
                          <span className="block text-[9px] text-rose-200">Monetize Now</span>
                          Sell @ EFADO
                        </div>
                      </button>
                   </div>
                </div>
            </div>

            {/* Categories Carousel/Grid */}
            <section className="space-y-8">
               <div className="flex items-center justify-between px-4">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-black uppercase tracking-tighter italic">Strategic Domains</h3>
                    <p className="text-[10px] font-black text-gray-950 uppercase tracking-widest">Select an area to register your advertisement</p>
                  </div>
                  <div className="flex gap-2">
                     <button className="p-3 border border-gray-100 rounded-2xl hover:bg-gray-50 text-gray-900 hover:text-black"><Filter className="w-5 h-5" /></button>
                     <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-900" />
                        <input 
                          type="text" 
                          placeholder="Search Adverts..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-12 pr-6 py-3 bg-gray-50 border-none rounded-2xl w-64 focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all text-sm font-black text-gray-950 placeholder:text-gray-400"
                        />
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                 {AD_CATEGORIES.map((cat) => (
                   <motion.button
                     key={cat.id}
                     whileHover={{ y: -5 }}
                     onClick={() => {
                        setSelectedCategory(cat.id);
                        setFormData({ ...formData, category: cat.id });
                        setRegisterStep('DETAILS');
                        setView('REGISTER');
                     }}
                     className={`p-6 rounded-[2.5rem] border transition-all text-left group bg-white border-gray-100 hover:border-indigo-600 hover:shadow-xl`}
                   >
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all bg-gray-100 group-hover:bg-indigo-600 text-gray-950 group-hover:text-white shadow-sm ring-1 ring-gray-100`}>
                        <cat.icon className="w-6 h-6" />
                     </div>
                     <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 text-indigo-700`}>DOMAIN</span>
                     <span className="text-[12px] font-black uppercase tracking-tight leading-tight text-gray-950">{cat.label}</span>
                   </motion.button>
                 ))}
               </div>
            </section>

            {/* Hub Guide - Comprehensive instructions */}
            <section className="p-8 md:p-12 bg-indigo-50 border border-indigo-100 rounded-[2rem] md:rounded-[4rem] grid grid-cols-1 md:grid-cols-3 gap-12">
               <div className="space-y-6">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h4 className="text-xl font-black text-gray-950 uppercase tracking-tighter italic">Advertising Hub Manual</h4>
                  <p className="text-sm font-black text-gray-900 leading-relaxed uppercase tracking-tighter">Everything you need to know about boosting your strategic visibility on EFADO.</p>
               </div>
               
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {[
                    { t: "1. Defined Goals", d: "Use 'ADVERT' for visibility like Hotels or Church Programs. Use 'SELL' for liquidating Farm harvest or Vehicles." },
                    { t: "2. Strategic Specs", d: "Fill high-fidelity data. Number of rooms, land title type, or harvest yield helps patrons decide fast." },
                    { t: "3. Exposure Plans", d: "From 3-Day Free Trial to Yearly VIP. Choice of plan determines your rank in the network neural grid." },
                    { t: "4. Global Sync", d: "Your ad isn't just a post; it's synced across Gist Feed, Hub sidebars, and universal search results." }
                  ].map((step, i) => (
                    <div key={i} className="space-y-2">
                       <p className="text-[10px] font-black text-indigo-700 uppercase tracking-[0.2em]">{step.t}</p>
                       <p className="text-[11px] font-black text-gray-900 leading-relaxed uppercase tracking-tight italic">{step.d}</p>
                    </div>
                  ))}
               </div>
            </section>

            {/* Marketplace Connect Section */}
            <section className="space-y-8 pt-12 border-t border-gray-100">
               <div className="text-center space-y-4 max-w-2xl mx-auto mb-12">
                  <h3 className="text-3xl font-black text-gray-950 uppercase tracking-tighter italic">Strategic Convergence</h3>
                  <p className="text-[11px] font-black text-gray-950 uppercase tracking-widest leading-relaxed">
                    Once your assets are registered, they are instantly propagated to our high-velocity marketplace hubs. Explore where your products will live.
                  </p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {MARKETPLACE_HUBS.map((hub) => (
                   <div key={hub.id} className="p-8 bg-gray-50 rounded-[3rem] border border-gray-100 hover:border-indigo-600 transition-all hover:bg-white group cursor-pointer">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-md ring-1 ring-gray-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <hub.icon className="w-7 h-7" />
                      </div>
                      <h4 className="text-lg font-black text-gray-950 uppercase tracking-tight mb-2">{hub.name}</h4>
                      <p className="text-[10px] text-gray-950 font-black uppercase tracking-widest mb-6">{hub.desc}</p>
                      <button 
                        onClick={() => {
                          if (onNavigate) {
                            onNavigate(hub.hub);
                            onClose();
                          }
                        }}
                        className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] group-hover:gap-4 transition-all"
                      >
                        Enter Hub <ArrowRight className="w-4 h-4" />
                      </button>
                   </div>
                 ))}
               </div>
            </section>

            {/* Ad Grid Section Header */}
            <div className="flex items-center justify-between px-4 pt-12 border-t border-gray-100">
               <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic">Live Strategic Intel</h3>
               <div className="flex items-center gap-4 text-[10px] font-black text-gray-950 uppercase tracking-widest">
                  <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.3)]" /> Global Live Feed</span>
               </div>
            </div>

            {/* Ad Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {loading ? (
                 [1,2,3].map(i => <div key={i} className="h-80 bg-gray-100 rounded-[3rem] animate-pulse" />)
               ) : listings.filter(l => !selectedCategory || l.category === selectedCategory).length > 0 ? (
                 listings.filter(l => !selectedCategory || l.category === selectedCategory).map((ad) => (
                   <motion.div 
                    layout
                    key={ad.id}
                    className="bg-white border border-gray-100 rounded-[3.5rem] overflow-hidden group hover:shadow-2xl hover:shadow-gray-200 transition-all duration-500"
                   >
                     <div className="aspect-video relative overflow-hidden group-hover:brightness-90 transition-all duration-700">
                        <img 
                          src={ad.photos[0] || `https://picsum.photos/seed/${ad.id}/600/400`} 
                          alt={ad.title} 
                          className="w-full h-full object-cover rounded-t-[3.5rem]" 
                        />
                        <div className="absolute top-6 left-6 flex gap-2">
                           <span className="px-3 py-1 bg-white/90 backdrop-blur text-[9px] font-black uppercase tracking-widest rounded-full">{ad.category}</span>
                           <span className={`px-3 py-1 text-white text-[9px] font-black uppercase tracking-widest rounded-full ${ad.type === 'ADVERT' ? 'bg-indigo-600' : 'bg-rose-600'}`}>
                             {ad.type}
                           </span>
                        </div>
                        <button className="absolute bottom-6 right-6 p-4 bg-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 duration-500">
                           <Heart className="w-5 h-5 text-rose-500" />
                        </button>
                     </div>
                     <div className="p-10">
                        <h4 className="text-xl font-black text-gray-950 uppercase tracking-tighter italic mb-4">{ad.title}</h4>
                        <p className="text-gray-900 text-sm font-black line-clamp-2 mb-6">{ad.description}</p>
                        
                        {/* Strategic Details */}
                        {ad.details && Object.keys(ad.details).length > 0 && (
                           <div className="flex flex-wrap gap-2 mb-6">
                              {Object.entries(ad.details).map(([key, val]) => (
                                 <div key={key} className="px-3 py-2 bg-indigo-50 border-2 border-indigo-100 rounded-xl">
                                    <p className="text-[9px] font-black text-black uppercase tracking-widest leading-none mb-1">{key.replace(/([A-Z])/g, ' $1')}</p>
                                    <p className="text-[10px] font-black text-indigo-700 uppercase transition-all line-clamp-1">{val as string}</p>
                                 </div>
                              ))}
                           </div>
                        )}

                        <div className="flex items-center justify-between py-6 border-t-2 border-gray-100">
                           <div>
                              <p className="text-[10px] font-black text-gray-950 uppercase tracking-widest mb-1">Starting At</p>
                              <p className="text-lg font-black text-gray-950 italic tracking-tighter">{formatPrice(ad.price)}</p>
                           </div>
                           <button 
                             onClick={() => {
                                setSelectedAdForEngagement(ad);
                                setEngagementMessage(`Hi! I am interested in your listed asset: "${ad.title}". Please advise on physical alignment or transaction options.`);
                                setEngagementSuccess(false);
                                setEngagementSending(false);
                             }}
                             className="px-8 py-4 bg-gray-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-gray-200"
                           >
                             Engage Now
                           </button>
                        </div>
                     </div>
                   </motion.div>
                 ))
               ) : (
                 <div className="col-span-full py-32 text-center bg-gray-50 border border-dashed border-gray-200 rounded-[5rem]">
                    <Megaphone className="w-20 h-20 text-gray-200 mx-auto mb-8 animate-pulse" />
                    <h4 className="text-2xl font-black text-gray-400 uppercase tracking-tighter italic">No Strategic Intel Found</h4>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-4">Be the first to secure this territory.</p>
                 </div>
               )}
            </section>
          </div>
        ) : view === 'PROMO' ? (
          <EfadoPromoKit user={user} onClose={() => setView('BROWSE')} />
        ) : (
          <div className="max-w-4xl mx-auto">
             <header className="mb-12 text-center">
                <div className="inline-block px-6 py-2 bg-indigo-100 text-indigo-600 rounded-full text-[11px] font-black uppercase tracking-[0.3em] mb-4">
                   Step {{ CATEGORY: '1', DETAILS: '2', PREVIEW: '3', PLAN: '4' }[registerStep]} of 4: {{ CATEGORY: 'Strategic Domain', DETAILS: 'Mission Details', PREVIEW: 'Audit Preview', PLAN: 'Deployment Plan' }[registerStep]}
                </div>
                {/* Tactical Progress Bar */}
                <div className="max-w-xs mx-auto flex gap-1 mb-8 h-1.5 px-4">
                  {['CATEGORY', 'DETAILS', 'PREVIEW', 'PLAN'].map((s, idx) => {
                    const steps = ['CATEGORY', 'DETAILS', 'PREVIEW', 'PLAN'];
                    const currentIdx = steps.indexOf(registerStep);
                    return (
                      <div 
                        key={s} 
                        className={`flex-grow rounded-full transition-all duration-500 ${idx <= currentIdx ? 'bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'bg-gray-100'}`}
                        style={{ height: idx === currentIdx ? '6px' : '4px', marginTop: idx === currentIdx ? '-1px' : '0' }}
                      />
                    );
                  })}
                </div>
                <h3 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic mb-4">
                   {adType === 'ADVERT' ? 'Advertise at EFADO' : 'Sell at EFADO'}
                </h3>
                <p className="text-gray-950 font-black uppercase tracking-widest text-[11px]">
                   {{ 
                     CATEGORY: 'Select what you want to advertise in the EFADO network.',
                     DETAILS: 'Provide full details to attract premium global patronage.',
                     PREVIEW: 'Review your tactical data before public deployment.',
                     PLAN: 'Select the best plan to amplify your strategic visibility.'
                   }[registerStep]}
                </p>
             </header>

             <div className="grid grid-cols-1 gap-12">
                {registerStep === 'CATEGORY' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {AD_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setFormData({ ...formData, category: cat.id });
                          setRegisterStep('DETAILS');
                        }}
                        className="p-6 rounded-3xl border border-gray-100 bg-white hover:border-indigo-600 hover:shadow-xl transition-all text-left group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-gray-100/50 group-hover:bg-indigo-600 text-gray-950 group-hover:text-white flex items-center justify-center mb-4 transition-all ring-1 ring-gray-100">
                          <cat.icon className="w-6 h-6" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">Domain</p>
                        <p className="text-[13px] font-black uppercase tracking-tight text-gray-950">{cat.label}</p>
                      </button>
                    ))}
                  </div>
                ) : registerStep === 'DETAILS' ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white border border-gray-100 rounded-[3rem] p-10 shadow-2xl shadow-gray-100 space-y-8">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest">
                            {adType === 'ADVERT' ? 'Listing Heading (Title)' : 'Item Name / Portfolio Title'}
                          </label>
                          <input 
                            type="text" 
                            placeholder={adType === 'ADVERT' ? "e.g. 5-Star Hotel Reservation in Abuja" : "e.g. 10 Hectares of Farm Land in Oyo"}
                            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-base font-bold focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all shadow-sm placeholder:text-gray-500"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                          />
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                {adType === 'ADVERT' ? 'Base Pricing Strategies (NGN)' : 'Selling Price / Valuation (NGN)'}
                             </label>
                             <input 
                               type="number" 
                               placeholder="Price"
                               className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-base font-bold focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                               value={formData.price}
                               onChange={(e) => setFormData({...formData, price: e.target.value})}
                             />
                          </div>
                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Domain</label>
                             <div className="w-full px-6 py-4 bg-gray-50 rounded-2xl flex items-center justify-between text-sm font-bold opacity-70">
                               {AD_CATEGORIES.find(c => c.id === formData.category)?.label || 'None'}
                               <button onClick={() => setRegisterStep('CATEGORY')} className="text-indigo-600 text-[10px] uppercase tracking-widest font-black">Change</button>
                             </div>
                          </div>
                       </div>

                       {adType === 'SELL' && (
                          <div className="p-8 bg-rose-50 border border-rose-100 rounded-3xl space-y-6">
                             <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-rose-600" />
                                <h4 className="text-[11px] font-black text-rose-900 uppercase tracking-widest">Business Trust Credentials</h4>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                   <label className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Shop / Business Name</label>
                                   <input 
                                      type="text"
                                      placeholder="e.g. EFADO Global Merchants"
                                      className="w-full px-6 py-4 bg-white border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-rose-600 transition-all"
                                      value={formData.details.businessName || ''}
                                      onChange={(e) => setFormData({
                                         ...formData,
                                         details: { ...formData.details, businessName: e.target.value }
                                      })}
                                    />
                                 </div>
                                 <div className="space-y-4">
                                    <label className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Vendor Tier</label>
                                    <select 
                                       className="w-full px-6 py-4 bg-white border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-rose-600 transition-all"
                                       value={formData.details.vendorTier || 'Standard'}
                                       onChange={(e) => setFormData({
                                          ...formData,
                                          details: { ...formData.details, vendorTier: e.target.value }
                                       })}
                                    >
                                       <option>Standard Vendor</option>
                                       <option>Verified Tactical Merchant</option>
                                       <option>Global Sovereign Enterprise</option>
                                    </select>
                                 </div>
                              </div>
                           </div>
                        )}

                       {/* Dynamic Category Fields */}
                       {formData.category && CATEGORY_FIELDS[formData.category] && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                           {CATEGORY_FIELDS[formData.category].map((field) => (
                             <div key={field.key} className="space-y-4">
                               <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest flex items-center justify-between">
                                 {field.label}
                                 {field.optional && <span className="text-[9px] text-gray-950 font-black tracking-normal italic">(Optional)</span>}
                               </label>
                               <input 
                                 type={field.type}
                                 placeholder={field.placeholder}
                                 className="w-full px-6 py-4 bg-indigo-50 border-2 border-indigo-100 rounded-2xl text-sm font-black text-gray-950 focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all shadow-sm placeholder:text-indigo-200"
                                 value={formData.details[field.key] || ''}
                                 onChange={(e) => setFormData({
                                   ...formData, 
                                   details: { ...formData.details, [field.key]: e.target.value }
                                 })}
                               />
                             </div>
                           ))}
                         </div>
                       )}

                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {adType === 'ADVERT' ? 'Mission Description' : 'Asset Details / Narrative'}
                          </label>
                          <textarea 
                            placeholder={adType === 'ADVERT' ? "What makes this offer unique? Feature list, benefits, etc." : "Condition, usage history, features, and selling points."}
                            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all h-32 resize-none"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                          />
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8 border-t border-gray-50">
                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-gray-950 uppercase tracking-widest">State / Region</label>
                             <input 
                                type="text" 
                                placeholder="e.g. Lagos, Abuja, New York"
                                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-600 transition-all font-mono"
                                value={formData.state}
                                onChange={(e) => setFormData({...formData, state: e.target.value})}
                             />
                          </div>
                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-gray-950 uppercase tracking-widest flex justify-between">
                                Town / City
                                <span className="text-[8px] text-gray-950 font-black uppercase tracking-widest leading-none">(Optional)</span>
                             </label>
                             <input 
                                type="text" 
                                placeholder="e.g. Ikeja, Manhattan"
                                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-600 transition-all font-mono"
                                value={formData.city}
                                onChange={(e) => setFormData({...formData, city: e.target.value})}
                             />
                          </div>
                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-gray-950 uppercase tracking-widest flex justify-between">
                                Locality / Village
                                <span className="text-[8px] text-gray-950 font-black uppercase tracking-widest leading-none">(Optional)</span>
                             </label>
                             <input 
                                type="text" 
                                placeholder="Specific village or community"
                                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-600 transition-all font-mono"
                                value={formData.village}
                                onChange={(e) => setFormData({...formData, village: e.target.value})}
                             />
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-gray-50">
                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between">
                                Full Address
                                <span className="text-[8px] text-gray-300 font-bold uppercase tracking-widest leading-none">(Optional)</span>
                             </label>
                             <input 
                                type="text" 
                                placeholder="Street number and name"
                                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-600 shadow-sm"
                                value={formData.address}
                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                             />
                          </div>
                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between">
                                Outstanding Landmark
                                <span className="text-[8px] text-gray-300 font-bold uppercase tracking-widest leading-none">(Optional)</span>
                             </label>
                             <div className="relative">
                               <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                               <input 
                                  type="text" 
                                  placeholder="e.g. Near ABC School, Opposite XYZ Port"
                                  className="w-full pl-12 pr-6 py-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-600"
                                  value={formData.landmark}
                                  onChange={(e) => setFormData({...formData, landmark: e.target.value})}
                               />
                             </div>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 pb-8 border-b border-gray-50">
                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-gray-950 uppercase tracking-widest">Phone Number</label>
                             <div className="relative">
                               <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                               <input 
                                  type="tel" 
                                  placeholder="+234..."
                                  className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-600 transition-all font-mono"
                                  value={formData.phone}
                                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                               />
                             </div>
                          </div>
                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between">
                                WhatsApp Number
                                <span className="text-[8px] text-gray-300 font-bold uppercase tracking-widest leading-none">(Optional)</span>
                             </label>
                             <div className="relative">
                               <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                               <input 
                                  type="tel" 
                                  placeholder="WhatsApp Number"
                                  className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-600 transition-all font-mono"
                                  value={formData.whatsapp}
                                  onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                               />
                             </div>
                          </div>
                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between">
                                Contact Email
                                <span className="text-[8px] text-gray-300 font-bold uppercase tracking-widest leading-none">(Optional)</span>
                             </label>
                             <div className="relative">
                               <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                               <input 
                                  type="email" 
                                  placeholder="Email Address"
                                  className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-600 transition-all font-mono"
                                  value={formData.email}
                                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                               />
                             </div>
                          </div>
                       </div>

                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tactical Assets (Photos)</label>
                          <div className="grid grid-cols-4 gap-4">
                             <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-gray-400 hover:border-indigo-600 hover:text-indigo-600 transition-all"
                             >
                                <Upload className="w-6 h-6 mb-2" />
                                <span className="text-[9px] font-black uppercase">Upload</span>
                             </button>
                             <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                multiple 
                                onChange={handlePhotoUpload} 
                             />
                             {formData.photos.map((photo, index) => (
                                <div key={index} className="aspect-square bg-gray-50 border border-gray-100 rounded-3xl relative overflow-hidden group animate-in fade-in zoom-in-95">
                                   <img src={photo} alt={`Asset ${index + 1}`} className="w-full h-full object-cover" />
                                   <button 
                                      type="button"
                                      onClick={() => {
                                         setFormData(prev => ({
                                            ...prev,
                                            photos: prev.photos.filter((_, i) => i !== index)
                                         }));
                                      }}
                                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-all shadow-md"
                                   >
                                      <X className="w-3 h-3" />
                                   </button>
                                </div>
                             ))}
                             {formData.photos.length === 0 && (
                                <div className="aspect-square bg-indigo-50 border border-indigo-100 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden group animate-pulse">
                                   <img src={`https://picsum.photos/seed/adp1/300/300`} alt="Sample" className="w-full h-full object-cover opacity-50" />
                                   <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-indigo-600 uppercase tracking-widest">Select Photos</span>
                                </div>
                             )}
                          </div>
                          <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest italic flex items-center gap-2">
                             <Info className="w-3 h-3" /> high-fidelity images increase conversion by 85%
                          </p>
                       </div>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={() => setRegisterStep('CATEGORY')}
                        className="flex-1 py-5 border border-gray-100 text-gray-400 rounded-3xl font-black uppercase tracking-widest text-[11px] hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                      >
                        <ChevronLeft className="w-4 h-4" /> Back
                      </button>
                      <button 
                        disabled={!formData.title || !formData.category || !formData.price}
                        onClick={() => setRegisterStep('PREVIEW')}
                        className="flex-[2] py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
                      >
                        Review Audit Preview <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                ) : registerStep === 'PREVIEW' ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white border border-gray-100 rounded-[3.5rem] overflow-hidden shadow-2xl">
                      <div className="aspect-[21/9] bg-gray-950 relative">
                        <img 
                          src={formData.photos[0] || `https://picsum.photos/seed/${formData.title}/1200/500`} 
                          alt="Preview" 
                          className="w-full h-full object-cover opacity-50" 
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <h4 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter italic text-center px-8">
                            {formData.title || 'Mission Heading'}
                          </h4>
                        </div>
                      </div>
                      
                      <div className="p-12 grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="md:col-span-2 space-y-8">
                          <div className="space-y-4">
                            <h5 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Tactical Description</h5>
                            <p className="text-gray-600 font-medium leading-relaxed">{formData.description || 'No description provided.'}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            {Object.entries(formData.details).map(([key, val]) => (
                               <div key={key} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                  <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-1">{key.replace(/([A-Z])/g, ' $1')}</p>
                                  <p className="text-[11px] font-bold text-gray-900 uppercase">{val as string}</p>
                               </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-8 bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
                          <div className="space-y-2">
                                 <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest leading-none">Valuation / Price</p>
                             <p className="text-3xl font-black text-gray-900 italic tracking-tighter">{formatPrice(parseFloat(formData.price) || 0)}</p>
                          </div>
                          
                          <div className="space-y-4 pt-6 border-t border-gray-200">
                            <div className="flex items-center gap-3">
                              <MapPin className="w-4 h-4 text-indigo-600" />
                              <div>
                                <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Global Location</p>
                                <p className="text-[10px] font-bold text-gray-900 uppercase">{formData.city}, {formData.state}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Phone className="w-4 h-4 text-indigo-600" />
                              <div>
                                <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Secure Contact</p>
                                <p className="text-[10px] font-bold text-gray-900 uppercase">{formData.phone}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={() => setRegisterStep('DETAILS')}
                        className="flex-1 py-5 border border-gray-100 text-gray-400 rounded-3xl font-black uppercase tracking-widest text-[11px] hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                      >
                        <ChevronLeft className="w-4 h-4" /> Edit Details
                      </button>
                      <button 
                        onClick={() => setRegisterStep('PLAN')}
                        className="flex-[2] py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                      >
                        Proceed to Selection Plans <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {AD_PLANS.map(plan => (
                        <button 
                          key={plan.id}
                          onClick={() => setSelectedPlan(plan)}
                          className={`p-8 rounded-[3rem] border transition-all text-left relative overflow-hidden group ${selectedPlan?.id === plan.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl shadow-indigo-500/30' : 'bg-white border-gray-100 hover:border-indigo-100 hover:bg-gray-50'}`}
                        >
                          {selectedPlan?.id === plan.id && (
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                          )}
                          <div className="flex items-center justify-between mb-6">
                            <div className={`p-3 rounded-2xl ${selectedPlan?.id === plan.id ? 'bg-white/20' : 'bg-indigo-50'} transition-all`}>
                               {plan.id === 'Express' ? <Zap className="w-5 h-5 text-amber-400" /> : <Clock className="w-5 h-5 text-indigo-600" />}
                            </div>
                            {selectedPlan?.id === plan.id && <CheckCircle2 className="w-5 h-5 text-white" />}
                          </div>
                          
                          <h4 className="text-xl font-black uppercase tracking-tighter mb-1">{plan.name}</h4>
                          <p className={`text-[10px] font-black uppercase tracking-widest mb-6 ${selectedPlan?.id === plan.id ? 'text-indigo-100' : 'text-gray-600'}`}>
                            {plan.durationDays} Day Deployment
                          </p>
                          
                          <div className="text-3xl font-black mb-8 italic">
                            {plan.price === 0 ? 'FREE' : formatPrice(plan.price)}
                          </div>

                          <div className="space-y-3">
                             {plan.features.map((f, i) => (
                               <p key={i} className={`text-[9px] font-black flex items-center gap-2 ${selectedPlan?.id === plan.id ? 'text-white' : 'text-gray-700'}`}>
                                  <CheckCircle2 className="w-3 h-3 shrink-0" /> {f}
                               </p>
                             ))}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={() => setRegisterStep('PREVIEW')}
                        className="flex-1 py-5 border border-gray-100 text-gray-400 rounded-3xl font-black uppercase tracking-widest text-[11px] hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                      >
                        <ChevronLeft className="w-4 h-4" /> Back to Preview
                      </button>
                      <button 
                        disabled={!selectedPlan}
                        onClick={() => (selectedPlan?.price === 0 || user?.is_super_admin) ? handleCreateAd() : setShowPayment(true)}
                        className="flex-[2] py-5 bg-gray-950 text-white rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-2xl hover:bg-indigo-600 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
                      >
                        Deploy Strategy <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                      </button>
                    </div>
                  </div>
                )}
             </div>
          </div>
        )}
      </main>

      <AnimatePresence>
        {showPayment && selectedPlan && (
           <PaymentPlatform 
             user={user}
             type="deposit"
             amount={selectedPlan.price}
             purpose={`Ad Plan: ${selectedPlan.name}`}
             hub="ADVERTISING"
             onSuccess={() => {
               setShowPayment(false);
               handleCreateAd();
             }}
             onCancel={() => setShowPayment(false)}
             onClose={() => setShowPayment(false)}
           />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedAdForEngagement && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gray-950/85 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{selectedAdForEngagement.category}</span>
                  <h3 className="text-xl font-black text-gray-950 uppercase tracking-tighter italic mt-2">Sovereign Engagement Gate</h3>
                </div>
                <button 
                  onClick={() => setSelectedAdForEngagement(null)}
                  className="w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-950 hover:bg-gray-50 transition-all shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Target Asset</p>
                  <p className="text-sm font-black text-gray-950 uppercase">{selectedAdForEngagement.title}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{selectedAdForEngagement.description}</p>
                </div>

                {engagementSuccess ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 bg-teal-50 border border-teal-100 rounded-3xl text-center space-y-3"
                  >
                    <CheckCircle2 className="w-12 h-12 text-teal-600 mx-auto" />
                    <h4 className="text-md font-black text-teal-950 uppercase tracking-tight">Transmission Successful</h4>
                    <p className="text-xs text-teal-800 font-bold uppercase tracking-wide">Your tactical intent has been dispatched to the listed owner. They will align coordinates shortly.</p>
                    <button 
                      onClick={() => {
                        setSelectedAdForEngagement(null);
                        setEngagementSuccess(false);
                      }}
                      className="mt-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white text-[10px] uppercase font-black tracking-widest rounded-xl transition-all shadow-md"
                    >
                      Dismiss Portal
                    </button>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      {selectedAdForEngagement.contact?.phone && (
                        <a 
                          href={`tel:${selectedAdForEngagement.contact.phone}`}
                          className="flex-1 p-4 bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-200 rounded-2xl flex flex-col items-center justify-center text-center gap-1 transition-all group"
                        >
                          <Phone className="w-5 h-5 text-gray-600 group-hover:text-indigo-600 group-hover:scale-110 transition-all" />
                          <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 group-hover:text-indigo-600 mt-1">Direct Call</span>
                          <span className="text-[10px] font-mono font-bold text-gray-950 mt-1">{selectedAdForEngagement.contact.phone}</span>
                        </a>
                      )}

                      {selectedAdForEngagement.contact?.whatsapp && (
                        <a 
                          href={`https://wa.me/${selectedAdForEngagement.contact.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 p-4 bg-gray-50 hover:bg-emerald-50 border border-gray-100 hover:border-emerald-200 rounded-2xl flex flex-col items-center justify-center text-center gap-1 transition-all group"
                        >
                          <MessageCircle className="w-5 h-5 text-gray-600 group-hover:text-emerald-600 group-hover:scale-110 transition-all" />
                          <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 group-hover:text-emerald-600 mt-1">WhatsApp</span>
                          <span className="text-[10px] font-mono font-bold text-gray-950 mt-1">{selectedAdForEngagement.contact.whatsapp}</span>
                        </a>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest block">Dispatch Simulated Intent (Offline Mesh Network)</label>
                      <textarea 
                        value={engagementMessage}
                        onChange={(e) => setEngagementMessage(e.target.value)}
                        placeholder="Type your strategic inquiry..."
                        rows={3}
                        className="w-full p-4 bg-gray-50 border-2 border-gray-100 focus:border-indigo-600 rounded-2xl text-xs font-bold font-mono resize-none focus:outline-none transition-all"
                      />
                    </div>

                    <button 
                      onClick={() => {
                        setEngagementSending(true);
                        setTimeout(() => {
                          setEngagementSending(false);
                          setEngagementSuccess(true);
                        }, 1200);
                      }}
                      disabled={!engagementMessage || engagementSending}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {engagementSending ? "Propagating Signal..." : "Transmit Signal"} 
                      <Zap className="w-4 h-4 text-amber-300" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
