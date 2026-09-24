import React, { useState } from 'react';
import { 
  BookOpen, 
  Network, 
  Tv, 
  Gamepad2, 
  ShoppingBag, 
  MessageSquare, 
  Users, 
  Handshake, 
  Shield, 
  Rocket, 
  Lock, 
  LogIn, 
  UserPlus, 
  ShieldCheck, 
  AlertCircle, 
  X, 
  Share2, 
  CheckCircle2, 
  Globe,
  Sparkles,
  Zap,
  ChevronRight
} from 'lucide-react';
import cosmicBg from '../assets/images/cosmic_nebula_bg_1790256346563.jpg';

interface EfadoCosmicWelcomeProps {
  onQuickConnect: (targetHub?: string, customNameOrPhone?: string) => Promise<void>;
  onGoogleConnect: () => Promise<void>;
  onRedirectGoogleConnect: () => Promise<void>;
  onEmailLogin: (e: React.FormEvent) => Promise<void>;
  onEmailRegister: (e: React.FormEvent) => Promise<void>;
  onAdminSubmit: (e: React.FormEvent) => Promise<void>;
  onVerifyOtp: (e: React.FormEvent) => Promise<void>;
  
  // States & inputs
  error: string | null;
  setError: (err: string | null) => void;
  loading: boolean;
  isInAppBrowser: boolean;
  
  // Standard Email states
  standardEmail: string;
  setStandardEmail: (val: string) => void;
  standardPassword: string;
  setStandardPassword: (val: string) => void;
  standardDisplayName: string;
  setStandardDisplayName: (val: string) => void;
  standardRegisterSuccess: string | null;
  
  // Admin states
  adminEmail: string;
  setAdminEmail: (val: string) => void;
  adminPassword: string;
  setAdminPassword: (val: string) => void;
  otpStep: boolean;
  setOtpStep: (val: boolean) => void;
  otpInput: string;
  setOtpInput: (val: string) => void;
  otpMessage: string;
  simulatedSmsCode: string | null;
  currentOtpCode: string;
}

interface HubCardItem {
  id: string;
  name: string;
  sub: string;
  hubKey: string;
  color: string;
  borderColor: string;
  glowColor: string;
  bgGlow: string;
  iconType: 'book' | 'network' | 'ad' | 'game' | 'market' | 'gist' | 'community' | 'service' | 'loan' | 'rocket';
}

const HUBS_LIST: HubCardItem[] = [
  {
    id: 'education',
    name: 'Education Hub',
    sub: 'Learning & Courses',
    hubKey: 'EDUCATION',
    color: '#ff4d4f',
    borderColor: 'border-red-500/50 hover:border-red-400',
    glowColor: 'shadow-red-500/20 hover:shadow-red-500/40',
    bgGlow: 'hover:bg-red-500/10',
    iconType: 'book'
  },
  {
    id: 'job',
    name: 'Job Hub',
    sub: 'Careers & Opportunities',
    hubKey: 'SERVICE_CORPS',
    color: '#38bdf8',
    borderColor: 'border-cyan-500/50 hover:border-cyan-400',
    glowColor: 'shadow-cyan-500/20 hover:shadow-cyan-400/40',
    bgGlow: 'hover:bg-cyan-500/10',
    iconType: 'network'
  },
  {
    id: 'advertisement',
    name: 'Advertisement Hub',
    sub: 'Campaigns & Ads',
    hubKey: 'ADVERTISING',
    color: '#fbbf24',
    borderColor: 'border-amber-500/50 hover:border-amber-400',
    glowColor: 'shadow-amber-500/20 hover:shadow-amber-400/40',
    bgGlow: 'hover:bg-amber-500/10',
    iconType: 'ad'
  },
  {
    id: 'skill-quiz',
    name: 'Skill Quiz Game Hub',
    sub: 'Quizzes & Gaming',
    hubKey: 'GAMES',
    color: '#34d399',
    borderColor: 'border-emerald-500/50 hover:border-emerald-400',
    glowColor: 'shadow-emerald-500/20 hover:shadow-emerald-400/40',
    bgGlow: 'hover:bg-emerald-500/10',
    iconType: 'game'
  },
  {
    id: 'marketplace',
    name: 'Marketplace Hub',
    sub: 'Buy & Sell Goods',
    hubKey: 'MARKET',
    color: '#c084fc',
    borderColor: 'border-purple-500/50 hover:border-purple-400',
    glowColor: 'shadow-purple-500/20 hover:shadow-purple-400/40',
    bgGlow: 'hover:bg-purple-500/10',
    iconType: 'market'
  },
  {
    id: 'gist',
    name: 'Gist Hub',
    sub: 'News & Discussions',
    hubKey: 'GIST',
    color: '#facc15',
    borderColor: 'border-yellow-400/50 hover:border-yellow-300',
    glowColor: 'shadow-yellow-400/20 hover:shadow-yellow-300/40',
    bgGlow: 'hover:bg-yellow-400/10',
    iconType: 'gist'
  },
  {
    id: 'community',
    name: 'Community Hub',
    sub: 'Community & Forums',
    hubKey: 'COMMUNITY_HUBS',
    color: '#2dd4bf',
    borderColor: 'border-teal-400/50 hover:border-teal-300',
    glowColor: 'shadow-teal-400/20 hover:shadow-teal-300/40',
    bgGlow: 'hover:bg-teal-400/10',
    iconType: 'community'
  },
  {
    id: 'service-corps',
    name: 'Service Corps',
    sub: 'Volunteer & Services',
    hubKey: 'SERVICE_CORPS',
    color: '#4ade80',
    borderColor: 'border-green-500/50 hover:border-green-400',
    glowColor: 'shadow-green-500/20 hover:shadow-green-400/40',
    bgGlow: 'hover:bg-green-500/10',
    iconType: 'service'
  },
  {
    id: 'loan',
    name: 'Loan Hub',
    sub: 'Loans & Finance',
    hubKey: 'HEPIHANDS_LOAN',
    color: '#60a5fa',
    borderColor: 'border-blue-500/50 hover:border-blue-400',
    glowColor: 'shadow-blue-500/20 hover:shadow-blue-400/40',
    bgGlow: 'hover:bg-blue-500/10',
    iconType: 'loan'
  },
  {
    id: 'giat',
    name: 'Giat Hub',
    sub: 'Innovation & Growth',
    hubKey: 'TECH',
    color: '#fb923c',
    borderColor: 'border-orange-500/50 hover:border-orange-400',
    glowColor: 'shadow-orange-500/20 hover:shadow-orange-400/40',
    bgGlow: 'hover:bg-orange-500/10',
    iconType: 'rocket'
  }
];

