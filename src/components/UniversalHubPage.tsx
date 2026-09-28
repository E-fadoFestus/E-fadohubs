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
  Home
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
  const hubConfig = getHubBySlug(slug) || HUBS[0];

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
          <ArenaHubView
            user={user}
            wallet={wallet}
            onResult={onResult}
            onStakeDeduction={onStakeDeduction}
            onOpenCashier={onOpenCashier}
            onLogin={onLogin}
          />
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
