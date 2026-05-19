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
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SUPPORT_EMAILS } from '../constants/businessProfile';
import { ExamSimulator } from './education/ExamSimulator';
import { VendorMarketplace } from './VendorMarketplace';
import { EfadoMining, AdvertisingMiniCard, MiningMiniCard } from './EfadoMining';
import { SeminarPortal } from './education/SeminarPortal';
import { JambDetailedGuide } from './education/JambDetailedGuide';
import { EfadoIntelligenceFeed } from './EfadoIntelligenceFeed';
import { ExamCategory } from '../data/examData';
import { UserProfile } from '../types';

interface SubCategory {
  title: string;
  icon: any;
  description: string;
  tags?: ('Most Visited' | 'Recently Updated')[];
  examType?: ExamCategory;
  serviceType?: 'CBT' | 'SEMINAR' | 'PORTAL' | 'GUIDE';
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
    id: 'o_level',
    title: "O'Level Hub",
    icon: BookOpen,
    description: "Resources and portals for WAEC, NECO, and GCE examinations.",
    subCategories: [
      {
        title: "EFADO WAEC CBT",
        icon: Cpu,
        description: "Practice specialized WAEC examination simulation with tactical analytics.",
        tags: ['Recently Updated'],
        examType: 'WAEC',
        serviceType: 'CBT'
      },
      {
        title: "WAEC Strategic Seminar",
        icon: Video,
        description: "Official WAEC certificate protocols and examination success strategies.",
        examType: 'WAEC',
        serviceType: 'SEMINAR'
      },
      {
        title: "EFADO NECO CBT",
        icon: Target,
        description: "National Merit CBT simulator for junior and senior secondary exams.",
        examType: 'NECO',
        serviceType: 'CBT'
      },
      {
        title: "Result Checker",
        icon: ClipboardList,
        description: "Direct links and step-by-step result verification guides.",
        tags: ['Most Visited']
      }
    ]
  },
  {
    id: 'primary',
    title: "Primary School Hub",
    icon: Backpack,
    description: "Curriculum and preparatory materials for Classes 1 through 6.",
    subCategories: [
      {
        title: "Class 1-6 Curriculum",
        icon: BookMarked,
        description: "Termly scheme of work for primary education levels."
      },
      {
        title: "Common Entrance Prep",
        icon: Target,
        description: "Mock exams and past questions for entrance examinations.",
        tags: ['Most Visited']
      },
      {
        title: "Learning Games",
        icon: Gamepad2,
        description: "Interactive mathematics, English, and science games."
      },
      {
        title: "Teacher Resources",
        icon: Users,
        description: "Standard lesson plans and printable worksheets."
      },
      {
        title: "Parent Guide",
        icon: HelpCircle,
        description: "Homework assistance tips and child assessment tools."
      }
    ]
  },
  {
    id: 'nursery',
    title: "Nursery School Hub",
    icon: Shapes,
    description: "Interactive learning and developmental tracking for preschool years.",
    subCategories: [
      {
        title: "KG 1-3 Curriculum",
        icon: Shapes,
        description: "Focus on phonics, number work, and developmental rhymes."
      },
      {
        title: "Learning Videos",
        icon: PlayCircle,
        description: "Animated content for colours, shapes, and alphabet."
      },
      {
        title: "Activity Sheets",
        icon: FileSearch,
        description: "Printable tracing, coloring, and logic sheets."
      },
      {
        title: "Child Development",
        icon: Clock,
        description: "Milestone trackers and cognitive growth monitoring."
      },
      {
        title: "School Readiness",
        icon: ClipboardList,
        description: "Interactive assessment quizzes for school entry."
      }
    ]
  },
  {
    id: 'jamb',
    title: "JAMB & Admission Hub",
    icon: Building2,
    description: "UTME registration, Post-UTME updates, and admission tracking.",
    subCategories: [
      {
        title: "EFADO Jamb CBT",
        icon: Cpu,
        description: "Practice free JAMB CBT with 220+ questions across all subjects.",
        tags: ['Recently Updated'],
        examType: 'JAMB',
        serviceType: 'CBT'
      },
      {
        title: "JAMB Success Seminar",
        icon: Video,
        description: "Professional presentation on UTME success strategies and tactical academic deployment.",
        tags: ['Most Visited'],
        examType: 'JAMB',
        serviceType: 'SEMINAR'
      },
      {
        title: "Seminar Material Hub",
        icon: FileText,
        description: "Upload and manage standardized JAMB seminar materials and agenda presentations.",
        tags: ['Recently Updated'],
        serviceType: 'PORTAL'
      },
      {
        title: "Comprehensive JAMB Guide",
        icon: FileSearch,
        description: "Exhaustive write-up on registration, sub-combinations, and 2026 success protocols.",
        tags: ['Most Visited'],
        serviceType: 'GUIDE'
      },
      {
        title: "Post-UTME Tactical Prep",
        icon: GraduationCap,
        description: "University-specific entrance simulation and strategic past questions.",
        examType: 'POST_UTME',
        serviceType: 'CBT'
      },
      {
        title: "Cut-Off Marks",
        icon: Target,
        description: "Real-time tracker for University and Poly cut-off points.",
        tags: ['Recently Updated']
      },
      {
        title: "Admission Status",
        icon: SearchCode,
        description: "JAMB CAPS guide and direct status link verification."
      },
      {
        title: "Change of Course/Inst.",
        icon: UserPlus,
        description: "Step-by-step tutorial for institutional corrections."
      }
    ]
  },
  {
    id: 'university',
    title: "University Hub",
    icon: GraduationCap,
    description: "NUC accredited courses, fee structures, and academic tools.",
    subCategories: [
      {
        title: "Course Finder",
        icon: Search,
        description: "Search all NUC accredited courses across Nigeria."
      },
      {
        title: "School Fees",
        icon: BookOpen,
        description: "Updated fee structure by university and faculty.",
        tags: ['Recently Updated']
      },
      {
        title: "CGPA Calculator",
        icon: Calculator,
        description: "Interactive GPA and Cumulative GPA tracking tool.",
        tags: ['Most Visited']
      },
      {
        title: "Project Topics",
        icon: Microscope,
        description: "Research ideas and department-specific project samples."
      },
      {
        title: "ICAN CBT Hub",
        icon: Cpu,
        description: "Professional accounting certification simulation for prospective chartered accountants.",
        examType: 'ICAN',
        serviceType: 'CBT'
      },
      {
        title: "NIM Leadership Hub",
        icon: Target,
        description: "Management certification practice and leadership tactical briefing.",
        examType: 'NIM',
        serviceType: 'CBT'
      },
      {
        title: "Scholarships",
        icon: Award,
        description: "Undergraduate funding and allowance opportunities."
      }
    ]
  },
  {
    id: 'polytechnic',
    title: "Polytechnic Hub",
    icon: Building2,
    description: "ND/HND resources, SIWES guides, and conversion information.",
    subCategories: [
      {
        title: "ND/HND Resources",
        icon: BookMarked,
        description: "Curriculum guides and past polytechnic papers."
      },
      {
        title: "SIWES Guide",
        icon: Briefcase,
        description: "Logbook samples and industrial placement tips.",
        tags: ['Most Visited']
      },
      {
        title: "Poly JAMB",
        icon: ClipboardList,
        description: "JAMB specific requirements for polytechnic entry."
      },
      {
        title: "Conversion Programs",
        icon: ChevronRight,
        description: "HND to BSc top-up information and school listings."
      },
      {
        title: "Poly Rankings",
        icon: Award,
        description: "NBTE approved list of top polytechnics and monotechnics."
      }
    ]
  },
  {
    id: 'a_level',
    title: "A'Level & JUPEB Hub",
    icon: Scroll,
    description: "IJMB, JUPEB, and Cambridge A-Level preparation paths.",
    subCategories: [
      {
        title: "JUPEB",
        icon: FileSearch,
        description: "Registration, syllabus, and affiliated universities."
      },
      {
        title: "IJMB",
        icon: ClipboardList,
        description: "State-wide centers and subject combination guides.",
        tags: ['Most Visited']
      },
      {
        title: "Cambridge A'Level",
        icon: Globe,
        description: "International guide and local study center listings."
      },
      {
        title: "Direct Entry",
        icon: UserPlus,
        description: "DE requirements via A'Level and JUPEB pathways."
      },
      {
        title: "A'Level vs JAMB",
        icon: LayoutGrid,
        description: "Strategic comparison tool for university entry."
      }
    ]
  },
  {
    id: 'postgraduate',
    title: "Postgraduate Hub",
    icon: Microscope,
    description: "Advanced degree programs, application tips, and research tools.",
    subCategories: [
      {
        title: "PGD Programs",
        icon: BookMarked,
        description: "List of schools and PGD specific entry requirements."
      },
      {
        title: "Masters Guide",
        icon: GraduationCap,
        description: "Application tips and types of masters degree available.",
        tags: ['Recently Updated']
      },
      {
        title: "PhD Guide",
        icon: Award,
        description: "Proposal writing guide and supervisor finder tool."
      },
      {
        title: "Transcript Request",
        icon: BookMarked,
        description: "Digitized request process for major academic schools."
      },
      {
        title: "Research Tools",
        icon: Compass,
        description: "Citation generators, plagiarism and stats software."
      }
    ]
  },
  {
    id: 'higher_degrees',
    title: "Master, Doctorate & PhD Hub",
    icon: Award,
    description: "International PhD trackers, funding, and thesis repositories.",
    subCategories: [
      {
        title: "MSc/MA/MBA",
        icon: GraduationCap,
        description: "International school finder and GMAT/GRE prep."
      },
      {
        title: "PhD Tracker",
        icon: Calendar,
        description: "Global application deadlines and tracking database.",
        tags: ['Recently Updated']
      },
      {
        title: "Funding",
        icon: Target,
        description: "TETFund, Commonwealth, and Fulbright scholarship database.",
        tags: ['Most Visited']
      },
      {
        title: "Thesis Repository",
        icon: Database,
        description: "Searchable database of research projects and papers."
      },
      {
        title: "Viva Prep",
        icon: Users2,
        description: "Mock panels and frequent defense question database."
      }
    ]
  }
];

