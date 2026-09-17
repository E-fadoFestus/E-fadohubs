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
  LogIn
} from 'lucide-react';
import { HUBS, getHubBySlug, HubConfig } from '../config/hubs';
import { UserProfile } from '../types';
import { UniversalHubHeader } from './UniversalHubHeader';
import { ArenaHubView } from './ArenaHubView';
import { ModernMarketHub } from './ModernMarketHub';
import { EfadoAdvertisingHub } from './EfadoAdvertisingHub';
import { EfadoDigitalServicesHub } from './EfadoDigitalServicesHub';
import { EfadoCommunityHubs } from './EfadoCommunityHubs';
import { EfadoHepiHandsLoan } from './EfadoHepiHandsLoan';
import { EfadoDomainHub } from './EfadoDomainHub';
import { EfadoEducationHub } from './EfadoEducationHub';
import { EfadoTechHub } from './tech/EfadoTechHub';

interface UniversalHubPageProps {
  slug: string;
  user: UserProfile | null;
  wallet: number;
  onNavigateHub: (slug: string, inNewTab?: boolean) => void;
  onOpenCashier?: () => void;
  onLogin?: () => void;
  onResult: (winAmount: number, gameId: string, stake: number, metadata?: any) => void;
  onStakeDeduction?: (amount: number, gameId: string) => Promise<void>;
  onUpdateBalance?: (amount: number) => void;
}

export const UniversalHubPage: React.FC<UniversalHubPageProps> = ({
  slug,
  user,
  wallet,
  onNavigateHub,
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
          <div className="space-y-4">
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

            <ModernMarketHub 
              user={effectiveUser} 
              onClose={() => onNavigateHub('all-hubs', false)}
            />
          </div>
        );

      case 'advertising':
        return (
          <EfadoAdvertisingHub
            user={effectiveUser}
            onClose={() => onNavigateHub('all-hubs', false)}
            initialType="ADVERT"
          />
        );

      case 'services':
        return (
          <div className="space-y-4">
            <EfadoTechHub
              user={effectiveUser}
              onClose={() => onNavigateHub('all-hubs', false)}
              onStartZoomSession={() => {}}
            />
          </div>
        );

      case 'community':
        return (
          <EfadoCommunityHubs
            user={effectiveUser}
            onClose={() => onNavigateHub('all-hubs', false)}
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
            onClose={() => onNavigateHub('all-hubs', false)}
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
      {/* Universal Sticky Top Header for this Hub */}
      <UniversalHubHeader
        currentHub={hubConfig}
        user={user}
        wallet={wallet}
        onNavigateHub={onNavigateHub}
        onOpenCashier={onOpenCashier}
        onLogin={onLogin}
      />

      {/* Guest Mode Banner (if visitor opened direct link without logging in) */}
      {!user && (
        <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 border-b border-cyan-500/20 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 shadow-inner">
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

      {/* Hub Body View */}
      <main className="flex-1 w-full">
        {renderHubContent()}
      </main>
    </div>
  );
};
