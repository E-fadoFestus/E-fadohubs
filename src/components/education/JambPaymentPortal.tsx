import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  CreditCard, 
  Info, 
  ShieldCheck, 
  AlertCircle, 
  Smartphone, 
  User, 
  Copy, 
  FileText, 
  Check, 
  ArrowRight,
  Wallet,
  Sparkles,
  Building,
  Award,
  BookOpen,
  Compass,
  ArrowLeft,
  Mail,
  Fingerprint,
  Printer,
  FileSearch,
  CheckSquare,
  HelpCircle,
  Database,
  Search,
  Lock,
  Download,
  AlertTriangle,
  RefreshCw,
  Users,
  Plus,
  Trash,
  Sliders,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../../types';
import { db, auth, collection, onSnapshot, query, where, addDoc, doc, updateDoc, deleteDoc } from '../../firebase';

interface JambPaymentPortalProps {
  onClose: () => void;
  user: UserProfile;
}

interface SavedEPin {
  epin: string;
  serial: string;
  candidateName: string;
  profileCode: string;
  nin: string;
  examType: string;
  amount: number;
  date: string;
  method: string;
}

// Chronological candidate template database
const DEFAULT_CANDIDATES = [
  {
    id: "cand_1",
    fullName: "AMINU IBRAHIM",
    nin: "12345678901",
    ninVerified: true,
    profileCode: "5501928472",
    profileCodeGenerated: true,
    epin: "EPIN-9082-1824-7263",
    epinSerial: "SER-827362",
    epinPurchased: true,
    phone: "08031112222",
    phoneCorrected: false,
    email: "aminu.ibrahim@gmail.com",
    examType: "UTME",
    registered: false,
    primaryInstitution: "AHMADU BELLO UNIVERSITY (ABU)",
    primaryCourse: "COMPUTER SCIENCE",
    subjects: ["ENGLISH LANGUAGE", "MATHEMATICS", "PHYSICS", "CHEMISTRY"],
    oLevelUploaded: false,
    oLevelBoard: "WAEC",
    oLevelYear: "2025",
    oLevelResults: [
      { subject: "ENGLISH LANGUAGE", grade: "B3" },
      { subject: "MATHEMATICS", grade: "A1" },
      { subject: "PHYSICS", grade: "B2" },
      { subject: "CHEMISTRY", grade: "C4" },
      { subject: "CIVIC EDUCATION", grade: "A1" }
    ],
    regSlipPrinted: false,
    examSlipPrinted: false,
    examDate: "APRIL 19, 2026",
    examTime: "09:00 AM",
    examVenue: "EFADO DIGITAL COGNITIVE CBT CENTRE, ZONE A, IKEJA, LAGOS",
    examSeat: "SEAT-112",
    mockExamTaken: false,
    mockExamScore: 0,
    resultChecked: false,
    utmeScore: 0,
    emailLinked: false,
    originalResultPrinted: false,
    courseChanged: false,
    dataCorrected: false,
    capsStatus: "pending",
    letterPrinted: false,
    emailCorrected: false,
    regularized: false,
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "cand_2",
    fullName: "OLUWASEUN ADEBAYO",
    nin: "98765432109",
    ninVerified: true,
    profileCode: "5501982736",
    profileCodeGenerated: true,
    epin: "EPIN-1234-5678-9012",
    epinSerial: "SER-112233",
    epinPurchased: true,
    phone: "08123334444",
    phoneCorrected: false,
    email: "seun.adebayo@yahoo.com",
    examType: "UTME",
    registered: true,
    primaryInstitution: "UNIVERSITY OF LAGOS (UNILAG)",
    primaryCourse: "MEDICINE & SURGERY",
    subjects: ["ENGLISH LANGUAGE", "BIOLOGY", "PHYSICS", "CHEMISTRY"],
    oLevelUploaded: true,
    oLevelBoard: "WAEC",
    oLevelYear: "2025",
    oLevelResults: [
      { subject: "ENGLISH LANGUAGE", grade: "A1" },
      { subject: "BIOLOGY", grade: "A1" },
      { subject: "PHYSICS", grade: "B2" },
      { subject: "CHEMISTRY", grade: "A1" },
      { subject: "CIVIC EDUCATION", grade: "B2" }
    ],
    regSlipPrinted: true,
    examSlipPrinted: true,
    examDate: "APRIL 18, 2026",
    examTime: "07:00 AM",
    examVenue: "EFADO DIGITAL COGNITIVE CBT CENTRE, ZONE A, IKEJA, LAGOS",
    examSeat: "SEAT-084",
    mockExamTaken: true,
    mockExamScore: 340,
    resultChecked: false,
    utmeScore: 0,
    emailLinked: false,
    originalResultPrinted: false,
    courseChanged: false,
    dataCorrected: false,
    capsStatus: "pending",
    letterPrinted: false,
    emailCorrected: false,
    regularized: false,
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "cand_3",
    fullName: "CHINEDU OKAFOR",
    nin: "45612378954",
    ninVerified: true,
    profileCode: "6601938472",
    profileCodeGenerated: true,
    epin: "EPIN-4455-8822-1199",
    epinSerial: "SER-449201",
    epinPurchased: true,
    phone: "09056667777",
    phoneCorrected: false,
    email: "chinedu.okafor@outlook.com",
    examType: "UTME",
    registered: true,
    primaryInstitution: "UNIVERSITY OF IBADAN (UI)",
    primaryCourse: "MECHANICAL ENGINEERING",
    subjects: ["ENGLISH LANGUAGE", "MATHEMATICS", "PHYSICS", "CHEMISTRY"],
    oLevelUploaded: true,
    oLevelBoard: "NECO",
    oLevelYear: "2025",
    oLevelResults: [
      { subject: "ENGLISH LANGUAGE", grade: "B2" },
      { subject: "MATHEMATICS", grade: "A1" },
      { subject: "PHYSICS", grade: "A1" },
      { subject: "CHEMISTRY", grade: "B3" },
      { subject: "CIVIC EDUCATION", grade: "A1" }
    ],
    regSlipPrinted: true,
    examSlipPrinted: true,
    examDate: "APRIL 20, 2026",
    examTime: "11:00 AM",
    examVenue: "EFADO DIGITAL COGNITIVE CBT CENTRE, ZONE B, IKEJA, LAGOS",
    examSeat: "SEAT-002",
    mockExamTaken: true,
    mockExamScore: 312,
    resultChecked: true,
    utmeScore: 324,
    emailLinked: true,
    originalResultPrinted: true,
    courseChanged: false,
    dataCorrected: false,
    capsStatus: "accepted",
    letterPrinted: true,
    emailCorrected: false,
    regularized: false,
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "cand_4",
    fullName: "FAVOUR AMADI",
    nin: "55443322110",
    ninVerified: true,
    profileCode: "",
    profileCodeGenerated: false,
    epin: "",
    epinSerial: "",
    epinPurchased: false,
    phone: "08055554444",
    phoneCorrected: false,
    email: "favour.amadi@gmail.com",
    examType: "UTME",
    registered: false,
    primaryInstitution: "OBAFEMI AWOLOWO UNIVERSITY (OAU)",
    primaryCourse: "MECHANICAL ENGINEERING",
    subjects: ["ENGLISH LANGUAGE", "MATHEMATICS", "PHYSICS", "CHEMISTRY"],
    oLevelUploaded: false,
    oLevelBoard: "WAEC",
    oLevelYear: "2025",
    oLevelResults: [
      { subject: "ENGLISH LANGUAGE", grade: "B3" },
      { subject: "MATHEMATICS", grade: "B3" },
      { subject: "PHYSICS", grade: "C5" },
      { subject: "CHEMISTRY", grade: "C6" },
      { subject: "CIVIC EDUCATION", grade: "A1" }
    ],
    regSlipPrinted: false,
    examSlipPrinted: false,
    examDate: "APRIL 18, 2026",
    examTime: "07:00 AM",
    examVenue: "EFADO DIGITAL COGNITIVE CBT CENTRE, ZONE A, IKEJA, LAGOS",
    examSeat: "SEAT-084",
    mockExamTaken: false,
    mockExamScore: 0,
    resultChecked: false,
    utmeScore: 0,
    emailLinked: false,
    originalResultPrinted: false,
    courseChanged: false,
    dataCorrected: false,
    capsStatus: "pending",
    letterPrinted: false,
    emailCorrected: false,
    regularized: false,
    createdAt: new Date().toISOString()
  }
];

