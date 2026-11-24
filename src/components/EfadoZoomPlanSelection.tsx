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
      name: "Free Trial",
      duration: "10 Minutes",
      amount: 0,
      description: "Quick meeting test.",
      features: ["Stage Mode Access", "Basic Chat", "10 Participants Max"]
    },
    {
      name: "Quick Meeting",
      duration: "20 Minutes",
      amount: 2500,
      description: "Fast team check-in.",
      features: ["Stage Mode Access", "Voice Notes", "50 Participants Max", "HD Video"]
    },
    {
      name: "Standard Hour",
      duration: "1 Hour",
      amount: 5000,
      description: "Classes and coaching sessions.",
      features: ["Stage Mode Access", "Voice Notes & Recording", "250 Participants Max", "Priority Support"]
    },
    {
      name: "Workshop Session",
      duration: "3 Hours",
      amount: 12000,
      description: "Extended classes and workshops.",
      features: ["Unlimited Speakers", "Full Recording Access", "1,000 Participants Max", "YouTube Sync"]
    },
    {
      name: "Half-Day Event",
      duration: "6 Hours",
      amount: 20000,
      description: "Multi-session events.",
      features: ["Custom Branding", "Session Analytics", "5,000 Participants Max", "Host Moderation"]
    },
    {
      name: "Full-Day Event",
      duration: "12 Hours",
      amount: 35000,
      description: "Full-day online conference.",
      features: ["Infinite Replays", "Direct Attendee Export", "Unlimited Participants", "24/7 Support"]
    },
    {
      name: "Enterprise Suite",
      duration: "Custom",
      amount: -1,
      description: "Custom scale for organizations.",
      features: ["Custom Branded Room", "Dedicated Infrastructure", "Unlimited Access", "Priority SLA"]
    }
  ];

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 md:p-6 bg-slate-950/95 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-6xl bg-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 md:p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <Video className="w-5 h-5 text-indigo-600" />
               <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Video Conferencing</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">EFADO Zoom <span className="text-indigo-600">Plans</span></h2>
            <p className="text-slate-500 font-medium text-xs sm:text-sm mt-1">Choose your session duration and participant capacity.</p>
          </div>
          <button 
            onClick={onClose}
            className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all shadow-sm border border-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Plans Grid */}
        <div className="flex-grow overflow-y-auto p-6 md:p-10 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {ZOOM_PLANS.map((plan, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex flex-col p-6 rounded-3xl border ${plan.amount === 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100'} hover:border-indigo-500 hover:shadow-xl transition-all group relative overflow-hidden`}
              >
                {plan.amount === 0 && (
                  <div className="absolute top-4 right-4 px-2.5 py-0.5 bg-indigo-600 text-white rounded-full text-[9px] font-bold uppercase tracking-wider">Free Trial</div>
                )}
                
                <h4 className="text-lg font-black text-slate-900 tracking-tight mb-1">{plan.name}</h4>
                <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-5">{plan.duration}</p>
                
                <div className="mb-6">
                  <span className="text-3xl font-black text-slate-900 leading-none">
                    {plan.amount === 0 ? 'Free' : plan.amount === -1 ? 'Custom' : formatPrice(plan.amount)}
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
                  Select Plan
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer Security Info */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-center gap-6 sm:gap-10">
           <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-500" />
              <span className="text-xs font-semibold text-slate-500">End-to-End Encrypted Meetings</span>
           </div>
           <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-indigo-500" />
              <span className="text-xs font-semibold text-slate-500">Instant Room Sync</span>
           </div>
        </div>
      </motion.div>
    </div>
  );
};
