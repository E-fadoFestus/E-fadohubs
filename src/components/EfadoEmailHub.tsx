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
  CreditCard,
  Search,
  Menu,
  X,
  ArrowLeft,
  User,
  Key,
  Database,
  Zap
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
  runTransaction
} from '../firebase';
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
  const [newEmailUsername, setNewEmailUsername] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<EmailPlan>(EMAIL_PLANS[0]);

  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(
      query(collection(db, 'email_accounts'), where('userId', '==', user.uid)),
      (snapshot) => {
        const accounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmailAccount));
        setEmailAccounts(accounts);
        if (accounts.length > 0 && !activeAccount) {
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

    const unsub = onSnapshot(
      query(
        collection(db, 'email_messages'), 
        where('accountId', '==', activeAccount.id),
        where('folder', '==', activeFolder)
      ),
      (snapshot) => {
        setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmailMessage)));
      }
    );

    return () => unsub();
  }, [activeAccount, activeFolder]);

  const handleCreateAccount = async () => {
    if (!newEmailUsername.trim()) return;

    try {
      const emailAddress = `${newEmailUsername.toLowerCase()}@efado.com`;
      const newAccount: EmailAccount = {
        userId: user.uid,
        emailAddress,
        domain: 'efado.com',
        plan: selectedPlan.id as any,
        storageUsed: 0,
        storageLimit: selectedPlan.storageLimit,
        status: 'active',
        isCustomDomain: false,
        twoFactorEnabled: false,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'email_accounts'), newAccount);
      setNewEmailUsername('');
      setShowPlanSelection(false);
      setActiveView('dashboard');
    } catch (error) {
      console.error("Error creating email account:", error);
    }
  };

  const renderLanding = () => (
    <div className="max-w-4xl mx-auto py-20 px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/20">
          <Mail className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase">
          EFADO <span className="text-indigo-600">Mail</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium">
          Professional, secure, and customizable email for individuals and businesses. 
          Get your @efado.com address or use your own custom domain.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-8">
          <button
            onClick={() => setShowPlanSelection(true)}
            className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:scale-105 transition-all"
          >
            Create Your Account
          </button>
          <button
            onClick={() => setActiveView('plans')}
            className="px-12 py-5 bg-white text-gray-900 border border-gray-100 rounded-2xl font-black uppercase tracking-widest text-sm shadow-sm hover:bg-gray-50 transition-all"
          >
            View Pricing
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-20">
          {[
            { icon: Shield, title: "Secure", desc: "End-to-end encryption and 2FA protection." },
            { icon: Globe, title: "Custom", desc: "Use your own domain for a professional look." },
            { icon: Zap, title: "Fast", desc: "Lightning fast delivery and responsive interface." }
          ].map((feature, i) => (
            <div key={i} className="bg-slate-50 p-8 rounded-3xl border border-gray-100 shadow-sm">
              <feature.icon className="w-10 h-10 text-indigo-600 mb-4 mx-auto" />
              <h3 className="text-lg font-black text-gray-900 uppercase mb-2">{feature.title}</h3>
              <p className="text-gray-500 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const renderDashboard = () => (
    <div className="flex h-full bg-white rounded-[3rem] overflow-hidden shadow-2xl border border-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-slate-50 border-r border-gray-100 flex flex-col">
        <div className="p-6">
          <button
            onClick={() => setActiveView('compose')}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 hover:scale-105 transition-all"
          >
            <Plus className="w-4 h-4" /> Compose
          </button>
        </div>
        
        <nav className="flex-grow px-4 space-y-2">
          {[
            { id: 'inbox', icon: Inbox, label: 'Inbox' },
            { id: 'sent', icon: Send, label: 'Sent' },
            { id: 'drafts', icon: FileText, label: 'Drafts' },
            { id: 'trash', icon: Trash2, label: 'Trash' }
          ].map((folder) => (
            <button
              key={folder.id}
              onClick={() => setActiveFolder(folder.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeFolder === folder.id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <folder.icon className="w-4 h-4" />
              {folder.label}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-black text-gray-900 truncate">{activeAccount?.emailAddress}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase">{activeAccount?.plan} Plan</p>
            </div>
          </div>
          <button
            onClick={() => setActiveView('settings')}
            className="w-full flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-grow flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{activeFolder}</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search mail..."
              className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-950 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-2">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
              <Inbox className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium italic">No messages in this folder.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${
                  msg.isRead ? 'bg-white border-gray-100' : 'bg-indigo-50/30 border-indigo-100 shadow-sm'
                } hover:border-indigo-300`}
              >
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-sm font-black text-gray-500 uppercase">{msg.sender[0]}</span>
                </div>
                <div className="flex-grow overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-black text-gray-900 truncate">{msg.sender}</p>
                    <span className="text-[10px] text-gray-400 font-bold">{msg.timestamp?.toDate().toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs font-bold text-gray-700 truncate">{msg.subject}</p>
                  <p className="text-[10px] text-gray-400 truncate mt-1">{msg.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderPlanSelection = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[3rem] p-10 w-full max-w-5xl max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl"
      >
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Choose Your Plan</h2>
            <p className="text-gray-500 font-medium">Select the best option for your communication needs.</p>
          </div>
          <button onClick={() => setShowPlanSelection(false)} className="p-3 hover:bg-gray-100 rounded-2xl transition-all">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {EMAIL_PLANS.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className={`p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer relative overflow-hidden ${
                selectedPlan.id === plan.id ? 'border-indigo-600 bg-indigo-50/30 shadow-xl' : 'border-gray-100 hover:border-indigo-200'
              }`}
            >
              {selectedPlan.id === plan.id && (
                <div className="absolute top-4 right-4">
                  <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                </div>
              )}
              <h3 className="text-xl font-black text-gray-900 uppercase mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-black text-indigo-600">₦{plan.price.toLocaleString()}</span>
                <span className="text-xs font-bold text-gray-400 uppercase">/month</span>
              </div>
              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
          <h3 className="text-lg font-black text-gray-900 uppercase mb-6">Account Details</h3>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-grow">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Desired Username</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="username"
                  value={newEmailUsername}
                  onChange={(e) => setNewEmailUsername(e.target.value)}
                  className="w-full pl-6 pr-32 py-4 bg-white border border-gray-200 rounded-2xl text-lg font-black text-gray-950 focus:border-indigo-500 outline-none transition-all"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-black">@efado.com</span>
              </div>
            </div>
            <div className="md:w-64 flex items-end">
              <button
                onClick={handleCreateAccount}
                disabled={!newEmailUsername.trim()}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:scale-105 transition-all disabled:opacity-50"
              >
                Start Now
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-900 transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tighter uppercase leading-none">EFADO Mail</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Professional Email Hub</p>
            </div>
          </div>
        </div>

        {activeView !== 'landing' && (
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <p className="text-xs font-black text-gray-900">{activeAccount?.emailAddress}</p>
              <div className="flex items-center gap-2">
                <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full" 
                    style={{ width: `${(activeAccount?.storageUsed || 0) / (activeAccount?.storageLimit || 1) * 100}%` }} 
                  />
                </div>
                <span className="text-[8px] font-black text-gray-400 uppercase">
                  {Math.round((activeAccount?.storageUsed || 0) / (1024 * 1024))}MB / {Math.round((activeAccount?.storageLimit || 1) / (1024 * 1024))}MB
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveView('settings')}
              className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-gray-500 transition-all"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-grow p-8 bg-gray-50/50">
        <AnimatePresence mode="wait">
          {activeView === 'landing' && renderLanding()}
          {activeView === 'dashboard' && renderDashboard()}
          {showPlanSelection && renderPlanSelection()}
        </AnimatePresence>
      </div>
    </div>
  );
};