export const JambPaymentPortal: React.FC<JambPaymentPortalProps> = ({ onClose, user }) => {
  // Operator / Agent states
  const [isAgentConsole, setIsAgentConsole] = useState(true);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  
  // Commissions variables
  const [withdrawnCommissions, setWithdrawnCommissions] = useState(() => {
    const saved = localStorage.getItem('efado_jamb_withdrawn_commissions');
    return saved ? parseFloat(saved) : 0;
  });

  // Candidate DB State
  const [candidates, setCandidates] = useState<any[]>(() => {
    const saved = localStorage.getItem('efado_jamb_center_candidates');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return DEFAULT_CANDIDATES;
  });

  // Active workspace candidate state
  const [candidateState, setCandidateState] = useState<any>(() => {
    return DEFAULT_CANDIDATES[0];
  });

  // Sync candidateState with currently selectedCandidateId and candidates list
  useEffect(() => {
    if (selectedCandidateId) {
      const found = candidates.find(c => c.id === selectedCandidateId);
      if (found) {
        setCandidateState(found);
      }
    }
  }, [selectedCandidateId, candidates]);

  // Sync candidates to LocalStorage
  useEffect(() => {
    localStorage.setItem('efado_jamb_center_candidates', JSON.stringify(candidates));
  }, [candidates]);

  // Real-time Cloud Synchronization using Firebase Firestore if logged in
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'jamb_candidates'),
      where('operatorId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const list = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      if (list.length > 0) {
        setCandidates(list);
        localStorage.setItem('efado_jamb_center_candidates', JSON.stringify(list));
      } else {
        // Seed database
        for (const cand of DEFAULT_CANDIDATES) {
          try {
            const { setDoc, doc } = await import('firebase/firestore');
            await setDoc(doc(db, 'jamb_candidates', cand.id), {
              ...cand,
              operatorId: auth.currentUser!.uid
            });
          } catch (err) {
            console.error("Error seeding default candidates to Firestore:", err);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  // Unified update state handler which syncs both local list and Firestore
  const updateState = async (fields: Partial<typeof candidateState>) => {
    setCandidateState((prev: any) => {
      const updated = { ...prev, ...fields };

      // Update in local candidates array
      setCandidates(curr => {
        const idx = curr.findIndex(c => c.id === updated.id);
        if (idx > -1) {
          const next = [...curr];
          next[idx] = updated;
          localStorage.setItem('efado_jamb_center_candidates', JSON.stringify(next));

          // Sync to Cloud
          if (auth.currentUser) {
            updateDoc(doc(db, 'jamb_candidates', updated.id), fields as any).catch(err => {
              console.error("Firestore update sync error:", err);
            });
          }
          return next;
        }
        return curr;
      });

      return updated;
    });
  };

  // Add a brand new candidate to database
  const addNewCandidate = async (name: string, nin: string, phone: string, examType: string) => {
    const brandNew = {
      id: "cand_" + Math.random().toString(36).substring(2, 11),
      fullName: name.toUpperCase(),
      nin: nin || "",
      ninVerified: !!nin,
      profileCode: "",
      profileCodeGenerated: false,
      epin: "",
      epinSerial: "",
      epinPurchased: false,
      phone: phone || "",
      phoneCorrected: false,
      email: name.toLowerCase().replace(/\s+/g, ".") + "@gmail.com",
      examType: examType || "UTME",
      registered: false,
      primaryInstitution: "UNIVERSITY OF LAGOS (UNILAG)",
      primaryCourse: "COMPUTER SCIENCE",
      subjects: ["ENGLISH LANGUAGE", "MATHEMATICS", "PHYSICS", "CHEMISTRY"],
      oLevelUploaded: false,
      oLevelBoard: "WAEC",
      oLevelYear: "2025",
      oLevelResults: [
        { subject: "ENGLISH LANGUAGE", grade: "C5" },
        { subject: "MATHEMATICS", grade: "B3" },
        { subject: "PHYSICS", grade: "B3" },
        { subject: "CHEMISTRY", grade: "C4" },
        { subject: "CIVIC EDUCATION", grade: "B2" }
      ],
      regSlipPrinted: false,
      examSlipPrinted: false,
      examDate: "APRIL 18, 2026",
      examTime: "07:00 AM",
      examVenue: "EFADO DIGITAL COGNITIVE CBT CENTRE, ZONE A, IKEJA, LAGOS",
      examSeat: "SEAT-084",
      mockExamTaken: false,
      mockExamScore: 0,
      resultChecked: false,
      utmeScore: 0,
      emailLinked: false,
      originalResultPrinted: false,
      courseChanged: false,
      dataCorrected: false,
      capsStatus: "pending",
      letterPrinted: false,
      emailCorrected: false,
      regularized: false,
      createdAt: new Date().toISOString()
    };

    setCandidates(curr => {
      const next = [brandNew, ...curr];
      localStorage.setItem('efado_jamb_center_candidates', JSON.stringify(next));
      return next;
    });

    if (auth.currentUser) {
      try {
        const { setDoc, doc } = await import('firebase/firestore');
        await setDoc(doc(db, 'jamb_candidates', brandNew.id), {
          ...brandNew,
          operatorId: auth.currentUser.uid
        });
      } catch (err) {
        console.error("Error creating candidate in Firestore:", err);
      }
    }

    setSuccessMsg(`Candidate ${name.toUpperCase()} successfully enrolled in CBT database!`);
  };

  // Delete candidate from database
  const deleteCandidate = async (candId: string) => {
    const name = candidates.find(c => c.id === candId)?.fullName || "Candidate";
    setCandidates(curr => {
      const next = curr.filter(c => c.id !== candId);
      localStorage.setItem('efado_jamb_center_candidates', JSON.stringify(next));
      return next;
    });

    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'jamb_candidates', candId));
      } catch (err) {
        console.error("Error deleting candidate from Firestore:", err);
      }
    }

    setSuccessMsg(`Candidate ${name} successfully removed from CBT records.`);
  };

  // Commissions mapping for the 18 phases
  const calculateCandidateCommissions = (c: any) => {
    let earned = 0;
    if (c.ninVerified) earned += 200;
    if (c.profileCodeGenerated) earned += 200;
    if (c.epinPurchased) earned += 500;
    if (c.registered) earned += 800;
    if (c.oLevelUploaded) earned += 400;
    if (c.regSlipPrinted) earned += 200;
    if (c.examSlipPrinted) earned += 200;
    if (c.mockExamTaken) earned += 300;
    if (c.resultChecked) earned += 200;
    if (c.emailLinked) earned += 200;
    if (c.originalResultPrinted) earned += 400;
    if (c.courseChanged) earned += 500;
    if (c.dataCorrected) earned += 500;
    if (c.capsStatus === 'accepted') earned += 300;
    if (c.letterPrinted) earned += 500;
    if (c.emailCorrected) earned += 300;
    if (c.regularized) earned += 1500;
    return earned;
  };

  // Aggregated Commissions stats
  const totalCommissions = candidates.reduce((sum, c) => sum + calculateCandidateCommissions(c), 0);
  const availableCommissions = totalCommissions - withdrawnCommissions;

  // Withdraw commissions to master wallet
  const withdrawCommissions = () => {
    if (availableCommissions <= 0) {
      setError("No available commissions to withdraw at this moment.");
      return;
    }
    const amountToWithdraw = availableCommissions;
    const newWithdrawn = withdrawnCommissions + amountToWithdraw;
    setWithdrawnCommissions(newWithdrawn);
    localStorage.setItem('efado_jamb_withdrawn_commissions', String(newWithdrawn));

    const newBal = walletBalance + amountToWithdraw;
    setWalletBalance(newBal);
    localStorage.setItem('efado_simulated_balance', String(newBal));
    setSuccessMsg(`Commissions of ₦${amountToWithdraw.toLocaleString()} successfully withdrawn and credited to your master EFADO wallet!`);
  };

  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4>(1);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  // Error and transaction feedback
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Simulated active wallet balance
  const [walletBalance, setWalletBalance] = useState(() => {
    const saved = localStorage.getItem('efado_simulated_balance');
    return saved ? parseFloat(saved) : (user.playerWallet || 45000);
  });

  const spendWallet = (amount: number): boolean => {
    if (walletBalance < amount) {
      setError(`Insufficient active wallet funds. Required: ₦${amount.toLocaleString()}. Current Balance: ₦${walletBalance.toLocaleString()}`);
      return false;
    }
    const newBal = walletBalance - amount;
    setWalletBalance(newBal);
    localStorage.setItem('efado_simulated_balance', String(newBal));
    return true;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Chronological 18-service metadata
  const services = [
    // Phase 1: Pre-Registration & Profile Setup
    { id: 'nin_verify', phase: 1, title: 'NIN Verification', desc: 'Validate 11-digit NIN with National NIMC Servers before registrations.', icon: Fingerprint, requiredKey: null, doneKey: 'ninVerified' },
    { id: 'profile_code', phase: 1, title: 'Profile Code Creation', desc: 'Simulate 55019 / 66019 SMS protocol to command profile generation.', icon: Smartphone, requiredKey: 'ninVerified', doneKey: 'profileCodeGenerated' },
    { id: 'epin_procure', phase: 1, title: 'JAMB e-Pin Procurement', desc: 'Purchase official 2026 e-PIN registry codes via wallet or bank.', icon: CreditCard, requiredKey: 'profileCodeGenerated', doneKey: 'epinPurchased' },
    { id: 'phone_correction', phase: 1, title: 'Used Phone Correction / Update', desc: 'Recover or swap lost or broken mobile lines linked to profile code.', icon: RefreshCw, requiredKey: 'profileCodeGenerated', doneKey: 'phoneCorrected' },

    // Phase 2: Registration & Data Upload
    { id: 'jamb_reg', phase: 2, title: 'JAMB CBT Center Registration', desc: 'Capture biometric scans, select course pathways, and pick subjects.', icon: Users, requiredKey: 'epinPurchased', doneKey: 'registered' },
    { id: 'result_upload', phase: 2, title: 'O-Level Result CAPS Upload', desc: 'Upload WAEC/NECO/NABTEB subject arrays to the central mainframe.', icon: Database, requiredKey: 'registered', doneKey: 'oLevelUploaded' },
    { id: 'reg_slip', phase: 2, title: 'Print Registration Confirmation Slip', desc: 'Generate official, security-embossed receipt of candidate choices.', icon: FileText, requiredKey: 'registered', doneKey: 'regSlipPrinted' },

    // Phase 3: Examination & Results
    { id: 'exam_slip', phase: 3, title: 'Print Examination venue Slip', desc: 'Acquire venue allocations, seat assignments, date, and batch times.', icon: Printer, requiredKey: 'regSlipPrinted', doneKey: 'examSlipPrinted' },
    { id: 'mock_exam', phase: 3, title: 'Participate in UTME Mock CBT', desc: 'Solve preparatory questions and estimate actual academic score.', icon: Compass, requiredKey: 'examSlipPrinted', doneKey: 'mockExamTaken' },
    { id: 'result_check', phase: 3, title: 'UTME Result Checking Gateway', desc: 'Query examination database boards to view dynamic scoring breakdowns.', icon: Award, requiredKey: 'examSlipPrinted', doneKey: 'resultChecked' },
    { id: 'email_linking', phase: 3, title: 'Email Profile Linking Protocol', desc: 'Connect secure email address to profile code to validate CAPS entry.', icon: Mail, requiredKey: 'resultChecked', doneKey: 'emailLinked' },
    { id: 'original_result', phase: 3, title: 'Print Original Result Slip', desc: 'Vend standard premium results containing photographic identification.', icon: FileSearch, requiredKey: 'emailLinked', doneKey: 'originalResultPrinted' },

    // Phase 4: Post-UTME, Admissions & Corrections
    { id: 'change_course', phase: 4, title: 'Change Course or Institution', desc: 'Permute choice listings or shift institutions post-result publication.', icon: RefreshCw, requiredKey: 'resultChecked', doneKey: 'courseChanged' },
    { id: 'data_correction', phase: 4, title: 'Bio-Data Correction Suite', desc: 'Rectify typographic errors in names, state of origin, gender, or DoB.', icon: CheckSquare, requiredKey: 'resultChecked', doneKey: 'dataCorrected' },
    { id: 'caps_monitor', phase: 4, title: 'JAMB CAPS Status Command Centre', desc: 'Log in to central CAPS to accept or decline university admission offers.', icon: ShieldCheck, requiredKey: 'emailLinked', doneKey: 'capsStatusAccepted' }, // will evaluate custom
    { id: 'admission_letter', phase: 4, title: 'Print JAMB Admission Letter', desc: 'Acquire colored admission validation letter required for clearance.', icon: Award, requiredKey: 'capsStatusAccepted', doneKey: 'letterPrinted' },
    { id: 'email_update', phase: 4, title: 'Linked Email Correction & Update', desc: 'Fix misspelled or broken linked email structures safely.', icon: Mail, requiredKey: 'emailLinked', doneKey: 'emailCorrected' },
    { id: 'regularization', phase: 4, title: 'Admission Regularization (Late Application)', desc: 'Register direct university approvals onto the mainframe records.', icon: CheckSquare, requiredKey: 'ninVerified', doneKey: 'regularized' }
  ];

  // Simple Mock Test Engine (Phase 3)
  const mockQuestions = [
    { q: "Which Nigerian body is responsible for managing tertiary admissions?", options: ["WAEC", "NECO", "JAMB", "NUC"], ans: "JAMB" },
    { q: "What is the maximum obtainable score in a single JAMB UTME examination?", options: ["200", "300", "400", "500"], ans: "400" },
    { q: "How many subject combinations are compulsory for a standard UTME candidate?", options: ["3", "4", "5", "6"], ans: "4" },
    { q: "Which subject is strictly compulsory for ALL UTME candidates regardless of courses?", options: ["Mathematics", "English Language", "General Paper", "Civic Education"], ans: "English Language" },
    { q: "What does the abbreviation NIMC represent?", options: ["National Information Center", "National Identity Management Commission", "Nigerian Intellectual Council", "National Immigration Management Cell"], ans: "National Identity Management Commission" }
  ];
  const [mockIndex, setMockIndex] = useState(0);
  const [mockScore, setMockScore] = useState(0);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md p-2 md:p-6 flex items-center justify-center overflow-y-auto font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-6xl bg-slate-900 border border-white/5 rounded-[2rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row h-full max-h-[92vh] md:h-[80vh]"
      >
        
        {/* Glow rings */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

        {isAgentConsole ? (
          <div className="flex-grow flex flex-col h-full overflow-hidden">
            {/* Master Console Header */}
            <div className="p-5 md:p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-950/40 shrink-0">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white uppercase tracking-tight italic">EFADO COGNITIVE CBT AGENT NETWORK</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Authorized National Operator Terminal • Station #084</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase font-black tracking-wider flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> System Live
                </span>
                <button 
                  onClick={onClose}
                  className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
              
              {/* Feedback messages */}
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-200 text-[10px] rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="font-black uppercase tracking-wider">{error}</span>
                  <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-200 uppercase text-[9px] font-black">Dismiss</button>
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-[10px] rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-black uppercase tracking-wider">{successMsg}</span>
                  <button onClick={() => setSuccessMsg(null)} className="ml-auto text-emerald-400 hover:text-emerald-200 uppercase text-[9px] font-black">Dismiss</button>
                </div>
              )}

              {/* Bento Stats row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Stat 1: Active Wallet */}
                <div className="p-4 bg-slate-900 border border-white/5 rounded-2xl flex flex-col justify-between hover:border-indigo-500/20 transition-all relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-all" />
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-widest">Active Operator Wallet</span>
                    <span className="text-2xl font-black text-white block mt-1">₦{walletBalance.toLocaleString()}</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button 
                      onClick={() => {
                        const newBal = walletBalance + 25000;
                        setWalletBalance(newBal);
                        localStorage.setItem('efado_simulated_balance', String(newBal));
                        setSuccessMsg("₦25,000 simulated agent deposit successfully authorized!");
                      }}
                      className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border border-white/5 hover:border-white/10 cursor-pointer"
                    >
                      Refill Balance
                    </button>
                  </div>
                </div>

                {/* Stat 2: Available Commissions */}
                <div className="p-4 bg-slate-900 border border-white/5 rounded-2xl flex flex-col justify-between hover:border-emerald-500/20 transition-all relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all" />
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-widest">Accrued Commissions</span>
                    <span className="text-2xl font-black text-emerald-400 block mt-1">₦{availableCommissions.toLocaleString()}</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button 
                      onClick={withdrawCommissions}
                      disabled={availableCommissions <= 0}
                      className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Credit to Wallet
                    </button>
                  </div>
                </div>

                {/* Stat 3: Enrolled Candidates */}
                <div className="p-4 bg-slate-900 border border-white/5 rounded-2xl flex flex-col justify-between hover:border-violet-500/20 transition-all relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-500/5 rounded-full blur-xl group-hover:bg-violet-500/10 transition-all" />
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-widest">Candidates Enrolled</span>
                    <span className="text-2xl font-black text-white block mt-1">{candidates.length}</span>
                  </div>
                  <div className="mt-4 text-[9px] text-slate-400 uppercase font-bold tracking-wider">
                    {candidates.filter(c => c.registered).length} Fully Registered (Phase 2)
                  </div>
                </div>

                {/* Stat 4: Admission Status */}
                <div className="p-4 bg-slate-900 border border-white/5 rounded-2xl flex flex-col justify-between hover:border-pink-500/20 transition-all relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-pink-500/5 rounded-full blur-xl group-hover:bg-pink-500/10 transition-all" />
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-widest">Admissions Cleared</span>
                    <span className="text-2xl font-black text-white block mt-1">
                      {candidates.filter(c => c.capsStatus === 'accepted').length} Accepted
                    </span>
                  </div>
                  <div className="mt-4 text-[9px] text-slate-400 uppercase font-bold tracking-wider">
                    {candidates.filter(c => c.resultChecked).length} UTME Results Loaded
                  </div>
                </div>

              </div>

              {/* Add Candidate Form Panel */}
              <div className="p-5 bg-slate-950/60 border border-white/5 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-white">Enroll New Candidate to Terminal</span>
                </div>
                
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const name = fd.get('fullName') as string;
                    const nin = fd.get('nin') as string;
                    const phone = fd.get('phone') as string;
                    const examType = fd.get('examType') as string;
                    
                    if (!name) {
                      setError("Candidate's Full Name is required to enroll them.");
                      return;
                    }
                    if (nin && nin.length !== 11) {
                      setError("National Identification Number (NIN) must be exactly 11 digits.");
                      return;
                    }
                    
                    addNewCandidate(name, nin, phone, examType);
                    e.currentTarget.reset();
                  }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end text-xs"
                >
                  <div>
                    <label className="text-[8.5px] font-black text-indigo-400 block uppercase mb-1">Candidate Full Name</label>
                    <input 
                      type="text" 
                      name="fullName"
                      placeholder="e.g. ADEBIYI BOLAJI" 
                      required
                      className="w-full p-2.5 bg-slate-900 border border-white/5 rounded-lg text-white font-black"
                    />
                  </div>
                  <div>
                    <label className="text-[8.5px] font-black text-indigo-400 block uppercase mb-1">National Identity Number (NIN)</label>
                    <input 
                      type="text" 
                      name="nin"
                      placeholder="11-digit NIN (optional)" 
                      maxLength={11}
                      className="w-full p-2.5 bg-slate-900 border border-white/5 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[8.5px] font-black text-indigo-400 block uppercase mb-1">Phone Number</label>
                    <input 
                      type="text" 
                      name="phone"
                      placeholder="Candidate's Mobile" 
                      className="w-full p-2.5 bg-slate-900 border border-white/5 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[8.5px] font-black text-indigo-400 block uppercase mb-1">Exam Type</label>
                      <select 
                        name="examType"
                        className="w-full p-2.5 bg-slate-900 border border-white/5 rounded-lg text-white font-mono font-bold"
                      >
                        <option value="UTME">UTME</option>
                        <option value="DE">DIRECT ENTRY (DE)</option>
                      </select>
                    </div>
                    <button 
                      type="submit"
                      className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase rounded-lg text-[10px] tracking-wider transition-all h-[42px] cursor-pointer"
                    >
                      Enlist
                    </button>
                  </div>
                </form>
              </div>

              {/* Candidates Records Database Table */}
              <div className="border border-white/5 rounded-2xl overflow-hidden bg-slate-950/20">
                <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-950/40 shrink-0">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-white">Active Terminal Candidates Directory</span>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    {/* Simple Search Input */}
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        placeholder="Search Candidate Name or NIN..."
                        id="cbtSearchInput"
                        onChange={(e) => {
                          const val = e.target.value.toLowerCase();
                          const rows = document.querySelectorAll('.candidate-db-row');
                          rows.forEach((row: any) => {
                            const name = row.getAttribute('data-name')?.toLowerCase() || '';
                            const nin = row.getAttribute('data-nin')?.toLowerCase() || '';
                            if (name.includes(val) || nin.includes(val)) {
                              row.style.display = '';
                            } else {
                              row.style.display = 'none';
                            }
                          });
                        }}
                        className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-white/5 rounded-xl text-[10px] text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/5 bg-slate-950/60 text-slate-400 font-black uppercase tracking-wider text-[8.5px]">
                        <th className="p-4">Candidate Profile</th>
                        <th className="p-4">Identity Verification</th>
                        <th className="p-4">Lifecycle Status</th>
                        <th className="p-4">Center Commissions</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {candidates.map((cand) => {
                        const earnedComm = calculateCandidateCommissions(cand);
                        
                        // Compute current status badge
                        let statusBadge = "Phase 1: Pre-Reg";
                        let statusColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                        if (cand.capsStatus === 'accepted') {
                          statusBadge = "Phase 4: CAPS Accepted";
                          statusColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                        } else if (cand.resultChecked) {
                          statusBadge = "Phase 3: Score Verified";
                          statusColor = "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
                        } else if (cand.registered) {
                          statusBadge = "Phase 2: Registered";
                          statusColor = "bg-violet-500/10 text-violet-400 border-violet-500/20";
                        }

                        return (
                          <tr 
                            key={cand.id} 
                            className="candidate-db-row hover:bg-white/5 transition-colors"
                            data-name={cand.fullName}
                            data-nin={cand.nin}
                          >
                            <td className="p-4">
                              <div>
                                <span className="font-black text-white block">{cand.fullName}</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">{cand.email}</span>
                                <span className="text-[9px] text-slate-500 font-mono block mt-0.5">ID: {cand.id}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${cand.ninVerified ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wide">NIN: {cand.nin || 'Not Verified'}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${cand.profileCodeGenerated ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wide">Code: {cand.profileCode || 'Not Created'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div>
                                <span className={`inline-block px-2 py-0.5 border rounded uppercase font-black tracking-widest text-[8px] ${statusColor}`}>
                                  {statusBadge}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-1 font-medium">{cand.primaryInstitution?.slice(0, 24)}...</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div>
                                <span className="font-black text-emerald-400 block text-xs">₦{earnedComm.toLocaleString()}</span>
                                <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-widest">accrued</span>
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedCandidateId(cand.id);
                                    setIsAgentConsole(false);
                                  }}
                                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                >
                                  Manage Candidate
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete ${cand.fullName}?`)) {
                                      deleteCandidate(cand.id);
                                    }
                                  }}
                                  className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/10 hover:border-rose-500/20 rounded-lg transition-all cursor-pointer"
                                  title="Delete Record"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <>
            {/* Sidebar Left: Timeline Nav */}
            <div className="w-full md:w-1/4 bg-slate-950/60 p-5 md:p-6 border-b md:border-b-0 md:border-r border-white/5 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-tight italic">JAMB Lifecycle Hub</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">National Admission Console</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-900/60 rounded-xl border border-white/5 mb-5 flex justify-between items-center text-xs">
              <div>
                <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">EFADO wallet</span>
                <span className="text-white font-black">₦{walletBalance.toLocaleString()}</span>
              </div>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-black tracking-widest animate-pulse">active vault</span>
            </div>

            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-3">Chronological Phases</span>
            <div className="space-y-2">
              {[
                { id: 1, label: 'Phase 1: Pre-Registration', desc: 'NIN, profile codes, pins' },
                { id: 2, label: 'Phase 2: Data & Registration', desc: 'Biometrics, uploads, choices' },
                { id: 3, label: 'Phase 3: Exam & Scoring', desc: 'Mock quiz, results, links' },
                { id: 4, label: 'Phase 4: Admissions & CAPS', desc: 'CAPS approvals, modifications' },
              ].map((phase) => {
                const isActive = activeTab === phase.id;
                return (
                  <button
                    key={phase.id}
                    onClick={() => {
                      setActiveTab(phase.id as any);
                      setSelectedServiceId(null);
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isActive 
                        ? 'bg-indigo-600/10 border-indigo-500/40 text-white shadow-md shadow-indigo-600/5' 
                        : 'bg-transparent border-transparent text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-tight block">{phase.label}</span>
                      <span className="text-[9px] text-slate-500 block uppercase tracking-wider mt-0.5">{phase.desc}</span>
                    </div>
                    {isActive && <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 hidden md:block text-[9px] font-mono text-slate-500">
            <span>SECURE SYSTEM EMBED PRO</span>
            <span className="text-emerald-400 flex items-center gap-1 mt-0.5"><ShieldCheck className="w-3.5 h-3.5" /> 256-BIT MAINFRAME CRYPTO ACTIVED</span>
          </div>
        </div>

        {/* Workspace Central / Right */}
        <div className="flex-1 p-5 md:p-8 flex flex-col justify-between overflow-y-auto">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-white/5 shrink-0">
            <div>
              {selectedServiceId ? (
                <button 
                  onClick={() => {
                    setSelectedServiceId(null);
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-all font-black uppercase tracking-widest text-[10px]"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to service menu
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
                  <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest">
                    SYSTEM_LIFECYCLE_GATEWAY_v3.4
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setIsAgentConsole(true);
                  setSelectedCandidateId(null);
                  setSelectedServiceId(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" /> Agent Console
              </button>
              <button 
                onClick={onClose}
                className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Core dynamic body */}
          <div className="flex-grow flex flex-col">
            
            {/* Feedback elements */}
            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-200 text-[10px] rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="font-extrabold uppercase tracking-wide leading-tight">{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-[10px] rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="font-extrabold uppercase tracking-wide leading-tight">{successMsg}</span>
              </div>
            )}

            {!selectedServiceId ? (
              // View 1: Service Menu for Active Phase
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-black text-white uppercase italic">Phase {activeTab} Interactive Service Hub</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">Select any process sequence to simulate functional outcomes with active credentials.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {services
                    .filter(s => s.phase === activeTab)
                    .map((service) => {
                      const Icon = service.icon;
                      
                      // Calculate prerequisite state
                      let isLocked = false;
                      if (service.requiredKey) {
                        if (service.requiredKey === 'capsStatusAccepted') {
                          isLocked = candidateState.capsStatus !== 'accepted';
                        } else {
                          isLocked = !candidateState[service.requiredKey];
                        }
                      }
                      
                      // Calculate completed state
                      const isDone = service.id === 'caps_monitor' 
                        ? candidateState.capsStatus === 'accepted' || candidateState.capsStatus === 'rejected'
                        : !!candidateState[service.doneKey as any];

                      return (
                        <div
                          key={service.id}
                          onClick={() => {
                            if (isLocked) {
                              setError(`System Node Locked! You must successfully execute prior lifecycle tasks first.`);
                              return;
                            }
                            setError(null);
                            setSuccessMsg(null);
                            setSelectedServiceId(service.id);
                          }}
                          className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all relative overflow-hidden group cursor-pointer ${
                            isLocked 
                              ? 'bg-slate-950/20 border-white/5 opacity-50 cursor-not-allowed' 
                              : isDone
                                ? 'bg-indigo-950/10 border-indigo-500/30 hover:border-indigo-500/50 shadow-lg shadow-indigo-600/5'
                                : 'bg-slate-950/40 border-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 mt-0.5 ${
                            isDone 
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                              : isLocked 
                                ? 'bg-slate-950 border-white/5 text-slate-600' 
                                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                          }`}>
                            {isLocked ? <Lock className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                          </div>

                          <div className="flex-1 space-y-0.5">
                            <span className="text-xs font-black text-white uppercase block group-hover:text-indigo-300 transition-colors">
                              {service.title}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-semibold leading-relaxed">
                              {service.desc}
                            </span>

                            <div className="pt-2 flex items-center gap-1.5">
                              {isDone ? (
                                <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-wider">completed</span>
                              ) : isLocked ? (
                                <span className="text-[8px] font-black text-slate-500 bg-slate-950 border border-white/5 px-2 py-0.5 rounded uppercase tracking-wider">node locked</span>
                              ) : (
                                <span className="text-[8px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded uppercase tracking-wider">ready for execution</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              // View 2: Active Service Form / Interactive Component
              <div className="flex-grow flex flex-col justify-between">
                
                {/* 1. NIN Verification */}
                {selectedServiceId === 'nin_verify' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase italic">NIN Verification Protocol</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Validate database credentials against National NIMC server records.</p>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-4">
                      <div>
                        <label className="text-[9px] font-black text-indigo-400 block uppercase mb-1.5 tracking-wider">Candidate 11-Digit NIN</label>
                        <input 
                          type="text"
                          maxLength={11}
                          placeholder="e.g. 10293847561"
                          value={candidateState.nin}
                          onChange={(e) => updateState({ nin: e.target.value.replace(/\D/g, '') })}
                          className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-xs font-mono outline-none focus:border-indigo-500 text-white tracking-widest"
                        />
                      </div>

                      <button
                        onClick={() => {
                          if (candidateState.nin.length !== 11) {
                            setError('NIN code must be exactly 11 digits to execute database validations.');
                            return;
                          }
                          setLoading(true);
                          setTimeout(() => {
                            setLoading(false);
                            updateState({ ninVerified: true });
                            setSuccessMsg('NIN Credentials successfully validated with NIMC database arrays.');
                          }, 1500);
                        }}
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                      >
                        Verify with NIMC Mainframe
                      </button>
                    </div>

                    {candidateState.ninVerified && (
                      <div className="p-4 bg-slate-950 border border-emerald-500/20 rounded-2xl space-y-3 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
                        <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest block">NIMC VERIFIED CANDIDATE PROFILE</span>
                        <div className="grid grid-cols-2 gap-4 text-xs font-bold uppercase text-slate-300">
                          <div>
                            <span className="text-[8px] text-slate-500 block">candidate name</span>
                            <span className="text-white font-extrabold">{candidateState.fullName || 'CHIDI OLUWASEUN'}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-500 block">date of birth</span>
                            <span className="text-white font-mono">APRIL 15, 2007</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-500 block">state of origin</span>
                            <span className="text-white font-extrabold">LAGOS STATE</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-500 block">gender</span>
                            <span className="text-white">MALE</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Profile Code Creation */}
                {selectedServiceId === 'profile_code' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase italic">Profile Code Creation (SMS Gateway)</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Simulate sending your verified NIN to 55019 or 66019 via secure cellular protocols.</p>
                    </div>

                    <div className="p-5 bg-slate-950 rounded-2xl border border-white/5 space-y-4 max-w-sm mx-auto">
                      <span className="text-[8.5px] font-black text-indigo-400 uppercase tracking-widest block text-center">SMS PHONE SIMULATOR</span>
                      
                      <div className="bg-slate-900 rounded-xl p-4 space-y-3 h-48 flex flex-col justify-between border border-white/5">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-[9px] font-black text-slate-400">TO: 55019</span>
                          <span className="text-[9px] font-mono text-slate-500">MOCK-CELL-SECURE</span>
                        </div>
                        
                        <div className="flex-grow flex flex-col justify-end space-y-2 text-[10px]">
                          {candidateState.profileCodeGenerated && (
                            <>
                              <div className="self-end bg-indigo-600 text-white p-2 rounded-xl rounded-tr-none font-bold uppercase tracking-wider max-w-[80%]">
                                NIN {candidateState.nin}
                              </div>
                              <div className="self-start bg-slate-950 text-slate-300 p-2 border border-white/5 rounded-xl rounded-tl-none font-semibold uppercase tracking-wide max-w-[80%]">
                                Profile Code generated: <span className="text-white font-black font-mono select-all">55019A12BC</span>. tie this to your 2026 E-pin procurement.
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setLoading(true);
                          setTimeout(() => {
                            setLoading(false);
                            updateState({ profileCode: '55019A12BC', profileCodeGenerated: true });
                            setSuccessMsg('Official Profile Code Generated via cell networks.');
                          }, 1200);
                        }}
                        disabled={candidateState.profileCodeGenerated}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                      >
                        {candidateState.profileCodeGenerated ? 'Profile Code Generated' : 'Command Profile SMS'}
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. JAMB e-Pin Procurement */}
                {selectedServiceId === 'epin_procure' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase italic">JAMB e-PIN Procurement</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Purchase application access code tied directly to candidate profile parameters.</p>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[8px] font-mono text-slate-400 uppercase block">CANDIDATE PROFILE CODE</span>
                          <span className="text-white font-mono font-black">{candidateState.profileCode}</span>
                        </div>
                        <div>
                          <span className="text-[8px] font-mono text-slate-400 uppercase block">EXAMINATION DISPATCH</span>
                          <span className="text-white font-extrabold">{candidateState.examType === 'UTME' ? 'JAMB UTME 2026' : 'DIRECT ENTRY'}</span>
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-3">
                        <span className="text-[8px] font-mono text-indigo-400 uppercase block">fee distribution</span>
                        <div className="flex justify-between text-xs text-slate-300 font-bold mt-1 uppercase">
                          <span>jamb e-PIN & syllabus literature:</span>
                          <span className="text-white font-mono">₦5,700</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (spendWallet(5700)) {
                            setLoading(true);
                            setTimeout(() => {
                              setLoading(false);
                              updateState({ 
                                epinPurchased: true,
                                epin: `EPIN-${Math.floor(100000 + Math.random() * 900000)}-UTME`,
                                epinSerial: `SER-${Math.floor(100000000 + Math.random() * 900000000)}`
                              });
                              setSuccessMsg('JAMB Registration e-PIN bought successfully.');
                            }, 1500);
                          }
                        }}
                        disabled={candidateState.epinPurchased}
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                      >
                        {candidateState.epinPurchased ? 'e-PIN Already Procured' : 'Authorize ₦5,700 Payment'}
                      </button>

                      {candidateState.epinPurchased && (
                        <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-xl space-y-2 text-xs">
                          <div className="flex justify-between font-bold">
                            <span className="text-[8px] text-slate-400 uppercase">OFFICIAL REGISTRATION E-PIN</span>
                            <span className="text-emerald-400 uppercase">validated</span>
                          </div>
                          <span className="text-lg font-mono font-black text-white block select-all tracking-wider">{candidateState.epin}</span>
                          <div className="text-[8.5px] text-slate-400 font-mono">SERIAL: {candidateState.epinSerial}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Used Phone Correction */}
                {selectedServiceId === 'phone_correction' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase italic">Phone Number Correction Suite</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Request cellular number correction or swapping protocol for communications.</p>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-4 text-xs">
                      <div className="space-y-3">
                        <div>
                          <label className="text-[8.5px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Old Phone Number</label>
                          <input 
                            type="text" 
                            placeholder="e.g. 08031234567"
                            className="w-full px-3 py-2 bg-slate-900 border border-white/5 rounded-lg outline-none focus:border-indigo-500" 
                          />
                        </div>
                        <div>
                          <label className="text-[8.5px] font-black text-indigo-400 uppercase tracking-widest block mb-1">New Phone Number</label>
                          <input 
                            type="text" 
                            placeholder="e.g. 08129384756"
                            className="w-full px-3 py-2 bg-slate-900 border border-white/5 rounded-lg outline-none focus:border-indigo-500" 
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (spendWallet(1000)) {
                            setLoading(true);
                            setTimeout(() => {
                              setLoading(false);
                              updateState({ phoneCorrected: true });
                              setSuccessMsg('Linked Profile Phone Number swap authenticated across systems.');
                            }, 1200);
                          }
                        }}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                      >
                        Authorize Swap Protocol (₦1,000)
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. JAMB CBT Center Registration */}
                {selectedServiceId === 'jamb_reg' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase italic">JAMB CBT Center Biometrics & Course Setup</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Simulate capture of digital biometrics and submit course priorities.</p>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[8.5px] font-black text-indigo-400 block uppercase mb-1">First Choice Institution</label>
                          <select 
                            value={candidateState.primaryInstitution}
                            onChange={(e) => updateState({ primaryInstitution: e.target.value })}
                            className="w-full p-2.5 bg-slate-900 border border-white/5 rounded-lg text-white"
                          >
                            <option>UNIVERSITY OF LAGOS (UNILAG)</option>
                            <option>UNIVERSITY OF IBADAN (UI)</option>
                            <option>OBAFEMI AWOLOWO UNIVERSITY (OAU)</option>
                            <option>UNIVERSITY OF NIGERIA, NSUKKA (UNN)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[8.5px] font-black text-indigo-400 block uppercase mb-1">Course of Choice</label>
                          <select 
                            value={candidateState.primaryCourse}
                            onChange={(e) => updateState({ primaryCourse: e.target.value })}
                            className="w-full p-2.5 bg-slate-900 border border-white/5 rounded-lg text-white"
                          >
                            <option>COMPUTER SCIENCE</option>
                            <option>MEDICINE & SURGERY</option>
                            <option>LAW</option>
                            <option>MECHANICAL ENGINEERING</option>
                          </select>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-900 rounded-xl border border-white/5 flex items-center justify-between">
                        <div>
                          <span className="text-[8px] font-mono text-slate-400 uppercase block">SUBJECTS ALLOCATION</span>
                          <span className="text-white font-extrabold text-[10px] block mt-0.5">{candidateState.subjects.join(' + ')}</span>
                        </div>
                        <span className="text-[8px] text-indigo-400 uppercase font-black tracking-wider">validated standard</span>
                      </div>

                      <div className="p-4 bg-slate-900/40 rounded-xl border border-white/5 text-center space-y-3">
                        <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block">Biometrics Capture Nodes</span>
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => {
                              setLoading(true);
                              setTimeout(() => {
                                setLoading(false);
                                updateState({ registered: true });
                                setSuccessMsg('Biometric capture complete! JAMB UTME Registration finalized.');
                              }, 1500);
                            }}
                            className="px-6 py-3 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 rounded-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-wider text-indigo-400 hover:text-white transition-all cursor-pointer"
                          >
                            <Fingerprint className="w-5 h-5" /> Simulate Fingerprint Scan
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. O-Level Result CAPS Upload */}
                {selectedServiceId === 'result_upload' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase italic">O-Level Result Upload Protocol</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Inject validated examination grades (WAEC/NECO/NABTEB) into CAPS Mainframe.</p>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[8.5px] font-black text-indigo-400 block uppercase mb-1">Exam Body</label>
                          <select 
                            value={candidateState.oLevelBoard}
                            onChange={(e) => updateState({ oLevelBoard: e.target.value })}
                            className="w-full p-2.5 bg-slate-900 border border-white/5 rounded-lg text-white"
                          >
                            <option>WAEC</option>
                            <option>NECO</option>
                            <option>NABTEB</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[8.5px] font-black text-indigo-400 block uppercase mb-1">Exam Year</label>
                          <input 
                            type="text" 
                            value={candidateState.oLevelYear}
                            onChange={(e) => updateState({ oLevelYear: e.target.value })}
                            className="w-full p-2.5 bg-slate-900 border border-white/5 rounded-lg text-white font-mono"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-slate-900 rounded-xl border border-white/5">
                        <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block mb-2">Subject Grade Matrix</span>
                        <div className="grid grid-cols-5 gap-1.5 font-mono text-[9px] text-slate-300">
                          {candidateState.oLevelResults.map((r, i) => (
                            <div key={i} className="p-1.5 bg-slate-950 border border-white/5 rounded text-center">
                              <span className="block truncate text-slate-500 uppercase">{r.subject.substring(0, 7)}</span>
                              <span className="font-extrabold text-indigo-400 text-xs block mt-0.5">{r.grade}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setLoading(true);
                          setTimeout(() => {
                            setLoading(false);
                            updateState({ oLevelUploaded: true });
                            setSuccessMsg('O-Level qualifications uploaded and linked on CAPS mainframe databases.');
                          }, 1400);
                        }}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                      >
                        Transmit Dossier to CAPS Mainframe
                      </button>
                    </div>
                  </div>
                )}

                {/* 7. Print Registration Confirmation Slip */}
                {selectedServiceId === 'reg_slip' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase italic">Registration Confirmation Slip Printing</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Generate security-embossed receipt verification slip.</p>
                    </div>

                    <div className="p-4 bg-white text-slate-900 rounded-2xl border shadow-inner font-mono text-[10px] space-y-4 max-w-lg mx-auto">
                      <div className="flex justify-between items-center border-b-2 border-slate-900 pb-2">
                        <span className="font-bold text-xs uppercase">JAMB 2026 REGISTRATION SLIP</span>
                        <span className="font-bold text-[8px] bg-slate-200 border border-slate-900 px-1 py-0.5 rounded">ORIGINAL RECEIPT</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[7.5px] text-slate-500 block uppercase font-bold">candidate name</span>
                          <span className="font-black text-slate-900 text-xs uppercase">{candidateState.fullName}</span>
                        </div>
                        <div>
                          <span className="text-[7.5px] text-slate-500 block uppercase font-bold">registration code</span>
                          <span className="font-black text-slate-900 text-xs font-mono">{candidateState.epin || 'UTME-2026-PENDING'}</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-300 pt-2 space-y-1">
                        <span className="text-[7.5px] text-slate-500 block uppercase font-bold">institution choices</span>
                        <div className="text-[9px] font-bold">1ST CHOICE: {candidateState.primaryInstitution}</div>
                        <div className="text-[9px] font-bold">PROGRAMME: {candidateState.primaryCourse}</div>
                      </div>

                      <button
                        onClick={() => {
                          updateState({ regSlipPrinted: true });
                          setSuccessMsg('Registration Slip sent to system PDF drivers and archived.');
                        }}
                        className="w-full py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" /> Download Registration Confirmation PDF
                      </button>
                    </div>
                  </div>
                )}

                {/* 8. Print Examination venue Slip */}
                {selectedServiceId === 'exam_slip' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase italic">Examination Venue Slip Printing</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Acquire official allocations, dates, time matrices, and security seat codes.</p>
                    </div>

                    <div className="p-4 bg-white text-slate-900 rounded-2xl border shadow-inner font-mono text-[10px] space-y-4 max-w-lg mx-auto">
                      <div className="flex justify-between items-center border-b-2 border-slate-900 pb-2">
                        <span className="font-bold text-xs uppercase">UTME EXAMINATION VENUE SLIP</span>
                        <span className="font-bold text-[8px] bg-slate-200 border border-slate-900 px-1 py-0.5 rounded">EXAM ADMITTANCE</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[7.5px] text-slate-500 block uppercase font-bold">assigned center</span>
                          <span className="font-black text-slate-900 text-[9px] uppercase block leading-snug">{candidateState.examVenue}</span>
                        </div>
                        <div>
                          <span className="text-[7.5px] text-slate-500 block uppercase font-bold">examination date & time</span>
                          <span className="font-black text-slate-900 block font-mono uppercase">{candidateState.examDate}</span>
                          <span className="font-black text-slate-900 block font-mono">{candidateState.examTime}</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-300 pt-2 grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[7.5px] text-slate-500 block uppercase font-bold">seat number</span>
                          <span className="font-bold text-slate-900 text-xs font-mono">{candidateState.examSeat}</span>
                        </div>
                        <div>
                          <span className="text-[7.5px] text-slate-500 block uppercase font-bold">dossier code</span>
                          <span className="font-bold text-slate-900 font-mono text-xs">{candidateState.profileCode}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          updateState({ examSlipPrinted: true });
                          setSuccessMsg('Admittance Slip validated. Print drivers initialized.');
                        }}
                        className="w-full py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" /> Download Admittance Slip PDF
                      </button>
                    </div>
                  </div>
                )}

                {/* 9. Participate in UTME Mock CBT */}
                {selectedServiceId === 'mock_exam' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase italic">Interactive preparatory Mock CBT</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Solve 5 preparatory general questions to estimate and predict actual scores.</p>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-4 text-xs">
                      {mockIndex < mockQuestions.length ? (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase">
                            <span>Question {mockIndex + 1} of {mockQuestions.length}</span>
                            <span className="text-indigo-400">Mock Engine Active</span>
                          </div>

                          <div className="p-4 bg-slate-900 rounded-xl border border-white/5 font-extrabold uppercase text-white leading-relaxed">
                            {mockQuestions[mockIndex].q}
                          </div>

                          <div className="grid grid-cols-2 gap-2.5">
                            {mockQuestions[mockIndex].options.map((opt, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  if (opt === mockQuestions[mockIndex].ans) {
                                    setMockScore(prev => prev + 1);
                                  }
                                  if (mockIndex + 1 === mockQuestions.length) {
                                    const finalMockPercentage = ((mockScore + (opt === mockQuestions[mockIndex].ans ? 1 : 0)) / mockQuestions.length) * 400;
                                    updateState({ 
                                      mockExamTaken: true,
                                      mockExamScore: finalMockPercentage,
                                      utmeScore: Math.round(finalMockPercentage)
                                    });
                                    setSuccessMsg(`Mock Exam Complete! Calculated score prediction: ${Math.round(finalMockPercentage)} / 400.`);
                                  }
                                  setMockIndex(prev => prev + 1);
                                }}
                                className="p-3 bg-slate-900 hover:bg-indigo-600 border border-white/5 hover:border-indigo-500 rounded-xl font-bold uppercase text-slate-300 hover:text-white text-center cursor-pointer transition-all"
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 space-y-3">
                          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                          <div>
                            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">predicted scoreboard</span>
                            <span className="text-2xl font-black italic text-white block mt-1">{candidateState.utmeScore} / 400</span>
                          </div>
                          <button
                            onClick={() => {
                              setMockIndex(0);
                              setMockScore(0);
                            }}
                            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer"
                          >
                            Restart Mock Simulation
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 10. UTME Result Checking Gateway */}
                {selectedServiceId === 'result_check' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase italic">UTME Result Checking Gateway</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Query dynamic examination servers to access results.</p>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-4 text-xs">
                      <div className="space-y-2">
                        <label className="text-[8.5px] font-black text-indigo-400 uppercase tracking-widest block">Insert Registration Number / Profile Code</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 55019A12BC" 
                          value={candidateState.profileCode}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/10 rounded-xl outline-none focus:border-indigo-500 font-mono" 
                          readOnly
                        />
                      </div>

                      <button
                        onClick={() => {
                          setLoading(true);
                          setTimeout(() => {
                            setLoading(false);
                            if (candidateState.utmeScore === 0) {
                              updateState({ utmeScore: 312, resultChecked: true });
                            } else {
                              updateState({ resultChecked: true });
                            }
                            setSuccessMsg('Examination Results checked successfully.');
                          }, 1400);
                        }}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                      >
                        Query Results Database
                      </button>

                      {candidateState.resultChecked && (
                        <div className="p-4 bg-slate-900 rounded-xl border border-white/5 text-center space-y-3 font-mono text-[10px] text-slate-300">
                          <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest block">CANDIDATE EXAM MATRIX REPORT</span>
                          <div className="grid grid-cols-2 gap-3 uppercase font-bold text-left">
                            <div className="border-b border-white/5 pb-2">
                              <span>english:</span>
                              <span className="text-white block mt-0.5 font-black">78 / 100</span>
                            </div>
                            <div className="border-b border-white/5 pb-2">
                              <span>mathematics:</span>
                              <span className="text-white block mt-0.5 font-black">84 / 100</span>
                            </div>
                            <div>
                              <span>physics:</span>
                              <span className="text-white block mt-0.5 font-black">75 / 100</span>
                            </div>
                            <div>
                              <span>chemistry:</span>
                              <span className="text-white block mt-0.5 font-black">75 / 100</span>
                            </div>
                          </div>
                          <div className="border-t border-white/5 pt-2 flex justify-between font-black text-xs text-white">
                            <span>TOTAL OBTAINED SCORE:</span>
                            <span className="text-indigo-400 italic font-black">{candidateState.utmeScore || 312} / 400</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 11. Email Profile Linking Protocol */}
                {selectedServiceId === 'email_linking' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase italic">Email Profile Linking Protocol</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Connect valid email to profile records to grant access to CAPS panel.</p>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-4 text-xs">
                      <div>
                        <label className="text-[8.5px] font-black text-indigo-400 uppercase tracking-widest block mb-1.5">Candidate Email Address</label>
                        <input 
                          type="email" 
                          placeholder="e.g. candidate@gmail.com" 
                          value={candidateState.email}
                          onChange={(e) => updateState({ email: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/10 rounded-xl outline-none focus:border-indigo-500" 
                        />
                      </div>

                      <button
                        onClick={() => {
                          setLoading(true);
                          setTimeout(() => {
                            setLoading(false);
                            updateState({ emailLinked: true });
                            setSuccessMsg('Secure Email Link code dispatched and validated across channels.');
                          }, 1300);
                        }}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                      >
                        Link Email to Profile Code
                      </button>
                    </div>
                  </div>
                )}

                {/* 12. Print Original Result Slip */}
                {selectedServiceId === 'original_result' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase italic">Print Original Result Slip</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Vend standard original result slip with photographic identification.</p>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-4 text-xs">
                      {!candidateState.originalResultPrinted ? (
                        <div className="space-y-3">
                          <p className="text-[9.5px] text-slate-400 uppercase leading-relaxed font-semibold">Generating the Original Result slip containing photographic security identifiers requires a standard service validation fee.</p>
                          <button
                            onClick={() => {
                              if (spendWallet(1500)) {
                                setLoading(true);
                                setTimeout(() => {
                                  setLoading(false);
                                  updateState({ originalResultPrinted: true });
                                  setSuccessMsg('Original Result slip vended successfully.');
                                }, 1500);
                              }
                            }}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                          >
                            Pay result generation fee (₦1,500)
                          </button>
                        </div>
                      ) : (
                        <div className="p-4 bg-white text-slate-900 rounded-xl border font-mono text-[9px] space-y-4 max-w-lg mx-auto">
                          <div className="flex justify-between items-center border-b-2 border-slate-900 pb-2">
                            <span className="font-bold text-xs">ORIGINAL UTME RESULT CERTIFICATE</span>
                            <span className="font-bold text-[8px] bg-indigo-100 text-indigo-900 border border-indigo-900 px-1 py-0.5 rounded">PASSPORT VERIFIED</span>
                          </div>

                          <div className="flex gap-4 items-start">
                            <div className="w-16 h-16 bg-slate-200 border-2 border-slate-900 flex items-center justify-center text-slate-500 uppercase font-bold text-[8px] tracking-tighter rounded">
                              PHOTO AVATAR
                            </div>
                            <div className="flex-1 grid grid-cols-2 gap-2 text-[8.5px]">
                              <div>
                                <span className="text-slate-500 block uppercase font-bold text-[7px]">candidate name</span>
                                <span className="font-black text-slate-900 uppercase block">{candidateState.fullName}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block uppercase font-bold text-[7px]">registration number</span>
                                <span className="font-black text-slate-900 font-mono block">{candidateState.epin}</span>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-slate-300 pt-2 grid grid-cols-4 gap-2 text-center text-slate-800">
                            <div className="p-1 bg-slate-100 rounded">
                              <span className="block font-bold">ENG</span>
                              <span className="block font-black text-xs text-slate-900">78</span>
                            </div>
                            <div className="p-1 bg-slate-100 rounded">
                              <span className="block font-bold">MTH</span>
                              <span className="block font-black text-xs text-slate-900">84</span>
                            </div>
                            <div className="p-1 bg-slate-100 rounded">
                              <span className="block font-bold">PHY</span>
                              <span className="block font-black text-xs text-slate-900">75</span>
                            </div>
                            <div className="p-1 bg-slate-100 rounded">
                              <span className="block font-bold">CHM</span>
                              <span className="block font-black text-xs text-slate-900">75</span>
                            </div>
                          </div>

                          <div className="border-t border-slate-300 pt-2 flex justify-between font-black text-xs text-slate-900">
                            <span>TOTAL OBTAINED SCORE:</span>
                            <span className="text-indigo-600 font-extrabold italic">{candidateState.utmeScore} / 400</span>
                          </div>

                          <button
                            onClick={() => {
                              setSuccessMsg('Original PDF vended and archived on server nodes.');
                            }}
                            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" /> Export Result Certificate PDF
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 13. Change Course or Institution */}
                {selectedServiceId === 'change_course' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase italic">Change Course or Institution</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Permute institutional listings or shift choices post-exams safely.</p>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[8.5px] font-black text-indigo-400 block uppercase mb-1">New Chosen Institution</label>
                          <select 
                            className="w-full p-2.5 bg-slate-900 border border-white/5 rounded-lg text-white"
                            onChange={(e) => updateState({ primaryInstitution: e.target.value })}
                          >
                            <option>OBAFEMI AWOLOWO UNIVERSITY (OAU)</option>
                            <option>UNIVERSITY OF IBADAN (UI)</option>
                            <option>UNIVERSITY OF LAGOS (UNILAG)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[8.5px] font-black text-indigo-400 block uppercase mb-1">New Desired Course</label>
                          <select 
                            className="w-full p-2.5 bg-slate-900 border border-white/5 rounded-lg text-white"
                            onChange={(e) => updateState({ primaryCourse: e.target.value })}
                          >
                            <option>MECHANICAL ENGINEERING</option>
                            <option>COMPUTER SCIENCE</option>
                            <option>MEDICINE & SURGERY</option>
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (spendWallet(2500)) {
                            setLoading(true);
                            setTimeout(() => {
                              setLoading(false);
                              updateState({ courseChanged: true });
                              setSuccessMsg('Institution and course preferences updated on JAMB server mainframe logs.');
                            }, 1300);
                          }
                        }}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                      >
                        Authorize Change of Course (₦2,500)
                      </button>
                    </div>
                  </div>
                )}

                {/* 14. Bio-Data Correction Suite */}
                {selectedServiceId === 'data_correction' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase italic">Bio-Data Correction Suite</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Correct spelling mistakes in names, state of origin, gender, or DoB arrays.</p>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-4 text-xs">
                      <div>
                        <label className="text-[8.5px] font-black text-indigo-400 block uppercase mb-1.5">Correct Full Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. AMADI KINGSLEY" 
                          value={candidateState.fullName}
                          onChange={(e) => updateState({ fullName: e.target.value.toUpperCase() })}
                          className="w-full p-2.5 bg-slate-900 border border-white/5 rounded-lg text-white font-bold"
                        />
                      </div>

                      <button
                        onClick={() => {
                          if (spendWallet(2500)) {
                            setLoading(true);
                            setTimeout(() => {
                              setLoading(false);
                              updateState({ dataCorrected: true });
                              setSuccessMsg('Bio-data corrections submitted and validated on centralized mainframe databases.');
                            }, 1400);
                          }
                        }}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                      >
                        Authorize Correction (₦2,500)
                      </button>
                    </div>
                  </div>
                )}

                {/* 15. JAMB CAPS Status Command Centre */}
                {selectedServiceId === 'caps_monitor' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase italic">JAMB CAPS Status Command Centre</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Secure candidate log-in to monitor academic admittance status.</p>
                    </div>

                    <div className="p-5 bg-slate-950 rounded-2xl border border-indigo-500/10 space-y-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl" />
                      
                      <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">CENTRAL ADMISSIONS PROCESSING SYSTEM (CAPS)</span>
                        <span className="text-[8px] font-mono text-slate-500">SECURE SHELL</span>
                      </div>

                      <div className="space-y-3 font-mono text-[10px] text-slate-300">
                        <div>
                          <span className="text-slate-500 block uppercase text-[8px]">admitting institution</span>
                          <span className="text-white font-extrabold">{candidateState.primaryInstitution}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase text-[8px]">programme offered</span>
                          <span className="text-white font-extrabold">{candidateState.primaryCourse}</span>
                        </div>
                        
                        <div className="border-t border-white/5 pt-3">
                          <span className="text-slate-500 block uppercase text-[8px]">ADMISSION OFFER STATUS</span>
                          {candidateState.capsStatus === 'admitted' && (
                            <div className="space-y-3 mt-1.5">
                              <span className="text-emerald-400 font-black animate-pulse uppercase tracking-wider block">CONGRATULATIONS! YOU HAVE BEEN OFFERED PROVISIONAL ADMISSION.</span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    updateState({ capsStatus: 'accepted' });
                                    setSuccessMsg('You have ACCEPTED the admission. Keep print parameters secure.');
                                  }}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-black uppercase text-[8.5px] cursor-pointer"
                                >
                                  Accept Offer
                                </button>
                                <button
                                  onClick={() => {
                                    updateState({ capsStatus: 'rejected' });
                                    setError('You have REJECTED the admission offer.');
                                  }}
                                  className="px-4 py-2 bg-rose-650 hover:bg-rose-600 text-white rounded font-black uppercase text-[8.5px] cursor-pointer"
                                >
                                  Reject Offer
                                </button>
                              </div>
                            </div>
                          )}

                          {candidateState.capsStatus === 'accepted' && (
                            <span className="text-emerald-400 font-black block uppercase tracking-wider mt-1">ADMISSION OFFER ACCEPTED. VEND ADMISSION LETTER NEXT.</span>
                          )}

                          {candidateState.capsStatus === 'rejected' && (
                            <span className="text-rose-400 font-black block uppercase tracking-wider mt-1">ADMISSION OFFER REJECTED.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 16. Print JAMB Admission Letter */}
                {selectedServiceId === 'admission_letter' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase italic">Print JAMB Admission Letter</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Vend colored official admission letter required for physical university clearance.</p>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-4 text-xs">
                      {!candidateState.letterPrinted ? (
                        <div className="space-y-3">
                          <p className="text-[9.5px] text-slate-400 uppercase leading-relaxed font-semibold">Generating the colored, Registrar-stamped official Admission Letter requires a small administrative validation fee.</p>
                          <button
                            onClick={() => {
                              if (spendWallet(2000)) {
                                setLoading(true);
                                setTimeout(() => {
                                  setLoading(false);
                                  updateState({ letterPrinted: true });
                                  setSuccessMsg('Official JAMB Admission Letter generated successfully.');
                                }, 1500);
                              }
                            }}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                          >
                            Pay admission letter fee (₦2,000)
                          </button>
                        </div>
                      ) : (
                        <div className="p-4 bg-white text-slate-900 rounded-xl border font-mono text-[9px] space-y-4 max-w-lg mx-auto">
                          <div className="flex justify-between items-center border-b-2 border-slate-900 pb-2 text-center">
                            <span className="font-bold text-xs uppercase block w-full text-slate-900">THE JOINT ADMISSIONS AND MATRICULATION BOARD</span>
                          </div>

                          <div className="text-center font-bold text-[10px] uppercase text-indigo-900">
                            OFFICIAL PROVISIONAL ADMISSION LETTER
                          </div>

                          <div className="space-y-2 text-[8.5px] leading-relaxed text-slate-800">
                            <p>This is to confirm that <span className="font-bold text-slate-900">{candidateState.fullName}</span> has been offered admission to:</p>
                            <div className="p-2.5 bg-slate-100 rounded font-black text-slate-900 uppercase">
                              <div>INSTITUTION: {candidateState.primaryInstitution}</div>
                              <div>COURSE: {candidateState.primaryCourse}</div>
                              <div>DURATION: 4 YEARS (UTME)</div>
                            </div>
                            <p className="text-[7.5px] text-slate-500">Please present this document along with original credentials at the Office of the Registrar during physical clearance validation.</p>
                          </div>

                          <div className="flex justify-between items-center border-t border-slate-300 pt-3">
                            <span className="text-[7px] text-slate-400 block font-mono">REGISTRAR SECURE BARCODE</span>
                            <span className="font-bold font-mono text-emerald-600">VALIDATED STAMP</span>
                          </div>

                          <button
                            onClick={() => {
                              setSuccessMsg('Provisional Admission Letter PDF saved successfully.');
                            }}
                            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" /> Download provisional letter PDF
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 17. Linked Email Correction */}
                {selectedServiceId === 'email_update' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase italic">Linked Email Correction & Update</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fix misspelled or inaccessible linked email structures safely.</p>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-4 text-xs">
                      <div>
                        <label className="text-[8.5px] font-black text-indigo-400 block uppercase mb-1">New Intended Email Address</label>
                        <input 
                          type="email" 
                          placeholder="e.g. corrected@candidate.com" 
                          className="w-full p-2.5 bg-slate-900 border border-white/5 rounded-lg text-white"
                        />
                      </div>

                      <button
                        onClick={() => {
                          if (spendWallet(1000)) {
                            setLoading(true);
                            setTimeout(() => {
                              setLoading(false);
                              updateState({ emailCorrected: true });
                              setSuccessMsg('Linked profile email successfully updated on JAMB directories.');
                            }, 1200);
                          }
                        }}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                      >
                        Authorize Email Correction (₦1,000)
                      </button>
                    </div>
                  </div>
                )}

                {/* 18. Regularization of Admission */}
                {selectedServiceId === 'regularization' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase italic">Admission Regularization (Late Application)</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Validate direct university approvals onto the mainframe records.</p>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[8.5px] font-black text-indigo-400 block uppercase mb-1">Direct Admitting Institution</label>
                          <input 
                            type="text" 
                            placeholder="e.g. LASU" 
                            className="w-full p-2.5 bg-slate-900 border border-white/5 rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[8.5px] font-black text-indigo-400 block uppercase mb-1">Matriculation Number</label>
                          <input 
                            type="text" 
                            placeholder="e.g. 190201024" 
                            className="w-full p-2.5 bg-slate-900 border border-white/5 rounded-lg text-white font-mono"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (spendWallet(10000)) {
                            setLoading(true);
                            setTimeout(() => {
                              setLoading(false);
                              updateState({ regularized: true });
                              setSuccessMsg('Direct Admission Regularized and approved on Central JAMB mainframe databases.');
                            }, 1600);
                          }
                        }}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                      >
                        Authorize Regularization (₦10,000)
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>

          {/* Loading Overlay */}
          <AnimatePresence>
            {loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-4 z-50"
              >
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
                  <Sparkles className="w-6 h-6 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest animate-pulse">
                  transmitting data to jamb central mainframe...
                </span>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </>
    )}

      </motion.div>
    </div>
  );
};
