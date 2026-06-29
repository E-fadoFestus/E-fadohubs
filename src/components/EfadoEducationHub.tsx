import React, { useState, useMemo } from 'react';
import { 
  GraduationCap, 
  Search, 
  BookOpen, 
  BookMarked, 
  Calendar, 
  FileText, 
  FileCheck, 
  Video, 
  ClipboardList, 
  Backpack, 
  Shapes, 
  Gamepad2, 
  UserPlus, 
  Users, 
  HelpCircle, 
  Building2, 
  PlayCircle, 
  ChevronDown, 
  Award, 
  Library, 
  Calculator, 
  Briefcase, 
  Compass, 
  Scroll, 
  SearchCode, 
  Microscope, 
  FileSearch, 
  Target, 
  Database, 
  Users2,
  ExternalLink,
  Star,
  Zap,
  Sparkles,
  Clock,
  LayoutGrid,
  Search as SearchIcon,
  ChevronRight,
  Globe,
  X,
  Info,
  Cpu,
  Store,
  ArrowRight,
  Pickaxe,
  Mail,
  Brain,
  CreditCard,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SUPPORT_EMAILS } from '../constants/businessProfile';
import { ExamSimulator } from './education/ExamSimulator';
import { VendorMarketplace } from './VendorMarketplace';
import { EfadoMining, AdvertisingMiniCard, MiningMiniCard } from './EfadoMining';
import { SeminarPortal } from './education/SeminarPortal';
import { JambDetailedGuide } from './education/JambDetailedGuide';
import { JambPaymentPortal } from './education/JambPaymentPortal';
import { EfadoIntelligenceFeed } from './EfadoIntelligenceFeed';
import { CurrencySelector } from './CurrencySelector';
import { ExamCategory } from '../data/examData';
import { UserProfile } from '../types';
import { AiStudyPlatform } from './education/AiStudyPlatform';
import { 
  CgpaCalculator, 
  SiwesLogbook, 
  MilestoneTracker, 
  AdmissionCutOffs, 
  PrimarySchoolGame,
  ThesisPlanner,
  VivaSimulator,
  PolytechnicPathway,
  ScreeningRequirementsChecker
} from './education/EducationInteractiveTools';

interface SubCategory {
  title: string;
  icon: any;
  description: string;
  tags?: ('Most Visited' | 'Recently Updated')[];
  examType?: ExamCategory;
  serviceType?: 'CBT' | 'SEMINAR' | 'PORTAL' | 'GUIDE' | 'PAYMENT' | 'THESIS_PLANNER' | 'VIVA_SIMULATOR' | 'POLY_PATHWAY' | 'SCREENING_CHECKER' | 'SIWES' | 'CGPA';
}

interface EducationSection {
  id: string;
  title: string;
  icon: any;
  description: string;
  subCategories: SubCategory[];
}

