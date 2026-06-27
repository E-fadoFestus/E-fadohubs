import React, { useState, useEffect } from 'react';
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
  FileText
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
