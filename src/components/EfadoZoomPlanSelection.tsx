import React from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Clock, 
  Users, 
  Shield, 
  Check, 
  X, 
  Video, 
  CreditCard,
  Phone,
  DollarSign,
  Repeat
} from 'lucide-react';
import { useCurrency } from '../lib/CurrencyContext';

interface ZoomPlan {
  name: string;
  duration: string;
  amount: number;
  description: string;
  features: string[];
}

interface EfadoZoomPlanSelectionProps {
  onSelect: (plan: ZoomPlan) => void;
  onClose: () => void;
}

export const EfadoZoomPlanSelection: React.FC<EfadoZoomPlanSelectionProps> = ({ onSelect, onClose }) => {
  const { formatPrice, selectedCurrency } = useCurrency();

  const ZOOM_PLANS: ZoomPlan[] = [
    {
      name: "Tactical Trial",
      duration: "10 Minutes",
      amount: 0,
      description: "Quick tactical testing.",
      features: ["Stage Mode Access", "Basic Chat", "10 Patrons Max"]
    },
    {
      name: "Rapid Deployment",
      duration: "20 Minutes",
      amount: 2500,
      description: "Fast-paced briefing.",
      features: ["Stage Mode Access", "Tactical Voice Notes", "50 Patrons Max", "HD Signal"]
    },
    {
      name: "Strategic Hour",
      duration: "1 Hour",
      amount: 5000,
      description: "Professional coaching.",
      features: ["Stage Mode Access", "Voice Notes & Recording", "250 Patrons Max", "Priority Support"]
    },
    {
      name: "Combat Briefing",
      duration: "3 Hours",
      amount: 12000,
      description: "Deep-dive workshops.",
      features: ["Unlimited Speakers", "Full Recording Access", "1,000 Patrons Max", "YouTube Sync"]
    },
    {
      name: "Command Shift",
      duration: "6 Hours",
      amount: 20000,
      description: "Multi-session outreach.",
      features: ["Custom Branding", "Analytics Intel", "5,000 Patrons Max", "Tactical Moderation"]
    },
    {
      name: "Iron Dome",
      duration: "12 Hours",
      amount: 35000,
      description: "Full-day global event.",
      features: ["Infinite Replays", "Direct CRM Export", "Unlimited Patrons", "24/7 Expert Support"]
    },
    {
      name: "Authority Suite",
      duration: "Enterprise",
      amount: -1,
      description: "Infinite sovereign scale.",
      features: ["White-label Zoom", "API Infrastructure", "Unlimited Everything", "SLA Guarantee"]
    }
  ];

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 md:p-6 bg-slate-950/95 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-6xl bg-white rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 md:p-12 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <Video className="w-6 h-6 text-indigo-600" />
               <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Deployment Infrastructure</span>
            </div>
            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">EFADO Zoom <span className="text-indigo-600">Access Plans</span></h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Choose your tactical session duration and reach.</p>
          </div>
          <button 
            onClick={onClose}
            className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all shadow-sm border border-slate-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Plans Grid */}
        <div className="flex-grow overflow-y-auto p-8 md:p-12 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {ZOOM_PLANS.map((plan, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex flex-col p-8 rounded-[2.5rem] border ${plan.amount === 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100'} hover:border-indigo-500 hover:shadow-2xl transition-all group relative overflow-hidden`}
              >
                {plan.amount === 0 && (
                  <div className="absolute top-6 right-6 px-3 py-1 bg-indigo-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest">Initial Intel</div>
                )}
                
                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-1">{plan.name}</h4>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-6">{plan.duration}</p>
                
                <div className="mb-8">
                  <span className="text-4xl font-black text-slate-900 leading-none">
                    {plan.amount === 0 ? 'Free' : plan.amount === -1 ? 'Sovereign' : formatPrice(plan.amount)}
                  </span>
                  {plan.amount > 0 && <span className="text-[10px] font-bold text-slate-400 ml-1">/ Session</span>}
                </div>

                <p className="text-xs font-semibold text-slate-500 mb-8 leading-relaxed">{plan.description}</p>
                
                <div className="space-y-3 mb-10 flex-grow">
                  {plan.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-3">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest line-clamp-1">{feature}</span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => onSelect(plan)}
                  className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    plan.amount === 0 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-500' 
                    : 'bg-slate-900 text-white hover:bg-indigo-600'
                  }`}
                >
                  Deploy Command
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer Security Info */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-10">
           <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">End-to-End Encrypted Deployment</span>
           </div>
           <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-indigo-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Strategic Network Synchronisation</span>
           </div>
        </div>
      </motion.div>
    </div>
  );
};
