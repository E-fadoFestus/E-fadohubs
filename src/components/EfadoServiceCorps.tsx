import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Zap, 
  HardHat, 
  Settings, 
  Truck, 
  HeartPulse, 
  GraduationCap, 
  Briefcase, 
  UserCheck, 
  Monitor, 
  ShieldAlert, 
  Film, 
  Scale,
  Search,
  Globe,
  MapPin,
  ChevronRight,
  Star,
  ArrowLeft,
  UserPlus,
  ClipboardList,
  X,
  Target,
  Gavel,
  ShieldCheck,
  TrendingUp,
  Map as MapIcon,
  Bell
} from 'lucide-react';
import { UserProfile, ServiceRequest, ServiceProvider } from '../types';
import { ServiceCorpsRegistration } from './ServiceCorpsRegistration';
import { ServiceBargainPlatform } from './ServiceBargainPlatform';
import { db, collection, onSnapshot, query, where, limit, orderBy } from '../firebase';
import { MiningMiniCard, AdvertisingMiniCard } from './EfadoMining';

interface ServiceSubcategory {
  name: string;
  services: string[];
}

interface ServiceFamily {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  subcategories: ServiceSubcategory[];
  accent: string;
  glow: string;
}

const SERVICE_FAMILIES: ServiceFamily[] = [
  {
    id: 'home-building',
    name: 'Home & Building Services',
    icon: Home,
    description: 'Maintenance, repairs, and improvements for residential and commercial properties.',
    accent: 'bg-amber-500',
    glow: 'shadow-amber-500/20',
    subcategories: [
      { name: 'Plumbing', services: ['Pipes & leaks repair', 'Water heater services', 'Drain cleaning', 'Bathroom installation'] },
      { name: 'Tiling & Flooring', services: ['Wall/floor tiling', 'Marble/granite fitting', 'Epoxy & polishing'] },
      { name: 'Carpentry & Woodwork', services: ['Door installation', 'Cabinet/wardrobe', 'Decking & furniture builds'] },
      { name: 'Painting & Finishing', services: ['Interior/exterior painting', 'Plastering & patch repair', 'Coating & waterproofing'] },
      { name: 'Roofing & Waterproofing', services: ['Roof repairs', 'Gutter services', 'Leak sealing & membranes'] },
      { name: 'Landscaping & Grounds', services: ['Gardening', 'Fencing & boundary walls', 'Lawn care'] }
    ]
  },
  {
    id: 'electrical-mechanical',
    name: 'Electrical & Mechanical Services',
    icon: Zap,
    description: 'Power systems, electronics, and mechanical equipment maintenance.',
    accent: 'bg-blue-400',
    glow: 'shadow-blue-400/20',
    subcategories: [
      { name: 'Electrical Installations', services: ['Home wiring', 'Industrial wiring', 'Lighting installation'] },
      { name: 'Maintenance & Fault Repair', services: ['Circuit breaker issues', 'Short circuits troubleshooting', 'Appliance diagnostics'] },
      { name: 'Solar & Renewable Power', services: ['Solar panel installation', 'Inverter repair', 'Solar maintenance'] },
      { name: 'HVAC / Cooling & Ventilation', services: ['AC installation', 'AC servicing', 'Refrigeration units'] },
      { name: 'Generators & Power Backup', services: ['Generator installation', 'Generator maintenance', 'Fuel/power system servicing'] }
    ]
  },
  {
    id: 'construction-trades',
    name: 'Construction & Trades',
    icon: HardHat,
    description: 'Structural development, masonry, and specialized construction trades.',
    accent: 'bg-orange-500',
    glow: 'shadow-orange-500/20',
    subcategories: [
      { name: 'Bricklaying & Masonry', services: ['Wall construction', 'Stone work', 'Concrete blocks'] },
      { name: 'Concrete Works', services: ['Formwork & pouring', 'Reinforcement coordination'] },
      { name: 'Steelworks & Fabrication', services: ['Welding', 'Structural fabrication'] },
      { name: 'Surveying for Construction', services: ['Land surveying', 'Quantity surveying'] },
      { name: 'Demolition & Site Prep', services: ['Site clearing', 'Structural demolition'] },
      { name: 'Glazing & Aluminum Works', services: ['Window fitting', 'Aluminum partitions'] },
      { name: 'Interior Fit-out', services: ['Partitions', 'Ceilings', 'Doors/windows fitting'] }
    ]
  },
  {
    id: 'engineering-consultancy',
    name: 'Engineering & Technical Consultancy',
    icon: Settings,
    description: 'Professional engineering services and technical project management.',
    accent: 'bg-cyan-500',
    glow: 'shadow-cyan-500/20',
    subcategories: [
      { name: 'Civil Engineering', services: ['Structural planning support', 'Site feasibility'] },
      { name: 'Marine Engineering (Technical)', services: ['Vessel technical support', 'Marine systems'] },
      { name: 'Industrial Engineering', services: ['Process optimization', 'Factory layout'] },
      { name: 'Architectural Services', services: ['Design', 'Drawings & approvals support'] },
      { name: 'Project Management', services: ['Planning schedules', 'Budgeting & risk support'] },
      { name: 'Technical Inspection & QA/QC', services: ['Quality control', 'Safety inspections'] },
      { name: 'Cost Estimation / Quantity Surveying', services: ['Bill of quantities', 'Cost analysis'] }
    ]
  },
  {
    id: 'transport-marine',
    name: 'Transport, Travel & Marine Services',
    icon: Truck,
    description: 'Logistics, automotive repairs, and maritime support services.',
    accent: 'bg-indigo-500',
    glow: 'shadow-indigo-500/20',
    subcategories: [
      { name: 'Roadside Assistance', services: ['Breakdown towing', 'Battery replacement'] },
      { name: 'Mechanics & Garage Services', services: ['Engine repair', 'Transmission repair', 'Tyre & brake service'] },
      { name: 'Automotive Diagnostics', services: ['Computer scanning', 'Electrical diagnostics'] },
      { name: 'Marine Services', services: ['Mariner support (roles)', 'Vessel maintenance coordination', 'Repairs coordination'] }
    ]
  },
  {
    id: 'health-wellness',
    name: 'Health, Care & Wellness Services',
    icon: HeartPulse,
    description: 'Healthcare providers, wellness experts, and care services.',
    accent: 'bg-rose-500',
    glow: 'shadow-rose-500/20',
    subcategories: [
      { name: 'Home Care', services: ['Elderly care', 'Nursing support'] },
      { name: 'Wellness & Fitness', services: ['Personal training', 'Nutritionist'] }
    ]
  },
  {
    id: 'education-training',
    name: 'Education & Training Services',
    icon: GraduationCap,
    description: 'Academic tutoring, professional training, and skill development.',
    accent: 'bg-emerald-500',
    glow: 'shadow-emerald-500/20',
    subcategories: [
      { name: 'Academic Tutoring', services: ['Math & Science', 'Languages (English/French/Spanish)', 'STEM Specialized Tutoring', 'Special Education Support'] },
      { name: 'Professional Training', services: ['Corporate Leadership', 'Vocational Skills', 'Digital Literacy', 'Soft Skills Workshop'] },
      { name: 'Global Admissions', services: ['Study Abroad Consulting', 'SAT/IELTS/TOEFL Prep', 'Application Essay Coaching', 'Scholarship Research'] }
    ]
  },
  {
    id: 'business-admin',
    name: 'Business, Admin & Management Services',
    icon: Briefcase,
    description: 'Administrative support, business consulting, and management.',
    accent: 'bg-slate-400',
    glow: 'shadow-slate-400/20',
    subcategories: [
      { name: 'Admin & Virtual Support', services: ['Executive Virtual Assistant', 'Data Entry & Management', 'Online Booking/Scheduling', 'Customer Support (Voice/Chat)'] },
      { name: 'Business Strategy', services: ['Startup Consulting', 'Operations Optimization', 'Supply Chain Management', 'Business Plans & Pitch Decks'] },
      { name: 'Financial Services', services: ['Bookkeeping & Accounting', 'Tax Preparation', 'Payroll Management', 'Investment Consulting'] },
      { name: 'HR & Talent Acquisition', services: ['Recruitment Services', 'Employment Contracts', 'HR Policy Development', 'Training & Onboarding'] }
    ]
  },
  {
    id: 'sales-agent',
    name: 'Sales, Representation & Agent Services',
    icon: UserCheck,
    description: 'Sales agents, representatives, and brokerage services.',
    accent: 'bg-violet-500',
    glow: 'shadow-violet-500/20',
    subcategories: [
      { name: 'Sales Agents', services: ['Direct sales', 'Lead generation'] },
      { name: 'Representation', services: ['Brand ambassador', 'Legal rep'] }
    ]
  },
  {
    id: 'it-digital',
    name: 'IT, Software & Digital Services',
    icon: Monitor,
    description: 'Comprehensive software engineering, digital growth, and technical infrastructure solutions.',
    accent: 'bg-blue-600',
    glow: 'shadow-blue-600/20',
    subcategories: [
      { 
        name: 'Software & App Development', 
        services: [
          'Custom Web Apps (React/Node)', 
          'Mobile App Dev (iOS/Android)', 
          'Desktop Application Dev', 
          'SaaS Platform Development', 
          'E-commerce Solutions',
          'API Design & Implementation',
          'Game Development (Unity/Unreal)'
        ] 
      },
      { 
        name: 'Digital Marketing & Growth', 
        services: [
          'SEO & Search Rankings', 
          'Social Media Strategy', 
          'PPC & Performance Marketing',
          'Email Marketing Automation',
          'Content Marketing',
          'Influencer Marketing & PR'
        ] 
      },
      {
        name: 'Creative Design & UI/UX',
        services: [
          'UI/UX Product Design',
          'Responsive Web Design',
          'Mobile App UI Design',
          'Brand Identity & Logo Design',
          'Interaction Design',
          'Prototyping & User Testing'
        ]
      },
      {
        name: 'Data, AI & Machine Learning',
        services: [
          'Machine Learning Engineering',
          'AI Chatbot Development (NLP)',
          'Data Analysis & Visualization',
          'Predictive Analytics',
          'Computer Vision Solutions',
          'Big Data Architecture'
        ]
      },
      {
        name: 'IT Support & Cybersecurity',
        services: [
          'Cybersecurity Audits',
          'Network Security & Firewalls',
          'Ethical Hacking & Pen Testing',
          'Remote IT Support',
          'IT Asset Management',
          'Data Recovery Services'
        ]
      },
      {
        name: 'Cloud & DevOps Engineering',
        services: [
          'Cloud Migration (AWS/Azure/GCP)',
          'Docker & Kubernetes Setup',
          'CI/CD Pipeline Automation',
          'Infrastructure as Code (Terraform)',
          'Server Monitoring & Optimization'
        ]
      },
      {
        name: 'Web3 & Blockchain',
        services: [
          'Smart Contract Development',
          'DApp & Web3 Integrations',
          'NFT Platform Strategy',
          'Tokenomics & Blockchain Consulting'
        ]
      }
    ]
  },
  {
    id: 'security-emergency',
    name: 'Security & Emergency Services',
    icon: ShieldAlert,
    description: 'Private security, emergency response, and safety consulting.',
    accent: 'bg-red-600',
    glow: 'shadow-red-600/20',
    subcategories: [
      { name: 'Private Security', services: ['Bouncers', 'Guard services'] },
      { name: 'Emergency Response', services: ['First aid', 'Fire safety'] }
    ]
  },
  {
    id: 'events-media',
    name: 'Events, Media & Production Services',
    icon: Film,
    description: 'Event planning, media production, and creative services.',
    accent: 'bg-fuchsia-500',
    glow: 'shadow-fuchsia-500/20',
    subcategories: [
      { name: 'Event Planning', services: ['Weddings', 'Corporate events'] },
      { name: 'Media Production', services: ['Photography', 'Videography'] }
    ]
  },
  {
    id: 'legal-compliance',
    name: 'Legal, Compliance & Documentation',
    icon: Scale,
    description: 'Legal advice, compliance support, and document processing.',
    accent: 'bg-sky-500',
    glow: 'shadow-sky-500/20',
    subcategories: [
      { name: 'Legal Advice', services: ['Corporate law', 'Contract review'] },
      { name: 'Compliance', services: ['Regulatory support', 'Audit prep'] }
    ]
  },
  {
    id: 'writing-languages',
    name: 'Writing, Languages & Globalization',
    icon: Globe,
    description: 'Translation, localization, content writing, and global communication services.',
    accent: 'bg-teal-500',
    glow: 'shadow-teal-500/20',
    subcategories: [
      { 
        name: 'Translation & Localization', 
        services: [
          'Document Translation', 
          'Website Localization', 
          'Software Localization', 
          'Certified Legal Translation',
          'Interpretation Services'
        ] 
      },
      { 
        name: 'Content & Creative Writing', 
        services: [
          'Copywriting & Ad Copy', 
          'Technical Writing', 
          'Blog & Article Writing', 
          'Creative Storytelling',
          'Ghostwriting'
        ] 
      },
      {
        name: 'Global Business Support',
        services: [
          'International Market Research',
          'Cross-border Trade Consulting',
          'Export/Import Documentation',
          'Multilingual Customer Support'
        ]
      }
    ]
  }
];

