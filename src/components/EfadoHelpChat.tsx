import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  X, 
  Send, 
  HelpCircle, 
  AlertCircle, 
  ChevronRight, 
  User, 
  Clock, 
  ShieldCheck, 
  Zap, 
  ArrowLeft,
  MessageCircle,
  Flag,
  ThumbsUp,
  Inbox
} from 'lucide-react';
import { db, auth, collection, addDoc, onSnapshot, query, where, doc, updateDoc, serverTimestamp } from '../firebase';
import { UserProfile } from '../types';

interface EfadoHelpChatProps {
  user: UserProfile;
}

interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  category: string;
  message: string;
  status: 'pending' | 'reviewing' | 'replied' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: any;
  replies?: Array<{
    sender: 'user' | 'CEO' | 'admin';
    senderName: string;
    text: string;
    timestamp: any;
  }>;
}

export const EfadoHelpChat: React.FC<EfadoHelpChatProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState<'list' | 'create' | 'chat'>('list');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // New Ticket Form State
  const [category, setCategory] = useState('General Help');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Active Chat input
  const [chatReply, setChatReply] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Categories list
  const categories = [
    'General Help', 
    'Technical Hub Issues', 
    'Wallet & Payments', 
    'Live Teaching / Zoom', 
    'System Bug / Error'
  ];

  useEffect(() => {
    const handleOpenHelp = (e: Event) => {
      setIsOpen(true);
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.category) {
        setCategory(customEvent.detail.category);
        setActiveView('create');
      } else {
        setActiveView('list');
      }
    };
    window.addEventListener('open-help-chat', handleOpenHelp);
    return () => window.removeEventListener('open-help-chat', handleOpenHelp);
  }, []);

  // Listen to user's tickets in real-time
  useEffect(() => {
    if (!user?.uid) return;

    try {
      const q = query(
        collection(db, 'help_requests'),
        where('userId', '==', user.uid)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: SupportTicket[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as SupportTicket);
        });

        // Safe in-memory sorting by creation timestamp descending
        list.sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });

        setTickets(list);

        // Calculate unread/replied tickets for notification badge
        const unread = list.filter(t => t.status === 'replied').length;
        setUnreadCount(unread);

        // Update active chatting ticket if currently viewing it
        if (selectedTicket) {
          const updated = list.find(t => t.id === selectedTicket.id);
          if (updated) {
            setSelectedTicket(updated);
          }
        }
      }, (error) => {
        console.error("Support Snapshot Error:", error);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error("Failed to list help requests:", err);
    }
  }, [user?.uid, selectedTicket?.id]);

  // Scroll to bottom during live chat
  useEffect(() => {
    if (activeView === 'chat' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeView, selectedTicket?.replies]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'help_requests'), {
        userId: user.uid,
        userEmail: user.email,
        userDisplayName: user.displayName || user.email.split('@')[0] || 'Active Patron',
        category,
        message: message.trim(),
        status: 'pending',
        priority,
        createdAt: serverTimestamp(),
        replies: [
          {
            sender: 'user',
            senderName: user.displayName || user.email.split('@')[0] || 'Patron',
            text: message.trim(),
            timestamp: new Date().toISOString()
          }
        ]
      });

      setMessage('');
      setCategory('General Help');
      setPriority('medium');
      setActiveView('list');
    } catch (err) {
      console.error("Failed to create ticket: ", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !chatReply.trim()) return;

    const replyText = chatReply.trim();
    setChatReply('');

    try {
      const ticketRef = doc(db, 'help_requests', selectedTicket.id);
      const updatedReplies = [
        ...(selectedTicket.replies || []),
        {
          sender: 'user',
          senderName: user.displayName || user.email.split('@')[0] || 'Patron',
          text: replyText,
          timestamp: new Date().toISOString()
        }
      ];

      await updateDoc(ticketRef, {
        replies: updatedReplies,
        status: 'pending' // Flagged back to pending, awaiting CEO feedback
      });
    } catch (err) {
      console.error("Failed to reply: ", err);
    }
  };

  const getStatusColor = (status: SupportTicket['status']) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'reviewing': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'replied': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black animate-pulse';
      case 'closed': return 'bg-slate-500/10 text-slate-500 border border-slate-500/20';
      default: return 'bg-slate-500/15 text-slate-400';
    }
  };

  const getPriorityColor = (prio: SupportTicket['priority']) => {
    switch (prio) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-amber-400';
      case 'low': return 'text-indigo-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <>
      {/* Floating Chat Bubble */}
      <div className="fixed bottom-6 right-6 z-[2000]">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-14 h-14 bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-indigo-900 hover:to-slate-900 text-white rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(31,38,135,0.37)] border border-indigo-500/45 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-yellow-400" />
          ) : (
            <MessageCircle className="w-7 h-7 text-indigo-300 animate-pulse" />
          )}

          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 border border-white text-[9px] font-black text-white">
              {unreadCount}
            </span>
          )}
        </motion.button>
      </div>

      {/* Interactive Support Chat Dialog */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-24 right-6 z-[2000] w-[380px] h-[550px] bg-slate-950 border border-white/10 rounded-[2.5rem] flex flex-col shadow-[0_16px_48px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-yellow-500/10">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-1.5">
                    EFADO Support Hub
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
                    Direct feedback with CEO Festus
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 px-1.5 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* View Area */}
            <div className="flex-grow flex flex-col overflow-y-auto bg-slate-950/40 p-5 no-scrollbar">
              
              {/* 1. LIST VIEW */}
              {activeView === 'list' && (
                <div className="flex flex-col h-full justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Tickets ({tickets.length})</span>
                      <button 
                        onClick={() => setActiveView('create')}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-wider text-[8px] rounded-lg transition-all"
                      >
                        + Create Ticket
                      </button>
                    </div>

                    {tickets.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                        <Inbox className="w-12 h-12 text-slate-600" />
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No active tickets</p>
                          <p className="text-[10px] text-slate-500 mt-1 px-4 leading-relaxed">
                            Need help with classes, payments, or activities? Open a ticket directly to our support commanders.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[350px] overflow-y-auto no-scrollbar">
                        {tickets.map((ticket) => (
                          <div 
                            key={ticket.id}
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setActiveView('chat');
                            }}
                            className="p-3 bg-slate-900/60 hover:bg-slate-900 border border-white/5 hover:border-indigo-500/30 rounded-2xl cursor-pointer transition-all space-y-2 group"
                          >
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-indigo-400">{ticket.category}</span>
                              <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-black ${getStatusColor(ticket.status)}`}>
                                {ticket.status}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-white line-clamp-2 group-hover:text-indigo-200">
                              {ticket.message}
                            </p>
                            <div className="flex items-center justify-between pt-1 text-[9px] text-slate-500 font-mono">
                              <span className="flex items-center gap-1.5 uppercase font-medium">
                                <Flag className={`w-3 h-3 ${getPriorityColor(ticket.priority)}`} />
                                {ticket.priority} Priority
                              </span>
                              <span>
                                {ticket.createdAt ? new Date(ticket.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white/5 border border-white/5 p-4 rounded-3xl text-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#DAA520]">Elite CEO Communication Channel</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mt-1">
                      Our board ensures all support tickets are personally reviewed by our principal, efado.
                    </p>
                  </div>
                </div>
              )}

              {/* 2. CREATE TICKET VIEW */}
              {activeView === 'create' && (
                <form onSubmit={handleCreateTicket} className="flex-grow flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <button 
                        type="button"
                        onClick={() => setActiveView('list')}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Support Request</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Topic Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-white/5 hover:border-white/10 text-xs text-white rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat} className="bg-slate-950 text-white">{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Priority Indicator</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['low', 'medium', 'high'] as const).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPriority(p)}
                            className={`py-2 px-3 text-[10px] font-black uppercase tracking-wider rounded-xl border text-center transition-all ${
                              priority === p 
                                ? 'bg-indigo-600/35 border-indigo-500 text-indigo-400 shadow-xl' 
                                : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white hover:bg-slate-900/80'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Describe Your Difficulties</label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Please detail your issues or request here. Explain carefully so the CEO can reply directly with perfect context."
                        rows={5}
                        className="w-full px-4 py-3 bg-slate-900 border border-white/5 text-xs text-white placeholder-slate-500 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveView('list')}
                      className="w-1/3 py-3 bg-slate-900 hover:bg-slate-900/60 border border-white/5 text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-grow py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit to CEO'}
                    </button>
                  </div>
                </form>
              )}

              {/* 3. ACTIVE CHAT DIALOGUE */}
              {activeView === 'chat' && selectedTicket && (
                <div className="flex-grow flex flex-col h-full justify-between">
                  <div className="flex-grow flex flex-col justify-between">
                    {/* Chat Header */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setActiveView('list')}
                          className="text-slate-400 hover:text-white transition-colors"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedTicket.category}</span>
                          <span className="block text-[8px] uppercase text-indigo-400 font-bold leading-none mt-0.5">Ticket #{selectedTicket.id.slice(0, 5)}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-black ${getStatusColor(selectedTicket.status)}`}>
                        {selectedTicket.status}
                      </span>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-grow h-[220px] overflow-y-auto pr-1 space-y-3 Scrollbar-custom max-h-[250px] overflow-x-hidden no-scrollbar">
                      {selectedTicket.replies?.map((reply, index) => {
                        const isSelf = reply.sender === 'user';
                        return (
                          <div 
                            key={index}
                            className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                          >
                            <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider mb-0.5 px-1.5">
                              {reply.senderName}
                            </span>
                            <div className={`p-3 max-w-[85%] rounded-2xl text-xs font-medium border ${
                              isSelf 
                                ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-sm' 
                                : 'bg-slate-900 text-white border-white/5 rounded-tl-sm'
                            }`}>
                              <p className="leading-relaxed break-words">{reply.text}</p>
                              {reply.timestamp && (
                                <span className={`block text-[8px] text-right mt-1 opacity-60 font-mono`}>
                                  {new Date(reply.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>
                  </div>

                  {/* Input message form bottom */}
                  <div className="pt-3 border-t border-white/5 mt-3 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={selectedTicket.status === 'closed' ? "This ticket has been closed." : "Type reply to efado..."}
                      disabled={selectedTicket.status === 'closed'}
                      value={chatReply}
                      onChange={(e) => setChatReply(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                      className="flex-grow px-4 py-3 bg-slate-900 border border-white/5 text-xs text-white placeholder-slate-500 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={selectedTicket.status === 'closed' || !chatReply.trim()}
                      className="p-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
