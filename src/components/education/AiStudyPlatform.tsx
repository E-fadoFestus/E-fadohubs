import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Brain, 
  Send, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RotateCcw, 
  HelpCircle, 
  X, 
  ChevronRight, 
  Trophy, 
  Lightbulb, 
  FileText,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { UserProfile } from '../../types';

// Supported Exam categories
type ExamType = 'JAMB' | 'WAEC' | 'NECO' | 'POST_UTME' | 'GENERAL';

// Subject configurations
interface SubjectConfig {
  id: string;
  name: string;
  topics: string[];
}

const SUBJECTS: SubjectConfig[] = [
  { id: 'english', name: 'Use of English', topics: ['Concord & Agreement', 'Lexis & Structure', 'Synonyms & Antonyms', 'Comprehension Protocols'] },
  { id: 'maths', name: 'Mathematics', topics: ['Linear & Quadratic Equations', 'Calculus & Integration', 'Trigonometry & Geometry', 'Probability & Statistics'] },
  { id: 'physics', name: 'Physics', topics: ['Mechanics & Motion', 'Waves & Optics', 'Electricity & Magnetism', 'Thermal Properties of Matter'] },
  { id: 'chemistry', name: 'Chemistry', topics: ['Organic Chemistry Basics', 'Chemical Bonding & Structures', 'Stoichiometry & Gas Laws', 'Electrochemistry'] },
  { id: 'biology', name: 'Biology', topics: ['Genetics & DNA structure', 'Photosynthesis & Nutrition', 'Ecology & Ecosystems', 'Cell Structure & Function'] },
  { id: 'economics', name: 'Economics', topics: ['Theory of Demand & Supply', 'Inflation & Unemployment', 'National Income Accounting', 'Market Structures'] }
];

// Offline fallback databases for 100% operational guarantee
const OFFLINE_QUIZZES: Record<string, Array<{ question: string; options: string[]; answerIndex: number; explanation: string }>> = {
  'maths': [
    {
      question: "Solve for x in the equation: 3x - 7 = 5x + 9",
      options: ["x = -8", "x = 8", "x = -1", "x = 2"],
      answerIndex: 0,
      explanation: "3x - 7 = 5x + 9 => -7 - 9 = 5x - 3x => -16 = 2x => x = -8."
    },
    {
      question: "If log 2 = 0.3010 and log 3 = 0.4771, evaluate log 1.2 without tables.",
      options: ["0.0791", "0.7912", "0.1245", "0.9820"],
      answerIndex: 0,
      explanation: "log 1.2 = log(12/10) = log(2 * 2 * 3 / 10) = 2*log 2 + log 3 - log 10 = 2(0.3010) + 0.4771 - 1 = 0.6020 + 0.4771 - 1 = 1.0791 - 1 = 0.0791."
    }
  ],
  'english': [
    {
      question: "Choose the option nearest in meaning to the italicized word: The principal made a *cursory* inspection of the classrooms.",
      options: ["Thorough", "Careful", "Rapid & Superficial", "Unscheduled"],
      answerIndex: 2,
      explanation: "Cursory means hasty, rapid, and therefore not thorough or detailed."
    },
    {
      question: "Identify the correct concord: Either the teacher or the students ________ present.",
      options: ["is", "are", "was", "has been"],
      answerIndex: 1,
      explanation: "When either/or joins a singular and plural subject, the verb agrees with the closer subject ('students', which is plural)."
    }
  ],
  'physics': [
    {
      question: "Calculate the work done when a force of 50N moves a block through a distance of 8m in the direction of the force.",
      options: ["400 Joules", "100 Joules", "6.25 Joules", "25 Joules"],
      answerIndex: 0,
      explanation: "Work Done = Force * Distance = 50N * 8m = 400 J."
    },
    {
      question: "What is the refractive index of a medium if the speed of light in it is 2.0 x 10^8 m/s? (Speed of light in vacuum = 3.0 x 10^8 m/s)",
      options: ["1.5", "1.33", "2.0", "0.67"],
      answerIndex: 0,
      explanation: "Refractive Index = Speed in vacuum / Speed in medium = 3.0 / 2.0 = 1.5."
    }
  ]
};

