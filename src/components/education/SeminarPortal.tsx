import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Presentation, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Save,
  Download,
  Video,
  Users,
  Target,
  Zap,
  CheckCircle2,
  X,
  File,
  Layout,
  Move
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../../types';

interface SeminarMaterial {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadDate: string;
}

interface AgendaSlide {
  id: string;
  title: string;
  content: string;
  type: 'bullet' | 'header' | 'quote' | 'image';
}

export const SeminarPortal: React.FC<{ 
  onClose: () => void;
  user: UserProfile;
}> = ({ onClose, user }) => {
  const [activeTab, setActiveTab] = useState<'materials' | 'agenda' | 'preview'>('materials');
  
  // Persistence logic
  const [materials, setMaterials] = useState<SeminarMaterial[]>(() => {
    const saved = localStorage.getItem('efado_seminar_materials');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'JAMB_Success_Syllabus.pdf', size: '2.4 MB', type: 'application/pdf', uploadDate: '2024-05-10' },
      { id: '2', name: 'Strategic_Time_Management.docx', size: '1.1 MB', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', uploadDate: '2024-05-12' }
    ];
  });

  const [agenda, setAgenda] = useState<AgendaSlide[]>(() => {
    const saved = localStorage.getItem('efado_seminar_agenda');
    return saved ? JSON.parse(saved) : [
      { 
        id: '1', 
        title: 'Introduction to JAMB Tactical Success', 
        content: 'Understanding the mindset of the examiner. Master the digital interface. Set your target score.',
        type: 'header'
      },
      { 
        id: '2', 
        title: 'Temporal Domain Mastery', 
        content: 'Managing 120 minutes vs 180 questions. The 45-second rule. Tactical skipping protocols.',
        type: 'bullet'
      },
      { 
        id: '3', 
        title: 'Subject Specific Firepower', 
        content: 'English strategy: Use of Lexis & Structure. Math strategy: Pattern recognition vs brute force.',
        type: 'bullet'
      }
    ];
  });

  React.useEffect(() => {
    localStorage.setItem('efado_seminar_materials', JSON.stringify(materials));
  }, [materials]);

  React.useEffect(() => {
    localStorage.setItem('efado_seminar_agenda', JSON.stringify(agenda));
  }, [agenda]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newMaterials: SeminarMaterial[] = Array.from(files).map((f, i) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: f.name,
        size: (f.size / (1024 * 1024)).toFixed(1) + ' MB',
        type: f.type,
        uploadDate: new Date().toISOString().split('T')[0]
      }));
      setMaterials([...materials, ...newMaterials]);
    }
  };

  const addSlide = () => {
    const newSlide: AgendaSlide = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Tactical Slide',
      content: 'Enter strategic briefing content here...',
      type: 'bullet'
    };
    setAgenda([...agenda, newSlide]);
    setActiveTab('agenda');
  };

  const updateSlide = (id: string, updates: Partial<AgendaSlide>) => {
    setAgenda(agenda.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSlide = (id: string) => {
    setAgenda(agenda.filter(s => s.id !== id));
    if (currentSlide >= agenda.length - 1) setCurrentSlide(Math.max(0, agenda.length - 2));
  };

  const removeMaterial = (id: string) => {
    setMaterials(materials.filter(m => m.id !== id));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#0F172A] flex flex-col"
    >
      {/* Portal Header */}
      <div className="bg-slate-900 border-b border-white/5 p-6 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={onClose}
              className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">JAMB Seminar Command</h2>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Material & Agenda Strategic Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
            {[
              { id: 'materials', label: 'Resources', icon: FileText },
              { id: 'agenda', label: 'Agenda Editor', icon: Layout },
              { id: 'preview', label: 'Preview Presentation', icon: Play }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : 'text-slate-500 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'materials' && (
            <motion.div 
              key="materials"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full overflow-y-auto p-12 no-scrollbar"
            >
              <div className="max-w-5xl mx-auto space-y-12">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">Tactical Resource Hub</h3>
                    <p className="text-sm text-slate-300 font-bold uppercase tracking-widest leading-relaxed max-w-md">
                      Upload and manage all seminar materials, past questions, and strategic PDF briefs for student deployment.
                    </p>
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-3"
                  >
                    <Upload className="w-4 h-4" /> Upload Material
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    multiple 
                    onChange={handleFileUpload}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {materials.map((file) => (
                    <motion.div 
                      key={file.id}
                      layout
                      className="p-6 bg-slate-900 border border-white/5 rounded-[2rem] flex items-center gap-6 group hover:border-indigo-500/30 transition-all shadow-xl"
                    >
                      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <File className="w-8 h-8" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="text-lg font-black text-white truncate italic uppercase tracking-tighter">{file.name}</h4>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{file.size}</span>
                          <div className="w-1 h-1 bg-white/20 rounded-full" />
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest font-mono">{file.uploadDate}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                         <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all shadow-xl">
                            <Download className="w-5 h-5" />
                         </button>
                         <button 
                           onClick={() => removeMaterial(file.id)}
                           className="p-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl transition-all shadow-xl border border-red-500/20 hover:border-red-600"
                         >
                            <Trash2 className="w-5 h-5" />
                         </button>
                      </div>
                    </motion.div>
                  ))}

                  {materials.length === 0 && (
                    <div className="col-span-2 py-32 border-2 border-dashed border-white/10 rounded-[3rem] text-center space-y-4">
                       <File className="w-12 h-12 text-slate-500 mx-auto" />
                       <p className="text-slate-300 font-black uppercase tracking-widest text-xs italic">No materials uploaded to the hub</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'agenda' && (
            <motion.div 
              key="agenda"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full overflow-y-auto p-12 no-scrollbar"
            >
              <div className="max-w-5xl mx-auto space-y-12">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">Tactical Agenda Editor</h3>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest leading-relaxed max-w-md">
                      Construct your presentation slides here. These will be deployed during the live seminar hub session.
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setActiveTab('preview')}
                      className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-3"
                    >
                      <Play className="w-4 h-4" /> Preview All
                    </button>
                    <button 
                      onClick={addSlide}
                      className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-3"
                    >
                      <Plus className="w-4 h-4" /> New Tactical Slide
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {agenda.map((slide, index) => (
                    <motion.div 
                      key={slide.id}
                      layout
                      className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-10 group relative"
                    >
                      <div className="absolute top-6 left-6 text-[10px] font-black text-white/10 italic">SLIDE_0{index + 1}</div>
                      
                      <div className="flex gap-8">
                        <div className="w-12 pt-2">
                           <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white cursor-move">
                              <Move className="w-5 h-5" />
                           </div>
                        </div>
                        <div className="flex-grow space-y-6">
                           <input 
                             value={slide.title}
                             onChange={(e) => updateSlide(slide.id, { title: e.target.value })}
                             placeholder="Strategic Slide Header..."
                             className="w-full bg-transparent text-3xl font-black text-white italic uppercase tracking-tighter outline-none focus:text-indigo-400 transition-colors"
                           />
                           <textarea 
                             value={slide.content}
                             onChange={(e) => updateSlide(slide.id, { content: e.target.value })}
                             placeholder="Briefing information goes here..."
                             rows={3}
                             className="w-full bg-white/5 border border-white/5 rounded-2xl p-6 text-slate-300 font-medium leading-relaxed outline-none focus:border-indigo-500/50 transition-all resize-none"
                           />
                           
                           <div className="flex items-center gap-4">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Strategic Style</p>
                              <div className="flex gap-2">
                                {['header', 'bullet', 'quote'].map(type => (
                                  <button
                                    key={type}
                                    onClick={() => updateSlide(slide.id, { type: type as any })}
                                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                                      slide.type === type 
                                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/20' 
                                        : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/10'
                                    }`}
                                  >
                                    {type}
                                  </button>
                                ))}
                              </div>
                           </div>
                        </div>
                        <div>
                           <button 
                             onClick={() => removeSlide(slide.id)}
                             className="p-4 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-2xl transition-all shadow-xl border border-red-500/20 group-hover:border-red-600 opacity-0 group-hover:opacity-100"
                           >
                              <Trash2 className="w-6 h-6" />
                           </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  <button 
                    onClick={addSlide}
                    className="w-full py-10 border-4 border-dashed border-white/5 hover:border-indigo-500/20 rounded-[3rem] transition-all flex flex-col items-center justify-center gap-4 group"
                  >
                     <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-slate-700 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-2xl">
                        <Plus className="w-8 h-8" />
                     </div>
                     <p className="text-[10px] font-black text-slate-600 group-hover:text-white uppercase tracking-widest italic">Append Tactical Slide to Sequence</p>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'preview' && (
            <motion.div 
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full p-12 bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.1)_0,transparent_100%)] pointer-events-none" />
              
              <div className="max-w-5xl w-full aspect-video bg-slate-900 border border-white/10 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col">
                <div className="p-6 bg-slate-950/50 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-lg shadow-rose-500/50" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">JAMB_TAC_BRIEFING_LIVE</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tactical Position: {currentSlide + 1} / {agenda.length}</span>
                </div>

                <div className="flex-grow p-20 flex flex-col justify-center text-center">
                  <AnimatePresence mode="wait">
                    {agenda.length > 0 ? (
                      <motion.div
                        key={agenda[currentSlide].id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-10"
                      >
                         <h3 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-tight">
                           {agenda[currentSlide].title}
                         </h3>
                         
                         <div className="relative">
                            <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent p-0" />
                            <div className="relative z-10 w-2 h-2 bg-indigo-500 rounded-full mx-auto" />
                         </div>

                         <div className="max-w-3xl mx-auto">
                            {agenda[currentSlide].type === 'bullet' ? (
                              <div className="space-y-4">
                                {agenda[currentSlide].content.split('.').filter(s => s.trim()).map((sentence, i) => (
                                  <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    key={i} 
                                    className="flex items-center gap-6 justify-center"
                                  >
                                    <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                                    <p className="text-xl text-slate-300 font-medium italic">{sentence.trim()}</p>
                                  </motion.div>
                                ))}
                              </div>
                            ) : agenda[currentSlide].type === 'header' ? (
                              <p className="text-2xl text-indigo-400 font-black uppercase tracking-widest leading-relaxed">
                                {agenda[currentSlide].content}
                              </p>
                            ) : (
                              <div className="bg-white/5 p-10 rounded-[2rem] border border-white/5 relative">
                                 <p className="text-2xl text-slate-300 font-medium italic leading-relaxed">
                                   "{agenda[currentSlide].content}"
                                 </p>
                              </div>
                            )}
                         </div>
                      </motion.div>
                    ) : (
                      <div className="space-y-6">
                         <ShieldAlert className="w-20 h-20 text-slate-800 mx-auto" />
                         <h2 className="text-2xl font-black text-slate-700 uppercase tracking-widest">System Readiness Fault</h2>
                         <p className="text-slate-800 font-black uppercase tracking-widest text-xs">No agenda data found for deployment.</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="mt-12 flex items-center gap-8">
                <button 
                  onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                  disabled={currentSlide === 0}
                  className="p-5 bg-white/5 border border-white/10 rounded-[2rem] text-slate-400 hover:text-white transition-all disabled:opacity-20 shadow-2xl"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <div className="flex gap-2">
                   {agenda.map((_, i) => (
                     <div 
                       key={i} 
                       className={`w-3 h-3 rounded-full transition-all ${currentSlide === i ? 'bg-indigo-600 scale-125' : 'bg-white/10 hover:bg-white/20'}`}
                     />
                   ))}
                </div>
                <button 
                  onClick={() => setCurrentSlide(prev => Math.min(agenda.length - 1, prev + 1))}
                  disabled={currentSlide === agenda.length - 1}
                  className="p-5 bg-white/5 border border-white/10 rounded-[2rem] text-slate-400 hover:text-white transition-all disabled:opacity-20 shadow-2xl"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </div>

              <div className="absolute bottom-12 left-0 right-0 flex justify-center">
                 <button 
                   onClick={() => setActiveTab('agenda')}
                   className="flex items-center gap-3 text-slate-500 hover:text-white transition-all font-black uppercase tracking-widest text-[10px]"
                 >
                    <X className="w-4 h-4" /> Exit Strategic Preview
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Persistence Floating Indicator */}
      <div className="fixed bottom-10 right-10 flex items-center gap-4 bg-slate-900/80 backdrop-blur-xl border border-white/5 p-4 rounded-2xl shadow-2xl animate-pulse">
         <div className="w-3 h-3 bg-emerald-500 rounded-full" />
         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sovereign Data Buffer Active</span>
      </div>
    </motion.div>
  );
};

const ShieldAlert: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </svg>
);
