import React, { useState } from 'react';
import { 
  Gamepad2, 
  ShoppingBag, 
  Megaphone, 
  HardHat, 
  Users, 
  HandCoins, 
  Zap, 
  Package, 
  Coins, 
  GraduationCap, 
  Layers, 
  Share2, 
  Check, 
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  LogIn,
  Home,
  MessageSquare
} from 'lucide-react';
import { HUBS, getHubBySlug, HubConfig } from '../config/hubs';
import { UserProfile } from '../types';
import { UniversalHubHeader } from './UniversalHubHeader';
import { ArenaHubView } from './ArenaHubView';
import { ModernMarketHub } from './ModernMarketHub';
import { FairlyUsedMarket } from './FairlyUsedMarket';
import { EfadoAdvertisingHub } from './EfadoAdvertisingHub';
import { EfadoDigitalServicesHub } from './EfadoDigitalServicesHub';
import { EfadoCommunityHubs } from './EfadoCommunityHubs';
import { EfadoHepiHandsLoan } from './EfadoHepiHandsLoan';
import { EfadoDomainHub } from './EfadoDomainHub';
import { EfadoEducationHub } from './EfadoEducationHub';
import { EfadoTechHub } from './tech/EfadoTechHub';
import { EfadoGistHub } from './EfadoGistHub';
import { EfadoNexusHubView } from './EfadoNexusHubView';
import { EfadoServiceCorps } from './EfadoServiceCorps';
import { UserWallet } from './UserWallet';
import { EfadoPartnerHub } from './EfadoPartnerHub';
import { EfadoAiLabPage } from './ai/EfadoAiLabPage';

interface UniversalHubPageProps {
  slug: string;
  itemId?: string;
  user: UserProfile | null;
  wallet: number;
  onNavigateHub: (slug: string, inNewTab?: boolean) => void;
  onNavigateHome: () => void;
  onOpenCashier?: () => void;
  onLogin?: () => void;
  onResult: (winAmount: number, gameId: string, stake: number, metadata?: any) => void;
  onStakeDeduction?: (amount: number, gameId: string) => Promise<void>;
  onUpdateBalance?: (amount: number) => void;
}

