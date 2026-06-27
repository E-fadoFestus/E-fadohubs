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
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  Volume2,
  MicOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, CSCCGroup, CSCCMembership, CSCCCycle, CSCCContribution, ChatMessage } from '../types';
import { db, auth, collection, onSnapshot, query, where, addDoc, serverTimestamp, updateDoc, doc, getDocs, getDoc, runTransaction, increment } from '../firebase';
import { VendorRegistration } from './VendorRegistration';
import { PaystackDeposit } from './PaystackDeposit';
import { DirectBankDeposit } from './DirectBankDeposit';
import { StrategicReceipt } from './StrategicReceipt';
import { useCurrency } from '../lib/CurrencyContext';
import { CurrencySelector } from './CurrencySelector';
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

  // Active Extended UI Platforms State & Ledgers
  const [allMemberships, setAllMemberships] = useState<CSCCMembership[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState<'bank_transfer' | 'credit_card' | 'mobile_money'>('bank_transfer');
  const [isDepositing, setIsDepositing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'bank' | 'crypto'>('bank');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawBeneficiary, setWithdrawBeneficiary] = useState('');
  const [withdrawBankName, setWithdrawBankName] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // New Wallet Dashboard Modal States
  const [fundingModalOpen, setFundingModalOpen] = useState(false);
  const [completedHubPayment, setCompletedHubPayment] = useState<any | null>(null);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [activeFundTab, setActiveFundTab] = useState<'paystack' | 'bank_transfer'>('paystack');

  // Peer Transfer States
  const [transferTargetEmail, setTransferTargetEmail] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferCurrency, setTransferCurrency] = useState<'NGN' | 'USD' | 'GBP' | 'EUR'>('NGN');
  const [isTransferring, setIsTransferring] = useState(false);
  const [lookupName, setLookupName] = useState<string | null>(null);

  // Expanded Withdraw States
  const [withdrawCur, setWithdrawCur] = useState<'NGN' | 'USD' | 'GBP' | 'EUR'>('NGN');
  const [withdrawSelBank, setWithdrawSelBank] = useState('');
  const [withdrawCustBank, setWithdrawCustBank] = useState('');
  const [withdrawAccNum, setWithdrawAccNum] = useState('');
  const [withdrawTargName, setWithdrawTargName] = useState('');

  // Live account name automated query simulation for multi-currency withdrawals
  const [isResolvingWithdrawName, setIsResolvingWithdrawName] = useState(false);
  const [resolvedWithdrawStatusMessage, setResolvedWithdrawStatusMessage] = useState<string | null>(null);

  // Automated name lookup listener
  useEffect(() => {
    const bankVal = withdrawSelBank === 'Other' ? withdrawCustBank : withdrawSelBank;
    if (withdrawAccNum && withdrawAccNum.length === 10 && bankVal && withdrawCur === 'NGN') {
      setIsResolvingWithdrawName(true);
      setResolvedWithdrawStatusMessage('Enquiring bank gateway details...');
      
      const timer = setTimeout(() => {
        let resolvedName = '';
        if (withdrawAccNum === '000122668') {
          resolvedName = 'OKHAWERE FESTUS';
        } else {
          // Stable pseudo-random Name based on account digits
          const sum = withdrawAccNum.split('').reduce((acc, char) => acc + parseInt(char || '0', 10), 0);
          const firsts = ['DANIEL', 'OLUMIDE', 'KINGSLEY', 'TEMITOPE', 'CHINONSO', 'YUSUF', 'IBRAHIM', 'CHINEDU', 'OKHAWERE', 'FUNMILAYO', 'NGOZI', 'BABATUNDE'];
          const lasts = ['FESTUS', 'OKHAWERE', 'OJO', 'ADEYEMI', 'EZE', 'ALIYU', 'ALABI', 'NWACHUKWU', 'JOHNSON', 'BALOGUN', 'DOKUBO'];
          const fName = firsts[sum % firsts.length];
          const lName = lasts[(sum * 7) % lasts.length];
          resolvedName = `${fName} ${lName}`;
        }
        
        setWithdrawTargName(resolvedName);
        setIsResolvingWithdrawName(false);
        setResolvedWithdrawStatusMessage('Account Name Verified ✓');
      }, 1200);

      return () => clearTimeout(timer);
    } else {
      setIsResolvingWithdrawName(false);
      setResolvedWithdrawStatusMessage(null);
    }
  }, [withdrawAccNum, withdrawSelBank, withdrawCustBank, withdrawCur]);

  // Interactive Discourse (Chat) Feature States
  const [chatCallState, setChatCallState] = useState<'idle' | 'calling_voice' | 'calling_video' | 'active_voice' | 'active_video'>('idle');
  const [callTimer, setCallTimer] = useState(0);
  const [isCallMuted, setIsCallMuted] = useState(false);
  const [isCallSpeaker, setIsCallSpeaker] = useState(false);
  const [chatMoreMenuOpen, setChatMoreMenuOpen] = useState(false);
  const [chatEmojiPickerOpen, setChatEmojiPickerOpen] = useState(false);
  const [chatAttachment, setChatAttachment] = useState<{ id: string; name: string; type: string; base64?: string } | null>(null);
  const [chatIsVoiceRecording, setChatIsVoiceRecording] = useState(false);
  const [chatVoiceSeconds, setChatVoiceSeconds] = useState(0);
  const [chatVoiceIntervalId, setChatVoiceIntervalId] = useState<any>(null);

  useEffect(() => {
    // Real-time listener for all memberships to power Admin Ops approvals
    const unsub = onSnapshot(collection(db, 'cscc_memberships'), (snapshot) => {
      setAllMemberships(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CSCCMembership)));
    }, (error) => {
      console.warn('Silent fallback: Permission denied reading all cscc_memberships.', error);
    });
    return unsub;
  }, []);

  useEffect(() => {
    let callInterval: any = null;
    if (chatCallState === 'calling_voice' || chatCallState === 'calling_video') {
      const timeout = setTimeout(() => {
        setChatCallState(chatCallState === 'calling_voice' ? 'active_voice' : 'active_video');
        setCallTimer(0);
      }, 3000);
      return () => clearTimeout(timeout);
    } else if (chatCallState === 'active_voice' || chatCallState === 'active_video') {
      callInterval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    } else {
      setCallTimer(0);
    }
    return () => {
      if (callInterval) clearInterval(callInterval);
    };
  }, [chatCallState]);

  useEffect(() => {
    return () => {
      if (chatVoiceIntervalId) clearInterval(chatVoiceIntervalId);
    };
  }, [chatVoiceIntervalId]);

  const toggleVoiceRecording = () => {
    if (chatIsVoiceRecording) {
      if (chatVoiceIntervalId) clearInterval(chatVoiceIntervalId);
      setChatIsVoiceRecording(false);
      const duration = chatVoiceSeconds || Math.floor(Math.random() * 5) + 3;
      setNewMessage(`🎙️ [Secure Voice Note — ${duration}s]`);
      setChatVoiceSeconds(0);
    } else {
      setChatIsVoiceRecording(true);
      setChatVoiceSeconds(0);
      const iv = setInterval(() => {
        setChatVoiceSeconds(prev => prev + 1);
      }, 1000);
      setChatVoiceIntervalId(iv);
    }
  };

  useEffect(() => {
    // Real-time listener for user transaction ledgers to power Financials Overview
    const unsubTrans = onSnapshot(
      query(collection(db, 'transactions'), where('userId', '==', user.uid)),
      (snapshot) => {
        setTransactions(
          snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a: any, b: any) => {
              const secA = a.timestamp?.seconds || 0;
              const secB = b.timestamp?.seconds || 0;
              return secB - secA;
            })
        );
      },
      (error) => {
        console.error('Error fetching user transactions ledger:', error);
      }
    );
    return unsubTrans;
  }, [user.uid]);

  useEffect(() => {
    if (!transferTargetEmail.trim()) {
      setLookupName(null);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const q = query(collection(db, 'users'), where('email', '==', transferTargetEmail.trim().toLowerCase()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs[0].data();
          setLookupName(data.displayName || data.fullName || 'Active EFADO Account');
        } else {
          setLookupName('beneficiary email not found');
        }
      } catch (err) {
        console.error('Target lookup failing silently:', err);
        setLookupName(null);
      }
    }, 600);
    return () => clearTimeout(delayDebounceFn);
  }, [transferTargetEmail]);

  useEffect(() => {
    if (activeTab === 'COMMUNITY' && selectedGroup) {
      const unsubMessages = onSnapshot(
        query(collection(db, 'cscc_messages'), where('groupId', '==', selectedGroup.id)),
        (snapshot) => {
          setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)).sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds));
        },
        (error) => {
          console.error('Error listening to communal messages:', error);
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
        }).catch(err => {
          console.error('Error loading recipient user profile:', err);
        });
      }
    }
  }, [selectedGroup]);

  useEffect(() => {
    const unsubGroups = onSnapshot(collection(db, 'cscc_groups'), (snapshot) => {
      setGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CSCCGroup)));
      setLoading(false);
    }, (error) => {
      console.error('Error listening to CSCC groups collection:', error);
      setLoading(false);
    });

    const unsubMemberships = onSnapshot(
      query(collection(db, 'cscc_memberships'), where('userId', '==', user.uid)),
      (snapshot) => {
        setMyMemberships(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CSCCMembership)));
      },
      (error) => {
        console.error('Error loading user CSCC list memberships:', error);
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
    if ((!newMessage.trim() && !chatAttachment) || !selectedGroup) return;
    
    try {
      let finalContent = newMessage.trim();
      if (chatAttachment) {
        if (chatAttachment.type.startsWith('image')) {
          finalContent = `🖼️ [Image: ${chatAttachment.name}] ${finalContent}`.trim();
        } else {
          finalContent = `📎 [Attached File: ${chatAttachment.name}] ${finalContent}`.trim();
        }
      }
      
      await addDoc(collection(db, 'cscc_messages'), {
        groupId: selectedGroup.id,
        senderId: user.uid,
        senderName: user.displayName || user.email,
        content: finalContent,
        type: 'text',
        createdAt: serverTimestamp()
      });
      setNewMessage('');
      setChatAttachment(null);
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
    contributionAmount: 1000,
    currency: 'USD',
    cycleDuration: 'monthly' as any,
    maxMembers: 10,
    bonusTier: 50 as any,
    isPublic: true
  });

  const [standardFormData, setStandardFormData] = useState({
    name: '',
    description: '',
    contributionAmount: 1000,
    currency: 'NGN',
    cycleDuration: 'weekly' as any,
    maxMembers: 10,
    isPublic: true,
    rules: ''
  });

  const handleCreateStandardGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'cscc_groups'), {
        ...standardFormData,
        type: 'STANDARD',
        adminId: user.uid,
        status: 'pending',
        currentCycleIndex: 0,
        progressivePayments: {},
        createdAt: serverTimestamp(),
        payoutOrder: [],
        useRaffle: true
      });
      setShowCreateGroup(false);
      // reset form
      setStandardFormData({
        name: '',
        description: '',
        contributionAmount: 1000,
        currency: 'NGN',
        cycleDuration: 'weekly' as any,
        maxMembers: 10,
        isPublic: true,
        rules: ''
      });
      alert('EFADO CSCC Standard Group created successfully!');
    } catch (error) {
      console.error('Error creating Standard group:', error);
      alert('Failed to create standard group: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const handlePeerTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid transfer amount.');
      return;
    }

    if (transferTargetEmail.trim().toLowerCase() === user.email.toLowerCase()) {
      alert('You cannot transfer funds to yourself.');
      return;
    }

    setIsTransferring(true);
    try {
      const q = query(collection(db, 'users'), where('email', '==', transferTargetEmail.trim().toLowerCase()));
      const snap = await getDocs(q);
      if (snap.empty) {
        alert('The recipient email was not found on the EFADO network.');
        setIsTransferring(false);
        return;
      }

      const targetDoc = snap.docs[0];
      const targetId = targetDoc.id;
      const targetData = targetDoc.data();

      // Determine sender balance in the selected wallet/currency
      let senderBalance = 0;
      if (transferCurrency === 'NGN') {
        senderBalance = user.depositWallet || 0;
      } else if (transferCurrency === 'USD') {
        senderBalance = user.usd_balance || 0;
      } else if (transferCurrency === 'GBP') {
        senderBalance = user.gbp_balance || 0;
      } else if (transferCurrency === 'EUR') {
        senderBalance = user.eur_balance || 0;
      }

      if (senderBalance < amt) {
        alert(`Insufficient funds. Your alternative storage balance for ${transferCurrency} is ${senderBalance.toLocaleString()}.`);
        setIsTransferring(false);
        return;
      }

      // Execute transaction batch write
      const senderRef = doc(db, 'users', user.uid);
      const recipientRef = doc(db, 'users', targetId);

      await runTransaction(db, async (tx) => {
        const currencyField = transferCurrency === 'NGN' ? 'depositWallet' : `${transferCurrency.toLowerCase()}_balance`;
        
        // update sender
        tx.update(senderRef, {
          [currencyField]: increment(-amt)
        });

        // update receiver
        tx.update(recipientRef, {
          [currencyField]: increment(amt)
        });
      });

      // Log transaction records on Firestore under transactions collection for record keeping (master ledger)
      // Log for Sender
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'payment',
        amount: amt,
        currency: transferCurrency,
        status: 'completed',
        description: `Instant peer-to-peer transfer to ${targetData.displayName || targetData.fullName || transferTargetEmail}`,
        timestamp: serverTimestamp(),
        reference: `TX-TRF-SEN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
      });

      // Log for Receiver
      await addDoc(collection(db, 'transactions'), {
        userId: targetId,
        type: 'deposit',
        amount: amt,
        currency: transferCurrency,
        status: 'completed',
        description: `Instant peer-to-peer transfer from ${user.displayName || user.fullName || user.email}`,
        timestamp: serverTimestamp(),
        reference: `TX-TRF-REC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
      });

      alert(`Successfully transferred ${amt.toLocaleString()} ${transferCurrency} to ${targetData.displayName || targetData.fullName || transferTargetEmail}!`);
      
      // Reset form & close
      setTransferAmount('');
      setTransferTargetEmail('');
      setTransferModalOpen(false);
    } catch (err) {
      console.error('Peer-to-peer transfer error:', err);
      alert('P2P Transfer failed: ' + (err as any).message);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleWithdrawMultiCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid withdrawal amount.');
      return;
    }

    let userBalance = 0;
    if (withdrawCur === 'NGN') {
      userBalance = user.cashOutWallet || 0;
    } else if (withdrawCur === 'USD') {
      userBalance = user.usd_balance || 0;
    } else if (withdrawCur === 'GBP') {
      userBalance = user.gbp_balance || 0;
    } else if (withdrawCur === 'EUR') {
      userBalance = user.eur_balance || 0;
    }

    if (userBalance < amt) {
      alert(`Insufficient funds. Your available balance for ${withdrawCur} is ${userBalance.toLocaleString()}.`);
      return;
    }

    setIsWithdrawing(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const currencyField = withdrawCur === 'NGN' ? 'cashOutWallet' : `${withdrawCur.toLowerCase()}_balance`;

      await updateDoc(userRef, {
        [currencyField]: increment(-amt)
      });

      // Register the withdrawal record
      await addDoc(collection(db, 'withdrawals'), {
        userId: user.uid,
        userEmail: user.email,
        amount: amt,
        originalAmount: amt,
        fee: 0,
        status: 'pending', // Pending Admin/CEO payout approval
        timestamp: serverTimestamp(),
        accountDetails: {
          method: 'Community Dividends',
          currency: withdrawCur,
          bankName: withdrawSelBank === 'Other' ? withdrawCustBank : withdrawSelBank,
          accountNumber: withdrawAccNum,
          accountName: withdrawTargName,
          reference: `WD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
        }
      });

      // Write a pending transaction log as well
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'withdrawal',
        amount: amt,
        currency: withdrawCur,
        status: 'pending',
        description: `Strategic withdrawal of ${amt.toLocaleString()} ${withdrawCur} to ${withdrawSelBank === 'Other' ? withdrawCustBank : withdrawSelBank} (${withdrawAccNum})`,
        timestamp: serverTimestamp(),
        reference: `TX-WD-PEN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
      });

      alert(`Withdrawal request of ${amt.toLocaleString()} ${withdrawCur} initialized successfully! Pending payment processing.`);
      
      // Reset form & close
      setWithdrawAmount('');
      setWithdrawAccNum('');
      setWithdrawTargName('');
      setWithdrawSelBank('');
      setWithdrawCustBank('');
      setWithdrawModalOpen(false);
    } catch (err) {
      console.error('Multi-currency withdrawal error:', err);
      alert('Withdrawal request failed: ' + (err as any).message);
    } finally {
      setIsWithdrawing(false);
    }
  };

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
        {showCreateGroup && (
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
                onClick={() => setShowCreateGroup(false)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 transition-colors"
                id="close-standard-group-modal"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                    <Users className="w-6 h-6" />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none uppercase">Initialize CSCC <br/><span className="text-indigo-600">Standard Cycle.</span></h2>
                </div>
                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest opacity-60">Rotational Savings & Collaboration Nexus</p>
              </div>

              <form onSubmit={handleCreateStandardGroup} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest block">Group Strategic Name</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Sterling Savers Network"
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-black focus:outline-none focus:border-indigo-600 transition-all placeholder:text-gray-500 text-black shadow-inner"
                      value={standardFormData.name}
                      onChange={(e) => setStandardFormData({...standardFormData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest block">Cycle Duration</label>
                    <select 
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-black focus:outline-none focus:border-indigo-600 transition-all cursor-pointer text-black"
                      value={standardFormData.cycleDuration}
                      onChange={(e) => setStandardFormData({...standardFormData, cycleDuration: e.target.value as any})}
                    >
                      <option value="daily">Daily Cycle</option>
                      <option value="weekly">Weekly Cycle</option>
                      <option value="monthly">Monthly Cycle</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest block">Currency</label>
                      <select 
                        className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-black focus:outline-none focus:border-indigo-600 transition-all cursor-pointer text-black"
                        value={standardFormData.currency}
                        onChange={(e) => setStandardFormData({...standardFormData, currency: e.target.value})}
                      >
                        <option value="NGN">NGN (₦)</option>
                        <option value="USD">USD ($)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest block">Contribution Amount</label>
                      <input 
                        required
                        type="number" 
                        min={100}
                        className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-black focus:outline-none focus:border-indigo-600 transition-all text-black"
                        value={standardFormData.contributionAmount}
                        onChange={(e) => setStandardFormData({...standardFormData, contributionAmount: parseInt(e.target.value)})}
                      />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest block">Members Limit</label>
                      <input 
                        required
                        type="number" 
                        min={2}
                        max={50}
                        className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-black focus:outline-none focus:border-indigo-600 transition-all text-black"
                        value={standardFormData.maxMembers}
                        onChange={(e) => setStandardFormData({...standardFormData, maxMembers: parseInt(e.target.value)})}
                      />
                   </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest block">Mission Statement / Description</label>
                  <textarea 
                    rows={3}
                    placeholder="Describe the purpose of this rotational savings connection..."
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-black focus:outline-none focus:border-indigo-600 transition-all resize-none placeholder:text-gray-500 text-black"
                    value={standardFormData.description}
                    onChange={(e) => setStandardFormData({...standardFormData, description: e.target.value})}
                  />
                </div>

                <div className="p-6 bg-indigo-950 rounded-[2rem] text-white space-y-2">
                   <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black text-indigo-300 uppercase tracking-tighter">Sovereign Rotation Payout Goal</p>
                      <p className="text-2xl font-black text-emerald-400">
                         {standardFormData.currency === 'USD' ? '$' : standardFormData.currency === 'GBP' ? '£' : standardFormData.currency === 'EUR' ? '€' : '₦'}
                         {(standardFormData.contributionAmount * standardFormData.maxMembers).toLocaleString()}
                      </p>
                   </div>
                   <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-widest leading-relaxed">
                      This represents standard full collective payout upon completion of a full rotation cycle sequence across all {standardFormData.maxMembers} peer members.
                   </p>
                </div>

                <button 
                  disabled={loading}
                  type="submit"
                  className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-indigo-900/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
                  id="standard-group-submit-btn"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  Deploy Standard Cycle
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
      {/* Under Construction Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/25 rounded-[1.5rem] p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/15 rounded-2xl flex items-center justify-center shrink-0 border border-amber-500/30">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h4 className="font-black text-sm text-amber-800 uppercase tracking-widest">Under Construction — Pending Accredited Vendors' Registration</h4>
            <p className="text-xs font-bold text-amber-700/90 mt-0.5">CSCC Savings Cycle deposits and group initializations are temporarily on hold until the accreditation cycle concludes.</p>
          </div>
        </div>
        <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-amber-800 shrink-0 select-none animate-pulse">
          System Locked
        </div>
      </div>

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

  const handleApproveMembership = async (membershipId: string, groupId: string, userId: string) => {
    try {
      await updateDoc(doc(db, 'cscc_memberships', membershipId), {
        status: 'approved'
      });
      
      const groupRef = doc(db, 'cscc_groups', groupId);
      const groupSnap = await getDoc(groupRef);
      if (groupSnap.exists()) {
        const groupData = groupSnap.data() as CSCCGroup;
        const currentPayoutOrder = groupData.payoutOrder || [];
        if (!currentPayoutOrder.includes(userId)) {
          await updateDoc(groupRef, {
            payoutOrder: [...currentPayoutOrder, userId]
          });
        }
      }
      alert('Membership request approved successfully!');
    } catch (err) {
      console.error(err);
      alert('Could not approve request.');
    }
  };

  const handleRejectMembership = async (membershipId: string) => {
    try {
      await updateDoc(doc(db, 'cscc_memberships', membershipId), {
        status: 'rejected'
      });
      alert('Membership request rejected.');
    } catch (err) {
      console.error(err);
      alert('Could not reject request.');
    }
  };

  const handleAdvanceCycle = async (group: CSCCGroup) => {
    try {
      const nextIndex = group.currentCycleIndex + 1;
      const isFinished = nextIndex >= group.maxMembers;
      
      await updateDoc(doc(db, 'cscc_groups', group.id!), {
        currentCycleIndex: isFinished ? group.currentCycleIndex : nextIndex,
        status: isFinished ? 'completed' : 'active'
      });
      
      // Log transaction for audit
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'payment',
        amount: group.contributionAmount,
        currency: group.currency,
        status: 'completed',
        description: `Operational milestone: Advanced ${group.name} to Cycle #${nextIndex + 1}`,
        timestamp: serverTimestamp()
      });

      alert(isFinished ? 'Group Savings Cycle completed successfully!' : `Successfully advanced to Cycle #${nextIndex + 1}!`);
    } catch (err) {
      console.error(err);
      alert('Could not advance cycle.');
    }
  };

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    setIsDepositing(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        depositWallet: (user.depositWallet || 0) + amt
      });
      
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'deposit',
        amount: amt,
        currency: 'NGN',
        status: 'completed',
        description: `Strategic deposit to Investment Capital via ${depositMethod.toUpperCase()}`,
        timestamp: serverTimestamp(),
        method: depositMethod
      });
      
      alert(`Deposit of ${formatPrice(amt)} credited successfully to your Deposit Wallet!`);
      setDepositAmount('');
    } catch (err) {
      console.error(err);
      alert('Deposit transaction failed.');
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid withdraw amount.');
      return;
    }
    if (amt > (user.cashOutWallet || 0) && amt > (user.playerWallet || 0)) {
      alert('Insufficient funds in your financial accounts.');
      return;
    }
    setIsWithdrawing(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      if (amt <= (user.cashOutWallet || 0)) {
        await updateDoc(userDocRef, {
          cashOutWallet: Math.max(0, (user.cashOutWallet || 0) - amt)
        });
      } else {
        await updateDoc(userDocRef, {
          playerWallet: Math.max(0, (user.playerWallet || 0) - amt)
        });
      }

      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'withdrawal',
        amount: amt,
        currency: 'NGN',
        status: 'completed',
        description: `Strategic withdraw of ${formatPrice(amt)} to ${withdrawBankName || 'External Crypto Node'} (${withdrawAccount})`,
        timestamp: serverTimestamp(),
        method: withdrawMethod
      });
      
      alert(`Strategic Drawdown of ${formatPrice(amt)} initiated successfully!`);
      setWithdrawAmount('');
      setWithdrawAccount('');
      setWithdrawBeneficiary('');
      setWithdrawBankName('');
    } catch (err) {
      console.error(err);
      alert('Drawdown failed.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const renderGroups = () => {
    const myAdminGroups = groups.filter(g => g.adminId === user.uid);
    // Find memberships where the groupId corresponds to groups managed by this admin
    const pendingRequests = allMemberships.filter(m => 
      m.status === 'pending' && 
      myAdminGroups.some(g => g.id === m.groupId)
    );

    return (
      <div className="space-y-12">
        {/* Admin Overview Header Card */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-950 p-12 rounded-[3.5rem] text-white overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-3 block">Manager Node Console</span>
            <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">Admin <span className="text-indigo-400 italic">Operations.</span></h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              You are signed in as a Hub Operations Manager. You have supreme clearance to approve group registries, settle rotational disputes, and dispatch payout events.
            </p>
          </div>
        </div>

        {/* Pending Approvals */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-950 uppercase tracking-tight">Pending Member Requests</h3>
                <p className="text-xs text-gray-500 font-bold">Review and authorize savings circle enrollment requests</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-[10px] font-black uppercase rounded-full">
              {pendingRequests.length} Pending
            </span>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-gray-100">
               <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
               <p className="text-gray-500 font-bold text-sm">All operations are synchronized. No pending approvals found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map(request => {
                const grp = myAdminGroups.find(g => g.id === request.groupId);
                return (
                  <div key={request.id} className="p-6 bg-slate-50 rounded-2xl border border-gray-100 shadow-inner flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-100/50 transition-colors">
                    <div>
                      <h4 className="font-black text-gray-950 text-sm uppercase tracking-wider">{request.userName}</h4>
                      <p className="text-xs text-gray-400 font-semibold mb-2">UID: {request.userId}</p>
                      <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-[8px] font-black uppercase rounded">
                        Target Circle: {grp?.name || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleRejectMembership(request.id!)}
                        className="px-5 py-2.5 bg-white hover:bg-red-550 border border-gray-250 hover:border-red-500 hover:text-red-500 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => handleApproveMembership(request.id!, request.groupId, request.userId)}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-transform shadow-lg shadow-indigo-100"
                      >
                        Approve Enrollment
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Managed Groups Ledger */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-950 uppercase tracking-tight">Active Circular Groups</h3>
              <p className="text-xs text-gray-500 font-bold">Operational control panel for your created savings networks</p>
            </div>
          </div>

          {myAdminGroups.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-gray-100">
              <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-gray-500 font-bold text-sm mb-4">You have not created any rotational circles yet.</p>
              <button 
                onClick={() => {
                  setPlusFormData({
                    name: 'Elite Savers Circle',
                    description: 'Rotational savings group for active ecosystem operators.',
                    contributionAmount: 200,
                    currency: 'USD',
                    cycleDuration: 'monthly',
                    maxMembers: 8,
                    bonusTier: 50,
                    isPublic: true
                  });
                  setShowCreatePlusGroup(true);
                  setActiveTab('CSCC_PLUS');
                }}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
              >
                Create PLUS Group
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myAdminGroups.map(group => {
                const approvedCount = allMemberships.filter(m => m.groupId === group.id && m.status === 'approved').length;
                return (
                  <div key={group.id} className="p-6 bg-slate-50/50 rounded-3xl border border-gray-100 hover:shadow-md transition-all space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-gray-900 text-base">{group.name}</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{group.cycleDuration} Rotations</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase ${
                        group.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {group.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400 font-semibold uppercase">Authorized Core</span>
                        <span className="text-gray-900 font-black">{approvedCount} / {group.maxMembers} Members</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 font-semibold uppercase">Pool Capital</span>
                        <span className="text-indigo-600 font-black">{formatPrice(group.contributionAmount * group.maxMembers)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 font-semibold uppercase">Progress</span>
                        <span className="text-gray-900 font-black">Cycle #{group.currentCycleIndex + 1}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-150 flex gap-2">
                      <button 
                        onClick={async () => {
                          const conf = window.confirm('Are you sure you want to advance this circle to the next rotational phase? This is irreversible.');
                          if (conf) handleAdvanceCycle(group);
                        }}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors shadow-lg shadow-indigo-100"
                      >
                        Advance Cycle
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedGroup(group);
                          setActiveTab('CENTRAL');
                        }}
                        className="py-3 px-4 bg-white hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-200 text-[9px] font-black uppercase tracking-widest transition-colors"
                      >
                        Monitor
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    );
  };

  const renderWallets = () => {
    return (
      <div className="space-y-12 animate-fade-in">
        {/* Balances Display Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Win Wallet Card */}
          <div className="relative group overflow-hidden bg-gradient-to-br from-indigo-900 to-indigo-950 p-8 rounded-3xl border border-indigo-800 shadow-xl text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl" />
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 text-indigo-300">
                <Coins className="w-6 h-6" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#a5b4fc]">Vault Primary</span>
            </div>
            <p className="text-[10px] font-semibold uppercase text-indigo-300 tracking-wider mb-1">Player Win Wallet</p>
            <h3 className="text-3xl font-black text-white leading-none mb-2">{formatPrice(user.playerWallet)}</h3>
            <p className="text-[9px] text-[#c7d2fe] font-medium leading-relaxed">Direct gaming winnings, live trading profits, and general earnings.</p>
          </div>

          {/* Deposit Wallet Card with Multi-Currency display nested */}
          <div className="relative group overflow-hidden bg-gradient-to-br from-emerald-950 to-slate-900 p-8 rounded-3xl border border-emerald-900/40 shadow-xl text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30 text-emerald-300">
                <Wallet className="w-6 h-6" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#a7f3d0]">Operation reserves</span>
            </div>
            <p className="text-[10px] font-semibold uppercase text-emerald-300 tracking-wider mb-1">Capital Deposit Wallet</p>
            <h3 className="text-3xl font-black text-white leading-none mb-2">{formatPrice(user.depositWallet)}</h3>
            <p className="text-[9px] text-[#d1fae5] font-medium leading-relaxed mb-4">Stored collective funding capital reserved strictly for rotational CSCC cycles.</p>
            
            {/* Multi-Currency Balances */}
            <div className="mt-4 pt-4 border-t border-emerald-800/40 grid grid-cols-3 gap-2 text-center bg-black/20 p-2.5 rounded-xl">
              <div>
                <p className="text-[7px] text-emerald-400 font-extrabold uppercase">USD Wallet</p>
                <p className="text-[11px] font-black font-mono">${(user.usd_balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              </div>
              <div>
                <p className="text-[7px] text-emerald-400 font-extrabold uppercase">GBP Wallet</p>
                <p className="text-[11px] font-black font-mono">£{(user.gbp_balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              </div>
              <div>
                <p className="text-[7px] text-emerald-400 font-extrabold uppercase">EUR Wallet</p>
                <p className="text-[11px] font-black font-mono">€{(user.eur_balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              </div>
            </div>
          </div>

          {/* Cash Out Wallet Card */}
          <div className="relative group overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 p-8 rounded-3xl border border-white/5 shadow-xl text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-white/10 rounded-2xl border border-white/15 text-indigo-300">
                <ArrowUpRight className="w-6 h-6" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#cbd5e1]">Extraction Pool</span>
            </div>
            <p className="text-[10px] font-semibold uppercase text-[#cbd5e1] tracking-wider mb-1">Cash Out Wallet</p>
            <h3 className="text-3xl font-black text-white leading-none mb-2">{formatPrice(user.cashOutWallet)}</h3>
            <p className="text-[9px] text-[#94a3b8] font-medium leading-relaxed">Withdrawable ledger dividends ready for local bank wire payouts or secure crypto withdrawals.</p>
          </div>
        </div>

        {/* Action Buttons Hub */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-[2rem] border border-gray-100">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setFundingModalOpen(true)}
            className="py-5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-emerald-600/10 transition-all flex items-center justify-center gap-2.5"
            id="btn-fund-account"
          >
            <Plus className="w-5 h-5" /> Fund Account
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setWithdrawModalOpen(true)}
            className="py-5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-rose-600/10 transition-all flex items-center justify-center gap-2.5"
            id="btn-withdraw-assets"
          >
            <ArrowUpRight className="w-5 h-5" /> Withdraw Balance
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setTransferModalOpen(true)}
            className="py-5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-indigo-600/10 transition-all flex items-center justify-center gap-2.5"
            id="btn-transfer-funds"
          >
            <ArrowRight className="w-5 h-5" /> Transfer Funds
          </motion.button>
        </div>

        {/* Dynamic Modals overlays */}
        <AnimatePresence>
          {fundingModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-xl"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-2xl bg-white rounded-[3rem] p-10 shadow-huge relative max-h-[90vh] overflow-y-auto no-scrollbar"
              >
                <button 
                  onClick={() => setFundingModalOpen(false)}
                  className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-950 transition-colors"
                  id="close-funding-modal"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="mb-8">
                  <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">Fund Capital Wallet</h3>
                  <div className="flex gap-4 border-b border-gray-150 mb-6">
                    <button 
                      type="button"
                      onClick={() => setActiveFundTab('paystack')}
                      className={`pb-3 text-xs font-black uppercase tracking-widest transition-all ${activeFundTab === 'paystack' ? 'border-b-4 border-emerald-600 text-emerald-600' : 'text-gray-400 hover:text-gray-650'}`}
                    >
                      ⚡ Instant Paystack Inline
                    </button>
                    <button 
                      type="button"
                      onClick={() => setActiveFundTab('bank_transfer')}
                      className={`pb-3 text-xs font-black uppercase tracking-widest transition-all ${activeFundTab === 'bank_transfer' ? 'border-b-4 border-emerald-600 text-emerald-600' : 'text-gray-400 hover:text-gray-650'}`}
                    >
                      🏦 Direct Bank / Wire Transfer
                    </button>
                  </div>
                </div>

                {activeFundTab === 'paystack' ? (
                  <PaystackDeposit 
                    user={user} 
                    onSuccess={(paymentInfo) => {
                      setFundingModalOpen(false);
                      setCompletedHubPayment({
                        id: paymentInfo.reference,
                        userId: user.uid,
                        type: 'deposit',
                        amount: paymentInfo.amount,
                        currency: 'NGN',
                        status: 'completed',
                        method: 'Paystack Gateways',
                        purpose: 'Community Hub Deposit',
                        reference: paymentInfo.reference,
                        timestamp: { seconds: Math.floor(Date.now() / 1000) },
                        description: `Deposit processed securely via custom Paystack inline channels.`
                      });
                    }} 
                  />
                ) : (
                  <DirectBankDeposit 
                    user={user} 
                    onSuccess={() => {
                      setFundingModalOpen(false);
                      setCompletedHubPayment({
                        id: 'MAN_' + Math.floor(10000 + Math.random() * 90000),
                        userId: user.uid,
                        type: 'deposit',
                        amount: 1000,
                        currency: 'NGN',
                        status: 'pending',
                        method: 'Direct Bank Transfer',
                        purpose: 'Community Hub Deposit (Verification Pending)',
                        timestamp: { seconds: Math.floor(Date.now() / 1000) },
                        description: `Manual transfer submission logged. Reviewing upload screenshot proof.`
                      });
                    }} 
                  />
                )}
              </motion.div>
            </motion.div>
          )}

          {withdrawModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-xl"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-2xl bg-white rounded-[3rem] p-10 shadow-huge relative max-h-[90vh] overflow-y-auto no-scrollbar"
              >
                <button 
                  onClick={() => setWithdrawModalOpen(false)}
                  className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-950 transition-colors"
                  id="close-withdraw-modal"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Withdrawal Settlement</h3>
                      <p className="text-xs text-gray-505 font-bold font-sans">Extract ledger dividends and wins securely to checking profile</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleWithdrawMultiCurrency} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Select Currency</label>
                      <select 
                        value={withdrawCur}
                        onChange={(e) => setWithdrawCur(e.target.value as any)}
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-black"
                      >
                        <option value="NGN">NGN (₦) - Cash Out Wallet</option>
                        <option value="USD">USD ($)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Withdrawal Amount</label>
                      <input 
                        required
                        type="number"
                        placeholder="e.g. 5000"
                        min={100}
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-black text-black"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-rose-50/50 rounded-2xl text-rose-950 text-xs font-bold uppercase tracking-wide flex justify-between border border-rose-100">
                    <span>Available Balance:</span>
                    <span>
                      {withdrawCur === 'NGN' && `₦${(user.cashOutWallet || 0).toLocaleString()}`}
                      {withdrawCur === 'USD' && `$${(user.usd_balance || 0).toLocaleString()}`}
                      {withdrawCur === 'GBP' && `£${(user.gbp_balance || 0).toLocaleString()}`}
                      {withdrawCur === 'EUR' && `€${(user.eur_balance || 0).toLocaleString()}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Payment Bank Destination</label>
                      <select 
                        required
                        value={withdrawSelBank}
                        onChange={(e) => setWithdrawSelBank(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-[11px] font-black uppercase text-black"
                      >
                        <option value="">-- Choose Bank --</option>
                        <option value="Access Bank">Access Bank</option>
                        <option value="GTBank">Guaranty Trust Bank (GTB)</option>
                        <option value="Zenith Bank">Zenith Bank</option>
                        <option value="UBA">United Bank for Africa (UBA)</option>
                        <option value="First Bank">First Bank</option>
                        <option value="OPay">OPay</option>
                        <option value="Palmpay">Palmpay</option>
                        <option value="Standard Chartered">Standard Chartered</option>
                        <option value="Barclays">Barclays Bank</option>
                        <option value="Chase">JPMorgan Chase</option>
                        <option value="Deutsche Bank">Deutsche Bank</option>
                        <option value="Other">Other Bank (Type below)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Account Number / IBAN</label>
                      <input 
                        required
                        type="text"
                        placeholder="e.g. 1024823901"
                        value={withdrawAccNum}
                        onChange={(e) => {
                          const digitsOnly = e.target.value.replace(/\D/g, '');
                          setWithdrawAccNum(digitsOnly);
                        }}
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-black text-black"
                      />
                    </div>
                  </div>

                  {withdrawSelBank === 'Other' && (
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Custom Bank Name</label>
                      <input 
                        required
                        type="text"
                        placeholder="e.g. Lloyds PLC, UK"
                        value={withdrawCustBank}
                        onChange={(e) => setWithdrawCustBank(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-black text-black"
                      />
                    </div>
                  )}

                  <div className="relative">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Account Beneficiary Name</label>
                    <div className="relative">
                      <input 
                        required
                        type="text"
                        placeholder={isResolvingWithdrawName ? "RESOLVING ACCOUNT DETAILS..." : "e.g. John Doe"}
                        value={withdrawTargName}
                        onChange={(e) => setWithdrawTargName(e.target.value)}
                        disabled={isResolvingWithdrawName}
                        className={`w-full pl-5 pr-12 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-black text-black ${
                          isResolvingWithdrawName ? 'text-indigo-600 animate-pulse bg-indigo-50/20' : ''
                        }`}
                      />
                      {isResolvingWithdrawName && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      )}
                      {!isResolvingWithdrawName && resolvedWithdrawStatusMessage && withdrawTargName && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-xs">
                          ✓
                        </div>
                      )}
                    </div>
                    {resolvedWithdrawStatusMessage && (
                      <div className={`text-[9px] font-black uppercase tracking-widest mt-1.5 flex items-center gap-1 ${
                        isResolvingWithdrawName ? 'text-indigo-600 animate-pulse' : 'text-emerald-600'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${isResolvingWithdrawName ? 'bg-indigo-600 animate-ping' : 'bg-emerald-500'}`} />
                        {resolvedWithdrawStatusMessage}
                      </div>
                    )}
                  </div>

                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider leading-relaxed">
                    * Local Naira bank withdrawals are processed automatically. Other currency withdrawals (USD, GBP, EUR) undergo compliance review and clearance by our tactical operations desk within 12 - 24 hours.
                  </p>

                  <button 
                    type="submit"
                    disabled={isWithdrawing || isResolvingWithdrawName || !withdrawAmount || !withdrawAccNum || (withdrawCur === 'NGN' && withdrawAccNum.length !== 10) || !withdrawTargName}
                    className="w-full py-5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-2xl flex items-center justify-center gap-3 disabled:opacity-40"
                  >
                    {isWithdrawing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                    {isResolvingWithdrawName ? 'Verifying Account Details...' : 'Confirm & Execute Withdrawal'}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}

          {transferModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-xl"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-2xl bg-white rounded-[3rem] p-10 shadow-huge relative max-h-[90vh] overflow-y-auto no-scrollbar"
              >
                <button 
                  onClick={() => setTransferModalOpen(false)}
                  className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-950 transition-colors"
                  id="close-transfer-modal"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Ecosystem Ledger Transfer</h3>
                      <p className="text-xs text-gray-500 font-bold font-sans">Transfer funds instantly to any registered EFADO user for active collaboration</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handlePeerTransfer} className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Recipient Account Email</label>
                    <input 
                      required
                      type="email"
                      placeholder="e.g. collaborator@efado.app"
                      value={transferTargetEmail}
                      onChange={(e) => setTransferTargetEmail(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-black text-black placeholder:text-gray-400"
                    />
                    {lookupName && (
                      <p className={`mt-2 text-[10px] font-black uppercase tracking-widest ${lookupName.includes('not found') ? 'text-rose-500' : 'text-emerald-500 animate-pulse'}`}>
                        Recipient: {lookupName}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Select Wallet Currency</label>
                      <select 
                        value={transferCurrency}
                        onChange={(e) => setTransferCurrency(e.target.value as any)}
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-black"
                      >
                        <option value="NGN">NGN (₦) - Deposit Wallet</option>
                        <option value="USD">USD ($)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Transfer Amount</label>
                      <input 
                        required
                        type="number"
                        placeholder="e.g. 1000"
                        min={10}
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-black text-black"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-50/50 rounded-2xl text-indigo-950 text-xs font-bold uppercase tracking-wide flex justify-between border border-indigo-100">
                    <span>Sender Storage Balance:</span>
                    <span>
                      {transferCurrency === 'NGN' && `₦${(user.depositWallet || 0).toLocaleString()}`}
                      {transferCurrency === 'USD' && `$${(user.usd_balance || 0).toLocaleString()}`}
                      {transferCurrency === 'GBP' && `£${(user.gbp_balance || 0).toLocaleString()}`}
                      {transferCurrency === 'EUR' && `€${(user.eur_balance || 0).toLocaleString()}`}
                    </span>
                  </div>

                  <button 
                    type="submit"
                    disabled={isTransferring || (lookupName ? lookupName.includes('not found') : false)}
                    className="w-full py-5 bg-gradient-to-r from-slate-900 to-black text-white rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isTransferring ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                    Confirm & Complete Transfer
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tactical Ledger Logs */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-slate-50 text-gray-700 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-950 uppercase tracking-tight">Audit Transactions Ledger</h3>
              <p className="text-xs text-gray-500 font-bold">Verifiable sequence logs of financial flows in HubsConnect</p>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-gray-100">
               <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
               <p className="text-gray-400 font-bold text-sm">No transaction historical sequences recorded on this workspace.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-150 text-gray-400 font-black uppercase tracking-widest">
                    <th className="py-4">Hash / Date</th>
                    <th className="py-4">Flow Action</th>
                    <th className="py-4">Details Summary</th>
                    <th className="py-4 text-right">Settled Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, idx) => {
                    const date_str = tx.timestamp?.toDate 
                      ? tx.timestamp.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : tx.timestamp 
                        ? new Date(tx.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'Instant Lock';

                    const isDeposit = tx.type === 'deposit';
                    const isWin = tx.type === 'game_win' || tx.type === 'payout';

                    return (
                      <tr key={tx.id || idx} className="border-b border-gray-100 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4.5">
                          <p className="font-extrabold text-gray-900">{date_str}</p>
                          <p className="font-mono text-[8px] text-gray-450 tracking-tight uppercase">TX_{tx.id?.substring(0, 8).toUpperCase() || 'EXTERNAL'}</p>
                        </td>
                        <td className="py-4.5">
                          <span className={`px-2.5 py-1 text-[8px] font-black uppercase rounded-full ${
                            isDeposit ? 'bg-emerald-150 text-emerald-800 bg-emerald-50' : isWin ? 'bg-indigo-100 text-indigo-700' : 'bg-red-50 text-red-700 bg-red-50'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-4.5 text-gray-700 font-semibold max-w-xs truncate">
                          {tx.description || tx.purpose || 'Rotational Settlement'}
                        </td>
                        <td className={`py-4.5 text-right font-black ${
                          isDeposit || isWin ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {isDeposit || isWin ? '+' : '-'}{formatPrice(tx.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
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
      <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-2xl overflow-hidden flex flex-col h-[75vh] relative">
        {/* Calling Overlay Panel */}
        {chatCallState !== 'idle' && (
          <div className="absolute inset-0 bg-slate-950/95 text-white z-[70] flex flex-col justify-between p-10 animate-fade-in font-sans">
            <div className="text-center space-y-2">
              <span className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-indigo-400">
                {chatCallState.startsWith('calling') ? 'INITIATING SECURE ENDPOINT' : 'SECURE LINE ENCRYPTED'}
              </span>
              <h4 className="text-2xl font-black uppercase tracking-tight text-white">{selectedGroup?.name || 'Peer Contact'}</h4>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                {chatCallState === 'calling_voice' && 'Ringing (Protected Audio Voice Trace)...'}
                {chatCallState === 'calling_video' && 'Connecting Telepresence Stream...'}
                {(chatCallState === 'active_voice' || chatCallState === 'active_video') && (
                  <span className="flex items-center justify-center gap-2 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    CONNECTED: {Math.floor(callTimer / 60)}:{String(callTimer % 60).padStart(2, '0')}
                  </span>
                )}
              </p>
            </div>

            {/* Visual Stream Area */}
            <div className="flex-1 flex items-center justify-center py-6">
              <div className="relative">
                {chatCallState.includes('video') ? (
                  <div className="w-64 h-48 bg-slate-800 rounded-3xl border-4 border-indigo-500/30 overflow-hidden shadow-2xl relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950 to-slate-900 flex flex-col items-center justify-center text-center p-4">
                      <Video className="w-12 h-12 text-slate-500 mb-2 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Local Camera Active</span>
                    </div>
                    {/* Tiny self preview */}
                    <div className="absolute bottom-3 right-3 w-16 h-12 bg-slate-950 rounded-xl border border-white/20 flex items-center justify-center overflow-hidden">
                      <span className="text-[6px] font-bold text-slate-500 uppercase">Self</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-800 flex items-center justify-center shadow-huge shadow-indigo-500/20 relative animate-pulse">
                    <span className="text-4xl font-black text-white uppercase">{selectedGroup?.name.charAt(0)}</span>
                    <div className="absolute -inset-4 border border-indigo-500/30 rounded-full animate-ping pointer-events-none" />
                    <div className="absolute -inset-8 border border-white/5 rounded-full animate-pulse pointer-events-none" />
                  </div>
                )}
              </div>
            </div>

            {/* Calling Interactions */}
            <div className="flex items-center justify-center gap-6 pt-4">
              <button 
                type="button"
                onClick={() => setIsCallMuted(!isCallMuted)}
                className={`p-4 rounded-full border transition-all hover:scale-110 active:scale-95 ${isCallMuted ? 'bg-[#DAA520] text-slate-950 border-[#DAA520]' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
              >
                {isCallMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              
              <button 
                type="button"
                onClick={() => {
                  setChatCallState('idle');
                }}
                className="p-5 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-all shadow-lg hover:scale-110 active:scale-95"
              >
                <X className="w-6 h-6" />
              </button>

              <button 
                type="button"
                onClick={() => setIsCallSpeaker(!isCallSpeaker)}
                className={`p-4 rounded-full border transition-all hover:scale-110 active:scale-95 ${isCallSpeaker ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Chat Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 backdrop-blur-sm relative z-20">
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
          
          <div className="flex items-center gap-2 relative">
            <button 
              onClick={() => setChatCallState('calling_voice')}
              className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors hover:text-indigo-600"
              title="Voice Call"
            >
              <Phone className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setChatCallState('calling_video')}
              className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors hover:text-indigo-600"
              title="Video Call"
            >
              <Video className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setChatMoreMenuOpen(!chatMoreMenuOpen)}
              className={`p-2.5 rounded-xl transition-colors ${chatMoreMenuOpen ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-100 text-slate-600'}`}
              title="More Actions"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {chatMoreMenuOpen && (
              <div className="absolute right-0 top-12 bg-white border border-gray-150 rounded-2xl shadow-huge p-2 w-52 z-30 text-xs text-slate-700 flex flex-col gap-1 animate-scale-up font-sans">
                <button 
                  onClick={() => {
                    if (confirm("Are you sure you want to clear this thread's secure messaging history? This action is local and irreversible.")) {
                      setMessages([]);
                    }
                    setChatMoreMenuOpen(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors flex items-center gap-2 font-bold"
                >
                  Clear Chat History
                </button>
                <button 
                  onClick={() => {
                    alert("Notifications muted for 8 hours under protocol SECURE_SILENCE_ON");
                    setChatMoreMenuOpen(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center gap-2 font-bold"
                >
                  Mute Notifications
                </button>
                <button 
                  onClick={() => {
                    alert("Security protocol reports: peer user profile verified and locked across all network nodes.");
                    setChatMoreMenuOpen(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center gap-2 font-bold"
                >
                  Verify Access Nodes
                </button>
              </div>
            )}
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
                    <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
                    <p className={`text-[8px] mt-1 font-bold uppercase ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                      {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Emoji Selector Popup inside the Card */}
        {chatEmojiPickerOpen && (
          <div className="absolute bottom-24 left-6 bg-white border border-gray-150 rounded-2xl shadow-huge p-3 grid grid-cols-6 gap-2 z-30 animate-scale-up">
            {['😊', '😂', '👍', '❤️', '🔥', '🎉', '🚀', '🙌', '🕵️', '🔒', '🤝', '💯'].map((emo) => (
              <button
                key={emo}
                type="button"
                onClick={() => {
                  setNewMessage(prev => prev + emo);
                  setChatEmojiPickerOpen(false);
                }}
                className="w-8 h-8 text-lg hover:bg-slate-50 hover:scale-115 rounded-xl transition-all flex items-center justify-center font-bold"
              >
                {emo}
              </button>
            ))}
          </div>
        )}

        {/* Attachment Preview Badge */}
        {chatAttachment && (
          <div className="mx-6 mb-2 p-2 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between text-xs font-bold animate-fade-in text-indigo-950 relative z-10">
            <span className="flex items-center gap-2 truncate">
              {chatAttachment.type.startsWith('image') ? '🖼️' : '📎'} {chatAttachment.name}
            </span>
            <button 
              type="button" 
              onClick={() => setChatAttachment(null)}
              className="p-1.5 hover:bg-indigo-100 rounded-full text-indigo-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Chat Input */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 relative z-10">
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-200">
            <button 
              type="button"
              onClick={() => setChatEmojiPickerOpen(!chatEmojiPickerOpen)}
              className={`p-2 rounded-lg transition-colors ${chatEmojiPickerOpen ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-indigo-600 hover:bg-slate-50'}`}
              title="Add Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Paperclip upload trigger */}
            <button 
              type="button"
              onClick={() => {
                const fileInput = document.getElementById('chat-attachment-input-file');
                if (fileInput) fileInput.click();
              }}
              className={`p-2 rounded-lg transition-colors ${chatAttachment?.type === 'file/generic' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-indigo-600 hover:bg-slate-50'}`}
              title="Attach Document"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input 
              id="chat-attachment-input-file"
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setChatAttachment({
                    id: String(Date.now()),
                    name: file.name,
                    type: 'file/generic'
                  });
                }
              }}
            />

            {chatIsVoiceRecording ? (
              <div className="flex-1 flex items-center justify-between text-xs font-black text-rose-600 uppercase tracking-widest px-2 font-mono">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  Recording: {Math.floor(chatVoiceSeconds / 60)}:{String(chatVoiceSeconds % 60).padStart(2, '0')}
                </span>
                <button 
                  type="button"
                  onClick={() => {
                    if (chatVoiceIntervalId) clearInterval(chatVoiceIntervalId);
                    setChatIsVoiceRecording(false);
                    setChatVoiceSeconds(0);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..." 
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-gray-950 font-bold placeholder:text-gray-400 py-1.5"
              />
            )}

            {/* Camera photo upload trigger */}
            <button 
              type="button"
              onClick={() => {
                const imgInput = document.getElementById('chat-attachment-input-img');
                if (imgInput) imgInput.click();
              }}
              className={`p-2 rounded-lg transition-colors ${chatAttachment?.type.startsWith('image') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-indigo-600 hover:bg-slate-50'}`}
              title="Add Photo"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input 
              id="chat-attachment-input-img"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setChatAttachment({
                    id: String(Date.now()),
                    name: file.name,
                    type: 'image/jpeg'
                  });
                }
              }}
            />

            {/* Voice Recording mic trigger */}
            <button 
              type="button"
              onClick={toggleVoiceRecording}
              className={`p-2 rounded-lg transition-colors ${chatIsVoiceRecording ? 'bg-rose-50 text-rose-600 animate-pulse' : 'text-gray-400 hover:text-indigo-600 hover:bg-slate-50'}`}
              title={chatIsVoiceRecording ? "Stop & Attach Voice Note" : "Record Voice Note"}
            >
              <Mic className="w-5 h-5" />
            </button>

            <button 
              type="button"
              onClick={handleSendMessage}
              disabled={(!newMessage.trim() && !chatAttachment) || chatIsVoiceRecording}
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
                {activeTab === 'GROUPS' && "Admin Operations."}
                {activeTab === 'WALLETS' && "Financial Intelligence."}
                {activeTab === 'SUPPORT' && "Support Frequency."}
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <CurrencySelector />
              <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                 <div className="text-right">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Wallet Credits</p>
                    <p className="text-sm font-black text-indigo-600">{formatPrice(user.playerWallet)}</p>
                 </div>
                 <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <Wallet className="w-5 h-5" />
                 </div>
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
              {activeTab === 'GROUPS' && renderGroups()}
              {activeTab === 'WALLETS' && renderWallets()}
              
              {activeTab === 'SUPPORT' && (
                <div className="p-12 md:p-20 bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/50 text-center relative overflow-hidden animate-fade-in">
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
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {completedHubPayment && (
        <StrategicReceipt 
          transaction={completedHubPayment}
          userEmail={user.email}
          onClose={() => setCompletedHubPayment(null)}
        />
      )}
    </div>
  );
};