const educationData: EducationSection[] = [
  {
    id: 'jamb',
    title: "JAMB UTME Hub",
    icon: Target,
    description: "CBT simulated examinations, strategy seminars, profile guidelines, and e-PIN purchase portals.",
    subCategories: [
      {
        title: "JAMB UTME CBT Simulator",
        icon: ClipboardList,
        description: "Practice simulated full-load JAMB CBT exams with the exact 400-point national ranking algorithm.",
        tags: ["Most Visited"],
        examType: "JAMB",
        serviceType: "CBT"
      },
      {
        title: "JAMB Strategy Seminar",
        icon: Video,
        description: "Access our exclusive webinar recording and tactical materials for academic success.",
        tags: ["Recently Updated"],
        examType: "JAMB",
        serviceType: "SEMINAR"
      },
      {
        title: "JAMB Profile & Syllabus Guide",
        icon: FileSearch,
        description: "Verify registration requirements, brochure options, and syllabus lists.",
        tags: ["Most Visited"],
        serviceType: "GUIDE"
      },
      {
        title: "JAMB Admissions Lifecycle Suite",
        icon: CreditCard,
        description: "Interactive hub for all 18 official JAMB phases: NIN validation, e-PINs, CAPS, course changes, and document printing.",
        tags: ["Recently Updated"],
        serviceType: "PAYMENT"
      }
    ]
  },
  {
    id: 'o_level',
    title: "O'Level Hub",
    icon: BookOpen,
    description: "Syllabi, past questions, and portals for WAEC, NECO, and GCE.",
    subCategories: [
      {
        title: "WAEC Core Prep & Syllabus",
        icon: FileText,
        description: "Tactical questions, dynamic solutions, and official subject outlines.",
        tags: ["Most Visited"],
        examType: "WAEC"
      },
      {
        title: "NECO Strategic Suite",
        icon: FileCheck,
        description: "National secondary curriculum preparation node with simulated CBTs.",
        tags: ["Recently Updated"],
        examType: "NECO"
      },
      {
        title: "SIWES Logbook Planner",
        icon: Briefcase,
        description: "Organize weekly report parameters, departmental codes, and training logs.",
        tags: ["Recently Updated"]
      }
    ]
  },
  {
    id: 'primary',
    title: "Primary Academic Hub",
    icon: Backpack,
    description: "Tactical study guides, tutorials, and interactive games for elementary candidates.",
    subCategories: [
      {
        title: "National Common Entrance Guide",
        icon: ClipboardList,
        description: "CBT simulated questions for top-tier secondary placement exams.",
        tags: ["Most Visited"]
      },
      {
        title: "Primary Hub Speed-Math Challenge",
        icon: Gamepad2,
        description: "An active interactive game testing elementary mental calculation speed.",
        tags: ["Recently Updated"]
      }
    ]
  },
  {
    id: 'nursery',
    title: "Nursery / Preschool Hub",
    icon: Shapes,
    description: "Phonics syllables, child development checklists, and parent learning logs.",
    subCategories: [
      {
        title: "Early Cognitive Milestone Tracker",
        icon: Brain,
        description: "Interactive developmental domain checklists for tracking preschool adaptation.",
        tags: ["Most Visited"]
      },
      {
        title: "Phonics Core Workbook",
        icon: BookMarked,
        description: "Fundamental pronunciation and reading guides for toddlers.",
        tags: ["Recently Updated"]
      }
    ]
  },
  {
    id: 'higher_ed',
    title: "University & Advanced Hub",
    icon: GraduationCap,
    description: "CAPS admission parameters, cut-off archives, and GPA/CGPA computation.",
    subCategories: [
      {
        title: "CAPS Cut-offs & Admission Checker",
        icon: Database,
        description: "Check official university catchment scores and CAPS status logs.",
        tags: ["Most Visited"]
      },
      {
        title: "Tactical CGPA Calculator",
        icon: Calculator,
        description: "Evaluate semester-specific grade point averages and cumulative files.",
        tags: ["Recently Updated"]
      },
      {
        title: "Viva Voce Oral Defense Simulator",
        icon: Users2,
        description: "Mock panels and frequent defense question database."
      }
    ]
  },
  {
    id: 'post_utme',
    title: "Post-UTME Academic Hub",
    icon: Award,
    description: "Practice university-specific screening CBTs, check official aggregate parameters, and track admission cut-offs.",
    subCategories: [
      {
        title: "Post-UTME CBT Simulator",
        icon: ClipboardList,
        description: "Practice timed, university-specific Post-UTME computer-based screening tests.",
        tags: ["Most Visited"],
        examType: "POST_UTME",
        serviceType: "CBT"
      },
      {
        title: "Screening Requirements Checker",
        icon: FileText,
        description: "Audit physical screening dossiers, calculate weighted scoring metrics, and verify qualifications.",
        tags: ["Recently Updated"],
        serviceType: "SCREENING_CHECKER"
      },
      {
        title: "University Cut-off Matrix",
        icon: TrendingUp,
        description: "Check admissions cut-offs for top universities, polytechnics, and colleges.",
        serviceType: "SCREENING_CHECKER"
      }
    ]
  },
  {
    id: 'polytechnic',
    title: "Polytechnic & Technical Hub",
    icon: Cpu,
    description: "National Diploma (ND), Higher National Diploma (HND) curriculums, and direct transfer matrices.",
    subCategories: [
      {
        title: "ND to HND / B.Sc. Pathway Guide",
        icon: Compass,
        description: "Calculate transfer grade point equivalents and plan direct-entry pathways.",
        tags: ["Most Visited"],
        serviceType: "POLY_PATHWAY"
      },
      {
        title: "Polytechnic SIWES Placement",
        icon: Briefcase,
        description: "Plan SIWES logbook parameters and search industrial placement opportunities.",
        tags: ["Recently Updated"],
        serviceType: "SIWES"
      },
      {
        title: "Direct Entry Syllabus Tracker",
        icon: FileSearch,
        description: "Track direct entry and transition syllabus lists for polytechnic transfers.",
        serviceType: "GUIDE"
      }
    ]
  },
  {
    id: 'postgraduate',
    title: "Postgraduate & Research Hub",
    icon: Brain,
    description: "Ph.D. & Master's dissertation planning tools, citation builders, and live oral viva-voce mock panels.",
    subCategories: [
      {
        title: "Thesis Research Roadmap Planner",
        icon: BookMarked,
        description: "Interactive timeline mapping, academic title polishing, and literature citation vault.",
        tags: ["Most Visited"],
        serviceType: "THESIS_PLANNER"
      },
      {
        title: "Oral Viva-Voce Mock Panel",
        icon: Users2,
        description: "Simulate doctoral defense boards with supportive, standard, or hostile committees.",
        tags: ["Recently Updated"],
        serviceType: "VIVA_SIMULATOR"
      },
      {
        title: "Postgraduate CGPA Calculator",
        icon: Calculator,
        description: "Evaluate postgraduate grade point thresholds and dissertation credits.",
        serviceType: "CGPA"
      }
    ]
  }
];