export const UniversalHubPage: React.FC<UniversalHubPageProps> = ({
  slug,
  itemId,
  user,
  wallet,
  onNavigateHub,
  onNavigateHome,
  onOpenCashier,
  onLogin,
  onResult,
  onStakeDeduction,
  onUpdateBalance
}) => {
  const [marketView, setMarketView] = useState<'new' | 'used'>('new');
  const [isNexusSynced, setIsNexusSynced] = useState(false);
  const hubConfig = getHubBySlug(slug) || (slug === 'home' ? { name: 'Home', slug: 'home', tag: 'HOME', desc: 'Home', color: 'from-emerald-600 to-teal-600', route: '/home' } : (HUBS.find(h => h.slug === 'nexus-hub') || HUBS[0]));

  // Helper guest mock profile so guest users can preview hub interfaces cleanly without crashes
  const effectiveUser: UserProfile = user || {
    uid: 'guest-preview',
    email: 'guest@e-fado.com',
    displayName: 'Guest Explorer',
    playerWallet: 0,
    depositWallet: 0,
    cashOutWallet: 0,
    role: 'player',
    createdAt: new Date().toISOString()
  };

  const renderHubContent = () => {
    switch (hubConfig.slug) {
      case 'arena':
        return (
          <ArenaHubView
            user={user}
            wallet={wallet}
            onResult={onResult}
            onStakeDeduction={onStakeDeduction}
            onOpenCashier={onOpenCashier}
            onLogin={onLogin}
          />
        );

      case 'market':
        return (
          <div className="space-y-4 w-full">
            <div className="bg-slate-900/90 border-b border-cyan-500/20 px-4 py-2.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400 uppercase font-bold">Catalog:</span>
                <button
                  onClick={() => setMarketView('new')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    marketView === 'new'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  Modern Market (New Goods)
                </button>
                <button
                  onClick={() => setMarketView('used')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    marketView === 'used'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  Fairly Used Marketplace
                </button>
              </div>
              <div className="text-xs text-slate-400 hidden sm:block">
                <span>Direct vendor escrow & verified logistics</span>
              </div>
            </div>

            {marketView === 'new' ? (
              <ModernMarketHub 
                user={effectiveUser} 
                onClose={onNavigateHome}
                initialItemId={itemId}
              />
            ) : (
              <FairlyUsedMarket
                user={effectiveUser}
                onClose={onNavigateHome}
                initialItemId={itemId}
              />
            )}
          </div>
        );

      case 'advertising':
        return (
          <EfadoAdvertisingHub
            user={effectiveUser}
            onClose={onNavigateHome}
            initialType="ADVERT"
            initialItemId={itemId}
          />
        );

      case 'services':
        return (
          <div className="space-y-4 w-full">
            <EfadoServiceCorps
              user={effectiveUser}
              onClose={onNavigateHome}
            />
          </div>
        );

      case 'tech':
        return (
          <div className="space-y-4 w-full">
            <EfadoTechHub
              user={effectiveUser}
              onClose={onNavigateHome}
              onStartZoomSession={() => {}}
            />
          </div>
        );

      case 'gist':
        return (
          <EfadoGistHub
            user={effectiveUser}
            onClose={onNavigateHome}
            initialView="FEED"
          />
        );

      case 'community':
        return (
          <EfadoCommunityHubs
            user={effectiveUser}
            onClose={onNavigateHome}
          />
        );

      case 'loan':
        return (
          <EfadoHepiHandsLoan
            user={effectiveUser}
          />
        );

      case 'data-vending':
        return (
          <EfadoDigitalServicesHub
            user={effectiveUser}
            initialSection="vending"
          />
        );

      case 'china':
        return (
          <EfadoDomainHub
            user={effectiveUser}
            initialSection="sourcing"
          />
        );

      case 'crypto':
        return (
          <EfadoDigitalServicesHub
            user={effectiveUser}
            initialSection="crypto"
          />
        );

      case 'education':
        return (
          <EfadoEducationHub
            user={effectiveUser}
            onClose={onNavigateHome}
          />
        );

      case 'dashboard':
        return (
          <UserWallet
            user={effectiveUser}
            onUpdateBalance={async () => {}}
            onClose={onNavigateHome}
            initialTab="overview"
          />
        );

      case 'home':
        onNavigateHome();
        return null;

      case 'nexus-hub':
      case 'nexus':
      case 'gist':
        if (isNexusSynced) {
          return (
            <EfadoNexusHubView
              user={effectiveUser}
              onClose={() => setIsNexusSynced(false)}
            />
          );
        }
        return (
          <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
              <h2 className="text-2xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                <MessageSquare className="w-6 h-6 text-indigo-500" />
                EFADO NEXUS HUB
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left explanation card */}
              <div className="md:col-span-2 bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                      <MessageSquare className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">What is EFADO Nexus Hub?</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed uppercase tracking-wide">
                    The <span className="text-indigo-400 font-extrabold">EFADO Nexus Hub</span> establishes a real-time secure communication socket between your current device and our decentralized cloud servers. This synchronizes your private chats, direct messages, blog channels, sovereign groups, 10 action buttons, viral reels, and creator monetization profiles with 100% data integrity.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/5 mt-4 flex items-center justify-between">
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest animate-pulse">● System Status: Secure & Encrypted</span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Protocol: V3.4</span>
                </div>
              </div>

              {/* Right small, strategic Action card */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl flex flex-col justify-center items-center text-center">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-indigo-400" />
                </div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider mb-2">Connect EFADO Nexus Hub</h4>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-6">Access secure feeds, real-time chats, reels & 10 action buttons</p>
                <button 
                  onClick={() => setIsNexusSynced(true)}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-lg transition-all active:scale-95 uppercase tracking-widest text-[9px] border border-indigo-500/30"
                >
                  Synchronize Now
                </button>
              </div>
            </div>
          </div>
        );

      case 'partners':
        return (
          <EfadoPartnerHub
            user={effectiveUser}
            onNavigate={(h) => onNavigateHub(h)}
          />
        );

      case 'ai-lab':
        return (
          <EfadoAiLabPage
            user={effectiveUser}
            onNavigateHome={onNavigateHome}
            onNavigateHub={onNavigateHub}
          />
        );

      default:
        return (
          <div className="text-center py-24 px-4 max-w-lg mx-auto">
            <h3 className="text-xl font-bold mb-3 text-white">Hub View</h3>
            <p className="text-slate-400 text-sm mb-6">Return to the EFADO home dashboard to explore the ecosystem.</p>
            <button
              onClick={onNavigateHome}
              className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider"
            >
              ← Return to Home
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#070b19] text-white flex flex-col">
      {/* Fixed Sticky BACK TO HOME Top Bar across every hub page */}
      <div className="sticky top-0 z-50 w-full bg-slate-950/95 backdrop-blur-xl border-b border-amber-500/40 px-3 sm:px-6 py-2 shadow-2xl shadow-black/70 flex items-center justify-between gap-3">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:scale-[1.03] active:scale-[0.98] transition-all group"
          title="Return to Home Page"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1.5 transition-transform" />
          <span>← BACK TO HOME</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 shadow-inner">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-black text-white uppercase tracking-tight">{hubConfig.name}</span>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-bold uppercase tracking-wider shadow-sm">
            {hubConfig.tag}
          </span>
        </div>
      </div>

      {/* Universal Sticky Top Header for this Hub */}
      <UniversalHubHeader
        currentHub={hubConfig}
        user={user}
        wallet={wallet}
        onNavigateHub={onNavigateHub}
        onNavigateHome={onNavigateHome}
        onOpenCashier={onOpenCashier}
        onLogin={onLogin}
      />

      {/* Guest Mode Banner (if visitor opened direct link without logging in) */}
      {!user && (
        <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 border-b border-cyan-500/20 px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-2 text-cyan-300">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>You are previewing <strong>{hubConfig.name}</strong> as an authenticated guest. Sign in to access your synchronized wallet.</span>
          </div>
          <button
            onClick={onLogin}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In to Access Full Wallet</span>
          </button>
        </div>
      )}

      {/* Hub Body View - Standalone, Fresh, Wide (Not congested) */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {renderHubContent()}
      </main>
    </div>
  );
};
