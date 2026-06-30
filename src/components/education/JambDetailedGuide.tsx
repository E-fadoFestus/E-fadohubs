import React, { useState } from 'react';
import { 
  BookOpen, 
  Info, 
  UserCheck, 
  Fingerprint, 
  Hash, 
  FileText, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  X, 
  ChevronRight, 
  GraduationCap, 
  Target, 
  Calendar, 
  Search, 
  BookMarked, 
  Zap, 
  Smartphone, 
  Globe, 
  Clock, 
  ShieldCheck,
  Award,
  Layers,
  ChevronDown,
  ArrowLeft,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface JambDetailedGuideProps {
  onClose: () => void;
}

const sections = [
  { id: 'site_guide', title: 'Efado Onboarding Guide', icon: Globe },
  { id: 'registration', title: 'Registration Protocol', icon: UserCheck },
  { id: 'structure', title: 'Exam Structure', icon: Layers },
  { id: 'subjects', title: 'Subject Hub', icon: BookMarked },
  { id: 'centers', title: 'CBT Centers & Mode', icon: Building2 },
  { id: 'conduct', title: 'Success Conduct', icon: ShieldCheck },
  { id: 'admission', title: 'Admission Cycle', icon: Target },
  { id: 'post_utme', title: 'Post-UTME Phase', icon: GraduationCap },
  { id: 'study_guide', title: 'Study Protocol', icon: BookOpen },
];

const courseCombinations = [
  { course: 'ENGINEERING', subjects: ['Mathematics', 'Physics', 'Chemistry'], icon: Zap },
  { course: 'M.B.B.S (Medicine)', subjects: ['Biology', 'Physics', 'Chemistry'], icon: Target },
  { course: 'NURSING', subjects: ['Physics', 'Biology', 'Chemistry'], icon: GraduationCap },
  { course: 'COMPUTER SCIENCE', subjects: ['Mathematics', 'Biology', 'Physics'], icon: Smartphone },
  { course: 'PHARMACY', subjects: ['Biology', 'Physics', 'Chemistry'], icon: Target },
  { course: 'BIOCHEMISTRY', subjects: ['Biology', 'Physics', 'Chemistry'], icon: Layers },
  { course: 'INDUSTRIAL CHEMISTRY', subjects: ['Mathematics', 'Physics', 'Chemistry'], icon: Layers },
  { course: 'GEOLOGY', subjects: ['Geography', 'Physics', 'Chemistry'], icon: Globe },
  { course: 'MATHEMATICS', subjects: ['Mathematics', 'Physics', 'Chemistry'], icon: Hash },
  { course: 'MICROBIOLOGY', subjects: ['Biology', 'Physics', 'Chemistry'], icon: ShieldCheck },
  { course: 'ECONOMICS', subjects: ['Mathematics', 'Economics', 'Any other Social Science'], icon: Building2 },
  { course: 'SOCIOLOGY', subjects: ['Mathematics', 'Economics', 'Any other Social Science'], icon: GraduationCap },
  { course: 'PSYCHOLOGY', subjects: ['Mathematics', 'Economics', 'Any other Social Science'], icon: UserCheck },
  { course: 'POLITICAL SCIENCE', subjects: ['Mathematics', 'Economics', 'Any other Social Science'], icon: Target },
  { course: 'PUBLIC ADMIN', subjects: ['Mathematics', 'Economics', 'Any other Social Science'], icon: Building2 },
  { course: 'ACCOUNTING', subjects: ['Mathematics', 'Economics', 'Any other Social Science'], icon: Hash },
  { course: 'BUSINESS ADMIN', subjects: ['Mathematics', 'Economics', 'Any Social Science'], icon: Target },
  { course: 'BANKING AND FINANCE', subjects: ['Mathematics', 'Economics', 'Any other Social Science'], icon: Building2 },
  { course: 'LAW', subjects: ['Literature', 'Economics', 'Any other Art subject'], icon: GraduationCap },
  { course: 'MASS COMM', subjects: ['Literature', 'Economics', 'Any other Art subject'], icon: Smartphone },
  { course: 'LINGUISTICS', subjects: ['Literature', 'Economics', 'Any other Art subject'], icon: BookOpen },
  { course: 'PHILOSOPHY', subjects: ['Literature', 'Economics', 'Any other Art subject'], icon: BookOpen },
  { course: 'ENGLISH AND LITERARY STUDIES', subjects: ['Government', 'Economics', 'Any other Art subjects'], icon: BookMarked },
];

export const JambDetailedGuide: React.FC<JambDetailedGuideProps> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState('site_guide');
  const [subjectSearch, setSubjectSearch] = useState('');

  const filteredCombinations = courseCombinations.filter(c => 
    c.course.toLowerCase().includes(subjectSearch.toLowerCase())
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'site_guide':
        return (
          <div className="space-y-8">
            <header className="mb-10">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic underline decoration-indigo-500 decoration-4 underline-offset-8 transition-all">Efado Hubs Quickstart Guide</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px] mt-4">Connecting Candidates Globally • Core Operations, Live Webinars, Payments, and CBT Simulator Instruction.</p>
            </header>

            {/* Global Context Message */}
            <div className="bg-gradient-to-r from-indigo-900 to-slate-950 text-white p-8 rounded-[2.5rem] border border-indigo-500/10 relative overflow-hidden shadow-xl">
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <span className="text-[9px] bg-indigo-500/25 text-indigo-200 font-extrabold uppercase px-3 py-1 rounded-full tracking-wider font-mono border border-indigo-500/25">
                    Platform Orientation
                  </span>
                  <h3 className="text-xl font-black uppercase tracking-tight">Welcome to the Efado Cognitive Network</h3>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    Efado is designed to handle all academic, financial, and preparatory tasks entirely online from anywhere in the world. Learn how to fund your wallet, buy official JAMB e-PINs, practice with our CBT engine, and join interactive webinars right below.
                  </p>
                </div>
                <div className="flex gap-4 shrink-0">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center text-center w-28 select-none">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400 mb-1" />
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-300">100% Online</p>
                    <p className="text-[7.5px] font-bold text-slate-400">Except Biometrics</p>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center text-center w-28 select-none">
                    <Globe className="w-5 h-5 text-emerald-400 mb-1 animate-pulse" />
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-300">Global</p>
                    <p className="text-[7.5px] font-bold text-slate-400">Any Device, Anywhere</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step-by-Step Onboarding Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Card 1: Registration Step by Step */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase">1. JAMB Registration Steps</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">The streamlined path to get fully registered</p>
                  </div>
                </div>
                
                <div className="space-y-4 font-sans">
                  <div className="flex gap-4 items-start">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-950 uppercase">Link NIN & Verify Credentials</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">Verify your 11-digit National Identification Number (NIN) in the Processing Portal under "NIN Verification". This validates your identity with government servers.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 items-start">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-950 uppercase">Create Profile Code</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">Initiate the SMS cellular gateway command on our platform to generate your 10-digit Profile Code linking your NIN to cell networks securely.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-950 uppercase">Procure e-PIN & Choice Setup</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">Instantly purchase your official 2026 JAMB e-PIN. Set up your institution and course choices, choosing preferred universities and subject combinations.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">4</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-950 uppercase">Physical Thumbprinting Only</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">With your online profile fully completed, you do not need to sit in queues. Simply walk into any accredited JAMB CBT center to perform the mandatory physical biometrics thumbprint to finalize!</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Payments & Wallets */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase">2. Making Payments</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">How to fund your processing wallet</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs font-sans">
                  <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-500/10">
                    <h4 className="font-black uppercase text-emerald-900 mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> Active Processing Wallet
                    </h4>
                    <p className="text-[11px] text-emerald-950 font-semibold leading-relaxed">
                      Your current active processing wallet balance is shown on the portal header. Every transaction (buying e-PINs, validating NINs, data correction) is automatically and securely deducted from this balance.
                    </p>
                  </div>

                  <div className="space-y-3 font-semibold text-slate-500 text-[11px] leading-relaxed">
                    <div className="flex gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <p><span className="text-slate-950 font-black uppercase">Instantly Add Funds</span>: Click the <span className="text-emerald-600 font-black">"Add Simulated Funds (₦25k)"</span> button on the dashboard to immediately replenish your active balance without leaving the app.</p>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <p><span className="text-slate-950 font-black uppercase">Automated Auditing</span>: Clear invoices, receipt cards, and confirmation numbers are generated for every payment to give you clean records.</p>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <p><span className="text-slate-950 font-black uppercase">Secure Mainframe</span>: Backend architecture automatically updates user document collections securely in Firestore on successful actions.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: CBT Simulator */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase">3. Using CBT Simulator</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Optimize your cognitive response speed</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs font-sans text-slate-600">
                  <p className="font-semibold leading-relaxed">
                    The CBT Engine mimics the exact configuration, user interface, and keyboard shortcuts of the national UTME examination.
                  </p>

                  <ul className="space-y-3 font-semibold text-[11px] leading-relaxed">
                    <li className="flex gap-3">
                      <Layers className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      <p><span className="text-slate-900 font-black uppercase">Practice Drill Mode</span>: Practice with unlimited time or custom subject combinations. Helps you master topics incrementally.</p>
                    </li>
                    <li className="flex gap-3">
                      <Target className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      <p><span className="text-slate-900 font-black uppercase">Master Mock Mode</span>: Full 180-question exam simulated under strict countdown conditions to test your speed and endurance.</p>
                    </li>
                    <li className="flex gap-3">
                      <Clock className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      <p><span className="text-slate-900 font-black uppercase">Analytical Insights</span>: On completion, get an instant score breakdown, percentage accuracy, and time-per-question metrics.</p>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Card 4: Webinars & Seminars */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase">4. Seminars & Live Webinars</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Connect with seasoned tutors and mentors</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs font-sans text-slate-600">
                  <p className="font-semibold leading-relaxed">
                    Learn how to attend workshops, webinars, and prep sessions live inside the Efado Seminar Portal.
                  </p>

                  <ul className="space-y-3 font-semibold text-[11px] leading-relaxed">
                    <li className="flex gap-3">
                      <Globe className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                      <p><span className="text-slate-900 font-black uppercase">Find Webinars</span>: Click on the "Webinars & Academic Seminars" module in the Education Hub. Explore upcoming events.</p>
                    </li>
                    <li className="flex gap-3">
                      <Clock className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                      <p><span className="text-slate-900 font-black uppercase">Check Countdown Timers</span>: Active timers display remaining time before the webinar broadcasts. Registrants will get instant audio alarms.</p>
                    </li>
                    <li className="flex gap-3">
                      <Zap className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                      <p><span className="text-slate-900 font-black uppercase">One-Click Join</span>: Once live, click the "Join Webinar Channel" button to instantly link with the stream, download slides, and participate in Q&As.</p>
                    </li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        );
      case 'registration':
        return (
          <div className="space-y-8">
            <header className="mb-10">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic underline decoration-indigo-500 decoration-4 underline-offset-8 transition-all">Registration Protocol 2026</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px] mt-4">The precise algorithmic path to a valid UTME profile.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                  <Fingerprint className="w-16 h-16 text-indigo-600" />
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                    <Hash className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase">Stage 1: NIN Linkage</h3>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  The National Identification Number (NIN) is mandatory. Without it, you cannot initiate registration.
                </p>
                <div className="bg-slate-900 p-6 rounded-2xl text-white font-mono text-sm relative">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                    <span className="text-[10px] text-slate-400 font-black uppercase">SMS Protocol</span>
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xs italic leading-relaxed">
                    SMS <span className="text-white font-black">NIN [Space] 12345678901</span> to <span className="text-indigo-400 font-black">55019</span> or <span className="text-indigo-400 font-black">66019</span>
                  </p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                  <Globe className="w-16 h-16 text-emerald-600" />
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase">Stage 2: Profile Code</h3>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  You will receive a 10-character alphanumeric Profile Code. This is your permanent identity in the JAMB ecosystem.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-xs font-bold text-slate-600 uppercase">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Save code permanently
                  </li>
                  <li className="flex items-center gap-3 text-xs font-bold text-slate-600 uppercase">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Valid for multiple sittings
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-indigo-600 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
               <Zap className="absolute -bottom-10 -right-10 w-64 h-64 text-white/5 rotate-12" />
               <div className="relative z-10">
                 <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-6 underline decoration-white/30 underline-offset-8">Registration Checklist</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                     {[
                       'Buy JAMB E-PIN (₦3,500)',
                       'Reading Text (₦1,000)',
                       'CBT Center Fee (₦700)',
                       'Total ≈ ₦7,200',
                       'Accredited CBT Centers ONLY'
                     ].map((item, i) => (
                       <div key={i} className="flex items-center gap-4 group">
                         <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-all">
                           <CheckCircle2 className="w-4 h-4 text-white" />
                         </div>
                         <span className="text-xs font-black uppercase tracking-widest">{item}</span>
                       </div>
                     ))}
                   </div>
                   <div className="bg-black/20 p-6 rounded-[2rem] border border-white/10">
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-indigo-200 italic">Critical Alert</p>
                     <p className="text-xs leading-relaxed font-medium">
                       Do not register at cyber cafes. Only use JAMB-Accredited Business Centres. Biometric verification is mandatory — no proxy fingerprinting allowed.
                     </p>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        );
      case 'structure':
        return (
          <div className="space-y-8">
             <header className="mb-10">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic underline decoration-blue-500 decoration-4 underline-offset-8 transition-all">Examination Architecture</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px] mt-4">The mechanical breakdown of the UTME 180-Question Framework.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { title: 'Use of English', q: 60, color: 'bg-indigo-600' },
                { title: 'Subject 2', q: 40, color: 'bg-slate-900' },
                { title: 'Subject 3', q: 40, color: 'bg-slate-900' },
                { title: 'Subject 4', q: 40, color: 'bg-slate-900' }
              ].map((item, i) => (
                <div key={i} className={`${item.color} p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden group`}>
                   <div className="absolute top-0 right-0 p-4 opacity-10">
                      <FileText className="w-10 h-10" />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Phase {i + 1}</p>
                   <h4 className="text-lg font-black italic tracking-tighter mb-4">{item.title}</h4>
                   <p className="text-4xl font-black italic">{item.q}</p>
                   <p className="text-[8px] font-black uppercase tracking-[0.3em] mt-1">Tactical Queries</p>
                </div>
              ))}
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-10">
               <div className="space-y-6 flex-1">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                     <Clock className="w-6 h-6 text-amber-600" />
                   </div>
                   <h3 className="text-2xl font-black text-slate-900 uppercase italic">Temporal Constraints</h3>
                 </div>
                 <p className="text-slate-600 text-sm leading-relaxed">
                   The system allows <span className="font-black text-slate-900">120 Minutes (2 Hours)</span> for all 180 questions. This translates to exactly <span className="font-black text-indigo-600">40 seconds per question</span>.
                 </p>
                 <div className="space-y-4">
                   {[
                     'No negative marking protocol applied',
                     '8-Key simple response interface',
                     'On-screen tactical calculator provided',
                     'Real-time count-down encryption enabled'
                   ].map((item, i) => (
                     <div key={i} className="flex items-center gap-3">
                       <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                       <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{item}</span>
                     </div>
                   ))}
                 </div>
               </div>
               <div className="w-full md:w-80 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
                  <Target className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-5xl font-black text-slate-900 tracking-tighter italic mb-2">180</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Strategic Prompts</p>
               </div>
            </div>
          </div>
        );
      case 'subjects':
        return (
          <div className="space-y-8">
            <header className="mb-10">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic underline decoration-purple-500 decoration-4 underline-offset-8 transition-all">Subject Hub</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px] mt-4">NUC Accredited Course-to-Subject combinations.</p>
            </header>

            <div className="relative mb-10">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 pointer-events-none" />
              <input 
                type="text"
                placeholder="Search Course (e.g. Medicine, Law, Engineering)..."
                value={subjectSearch}
                onChange={(e) => setSubjectSearch(e.target.value)}
                className="w-full pl-16 pr-8 py-6 bg-white border-2 border-slate-100 rounded-[2.5rem] text-sm font-black uppercase tracking-widest focus:outline-none focus:border-purple-500 transition-all shadow-sm italic"
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                {filteredCombinations.length} Results
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCombinations.map((comb, i) => (
                <motion.div 
                  key={comb.course}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity">
                    <comb.icon className="w-12 h-12" />
                  </div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all shrink-0">
                      <comb.icon className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-black text-slate-900 uppercase italic tracking-tighter leading-tight">{comb.course}</h4>
                  </div>
                  <div className="space-y-2">
                    {/* Compulsory English */}
                    <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-100 italic">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                        ★ Use of English
                      </span>
                      <span className="text-[8px] bg-indigo-100 text-indigo-600 px-2 py-1 rounded-lg font-black uppercase">Compulsory</span>
                    </div>
                    {/* Course Specific Subjects */}
                    {comb.subjects.map((sub, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 italic group-hover:bg-white transition-colors">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                          {sub}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredCombinations.length === 0 && (
              <div className="p-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                <Search className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                <p className="text-slate-400 font-black uppercase tracking-widest italic">Tactical query returned no matches.</p>
              </div>
            )}

            <div className="p-10 bg-slate-900 rounded-[3rem] text-white flex flex-col md:flex-row items-center gap-10">
               <div className="flex-1 space-y-4">
                 <h3 className="text-2xl font-black italic uppercase tracking-tighter underline decoration-white/20 underline-offset-8">Zero-Conflict Protocol</h3>
                 <p className="text-xs text-slate-400 leading-relaxed italic">
                   Candidates must verify their specific institutional requirements on the JAMB IBASS portal. While these combinations are standard NUC protocols, some universities may request specific technical electives.
                 </p>
               </div>
               <div className="w-full md:w-fit px-8 py-5 bg-indigo-600 rounded-2xl text-center shadow-2xl">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-1">Alert</p>
                 <p className="text-lg font-black italic tracking-tighter uppercase whitespace-nowrap">English is Fixed</p>
               </div>
            </div>
          </div>
        );
      case 'centers':
        return (
          <div className="space-y-8">
            <header className="mb-10">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic underline decoration-emerald-500 decoration-4 underline-offset-8 transition-all">CBT Hub & Exam Mode</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px] mt-4">The digitized environment of the modern UTME.</p>
            </header>

            <div className="space-y-6">
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex items-start gap-8">
                <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center shrink-0">
                  <Building2 className="w-10 h-10 text-emerald-600" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-slate-900 uppercase italic">Accredited CBT Centres</h3>
                  <p className="text-slate-600 text-sm leading-relaxed font-medium">
                    JAMB uses a strictly controlled network of over 700 Computer Based Test (CBT) centers nationwide. These centers are audited for:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      'Dual Power Backup Systems',
                      'Ultra-High Bandwidth LAN',
                      'Advanced CCTV Surveillance',
                      'Tactical Network Security',
                      'Air-conditioned Chambers',
                      'Standard Workstations'
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                        <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-10 rounded-[3rem] text-white grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                   <h4 className="text-xl font-black italic uppercase tracking-tighter mb-4 text-emerald-400 underline decoration-white/10 underline-offset-8">Examination Logistics</h4>
                   <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                         <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Mode of delivery</p>
                         <p className="text-sm font-bold">Closed-Circuit Tactical LAN Delivery (Non-Web Based)</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                         <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Slip Printing</p>
                         <p className="text-sm font-bold italic">7 Days Before Exam Day — Contains Date & Precise Node Location</p>
                      </div>
                   </div>
                </div>
                <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/10 flex flex-col justify-center items-center text-center">
                   <Target className="w-12 h-12 text-emerald-500 mb-4 animate-pulse" />
                   <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400">Tactical Readiness</p>
                   <p className="text-xs italic leading-relaxed text-slate-400 mt-2">
                     Arrive at your center 2 hours before your scheduled session. Verification starts 1 hour before lockout.
                   </p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'conduct':
        return (
          <div className="space-y-8">
            <header className="mb-10">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic underline decoration-rose-500 decoration-4 underline-offset-8 transition-all">Success Conduct: Dos & Don'ts</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px] mt-4">The mandatory ethical protocol for candidate integrity.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="bg-emerald-50 p-10 rounded-[3rem] border border-emerald-100">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-200">
                     <CheckCircle2 className="w-6 h-6" />
                   </div>
                   <h3 className="text-2xl font-black text-emerald-900 uppercase italic">The "Dos" Hub</h3>
                </div>
                <ul className="space-y-6">
                  {[
                    'Arrive 2 hours early for biometric validation',
                    'Dress modestly — Decent corporate or casual',
                    'Carry ONLY your original body and your Slip',
                    'Cross-check your subjects before the first click',
                    'Practice with EFADO CBT regularly before time'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-4 text-xs font-black text-emerald-900 uppercase tracking-tight">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-rose-50 p-10 rounded-[3rem] border border-rose-100">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-rose-200">
                     <XCircle className="w-6 h-6" />
                   </div>
                   <h3 className="text-2xl font-black text-rose-900 uppercase italic">Prohibited Protocols</h3>
                </div>
                <ul className="space-y-6">
                  {[
                    'NO Smart Watches, Phones, or Bluetooth Nodes',
                    'NO Ink Pens, Pencils, or Tactical Papers',
                    'NO External Calculators or Digital Loggers',
                    'NO Food, Drinks, or Personal Storage Units',
                    'NO Face Masks (Verification Lockout Applies)'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-4 text-xs font-black text-rose-900 uppercase tracking-tight">
                      <div className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-8 bg-amber-50 border border-amber-200 rounded-[2.5rem] flex items-center gap-6">
               <AlertCircle className="w-12 h-12 text-amber-600 shrink-0" />
               <div>
                  <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest mb-1">MANDATORY ATTIRE POLICY</h4>
                  <p className="text-xs italic font-medium text-amber-800">
                    Candidates must be fully identifiable. Face jewelry, heavy makeup, and baggy attire that can conceal items are discouraged for smooth biometric clearance.
                  </p>
               </div>
            </div>
          </div>
        );
      case 'admission':
        return (
          <div className="space-y-8">
            <header className="mb-10">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic underline decoration-orange-500 decoration-4 underline-offset-8 transition-all">The Admission Cycle</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px] mt-4">From results output to the matriculation oath.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <FileText className="w-10 h-10 text-indigo-500 mb-6" />
                <h4 className="text-lg font-black text-slate-900 uppercase mb-4">1. Result Phase</h4>
                <ul className="space-y-3">
                   <li className="text-[10px] font-black text-slate-600 uppercase">Check via SMS (UTMERESULT to 55019)</li>
                   <li className="text-[10px] font-black text-slate-600 uppercase">Print Original Result Slip (₦1,500)</li>
                </ul>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <Target className="w-10 h-10 text-orange-500 mb-6" />
                <h4 className="text-lg font-black text-slate-900 uppercase mb-4">2. Cut-Off Points</h4>
                <ul className="space-y-3">
                   <li className="text-[10px] font-black text-slate-600 uppercase">University Benchmark: 160+</li>
                   <li className="text-[10px] font-black text-slate-600 uppercase">Polytechnic Benchmark: 120+</li>
                   <li className="text-[10px] font-black text-slate-600 uppercase">COE Benchmark: 100+</li>
                </ul>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <ShieldCheck className="w-10 h-10 text-emerald-500 mb-6" />
                <h4 className="text-lg font-black text-slate-900 uppercase mb-4">3. JAMB CAPS</h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed italic">
                  Central Admissions Processing System (CAPS). Monitor status regularly. "Accept" or "Reject" offers.
                </p>
              </div>
            </div>

            <div className="bg-slate-900 p-10 rounded-[3rem] text-white">
               <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-8 underline decoration-white/20 underline-offset-8">Admission Determinants</h3>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { l: 'Merit', v: '45%', c: 'bg-emerald-500' },
                    { l: 'Catchment Area', v: '35%', c: 'bg-indigo-500' },
                    { l: 'ELDS', v: '20%', c: 'bg-amber-500' },
                    { l: 'Integrity', v: '100%', c: 'bg-rose-500' }
                  ].map((det, i) => (
                    <div key={i} className="p-6 bg-white/5 rounded-2xl border border-white/5">
                       <p className="text-[10px] font-black uppercase text-slate-400 mb-2">{det.l}</p>
                       <div className="flex items-center gap-3">
                          <div className={`h-2 w-12 ${det.c} rounded-full`} />
                          <span className="text-lg font-black italic">{det.v}</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        );
      case 'post_utme':
        return (
          <div className="space-y-8">
             <header className="mb-10">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic underline decoration-teal-500 decoration-4 underline-offset-8 transition-all">Post-UTME Protocol</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px] mt-4">The secondary screening gate at your choice institute.</p>
            </header>

            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
               <div className="flex flex-col md:flex-row gap-10 items-center">
                  <div className="w-32 h-32 bg-teal-50 rounded-[2.5rem] flex items-center justify-center shrink-0">
                     <GraduationCap className="w-16 h-16 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900 uppercase italic mb-4">Post-UTME Overview</h4>
                    <p className="text-slate-600 text-sm leading-relaxed mb-4">
                      Most prestigious universities conduct secondary screening or exams. Your JAMB score counts for 50%, Post-UTME for 30%, and O'Level for 20% (Traditional Model).
                    </p>
                    <div className="flex flex-wrap gap-2">
                       <span className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Aggregate Mapping</span>
                       <span className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest">School Portals</span>
                       <span className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest">Direct Entry Paths</span>
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-8 bg-slate-50 border border-slate-100 rounded-3xl">
                     <h5 className="font-black text-slate-900 uppercase mb-4 text-xs italic tracking-widest">Screening Modalities</h5>
                     <ul className="space-y-3">
                        <li className="flex items-center gap-3 text-xs font-bold text-slate-600">
                          <ChevronRight className="w-4 h-4 text-teal-500" /> Physical Document Verification
                        </li>
                        <li className="flex items-center gap-3 text-xs font-bold text-slate-600">
                          <ChevronRight className="w-4 h-4 text-teal-500" /> Computer-Based Post-UTME Entrance
                        </li>
                        <li className="text-[10px] text-slate-400 font-bold uppercase italic mt-4">*Check school website 4 weeks after UTME results.</li>
                     </ul>
                  </div>
                  <div className="p-8 bg-teal-600 rounded-3xl text-white">
                     <h5 className="font-black uppercase mb-4 text-xs italic tracking-widest">O'Level Upload Lock</h5>
                     <p className="text-xs leading-relaxed italic mb-4">
                       "Candidates MUST upload their O'Level results to the JAMB CAPS portal for admission consideration. Failure to link results = Automated Admission Exclusion."
                     </p>
                     <div className="flex items-center gap-2 text-[9px] font-black uppercase bg-white/10 w-fit px-3 py-1.5 rounded-lg">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-300" /> Mandatory Step
                     </div>
                  </div>
               </div>
            </div>
          </div>
        );
      case 'study_guide':
        return (
          <div className="space-y-8">
            <header className="mb-10">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic underline decoration-indigo-500 decoration-4 underline-offset-8 transition-all">Study Strategy & Syllabi</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px] mt-4">The academic blueprint for subject-specific mastery.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-6">
                  <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
                     <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                           <BookMarked className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h4 className="text-xl font-black text-slate-900 uppercase italic">Compulsory Reading</h4>
                     </div>
                     <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4 italic">Recommended Text 2026:</p>
                     <div className="bg-slate-900 p-6 rounded-2xl text-white">
                        <p className="text-lg font-black italic tracking-tighter">"The Life Changer"</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">By Khadija Abubakar Jalli</p>
                     </div>
                     <p className="text-[10px] text-slate-500 font-bold uppercase italic mt-4 leading-relaxed">
                        Expected Questions: 10-15 prompts strictly from this text in the Use of English section.
                     </p>
                  </div>

                  <div className="bg-indigo-50 p-8 rounded-[3rem] border border-indigo-100">
                     <h4 className="text-lg font-black text-indigo-900 uppercase italic mb-6">Strategic Study Nodes</h4>
                     <div className="space-y-4">
                        {[
                          'English: Focus on Lexis & Structure, Oral Forms',
                          'Biology: Heredity, Ecology, Diversity of Living Things',
                          'Maths: Number Bases, Logarithms, Calculus',
                          'Chemistry: Atomic Structure, Organic Bonds'
                        ].map((node, i) => (
                          <div key={i} className="flex gap-4 items-start">
                             <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5" />
                             <p className="text-[11px] font-black text-indigo-950 uppercase tracking-tight">{node}</p>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="bg-slate-950 p-8 rounded-[3rem] text-white relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-6 opacity-10">
                        <Target className="w-16 h-16" />
                     </div>
                     <h4 className="text-xl font-black italic uppercase tracking-tighter mb-6 text-indigo-400 underline decoration-white/20 underline-offset-8">CBT Practice Importance</h4>
                     <p className="text-xs leading-relaxed font-medium italic mb-8">
                        "Familiarity with the interface is 30% of the battle. Use the EFADO CBT Simulator to automate your response rhythm. Training reduces exam-day anxiety and maximizes terminal efficiency."
                     </p>
                     <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4">
                        <Award className="w-8 h-8 text-amber-500 shrink-0" />
                        <div>
                           <p className="text-[10px] font-black uppercase text-indigo-200">Recommended Daily Drill</p>
                           <p className="text-[10px] font-bold text-white uppercase italic">2 Practice Sessions Minimum (Master Mode)</p>
                        </div>
                     </div>
                  </div>

                  <button className="w-full py-6 bg-white border-2 border-slate-900 rounded-[2.5rem] flex items-center justify-between px-10 group hover:bg-slate-900 transition-all active:scale-95">
                     <div className="text-left">
                        <p className="text-[10px] font-black uppercase text-slate-400 group-hover:text-indigo-400 transition-colors">Digital Syllabus</p>
                        <p className="text-sm font-black uppercase italic tracking-tighter text-slate-900 group-hover:text-white transition-colors">Download PDF Syllabus</p>
                     </div>
                     <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-white group-hover:translate-x-2 transition-all" />
                  </button>
               </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-slate-50 flex"
    >
      {/* Sidebar Navigation */}
      <div className="w-80 bg-white border-r border-slate-200 p-8 flex flex-col justify-between shrink-0 animate-fade-in">
        <div>
          <button 
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 mb-6 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-95 hover:shadow-indigo-100"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-400 animate-pulse" /> Cancel & Go Back
          </button>
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-black text-xl text-slate-900 tracking-tighter uppercase italic leading-none">JAMB Guide</h1>
              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-1">Tactical Edition 2026</p>
            </div>
          </div>

          <nav className="space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  activeSection === section.id 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <section.icon className="w-5 h-5" />
                {section.title}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6 bg-slate-950 rounded-[2rem] text-white">
          <p className="text-[10px] font-black uppercase text-indigo-400 mb-2 italic">Support Protocol</p>
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Hub Counselors Online</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-12 bg-slate-50/50">
        <div className="max-w-5xl mx-auto pb-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Close Button Overlay */}
      <div className="fixed top-8 right-8 flex items-center gap-4">
        <button 
          onClick={onClose}
          className="p-4 bg-white border border-slate-200 rounded-full text-slate-900 shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center gap-3 font-black text-xs uppercase tracking-widest"
        >
          <X className="w-6 h-6" /> Close Portal
        </button>
      </div>

      <div className="fixed bottom-0 left-80 right-0 h-40 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </motion.div>
  );
};