export const EfadoEducationHub: React.FC<{ onClose: () => void; user: UserProfile; onUpdateMining?: (amount: number) => void; onNavigate?: (hub: any, subview?: any) => void; onOpenMining?: () => void; initialSectionId?: string }> = ({ onClose, user, onUpdateMining, onNavigate, onOpenMining, initialSectionId }) => {
  const [showGuide, setShowGuide] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeExam, setActiveExam] = useState<{ type: ExamCategory, view: 'mode' | 'seminar' } | null>(null);
  const [showSeminarPortal, setShowSeminarPortal] = useState(false);
  const [showJambGuide, setShowJambGuide] = useState(false);
  const [showJambPaymentModal, setShowJambPaymentModal] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [showMining, setShowMining] = useState(false);

  // New AI-powered study states & dynamic modals
  const [showAiStudyPortal, setShowAiStudyPortal] = useState(false);
  const [activeHubDetails, setActiveHubDetails] = useState<any | null>(null);
  const [activeInteractiveTool, setActiveInteractiveTool] = useState<{ type: string; title: string } | null>(null);

  React.useEffect(() => {
    if (initialSectionId) {
      const found = educationData.find(sec => sec.id === initialSectionId);
      if (found) {
        setActiveHubDetails(found);
      }
    }
  }, [initialSectionId]);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return educationData;
    
    const query = searchQuery.toLowerCase();
    return educationData.map(section => ({
      ...section,
      subCategories: section.subCategories.filter(
        sub => 
          sub.title.toLowerCase().includes(query) || 
          sub.description.toLowerCase().includes(query)
      )
    })).filter(section => section.subCategories.length > 0);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      <AnimatePresence>
        {showGuide && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md"
          >
            <div className="w-full max-w-xl bg-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 rounded-full blur-3xl -mr-24 -mt-24 opacity-50" />
              <button 
                onClick={() => setShowGuide(false)}
                className="absolute top-6 right-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-900 transition-all font-black"
              >
                <X className="w-6 h-6 text-gray-950" />
              </button>
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 mb-8">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black text-gray-950 mb-4 tracking-tight uppercase">Academic Tactical Guide</h2>
                <p className="text-gray-950 font-black mb-8 leading-relaxed uppercase tracking-[0.1em] text-xs">
                  Universal learning protocols active. Here is how you navigate the EFADO Education Hub:
                </p>
                
                <div className="space-y-6">
                  {[
                    { icon: BookOpen, title: "Level-Specific Hubs", desc: "Access specialized resources for O'Level, Primary, Nursery, and JAMB preparations." },
                    { icon: Library, title: "Resource Portals", desc: "Direct access to syllabi, past questions, and official result checker portals." },
                    { icon: Target, title: "Admission Tracker", desc: "Monitor cut-off marks and school admission statuses across the global network." },
                    { icon: Zap, title: "Interactive Prep", desc: "Engage with subject tutorials and learning games to optimize academic performance." }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 group">
                      <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-indigo-600 transition-all duration-300 pointer-events-none">
                        <item.icon className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-gray-950 uppercase tracking-widest mb-1">{item.title}</h4>
                        <p className="text-xs text-gray-900 leading-relaxed font-black">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={() => setShowGuide(false)}
                  className="w-full mt-10 py-5 bg-gray-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-gray-300 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Enter Academy
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/50 backdrop-blur-xl border-b border-white/5 p-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black tracking-tight">EFADO Education Hub</h1>
                <button 
                  onClick={() => setShowGuide(true)}
                  className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1 hover:text-emerald-300 transition-colors"
                >
                  <Info className="w-3 h-3" /> Guide
                </button>
                <div className="w-1 h-1 bg-white/20 rounded-full" />
                <button 
                  onClick={() => window.location.href = `mailto:${SUPPORT_EMAILS.EDUCATION}`}
                  className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1 hover:text-indigo-300 transition-colors"
                >
                  <Mail className="w-3 h-3" /> Support
                </button>
              </div>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Universal Academic Ecosystem</p>
            </div>
          </div>
          
          <div className="relative flex-grow max-w-xl">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search academic resources, syllabi, and portals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-white/10 rounded-2xl text-sm font-medium text-white placeholder:text-slate-400 outline-none focus:border-indigo-500 transition-all shadow-2xl"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <CurrencySelector />
            <button 
              onClick={onClose}
              className="px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5"
            >
              Terminal Output
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6 space-y-8 pb-32">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-600/10 border-2 border-indigo-500/20 rounded-[3rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:bg-indigo-600/20 transition-all duration-1000" />
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-indigo-500/30">
              <Store className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Sell at EFADO</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Universal Vendor Exchange Protocol active</p>
            </div>
          </div>
          <button 
            onClick={() => setShowMarketplace(true)}
            className="px-10 py-5 bg-white text-slate-950 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] hover:scale-[1.05] transition-all shadow-2xl active:scale-95 flex items-center gap-3 decoration-indigo-500 group relative z-10"
          >
            Launch Marketplace Hub <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-emerald-600/10 border-2 border-emerald-500/20 rounded-[3rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-xl relative overflow-hidden group mb-8"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:bg-emerald-600/20 transition-all duration-1000" />
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 bg-emerald-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-emerald-500/30">
              <Pickaxe className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">EFADO Mining Node</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Extract digital assets & accumulate E-F-A-D-O values</p>
            </div>
          </div>
          <button 
            onClick={() => setShowMining(true)}
            className="px-10 py-5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] hover:scale-[1.05] transition-all shadow-[0_20px_50px_-10px_rgba(5,150,105,0.5)] active:scale-95 flex items-center gap-3 group relative z-10"
          >
            Launch Sovereign Node <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          </button>
        </motion.div>

        {/* Automatic Intelligence Update Section */}
        <motion.div
           initial={{ opacity: 0, scale: 0.98 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.2 }}
        >
           <EfadoIntelligenceFeed />
        </motion.div>

        {/* Prominent Active Launching Button / CTA Card for the Extended AI Study Platform */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-tr from-slate-900 via-indigo-950/70 to-slate-900 p-8 md:p-12 rounded-[3.5rem] border-2 border-indigo-500/25 shadow-[0_20px_60px_rgba(99,102,241,0.15)] flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden group"
        >
          {/* Neon backdrop flares */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -mr-40 -mt-40 group-hover:bg-indigo-500/15 transition-all duration-700" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-500/10 rounded-full blur-[120px] pointer-events-none -ml-40 -mb-40 group-hover:bg-violet-500/15 transition-all duration-700" />

          <div className="space-y-4 relative z-10 flex-1 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-3.5 py-1.5 rounded-full text-[10px] font-black text-indigo-300 uppercase tracking-widest animate-pulse">
              <Sparkles className="w-3.5 h-3.5" /> Extended Academic Protocol Live
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-none italic">
              LAUNCH AI INTELLECTUAL PREP PORTAL
            </h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider leading-relaxed">
              Activate the ultimate cognitive study node. Dynamic syllabus compilations, real-time examiner analysis, expert chat, and custom-generated test mockups matching <span className="text-indigo-400">JAMB, WAEC, NECO, GCE,</span> and tertiary syllabus protocols.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5 bg-white/5 border border-white/5 px-3.5 py-2 rounded-xl">
                ⚡ Real-time Gemini AI Notes
              </span>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5 bg-white/5 border border-white/5 px-3.5 py-2 rounded-xl">
                ⚡ Dynamic Academic Quiz
              </span>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5 bg-white/5 border border-white/5 px-3.5 py-2 rounded-xl">
                ⚡ 100% CBT Simulation
              </span>
            </div>
          </div>

          <button 
            onClick={() => setShowAiStudyPortal(true)}
            className="w-full lg:w-auto px-12 py-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-[1.8rem] text-xs font-black uppercase tracking-[0.25em] shadow-[0_20px_50px_-5px_rgba(99,102,241,0.4)] hover:shadow-[0_20px_50px_rgba(99,102,241,0.6)] hover:scale-[1.05] transition-all duration-300 active:scale-95 flex items-center justify-center gap-3 shrink-0 relative z-10"
          >
            Launch Command Centre <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Academic Hub Sections Repositioned as Beautiful Interactive Cards */}
        {filteredData.length === 0 ? (
          <div className="text-center py-32 space-y-6">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <SearchIcon className="w-10 h-10 text-slate-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-300">No Academic Matches Found</h2>
            <p className="text-slate-400 max-w-md mx-auto font-bold uppercase tracking-tight">Try searching for broader terms like "WAEC", "JAMB", or "Scholarship".</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border-b border-white/5 pb-4">
              <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest">Universal Academic Category Grid</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Select a category node to launch its specialized sub-modules and interfaces</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredData.map((section) => (
                <motion.div 
                  key={section.id}
                  whileHover={{ y: -6, scale: 1.02 }}
                  onClick={() => setActiveHubDetails(section)}
                  className="bg-slate-900/60 border border-white/5 rounded-[2.5rem] p-6 cursor-pointer hover:border-indigo-500/35 hover:shadow-[0_25px_50px_rgba(99,102,241,0.08)] transition-all duration-300 relative group flex flex-col justify-between overflow-hidden"
                >
                  {/* Decorative background glow on hover */}
                  <div className="absolute -right-16 -top-16 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />
                  
                  <div>
                    <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all mb-6 shadow-md">
                      <section.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-black tracking-tight text-white uppercase group-hover:text-indigo-400 transition-colors mb-2">{section.title}</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase leading-relaxed tracking-tight mb-6">{section.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{section.subCategories.length} Active Modules</span>
                    <span className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Decorative Bottom Glow */}
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-indigo-500/10 to-transparent pointer-events-none" />

      <AnimatePresence>
        {showMarketplace && (
          <VendorMarketplace 
            user={user} 
            onClose={() => setShowMarketplace(false)} 
          />
        )}

        {showMining && (
          <EfadoMining 
            user={user}
            onClose={() => setShowMining(false)}
            onUpdateBalance={onUpdateMining}
          />
        )}
        
        {activeExam && (
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed inset-0 z-[60] bg-slate-950"
          >
             <ExamSimulator 
                onClose={() => setActiveExam(null)} 
                initialView={activeExam.view}
                user={user}
                examType={activeExam.type}
             />
          </motion.div>
        )}

        {showSeminarPortal && (
          <SeminarPortal 
            user={user}
            onClose={() => setShowSeminarPortal(false)}
          />
        )}

        {showJambGuide && (
          <JambDetailedGuide 
            onClose={() => setShowJambGuide(false)}
          />
        )}

        {showJambPaymentModal && (
          <JambPaymentPortal 
            onClose={() => setShowJambPaymentModal(false)}
            user={user}
          />
        )}

        {showAiStudyPortal && (
          <AiStudyPlatform 
            user={user}
            onClose={() => setShowAiStudyPortal(false)}
          />
        )}

        {/* Academic Hub Detail Overlay */}
        {activeHubDetails && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 backdrop-blur-md p-4 md:p-8 flex items-center justify-center">
            <div className="w-full max-w-4xl bg-slate-900 border border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden relative p-8 md:p-10 max-h-[85vh] flex flex-col justify-between bg-slate-900">
              
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none -mr-32 -mt-32" />
              
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center">
                    <activeHubDetails.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">{activeHubDetails.title}</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">{activeHubDetails.description}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveHubDetails(null)}
                  className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sub categories grid */}
              <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pr-2 mb-6 relative z-10">
                {activeHubDetails.subCategories.map((sub: any, idx: number) => (
                  <motion.div 
                    key={sub.title}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => {
                      if (sub.serviceType === 'PORTAL') {
                        setShowSeminarPortal(true);
                        return;
                      }
                      if (sub.serviceType === 'GUIDE') {
                        setShowJambGuide(true);
                        return;
                      }
                      if (sub.serviceType === 'PAYMENT') {
                        setShowJambPaymentModal(true);
                        return;
                      }
                      if (sub.serviceType === 'THESIS_PLANNER') {
                        setActiveInteractiveTool({ type: 'THESIS_PLANNER', title: sub.title });
                        return;
                      }
                      if (sub.serviceType === 'VIVA_SIMULATOR') {
                        setActiveInteractiveTool({ type: 'VIVA_SIMULATOR', title: sub.title });
                        return;
                      }
                      if (sub.serviceType === 'POLY_PATHWAY') {
                        setActiveInteractiveTool({ type: 'POLY_PATHWAY', title: sub.title });
                        return;
                      }
                      if (sub.serviceType === 'SCREENING_CHECKER') {
                        setActiveInteractiveTool({ type: 'SCREENING_CHECKER', title: sub.title });
                        return;
                      }
                      if (sub.serviceType === 'SIWES') {
                        setActiveInteractiveTool({ type: 'SIWES', title: sub.title });
                        return;
                      }
                      if (sub.serviceType === 'CGPA') {
                        setActiveInteractiveTool({ type: 'CGPA', title: sub.title });
                        return;
                      }
                      if (sub.examType) {
                        setActiveExam({
                          type: sub.examType,
                          view: sub.serviceType === 'SEMINAR' ? 'seminar' : 'mode'
                        });
                        return;
                      }

                      // Launch interactive tools based on titles
                      const titleLower = sub.title.toLowerCase();
                      if (titleLower.includes('cgpa') || titleLower.includes('fees') || titleLower.includes('finder')) {
                        setActiveInteractiveTool({ type: 'CGPA', title: sub.title });
                      } else if (titleLower.includes('siwes') || titleLower.includes('logbook')) {
                        setActiveInteractiveTool({ type: 'SIWES', title: sub.title });
                      } else if (titleLower.includes('game') || titleLower.includes('speed-math') || titleLower.includes('challenge')) {
                        setActiveInteractiveTool({ type: 'GAME', title: sub.title });
                      } else if (titleLower.includes('milestone') || titleLower.includes('cognitive') || titleLower.includes('tracker')) {
                        setActiveInteractiveTool({ type: 'MILESTONES', title: sub.title });
                      } else {
                        setActiveInteractiveTool({ type: 'CUTOFFS', title: sub.title });
                      }
                    }}
                    className="bg-slate-800/60 p-6 rounded-[2rem] border border-white/5 hover:bg-indigo-600 transition-all group cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-white/10 transition-colors">
                          <sub.icon className="w-6 h-6 text-indigo-400 group-hover:text-white" />
                        </div>
                        {sub.tags && (
                          <div className="flex flex-col gap-1.5 items-end">
                            {sub.tags.map((tag: any) => (
                              <span 
                                key={tag} 
                                className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                  tag === 'Most Visited' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 
                                  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <h3 className="text-sm font-black text-white uppercase tracking-tight group-hover:text-white transition-colors mb-2">{sub.title}</h3>
                      <p className="text-slate-300 text-xs font-bold leading-relaxed group-hover:text-white transition-colors mb-4 uppercase tracking-tight italic">
                        {sub.description}
                      </p>
                    </div>
                    
                    <div className="mt-4 flex items-center gap-2 text-indigo-400 font-black text-[9px] uppercase tracking-widest group-hover:text-white transition-all transform group-hover:translate-x-2">
                      Access Module <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-white/5 relative z-10">
                <button 
                  onClick={() => setActiveHubDetails(null)}
                  className="px-6 py-3 bg-slate-800 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all"
                >
                  Close Hub Node
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Dynamic Interactive Tool Modal */}
        {activeInteractiveTool && (
          <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950/95 backdrop-blur-md p-4 md:p-8 flex items-center justify-center">
            <div className="w-full max-w-4xl bg-slate-900 border border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden relative">
              <button 
                onClick={() => setActiveInteractiveTool(null)}
                className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all z-20"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="p-1">
                {activeInteractiveTool.type === 'CGPA' && <CgpaCalculator />}
                {activeInteractiveTool.type === 'SIWES' && <SiwesLogbook />}
                {activeInteractiveTool.type === 'GAME' && <PrimarySchoolGame />}
                {activeInteractiveTool.type === 'MILESTONES' && <MilestoneTracker />}
                {activeInteractiveTool.type === 'CUTOFFS' && <AdmissionCutOffs />}
                {activeInteractiveTool.type === 'THESIS_PLANNER' && <ThesisPlanner />}
                {activeInteractiveTool.type === 'VIVA_SIMULATOR' && <VivaSimulator />}
                {activeInteractiveTool.type === 'POLY_PATHWAY' && <PolytechnicPathway />}
                {activeInteractiveTool.type === 'SCREENING_CHECKER' && <ScreeningRequirementsChecker />}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
