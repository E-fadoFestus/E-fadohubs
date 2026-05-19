import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  Wallet, 
  Calendar, 
  ShieldCheck, 
  MessageSquare, 
  HelpCircle, 
  Plus, 
  Search, 
  Bell, 
  ArrowRight,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  History,
  MessageCircle,
  Trophy,
  UserPlus,
  Settings,
  X,
  Zap,
  Phone,
  Video,
  Send,
  MoreVertical,
  Image as ImageIcon,
  Paperclip,
  Smile,
  Mic,
  Camera,
  Banknote,
  User,
  Store,
  Mail,
  MapPin,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, CSCCGroup, CSCCMembership, CSCCCycle, CSCCContribution, ChatMessage } from '../types';
import { db, auth, collection, onSnapshot, query, where, addDoc, serverTimestamp, updateDoc, doc, getDocs, getDoc } from '../firebase';
import { VendorRegistration } from './VendorRegistration';
import { useCurrency } from '../lib/CurrencyContext';
import { SUPPORT_EMAILS, PHONE_NUMBERS, OFFICE_ADDRESSES } from '../constants/businessProfile';
import { MiningMiniCard, AdvertisingMiniCard } from './EfadoMining';

interface EfadoCommunityHubsProps {
  user: UserProfile;
  onOpenMining?: () => void;
  onNavigate?: (hub: any, subview?: any) => void;
}

