/**
 * EFADO Hubs Connect - Sovereign Monetization Engine
 * Handles real and simulated Display Ads, Affiliate Links, Cookie/CMP Consents,
 * Stripe Premium Billing, Digital Product Deliveries, GA4 Simulated Event Logger & dashboard,
 * and Live User Engagement metrics.
 */

export interface GA4Event {
  id: string;
  eventName: string;
  timestamp: string;
  parameters: Record<string, any>;
}

export interface AdFormat {
  id: string;
  name: string;
  placement: string;
  cpm: number;
}

export interface AffiliateLink {
  key: string;
  title: string;
  description: string;
  prettyUrl: string;
  destinationUrl: string;
  commission: string;
  category: 'Mining' | 'VPN' | 'Wallets' | 'Academy';
  rating: number;
  imageUrl: string;
}

export interface PaidMembership {
  id: string;
  name: string;
  priceNGN: number;
  priceUSD: number;
  cycle: 'Monthly' | 'Annual' | 'Lifetime';
  features: string[];
}

// Default Affiliate listings (Fully-clickable context pretty link mappings)
export const DEFAULT_AFFILIATE_LINKS: AffiliateLink[] = [
  {
    key: 'ledger-nano',
    title: 'Ledger Nano X - Sovereign Crypto Wallet',
    description: 'Protect your mined coins on-chain with military-grade Bluetooth hardware keys.',
    prettyUrl: '/affiliate/ledger',
    destinationUrl: 'https://shop.ledger.com/?r=efado-sovereign',
    commission: '10% Commission',
    category: 'Wallets',
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?q=80&w=400&auto=format&fit=crop'
  },
  {
    key: 'nordvpn-elite',
    title: 'NordVPN - Sovereign Security Protection',
    description: 'Ensure stable IP addresses and secure protocol mining globally with extreme speed.',
    prettyUrl: '/affiliate/nordvpn',
    destinationUrl: 'https://go.nordvpn.net/affiliate?offer_id=15&aff_id=efado-hubs',
    commission: '35% Recurring Comm.',
    category: 'VPN',
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=400&auto=format&fit=crop'
  },
  {
    key: 'asic-whatsminer',
    title: 'WhatsMiner M30S++ Accelerated Node',
    description: 'Professional-grade high-efficiency mining equipment optimized for the global work markets.',
    prettyUrl: '/affiliate/asic-miner',
    destinationUrl: 'https://whatsminer.com/?affiliate=efado-pastor',
    commission: '5% Comm. (up to $200/sale)',
    category: 'Mining',
    rating: 4.7,
    imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=400&auto=format&fit=crop'
  },
  {
    key: 'fullstack-dev-course',
    title: 'Next-Gen Web Dev & No-Code Systems Course',
    description: 'Learn how Okhawere Festus designs modular platforms and secure blockchain connections.',
    prettyUrl: '/affiliate/tech-masterclass',
    destinationUrl: 'https://udemy.com/efado-divine-academy',
    commission: '50% Direct Payout',
    category: 'Academy',
    rating: 5.0,
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400&auto=format&fit=crop'
  }
];

export const MEMBERSHIP_PLANS: PaidMembership[] = [
  {
    id: 'monthly_shield',
    name: 'Sovereign Monthly Shield',
    priceNGN: 4500,
    priceUSD: 5,
    cycle: 'Monthly',
    features: [
      'Ad-Free Core Platform Experience',
      'Instant Webinar & Seminar Access (No video ads required!)',
      'Double Mining Hashrate Acceleration (2.0x efficiency)',
      'Direct Weekly Divine Outline Downloads',
      'Exclusive Pastors and Leaders Forum ACCESS'
    ]
  },
  {
    id: 'annual_pinnacle',
    name: 'Annual Pinnacle Command',
    priceNGN: 45000,
    priceUSD: 49,
    cycle: 'Annual',
    features: [
      'All Monthly Shield Master Features',
      'Vip Invitation to EFADO Zoom Closed-Door Meetings',
      'Free Physical Media Kit & Printed Publishing Planner',
      'Direct Account Manager Support for sponsored promotions',
      'Save 20% compared to monthly subscriptions'
    ]
  },
  {
    id: 'lifetime_covenant',
    name: 'Lifetime Covenant Anchor',
    priceNGN: 180000,
    priceUSD: 199,
    cycle: 'Lifetime',
    features: [
      'Lifetime Sovereign Status - Never pay again',
      'Preached Sermon Video Audio Broadcast Privileges',
      'Special "Sovereign Executive" Visual Badge across all HUBS',
      'Custom Book Publisher Sponsorship Spotlight on Homepage',
      'All future features and directories included forever'
    ]
  }
];

class MonetizationService {
  private static STORAGE_PREF = 'efado_monetization_pref';
  private static STORAGE_STATS = 'efado_monetization_stats_v1';
  private static STORAGE_EVENTS = 'efado_monetization_events';

  // Lazy initialize GA4 script or analytics if requested
  constructor() {
    this.initRealGA4IfConsented();
  }