export const EfadoCosmicWelcome: React.FC<EfadoCosmicWelcomeProps> = ({
  onQuickConnect,
  onGoogleConnect,
  onRedirectGoogleConnect,
  onEmailLogin,
  onEmailRegister,
  onAdminSubmit,
  onVerifyOtp,
  error,
  setError,
  loading,
  isInAppBrowser,
  standardEmail,
  setStandardEmail,
  standardPassword,
  setStandardPassword,
  standardDisplayName,
  setStandardDisplayName,
  standardRegisterSuccess,
  adminEmail,
  setAdminEmail,
  adminPassword,
  setAdminPassword,
  otpStep,
  setOtpStep,
  otpInput,
  setOtpInput,
  otpMessage,
  simulatedSmsCode,
  currentOtpCode
}) => {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTab, setEmailTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [connectingHub, setConnectingHub] = useState<string | null>(null);

  const handleCardClick = async (hub: HubCardItem) => {
    setConnectingHub(hub.name);
    try {
      await onQuickConnect(hub.hubKey);
    } finally {
      setConnectingHub(null);
    }
  };

  const renderIcon = (type: HubCardItem['iconType']) => {
    switch (type) {
      case 'book':
        return (
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-red-900/30 text-red-400 shadow-lg shadow-red-500/20 border border-red-500/30">
            <BookOpen className="w-6 h-6 stroke-[2.2] text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          </div>
        );
      case 'network':
        return (
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-900/30 text-cyan-400 shadow-lg shadow-cyan-500/20 border border-cyan-500/30">
            <Network className="w-6 h-6 stroke-[2.2] text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          </div>
        );
      case 'ad':
        return (
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-900/30 text-amber-400 shadow-lg shadow-amber-500/20 border border-amber-500/30">
            <Tv className="w-6 h-6 stroke-[2.2] text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
          </div>
        );
      case 'game':
        return (
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-900/30 text-emerald-400 shadow-lg shadow-emerald-500/20 border border-emerald-500/30">
            <Gamepad2 className="w-7 h-7 stroke-[2.2] text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          </div>
        );
      case 'market':
        return (
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-fuchsia-900/30 text-purple-300 shadow-lg shadow-purple-500/20 border border-purple-500/30">
            <ShoppingBag className="w-6 h-6 stroke-[2.2] text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
          </div>
        );
      case 'gist':
        return (
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400/20 to-amber-900/30 text-yellow-300 shadow-lg shadow-yellow-400/20 border border-yellow-400/30">
            <MessageSquare className="w-6 h-6 stroke-[2.2] text-yellow-300 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
          </div>
        );
      case 'community':
        return (
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-900/30 text-teal-300 shadow-lg shadow-teal-500/20 border border-teal-500/30">
            <Users className="w-6 h-6 stroke-[2.2] text-teal-300 drop-shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
          </div>
        );
      case 'service':
        return (
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-900/30 text-green-400 shadow-lg shadow-green-500/20 border border-green-500/30">
            <Handshake className="w-6 h-6 stroke-[2.2] text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
          </div>
        );
      case 'loan':
        return (
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-900/30 text-blue-400 shadow-lg shadow-blue-500/20 border border-blue-500/30">
            <Shield className="w-6 h-6 stroke-[2.2] text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
          </div>
        );
      case 'rocket':
        return (
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-rose-900/30 text-orange-400 shadow-lg shadow-orange-500/20 border border-orange-500/30">
            <Rocket className="w-6 h-6 stroke-[2.2] text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-between text-white overflow-x-hidden select-none font-sans">
      {/* 1. Deep Space Cosmic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img 
          src={cosmicBg} 
          alt="Cosmic Galaxy Background"
          className="w-full h-full object-cover object-center scale-105 filter brightness-90 contrast-110"
        />
        {/* Soft overlay gradient to ensure high readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/40 to-slate-950/85" />
        
        {/* Shimmering Starlight Points */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(56,189,248,0.15),transparent_40%),radial-gradient(circle_at_80%_25%,rgba(245,158,11,0.12),transparent_40%),radial-gradient(circle_at_50%_75%,rgba(168,85,247,0.15),transparent_50%)]" />
      </div>

      {/* WhatsApp / In-App Browser Floating Pill Notification */}
      {isInAppBrowser && (
        <div className="relative z-30 w-full max-w-4xl mx-auto px-4 pt-3">
          <div className="p-3 bg-amber-500/15 backdrop-blur-xl border border-amber-500/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2 shadow-2xl shadow-amber-500/10">
            <div className="flex items-center gap-2 text-xs text-amber-200">
              <Globe className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
              <span>
                Social In-App browser detected. Tap <strong className="text-amber-300">Continue with EFADO ID</strong> for instant entry, or open in Chrome/Safari:
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2500);
                }
              }}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 border border-amber-500/30"
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Copy App Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error Notice Display */}
      {error && (
        <div className="relative z-30 w-full max-w-xl mx-auto px-4 pt-3">
          <div className="p-3.5 bg-red-950/80 backdrop-blur-xl border border-red-500/40 rounded-2xl flex items-center justify-between gap-3 text-red-200 text-xs shadow-xl">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={onRedirectGoogleConnect}
                className="text-[10px] uppercase font-black bg-red-500/20 hover:bg-red-500/30 text-red-300 px-2.5 py-1 rounded-lg border border-red-500/30"
              >
                Redirect
              </button>
              <button 
                onClick={() => setError(null)}
                className="text-red-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <div className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col items-center justify-center flex-grow">
        
        {/* Top Emblem / Logo */}
        <div className="relative flex flex-col items-center mb-3 group cursor-pointer" onClick={() => onQuickConnect()}>
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
            {/* Glowing outer aura */}
            <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-xl group-hover:bg-cyan-400/30 transition-all duration-500" />
            
            {/* Circular Badge Body */}
            <div className="relative w-full h-full rounded-full p-[2.5px] bg-gradient-to-b from-cyan-400 via-blue-600 to-indigo-900 shadow-2xl shadow-cyan-500/30 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden border border-cyan-400/40">
                {/* Radial cosmic interior */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(30,58,138,0.8)_0%,rgba(2,6,23,0.95)_80%)]" />
                
                {/* Brand Text on Emblem */}
                <span className="relative z-10 text-[10px] sm:text-[11px] font-black tracking-[0.2em] text-white uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] -mb-0.5">
                  EFADO
                </span>
                <span className="relative z-10 text-[8px] sm:text-[9px] font-extrabold tracking-[0.25em] text-cyan-400 uppercase drop-shadow-[0_0_6px_rgba(34,211,238,0.8)] mb-1">
                  HUBS
                </span>

                {/* Celestial Cybernetic Connector Hub Nodes */}
                <div className="relative z-10 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Outer orbital ring */}
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="3 5" className="animate-[spin_20s_linear_infinite]" />
                    {/* Inner core ring */}
                    <circle cx="50" cy="50" r="16" fill="none" stroke="#fbbf24" strokeWidth="2.5" />
                    
                    {/* Connector spoke lines */}
                    <line x1="50" y1="50" x2="50" y2="12" stroke="#38bdf8" strokeWidth="2" />
                    <line x1="50" y1="50" x2="88" y2="50" stroke="#f59e0b" strokeWidth="2" />
                    <line x1="50" y1="50" x2="50" y2="88" stroke="#38bdf8" strokeWidth="2" />
                    <line x1="50" y1="50" x2="12" y2="50" stroke="#10b981" strokeWidth="2" />
                    <line x1="50" y1="50" x2="77" y2="23" stroke="#c084fc" strokeWidth="2" />
                    <line x1="50" y1="50" x2="23" y2="77" stroke="#fb923c" strokeWidth="2" />

                    {/* Orbiting Satellite Nodes */}
                    <circle cx="50" cy="12" r="5.5" fill="#38bdf8" />
                    <circle cx="88" cy="50" r="5.5" fill="#fbbf24" />
                    <circle cx="50" cy="88" r="5.5" fill="#38bdf8" />
                    <circle cx="12" cy="50" r="5.5" fill="#10b981" />
                    <circle cx="77" cy="23" r="5.5" fill="#c084fc" />
                    <circle cx="23" cy="77" r="5.5" fill="#fb923c" />

                    {/* Central Golden Nucleus */}
                    <circle cx="50" cy="50" r="7" fill="#f59e0b" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Title: EFADO HUBS CONNECT */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-center flex items-center justify-center gap-2 sm:gap-3 flex-wrap drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-cyan-400 drop-shadow-[0_0_20px_rgba(56,189,248,0.5)] uppercase">
            EFADO HUBS
          </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 drop-shadow-[0_0_20px_rgba(245,158,11,0.6)] uppercase">
            CONNECT
          </span>
        </h1>

        {/* Subtitle: One ID. Ten Hubs. Endless Possibilities. */}
        <h2 className="mt-2 text-base sm:text-xl md:text-2xl font-bold text-white tracking-wide text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          One ID. Ten Hubs. Endless Possibilities.
        </h2>

        {/* Description: Tired of Multiple login? ... */}
        <div className="mt-2.5 mb-8 text-center max-w-xl mx-auto space-y-0.5">
          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed m-0">
            Tired of Multiple login? One connection, one account profile Wallet.
          </p>
          <p className="text-xs sm:text-sm text-cyan-200/90 font-semibold tracking-wide m-0">
            EFADO Nexus of connectivity Hubs.
          </p>
        </div>

        {/* 10 Sovereign Hubs Cards Grid (2 rows x 5 columns) */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
          {HUBS_LIST.map((hub) => (
            <div
              key={hub.id}
              onClick={() => handleCardClick(hub)}
              className={`group relative flex flex-col items-center text-center p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-950/70 backdrop-blur-xl border ${hub.borderColor} shadow-xl ${hub.glowColor} ${hub.bgGlow} transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 cursor-pointer overflow-hidden active:scale-95`}
            >
              {/* Subtle card top glow highlight */}
              <div 
                className="absolute -top-10 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"
                style={{ backgroundColor: hub.color }}
              />

              {/* Hub Icon */}
              <div className="mb-3 transition-transform duration-300 group-hover:scale-110">
                {renderIcon(hub.iconType)}
              </div>

              {/* Hub Title */}
              <h3 className="text-sm sm:text-base font-black text-white tracking-tight group-hover:text-cyan-200 transition-colors leading-tight mb-1">
                {hub.name}
              </h3>

              {/* Hub Subtitle */}
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium group-hover:text-slate-200 transition-colors leading-snug m-0">
                {hub.sub}
              </p>

              {/* Connecting badge on click */}
              {connectingHub === hub.name && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center rounded-2xl z-10">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-400">
                    <Zap className="w-4 h-4 animate-bounce" />
                    <span>Connecting...</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* The Two Prominent Action Buttons */}
        <div className="w-full max-w-xl flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 mb-6">
          
          {/* Golden Button: Continue with EFADO ID (Instant Login as Guest) */}
          <button
            type="button"
            id="continue-with-efado-id-btn"
            disabled={loading}
            onClick={() => onQuickConnect('HOME')}
            className="w-full sm:w-1/2 py-3.5 sm:py-4 px-5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all duration-300 hover:scale-[1.02] active:scale-95 border border-yellow-200/50 cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-amber-600/30 flex items-center justify-center shrink-0 border border-amber-700/40">
              <Lock className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
            </div>
            <span>{loading ? 'CONNECTING...' : 'Continue with EFADO ID'}</span>
          </button>

          {/* Dark Translucent Button: Establish Connect with Google */}
          <button
            type="button"
            id="establish-connect-with-google-btn"
            disabled={loading}
            onClick={onGoogleConnect}
            className="w-full sm:w-1/2 py-3.5 sm:py-4 px-5 rounded-full bg-slate-950/80 hover:bg-slate-900/95 backdrop-blur-xl text-white font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-3 shadow-2xl shadow-black/60 transition-all duration-300 hover:scale-[1.02] active:scale-95 border border-white/25 hover:border-white/45 cursor-pointer"
          >
            {/* Multi-color Google "G" Icon */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Establish Connect with Google</span>
          </button>

        </div>

        {/* Secondary Navigation Links: Email Login, CEO Admin Terminal */}
        <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-400">
          <button
            type="button"
            onClick={() => { setShowEmailModal(true); setEmailTab('LOGIN'); setError(null); }}
            className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-white/5"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Email Sign In</span>
          </button>
          <span className="text-slate-600">•</span>
          <button
            type="button"
            onClick={() => { setShowEmailModal(true); setEmailTab('REGISTER'); setError(null); }}
            className="hover:text-emerald-300 transition-colors flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-white/5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
          <span className="text-slate-600">•</span>
          <button
            type="button"
            onClick={() => { setShowAdminModal(true); setError(null); }}
            className="hover:text-amber-300 transition-colors flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-white/5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>CEO Terminal</span>
          </button>
        </div>

      </div>

      {/* Footer Branding Line */}
      <div className="relative z-20 w-full py-3 text-center border-t border-white/5 bg-slate-950/60 backdrop-blur-md">
        <p className="text-[11px] text-slate-500 font-medium tracking-wider m-0">
          EFADO Sovereign Ecosystem © 2026 • 1-ID Fast Digital Portal • Secured with Dual-Key Architecture
        </p>
      </div>

      {/* MODAL 1: Email Login & Register */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
          <div className="relative w-full max-w-md bg-slate-900/95 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setShowEmailModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Tabs */}
            <div className="flex bg-slate-950/80 p-1 rounded-2xl border border-white/10 mb-6">
              <button
                type="button"
                onClick={() => { setEmailTab('LOGIN'); setError(null); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${emailTab === 'LOGIN' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setEmailTab('REGISTER'); setError(null); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${emailTab === 'REGISTER' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                Register
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {standardRegisterSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{standardRegisterSuccess}</span>
              </div>
            )}

            {emailTab === 'LOGIN' ? (
              <form onSubmit={onEmailLogin} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@domain.com"
                    value={standardEmail}
                    onChange={(e) => setStandardEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={standardPassword}
                    onChange={(e) => setStandardPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{loading ? 'Authenticating...' : 'Secure Sign In'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={onEmailRegister} className="space-y-3.5 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Display Name / Nickname</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master Trader"
                    value={standardDisplayName}
                    onChange={(e) => setStandardDisplayName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@domain.com"
                    value={standardEmail}
                    onChange={(e) => setStandardEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={standardPassword}
                    onChange={(e) => setStandardPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{loading ? 'Creating Account...' : 'Register Account'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: CEO / Admin Terminal & OTP Verification */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
          <div className="relative w-full max-w-md bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => { setShowAdminModal(false); setOtpStep(false); }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">CEO Sovereign Terminal</h3>
                <p className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">Dual-Key Clearance Protocol</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!otpStep ? (
              <form onSubmit={onAdminSubmit} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sovereign Email</label>
                  <input
                    type="email"
                    required
                    placeholder="festdanemh@gmail.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sovereign Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Request Authorization</span>
                </button>
                <p className="text-[10px] text-slate-500 text-center font-mono">
                  Admin clearance required. Use password EFADO_CEO_2026 or registered CEO terminal.
                </p>
              </form>
            ) : (
              <form onSubmit={onVerifyOtp} className="space-y-4 text-left">
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs">
                  <p className="font-bold uppercase tracking-wider mb-1">Dual-Key Broadcaster</p>
                  <p className="font-mono leading-relaxed">{otpMessage}</p>
                </div>

                {/* Simulated SMS Code display for CEO convenience */}
                {simulatedSmsCode && (
                  <div className="p-3 bg-slate-950 border border-amber-500/40 rounded-xl text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Verification Key</p>
                    <span className="text-2xl font-mono font-black text-amber-400 tracking-[0.25em]">
                      {simulatedSmsCode || currentOtpCode}
                    </span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Enter 6-Digit Key</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="000000"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-center text-xl font-mono font-black text-amber-400 tracking-[0.25em] focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOtpStep(false)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg"
                  >
                    <span>Verify Code</span>
                    <LogIn className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
