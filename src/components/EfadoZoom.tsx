import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  Users, 
  MessageSquare, 
  Hand, 
  Share2, 
  MoreHorizontal, 
  X, 
  Volume2, 
  Maximize2, 
  Shield, 
  Zap, 
  Globe, 
  Settings,
  Youtube,
  Send,
  Play,
  Square,
  ChevronUp,
  Award,
  UserCircle,
  Plus,
  Coins,
  Heart,
  HelpCircle,
  ChevronLeft,
  CheckCircle2,
  Lock,
  Unlock,
  Tv
} from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  avatar: string;
  isHost?: boolean;
  isSpeaker?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
  handRaised?: boolean;
}

interface EfadoZoomProps {
  sessionName: string;
  category: string;
  hostName: string;
  onClose: () => void;
  mode?: 'STAGE' | 'GRID';
  youtubeLink?: string;
}

export const EfadoZoom: React.FC<EfadoZoomProps> = ({ 
  sessionName, 
  category, 
  hostName, 
  onClose, 
  mode = 'STAGE',
  youtubeLink 
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'CHAT' | 'PATRONS' | 'QA' | 'CONTRIBUTE'>('CHAT');
  const [onlineCount, setOnlineCount] = useState(124);
  const [handRaised, setHandRaised] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    { id: 'welcome', sender: 'System Node', text: 'Welcome to the Live briefing stream. Send support contributions under the support tab to motivate the faculty!', time: '10:00 AM', isSystem: true }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<string>('host');
  const [networkLatency, setNetworkLatency] = useState(24);
  
  // Custom states for newly requested Zoom Features
  const [isBroadcasting, setIsBroadcasting] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);
  const [customAmount, setCustomAmount] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [giftBanner, setGiftBanner] = useState<{ sender: string; amount: number; message?: string } | null>(null);
  const [qaInput, setQaInput] = useState('');
  const [qaList, setQaList] = useState<any[]>([
    { id: 'q1', question: "Will we get separate calculators during Mathematics CBT or use standard onscreen ones?", askedBy: "Engr. Mike", upvotes: 15, isAnswered: true, answer: "An onscreen scientific calculator will be provided within the portal frame. Prioritize speed shortcuts!" },
    { id: 'q2', question: "How long should we spend on comprehension passages before back-solving?", askedBy: "Sister Grace", upvotes: 8, isAnswered: false }
  ]);

  const lectureSlides = [
    { title: "Mathematical Speed Tactics", concept: "Normalize fractions to decimals to cancel coefficients instantly.", formula: "v = d / t (Normalised)" },
    { title: "Sciences Dissection Key", concept: "Never calculate final answers until converting to SI Base units.", formula: "1 kW = 1000 W" },
    { title: "English Comprehension Secrets", concept: "Read the terminal question options BEFORE reading the actual text density.", formula: "Eliminate 2 obvious outliers" },
    { title: "Direct Physics Shortcut", concept: "Convert km/h to m/s instantly by dividing the field by 3.6.", formula: "Speed / 3.6" }
  ];

  // Rotate lecture slides automatically every 15 seconds to simulate high fidelity teaching
  useEffect(() => {
    if (isBroadcasting && !isScreenSharing) {
      const slideInt = setInterval(() => {
        setSlideIndex(prev => (prev + 1) % lectureSlides.length);
      }, 15000);
      return () => clearInterval(slideInt);
    }
  }, [isBroadcasting, isScreenSharing]);
  
  // Mock participants
  const [participants] = useState<Participant[]>([
    { id: 'host', name: hostName, avatar: `https://picsum.photos/seed/${hostName}/200/200`, isHost: true, isSpeaker: true },
    { id: '2', name: 'Dr. Sarah Amadi', avatar: 'https://picsum.photos/seed/sarah/200/200', isSpeaker: true },
    { id: '3', name: 'Engr. Mike', avatar: 'https://picsum.photos/seed/mike/200/200' },
    { id: '4', name: 'Sister Grace', avatar: 'https://picsum.photos/seed/grace/200/200' },
    { id: '5', name: 'Brother John', avatar: 'https://picsum.photos/seed/john/200/200' },
  ]);

  useEffect(() => {
    // Simulate real-time online count and network fluctuations
    const interval = setInterval(() => {
      setOnlineCount(prev => prev + Math.floor(Math.random() * 5) - 2);
      setNetworkLatency(prev => Math.max(12, Math.min(120, prev + Math.floor(Math.random() * 10) - 5)));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = (text?: string) => {
    const msg = text || chatInput;
    if (!msg.trim()) return;
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'You',
      text: msg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true
    }]);
    setChatInput('');
  };

  const toggleVoiceNote = () => {
    if (isVoiceRecording) {
      // Mock finishing voice recording
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'You',
        isVoice: true,
        duration: '0:12',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSelf: true
      }]);
    }
    setIsVoiceRecording(!isVoiceRecording);
  };

  const handleAskQuestion = () => {
    if (!qaInput.trim()) return;
    const newQ = {
      id: Date.now().toString(),
      question: qaInput.trim(),
      askedBy: "You (Candidate)",
      upvotes: 1,
      isAnswered: false
    };
    setQaList(prev => [newQ, ...prev]);
    setQaInput('');

    // Simulate an automated reply after 5 seconds
    setTimeout(() => {
      setQaList(prev => prev.map(q => {
        if (q.id === newQ.id) {
          return {
            ...q,
            isAnswered: true,
            answer: "That is an excellent query. We recommend checking Section 4 formula guides which covers this exact variable structure in depth."
          };
        }
        return q;
      }));
    }, 6000);
  };

  const handleUpvoteQuestion = (qId: string) => {
    setQaList(prev => prev.map(q => {
      if (q.id === qId) {
        return { ...q, upvotes: q.upvotes + 1 };
      }
      return q;
    }));
  };

  const handleAnswerQuestion = (qId: string, answerText: string) => {
    setQaList(prev => prev.map(q => {
      if (q.id === qId) {
        return { ...q, isAnswered: true, answer: answerText };
      }
      return q;
    }));
  };

  const handleSendContribution = (amount: number, optionalMsg?: string) => {
    const giftMsg = optionalMsg || customMessage || "Supporting the elite teaching team!";
    
    // Add beautiful styled alert inside messages
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: "Synergy Protocol",
      text: `🎉 You contributed ₦${amount.toLocaleString()}! Message: "${giftMsg}"`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: true,
      isGift: true,
      giftAmount: amount
    }]);

    // Show golden floating banner overlay
    setGiftBanner({
      sender: "You (Candidate)",
      amount: amount,
      message: giftMsg
    });

    // Reset inputs
    setCustomAmount('');
    setCustomMessage('');

    // Automatically dismiss banner after 5.5 seconds
    setTimeout(() => {
      setGiftBanner(null);
    }, 5500);

    // Simulate random other candidates contributing occasionally to make the system feel alive
    setTimeout(() => {
      const otherNames = ["Sarah", "Engr. Mike", "Brother John", "Chinedu", "Amina"];
      const randomName = otherNames[Math.floor(Math.random() * otherNames.length)];
      const randomAmt = [1000, 2500, 5000][Math.floor(Math.random() * 3)];
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: "Synergy Protocol",
        text: `🎉 ${randomName} contributed ₦${randomAmt.toLocaleString()}!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true,
        isGift: true,
        giftAmount: randomAmt
      }]);

      setGiftBanner({
        sender: randomName,
        amount: randomAmt,
        message: "Amazing presentation, thank you!"
      });

      // Clear after 5.5 seconds
      setTimeout(() => {
        setGiftBanner(null);
      }, 5500);
    }, 12000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2500] bg-[#020408] text-white flex flex-col font-sans overflow-hidden"
    >
      {/* Header Bar */}
      <div className="h-16 px-6 bg-slate-900/40 backdrop-blur-md border-b border-white/5 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#DAA520] rounded-xl flex items-center justify-center text-slate-900 shadow-lg shadow-[#DAA520]/20">
             <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
               <h2 className="text-sm font-black uppercase tracking-widest">{sessionName}</h2>
               <span className="px-2 py-0.5 bg-rose-600 rounded-md text-[8px] font-black uppercase">Live</span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{category} • Hosted by {hostName}</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">{onlineCount} Active Patrons</span>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5">
            <Share2 className="w-5 h-5 text-slate-400" />
          </button>
          <button 
            onClick={onClose}
            className="p-3 bg-rose-600/20 hover:bg-rose-600 rounded-xl transition-all border border-rose-500/20"
          >
            <X className="w-5 h-5 text-rose-500 hover:text-white" />
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-grow flex relative overflow-hidden">
        
        {/* Main Stage Grid */}
        <div className={`flex-grow p-4 md:p-6 transition-all duration-500 ${showSidebar ? 'lg:mr-[350px]' : ''}`}>
          <div className="w-full h-full relative rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-white/5 bg-slate-950 shadow-2xl">
            
            {/* Host Banner Overlay */}
            <div className="absolute top-6 left-6 z-10 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-white/10">
               <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-[#DAA520]">
                  <img src={`https://picsum.photos/seed/${hostName}/100/100`} alt={hostName} className="w-full h-full object-cover" />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-tighter">{hostName}</p>
                  <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                    <Award className="w-3 h-3" /> Strategic Host
                  </p>
               </div>
            </div>

            {/* Video Placeholder (Host) */}
            <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br transition-all duration-700 ${isScreenSharing ? 'from-slate-800 to-slate-900' : 'from-slate-950 to-indigo-950/40'}`}>
               {isScreenSharing ? (
                 <div className="flex flex-col items-center text-center p-12">
                    <div className="w-64 h-40 bg-slate-950 rounded-3xl border border-white/5 shadow-2xl flex items-center justify-center relative mb-8">
                       <Share2 className="w-16 h-16 text-indigo-500 animate-pulse" />
                       <div className="absolute -top-3 -right-3 px-3 py-1 bg-indigo-600 rounded-lg text-[8px] font-black uppercase tracking-widest">Live Sharing</div>
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-widest text-white">System Feed Integrated</h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Propagating tactical screen data to all nodes</p>
                 </div>
               ) : youtubeLink ? (
                 <div className="w-full h-full">
                    <iframe 
                      className="w-full h-full" 
                      src={`https://www.youtube.com/embed/${youtubeLink.split('v=')[1] || youtubeLink.split('/').pop()}?autoplay=1&mute=0`}
                      title="YouTube Live" 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    ></iframe>
                 </div>
               ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center p-4">
                    {!isBroadcasting ? (
                      <div className="relative text-center p-6 bg-slate-950/80 backdrop-blur-md rounded-3xl border border-white/5 max-w-sm">
                         <Tv className="w-12 h-12 text-[#DAA520] mx-auto mb-3 animate-pulse" />
                         <h3 className="text-xs font-black uppercase tracking-wider text-rose-500">Broadcasting Off</h3>
                         <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-2 leading-relaxed">
                           Tactical screen synchronization terminated. Waiting for the Host to initiate the transmission stream.
                         </p>
                         <button 
                           onClick={() => setIsBroadcasting(true)}
                           className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all"
                         >
                           Resume Broadcast
                         </button>
                      </div>
                    ) : (
                      <div className="w-full max-w-xl bg-slate-950/80 rounded-[2rem] border-2 border-indigo-500/10 p-8 relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[280px]">
                         <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
                         
                         <div className="flex items-center justify-between mb-4">
                            <span className="text-[7.5px] font-black tracking-widest uppercase bg-indigo-600/15 text-indigo-400 px-2.5 py-1 rounded-full border border-indigo-500/20 flex items-center gap-1.5 animate-pulse">
                              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping" /> Simulated Slide Deck
                            </span>
                            <span className="text-[7.5px] font-black tracking-widest text-[#DAA520] uppercase border border-[#DAA520]/20 px-2 py-0.5 rounded-md">
                              EFADO ACADEMY PROTOCOL
                            </span>
                         </div>

                         <motion.div 
                           key={slideIndex}
                           initial={{ opacity: 0, x: 15 }}
                           animate={{ opacity: 1, x: 0 }}
                           className="space-y-3 my-auto text-left"
                         >
                            <h4 className="text-lg md:text-xl font-black text-white italic uppercase tracking-tighter">
                              {lectureSlides[slideIndex].title}
                            </h4>
                            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wide leading-relaxed">
                              {lectureSlides[slideIndex].concept}
                            </p>
                            <div className="mt-4 bg-[#DAA520]/10 border border-[#DAA520]/20 p-3 rounded-xl inline-block">
                               <span className="text-[7px] font-black text-[#DAA520] uppercase tracking-widest block mb-1">Interactive Action Key</span>
                               <span className="text-[10px] font-mono font-black text-[#DAA520]">{lectureSlides[slideIndex].formula}</span>
                            </div>
                         </motion.div>

                         <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                           <div className="flex items-center gap-1.5">
                             {lectureSlides.map((_, i) => (
                               <button 
                                 key={i} 
                                 onClick={() => setSlideIndex(i)}
                                 className={`h-1.5 rounded-full transition-all ${slideIndex === i ? 'w-6 bg-[#DAA520]' : 'w-1.5 bg-white/10 hover:bg-white/20'}`}
                               />
                             ))}
                           </div>
                           
                           <button 
                             onClick={() => setIsBroadcasting(false)}
                             className="text-[7.5px] font-black text-rose-400 hover:text-rose-500 uppercase tracking-widest transition-colors"
                           >
                             Pause Broadcast
                           </button>
                         </div>
                      </div>
                    )}
                 </div>
               )}
            </div>

            {/* Stage Audience (Small avatars at bottom) */}
            {mode === 'STAGE' && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 p-4 bg-slate-900/60 backdrop-blur-sm rounded-[2rem] border border-white/5 max-w-[80%] overflow-x-auto scrollbar-hide">
                 {participants.filter(p => !p.isHost).map(p => (
                   <motion.div 
                    key={p.id}
                    whileHover={{ scale: 1.05 }}
                    className="relative shrink-0 group"
                   >
                     <div className={`w-14 h-14 rounded-2xl border-2 ${p.isSpeaker ? 'border-indigo-500' : 'border-white/10'} overflow-hidden bg-slate-800`}>
                        <img src={p.avatar} alt={p.name} className="w-full h-full object-cover opacity-80" />
                        {p.isSpeaker && (
                          <div className="absolute top-1 right-1">
                             <Volume2 className="w-3 h-3 text-indigo-400" />
                          </div>
                        )}
                     </div>
                     <p className="mt-2 text-[8px] font-black text-center text-slate-300 uppercase tracking-widest truncate w-14 group-hover:text-white">{p.name.split(' ')[0]}</p>
                   </motion.div>
                 ))}
                 <div className="shrink-0 w-14 h-14 flex items-center justify-center bg-white/5 border border-dashed border-white/10 rounded-2xl">
                    <Plus className="w-4 h-4 text-slate-500" />
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar (Chat/Participants) */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute right-0 top-0 bottom-0 w-full lg:w-[350px] flex-shrink-0 bg-slate-900/95 lg:bg-slate-900/80 backdrop-blur-xl border-l border-white/5 z-50 flex flex-col"
            >
              {/* Four Elegant Tabs */}
              <div className="h-20 flex items-center justify-between border-b border-white/5 px-2 bg-slate-950/40">
                 <button 
                  onClick={() => setSidebarTab('CHAT')}
                  className={`flex-1 py-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${sidebarTab === 'CHAT' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' : 'text-slate-500 hover:text-white'}`}
                 >
                   <MessageSquare className="w-3.5 h-3.5" />
                   <span className="text-[7.5px] font-black uppercase tracking-wider">Chat</span>
                 </button>
                 <button 
                  onClick={() => setSidebarTab('PATRONS')}
                  className={`flex-1 py-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${sidebarTab === 'PATRONS' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' : 'text-slate-500 hover:text-white'}`}
                 >
                   <Users className="w-3.5 h-3.5" />
                   <span className="text-[7.5px] font-black uppercase tracking-wider">Patrons</span>
                 </button>
                 <button 
                  onClick={() => setSidebarTab('QA')}
                  className={`flex-1 py-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${sidebarTab === 'QA' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' : 'text-slate-500 hover:text-white'}`}
                 >
                   <HelpCircle className="w-3.5 h-3.5" />
                   <span className="text-[7.5px] font-black uppercase tracking-wider">Q&A</span>
                 </button>
                 <button 
                  onClick={() => setSidebarTab('CONTRIBUTE')}
                  className={`flex-1 py-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${sidebarTab === 'CONTRIBUTE' ? 'bg-[#DAA520]/25 text-[#DAA520] border border-[#DAA520]/35' : 'text-slate-500 hover:text-white'}`}
                 >
                   <Coins className="w-3.5 h-3.5" />
                   <span className="text-[7.5px] font-black uppercase tracking-wider">Support</span>
                 </button>
              </div>

              {/* Chat Tab */}
              {sidebarTab === 'CHAT' && (
                <div className="flex-grow flex flex-col p-6 overflow-hidden">
                   <div className="flex-grow overflow-y-auto space-y-6 scrollbar-hide pb-4">
                      {messages.map(msg => (
                        <div key={msg.id} className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'}`}>
                           <div className={`max-w-[85%] p-4 rounded-[1.5rem] border ${msg.isSelf ? 'bg-indigo-600 border-indigo-500 rounded-tr-none' : msg.isGift ? 'bg-[#DAA520]/10 border-[#DAA520]/20 rounded-tl-none' : 'bg-white/5 border-white/5 rounded-tl-none'}`}>
                              {msg.isVoice ? (
                                <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                                      <Play className="w-4 h-4 fill-white" />
                                   </div>
                                   <div className="space-y-1">
                                      <div className="flex gap-0.5 h-4 items-center">
                                         {[...Array(12)].map((_, i) => (
                                           <div key={i} className="w-1 bg-white/30 rounded-full" style={{ height: `${30 + Math.random() * 70}%` }} />
                                         ))}
                                      </div>
                                      <p className="text-[8px] font-bold text-white/60">Voice Note • {msg.duration}</p>
                                   </div>
                                </div>
                              ) : (
                                <p className={`text-xs font-medium leading-relaxed ${msg.isGift ? 'text-[#DAA520]' : 'text-white'}`}>{msg.text}</p>
                              )}
                           </div>
                           <p className="mt-2 text-[8px] font-black text-slate-500 uppercase tracking-widest">{msg.sender} • {msg.time}</p>
                        </div>
                      ))}
                      {messages.length === 0 && (
                        <div className="text-center py-20">
                           <Shield className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                           <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">End-to-End Encrypted Session</p>
                        </div>
                      )}
                   </div>
                   
                   {/* Chat Input */}
                   <div className="relative mt-4">
                      <div className="p-4 bg-white/5 rounded-[2rem] border border-white/10 flex items-center gap-3">
                         <input 
                           type="text" 
                           value={chatInput}
                           onChange={(e) => setChatInput(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                           placeholder="Signal your discourse..." 
                           className="flex-grow bg-transparent border-none focus:ring-0 text-xs font-bold placeholder:text-slate-600 text-white"
                         />
                         <div className="flex items-center gap-2">
                           <button 
                            onMouseDown={() => setIsVoiceRecording(true)}
                            onMouseUp={() => toggleVoiceNote()}
                            className={`p-3 rounded-full transition-all ${isVoiceRecording ? 'bg-rose-500 scale-125' : 'bg-white/10 hover:bg-indigo-600'}`}
                           >
                             <Mic className="w-4 h-4" />
                           </button>
                           <button 
                            onClick={() => handleSendMessage()}
                            className="p-3 bg-indigo-600 rounded-full hover:scale-110 active:scale-90 transition-all shadow-lg shadow-indigo-500/20"
                           >
                             <Send className="w-4 h-4" />
                           </button>
                         </div>
                      </div>
                      {isVoiceRecording && (
                        <div className="absolute -top-12 left-0 right-0 py-2 bg-rose-500 text-white rounded-xl text-center animate-pulse">
                           <p className="text-[10px] font-black uppercase tracking-widest">Recording Tactical Audio...</p>
                        </div>
                      )}
                   </div>
                </div>
              )}

              {/* Patrons list tab */}
              {sidebarTab === 'PATRONS' && (
                <div className="flex-grow p-6 overflow-y-auto space-y-4">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Active Presence Intelligence</p>
                   {participants.map(p => (
                     <div key={p.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-xl overflow-hidden">
                              <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                           </div>
                           <div>
                              <p className="text-xs font-black uppercase tracking-tight">{p.name}</p>
                              <div className="flex gap-2">
                                 {p.isHost && <span className="text-[7px] font-black text-[#DAA520] uppercase border border-[#DAA520]/30 px-1 rounded">Host</span>}
                                 {p.isSpeaker && <span className="text-[7px] font-black text-indigo-400 uppercase border border-indigo-400/30 px-1 rounded">Speaker</span>}
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           {p.isMuted ? <MicOff className="w-4 h-4 text-rose-500" /> : <Mic className="w-4 h-4 text-emerald-500" />}
                           <MoreHorizontal className="w-4 h-4 text-slate-600 cursor-pointer" />
                        </div>
                     </div>
                   ))}
                </div>
              )}

              {/* Interactive Q&A Board Tab */}
              {sidebarTab === 'QA' && (
                <div className="flex-grow flex flex-col p-6 overflow-hidden">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Candidate Q&A Registry</p>
                   
                   {/* Create QA Question */}
                   <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                      <textarea
                        value={qaInput}
                        onChange={(e) => setQaInput(e.target.value)}
                        placeholder="Register your strategic or technical question..."
                        rows={2}
                        className="w-full bg-slate-950/60 border border-white/5 rounded-xl p-3 text-xs font-medium text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                      />
                      <button
                        onClick={handleAskQuestion}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                      >
                        Submit Query
                      </button>
                   </div>

                   {/* Registry list */}
                   <div className="flex-grow overflow-y-auto space-y-4 pr-1 scrollbar-hide">
                      {qaList.map(q => (
                        <div key={q.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3 relative group text-left">
                           <div className="flex justify-between items-start gap-3">
                              <p className="text-xs font-bold leading-relaxed pr-8">{q.question}</p>
                              <button 
                                onClick={() => handleUpvoteQuestion(q.id)}
                                className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-400 rounded-lg text-[9px] font-black tracking-widest uppercase transition-all"
                              >
                                 ▲ {q.upvotes}
                              </button>
                           </div>
                           
                           <div className="flex items-center justify-between text-[7.5px] font-black uppercase tracking-widest text-slate-500">
                              <span>By {q.askedBy}</span>
                              <span className="flex items-center gap-1">
                                {q.isAnswered ? (
                                  <span className="text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                     <CheckCircle2 className="w-2.5 h-2.5" /> Answered
                                  </span>
                                ) : (
                                  <span className="text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                     Pending Sync
                                  </span>
                                )}
                              </span>
                           </div>

                           {/* Answer Block */}
                           {q.isAnswered && q.answer && (
                             <div className="p-3 bg-indigo-950/40 border-l border-indigo-500 rounded-r-xl text-left">
                                <span className="text-[7.5px] font-black uppercase text-indigo-400 tracking-widest block mb-1">Faculty Intelligence</span>
                                <p className="text-[10px] font-semibold text-slate-300 leading-relaxed">{q.answer}</p>
                             </div>
                           )}
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {/* Support Contribution / Preset Tab */}
              {sidebarTab === 'CONTRIBUTE' && (
                <div className="flex-grow p-6 overflow-y-auto space-y-5 scrollbar-hide text-left">
                   <div className="text-center p-4 bg-gradient-to-br from-indigo-950/40 to-slate-950/80 rounded-2xl border border-white/5">
                      <Coins className="w-10 h-10 text-[#DAA520] mx-auto mb-2 animate-bounce" />
                      <h4 className="text-xs font-black uppercase tracking-widest text-[#DAA520]">Faculty Support Node</h4>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1 leading-relaxed">
                        Send token inputs to appreciate faculty efforts and support stream hosting architecture.
                      </p>
                   </div>

                   {/* Pre-sets */}
                   <div className="space-y-2.5">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Support Presets</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[1000, 2500, 5000, 10000].map((amt) => (
                          <button
                            key={amt}
                            onClick={() => handleSendContribution(amt)}
                            className="p-3 bg-white/5 hover:bg-[#DAA520]/15 hover:border-[#DAA520]/30 rounded-xl border border-white/5 transition-all text-left flex flex-col justify-between"
                          >
                            <span className="text-[9px] font-sans text-slate-500 uppercase tracking-wider">PRESET</span>
                            <span className="text-xs font-mono font-black text-[#DAA520] mt-0.5">₦{amt.toLocaleString()}</span>
                          </button>
                        ))}
                      </div>
                   </div>

                   {/* Custom amount */}
                   <div className="space-y-2">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Custom Authorisation Input</p>
                      <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl flex items-center gap-2">
                         <span className="text-xs font-black text-slate-500">₦</span>
                         <input
                           type="number"
                           value={customAmount}
                           onChange={(e) => setCustomAmount(e.target.value)}
                           placeholder="Enter custom token value..."
                           className="flex-grow bg-transparent border-none focus:ring-0 p-0 text-xs font-mono font-bold text-white placeholder:text-slate-700"
                         />
                      </div>
                   </div>

                   {/* Custom Note */}
                   <div className="space-y-2">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Optional Message</p>
                      <textarea
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder="Type standard appreciation logs..."
                        rows={2}
                        className="w-full bg-slate-950/60 border border-white/5 rounded-xl p-3 text-xs font-medium text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                      />
                   </div>

                   <button
                     onClick={() => {
                       const parsed = parseInt(customAmount);
                       if (parsed > 0) {
                         handleSendContribution(parsed);
                       }
                     }}
                     className="w-full py-3 bg-[#DAA520] hover:bg-yellow-500 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#DAA520]/15"
                   >
                     Authorize Gratuity Settlement
                   </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Controls Overlay */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-4 bg-slate-900/60 backdrop-blur-xl p-2 md:p-4 rounded-[2rem] md:rounded-[2.5rem] border border-white/10 z-30 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] max-w-[95vw] overflow-x-auto no-scrollbar">
           <div className="flex items-center gap-2 border-r border-white/10 pr-2 md:pr-4">
             <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-rose-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
             >
                {isMuted ? <MicOff className="w-5 h-5 md:w-6 md:h-6" /> : <Mic className="w-5 h-5 md:w-6 md:h-6" />}
             </button>
             <button 
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all ${isVideoOff ? 'bg-rose-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
             >
                {isVideoOff ? <VideoOff className="w-5 h-5 md:w-6 md:h-6" /> : <Video className="w-5 h-5 md:w-6 md:h-6" />}
             </button>
           </div>
           
           <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsScreenSharing(!isScreenSharing)}
               className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isScreenSharing ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
             >
                <Share2 className="w-6 h-6" />
             </button>
             <button 
               onClick={() => setHandRaised(!handRaised)}
               className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${handRaised ? 'bg-[#DAA520] text-slate-900 shadow-lg shadow-[#DAA520]/20' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
             >
                <Hand className="w-6 h-6" />
             </button>
             <button 
               onClick={() => {
                 if (showSidebar && sidebarTab === 'CHAT') {
                   setShowSidebar(false);
                 } else {
                   setShowSidebar(true);
                   setSidebarTab('CHAT');
                 }
               }}
               className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${showSidebar && sidebarTab === 'CHAT' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
             >
                <MessageSquare className="w-6 h-6" />
             </button>
             <button 
               onClick={() => {
                 if (showSidebar && sidebarTab === 'PATRONS') {
                   setShowSidebar(false);
                 } else {
                   setShowSidebar(true);
                   setSidebarTab('PATRONS');
                 }
               }}
               className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${showSidebar && sidebarTab === 'PATRONS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
             >
                <Users className="w-6 h-6" />
             </button>
             <button 
               onClick={() => {
                 if (showSidebar && sidebarTab === 'QA') {
                   setShowSidebar(false);
                 } else {
                   setShowSidebar(true);
                   setSidebarTab('QA');
                 }
               }}
               className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${showSidebar && sidebarTab === 'QA' ? 'bg-[#DAA520] text-slate-950 shadow-lg shadow-[#DAA520]/20' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
             >
                <HelpCircle className="w-6 h-6" />
             </button>
           </div>

           <div className="flex items-center gap-2 border-l border-white/10 pl-4">
             <button 
              onClick={() => setIsRecording(!isRecording)}
              className={`p-3 rounded-xl transition-all flex items-center gap-2 ${isRecording ? 'bg-rose-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
             >
                {isRecording ? <Square className="w-4 h-4" /> : <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse" />}
                <span className="text-[8px] font-black uppercase tracking-widest">{isRecording ? 'REC ACTIVE' : 'RECORD'}</span>
             </button>
             <button className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/10 text-slate-400">
                <Settings className="w-5 h-5" />
             </button>
           </div>
        </div>

      </div>

      {/* Network Intelligence Overlay */}
      <div className="absolute top-20 left-12 flex items-center gap-3 pointer-events-none group">
         <div className="h-1 w-20 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
               animate={{ 
                 width: networkLatency > 100 ? '20%' : networkLatency > 50 ? '60%' : '95%',
                 backgroundColor: networkLatency > 100 ? '#f43f5e' : networkLatency > 50 ? '#f59e0b' : '#10b981'
               }}
               transition={{ duration: 0.5 }}
               className="h-full"
            />
         </div>
         <span className={`text-[7px] font-black uppercase tracking-widest transition-colors ${networkLatency > 100 ? 'text-rose-500' : networkLatency > 50 ? 'text-amber-500' : 'text-slate-600'}`}>
           Synch Latency: {networkLatency}ms • Tactical Speed: Optimal
         </span>
      </div>

    </motion.div>
  );
};