const OFFLINE_NOTES: Record<string, string> = {
  'maths': `### Mathematics Core Principles
- **Linear Equations**: Statements of equality with one variable of degree 1. Solve by isolating the variable.
- **Quadratic Equations**: General form: $ax^2 + bx + c = 0$. Solve using factorization, completing the square, or formula: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$.
- **Trigonometric Ratios**: SOH CAH TOA
  - $\\sin(\\theta) = \\text{Opposite}/\\text{Hypotenuse}$
  - $\\cos(\\theta) = \\text{Adjacent}/\\text{Hypotenuse}$
  - $\\tan(\\theta) = \\text{Opposite}/\\text{Adjacent}$
- **Calculus**: Differentiation is the measure of the rate of change ($dy/dx$), while Integration is the reverse process, representing the area under a curve.`,
  'english': `### Use of English Summary
- **Concord Guidelines**:
  - *Rule of Proximity*: In either/or setups, the verb aligns with the closest noun.
  - *Collective Nouns*: Singular if acting as a single unit ("The jury was unanimous"), plural if acting individually ("The jury were divided").
- **Synonyms & Antonyms**: Focus heavily on contextual vocabulary extraction in passages. Read surrounding sentences for syntactic clues.
- **Comprehension Tactics**: Scan questions first before reading the passage. This primes your mind to extract specific key indicators rapidly.`
};

interface AiStudyPlatformProps {
  onClose: () => void;
  user: UserProfile;
}

