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
  Scale,
  Star,
  Award,
  ThumbsUp,
  ShieldAlert
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
  const [bargain, setBargain] = useState<any | null>(null);
  const [message, setMessage] = useState('');
  const [proposedPrice, setProposedPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  const [rating, setRating] = useState(5);
  const [testimonyText, setTestimonyText] = useState('');
  const [proficiencyChecks, setProficiencyChecks] = useState<string[]>([
    'High-Skill Execution',
    'Intrusion-Safe Verification'
  ]);
  const [submittingTestimony, setSubmittingTestimony] = useState(false);
  const [showTestimonyForm, setShowTestimonyForm] = useState(false);

  const isClient = user.uid === request.clientId;
  const isProvider = user.uid === provider.userId;

  const generateSecureKey = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `EF-SEC-${code}`;
  };

  useEffect(() => {
    // Find or create bargain session
    const bargainId = `${request.id}_${provider.userId}`;
    const unsubscribe = onSnapshot(doc(db, 'service_bargains', bargainId), (snap) => {
      if (snap.exists()) {
        const snapData = snap.data();
        if (!snapData.verificationCode) {
          const freshCode = generateSecureKey();
          updateDoc(doc(db, 'service_bargains', bargainId), { verificationCode: freshCode });
        }
        setBargain({ id: snap.id, ...snapData } as any);
        setProposedPrice(snapData.currentOffer);
      } else {
        // Initial setup if not exists
        createBargain(bargainId);
      }
    });

    return () => unsubscribe();
  }, [request.id, provider.userId]);

  const createBargain = async (id: string) => {
    try {
      const code = generateSecureKey();
      const initialBargain = {
        requestId: request.id!,
        providerId: provider.userId,
        clientId: request.clientId,
        initialPrice: parseFloat(request.budget?.replace(/[^0-9.]/g, '') || '0') || 5000,
        currentOffer: parseFloat(request.budget?.replace(/[^0-9.]/g, '') || '0') || 5000,
        clientAccepted: false,
        providerAccepted: false,
        offers: [],
        status: 'negotiating',
        verificationCode: code,
        handshakeVerified: false,
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

  const [typedCode, setTypedCode] = useState('');
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  const handleVerifyHandshake = async () => {
    if (!bargain) return;
    if (typedCode.trim().toUpperCase() === bargain.verificationCode?.toUpperCase()) {
      try {
        await updateDoc(doc(db, 'service_bargains', bargain.id), {
          handshakeVerified: true
        });
        setVerificationFeedback('SUCCESS');
      } catch (err) {
        console.error('Handshake update error', err);
      }
    } else {
      setVerificationFeedback('INVALID');
      setTimeout(() => setVerificationFeedback(null), 3000);
    }
  };

  const handleSubmitTestimony = async () => {
    if (!bargain) return;
    setSubmittingTestimony(true);
    try {
      // 1. Add testimony to DB
      await addDoc(collection(db, 'service_testimonies'), {
        requestId: request.id || bargain.requestId,
        bargainId: bargain.id,
        providerId: provider.userId,
        providerName: provider.businessName,
        providerPhoto: provider.photos?.[0] || `https://picsum.photos/seed/${provider.userId}/200/200`,
        clientId: request.clientId || user.uid,
        clientName: request.clientName || user.displayName || 'Authorized Client',
        clientPhoto: request.photos?.[0] || `https://picsum.photos/seed/${request.clientId || user.uid}/200/200`,
        rating,
        testimonyText: testimonyText.trim() || 'Exceptional tactical coordination and reliable skill execution.',
        proficiencyChecks,
        subcategory: request.subcategory || 'Engineering Consult',
        createdAt: Date.now()
      });

      // 2. Update service request to completed
      if (request.id) {
        await updateDoc(doc(db, 'service_requests', request.id), {
          status: 'completed'
        });
      }

      // 3. Update bargain to completed
      await updateDoc(doc(db, 'service_bargains', bargain.id), {
        status: 'completed',
        clientTestimony: {
          rating,
          text: testimonyText.trim() || 'Exceptional tactical coordination and reliable skill execution.',
          checks: proficiencyChecks,
          timestamp: Date.now()
        }
      });

      setShowTestimonyForm(false);
    } catch (err) {
      console.error('Field completion / rating feedback failed', err);
    } finally {
      setSubmittingTestimony(false);
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
    <div className="flex flex-col h-[800px] bg-slate-50 rounded-[3rem] overflow-hidden shadow-2xl border border-white/5 relative">
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
      <div className="bg-white px-8 py-8 border-b border-gray-100 relative shadow-inner overflow-y-auto no-scrollbar max-h-[380px]">
        <div className="max-w-xl mx-auto flex items-center justify-between relative">
          {/* Client Side */}
          <div className="flex flex-col items-center gap-3">
            <div className={`w-20 h-20 rounded-[2rem] p-1 border-2 transition-all duration-500 ${bargain.clientAccepted ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
              <div className="w-full h-full rounded-[1.75rem] overflow-hidden bg-slate-200 flex items-center justify-center">
                {request.photos?.[0] ? (
                  <img src={request.photos[0]} alt={request.clientName} className="w-full h-full object-cover" />
                ) : (
                  <img src={`https://picsum.photos/seed/${request.clientId}/200/200`} alt={request.clientName} className="w-full h-full object-cover" />
                )}
              </div>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-900 truncate max-w-[90px]">{request.clientName}</p>
              <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest mt-1 flex items-center gap-1 mx-auto w-fit ${bargain.clientAccepted ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-200 text-slate-500'}`}>
                {bargain.clientAccepted && <ShieldCheck className="w-2 h-2" />} Client Ready
              </div>
            </div>
          </div>

          {/* Table Center: The Proposal */}
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
             <div className="w-24 h-24 rounded-full bg-slate-900 flex flex-col items-center justify-center border-4 border-slate-50 shadow-2xl relative">
                <div className="absolute inset-0 bg-indigo-600/10 rounded-full animate-pulse" />
                <DollarSign className="w-5 h-5 text-indigo-400 mb-0.5" />
                <span className="text-[10px] font-black text-white italic">PROPOSAL</span>
                <div className="w-8 h-0.5 bg-indigo-600 rounded-full mt-1" />
             </div>
          </div>

          {/* Provider Side */}
          <div className="flex flex-col items-center gap-3">
            <div className={`w-20 h-20 rounded-[2rem] p-1 border-2 transition-all duration-500 ${bargain.providerAccepted ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
              <div className="w-full h-full rounded-[1.75rem] overflow-hidden bg-slate-200">
                {provider.photos?.[0] ? (
                  <img src={provider.photos[0]} alt={provider.businessName} className="w-full h-full object-cover" />
                ) : (
                  <img src={`https://picsum.photos/seed/${provider.userId}/200/200`} alt={provider.businessName} className="w-full h-full object-cover" />
                )}
              </div>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-900 truncate max-w-[90px]">{provider.businessName}</p>
              <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest mt-1 flex items-center gap-1 mx-auto w-fit ${bargain.providerAccepted ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-200 text-slate-500'}`}>
                {bargain.providerAccepted && <ShieldCheck className="w-2 h-2" />} Provider Ready
              </div>
            </div>
          </div>
        </div>

        {/* Completed Service Testimony Box */}
        {bargain.status === 'completed' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-500/20 text-white space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-amber-400" />
                <span className="text-xs font-black uppercase tracking-widest text-amber-300">Certified Historical Testimony of Proficiency & Trust</span>
              </div>
              <div className="flex items-center gap-1 bg-amber-500/20 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase">
                {bargain.clientTestimony?.rating || 5} Stars Verified
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-bold text-slate-200 leading-relaxed italic">
                "{bargain.clientTestimony?.text || 'Professional execution matching top-tier industry standards. Vetted reliable and trustworthy.'}"
              </p>
              
              <div className="flex flex-wrap gap-1.5">
                {(bargain.clientTestimony?.checks || ['High-Skill Execution', 'Absolute Transparency']).map((check: string, idx: number) => (
                  <span key={idx} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest">
                    🔒 {check}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Mutual Safe Guard Indicator */}
        {bargain.status !== 'completed' && (
          <div className="mt-6 p-4 rounded-3xl bg-indigo-950 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300">Anti-Intrusion Safety Guard Active</span>
              </div>
              <div className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-full text-[8px] font-black uppercase tracking-widest">
                Double Secured
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[8px] font-black uppercase tracking-wider text-indigo-400">Your Mutual Lock-Code</p>
                <div className="px-4 py-2 bg-slate-900 border border-white/5 rounded-xl text-center text-lg font-black tracking-widest text-white italic">
                  {bargain.verificationCode || 'GENERATING...'}
                </div>
                <p className="text-[8px] text-slate-400 font-medium">When you meet at the physical location, read out this exact code to each other to confirm identity verification.</p>
              </div>

              <div className="space-y-1">
                {bargain.handshakeVerified ? (
                  <div className="h-full p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col items-center justify-center text-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 animate-bounce mb-1" />
                    <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400 leading-none">Authentication Complete</p>
                    <p className="text-[8px] text-slate-300 mt-1 font-medium leading-tight">Handshake verification locked & certified. Mutual intrusion bypass neutralized!</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-wider text-indigo-400">Lock Handshake Verify</p>
                    <div className="flex gap-1.5">
                      <input 
                        type="text"
                        className="flex-1 px-3 py-1.5 bg-slate-900 border border-white/5 rounded-xl uppercase tracking-widest font-bold text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                        placeholder="ENTER PARTNER CODE"
                        value={typedCode}
                        onChange={e => setTypedCode(e.target.value)}
                      />
                      <button
                        onClick={handleVerifyHandshake}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                      >
                        Lock
                      </button>
                    </div>
                    {verificationFeedback === 'INVALID' && (
                      <p className="text-[8px] font-black uppercase text-rose-400 tracking-tighter">⚠️ Code did not match! Intruder risk prevented.</p>
                    )}
                    {verificationFeedback === 'SUCCESS' && (
                      <p className="text-[8px] font-black uppercase text-emerald-400 tracking-tighter">🔒 Verification success! Intruder threat eliminated.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Central Summary Bar */}
        <div className="mt-6 flex items-center justify-between bg-indigo-900 rounded-3xl p-5 shadow-inner">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shrink-0">
                 <Gavel className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="min-w-0">
                 <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-0.5 italic">Current Strategic Valuation</p>
                 <div className="flex items-baseline gap-1.5 flex-wrap">
                   <h4 className="text-xl font-black text-white italic tracking-tighter">₦{bargain.currentOffer.toLocaleString()}</h4>
                   {bargain.currentOffer < bargain.initialPrice && (
                     <span className="text-[8px] font-black text-emerald-400 uppercase flex items-center gap-0.5">
                       <TrendingDown className="w-2.5 h-2.5" /> Save ₦{(bargain.initialPrice - bargain.currentOffer).toLocaleString()}
                     </span>
                   )}
                 </div>
              </div>
           </div>

           {bargain.status === 'completed' ? (
             <div className="px-5 py-2.5 bg-amber-500 text-slate-950 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl flex items-center gap-1.5 shrink-0 animate-bounce">
               <Award className="w-5 h-5 text-slate-950" /> Completed & Certified
             </div>
           ) : bothAccepted ? (
             <div className="flex flex-col sm:flex-row gap-2 shrink-0 items-center">
               {isClient && (
                 <button
                   onClick={() => {
                     setTestimonyText('');
                     setShowTestimonyForm(true);
                   }}
                   className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 hover:scale-105 active:scale-95 text-slate-950 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl flex items-center gap-1.5 transition-all text-center"
                 >
                   <CheckCircle2 className="w-4 h-4" /> Service Complete
                 </button>
               )}
               {isProvider && (
                 <div className="px-4 py-2.5 bg-indigo-950 border border-indigo-700 text-indigo-400 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5">
                   <Clock className="w-3.5 h-3.5 animate-pulse" /> Awaiting Client Testimony
                 </div>
               )}
               <motion.div 
                 animate={{ scale: [1, 1.03, 1] }}
                 transition={{ repeat: Infinity, duration: 2 }}
                 className="px-5 py-2.5 bg-emerald-500/10 border border-emerald-500 text-emerald-400 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-1.5"
               >
                 <CheckCircle2 className="w-4 h-4" /> Solidified Agreement
               </motion.div>
             </div>
           ) : (
             <button 
               onClick={handleAccept}
               disabled={ (isClient && bargain.clientAccepted) || (isProvider && bargain.providerAccepted) }
               className={`px-5 py-2.5 ${((isClient && bargain.clientAccepted) || (isProvider && bargain.providerAccepted)) ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-900 hover:bg-slate-50'} rounded-xl font-black text-[9px] uppercase tracking-widest shadow-md transition-all disabled:opacity-50 flex items-center gap-2 shrink-0`}
             >
               {((isClient && bargain.clientAccepted) || (isProvider && bargain.providerAccepted)) ? (
                 <>Awaiting partner <Clock className="w-3.5 h-3.5 animate-spin" /></>
               ) : (
                 <>Authorize <ShieldCheck className="w-3.5 h-3.5" /></>
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
      {/* Testimonial Form Overlay */}
      <AnimatePresence>
        {showTestimonyForm && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 120 }}
            className="absolute inset-0 z-50 bg-slate-950/98 backdrop-blur-md p-8 overflow-y-auto"
          >
            <div className="max-w-2xl mx-auto space-y-6 pt-10">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-indigo-400 animate-spin" />
                  <h3 className="text-xl font-black text-white uppercase tracking-wider">Execute Digital Certificate of Proficiency</h3>
                </div>
                <button 
                  onClick={() => setShowTestimonyForm(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-full bg-white/5 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 bg-indigo-950/40 border border-indigo-500/10 rounded-3xl space-y-6 text-left">
                <div className="flex items-center gap-4">
                  <img 
                    src={provider.photos?.[0] || `https://picsum.photos/seed/${provider.userId}/150/150`} 
                    alt={provider.businessName} 
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500"
                  />
                  <div>
                    <h4 className="text-white font-black text-lg">{provider.businessName}</h4>
                    <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest">{request.subcategory || 'Technical Squad'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Historical Testimony Star Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-110 active:scale-95 transition-all text-amber-400"
                      >
                        <Star className={`w-8 h-8 ${rating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Verify Trust & Reliability Matrix</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      'High-Skill Execution',
                      'Double-Secured Validation',
                      'Absolute Transparency',
                      'Punctual Delivery',
                      'Intrusion-Safe Verification',
                      'Exemplary Coordination'
                    ].map((check) => (
                      <button
                        key={check}
                        onClick={() => {
                          if (proficiencyChecks.includes(check)) {
                            setProficiencyChecks(proficiencyChecks.filter(c => c !== check));
                          } else {
                            setProficiencyChecks([...proficiencyChecks, check]);
                          }
                        }}
                        className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                          proficiencyChecks.includes(check) 
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' 
                            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                          proficiencyChecks.includes(check) ? 'border-white bg-white text-indigo-600' : 'border-slate-500'
                        }`}>
                          {proficiencyChecks.includes(check) && <CheckCircle2 className="w-3 h-3 text-indigo-600" />}
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider">{check}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Global Written Testimony</label>
                  <textarea
                    rows={3}
                    value={testimonyText}
                    onChange={(e) => setTestimonyText(e.target.value)}
                    placeholder="Describe your premium experience, reliability feedback, and skill rating to attract more customers globally..."
                    className="w-full px-5 py-4 bg-slate-900 border border-white/10 rounded-2xl text-white text-sm outline-none focus:border-indigo-500 transition-all font-bold"
                  />
                </div>

                <button
                  onClick={handleSubmitTestimony}
                  disabled={submittingTestimony}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-black uppercase tracking-[0.2em] text-xs rounded-2xl transition-all shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-2"
                >
                  {submittingTestimony ? 'Deploying Testimony Service...' : 'Mark Completed & Deploy Testimony 🚀'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
