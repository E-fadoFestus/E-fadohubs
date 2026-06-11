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
  Plus
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
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [onlineCount, setOnlineCount] = useState(124);
  const [handRaised, setHandRaised] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<string>('host');
  const [networkLatency, setNetworkLatency] = useState(24);
  
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
        <div className={`flex-grow p-4 md:p-6 transition-all duration-500 ${(showChat || showParticipants) ? 'lg:mr-[350px]' : ''}`}>
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
            <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br transition-all duration-700 ${isScreenSharing ? 'from-slate-800 to-slate-900' : 'from-slate-900 to-indigo-950'}`}>
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
                 <div className="relative text-center">
                    <div className="w-48 h-48 rounded-full bg-slate-800 flex items-center justify-center shadow-inner relative mx-auto mb-6">
                       <UserCircle className="w-24 h-24 text-slate-700" />
                       <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full animate-ping" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-widest text-[#DAA520]">Video Signal Active</h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Waiting for stream synchronisation...</p>
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
          {(showChat || showParticipants) && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute right-0 top-0 bottom-0 w-full lg:w-[350px] flex-shrink-0 bg-slate-900/95 lg:bg-slate-900/80 backdrop-blur-xl border-l border-white/5 z-50 flex flex-col"
            >
              <div className="h-16 flex items-center justify-around border-b border-white/5 p-2">
                 <button 
                  onClick={() => setShowChat(true)}
                  className={`flex-grow py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${showChat ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}
                 >
                   <MessageSquare className="w-4 h-4" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Chat Intelligence</span>
                 </button>
                 <div className="w-px h-6 bg-white/5 mx-2" />
                 <button 
                  onClick={() => setShowChat(false)}
                  className={`flex-grow py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${!showChat ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}
                 >
                   <Users className="w-4 h-4" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Patrons</span>
                 </button>
              </div>

              {showChat ? (
                <div className="flex-grow flex flex-col p-6 overflow-hidden">
                   <div className="flex-grow overflow-y-auto space-y-6 scrollbar-hide pb-4">
                      {messages.map(msg => (
                        <div key={msg.id} className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'}`}>
                           <div className={`max-w-[85%] p-4 rounded-[1.5rem] border ${msg.isSelf ? 'bg-indigo-600 border-indigo-500 rounded-tr-none' : 'bg-white/5 border-white/5 rounded-tl-none'}`}>
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
                                <p className="text-xs font-medium leading-relaxed">{msg.text}</p>
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
              ) : (
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
                 setShowParticipants(false);
                 setShowChat(!showChat);
               }}
               className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${showChat ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
             >
                <MessageSquare className="w-6 h-6" />
             </button>
             <button 
               onClick={() => {
                 setShowChat(false);
                 setShowParticipants(!showParticipants);
               }}
               className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${showParticipants ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
             >
                <Users className="w-6 h-6" />
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
