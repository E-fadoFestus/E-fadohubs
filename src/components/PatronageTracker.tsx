import React from 'react';
import { motion } from 'motion/react';
import { X, Trophy, Globe, User, Zap, BarChart3, TrendingUp, MapPin } from 'lucide-react';

interface PatronageData {
  id: string;
  userName: string;
  level: number; // 0 to 100
  country: string;
  area: string; // e.g. "Gist Hub", "Loan Hub"
}

interface PatronageTrackerProps {
  onClose: () => void;
  data?: PatronageData[];
}

// Mock data as a fallback
const MOCK_PATRONAGE: PatronageData[] = [
  { id: '1', userName: 'Festus Ade', level: 95, country: 'Nigeria', area: 'Gist Hub & Loans' },
  { id: '2', userName: 'Sarah Jenkins', level: 82, country: 'USA', area: 'Market Hub' },
  { id: '3', userName: 'Kofi Annan', level: 75, country: 'Ghana', area: 'Education Hub' },
  { id: '4', userName: 'Chioma Obi', level: 68, country: 'Nigeria', area: 'Gist Hub' },
  { id: '5', userName: 'Elena Petrova', level: 60, country: 'Russia', area: 'Service Corps' },
  { id: '6', userName: 'John Doe', level: 55, country: 'UK', area: 'Money Quiz' },
  { id: '7', userName: 'Grace Mensah', level: 48, country: 'Ghana', area: 'Trading Hub' },
  { id: '8', userName: 'Mohamed Ali', level: 42, country: 'Egypt', area: 'Loan Hub' },
  { id: '9', userName: 'Jane Smith', level: 35, country: 'Canada', area: 'Gist Hub' },
  { id: '10', userName: 'Abebe Bikila', level: 25, country: 'Ethiopia', area: 'Market Hub' },
];

export const PatronageTracker: React.FC<PatronageTrackerProps> = ({ onClose, data = MOCK_PATRONAGE }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -ml-48 -mb-48" />

        {/* Header */}
        <div className="relative z-10 px-10 py-8 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-xl">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-red-100">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Patronage Tracker</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">Strategic Investment & Rewards Hub</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-all shadow-sm"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="px-10 py-6 bg-gray-50/50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-600 rounded-full" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Patronage Intensity</span>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">+12% Growth this week</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2 bg-white border border-gray-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2">
              <Globe className="w-3 h-3" /> Filter by Region
            </button>
            <button className="px-5 py-2 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center gap-2">
              <Zap className="w-3 h-3 text-yellow-400" /> Allocate Awards
            </button>
          </div>
        </div>

        {/* Content Table Header */}
        <div className="px-10 py-4 grid grid-cols-[1fr_2fr_1fr_1.2fr] gap-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <User className="w-3 h-3" /> user name
          </div>
          <div className="flex items-center gap-2 text-red-600">
            <BarChart3 className="w-3 h-3" /> level of patronage
          </div>
          <div className="flex items-center gap-2 text-emerald-600">
            <Globe className="w-3 h-3" /> country
          </div>
          <div className="flex items-center gap-2 text-indigo-600">
            <MapPin className="w-3 h-3" /> Area of Patronage
          </div>
        </div>

        {/* Main List */}
        <div className="flex-grow overflow-y-auto px-10 py-6 space-y-4 custom-scrollbar">
          {data.sort((a, b) => b.level - a.level).map((item, index) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              key={item.id} 
              className="grid grid-cols-[1fr_2fr_1fr_1.2fr] gap-6 items-center group p-3 hover:bg-gray-50 rounded-2xl transition-all"
            >
              <div className="font-bold text-gray-900 truncate">
                {item.userName}
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-grow h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.level}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.1 + index * 0.05 }}
                    className="h-full bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)] rounded-full relative"
                  >
                    <div className="absolute top-0 right-0 bottom-0 w-1/3 bg-gradient-to-l from-white/20 to-transparent" />
                  </motion.div>
                </div>
                <span className="text-[10px] font-black text-red-600 w-8">{item.level}%</span>
              </div>

              <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest truncate">
                {item.country}
              </div>

              <div className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter leading-snug">
                {item.area}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer with Map Visualization Placeholder */}
        <div className="px-10 py-10 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between gap-10">
          <div className="flex-grow">
            <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4">Strategic Regional Intensity</h4>
            <div className="flex flex-wrap gap-4">
              {['Nigeria: 92%', 'USA: 78%', 'Ghana: 65%', 'China: 44%', 'Russia: 38%'].map(region => (
                <div key={region} className="px-4 py-2 bg-white rounded-xl border border-gray-100 text-[9px] font-bold text-gray-600 shadow-sm">
                  {region}
                </div>
              ))}
            </div>
          </div>
          
          <div className="w-48 h-32 bg-indigo-50 rounded-[2rem] border border-indigo-100 flex items-center justify-center shadow-lg relative overflow-hidden group">
            {/* Minimalist Africa Map Icon Represented */}
            <svg viewBox="0 0 100 100" className="w-20 h-20 text-indigo-600/20 absolute -right-4 transition-transform group-hover:scale-110">
              <path fill="currentColor" d="M30,20 Q40,10 50,15 T70,30 T60,60 T40,80 T20,60 T25,40 Z" />
            </svg>
            <div className="relative z-10 text-center">
              <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Top Active Region</p>
              <p className="text-xl font-black text-indigo-900">AFRICA</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
