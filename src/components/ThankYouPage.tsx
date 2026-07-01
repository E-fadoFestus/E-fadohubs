import React, { useEffect } from 'react';
import { 
  CheckCircle2, 
  Calendar, 
  Download, 
  BookOpen, 
  Sparkles, 
  Share2, 
  ArrowRight, 
  ShieldCheck, 
  Tv, 
  Clock, 
  CheckSquare, 
  FileText 
} from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';

interface ThankYouPageProps {
  user: UserProfile;
  amount: number;
  productName: string;
  referenceId: string;
  paymentMethod?: string;
  onClose: () => void;
  onJoinWebinar?: () => void;
  onLaunchCBT?: () => void;
}

export const ThankYouPage: React.FC<ThankYouPageProps> = ({
  user,
  amount,
  productName,
  referenceId,
  paymentMethod = 'Paystack Instant Gate',
  onClose,
  onJoinWebinar,
  onLaunchCBT
}) => {
  const transactionId = referenceId || `EFD_TX_${Math.floor(100000 + Math.random() * 900000)}`;
  const dateString = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Track conversion in Google Analytics / Google Ads if gtag is loaded
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        console.log('Firing Google Ads Conversion Tag G-65LSEMP97N for purchase:', productName);
        (window as any).gtag('event', 'conversion', {
          send_to: 'G-65LSEMP97N',
          value: amount,
          currency: 'NGN',
          transaction_id: transactionId,
          items: [
            {
              id: transactionId,
              name: productName,
              price: amount,
              quantity: 1
            }
          ]
        });
      }
    } catch (e) {
      console.warn('Google Tag conversion tracking skipped or inactive:', e);
    }
  }, [amount, productName, transactionId]);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center relative overflow-hidden select-none">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      <div className="w-full max-w-4xl relative z-10 space-y-8">
        
        {/* Main Card */}
        <div className="bg-slate-900 border border-white/5 rounded-[3rem] shadow-2xl p-6 sm:p-12 space-y-10 relative overflow-hidden">
          
          {/* Confetti Visual & Header */}
          <div className="text-center space-y-6">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="w-24 h-24 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl relative"
            >
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
              </div>
            </motion.div>

            <div className="space-y-2">
              <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full inline-block">
                Transaction Verified & Secure
              </span>
              <h1 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter">
                Thank You For Your Order!
              </h1>
              <p className="text-sm text-slate-400 font-semibold max-w-lg mx-auto leading-relaxed">
                Hi, <span className="text-white font-bold">{user.displayName || user.email.split('@')[0]}</span>. Your subscription/purchase is successfully completed and logged on EFADO mainframes.
              </p>
            </div>
          </div>

          {/* Receipt Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* Column 1: Payment Ticket Receipt */}
            <div className="bg-slate-950 p-6 sm:p-8 rounded-[2rem] border border-white/5 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="border-b border-white/5 pb-4 flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">Transaction Receipt</h3>
                  <span className="text-[9px] font-mono text-slate-500 uppercase">INVOICE</span>
                </div>

                <div className="space-y-3 font-mono text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>PRODUCT:</span>
                    <span className="text-white font-bold text-right max-w-[200px] truncate">{productName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AMOUNT PAID:</span>
                    <span className="text-emerald-400 font-black">₦{amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GATEWAY:</span>
                    <span className="text-indigo-400 font-bold">{paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>REFERENCE NO:</span>
                    <span className="text-white select-all">{transactionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PAYER EMAIL:</span>
                    <span className="text-slate-300 max-w-[150px] truncate">{user.email}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/5 pt-3">
                    <span>DATE & TIME:</span>
                    <span className="text-slate-300 text-right">{dateString}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure SSL:256
                </div>
                <span>E-FADO CORP</span>
              </div>
            </div>

            {/* Column 2: Next Steps Checklist / Onboarding Guide */}
            <div className="bg-slate-950/40 p-6 sm:p-8 rounded-[2rem] border border-white/5 space-y-5">
              <h3 className="text-sm font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-400" /> Candidate Next Steps
              </h3>
              
              <div className="space-y-4 font-sans text-xs">
                
                <div className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">1</div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-white uppercase text-[11px]">Generate e-PIN / Slips</h4>
                    <p className="text-slate-400 leading-relaxed font-semibold">Your e-PIN is dispatched instantly inside the portal dashboard. Download and print your copy directly.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">2</div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-white uppercase text-[11px]">Practice CBT Mock Drills</h4>
                    <p className="text-slate-400 leading-relaxed font-semibold">Use your active subscription or credits to practice full 180-question exams mimicking actual UTME parameters.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">3</div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-white uppercase text-[11px]">Attend Live Webinars</h4>
                    <p className="text-slate-400 leading-relaxed font-semibold">Join live academic mentoring channels with seasoned tutors to master concepts before the exams begin.</p>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Action Hub Panels */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5">
            
            <button
              onClick={onJoinWebinar || onClose}
              className="p-4 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 hover:border-indigo-500 text-indigo-400 hover:text-white rounded-2xl flex flex-col items-center text-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
            >
              <Tv className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest block">Join Active Seminar</span>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Attend Mentoring</p>
            </button>

            <button
              onClick={onLaunchCBT || onClose}
              className="p-4 bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/20 hover:border-emerald-500 text-emerald-400 hover:text-white rounded-2xl flex flex-col items-center text-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
            >
              <BookOpen className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest block">Start CBT Simulator</span>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Master Exam Questions</p>
            </button>

            <button
              onClick={() => {
                alert('Downloading receipt. PDF driver initialized.');
              }}
              className="p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-2xl flex flex-col items-center text-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
            >
              <Download className="w-6 h-6 text-slate-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest block">Download Receipt</span>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Save Clean Record</p>
            </button>

          </div>

          {/* Core Return Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-8 py-4 bg-white text-slate-950 hover:bg-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              Return to Core Portal <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Global Footer Note */}
        <p className="text-center text-[9px] text-slate-500 font-black uppercase tracking-widest">
          EFADO Academic & Finance Cognitive Network • Globally Accessible System
        </p>

      </div>
    </div>
  );
};