interface EfadoServiceCorpsProps {
  user: UserProfile;
  onClose: () => void;
  onOpenMining?: () => void;
  onNavigate?: (hub: any, subview?: any) => void;
}

export const EfadoServiceCorps: React.FC<EfadoServiceCorpsProps> = ({ user, onClose, onOpenMining, onNavigate }) => {
  const [selectedFamily, setSelectedFamily] = useState<ServiceFamily | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [scope, setScope] = useState<'Local' | 'International' | 'Both'>('Both');
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationType, setRegistrationType] = useState<'PROVIDER' | 'SEEKER'>('PROVIDER');
  const [prefilledData, setPrefilledData] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState({ state: '', city: '', village: '' });
  const [activeBargain, setActiveBargain] = useState<{ request: ServiceRequest, provider: ServiceProvider } | null>(null);
  const [liveRequests, setLiveRequests] = useState<ServiceRequest[]>([]);
  const [showMap, setShowMap] = useState(false);

  // Load live requests for the "Sovereign Relief Feed"
  React.useEffect(() => {
    const q = query(
      collection(db, 'service_requests'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setLiveRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRequest)));
    });
    return () => unsubscribe();
  }, []);

  const handleBookNow = (family: ServiceFamily, subName: string, serviceName: string) => {
    setPrefilledData({
      familyId: family.id,
      subcategory: subName,
      description: `I am looking for ${serviceName} services.`
    });
    setRegistrationType('SEEKER');
    setShowRegistration(true);
  };

  const filteredFamilies = SERVICE_FAMILIES.filter(family => 
    family.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    family.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    family.subcategories.some(sub => 
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.services.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  const handleNegotiate = (req: ServiceRequest) => {
    // In a real app we'd fetch the provider profile. 
    // Here we simulate as the current user being a provider for this request.
    const mockProvider: ServiceProvider = {
      userId: user.uid,
      businessName: user.displayName || 'Authorized Provider',
      serviceFamily: req.serviceFamily || '',
      subcategory: req.subcategory,
      location: { country: 'Nigeria', state: 'Lagos', city: 'Ikeja', village: 'Main', address: '123 Tech St' },
      plan: 'Basic',
      rating: 4.8,
      reviewsCount: 12,
      services: [],
      verified: true,
      contactEmail: user.email,
      contactPhone: '',
      photos: [],
      scope: 'Local',
      bio: 'Professional Provider',
      createdAt: Date.now()
    };
    setActiveBargain({ request: req, provider: mockProvider });
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto px-4 py-8 relative">
        {/* Header */}
        <div className="mb-20 text-center relative">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-3 px-6 py-2 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-[0.4em] mb-8 border border-white/5 backdrop-blur-3xl shadow-[0_0_40px_rgba(99,102,241,0.1)]"
          >
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Strategic Operations Center
          </motion.div>
          
          <div className="relative inline-block mb-8">
            <h1 className="text-6xl md:text-9xl font-black text-white tracking-tighter leading-[0.8] mb-4">
              Service <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400">CORPS</span>
            </h1>
            <div className="absolute -right-12 top-0 rotate-12 hidden md:block">
              <div className="px-4 py-1 bg-white/5 border border-white/10 backdrop-blur-xl rounded-lg">
                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">v2.0 Neural Link</span>
              </div>
            </div>
          </div>

          <p className="text-slate-500 max-w-3xl mx-auto text-lg md:text-xl font-medium leading-relaxed mb-12 opacity-80">
            Access a vetted global network of tactical experts across <span className="text-white">14 elite service families</span>. 
            From deep-stack engineering to strategic consultancy—deploy intelligence at scale.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <button 
              onClick={() => {
                setRegistrationType('PROVIDER');
                setPrefilledData(null);
                setShowRegistration(true);
              }}
              className="group relative px-12 py-6 bg-white text-slate-950 rounded-[2rem] font-black tracking-tighter text-sm overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white via-slate-100 to-white group-hover:translate-x-full transition-transform duration-1000" />
              <span className="relative flex items-center gap-4">
                <UserPlus className="w-5 h-5" />
                MANIFEST AS PROVIDER
              </span>
            </button>
            <button 
              onClick={() => {
                setRegistrationType('SEEKER');
                setPrefilledData(null);
                setShowRegistration(true);
              }}
              className="group px-12 py-6 bg-slate-900 border border-white/5 backdrop-blur-3xl text-white rounded-[2rem] font-black tracking-tighter text-sm hover:bg-slate-800 transition-all shadow-2xl flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                <ClipboardList className="w-5 h-5 text-indigo-400" />
              </div>
              STRATEGIC DEPLOYMENT
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-6 mb-24 max-w-6xl mx-auto">
          <div className="flex-1 space-y-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-indigo-500/5 rounded-[1.8rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                type="text"
                placeholder="Deep-Intelligence Query (Skill, Talent, or Hardware)..."
                className="w-full pl-16 pr-8 py-6 bg-white border border-white/5 rounded-[1.8rem] backdrop-blur-3xl text-gray-950 placeholder:text-slate-400 focus:border-indigo-500/30 outline-none transition-all font-bold text-sm shadow-2xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-4 px-4">
              <div className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-white/5 rounded-2xl text-[10px] font-black uppercase text-indigo-400 tracking-widest">
                <MapPin className="w-4 h-4" /> Relief Geofence:
              </div>
              <input 
                className="px-6 py-3 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase text-white tracking-widest focus:bg-white/10 outline-none transition-all"
                placeholder="State"
                value={selectedLocation.state}
                onChange={e => setSelectedLocation({...selectedLocation, state: e.target.value})}
              />
              <input 
                className="px-6 py-3 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase text-white tracking-widest focus:bg-white/10 outline-none transition-all"
                placeholder="City"
                value={selectedLocation.city}
                onChange={e => setSelectedLocation({...selectedLocation, city: e.target.value})}
              />
              <input 
                className="px-6 py-3 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase text-white tracking-widest focus:bg-white/10 outline-none transition-all"
                placeholder="Village/Ward"
                value={selectedLocation.village}
                onChange={e => setSelectedLocation({...selectedLocation, village: e.target.value})}
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex bg-slate-900/50 p-1.5 rounded-[1.8rem] border border-white/5 backdrop-blur-3xl shadow-2xl">
              {(['Local', 'International', 'Both'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setScope(s)}
                  className={`px-10 py-5 rounded-[1.4rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${
                    scope === s 
                      ? 'bg-white text-slate-950 shadow-[0_10px_30px_rgba(255,255,255,0.2)]' 
                      : 'text-slate-500 hover:text-white'
                  }`}
                >
                  {s === 'International' ? <Globe className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                  {s}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowMap(!showMap)}
              className={`w-full py-4 rounded-[1.4rem] border border-white/10 flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all ${showMap ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
            >
              <MapIcon className="w-4 h-4" />
              Intelligence Map Overlay
            </button>
          </div>
        </div>

        {/* Sovereign Relief Feed (Live Ad Sidebar) */}
        <div className="hidden xl:block fixed right-8 top-1/2 -translate-y-1/2 w-64 space-y-4 z-40">
          <div className="space-y-6">
            <MiningMiniCard user={user} onOpenFull={onOpenMining || (() => {})} />
            <AdvertisingMiniCard 
              onAdvert={() => onNavigate?.('ADVERTISING', 'ADVERT')} 
              onSell={() => onNavigate?.('ADVERTISING', 'SELL')} 
            />
          </div>
          
          <div className="p-6 rounded-[2rem] bg-indigo-600 shadow-2xl shadow-indigo-500/20 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl transition-transform group-hover:scale-150" />
            <Bell className="w-6 h-6 mb-4 animate-bounce" />
            <h4 className="font-black text-xs uppercase tracking-widest mb-1">Live Relief Priority</h4>
            <div className="space-y-4 mt-6">
              {liveRequests.map(req => (
                <div key={req.id} className="p-3 bg-white/10 rounded-xl border border-white/10 backdrop-blur-sm">
                  <p className="text-[10px] font-black tracking-tight line-clamp-1">{req.subcategory}</p>
                  <div className="flex items-center gap-2 mt-2 opacity-60">
                    <MapPin className="w-3 h-3" />
                    <span className="text-[8px] font-bold uppercase">{req.location.city}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!selectedFamily ? (
            <div className="space-y-32">
              <motion.div 
                key="grid"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredFamilies.map((family) => {
                  const FamilyIcon = family.icon as any;
                  return (
                    <motion.button
                      key={family.id}
                      layoutId={family.id}
                      whileHover={{ 
                        y: -12, 
                        transition: { duration: 0.3, ease: [0.33, 1, 0.68, 1] } 
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedFamily(family)}
                      className="relative w-full h-[420px] rounded-[2.5rem] overflow-hidden group border border-white/10 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 hover:shadow-indigo-500/20"
                    >
                      {/* Atmospheric Background Pattern */}
                      <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[size:24px_24px]" />
                      </div>

                      {/* Dynamic Glow and Shimmer */}
                      <div className={`absolute -inset-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br from-transparent via-indigo-400/10 to-transparent blur-3xl`} />
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[60px] group-hover:bg-indigo-500/20 transition-all duration-700" />
                      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none translate-y-[-100%] group-hover:translate-y-[100%] transition-transform`} />

                      {/* Card Content Interior */}
                      <div className="absolute inset-0 p-10 flex flex-col items-start text-left z-10">
                        {/* Interactive Icon Box */}
                        <div className={`w-20 h-20 mb-8 rounded-[1.5rem] flex items-center justify-center relative transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-[0_0_50px_rgba(255,255,255,0.1)] overflow-hidden`}>
                          <div className={`absolute inset-0 opacity-20 ${family.accent}`} />
                          <div className={`absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/10`} />
                          <FamilyIcon className={`w-9 h-9 text-white relative z-10 transition-transform duration-500 group-hover:scale-110`} />
                        </div>

                        <div className="space-y-4 max-w-[280px]">
                          <h3 className="text-3xl font-black text-white leading-[1.1] tracking-tight group-hover:text-indigo-300 transition-colors duration-500">
                            {family.name}
                          </h3>
                          <p className="text-slate-400 text-sm font-medium leading-relaxed line-clamp-3 opacity-80 group-hover:opacity-100 transition-opacity">
                            {family.description}
                          </p>
                        </div>

                        <div className="mt-auto w-full pt-8 flex items-center justify-between border-t border-white/5">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Elite Mobilization</span>
                            <span className={`text-[11px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2`}>
                               <div className={`w-2 h-2 rounded-full animate-pulse ${family.accent}`} />
                               {family.subcategories.length} Specialized Squads
                            </span>
                          </div>
                          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-slate-950 transition-all duration-500 group-hover:-rotate-45">
                            <ChevronRight className="w-6 h-6" />
                          </div>
                        </div>
                      </div>

                      {/* Bottom Technical Accent */}
                      <div className={`absolute bottom-0 left-0 w-full h-1.5 opacity-30 group-hover:opacity-100 transition-opacity duration-500 ${family.accent}`} />
                    </motion.button>
                  );
                })}
              </motion.div>

              {/* Live Strategic Feed */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-12"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-8">
                  <div>
                    <h2 className="text-4xl font-black text-white tracking-widest uppercase italic">Global Intel Feed</h2>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-2">vetted multi-location service benchmarks</p>
                  </div>
                  <div className="flex items-center gap-4 bg-indigo-500/10 px-6 py-3 rounded-2xl border border-indigo-500/10">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live Signals Active</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {liveRequests.length > 0 ? liveRequests.map((req, idx) => (
                    <motion.div 
                      key={req.id}
                      whileHover={{ x: 10 }}
                      className="group p-8 rounded-[2.5rem] bg-indigo-950/20 border border-white/5 backdrop-blur-3xl hover:bg-white/5 transition-all relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity">
                        <Gavel className="w-16 h-16 text-white" />
                      </div>
                      
                      <div className="flex items-start justify-between mb-6">
                        <div className="space-y-2">
                          <div className="px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20 w-fit">
                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{req.specialty || req.subcategory}</span>
                          </div>
                          <h4 className="text-2xl font-black text-white tracking-tight uppercase">{req.subcategory}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-emerald-400 uppercase tracking-widest italic">{req.budget}</p>
                          <p className="text-[8px] font-bold text-slate-500 uppercase mt-1">Valuation</p>
                        </div>
                      </div>

                      <p className="text-slate-400 text-xs font-medium leading-relaxed line-clamp-2 mb-8 italic">
                         "{req.description}"
                      </p>

                      <div className="flex items-center justify-between pt-6 border-t border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-500" />
                            <span className="text-[10px] font-black text-white uppercase tracking-tight">{req.location.city}, {req.location.state}</span>
                          </div>
                          <div className="h-4 w-px bg-white/5" />
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-rose-500" />
                            <span className="text-[10px] font-black text-rose-400 uppercase tracking-tight">{req.urgency}</span>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => handleNegotiate(req)}
                          className="px-6 py-3 bg-white text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-xl shadow-black/20"
                        >
                          Negotiate
                        </button>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="col-span-2 py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                       <ShieldCheck className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                       <p className="text-slate-600 font-black uppercase text-xs tracking-widest">Scanning for priority signals...</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          ) : (
            <motion.div 
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <button 
                onClick={() => setSelectedFamily(null)}
                className="flex items-center gap-2 text-slate-500 hover:text-white font-bold tracking-tight text-xs transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Return to Intelligence
              </button>

              <div className={`relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-indigo-900/60 to-slate-900/80 backdrop-blur-3xl p-12 mb-12 shadow-2xl`}>
                <div className={`absolute top-0 right-0 w-64 h-64 blur-[100px] opacity-20 ${selectedFamily.accent}`} />
                <div className="relative z-10 flex flex-col md:flex-row gap-10 items-start md:items-center">
                  <div className={`w-32 h-32 rounded-[2rem] flex items-center justify-center shrink-0 relative overflow-hidden shadow-2xl group`}>
                    <div className={`absolute inset-0 opacity-40 ${selectedFamily.accent}`} />
                    <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/10" />
                    {(() => {
                      const SelectedIcon = selectedFamily.icon as any;
                      return <SelectedIcon className="w-14 h-14 text-white relative z-10" />;
                    })()}
                  </div>
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${selectedFamily.accent}`} />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Active Operations Matrix</span>
                    </div>
                    <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter">{selectedFamily.name}</h2>
                    <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-3xl">{selectedFamily.description}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {selectedFamily.subcategories.map((sub, idx) => (
                  <div key={idx} className="relative overflow-hidden p-10 rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-slate-900/90 to-indigo-950/80 backdrop-blur-3xl shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                    <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-8">
                       <h4 className="text-2xl font-black text-white tracking-tight">
                         {sub.name}
                       </h4>
                       <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                          <span className={`${selectedFamily.accent.replace('bg-', 'text-')} text-[10px] font-black uppercase tracking-widest`}>
                            {sub.services.length} Capabilities
                          </span>
                       </div>
                    </div>
                    
                    <div className="space-y-4">
                      {sub.services.map((service, sIdx) => (
                        <div key={sIdx} className="group flex items-center justify-between p-6 bg-white/0 hover:bg-white/5 rounded-2xl border border-transparent hover:border-white/10 transition-all duration-300">
                          <div className="flex flex-col">
                            <span className="text-lg font-bold text-slate-300 group-hover:text-white transition-colors">{service}</span>
                            <div className="flex items-center gap-3 mt-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`w-2.5 h-2.5 ${i < 4 ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                                ))}
                              </div>
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Precision Verified</span>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => handleBookNow(selectedFamily, sub.name, service)}
                            className={`px-8 py-4 ${selectedFamily.accent} text-slate-950 hover:bg-white transition-all rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95`}
                          >
                            DEPLOY
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showRegistration && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto no-scrollbar bg-white rounded-3xl"
              >
                <button 
                  onClick={() => setShowRegistration(false)}
                  className="absolute top-4 right-4 z-10 p-2 bg-black/5 hover:bg-black/10 rounded-full text-gray-400 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <ServiceCorpsRegistration 
                  user={user}
                  onClose={() => setShowRegistration(false)}
                  serviceFamilies={SERVICE_FAMILIES}
                  initialType={registrationType}
                  prefilledData={prefilledData}
                />
              </motion.div>
            </motion.div>
          )}

          {activeBargain && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 50 }}
                className="w-full max-w-5xl"
              >
                <ServiceBargainPlatform 
                  request={activeBargain.request}
                  provider={activeBargain.provider}
                  user={user}
                  onClose={() => setActiveBargain(null)}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