export const AiStudyPlatform: React.FC<AiStudyPlatformProps> = ({ onClose, user }) => {
  const [activeTab, setActiveTab] = useState<'study' | 'quiz' | 'chat'>('study');
  const [examType, setExamType] = useState<ExamType>('JAMB');
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [selectedTopic, setSelectedTopic] = useState(SUBJECTS[0].topics[0]);

  // AI Generation States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState<string>('');
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [userSelectedOption, setUserSelectedOption] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    { role: 'assistant', text: `Welcome back, ${user.displayName || 'Academic Candidate'}. I am the EFADO Intelligence Study Node. Select a subject above and ask me anything about exam syllables, complex theories, or past questions.` }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Handle subject change
  const handleSubjectChange = (subjectId: string) => {
    const found = SUBJECTS.find(s => s.id === subjectId);
    if (found) {
      setSelectedSubject(found);
      setSelectedTopic(found.topics[0]);
      setGeneratedNotes('');
      setQuizQuestions([]);
      setQuizFinished(false);
    }
  };

  // Safe call to Gemini API
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) return null;
    return new GoogleGenerativeAI(apiKey);
  };

  // Generate Study Materials
  const handleGenerateNotes = async () => {
    setIsGenerating(true);
    setGeneratedNotes('');

    try {
      const genAI = getGeminiClient();
      if (!genAI) throw new Error("No API Key configured");

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `You are a world-class academic tutor preparing Nigerian candidates for ${examType} exam in ${selectedSubject.name}. 
      Generate extremely structured, detailed, and high-yield study notes on the topic: "${selectedTopic}".
      Include key formulas, definitions, common examination traps, and 2 quick shortcut tricks. Use bullet points and clean headers.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      setGeneratedNotes(text);
    } catch (error) {
      console.warn("AI generation failed or no API key, loading strategic preset:", error);
      // Fallback
      setTimeout(() => {
        const fallbackText = OFFLINE_NOTES[selectedSubject.id] || `### ${selectedSubject.name} - ${selectedTopic} Study Notes
        
- **Key Exam Principle**: This topic is highly examined in ${examType}. Focus heavily on basic definitions and their direct algebraic properties.
- **Formula Matrix**: Ensure you understand the underlying concepts rather than just memorizing equations.
- **Shortcuts**: Analyze past question patterns from the last 5 years. Pay key attention to edge-cases and dimensional units.
- **Exam Warning**: Avoid common errors like missing negative signs or applying incorrect plural verb rules.`;
        setGeneratedNotes(fallbackText);
      }, 1000);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate Interactive Quiz
  const handleGenerateQuiz = async () => {
    setIsGenerating(true);
    setQuizQuestions([]);
    setCurrentQuizIndex(0);
    setUserSelectedOption(null);
    setQuizScore(0);
    setQuizFinished(false);

    try {
      const genAI = getGeminiClient();
      if (!genAI) throw new Error("No API Key configured");

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `You are an examination compiler for ${examType}. Generate 3 highly tactical, syllabus-compliant multiple-choice questions for the subject "${selectedSubject.name}" on the topic "${selectedTopic}".
      Return the output strictly as a JSON array of objects, with no extra markdown formatting (no backticks).
      Each object must match this schema:
      {
        "question": "The question string",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "answerIndex": 0, // 0 for A, 1 for B, 2 for C, 3 for D
        "explanation": "Brief step-by-step academic explanation"
      }`;

      const result = await model.generateContent(prompt);
      let text = result.response.text().trim();
      // Remove possible markdown wraps
      if (text.startsWith("```json")) text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      else if (text.startsWith("```")) text = text.replace(/```/g, "").trim();

      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setQuizQuestions(parsed);
      } else {
        throw new Error("Invalid array format returned");
      }
    } catch (error) {
      console.warn("Quiz compile fallback activated:", error);
      setTimeout(() => {
        const fallbacks = OFFLINE_QUIZZES[selectedSubject.id] || [
          {
            question: `Which of the following is a key requirement in ${selectedSubject.name} when dealing with ${selectedTopic}?`,
            options: ["Understanding core definitions", "Rushing without calculation", "Ignoring syllabus limits", "Memorizing without understanding"],
            answerIndex: 0,
            explanation: "In O'level examinations, a fundamental grasp of definitions is required before applying formulas."
          },
          {
            question: `In a mock exam context, what does a high-performance output on ${selectedTopic} indicate?`,
            options: ["Excellent spatial awareness", "Full mastery of secondary curriculum", "Lucky guessing", "Incomplete node synchronization"],
            answerIndex: 1,
            explanation: "Steady scores across mock modules strongly indicate a comprehensive syllabus coverage."
          }
        ];
        setQuizQuestions(fallbacks);
      }, 1000);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Quiz answer click
  const handleAnswerClick = (index: number) => {
    if (userSelectedOption !== null) return; // Answered already
    setUserSelectedOption(index);
    if (index === quizQuestions[currentQuizIndex].answerIndex) {
      setQuizScore(prev => prev + 1);
    }
  };

  // Advance Quiz
  const handleNextQuiz = () => {
    setUserSelectedOption(null);
    if (currentQuizIndex + 1 < quizQuestions.length) {
      setCurrentQuizIndex(prev => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  // Chat with AI Tutor
  const handleSendChat = async () => {
    if (!chatInput.trim() || isGenerating) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsGenerating(true);

    try {
      const genAI = getGeminiClient();
      if (!genAI) throw new Error("No key");

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `You are a helpful, expert AI Academic Advisor for Nigerian secondary and tertiary entrance exams (JAMB, WAEC, NECO).
      The student's name is ${user.displayName}.
      They asked: "${userMsg}".
      Provide a highly encouraging, clear, precise, and syllabus-focused answer. Keep your response under 150 words.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      setChatMessages(prev => [...prev, { role: 'assistant', text }]);
    } catch (error) {
      setTimeout(() => {
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          text: `Offline assistance active: Regarding "${userMsg}", standard examination manuals suggest prioritizing consistent practice of past questions. Be sure to check the EFADO CBT simulator modules to test your timing.` 
        }]);
      }, 1000);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 backdrop-blur-md p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-5xl bg-slate-900 border border-indigo-500/10 rounded-[3rem] shadow-2xl flex flex-col h-[90vh] overflow-hidden relative">
        
        {/* Floating gradient accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none -ml-48 -mb-48" />

        {/* Portal Header */}
        <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Brain className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">AI Academic Prep Command</h2>
                <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-md text-[9px] font-black uppercase text-indigo-400 tracking-widest animate-pulse">Node v1.5 Active</span>
              </div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Syllabus compiler, study summaries & interactive simulators</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level & Tab Selector bar */}
        <div className="px-6 md:px-8 py-4 bg-slate-950/40 border-b border-white/5 flex flex-col md:flex-row justify-between gap-4 items-center relative z-10">
          {/* Exam Type Selector */}
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-white/5">
            {(['JAMB', 'WAEC', 'NECO', 'POST_UTME'] as ExamType[]).map(type => (
              <button
                key={type}
                onClick={() => setExamType(type)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  examType === type 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {type === 'POST_UTME' ? 'POST-UTME' : type}
              </button>
            ))}
          </div>

          {/* Sub-UI Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-white/5">
            {[
              { id: 'study', label: 'Study Assistant', icon: BookOpen },
              { id: 'quiz', label: 'Interactive Quiz', icon: HelpCircle },
              { id: 'chat', label: 'AI Academic Tutor', icon: Sparkles }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setGeneratedNotes('');
                  setQuizQuestions([]);
                  setQuizFinished(false);
                }}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide flex items-center gap-2 transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white/15 text-white border border-white/10' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Subject & Topic Rail */}
        <div className="px-6 md:px-8 py-4 bg-slate-950/20 border-b border-white/5 flex flex-wrap gap-4 items-center justify-between relative z-10">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest shrink-0">Subject:</span>
            {SUBJECTS.map(subj => (
              <button
                key={subj.id}
                onClick={() => handleSubjectChange(subj.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                  selectedSubject.id === subj.id
                    ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-300'
                    : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {subj.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-white/5">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Topic:</span>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="bg-transparent text-xs font-bold text-white uppercase tracking-tight outline-none cursor-pointer"
            >
              {selectedSubject.topics.map(topic => (
                <option key={topic} value={topic} className="bg-slate-900 text-white uppercase text-xs">
                  {topic}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Interactive Main Body Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 relative z-10">
          <AnimatePresence mode="wait">
            {/* STUDY TAB */}
            {activeTab === 'study' && (
              <motion.div
                key="study-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 h-full flex flex-col justify-between"
              >
                {!generatedNotes ? (
                  <div className="flex flex-col items-center justify-center text-center py-16 max-w-lg mx-auto space-y-6 h-full">
                    <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-slate-400">
                      <BookOpen className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight">Syllabus Material Generator</h3>
                      <p className="text-slate-400 text-xs mt-2 leading-relaxed uppercase tracking-tight">
                        Generate comprehensive, high-yield tactical summaries and shortcut parameters matching the <span className="text-indigo-400 font-bold">{selectedSubject.name}</span> syllabus for {examType}.
                      </p>
                    </div>
                    <button
                      onClick={handleGenerateNotes}
                      disabled={isGenerating}
                      className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center gap-3 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                    >
                      {isGenerating ? "Compiling Syllabus Node..." : "Generate AI Study Material"} 
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <div>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{selectedSubject.name} • Syllabus Note</span>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight mt-1">{selectedTopic}</h3>
                      </div>
                      <button
                        onClick={handleGenerateNotes}
                        disabled={isGenerating}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border border-white/5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Regenerate
                      </button>
                    </div>

                    <div className="bg-slate-950/50 p-6 rounded-2xl border border-white/5 text-slate-300 space-y-4 max-w-4xl mx-auto leading-relaxed text-sm font-medium select-text">
                      {generatedNotes.split('\n').map((line, i) => {
                        if (line.startsWith('###') || line.startsWith('##')) {
                          return <h4 key={i} className="text-base font-black text-white uppercase tracking-tight mt-6 border-l-2 border-indigo-500 pl-3">{line.replace(/###|##/g, '').trim()}</h4>;
                        }
                        if (line.startsWith('-')) {
                          return <div key={i} className="flex gap-2 items-start pl-2"><span className="text-indigo-400 mt-1.5 shrink-0">•</span><p className="flex-1">{line.replace('-', '').trim()}</p></div>;
                        }
                        return <p key={i}>{line}</p>;
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* QUIZ TAB */}
            {activeTab === 'quiz' && (
              <motion.div
                key="quiz-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full flex flex-col justify-between"
              >
                {quizQuestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-16 max-w-lg mx-auto space-y-6">
                    <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-indigo-400">
                      <Brain className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight">Interactive AI Exam Compiler</h3>
                      <p className="text-slate-400 text-xs mt-2 leading-relaxed uppercase tracking-tight">
                        Generate 3 highly custom exam questions for <span className="text-indigo-400 font-bold">{selectedSubject.name} - {selectedTopic}</span> to test your timing and knowledge.
                      </p>
                    </div>
                    <button
                      onClick={handleGenerateQuiz}
                      disabled={isGenerating}
                      className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center gap-3 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                    >
                      {isGenerating ? "Compiling Exam Array..." : "Compile AI Practice Quiz"} 
                      <Brain className="w-4 h-4" />
                    </button>
                  </div>
                ) : quizFinished ? (
                  <div className="flex flex-col items-center justify-center text-center py-12 max-w-md mx-auto space-y-6">
                    <div className="w-20 h-20 bg-indigo-600/10 border border-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400">
                      <Trophy className="w-10 h-10" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Protocol Completed</span>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight mt-1">Quiz Completed!</h3>
                      <p className="text-slate-400 text-xs mt-2 uppercase tracking-tight">
                        You scored <span className="text-emerald-400 font-black text-base">{quizScore} / {quizQuestions.length}</span> in {selectedSubject.name}.
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full">
                      <button
                        onClick={handleGenerateQuiz}
                        className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all"
                      >
                        Re-evaluate Quiz
                      </button>
                      <button
                        onClick={() => setQuizQuestions([])}
                        className="flex-1 py-4 bg-slate-800 text-slate-300 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-700 transition-all"
                      >
                        Select Topic
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto space-y-8 w-full">
                    {/* Progress indicator */}
                    <div className="flex justify-between items-center bg-slate-950/40 p-4 rounded-xl border border-white/5">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Question {currentQuizIndex + 1} of {quizQuestions.length}</span>
                      <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black rounded uppercase tracking-widest">Score: {quizScore}</span>
                    </div>

                    {/* Question Card */}
                    <div className="bg-slate-950/30 p-8 rounded-3xl border border-white/5">
                      <h4 className="text-lg font-black text-white leading-tight uppercase tracking-tight italic select-text">
                        {quizQuestions[currentQuizIndex].question}
                      </h4>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 gap-4">
                      {quizQuestions[currentQuizIndex].options.map((opt: string, idx: number) => {
                        const isSelected = userSelectedOption === idx;
                        const isCorrect = idx === quizQuestions[currentQuizIndex].answerIndex;
                        
                        let optionStyle = "bg-slate-900 border-white/5 text-slate-300 hover:bg-slate-850";
                        if (userSelectedOption !== null) {
                          if (isCorrect) {
                            optionStyle = "bg-emerald-500/15 border-emerald-500 text-emerald-400";
                          } else if (isSelected) {
                            optionStyle = "bg-rose-500/15 border-rose-500 text-rose-400";
                          } else {
                            optionStyle = "bg-slate-950 opacity-40 border-transparent text-slate-500";
                          }
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => handleAnswerClick(idx)}
                            disabled={userSelectedOption !== null}
                            className={`p-5 rounded-2xl border text-left text-sm font-bold uppercase tracking-tight flex items-center justify-between transition-all duration-300 ${optionStyle}`}
                          >
                            <span className="flex items-center gap-4">
                              <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded font-black text-xs text-indigo-400 uppercase">
                                {String.fromCharCode(65 + idx)}
                              </span>
                              {opt}
                            </span>
                            {userSelectedOption !== null && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                            {userSelectedOption !== null && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation and Next Button */}
                    {userSelectedOption !== null && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 bg-indigo-950/40 border border-indigo-500/20 rounded-2xl space-y-4"
                      >
                        <div className="flex items-center gap-2 text-indigo-400">
                          <Lightbulb className="w-4 h-4 animate-bounce" />
                          <span className="text-xs font-black uppercase tracking-widest">Academic Explanation Matrix:</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-bold uppercase tracking-tight italic select-text">
                          {quizQuestions[currentQuizIndex].explanation}
                        </p>
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={handleNextQuiz}
                            className="px-6 py-3 bg-indigo-600 text-white font-black uppercase tracking-widest text-[9px] rounded-xl flex items-center gap-2 hover:bg-indigo-500 transition-all active:translate-x-1"
                          >
                            {currentQuizIndex + 1 === quizQuestions.length ? "Finish Assessment" : "Next Question"} <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* CHAT TAB */}
            {activeTab === 'chat' && (
              <motion.div
                key="chat-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col h-[52vh]"
              >
                {/* Chat Message feed */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`p-4 md:p-5 rounded-3xl max-w-[80%] text-sm leading-relaxed uppercase tracking-tight font-bold italic select-text ${
                          msg.role === 'user'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-950/60 text-slate-300 border border-white/5'
                        }`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-1.5 text-indigo-400 mb-2 border-b border-white/5 pb-1">
                            <Brain className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-black tracking-widest uppercase">EFADO Tutor Node</span>
                          </div>
                        )}
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  {isGenerating && (
                    <div className="flex justify-start">
                      <div className="bg-slate-950/60 border border-white/5 p-4 rounded-3xl flex items-center gap-2">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input box */}
                <div className="relative mt-auto">
                  <input
                    type="text"
                    placeholder="Ask AI study tutor about equations, definitions, or past questions..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    disabled={isGenerating}
                    className="w-full pl-6 pr-16 py-4 bg-slate-950 border border-white/10 rounded-2xl text-xs font-bold text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 transition-all uppercase tracking-wider"
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={isGenerating || !chatInput.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Global Loading overlay */}
        <AnimatePresence>
          {isGenerating && activeTab !== 'chat' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center space-y-4"
            >
              <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] animate-pulse">Synchronizing Intelligence Modules...</p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
