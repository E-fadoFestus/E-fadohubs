import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ExternalLink, 
  Share2, 
  Wallet, 
  ChevronDown, 
  LogIn, 
  User, 
  Check, 
  Compass,
  Layers,
  Sparkles
} from 'lucide-react';
import { HUBS, HubConfig } from '../config/hubs';
import { UserProfile } from '../types';

interface UniversalHubHeaderProps {
  currentHub?: HubConfig;
  user: UserProfile | null;
  wallet: number;
  onNavigateHub: (slug: string, inNewTab?: boolean) => void;
  onOpenCashier?: () => void;
  onLogin?: () => void;
}

export const UniversalHubHeader: React.FC<UniversalHubHeaderProps> = ({
  currentHub,
  user,
  wallet,
  onNavigateHub,
  onOpenCashier,
  onLogin,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = currentHub 
      ? `${window.location.origin}/hub/${currentHub.slug}`
      : `${window.location.origin}/hubs`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }).catch(() => {
        prompt('Copy this hub link:', url);
      });
    } else {
      prompt('Copy this hub link:', url);
    }
  };

  const handleLaunchNewTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    const targetSlug = currentHub ? currentHub.slug : 'arena';
    const url = `${window.location.origin}/hub/${targetSlug}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/85 backdrop-blur-xl border-b border-cyan-500/20 px-3 sm:px-6 py-2.5 shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Navigation and Hub identity */}
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
          <button
            onClick={() => onNavigateHub('all-hubs', false)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-all text-xs font-semibold shrink-0 group"
            title="Return to Vertical Hubs Directory"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-cyan-400" />
            <span className="hidden sm:inline">All Hubs</span>
          </button>

          {/* Current Hub Selector / Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(prev => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-cyan-500/30 text-white transition-all text-xs sm:text-sm font-bold shadow-inner"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="truncate max-w-[140px] sm:max-w-[200px]">
                {currentHub ? currentHub.name : 'Vertical Hubs'}
              </span>
              {currentHub?.tag && (
                <span className="hidden md:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  {currentHub.tag}
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Hub Switcher Dropdown */}
            {showDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowDropdown(false)} 
                />
                <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-slate-900/95 border border-cyan-500/30 shadow-2xl backdrop-blur-2xl z-50 p-2 max-h-[75vh] overflow-y-auto divide-y divide-slate-800/60">
                  <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Switch Vertical Hub</span>
                    <span className="text-cyan-400 font-mono">10 HUBS</span>
                  </div>
                  <div className="py-1 space-y-0.5">
                    {HUBS.map((h) => {
                      const isActive = currentHub?.slug === h.slug;
                      return (
                        <div
                          key={h.slug}
                          className={`flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-cyan-950/70 text-cyan-300 font-bold border border-cyan-500/40'
                              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                          }`}
                          onClick={() => {
                            setShowDropdown(false);
                            onNavigateHub(h.slug, false);
                          }}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold truncate">{h.name}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 border border-slate-700 text-slate-400 font-mono">
                                {h.tag}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{h.desc}</p>
                          </div>
                          <button
                            title="Open in new tab"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDropdown(false);
                              onNavigateHub(h.slug, true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-cyan-300 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Wallet + Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 1 Unified Wallet Display */}
          <button
            onClick={onOpenCashier}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/40 hover:border-emerald-400 transition-all text-xs sm:text-sm font-black text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)] group"
            title="1 Unified Wallet across all 10 Hubs"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="font-mono">₦{wallet.toLocaleString()}</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono hidden sm:inline">
              WALLET
            </span>
          </button>

          {/* Launch in New Tab */}
          <button
            onClick={handleLaunchNewTab}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all text-xs font-bold"
            title="Open this Hub in a New Tab (stays open)"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            <span>New Tab</span>
          </button>

          {/* Share Hub Link */}
          <button
            onClick={handleShare}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              copied
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Copy direct shareable link for this hub"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Share</span>
              </>
            )}
          </button>

          {/* User Profile or Login */}
          {user ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-semibold text-slate-200">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'} 
                  className="w-5 h-5 rounded-full object-cover border border-cyan-400/50" 
                />
              ) : (
                <User className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span className="hidden md:inline truncate max-w-[100px]">
                {user.displayName || user.email.split('@')[0]}
              </span>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/30"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
