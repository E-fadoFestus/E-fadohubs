import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Calculator, 
  ArrowRight, 
  BookOpen, 
  Search, 
  CheckCircle2, 
  GraduationCap, 
  Brain, 
  Sparkles, 
  Clock, 
  Send,
  MessageSquare,
  Award,
  Calendar,
  XCircle,
  TrendingUp,
  FileText,
  Users2,
  Cpu,
  BookMarked,
  Compass,
  HelpCircle,
  Check,
  Building,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ==========================================
// 1. DYNAMIC CGPA & GPA CALCULATOR
// ==========================================
interface CourseItem {
  id: string;
  name: string;
  units: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
}

interface SemesterLog {
  id: string;
  name: string;
  gpa: number;
  totalUnits: number;
}

export const CgpaCalculator: React.FC = () => {
  const [courses, setCourses] = useState<CourseItem[]>([
    { id: '1', name: 'MTH 101', units: 3, grade: 'A' },
    { id: '2', name: 'PHY 101', units: 4, grade: 'B' },
    { id: '3', name: 'CHM 101', units: 4, grade: 'A' }
  ]);
  const [courseName, setCourseName] = useState('');
  const [courseUnits, setCourseUnits] = useState<number>(3);
  const [courseGrade, setCourseGrade] = useState<'A' | 'B' | 'C' | 'D' | 'E' | 'F'>('A');
  const [semesters, setSemesters] = useState<SemesterLog[]>([]);
  const [activeTab, setActiveTab] = useState<'current' | 'logs'>('current');

  const gradePoints = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };

  const calculateGpa = () => {
    let totalPoints = 0;
    let totalUnits = 0;
    courses.forEach(c => {
      totalPoints += gradePoints[c.grade] * c.units;
      totalUnits += c.units;
    });
    return totalUnits > 0 ? Number((totalPoints / totalUnits).toFixed(2)) : 0;
  };

  const handleAddCourse = () => {
    if (!courseName.trim()) return;
    setCourses(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name: courseName.toUpperCase(),
        units: courseUnits,
        grade: courseGrade
      }
    ]);
    setCourseName('');
  };

  const handleRemoveCourse = (id: string) => {
    setCourses(prev => prev.filter(c => c.id !== id));
  };

  const handleSaveSemester = () => {
    const gpa = calculateGpa();
    if (gpa === 0) return;
    
    let totalUnits = 0;
    courses.forEach(c => totalUnits += c.units);

    setSemesters(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name: `Semester ${prev.length + 1}`,
        gpa,
        totalUnits
      }
    ]);
    setCourses([]);
  };

  const calculateCgpa = () => {
    if (semesters.length === 0) return calculateGpa();
    let totalWeightedGpa = 0;
    let totalUnits = 0;
    semesters.forEach(s => {
      totalWeightedGpa += s.gpa * s.totalUnits;
      totalUnits += s.totalUnits;
    });
    return totalUnits > 0 ? Number((totalWeightedGpa / totalUnits).toFixed(2)) : 0;
  };

  return (
    <div className="bg-slate-950 p-6 md:p-8 rounded-[2rem] border border-white/5 space-y-6">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-400" />
            Tactical CGPA Calculator Node
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Syllabus-aligned grade point evaluator</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
              activeTab === 'current' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'
            }`}
          >
            Active Semester
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
              activeTab === 'logs' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'
            }`}
          >
            Saves ({semesters.length})
          </button>
        </div>
      </div>

      {activeTab === 'current' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Form */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-white/5">
              <input
                type="text"
                placeholder="Course Code"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs font-bold text-white uppercase tracking-wider outline-none focus:border-indigo-500"
              />
              <select
                value={courseUnits}
                onChange={(e) => setCourseUnits(Number(e.target.value))}
                className="bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
              >
                {[1, 2, 3, 4, 5, 6].map(u => (
                  <option key={u} value={u} className="bg-slate-900">{u} Credits</option>
                ))}
              </select>
              <select
                value={courseGrade}
                onChange={(e) => setCourseGrade(e.target.value as any)}
                className="bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
              >
                {Object.keys(gradePoints).map(g => (
                  <option key={g} value={g} className="bg-slate-900">Grade {g}</option>
                ))}
              </select>
              <button
                onClick={handleAddCourse}
                className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-1 py-2.5 sm:py-0"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            {/* Current Course List */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2">
              {courses.map(c => (
                <div key={c.id} className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center gap-4">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span className="text-xs font-black uppercase text-white tracking-widest">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-[10px] font-black text-slate-400 uppercase">{c.units} Units</span>
                    <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-md text-[10px] font-black text-indigo-400">
                      Grade {c.grade}
                    </span>
                    <button
                      onClick={() => handleRemoveCourse(c.id)}
                      className="p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {courses.length === 0 && (
                <p className="text-center py-8 text-xs font-bold text-slate-500 uppercase tracking-tight">No courses loaded in this semester block</p>
              )}
            </div>
          </div>

          {/* Results Side */}
          <div className="bg-slate-900 p-6 rounded-[2rem] border border-indigo-500/10 flex flex-col justify-between items-center text-center space-y-6">
            <div>
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">Active evaluation</span>
              <div className="w-28 h-28 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 flex flex-col items-center justify-center mt-4 shadow-lg shadow-indigo-500/5 animate-pulse-slow">
                <span className="text-3xl font-black text-white italic">{calculateGpa()}</span>
                <span className="text-[8px] font-black uppercase text-indigo-400 mt-1">Semester GPA</span>
              </div>
            </div>

            <div className="w-full space-y-3">
              <div className="flex justify-between text-xs border-b border-white/5 pb-2">
                <span className="font-bold text-slate-400 uppercase">Weighted CGPA</span>
                <span className="font-black text-white">{calculateCgpa()}</span>
              </div>
              <button
                onClick={handleSaveSemester}
                disabled={courses.length === 0}
                className="w-full py-3.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-40"
              >
                Log Semester To Archive
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-white/5">
            <span className="text-xs font-black text-slate-400 uppercase">Cumulative CGPA</span>
            <span className="text-base font-black text-emerald-400">{calculateCgpa()}</span>
          </div>

          <div className="space-y-2">
            {semesters.map((s, idx) => (
              <div key={s.id} className="flex justify-between items-center bg-slate-900/60 p-4 rounded-xl border border-white/5">
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">{s.name}</h4>
                  <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{s.totalUnits} Units evaluations</p>
                </div>
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md text-[10px] font-black">
                  GPA: {s.gpa}
                </span>
              </div>
            ))}
            {semesters.length === 0 && (
              <p className="text-center py-12 text-xs font-bold text-slate-500 uppercase tracking-tight">No saved semesters in this terminal session</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


// ==========================================
// 2. SIWES LOGBOOK PLANNER
// ==========================================
interface SiwesEntry {
  id: string;
  week: number;
  dept: string;
  activities: string;
  status: 'PENDING' | 'SIGNED_OFF';
  comment?: string;
}

export const SiwesLogbook: React.FC = () => {
  const [entries, setEntries] = useState<SiwesEntry[]>([
    {
      id: '1',
      week: 1,
      dept: 'Systems Engineering',
      activities: 'Assisted in network synchronization and server deployment.',
      status: 'SIGNED_OFF',
      comment: 'Excellent analytical focus on local architectures.'
    }
  ]);
  const [week, setWeek] = useState(2);
  const [dept, setDept] = useState('');
  const [activities, setActivities] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddLog = () => {
    if (!dept.trim() || !activities.trim()) return;
    
    setIsSubmitting(true);
    
    setTimeout(() => {
      // Simulate industrial supervisor feedback
      const supervisorComments = [
        "Impressive industrial adaptation. Keep focus.",
        "Demonstrates solid conceptual foundation in daily tasks.",
        "Good practical reporting. Ensure documentation stays strict.",
        "Excellent contribution to site engineering processes."
      ];
      const randomComment = supervisorComments[Math.floor(Math.random() * supervisorComments.length)];

      setEntries(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          week,
          dept: dept.toUpperCase(),
          activities,
          status: 'SIGNED_OFF',
          comment: randomComment
        }
      ]);
      setDept('');
      setActivities('');
      setWeek(prev => prev + 1);
      setIsSubmitting(false);
    }, 1200);
  };

  return (
    <div className="bg-slate-950 p-6 md:p-8 rounded-[2rem] border border-white/5 space-y-6">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            Sovereign SIWES Logbook Node
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Simulated Industrial Training Log</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-white/5 space-y-4 h-fit">
          <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest">New Weekly Activity Report</h4>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Reporting Week</label>
                <input
                  type="number"
                  value={week}
                  onChange={(e) => setWeek(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs font-bold text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Department</label>
                <input
                  type="text"
                  placeholder="e.g. IT Operations"
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs font-bold text-white uppercase tracking-wider outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Detailed Activity Log</label>
              <textarea
                placeholder="Describe your technical contributions this week..."
                value={activities}
                onChange={(e) => setActivities(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleAddLog}
              disabled={isSubmitting || !dept.trim() || !activities.trim()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40"
            >
              {isSubmitting ? "Submitting to Supervisor..." : "Submit to Industry Supervisor"}
            </button>
          </div>
        </div>

        {/* List of Entries */}
        <div className="lg:col-span-2 space-y-4 max-h-[380px] overflow-y-auto pr-2">
          {entries.map(e => (
            <div key={e.id} className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-500/20 text-indigo-400 rounded text-[8px] font-black uppercase tracking-widest">Week {e.week}</span>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider mt-2">{e.dept}</h4>
                </div>
                <span className="flex items-center gap-1 text-[8px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 border border-emerald-500/20 rounded-md">
                  <CheckCircle2 className="w-3 h-3" /> Signed Off
                </span>
              </div>

              <p className="text-slate-300 text-xs font-bold leading-relaxed mb-4 uppercase tracking-tight italic select-text">
                {e.activities}
              </p>

              {e.comment && (
                <div className="p-3 bg-slate-950 border border-white/5 rounded-xl flex gap-3 items-start">
                  <MessageSquare className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Supervisor Signoff Comment:</span>
                    <p className="text-[10px] text-indigo-300 font-bold leading-relaxed mt-0.5 uppercase tracking-tight italic select-text">{e.comment}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
          {entries.length === 0 && (
            <p className="text-center py-16 text-xs font-bold text-slate-500 uppercase tracking-tight">No industrial log activities reported yet</p>
          )}
        </div>
      </div>
    </div>
  );
};


// ==========================================
// 3. CHILD DEVELOPMENT & MILESTONES CHECKLIST (Parent / Nursery)
// ==========================================
interface MilestoneItem {
  id: string;
  category: 'COGNITIVE' | 'LANGUAGE' | 'MOTOR' | 'SOCIAL';
  title: string;
  desc: string;
}

const NURSERY_MILESTONES: MilestoneItem[] = [
  { id: 'm1', category: 'COGNITIVE', title: 'Color Recognition', desc: 'Identifies and names at least four distinct colors.' },
  { id: 'm2', category: 'LANGUAGE', title: 'Sentence Framing', desc: 'Speaks in full conversational sentences of 4-6 words.' },
  { id: 'm3', category: 'MOTOR', title: 'Pencil Control', desc: 'Grips a writing instrument to trace shapes or letters.' },
  { id: 'm4', category: 'SOCIAL', title: 'Cooperative Play', desc: 'Shares and interacts cooperatively with other classmates.' },
  { id: 'm5', category: 'COGNITIVE', title: 'Counting (1-10)', desc: 'Sequences and counts up to 10 physical items.' }
];

export const MilestoneTracker: React.FC = () => {
  const [completed, setCompleted] = useState<string[]>(['m1', 'm3']);

  const handleToggle = (id: string) => {
    setCompleted(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const getPercentage = () => {
    return Math.round((completed.length / NURSERY_MILESTONES.length) * 100);
  };

  return (
    <div className="bg-slate-950 p-6 md:p-8 rounded-[2rem] border border-white/5 space-y-6">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400" />
            Preschool Development Checklist Node
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Parental cognitive progress tracker</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Milestones list */}
        <div className="lg:col-span-2 space-y-3">
          {NURSERY_MILESTONES.map(item => {
            const isChecked = completed.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => handleToggle(item.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                  isChecked 
                    ? 'bg-indigo-600/10 border-indigo-500/30 text-white' 
                    : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-850'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-slate-950 border border-white/5 text-[8px] font-black text-slate-400 rounded uppercase tracking-widest">{item.category}</span>
                    <h4 className="text-xs font-black uppercase tracking-wider">{item.title}</h4>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.desc}</p>
                </div>

                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                  isChecked ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-700'
                }`}>
                  {isChecked && <CheckCircle2 className="w-4 h-4" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Milestone metrics */}
        <div className="bg-slate-900 p-6 rounded-[2rem] border border-white/5 flex flex-col justify-between items-center text-center space-y-6">
          <div className="space-y-2">
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">Synchronization Index</span>
            <div className="w-24 h-24 rounded-full border-4 border-indigo-500/10 border-t-indigo-500 flex flex-col items-center justify-center shadow-lg shadow-indigo-500/5 mt-4">
              <span className="text-2xl font-black text-white italic">{getPercentage()}%</span>
              <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">Completed</span>
            </div>
          </div>

          <div className="text-left w-full space-y-3 p-4 bg-slate-950 border border-white/5 rounded-xl">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Checklist evaluation recommendation:</span>
            <p className="text-[10px] text-slate-300 font-bold leading-relaxed uppercase tracking-tight italic">
              {getPercentage() < 50 
                ? "Initiate structured counting and vocabulary games inside our Primary Hub modules." 
                : "Exceptional cognitive adaptability. Proceed to introductory phonic syllabus modules."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


// ==========================================
// 4. CAPS ADMISSION STATUS & CUT-OFFS DATABASE
// ==========================================
interface CutOffItem {
  institution: string;
  course: string;
  cutoff: number;
  type: string;
}

const ADMISSION_DATABASE: CutOffItem[] = [
  { institution: "University of Lagos (UNILAG)", course: "Medicine & Surgery", cutoff: 285, type: "Competitive" },
  { institution: "University of Lagos (UNILAG)", course: "Computer Science", cutoff: 265, type: "Competitive" },
  { institution: "University of Ibadan (UI)", course: "Law", cutoff: 270, type: "Competitive" },
  { institution: "University of Ibadan (UI)", course: "Mechanical Engineering", cutoff: 250, type: "Standard" },
  { institution: "Obafemi Awolowo University (OAU)", course: "Nursing Science", cutoff: 260, type: "Competitive" },
  { institution: "Obafemi Awolowo University (OAU)", course: "Economics", cutoff: 230, type: "Standard" },
  { institution: "University of Nigeria Nsukka (UNN)", course: "Pharmacy", cutoff: 255, type: "Competitive" },
  { institution: "Ahmadu Bello University (ABU)", course: "Civil Engineering", cutoff: 220, type: "Standard" }
];

export const AdmissionCutOffs: React.FC = () => {
  const [search, setSearch] = useState('');
  const [capsChecking, setCapsChecking] = useState(false);
  const [capsStatus, setCapsStatus] = useState<string | null>(null);

  const filtered = ADMISSION_DATABASE.filter(item => 
    item.institution.toLowerCase().includes(search.toLowerCase()) || 
    item.course.toLowerCase().includes(search.toLowerCase())
  );

  const handleCheckCaps = () => {
    setCapsChecking(true);
    setCapsStatus(null);
    setTimeout(() => {
      setCapsChecking(false);
      setCapsStatus("CONGRATULATIONS! Your EFADO academic node has been approved for admission into level 1. Please navigate to JAMB CAPS to accept this offer.");
    }, 1500);
  };

  return (
    <div className="bg-slate-950 p-6 md:p-8 rounded-[2rem] border border-white/5 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-400" />
            JAMB CAPS Cut-Off & Admission Matrix
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Interactive cut-off queries and CAPS tracker</p>
        </div>

        <button
          onClick={handleCheckCaps}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
        >
          Check CAPS Status
        </button>
      </div>

      <AnimatePresence>
        {capsStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-5 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl flex gap-4 items-start"
          >
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Active Admission Alert:</span>
              <p className="text-xs text-white font-bold leading-relaxed mt-1 uppercase tracking-tight select-text">{capsStatus}</p>
            </div>
            <button onClick={() => setCapsStatus(null)} className="text-slate-500 hover:text-white ml-auto">
              <XCircle className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search by University name or Course..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-xs font-bold text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 transition-all uppercase tracking-wider"
        />
      </div>

      {/* Database Table */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden max-h-[220px] overflow-y-auto pr-2">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-white/5">
            <tr>
              <th className="px-6 py-4">Institution</th>
              <th className="px-6 py-4">Course</th>
              <th className="px-6 py-4 text-right">Required Cut-Off</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-bold uppercase tracking-tight text-[11px]">
            {filtered.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-850 transition-colors">
                <td className="px-6 py-4 text-white font-black select-text">{item.institution}</td>
                <td className="px-6 py-4 select-text">{item.course}</td>
                <td className="px-6 py-4 text-right text-indigo-400 font-black">{item.cutoff}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center py-12 text-xs font-bold text-slate-500 uppercase tracking-tight">No university data matched your query</p>
        )}
      </div>

      {capsChecking && (
        <div className="flex items-center gap-3 justify-center py-6">
          <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Authenticating with CAPS database...</span>
        </div>
      )}
    </div>
  );
};


// ==========================================
// 5. PRIMARY ACADEMIC SPEED-MATH CHALLENGE GAME
// ==========================================
export const PrimarySchoolGame: React.FC = () => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [operator, setOperator] = useState<'+' | '-'>('+');
  const [options, setOptions] = useState<number[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isPlaying, setIsPlaying] = useState(false);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [userSelection, setUserSelection] = useState<number | null>(null);

  const generateQuestion = () => {
    const n1 = Math.floor(Math.random() * 15) + 5;
    const n2 = Math.floor(Math.random() * 12) + 1;
    const op = Math.random() > 0.5 ? '+' : '-';
    
    const ans = op === '+' ? n1 + n2 : n1 - n2;
    
    setNum1(n1);
    setNum2(n2);
    setOperator(op as any);
    setCorrectAnswer(ans);
    setAnswered(null);
    setUserSelection(null);

    // Generate options
    const rawOptions = [
      ans,
      ans + Math.floor(Math.random() * 3) + 1,
      ans - Math.floor(Math.random() * 3) - 1,
      ans + 5
    ];
    // Shuffle options
    setOptions(rawOptions.sort(() => Math.random() - 0.5));
  };

  useEffect(() => {
    let timer: any;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  const handleStart = () => {
    setScore(0);
    setTimeLeft(15);
    setIsPlaying(true);
    generateQuestion();
  };

  const handleAnswer = (val: number) => {
    if (answered !== null) return;
    setUserSelection(val);
    if (val === correctAnswer) {
      setScore(prev => prev + 1);
      setAnswered(true);
      setTimeout(() => {
        generateQuestion();
      }, 800);
    } else {
      setAnswered(false);
      setTimeout(() => {
        generateQuestion();
      }, 1500);
    }
  };

  return (
    <div className="bg-slate-950 p-6 md:p-8 rounded-[2rem] border border-white/5 space-y-6">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400 animate-pulse" />
            Primary Hub Arithmetic Speed Challenge
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Mental mathematics simulator game</p>
        </div>
      </div>

      {!isPlaying ? (
        <div className="flex flex-col items-center justify-center text-center py-12 space-y-6 max-w-sm mx-auto">
          <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-indigo-400">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-black text-white uppercase tracking-tight">Are you ready to test your speed?</h4>
            <p className="text-slate-400 text-xs mt-2 uppercase tracking-tight">Solve as many arithmetic challenges as possible before the timer ticks down.</p>
          </div>
          <button
            onClick={handleStart}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            Start Speed Challenge
          </button>
        </div>
      ) : (
        <div className="space-y-6 max-w-xl mx-auto">
          {/* Progress indicators */}
          <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-white/5">
            <span className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase">
              <Clock className="w-4 h-4 text-rose-500" /> Time Left: {timeLeft}s
            </span>
            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black rounded uppercase">Score: {score}</span>
          </div>

          {/* Equation Grid */}
          <div className="bg-slate-900 p-8 rounded-[2rem] border border-white/5 text-center text-3xl font-black italic tracking-wider text-white">
            {num1} {operator} {num2} = ?
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-2 gap-4">
            {options.map((opt, idx) => {
              const isSelected = userSelection === opt;
              const isCorrect = opt === correctAnswer;
              
              let style = "bg-slate-900 border-white/5 text-slate-300 hover:bg-slate-850";
              if (answered !== null) {
                if (isCorrect) style = "bg-emerald-500/15 border-emerald-500 text-emerald-400";
                else if (isSelected) style = "bg-rose-500/15 border-rose-500 text-rose-400";
                else style = "bg-slate-950 opacity-40 border-transparent text-slate-500";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(opt)}
                  disabled={answered !== null}
                  className={`p-5 rounded-2xl border font-black text-lg transition-all duration-300 flex justify-between items-center ${style}`}
                >
                  <span>{opt}</span>
                  {answered !== null && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  {answered !== null && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-500" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};


// ==========================================
// 6. POSTGRADUATE THESIS & DISSERTATION PLANNER (PHD & MASTER'S)
// ==========================================
interface ThesisTask {
  id: string;
  title: string;
  phase: 'conceptual' | 'proposal' | 'research' | 'writing' | 'defense';
  done: boolean;
}

interface CitationItem {
  id: string;
  author: string;
  year: string;
  title: string;
  journal: string;
  type: 'APA' | 'Harvard' | 'MLA';
}

export const ThesisPlanner: React.FC = () => {
  const [topic, setTopic] = useState("Evaluation of Distributed Ledger Consensus Speeds for African Financial Ingress");
  const [problem, setProblem] = useState("Existing banking hubs incur high database replication costs, resulting in over-delayed settlement times for small cross-border payments.");
  const [academicTone, setAcademicTone] = useState(false);
  const [tasks, setTasks] = useState<ThesisTask[]>([
    { id: '1', title: 'Complete literature search on cross-border blockchain protocols', phase: 'conceptual', done: true },
    { id: '2', title: 'Formulate thesis proposal and research questions', phase: 'proposal', done: true },
    { id: '3', title: 'Obtain institutional ethics and data collection authorization', phase: 'proposal', done: false },
    { id: '4', title: 'Collect consensus telemetry datasets from test networks', phase: 'research', done: false },
    { id: '5', title: 'Build and execute performance analysis simulators', phase: 'research', done: false },
    { id: '6', title: 'Draft Literature Review (Chapters 1 & 2)', phase: 'writing', done: false },
    { id: '7', title: 'Analyze empirical metrics and draft Methodology (Chapter 3)', phase: 'writing', done: false },
    { id: '8', title: 'Submit dissertation script for internal pre-defense board', phase: 'defense', done: false }
  ]);

  const [citations, setCitations] = useState<CitationItem[]>([
    { id: '1', author: 'Alade, S. & Eniola, O.', year: '2025', title: 'Sub-Saharan FinTech Node Performance Under Stress', journal: 'Journal of Sovereign Systems, 14(2)', type: 'APA' },
    { id: '2', author: 'Ibrahim, C.', year: '2024', title: 'Distributed Ledgers for Low-Latency African Settlement Protocols', journal: 'African Technology Review, 8(4)', type: 'Harvard' }
  ]);

  // Citation inputs
  const [cAuthor, setCAuthor] = useState('');
  const [cYear, setCYear] = useState('');
  const [cTitle, setCTitle] = useState('');
  const [cJournal, setCJournal] = useState('');
  const [cType, setCType] = useState<'APA' | 'Harvard' | 'MLA'>('APA');

  const handleAddTask = (title: string, phase: any) => {
    if (!title.trim()) return;
    setTasks(prev => [...prev, { id: Date.now().toString(), title, phase, done: false }]);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleAddCitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cAuthor || !cTitle || !cYear) return;
    setCitations(prev => [...prev, { id: Date.now().toString(), author: cAuthor, year: cYear, title: cTitle, journal: cJournal || 'Self Published', type: cType }]);
    setCAuthor('');
    setCYear('');
    setCTitle('');
    setCJournal('');
  };

  const formatCitation = (cit: CitationItem) => {
    if (cit.type === 'APA') {
      return `${cit.author} (${cit.year}). ${cit.title}. *${cit.journal}*.`;
    } else if (cit.type === 'MLA') {
      return `${cit.author}. "${cit.title}." *${cit.journal}*, ${cit.year}.`;
    } else {
      return `${cit.author}, ${cit.year}. ${cit.title}. *${cit.journal}*.`;
    }
  };

  const phases = [
    { id: 'conceptual', name: 'Conceptual Stage' },
    { id: 'proposal', name: 'Proposal stage' },
    { id: 'research', name: 'Data & Research' },
    { id: 'writing', name: 'Writing Thesis' },
    { id: 'defense', name: 'Viva Oral Defense' }
  ];

  const currentProgress = Math.round((tasks.filter(t => t.done).length / tasks.length) * 100);

  return (
    <div className="bg-slate-950 p-6 md:p-8 rounded-[2.5rem] border border-white/5 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4">
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-indigo-400" />
            Postgraduate Thesis Roadmap & Planner
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Ph.D. & Master's Academic Milestone Suite</p>
        </div>
        <div className="px-4 py-1.5 bg-indigo-500/15 border border-indigo-500/30 rounded-xl text-indigo-300 text-[10px] font-black uppercase tracking-wider">
          Roadmap Complete: {currentProgress}%
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Topic formulation & citations */}
        <div className="lg:col-span-5 space-y-5">
          {/* Topic Formulation */}
          <div className="p-5 bg-slate-900 rounded-3xl border border-white/5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block">Thesis Concept Definition</span>
              <button
                type="button"
                onClick={() => {
                  setAcademicTone(!academicTone);
                  if (!academicTone) {
                    setTopic("An Empirical telemetrical Investigation into Distributed Consensus Latency Protocols across Sub-Saharan Financial Ingress Portals");
                  } else {
                    setTopic("Evaluation of Distributed Ledger Consensus Speeds for African Financial Ingress");
                  }
                }}
                className="text-[9px] font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-widest flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {academicTone ? "Simplify Title" : "Academic Polish"}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[8px] font-mono font-bold text-slate-500 uppercase block mb-1">PROPOSED RESEARCH TITLE</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-white/5 rounded-xl text-xs font-semibold text-white outline-none focus:border-indigo-500 h-20 resize-none transition-all"
                />
              </div>
              <div>
                <label className="text-[8px] font-mono font-bold text-slate-500 uppercase block mb-1">STATEMENT OF THE PROBLEM</label>
                <textarea
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-white/5 rounded-xl text-xs font-semibold text-white outline-none focus:border-indigo-500 h-20 resize-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Citations Organizer */}
          <div className="p-5 bg-slate-900 rounded-3xl border border-white/5 space-y-4">
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block">Citation & Literature Vault</span>
            
            <form onSubmit={handleAddCitation} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Author(s)"
                  value={cAuthor}
                  onChange={(e) => setCAuthor(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-white/5 rounded-lg text-[10px] text-white outline-none focus:border-indigo-500 font-semibold"
                />
                <input
                  type="text"
                  placeholder="Year"
                  value={cYear}
                  onChange={(e) => setCYear(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-white/5 rounded-lg text-[10px] text-white outline-none focus:border-indigo-500 font-semibold"
                />
                <select
                  value={cType}
                  onChange={(e: any) => setCType(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-white/5 rounded-lg text-[10px] text-white outline-none focus:border-indigo-500 font-semibold cursor-pointer"
                >
                  <option value="APA">APA</option>
                  <option value="Harvard">Harvard</option>
                  <option value="MLA">MLA</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Source Title"
                value={cTitle}
                onChange={(e) => setCTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-white/5 rounded-lg text-[10px] text-white outline-none focus:border-indigo-500 font-semibold"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Journal or Publisher"
                  value={cJournal}
                  onChange={(e) => setCJournal(e.target.value)}
                  className="flex-grow px-3 py-2 bg-slate-950 border border-white/5 rounded-lg text-[10px] text-white outline-none focus:border-indigo-500 font-semibold"
                />
                <button
                  type="submit"
                  className="px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Add Source
                </button>
              </div>
            </form>

            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
              {citations.map((cit) => (
                <div key={cit.id} className="p-2.5 bg-slate-950/80 rounded-xl border border-white/5 text-[10px] font-medium text-slate-300 leading-normal flex justify-between gap-2">
                  <span dangerouslySetInnerHTML={{ __html: formatCitation(cit) }} />
                  <button
                    onClick={() => setCitations(prev => prev.filter(c => c.id !== cit.id))}
                    className="text-rose-400 hover:text-rose-300 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Milestones List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 bg-slate-900 rounded-3xl border border-white/5 flex flex-col h-full">
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block mb-4">Milestone Roadmap Phases</span>
            
            {/* New Task Entry */}
            <div className="flex gap-2 mb-4">
              <input
                id="new-milestone-input"
                type="text"
                placeholder="Type a new custom thesis milestone..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const inputEl = document.getElementById('new-milestone-input') as HTMLInputElement;
                    handleAddTask(inputEl.value, 'research');
                    inputEl.value = '';
                  }
                }}
                className="flex-grow px-4 py-2.5 bg-slate-950 border border-white/5 rounded-xl text-xs text-white outline-none focus:border-indigo-500 font-semibold"
              />
              <button
                type="button"
                onClick={() => {
                  const inputEl = document.getElementById('new-milestone-input') as HTMLInputElement;
                  handleAddTask(inputEl.value, 'research');
                  inputEl.value = '';
                }}
                className="px-4.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            {/* List by phase */}
            <div className="space-y-4 overflow-y-auto max-h-[340px] pr-1">
              {phases.map((phase) => {
                const phaseTasks = tasks.filter(t => t.phase === phase.id);
                if (phaseTasks.length === 0) return null;
                return (
                  <div key={phase.id} className="space-y-2">
                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-1">{phase.name}</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {phaseTasks.map((task) => (
                        <div 
                          key={task.id}
                          onClick={() => toggleTask(task.id)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            task.done 
                              ? 'bg-indigo-600/5 border-indigo-500/20 opacity-70' 
                              : 'bg-slate-950 border-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                              task.done ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-600 bg-slate-900'
                            }`}>
                              {task.done && <Check className="w-3 h-3" />}
                            </div>
                            <span className={`text-xs font-semibold uppercase tracking-wide leading-tight ${task.done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                              {task.title}
                            </span>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTasks(prev => prev.filter(t => t.id !== task.id));
                            }}
                            className="text-slate-500 hover:text-rose-400 transition-colors shrink-0 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// ==========================================
// 7. ORAL VIVA-VOCE MOCK PANEL SIMULATOR (POSTGRADUATE)
// ==========================================
interface VivaMessage {
  id: string;
  sender: 'panel' | 'candidate';
  text: string;
  category?: string;
}

export const VivaSimulator: React.FC = () => {
  const [panelVibe, setPanelVibe] = useState<'SUPPORTIVE' | 'STANDARD' | 'HOSTILE'>('STANDARD');
  const [activeSession, setActiveSession] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [messages, setMessages] = useState<VivaMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [confidence, setConfidence] = useState(70);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const vivaQuestions = [
    {
      category: "ORIGINALITY & CONTRIBUTION",
      question: "Could you articulate in clear, precise terms what the unique original contribution of your thesis is, and how it departs from contemporary models?"
    },
    {
      category: "METHODOLOGY ROBUSTNESS",
      question: "How do you defend your choice of sample size and the specific empirical telemetry algorithms over more traditional qualitative heuristics?"
    },
    {
      category: "LIMITATIONS & BIAS",
      question: "Looking objectively at your Chapter 5 discussion, what major methodology compromises or statistical bias are inherent in your results?"
    },
    {
      category: "LITERATURE CONTEXT",
      question: "How does your distributed consensus model align with the seminal 2021 work of Alade & Ibrahim on Sub-Saharan network architectures?"
    }
  ];

  const handleStartSession = () => {
    setActiveSession(true);
    setCurrentQuestionIdx(0);
    setConfidence(70);
    
    let introduction = "Welcome, candidate. The doctoral board is now convened. ";
    if (panelVibe === 'SUPPORTIVE') {
      introduction += "We have read your dissertation with keen interest. Please present your core defense calmly.";
    } else if (panelVibe === 'HOSTILE') {
      introduction += "We have noted several severe methodology anomalies in your write-up. We expect rigid defenses of your telemetry assertions.";
    } else {
      introduction += "We will now begin the defense evaluation. Be precise and concise with your parameters.";
    }

    setMessages([
      { id: 'intro', sender: 'panel', text: introduction },
      { id: 'q0', sender: 'panel', text: vivaQuestions[0].question, category: vivaQuestions[0].category }
    ]);
  };

  const handleSendResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: VivaMessage = {
      id: `u-${Date.now()}`,
      sender: 'candidate',
      text: inputText
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsEvaluating(true);

    setTimeout(() => {
      // Evaluate response length & keywords for simulated confidence updates
      const lower = userMsg.text.toLowerCase();
      let feedback = "";
      let confidenceDelta = 0;

      if (lower.length < 25) {
        feedback = panelVibe === 'HOSTILE' 
          ? "That is a remarkably shallow answer for a PhD candidate. You must elaborate extensively."
          : "We require more detail. Please speak more to the operational mechanics.";
        confidenceDelta = -15;
      } else if (lower.includes('limit') || lower.includes('algorithm') || lower.includes('consensus') || lower.includes('empirical')) {
        feedback = panelVibe === 'SUPPORTIVE'
          ? "Excellent defense. You highlighted the core boundaries and validated your variables precisely."
          : "A reasonable defense. We accept the mathematical justification you've provided.";
        confidenceDelta = 10;
      } else {
        feedback = "The panel notes your stance, but you did not fully resolve our technical inquiry.";
        confidenceDelta = -2;
      }

      setConfidence(prev => Math.min(100, Math.max(0, prev + confidenceDelta)));

      const panelResponseMsg: VivaMessage = {
        id: `fb-${Date.now()}`,
        sender: 'panel',
        text: feedback
      };

      const nextIdx = currentQuestionIdx + 1;
      setIsEvaluating(false);

      if (nextIdx < vivaQuestions.length) {
        setCurrentQuestionIdx(nextIdx);
        setMessages(prev => [
          ...prev, 
          panelResponseMsg, 
          { 
            id: `q-${nextIdx}`, 
            sender: 'panel', 
            text: vivaQuestions[nextIdx].question, 
            category: vivaQuestions[nextIdx].category 
          }
        ]);
      } else {
        // End of session
        const finalStatus = confidence >= 60 
          ? "CONGRATULATIONS, CANDIDATE! The doctoral committee has evaluated your defense, verified your academic record, and approved your dissertation script for publishing."
          : "SESSION SUSPENDED: The board finds the methodology defenses inadequate. You are required to perform a substantial rewrite of Chapter 4 & 5 and re-defend in 3 months.";
        
        setMessages(prev => [
          ...prev,
          panelResponseMsg,
          { id: 'end', sender: 'panel', text: finalStatus }
        ]);
      }
    }, 2500);
  };

  return (
    <div className="bg-slate-950 p-6 md:p-8 rounded-[2.5rem] border border-white/5 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4">
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Users2 className="w-5 h-5 text-indigo-400" />
            Oral Viva-Voce defense Simulator
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Simulate postgrad oral committee defenses</p>
        </div>
      </div>

      {!activeSession ? (
        <div className="flex flex-col items-center justify-center text-center py-12 space-y-6 max-w-md mx-auto">
          <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-indigo-400">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-black text-white uppercase tracking-tight">Set Defense Committee Vibe</h4>
            <p className="text-slate-400 text-xs mt-2 uppercase tracking-tight leading-relaxed">
              Prepare for critical examination boards. Select the simulated academic temperament of your panel.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full">
            {(['SUPPORTIVE', 'STANDARD', 'HOSTILE'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setPanelVibe(v)}
                className={`py-3.5 border rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  panelVibe === v 
                    ? 'bg-indigo-600 border-indigo-500 text-white' 
                    : 'bg-slate-900 border-white/5 text-slate-400 hover:border-white/10'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <button
            onClick={handleStartSession}
            className="w-full py-4.5 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            Convene Oral Board
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chat Stream */}
          <div className="lg:col-span-8 bg-slate-900 rounded-[2rem] border border-white/5 p-5 flex flex-col justify-between h-[400px]">
            <div className="overflow-y-auto space-y-4 pr-1 flex-grow scrollbar-thin">
              {messages.map((msg) => {
                const isPanel = msg.sender === 'panel';
                return (
                  <div key={msg.id} className={`flex ${isPanel ? 'justify-start' : 'justify-end'}`}>
                    <div className={`p-4 rounded-2xl max-w-md border text-xs leading-relaxed font-semibold uppercase tracking-wide ${
                      isPanel 
                        ? 'bg-slate-950 border-white/5 text-slate-300' 
                        : 'bg-indigo-600 border-indigo-500 text-white'
                    }`}>
                      {msg.category && (
                        <span className="text-[8px] font-black text-indigo-400 block mb-1 tracking-widest">
                          [{msg.category}]
                        </span>
                      )}
                      <p>{msg.text}</p>
                    </div>
                  </div>
                );
              })}

              {isEvaluating && (
                <div className="flex justify-start">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-white/5 text-[9px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                    The committee is deliberating on your arguments...
                  </div>
                </div>
              )}
            </div>

            {/* Response Input */}
            <form onSubmit={handleSendResponse} className="flex gap-2 mt-4 border-t border-white/5 pt-4">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isEvaluating || messages[messages.length - 1]?.id === 'end'}
                placeholder={messages[messages.length - 1]?.id === 'end' ? 'Session completed' : 'Type your methodology/theory defense here...'}
                className="flex-grow px-4 py-3 bg-slate-950 border border-white/5 rounded-xl text-xs text-white outline-none focus:border-indigo-500 font-semibold uppercase"
              />
              <button
                type="submit"
                disabled={isEvaluating || messages[messages.length - 1]?.id === 'end' || !inputText.trim()}
                className="px-5 bg-indigo-600 disabled:opacity-40 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Telemetry/Evaluation Metrics */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 bg-slate-900 rounded-[2rem] border border-white/5 space-y-4 h-full flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block mb-3">Live Defense telemetry</span>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-300 mb-1.5">
                      <span>Board Approval Confidence:</span>
                      <span className={confidence >= 60 ? 'text-emerald-400' : 'text-rose-400'}>{confidence}%</span>
                    </div>
                    <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full transition-all duration-500 ${confidence >= 60 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ width: `${confidence}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Active panel</span>
                    <span className="text-[11px] font-mono font-black text-white uppercase block mt-1">{panelVibe} PROTOCOL MODE</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 space-y-2">
                <p className="text-[9px] text-slate-500 leading-normal font-medium uppercase tracking-wider">
                  Tips: In doctoral panels, avoid vague statements. Ground your answers using keyword anchors like "limitations", "consensus algorithms", or "empirical evidence".
                </p>
                <button
                  type="button"
                  onClick={() => setActiveSession(false)}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer"
                >
                  Convene New Board
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// ==========================================
// 8. POLYTECHNIC & TECHNICAL PATHWAY GUIDE (ND TO HND / B.SC.)
// ==========================================
export const PolytechnicPathway: React.FC = () => {
  const [cgpa, setCgpa] = useState<string>("3.25");
  const [conversionGrade, setConversionGrade] = useState("UPPER_CREDIT");

  const equivalentUniversityCgpa = useMemo(() => {
    const rawVal = parseFloat(cgpa);
    if (isNaN(rawVal) || rawVal < 0 || rawVal > 4.0) return "0.00";
    // Convert 4.0 scale to 5.0 scale proportionally
    return ((rawVal / 4.0) * 5.0).toFixed(2);
  }, [cgpa]);

  useEffect(() => {
    const rawVal = parseFloat(cgpa);
    if (isNaN(rawVal)) return;
    if (rawVal >= 3.5) setConversionGrade("DISTINCTION (First Class Equivalent)");
    else if (rawVal >= 3.0) setConversionGrade("UPPER CREDIT (Second Class Upper Equivalent)");
    else if (rawVal >= 2.5) setConversionGrade("LOWER CREDIT (Second Class Lower Equivalent)");
    else if (rawVal >= 2.0) setConversionGrade("PASS (Third Class Equivalent)");
    else setConversionGrade("FAIL / INELIGIBLE");
  }, [cgpa]);

  return (
    <div className="bg-slate-950 p-6 md:p-8 rounded-[2.5rem] border border-white/5 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4">
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-400" />
            Polytechnic ND to HND / B.Sc. Pathway Guide
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ND, HND, & Direct-Entry Transfer Matrices</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Grade Equivalent Calculator */}
        <div className="p-5 bg-slate-900 rounded-[2rem] border border-white/5 space-y-5">
          <div>
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block mb-1">Scale Conversions</span>
            <h4 className="text-sm font-black text-white uppercase italic">CGPA Multi-Scale Translator</h4>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[9px] font-black text-slate-400 block uppercase mb-1.5 tracking-wider">Your Polytechnic CGPA (4.0 Scale)</label>
              <input
                type="number"
                step="0.01"
                min="0.00"
                max="4.00"
                value={cgpa}
                onChange={(e) => setCgpa(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-white/5 rounded-xl text-sm font-semibold outline-none focus:border-indigo-500 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 text-center">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">University 5.0 Equivalent</span>
                <span className="text-xl font-mono font-black text-indigo-400 block mt-1.5">{equivalentUniversityCgpa}</span>
              </div>
              <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 text-center">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Direct Entry Tier</span>
                <span className="text-xs font-black text-white uppercase block mt-2.5">
                  {parseFloat(cgpa) >= 3.0 ? "Tier 1 (High)" : parseFloat(cgpa) >= 2.5 ? "Tier 2 (Med)" : "Tier 3 (Low)"}
                </span>
              </div>
            </div>

            <div className="p-4.5 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
              <span className="text-[8px] font-black text-indigo-300 uppercase tracking-widest block">Academic Classification</span>
              <span className="text-xs font-black text-white uppercase block mt-1">{conversionGrade}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Transfer Matrices Checklist */}
        <div className="p-5 bg-slate-900 rounded-[2rem] border border-white/5 space-y-4">
          <div>
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block mb-1">Transfer Guidelines</span>
            <h4 className="text-sm font-black text-white uppercase italic">Sovereign Requirements Checklist</h4>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-950 rounded-xl border border-white/5 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[9px] font-black text-slate-300 block uppercase">1-Year Industrial Training (IT)</span>
                <span className="text-[9.5px] text-slate-400 leading-normal block uppercase">Candidates with Lower Credit and above require 12 months minimum of verifiable IT prior to HND admission.</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-white/5 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[9px] font-black text-slate-300 block uppercase">JAMB Direct Entry registration</span>
                <span className="text-[9.5px] text-slate-400 leading-normal block uppercase">For ND-to-University conversions, buy a JAMB DE pin. Upload official academic transcripts from your Polytechnic direct to your destination university.</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-white/5 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[9px] font-black text-slate-300 block uppercase">O'Level Regularization</span>
                <span className="text-[9.5px] text-slate-400 leading-normal block uppercase">Check that you possess 5 credits in subjects matching your National Diploma (ND) specialization. No deficiencies allowed.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// ==========================================
// 9. POST-UTME SCREENING REQUIREMENTS & AGGREGATE CALCULATOR
// ==========================================
export const ScreeningRequirementsChecker: React.FC = () => {
  const [jambScore, setJambScore] = useState("280");
  const [selectedUni, setSelectedUni] = useState("UI");
  
  // O'Level grades input for calculations
  const [mathGrade, setMathGrade] = useState("A1");
  const [engGrade, setEngGrade] = useState("A1");
  const [phyGrade, setPhyGrade] = useState("B2");
  const [chmGrade, setChmGrade] = useState("B3");
  const [bioGrade, setBioGrade] = useState("A1");

  const getPoints = (grade: string) => {
    switch (grade) {
      case 'A1': return 10;
      case 'B2': return 9;
      case 'B3': return 8;
      case 'C4': return 7;
      case 'C5': return 6;
      case 'C6': return 5;
      default: return 0;
    }
  };

  const aggregateScore = useMemo(() => {
    const js = parseFloat(jambScore);
    if (isNaN(js) || js < 0 || js > 400) return "0.00";

    // Standard 50/50 weighted aggregate system (e.g. UNILAG / OAU)
    // JAMB weighted out of 50 = (JAMB / 400) * 50
    const jambWeighted = (js / 400) * 50;

    // O'Level weighted out of 20 = (Sum of 5 core subject points / 50) * 20
    const oLevelPoints = getPoints(mathGrade) + getPoints(engGrade) + getPoints(phyGrade) + getPoints(chmGrade) + getPoints(bioGrade);
    const oLevelWeighted = (oLevelPoints / 50) * 20;

    // Simulated Post-UTME screening test (weighted out of 30) - assume a model test score of 22/30 (approx 73%)
    const postUtmeWeighted = 22;

    return (jambWeighted + oLevelWeighted + postUtmeWeighted).toFixed(2);
  }, [jambScore, mathGrade, engGrade, phyGrade, chmGrade, bioGrade]);

  const screeningDocs = [
    { title: "Original JAMB Result Notification Slip", code: "UTME_SLIP_ORIGINAL" },
    { title: "O'Level Certificate / Online Printout (WAEC/NECO)", code: "SSCE_CERTIFICATE" },
    { title: "LGA Letter of Identification of Origin", code: "LGA_IDENTIFICATION" },
    { title: "Birth Certificate or Sworn Declaration of Age", code: "BIRTH_CERTIFICATE" },
    { title: "Post-UTME Screen Registration Receipt & Card", code: "SCREEN_PAYMENT_REF" }
  ];

  return (
    <div className="bg-slate-950 p-6 md:p-8 rounded-[2.5rem] border border-white/5 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4">
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-400" />
            Post-UTME Institutional Screening Checker
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Aggregate calculators & dossier audits</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Calculator */}
        <div className="lg:col-span-7 p-5 bg-slate-900 rounded-[2rem] border border-white/5 space-y-5">
          <div>
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block mb-1">Empirical admission algorithms</span>
            <h4 className="text-sm font-black text-white uppercase italic">Weighted screening aggregate node</h4>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black text-slate-400 block uppercase mb-1 tracking-wider">Candidate JAMB Score (0-400)</label>
                <input
                  type="number"
                  min="0"
                  max="400"
                  value={jambScore}
                  onChange={(e) => setJambScore(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-white/5 rounded-xl text-xs font-semibold text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 block uppercase mb-1 tracking-wider">Target University</label>
                <select
                  value={selectedUni}
                  onChange={(e) => setSelectedUni(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-white/5 rounded-xl text-xs font-semibold text-white outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="UI">University of Ibadan (UI)</option>
                  <option value="UNILAG">University of Lagos (UNILAG)</option>
                  <option value="OAU">Obafemi Awolowo University (OAU)</option>
                  <option value="UNIBEN">University of Benin (UNIBEN)</option>
                  <option value="ABU">Ahmadu Bello University (ABU)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-indigo-400 block uppercase tracking-wider">Core O'Level Grades (5 Required Credits)</label>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { label: "Math", value: mathGrade, setter: setMathGrade },
                  { label: "Eng", value: engGrade, setter: setEngGrade },
                  { label: "Phy", value: phyGrade, setter: setPhyGrade },
                  { label: "Chm", value: chmGrade, setter: setChmGrade },
                  { label: "Bio", value: bioGrade, setter: setBioGrade }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <span className="text-[8px] font-mono text-slate-500 uppercase block text-center">{item.label}</span>
                    <select
                      value={item.value}
                      onChange={(e) => item.setter(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-white/5 rounded-lg text-[10px] text-white outline-none focus:border-indigo-500 text-center font-bold cursor-pointer"
                    >
                      {['A1', 'B2', 'B3', 'C4', 'C5', 'C6'].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 bg-slate-950 rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Estimated Screening Aggregate</span>
                <span className="text-3xl font-mono font-black text-white italic block mt-1">{aggregateScore}%</span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block">Screening Threshold Status</span>
                <span className={`text-[10px] font-black uppercase mt-1 block px-2.5 py-1 rounded ${
                  parseFloat(aggregateScore) >= 70 
                    ? 'bg-emerald-500/15 text-emerald-400' 
                    : parseFloat(aggregateScore) >= 55 
                    ? 'bg-amber-500/15 text-amber-400' 
                    : 'bg-rose-500/15 text-rose-400'
                }`}>
                  {parseFloat(aggregateScore) >= 70 ? 'High Admit Probability' : parseFloat(aggregateScore) >= 55 ? 'Competitive range' : 'Admission Unlikely'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Physical Screening Dossier Check */}
        <div className="lg:col-span-5 p-5 bg-slate-900 rounded-[2rem] border border-white/5 space-y-4">
          <div>
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block mb-1">Physical Credential Audit</span>
            <h4 className="text-sm font-black text-white uppercase italic">Screening physical dossier checklist</h4>
          </div>

          <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
            {screeningDocs.map((doc, idx) => (
              <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-white/5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-indigo-600/10 text-indigo-400 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 border border-indigo-500/10">
                    {idx + 1}
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-white block leading-tight">{doc.title}</span>
                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block mt-0.5">{doc.code}</span>
                  </div>
                </div>
                <div className="w-4.5 h-4.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-emerald-400" />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[9px] text-amber-300 leading-normal font-bold uppercase tracking-tight">
              Alert: Most universities disallow Cyber Cafe registration printouts during screening. Bring official scratch cards or transcripts!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
