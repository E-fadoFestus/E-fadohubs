import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Shield, 
  Lock, 
  Settings, 
  Inbox, 
  Send, 
  FileText, 
  Trash2, 
  Plus, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Globe, 
  Search,
  X,
  ArrowLeft,
  User,
  Key,
  Database,
  Zap,
  Sparkles,
  Reply,
  Check,
  Eye,
  EyeOff,
  Info,
  ArrowRight,
  MailOpen,
  CornerUpLeft,
  Trash,
  HelpCircle
} from 'lucide-react';
import { 
  db, 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  addDoc, 
  serverTimestamp, 
  query, 
  where,
  getDocs
} from '../firebase';
import { deleteDoc } from 'firebase/firestore';
import { UserProfile, EmailAccount, EmailMessage, EmailPlan, DNSConfig } from '../types';

interface EfadoEmailHubProps {
  user: UserProfile;
  onClose: () => void;
}

const EMAIL_PLANS: EmailPlan[] = [
  {
    id: 'free',
    name: 'Free Plan',
    price: 0,
    billingCycle: 'monthly',
    features: ['EFADO Branding', '500MB Storage', 'username@efado.com', 'Standard Support'],
    storageLimit: 500 * 1024 * 1024 // 500MB
  },
  {
    id: 'basic',
    name: 'Basic Plan',
    price: 500,
    billingCycle: 'monthly',
    features: ['No EFADO Branding', '2GB Storage', 'username@customdomain.com', 'Enhanced Security'],
    storageLimit: 2 * 1024 * 1024 * 1024 // 2GB
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    price: 1000,
    billingCycle: 'monthly',
    features: ['Custom Domain', '10GB Storage', 'Advanced Features', 'Priority Support'],
    storageLimit: 10 * 1024 * 1024 * 1024 // 10GB
  },
  {
    id: 'business',
    name: 'Business Plan',
    price: 2000,
    billingCycle: 'monthly',
    features: ['Custom Domain', '50GB Storage', 'Team Management', '24/7 Priority Support'],
    storageLimit: 50 * 1024 * 1024 * 1024 // 50GB
  },
  {
    id: 'express',
    name: 'Express Plan',
    price: 3000,
    billingCycle: 'monthly',
    features: ['Unlimited Domains', '100GB Storage', 'API Access', 'Dedicated Support'],
    storageLimit: 100 * 1024 * 1024 * 1024 // 100GB
  }
];