export const EfadoCommunityHubs: React.FC<EfadoCommunityHubsProps> = ({ user, onOpenMining, onNavigate }) => {
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState<'HOME' | 'CSCC' | 'CSCC_PLUS' | 'GROUPS' | 'WALLETS' | 'CENTRAL' | 'COMMUNITY' | 'SUPPORT' | 'RAFFLE' | 'PARTNERS'>('HOME');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groups, setGroups] = useState<CSCCGroup[]>([]);
  const [myMemberships, setMyMemberships] = useState<CSCCMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<CSCCGroup | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showRaffle, setShowRaffle] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [raffleCards, setRaffleCards] = useState<{id: number, turn: number | null, isFlipped: boolean}[]>([]);
  const [recipientProfile, setRecipientProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (activeTab === 'COMMUNITY' && selectedGroup) {
      const unsubMessages = onSnapshot(
        query(collection(db, 'cscc_messages'), where('groupId', '==', selectedGroup.id)),
        (snapshot) => {
          setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)).sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds));
        }
      );
      return () => unsubMessages();
    }
  }, [activeTab, selectedGroup]);

  useEffect(() => {
    if (selectedGroup) {
      const recipientId = selectedGroup.useRaffle 
        ? selectedGroup.raffleResults?.[selectedGroup.currentCycleIndex]
        : selectedGroup.payoutOrder[selectedGroup.currentCycleIndex];
      
      if (recipientId) {
        getDoc(doc(db, 'users', recipientId)).then(snap => {
          if (snap.exists()) setRecipientProfile(snap.data() as UserProfile);
        });
      }
    }
  }, [selectedGroup]);

  useEffect(() => {
    const unsubGroups = onSnapshot(collection(db, 'cscc_groups'), (snapshot) => {
      setGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CSCCGroup)));
      setLoading(false);
    });

    const unsubMemberships = onSnapshot(
      query(collection(db, 'cscc_memberships'), where('userId', '==', user.uid)),
      (snapshot) => {
        setMyMemberships(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CSCCMembership)));
      }
    );

    return () => {
      unsubGroups();
      unsubMemberships();
    };
  }, [user.uid]);

  const handleJoinGroup = async (group: CSCCGroup) => {
    try {
      await addDoc(collection(db, 'cscc_memberships'), {
        groupId: group.id,
        userId: user.uid,
        userName: user.displayName || user.email,
        status: 'pending',
        joinedAt: serverTimestamp()
      });
      alert('Join request sent!');
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };

  const initializeRaffle = async (group: CSCCGroup) => {
    const memberships = await getDocs(query(collection(db, 'cscc_memberships'), where('groupId', '==', group.id), where('status', '==', 'approved')));
    const memberIds = memberships.docs.map(d => d.data().userId);
    
    // Create shuffled turns
    const turns = Array.from({ length: memberIds.length }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    const cards = memberIds.map((_, i) => ({
      id: i,
      turn: turns[i],
      isFlipped: false
    }));
    
    setRaffleCards(cards);
    setShowRaffle(true);
  };

  const handleFlipCard = async (cardId: number) => {
    if (!selectedGroup) return;
    
    const newCards = raffleCards.map(c => c.id === cardId ? { ...c, isFlipped: true } : c);
    setRaffleCards(newCards);
    
    const card = newCards.find(c => c.id === cardId);
    if (card && card.turn) {
      // In a real app, we'd assign this turn to the user
      // For demo, let's assume the user is picking their turn
      const updatedRaffleResults = { ...selectedGroup.raffleResults, [card.turn - 1]: user.uid };
      
      try {
        await updateDoc(doc(db, 'cscc_groups', selectedGroup.id!), {
          raffleResults: updatedRaffleResults
        });
        
        // Update local state
        setSelectedGroup({ ...selectedGroup, raffleResults: updatedRaffleResults });
      } catch (error) {
        console.error('Error updating raffle:', error);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedGroup) return;
    
    try {
      await addDoc(collection(db, 'cscc_messages'), {
        groupId: selectedGroup.id,
        senderId: user.uid,
        senderName: user.displayName || user.email,
        content: newMessage,
        type: 'text',
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const isLateForCycle = (group: CSCCGroup) => {
    if (!group.nextPayoutDate) return false;
    
    const now = new Date();
    const deadline = group.nextPayoutDate.toDate ? group.nextPayoutDate.toDate() : new Date(group.nextPayoutDate);
    const diffMs = deadline.getTime() - now.getTime();
    
    switch (group.cycleDuration) {
      case 'daily':
        return diffMs < 3600000; // 1 hour
      case 'weekly':
        return diffMs < 86400000; // 1 day
      case 'monthly':
        return diffMs < 172800000; // 2 days (assumed)
      case 'quarterly':
        return diffMs < 259200000; // 3 days
      case '6-month':
        return diffMs < 432000000; // 5 days
      case 'yearly':
        return diffMs < 604800000; // 7 days
      default:
        return false;
    }
  };

  const handlePayPenalty = async () => {
    if (!selectedGroup) return;
    const membership = myMemberships.find(m => m.groupId === selectedGroup.id);
    if (!membership) return;

    const penaltyAmount = selectedGroup.contributionAmount * 0.03;
    
    try {
      // In a real app, we'd deduct from user wallet and add to CEO wallet
      // For now, we update the membership to mark penalty as paid
      const updatedPenalties = { ...membership.penaltiesPaid, [selectedGroup.currentCycleIndex]: true };
      await updateDoc(doc(db, 'cscc_memberships', membership.id!), {
        penaltiesPaid: updatedPenalties
      });
      
      // Also log transaction to CEO account (simulated)
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'payment',
        amount: penaltyAmount,
        currency: selectedGroup.currency,
        status: 'completed',
        description: `Late Penalty for ${selectedGroup.name} - Cycle ${selectedGroup.currentCycleIndex + 1}`,
        timestamp: serverTimestamp(),
        recipient: 'CEO_ACCOUNT'
      });

      alert(`Penalty of ${formatPrice(penaltyAmount)} paid successfully!`);
    } catch (error) {
      console.error('Error paying penalty:', error);
    }
  };

  const handlePayContribution = async () => {
    if (!selectedGroup) return;
    
    try {
      const currentCyclePaid = selectedGroup.progressivePayments?.[selectedGroup.currentCycleIndex] || [];
      if (currentCyclePaid.includes(user.uid)) {
        alert('You have already contributed for this cycle.');
        return;
      }

      const updatedPayments = { 
        ...selectedGroup.progressivePayments, 
        [selectedGroup.currentCycleIndex]: [...currentCyclePaid, user.uid] 
      };

      await updateDoc(doc(db, 'cscc_groups', selectedGroup.id!), {
        progressivePayments: updatedPayments
      });

      await addDoc(collection(db, 'cscc_contributions'), {
        groupId: selectedGroup.id,
        userId: user.uid,
        amount: selectedGroup.contributionAmount,
        cycleIndex: selectedGroup.currentCycleIndex,
        timestamp: serverTimestamp()
      });

      alert('Contribution paid successfully!');
    } catch (error) {
      console.error('Error paying contribution:', error);
    }
  };

  const renderGuide = () => (
    <AnimatePresence>
      {showGuide && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md"
        >
          <div className="w-full max-w-xl bg-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 rounded-full blur-3xl -mr-24 -mt-24 opacity-50" />
            <button 
              onClick={() => setShowGuide(false)}
              className="absolute top-6 right-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-900 transition-all font-black"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 mb-8">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Tactical Hub Guide</h2>
              <p className="text-gray-700 font-bold mb-8 leading-relaxed uppercase tracking-[0.1em] text-xs">
                Welcome to the Strategic Nexus. Here is how you dominate your financial goals within the EFADO Ecosystem:
              </p>
              
              <div className="space-y-6">
                {[
                  { icon: TrendingUp, title: "EFADO CSCC", desc: "Join collective savings groups. Contribute regularly to receive large lump-sum payouts." },
                  { icon: Zap, title: "Cycle Central", desc: "Monitor active saving cycles, track your turn position, and manage approvals." },
                  { icon: Wallet, title: "Smart Wallets", desc: "Strategic funds management. Keep your deposit wallet funded for seamless contributions." },
                  { icon: MessageSquare, title: "Group Feed", desc: "Connect with group members, share strategic insights, and participate in discourse." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-1">{item.title}</h4>
                      <p className="text-xs text-gray-700 leading-relaxed font-bold">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={() => setShowGuide(false)}
                className="w-full mt-10 py-5 bg-gray-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-gray-300 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Let's Strategize
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const PLUS_INTEREST_RATES: Record<string, number> = {
    'weekly': 3,
    'monthly': 5,
    'quarterly': 7,
    '6-month': 10,
    'yearly': 15
  };

  const PLUS_BONUS_TIERS = [25, 50, 75, 100];

  const [showCreatePlusGroup, setShowCreatePlusGroup] = useState(false);
  const [plusFormData, setPlusFormData] = useState({
    name: '',
    description: '',
    contributionAmount: 100,
    currency: 'USD',
    cycleDuration: 'monthly' as any,
    maxMembers: 10,
    bonusTier: 50 as any,
    isPublic: true
  });

  const handleCreatePlusGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'cscc_groups'), {
        ...plusFormData,
        type: 'PLUS',
        adminId: user.uid,
        status: 'pending',
        currentCycleIndex: 0,
        progressivePayments: {},
        createdAt: serverTimestamp(),
        payoutOrder: [], // Will be filled as people join or via raffle
        useRaffle: true
      });
      setShowCreatePlusGroup(false);
      alert('EFADO CSCC PLUS Group created successfully!');
    } catch (error) {
      console.error('Error creating PLUS group:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCSCCPlus = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-12"
    >
      {/* Hero Section for CSCC PLUS */}
      <div className="group relative bg-gradient-to-br from-rose-900 via-slate-900 to-slate-950 p-12 rounded-[3.5rem] text-white overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-rose-500/20 to-transparent pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-rose-600/20 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em]">Rotational Savings & Lending (RSL)</span>
          </div>
          <h2 className="text-5xl font-black mb-6 tracking-tighter leading-none">EFADO CSCC <span className="text-rose-400 italic">PLUS.</span></h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-10">
            The elite rotational savings model. Contribute in groups and receive massive payouts with additional bonus capital of up to 100% to jumpstart your business or handle emergencies.
          </p>
          <div className="flex flex-wrap gap-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreatePlusGroup(true)}
              className="px-10 py-5 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-rose-900/40 hover:bg-rose-500 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Initialize PLUS Cycle
            </motion.button>
            <button 
              onClick={() => setActiveTab('CSCC')}
              className="px-10 py-5 bg-white/5 text-white rounded-2xl font-black uppercase tracking-widest text-xs border-2 border-white/10 hover:bg-white/20 transition-all"
            >
              Switch to Standard
            </button>
          </div>
        </div>
      </div>

      {/* Mechanics / Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Active PLUS Groups</h3>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black text-gray-700 uppercase">Filter:</span>
               <select className="text-[10px] font-black bg-white border border-gray-100 rounded-lg px-2 py-1">
                  <option>All Durations</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
               </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {groups.filter(g => g.type === 'PLUS' && g.isPublic).length === 0 ? (
               <div className="col-span-full p-20 bg-white rounded-3xl border-2 border-dashed border-gray-100 text-center">
                  <Trophy className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-400 font-bold">No active PLUS groups yet. Be the first to start an elite cycle!</p>
               </div>
            ) : (
              groups.filter(g => g.type === 'PLUS' && g.isPublic).map(group => (
                <div key={group.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 bg-rose-100 text-rose-600 text-[9px] font-black uppercase rounded-full">
                        +{group.bonusTier}% Bonus Tier
                      </span>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        {group.cycleDuration}
                      </span>
                    </div>

                    <h4 className="text-xl font-black text-gray-900 mb-2">{group.name}</h4>
                    <p className="text-xs text-gray-500 mb-6 line-clamp-2">{group.description}</p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                       <div className="p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Weekly Share</p>
                          <p className="text-sm font-black text-gray-900">{formatPrice(group.contributionAmount)}</p>
                       </div>
                       <div className="p-4 bg-rose-50 rounded-2xl">
                          <p className="text-[9px] font-bold text-rose-400 uppercase mb-1">Max Payout</p>
                          <p className="text-sm font-black text-rose-600">
                             {formatPrice(group.contributionAmount * group.maxMembers * (1 + (group.bonusTier || 0) / 100))}
                          </p>
                       </div>
                    </div>

                    <button 
                      onClick={() => handleJoinGroup(group)}
                      className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-600 transition-all shadow-lg shadow-gray-200"
                    >
                      Join Elite Nexus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
              <h3 className="text-lg font-black mb-6 uppercase tracking-tight">PLUS Mechanics</h3>
              
              <div className="space-y-6">
                 <div>
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-black text-gray-400 uppercase">Lump Sum Bonus</span>
                       <span className="text-[10px] font-black text-rose-400">Up to 100%</span>
                    </div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                       <div className="bg-rose-500 h-full w-full" />
                    </div>
                 </div>

                 <div className="space-y-4 pt-4 border-t border-white/10">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Interest & Payback Timing</p>
                    <div className="grid grid-cols-2 gap-4">
                       {Object.entries(PLUS_INTEREST_RATES).map(([key, val]) => (
                          <div key={key} className="flex flex-col p-3 bg-white/5 rounded-xl border border-white/5">
                             <span className="text-[8px] font-black text-gray-500 uppercase">{key}</span>
                             <span className="text-sm font-black text-white">{val}% <span className="text-[8px] text-rose-400">/ 1 Cycle</span></span>
                          </div>
                       ))}
                    </div>
                 </div>

                 <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                    <p className="text-[9px] text-rose-200 leading-relaxed font-bold">
                       <Trophy className="w-3 h-3 inline mr-1 mb-0.5" />
                       PAYBACK RULE: The bonus amount + interest MUST be repaid exactly 1 cycle interval after receiving your payout. (e.g. Weekly groups repay in 7 days).
                    </p>
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-black text-gray-900 mb-4 uppercase tracking-tight">Sustainability</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium mb-6">
                 The EFADO CSCC PLUS interest structure funds the bonus pool and ensures the rotating nature remains perpetually solvent for all members.
              </p>
              <div className="flex flex-col gap-3">
                 <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-[10px] font-black text-emerald-700 uppercase">Guaranteed Payouts</span>
                 </div>
                 <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span className="text-[10px] font-black text-purple-700 uppercase">Fixed Rotation</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Creation Modal for PLUS Group */}
      <AnimatePresence>
        {showCreatePlusGroup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-2xl bg-white rounded-[3rem] p-10 shadow-huge relative max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <button 
                onClick={() => setShowCreatePlusGroup(false)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-rose-100">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none uppercase">Initialize PLUS <br/><span className="text-rose-600">Savings Cycle.</span></h2>
                </div>
                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest opacity-60">Elite Rotational Capital Nexus</p>
              </div>

              <form onSubmit={handleCreatePlusGroup} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest block">Group Strategic Name</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Sovereign Merchants Elite"
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-black focus:outline-none focus:border-rose-600 transition-all placeholder:text-gray-500"
                      value={plusFormData.name}
                      onChange={(e) => setPlusFormData({...plusFormData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest block">Cycle Duration</label>
                    <select 
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-black focus:outline-none focus:border-rose-600 transition-all appearance-none cursor-pointer"
                      value={plusFormData.cycleDuration}
                      onChange={(e) => setPlusFormData({...plusFormData, cycleDuration: e.target.value as any})}
                    >
                      <option value="weekly">Weekly (3% Interest)</option>
                      <option value="monthly">Monthly (5% Interest)</option>
                      <option value="quarterly">3 Months (7% Interest)</option>
                      <option value="6-month">6 Months (10% Interest)</option>
                      <option value="yearly">Yearly (15% Interest)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest block">Bonus Tier</label>
                      <select 
                        className="w-full px-6 py-4 bg-rose-50 border-2 border-rose-100 rounded-2xl text-rose-600 text-sm font-black focus:outline-none focus:border-rose-600 transition-all appearance-none cursor-pointer"
                        value={plusFormData.bonusTier}
                        onChange={(e) => setPlusFormData({...plusFormData, bonusTier: parseInt(e.target.value) as any})}
                      >
                        {PLUS_BONUS_TIERS.map(tier => (
                           <option key={tier} value={tier}>+{tier}% Bonus Payout</option>
                        ))}
                      </select>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest block">Share Amount</label>
                      <input 
                        required
                        type="number" 
                        className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-black focus:outline-none focus:border-rose-600 transition-all"
                        value={plusFormData.contributionAmount}
                        onChange={(e) => setPlusFormData({...plusFormData, contributionAmount: parseInt(e.target.value)})}
                      />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest block">Members Limit</label>
                      <input 
                        required
                        type="number" 
                        max={50}
                        className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-black focus:outline-none focus:border-rose-600 transition-all"
                        value={plusFormData.maxMembers}
                        onChange={(e) => setPlusFormData({...plusFormData, maxMembers: parseInt(e.target.value)})}
                      />
                   </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest block">Mission Statement / Description</label>
                  <textarea 
                    rows={3}
                    placeholder="Describe the purpose of this elite savings nexus..."
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-black focus:outline-none focus:border-rose-600 transition-all resize-none placeholder:text-gray-500"
                    value={plusFormData.description}
                    onChange={(e) => setPlusFormData({...plusFormData, description: e.target.value})}
                  />
                </div>

                <div className="p-6 bg-slate-900 rounded-[2rem] text-white space-y-4">
                   <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Strategic Payout Forecast</p>
                      <p className="text-2xl font-black text-rose-500">
                         {formatPrice(plusFormData.contributionAmount * plusFormData.maxMembers * (1 + plusFormData.bonusTier / 100))}
                      </p>
                   </div>
                   <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                      This includes {plusFormData.bonusTier}% additional bonus capital provided by the EFADO community liquidity engine.
                   </p>
                </div>

                <button 
                  disabled={loading}
                  type="submit"
                  className="w-full py-5 bg-rose-600 text-white rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-rose-900/20 hover:bg-rose-700 transition-all flex items-center justify-center gap-3"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  Deploy Elite Cycle
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  const renderHome = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12"
    >
      {/* Strategic Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-slate-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-2xl border border-white/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] -mr-32 -mt-32" />
          <div className="relative z-10">
            <span className="text-[10px] font-black tracking-[0.3em] text-indigo-400 uppercase mb-4 block">Ecosystem Status</span>
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tighter leading-tight">Your Financial <br />Nexus is <span className="text-emerald-400 italic">Optimized.</span></h2>
            <div className="flex flex-wrap gap-4 mt-8">
              <button 
                onClick={() => setShowGuide(true)}
                className="px-8 py-3 bg-white text-slate-950 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-500 hover:text-white transition-all shadow-xl shadow-white/5"
              >
                Access Tactical Guide
              </button>
              <button 
                onClick={() => setActiveTab('CSCC')}
                className="px-8 py-3 bg-indigo-600/30 border border-indigo-500/30 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 transition-all backdrop-blur-sm"
              >
                Join New Cycle
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <MiningMiniCard user={user} onOpenFull={onOpenMining || (() => {})} />
           <AdvertisingMiniCard 
              onAdvert={() => onNavigate?.('ADVERTISING', 'ADVERT')} 
              onSell={() => onNavigate?.('ADVERTISING', 'SELL')} 
           />
        </div>

        <div className="bg-gradient-to-br from-indigo-50/50 via-white to-indigo-50/30 rounded-[2.5rem] border border-gray-100 p-8 shadow-xl shadow-gray-100/30 flex flex-col justify-between group hover:border-indigo-100 transition-all">
          <div>
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-gray-950 uppercase tracking-tight mb-2">Member Health</h3>
            <p className="text-sm font-black text-gray-800 leading-relaxed uppercase tracking-widest">Efficiency: 98.4%</p>
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-relaxed">System Verification Complete. All security protocols active.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Groups', value: myMemberships.filter(m => m.status === 'approved').length, icon: Users, color: 'indigo', trend: '+2 this week' },
          { label: 'Wallet Balance', value: formatPrice(user.playerWallet), icon: Wallet, color: 'emerald', trend: '+12.5% ROI' },
          { label: 'Next Payout', value: '7 Days', icon: Clock, color: 'orange', trend: 'Cycle #14' },
          { label: 'Notifications', value: '3 New', icon: Bell, color: 'purple', trend: 'Priority Intel' }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="group relative bg-gradient-to-br from-slate-50 to-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${stat.color}-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-500`} />
            <div className={`w-14 h-14 bg-${stat.color}-50 rounded-2xl flex items-center justify-center mb-6 relative z-10`}>
              <stat.icon className={`w-7 h-7 text-${stat.color}-600`} />
            </div>
            <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.2em] mb-1 relative z-10">{stat.label}</p>
            <h3 className="text-3xl font-black text-gray-950 mb-2 relative z-10">{stat.value}</h3>
            <p className={`text-[10px] font-bold text-${stat.color}-600 uppercase tracking-widest relative z-10 flex items-center gap-1`}>
              <Zap className="w-3 h-3" />
              {stat.trend}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Active CSCC Groups */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">My Active Cycles</h2>
          <button className="text-sm font-bold text-indigo-600 hover:underline">View All</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myMemberships.length === 0 ? (
            <div className="col-span-full p-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900">No active cycles</h3>
              <p className="text-gray-500 text-sm mb-6">Join a CSCC group to start saving together.</p>
              <button 
                onClick={() => setActiveTab('CSCC')}
                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-100"
              >
                Browse Groups
              </button>
            </div>
          ) : (
            myMemberships.map(membership => {
              const group = groups.find(g => g.id === membership.groupId);
              if (!group) return null;
              return (
                <div key={membership.id} className="bg-slate-50 p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-black text-gray-900">{group.name}</h3>
                        {group.type === 'PLUS' && (
                          <span className="px-2 py-0.5 bg-rose-600 text-white text-[8px] font-black uppercase rounded">PLUS</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{group.contributionAmount} {group.currency} / {group.cycleDuration}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase rounded-full">
                      {group.status}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400 font-bold uppercase">Progress</span>
                      <span className="text-gray-900 font-black">Cycle {group.currentCycleIndex + 1} of {group.maxMembers}</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all" 
                        style={{ width: `${((group.currentCycleIndex + 1) / group.maxMembers) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                            U{i}
                          </div>
                        ))}
                        <div className="w-8 h-8 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-600">
                          +{group.maxMembers - 3}
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedGroup(group);
                          setActiveTab('CENTRAL');
                        }}
                        className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                      >
                        Enter Cycle
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </motion.div>
  );

  const renderCSCC = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      <div className="group relative bg-gray-900 p-12 rounded-[3.5rem] text-white overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-600/20 to-transparent pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-600/20 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Institutional Grade CSCC</span>
          </div>
          <h2 className="text-5xl font-black mb-6 tracking-tighter leading-none">Collective Saving <br/><span className="text-indigo-400">Culture Cycle.</span></h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-10">
            Join a transparent, community-led system managed by military-grade smart protocols. Automated payouts, guaranteed security, and real-time community engagement.
          </p>
          <div className="flex flex-wrap gap-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateGroup(true)}
              className="px-10 py-5 bg-white text-gray-900 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-white/5 hover:bg-gray-100 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Group
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowGuide(true)}
              className="px-10 py-5 bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-xs border-2 border-white/10 hover:bg-white/20 transition-all flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              Global Guide
            </motion.button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Available Groups</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <input 
                type="text" 
                placeholder="Search groups..." 
                className="pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-sm text-gray-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.filter(g => (g.type === 'STANDARD' || !g.type) && g.isPublic).map(group => (
              <div key={group.id} className="bg-slate-50 p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                <h4 className="font-black text-gray-900 mb-1">{group.name}</h4>
                <p className="text-xs text-gray-500 mb-4 line-clamp-2">{group.description}</p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-gray-50 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-700 uppercase">Contribution</p>
                    <p className="text-sm font-black text-gray-900">{group.contributionAmount} {group.currency}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-700 uppercase">Members</p>
                    <p className="text-sm font-black text-gray-900">{group.maxMembers} Max</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleJoinGroup(group)}
                  className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 hover:text-white transition-all"
                >
                  Join Group
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-black text-gray-900 tracking-tight">My Cycles</h3>
          <div className="bg-slate-50 p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h4 className="font-bold text-gray-900">Cycle Calendar</h4>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-2xl transition-colors">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black text-indigo-600 uppercase">Apr</span>
                    <span className="text-sm font-black text-indigo-900">{15 + i * 7}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Group Contribution</p>
                    <p className="text-[10px] text-gray-700 uppercase font-bold">Elite Savers Hub</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderCentral = () => {
    if (!selectedGroup) {
      return (
        <div className="p-12 bg-gradient-to-br from-slate-50 via-white to-slate-50/50 rounded-3xl border border-gray-100 text-center">
          <Zap className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No Cycle Selected</h3>
          <p className="text-gray-500 text-sm mb-6">Select an active cycle from your home dashboard to view details.</p>
          <button 
            onClick={() => setActiveTab('HOME')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs"
          >
            Go to Dashboard
          </button>
        </div>
      );
    }

    const currentRecipientId = selectedGroup.useRaffle 
      ? selectedGroup.raffleResults?.[selectedGroup.currentCycleIndex]
      : selectedGroup.payoutOrder[selectedGroup.currentCycleIndex];

    const paidMembers = selectedGroup.progressivePayments?.[selectedGroup.currentCycleIndex] || [];
    const membership = myMemberships.find(m => m.groupId === selectedGroup.id);
    const isLate = isLateForCycle(selectedGroup);
    const hasPaidContribution = paidMembers.includes(user.uid);
    const hasPaidPenalty = membership?.penaltiesPaid?.[selectedGroup.currentCycleIndex] || false;
    const needsPenalty = isLate && !hasPaidContribution && !hasPaidPenalty;

    return (
      <div className="space-y-8">
        {isLate && !hasPaidContribution && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-pulse">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-xs font-bold text-red-800">
              Deadline Violation! You are late for this cycle. Please pay the 3% penalty to enable your contribution.
            </p>
          </div>
        )}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Selected Circle View */}
          <div className="flex-1 space-y-6">
            <div className="bg-gradient-to-br from-white via-indigo-50/30 to-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 mb-1">{selectedGroup.name}</h2>
                  <div className="flex items-center gap-2 text-gray-700 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Cycle ends in 4 days, 12 hours</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Payout Readiness</p>
                  <p className="text-2xl font-black text-emerald-600">
                    {Math.round((paidMembers.length / selectedGroup.maxMembers) * 100)}%
                  </p>
                </div>
              </div>

              {/* Current Recipient Profile */}
              <div className="mb-8 p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-sm overflow-hidden shrink-0">
                    {recipientProfile?.photoURL ? (
                      <img src={recipientProfile.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600">
                        <User className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-black text-gray-900">
                        {recipientProfile?.displayName || 'Awaiting Raffle...'}
                      </h3>
                      <span className="px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-black uppercase rounded">Current Recipient</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{recipientProfile?.email || 'The turn is being decided by raffle draw'}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Bank Details</p>
                        <p className="text-xs font-bold text-gray-900">EFADO Wallet Transfer</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Payout Amount</p>
                        <p className="text-xs font-black text-indigo-600">
                          {formatPrice(selectedGroup.contributionAmount * selectedGroup.maxMembers)}
                          {selectedGroup.type === 'PLUS' && (
                            <span className="text-rose-600 ml-1">
                              + {formatPrice(selectedGroup.contributionAmount * selectedGroup.maxMembers * (selectedGroup.bonusTier || 0) / 100)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    {selectedGroup.type === 'PLUS' && (
                      <div className="mt-4 p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center justify-between">
                        <div>
                          <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Repayment Forecast</p>
                          <p className="text-xs font-bold text-rose-900">
                             Bonus + {PLUS_INTEREST_RATES[selectedGroup.cycleDuration] || 0}% Interest
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-rose-600">
                             {formatPrice((selectedGroup.contributionAmount * selectedGroup.maxMembers * (selectedGroup.bonusTier || 0) / 100) * (1 + (PLUS_INTEREST_RATES[selectedGroup.cycleDuration] || 0) / 100))}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Member Progress Board */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                {Array.from({ length: selectedGroup.maxMembers }).map((_, i) => {
                  const isPaid = paidMembers.includes(`member_${i}`); // Mocking member IDs for demo
                  return (
                    <div key={i} className={`p-4 rounded-2xl border ${isPaid ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-gray-900 border border-gray-100">
                          M{i + 1}
                        </div>
                        {isPaid ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-gray-300" />}
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status</p>
                      <p className={`text-xs font-bold ${isPaid ? 'text-emerald-700' : 'text-gray-500'}`}>
                        {isPaid ? 'Paid' : 'Pending'}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                {needsPenalty ? (
                  <button 
                    onClick={handlePayPenalty}
                    className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-red-100 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Banknote className="w-4 h-4" />
                    Pay Penalty ({(selectedGroup.contributionAmount * 0.03).toFixed(2)} {selectedGroup.currency})
                  </button>
                ) : (
                  <button 
                    onClick={handlePayContribution}
                    disabled={hasPaidContribution}
                    className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg transition-all ${
                      hasPaidContribution 
                        ? 'bg-emerald-100 text-emerald-700 shadow-none cursor-default' 
                        : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700'
                    }`}
                  >
                    {hasPaidContribution ? 'Contribution Paid' : `Pay Now (${formatPrice(selectedGroup.contributionAmount)})`}
                  </button>
                )}
                <button 
                  onClick={() => setActiveTab('COMMUNITY')}
                  className="flex-1 py-4 bg-white text-gray-900 border border-gray-200 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Group Chat
                </button>
              </div>
            </div>

            {/* Raffle Draw Section */}
            {selectedGroup.useRaffle && !selectedGroup.raffleResults?.[0] && (
              <div className="bg-slate-50 p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
                <Trophy className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                <h3 className="text-xl font-black text-gray-900 mb-2">Raffle Draw Pending</h3>
                <p className="text-gray-500 text-sm mb-6">The payout order for this group will be decided by a raffle draw once all members join.</p>
                <button 
                  onClick={() => initializeRaffle(selectedGroup)}
                  className="px-8 py-4 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-orange-100"
                >
                  Start Raffle Draw
                </button>
              </div>
            )}

            {/* Raffle Modal */}
            <AnimatePresence>
              {showRaffle && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                >
                  <div className="w-full max-w-4xl">
                    <div className="text-center mb-12">
                      <h2 className="text-3xl font-black text-white mb-2">Select Your Turn</h2>
                      <p className="text-gray-400">Flip a card to reveal your payout position in this cycle.</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                      {raffleCards.map(card => (
                        <motion.div
                          key={card.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => !card.isFlipped && handleFlipCard(card.id)}
                          className={`aspect-[3/4] rounded-2xl cursor-pointer perspective-1000 transition-all duration-500 ${card.isFlipped ? 'rotate-y-180' : ''}`}
                        >
                          <div className={`relative w-full h-full transition-transform duration-500 preserve-3d ${card.isFlipped ? 'rotate-y-180' : ''}`}>
                            {/* Front */}
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center border-4 border-white/20 backface-hidden">
                              <Zap className="w-12 h-12 text-white/30" />
                            </div>
                            {/* Back */}
                            <div className="absolute inset-0 bg-white rounded-2xl flex flex-col items-center justify-center border-4 border-indigo-600 rotate-y-180 backface-hidden">
                              <p className="text-xs font-black text-gray-400 uppercase mb-1">Your Turn</p>
                              <p className="text-5xl font-black text-indigo-600">{card.turn}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="mt-12 text-center">
                      <button 
                        onClick={() => setShowRaffle(false)}
                        className="px-8 py-4 bg-white text-gray-900 rounded-2xl font-black uppercase tracking-widest text-xs"
                      >
                        Close Raffle
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cycle Order Tracker */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-black text-gray-900 mb-6 tracking-tight">Payout Order Tracker</h3>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100" />
                <div className="space-y-8">
                  {Array.from({ length: selectedGroup.maxMembers }).map((_, i) => {
                    const recipientId = selectedGroup.useRaffle 
                      ? selectedGroup.raffleResults?.[i]
                      : selectedGroup.payoutOrder[i];
                    
                    const isCurrent = i === selectedGroup.currentCycleIndex;
                    const isPast = i < selectedGroup.currentCycleIndex;

                    return (
                      <div key={i} className="relative flex items-center gap-6 pl-10">
                        <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center z-10 ${isCurrent ? 'bg-indigo-600 text-white ring-4 ring-indigo-50' : isPast ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-gray-100 text-gray-300'}`}>
                          {isPast ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-black">{i + 1}</span>}
                        </div>
                        <div className={`flex-1 flex items-center justify-between p-4 rounded-2xl ${isCurrent ? 'bg-indigo-50 border border-indigo-100' : 'bg-gray-50'}`}>
                          <div>
                            <p className="text-sm font-black text-gray-900">
                              {recipientId === user.uid ? 'You' : recipientId ? `Member ${i + 1}` : 'Awaiting Raffle'}
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Estimated Payout: Cycle {i + 1}</p>
                          </div>
                          {isCurrent && (
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase rounded-full animate-pulse">
                              Active Cycle
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="w-full md:w-80 space-y-6">
            <div className="bg-gray-900 text-white p-6 rounded-3xl shadow-xl">
              <h4 className="font-black uppercase tracking-widest text-xs text-gray-400 mb-4">Cycle Stats</h4>
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Total Pool</p>
                  <p className="text-3xl font-black text-indigo-400">
                    {(selectedGroup.contributionAmount * selectedGroup.maxMembers).toFixed(2)} {selectedGroup.currency}
                  </p>
                </div>
                <div className="pt-6 border-t border-gray-800">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-gray-500 font-bold uppercase">Collection</span>
                    <span className="text-white font-black">{paidMembers.length}/{selectedGroup.maxMembers} Members</span>
                  </div>
                  <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full transition-all duration-500" 
                      style={{ width: `${(paidMembers.length / selectedGroup.maxMembers) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Rules & Safety</p>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Payouts are only initiated when 100% of contributions are confirmed. Dispute center is available 24/7.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50/50 p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h4 className="font-black uppercase tracking-widest text-xs text-gray-400 mb-4">Group Admin</h4>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900">EFADO Verified</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">System Managed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRaffle = () => {
    return (
      <div className="space-y-12">
        <div className="relative group bg-gray-900 p-12 rounded-[3.5rem] text-white overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-orange-500/20 to-transparent pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.3em]">Live Raffle Draw</span>
              </div>
              <h2 className="text-4xl font-black mb-4 tracking-tighter">Turn <span className="text-orange-500">Selector.</span></h2>
              <p className="text-gray-400 text-sm max-w-xl leading-relaxed">
                Determine your payout position through our decentralized, verifiable card selection system. 100% transparent and tamper-proof.
              </p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const turns = Array.from({ length: 10 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
                setRaffleCards(Array.from({ length: 10 }, (_, i) => ({ id: i, turn: turns[i], isFlipped: false })));
              }}
              className="px-8 py-5 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-orange-500/20 hover:bg-orange-600 transition-all"
            >
              Initialize New Simulation
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {raffleCards.length === 0 ? (
             <div className="col-span-full py-20 text-center bg-gradient-to-br from-slate-50 to-white rounded-3xl border-2 border-dashed border-gray-100">
                <Trophy className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 font-bold">Click "Reset Demo Cards" to start the simulation</p>
             </div>
          ) : (
            raffleCards.map(card => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: card.id * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                   const newCards = raffleCards.map(c => c.id === card.id ? { ...c, isFlipped: true } : c);
                   setRaffleCards(newCards);
                }}
                className="aspect-[3/4] cursor-pointer group perspective-1000"
              >
                <div className={`relative w-full h-full transition-all duration-700 preserve-3d shadow-xl rounded-2xl ${card.isFlipped ? 'rotate-y-180' : ''}`}>
                  {/* Front */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-2xl flex flex-col items-center justify-center border-4 border-white/20 backface-hidden overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.2),transparent)]" />
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform backdrop-blur-sm">
                      <Zap className="w-8 h-8 text-white/50" />
                    </div>
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter">Efado Secure</span>
                  </div>
                  {/* Back */}
                  <div className="absolute inset-0 bg-white rounded-2xl flex flex-col items-center justify-center border-4 border-indigo-600 rotate-y-180 backface-hidden shadow-inner overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600/10" />
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Cycle Turn</p>
                    <p className="text-6xl font-black text-indigo-600 tracking-tighter">{card.turn}</p>
                    <div className="mt-4 px-3 py-1 bg-indigo-50 rounded-full">
                       <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Verified</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600/10" />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <div className="p-8 bg-gradient-to-br from-slate-50 via-white to-slate-50/50 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-black text-gray-900 mb-6 tracking-tight">How it works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="space-y-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black shadow-sm">1</div>
                <h4 className="font-extrabold text-gray-900">Randomized Selection</h4>
                <p className="text-xs text-gray-500 leading-relaxed">Each member picks a card. The position behind the card is pre-randomized but hidden using a secure hashing algorithm.</p>
             </div>
             <div className="space-y-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center font-black shadow-sm">2</div>
                <h4 className="font-extrabold text-gray-900">Transparent Payout</h4>
                <p className="text-xs text-gray-500 leading-relaxed">The turns revealed determine exactly which cycle index each member will receive their payout pooled from all contributions.</p>
             </div>
             <div className="space-y-3">
                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center font-black shadow-sm">3</div>
                <h4 className="font-extrabold text-gray-900">Instant Verification</h4>
                <p className="text-xs text-gray-500 leading-relaxed">Once all cards are flipped, the payout order is locked into the group's ledger, ensuring no manual tampering can occur.</p>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCommunity = () => {
    if (!selectedGroup) {
      return (
        <div className="p-12 bg-gradient-to-br from-slate-50 via-white to-slate-50/50 rounded-3xl border border-gray-100 text-center">
          <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No Group Selected</h3>
          <p className="text-gray-500 text-sm mb-6">Select an active cycle to enter the community forum.</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-2xl overflow-hidden flex flex-col h-[75vh]">
        {/* Chat Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedGroup(null)}
              className="md:hidden p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-gray-900 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 rounded-[1.25rem] bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100">
              {selectedGroup.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-gray-900">{selectedGroup.name}</h3>
                <button 
                  onClick={() => setSelectedGroup(null)}
                  className="hidden md:flex items-center gap-1 text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-600 transition-colors bg-indigo-50 px-2 py-0.5 rounded-full"
                >
                  <X className="w-2.5 h-2.5" /> Close Chat
                </button>
              </div>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                12 Agents active in nexus
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-200 rounded-xl text-gray-600 transition-colors">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-gray-200 rounded-xl text-gray-600 transition-colors">
              <Video className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-gray-200 rounded-xl text-gray-600 transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm italic">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.senderId === user.uid;
              return (
                <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${isMe ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none' : 'bg-gray-100 text-gray-900 rounded-2xl rounded-tl-none'} p-4 shadow-sm`}>
                    {!isMe && <p className="text-[10px] font-black uppercase mb-1 opacity-50">{msg.senderName}</p>}
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p className={`text-[8px] mt-1 font-bold uppercase ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                      {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-200">
            <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
              <Smile className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..." 
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-gray-950 font-bold placeholder:text-gray-400"
            />
            <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
              <Camera className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
              <Mic className="w-5 h-5" />
            </button>
            <button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 right-0 w-[50%] h-[50%] bg-indigo-100/30 rounded-full blur-[120px] -mr-[25%] -mt-[25%] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[40%] h-[40%] bg-purple-100/30 rounded-full blur-[120px] -ml-[20%] -mb-[20%] pointer-events-none" />
      
      {/* Fanciful Sidebar */}
      <motion.aside 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-full md:w-80 h-screen sticky top-0 bg-white/70 backdrop-blur-3xl border-r border-white/40 p-8 flex flex-col gap-8 z-50 shadow-[20px_0_40px_rgba(0,0,0,0.02)] hidden md:flex"
      >
        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tighter leading-none">Hubs<span className="text-indigo-600 italic">Connect.</span></h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Community Nexus</p>
          </div>
        </div>

        <nav className="space-y-1.5 overflow-y-auto no-scrollbar py-4">
          {[
            { id: 'HOME', label: 'Overview', icon: Users },
            { id: 'CSCC', label: 'Savings Hub', icon: TrendingUp },
            { id: 'CSCC_PLUS', label: 'CSCC PLUS', icon: Trophy },
            { id: 'GROUPS', label: 'Admin Ops', icon: ShieldCheck },
            { id: 'WALLETS', label: 'Financials', icon: Wallet },
            { id: 'CENTRAL', label: 'Active Arena', icon: Zap },
            { id: 'COMMUNITY', label: 'Group Feed', icon: MessageSquare },
            { id: 'RAFFLE', label: 'Raffle Draw', icon: Trophy },
            { id: 'PARTNERS', label: 'Partner Hub', icon: Store },
            { id: 'SUPPORT', label: 'Help Desk', icon: HelpCircle },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 relative group overflow-hidden ${
                activeTab === item.id 
                  ? 'bg-gray-900 text-white shadow-xl shadow-gray-200 translate-x-2' 
                  : 'text-gray-500 hover:bg-white hover:text-indigo-600'
              }`}
            >
              <div className="flex items-center gap-4 relative z-10">
                <div className={`p-2 rounded-xl transition-colors ${
                  activeTab === item.id ? 'bg-indigo-500/20' : 'bg-gray-100 group-hover:bg-indigo-50'
                }`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
              </div>
              {activeTab === item.id && (
                <motion.div 
                  layoutId="activeIndicator"
                  className="w-1.5 h-6 bg-indigo-500 rounded-full relative z-10" 
                />
              )}
              {activeTab !== item.id && (
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 pointer-events-none" />
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto p-6 bg-gray-900 rounded-[2.5rem] text-white relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/40 transition-all duration-700" />
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">System Integrity</p>
          <div className="flex items-center gap-3 mb-4 transition-transform group-hover:translate-x-1">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <span className="text-sm font-bold">VERIFIED 01</span>
          </div>
          <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '85%' }}
              className="h-full bg-indigo-500 rounded-full" 
            />
          </div>
          <p className="text-[8px] text-gray-500 mt-2 font-mono">ENCRYPTED_SESSION_ID: EF_{Math.random().toString(36).substring(7).toUpperCase()}</p>
        </div>
      </motion.aside>

      {/* Mobile Top Navigation */}
      <div className="md:hidden sticky top-0 z-50 bg-white/70 backdrop-blur-3xl border-b border-gray-100 p-4 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            <h1 className="text-lg font-black text-gray-900 tracking-tighter">Hubs<span className="text-indigo-600 italic">Connect.</span></h1>
         </div>
         <select 
            value={activeTab} 
            onChange={(e) => setActiveTab(e.target.value as any)}
            className="bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border-none outline-none"
         >
            <option value="HOME">HOME</option>
            <option value="CSCC">SAVINGS</option>
            <option value="CSCC_PLUS">CSCC PLUS</option>
            <option value="CENTRAL">ARENA</option>
            <option value="COMMUNITY">FEED</option>
            <option value="RAFFLE">RAFFLE</option>
            <option value="PARTNERS">PARTNERS</option>
         </select>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 relative overflow-y-auto no-scrollbar bg-slate-50">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Internal Header for the current Tab */}
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-gray-100"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] bg-indigo-100/50 px-3 py-1 rounded-full border border-indigo-100">
                   {activeTab} Nexus
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-[0.9]">
                {activeTab === 'HOME' && "Global Overview."}
                {activeTab === 'CSCC' && "Collective Payouts."}
                {activeTab === 'CSCC_PLUS' && "Enhanced Capital."}
                {activeTab === 'CENTRAL' && "Active Operations."}
                {activeTab === 'COMMUNITY' && "Interactive Discourse."}
                {activeTab === 'RAFFLE' && "Decentralized Selection."}
                {activeTab === 'PARTNERS' && "Strategic Alliances."}
                {['GROUPS', 'WALLETS', 'SUPPORT'].includes(activeTab) && `${activeTab} Intelligence.`}
              </h1>
            </div>
            
            <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
               <div className="text-right">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Wallet Credits</p>
                  <p className="text-sm font-black text-indigo-600">{formatPrice(user.playerWallet)}</p>
               </div>
               <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <Wallet className="w-5 h-5" />
               </div>
            </div>
          </motion.header>

          {/* Tab Content Rendering */}
          {renderGuide()}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'HOME' && renderHome()}
              {activeTab === 'CSCC' && renderCSCC()}
              {activeTab === 'CSCC_PLUS' && renderCSCCPlus()}
              {activeTab === 'CENTRAL' && renderCentral()}
              {activeTab === 'COMMUNITY' && renderCommunity()}
              {activeTab === 'RAFFLE' && renderRaffle()}
              {activeTab === 'PARTNERS' && <VendorRegistration user={user} onSuccess={() => setActiveTab('HOME')} />}
              
              {activeTab === 'SUPPORT' ? (
                <div className="p-12 md:p-20 bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/50 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />
                  <Mail className="w-16 h-16 text-indigo-400 mx-auto mb-6" />
                  <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Support Intelligence Hub</h3>
                  <p className="text-gray-400 max-w-md mx-auto font-medium mb-12">Connect with our strategic support officers for all Community & CSCC inquiries.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12 text-left">
                    <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-emerald-500" />
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Headquarters</h4>
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed">
                        {OFFICE_ADDRESSES.HEAD_OFFICE}
                      </p>
                    </div>
                    <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-indigo-500" />
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Global Contact</h4>
                      </div>
                      <p className="text-lg font-black text-indigo-600 tracking-tighter">
                        {PHONE_NUMBERS.CONTACT_3}
                      </p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Available 24/7 Tactical Support</p>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 inline-block">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-left">Primary Support Frequency</p>
                    <p className="text-lg font-black text-indigo-600 mb-6">{SUPPORT_EMAILS.COMMUNITY_HUBS}</p>
                    <button 
                      onClick={() => window.location.href = `mailto:${SUPPORT_EMAILS.COMMUNITY_HUBS}`}
                      className="px-10 py-4 bg-gray-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
                    >
                      <Mail className="w-4 h-4" /> Launch Direct Support
                    </button>
                  </div>
                </div>
              ) : ['GROUPS', 'WALLETS'].includes(activeTab) && (
                <div className="p-20 bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/50 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />
                  <ShieldCheck className="w-16 h-16 text-indigo-200 mx-auto mb-6" />
                  <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">{activeTab} Interface Locked</h3>
                  <p className="text-gray-400 max-w-md mx-auto font-medium">This module is protected by security level 04. Tactical data deployment in progress.</p>
                  <button 
                    onClick={() => setActiveTab('HOME')}
                    className="mt-8 px-8 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    Return to Overview
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
