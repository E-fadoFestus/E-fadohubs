import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gavel, 
  X, 
  Send, 
  CheckCircle2, 
  MessageCircle, 
  Clock, 
  DollarSign,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  User,
  ShieldCheck,
  Scale
} from 'lucide-react';
import { ServiceRequest, ServiceProvider, ServiceBargain, UserProfile } from '../types';
import { db, doc, updateDoc, onSnapshot, serverTimestamp, collection, addDoc } from '../firebase';

interface ServiceBargainPlatformProps {
  request: ServiceRequest;
  provider: ServiceProvider;
  user: UserProfile;
  onClose: () => void;
}

export const ServiceBargainPlatform: React.FC<ServiceBargainPlatformProps> = ({
  request,
  provider,
  user,
  onClose
}) => {
  const [bargain, setBargain] = useState<ServiceBargain | null>(null);
  const [message, setMessage] = useState('');
  const [proposedPrice, setProposedPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  const isClient = user.uid === request.clientId;
  const isProvider = user.uid === provider.userId;

  useEffect(() => {
    // Find or create bargain session
    const bargainId = `${request.id}_${provider.userId}`;
    const unsubscribe = onSnapshot(doc(db, 'service_bargains', bargainId), (snap) => {
      if (snap.exists()) {
        setBargain({ id: snap.id, ...snap.data() } as ServiceBargain);
        setProposedPrice((snap.data() as ServiceBargain).currentOffer);
      } else {
        // Initial setup if not exists
        createBargain(bargainId);
      }
    });

    return () => unsubscribe();
  }, [request.id, provider.userId]);

  const createBargain = async (id: string) => {
    try {
      const initialBargain: Omit<ServiceBargain, 'id'> = {
        requestId: request.id!,
        providerId: provider.userId,
        clientId: request.clientId,
        initialPrice: parseFloat(request.budget?.replace(/[^0-9.]/g, '') || '0') || 5000,
        currentOffer: parseFloat(request.budget?.replace(/[^0-9.]/g, '') || '0') || 5000,
        clientAccepted: false,
        providerAccepted: false,
        offers: [],
        status: 'negotiating',
        messages: [{
          senderId: 'system',
          text: 'Negotiation Round Table Initiated. Reach a mutual agreement to proceed.',
          timestamp: Date.now()
        }],
        createdAt: Date.now()
      };
      await updateDoc(doc(db, 'service_bargains', id), initialBargain as any);
    } catch (err) {
      console.error('Failed to create bargain session', err);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() && proposedPrice === bargain?.currentOffer) return;
    if (!bargain) return;

    setLoading(true);
    try {
      const newMessages = [...bargain.messages, {
        senderId: user.uid,
        text: message.trim(),
        proposedPrice: proposedPrice !== bargain.currentOffer ? proposedPrice : undefined,
        timestamp: Date.now()
      }];

      await updateDoc(doc(db, 'service_bargains', bargain.id), {
        messages: newMessages,
        currentOffer: proposedPrice,
        lastUpdated: Date.now(),
        clientAccepted: false, // Reset agreement if offer changes
        providerAccepted: false
      });
      setMessage('');
    } catch (err) {
      console.error('Bargain update error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!bargain) return;
    try {
      const update: any = {};
      if (isClient) update.clientAccepted = true;
      if (isProvider) update.providerAccepted = true;

      await updateDoc(doc(db, 'service_bargains', bargain.id), update);

      // If both accepted, finalize
      const freshSnap = await doc(db, 'service_bargains', bargain.id);
      // Note: In real app, check server state. For demo, we'll assume the update went through.
    } catch (err) {
      console.error('Acceptance error', err);
    }
  };

  if (!bargain) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const bothAccepted = bargain.clientAccepted && bargain.providerAccepted;

  return (
    <div className="flex flex-col h-[750px] bg-slate-50 rounded-[3rem] overflow-hidden shadow-2xl border border-white/5 relative">
      {/* Strategic Header */}
      <div className="p-8 bg-slate-950 text-white flex items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 rotate-3">
            <Scale className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-black text-2xl tracking-tighter uppercase italic italic-none">Strategic Round Table</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              <p className="text-indigo-400 text-[10px] font-black tracking-widest uppercase opacity-70">Protocol ID: {bargain.id.slice(0, 12)} • Secured Session</p>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all relative z-10">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Visual Round Table Environment */}
      <div className="bg-white px-8 py-10 border-b border-gray-100 relative shadow-inner">
        <div className="max-w-xl mx-auto flex items-center justify-between relative">
          {/* Client Side */}
          <div className="flex flex-col items-center gap-3">
            <div className={`w-20 h-20 rounded-[2rem] p-1 border-2 transition-all duration-500 ${bargain.clientAccepted ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
              <div className="w-full h-full rounded-[1.75rem] overflow-hidden bg-slate-200 flex items-center justify-center">
                <User className="w-10 h-10 text-slate-400" />
              </div>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${bargain.clientAccepted ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-200 text-slate-500'}`}>
              {bargain.clientAccepted && <ShieldCheck className="w-3 h-3" />} Client Ready
            </div>
          </div>

          {/* Table Center: The Proposal */}
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
             <div className="w-32 h-32 rounded-full bg-slate-900 flex flex-col items-center justify-center border-8 border-slate-50 shadow-2xl relative">
                <div className="absolute inset-0 bg-indigo-600/10 rounded-full animate-pulse" />
                <DollarSign className="w-6 h-6 text-indigo-400 mb-1" />
                <span className="text-sm font-black text-white italic">PROPOSAL</span>
                <div className="w-12 h-1 bg-indigo-600 rounded-full mt-2" />
             </div>
          </div>

          {/* Provider Side */}
          <div className="flex flex-col items-center gap-3">
            <div className={`w-20 h-20 rounded-[2rem] p-1 border-2 transition-all duration-500 ${bargain.providerAccepted ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
              <div className="w-full h-full rounded-[1.75rem] overflow-hidden bg-slate-200">
                <img src={`https://picsum.photos/seed/${provider.userId}/200/200`} alt={provider.businessName} className="w-full h-full object-cover" />
              </div>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${bargain.providerAccepted ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-200 text-slate-500'}`}>
              {bargain.providerAccepted && <ShieldCheck className="w-3 h-3" />} Provider Ready
            </div>
          </div>
        </div>

        {/* Central Summary Bar */}
        <div className="mt-12 flex items-center justify-between bg-indigo-900 rounded-3xl p-6 shadow-2xl shadow-indigo-900/20">
           <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                 <Gavel className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 italic">Current Strategic Valuation</p>
                 <div className="flex items-baseline gap-2">
                   <h4 className="text-3xl font-black text-white italic tracking-tighter">₦{bargain.currentOffer.toLocaleString()}</h4>
                   {bargain.currentOffer < bargain.initialPrice && (
                     <span className="text-[9px] font-black text-emerald-400 uppercase flex items-center gap-1">
                       <TrendingDown className="w-3 h-3" /> Save ₦{(bargain.initialPrice - bargain.currentOffer).toLocaleString()}
                     </span>
                   )}
                 </div>
              </div>
           </div>

           {bothAccepted ? (
             <motion.div 
               animate={{ scale: [1, 1.05, 1] }}
               transition={{ repeat: Infinity, duration: 2 }}
               className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center gap-2"
             >
               <CheckCircle2 className="w-5 h-5" /> Agreement Solidified
             </motion.div>
           ) : (
             <button 
               onClick={handleAccept}
               disabled={ (isClient && bargain.clientAccepted) || (isProvider && bargain.providerAccepted) }
               className={`px-8 py-4 ${((isClient && bargain.clientAccepted) || (isProvider && bargain.providerAccepted)) ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-900 hover:bg-slate-50'} rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 flex items-center gap-3`}
             >
               {((isClient && bargain.clientAccepted) || (isProvider && bargain.providerAccepted)) ? (
                 <>Awaiting Counter-Signature <Clock className="w-4 h-4 animate-spin" /></>
               ) : (
                 <>Authorize Terms <ShieldCheck className="w-4 h-4" /></>
               )}
             </button>
           )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50">
        {bargain.messages.map((m, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.senderId === 'system' ? 'justify-center' : m.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] rounded-[2rem] p-6 shadow-sm border ${
              m.senderId === 'system' ? 'bg-amber-50 text-amber-800 text-[10px] uppercase font-black tracking-widest border-amber-100 text-center' :
              m.senderId === user.uid ? 'bg-slate-900 text-white border-white/5 rounded-tr-none' : 'bg-white text-slate-800 border-gray-100 rounded-tl-none'
            }`}>
              {m.proposedPrice && (
                <div className={`mb-4 p-3 rounded-2xl text-xs font-black flex items-center justify-between gap-4 ${m.senderId === user.uid ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900'}`}>
                   <div className="flex items-center gap-2">
                     <div className={`p-1.5 rounded-lg ${m.proposedPrice < bargain.initialPrice ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                        {m.proposedPrice < bargain.initialPrice ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                     </div>
                     <span>Strategic Re-valuation</span>
                   </div>
                   <span className="text-sm italic">₦{m.proposedPrice.toLocaleString()}</span>
                </div>
              )}
              <p className="text-sm font-medium leading-relaxed">{m.text}</p>
              <div className={`flex items-center gap-2 mt-4 text-[9px] font-black uppercase tracking-widest opacity-40 ${m.senderId === 'system' ? 'justify-center' : ''}`}>
                 <Clock className="w-3 h-3" /> {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Input Area */}
      {!bothAccepted && (
        <div className="p-8 bg-white border-t border-gray-100 relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white px-4 py-1.5 rounded-full border border-gray-100 shadow-sm flex items-center gap-2">
             <MessageCircle className="w-3 h-3 text-indigo-600" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tactical Communication Terminal</span>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 items-end max-w-4xl mx-auto">
            <div className="flex-1 space-y-3 w-full">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                <DollarSign className="w-3 h-3" /> Adjust Strategic Value
              </label>
              <div className="relative group">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-2xl group-focus-within:text-indigo-600 transition-colors">₦</span>
                <input 
                  type="number"
                  className="w-full pl-12 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:border-indigo-600 focus:bg-white outline-none transition-all text-slate-950 font-black text-xl shadow-inner italic"
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex-[2] space-y-3 w-full">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                <MessageCircle className="w-3 h-3" /> Reasoning & Signal Buffer
              </label>
              <div className="flex gap-3">
                <input 
                  type="text"
                  className="flex-1 px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:border-indigo-600 focus:bg-white outline-none transition-all text-slate-950 font-bold shadow-inner"
                  placeholder="Justify your counter-offer or terms..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={loading}
                  className="w-20 h-20 bg-indigo-600 text-white rounded-[2rem] shadow-2xl shadow-indigo-500/20 hover:bg-slate-950 hover:scale-105 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
                >
                  <Send className="w-8 h-8 rotate-12" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
