import React, { useState } from 'react';
import { 
  Megaphone, 
  ShoppingBag, 
  MessageSquare, 
  Sparkles, 
  Briefcase, 
  Users, 
  DollarSign, 
  Globe, 
  Brain, 
  Mail, 
  Coins, 
  Trophy, 
  Radio, 
  Smartphone, 
  GraduationCap, 
  Tv, 
  Activity, 
  Search, 
  Clock, 
  Filter, 
  Flame, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Package, 
  Send, 
  ExternalLink,
  RefreshCw,
  Award,
  Video
} from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface CeoHubsManagerProps {
  selectedHubTab: string;
  setSelectedHubTab: (tab: string) => void;
  creatorStatsAggregate: {
    totalAvailable: number;
    totalPending: number;
    totalViews: number;
    totalEarnings: number;
    todayEarnings: number;
    todayViews: number;
    totalBonuses: number;
    topCreators: any[];
    totalCount: number;
  };
  creatorStatsList: any[];
  creatorWalletsList: any[];
  allSiteActivities: any[];
  siteActivityFilter: 'all' | 'creators' | 'finance' | 'market' | 'social' | 'education' | 'services' | 'digital';
  setSiteActivityFilter: (f: any) => void;
  siteActivitySearch: string;
  setSiteActivitySearch: (s: string) => void;
  users: any[];
  liveRooms: any[];
  gistCommunities: any[];
  reels: any[];
  socialPosts: any[];
  posts: any[];
  adListings: any[];
  ads: any[];
  marketProducts: any[];
  marketOrders: any[];
  vendors: any[];
  vendingPurchases: any[];
  sourcingRequests: any[];
  cryptoConversions: any[];
  jambCandidates: any[];
  waecCards: any[];
  serviceRequests: any[];
  serviceProviders: any[];
  csccGroups: any[];
  loans: any[];
  loanApplications: any[];
  loanVendors: any[];
  domainOrders: any[];
  domainSellers: any[];
  quizSessions: any[];
  emailAccounts: any[];
  partnerApplications: any[];
  zoomSubscriptions: any[];
  liveBroadcastClasses: any[];
  handleUpdateContentStatus: (collectionName: string, id: string, status: string) => Promise<void>;
  handleDeleteContentItem: (collectionName: string, id: string) => Promise<void>;
  onDirectMessageUser: (user: any) => void;
  isProcessing: boolean;
}