  // Check if consent cookies allow
  public hasConsent(): boolean {
    const saved = localStorage.getItem(MonetizationService.STORAGE_PREF);
    if (!saved) return false;
    try {
      return JSON.parse(saved).analyticsAndAdsApproved === true;
    } catch {
      return false;
    }
  }

  // Set privacy consent
  public saveConsent(approved: boolean) {
    localStorage.setItem(
      MonetizationService.STORAGE_PREF,
      JSON.stringify({
        analyticsAndAdsApproved: approved,
        timestamp: new Date().toISOString()
      })
    );
    if (approved) {
      this.initRealGA4IfConsented();
    }
  }

  // Mock-Init Real script tags safely matching AdSense / Auto-Ads lazy loading
  private initRealGA4IfConsented() {
    if (typeof window === 'undefined' || !this.hasConsent()) return;
    
    // Inject mock layout or ready states of standard AdSense client and GA4 window
    (window as any).gaEventTracker = (eventName: string, params: any) => {
      this.logGA4Event(eventName, params);
    };
  }

  // Add GA4 event tracking
  public logGA4Event(eventName: string, parameters: Record<string, any> = {}) {
    console.log(`[GA4 Event Logged]: ${eventName}`, parameters);
    
    const newEvent: GA4Event = {
      id: Math.random().toString(36).substr(2, 9),
      eventName,
      timestamp: new Date().toLocaleTimeString(),
      parameters: {
        ...parameters,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 30) : 'Server',
        url: typeof window !== 'undefined' ? window.location.pathname : '/'
      }
    };

    try {
      const stored = localStorage.getItem(MonetizationService.STORAGE_EVENTS);
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(newEvent); // Add to top
      localStorage.setItem(MonetizationService.STORAGE_EVENTS, JSON.stringify(list.slice(0, 50))); // Keep last 50
    } catch (e) {
      console.error("Failed to persist GA4 event:", e);
    }

    // Dynamic metrics increments
    this.incrementStatsForEvent(eventName);
  }

  // Get active local analytical telemetry events
  public getGA4Events(): GA4Event[] {
    try {
      const stored = localStorage.getItem(MonetizationService.STORAGE_EVENTS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  public clearGA4Events() {
    localStorage.removeItem(MonetizationService.STORAGE_EVENTS);
  }

  // Active revenue and clicks counters for simulated telemetry validation
  public getMonetizationStats() {
    try {
      const stored = localStorage.getItem(MonetizationService.STORAGE_STATS);
      return stored ? JSON.parse(stored) : {
        pageViews: 1420,
        miningClicks: 0,
        coinsMined: 0,
        seminarsAccessed: 0,
        adsImpressions: 124,
        videoAdsCompleted: 0,
        affiliateClicks: 0,
        totalEarningsUSD: 4.82,
        unlimitedKeysMined: false,
        subscribedTier: null,
        purchasedSeminarIds: []
      };
    } catch {
      return {
        pageViews: 1420,
        miningClicks: 0,
        coinsMined: 0,
        seminarsAccessed: 0,
        adsImpressions: 124,
        videoAdsCompleted: 0,
        affiliateClicks: 0,
        totalEarningsUSD: 4.82,
        unlimitedKeysMined: false,
        subscribedTier: null,
        purchasedSeminarIds: []
      };
    }
  }

  public saveMonetizationStats(stats: any) {
    localStorage.setItem(MonetizationService.STORAGE_STATS, JSON.stringify(stats));
  }

  private incrementStatsForEvent(eventName: string) {
    const stats = this.getMonetizationStats();
    stats.pageViews += 1;

    if (eventName === 'mining_button_click') {
      stats.miningClicks += 1;
      // Mining yields ad views
      if (stats.miningClicks % 5 === 0) {
        stats.adsImpressions += 1;
        stats.totalEarningsUSD += 0.05; // $0.05 CPM share
      }
    } else if (eventName === 'coin_mined') {
      stats.coinsMined += 1;
    } else if (eventName === 'seminar_access') {
      stats.seminarsAccessed += 1;
    } else if (eventName === 'rewarded_ad_watched') {
      stats.videoAdsCompleted += 1;
      stats.totalEarningsUSD += 0.85; // Rewarded video pays high CPM! $0.85 per play
    } else if (eventName === 'affiliate_link_click') {
      stats.affiliateClicks += 1;
      stats.totalEarningsUSD += 1.20; // Simulated affiliate bounty reward
    }

    this.saveMonetizationStats(stats);
  }

  // Toggle node upgrade or specific actions
  public subscribeToTier(tierId: string | null) {
    const stats = this.getMonetizationStats();
    stats.subscribedTier = tierId;
    this.saveMonetizationStats(stats);
    this.logGA4Event('user_subscription_changed', { tierId });
  }

  // Purchase specific seminar directly
  public purchaseSeminarDirectly(seminarId: string) {
    const stats = this.getMonetizationStats();
    if (!stats.purchasedSeminarIds) {
      stats.purchasedSeminarIds = [];
    }
    if (!stats.purchasedSeminarIds.includes(seminarId)) {
      stats.purchasedSeminarIds.push(seminarId);
    }
    this.saveMonetizationStats(stats);
    this.logGA4Event('seminar_direct_purchase', { seminarId });
  }
}

export const monetizationService = new MonetizationService();