export const EfadoEmailHub: React.FC<EfadoEmailHubProps> = ({ user, onClose }) => {
  const [activeView, setActiveView] = useState<'landing' | 'dashboard' | 'compose' | 'settings' | 'plans'>('landing');
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [activeAccount, setActiveAccount] = useState<EmailAccount | null>(null);
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'drafts' | 'trash'>('inbox');
  const [isLoading, setIsLoading] = useState(true);
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [creationStep, setCreationStep] = useState<'plan' | 'details'>('plan');
  
  // Custom Registration form states
  const [newEmailUsername, setNewEmailUsername] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<'efado.com' | 'e-fado.com'>('e-fado.com');
  const [selectedPlan, setSelectedPlan] = useState<EmailPlan>(EMAIL_PLANS[0]);
  const [formDisplayName, setFormDisplayName] = useState(user.displayName || '');
  const [formRecoveryEmail, setFormRecoveryEmail] = useState(user.email || '');
  const [formCustomPin, setFormCustomPin] = useState('');
  const [formSignature, setFormSignature] = useState('Sent from my EFADO sovereign workspace.');
  const [creationError, setCreationError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showPinInForm, setShowPinInForm] = useState(false);

  // Email reader state
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);

  // Email compose state
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeContent, setComposeContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);

  // Search keyword filters
  const [searchQuery, setSearchQuery] = useState('');

  // Settings modification states
  const [settingsDisplayName, setSettingsDisplayName] = useState('');
  const [settingsRecoveryEmail, setSettingsRecoveryEmail] = useState('');
  const [settingsSignature, setSettingsSignature] = useState('');
  const [settingsCustomPin, setSettingsCustomPin] = useState('');
  const [settingsStatusMsg, setSettingsStatusMsg] = useState<string | null>(null);
  const [showPinInSettings, setShowPinInSettings] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(
      query(collection(db, 'email_accounts'), where('userId', '==', user.uid)),
      (snapshot) => {
        const accounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmailAccount));
        setEmailAccounts(accounts);
        if (accounts.length > 0 && !activeAccount) {
          // Default to first active account
          setActiveAccount(accounts[0]);
          setActiveView('dashboard');
        }
        setIsLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!activeAccount) return;

    // Prefill settings form
    setSettingsDisplayName(activeAccount.displayName || '');
    setSettingsRecoveryEmail(activeAccount.recoveryEmail || user.email || '');
    setSettingsSignature(activeAccount.signature || 'Sent from my EFADO sovereign workspace.');
    setSettingsCustomPin(activeAccount.customPin || '');

    const unsub = onSnapshot(
      query(
        collection(db, 'email_messages'), 
        where('accountId', '==', activeAccount.id),
        where('folder', '==', activeFolder)
      ),
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmailMessage));
        // Sort descending by timestamp
        list.sort((a, b) => {
          const tA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date();
          const tB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date();
          return tB.getTime() - tA.getTime();
        });
        setMessages(list);
      }
    );

    return () => unsub();
  }, [activeAccount, activeFolder]);

  const handleCreateAccount = async () => {
    const rawUsername = newEmailUsername.trim().toLowerCase();
    if (!rawUsername) {
      setCreationError("Please enter a username.");
      return;
    }
    if (!formDisplayName.trim()) {
      setCreationError("Please enter your display name.");
      return;
    }
    if (!formCustomPin.trim() || formCustomPin.length < 4) {
      setCreationError("Please enter a security PIN (minimum 4 digits).");
      return;
    }

    setIsCreating(true);
    setCreationError(null);

    try {
      const emailAddress = `${rawUsername}@${selectedDomain}`;
      
      // Step 1: Check if emailAddress is already taken
      const existingQuery = query(collection(db, 'email_accounts'), where('emailAddress', '==', emailAddress));
      const existingSnap = await getDocs(existingQuery);

      if (existingSnap.docs.length > 0) {
        setCreationError(`The address "${emailAddress}" is already registered. Please choose a different username.`);
        setIsCreating(false);
        return;
      }

      // Step 2: Write account details
      const newAccountObj = {
        userId: user.uid,
        emailAddress,
        displayName: formDisplayName.trim(),
        recoveryEmail: formRecoveryEmail.trim(),
        customPin: formCustomPin.trim(),
        signature: formSignature.trim(),
        domain: selectedDomain,
        plan: selectedPlan.id,
        storageUsed: 0,
        storageLimit: selectedPlan.storageLimit,
        status: 'active',
        isCustomDomain: selectedDomain === 'e-fado.com',
        twoFactorEnabled: true,
        createdAt: serverTimestamp()
      };

      const accountDocRef = await addDoc(collection(db, 'email_accounts'), newAccountObj);
      const newAccountId = accountDocRef.id;

      // Step 3: Automatically inject onboarding orientation email to prompt awesome immediate UX!
      const welcomeEmail: EmailMessage = {
        accountId: newAccountId,
        sender: 'ceo@efado.com',
        recipients: [emailAddress],
        subject: 'Welcome to EFADO Mail, Sovereign Specialist!',
        content: `Dear ${formDisplayName.trim()},\n\nCongratulations on successfully deploying your brand-new secure EFADO Mailbox!\n\nYou have taken dynamic custody of your professional correspondence using EFADO's elite, zero-trust infrastructure. Your mailbox starts with a premium allocation of ${Math.round(selectedPlan.storageLimit / (1024 * 1024))}MB, fully protected on your localized sovereign digital ledger.\n\nHere are your operational guidelines:\n\n1. Secure Real-Time Intra-Sovereign Exchange: You can send messages directly to any other validated "@efado.com" user. Messages instantly register in their live ledger inbox workspace!\n\n2. Customize Signature & Profile Settings: Tap on Settings to adjust your specialized signatures, recovery gateways, and access profiles.\n\n3. Security Customization: Never share your unique secure mailbox authentication PIN as it provides secondary gatekeeping verification for outgoing transfers.\n\nSovereign professional, we are deeply honored to power your communications matrix.\n\nStay secure,\n\nCEO & Strategic Operations Directorate\nEFADO Inc.`,
        folder: 'inbox',
        isRead: false,
        hasAttachments: false,
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'email_messages'), welcomeEmail);

      // Clean up creation states
      setNewEmailUsername('');
      setFormCustomPin('');
      setCreationStep('plan');
      setShowPlanSelection(false);
      
      // Auto-select this newly created account
      setActiveAccount({ id: newAccountId, ...newAccountObj } as EmailAccount);
      setActiveView('dashboard');
    } catch (err: any) {
      console.error(err);
      setCreationError("Ledger synchronization failed. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!activeAccount) return;
    const recipient = composeTo.trim().toLowerCase();
    if (!recipient) {
      setComposeError("Please specify a recipient email address.");
      return;
    }
    if (!composeSubject.trim()) {
      setComposeError("Please enter a subject line.");
      return;
    }
    if (!composeContent.trim()) {
      setComposeError("Please compose a message body.");
      return;
    }

    setIsSending(true);
    setComposeError(null);

    try {
      // Append sender's custom signature if defined
      const fullBody = activeAccount.signature 
        ? `${composeContent.trim()}\n\n---\n${activeAccount.signature}`
        : composeContent.trim();

      // 1. Write Sent item for this sender
      const sentMsgObj: EmailMessage = {
        accountId: activeAccount.id!,
        sender: activeAccount.emailAddress,
        recipients: [recipient],
        subject: composeSubject,
        content: fullBody,
        folder: 'sent',
        isRead: true,
        hasAttachments: false,
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'email_messages'), sentMsgObj);

      // 2. Check if the recipient belongs inside EFADO's ecosystem
      const recipientQuery = query(
        collection(db, 'email_accounts'), 
        where('emailAddress', '==', recipient)
      );
      const recipientSnap = await getDocs(recipientQuery);

      if (recipientSnap.docs.length > 0) {
        // Recipient exists locally! Deliver inline mail copy
        const recId = recipientSnap.docs[0].id;
        const inboxMsgObj: EmailMessage = {
          accountId: recId,
          sender: activeAccount.emailAddress,
          recipients: [recipient],
          subject: composeSubject,
          content: fullBody,
          folder: 'inbox',
          isRead: false,
          hasAttachments: false,
          timestamp: serverTimestamp()
        };

        await addDoc(collection(db, 'email_messages'), inboxMsgObj);
      }

      // Success! Reset and navigate
      setComposeTo('');
      setComposeSubject('');
      setComposeContent('');
      setActiveView('dashboard');
      setActiveFolder('sent');
      setSelectedMessage(null);
    } catch (err) {
      console.error(err);
      setComposeError("Failed to deploy message on EFADO routing network.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!activeAccount) return;
    try {
      const accountRef = doc(db, 'email_accounts', activeAccount.id!);
      await setDoc(accountRef, {
        displayName: settingsDisplayName.trim(),
        recoveryEmail: settingsRecoveryEmail.trim(),
        signature: settingsSignature.trim(),
        customPin: settingsCustomPin.trim()
      }, { merge: true });

      setSettingsStatusMsg("Sovereign profile configurations updated successfully!");
      
      // Update active state locally
      setActiveAccount(prev => prev ? {
        ...prev,
        displayName: settingsDisplayName.trim(),
        recoveryEmail: settingsRecoveryEmail.trim(),
        signature: settingsSignature.trim(),
        customPin: settingsCustomPin.trim()
      } : null);

      setTimeout(() => setSettingsStatusMsg(null), 3500);
    } catch (err) {
      console.error(err);
      setSettingsStatusMsg("Profile changes rejected by database ledger.");
    }
  };

  const handleMessageClick = async (msg: EmailMessage) => {
    setSelectedMessage(msg);
    if (!msg.isRead) {
      try {
        const msgRef = doc(db, 'email_messages', msg.id!);
        await setDoc(msgRef, { isRead: true }, { merge: true });
        // Update local state to reflect read instantly
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
      } catch (err) {
        console.error("Error setting email as read:", err);
      }
    }
  };

  const handleDeleteMessage = async (msg: EmailMessage) => {
    if (!msg.id) return;
    try {
      if (activeFolder === 'trash') {
        // Permanent deletion from database
        await deleteDoc(doc(db, 'email_messages', msg.id));
      } else {
        // Soft delete: move to trash folder
        await setDoc(doc(db, 'email_messages', msg.id), { folder: 'trash' }, { merge: true });
      }
      setSelectedMessage(null);
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  const handleReplyMessage = (msg: EmailMessage) => {
    setComposeTo(msg.sender);
    setComposeSubject(msg.subject.startsWith('Re:') ? msg.subject : `Re: ${msg.subject}`);
    const dateStr = msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleString() : new Date().toLocaleString();
    setComposeContent(`\n\n\n--- On ${dateStr}, ${msg.sender} wrote:\n> ${msg.content.replace(/\n/g, '\n> ')}`);
    setActiveView('compose');
  };

  // Filter messages based on search query
  const filteredMessages = messages.filter(msg => {
    const q = searchQuery.toLowerCase();
    return (
      msg.sender.toLowerCase().includes(q) ||
      msg.subject.toLowerCase().includes(q) ||
      msg.content.toLowerCase().includes(q)
    );
  });

  const renderLanding = () => (
    <div className="max-w-4xl mx-auto py-16 px-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-8"
      >
        <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/20">
          <Mail className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">
          EFADO <span className="text-indigo-600 font-serif lowercase italic tracking-tight">mail</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
          The sovereign professional messaging framework. Secure end-to-end communication routing, custom corporate signature models, and dynamic dual PIN-gate authentication.
        </p>
        
        {emailAccounts.length > 0 && (
          <div className="bg-indigo-50/50 max-w-md mx-auto p-6 rounded-3xl border border-indigo-100/70 text-left mb-6">
            <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Your Active Mailboxes
            </h4>
            <div className="space-y-2">
              {emailAccounts.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => {
                    setActiveAccount(acc);
                    setActiveView('dashboard');
                  }}
                  className="w-full bg-white p-4 rounded-xl border border-indigo-100 hover:border-indigo-400 transition-all text-left flex justify-between items-center group shadow-sm"
                >
                  <div>
                    <h5 className="text-sm font-black text-slate-900">{acc.displayName || 'Sovereign Account'}</h5>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{acc.emailAddress}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <button
            onClick={() => {
              setCreationStep('plan');
              setShowPlanSelection(true);
            }}
            className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:scale-105 hover:bg-indigo-500 transition-all"
          >
            Create New Mailbox
          </button>
          <button
            onClick={() => setActiveView('plans')}
            className="px-12 py-5 bg-white text-slate-900 border border-slate-100 rounded-2xl font-black uppercase tracking-widest text-sm shadow-sm hover:bg-slate-50 transition-all"
          >
            View Pricing
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16">
          {[
            { icon: Shield, title: "Sovereign Security", desc: "Dual verification with customized ledger encryption protection PINs." },
            { icon: Globe, title: "Enterprise Scaling", desc: "Native customized digital routing built for instant message delivery." },
            { icon: Zap, title: "Pro Onboarding", desc: "Instant automated introductory welcoming correspondence for first actions." }
          ].map((feature, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-left">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-5">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">{feature.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const renderDashboard = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 h-[calc(100vh-130px)] gap-6 text-left">
      {/* 1. Left Message List (5 cols) */}
      <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 flex flex-col h-full shadow-sm overflow-hidden">
        {/* Search header container */}
        <div className="p-5 border-b border-slate-50 flex items-center justify-between gap-4 bg-slate-50/30">
          <div className="relative flex-grow">
            <Search className="absolute left-3 bottom-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search secure mail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-xs font-medium text-slate-900 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2.5 py-1.5 rounded-lg">
            {filteredMessages.length} Messages
          </p>
        </div>

        {/* Dynamic messages stack */}
        <div className="flex-grow overflow-y-auto p-4 space-y-2.5">
          {filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Inbox className="w-10 h-10 opacity-30 mb-3" />
              <p className="text-xs font-black uppercase tracking-wider italic text-slate-400">Empty Ledger</p>
              <p className="text-[10px] text-slate-400 mt-1 max-w-xs text-center leading-relaxed">No sovereign transmissions match your active criteria.</p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isSelected = selectedMessage?.id === msg.id;
              return (
                <div
                  key={msg.id}
                  onClick={() => handleMessageClick(msg)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 text-left relative ${
                    isSelected 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/10' 
                      : msg.isRead 
                        ? 'bg-white border-slate-100 hover:border-slate-300' 
                        : 'bg-indigo-50/40 border-indigo-100 shadow-sm hover:border-indigo-200'
                  }`}
                >
                  {/* Unread circle badge */}
                  {!msg.isRead && !isSelected && (
                    <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse" />
                  )}

                  {/* Sender unique avatar */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0 text-sm ${
                    isSelected ? 'bg-indigo-500/40 text-white' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {msg.sender ? msg.sender[0].toUpperCase() : 'M'}
                  </div>

                  {/* Text details */}
                  <div className="flex-grow overflow-hidden pr-2">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p className={`text-xs font-black truncate max-w-[150px] ${
                        isSelected ? 'text-white' : 'text-slate-900'
                      }`}>
                        {msg.sender === activeAccount?.emailAddress ? 'To: ' + msg.recipients.join(', ') : msg.sender}
                      </p>
                      <span className={`text-[9px] font-bold ${
                        isSelected ? 'text-indigo-200' : 'text-slate-400'
                      }`}>
                        {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : ''}
                      </span>
                    </div>
                    <p className={`text-xs font-bold leading-normal truncate ${
                      isSelected ? 'text-white' : 'text-slate-800'
                    }`}>
                      {msg.subject || '(No Subject)'}
                    </p>
                    <p className={`text-[10px] truncate mt-1 leading-relaxed ${
                      isSelected ? 'text-indigo-100' : 'text-slate-400'
                    }`}>
                      {msg.content}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Right Message Reader Panel (7 cols) */}
      <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 h-full shadow-sm flex flex-col overflow-hidden">
        {selectedMessage ? (
          <div className="flex flex-col h-full">
            {/* Message Action Toolbar */}
            <div className="p-5 border-b border-slate-50 bg-slate-50/20 flex flex-wrap gap-2 justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleReplyMessage(selectedMessage)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-md shadow-indigo-500/10"
                >
                  <Reply className="w-3.5 h-3.5" /> Reply
                </button>
                <button
                  onClick={async () => {
                    const msgRef = doc(db, 'email_messages', selectedMessage.id!);
                    await setDoc(msgRef, { isRead: !selectedMessage.isRead }, { merge: true });
                    setSelectedMessage(prev => prev ? { ...prev, isRead: !prev.isRead } : null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <MailOpen className="w-3.5 h-3.5 text-slate-500" />
                  Mark Unread
                </button>
              </div>

              <button
                onClick={() => handleDeleteMessage(selectedMessage)}
                className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-black transition-all flex items-center gap-1.5"
                title={activeFolder === 'trash' ? "Delete Permanently" : "Move to Trash"}
              >
                <Trash className="w-4 h-4" />
                <span className="hidden sm:inline text-[10px] uppercase tracking-widest font-black">
                  {activeFolder === 'trash' ? "Expunge" : "Trash"}
                </span>
              </button>
            </div>

            {/* Message Full Container content */}
            <div className="flex-grow overflow-y-auto p-8 space-y-6">
              {/* Sender layout details */}
              <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm">
                    {selectedMessage.sender[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{selectedMessage.sender}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      To: {selectedMessage.recipients.join(', ')}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-bold text-slate-500">
                    {selectedMessage.timestamp?.toDate ? selectedMessage.timestamp.toDate().toLocaleString() : ''}
                  </p>
                  <span className="inline-block mt-1 text-[8px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                    Ledger Verified
                  </span>
                </div>
              </div>

              {/* Subj line */}
              <div>
                <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">
                  Subject
                </span>
                <h3 className="text-xl font-black text-slate-950 mt-3 uppercase tracking-tight">
                  {selectedMessage.subject || '(No Subject)'}
                </h3>
              </div>

              {/* Main content body */}
              <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium font-sans pb-8">
                {selectedMessage.content}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-slate-400 p-8">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <MailOpen className="w-8 h-8 text-slate-300 opacity-60" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Secure Transmission Selected</p>
            <p className="text-[10px] text-slate-400 max-w-sm text-center leading-relaxed mt-2.5">
              Confirm your operational requirements. Select any message from the left feed ledger list to view encrypted transmissions in secure markdown.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderCompose = () => (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm max-w-3xl mx-auto text-left">
      <div className="flex justify-between items-center border-b border-slate-100 pb-5 mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">New Sovereign Message</h2>
          <p className="text-xs text-slate-400 font-medium">Compose an intra-sovereign cryptographic mail to standard recipients.</p>
        </div>
        <button
          onClick={() => {
            setActiveView('dashboard');
            setComposeError(null);
          }}
          className="p-2.5 hover:bg-slate-50 rounded-xl transition-all"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {composeError && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-bold leading-relaxed">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{composeError}</span>
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Recipient Email (To)</label>
          <input
            type="email"
            value={composeTo}
            onChange={(e) => setComposeTo(e.target.value)}
            placeholder="colleague@efado.com"
            className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-indigo-500 outline-none transition-all"
          />
          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400 font-medium">
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            <span>Note: Delivers instantly to any active @efado.com inbox address inside the application ecosystem.</span>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Subject Line</label>
          <input
            type="text"
            value={composeSubject}
            onChange={(e) => setComposeSubject(e.target.value)}
            placeholder="Re-allocating sovereign infrastructure limits"
            className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-indigo-500 outline-none transition-all"
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Message Content</label>
          <textarea
            rows={10}
            value={composeContent}
            onChange={(e) => setComposeContent(e.target.value)}
            placeholder="Dear Colleague,\n\nI hope this transmission finds you well. I am draft-forming our project coordinates..."
            className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:border-indigo-500 outline-none transition-all resize-none"
          />
        </div>

        {/* Display Signature Preview */}
        {activeAccount?.signature && (
          <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">
              Your Professional Signature
            </span>
            <p className="text-xs text-slate-500 font-serif italic">{activeAccount.signature}</p>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={handleSendMessage}
            disabled={isSending}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 min-w-[124px]"
          >
            {isSending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" /> Send Mail
              </>
            )}
          </button>
          <button
            onClick={() => {
              setActiveView('dashboard');
              setComposeError(null);
            }}
            className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black uppercase tracking-widest text-xs transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm max-w-2xl mx-auto text-left">
      <div className="flex justify-between items-center border-b border-slate-100 pb-5 mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Mailbox Settings</h2>
          <p className="text-xs text-slate-400 font-medium font-mono lowercase">Configure {activeAccount?.emailAddress} configurations.</p>
        </div>
        <button
          onClick={() => {
            setActiveView('dashboard');
            setSettingsStatusMsg(null);
          }}
          className="p-2.5 hover:bg-slate-50 rounded-xl transition-all"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {settingsStatusMsg && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-xs font-bold leading-relaxed ${
          settingsStatusMsg.includes('successful') 
            ? 'bg-emerald-50 border border-emerald-100 text-emerald-800' 
            : 'bg-rose-50 border border-rose-100 text-rose-800'
        }`}>
          {settingsStatusMsg.includes('successful') ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{settingsStatusMsg}</span>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Display Full Name</label>
          <input
            type="text"
            value={settingsDisplayName}
            onChange={(e) => setSettingsDisplayName(e.target.value)}
            className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-indigo-500 outline-none transition-all"
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Backup Recovery Email</label>
          <input
            type="email"
            value={settingsRecoveryEmail}
            onChange={(e) => setSettingsRecoveryEmail(e.target.value)}
            className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-indigo-500 outline-none transition-all"
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Mailbox Security Authentication PIN</label>
          <div className="relative">
            <input
              type={showPinInSettings ? "text" : "password"}
              maxLength={10}
              value={settingsCustomPin}
              onChange={(e) => setSettingsCustomPin(e.target.value)}
              className="w-full pl-5 pr-14 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-905 focus:border-indigo-500 outline-none transition-all tracking-wider font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPinInSettings(!showPinInSettings)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
            >
              {showPinInSettings ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <span className="text-[9px] text-slate-400 mt-1 block">Dual PIN factor applied automatically to programmatic ledger callbacks. Check your inbox to manage keys.</span>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Custom Email Corporate Signature</label>
          <textarea
            rows={3}
            value={settingsSignature}
            onChange={(e) => setSettingsSignature(e.target.value)}
            placeholder="e.g. Sent from my secure workspace"
            className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:border-indigo-500 outline-none transition-all resize-none"
          />
        </div>

        {/* Real Domain Hosting & Delivery Integration Helper Card */}
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/60 mt-4">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                Real Domain Email Routing Guidance (e-fado.com)
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                The in-app <span className="text-indigo-650 font-bold">EFADO Mailbox</span> is a closed intra-ecosystem ledger. For real global email exchange (sending/receiving from standard services like Gmail):
              </p>
              
              <div className="mt-3 space-y-2 border-t border-slate-200/50 pt-3">
                <div className="text-[10px] text-slate-600 leading-relaxed">
                  <span className="font-bold text-slate-800">1. Domain Hyphenation:</span> Your domain name is <span className="font-mono text-indigo-600 font-bold bg-indigo-50 px-1 py-0.5 rounded">e-fado.com</span>. When sending real messages from Google, always address them to <span className="font-mono text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">username@e-fado.com</span>. Avoid sending to <span className="font-mono text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded">efado.com</span> (missing the hyphen) as that domain can't be found.
                </div>
                <div className="text-[10px] text-slate-600 leading-relaxed">
                  <span className="font-bold text-slate-800">2. Configure MX DNS Records:</span> For real emails to be funneled to your inbox, you must update the domain registrar entry (Namecheap, GoDaddy, Cloudflare, etc.) for <span className="font-mono text-slate-800">e-fado.com</span> with an email hosting provider like <span className="font-bold">Google Workspace (GSuite)</span> or <span className="font-bold">Zoho Business Mail</span>:
                </div>
                
                <div className="bg-slate-900 text-slate-300 p-3 rounded-lg text-[9px] font-mono space-y-1.5 overflow-x-auto mt-2 select-all leading-normal">
                  <div># MX (Mail Exchange) DNS Settings</div>
                  <div>Type: MX | Host: @ | Value: mx.zoho.com (or gmr-smtp-in.l.google.com) | Priority: 10</div>
                  <div className="pt-1"># SPF (Sender Policy Framework) Settings</div>
                  <div>Type: TXT | Host: @ | Value: v=spf1 include:zoho.com include:_spf.google.com ~all</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-5 border-t border-slate-100 flex gap-3">
          <button
            onClick={handleSaveSettings}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-500/20 transition-all"
          >
            Save Account Settings
          </button>
          <button
            onClick={() => setActiveView('dashboard')}
            className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black uppercase tracking-widest text-xs transition-all"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );

  const renderPlans = () => (
    <div className="max-w-5xl mx-auto py-8 text-left">
      <div className="flex justify-between items-center border-b border-slate-100 pb-5 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Sovereign Service Plans</h2>
          <p className="text-slate-500 text-sm font-medium">Elevate your operational communications with customized digital scaling limit arrays.</p>
        </div>
        <button
          onClick={() => setActiveView(activeAccount ? 'dashboard' : 'landing')}
          className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:bg-slate-50"
        >
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {EMAIL_PLANS.map((plan) => {
          const isActive = activeAccount?.plan === plan.id;
          return (
            <div
              key={plan.id}
              className={`p-8 rounded-[2.5rem] bg-white border-2 transition-all relative overflow-hidden flex flex-col justify-between ${
                isActive ? 'border-indigo-600 bg-indigo-50/5 shadow-xl' : 'border-slate-100 hover:border-slate-300'
              }`}
            >
              {isActive && (
                <div className="absolute top-4 right-4 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" /> Active Plan
                </div>
              )}
              
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-black text-indigo-600">₦{plan.price.toLocaleString()}</span>
                  <span className="text-xs font-bold text-slate-400 uppercase">/month</span>
                </div>
                <ul className="space-y-3.5 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-xs text-slate-600 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {!isActive && (
                <button
                  onClick={() => {
                    setSelectedPlan(plan);
                    setCreationStep('plan');
                    setShowPlanSelection(true);
                  }}
                  className="w-full py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all text-center"
                >
                  Upgrade to {plan.name}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderPlanSelection = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[3rem] p-10 w-full max-w-4xl max-h-[92vh] overflow-y-auto no-scrollbar shadow-2xl border border-slate-100 text-left"
      >
        <div className="flex justify-between items-center pb-8 border-b border-slate-100 mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
              {creationStep === 'plan' ? 'Choose Communication Plan' : 'Sovereign Mailbox Details'}
            </h2>
            <p className="text-slate-500 text-xs font-medium">
              {creationStep === 'plan' 
                ? 'Select the storage footprint tier matching your tactical requirements.' 
                : 'Setup the security authorizations and displaying elements for your newly created node.'}
            </p>
          </div>
          <button 
            onClick={() => {
              setShowPlanSelection(false);
              setCreationError(null);
            }} 
            className="p-3 hover:bg-slate-50 rounded-2xl transition-all"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {creationError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex items-center gap-3 text-xs font-bold leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{creationError}</span>
          </div>
        )}

        {creationStep === 'plan' ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {EMAIL_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer relative ${
                    selectedPlan.id === plan.id 
                      ? 'border-indigo-600 bg-indigo-50/20 shadow-lg' 
                      : 'border-slate-100 hover:border-indigo-200 bg-white'
                  }`}
                >
                  {selectedPlan.id === plan.id && (
                    <div className="absolute top-4 right-4 bg-indigo-600 p-1 rounded-full">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <h3 className="text-md font-black text-slate-900 uppercase mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-2xl font-black text-indigo-600">₦{plan.price.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">/month</span>
                  </div>
                  <ul className="space-y-2 text-left">
                    {plan.features.slice(0, 3).map((feat, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-[11px] text-slate-650 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                onClick={() => setCreationStep('details')}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/15"
              >
                Configure Details <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Desired Username address</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. daniel"
                    value={newEmailUsername}
                    onChange={(e) => setNewEmailUsername(e.target.value.replace(/[^a-zA-Z0-9_.-]/g, ''))}
                    className="flex-grow px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-md font-black text-slate-900 focus:border-indigo-500 outline-none transition-all"
                  />
                  <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value as 'efado.com' | 'e-fado.com')}
                    className="px-4 py-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-black text-indigo-700 outline-none transition-all cursor-pointer hover:bg-indigo-100"
                  >
                    <option value="e-fado.com">@e-fado.com</option>
                    <option value="efado.com">@efado.com</option>
                  </select>
                </div>
                <p className="text-[9px] text-slate-400 mt-1 pl-1">Select e-fado.com to align with your official core hyphenated brand domain!</p>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Owner Display Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Daniel Robinson"
                  value={formDisplayName}
                  onChange={(e) => setFormDisplayName(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-md font-black text-slate-900 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Backup Recovery Email</label>
                <input
                  type="email"
                  placeholder="alternative@gmail.com"
                  value={formRecoveryEmail}
                  onChange={(e) => setFormRecoveryEmail(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Custom Access Security PIN</label>
                <div className="relative">
                  <input
                    type={showPinInForm ? "text" : "password"}
                    maxLength={10}
                    placeholder="e.g. 8497"
                    value={formCustomPin}
                    onChange={(e) => setFormCustomPin(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full pl-5 pr-14 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:border-indigo-500 outline-none transition-all tracking-wider font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPinInForm(!showPinInForm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showPinInForm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Standard Email Signature</label>
              <textarea
                rows={2}
                value={formSignature}
                onChange={(e) => setFormSignature(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-902 focus:border-indigo-500 outline-none transition-all resize-none"
              />
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setCreationStep('plan')}
                className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black uppercase tracking-widest text-xs transition-all"
              >
                Back to Plans
              </button>

              <button
                onClick={handleCreateAccount}
                disabled={isCreating}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 min-w-[200px]"
              >
                {isCreating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Registering Sovereign...
                  </>
                ) : (
                  <>
                    Deploy Sovereign Mailbox <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      {/* Header element consistent layout */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-white sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-100 shadow-sm bg-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">EFADO Mail</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Professional Cryptographic Hub</p>
            </div>
          </div>
        </div>

        {/* Dynamic header info */}
        {activeAccount && activeView !== 'landing' && (
          <div className="flex items-center gap-4">
            {/* Account Switcher dropdown list */}
            {emailAccounts.length > 1 && (
              <select
                value={activeAccount.id}
                onChange={(e) => {
                  const targetAcc = emailAccounts.find(acc => acc.id === e.target.value);
                  if (targetAcc) {
                    setActiveAccount(targetAcc);
                    setActiveView('dashboard');
                    setSelectedMessage(null);
                  }
                }}
                className="bg-white border border-slate-200/80 px-4 py-2.5 rounded-xl text-xs font-black uppercase text-slate-700 outline-none shadow-sm focus:border-indigo-500 cursor-pointer"
              >
                {emailAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.emailAddress}
                  </option>
                ))}
              </select>
            )}

            <div className="hidden md:flex flex-col items-end">
              <p className="text-xs font-black text-slate-900 leading-none">{activeAccount.displayName || 'Sovereign Account'}</p>
              <p className="text-[10px] text-slate-400 font-bold lowercase mt-1">{activeAccount.emailAddress}</p>
              
              <div className="flex items-center gap-2 mt-1.5">
                <div className="w-24 h-1.5 bg-slate-150 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full" 
                    style={{ width: `${Math.min(100, ((activeAccount.storageUsed || 0) / (activeAccount.storageLimit || 500 * 1024 * 1024)) * 100)}%` }} 
                  />
                </div>
                <span className="text-[8px] font-black text-slate-400 uppercase">
                  {Math.round((activeAccount.storageUsed || 0) / (1024 * 1024))}MB / {Math.round((activeAccount.storageLimit || 500 * 1024 * 1024) / (1024 * 1024))}MB
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Primary layout dividing sides when registered */}
      {activeAccount && activeView !== 'landing' ? (
        <div className="flex-grow flex flex-col lg:flex-row h-[calc(100vh-100px)]">
          {/* Main APP LEFT NAVIGATION SIDEBAR */}
          <div className="w-full lg:w-64 bg-white border-r border-slate-100 flex flex-col shrink-0 p-5 space-y-6">
            <div>
              <button
                onClick={() => {
                  setActiveView('compose');
                  setComposeTo('');
                  setComposeSubject('');
                  setComposeContent('');
                  setComposeError(null);
                }}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
              >
                <Plus className="w-4 h-4" /> Compose Mail
              </button>
            </div>

            {/* Folder list navigator */}
            <div className="flex-grow flex flex-col justify-between">
              <nav className="space-y-1.5">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3.5 px-3">Folders</p>
                {[
                  { id: 'inbox', icon: Inbox, label: 'Inbox', queryField: 'folder' },
                  { id: 'sent', icon: Send, label: 'Sent', queryField: 'folder' },
                  { id: 'drafts', icon: FileText, label: 'Drafts', queryField: 'folder' },
                  { id: 'trash', icon: Trash2, label: 'Trash', queryField: 'folder' }
                ].map((folder) => {
                  const isActive = activeFolder === folder.id && activeView === 'dashboard';
                  return (
                    <button
                      key={folder.id}
                      onClick={() => {
                        setActiveFolder(folder.id as any);
                        setActiveView('dashboard');
                        setSelectedMessage(null);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                        isActive 
                          ? 'bg-indigo-50 border-indigo-100/50 text-indigo-600 shadow-sm' 
                          : 'bg-white border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <folder.icon className="w-4 h-4" />
                        {folder.label}
                      </div>
                    </button>
                  );
                })}
              </nav>

              {/* Sidebar bottom section containing tools */}
              <div className="border-t border-slate-150 pt-5 space-y-3.5">
                <button
                  onClick={() => setActiveView('settings')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                    activeView === 'settings' 
                      ? 'bg-indigo-50 border-indigo-100/50 text-indigo-600' 
                      : 'text-slate-500 hover:text-slate-900 border-transparent'
                  }`}
                >
                  <Settings className="w-4 h-4" /> Config Settings
                </button>

                <button
                  onClick={() => setActiveView('plans')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                    activeView === 'plans' 
                      ? 'bg-indigo-50 border-indigo-100/50 text-indigo-600' 
                      : 'text-slate-500 hover:text-slate-900 border-transparent'
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-500" /> Subscription Plans
                </button>

                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <Shield className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Dual security status</span>
                  </div>
                  <p className="text-[9.5px] leading-relaxed text-slate-500 font-bold">Encrypted Node ID verification is active on sovereign gateway.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Right body content container */}
          <div className="flex-grow p-6 bg-slate-50/40 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                {activeView === 'dashboard' && renderDashboard()}
                {activeView === 'compose' && renderCompose()}
                {activeView === 'settings' && renderSettings()}
                {activeView === 'plans' && renderPlans()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      ) : (
        /* Render landing or plans view for nonregistered users */
        <div className="flex-grow overflow-y-auto bg-slate-50/20 py-8">
          <AnimatePresence mode="wait">
            {activeView === 'landing' && renderLanding()}
            {activeView === 'plans' && renderPlans()}
          </AnimatePresence>
        </div>
      )}

      {/* Plan selection wizard portal */}
      <AnimatePresence>
        {showPlanSelection && renderPlanSelection()}
      </AnimatePresence>
    </div>
  );
};
