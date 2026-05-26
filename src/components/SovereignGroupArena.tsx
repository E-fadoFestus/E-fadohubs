import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  ArrowLeft, 
  Send, 
  Lock, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Sparkles, 
  Info, 
  BarChart3, 
  Share2, 
  FileText, 
  Plus, 
  CheckCircle,
  Clock,
  Briefcase,
  Zap,
  Globe,
  Radio,
  User,
  ExternalLink,
  Bot
} from 'lucide-react';
import { UserProfile } from '../types';

interface GroupMember {
  id: string;
  name: string;
  role: 'HOST' | 'MODERATOR' | 'EXPERT' | 'MEMBER';
  avatar: string;
  online: boolean;
  tagline: string;
}

interface SimulatedMessage {
  id: string;
  senderName: string;
  senderRole: 'HOST' | 'MODERATOR' | 'EXPERT' | 'MEMBER';
  senderAvatar: string;
  content: string;
  timestamp: string;
  isMe?: boolean;
}

interface SovereignGroupArenaProps {
  group: string;
  subCategoryName: string;
  categoryTitle: string;
  user: UserProfile;
  onClose: () => void;
}

export const SovereignGroupArena: React.FC<SovereignGroupArenaProps> = ({
  group,
  subCategoryName,
  categoryTitle,
  user,
  onClose
}) => {
  // Generate metadata based on group name
  const isReligious = group.match(/pastor|minister|overseer|theology|bible|apologetics/i) || categoryTitle.match(/religion/i);
  const isWives = group.match(/wife|bride|mother|career & marriage|fertility/i) || categoryTitle.match(/women/i);
  const isHusbands = group.match(/husband|provident|man cave|dad/i) || categoryTitle.match(/men/i);
  const isSingles = group.match(/dating|courtship|singles|relationship/i) || categoryTitle.match(/singles|dating/i);
  const isSports = group.match(/football|PL|liga|fitness|gym|trainer/i) || categoryTitle.match(/sports/i);
  const isTech = group.match(/tech|cpu|ai|ml|coding|developer|robot/i) || categoryTitle.match(/technology/i);
  const isJobs = group.match(/job|interview|career|resume|vacancy/i) || categoryTitle.match(/jobs|employ/i);
  const isManuf = group.match(/manufactur|industry|factory|material|supply/i) || categoryTitle.match(/manufactur/i);

  // 1. Group Description
  let groupDescription = `Premium specialized council for strategic discussions in ${group}. Collaborate with verified community leaders and participate in global action steps.`;
  if (isReligious) groupDescription = `Interfaith & pastoral sanctuary focusing on the theological foundations of leadership, biblical study, and inter-denominational community support.`;
  if (isWives) groupDescription = `An exclusive, secure refuge for married women sharing holistic natural remedies, marital advice, child nurturing, and managing career-marriage equilibrium.`;
  if (isHusbands) groupDescription = `A strictly confidential platform for husbands and fathers to discussion masculine emotional leadership, provisions, legacy building, and direct peer mentorship.`;
  if (isSingles) groupDescription = `Vetted advisory space addressing marriage preparedness, courting protocols, healthy relationship boundaries, and values alignment.`;
  if (isSports) groupDescription = `High-energy performance network discussing live tactical matches, transfers, training exercises, fitness protocols, and talent exploration.`;
  if (isTech) groupDescription = `High-fidelity sandbox for exchanging insights on neural networks, APIs, decentralized web models, hardware fabrication, and coding standards.`;
  if (isJobs) groupDescription = `Career accelerator portal displaying active local/remote placements, interview mock reviews, CV refinement, and direct HR connections.`;
  if (isManuf) groupDescription = `Industrial knowledge hub reviewing global supply chains, material routing optimization, local fabrication facilities, and circular manufacturing.`;

  // 2. Simulated Members list
  const getSubcategoryMembers = (): GroupMember[] => {
    if (isReligious) return [
      { id: '1', name: 'Bishop Thomas A.', role: 'HOST', avatar: 'https://picsum.photos/seed/bishop/100/100', online: true, tagline: 'Lead Overseer • Grace Cathedral' },
      { id: '2', name: 'Pastor Deborah K.', role: 'EXPERT', avatar: 'https://picsum.photos/seed/deborah/100/100', online: true, tagline: 'Theological Lecturer' },
      { id: '3', name: 'Evang. Jude', role: 'MODERATOR', avatar: 'https://picsum.photos/seed/jude/100/100', online: true, tagline: 'Outreach Manager' },
      { id: '4', name: 'Deaconess Lydia', role: 'MEMBER', avatar: 'https://picsum.photos/seed/lydia/100/100', online: false, tagline: 'Youth Coordinator' }
    ];
    if (isWives) return [
      { id: '1', name: 'Dr. Evelyn Peters (Ph.D)', role: 'HOST', avatar: 'https://picsum.photos/seed/evelyn/100/100', online: true, tagline: 'Marriage Counsellor & Therapist' },
      { id: '2', name: 'Nurse Naomi', role: 'EXPERT', avatar: 'https://picsum.photos/seed/naomi/100/100', online: true, tagline: 'Holistic Wellness Advocate' },
      { id: '3', name: 'Onyinye (Mod)', role: 'MODERATOR', avatar: 'https://picsum.photos/seed/onyi/100/100', online: true, tagline: 'Career Advisor & Wife' },
      { id: '4', name: 'Chisom', role: 'MEMBER', avatar: 'https://picsum.photos/seed/chisom/100/100', online: true, tagline: 'New Bride' }
    ];
    if (isHusbands) return [
      { id: '1', name: 'Elder Christopher', role: 'HOST', avatar: 'https://picsum.photos/seed/chris/100/100', online: true, tagline: 'Provident Families Lead' },
      { id: '2', name: 'Engr. Kolawole', role: 'EXPERT', avatar: 'https://picsum.photos/seed/kola/100/100', online: true, tagline: 'Fatherhood Mentor' },
      { id: '3', name: 'Chuks V.', role: 'MODERATOR', avatar: 'https://picsum.photos/seed/chuks/100/100', online: true, tagline: 'Business Leader & Husband' },
      { id: '4', name: 'Tunde S.', role: 'MEMBER', avatar: 'https://picsum.photos/seed/tunde/100/100', online: false, tagline: 'Husband of 3 years' }
    ];
    if (isTech) return [
      { id: '1', name: 'Tech Architect Dele', role: 'HOST', avatar: 'https://picsum.photos/seed/dele/100/100', online: true, tagline: 'Sovereign Systems Architect' },
      { id: '2', name: 'Dr. Sarah (Lead Eng)', role: 'EXPERT', avatar: 'https://picsum.photos/seed/sarah/100/100', online: true, tagline: 'Machine Learning Deep Mind' },
      { id: '3', name: 'Damilola Codes', role: 'MODERATOR', avatar: 'https://picsum.photos/seed/dami/100/100', online: true, tagline: 'Senior Rust Developer' }
    ];
    return [
      { id: '1', name: 'Host Agent Strategic', role: 'HOST', avatar: 'https://picsum.photos/seed/strategic/100/100', online: true, tagline: 'Senior Community Lead' },
      { id: '2', name: 'Ambassador Daniel', role: 'EXPERT', avatar: 'https://picsum.photos/seed/daniel/100/100', online: true, tagline: 'Field Advisory Expert' },
      { id: '3', name: 'Sister Miriam (Mod)', role: 'MODERATOR', avatar: 'https://picsum.photos/seed/miriam/100/100', online: true, tagline: 'Local Moderator' }
    ];
  };

  const members = getSubcategoryMembers();

  // 3. Initial Chat Messages
  const getInitialMessages = (): SimulatedMessage[] => {
    if (isReligious) return [
      { id: 'm1', senderName: 'Bishop Thomas A.', senderRole: 'HOST', senderAvatar: 'https://picsum.photos/seed/bishop/100/100', content: 'Welcome beloved brethren! Let us maintain absolute theological depth. What are your perspectives on equipping youth ministers for the next decade?', timestamp: '09:12 AM' },
      { id: 'm2', senderName: 'Pastor Deborah K.', senderRole: 'EXPERT', senderAvatar: 'https://picsum.photos/seed/deborah/100/100', content: 'Indeed bishop! Modern methodologies must match historical foundations. I believe systematic theology training is crucial.', timestamp: '09:15 AM' }
    ];
    if (isWives) return [
      { id: 'm1', senderName: 'Dr. Evelyn Peters (Ph.D)', senderRole: 'HOST', senderAvatar: 'https://picsum.photos/seed/evelyn/100/100', content: 'Good morning ladies! Our topic today focuses on managing emotional burnout while supporting your husband’s career. Remember, your holistic wellbeing is a priority.', timestamp: '09:05 AM' },
      { id: 'm2', senderName: 'Nurse Naomi', senderRole: 'EXPERT', senderAvatar: 'https://picsum.photos/seed/naomi/100/100', content: 'Agreed! I’m sharing our natural hibiscus infusion guide today in the bulletin section—superb for blood flow and tension.', timestamp: '09:08 AM' }
    ];
    if (isHusbands) return [
      { id: 'm1', senderName: 'Elder Christopher', senderRole: 'HOST', senderAvatar: 'https://picsum.photos/seed/chris/100/100', content: 'Greetings men! True authority of a husband comes through consistent, quiet emotional leadership. Let’s avoid reactivity when conflicts arise.', timestamp: '09:01 AM' },
      { id: 'm2', senderName: 'Engr. Kolawole', senderRole: 'EXPERT', senderAvatar: 'https://picsum.photos/seed/kola/100/100', content: 'Absolutely elder. Leading by serving is the sovereign husband protocol.', timestamp: '09:04 AM' }
    ];
    if (isTech) return [
      { id: 'm1', senderName: 'Tech Architect Dele', senderRole: 'HOST', senderAvatar: 'https://picsum.photos/seed/dele/100/100', content: 'Let’s look at optimizing network throughput for full-stack state replication. HMR is disabled, but sovereign local databases are scaling nicely.', timestamp: '09:00 AM' },
      { id: 'm2', senderName: 'Dr. Sarah (Lead Eng)', senderRole: 'EXPERT', senderAvatar: 'https://picsum.photos/seed/sarah/100/100', content: 'The AI vectors pipeline is fully optimized inside the Cloud environment. We can safely ingest localized context.', timestamp: '09:03 AM' }
    ];
    return [
      { id: 'm1', senderName: 'Host Agent Strategic', senderRole: 'HOST', senderAvatar: 'https://picsum.photos/seed/strategic/100/100', content: `Welcome elements to the authoritative space for ${group}! Let's deploy pristine communication concepts.`, timestamp: '09:00 AM' },
      { id: 'm2', senderName: 'Ambassador Daniel', senderRole: 'EXPERT', senderAvatar: 'https://picsum.photos/seed/daniel/100/100', content: 'Exciting times ahead! We have updated the tactical roadmap in the files.', timestamp: '09:02 AM' }
    ];
  };

  // 4. Smart responses logic when user sends text
  const getSmartResponses = (text: string): string[] => {
    if (isReligious) return [
      "Amen to that! Absolutely scriptural. Let us hold onto this deep foundation as we scale ministries.",
      "A profound analysis! That aligns exactly with historical apologetics frameworks. Thank you for sharing this revelation.",
      "Wonderful insight! Community leadership relies heavily on these principles."
    ];
    if (isWives) return [
      "That is so deeply relatable and true, dear sister! Letting wisdom guide our homes indeed changes everything.",
      "So encouraging! We really need more mothers and wives discussing this openly. May grace hold our families.",
      "I highly agree. Holistic patience always yields amazing outcomes."
    ];
    if (isHusbands) return [
      "Powerful point, brother! Setting the emotional pace and taking maximum ownership is our primary duty.",
      "This is man-talk at its finest. Sound logic, absolutely free from ego. Thank you for sharing.",
      "A provident dad leads by example. Outstanding addition!"
    ];
    if (isTech) return [
      "Superb! Incorporating localized vectors directly with modern schemas will dramatically decrease server lag.",
      "Brilliant optimization logic! It completely satisfies the security benchmarks we've set for the Efado Hub interface.",
      "Compiling this module now. Type checking is passing 100% green."
    ];
    return [
      "Excellent contribution! Let us integrate this standard logic into our live roadmap.",
      "Fascinating perspective! Very happy to observe our sector colleagues engaging with this depth.",
      "Completely verified! The sovereign nodes are receiving this info with low latency."
    ];
  };

  const [chatList, setChatList] = useState<SimulatedMessage[]>(getInitialMessages());
  const [typedMessage, setTypedMessage] = useState('');
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [soundWaves, setSoundWaves] = useState<number[]>([12, 24, 8, 30, 15, 6, 22, 18, 14, 28]);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedOptionIdx, setVotedOptionIdx] = useState<number | null>(null);
  const [handRaised, setHandRaised] = useState(false);

  // Poll configuration based on group's context
  const getPollQuestions = () => {
    if (isReligious) return {
      q: "What is the primary factor limiting theological leadership in our current era?",
      opts: ["Lack of systematic theological training", "Adapting with digital/social platforms", "Inter-denominational division"]
    };
    if (isWives) return {
      q: "Where do modern career wives need the most community-level support?",
      opts: ["Emotional balance & burnout care", "Access to trusted health remedies", "Child education & parenting mentorship"]
    };
    if (isHusbands) return {
      q: "Which pillar of provident masculinity represents the highest difficulty today?",
      opts: ["Emotional guidance under strain", "Sustained financial provision", "Generational mentor/legacy building"]
    };
    return {
      q: "What is the most critical hurdle for development in this field?",
      opts: ["Access to structural funding", "Peer-to-peer knowledge hubs", "Regulatory/safety protocols"]
    };
  };

  const poll = getPollQuestions();
  const [votes, setVotes] = useState<number[]>([145, 92, 68]);

  const handleVote = (idx: number) => {
    if (hasVoted) return;
    const newVotes = [...votes];
    newVotes[idx] += 1;
    setVotes(newVotes);
    setVotedOptionIdx(idx);
    setHasVoted(true);
  };

  const totalVotes = votes.reduce((a, b) => a + b, 0);

  // Bulletins ledger
  const [bulletins, setBulletins] = useState<Array<{ title: string, author: string, size: string }>>([
    { title: "Sovereign Framework Roadmap.pdf", author: "Bishop Thomas", size: "1.4 MB" },
    { title: "Weekly Core Assessment Bulletins.docx", author: "Dr. Sarah", size: "380 KB" }
  ]);
  const [showAddBulletin, setShowAddBulletin] = useState(false);
  const [newBulletinTitle, setNewBulletinTitle] = useState('');

  const addNewBulletin = () => {
    if (!newBulletinTitle) return;
    setBulletins([
      { title: newBulletinTitle + ".pdf", author: user.displayName || user.email.split('@')[0], size: "450 KB" },
      ...bulletins
    ]);
    setNewBulletinTitle('');
    setShowAddBulletin(false);
  };

  // Sound wave pulsing effect for Live broadcast visualizer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLiveActive && !isMuted) {
      interval = setInterval(() => {
        setSoundWaves(old => old.map(() => Math.floor(Math.random() * 30) + 4));
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isLiveActive, isMuted]);

  // Handle send message & simulated reply
  const handleSendMessage = () => {
    if (!typedMessage.trim()) return;

    // 1. Add Me message
    const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const meMsg: SimulatedMessage = {
      id: 'me_' + Math.random().toString(),
      senderName: user.displayName || user.email.split('@')[0],
      senderRole: 'MEMBER',
      senderAvatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
      content: typedMessage,
      timestamp: formattedTime,
      isMe: true
    };

    setChatList(old => [...old, meMsg]);
    const currentText = typedMessage;
    setTypedMessage('');

    // Scroll chat area
    setTimeout(() => {
      const scrollContainer = document.getElementById('chat-scroll-area');
      if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }, 100);

    // 2. Delayed simulated reply (1.5s)
    setTimeout(() => {
      // Pick a random sender from the simulated members excluding Me
      const eligibleSenders = members.filter(m => m.id !== '0');
      const sender = eligibleSenders[Math.floor(Math.random() * eligibleSenders.length)] || members[0];
      const responses = getSmartResponses(currentText);
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      const replyMsg: SimulatedMessage = {
        id: 'reply_' + Math.random().toString(),
        senderName: sender.name,
        senderRole: sender.role,
        senderAvatar: sender.avatar,
        content: randomResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatList(old => [...old, replyMsg]);

      // Scroll after reply
      setTimeout(() => {
        const scrollContainer = document.getElementById('chat-scroll-area');
        if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }, 100);
    }, 1500);
  };

  return (
    <div className="absolute inset-0 bg-slate-950 flex flex-col z-[40] animate-fadeIn">
      {/* Top Navigation Header */}
      <header className="px-6 md:px-10 py-5 bg-slate-900 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="w-10 h-10 md:w-12 md:h-12 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl flex items-center justify-center transition-all border border-white/5 active:scale-95"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-indigo-600/30 border border-indigo-500/20 text-indigo-400 rounded-md text-[8px] font-black uppercase tracking-widest leading-none">Specialized Circle</span>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest hidden sm:inline">Simulation Live</span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-tight mt-0.5">{group}</h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setIsLiveActive(!isLiveActive);
              if (!isLiveActive) {
                setHandRaised(false);
              }
            }}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border shadow-lg ${
              isLiveActive 
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500/50 shadow-indigo-600/20 active:scale-95'
            }`}
          >
            <Radio className={`w-4 h-4 ${isLiveActive ? 'animate-pulse' : ''}`} />
            {isLiveActive ? 'Disconnect Broadcast' : 'Join Live Voice Cast'}
          </button>
        </div>
      </header>

      {/* Main Multi-grid Workspace */}
      <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Side: Broadcast Info + Live Poll + Files Ledger */}
        <div className="w-full lg:w-[420px] bg-slate-900/60 border-r border-white/5 p-6 flex flex-col overflow-y-auto custom-scrollbar space-y-6">
          
          {/* Group Overview Widget */}
          <div className="p-6 bg-slate-900/80 border border-white/10 rounded-[2rem] relative overflow-hidden golden-card-border shadow-xl">
            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-[0.25em] mb-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> Core Directives
            </h4>
            <p className="text-xs text-slate-300 font-semibold leading-relaxed mb-4">{groupDescription}</p>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest border-t border-white/5 pt-3">
              <span>Sector: <span className="text-white">{categoryTitle}</span></span>
            </div>
          </div>

          {/* EFADO Live Voice broadcast simulation */}
          <AnimatePresence>
            {isLiveActive && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6 bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-500/20 rounded-[2rem] shadow-2xl relative overflow-hidden golden-card-border"
              >
                {/* Atmospheric Backlights */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-16 -mt-16" />
                <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-rose-500/15 rounded-full blur-2xl" />

                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-2">
                     <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                     <span className="w-2.5 h-2.5 bg-rose-500 rounded-full absolute" />
                     <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] pl-1.5 font-mono">LIVE Broadcast CAST</span>
                  </div>
                  <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest bg-indigo-500/20 px-2.5 py-1 rounded-full border border-indigo-500/20">
                     1.4K Listening
                  </span>
                </div>

                {/* Host Info */}
                <div className="flex items-center gap-4 mb-6 relative z-10 bg-black/30 p-4 rounded-2xl border border-white/5">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 border border-indigo-400 flex items-center justify-center text-white font-bold relative shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-black text-white uppercase tracking-tight">Vetted Speaker Hosting</h5>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Discourse Council Member</p>
                  </div>
                </div>

                {/* Sound wave Visualizer CSS animation */}
                <div className="flex items-end justify-center gap-1.5 h-12 mb-8 select-none border-b border-white/5 pb-4 relative z-10">
                  {soundWaves.map((val, idx) => (
                    <div 
                      key={idx} 
                      style={{ height: `${isMuted ? 4 : val}px` }}
                      className={`w-1.5 rounded-full transition-all duration-150 ${
                        isMuted ? 'bg-slate-700' : 'bg-gradient-to-t from-indigo-500 via-purple-500 to-rose-400 shadow-md shadow-indigo-500/30'
                      }`}
                    />
                  ))}
                </div>

                {/* Speaker Controls */}
                <div className="grid grid-cols-2 gap-3 relative z-10">
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${
                      isMuted 
                        ? 'bg-slate-800 text-slate-500 border-white/5 hover:bg-slate-750' 
                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                    {isMuted ? 'Unmute Stream' : 'Mute Stream'}
                  </button>

                  <button 
                    onClick={() => setHandRaised(!handRaised)}
                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${
                      handRaised 
                        ? 'bg-rose-600 text-white border-rose-500' 
                        : 'bg-indigo-600/20 border-indigo-500/20 text-indigo-400 hover:bg-indigo-600/30 shadow-md'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                    {handRaised ? 'Position Requested' : 'Ask to Speak'}
                  </button>
                </div>

                {handRaised && (
                  <motion.p 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[9px] font-black text-emerald-400 uppercase tracking-widest text-center mt-3 animate-pulse"
                  >
                     ★ Council Moderator reviewing your request...
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dynamic Interactive Group Poll */}
          <div className="p-6 bg-slate-900/80 border border-white/10 rounded-[2rem] shadow-xl relative overflow-hidden golden-card-border flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-[#DAA520]" />
                <h4 className="text-xs font-black text-white uppercase tracking-widest">Interactive Group Poll</h4>
              </div>
              <p className="text-xs font-black text-slate-200 leading-snug mb-5 text-left uppercase tracking-tight">{poll.q}</p>
              
              <div className="space-y-3">
                {poll.opts.map((opt, idx) => {
                  const voteCount = votes[idx];
                  const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                  const isUserSelection = votedOptionIdx === idx;

                  return (
                    <button 
                      key={idx}
                      disabled={hasVoted}
                      onClick={() => handleVote(idx)}
                      className="w-full text-left relative overflow-hidden bg-white/5 hover:bg-white/10 border border-white/5 p-4 rounded-xl font-bold text-xs uppercase transition-all flex items-center justify-between"
                    >
                      {/* Animating result fill percentage */}
                      {hasVoted && (
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8 }}
                          className={`absolute left-0 top-0 bottom-0 ${
                            isUserSelection ? 'bg-indigo-600/30' : 'bg-white/5'
                          }`}
                        />
                      )}
                      
                      <span className="relative z-10 text-white pr-4 leading-normal">{opt}</span>
                      {hasVoted ? (
                        <span className="relative z-10 font-black text-indigo-400 whitespace-nowrap">{percentage}% ({voteCount})</span>
                      ) : (
                        <div className="w-4 h-4 border border-white/30 rounded-full shrink-0 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-[#DAA520]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {hasVoted && (
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-4 text-center">
                ✦ Thanks for contributing! Total votes: {totalVotes}
              </p>
            )}
          </div>

          {/* Files / Bulletin Ledger */}
          <div className="p-6 bg-slate-900/80 border border-white/10 rounded-[2rem] shadow-xl relative overflow-hidden golden-card-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-black text-white uppercase tracking-widest">Resource Ledger</h4>
              </div>
              <button 
                onClick={() => setShowAddBulletin(!showAddBulletin)}
                className="p-1 px-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Share Files
              </button>
            </div>

            {/* Custom file adder inline */}
            <AnimatePresence>
              {showAddBulletin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-4 border border-white/10 bg-black/40 rounded-xl space-y-3 overflow-hidden"
                >
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Bulletin Name</label>
                  <input 
                    type="text"
                    placeholder="e.g. Health Remedies Info Sheet"
                    value={newBulletinTitle}
                    onChange={(e) => setNewBulletinTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-white text-xs font-bold outline-none"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={addNewBulletin}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest"
                    >
                      Publish
                    </button>
                    <button 
                      onClick={() => setShowAddBulletin(false)}
                      className="px-4 py-2 bg-slate-700 text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-3">
              {bulletins.map((bulletin, bIdx) => (
                <div key={bIdx} className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between hover:bg-white/10 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0">
                      <FileText className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h5 className="text-[11px] font-black text-white uppercase tracking-tight line-clamp-1">{bulletin.title}</h5>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Shared by: {bulletin.author}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500">{bulletin.size}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Center/Right Side: Message Dialogue Stream Area */}
        <div className="flex-grow flex flex-col bg-slate-950 relative overflow-hidden">
          
          {/* Active Members Bar */}
          <div className="px-6 md:px-8 py-3 bg-slate-900 border-b border-white/5 flex items-center justify-between shadow-sm shrink-0">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Circle Members ({members.filter(m => m.online).length} online)</span>
            </div>
            {/* Horizontal Avatars */}
            <div className="flex items-center -space-x-2">
              {members.map((member, mIdx) => (
                <div 
                  key={member.id} 
                  className={`w-7 h-7 rounded-lg border-2 border-slate-900 overflow-hidden relative group cursor-pointer`}
                  title={`${member.name} - ${member.tagline}`}
                >
                  <img src={member.avatar} alt={member.name} referrerPolicy="no-referrer" />
                  {member.online && <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-slate-900" />}
                </div>
              ))}
            </div>
          </div>

          {/* Chat scrolling log area */}
          <div 
            id="chat-scroll-area"
            className="flex-grow p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar"
            style={{ backgroundImage: "radial-gradient(ellipse_at_center, rgba(30, 41, 59, 0.4) 0%, transparent 80%)" }}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="px-5 py-2 bg-[#DAA520]/10 border border-[#DAA520]/20 rounded-xl flex items-center gap-2.5 shadow-sm">
                <Lock className="w-3.5 h-3.5 text-[#DAA520]" />
                <span className="text-[9px] font-black text-[#DAA520] uppercase tracking-widest text-center">Encrypted Sovereign Dialogue Port Stream</span>
              </div>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest font-mono mt-1">PROTOCOL ESTABLISHED 100% SECURE</span>
            </div>

            {/* Rendered Dialogue Messages */}
            <div className="space-y-6">
              {chatList.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex items-start gap-4 max-w-[85%] sm:max-w-[70%] ${
                    msg.isMe ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  {/* Sender Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/5 overflow-hidden shrink-0 mt-0.5">
                    <img src={msg.senderAvatar} alt={msg.senderName} referrerPolicy="no-referrer" />
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    {/* Role Header */}
                    <div className={`flex items-center gap-1.5 ${msg.isMe ? 'justify-end' : ''}`}>
                      <h5 className="text-xs font-black text-white uppercase tracking-tight">{msg.senderName}</h5>
                      <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded-md tracking-widest border ${
                        msg.senderRole === 'HOST' 
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                          : msg.senderRole === 'EXPERT' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : msg.senderRole === 'MODERATOR' 
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                              : 'bg-white/5 text-slate-400 border-white/5'
                      }`}>
                        {msg.senderRole}
                      </span>
                    </div>

                    {/* Chat Bubble card */}
                    <div className={`p-4 rounded-2xl border leading-relaxed shadow-lg ${
                      msg.isMe 
                        ? 'bg-indigo-600 border-indigo-500 text-white rounded-tr-none' 
                        : 'bg-slate-900/90 border-white/10 text-slate-200 rounded-tl-none'
                    }`}>
                      <p className="text-sm font-semibold selection:bg-indigo-500 selection:text-white">{msg.content}</p>
                    </div>

                    {/* Time footer */}
                    <span className={`text-[8px] font-black text-slate-500 uppercase tracking-widest font-mono ${
                      msg.isMe ? 'text-right' : 'text-left'
                    }`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Secure Input Area */}
          <div className="p-4 md:p-6 bg-slate-900 border-t border-white/5 shadow-2xl shrink-0">
            <div className="flex items-center gap-4">
              <input 
                type="text" 
                placeholder={`Type localized insight for the ${group} circle...`}
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                className="flex-grow pl-6 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-500 font-semibold"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!typedMessage.trim()}
                className="p-4 bg-indigo-600 text-white hover:bg-indigo-500 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50 shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] text-center mt-3">
               ★ Distributed Ledger Technology active. Comments are signed by your secure node.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
