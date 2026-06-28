import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Trophy, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  Settings, 
  HelpCircle,
  Play,
  RotateCcw,
  Keyboard,
  Info,
  Timer,
  Award,
  Book,
  ArrowRight,
  PlayCircle,
  FileText,
  Target,
  Zap,
  Infinity as InfinityIcon,
  FlaskConical,
  PenTool,
  Video,
  ShieldAlert,
  DollarSign,
  Mic,
  Camera,
  Coins,
  ShieldCheck,
  Users,
  Plus,
  Lock,
  Unlock,
  Share2,
  Send,
  Calendar,
  UserCheck,
  LogOut,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PaymentPlatform } from '../PaymentPlatform';
import { EfadoZoom } from '../EfadoZoom';
import { UserProfile } from '../../types';

import { EXAM_DATA, ExamCategory, Subject, Question } from '../../data/examData';

// --- Types ---
interface UserAnswers {
  [subjectId: string]: {
    [questionIndex: number]: number; // option index
  };
}

type Mode = 'beginner' | 'master';

// --- Mock Data ---
// Subjects moved to src/data/jambQuestions.ts

// --- Sub-components ---

const KeyboardShortcutsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl relative"
        >
          <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white">
            <XCircle className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
              <Keyboard className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tighter italic">Tactical Nav Shortcuts</h3>
          </div>

          <div className="space-y-4">
            {[
              { keys: "A, B, C, D", desc: "Select corresponding option" },
              { keys: "N", desc: "Next Question" },
              { keys: "P", desc: "Previous Question" },
              { keys: "S", desc: "Submit Examination" },
              { keys: "1, 2, 3, 4", desc: "Switch Subject Hub" }
            ].map((shortcut, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-xs font-bold text-slate-400">{shortcut.desc}</span>
                <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black text-indigo-400 border border-white/10 uppercase">{shortcut.keys}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={onClose}
            className="w-full mt-8 py-4 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-500 transition-all"
          >
            Acknowledge Protocols
          </button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const ExamSimulator: React.FC<{ 
  onClose: () => void; 
  initialView?: 'mode' | 'seminar'; 
  user?: UserProfile;
  examType?: ExamCategory;
}> = ({ onClose, initialView = 'mode', user, examType = 'JAMB' }) => {
  const currentExamConfig = EXAM_DATA[examType];
  const SIMULATOR_NAME = `EFADO ${examType}`;
  const subjectsPool = currentExamConfig.subjects;
  
  const [startTime, setStartTime] = useState<number | null>(null);
  const [view, setView] = useState<'mode' | 'seminar' | 'subjects' | 'instructions' | 'exam' | 'results' | 'corrections'>(initialView);
  const [seminarSubView, setSeminarSubView] = useState<'PRESENTATION' | 'MATERIALS' | 'AGENDA'>('PRESENTATION');
  const [agendaText, setAgendaText] = useState('');
  const [uploadedMaterials, setUploadedMaterials] = useState<{name: string, type: string, size: string}[]>(() => {
    const saved = localStorage.getItem('efado_uploaded_materials');
    return saved ? JSON.parse(saved) : [
      { name: 'EFADO_JAMB_Tactical_Briefing_Package.pdf', type: 'PDF', size: '4.8 MB' },
      { name: 'JAMB_Speed_Dominance_Algorithms.pptx', type: 'PPTX', size: '12.4 MB' },
      { name: 'CBT_Interface_Shortcut_Memorization_Grid.xlsx', type: 'Excel', size: '1.2 MB' },
    ];
  });
  const [isRegisteredForWebinar, setIsRegisteredForWebinar] = useState(() => {
    return localStorage.getItem(`efado_webinar_registered_${examType}`) === 'true';
  });
  const [isUserVerified, setIsUserVerified] = useState(() => {
    return localStorage.getItem('efado_user_verified') !== 'false'; // defaults to true for login but can toggle
  });
  const [isWebinarLive, setIsWebinarLive] = useState(false);
  const [webinarCountdown, setWebinarCountdown] = useState(124); // 2 mins warning
  const [referralCode, setReferralCode] = useState(() => {
    return 'EFADO-' + Math.random().toString(36).substr(2, 5).toUpperCase();
  });
  const [referralsCount, setReferralsCount] = useState(() => {
    return Math.floor(Math.random() * 4);
  });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showGuestWarning, setShowGuestWarning] = useState(false);
  const [credentialsCode, setCredentialsCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('efado_uploaded_materials', JSON.stringify(uploadedMaterials));
  }, [uploadedMaterials]);

  useEffect(() => {
    localStorage.setItem(`efado_webinar_registered_${examType}`, isRegisteredForWebinar ? 'true' : 'false');
  }, [isRegisteredForWebinar, examType]);

  useEffect(() => {
    localStorage.setItem('efado_user_verified', isUserVerified ? 'true' : 'false');
  }, [isUserVerified]);

  // Countdown ticking effect
  useEffect(() => {
    const timer = setInterval(() => {
      setWebinarCountdown(prev => {
        if (prev <= 1) {
          setIsWebinarLive(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (sec: number) => {
    if (sec <= 0) return "Webinar is active & streaming!";
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleVerifyCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentialsCode.trim()) {
      setVerificationError("Verification code or email cannot be empty.");
      return;
    }
    setIsUserVerified(true);
    setVerificationError('');
    alert("Credentials verified successfully! Access status updated to VERIFIED.");
  };

  const handleSimulatedDownload = (fileName: string) => {
    if (!isUserVerified) {
      setShowGuestWarning(true);
      return;
    }
    if (!isRegisteredForWebinar) {
      alert("Please upgrade to custom strategic duration plan to unlock study materials.");
      return;
    }
    setDownloadSuccessToast(`Secure Link Generated: Downloading ${fileName}...`);
    setTimeout(() => {
      setDownloadSuccessToast(null);
    }, 4000);
  };

  const [showBooking, setShowBooking] = useState(false);
  const [selectedTier, setSelectedTier] = useState<any>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showZoomHub, setShowZoomHub] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newMaterials = Array.from(files).map(file => ({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        type: file.type.split('/')[1].toUpperCase() || 'FILE'
      }));
      setUploadedMaterials(prev => [...prev, ...newMaterials]);
    }
  };

  const handleLockAgenda = () => {
    alert("Tactical Agenda Locked & Encrypted. Deployment protocols updated.");
  };

  const pricingTiers = [
    { duration: "30 Minutes", price: 1000, color: "bg-emerald-600", light: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400" },
    { duration: "60 Minutes", price: 2000, color: "bg-indigo-600", light: "bg-indigo-500/10", border: "border-indigo-500/30", text: "text-indigo-400" },
    { duration: "1.5 Hours", price: 3000, color: "bg-blue-600", light: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" },
    { duration: "2 Hours", price: 4000, color: "bg-purple-600", light: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400" },
    { duration: "3 Hours", price: 5000, color: "bg-rose-600", light: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400" },
  ];

  const handleJoinWebinar = () => {
    setShowZoomHub(true);
  };

  const handleSelectTier = (tier: any) => {
    setSelectedTier(tier);
    setShowPayment(true);
  };
  const [mode, setMode] = useState<Mode>('beginner');
  const [isMasterPaid, setIsMasterPaid] = useState(false);
  const [showMasterPayment, setShowMasterPayment] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswerStatus, setLastAnswerStatus] = useState<{ isCorrect: boolean; explanation: string } | null>(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(['english']); // English is compulsory
  const [currentExamSubjects, setCurrentExamSubjects] = useState<Subject[]>([]);
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [timeLeft, setTimeLeft] = useState(7200); // 2 hours for 4 subjects
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const renderSimulatorHeader = (currentView: string) => {
    const handleGoBack = () => {
      if (currentView === 'mode') {
        onClose();
      } else if (currentView === 'seminar') {
        setView('mode');
      } else if (currentView === 'subjects') {
        setView('mode');
      } else if (currentView === 'instructions') {
        setView('subjects');
      } else if (currentView === 'exam') {
        if (window.confirm("Are you sure you want to abort the current examination session? Your answers will not be saved.")) {
          setView('subjects');
        }
      } else if (currentView === 'results') {
        setView('mode');
      } else if (currentView === 'corrections') {
        setView('results');
      }
    };

    return (
      <div className="w-full bg-slate-900/60 backdrop-blur-2xl border border-white/5 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 rounded-3xl shadow-xl z-50">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={handleGoBack}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-slate-100 hover:text-white hover:bg-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 active:scale-95 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-indigo-400" />
            <span>Go Back</span>
          </button>
          
          <span className="text-slate-650 hidden sm:inline">|</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
            {currentView === 'mode' && 'CBT Main Terminal'}
            {currentView === 'seminar' && 'Strategy Seminar'}
            {currentView === 'subjects' && 'Subject Configuration'}
            {currentView === 'instructions' && 'Protocol Brief'}
            {currentView === 'exam' && 'Live Examination Grid'}
            {currentView === 'results' && 'Evaluation Report'}
            {currentView === 'corrections' && 'Review Solutions'}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-650 hover:bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-500/20 active:scale-95 transition-all cursor-pointer shadow-lg shadow-rose-600/10"
          >
            <XCircle className="w-4 h-4 text-rose-200" />
            <span>Cancel / Exit CBT</span>
          </button>
        </div>
      </div>
    );
  };

  // --- Handlers ---

  const handleStartExam = () => {
    const subjects = subjectsPool.filter(s => selectedSubjectIds.includes(s.id)).map(s => {
      // Logic for question count based on mode
      // Beginner: 20 per subject
      // Master: JAMB Structure (60 for English, 40 for others)
      const targetCount = mode === 'beginner' ? 20 : (s.id === 'english' ? 60 : 40);
      
      // Shuffle and slice
      const shuffledQuestions = [...s.questions].sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffledQuestions.slice(0, Math.min(targetCount, shuffledQuestions.length));
      
      return {
        ...s,
        questions: selectedQuestions
      };
    });

    setCurrentExamSubjects(subjects);
    setView('exam');
    setStartTime(Date.now());
    // Beginner: 30 mins (1800s), Master: 2 hours (7200s)
    setTimeLeft(mode === 'beginner' ? 1800 : 7200); 
    setIsAutoSubmitting(false);
    setShowFeedback(false);
    setLastAnswerStatus(null);
    
    // Initial answers structure
    const initialAnswers: UserAnswers = {};
    subjects.forEach(s => {
      initialAnswers[s.id] = {};
    });
    setUserAnswers(initialAnswers);
  };

  const handleModeSelect = (m: Mode) => {
    setMode(m);
    if (m === 'master' && !isMasterPaid) {
      setShowMasterPayment(true);
    } else {
      setView('subjects');
    }
  };

  const toggleSubject = (sid: string) => {
    if (sid === 'english') return; // Cannot deselect english
    if (selectedSubjectIds.includes(sid)) {
      setSelectedSubjectIds(prev => prev.filter(id => id !== sid));
    } else if (selectedSubjectIds.length < 4) {
      setSelectedSubjectIds(prev => [...prev, sid]);
    }
  };

  const handleAnswer = (optionIdx: number) => {
    if (showFeedback) return; // Prevent double answering in feedback mode

    const activeSubject = currentExamSubjects[currentSubjectIndex];
    const activeQuestion = activeSubject.questions[currentQuestionIndex];
    const activeSubjectId = activeSubject.id;

    setUserAnswers(prev => ({
      ...prev,
      [activeSubjectId]: {
        ...prev[activeSubjectId],
        [currentQuestionIndex]: optionIdx
      }
    }));

    if (mode === 'beginner') {
      setLastAnswerStatus({
        isCorrect: optionIdx === activeQuestion.correctAnswer,
        explanation: activeQuestion.explanation || "Detailed analysis not available for this unit."
      });
      setShowFeedback(true);
    }
  };

  const nextQuestion = useCallback(() => {
    const activeSubject = currentExamSubjects[currentSubjectIndex];
    if (currentQuestionIndex < activeSubject.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentSubjectIndex < currentExamSubjects.length - 1) {
      setCurrentSubjectIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
    }
  }, [currentExamSubjects, currentSubjectIndex, currentQuestionIndex]);

  const prevQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (currentSubjectIndex > 0) {
      setCurrentSubjectIndex(prev => prev - 1);
      const prevSubject = currentExamSubjects[currentSubjectIndex - 1];
      setCurrentQuestionIndex(prevSubject.questions.length - 1);
    }
  }, [currentExamSubjects, currentSubjectIndex, currentQuestionIndex]);

  // --- Timer Effect ---
  useEffect(() => {
    if (view === 'exam' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsAutoSubmitting(true);
            setTimeout(() => {
              setView('results');
              setIsAutoSubmitting(false);
            }, 3000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [view, timeLeft]);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      if (showFeedback && (key === 'enter' || key === ' ')) {
        e.preventDefault();
        setShowFeedback(false);
        nextQuestion();
        return;
      }

      if (view !== 'exam' || showFeedback) return;
      if (['a', 'b', 'c', 'd'].includes(key)) {
        const optionMap: { [key: string]: number } = { a: 0, b: 1, c: 2, d: 3 };
        handleAnswer(optionMap[key]);
      } else if (key === 'n') {
        nextQuestion();
      } else if (key === 'p') {
        prevQuestion();
      } else if (key === 's') {
        setIsSubmitModalOpen(true);
      } else if (['1', '2', '3', '4'].includes(key)) {
        const idx = parseInt(key) - 1;
        if (idx < currentExamSubjects.length) {
          setCurrentSubjectIndex(idx);
          setCurrentQuestionIndex(0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, handleAnswer, nextQuestion, prevQuestion, currentExamSubjects.length]);

  // --- Render Helpers ---

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h.toString().padStart(2, '0') + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const calculateScore = () => {
    const maxScore = 400; // JAMB standard max
    let correctCount = 0;
    let totalQuestions = 0;
    const subjectScores: { [name: string]: { correct: number; total: number; score: number } } = {};

    currentExamSubjects.forEach(subject => {
      const answers = userAnswers[subject.id] || {};
      let subCorrect = 0;
      const subTotal = subject.questions.length;

      subject.questions.forEach((q, idx) => {
        totalQuestions++;
        if (answers[idx] === q.correctAnswer) {
          correctCount++;
          subCorrect++;
        }
      });
      
      // JAMB sub-score (scale to 100 for each subject)
      const subPercentage = subTotal > 0 ? subCorrect / subTotal : 0;
      subjectScores[subject.name] = { 
        correct: subCorrect, 
        total: subTotal,
        score: Math.round(subPercentage * 100)
      };
    });

    const totalScore = Object.values(subjectScores).reduce((acc, curr) => acc + curr.score, 0);
    return { totalScore, correctCount, totalQuestions, subjectScores };
  };

  // --- Views ---

  if (view === 'mode') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#0F172A] p-6 flex flex-col items-center justify-start overflow-y-auto">
        <div className="max-w-4xl w-full pt-4">
          {renderSimulatorHeader('mode')}
          <div className="text-center mb-12 mt-4">
            <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/20 rotate-12">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-black text-white italic tracking-tighter mb-4">{SIMULATOR_NAME}</h1>
            <p className="text-slate-400 uppercase tracking-[0.3em] font-black text-xs">Tactical Examination Simulator</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.button 
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => setView('seminar')}
              className="p-10 bg-emerald-600/10 border-2 border-emerald-500/20 rounded-[3rem] text-left hover:border-emerald-500/50 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6">
                <PlayCircle className="w-12 h-12 text-emerald-500/20" />
              </div>
              <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                <PlayCircle className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter italic">{examType} Seminar</h3>
              <p className="text-emerald-200/50 text-sm font-medium leading-relaxed mb-6">Professional presentation on UTME success strategies, time management, and tactical academic deployment.</p>
              <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                Watch Presentation <ArrowRight className="w-4 h-4" />
              </div>
            </motion.button>

            <motion.button 
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => handleModeSelect('beginner')}
              className="p-10 bg-white/5 border-2 border-white/5 rounded-[3rem] text-left hover:border-indigo-500/50 transition-all group"
            >
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
                <Play className="w-7 h-7 text-indigo-400 group-hover:text-white" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter italic">Beginner Mode</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">Free practice session. 20 questions per subject in 30 minutes. Features instant tactical explanations for each response cycle.</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                  Deploy Practice <ArrowRight className="w-4 h-4" />
                </div>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase rounded-lg border border-emerald-500/20">Free</span>
              </div>
            </motion.button>

            <motion.button 
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => handleModeSelect('master')}
              className="p-10 bg-indigo-600/10 border-2 border-indigo-500/20 rounded-[3rem] text-left hover:border-indigo-500/50 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-14 p-6">
                <DollarSign className="w-8 h-8 text-indigo-500/40" />
              </div>
              <div className="absolute top-0 right-0 p-6">
                <Award className="w-12 h-12 text-indigo-500/20" />
              </div>
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter italic">Master Mode</h3>
              <p className="text-indigo-200/50 text-sm font-medium leading-relaxed mb-6">Premium Simulation (Paid). Standard JAMB protocol (2 hours, full question load). Deploy for elite readiness.</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                  Paid Strike Operation <ArrowRight className="w-4 h-4" />
                </div>
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-[8px] font-black uppercase rounded-lg border border-indigo-500/20">₦4,000</span>
              </div>
            </motion.button>
          </div>

          <button 
            onClick={onClose}
            className="mt-12 w-full py-4 text-slate-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest"
          >
            ABORT MISSION
          </button>
        </div>

        <AnimatePresence>
          {showMasterPayment && user && (
            <PaymentPlatform
              user={user}
              type="deposit"
              amount={4000}
              purpose="JAMB Master Mode Full Deployment"
              hub="EDUCATION"
              onComplete={async () => {
                setIsMasterPaid(true);
                setShowMasterPayment(false);
                setView('subjects');
              }}
              onSuccess={() => {
                setIsMasterPaid(true);
                setShowMasterPayment(false);
                setView('subjects');
              }}
              onClose={() => setShowMasterPayment(false)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  if (view === 'seminar') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#0F172A] p-4 md:p-8 flex flex-col items-center overflow-y-auto no-scrollbar relative">
        
        {/* Toast Notification */}
        <AnimatePresence>
          {downloadSuccessToast && (
            <motion.div 
              initial={{ opacity: 0, y: -50 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-6 z-[1000] px-6 py-4 bg-emerald-600 text-white rounded-2xl shadow-2xl border border-emerald-400/30 text-xs font-black uppercase tracking-widest flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-white" />
              {downloadSuccessToast}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-5xl w-full">
          {renderSimulatorHeader('seminar')}
          
          {/* Top Banner: Verification Status & Access Level Control */}
          <div className="mb-8 p-4 rounded-3xl bg-slate-900/40 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isUserVerified ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500 animate-bounce'}`} />
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Access Authenticator: </span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${isUserVerified ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isUserVerified ? `VERIFIED STUDENT (${user?.email || 'EFADO-CANDIDATE'})` : 'GUEST STATUS (LIMITED TRIAL)'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowGuideModal(true)}
                className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
              >
                Candidate Operational Guide
              </button>
              
              {isUserVerified ? (
                <button 
                  onClick={() => setIsUserVerified(false)}
                  className="px-4 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  Continue As Guest
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-white/5">
                  <input 
                    type="text" 
                    placeholder="Enter Student PIN or Email..." 
                    value={credentialsCode}
                    onChange={(e) => setCredentialsCode(e.target.value)}
                    className="bg-transparent border-none text-[10px] font-black text-white uppercase placeholder:text-slate-700 w-44 tracking-widest focus:ring-0 p-1"
                  />
                  <button 
                    onClick={(e) => {
                      setIsUserVerified(true);
                      alert("Webinar Student Credentials Authorized! Full access granted.");
                    }}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    Verify PIN
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Countdown & Live Status Block */}
          <div className="mb-10 w-full p-8 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-500/20 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-600/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                <Clock className="w-7 h-7 text-indigo-400 animate-spin" style={{ animationDuration: '60s' }} />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest text-[#a5b4fc] uppercase">EFADO LIVE WEBINAR POOL</span>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter mt-1">
                  {isWebinarLive ? 'STATION STREAM IS ONLINE' : 'Strategic Broadcast Briefing Pending'}
                </h3>
              </div>
            </div>

            <div className="text-center md:text-right">
              {isWebinarLive ? (
                <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/30 px-5 py-3 rounded-2xl text-emerald-400 uppercase text-[10px] font-black tracking-widest">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" /> Live Streaming Active!
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Countdown to Live Segment</p>
                  <p className="text-3xl font-mono font-black text-indigo-300 tracking-wider">
                    {formatCountdown(webinarCountdown)}
                  </p>
                  <button 
                    onClick={() => {
                      setIsWebinarLive(true);
                      setWebinarCountdown(0);
                    }}
                    className="text-[8px] font-black text-emerald-400 hover:text-emerald-300 uppercase underline tracking-widest block text-right w-full"
                  >
                    (Simulate Countdown Trigger Done)
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setView('mode')}
                className="p-3 bg-white/5 border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">{currentExamConfig.seminarTitle}</h2>
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] flex items-center gap-2">
                  <ShieldAlert className="w-3 h-3" /> Strategic Success Protocols Active
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-900 border border-white/5 p-1.5 rounded-2xl">
              <button 
                onClick={() => setSeminarSubView('PRESENTATION')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${seminarSubView === 'PRESENTATION' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}
              >
                Presentation
              </button>
              <button 
                onClick={() => setSeminarSubView('AGENDA')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${seminarSubView === 'AGENDA' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}
              >
                Agenda
              </button>
              <button 
                onClick={() => setSeminarSubView('MATERIALS')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${seminarSubView === 'MATERIALS' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}
              >
                Materials
              </button>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <AnimatePresence>
                {isRegisteredForWebinar ? (
                  <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={handleJoinWebinar}
                    className="px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
                  >
                    <Video className="w-4 h-4" /> Join Live EFADO Zoom Terminal
                  </motion.button>
                ) : (
                  <div className="hidden md:flex items-center gap-3 px-6 py-3 bg-rose-600/10 border border-rose-500/25 rounded-2xl">
                    <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-lg shadow-rose-500/50" />
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest italic">Duration Selection Required</span>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-2 space-y-12">
              {seminarSubView === 'PRESENTATION' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-12"
                >
                  {/* Slide 1 */}
                  <section className="bg-slate-900/50 border border-white/5 rounded-[3rem] p-12 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-[100px] -mr-32 -mt-32 transition-transform group-hover:scale-125 duration-1000" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                          <Target className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">01. Tactical Objectives</h3>
                      </div>
                      <div className="space-y-6">
                        <p className="text-lg text-slate-300 leading-relaxed font-medium">
                          Success in {examType} is not merely about knowledge; it is about <span className="text-white font-bold italic">Tactical Deployment</span>. You are competing against time, pressure, and the digital terminal itself. Master these keys to unlock your potential.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-6 bg-slate-950 rounded-2xl border border-white/5 shadow-2xl">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Core Performance indicators</h4>
                            {[
                              { l: "Tactical Speed", v: "60s / Question" },
                              { l: "Precision Rate", v: "90% Targeted" },
                              { l: "Mental Focus", v: "High Frequency" }
                            ].map((idx, i) => (
                              <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-xl mb-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{idx.l}</span>
                                <span className="text-[10px] font-black text-white">{idx.v}</span>
                              </div>
                            ))}
                          </div>
                          <div className="p-6 bg-indigo-600/10 rounded-2xl border border-indigo-500/20 flex flex-col justify-center text-center">
                            <p className="text-sm text-indigo-200 font-bold italic mb-2">"preparation is the engine, but strategy is the fuel."</p>
                            <div className="h-1 w-12 bg-indigo-500 mx-auto rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Slide 2 */}
                  <section className="bg-slate-900/50 border border-white/5 rounded-[3rem] p-12 relative overflow-hidden group">
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/5 rounded-full blur-[100px] -ml-32 -mb-32 transition-transform group-hover:scale-125 duration-1000" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                          <Clock className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">02. Temporal Domination</h3>
                      </div>
                      <div className="space-y-8">
                        <p className="text-lg text-slate-300 leading-relaxed font-medium">
                          The {examType} clock is a psychological weapon. Master your internal rhythm to neutralize its effect and dominate the exam's temporal field.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            { t: "English Hub", d: "40 Mins", p: "33%" },
                            { t: "Electives", d: "25 Mins ea.", p: "20%" },
                            { t: "The Sweep", d: "5 Mins", p: "4%" }
                          ].map((box, i) => (
                            <div key={i} className="p-6 bg-slate-950 border border-white/5 rounded-3xl text-center hover:border-emerald-500/30 transition-all">
                              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{box.t}</h4>
                              <p className="text-2xl font-black text-white tracking-tighter italic mb-1">{box.d}</p>
                              <div className="text-[8px] font-black text-emerald-500 uppercase tracking-wider">Tactical Allocation: {box.p}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Slide 3 */}
                  <section className="bg-slate-900/50 border border-white/5 rounded-[3rem] p-12 relative overflow-hidden group">
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
                          <Keyboard className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">03. Interface Proficiency</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <p className="text-slate-300 font-medium leading-relaxed">
                            Your peripheral interface determines your output speed. Learn the keyboard shortcuts to reduce mouse-latency and keep your focus on the data field.
                          </p>
                          <div className="space-y-2">
                            {[
                              { k: "A, B, C, D", v: "Option Selection" },
                              { k: "N & P", v: "Navigation Command" },
                              { k: "S", v: "Submit System" }
                            ].map((kb, i) => (
                              <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all group/key">
                                <span className="text-[10px] font-black text-indigo-400 tracking-widest group-hover/key:text-white transition-colors">{kb.k}</span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{kb.v}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
                          <Zap className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 rotate-45" />
                          <h4 className="text-[10px] font-black uppercase tracking-widest mb-6 border-b border-white/20 pb-4">Strategy: The Skip Protocol</h4>
                          <p className="text-xs font-medium leading-relaxed italic mb-8 relative z-10">
                            "Never invest more than 90 seconds in a single prompt. If it resists analysis, tag it for the 'Final Sweep' and maintain tactical momentum. Your subconscious will process the pattern in the background."
                          </p>
                          <div className="flex items-center gap-3 text-[8px] font-black uppercase tracking-widest bg-white/10 w-fit px-4 py-2 rounded-full backdrop-blur-sm">
                            <Zap className="w-3 h-3 text-amber-400" /> High Velocity Only
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </motion.div>
              )}

              {seminarSubView === 'AGENDA' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <section className="bg-slate-900/50 border border-white/5 rounded-[3rem] p-12">
                    <div className="flex items-center gap-4 mb-8">
                       <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                         <Settings className="w-6 h-6" />
                       </div>
                       <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Seminar Agenda Formulation</h3>
                    </div>
                    <div className="space-y-6">
                      <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Type your tactical agenda for the {examType} seminar here.</p>
                      <textarea 
                        value={agendaText}
                        onChange={(e) => setAgendaText(e.target.value)}
                        placeholder="1. Introduction to EFADO CBT Protocols&#10;2. Master vs Beginner Mode Dynamics&#10;3. Subject-Specific Tactical Deployment&#10;4. Q&A Session..."
                        className="w-full h-80 bg-slate-950 border border-white/10 rounded-3xl p-8 text-white font-mono text-sm focus:ring-2 focus:ring-indigo-600 transition-all placeholder:opacity-30"
                      />
                      <div className="flex justify-end">
                        <button 
                          onClick={handleLockAgenda}
                          className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all"
                        >
                          Lock Agenda Protocol
                        </button>
                      </div>
                    </div>
                  </section>
                </motion.div>
              )}

              {seminarSubView === 'MATERIALS' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <section className="bg-slate-900/50 border border-white/5 rounded-[3rem] p-12">
                    <div className="flex items-center gap-4 mb-8">
                       <div className="w-12 h-12 bg-rose-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-rose-500/20">
                         <FileText className="w-6 h-6" />
                       </div>
                       <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Strategic Materials Hub</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        multiple 
                        className="hidden" 
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-10 bg-slate-950 border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center group hover:border-indigo-600/50 transition-all"
                      >
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Plus className="w-8 h-8 text-slate-500 group-hover:text-indigo-400" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Tactical Resources</span>
                      </button>
                      
                      <div className="p-8 bg-indigo-600/5 border border-indigo-500/20 rounded-[2.5rem] flex flex-col justify-center">
                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Supported Protocals</h4>
                        <ul className="space-y-3">
                          {['PDF Study Guides', 'Slide Decks (PPTX)', 'Video Briefings (MP4)', 'Excel Trackers'].map((type, i) => (
                            <li key={i} className="flex items-center gap-3 text-[10px] font-black text-white uppercase tracking-tighter">
                              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" /> {type}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-4">
                       <div className="flex items-center justify-between px-1">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Deployed Materials</h4>
                          <span className={`text-[9px] font-black uppercase tracking-widest ${isRegisteredForWebinar ? 'text-emerald-400' : 'text-amber-500'}`}>
                            {isRegisteredForWebinar ? '✓ All Resources Unlocked' : '🔒 Registered Duration Access Only'}
                          </span>
                       </div>
                       {uploadedMaterials.length === 0 ? (
                         <div className="py-20 text-center bg-slate-950 rounded-[2.5rem] border border-white/5">
                            <BookOpen className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">No materials deployed yet.</p>
                         </div>
                       ) : (
                         <div className="space-y-3">
                            {uploadedMaterials.map((mat, i) => (
                              <div key={i} className="p-6 bg-slate-950 border border-white/5 rounded-3xl flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                                <div className="flex items-center gap-6">
                                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400 font-black text-[10px]">
                                    {mat.type}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-black text-white italic tracking-tighter mb-1">{mat.name}</p>
                                      {!isRegisteredForWebinar && <Lock className="w-3.5 h-3.5 text-rose-500" />}
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{mat.size}</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => setUploadedMaterials(prev => prev.filter((_, idx) => idx !== i))}
                                  className="p-3 text-slate-600 hover:text-rose-500 transition-colors"
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                              </div>
                            ))}
                         </div>
                       )}
                    </div>
                  </section>
                </motion.div>
              )}
            </div>

            {/* Live Webinar Booking Sidebar */}
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-900/80 border-2 border-indigo-500/20 rounded-[3rem] p-8 sticky top-6 shadow-2xl backdrop-blur-xl"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Live Session</h3>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Connect to Zoom Hub</p>
                  </div>
                </div>

                {!isRegisteredForWebinar ? (
                  <div className="space-y-6">
                    <p className="text-xs text-slate-400 font-bold leading-relaxed uppercase tracking-wider italic">
                      Upgrade to a live interactive webinar to access the elite tactical briefing with real-time analysis.
                    </p>
                    
                    <div className="space-y-3">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Tactical Duration Plans</p>
                      {pricingTiers.map((tier, i) => (
                        <motion.button
                          key={i}
                          whileHover={{ x: 5 }}
                          onClick={() => handleSelectTier(tier)}
                          className={`w-full p-4 rounded-2xl flex items-center justify-between border-2 transition-all group ${tier.light} ${tier.border} hover:border-indigo-500/50`}
                        >
                          <div className="text-left">
                            <p className="text-[10px] font-black text-white uppercase tracking-tighter">{tier.duration}</p>
                            <p className={`text-[8px] font-black uppercase tracking-widest opacity-60 ${tier.text}`}>Live Strategic Access</p>
                          </div>
                          <div className="text-right">
                             <p className="text-sm font-black text-white italic">₦{tier.price.toLocaleString()}</p>
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3 mb-3">
                         <ShieldCheck className="w-4 h-4 text-emerald-400" />
                         <span className="text-[10px] font-black text-white uppercase tracking-widest">EFADO Verified</span>
                      </div>
                      <p className="text-[8px] text-slate-500 font-bold leading-relaxed uppercase italic">
                        Access codes are automatically synchronized to your account upon tactical validation of payment.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8 py-4">
                    <div className="text-center p-8 bg-emerald-600/10 border-2 border-emerald-500/20 rounded-[2.5rem] relative overflow-hidden">
                       <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                       <h4 className="text-lg font-black text-white italic uppercase tracking-tighter">Status: Active</h4>
                       <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Presence Intelligence Activated</p>
                    </div>

                    <button 
                      onClick={handleJoinWebinar}
                      className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02] transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Video className="w-4 h-4" /> Join EFADO Zoom Hub
                    </button>

                    <div className="flex items-center gap-2 justify-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                       <Users className="w-4 h-4" /> 124 Patrons In Hub
                    </div>
                  </div>
                )}
              </motion.div>

              <div className="p-8 bg-slate-900/50 border border-indigo-500/15 rounded-[2.5rem] space-y-6">
                 <div className="flex items-center gap-3">
                    <Share2 className="w-4 h-4 text-indigo-400" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Share & Invite Tracker</span>
                 </div>
                 
                 <div className="space-y-4">
                    <div>
                      <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider block mb-1">Your Personal Invitation Link</span>
                      <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-white/5">
                        <span className="text-[10px] font-mono text-indigo-300 select-all overflow-hidden text-ellipsis truncate w-full">
                          https://efado.com/seminar?ref={referralCode}
                        </span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`https://efado.com/seminar?ref=${referralCode}`);
                            alert("Copied custom candidate registration link with reference code: " + referralCode + "!");
                          }}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[8px] uppercase tracking-widest rounded-lg transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-950 p-3 rounded-2xl border border-white/5 text-center">
                        <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Candidates Joined</span>
                        <div className="flex items-center justify-center gap-1.5 mt-1">
                          <Users className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="text-sm font-black text-white">{referralsCount}</span>
                        </div>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-2xl border border-white/5 text-center">
                        <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Discount Gained</span>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <Coins className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-sm font-black text-emerald-400">₦{(referralsCount * 1000).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <a 
                        href={`https://wa.me/?text=Hi%2C%20I%20am%20preparing%20for%20the%20upcoming%20JAMB%2FWAEC%20Webinar%20Class%20on%20EFADO%20Education%20Hub.%20Join%20using%20my%20link%20to%20get%20access%3A%20https%3A%2F%2Fefado.com%2Fseminar%3Fref%3D${referralCode}`}
                        target="_blank" 
                        rel="noreferrer"
                        className="flex-1 py-1.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 text-[8px] font-black uppercase tracking-widest text-center transition-all"
                      >
                        WhatsApp
                      </a>
                      <a 
                        href={`https://t.me/share/url?url=https%3A%2F%2Fefado.com%2Fseminar%3Fref%3D${referralCode}&text=Join%20the%20upcoming%20EFADO%20strategic%20CBT%20seminar!`}
                        target="_blank" 
                        rel="noreferrer"
                        className="flex-1 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-indigo-500/20 text-[8px] font-black uppercase tracking-widest text-center transition-all"
                      >
                        Telegram
                      </a>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          <div className="space-y-12 mb-32">
            {/* Slide 4 */}
            <section className="bg-slate-900/50 border border-white/5 rounded-[3rem] p-12 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-20" />
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-rose-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-rose-500/20">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">04. Subject Tactical Field</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { t: "Logic & Math", d: "Prioritize formulas and back-solve from terminal options.", i: <InfinityIcon className="w-5 h-5" /> },
                    { t: "Sciences", d: "Focus on application concepts and unit density conversions.", i: <FlaskConical className="w-5 h-5" /> },
                    { t: "Humanities", d: "Read comprehension prompts AFTER reading the data context.", i: <PenTool className="w-5 h-5" /> }
                  ].map((item, i) => (
                    <div key={i} className="p-8 bg-slate-950 border border-white/5 rounded-[2rem] group-hover:border-indigo-500/20 transition-all hover:bg-slate-900">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-slate-400 group-hover:text-indigo-400 transition-colors">
                        {item.i}
                      </div>
                      <h4 className="text-sm font-black text-white uppercase tracking-widest mb-3 italic">{item.t}</h4>
                      <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase">{item.d}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

             {/* Slide 5 */}
             <section className="bg-slate-900/50 border border-white/5 rounded-[3rem] p-12 relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">05. Problem Dissection</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 bg-slate-950 rounded-[2.5rem] border border-white/5 relative group/case">
                    <div className="absolute top-6 right-6 text-[8px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full">Physics Protocol</div>
                    <p className="text-slate-400 text-sm mb-6 italic font-medium leading-relaxed">"A car travels 100m in 5s. What is its average speed?"</p>
                    <div className="space-y-4">
                      {[
                        { s: "Identify Data", d: "d=100m, t=5s" },
                        { s: "Execute Formula", d: "v = d / t" },
                        { s: "Final Output", d: "20 m/s" }
                      ].map((step, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5 group-hover/case:border-indigo-500/20 transition-all">
                          <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center text-[10px] font-black text-white">{idx+1}</div>
                          <div>
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{step.s}</p>
                            <p className="text-xs font-black text-white">{step.d}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-8 bg-slate-950 rounded-[2.5rem] border border-white/5 relative">
                    <div className="absolute top-6 right-6 text-[8px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-3 py-1 rounded-full">System Pitfall</div>
                    <p className="text-slate-400 text-sm mb-4 font-bold italic tracking-tight uppercase">The "Unit Trap" Neutralizer</p>
                    <p className="text-xs text-slate-500 leading-relaxed font-bold uppercase tracking-wide">
                      JAMB examiners often weaponize unit conversions (e.g., <span className="text-white">meters</span> vs <span className="text-white">kilometers</span>). Always normalize the data field before launching a calculation sequence.
                    </p>
                    <div className="mt-8 p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-rose-400" />
                        <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Tactical Directive</span>
                      </div>
                      <p className="text-[10px] font-black text-white uppercase tracking-widest leading-relaxed">
                        Verify the unit of the multiple choice options before decoding the prompt.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

             <section className="bg-slate-900/50 border border-white/5 rounded-[3rem] p-12">
               <div className="text-center max-w-2xl mx-auto space-y-8">
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Mission Accomplished</h3>
                  <p className="text-slate-400 font-medium leading-relaxed italic">
                    You have been integrated with the EFADO Strategic Doctrine. Return to the terminal, deploy your subject matrix, and achieve total academic victory.
                  </p>
                  <button 
                    onClick={() => setView('mode')}
                    className="px-12 py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:scale-105 transition-all shadow-2xl active:scale-95"
                  >
                    Initiate Final Protocol
                  </button>
               </div>
             </section>
          </div>
        </div>

        <AnimatePresence>
          {showMasterPayment && user && (
            <PaymentPlatform
              user={user}
              type="deposit"
              amount={4000} // Aligned with the 2-hour duration pricing tier in the existing schedule
              purpose="JAMB Master Mode Full Deployment"
              hub="EDUCATION"
              onComplete={async () => {
                setIsMasterPaid(true);
                setShowMasterPayment(false);
                setView('subjects');
              }}
              onSuccess={() => {
                setIsMasterPaid(true);
                setShowMasterPayment(false);
                setView('subjects');
              }}
              onClose={() => setShowMasterPayment(false)}
            />
          )}

          {showPayment && user && (
            <PaymentPlatform
              user={user}
              type="deposit"
              onComplete={async (amt) => {
                setIsRegisteredForWebinar(true);
                setShowPayment(false);
              }}
              onSuccess={() => {
                setIsRegisteredForWebinar(true);
                setShowPayment(false);
              }}
              onClose={() => setShowPayment(false)}
            />
          )}

          {showZoomHub && (
            <EfadoZoom
              sessionName="JAMB Success Seminar"
              category="Educational Excellence"
              hostName="EFADO Strategic Faculty"
              onClose={() => setShowZoomHub(false)}
              mode="STAGE"
            />
          )}

          {/* Candidate Operational Guide Modal */}
          {showGuideModal && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 30 }} 
                animate={{ scale: 1, y: 0 }} 
                className="bg-slate-900 border-2 border-indigo-500/20 rounded-[2.5rem] p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto no-scrollbar shadow-2xl relative"
              >
                <button 
                  onClick={() => setShowGuideModal(false)}
                  className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all"
                >
                  <XCircle className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
                     <HelpCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Candidate Operational Guide</h3>
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">How to Operate & Deploy Webinar Protocols</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <p className="text-xs text-slate-400 uppercase leading-relaxed font-bold">
                    Follow this tactical roadmap to verify your candidacy, unlock premium content, and step into the live interactive zoom broadcast.
                  </p>

                  <div className="space-y-4">
                    {[
                      {
                        step: "Step 1: Student Verification",
                        desc: "Verify your email or registration credentials at the top 'Access Authenticator' bar. Guests have limited trial views, while Verified Candidates unlock real-time live queues.",
                        ico: <UserCheck className="w-4 h-4 text-indigo-400" />
                      },
                      {
                        step: "Step 2: Pricing Selection",
                        desc: "Choose from our pricing plan sidebar based on your desired interactive duration (ranging from 30 Mins up to 3 Hours premium briefing).",
                        ico: <Coins className="w-4 h-4 text-emerald-400" />
                      },
                      {
                        step: "Step 3: Secure EasyPayment Gate",
                        desc: "Click to book a plan. A payment pop-up will launch. Complete the deposit. Our strategic ledger validates your payment status instantly.",
                        ico: <DollarSign className="w-4 h-4 text-indigo-400" />
                      },
                      {
                        step: "Step 4: Unlock Strategic Materials",
                        desc: "Once payment status is verified, the locked PDF briefings, PPTX speed algorithms, and shortcut spreadsheet tools under the 'Materials' tab immediately unlock for direct download.",
                        ico: <Unlock className="w-4 h-4 text-amber-400" />
                      },
                      {
                        step: "Step 5: Jump into the Zoom Terminal",
                        desc: "When the live event starts (use the simulation toggle to bypass wait timer), the glowing button 'Join Live EFADO Zoom Terminal' will become active. Click it to launch the live video stream, live Q&A feed, and patron sending mechanisms.",
                        ico: <Video className="w-4 h-4 text-rose-400" />
                      }
                    ].map((road, idx) => (
                      <div key={idx} className="p-5 bg-slate-950 border border-white/5 rounded-2xl flex items-start gap-4">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center border border-white/10 shrink-0 mt-0.5">
                          {road.ico}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-wider">{road.step}</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed mt-1">{road.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => setShowGuideModal(false)}
                  className="w-full mt-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-indigo-600/20"
                >
                  Understood Strategic Manual
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* Guest Warning Modal */}
          {showGuestWarning && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 30 }} 
                animate={{ scale: 1, y: 0 }} 
                className="bg-slate-900 border-2 border-rose-500/20 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative"
              >
                <button 
                  onClick={() => setShowGuestWarning(false)}
                  className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all"
                >
                  <XCircle className="w-6 h-6" />
                </button>

                <div className="text-center p-2">
                   <Lock className="w-14 h-14 text-rose-500 mx-auto mb-4 animate-bounce" />
                   <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Guest Access Blocked</h3>
                   <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest block mt-1">Full Student Credentials Required</span>
                   
                   <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed mt-4">
                     You are viewing as a guest. Connecting to live Zoom streams, asking host questions, and downloading study packages require verification or upgrading.
                   </p>

                   <div className="mt-6 bg-slate-950 p-4 rounded-2xl border border-white/5 text-left">
                     <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Authorize Now</span>
                     <form onSubmit={handleVerifyCredentials} className="mt-2 flex gap-2">
                       <input 
                         type="text" 
                         placeholder="Enter Student PIN..." 
                         value={credentialsCode}
                         onChange={(e) => setCredentialsCode(e.target.value)}
                         className="flex-grow bg-slate-900 border border-white/10 rounded-xl text-xs font-black p-2 text-white placeholder:opacity-40 uppercase"
                       />
                       <button
                         type="submit"
                         className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                       >
                         Verify
                       </button>
                     </form>
                     {verificationError && <span className="text-[9px] text-rose-500 font-bold block mt-2 uppercase">{verificationError}</span>}
                   </div>

                   <div className="mt-4 flex gap-4">
                     <button 
                       onClick={() => {
                         setShowGuestWarning(false);
                         alert("Proceeding to select custom plans in the sidebar.");
                       }}
                       className="flex-1 py-3 bg-white text-slate-950 rounded-xl text-[9px] font-black uppercase tracking-widest"
                     >
                       Choose Plan
                     </button>
                     <button 
                       onClick={() => setShowGuestWarning(false)}
                       className="flex-1 py-3 bg-slate-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5"
                     >
                       Stay Guest
                     </button>
                   </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  if (view === 'subjects') {
    return (
      <div className="min-h-screen bg-[#0F172A] p-6 flex flex-col">
        <div className="max-w-7xl mx-auto w-full flex-grow flex flex-col justify-start">
          {renderSimulatorHeader('subjects')}
          
          <div className="flex items-center gap-4 mb-12 mt-4">
            <div>
              <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Mission Logistics</h2>
              <p className="text-xs font-black text-indigo-500 uppercase tracking-widest">Subject Selection (Choose 4)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {subjectsPool.map((s) => (
              <button 
                key={s.id}
                onClick={() => toggleSubject(s.id)}
                className={`p-8 rounded-[2rem] border-2 text-left transition-all ${
                  selectedSubjectIds.includes(s.id) 
                    ? 'bg-indigo-600 border-indigo-400 text-white' 
                    : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/10'
                } relative group`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                  selectedSubjectIds.includes(s.id) ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'
                }`}>
                  <Book className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-black uppercase tracking-tighter">{s.name}</h4>
                <p className={`text-xs mt-2 ${selectedSubjectIds.includes(s.id) ? 'text-indigo-100' : 'text-slate-500'} font-bold uppercase tracking-widest`}>
                  {s.id === 'english' ? 'COMPULSORY' : 'ELECTIVE'}
                </p>
                {selectedSubjectIds.includes(s.id) && (
                  <CheckCircle2 className="absolute top-6 right-6 w-6 h-6 text-white" />
                )}
              </button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-10 bg-indigo-600/10 border border-indigo-500/20 rounded-[3rem]">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">
                  {selectedSubjectIds.length}/4
                </div>
                <p className="text-sm font-black text-white uppercase tracking-widest">Subjects Armed</p>
             </div>
             <button 
               disabled={selectedSubjectIds.length < 4}
               onClick={() => setView('instructions')}
               className={`px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-2xl ${
                 selectedSubjectIds.length < 4 
                   ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50' 
                   : 'bg-white text-slate-950 hover:scale-105 active:scale-95 shadow-white/5'
               }`}
             >
               Final Briefing
             </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'instructions') {
    return (
      <div className="min-h-screen bg-[#0F172A] p-6 flex flex-col items-center justify-start overflow-y-auto">
        <div className="max-w-4xl w-full pt-4">
          {renderSimulatorHeader('instructions')}
          <div className="bg-slate-900/50 border border-white/5 rounded-[3rem] p-12 relative overflow-hidden mt-4">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] -mr-32 -mt-32" />
          
          <div className="flex items-center gap-6 mb-10">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white">
              <Info className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase">Pre-Deployment Brief</h2>
              <p className="text-xs font-black text-indigo-500 uppercase tracking-widest">Protocol Version 2.0</p>
            </div>
          </div>

          <div className="space-y-8 mb-12">
            {[
              { title: "Universal Navigation", desc: "Use the keyboard shortcuts (A, B, C, D) for faster response cycles. Speed is as critical as accuracy." },
              { title: "Terminal Timer", desc: `Examination timer is strictly enforced. You have ${mode === 'beginner' ? '30 minutes' : '2 hours'} to complete your objective.` },
              { title: "Intel Lock", desc: "Once the simulation begins, you must remain within the secure terminal. Do not attempt to exit the hub during deployment." },
              { title: "Scoring Matrix", desc: "Results are calculated in real-time according to the global JAMB 400-point index." }
            ].map((inst, i) => (
              <div key={i} className="flex gap-6 group">
                <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-500 font-black text-xs shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  {i + 1}
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">{inst.title}</h4>
                  <p className="text-xs text-slate-500 font-bold leading-relaxed">{inst.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
             <button 
               onClick={() => setShowShortcuts(true)}
               className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border border-white/5"
             >
               Review UI Shortcuts
             </button>
             <button 
               onClick={handleStartExam}
               className="flex-1 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
             >
               COMMENCE DEPLOYMENT
             </button>
          </div>
        </div>
        </div>
        <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      </div>
    );
  }

  if (view === 'exam') {
    const activeSubject = currentExamSubjects[currentSubjectIndex];
    const activeQuestion = activeSubject.questions[currentQuestionIndex];
    const currentAnswer = userAnswers[activeSubject.id]?.[currentQuestionIndex];

    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col">
        <div className="max-w-7xl mx-auto w-full px-6 pt-4">
          {renderSimulatorHeader('exam')}
        </div>
        {/* Exam Header */}
        <div className="bg-slate-900 border-b border-white/5 p-6 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-8">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                   <Timer className="w-6 h-6" />
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Intel Timer</p>
                   <p className={`text-xl font-black tracking-tighter ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                    {formatTime(timeLeft)}
                   </p>
                 </div>
               </div>
               
                <div className="h-10 w-px bg-white/10 hidden md:block" />

                <div className="hidden lg:flex items-center gap-2">
                  {currentExamSubjects.map((s, idx) => (
                    <button 
                     key={s.id}
                     onClick={() => {
                       setCurrentSubjectIndex(idx);
                       setCurrentQuestionIndex(0);
                     }}
                     className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                       currentSubjectIndex === idx 
                         ? 'bg-indigo-600 text-white border-indigo-400' 
                         : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                     }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
            </div>

            <button 
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-600/20 active:scale-95 transition-all"
            >
              Force Commit (Submit)
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 flex-grow">
          {/* Main Content */}
          <div className="lg:col-span-3 p-10 space-y-10">
            <div className="flex items-center justify-between">
              <span className="px-4 py-1.5 bg-indigo-600/10 border border-indigo-500/20 rounded-lg text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                Deploy Unit {currentQuestionIndex + 1} / {activeSubject.questions.length}
              </span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Subject: {activeSubject.name}</span>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white leading-relaxed">
                {activeQuestion.text}
              </h2>

              <div className="grid grid-cols-1 gap-4 pt-10">
                {activeQuestion.options.map((opt, idx) => {
                  const isCorrectAnswer = activeQuestion.correctAnswer === idx;
                  let optionStyles = 'bg-white/5 border-white/5 text-slate-400 hover:border-white/10 hover:bg-white/10';
                  
                  if (currentAnswer === idx) {
                    if (showFeedback) {
                      optionStyles = isCorrectAnswer ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-red-600 border-red-400 text-white';
                    } else {
                      optionStyles = 'bg-indigo-600 border-indigo-400 text-white shadow-xl shadow-indigo-600/20';
                    }
                  } else if (showFeedback && isCorrectAnswer) {
                    optionStyles = 'bg-emerald-600/20 border-emerald-500/50 text-white';
                  }

                  return (
                    <button 
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={showFeedback}
                      className={`flex items-center gap-6 p-6 rounded-3xl border-2 text-left transition-all group ${optionStyles}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-colors ${
                        currentAnswer === idx ? 'bg-white text-indigo-900 shadow-xl' : 'bg-white/5 text-slate-500 group-hover:bg-white/10'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="text-lg font-medium">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Instant Feedback for Beginner Mode */}
              <AnimatePresence>
                {showFeedback && lastAnswerStatus && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-8 p-10 rounded-[2.5rem] border ${
                      lastAnswerStatus.isCorrect ? 'bg-emerald-600/10 border-emerald-500/20' : 'bg-red-600/10 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      {lastAnswerStatus.isCorrect ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500" />
                      )}
                      <h4 className={`text-[10px] font-black uppercase tracking-widest ${
                        lastAnswerStatus.isCorrect ? 'text-emerald-400' : 'text-red-500'
                      }`}>
                        {lastAnswerStatus.isCorrect ? 'Intelligence Positive' : 'Target Missed'}
                      </h4>
                    </div>
                    <p className="text-slate-300 font-medium leading-relaxed italic mb-6">
                      {lastAnswerStatus.explanation}
                    </p>
                    <button 
                      onClick={() => {
                        setShowFeedback(false);
                        nextQuestion();
                      }}
                      className="px-8 py-3 bg-white text-slate-950 rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all"
                    >
                      Acknowledge & Proceed
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between pt-10 border-t border-white/5">
              <button 
                onClick={prevQuestion}
                className="flex items-center gap-3 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <div className="flex items-center gap-2">
                 <button onClick={() => setShowShortcuts(true)} className="p-4 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all">
                    <Keyboard className="w-5 h-5" />
                 </button>
              </div>
              <button 
                onClick={nextQuestion}
                className="flex items-center gap-3 px-10 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-xl shadow-indigo-600/20"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Question Map Sidebar */}
          <div className="hidden lg:block border-l border-white/5 bg-slate-950 p-8 overflow-y-auto max-h-[calc(100vh-97px)] no-scrollbar">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Tactical Map</h3>
            
            <div className="space-y-8">
              {currentExamSubjects.map((s, sIdx) => (
                <div key={s.id}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[9px] font-black text-white uppercase tracking-widest">{s.name}</h4>
                    <span className="text-[8px] font-black text-slate-600 uppercase">
                      {Object.keys(userAnswers[s.id] || {}).length} / {s.questions.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {s.questions.map((_, qIdx) => {
                      const isAnswered = userAnswers[s.id]?.[qIdx] !== undefined;
                      const isActive = currentSubjectIndex === sIdx && currentQuestionIndex === qIdx;
                      return (
                        <button 
                          key={qIdx}
                          onClick={() => {
                            setCurrentSubjectIndex(sIdx);
                            setCurrentQuestionIndex(qIdx);
                          }}
                          className={`h-8 rounded-lg text-[8px] font-black transition-all ${
                            isActive ? 'ring-2 ring-indigo-500 bg-white text-slate-950' :
                            isAnswered ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-600 hover:text-white'
                          }`}
                        >
                          {qIdx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Confirmation Modal */}
        <AnimatePresence>
          {isAutoSubmitting && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
            >
              <div className="text-center space-y-8">
                <motion.div 
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-24 h-24 bg-red-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-red-600/40"
                >
                  <AlertCircle className="w-12 h-12 text-white" />
                </motion.div>
                <div className="space-y-4">
                  <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">Tactical Time Expired</h2>
                  <p className="text-red-400 font-black uppercase tracking-[0.3em] text-[10px]">Initiating Auto-Submission Protocol...</p>
                </div>
                <div className="flex items-center justify-center gap-2">
                   {[0, 1, 2].map((i) => (
                     <motion.div 
                       key={i}
                       animate={{ opacity: [0.2, 1, 0.2] }}
                       transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                       className="w-2 h-2 bg-white rounded-full"
                     />
                   ))}
                </div>
              </div>
            </motion.div>
          )}

          {isSubmitModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-slate-900 border border-white/10 rounded-[3rem] p-12 max-w-lg w-full text-center relative"
              >
                <div className="w-20 h-20 bg-red-600/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-4">Confirm Command</h2>
                <p className="text-slate-500 font-bold mb-10 leading-relaxed text-sm uppercase tracking-widest">
                  Are you sure you want to end this deployment? You cannot return to the examination terminal once submitted.
                </p>
                
                <div className="flex gap-4">
                   <button 
                     onClick={() => setIsSubmitModalOpen(false)}
                     className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border border-white/5"
                   >
                     Continue Mission
                   </button>
                   <button 
                     onClick={() => {
                       setView('results');
                       setIsSubmitModalOpen(false);
                     }}
                     className="flex-1 py-5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-red-600/20"
                   >
                     Submit & Terminate
                   </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      </div>
    );
  }

  if (view === 'results') {
    const { totalScore, correctCount, totalQuestions } = calculateScore();
    const isPassing = totalScore >= 200;

    return (
      <div className="min-h-screen bg-[#0F172A] p-6 flex flex-col items-center justify-start overflow-y-auto">
        <div className="max-w-4xl w-full pt-4">
          {renderSimulatorHeader('results')}
          <div className="text-center mb-12 mt-4">
            <h1 className="text-5xl font-black text-white italic tracking-tighter mb-4 uppercase">Mission Debrief</h1>
            <p className="text-slate-400 uppercase tracking-[0.3em] font-black text-xs">Performance Analysis Protocols</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="p-12 bg-white/5 border border-white/10 rounded-[3rem] text-center flex flex-col justify-center items-center">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Composite Score</p>
               <div className={`text-[10rem] font-black tracking-tighter leading-none mb-4 italic ${isPassing ? 'text-emerald-400' : 'text-orange-400'}`}>
                 {totalScore}
               </div>
               <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Global JAMB Standard (Max 400)</p>
               
               <div className="mt-10 w-full space-y-3">
                 {Object.entries(calculateScore().subjectScores).map(([name, data]) => (
                   <div key={name} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{name}</span>
                     <span className="text-sm font-black text-white italic">{data.score}/100</span>
                   </div>
                 ))}
               </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
               <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Intel Accuracy</p>
                    <span className="text-xs font-black text-white">{Math.round((correctCount / totalQuestions) * 100)}%</span>
                  </div>
                  <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(correctCount / totalQuestions) * 100}%` }}
                      className={`h-full rounded-full ${isPassing ? 'bg-emerald-500' : 'bg-orange-500'}`}
                    />
                  </div>
               </div>

               <div className="p-10 bg-indigo-600 rounded-[2.5rem] text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl opacity-50 transition-transform group-hover:scale-150 duration-500" />
                  <Trophy className="w-10 h-10 mb-6 text-indigo-200" />
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2">
                    {isPassing ? "Tactical Supremacy" : "Unit Deficit Identified"}
                  </h3>
                  <p className="text-indigo-100/50 text-sm font-medium leading-relaxed">
                    {isPassing 
                      ? "Your performance indicates advanced readiness for the national JAMB UTME. Continue elite simulations to maintain supremacy." 
                      : "Core competencies are below the mission threshold. Execute immediate correction protocols and redeploy simulation."}
                  </p>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatBlock label="Correct" value={correctCount.toString()} icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />} />
            <StatBlock label="Incorrect" value={(totalQuestions - correctCount).toString()} icon={<XCircle className="w-4 h-4 text-red-500" />} />
            <StatBlock label="Coverage" value={totalQuestions.toString()} icon={<AlertCircle className="w-4 h-4 text-indigo-400" />} />
            <StatBlock label="Time Spent" value={formatTime(7200 - timeLeft)} icon={<Clock className="w-4 h-4 text-slate-400" />} />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
             <button 
               onClick={() => setView('corrections')}
               className="flex-1 py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-xl shadow-white/5 active:scale-95"
             >
               Review Intel (Corrections)
             </button>
             <button 
               onClick={() => {
                  setView('mode');
                  setCurrentSubjectIndex(0);
                  setCurrentQuestionIndex(0);
                  setUserAnswers({});
               }}
               className="flex-1 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 active:scale-95"
             >
               <RotateCcw className="w-4 h-4" /> Redeploy Simulation
             </button>
             <button 
               onClick={onClose}
               className="md:w-auto px-10 py-5 bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
             >
               Close Terminal
             </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'corrections') {
    const activeSubject = currentExamSubjects[currentSubjectIndex];
    const activeQuestion = activeSubject.questions[currentQuestionIndex];
    const userAnswer = userAnswers[activeSubject.id]?.[currentQuestionIndex];
    const isCorrect = userAnswer === activeQuestion.correctAnswer;

    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col">
        <div className="max-w-7xl mx-auto w-full px-6 pt-4">
          {renderSimulatorHeader('corrections')}
        </div>
        <div className="sticky top-0 z-50 bg-slate-900/50 backdrop-blur-xl border-b border-white/5 p-6">
           <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setView('results')} className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-white">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-black tracking-tighter uppercase italic">Correction Protocol</h2>
              </div>
              <div className="flex gap-2">
                 {currentExamSubjects.map((s, idx) => (
                   <button 
                    key={s.id}
                    onClick={() => {
                       setCurrentSubjectIndex(idx);
                       setCurrentQuestionIndex(0);
                    }}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                      currentSubjectIndex === idx ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-white/5 text-slate-500 border-white/5'
                    }`}
                   >
                     {s.name}
                   </button>
                 ))}
              </div>
           </div>
        </div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 flex-grow">
           <div className="lg:col-span-3 p-10 space-y-10">
              <div className="flex items-center justify-between">
                 <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                   isCorrect ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                 }`}>
                   {isCorrect ? 'CORRECT INTEL' : 'CRITICAL DEFICIT'}
                 </span>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Deploy Unit {currentQuestionIndex + 1}</span>
              </div>

              <div className="space-y-12">
                 <h2 className="text-3xl font-bold text-white leading-relaxed">{activeQuestion.text}</h2>
                 
                 <div className="grid grid-cols-1 gap-4">
                    {activeQuestion.options.map((opt, idx) => {
                       const isSelected = userAnswer === idx;
                       const isCorrectOption = activeQuestion.correctAnswer === idx;
                       return (
                         <div 
                           key={idx}
                           className={`p-6 rounded-3xl border-2 flex items-center justify-between ${
                             isCorrectOption ? 'bg-emerald-500/10 border-emerald-400/50 text-white' :
                             (isSelected && !isCorrect) ? 'bg-red-500/10 border-red-500/50 text-white' :
                             'bg-white/5 border-white/5 text-slate-500'
                           }`}
                         >
                           <div className="flex items-center gap-6">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                                isCorrectOption ? 'bg-emerald-500 text-white' :
                                (isSelected && !isCorrect) ? 'bg-red-500 text-white' :
                                'bg-white/5 text-slate-500'
                              }`}>
                                {String.fromCharCode(65 + idx)}
                              </div>
                              <span className="text-lg font-medium">{opt}</span>
                           </div>
                           {isCorrectOption && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
                           {isSelected && !isCorrect && <XCircle className="w-6 h-6 text-red-500" />}
                         </div>
                       );
                    })}
                 </div>

                 <div className="p-10 bg-indigo-950/30 border border-indigo-500/20 rounded-[2.5rem]">
                    <div className="flex items-center gap-3 mb-4">
                       <HelpCircle className="w-5 h-5 text-indigo-400" />
                       <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Contextual Analysis</h4>
                    </div>
                    <p className="text-indigo-100/60 leading-relaxed font-medium">
                       {activeQuestion.explanation}
                    </p>
                 </div>
              </div>

              <div className="flex items-center justify-between pt-10 border-t border-white/5">
                <button 
                  onClick={prevQuestion}
                  className="px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400"
                >
                  Previous
                </button>
                <button 
                  onClick={nextQuestion}
                  className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-600/20"
                >
                  Next Question
                </button>
              </div>
           </div>

           <div className="hidden lg:block border-l border-white/5 bg-slate-950 p-8 overflow-y-auto max-h-[calc(100vh-97px)] no-scrollbar">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Simulation Map</h3>
              <div className="space-y-10">
                 {currentExamSubjects.map((s, sIdx) => (
                   <div key={s.id}>
                      <h4 className="text-[9px] font-black text-white uppercase tracking-widest mb-4">{s.name}</h4>
                      <div className="grid grid-cols-5 gap-2">
                        {s.questions.map((_, qIdx) => {
                          const ans = userAnswers[s.id]?.[qIdx];
                          const correct = s.questions[qIdx].correctAnswer;
                          const correctAns = ans === correct;
                          const active = currentSubjectIndex === sIdx && currentQuestionIndex === qIdx;
                          return (
                            <button 
                              key={qIdx}
                              onClick={() => {
                                setCurrentSubjectIndex(sIdx);
                                setCurrentQuestionIndex(qIdx);
                              }}
                              className={`h-8 rounded-lg text-[8px] font-black transition-all ${
                                active ? 'ring-2 ring-indigo-500 bg-white text-slate-950' :
                                correctAns ? 'bg-emerald-500/20 text-emerald-400' : 
                                ans !== undefined ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-slate-700'
                              }`}
                            >
                              {qIdx + 1}
                            </button>
                          );
                        })}
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    );
  }

  return null;
};

const StatBlock: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="p-6 bg-white/5 border border-white/5 rounded-2xl text-center">
    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-4 border border-white/5">
      {icon}
    </div>
    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-xl font-black text-white tracking-tighter">{value}</p>
  </div>
);