export const CeoHubsManager: React.FC<CeoHubsManagerProps> = ({
  selectedHubTab,
  setSelectedHubTab,
  creatorStatsAggregate,
  creatorStatsList,
  creatorWalletsList,
  allSiteActivities,
  siteActivityFilter,
  setSiteActivityFilter,
  siteActivitySearch,
  setSiteActivitySearch,
  users,
  liveRooms,
  gistCommunities,
  reels,
  socialPosts,
  posts,
  adListings,
  ads,
  marketProducts,
  marketOrders,
  vendors,
  vendingPurchases,
  sourcingRequests,
  cryptoConversions,
  jambCandidates,
  waecCards,
  serviceRequests,
  serviceProviders,
  csccGroups,
  loans,
  loanApplications,
  loanVendors,
  domainOrders,
  domainSellers,
  quizSessions,
  emailAccounts,
  partnerApplications,
  zoomSubscriptions,
  liveBroadcastClasses,
  handleUpdateContentStatus,
  handleDeleteContentItem,
  onDirectMessageUser,
  isProcessing
}) => {
  // Local filter states
  const [ecosystemContentTab, setEcosystemContentTab] = useState<'ads' | 'market' | 'social' | 'reels' | 'orders'>('ads');
  const [contentSearchQuery, setContentSearchQuery] = useState('');
  const [creatorSearchQuery, setCreatorSearchQuery] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  // Quick Action for Creator Escrow Release
  const handleReleaseCreatorEscrowEarly = async (creatorId: string, pendingAmount: number) => {
    if (!confirm(`Release ₦${pendingAmount.toLocaleString()} escrow early to this creator's available balance?`)) return;
    try {
      const statsRef = doc(db, 'creator_stats', creatorId);
      await updateDoc(statsRef, {
        availableBalance: (creatorStatsList.find(c => c.id === creatorId)?.availableBalance || 0) + pendingAmount,
        pendingBalance: 0,
        lastPayoutAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      showFeedback(`Successfully matured and released ₦${pendingAmount.toLocaleString()} to Creator ID ${creatorId}!`);
    } catch (e: any) {
      alert(`Failed to release escrow: ${e.message}`);
    }
  };

  // Quick Status update for Digital Sourcing
  const handleUpdateSourcingStatus = async (requestId: string, newStatus: string) => {
    try {
      const ref = doc(db, 'sourcing_requests', requestId);
      await updateDoc(ref, { status: newStatus, updatedAt: serverTimestamp() });
      showFeedback(`Sourcing request marked as ${newStatus.toUpperCase()}`);
    } catch (e: any) {
      alert(`Error updating sourcing status: ${e.message}`);
    }
  };

  // Quick Status update for Crypto OTC
  const handleUpdateCryptoStatus = async (conversionId: string, newStatus: string) => {
    try {
      const ref = doc(db, 'crypto_conversions', conversionId);
      await updateDoc(ref, { status: newStatus, completedAt: serverTimestamp() });
      showFeedback(`Crypto OTC transaction marked as ${newStatus.toUpperCase()}`);
    } catch (e: any) {
      alert(`Error updating crypto status: ${e.message}`);
    }
  };

  // Filtered Site Activities
  const filteredSiteActivities = allSiteActivities.filter(act => {
    if (siteActivityFilter !== 'all' && act.category !== siteActivityFilter) return false;
    if (!siteActivitySearch) return true;
    const q = siteActivitySearch.toLowerCase();
    return act.title.toLowerCase().includes(q) ||
           act.description.toLowerCase().includes(q) ||
           act.hubName.toLowerCase().includes(q) ||
           act.user.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8 text-left">
      {/* 1. MASTER HEADER & TELEMETRY STATUS BAR */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/80 border-2 border-indigo-500/30 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3.5 py-1 bg-indigo-500/20 border border-indigo-500/40 rounded-full text-[9px] font-black uppercase text-indigo-300 tracking-widest flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                EFADO 14 DIGITAL HUBS COMMAND ENGINE
              </span>
              <span className="px-3.5 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-[9px] font-black uppercase text-emerald-300 tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                ALL HUBS OPERATIONAL & REAL-TIME
              </span>
            </div>
            <h2 className="text-2xl md:text-4xl font-black text-white uppercase italic tracking-tight font-display flex items-center gap-3">
              <Activity className="w-8 h-8 text-indigo-400 animate-pulse" />
              Comprehensive Website Hubs & Activity Radar
            </h2>
            <p className="text-xs text-slate-300 font-medium max-w-3xl leading-relaxed">
              Real-time CEO command over all 14 ecosystem hubs. Track live creator monetizations, 7-day escrow maturities, live streaming rooms, digital vending, marketplace turnover, education test results, and community activities.
            </p>
          </div>

          {/* Quick Metrics Header Badge */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-950/80 border border-white/10 p-3 rounded-2xl">
            <div className="text-right px-3 border-r border-white/10">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Creator Escrow</p>
              <p className="text-base font-black text-purple-400 font-display">
                ₦{(creatorStatsAggregate.totalAvailable + creatorStatsAggregate.totalPending).toLocaleString()}
              </p>
            </div>
            <div className="text-right px-3 border-r border-white/10">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Qualified Views</p>
              <p className="text-base font-black text-cyan-400 font-display">
                {creatorStatsAggregate.totalViews.toLocaleString()}
              </p>
            </div>
            <div className="text-right px-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Signals</p>
              <p className="text-base font-black text-emerald-400 font-display">
                {allSiteActivities.length}
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Feedback Alert */}
        {actionSuccessMsg && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            {actionSuccessMsg}
          </div>
        )}

        {/* MASTER INTERACTIVE SUB-NAVIGATION TABS */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedHubTab('overview')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
              selectedHubTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Globe className="w-4 h-4" /> 14 Hubs Matrix
          </button>

          <button
            onClick={() => setSelectedHubTab('activity_stream')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
              selectedHubTab === 'activity_stream'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Activity className="w-4 h-4 text-amber-400 animate-pulse" />
            Site Activity Radar ({allSiteActivities.length})
          </button>

          <button
            onClick={() => setSelectedHubTab('creators')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
              selectedHubTab === 'creators'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Flame className="w-4 h-4 text-purple-400" />
            Creator Monetization & Wallets ({creatorStatsList.length})
          </button>

          <button
            onClick={() => setSelectedHubTab('gist_social')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
              selectedHubTab === 'gist_social'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Radio className="w-4 h-4 text-rose-400" />
            Gist Hub & Live Video ({liveRooms.length} Live)
          </button>

          <button
            onClick={() => setSelectedHubTab('digital_services')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
              selectedHubTab === 'digital_services'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Smartphone className="w-4 h-4 text-cyan-400" />
            Telecom Vending & Sourcing ({vendingPurchases.length + sourcingRequests.length})
          </button>

          <button
            onClick={() => setSelectedHubTab('education')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
              selectedHubTab === 'education'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-yellow-400" />
            Education Hub & CBT ({jambCandidates.length + waecCards.length})
          </button>

          <button
            onClick={() => setSelectedHubTab('marketplace_ads')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
              selectedHubTab === 'marketplace_ads'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            Marketplace & Ads ({marketProducts.length + adListings.length})
          </button>

          <button
            onClick={() => setSelectedHubTab('corps_loans_cscc')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
              selectedHubTab === 'corps_loans_cscc'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Briefcase className="w-4 h-4 text-orange-400" />
            Artisans, Loans & CSCC
          </button>

          <button
            onClick={() => setSelectedHubTab('domains_tech')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
              selectedHubTab === 'domains_tech'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Globe className="w-4 h-4 text-blue-400" />
            DomainHub, Zoom & Mining
          </button>
        </div>
      </div>

      {/* 2. SUB-VIEW: OVERVIEW (14 HUBS COMMAND MATRIX) */}
      {selectedHubTab === 'overview' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-white uppercase italic tracking-tight font-display flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-400" />
              Ecosystem Hubs Health & Telemetry Grid (14 Operational Nodes)
            </h3>
            <span className="text-xs text-slate-400 font-medium">Click any hub to launch console</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Hub 1: Creator Monetization */}
            <div 
              onClick={() => setSelectedHubTab('creators')}
              className="bg-slate-900/60 hover:bg-slate-900/90 border border-purple-500/30 hover:border-purple-500 p-5 rounded-3xl space-y-3 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-purple-500/20 rounded-xl">
                  <Flame className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-[8px] font-black text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/40">
                  P0 MONETIZATION
                </span>
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase group-hover:text-purple-300 transition-colors">1. Creator Monetization</h4>
                <p className="text-[10px] text-slate-400">₦200/1k + ₦500 bonus, 7d Escrow</p>
              </div>
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="font-bold text-white">₦{(creatorStatsAggregate.totalAvailable + creatorStatsAggregate.totalPending).toLocaleString()}</span>
                <span className="text-[9px] font-bold text-slate-400">{creatorStatsList.length} Creators</span>
              </div>
            </div>

            {/* Hub 2: Gist Hub & Live Video */}
            <div 
              onClick={() => setSelectedHubTab('gist_social')}
              className="bg-slate-900/60 hover:bg-slate-900/90 border border-rose-500/30 hover:border-rose-500 p-5 rounded-3xl space-y-3 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-rose-500/20 rounded-xl">
                  <Radio className="w-5 h-5 text-rose-400 animate-pulse" />
                </div>
                <span className="text-[8px] font-black text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/40">
                  LIVE STREAMING
                </span>
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase group-hover:text-rose-300 transition-colors">2. Gist Hub & Live Rooms</h4>
                <p className="text-[10px] text-slate-400">Video reels, audio gists & gifts</p>
              </div>
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="font-bold text-rose-400">{liveRooms.length} Live Rooms</span>
                <span className="text-[9px] font-bold text-slate-400">{reels.length} Reels</span>
              </div>
            </div>

            {/* Hub 3: Modern & Fairly Used Marketplace */}
            <div 
              onClick={() => setSelectedHubTab('marketplace_ads')}
              className="bg-slate-900/60 hover:bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-500 p-5 rounded-3xl space-y-3 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-emerald-500/20 rounded-xl">
                  <ShoppingBag className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-[8px] font-black text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  COMMERCE
                </span>
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase group-hover:text-emerald-300 transition-colors">3. Marketplace & Vendors</h4>
                <p className="text-[10px] text-slate-400">Catalog products, orders & stores</p>
              </div>
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400">{marketProducts.length} Products</span>
                <span className="text-[9px] font-bold text-slate-400">{marketOrders.length} Orders</span>
              </div>
            </div>

            {/* Hub 4: Advertising Campaigns */}
            <div 
              onClick={() => setSelectedHubTab('marketplace_ads')}
              className="bg-slate-900/60 hover:bg-slate-900/90 border border-indigo-500/30 hover:border-indigo-500 p-5 rounded-3xl space-y-3 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-indigo-500/20 rounded-xl">
                  <Megaphone className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="text-[8px] font-black text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/40">
                  PROMOTIONS
                </span>
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase group-hover:text-indigo-300 transition-colors">4. Advertising Hub</h4>
                <p className="text-[10px] text-slate-400">Sponsored campaigns & banner ads</p>
              </div>
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-400">{adListings.length} Active Ads</span>
                <span className="text-[9px] font-bold text-slate-400">${adListings.reduce((acc, a) => acc + (a.budget || 0), 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Hub 5: Telecom Vending & Airtime */}
            <div 
              onClick={() => setSelectedHubTab('digital_services')}
              className="bg-slate-900/60 hover:bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-500 p-5 rounded-3xl space-y-3 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-cyan-500/20 rounded-xl">
                  <Smartphone className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="text-[8px] font-black text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/40">
                  TELECOM 120+
                </span>
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase group-hover:text-cyan-300 transition-colors">5. Airtime & Data Vending</h4>
                <p className="text-[10px] text-slate-400">Global recharge API automation</p>
              </div>
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-400">{vendingPurchases.length} Recharges</span>
                <span className="text-[9px] font-bold text-slate-400">Auto Fulfilled</span>
              </div>
            </div>

            {/* Hub 6: China Factory Sourcing */}
            <div 
              onClick={() => setSelectedHubTab('digital_services')}
              className="bg-slate-900/60 hover:bg-slate-900/90 border border-amber-500/30 hover:border-amber-500 p-5 rounded-3xl space-y-3 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-amber-500/20 rounded-xl">
                  <Package className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-[8px] font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
                  IMPORT/EXPORT
                </span>
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase group-hover:text-amber-300 transition-colors">6. China Direct Sourcing</h4>
                <p className="text-[10px] text-slate-400">Factory quotes, sea/air cargo freight</p>
              </div>
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="font-bold text-amber-400">{sourcingRequests.length} Quotes</span>
                <span className="text-[9px] font-bold text-slate-400">Wholesale</span>
              </div>
            </div>

            {/* Hub 7: Crypto OTC Terminal */}
            <div 
              onClick={() => setSelectedHubTab('digital_services')}
              className="bg-slate-900/60 hover:bg-slate-900/90 border border-yellow-500/30 hover:border-yellow-500 p-5 rounded-3xl space-y-3 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-yellow-500/20 rounded-xl">
                  <DollarSign className="w-5 h-5 text-yellow-400" />
                </div>
                <span className="text-[8px] font-black text-yellow-300 bg-yellow-500/20 px-2 py-0.5 rounded-full border border-yellow-500/40">
                  OTC SWAPS
                </span>
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase group-hover:text-yellow-300 transition-colors">7. Crypto OTC Terminal</h4>
                <p className="text-[10px] text-slate-400">Instant USDT / NGN settlement</p>
              </div>
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="font-bold text-yellow-400">{cryptoConversions.length} Swaps</span>
                <span className="text-[9px] font-bold text-slate-400">Liquid</span>
              </div>
            </div>

            {/* Hub 8: Education Hub & JAMB CBT */}
            <div 
              onClick={() => setSelectedHubTab('education')}
              className="bg-slate-900/60 hover:bg-slate-900/90 border border-indigo-500/30 hover:border-indigo-500 p-5 rounded-3xl space-y-3 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-indigo-500/20 rounded-xl">
                  <GraduationCap className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="text-[8px] font-black text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/40">
                  ACADEMIC CBT
                </span>
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase group-hover:text-indigo-300 transition-colors">8. Education Hub & CBT</h4>
                <p className="text-[10px] text-slate-400">JAMB mocks, WAEC cards, AI tutoring</p>
              </div>
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-400">{jambCandidates.length} Students</span>
                <span className="text-[9px] font-bold text-slate-400">{waecCards.length} WAEC Cards</span>
              </div>
            </div>

            {/* Hub 9: Service Corps Artisans */}
            <div 
              onClick={() => setSelectedHubTab('corps_loans_cscc')}
              className="bg-slate-900/60 hover:bg-slate-900/90 border border-orange-500/30 hover:border-orange-500 p-5 rounded-3xl space-y-3 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-orange-500/20 rounded-xl">
                  <Briefcase className="w-5 h-5 text-orange-400" />
                </div>
                <span className="text-[8px] font-black text-orange-300 bg-orange-500/20 px-2 py-0.5 rounded-full border border-orange-500/40">
                  ON-DEMAND
                </span>
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase group-hover:text-orange-300 transition-colors">9. Service Corps Artisans</h4>
                <p className="text-[10px] text-slate-400">Plumbers, electricians & mechanics</p>
              </div>
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="font-bold text-orange-400">{serviceProviders.length} Pros</span>
                <span className="text-[9px] font-bold text-slate-400">{serviceRequests.length} Jobs</span>
              </div>
            </div>

            {/* Hub 10: CSCC Community Savings */}
            <div 
              onClick={() => setSelectedHubTab('corps_loans_cscc')}
              className="bg-slate-900/60 hover:bg-slate-900/90 border border-blue-500/30 hover:border-blue-500 p-5 rounded-3xl space-y-3 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-[8px] font-black text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/40">
                  ESUSU CO-OP
                </span>
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase group-hover:text-blue-300 transition-colors">10. CSCC Savings Clusters</h4>
                <p className="text-[10px] text-slate-400">Rotating 10-day community savings</p>
              </div>
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="font-bold text-blue-400">{csccGroups.length} Groups</span>
                <span className="text-[9px] font-bold text-slate-400">Automated</span>
              </div>
            </div>

            {/* Hub 11: HEPIHANDS Loans */}
            <div 
              onClick={() => setSelectedHubTab('corps_loans_cscc')}
              className="bg-slate-900/60 hover:bg-slate-900/90 border border-rose-500/30 hover:border-rose-500 p-5 rounded-3xl space-y-3 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-rose-500/20 rounded-xl">
                  <DollarSign className="w-5 h-5 text-rose-400" />
                </div>
                <span className="text-[8px] font-black text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/40">
                  MICROCREDIT
                </span>
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase group-hover:text-rose-300 transition-colors">11. HEPIHANDS Loans</h4>
                <p className="text-[10px] text-slate-400">Vendor collateral & micro-financing</p>
              </div>
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="font-bold text-rose-400">{loans.length} Loans</span>
                <span className="text-[9px] font-bold text-slate-400">{loanApplications.length} Apps</span>
              </div>
            </div>

            {/* Hub 12: EFADO Zoom & Partners */}
            <div 
              onClick={() => setSelectedHubTab('domains_tech')}
              className="bg-slate-900/60 hover:bg-slate-900/90 border border-teal-500/30 hover:border-teal-500 p-5 rounded-3xl space-y-3 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-teal-500/20 rounded-xl">
                  <Tv className="w-5 h-5 text-teal-400" />
                </div>
                <span className="text-[8px] font-black text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded-full border border-teal-500/40">
                  ENTERPRISE
                </span>
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase group-hover:text-teal-300 transition-colors">12. Zoom & Global Partners</h4>
                <p className="text-[10px] text-slate-400">Encrypted virtual meetings & tier affiliates</p>
              </div>
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="font-bold text-teal-400">{zoomSubscriptions.length} Licenses</span>
                <span className="text-[9px] font-bold text-slate-400">{partnerApplications.length} Partners</span>
              </div>
            </div>

            {/* Hub 13: Mining Core & Skill Games */}
            <div 
              onClick={() => setSelectedHubTab('domains_tech')}
              className="bg-slate-900/60 hover:bg-slate-900/90 border border-amber-500/30 hover:border-amber-500 p-5 rounded-3xl space-y-3 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-amber-500/20 rounded-xl">
                  <Coins className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-[8px] font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
                  HASH & SKILL
                </span>
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase group-hover:text-amber-300 transition-colors">13. Mining & Money Quiz</h4>
                <p className="text-[10px] text-slate-400">Proof-of-dwell points & trivia stakes</p>
              </div>
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="font-bold text-amber-400">{users.filter(u => (u.miningWallet || 0) > 0).length} Miners</span>
                <span className="text-[9px] font-bold text-slate-400">{quizSessions.length} Quizzes</span>
              </div>
            </div>

            {/* Hub 14: DomainHub & Webmail */}
            <div 
              onClick={() => setSelectedHubTab('domains_tech')}
              className="bg-slate-900/60 hover:bg-slate-900/90 border border-blue-500/30 hover:border-blue-500 p-5 rounded-3xl space-y-3 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <Globe className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-[8px] font-black text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/40">
                  DOMAINS & MAIL
                </span>
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase group-hover:text-blue-300 transition-colors">14. DomainHub & Webmail</h4>
                <p className="text-[10px] text-slate-400">Registrars & corporate inboxes</p>
              </div>
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="font-bold text-blue-400">{domainOrders.length} Domains</span>
                <span className="text-[9px] font-bold text-slate-400">{emailAccounts.length} Accounts</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SUB-VIEW: REAL-TIME SITE ACTIVITY RADAR */}
      {selectedHubTab === 'activity_stream' && (
        <div className="bg-slate-900/60 border border-white/10 rounded-[2.5rem] p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tight font-display flex items-center gap-2">
                <Activity className="w-6 h-6 text-indigo-400 animate-pulse" />
                Live Unified Site Activity Radar
              </h3>
              <p className="text-xs text-slate-400">
                Tracking {allSiteActivities.length} real-time user events across all 14 website hubs
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {(['all', 'creators', 'finance', 'market', 'social', 'education', 'services', 'digital'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSiteActivityFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                    siteActivityFilter === cat
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter live activities by title, user identity, description, or hub name..."
              value={siteActivitySearch}
              onChange={(e) => setSiteActivitySearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-950 border border-white/10 rounded-2xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Activity Cards List */}
          {filteredSiteActivities.length === 0 ? (
            <div className="text-center py-16 text-slate-500 font-bold uppercase tracking-widest text-xs">
              No matching activity events found in radar buffer.
            </div>
          ) : (
            <div className="space-y-3 max-h-[700px] overflow-y-auto no-scrollbar pr-2">
              {filteredSiteActivities.map((act) => {
                const relativeTime = (() => {
                  const diff = Math.floor((Date.now() - act.timestamp) / 1000);
                  if (diff < 60) return `${diff}s ago`;
                  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
                  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
                  return `${Math.floor(diff / 86400)}d ago`;
                })();

                return (
                  <div
                    key={act.id}
                    className="bg-slate-950/70 border border-white/5 hover:border-white/20 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${act.badgeColor}`}>
                          {act.hubName}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {relativeTime}
                        </span>
                        {act.amount && (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-black rounded-full border border-emerald-500/30">
                            {act.amount}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-black text-white">{act.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">{act.description}</p>
                      <p className="text-[10px] font-mono text-slate-400 pt-1">
                        👤 Participant: <strong className="text-white">{act.user}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          const found = users.find(u => u.uid === act.userId || u.email === act.userEmail);
                          onDirectMessageUser(found || { uid: act.userId || 'user', email: act.userEmail || `${act.user}@efado.net`, accountName: act.user });
                        }}
                        className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                      >
                        <Send className="w-3 h-3" />
                        Message User
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. SUB-VIEW: CREATOR MONETIZATION & WALLETS (P0 SPEC) */}
      {selectedHubTab === 'creators' && (
        <div className="space-y-6">
          {/* USER SPEC EXACT GRADIENT CARD FOR CREATOR WALLET */}
          <div className="bg-gradient-to-r from-[#8B5CF6] via-[#06B6D4] to-[#FACC15] p-6 rounded-3xl shadow-2xl mb-4 text-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
              <div>
                <p className="text-white/80 text-xs font-black tracking-widest uppercase">CEO CREATOR MONETIZATION CONSOLE</p>
                <h2 className="text-white font-bold text-3xl md:text-4xl font-display">
                  ₦{(creatorStatsAggregate.totalAvailable + creatorStatsAggregate.totalPending).toLocaleString()}
                </h2>
                <p className="text-white/90 text-xs font-bold mt-1">
                  ₦{creatorStatsAggregate.totalAvailable.toLocaleString()} Available Liquid • ₦{creatorStatsAggregate.totalPending.toLocaleString()} in 7-Day Escrow Pool
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-xl font-bold text-xs">
                  {creatorStatsAggregate.totalCount} Enrolled Creators
                </span>
              </div>
            </div>
            
            <p className="text-white text-sm font-medium">
              +₦{creatorStatsAggregate.todayEarnings.toLocaleString()} Today from {creatorStatsAggregate.todayViews.toLocaleString()} Qualified Views (5s dwell time)
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-center">
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
                <p className="text-[10px] text-white/80 font-bold uppercase tracking-wider">Monetization Rate</p>
                <p className="text-lg font-black text-white">₦200 / 1K</p>
                <p className="text-[9px] text-white/70">Per 1,000 5s Qualified Views</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
                <p className="text-[10px] text-white/80 font-bold uppercase tracking-wider">Launch Super Bonus</p>
                <p className="text-lg font-black text-yellow-300">₦500 / 1K</p>
                <p className="text-[9px] text-white/70">Total ₦700/1K Promotional Payout</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
                <p className="text-[10px] text-white/80 font-bold uppercase tracking-wider">Escrow Maturity</p>
                <p className="text-lg font-black text-white">7 Days</p>
                <p className="text-[9px] text-white/70">Automated Anti-Fraud Release</p>
              </div>
            </div>
          </div>

          {/* Search Creators Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search creators by user ID, account details or balance threshold..."
              value={creatorSearchQuery}
              onChange={(e) => setCreatorSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-white/10 rounded-2xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            />
          </div>

          {/* Creators Monetization Ledger Table */}
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 space-y-4">
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center justify-between">
              <span>Creator Wallets & Qualified Views Ledger ({creatorStatsList.length} Creators)</span>
              <span className="text-xs font-normal text-slate-400">Real-time Firestore sync (`creator_stats`)</span>
            </h4>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="p-3">Creator / Account</th>
                    <th className="p-3">Qualified Views</th>
                    <th className="p-3">Available Balance</th>
                    <th className="p-3">Pending (7d Escrow)</th>
                    <th className="p-3">Today Earnings</th>
                    <th className="p-3">All-Time Yield</th>
                    <th className="p-3 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {creatorStatsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-500 font-bold uppercase">
                        No creator statistics initialized in database yet.
                      </td>
                    </tr>
                  ) : (
                    creatorStatsList
                      .filter(c => {
                        if (!creatorSearchQuery) return true;
                        const q = creatorSearchQuery.toLowerCase();
                        return (c.id || '').toLowerCase().includes(q) ||
                               (c.userEmail || '').toLowerCase().includes(q);
                      })
                      .map(creator => {
                        const userMatch = users.find(u => u.uid === creator.id || u.email === creator.userEmail);
                        return (
                          <tr key={creator.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-3 font-mono">
                              <p className="font-bold text-white">{userMatch?.accountName || creator.userEmail || creator.id}</p>
                              <p className="text-[10px] text-slate-500">ID: {creator.id}</p>
                            </td>
                            <td className="p-3 font-mono font-bold text-cyan-400">
                              {(creator.totalViews || 0).toLocaleString()}
                            </td>
                            <td className="p-3 font-mono font-bold text-emerald-400">
                              ₦{(creator.availableBalance || 0).toLocaleString()}
                            </td>
                            <td className="p-3 font-mono font-bold text-amber-400">
                              ₦{(creator.pendingBalance || 0).toLocaleString()}
                            </td>
                            <td className="p-3 font-mono font-bold text-purple-400">
                              +₦{(creator.todayEarnings || 0).toLocaleString()}
                            </td>
                            <td className="p-3 font-mono font-bold text-white">
                              ₦{(creator.totalEarnings || 0).toLocaleString()}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {(creator.pendingBalance || 0) > 0 && (
                                  <button
                                    onClick={() => handleReleaseCreatorEscrowEarly(creator.id, creator.pendingBalance)}
                                    className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                                  >
                                    Release Escrow
                                  </button>
                                )}
                                <button
                                  onClick={() => onDirectMessageUser(userMatch || { uid: creator.id, email: creator.userEmail || 'creator@efado.net', accountName: 'Creator' })}
                                  className="px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                                >
                                  Message
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. SUB-VIEW: GIST HUB & LIVE VIDEO */}
      {selectedHubTab === 'gist_social' && (
        <div className="space-y-6">
          {/* Live Streaming Rooms */}
          <div className="bg-slate-900/60 border border-rose-500/30 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500/20 rounded-xl">
                  <Radio className="w-5 h-5 text-rose-400 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white uppercase tracking-wider">
                    Gist Hub Live Video Broadcast Rooms ({liveRooms.length})
                  </h4>
                  <p className="text-xs text-slate-400">Live audience telemetry, gifts & 80/20 creator-house revenue split</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-rose-500/20 text-rose-300 rounded-full text-[10px] font-black uppercase tracking-wider border border-rose-500/40">
                80% Creator / 20% House
              </span>
            </div>

            {liveRooms.length === 0 ? (
              <div className="text-center py-10 text-slate-500 italic">No live video broadcast rooms active right now.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveRooms.map(room => (
                  <div key={room.id} className="bg-slate-950 border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-rose-500 text-white text-[8px] font-black uppercase rounded-full animate-pulse">
                        🔴 LIVE
                      </span>
                      <span className="text-xs font-mono font-bold text-white flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        {room.viewerCount || 0} Viewers
                      </span>
                    </div>
                    <h5 className="text-sm font-black text-white truncate">{room.title || 'Interactive Gist Live'}</h5>
                    <p className="text-xs text-slate-400">Host: <strong className="text-white">{room.hostName || room.hostId}</strong></p>
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-yellow-400 font-black">🎁 ₦{(room.totalGifts || 0).toLocaleString()} Gifts</span>
                      <button 
                        onClick={() => {
                          const found = users.find(u => u.uid === room.hostId);
                          onDirectMessageUser(found || { uid: room.hostId, accountName: room.hostName || 'Host', email: 'host@efado.net' });
                        }}
                        className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase"
                      >
                        Message Host →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Video Reels & Gists */}
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 space-y-4">
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Gist Hub Video Reels & Short Form Content ({reels.length} Published)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {reels.slice(0, 8).map(reel => (
                <div key={reel.id} className="bg-slate-950 border border-white/10 rounded-2xl p-3 space-y-2">
                  <div className="aspect-[9/12] bg-slate-900 rounded-xl overflow-hidden relative">
                    <video src={reel.videoUrl} className="w-full h-full object-cover" controls preload="metadata" />
                  </div>
                  <h6 className="text-xs font-bold text-white line-clamp-1">{reel.caption || 'Video Reel'}</h6>
                  <p className="text-[10px] text-slate-400">👤 {reel.authorName || 'Creator'} • ❤️ {reel.likes?.length || 0}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. SUB-VIEW: DIGITAL SERVICES, VENDING & CHINA SOURCING */}
      {selectedHubTab === 'digital_services' && (
        <div className="space-y-6">
          {/* Airtime & Data Vending Records */}
          <div className="bg-slate-900/60 border border-cyan-500/30 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-xl">
                  <Smartphone className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white uppercase tracking-wider">
                    Airtime & Data Telecom Vending Records ({vendingPurchases.length})
                  </h4>
                  <p className="text-xs text-slate-400">120+ Countries, automated VTU network delivery</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[10px] font-black uppercase text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="p-3">Phone / Target</th>
                    <th className="p-3">Network / Country</th>
                    <th className="p-3">Service Type</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {vendingPurchases.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-6 text-slate-500">No vending records yet.</td></tr>
                  ) : (
                    vendingPurchases.map(vp => (
                      <tr key={vp.id} className="hover:bg-white/5">
                        <td className="p-3 font-mono font-bold text-white">{vp.phoneNumber}</td>
                        <td className="p-3">{vp.network || 'MTN / Airtel'}</td>
                        <td className="p-3 font-bold text-cyan-400 uppercase">{vp.serviceType || 'Airtime'}</td>
                        <td className="p-3 font-mono font-bold text-emerald-400">₦{(vp.amount || 0).toLocaleString()}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-black rounded-full">
                            {vp.status || 'SUCCESS'}
                          </span>
                        </td>
                        <td className="p-3 text-[10px] font-mono text-slate-400">
                          {vp.createdAt?.toDate ? vp.createdAt.toDate().toLocaleDateString() : 'Today'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* China Direct Factory Sourcing Requests */}
          <div className="bg-slate-900/60 border border-amber-500/30 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-xl">
                  <Package className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white uppercase tracking-wider">
                    China Direct Factory Sourcing Quotes ({sourcingRequests.length})
                  </h4>
                  <p className="text-xs text-slate-400">Factory direct bulk procurement, shipping & customs clearing</p>
                </div>
              </div>
            </div>

            {sourcingRequests.length === 0 ? (
              <div className="text-center py-8 text-slate-500 italic">No wholesale sourcing requests logged yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sourcingRequests.map(sr => (
                  <div key={sr.id} className="bg-slate-950 border border-white/10 rounded-2xl p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="text-sm font-black text-white">{sr.productName || 'Wholesale Sourcing Item'}</h5>
                        <p className="text-[10px] text-slate-400">Quantity: {sr.quantity || 1} units • Port: {sr.destinationPort || 'Lagos Airport / Sea'}</p>
                      </div>
                      <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-[9px] font-black rounded-full">
                        {sr.status || 'IN REVIEW'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{sr.specifications || 'Standard manufacturer specifications'}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-[10px] text-slate-400 font-mono">👤 {sr.contactName || sr.userEmail}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateSourcingStatus(sr.id, 'quoted')}
                          className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg text-[9px] font-black uppercase"
                        >
                          Mark Quoted
                        </button>
                        <button
                          onClick={() => handleUpdateSourcingStatus(sr.id, 'delivered')}
                          className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-[9px] font-black uppercase"
                        >
                          Delivered
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Crypto OTC Terminal Conversions */}
          <div className="bg-slate-900/60 border border-yellow-500/30 rounded-3xl p-6 space-y-4">
            <h4 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-yellow-400" />
              Crypto OTC Currency Swaps ({cryptoConversions.length})
            </h4>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[10px] font-black uppercase text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Crypto Sold</th>
                    <th className="p-3">Agreed Rate</th>
                    <th className="p-3">Payout Due (NGN)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {cryptoConversions.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-6 text-slate-500">No crypto OTC swaps yet.</td></tr>
                  ) : (
                    cryptoConversions.map(cc => (
                      <tr key={cc.id} className="hover:bg-white/5">
                        <td className="p-3 font-mono text-white">{cc.userEmail || cc.userId}</td>
                        <td className="p-3 font-bold text-yellow-400">{cc.cryptoAmount} {cc.cryptoSymbol || 'USDT'}</td>
                        <td className="p-3 font-mono">₦{(cc.rate || 0).toLocaleString()}</td>
                        <td className="p-3 font-mono font-bold text-emerald-400">₦{(cc.payoutNaira || 0).toLocaleString()}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                            cc.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {cc.status || 'PENDING'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {cc.status !== 'completed' && (
                            <button
                              onClick={() => handleUpdateCryptoStatus(cc.id, 'completed')}
                              className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-[9px] font-black uppercase"
                            >
                              Approve Payout
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. SUB-VIEW: EDUCATION HUB & CBT TERMINAL */}
      {selectedHubTab === 'education' && (
        <div className="space-y-6">
          {/* JAMB CBT Mock Candidate Logs */}
          <div className="bg-slate-900/60 border border-indigo-500/30 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-xl">
                  <GraduationCap className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white uppercase tracking-wider">
                    JAMB CBT Examination Terminal ({jambCandidates.length} Candidates)
                  </h4>
                  <p className="text-xs text-slate-400">Standardized 400-mark mock practice sessions & analytics</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[10px] font-black uppercase text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">CBT Score</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {jambCandidates.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-6 text-slate-500">No mock candidates completed yet.</td></tr>
                  ) : (
                    jambCandidates.map(jc => (
                      <tr key={jc.id} className="hover:bg-white/5">
                        <td className="p-3 font-bold text-white">{jc.fullName || jc.email}</td>
                        <td className="p-3">{jc.subject || 'All Subjects'}</td>
                        <td className="p-3 font-mono font-black text-indigo-400">{jc.score || 0} / 400</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-black rounded-full">
                            VERIFIED
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono text-slate-400">
                          {jc.createdAt?.toDate ? jc.createdAt.toDate().toLocaleDateString() : 'Today'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* WAEC Scratch Cards Inventory */}
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 space-y-4">
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-400" />
              WAEC Result Scratch Card Inventory & Sales ({waecCards.length} PINs)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Total PINs In Vault</p>
                <p className="text-2xl font-black text-white">{waecCards.length}</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Purchased / Dispensed</p>
                <p className="text-2xl font-black text-emerald-400">{waecCards.filter(c => c.status === 'used').length}</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Unit Price</p>
                <p className="text-2xl font-black text-indigo-400">₦3,500</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. SUB-VIEW: MARKETPLACE & ADS */}
      {selectedHubTab === 'marketplace_ads' && (
        <div className="bg-slate-900/60 border border-white/10 rounded-[2.5rem] p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tight font-display flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-emerald-400" />
                Modern & Fairly Used Marketplace & Advertising Console
              </h3>
              <p className="text-xs text-slate-400">
                Oversight over products, advertisements, seller inquiries and order fulfillment
              </p>
            </div>

            {/* Sub-tab pills */}
            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-white/10">
              <button
                onClick={() => setEcosystemContentTab('ads')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                  ecosystemContentTab === 'ads' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Ads ({adListings.length + ads.length})
              </button>
              <button
                onClick={() => setEcosystemContentTab('market')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                  ecosystemContentTab === 'market' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Catalog ({marketProducts.length})
              </button>
              <button
                onClick={() => setEcosystemContentTab('orders')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                  ecosystemContentTab === 'orders' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Orders ({marketOrders.length})
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products or ads by title, seller, category, status..."
              value={contentSearchQuery}
              onChange={(e) => setContentSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-white/10 rounded-2xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Render Ads */}
          {ecosystemContentTab === 'ads' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...adListings, ...ads]
                .filter(ad => {
                  if (!contentSearchQuery) return true;
                  const q = contentSearchQuery.toLowerCase();
                  return (ad.title || '').toLowerCase().includes(q) ||
                         (ad.sellerEmail || ad.userEmail || '').toLowerCase().includes(q) ||
                         (ad.category || '').toLowerCase().includes(q);
                })
                .map((ad, idx) => (
                  <div key={ad.id || idx} className="bg-slate-950 border border-white/10 rounded-2xl p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[8px] font-black uppercase rounded-full">
                          {ad.category || 'AD CAMPAIGN'}
                        </span>
                        <h5 className="text-sm font-black text-white mt-1">{ad.title || 'Untitled Ad'}</h5>
                      </div>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        ${(ad.price || ad.budget || 0).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2">{ad.description}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-[10px] text-slate-400">👤 {ad.sellerEmail || ad.userEmail || 'System'}</span>
                      <div className="flex items-center gap-2">
                        {ad.status !== 'sold_out' ? (
                          <button
                            onClick={() => handleUpdateContentStatus('ad_listings', ad.id, 'sold_out')}
                            disabled={isProcessing}
                            className="px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-lg text-[9px] font-black uppercase"
                          >
                            Mark Sold Out
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateContentStatus('ad_listings', ad.id, 'active')}
                            disabled={isProcessing}
                            className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-[9px] font-black uppercase"
                          >
                            Reactivate
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteContentItem('ad_listings', ad.id)}
                          disabled={isProcessing}
                          className="px-2.5 py-1 bg-rose-500/20 text-rose-400 rounded-lg text-[9px] font-black uppercase"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Render Products */}
          {ecosystemContentTab === 'market' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {marketProducts
                .filter(p => {
                  if (!contentSearchQuery) return true;
                  const q = contentSearchQuery.toLowerCase();
                  return (p.title || p.name || '').toLowerCase().includes(q) ||
                         (p.vendorEmail || '').toLowerCase().includes(q);
                })
                .map((prod, idx) => (
                  <div key={prod.id || idx} className="bg-slate-950 border border-white/10 rounded-2xl p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[8px] font-black uppercase rounded-full">
                          {prod.category || 'CATALOG'}
                        </span>
                        <h5 className="text-sm font-black text-white mt-1">{prod.title || prod.name}</h5>
                      </div>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        ₦{(prod.price || 0).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2">{prod.description}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-[10px] text-slate-400">Vendor: {prod.vendorName || prod.vendorEmail}</span>
                      <button
                        onClick={() => handleDeleteContentItem('market_products', prod.id)}
                        disabled={isProcessing}
                        className="px-2.5 py-1 bg-rose-500/20 text-rose-400 rounded-lg text-[9px] font-black uppercase"
                      >
                        Delete Product
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Render Orders */}
          {ecosystemContentTab === 'orders' && (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[10px] font-black uppercase text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Product</th>
                    <th className="p-3">Total Amount</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {marketOrders.map(mo => (
                    <tr key={mo.id} className="hover:bg-white/5">
                      <td className="p-3 font-mono font-bold text-white">{mo.id}</td>
                      <td className="p-3">{mo.buyerEmail || mo.customerName}</td>
                      <td className="p-3">{mo.productTitle || 'Market Goods'}</td>
                      <td className="p-3 font-mono font-bold text-emerald-400">
                        ₦{(mo.totalPrice || mo.amountCharged || 0).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-black rounded-full">
                          {mo.status || 'COMPLETED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 9. SUB-VIEW: SERVICE CORPS, LOANS & CSCC */}
      {selectedHubTab === 'corps_loans_cscc' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Service Corps Overview */}
            <div className="bg-slate-900/60 border border-orange-500/30 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-xl">
                  <Briefcase className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase">Service Corps Artisans</h4>
                  <p className="text-[10px] text-slate-400">{serviceProviders.length} registered artisan pros</p>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Total Client Jobs:</span>
                  <span className="font-bold text-white">{serviceRequests.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Active Requests:</span>
                  <span className="font-bold text-orange-400">{serviceRequests.filter(s => s.status === 'pending').length}</span>
                </div>
              </div>
            </div>

            {/* HEPIHANDS Loans Overview */}
            <div className="bg-slate-900/60 border border-rose-500/30 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500/20 rounded-xl">
                  <DollarSign className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase">HEPIHANDS Loans</h4>
                  <p className="text-[10px] text-slate-400">Microfinance collateral financing</p>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Active Loans:</span>
                  <span className="font-bold text-white">{loans.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Pending Applications:</span>
                  <span className="font-bold text-rose-400">{loanApplications.filter(l => l.status === 'pending').length}</span>
                </div>
              </div>
            </div>

            {/* CSCC Community Savings */}
            <div className="bg-slate-900/60 border border-blue-500/30 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase">CSCC Savings Clusters</h4>
                  <p className="text-[10px] text-slate-400">Rotating communal thrift cycles</p>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Active Clusters:</span>
                  <span className="font-bold text-white">{csccGroups.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Rotation Cycle:</span>
                  <span className="font-bold text-blue-400">10 Days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. SUB-VIEW: DOMAINHUB, ZOOM & MINING */}
      {selectedHubTab === 'domains_tech' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* DomainHub */}
            <div className="bg-slate-900/60 border border-blue-500/30 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <Globe className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase">DomainHub Registrars</h4>
                  <p className="text-[10px] text-slate-400">{domainOrders.length} domain name orders</p>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Gross Registration:</span>
                  <span className="font-bold text-emerald-400">${domainOrders.reduce((acc, o) => acc + (o.amountCharged || 0), 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Active Sellers:</span>
                  <span className="font-bold text-white">{domainSellers.length}</span>
                </div>
              </div>
            </div>

            {/* EFADO Zoom & Partners */}
            <div className="bg-slate-900/60 border border-teal-500/30 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-500/20 rounded-xl">
                  <Tv className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase">Zoom & Affiliates</h4>
                  <p className="text-[10px] text-slate-400">{zoomSubscriptions.length} enterprise licenses</p>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Partner Applications:</span>
                  <span className="font-bold text-teal-400">{partnerApplications.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Live Encrypted Classes:</span>
                  <span className="font-bold text-white">{liveBroadcastClasses.length}</span>
                </div>
              </div>
            </div>

            {/* Mining Core */}
            <div className="bg-slate-900/60 border border-amber-500/30 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-xl">
                  <Coins className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase">Mining Core & Quizzes</h4>
                  <p className="text-[10px] text-slate-400">12.8 GH/s simulated network speed</p>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Active Workers:</span>
                  <span className="font-bold text-white">{users.filter(u => (u.miningWallet || 0) > 0).length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Money Quizzes:</span>
                  <span className="font-bold text-amber-400">{quizSessions.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