export const EfadoEducationHub: React.FC<{ onClose: () => void; user: UserProfile; onUpdateMining?: (amount: number) => void; onNavigate?: (hub: any, subview?: any) => void; onOpenMining?: () => void }> = ({ onClose, user, onUpdateMining, onNavigate, onOpenMining }) => {
  const [expandedId, setExpandedId] = useState<string | null>('o_level');
  const [showGuide, setShowGuide] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeExam, setActiveExam] = useState<{ type: ExamCategory, view: 'mode' | 'seminar' } | null>(null);
  const [showSeminarPortal, setShowSeminarPortal] = useState(false);
  const [showJambGuide, setShowJambGuide] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [showMining, setShowMining] = useState(false);

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
          
          <button 
            onClick={onClose}
            className="px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5"
          >
            Terminal Output
          </button>
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
            {filteredData.map((section) => (
              <motion.div 
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card-ultra rounded-[2.5rem] overflow-hidden border border-white/5 transition-all"
              >
                <button 
                  onClick={() => setExpandedId(expandedId === section.id ? null : section.id)}
                  className="w-full flex items-center justify-between p-8 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                      <section.icon className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black tracking-tight">{section.title}</h2>
                      <p className="text-slate-400 text-sm font-black uppercase tracking-tight">{section.description}</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-6 h-6 text-slate-500 transition-transform duration-500 ${expandedId === section.id ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {expandedId === section.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className="p-8 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {section.subCategories.map((sub, idx) => (
                            <motion.div 
                            key={sub.title}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
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
                              if (sub.examType) {
                                setActiveExam({
                                  type: sub.examType,
                                  view: sub.serviceType === 'SEMINAR' ? 'seminar' : 'mode'
                                });
                              }
                            }}
                            className="bg-slate-800/80 golden-card-border p-6 rounded-[2rem] hover:bg-indigo-600 transition-all group cursor-pointer"
                          >
                            <div className="flex justify-between items-start mb-6">
                              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                <sub.icon className="w-6 h-6 text-indigo-400 group-hover:text-white" />
                              </div>
                              {sub.tags && (
                                <div className="flex flex-col gap-1.5 items-end">
                                  {sub.tags.map(tag => (
                                    <span 
                                      key={tag} 
                                      className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
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
                            <h3 className="text-lg font-black text-white mb-2">{sub.title}</h3>
                            <p className="text-slate-300 text-xs font-black leading-relaxed group-hover:text-white transition-colors mb-4 uppercase tracking-tight">
                              {sub.description}
                            </p>
                            
                            {(sub.serviceType === 'CBT' || sub.serviceType === 'SEMINAR') && (
                              <div className="flex items-center gap-2 mb-6 p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                                <Pickaxe className="w-3 h-3 text-emerald-400" />
                                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-tighter">Mining Node Payment Accepted</span>
                              </div>
                            )}

                            <div className="mt-auto flex items-center gap-3 text-indigo-500 font-bold text-[10px] uppercase tracking-widest group-hover:text-white transition-all transform group-hover:translate-x-2">
                              Access Module <ExternalLink className="w-3.5 h-3.5" />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
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
      </AnimatePresence>
    </div>
  );
};
