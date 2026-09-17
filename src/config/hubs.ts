export interface HubConfig {
  name: string;
  slug: string;
  tag: string;
  desc: string;
  color: string;
  route: string;
  category?: string;
  iconName?: string;
  accent?: string;
}

export const HUBS: HubConfig[] = [
  { 
    name: "Arena Hub", 
    slug: "arena", 
    tag: "POPULAR", 
    desc: "Games including Deep Sea Jet, Lucky Spin, DMT. Earn rewards and instant cashouts.", 
    color: "from-purple-600 to-pink-600",
    route: "/hub/arena",
    category: "GAMES",
    iconName: "Gamepad2",
    accent: "#a855f7"
  },
  { 
    name: "Market Hubs", 
    slug: "market", 
    tag: "MARKETPLACE", 
    desc: "Buy and sell fairly used or new products. Connect with verified vendors.", 
    color: "from-green-600 to-emerald-600",
    route: "/hub/market",
    category: "COMMERCE",
    iconName: "ShoppingBag",
    accent: "#10b981"
  },
  { 
    name: "EFADO Advertising", 
    slug: "advertising", 
    tag: "GLOBAL", 
    desc: "Strategic visibility for hotels, cars, estate, vehicles, and high-impact campaigns.", 
    color: "from-orange-600 to-red-600",
    route: "/hub/advertising",
    category: "BUSINESS",
    iconName: "Megaphone",
    accent: "#f97316"
  },
  { 
    name: "Professional Services", 
    slug: "services", 
    tag: "PROFESSIONAL", 
    desc: "Service providers for home, building, technology, and technical consultancy.", 
    color: "from-blue-600 to-cyan-600",
    route: "/hub/services",
    category: "SERVICES",
    iconName: "HardHat",
    accent: "#06b6d4"
  },
  { 
    name: "Community Hubs", 
    slug: "community", 
    tag: "SAVINGS", 
    desc: "Collective saving cycles CSCC with rotating payouts and trusted thrift pools.", 
    color: "from-yellow-600 to-amber-600",
    route: "/hub/community",
    category: "SAVINGS",
    iconName: "Users",
    accent: "#f59e0b"
  },
  { 
    name: "HEPIHANDS Loan", 
    slug: "loan", 
    tag: "FINANCE", 
    desc: "Transparent and accessible credit for members. Instant verification and low interest.", 
    color: "from-teal-600 to-green-600",
    route: "/hub/loan",
    category: "FINANCE",
    iconName: "HandCoins",
    accent: "#14b8a6"
  },
  { 
    name: "Data Vending", 
    slug: "data-vending", 
    tag: "UTILITY", 
    desc: "Top-up and airtime vending. Quick recharging for data plans in 120+ countries.", 
    color: "from-indigo-600 to-purple-600",
    route: "/hub/data-vending",
    category: "UTILITY",
    iconName: "Zap",
    accent: "#6366f1"
  },
  { 
    name: "China Sourcing Hub", 
    slug: "china", 
    tag: "B2B TRADE", 
    desc: "Direct factory sourcing pipeline from China. Request wholesale quotes and logistics.", 
    color: "from-red-600 to-rose-600",
    route: "/hub/china",
    category: "TRADE",
    iconName: "Package",
    accent: "#f43f5e"
  },
  { 
    name: "Crypto OTC & Convert", 
    slug: "crypto", 
    tag: "FINANCE", 
    desc: "Exchange digital assets seamlessly. Local fiat or global bank transfer with safe escrow.", 
    color: "from-lime-600 to-green-600",
    route: "/hub/crypto",
    category: "FINANCE",
    iconName: "Coins",
    accent: "#84cc16"
  },
  { 
    name: "Education Hub", 
    slug: "education", 
    tag: "NEW HUB", 
    desc: "Academic platform covering all levels to Postgraduate. Courses, e-library, and resources.", 
    color: "from-sky-600 to-blue-600",
    route: "/hub/education",
    category: "EDUCATION",
    iconName: "GraduationCap",
    accent: "#0ea5e9"
  },
];

export function getHubBySlug(slug: string): HubConfig | undefined {
  if (!slug) return undefined;
  const clean = slug.toLowerCase().replace(/^\/+|\/+$/g, '').trim();
  // Support aliases
  if (clean === 'data' || clean === 'vending' || clean === 'airtime') return HUBS.find(h => h.slug === 'data-vending');
  if (clean === 'sourcing' || clean === 'factory') return HUBS.find(h => h.slug === 'china');
  if (clean === 'games' || clean === 'game' || clean === 'deepseajet') return HUBS.find(h => h.slug === 'arena');
  if (clean === 'edu' || clean === 'school') return HUBS.find(h => h.slug === 'education');
  if (clean === 'loans' || clean === 'hepihands') return HUBS.find(h => h.slug === 'loan');
  if (clean === 'cscc' || clean === 'thrift') return HUBS.find(h => h.slug === 'community');
  if (clean === 'ads' || clean === 'advertise') return HUBS.find(h => h.slug === 'advertising');
  if (clean === 'otc' || clean === 'exchange') return HUBS.find(h => h.slug === 'crypto');
  if (clean === 'marketplace' || clean === 'shop') return HUBS.find(h => h.slug === 'market');
  if (clean === 'tech' || clean === 'work' || clean === 'freelance') return HUBS.find(h => h.slug === 'services');
  return HUBS.find(h => h.slug === clean);
}
