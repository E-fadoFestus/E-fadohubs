import React, { useEffect, useState } from 'react';
import {
  Zap,
  ShoppingBag,
  MessageSquare,
  HardHat,
  Users,
  HandCoins,
  ArrowRight,
  ShieldCheck,
  Globe,
  Gamepad2,
  GraduationCap,
  Video,
  Megaphone,
  Search,
  Package,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Coins,
  Compass,
  Wallet,
  Check,
} from 'lucide-react';
import { db, collection, query, onSnapshot } from '../firebase';
import { HubHeroCarousel } from './HubHeroCarousel';
import { EfadoLogo } from './EfadoLogo';
import { UniversalSearch } from './UniversalSearch';
import { EfadoIntelligenceFeed } from './EfadoIntelligenceFeed';
import { AdListing, UserProfile } from '../types';
import { OFFICE_ADDRESSES, PHONE_NUMBERS, SUPPORT_EMAILS } from '../constants/businessProfile';
import { AmlPolicyModal } from './AmlPolicyModal';
import { AdSenseBanner } from './AdSenseBanner';
import { AdvertCard } from './AdvertCard';

interface EfadoHomePageProps {
  user: UserProfile;
  onNavigate: (hub: any, subview?: string) => void;
  onOpenMining: () => void;
}

const HUBS_DATA = [
  {
    id: 'GAMES',
    title: 'Game Arena',
    description: 'Play 6 interactive games with instant rewards sent straight to your Winning Wallet.',
    icon: Gamepad2,
    color: 'from-indigo-600 to-purple-600',
    tag: 'Games',
  },
  {
    id: 'MARKET',
    title: 'Market Hubs',
    description: 'Buy and sell new or fairly used items from verified sellers with buyer protection.',
    icon: ShoppingBag,
    color: 'from-emerald-600 to-teal-600',
    tag: 'Shopping',
  },
  {
    id: 'ADVERTISING',
    title: 'Advertising & Sales',
    description: 'Promote your products, properties, hotels, farm produce, or services to more buyers.',
    icon: Megaphone,
    color: 'from-orange-500 to-rose-600',
    tag: 'Promote',
  },
  {
    id: 'DIGITAL_SERVICES_HUB',
    subview: 'vending',
    title: 'Airtime & Data',
    description: 'Recharge airtime and mobile data bundles quickly from your main account wallet.',
    icon: Zap,
    color: 'from-amber-500 to-orange-500',
    tag: 'Bills',
  },
  {
    id: 'DIGITAL_SERVICES_HUB',
    subview: 'crypto',
    title: 'Crypto OTC & Exchange',
    description: 'Convert currencies and exchange supported digital assets with transparent rates.',
    icon: Coins,
    color: 'from-teal-500 to-indigo-600',
    tag: 'Exchange',
  },
  {
    id: 'GIST',
    title: 'EFADO Social & Reels',
    description: 'Chat with community members, watch short product videos, and message sellers directly.',
    icon: MessageSquare,
    color: 'from-indigo-600 to-cyan-600',
    tag: 'Community',
  },
  {
    id: 'SERVICE_CORPS',
    title: 'Service Corps',
    description: 'Hire trusted artisans, technicians, builders, and professional service providers.',
    icon: HardHat,
    color: 'from-slate-600 to-slate-800',
    tag: 'Services',
  },
  {
    id: 'COMMUNITY_HUBS',
    title: 'Community Savings',
    description: 'Join organized group savings cycles with clear schedules and rotating payouts.',
    icon: Users,
    color: 'from-purple-600 to-pink-600',
    tag: 'Savings',
  },
  {
    id: 'HEPIHANDS_LOAN',
    title: 'HEPIHANDS Loan',
    description: 'Apply for transparent member loans with clear terms and straightforward repayments.',
    icon: HandCoins,
    color: 'from-emerald-600 to-green-700',
    tag: 'Loans',
  },
  {
    id: 'EDUCATION',
    title: 'Education Hub',
    description: 'Exam prep, study materials, and academic guides from primary school to postgraduate.',
    icon: GraduationCap,
    color: 'from-sky-600 to-blue-700',
    tag: 'Learning',
  },
  {
    id: 'DOMAIN_HUB',
    subview: 'sourcing',
    title: 'China Sourcing Hub',
    description: 'Connect with factory suppliers, request wholesale quotes, and arrange direct shipping.',
    icon: Package,
    color: 'from-rose-600 to-red-700',
    tag: 'Wholesale',
  },
  {
    id: 'DOMAIN_HUB',
    title: 'Domains & Business Mail',
    description: 'Search and register domain names and set up a custom business email address.',
    icon: Globe,
    color: 'from-blue-600 to-indigo-700',
    tag: 'Domains',
  },
  {
    id: 'PARTNER_HUB',
    title: 'Partner & Affiliate Hub',
    description: 'Share EFADO with friends and businesses and earn commissions on referrals.',
    icon: UserPlus,
    color: 'from-amber-500 to-yellow-600',
    tag: 'Partners',
  },
  {
    id: 'DASHBOARD',
    title: 'My Wallet & Account',
    description: 'Fund your Deposit Pocket, check your winnings, withdraw funds, and track transactions.',
    icon: Wallet,
    color: 'from-slate-700 to-indigo-700',
    tag: 'Account',
  },
];

