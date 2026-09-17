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
  ExternalLink, 
  Share2, 
  Check, 
  ArrowRight, 
  Wallet, 
  Search, 
  ShieldCheck, 
  Sparkles,
  Layers,
  Compass
} from 'lucide-react';
import { HUBS, HubConfig } from '../config/hubs';
import { UserProfile } from '../types';

interface VerticalHubsPageProps {
  user: UserProfile | null;
  wallet: number;
  onNavigateHub: (slug: string, inNewTab?: boolean) => void;
  onOpenCashier?: () => void;
  onLogin?: () => void;
}

const HUB_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  arena: Gamepad2,
  market: ShoppingBag,
  advertising: Megaphone,
  services: HardHat,
  community: Users,
  loan: HandCoins,
  'data-vending': Zap,
  china: Package,
  crypto: Coins,
  education: GraduationCap,
};

export const VerticalHubsPage: React.FC<VerticalHubsPageProps> = ({
  user,
  wallet,
  onNavigateHub,
  onOpenCashier,
  onLogin,
}) => {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const allTags = ['ALL', ...Array.from(new Set(HUBS.map(h => h.tag)))];

  const handleCopyLink = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/hub/${slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedSlug(slug);
        setTimeout(() => setCopiedSlug(null), 2000);
      }).catch(() => {
        prompt('Copy direct hub link:', url);
      });
    } else {
      prompt('Copy direct hub link:', url);
    }
  };

  const handleLaunchTab = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/hub/${slug}`;
    window.open(url, '_blank', 'noopener,noreferrer'); // KEY: STAYS OPEN IN SEPARATE BROWSER TAB
  };

  const filteredHubs = HUBS.filter(h => {
    const matchesTag = selectedTag === 'ALL' || h.tag === selectedTag;
    const matchesQuery = !searchQuery.trim() || 
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.tag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-[#070b19] text-white pb-24 selection:bg-cyan-500 selection:text-black">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0a1128] via-[#080e20] to-[#070b19] border-b border-cyan-500/20 pt-10 pb-12 px-4 sm:px-6">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-widest mb-3">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>E-FADO ECOSYSTEM • 10 VERTICAL HUBS</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white drop-shadow-md">
                Vertical Hubs Directory
              </h1>
              <p className="text-slate-400 text-sm sm:text-base max-w-2xl mt-2 leading-relaxed">
                Launch any destination hub in a dedicated tab. Enjoy 1 Unified Login and 1 Synchronized Wallet across all specialized platforms.
              </p>
            </div>

            {/* 1 Unified Wallet Card */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div 
                onClick={onOpenCashier}
                className="bg-slate-900/90 hover:bg-slate-850 border-2 border-emerald-500/40 rounded-2xl p-4 shadow-xl shadow-emerald-950/20 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Unified Wallet</span>
                      <span className="text-xl sm:text-2xl font-mono font-black text-emerald-400">
                        ₦{wallet.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold transition-colors">
                    Top Up
                  </button>
                </div>
              </div>

              {!user && (
                <button
                  onClick={onLogin}
                  className="px-5 py-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm transition-all shadow-lg shadow-cyan-600/30 text-center"
                >
                  Sign In with Google
                </button>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mt-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-6 border-t border-slate-800/80">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any hub, game, service, or market..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Tag Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 font-mono ${
                    selectedTag === tag
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hubs Grid - All 10 Vertical Hubs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredHubs.map((hub) => {
            const Icon = HUB_ICONS[hub.slug] || Layers;
            const isCopied = copiedSlug === hub.slug;

            return (
              <div
                key={hub.slug}
                onClick={() => onNavigateHub(hub.slug, false)}
                className="group relative flex flex-col justify-between rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 transition-all duration-200 p-6 shadow-xl hover:shadow-2xl hover:shadow-cyan-950/20 cursor-pointer overflow-hidden"
              >
                {/* Decorative background gradient flash */}
                <div className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${hub.color} opacity-15 rounded-full blur-2xl group-hover:opacity-30 transition-opacity pointer-events-none`} />

                <div>
                  {/* Top Bar: Icon + Tag */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${hub.color} flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono font-black bg-black/40 px-2.5 py-1 rounded-lg border border-white/10 text-white/90">
                      {hub.tag}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h2 className="text-xl font-black text-white group-hover:text-cyan-300 transition-colors tracking-tight">
                    {hub.name}
                  </h2>
                  <p className="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed min-h-[40px]">
                    {hub.desc}
                  </p>

                  {/* Direct Link Preview */}
                  <div className="mt-4 px-2.5 py-1 rounded-lg bg-black/30 border border-white/5 text-[11px] font-mono text-slate-500 flex items-center justify-between">
                    <span className="truncate">e-fado.com/hub/{hub.slug}</span>
                    <span className="text-[9px] text-cyan-400 uppercase font-bold shrink-0 ml-2">Active Link</span>
                  </div>
                </div>

                {/* Bottom Action Buttons: Launch (New Tab) + Enter + Share */}
                <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80">
                  <button
                    onClick={(e) => handleLaunchTab(hub.slug, e)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-cyan-900/30"
                    title="Opens this hub in a separate new browser tab that stays open"
                  >
                    <span>Launch</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateHub(hub.slug, false);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-2.5 rounded-xl text-xs font-bold transition-colors"
                    title="Enter this hub in the current window"
                  >
                    Enter →
                  </button>

                  <button
                    onClick={(e) => handleCopyLink(hub.slug, e)}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all border ${
                      isCopied
                        ? 'bg-emerald-600 text-white border-emerald-400'
                        : 'bg-black/40 hover:bg-black/60 border-slate-700/80 text-slate-300 hover:text-white'
                    }`}
                    title="Copy direct shareable link"
                  >
                    {isCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Informational Footer Strip */}
        <div className="mt-14 rounded-2xl bg-slate-900/50 border border-slate-800 p-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>All 10 hubs share 1 persistent login session, real-time wallet synchronization, and provably fair architecture.</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-cyan-400">
            <span>Direct Links:</span>
            <code className="bg-black/40 px-2 py-0.5 rounded border border-cyan-500/30">/hub/:slug</code>
          </div>
        </div>
      </div>
    </div>
  );
};
