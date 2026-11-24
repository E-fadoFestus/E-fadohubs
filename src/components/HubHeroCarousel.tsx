import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Gamepad2,
  ShoppingBag,
  Megaphone,
  GraduationCap,
  Video,
  Wallet,
  Globe,
  BookOpen,
  ShieldCheck,
} from 'lucide-react';

interface Slide {
  title: string;
  description: string;
  tag: string;
  gradient: string;
  accentColor: string;
  ctaLabel: string;
  secondaryLabel?: string;
  action?: string;
  subview?: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface HubHeroCarouselProps {
  hubType:
    | 'HOME'
    | 'DASHBOARD'
    | 'GAMES'
    | 'MARKET'
    | 'GIST'
    | 'SERVICE_CORPS'
    | 'COMMUNITY_HUBS'
    | 'HEPIHANDS_LOAN'
    | 'DOMAIN_HUB'
    | 'QUIZ'
    | 'EDUCATION'
    | 'ZOOM'
    | 'TECH'
    | 'ADVERTISING'
    | 'PARTNER_HUB'
    | 'TECH_HUB'
    | 'FAIRLY_USED';
  onAction?: (view: string, subview?: string) => void;
}

const DASHBOARD_SLIDES: Slide[] = [
  {
    title: 'One Account for Every Service',
    description:
      'Shop, play games, pay bills, learn online, and promote your business from one simple EFADO account and wallet.',
    tag: 'Welcome to EFADO',
    gradient: 'from-slate-900 via-indigo-950 to-slate-900',
    accentColor: 'text-indigo-300',
    ctaLabel: 'Open My Wallet',
    secondaryLabel: 'Browse Guides',
    action: 'DASHBOARD',
    icon: Wallet,
  },
  {
    title: 'Shop New & Fairly Used Items',
    description:
      'Browse electronics, fashion, phones, and home essentials from verified sellers with buyer protection.',
    tag: 'Marketplace',
    gradient: 'from-slate-900 via-emerald-950 to-slate-900',
    accentColor: 'text-emerald-300',
    ctaLabel: 'Visit Marketplace',
    action: 'MARKET',
    icon: ShoppingBag,
  },
  {
    title: 'Play & Win in the Game Arena',
    description:
      'Enjoy 6 fast, clear games using your main deposit wallet, with winnings ready to cash out anytime.',
    tag: 'Game Arena',
    gradient: 'from-slate-900 via-cyan-950 to-slate-900',
    accentColor: 'text-cyan-300',
    ctaLabel: 'Explore Games',
    action: 'GAMES',
    icon: Gamepad2,
  },
  {
    title: 'Promote & Sell to More Buyers',
    description:
      'List your property, products, hotel, farm produce, or services in minutes and reach buyers fast.',
    tag: 'Advertising',
    gradient: 'from-slate-900 via-amber-950/80 to-slate-900',
    accentColor: 'text-amber-300',
    ctaLabel: 'Post an Ad',
    action: 'ADVERTISING',
    icon: Megaphone,
  },
  {
    title: 'Study Resources & Live Classes',
    description:
      'Prepare for exams, attend live video classes, and explore learning tools from primary school to postgraduate.',
    tag: 'Education & Live',
    gradient: 'from-slate-900 via-sky-950 to-slate-900',
    accentColor: 'text-sky-300',
    ctaLabel: 'Open Education Hub',
    action: 'EDUCATION',
    icon: GraduationCap,
  },
];

const EDUCATION_SLIDES: Slide[] = [
  {
    title: 'Learning Tools for Every Stage',
    description:
      'Study guides, practice questions, and school planning resources from nursery and primary through university and postgraduate.',
    tag: 'Education Hub',
    gradient: 'from-slate-900 via-sky-950 to-slate-900',
    accentColor: 'text-sky-300',
    ctaLabel: 'Start Learning',
    action: 'EDUCATION',
    icon: GraduationCap,
  },
  {
    title: 'Exam Prep & Admissions Support',
    description:
      'Track JAMB, WAEC, and Post-UTME updates alongside practical admission requirements in one place.',
    tag: 'Exam Prep',
    gradient: 'from-slate-900 via-indigo-950 to-slate-900',
    accentColor: 'text-indigo-300',
    ctaLabel: 'Open Study Tools',
    action: 'EDUCATION',
    icon: BookOpen,
  },
];

const ZOOM_SLIDES: Slide[] = [
  {
    title: 'Host Live Classes & Meetings',
    description:
      'Start interactive video and audio sessions for teaching, community events, interviews, and team meetings.',
    tag: 'EFADO Live',
    gradient: 'from-slate-900 via-indigo-950 to-slate-900',
    accentColor: 'text-indigo-300',
    ctaLabel: 'Start Session',
    action: 'ZOOM',
    icon: Video,
  },
  {
    title: 'Connect Anywhere on Any Device',
    description:
      'Clear audio and video rooms designed to work smoothly across phones, tablets, and computers.',
    tag: 'Live Sessions',
    gradient: 'from-slate-900 via-blue-950 to-slate-900',
    accentColor: 'text-sky-300',
    ctaLabel: 'Join Live Hub',
    action: 'ZOOM',
    icon: Globe,
  },
];

const GAMES_SLIDES: Slide[] = [
  {
    title: '6 Games, One Simple Wallet',
    description:
      'Play Deep Sea Jet, Lucky Spin, Digital Money Trading, Money Card, Money Quiz, and Equilibrium from one balance.',
    tag: 'Game Arena',
    gradient: 'from-slate-900 via-cyan-950 to-slate-900',
    accentColor: 'text-cyan-300',
    ctaLabel: 'Play Now',
    action: 'GAMES',
    icon: Gamepad2,
  },
  {
    title: 'Fast Payouts to Your Winning Wallet',
    description:
      'Track every round clearly and withdraw your winnings straight from your Account Profile Wallet.',
    tag: 'Instant Winnings',
    gradient: 'from-slate-900 via-emerald-950 to-slate-900',
    accentColor: 'text-emerald-300',
    ctaLabel: 'Open Wallet',
    action: 'DASHBOARD',
    icon: ShieldCheck,
  },
];

const MARKET_SLIDES: Slide[] = [
  {
    title: 'Shop New & Pre-Owned Products',
    description:
      'Discover gadgets, fashion, appliances, and everyday items from verified EFADO merchants.',
    tag: 'EFADO Market',
    gradient: 'from-slate-900 via-emerald-950 to-slate-900',
    accentColor: 'text-emerald-300',
    ctaLabel: 'Browse Products',
    action: 'MARKET',
    icon: ShoppingBag,
  },
  {
    title: 'Protected Checkout & Order Tracking',
    description:
      'Pay easily with your wallet, card, or bank transfer and follow every order from dispatch to delivery.',
    tag: 'Buyer Protection',
    gradient: 'from-slate-900 via-indigo-950 to-slate-900',
    accentColor: 'text-indigo-300',
    ctaLabel: 'View Marketplace',
    action: 'MARKET',
    icon: ShieldCheck,
  },
];

export const HubHeroCarousel: React.FC<HubHeroCarouselProps> = ({ hubType, onAction }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const slides = React.useMemo(() => {
    switch (hubType) {
      case 'GAMES':
      case 'QUIZ':
        return GAMES_SLIDES;
      case 'MARKET':
      case 'FAIRLY_USED':
        return MARKET_SLIDES;
      case 'EDUCATION':
        return EDUCATION_SLIDES;
      case 'ZOOM':
        return ZOOM_SLIDES;
      case 'HOME':
      case 'DASHBOARD':
      default:
        return DASHBOARD_SLIDES;
    }
  }, [hubType]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [hubType]);

  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length]);

  const currentSlide = slides[currentIndex] || slides[0];
  const SlideIcon = currentSlide.icon;

  const nextSlide = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative w-full min-h-[300px] sm:min-h-[360px] md:min-h-[400px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-white/10 bg-slate-900">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${hubType}-${currentIndex}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className={`relative w-full min-h-[300px] sm:min-h-[360px] md:min-h-[400px] bg-gradient-to-br ${currentSlide.gradient} flex flex-col justify-between p-5 sm:p-8 md:p-12`}
        >
          {/* Subtle Ambient Glow */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl" />

          {/* Top Bar inside Hero */}
          <div className="relative z-10 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-xs font-semibold text-white">
              <SlideIcon className={`w-4 h-4 ${currentSlide.accentColor}`} />
              <span>{currentSlide.tag}</span>
            </span>

            {slides.length > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={prevSlide}
                  aria-label="Previous slide"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  aria-label="Next slide"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Center/Bottom Content */}
          <div className="relative z-10 max-w-2xl my-6 sm:my-8">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight mb-3">
              {currentSlide.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-xl mb-6">
              {currentSlide.description}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onAction && onAction(currentSlide.action || 'DASHBOARD', currentSlide.subview)}
                className="min-h-[44px] px-5 sm:px-6 py-2.5 bg-white hover:bg-slate-100 text-slate-950 rounded-xl font-semibold text-sm shadow-lg transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>{currentSlide.ctaLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              {currentSlide.secondaryLabel && (
                <button
                  type="button"
                  onClick={() => onAction && onAction('MARKET')}
                  className="min-h-[44px] px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                >
                  Browse Hubs
                </button>
              )}
            </div>
          </div>

          {/* Slide Dots + Counter */}
          {slides.length > 1 && (
            <div className="relative z-10 flex items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2 flex-wrap">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to slide ${i + 1}`}
                    onClick={() => {
                      setIsAutoPlaying(false);
                      setCurrentIndex(i);
                    }}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      currentIndex === i ? 'w-8 bg-white' : 'w-3 bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-mono text-slate-300 tabular-nums shrink-0">
                {currentIndex + 1} / {slides.length}
              </span>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