const getHubRoute = (hubId: string, subview?: string) => {
  switch (hubId) {
    case 'GAMES':
      return 'arena';
    case 'MARKET':
      return 'marketplace';
    case 'ADVERTISING':
      return 'advertisement';
    case 'GIST':
      return 'gist';
    case 'SERVICE_CORPS':
      return 'service';
    case 'COMMUNITY_HUBS':
      return 'community';
    case 'HEPIHANDS_LOAN':
      return 'loan';
    case 'DOMAIN_HUB':
      return subview === 'sourcing' ? 'china' : 'tech';
    case 'DIGITAL_SERVICES_HUB':
      if (subview === 'vending') return 'data-vending';
      if (subview === 'crypto') return 'crypto';
      return 'service';
    case 'PARTNER_HUB':
      return 'partners';
    case 'EDUCATION':
      return 'education';
    case 'ZOOM':
      return 'tech';
    case 'DASHBOARD':
      return 'dashboard';
    default:
      return hubId.toLowerCase();
  }
};

export const EfadoHomePage: React.FC<EfadoHomePageProps> = ({ user, onNavigate }) => {
  const [showUniversalSearch, setShowUniversalSearch] = useState(false);
  const [showAmlModal, setShowAmlModal] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [freshAdverts, setFreshAdverts] = useState<AdListing[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'ad_listings')),
      (snap) => {
        const now = Date.now();
        const items = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as AdListing))
          .filter(
            (ad) =>
              ad.status !== 'deleted' &&
              ad.status !== 'finished' &&
              ad.status !== 'expired' &&
              ad.status !== 'pending' &&
              (!ad.expiryDate || ad.expiryDate >= now)
          );
        items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setFreshAdverts(items.slice(0, 6));
      },
      () => {}
    );
    return () => unsub();
  }, []);

  const handleCopyEmail = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(SUPPORT_EMAILS.DEFAULT).catch(() => {});
    }
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 3000);
  };

  return (
    <div className="space-y-10 sm:space-y-14 pb-24 sm:pb-28">
      {/* News & Platform Updates */}
      <EfadoIntelligenceFeed mode="ticker-only" />

      {/* Main Hero Slider */}
      <section>
        <HubHeroCarousel hubType="HOME" onAction={(view, subview) => onNavigate(view as any, subview)} />
      </section>

      {/* Simple Welcome Overview + 3 Trust Pillars */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Everything You Need in One Place
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Use one EFADO account and wallet to shop, play games, buy airtime and data, apply for member loans, study, and promote your business.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
            <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5">
              <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-100">One Central Wallet</span>
            </div>
            <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-100">Protected Orders</span>
            </div>
            <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-100">Easy Mobile Access</span>
            </div>
          </div>
        </div>
      </section>

      {/* Hubs Directory Grid */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Explore EFADO Hubs
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Choose any service below to open it right away.
            </p>
          </div>
          <a
            href="/hubs"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState({}, '', '/hubs');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs sm:text-sm rounded-xl transition-colors self-start sm:self-auto"
          >
            <Compass className="w-4 h-4" />
            <span>View Full Directory</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {HUBS_DATA.map((hub, i) => {
            const routeSlug = getHubRoute(hub.id, (hub as any).subview);
            const targetUrl = `/hub/${routeSlug}`;
            const Icon = hub.icon;
            return (
              <a
                key={`${hub.id}-${i}`}
                href={targetUrl}
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    onNavigate(routeSlug);
                  }
                }}
                className="group bg-slate-900/85 hover:bg-slate-900 border border-white/10 hover:border-indigo-400/50 rounded-2xl p-5 flex flex-col justify-between h-full transition-all shadow-md no-underline text-inherit"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${hub.color} flex items-center justify-center text-white shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-indigo-300 bg-indigo-950/70 border border-indigo-500/25 px-2.5 py-0.5 rounded-lg">
                      {hub.tag}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-indigo-300 transition-colors mb-1.5">
                    {hub.title}
                  </h3>

                  <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">
                    {hub.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10">
                  <span className="text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                    Open Hub
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-300 group-hover:translate-x-0.5 transition-all" />
                </div>
              </a>
            );
          })}
        </div>
      </section>

      {/* Two Clear Action Cards: Advertise / Sell + Live Classes / Partners */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Advertise & Sell */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold">
                For Sellers &amp; Businesses
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Advertise or Sell on EFADO
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                List hotels, farm produce, land, vehicles, services, or everyday items and connect directly with interested buyers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('ADVERTISING', 'ADVERT')}
                className="min-h-[44px] py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Megaphone className="w-4 h-4" />
                <span>Post an Ad</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('ADVERTISING', 'SELL')}
                className="min-h-[44px] py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-indigo-300" />
                <span>Sell an Item</span>
              </button>
            </div>
          </div>

          {/* Card 2: Live Video Classes & Partner Program */}
          <div className="bg-slate-900/90 rounded-2xl p-6 sm:p-8 border border-white/10 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <span className="inline-block px-3 py-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 rounded-lg text-xs font-semibold">
                Live Sessions &amp; Partnerships
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Host Live Classes or Partner With Us
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Run online classes and group meetings on EFADO Live, or join the Partner Hub to invite new members and earn rewards.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('ZOOM')}
                className="min-h-[44px] py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Video className="w-4 h-4" />
                <span>Open Live Classes</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('PARTNER_HUB')}
                className="min-h-[44px] py-3 px-4 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-amber-300" />
                <span>Partner Hub</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Live Promoted Adverts & Products */}
      {freshAdverts.length > 0 && (
        <section className="max-w-7xl mx-auto px-3 sm:px-4 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-white/10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Fresh Adverts &amp; Items for Sale
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Explore real offers posted by EFADO sellers and businesses
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('ADVERTISING', 'ADVERT')}
              className="min-h-[44px] px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer"
            >
              <Megaphone className="w-4 h-4" />
              <span>Promote or Sell Yours</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {freshAdverts.map((ad) => (
              <AdvertCard
                key={ad.id}
                ad={ad}
                user={user}
                onOpenDetail={(target) => {
                  const targetPath = `/advert/${target.slug || target.id}`;
                  window.history.pushState({}, '', targetPath);
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Sponsored Placement */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <AdSenseBanner label="Sponsored Partners" />
      </div>

      {/* Floating Search Button */}
      <button
        type="button"
        onClick={() => setShowUniversalSearch(true)}
        aria-label="Search EFADO Hubs"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-2xl flex items-center justify-center border border-white/20 transition-colors cursor-pointer"
        title="Search EFADO Hubs"
      >
        <Search className="w-6 h-6" />
      </button>

      {/* Clean Footer */}
      <footer className="bg-slate-950 pt-14 pb-10 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            {/* Brand & Quick Contact */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <EfadoLogo size="sm" />
                <h3 className="text-lg font-bold text-white">EFADO Hubs Connect</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                One connected platform for shopping, games, bill payments, education, and business services.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {PHONE_NUMBERS.CONTACT_1 && (
                  <a
                    href={`tel:${PHONE_NUMBERS.CONTACT_1}`}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-slate-200 border border-white/10 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span>Call Support</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-slate-200 border border-white/10 transition-colors cursor-pointer"
                >
                  {emailCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Email Copied</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 text-indigo-400" />
                      <span>{SUPPORT_EMAILS.DEFAULT}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Office Addresses */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white">Office Locations</h4>
              <div className="space-y-3 text-sm text-slate-400">
                <div>
                  <div className="flex items-center gap-2 text-white font-semibold text-xs mb-1">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Head Office</span>
                  </div>
                  <p className="text-xs leading-relaxed">{OFFICE_ADDRESSES.HEAD_OFFICE}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-white font-semibold text-xs mb-1">
                    <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Branch Office</span>
                  </div>
                  <p className="text-xs leading-relaxed">{OFFICE_ADDRESSES.BRANCH_OFFICE}</p>
                </div>
              </div>
            </div>

            {/* Support Numbers */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white">Customer Support Lines</h4>
              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between gap-2">
                  <span className="text-slate-400">CEO Desk</span>
                  <span className="font-mono font-semibold text-white">{PHONE_NUMBERS.CONSULTANCY_CEO}</span>
                </div>
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between gap-2">
                  <span className="text-slate-400">Support Line 1</span>
                  <span className="font-mono font-semibold text-white">{PHONE_NUMBERS.CONTACT_2}</span>
                </div>
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between gap-2">
                  <span className="text-slate-400">Support Line 2</span>
                  <span className="font-mono font-semibold text-white">{PHONE_NUMBERS.CONTACT_3}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>&copy; {new Date().getFullYear()} EFADO Hubs Connect. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-6">
              <button type="button" onClick={() => setShowAmlModal(true)} className="text-amber-400 hover:text-amber-300 font-semibold">
                AML Policy
              </button>
              <button type="button" onClick={() => onNavigate('GIST')} className="hover:text-white transition-colors">
                Privacy Policy
              </button>
              <button type="button" onClick={() => onNavigate('GIST')} className="hover:text-white transition-colors">
                Terms of Use
              </button>
              <button type="button" onClick={() => onNavigate('GIST')} className="hover:text-white transition-colors">
                Buyer Protection
              </button>
            </div>
          </div>
        </div>
      </footer>

      {showUniversalSearch && <UniversalSearch onClose={() => setShowUniversalSearch(false)} />}
      {showAmlModal && <AmlPolicyModal onClose={() => setShowAmlModal(false)} />}
    </div>
  );
};
