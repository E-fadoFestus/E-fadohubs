import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Linkedin, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Cpu, 
  Award, 
  Globe, 
  CpuIcon,
  Briefcase,
  Users
} from 'lucide-react';
import { PHONE_NUMBERS, SUPPORT_EMAILS } from '../constants/businessProfile';

interface AboutCeoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutCeoModal: React.FC<AboutCeoModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            className="w-full max-w-5xl bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all z-50 group"
            >
              <X className="w-6 h-6 text-slate-400 group-hover:text-white" />
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[70vh]">
              {/* Left Column: Portrait and Key info */}
              <div className="lg:col-span-5 bg-gradient-to-b from-indigo-950 to-slate-900 p-10 flex flex-col justify-between relative overflow-hidden border-r border-white/5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                
                <div className="relative z-10 space-y-8">
                  {/* Portrait frame */}
                  <div className="relative w-48 h-48 mx-auto xl:w-56 xl:h-56 rounded-3xl overflow-hidden border border-white/10 bg-slate-950">
                    <img 
                      src="/src/assets/images/ceo_exact_attached_1779365508172.png" 
                      alt="Okhawere Festus - CEO" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="text-center space-y-2">
                    <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight font-adlam">
                      Okhawere Festus
                    </h2>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.25em] italic">
                      Chief Executive Officer
                    </p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                      EFADO Technology Computer Engineering & Training Services
                    </p>
                    <div className="pt-2 flex justify-center">
                      <a 
                        href="https://chat.whatsapp.com/Bog8pUjxg3HJjFvhOQtLfm" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl text-emerald-400 hover:text-emerald-300 transition-all font-black text-[9px] uppercase tracking-widest active:scale-95 group shadow-lg shadow-emerald-950/20"
                      >
                        <svg className="w-4 h-4 fill-current text-emerald-500 group-hover:scale-110 transition-transform duration-300 shrink-0" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm12.035-1.991c1.801.001 3.567-.483 5.111-1.4l.366-.218 3.799.996-.948-3.705.239-.381c.974-1.55 1.488-3.34 1.486-5.183-.002-5.518-4.43-10.007-9.89-10.007-2.646 0-5.132 1.03-7.003 2.903a9.855 9.855 0 00-2.899 7.021c-.001 1.841.481 3.633 1.4 5.185l.239.398-.948 3.7l3.864-.997.359.214a9.882 9.882 0 005.144 1.401zm4.773-6.52c-.262-.13-1.55-.765-1.79-.852-.24-.087-.414-.13-.588.13-.174.26-.675.852-.828 1.026-.151.173-.304.195-.566.065-2.263-1.127-3.754-2.5-4.571-3.9-.22-.375-.022-.577.165-.765.168-.168.374-.434.561-.652.181-.217.241-.37.362-.616.12-.247.06-.463-.03-.593-.09-.13-.588-1.42-.806-1.947-.213-.513-.448-.444-.616-.453-.16-.008-.344-.01-.528-.01-.184 0-.485.069-.739.347-.253.278-.967.945-.967 2.302 0 1.358.987 2.67 1.124 2.853.137.183 1.944 2.97 4.71 4.164.658.284 1.17.454 1.57.581.662.21 1.265.18 1.741.109.531-.08 1.55-.634 1.768-1.217.218-.584.218-1.085.153-1.196-.065-.11-.24-.173-.502-.303z"/>
                        </svg>
                        <span>Connect on WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 pt-8 border-t border-white/5 space-y-4">
                  <div className="flex items-center gap-3 text-xs text-slate-300">
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400 shrink-0 border border-white/5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Profession</p>
                      <p className="font-bold">Nigerian Computer Engineer</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-slate-300">
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-indigo-400 shrink-0 border border-white/5">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Mission Scope</p>
                      <p className="font-bold">Global Connected Digital Ecosystem</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Narrative & Framework Details */}
              <div className="lg:col-span-7 p-8 md:p-12 overflow-y-auto max-h-[85vh] custom-scrollbar space-y-10 bg-slate-950/20">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] italic">Executive Insight</p>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tight italic font-display">
                    Ecosystem Visionary
                  </h3>
                  <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full" />
                </div>

                {/* Narrative blocks */}
                <div className="space-y-6 text-slate-300 leading-relaxed font-medium">
                  <p className="text-base text-white/90 font-semibold italic border-l-2 border-emerald-500 pl-4 py-1">
                    "Okhawere Festus is the CEO of EFADO Technology Computer Engineering and Training Services and Efado Hubs Connect. A Nigerian Computer Engineer, he has distinguished himself through technological inventions driven by a core ambition to make the world a better place to inhabit."
                  </p>
                  
                  <p className="text-sm">
                    His work has empowered and trained many in the fields of computer science and computer engineering, fostering talent development and building highly resourceful physical and digital architectures.
                  </p>

                  <p className="text-sm">
                    He is propelled by the spirit of technology—fueled by modern-day innovations and his vision to transform the universe into a connected hub that bridges the difficulties of connectivity into an all-in-one digital ecosystem.
                  </p>

                  <p className="text-sm">
                    His frameworks and architectures are designed for seamless connectivity, structured around integrated, functional, and equitable integrity across both physical and digital innovations. These creations cater to a diverse range of talents and audiences across the globe with unlimited resourcefulness.
                  </p>
                </div>

                {/* Core Columns of CEO Portfolios */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                  <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-indigo-400" />
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">Invention & Frameworks</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 uppercase leading-relaxed font-bold">
                      Architecting high-fidelity, all-in-one secure financial and professional digital pipelines for equitable global access.
                    </p>
                  </div>
                  
                  <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-400" />
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">Education & Training</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 uppercase leading-relaxed font-bold">
                      Empowering hundreds of professionals across fields of advanced Computer Science, Network Engineering, and digital resourcefulness.
                    </p>
                  </div>
                </div>

                {/* Direct Connect Matrix */}
                <div className="pt-6 border-t border-white/5 flex flex-wrap gap-4 items-center justify-between text-xs font-bold text-slate-400">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-slate-500" />
                    <span className="uppercase tracking-widest text-[9px] font-black">Strategic Consultancy:</span>
                    <span className="text-white font-black tracking-widest">{PHONE_NUMBERS.CONSULTANCY_CEO}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span className="uppercase tracking-widest text-[9px] font-black">Email Reach:</span>
                    <span className="text-white hover:underline">{SUPPORT_EMAILS.DEFAULT}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
