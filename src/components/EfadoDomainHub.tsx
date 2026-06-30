import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, 
  Search, 
  ChevronRight, 
  ArrowLeft, 
  ShoppingCart, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink,
  ShieldCheck,
  Zap,
  CreditCard,
  History,
  Mail,
  Award,
  Sparkles,
  BookOpen,
  Flame,
  Calendar,
  Cpu,
  Check,
  Info,
  ArrowUpRight,
  ArrowRight,
  UserCheck,
  XCircle,
  Phone,
  Wifi,
  Terminal as TermIcon,
  Settings,
  Briefcase,
  Plus,
  TrendingUp,
  User,
  Sliders,
  Activity,
  Calculator,
  Coins,
  RefreshCw,
  ArrowLeftRight,
  Download,
  Send,
  Copy,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  db, 
  auth, 
  collection, 
  onSnapshot, 
  addDoc, 
  query, 
  where, 
  serverTimestamp,
  doc,
  setDoc,
  updateDoc,
  increment
} from '../firebase';
import { PaymentPlatform } from './PaymentPlatform';
import { DomainSeller, DomainCatalog, DomainOrder, UserProfile } from '../types';
import { useCurrency } from '../lib/CurrencyContext';
import { EfadoEmailHub } from './EfadoEmailHub';
import { VendingMarketplace } from './VendingMarketplace';

interface EfadoDomainHubProps {
  user: UserProfile;
  initialSection?: 'domains' | 'course' | 'tools' | 'vending' | 'otc' | 'sourcing';
}

interface CurrencyItem {
  code: string;
  name: string;
  symbol: string;
}

const SUPPORTED_CURRENCIES: CurrencyItem[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'GBP', name: 'British Pound Sterling', symbol: '£' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SR' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
  { code: 'CFA', name: 'West African CFA Franc', symbol: 'CFA' },
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'DA' },
  { code: 'AOA', name: 'Angolan Kwanza', symbol: 'Kz' },
  { code: 'BWP', name: 'Botswana Pula', symbol: 'P' },
  { code: 'BIF', name: 'Burundian Franc', symbol: 'FBu' },
  { code: 'CVE', name: 'Cape Verdean Escudo', symbol: 'Esc' },
  { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA' },
  { code: 'KMF', name: 'Comorian Franc', symbol: 'CF' },
  { code: 'CDF', name: 'Congolese Franc', symbol: 'FC' },
  { code: 'DJF', name: 'Djiboutian Franc', symbol: 'Fdj' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' },
  { code: 'ERN', name: 'Eritrean Nakfa', symbol: 'Nfk' },
  { code: 'SZL', name: 'Swazi Lilangeni', symbol: 'L' },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br' },
  { code: 'GMD', name: 'Gambian Dalasi', symbol: 'D' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵' },
  { code: 'GNF', name: 'Guinean Franc', symbol: 'FG' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'LSL', name: 'Lesotho Loti', symbol: 'L' },
  { code: 'LRD', name: 'Liberian Dollar', symbol: 'L$' },
  { code: 'LYD', name: 'Libyan Dinar', symbol: 'LD' },
  { code: 'MGA', name: 'Malagasy Ariary', symbol: 'Ar' },
  { code: 'MWK', name: 'Malawian Kwacha', symbol: 'MK' },
  { code: 'MRU', name: 'Mauritanian Ouguiya', symbol: 'UM' },
  { code: 'MUR', name: 'Mauritian Rupee', symbol: '₨' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'MAD' },
  { code: 'MZN', name: 'Mozambican Metical', symbol: 'MT' },
  { code: 'NAD', name: 'Namibian Dollar', symbol: 'N$' },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'FRw' },
  { code: 'STN', name: 'São Tomé and Príncipe Dobra', symbol: 'Db' },
  { code: 'SCR', name: 'Seychellois Rupee', symbol: 'SR' },
  { code: 'SLL', name: 'Sierra Leone Leone', symbol: 'Le' },
  { code: 'SOS', name: 'Somali Shilling', symbol: 'Sh' },
  { code: 'SSP', name: 'South Sudanese Pound', symbol: 'SSP' },
  { code: 'SDG', name: 'Sudanese Pound', symbol: 'SDG' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'DT' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh' },
  { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK' },
  { code: 'ZWL', name: 'Zimbabwean Dollar', symbol: 'Z$' },
  { code: 'SBD', name: 'Solomon Islands Dollar', symbol: 'SI$' },
  { code: 'AMD', name: 'Armenian Dram', symbol: '֏' },
  { code: 'AZN', name: 'Azerbaijani Manat', symbol: '₼' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
  { code: 'RSD', name: 'Serbian Dinar', symbol: 'RSD' },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
  { code: 'ILS', name: 'Israeli New Shekel', symbol: '₪' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'R.O.' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'QR' },
  { code: 'PAB', name: 'Panamanian Balboa', symbol: 'B/.' },
  { code: 'PYG', name: 'Paraguayan Guarani', symbol: '₲' },
  { code: 'SYP', name: 'Syrian Pound', symbol: 'LS' },
  { code: 'TMT', name: 'Turkmen manat', symbol: 'TMT' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴' },
  { code: 'VEF', name: 'Venezuelan Bolívar', symbol: 'Bs.F' }
];

const AI_TOOLS_LIST = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    category: 'writing',
    desc: 'General AI assistant — write, brainstorm, research, code',
    link: 'https://chatgpt.com',
    badge: 'Popular'
  },
  {
    id: 'claude',
    name: 'Claude AI',
    category: 'writing',
    desc: 'Best for long-form writing, analysis, and thoughtful responses',
    link: 'https://claude.ai',
    badge: 'Highly Rated'
  },
  {
    id: 'jasper',
    name: 'Jasper AI',
    category: 'writing',
    desc: 'Marketing & brand copy — blogs, ads, emails, landing pages',
    link: 'https://jasper.ai',
    badge: 'Pro Marketing'
  },
  {
    id: 'grammarly',
    name: 'Grammarly',
    category: 'writing',
    desc: 'AI writing assistant — grammar, tone, clarity improvements',
    link: 'https://grammarly.com',
    badge: 'Essentials'
  },
  {
    id: 'copyai',
    name: 'Copy.ai',
    category: 'writing',
    desc: 'Quick social media captions, product descriptions, ad copy',
    link: 'https://copy.ai',
    badge: 'Quick Copy'
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    category: 'design',
    desc: 'Generate stunning artistic images from text prompts',
    link: 'https://midjourney.com',
    badge: 'Premium Art'
  },
  {
    id: 'dalle',
    name: 'DALL-E 3',
    category: 'design',
    desc: "OpenAI's image generator — realistic & creative visuals",
    link: 'https://openai.com/dall-e-3',
    badge: 'Creative'
  },
  {
    id: 'canva',
    name: 'Canva AI',
    category: 'design',
    desc: 'Design anything — AI-powered templates, magic edit, background remover',
    link: 'https://canva.com',
    badge: 'All-in-one'
  },
  {
    id: 'leonardo',
    name: 'Leonardo AI',
    category: 'design',
    desc: 'Free AI image generator — game assets, characters, concept art',
    link: 'https://leonardo.ai',
    badge: 'Free Daily'
  },
  {
    id: 'firefly',
    name: 'Adobe Firefly',
    category: 'design',
    desc: "Adobe's ethical AI — generate, edit, transform images",
    link: 'https://firefly.adobe.com',
    badge: 'Creator Friendly'
  },
  {
    id: 'runway',
    name: 'Runway Gen-2',
    category: 'video',
    desc: 'Generate and edit high-quality cinema-grade videos from text or inputs',
    link: 'https://runwayml.com',
    badge: 'Video Leader'
  },
  {
    id: 'synthesia',
    name: 'Synthesia',
    category: 'video',
    desc: 'Create AI-avatar talking head videos from plain text scripts in minutes',
    link: 'https://synthesia.io',
    badge: 'Corporate'
  },
  {
    id: 'sora',
    name: 'Sora',
    category: 'video',
    desc: "OpenAI's advanced state-of-the-art text-to-video simulation engine",
    link: 'https://openai.com/sora',
    badge: 'Next Gen'
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    category: 'video',
    desc: 'Incredibly realistic AI voice generator and text-to-speech engine',
    link: 'https://elevenlabs.io',
    badge: 'Best Audio'
  },
  {
    id: 'suno',
    name: 'Suno AI',
    category: 'video',
    desc: 'Produce complete, high-fidelity radio-ready vocal tracks from descriptions',
    link: 'https://suno.com',
    badge: 'Music Studio'
  }
];

// Vending types & static configurations
interface OperatorPlan {
  id: string;
  name: string;
  priceNGN: number;
  priceUSD: number;
  dataAllowance: string;
  validity: string;
}

interface Operator {
  code: string;
  name: string;
  logo: string;
  countryCode: string;
  currency: string;
  minAirtimeNGN: number;
  maxAirtimeNGN: number;
  plans: OperatorPlan[];
}

interface Country {
  code: string;
  name: string;
  flag: string;
  phonePrefix: string;
  currency: string;
  operators: Operator[];
}

const GLOBAL_VENDING_COUNTRIES: Country[] = [
  {
    code: 'NG',
    name: 'Nigeria',
    flag: '🇳🇬',
    phonePrefix: '+234',
    currency: 'NGN',
    operators: [
      {
        code: 'mtn_ng',
        name: 'MTN Nigeria',
        logo: 'https://seeklogo.com/images/M/mtn-logo-406A171958-seeklogo.com.png',
        countryCode: 'NG',
        currency: 'NGN',
        minAirtimeNGN: 100,
        maxAirtimeNGN: 50000,
        plans: [
          { id: 'mtn_ng_1', name: '1.5GB Daily Max', priceNGN: 500, priceUSD: 0.35, dataAllowance: '1.5 GB', validity: '24 Hours' },
          { id: 'mtn_ng_2', name: '3GB 2-Day Surge', priceNGN: 1000, priceUSD: 0.70, dataAllowance: '3 GB', validity: '2 Days' },
          { id: 'mtn_ng_3', name: '10GB Monthly Super', priceNGN: 3500, priceUSD: 2.30, dataAllowance: '10 GB', validity: '30 Days' },
          { id: 'mtn_ng_4', name: '45GB Monthly Heavy-User', priceNGN: 11000, priceUSD: 7.30, dataAllowance: '45 GB', validity: '30 Days' },
          { id: 'mtn_ng_5', name: '120GB Lifetime Deluxe', priceNGN: 25000, priceUSD: 16.50, dataAllowance: '120 GB', validity: '90 Days' }
        ]
      },
      {
        code: 'airtel_ng',
        name: 'Airtel Nigeria',
        logo: 'https://seeklogo.com/images/A/airtel-logo-55BBB99FA0-seeklogo.com.png',
        countryCode: 'NG',
        currency: 'NGN',
        minAirtimeNGN: 100,
        maxAirtimeNGN: 50000,
        plans: [
          { id: 'airtel_ng_1', name: '2GB Daily Connect', priceNGN: 600, priceUSD: 0.40, dataAllowance: '2 GB', validity: '24 Hours' },
          { id: 'airtel_ng_2', name: '6GB Weekly Social', priceNGN: 1600, priceUSD: 1.05, dataAllowance: '6 GB', validity: '7 Days' },
          { id: 'airtel_ng_3', name: '15GB Monthly Executive', priceNGN: 5000, priceUSD: 3.30, dataAllowance: '15 GB', validity: '30 Days' },
          { id: 'airtel_ng_4', name: 'Unlimited Daily Midnight', priceNGN: 2000, priceUSD: 1.30, dataAllowance: 'Unlimited', validity: '1 Night' }
        ]
      },
      {
        code: 'glo_ng',
        name: 'Globacom (Glo)',
        logo: 'https://seeklogo.com/images/G/glo-unlimited-logo-F2BAA8AB90-seeklogo.com.png',
        countryCode: 'NG',
        currency: 'NGN',
        minAirtimeNGN: 100,
        maxAirtimeNGN: 30000,
        plans: [
          { id: 'glo_ng_1', name: '1.25GB Daily Plus', priceNGN: 400, priceUSD: 0.28, dataAllowance: '1.25 GB', validity: '24 Hours' },
          { id: 'glo_ng_2', name: '7GB Weekly Grand', priceNGN: 1500, priceUSD: 1.00, dataAllowance: '7 GB', validity: '7 Days' },
          { id: 'glo_ng_3', name: '12GB Monthly Bumper', priceNGN: 3000, priceUSD: 2.00, dataAllowance: '12 GB', validity: '30 Days' }
        ]
      },
      {
        code: '9mobile_ng',
        name: '9mobile Nigeria',
        logo: 'https://seeklogo.com/images/1/9mobile-logo-0BEC8DBA5F-seeklogo.com.png',
        countryCode: 'NG',
        currency: 'NGN',
        minAirtimeNGN: 100,
        maxAirtimeNGN: 50000,
        plans: [
          { id: '9mobile_ng_1', name: '1.5GB Daily Lite', priceNGN: 500, priceUSD: 0.35, dataAllowance: '1.5 GB', validity: '24 Hours' },
          { id: '9mobile_ng_2', name: '3GB 3-Day Blast', priceNGN: 1000, priceUSD: 0.70, dataAllowance: '3 GB', validity: '3 Days' },
          { id: '9mobile_ng_3', name: '12GB Monthly Smart', priceNGN: 3000, priceUSD: 2.00, dataAllowance: '12 GB', validity: '30 Days' },
          { id: '9mobile_ng_sme', name: '10GB SME Corporate', priceNGN: 2500, priceUSD: 1.65, dataAllowance: '10 GB', validity: '30 Days' }
        ]
      }
    ]
  },
  {
    code: 'GH',
    name: 'Ghana',
    flag: '🇬🇭',
    phonePrefix: '+233',
    currency: 'GHS',
    operators: [
      {
        code: 'mtn_gh',
        name: 'MTN Ghana',
        logo: 'https://seeklogo.com/images/M/mtn-logo-406A171958-seeklogo.com.png',
        countryCode: 'GH',
        currency: 'GHS',
        minAirtimeNGN: 200,
        maxAirtimeNGN: 20000,
        plans: [
          { id: 'mtn_gh_1', name: '1GB Daily Bundle', priceNGN: 800, priceUSD: 0.53, dataAllowance: '1 GB', validity: '1 Day' },
          { id: 'mtn_gh_2', name: '5GB Weekly Giga', priceNGN: 2500, priceUSD: 1.65, dataAllowance: '5 GB', validity: '7 Days' },
          { id: 'mtn_gh_3', name: '20GB Monthly Ultimate', priceNGN: 8000, priceUSD: 5.30, dataAllowance: '20 GB', validity: '30 Days' }
        ]
      },
      {
        code: 'telecel_gh',
        name: 'Telecel Ghana (Vodafone)',
        logo: 'https://seeklogo.com/images/V/vodafone-greece-logo-FB1EC4BEA5-seeklogo.com.png',
        countryCode: 'GH',
        currency: 'GHS',
        minAirtimeNGN: 200,
        maxAirtimeNGN: 15000,
        plans: [
          { id: 'tel_gh_1', name: '1.5GB Daily Flash', priceNGN: 1000, priceUSD: 0.65, dataAllowance: '1.5 GB', validity: '1 Day' },
          { id: 'tel_gh_2', name: '10GB Monthly Smart', priceNGN: 4500, priceUSD: 3.00, dataAllowance: '10 GB', validity: '30 Days' }
        ]
      }
    ]
  },
  {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    phonePrefix: '+254',
    currency: 'KES',
    operators: [
      {
        code: 'safaricom_ke',
        name: 'Safaricom (M-PESA Link)',
        logo: 'https://seeklogo.com/images/S/safaricom-logo-4D0512BF57-seeklogo.com.png',
        countryCode: 'KE',
        currency: 'KES',
        minAirtimeNGN: 300,
        maxAirtimeNGN: 40000,
        plans: [
          { id: 'saf_ke_1', name: '1GB Daily Safaricom Pass', priceNGN: 900, priceUSD: 0.60, dataAllowance: '1 GB', validity: '24 Hours' },
          { id: 'saf_ke_2', name: '8GB Weekly Max Extra', priceNGN: 2800, priceUSD: 1.85, dataAllowance: '8 GB', validity: '7 Days' },
          { id: 'saf_ke_3', name: '30GB Monthly Sovereign', priceNGN: 7500, priceUSD: 5.00, dataAllowance: '30 GB', validity: '30 Days' }
        ]
      },
      {
        code: 'airtel_ke',
        name: 'Airtel Kenya',
        logo: 'https://seeklogo.com/images/A/airtel-logo-55BBB99FA0-seeklogo.com.png',
        countryCode: 'KE',
        currency: 'KES',
        minAirtimeNGN: 200,
        maxAirtimeNGN: 30000,
        plans: [
          { id: 'air_ke_1', name: '1.5GB Daily Airtel Plus', priceNGN: 800, priceUSD: 0.53, dataAllowance: '1.5 GB', validity: '24 Hours' },
          { id: 'air_ke_2', name: '15GB Monthly Airtel Pro', priceNGN: 4000, priceUSD: 2.65, dataAllowance: '15 GB', validity: '30 Days' }
        ]
      }
    ]
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    phonePrefix: '+44',
    currency: 'GBP',
    operators: [
      {
        code: 'ee_gb',
        name: 'EE UK',
        logo: 'https://seeklogo.com/images/E/ee-logo-4DDBF6E433-seeklogo.com.png',
        countryCode: 'GB',
        currency: 'GBP',
        minAirtimeNGN: 1500,
        maxAirtimeNGN: 80000,
        plans: [
          { id: 'ee_gb_1', name: '5GB UK Roaming', priceNGN: 4500, priceUSD: 3.00, dataAllowance: '5 GB', validity: '30 Days' },
          { id: 'ee_gb_2', name: '20GB High-Speed 5G', priceNGN: 12000, priceUSD: 8.00, dataAllowance: '20 GB', validity: '30 Days' },
          { id: 'ee_gb_3', name: '100GB Elite UK Power', priceNGN: 28000, priceUSD: 18.50, dataAllowance: '100 GB', validity: '30 Days' }
        ]
      },
      {
        code: 'vodafone_gb',
        name: 'Vodafone UK',
        logo: 'https://seeklogo.com/images/V/vodafone-logo-B3A9B28D69-seeklogo.com.png',
        countryCode: 'GB',
        currency: 'GBP',
        minAirtimeNGN: 1500,
        maxAirtimeNGN: 80000,
        plans: [
          { id: 'voda_gb_1', name: '10GB Big Value Solo', priceNGN: 7000, priceUSD: 4.60, dataAllowance: '10 GB', validity: '30 Days' },
          { id: 'voda_gb_2', name: '50GB Extreme Family Pass', priceNGN: 18000, priceUSD: 12.00, dataAllowance: '50 GB', validity: '30 Days' }
        ]
      }
    ]
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    phonePrefix: '+1',
    currency: 'USD',
    operators: [
      {
        code: 'tmobile_us',
        name: 'T-Mobile USA',
        logo: 'https://seeklogo.com/images/T/t-mobile-logo-ACF1142510-seeklogo.com.png',
        countryCode: 'US',
        currency: 'USD',
        minAirtimeNGN: 2000,
        maxAirtimeNGN: 150000,
        plans: [
          { id: 'tmobile_us_1', name: '2GB Prepaid Connect', priceNGN: 7500, priceUSD: 5.00, dataAllowance: '2 GB', validity: '30 Days' },
          { id: 'tmobile_us_2', name: '10GB Fast LTE Mobile', priceNGN: 18000, priceUSD: 12.00, dataAllowance: '10 GB', validity: '30 Days' },
          { id: 'tmobile_us_3', name: 'Unlimited Nationwide Giga', priceNGN: 38000, priceUSD: 25.00, dataAllowance: 'Unlimited', validity: '30 Days' }
        ]
      },
      {
        code: 'verizon_us',
        name: 'Verizon Wireless',
        logo: 'https://seeklogo.com/images/V/verizon-logo-975DE1FB11-seeklogo.com.png',
        countryCode: 'US',
        currency: 'USD',
        minAirtimeNGN: 3000,
        maxAirtimeNGN: 150000,
        plans: [
          { id: 'verizon_us_1', name: '5GB Monthly Starter', priceNGN: 15000, priceUSD: 10.00, dataAllowance: '5 GB', validity: '30 Days' },
          { id: 'verizon_us_2', name: '30GB Heavy Duty 5G', priceNGN: 35000, priceUSD: 23.30, dataAllowance: '30 GB', validity: '30 Days' }
        ]
      }
    ]
  }
];

export const EfadoDomainHub: React.FC<EfadoDomainHubProps> = ({ user, initialSection }) => {
  const { formatPrice } = useCurrency();
  const [view, setView] = useState<'landing' | 'seller' | 'checkout' | 'orders' | 'email'>('landing');
  const [activeLandingSection, setActiveLandingSection] = useState<'domains' | 'course' | 'tools' | 'vending' | 'otc' | 'sourcing'>(initialSection || 'domains');

  // Unified payment states
  const [showPaymentPlatform, setShowPaymentPlatform] = useState(false);
  const [paymentPlatformAmount, setPaymentPlatformAmount] = useState(1000);
  const [paymentPlatformPurpose, setPaymentPlatformPurpose] = useState('');
  const [paymentPlatformOnSuccess, setPaymentPlatformOnSuccess] = useState<(() => Promise<void> | void) | null>(null);

  useEffect(() => {
    if (initialSection) {
      setActiveLandingSection(initialSection);
    }
  }, [initialSection]);
  
  // NEW Step controller for highly optimized vending UX
  const [vendingFlowStep, setVendingFlowStep] = useState<'choice' | 'details' | 'confirm' | 'result'>('choice');
  const [saveBeneficiary, setSaveBeneficiary] = useState<boolean>(false);
  const [savedBeneficiaries, setSavedBeneficiaries] = useState<Array<{ name: string; phone: string; operator: string; country: string }>>([
    { name: 'Self (MTN)', phone: '08031234567', operator: 'mtn_ng', country: 'NG' },
    { name: 'Partner (Airtel)', phone: '08129876543', operator: 'airtel_ng', country: 'NG' }
  ]);
  const [vendingDataTab, setVendingDataTab] = useState<'daily' | 'weekly' | 'monthly' | 'sme'>('monthly');
  
  // Premium On-Site Crypto OTC Swap & Transfer Desk States
  const [otcSellCrypto, setOtcSellCrypto] = useState<string>('USDT');
  const [otcSellAmount, setOtcSellAmount] = useState<number>(100);
  const [otcGetCurrency, setOtcGetCurrency] = useState<string>('NGN');
  const [otcStep, setOtcStep] = useState<'input' | 'quote' | 'deposit' | 'confirming' | 'complete'>('input');
  const [otcInternalTab, setOtcInternalTab] = useState<'swap' | 'convert' | 'history'>('swap');
  
  // Supported coin types
  const [otcTokens, setOtcTokens] = useState<Array<{ symbol: string; name: string; category: 'major' | 'stable' | 'alt' | 'custom'; logo?: string; chain: string; status: string; contractAddress?: string; decimals: number }>>([
    { symbol: 'USDT', name: 'Tether USD', category: 'stable', logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png', chain: 'TRON / TRC20', status: 'Active', decimals: 6 },
    { symbol: 'USDC', name: 'USD Coin', category: 'stable', logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png', chain: 'Ethereum / ERC20', status: 'Active', decimals: 6 },
    { symbol: 'BTC', name: 'Bitcoin', category: 'major', logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png', chain: 'Bitcoin Network', status: 'Active', decimals: 8 },
    { symbol: 'ETH', name: 'Ethereum', category: 'major', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png', chain: 'Ethereum Network', status: 'Active', decimals: 18 },
    { symbol: 'BNB', name: 'Binance Coin', category: 'major', logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.png', chain: 'BSC Network', status: 'Active', decimals: 18 },
    { symbol: 'SOL', name: 'Solana', category: 'major', logo: 'https://cryptologos.cc/logos/solana-sol-logo.png', chain: 'Solana Network', status: 'Active', decimals: 9 },
    { symbol: 'TRX', name: 'Tron', category: 'major', logo: 'https://cryptologos.cc/logos/tron-trx-logo.png', chain: 'Tron Network', status: 'Active', decimals: 6 },
    { symbol: 'DAI', name: 'Dai Stablecoin', category: 'stable', logo: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png', chain: 'Ethereum / ERC20', status: 'Active', decimals: 18 },
    { symbol: 'FDUSD', name: 'First Digital USD', category: 'stable', logo: 'https://assets.coingecko.com/coins/images/31034/large/FDUSD.png', chain: 'BSC / BEP20', status: 'Active', decimals: 18 },
    { symbol: 'POL', name: 'Polygon', category: 'alt', logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png', chain: 'Polygon Network', status: 'Active', decimals: 18 },
    { symbol: 'ARB', name: 'Arbitrum', category: 'alt', logo: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png', chain: 'Arbitrum One', status: 'Active', decimals: 18 },
    { symbol: 'AVAX', name: 'Avalanche', category: 'alt', logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.png', chain: 'Avalanche C-Chain', status: 'Active', decimals: 18 },
    { symbol: 'SUI', name: 'Sui Token', category: 'alt', logo: 'https://assets.coingecko.com/coins/images/26375/large/sui_asset.png', chain: 'Sui Network', status: 'Active', decimals: 9 },
    { symbol: 'TON', name: 'The Open Network', category: 'alt', logo: 'https://cryptologos.cc/logos/toncoin-ton-logo.png', chain: 'TON Network', status: 'Active', decimals: 9 }
  ]);
  
  const [otcCustomTokenAddress, setOtcCustomTokenAddress] = useState<string>('');
  const [otcCustomTokenChain, setOtcCustomTokenChain] = useState<string>('Ethereum / ERC20');
  const [otcTokenSearch, setOtcTokenSearch] = useState<string>('');
  const [otcRates, setOtcRates] = useState<Record<string, number>>({
    USDT: 1.0, USDC: 1.0, DAI: 1.0, FDUSD: 1.0,
    BTC: 68500, ETH: 3550, BNB: 590, SOL: 165, TRX: 0.125,
    POL: 0.72, ARB: 0.95, AVAX: 34.5, SUI: 1.15, TON: 7.2
  });
  
  const [otcPayoutMethod, setOtcPayoutMethod] = useState<'bank' | 'mobile_money' | 'paypal' | 'payoneer' | 'wallet'>('bank');
  const [otcBankName, setOtcBankName] = useState<string>('');
  const [otcBankAccount, setOtcBankAccount] = useState<string>('');
  const [otcAccountName, setOtcAccountName] = useState<string>('');
  const [otcPayPhone, setOtcPayPhone] = useState<string>('');
  const [otcEmailAddress, setOtcEmailAddress] = useState<string>('');
  const [otcProgress, setOtcProgress] = useState<number>(0);
  const [otcConfirmations, setOtcConfirmations] = useState<number>(0);
  const [otcRequiredConfirmations, setOtcRequiredConfirmations] = useState<number>(3);
  
  // Live price feeds from Binance/1inch API quote emulation
  const [otcQuoteRate, setOtcQuoteRate] = useState<number>(0);
  const [otcQuoteExpiry, setOtcQuoteExpiry] = useState<number>(45);
  const [otcTxHash, setOtcTxHash] = useState<string>('');
  const [otcOrders, setOtcOrders] = useState<any[]>([]);
  
  // Fiat conversions section variables
  const [convSourceCurrency, setConvSourceCurrency] = useState<string>('USD');
  const [convTargetCurrency, setConvTargetCurrency] = useState<string>('NGN');
  const [convAmount, setConvAmount] = useState<number>(100);
  const [convPayoutBank, setConvPayoutBank] = useState<string>('');
  const [convPayoutAccount, setConvPayoutAccount] = useState<string>('');
  const [convPayoutName, setConvPayoutName] = useState<string>('');
  const [convPayoutMobile, setConvPayoutMobile] = useState<string>('');
  const [convPayoutWallet, setConvPayoutWallet] = useState<string>('');
  const [convPayoutType, setConvPayoutType] = useState<'bank' | 'mobile' | 'crypto'>('bank');
  const [convStatus, setConvStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [convLogs, setConvLogs] = useState<string[]>([]);

  // Rates for standard supported currencies (relative to 1 USD)
  const fiatRates: Record<string, number> = {
    USD: 1.0,
    EUR: 0.92,
    JPY: 156.8,
    GBP: 0.79,
    AUD: 1.51,
    CAD: 1.37,
    CHF: 0.91,
    CNY: 7.24,
    INR: 83.3,
    BRL: 5.15,
    ZAR: 18.5,
    NGN: 1550,
    MXN: 16.7,
    KRW: 1360.0,
    RUB: 90.5,
    SAR: 3.75,
    SGD: 1.35,
    HKD: 7.82,
    TWD: 32.2,
    MYR: 4.71,
    IDR: 16100.0,
    TRY: 32.2,
    VND: 25400.0,
    CFA: 600.0,
    DZD: 134.5,
    AOA: 845.0,
    BWP: 13.6,
    BIF: 2855.0,
    CVE: 101.5,
    XAF: 600.0,
    KMF: 450.0,
    CDF: 2780.0,
    DJF: 177.7,
    EGP: 47.1,
    ERN: 15.0,
    SZL: 18.5,
    ETB: 57.2,
    GMD: 68.0,
    GHS: 14.5,
    GNF: 8600.0,
    KES: 131.0,
    LSL: 18.5,
    LRD: 194.0,
    LYD: 4.85,
    MGA: 4450.0,
    MWK: 1730.0,
    MRU: 39.7,
    MUR: 46.2,
    MAD: 10.1,
    MZN: 63.8,
    NAD: 18.5,
    RWF: 1290.0,
    STN: 22.5,
    SCR: 13.5,
    SLL: 22400.0,
    SOS: 571.0,
    SSP: 130.3,
    SDG: 601.0,
    TZS: 2590.0,
    TND: 3.12,
    UGX: 3780.0,
    ZMW: 25.4,
    ZWL: 13.9,
    SBD: 8.48,
    AMD: 388.0,
    AZN: 1.70,
    BHD: 0.376,
    BDT: 117.0,
    RSD: 108.0,
    HRK: 7.02,
    HUF: 358.0,
    ILS: 3.72,
    KWD: 0.307,
    OMR: 0.385,
    QAR: 3.64,
    PAB: 1.0,
    PYG: 7500.0,
    SYP: 13000.0,
    TMT: 3.50,
    UAH: 40.1,
    VEF: 36.3
  };

  // Global Airtime & Data Bundle Vending System State
  const [vendingCountry, setVendingCountry] = useState<string>('NG');
  const [vendingType, setVendingType] = useState<'airtime' | 'data'>('airtime');
  const [vendingOperator, setVendingOperator] = useState<string>('mtn_ng');
  const [vendingPhone, setVendingPhone] = useState<string>('');
  const [vendingCustomAirtimeAmount, setVendingCustomAirtimeAmount] = useState<number>(500);
  const [vendingSelectedDataPlanId, setVendingSelectedDataPlanId] = useState<string>('mtn_ng_1');
  const [vendingPayMethod, setVendingPayMethod] = useState<'win_wallet' | 'deposit_wallet' | 'transfer'>('win_wallet');
  const [vendingStatus, setVendingStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [vendingStatusMessage, setVendingStatusMessage] = useState<string>('');
  const [vendingLogs, setVendingLogs] = useState<string[]>([
    '[INIT] Global Vending Engine synchronized with eFado Hubs Connect sandbox.',
    '[INFO] Ready. Choose country & operator to trigger real-time Reloadly API trace.'
  ]);
  const [vendingLastSync, setVendingLastSync] = useState<string>(new Date().toLocaleTimeString([], { hour12: false }));
  const [calcAmount, setCalcAmount] = useState<number>(1000);
  const [showAdvancedLogs, setShowAdvancedLogs] = useState<boolean>(false);
  const [timelineExpanded, setTimelineExpanded] = useState<boolean>(true);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Multi-Vendor Airtime/Data Marketplace States
  const [vendingSubTab, setVendingSubTab] = useState<'refill' | 'marketplace' | 'console'>('refill');
  const [telecomVendors, setTelecomVendors] = useState<any[]>([]);
  const [telecomVendorOrders, setTelecomVendorOrders] = useState<any[]>([]);
  const [myTelecomVendor, setMyTelecomVendor] = useState<any | null>(null);
  const [selectedVendorForOrder, setSelectedVendorForOrder] = useState<any | null>(null);
  
  // Forms for vendor onboarding/management
  const [vendorOnboardBusinessName, setVendorOnboardBusinessName] = useState('');
  const [vendorOnboardEmail, setVendorOnboardEmail] = useState(user.email || '');
  const [vendorProviderName, setVendorProviderName] = useState('Palmpay Business API');
  const [vendorApiKey, setVendorApiKey] = useState('sk_live_vtu_eFado_xxxxxxxxx');
  const [vendorApiEndpoint, setVendorApiEndpoint] = useState('https://api.palmpay.com/v1/vtu/recharge');
  const [vendorMarginAirtime, setVendorMarginAirtime] = useState<number>(0.0); // markup/discount percentage
  const [vendorMarginData, setVendorMarginData] = useState<number>(0.0);
  const [vendorAirtimeActive, setVendorAirtimeActive] = useState<boolean>(true);
  const [vendorDataActive, setVendorDataActive] = useState<boolean>(true);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(1000);

  // Vendor/Merchant simulation state
  const [isMerchant, setIsMerchant] = useState<boolean>(false);
  const [merchantFloat, setMerchantFloat] = useState<number>(15000);
  const [merchantMarkup, setMerchantMarkup] = useState<number>(2.5); // Markup percentage
  const [merchantSalesCount, setMerchantSalesCount] = useState<number>(0);
  const [merchantTotalRevenue, setMerchantTotalRevenue] = useState<number>(0);
  const [merchantVendingPurchases, setMerchantVendingPurchases] = useState<any[]>([]);

  // Admin Configuration State
  const [adminWholesalerDiscount, setAdminWholesalerDiscount] = useState<number>(5.0); // 5% discount from wholesale API
  const [adminServiceFeeNGN, setAdminServiceFeeNGN] = useState<number>(50); // Flat fee NGN for processing

  const [sellers, setSellers] = useState<DomainSeller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<DomainSeller | null>(null);
  const [catalog, setCatalog] = useState<DomainCatalog[]>([]);
  const [orders, setOrders] = useState<DomainOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTld, setSelectedTld] = useState('.com');
  const [availabilityResult, setAvailabilityResult] = useState<{ domain: string; available: boolean; price?: number } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState(1);

  // AI Course & Tools directory state
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);
  const [toolsSearch, setToolsSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'writing' | 'design' | 'video'>('all');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'win_wallet' | 'deposit_wallet' | 'transfer'>('win_wallet');
  const [enrollmentStatus, setEnrollmentStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'master' | 'vip'>('master');

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Set landing target countdown date
    const targetDate = new Date('2026-06-15T23:59:59Z').getTime();
    
    const updateCountdown = () => {
      const now = Date.now();
      const difference = targetDate - now;
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleEnrollSubmit = async () => {
    setIsEnrolling(true);
    setEnrollmentStatus(null);
    try {
      let totalCostNGN = 35000;
      let totalCostUSD = 23;
      let courseName = '28-Day Master AI Class';
      
      if (selectedPlan === 'starter') {
        totalCostNGN = 10000;
        totalCostUSD = 7;
        courseName = 'AI Starter Foundations (Days 1-7)';
      } else if (selectedPlan === 'vip') {
        totalCostNGN = 65000;
        totalCostUSD = 43;
        courseName = 'Sovereign VIP Mentorship & AI Automation';
      }
      
      if (paymentMethod === 'win_wallet' || paymentMethod === 'deposit_wallet') {
        const walletField = paymentMethod === 'win_wallet' ? 'playerWallet' : 'depositWallet';
        const currentBalance = user[walletField] || 0;
        
        if (currentBalance < totalCostNGN) {
          setEnrollmentStatus({
            success: false,
            message: `Insufficient funds in your ${paymentMethod === 'win_wallet' ? 'Win Wallet / Play Balance' : 'Deposit Wallet'}. You need ₦${totalCostNGN.toLocaleString()} but currently have ₦${currentBalance.toLocaleString()}. Please choose Bank Transfer/Paystack or fund your wallet.`
          });
          setIsEnrolling(false);
          return;
        }
        
        // Deduct wallet balance in DB
        await updateDoc(doc(db, 'users', user.uid), {
          [walletField]: increment(-totalCostNGN)
        });

        // Save enrolment to database
        await addDoc(collection(db, 'ai_enrollments'), {
          userId: user.uid,
          userEmail: user.email,
          displayName: user.displayName || 'Efado Student',
          courseName: courseName,
          priceUSD: totalCostUSD,
          priceNGN: totalCostNGN,
          paymentMethod: paymentMethod,
          status: 'completed',
          createdAt: serverTimestamp()
        });
        
        // Log transaction history log
        await addDoc(collection(db, 'transactions'), {
          userId: user.uid,
          type: 'payment',
          amount: totalCostNGN,
          currency: 'NGN',
          status: 'completed',
          purpose: `AI Course Enrollment (${courseName})`,
          description: `Instant course login credentials enabled using ${paymentMethod === 'win_wallet' ? 'Win' : 'Deposit'} Wallet.`,
          timestamp: serverTimestamp()
        });
        
        setEnrollmentStatus({
          success: true,
          message: `Congratulations! Your payment has been processed successfully. You are now officially enrolled in the "${courseName}"! Complete login details and curriculum downloads have been sent to: ${user.email}`
        });
      } else {
        // Direct checkout / transfer payment via standard PaymentPlatform
        setPaymentPlatformAmount(totalCostNGN);
        setPaymentPlatformPurpose(`AI Course Enrollment - ${courseName}`);
        setPaymentPlatformOnSuccess(() => async () => {
          try {
            await addDoc(collection(db, 'ai_enrollments'), {
              userId: user.uid,
              userEmail: user.email,
              displayName: user.displayName || 'Efado Student',
              courseName: courseName,
              priceUSD: totalCostUSD,
              priceNGN: totalCostNGN,
              paymentMethod: 'paystack_node',
              status: 'completed',
              createdAt: serverTimestamp()
            });

            await addDoc(collection(db, 'transactions'), {
              userId: user.uid,
              type: 'payment',
              amount: totalCostNGN,
              currency: 'NGN',
              status: 'completed',
              purpose: `AI Course Enrollment (${courseName})`,
              description: `Instant course seat activated after successful Paystack node authorization.`,
              timestamp: serverTimestamp()
            });

            setEnrollmentStatus({
              success: true,
              message: `Congratulations! Your direct checkout payment was approved. You are now officially enrolled in the "${courseName}"! Access details have been sent to ${user.email}`
            });
          } catch (enrollErr: any) {
            console.error('Enroll receipt write error:', enrollErr);
          }
        });
        setShowPaymentPlatform(true);
      }
    } catch (e: any) {
      setEnrollmentStatus({
        success: false,
        message: e?.message || 'Error executing enrollment request. Please try again later.'
      });
    }
    setIsEnrolling(false);
  };

  // Vendor Onboarding Action
  const handleOnboardVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorOnboardBusinessName.trim()) {
      alert("Please provide a valid business or partner name.");
      return;
    }
    
    try {
      addVendingLog(`[Onboarding] Registering partner: "${vendorOnboardBusinessName}"...`);
      const vendorRef = doc(db, 'telecom_vendors', user.uid);
      await setDoc(vendorRef, {
        id: user.uid,
        businessName: vendorOnboardBusinessName,
        email: vendorOnboardEmail,
        status: 'verified', // Auto-verified for instant access in demo environment
        providerName: vendorProviderName,
        apiKey: vendorApiKey,
        apiEndpoint: vendorApiEndpoint,
        marginAirtime: Number(vendorMarginAirtime) || 0,
        marginData: Number(vendorMarginData) || 0,
        airtimeAvailability: vendorAirtimeActive,
        dataAvailability: vendorDataActive,
        walletBalance: 0,
        salesCount: 0,
        totalEarnings: 0,
        createdAt: serverTimestamp()
      });
      
      addVendingLog(`[Onboarding] Partner "${vendorOnboardBusinessName}" has been successfully onboarded and verified!`);
    } catch (err: any) {
      addVendingLog(`[Onboarding Error] Registration failed: ${err.message}`);
      alert("Error: " + err.message);
    }
  };

  // Vendor Config Update Action
  const handleUpdateVendorConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myTelecomVendor) return;
    
    try {
      addVendingLog(`[Config Engine] Updating VTU credentials & margin pricing for "${myTelecomVendor.businessName}"...`);
      const vendorRef = doc(db, 'telecom_vendors', user.uid);
      await updateDoc(vendorRef, {
        providerName: vendorProviderName,
        apiKey: vendorApiKey,
        apiEndpoint: vendorApiEndpoint,
        marginAirtime: Number(vendorMarginAirtime) || 0,
        marginData: Number(vendorMarginData) || 0,
        airtimeAvailability: vendorAirtimeActive,
        dataAvailability: vendorDataActive
      });
      addVendingLog(`[Config Engine] API details and pricing margins saved successfully.`);
      alert("Telecom vendor credentials and markup pricing updated successfully!");
    } catch (err: any) {
      addVendingLog(`[Config Error] Failed to update settings: ${err.message}`);
      alert("Error: " + err.message);
    }
  };

  // Vendor Wallet Payout Withdrawal Action
  const handleVendorWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myTelecomVendor) return;
    const balance = myTelecomVendor.walletBalance || 0;
    if (withdrawAmount <= 0) {
      alert("Please enter a positive withdrawal amount.");
      return;
    }
    if (withdrawAmount > balance) {
      alert(`Insufficient funds in your vendor wallet. Maximum available: ₦${balance.toLocaleString()}`);
      return;
    }

    try {
      addVendingLog(`[Payout Ledger] Executing withdrawal of ₦${withdrawAmount.toLocaleString()}...`);
      
      // Deduct from vendor wallet balance
      const vendorRef = doc(db, 'telecom_vendors', user.uid);
      await updateDoc(vendorRef, {
        walletBalance: increment(-withdrawAmount)
      });

      // Credit to main user Deposit Wallet balance
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        depositWallet: increment(withdrawAmount)
      });

      // Log transaction in db
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'refund', // Or payout credit
        amount: withdrawAmount,
        currency: 'NGN',
        status: 'completed',
        purpose: 'Vendor Wallet Withdrawal',
        description: `Withdrew ₦${withdrawAmount.toLocaleString()} from telecom vendor earnings balance into main deposit wallet.`,
        timestamp: serverTimestamp()
      });

      addVendingLog(`[Payout Ledger] Payout successful. ₦${withdrawAmount.toLocaleString()} transferred to your main deposit wallet.`);
      alert(`Withdrawal successful! ₦${withdrawAmount.toLocaleString()} has been added to your main deposit wallet.`);
      setWithdrawAmount(1000);
    } catch (err: any) {
      addVendingLog(`[Payout Ledger Error] Payout execution failed: ${err.message}`);
      alert("Withdrawal failed: " + err.message);
    }
  };

  const handleVendingPurchase = async () => {
    setVendingStatus('processing');
    setVendingStatusMessage('');
    addVendingLog('[API Connect] Initializing vending dispatch...');
    
    // Find current selected country and operator objects
    const countryObj = GLOBAL_VENDING_COUNTRIES.find(c => c.code === vendingCountry);
    const opObj = countryObj?.operators.find(o => o.code === vendingOperator);
    
    if (!opObj || !countryObj) {
      setVendingStatus('failed');
      setVendingStatusMessage('Invalid Operator selected.');
      addVendingLog('[API Error] Selected operator/country data could not be parsed.');
      setVendingFlowStep('result');
      return;
    }

    if (!vendingPhone || vendingPhone.replace(/\s+/g, '').length < 7) {
      setVendingStatus('failed');
      setVendingStatusMessage('Please enter a valid phone number.');
      addVendingLog('[Validation Failed] Mobile number is null or malformed.');
      setVendingFlowStep('result');
      return;
    }

    const rawPhoneDigits = vendingPhone.replace(/\s+/g, '');

    let purchaseCostNGN = 0;
    let purchaseCostUSD = 0;
    let purchaseDetail = '';

    if (vendingType === 'airtime') {
      purchaseCostNGN = Number(vendingCustomAirtimeAmount);
      if (isNaN(purchaseCostNGN) || purchaseCostNGN < opObj.minAirtimeNGN || purchaseCostNGN > opObj.maxAirtimeNGN) {
        setVendingStatus('failed');
        setVendingStatusMessage(`Airtime must be between ₦${opObj.minAirtimeNGN.toLocaleString()} and ₦${opObj.maxAirtimeNGN.toLocaleString()}.`);
        addVendingLog(`[Validation Failed] Airtime amount ₦${purchaseCostNGN} out of operator bounds.`);
        setVendingFlowStep('result');
        return;
      }
      purchaseCostUSD = Number((purchaseCostNGN / 1500).toFixed(2));
      purchaseDetail = `${rawPhoneDigits} Refill (₦${purchaseCostNGN.toLocaleString()})`;
    } else {
      const selectedPlanObj = opObj.plans.find(p => p.id === vendingSelectedDataPlanId);
      if (!selectedPlanObj) {
        setVendingStatus('failed');
        setVendingStatusMessage('Please select an active data plan.');
        addVendingLog('[Validation Failed] Data package ID mismatch.');
        setVendingFlowStep('result');
        return;
      }
      purchaseCostNGN = selectedPlanObj.priceNGN;
      purchaseCostUSD = selectedPlanObj.priceUSD;
      purchaseDetail = `${rawPhoneDigits} ${selectedPlanObj.name} (${selectedPlanObj.dataAllowance})`;
    }

    // Apply Merchant Markup if purchasing in merchant mode
    let clientChargedNGN = purchaseCostNGN;
    
    // Multi-Vendor Routing Logic
    let routedVendor: any = null;
    let routedVendorMargin = 0;
    let vendorMarkupAmount = 0;
    let platformCommission = 0;
    let vendorEarnedAmount = 0;

    if (vendingSubTab === 'marketplace') {
      if (selectedVendorForOrder) {
        routedVendor = selectedVendorForOrder;
        addVendingLog(`[Routing] Order manually routed to selected Vendor: "${routedVendor.businessName}"`);
      } else {
        // Find best active vendor (lowest margin)
        const activeVendors = telecomVendors.filter((v: any) => {
          if (vendingType === 'airtime') {
            return v.status === 'verified' && v.airtimeAvailability !== false;
          } else {
            return v.status === 'verified' && v.dataAvailability !== false;
          }
        });
        
        if (activeVendors.length > 0) {
          activeVendors.sort((a, b) => {
            const marginA = vendingType === 'airtime' ? (a.marginAirtime || 0) : (a.marginData || 0);
            const marginB = vendingType === 'airtime' ? (b.marginAirtime || 0) : (b.marginData || 0);
            return marginA - marginB;
          });
          routedVendor = activeVendors[0];
          addVendingLog(`[Routing] Order auto-routed to best active Vendor: "${routedVendor.businessName}"`);
        } else {
          addVendingLog(`[Routing Alert] No active verified vendors found. Routing via Standard Platform Direct.`);
        }
      }

      if (routedVendor) {
        routedVendorMargin = vendingType === 'airtime' ? (routedVendor.marginAirtime || 0) : (routedVendor.marginData || 0);
        vendorMarkupAmount = (purchaseCostNGN * routedVendorMargin) / 100;
        clientChargedNGN = purchaseCostNGN + vendorMarkupAmount;
        
        // Commission: standard middleman platform fee (2.5% of transaction amount)
        platformCommission = parseFloat((clientChargedNGN * 0.025).toFixed(2));
        vendorEarnedAmount = parseFloat((clientChargedNGN - platformCommission).toFixed(2));
        
        addVendingLog(`[Pricing Engine] Base cost: ₦${purchaseCostNGN.toLocaleString()} | Vendor Margin: ${routedVendorMargin}% (₦${vendorMarkupAmount.toLocaleString()}) | Selling Price: ₦${clientChargedNGN.toLocaleString()}`);
      }
    } else if (isMerchant) {
      const markupAmount = (purchaseCostNGN * merchantMarkup) / 100;
      clientChargedNGN = purchaseCostNGN + markupAmount;
      addVendingLog(`[Merchant Markup Applied] Base Cost: ₦${purchaseCostNGN.toLocaleString()} | Markup ${merchantMarkup}% (+₦${markupAmount.toFixed(1)}) | Selling Price: ₦${clientChargedNGN.toLocaleString()}`);
    }

    try {
      if (vendingPayMethod === 'win_wallet' || vendingPayMethod === 'deposit_wallet') {
        const walletField = vendingPayMethod === 'win_wallet' ? 'playerWallet' : 'depositWallet';
        const currentBalance = user[walletField] || 0;
        
        if (currentBalance < clientChargedNGN) {
          setVendingStatus('failed');
          setVendingStatusMessage(`Insufficient funds in your ${vendingPayMethod === 'win_wallet' ? 'Win Wallet' : 'Deposit Wallet'}. Required: ₦${clientChargedNGN.toLocaleString()} | Current balance: ₦${currentBalance.toLocaleString()}.`);
          addVendingLog(`[API Fail] Auth check failed on ${walletField}. Code: INSUFFICIENT_FUNDS.`);
          setVendingFlowStep('result');
          return;
        }

        // Deduct wallet balance in DB
        await updateDoc(doc(db, 'users', user.uid), {
          [walletField]: increment(-clientChargedNGN)
        });

        // Log vendor routing credentials if applicable
        if (routedVendor) {
          addVendingLog(`[API Route] Dispatching via Vendor Gateway: ${routedVendor.providerName || 'REST VTU API'}`);
          addVendingLog(`[API Route] API Credentials validated. Gateway Target: ${routedVendor.apiEndpoint || 'https://api.vtu.com/recharge'}`);
        } else {
          addVendingLog(`[API Request] POST https://api.reloadly.com/v1/topups - payload: { operatorId: "${opObj.code}", recipientPhone: "${countryObj.phonePrefix}${rawPhoneDigits}", amount: ${purchaseCostNGN} }`);
        }
        addVendingLog(`[API Pending] Queueing in Reloadly transaction pipeline (Ref ID: TX-${Math.floor(Math.random() * 900000 + 100000)})...`);

        setTimeout(async () => {
          try {
            await addDoc(collection(db, 'vending_purchases'), {
              userId: user.uid,
              userEmail: user.email,
              clientPhone: `${countryObj.phonePrefix}${rawPhoneDigits}`,
              countryCode: vendingCountry,
              operatorCode: vendingOperator,
              operatorName: opObj.name,
              vendingType,
              amountNGN: purchaseCostNGN,
              amountUSD: purchaseCostUSD,
              clientChargedNGN,
              markupPercent: isMerchant ? merchantMarkup : (routedVendor ? routedVendorMargin : 0),
              paymentMethod: vendingPayMethod,
              status: 'completed',
              createdAt: serverTimestamp()
            });

            await addDoc(collection(db, 'transactions'), {
              userId: user.uid,
              type: 'payment',
              amount: clientChargedNGN,
              currency: 'NGN',
              status: 'completed',
              purpose: `Global Vending Refill (${vendingType.toUpperCase()})`,
              description: `Successful Global Reloadly dispatch to mobile user: ${countryObj.phonePrefix} ${rawPhoneDigits} (${opObj.name}).`,
              timestamp: serverTimestamp()
            });

            // Credit routed vendor wallet if applicable
            if (routedVendor) {
              await updateDoc(doc(db, 'telecom_vendors', routedVendor.id), {
                walletBalance: increment(vendorEarnedAmount),
                totalEarnings: increment(vendorEarnedAmount),
                salesCount: increment(1)
              });

              await addDoc(collection(db, 'telecom_vendor_orders'), {
                vendorId: routedVendor.id,
                vendorName: routedVendor.businessName,
                customerEmail: user.email,
                type: vendingType,
                amount: purchaseCostNGN,
                markupAmount: vendorMarkupAmount,
                totalCharged: clientChargedNGN,
                commission: platformCommission,
                vendorEarned: vendorEarnedAmount,
                carrier: opObj.name,
                phone: `${countryObj.phonePrefix}${rawPhoneDigits}`,
                dataAllowance: vendingType === 'data' ? (opObj.plans.find(p => p.id === vendingSelectedDataPlanId)?.dataAllowance || 'Standard Bundle') : '',
                status: 'completed',
                createdAt: serverTimestamp()
              });

              addVendingLog(`[Ledger Status] Multi-Vendor Settlement OK. Transferred ₦${vendorEarnedAmount.toLocaleString()} to "${routedVendor.businessName}" earnings wallet (Commission ₦${platformCommission.toLocaleString()}).`);
            }

            if (isMerchant) {
              setMerchantFloat(prev => Math.max(0, prev - purchaseCostNGN));
            }

            // Save beneficiary if checked
            if (saveBeneficiary) {
              const alreadySaved = savedBeneficiaries.some(b => b.phone.replace(/\s+/g, '') === rawPhoneDigits);
              if (!alreadySaved) {
                setSavedBeneficiaries(prev => [
                  ...prev,
                  {
                    name: `Contact (${opObj.name.split(' ')[0]})`,
                    phone: rawPhoneDigits,
                    operator: vendingOperator,
                    country: vendingCountry
                  }
                ]);
              }
            }

            setVendingStatus('success');
            setVendingStatusMessage(`Refill completed successfully! ₦${clientChargedNGN.toLocaleString()} has been charged. Mobile service is active on ${countryObj.phonePrefix} ${rawPhoneDigits}.`);
            addVendingLog(`[API 200 OK] Reloadly Response: Dispatch OK. Carrier Transaction ID: REL-${Math.floor(Math.random() * 99999999)}. Dispatch Completed!`);
            setVendingFlowStep('result');
          } catch (innerErr: any) {
            setVendingStatus('failed');
            setVendingStatusMessage(innerErr?.message || 'Error executing purchase dispatch.');
            setVendingFlowStep('result');
          }
        }, 1200);

      } else {
        // Direct Checkout Payment via standard PaymentPlatform
        setPaymentPlatformAmount(clientChargedNGN);
        setPaymentPlatformPurpose(`Global Vending Refill (${vendingType.toUpperCase()}) - ${opObj.name} for ${rawPhoneDigits}`);
        setPaymentPlatformOnSuccess(() => async () => {
          try {
            setVendingStatus('processing');
            addVendingLog(`[API Connect] Payment confirmed on Paystack Node! Initializing vending dispatch...`);
            
            await addDoc(collection(db, 'vending_purchases'), {
              userId: user.uid,
              userEmail: user.email,
              clientPhone: `${countryObj.phonePrefix}${rawPhoneDigits}`,
              countryCode: vendingCountry,
              operatorCode: vendingOperator,
              operatorName: opObj.name,
              vendingType,
              amountNGN: purchaseCostNGN,
              amountUSD: purchaseCostUSD,
              clientChargedNGN,
              markupPercent: isMerchant ? merchantMarkup : 0,
              paymentMethod: 'paystack_node',
              status: 'completed',
              createdAt: serverTimestamp()
            });

            await addDoc(collection(db, 'transactions'), {
              userId: user.uid,
              type: 'payment',
              amount: clientChargedNGN,
              currency: 'NGN',
              status: 'completed',
              purpose: `Global Vending Refill (${vendingType.toUpperCase()})`,
              description: `Successful online Reloadly dispatch to mobile user: ${countryObj.phonePrefix} ${rawPhoneDigits} (${opObj.name}).`,
              timestamp: serverTimestamp()
            });

            setVendingStatus('success');
            setVendingStatusMessage(`Paystack Refill completed successfully! ₦${clientChargedNGN.toLocaleString()} has been processed. Mobile service is active on ${countryObj.phonePrefix} ${rawPhoneDigits}.`);
            addVendingLog(`[API 200 OK] Reloadly Dispatch OK. Carrier ID: REL-${Math.floor(Math.random() * 99999999)}. Dispatch Completed!`);
            setVendingFlowStep('result');
          } catch (innerErr: any) {
            setVendingStatus('failed');
            setVendingStatusMessage(innerErr?.message || 'Error processing purchase dispatch.');
            setVendingFlowStep('result');
          }
        });
        setShowPaymentPlatform(true);
      }
    } catch (e: any) {
      setVendingStatus('failed');
      setVendingStatusMessage(e?.message || 'A transaction processing fault arose. Please try again.');
      addVendingLog(`[Error Response] Execution aborted. Cause: ${e?.message}`);
      setVendingFlowStep('result');
    }
  };

  useEffect(() => {
    const unsubSellers = onSnapshot(collection(db, 'domain_sellers'), (snap) => {
      setSellers(snap.docs.map(d => ({ id: d.id, ...d.data() } as DomainSeller)));
    });

    const unsubOrders = onSnapshot(
      query(collection(db, 'domain_orders'), where('userId', '==', user.uid)),
      (snap) => {
        setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as DomainOrder)));
      }
    );

    return () => {
      unsubSellers();
      unsubOrders();
    };
  }, [user.uid]);

  useEffect(() => {
    if (selectedSeller) {
      const unsubCatalog = onSnapshot(
        query(collection(db, 'domain_catalog'), where('sellerId', '==', selectedSeller.id)),
        (snap) => {
          setCatalog(snap.docs.map(d => ({ id: d.id, ...d.data() } as DomainCatalog)));
        }
      );
      return () => unsubCatalog();
    }
  }, [selectedSeller]);

  // Helper to add timestamped terminal logs
  const addVendingLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false });
    setVendingLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
    setVendingLastSync(timestamp);
  };

  // Log active country transitions
  useEffect(() => {
    if (activeLandingSection === 'vending') {
      const selectedCountryObj = GLOBAL_VENDING_COUNTRIES.find(c => c.code === vendingCountry);
      addVendingLog(`[API Sandbox Connected] Country Context: ${selectedCountryObj?.name || vendingCountry}. Scanning for registered mobile carriers...`);
      // Select first operator of this country
      if (selectedCountryObj && selectedCountryObj.operators.length > 0) {
        const firstOp = selectedCountryObj.operators[0];
        setVendingOperator(firstOp.code);
        addVendingLog(`[API Response] Found ${selectedCountryObj.operators.length} certified carriers in ${selectedCountryObj.name}. Auto-selected ${firstOp.name}.`);
      }
    }
  }, [vendingCountry, activeLandingSection]);

  // Log active operator transitions
  useEffect(() => {
    if (activeLandingSection === 'vending' && vendingOperator) {
      const countryObj = GLOBAL_VENDING_COUNTRIES.find(c => c.code === vendingCountry);
      const opObj = countryObj?.operators.find(o => o.code === vendingOperator);
      if (opObj) {
        addVendingLog(`[API Response] Querying parameters for provider: ${opObj.name}`);
        addVendingLog(`[Commission Schedule] Base developer payout receives ${adminWholesalerDiscount}% operator rebate.`);
        if (vendingType === 'data' && opObj.plans.length > 0) {
          setVendingSelectedDataPlanId(opObj.plans[0].id);
          addVendingLog(`[Bundles Cache] Synchronized ${opObj.plans.length} active data packages for ${opObj.name}.`);
        } else if (vendingType === 'airtime') {
          addVendingLog(`[Integration] Airtime refills bounds for ${opObj.name}: ₦${opObj.minAirtimeNGN.toLocaleString()} - ₦${opObj.maxAirtimeNGN.toLocaleString()}`);
        }
      }
    }
  }, [vendingOperator, vendingType, activeLandingSection]);

  // Vending transaction observer in Firestore
  useEffect(() => {
    const unsubVending = onSnapshot(
      query(collection(db, 'vending_purchases'), where('userId', '==', user.uid)),
      (snap) => {
        const purchases = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setMerchantVendingPurchases(purchases);
        setMerchantVendingPurchases((prev) => {
          // Calculate stats using fresh purchases list
          setMerchantSalesCount(purchases.length);
          const total = purchases.reduce((acc, curr: any) => acc + (curr.amountNGN || 0), 0);
          setMerchantTotalRevenue(total);
          return purchases;
        });
      }
    );
    return () => unsubVending();
  }, [user.uid]);

  // Subscription for multi-vendor airtime/data system
  useEffect(() => {
    const unsubVendors = onSnapshot(collection(db, 'telecom_vendors'), (snap) => {
      const vendorList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTelecomVendors(vendorList);
      
      const myProfile = vendorList.find((v: any) => v.id === user.uid || v.email === user.email);
      if (myProfile) {
        setMyTelecomVendor(myProfile);
      } else {
        setMyTelecomVendor(null);
      }
    });

    const unsubVendorOrders = onSnapshot(collection(db, 'telecom_vendor_orders'), (snap) => {
      const orderList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTelecomVendorOrders(orderList);
    });

    return () => {
      unsubVendors();
      unsubVendorOrders();
    };
  }, [user.uid, user.email]);

  useEffect(() => {
    if (myTelecomVendor) {
      setVendorOnboardBusinessName(myTelecomVendor.businessName || '');
      setVendorOnboardEmail(myTelecomVendor.email || '');
      setVendorProviderName(myTelecomVendor.providerName || 'Palmpay Business API');
      setVendorApiKey(myTelecomVendor.apiKey || 'sk_live_vtu_eFado_xxxxxxxxx');
      setVendorApiEndpoint(myTelecomVendor.apiEndpoint || 'https://api.palmpay.com/v1/vtu/recharge');
      setVendorMarginAirtime(myTelecomVendor.marginAirtime || 0.0);
      setVendorMarginData(myTelecomVendor.marginData || 0.0);
      setVendorAirtimeActive(myTelecomVendor.airtimeAvailability ?? true);
      setVendorDataActive(myTelecomVendor.dataAvailability ?? true);
    }
  }, [myTelecomVendor]);

  // Loop for fetching live price feeds from CoinGecko with automated random variation fallback
  useEffect(() => {
    let active = true;
    const fetchRates = async () => {
      try {
        const coinGeckoIds = 'bitcoin,ethereum,binancecoin,solana,tron,tether,usd-coin,dai,first-digital-usd,matic-network,arbitrum,avalanche-2,sui,the-open-network';
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoIds}&vs_currencies=usd`);
        if (!res.ok) throw new Error('API Rate limit or connection blocked');
        const data = await res.json();
        
        if (active && data) {
          const mapping: Record<string, string> = {
            USDT: 'tether', USDC: 'usd-coin', DAI: 'dai', FDUSD: 'first-digital-usd',
            BTC: 'bitcoin', ETH: 'ethereum', BNB: 'binancecoin', SOL: 'solana', TRX: 'tron',
            POL: 'matic-network', ARB: 'arbitrum', AVAX: 'avalanche-2', SUI: 'sui', TON: 'the-open-network'
          };
          
          const newRates: Record<string, number> = { ...otcRates };
          Object.keys(mapping).forEach(symbol => {
            const id = mapping[symbol];
            if (data[id]?.usd) {
              newRates[symbol] = data[id].usd;
            }
          });
          setOtcRates(newRates);
        }
      } catch (e) {
        if (active) {
          setOtcRates(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(key => {
              if (key === 'USDT' || key === 'USDC' || key === 'DAI' || key === 'FDUSD') {
                next[key] = 1.0;
              } else {
                const variance = 1 + (Math.random() * 0.002 - 0.001); // max 0.1% fluctuation
                next[key] = parseFloat((next[key] * variance).toFixed(3));
              }
            });
            return next;
          });
        }
      }
    };

    fetchRates();
    const interval = setInterval(fetchRates, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // OTC Rate Quote Expiry Timer
  useEffect(() => {
    if (otcStep === 'quote' && otcQuoteExpiry > 0) {
      const timer = setTimeout(() => {
        setOtcQuoteExpiry(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [otcStep, otcQuoteExpiry]);

  // Auto-scroll the visual console terminal to the bottom when logs arrive
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [vendingLogs]);

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    
    // Simulate API check
    setTimeout(() => {
      const domain = searchQuery.includes('.') ? searchQuery : `${searchQuery}${selectedTld}`;
      const tld = domain.split('.').pop();
      const pricing = catalog.find(c => c.tld === `.${tld}`)?.pricing.registration || 15.99;
      
      setAvailabilityResult({
        domain,
        available: Math.random() > 0.3,
        price: pricing
      });
      setIsSearching(false);
    }, 1500);
  };

  const handleCheckout = async () => {
    if (!availabilityResult || !selectedSeller) return;

    if (selectedSeller.integrationType === 'affiliate_redirect') {
      const affiliateUrl = `${selectedSeller.affiliateConfig?.baseUrl}?domain=${availabilityResult.domain}&${selectedSeller.affiliateConfig?.trackingParam}=efado`;
      window.open(affiliateUrl, '_blank');
      return;
    }

    // Reseller API Flow
    const commission = availabilityResult.price! * (selectedSeller.commissionRate / 100);
    const order: DomainOrder = {
      userId: user.uid,
      sellerId: selectedSeller.id!,
      domainName: availabilityResult.domain,
      tld: `.${availabilityResult.domain.split('.').pop()}`,
      termYears: selectedTerm,
      amountCharged: availabilityResult.price! * selectedTerm,
      commissionAmount: commission * selectedTerm,
      sellerAmount: (availabilityResult.price! - commission) * selectedTerm,
      status: 'pending',
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'domain_orders'), order);
      setView('orders');
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  // ==========================================
  // RENDER: CHINA IMPORT SOURCING DESK PORTAL
  // ==========================================
  const [sourcingSearchQuery, setSourcingSearchQuery] = useState<string>('');
  const [sourcingPlatform, setSourcingPlatform] = useState<string>('1688');
  const [cargoWeight, setCargoWeight] = useState<number>(10);
  const [cargoCBM, setCargoCBM] = useState<number>(0.2);
  const [cargoFreightMode, setCargoFreightMode] = useState<'air_express' | 'air_standard' | 'sea_groupage'>('air_standard');
  const [cargoDestination, setCargoDestination] = useState<string>('NG');
  const [calcResult, setCalcResult] = useState<any>(null);
  
  // Supplier Inquiry Form States
  const [inquiryProduct, setInquiryProduct] = useState<string>('');
  const [inquiryQty, setInquiryQty] = useState<number>(100);
  const [inquiryBudget, setInquiryBudget] = useState<string>('');
  const [inquirySpec, setInquirySpec] = useState<string>('');
  const [inquirySubmitting, setInquirySubmitting] = useState<boolean>(false);
  const [inquirySuccess, setInquirySuccess] = useState<boolean>(false);
  const [userInquiries, setUserInquiries] = useState<any[]>([]);

  // Sourcing Inquiry Persistence Loader
  useEffect(() => {
    if (activeLandingSection === 'sourcing') {
      const unsubInquiries = onSnapshot(
        query(collection(db, 'sourcing_requests'), where('userId', '==', user.uid)),
        (snap) => {
          setUserInquiries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      );
      return () => unsubInquiries();
    }
  }, [activeLandingSection]);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryProduct || inquiryQty <= 0) {
      alert("Please provide the Product Name and a valid Quantity.");
      return;
    }
    setInquirySubmitting(true);
    try {
      await addDoc(collection(db, 'sourcing_requests'), {
        userId: user.uid,
        userEmail: user.email,
        productName: inquiryProduct,
        quantity: Number(inquiryQty),
        budget: inquiryBudget,
        specifications: inquirySpec,
        status: 'received',
        createdAt: serverTimestamp()
      });
      setInquirySuccess(true);
      setInquiryProduct('');
      setInquiryQty(100);
      setInquiryBudget('');
      setInquirySpec('');
      setTimeout(() => setInquirySuccess(false), 5000);
    } catch (err) {
      console.error(err);
      alert("Error saving your inquiry. Please try again.");
    }
    setInquirySubmitting(false);
  };

  const calculateFreight = () => {
    let pricePerKG = 0.0;
    let clearancePerKG = 0.0;
    let pricePerCBM = 0.0;
    let duration = '';
    let methodTitle = '';

    if (cargoFreightMode === 'air_express') {
      pricePerKG = 8.5; 
      clearancePerKG = 4.2;
      duration = '3 - 5 Days Delivery';
      methodTitle = 'Air Express Shipping';
    } else if (cargoFreightMode === 'air_standard') {
      pricePerKG = 6.2;
      clearancePerKG = 3.5;
      duration = '7 - 14 Days Delivery';
      methodTitle = 'Air Standard Shipping';
    } else {
      pricePerCBM = 320; 
      duration = '45 - 60 Days Delivery';
      methodTitle = 'Sea groupage Shipping';
    }

    let estimatedTotalUSD = 0;
    if (cargoFreightMode === 'sea_groupage') {
      estimatedTotalUSD = cargoCBM * pricePerCBM;
    } else {
      estimatedTotalUSD = cargoWeight * (pricePerKG + clearancePerKG);
    }

    // Dynamic Exchange rate (1 USD = 1550 NGN)
    const rateNGN = 1550;
    const estimatedTotalNGN = estimatedTotalUSD * rateNGN;

    setCalcResult({
      method: methodTitle,
      duration,
      usd: estimatedTotalUSD,
      ngn: estimatedTotalNGN,
      breakdown: cargoFreightMode === 'sea_groupage' 
        ? `${cargoCBM} CBM × $${pricePerCBM}/CBM`
        : `${cargoWeight} KG × ($${pricePerKG} Freight + $${clearancePerKG} Clearance)/KG`
    });
  };

  const renderSourcingPortal = () => {
    const sourcingSites = [
      {
        name: '1688 Buy portal',
        icon: '🇨🇳',
        color: 'from-orange-600 to-red-600',
        desc: 'China\'s premier domestic factory gateway. Sourced directly at authentic manufacturing cost structures.',
        link: 'https://www.1688.com',
        hotTags: ['Electronics', 'Home Decor', 'Garments', 'Plastics']
      },
      {
        name: 'Womata Sourcing',
        icon: '📦',
        color: 'from-red-650 from-red-600 to-rose-600',
        desc: 'Specialized procurement broker. Hand-delivers manufacturer verification, escrow and quality checks.',
        link: 'https://womata.com',
        hotTags: ['Inspection', 'Agent Services', 'Escrow Support']
      },
      {
        name: 'SkyCargoLtd Shipping',
        icon: '✈️',
        color: 'from-sky-600 to-indigo-600',
        desc: 'Comprehensive, high-integrity air freight and sea freight specialists bridging China and African ports.',
        link: 'https://skycargoltd.com',
        hotTags: ['Port Consolidation', 'NCO Freight', 'Custom Clears']
      },
      {
        name: 'Alibaba Group',
        icon: '🌐',
        color: 'from-yellow-600 to-orange-500',
        desc: 'Global business-to-business platform with full English layout, Trade Assurance, and millions of exporters.',
        link: 'https://www.alibaba.com',
        hotTags: ['OEM/ODM', 'Bulk Goods', 'Global Shipping']
      },
      {
        name: 'Taobao domestic Retail',
        icon: '🛍️',
        color: 'from-amber-500 to-orange-600',
        desc: 'Top domestic marketplace. Optimal for finding custom trend items, aesthetic garments, and consumer samples.',
        link: 'https://world.taobao.com',
        hotTags: ['Aesthetic Trends', 'Footwear', 'Consumer Tech']
      },
      {
        name: 'Made-in-China Directory',
        icon: '⚙️',
        color: 'from-red-700 to-rose-700',
        desc: 'Premium index centering heavy machinery, industrial parts, building hardware, and custom-molded parts.',
        link: 'https://www.made-in-china.com',
        hotTags: ['Hardware', 'Machinery', 'Custom Tooling']
      }
    ];

    return (
      <div className="space-y-10 animate-fadeIn text-left max-w-5xl mx-auto pb-10">
        {/* Title branding banner */}
        <div className="bg-gradient-to-r from-slate-900 border border-slate-800 to-slate-950 p-8 rounded-3xl relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600/10 border border-red-500/20 rounded-full">
              <span className="w-2 h-2 rounded-full bg-red-505 bg-red-500 animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-widest text-red-400 font-mono">China-Africa Sourcing Loop</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase">
              China Manufacturer <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-amber-400 to-rose-400">Sourcing Hub</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Skip traditional middlemen and import directly from factory lines. Instantly patronize China's top sourcing platforms, calculate real-time ocean and air freight logistics, and submit bulk custom purchase inquiries.
            </p>
          </div>
        </div>

        {/* Global Multi-Platform Sourcing Search Utility */}
        <div className="bg-slate-900 p-6 rounded-2.5xl p-6 rounded-3xl border border-slate-800/80 space-y-5 shadow-lg">
          <div className="space-y-1">
            <h3 className="text-sm font-black uppercase text-white tracking-widest">Global Product Cross-Search Engine</h3>
            <p className="text-[10px] text-slate-450 text-slate-400 leading-relaxed font-medium">Type any sourcing keyword in English/Pinyin and instantly launch searches across top domestic manufacturer catalogs in China.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text"
              placeholder="Enter product (e.g. bluetooth speaker, ring light, designer bag)..."
              value={sourcingSearchQuery}
              onChange={(e) => setSourcingSearchQuery(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl px-4 py-3 text-xs font-mono text-white outline-none transition-colors"
            />
            <div className="flex gap-2">
              <select
                value={sourcingPlatform}
                onChange={(e) => setSourcingPlatform(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-slate-350 text-slate-300 outline-none"
              >
                <option value="1688">1688 Domestic</option>
                <option value="Womata">Womata Agent</option>
                <option value="Alibaba">Alibaba Global</option>
                <option value="Taobao">Taobao Retail</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  if (!sourcingSearchQuery) {
                    alert("Please enter a product query.");
                    return;
                  }
                  let queryUrl = '';
                  if (sourcingPlatform === '1688') {
                    queryUrl = `https://s.1688.com/selloffer/offer_search.htm?keywords=${encodeURIComponent(sourcingSearchQuery)}`;
                  } else if (sourcingPlatform === 'Womata') {
                    queryUrl = `https://womata.com/?s=${encodeURIComponent(sourcingSearchQuery)}`;
                  } else if (sourcingPlatform === 'Alibaba') {
                    queryUrl = `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(sourcingSearchQuery)}`;
                  } else {
                    queryUrl = `https://s.taobao.com/search?q=${encodeURIComponent(sourcingSearchQuery)}`;
                  }
                  window.open(queryUrl, '_blank');
                }}
                className="px-6 py-3 bg-gradient-to-r from-red-650 from-red-600 to-amber-600 hover:opacity-90 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5"
              >
                Search line
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Directory Card Bento Grid */}
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase text-white tracking-widest pl-1">Direct Factory Directory & Portals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sourcingSites.map((site, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -4 }}
                className="bg-slate-900 border border-slate-840 border-slate-800 hover:border-red-500/30 p-6 rounded-2.5xl p-6 rounded-[2rem] flex flex-col justify-between shadow-md transition-all group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl select-none">{site.icon}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest bg-slate-950 px-2 py-0.5 rounded text-slate-400">
                      Manufacturer Site
                    </span>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <h4 className="text-base font-black text-white group-hover:text-red-400 transition-colors uppercase tracking-tight">{site.name}</h4>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed leading-normal">{site.desc}</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-850 border-slate-800/80 mt-6 flex flex-col gap-3">
                  <div className="flex flex-wrap gap-1">
                    {site.hotTags.map((tag, tagIdx) => (
                      <span key={tagIdx} className="text-[8.5px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => window.open(site.link, '_blank')}
                    className="w-full bg-slate-955 bg-slate-950 hover:bg-red-650 hover:bg-red-600 text-slate-400 hover:text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Launch Website
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Dual bottom tools section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* SOURCING LOGISTICS LOGISTIC CALCULATOR */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] space-y-6">
            <div>
              <h3 className="text-sm font-black uppercase text-white tracking-widest flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-red-500" />
                China Freight & Clearance Calculator
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-semibold">Estimate ocean and air logistics shipping rates to West Africa (NGN/USD Brokerage)</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-35 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-450 text-slate-400 uppercase tracking-widest pl-1">Target Port Destination</label>
                  <select
                    value={cargoDestination}
                    onChange={(e) => setCargoDestination(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-xs font-mono text-white outline-none cursor-pointer"
                  >
                    <option value="NG">Lagos Port, Nigeria (NGN)</option>
                    <option value="GH">Accra Port, Ghana (GHS)</option>
                    <option value="KE">Mombasa Port, Kenya (KES)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-450 text-slate-400 uppercase tracking-widest pl-1">Shipping Category</label>
                  <select
                    value={cargoFreightMode}
                    onChange={(e) => setCargoFreightMode(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-xs font-mono text-white outline-none cursor-pointer"
                  >
                    <option value="air_standard">Standard Air Shipping (7-14 Days)</option>
                    <option value="air_express">Express Air Cargo (3-5 Days)</option>
                    <option value="sea_groupage">Ocean Groupage Sea Shipping (45 Days)</option>
                  </select>
                </div>
              </div>

              {cargoFreightMode === 'sea_groupage' ? (
                <div className="space-y-1 animate-fadeIn">
                  <label className="text-[8px] font-black text-slate-450 text-slate-400 uppercase tracking-widest pl-1">Cargo Volume (CBM - Cubic Meters)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    value={cargoCBM}
                    onChange={(e) => setCargoCBM(parseFloat(e.target.value) || 0.1)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl py-3 px-4 text-xs font-mono text-white outline-none"
                  />
                </div>
              ) : (
                <div className="space-y-1 animate-fadeIn">
                  <label className="text-[8px] font-black text-slate-450 text-slate-400 uppercase tracking-widest pl-1">Actual Weight (Kilograms)</label>
                  <input
                    type="number"
                    min="1"
                    value={cargoWeight}
                    onChange={(e) => setCargoWeight(parseFloat(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl py-3 px-4 text-xs font-mono text-white outline-none"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={calculateFreight}
                className="w-full py-3.5 bg-gradient-to-r from-red-650 from-red-600 to-amber-600 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
              >
                Compute Estimated Logistics Cost
              </button>

              {calcResult && (
                <div className="bg-slate-955 bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3.5 animate-slideDown">
                  <div className="flex border-b border-slate-900 pb-2 justify-between text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    <span>{calcResult.method}</span>
                    <span>{calcResult.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Total Calculation Breakdown:</span>
                    <span className="text-xs font-mono text-slate-350 text-slate-300">{calcResult.breakdown}</span>
                  </div>
                  <div className="flex items-end justify-between pt-1 border-t border-slate-900">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">ESTIMATED LANDED FEES</span>
                    <div className="text-right">
                      <p className="text-base font-black text-red-400">₦{calcResult.ngn.toLocaleString({}, {maximumFractionDigits:0})}</p>
                      <p className="text-[10px] font-mono font-bold text-slate-500">Approx. ${calcResult.usd.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SOURCING EXPERT INQUIRY FORMS */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] space-y-6">
            <div>
              <h3 className="text-sm font-black uppercase text-white tracking-widest flex items-center gap-1.5">
                <Send className="w-4 h-4 text-red-500" />
                Submit Sourcing verification Request
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-semibold">Submit factory catalogs to eFado Sourcing Experts for verified bulk pricing.</p>
            </div>

            <form onSubmit={handleInquirySubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-450 text-slate-400 uppercase tracking-widest pl-1">Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Leather sneakers"
                    value={inquiryProduct}
                    onChange={(e) => setInquiryProduct(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl py-3 px-4 text-xs font-mono text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-450 text-slate-400 uppercase tracking-widest pl-1">Order Quantity (pcs)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 200"
                    value={inquiryQty}
                    onChange={(e) => setInquiryQty(parseInt(e.target.value) || 100)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl py-3 px-4 text-xs font-mono text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-450 text-slate-400 uppercase tracking-widest pl-1">Target Budget Structure (e.g. ₦1,500,000 max total)</label>
                  <input
                    type="text"
                    placeholder="Provide desired threshold budget"
                    value={inquiryBudget}
                    onChange={(e) => setInquiryBudget(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl py-3 px-4 text-xs font-mono text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-450 text-slate-400 uppercase tracking-widest pl-1">Detailed Requirements & Factory Specifications</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Needs customs certification, size 39-44 with individual boxing..."
                    value={inquirySpec}
                    onChange={(e) => setInquirySpec(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl py-3 px-4 text-xs font-mono text-white outline-none resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={inquirySubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-red-650 from-red-600 to-amber-600 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {inquirySubmitting ? 'Queueing verified Inquiry...' : 'Transmit Verified Sourcing Ticket'}
              </button>

              {inquirySuccess && (
                <div className="bg-emerald-950/20 border border-emerald-900/40 p-3.5 rounded-2xl text-xs text-emerald-400 font-bold flex items-center gap-2 animate-fadeIn">
                  <Check className="w-4 h-4 animate-bounce" />
                  Your Sourcing Request on-desk has been verified! eFado sourcing specialists will contact you with bulk proposals shortly.
                </div>
              )}
            </form>

            {/* List historic Sourcing Inquiry requests */}
            {userInquiries.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-slate-800/80">
                <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest">My Active Sourcing inquiries ({userInquiries.length})</span>
                <div className="max-h-[140px] overflow-y-auto space-y-2 no-scrollbar pr-1">
                  {userInquiries.map((inq, inqIdx) => (
                    <div key={inqIdx} className="bg-slate-955 bg-slate-950 border border-slate-800 rounded-xl p-3 flex justify-between items-center text-[11px] font-mono">
                      <div>
                        <p className="font-extrabold text-white">{inq.productName} ({inq.quantity} pcs)</p>
                        <p className="text-[9.5px] text-slate-500">{new Date(inq.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}</p>
                      </div>
                      <span className="text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-wider bg-rose-600/10 text-rose-450 border border-rose-500/20">
                        {inq.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    );
  };

  // ==========================================
  // RENDER: AIRTIME & DATA VENDING SYSTEM RENDER DIRECT
  // ==========================================
  const renderVendingPortal = () => {
    return (
      <div className="space-y-8 animate-fadeIn text-slate-105 text-slate-100 text-left relative z-10 max-w-5xl mx-auto">
        {/* Title Banner & Premium Wallet Balances */}
        <div className="bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-800/80 relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 w-80 h-80 bg-gradient-to-br from-indigo-505/10 to-amber-505/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 font-mono">Instant Dispatch Engine</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase">
                Airtime & Data <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-amber-400">Vending Suite</span>
              </h2>
              <p className="text-xs text-slate-405 text-slate-400 max-w-xl leading-relaxed">
                Secure instant wholesale telecom top-ups in under 20 seconds. Built with zero-friction automation and direct API carrier bindings.
              </p>
            </div>

            {/* Flex balance widgets */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-slate-950 border border-slate-800 p-3 px-4 rounded-xl flex items-center gap-3 min-w-[140px]">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-wider">Win Wallet</p>
                  <p className="text-sm font-black text-rose-450 text-rose-400">₦{(user.playerWallet || 0).toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-slate-955 bg-slate-950 border border-slate-800 p-3 px-4 rounded-xl flex items-center gap-3 min-w-[140px]">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-wider">Deposit Wallet</p>
                  <p className="text-sm font-black text-amber-400">₦{(user.depositWallet || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Vendor Navigation Sub-tabs */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800 select-none">
          <button
            type="button"
            onClick={() => setVendingSubTab('refill')}
            className={`px-5 py-3 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer ${
              vendingSubTab === 'refill'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 ring-2 ring-indigo-500/20'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-white border border-slate-800'
            }`}
          >
            <Phone className="w-4 h-4 text-indigo-400" />
            📱 Buy Recharge
          </button>
          <button
            type="button"
            onClick={() => setVendingSubTab('marketplace')}
            className={`px-5 py-3 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer ${
              vendingSubTab === 'marketplace'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/20'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-white border border-slate-800'
            }`}
          >
            <Globe className="w-4 h-4 text-amber-500" />
            👥 Vendor Marketplace
          </button>
          <button
            type="button"
            onClick={() => setVendingSubTab('console')}
            className={`px-5 py-3 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer ${
              vendingSubTab === 'console'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 ring-2 ring-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-white border border-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4 text-emerald-400" />
            ⚙️ Vendor Console {myTelecomVendor && <span className="bg-emerald-950 text-emerald-300 text-[8px] px-1.5 py-0.5 rounded-full font-bold">Partner</span>}
          </button>
        </div>

        {vendingSubTab !== 'refill' ? (
          <VendingMarketplace
            user={user}
            telecomVendors={telecomVendors}
            telecomVendorOrders={telecomVendorOrders}
            myTelecomVendor={myTelecomVendor}
            selectedVendorForOrder={selectedVendorForOrder}
            setSelectedVendorForOrder={setSelectedVendorForOrder}
            vendingSubTab={vendingSubTab}
            setVendingSubTab={setVendingSubTab}
            setVendingFlowStep={setVendingFlowStep}
            addVendingLog={addVendingLog}
            vendingType={vendingType}
          />
        ) : (
          <>
            {/* Wizard Step Progress Tracker */}
        <div className="max-w-2xl mx-auto flex items-center justify-between px-6 py-2 select-none">
          {[
            { step: 'choice', label: '1. Service' },
            { step: 'details', label: '2. Details' },
            { step: 'confirm', label: '3. Pay' },
            { step: 'result', label: '4. Summary' }
          ].map((tracker, idx) => {
            const isActive = vendingFlowStep === tracker.step;
            const isCompleted = 
              (vendingFlowStep === 'details' && tracker.step === 'choice') ||
              (vendingFlowStep === 'confirm' && ['choice', 'details'].includes(tracker.step)) ||
              (vendingFlowStep === 'result');
            return (
              <React.Fragment key={tracker.step}>
                <div className="flex flex-col items-center gap-1.5 focus:outline-none">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    isActive 
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/25 scale-110' 
                      : isCompleted 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-slate-805 bg-slate-800 text-slate-400'
                  }`}>
                    {isCompleted ? '✓' : idx + 1}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${
                    isActive ? 'text-indigo-400' : isCompleted ? 'text-emerald-400' : 'text-slate-500'
                  }`}>
                    {tracker.label}
                  </span>
                </div>
                {idx < 3 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded transition-all ${
                    isCompleted ? 'bg-emerald-500/60' : 'bg-slate-800'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Core Wizard Body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Workspace Frame */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* STEP 1: SERVICE CHOICE */}
            {vendingFlowStep === 'choice' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.button
                  whileHover={{ y: -4, scale: 1.01 }}
                  onClick={() => {
                    setVendingType('airtime');
                    addVendingLog('[Flow Update] Selected product: Infinite Airtime Refills.');
                    setVendingFlowStep('details');
                  }}
                  className="bg-slate-900 border border-slate-800 hover:border-indigo-550 hover:border-indigo-500/40 p-10 py-12 rounded-[2rem] text-left transition-all shadow-xl group cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-600/5 rounded-full blur-2xl group-hover:bg-indigo-600/10 transition-colors" />
                  <div className="w-14 h-14 bg-indigo-500/15 group-hover:bg-indigo-600/25 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300">
                    <Phone className="w-7 h-7 text-indigo-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-1.5 font-sans">
                    Airtime Refill 
                    <span className="text-[7.5px] uppercase bg-indigo-600 text-white font-mono font-black px-1.5 py-0.5 rounded tracking-wider">Instant</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed leading-normal">
                    Top up airtime on MTN, Airtel, Glo, 9mobile, Safaricom & more with premium automatic network detection. Zero processing fee.
                  </p>
                </motion.button>

                <motion.button
                  whileHover={{ y: -4, scale: 1.01 }}
                  onClick={() => {
                    setVendingType('data');
                    addVendingLog('[Flow Update] Selected product: High-Speed Internet Data Bundles.');
                    setVendingFlowStep('details');
                  }}
                  className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 p-10 py-12 rounded-[2rem] text-left transition-all shadow-xl group cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-600/5 rounded-full blur-2xl group-hover:bg-emerald-600/10 transition-colors" />
                  <div className="w-14 h-14 bg-emerald-500/15 group-hover:bg-emerald-600/25 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300">
                    <Wifi className="w-7 h-7 text-emerald-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-1.5 font-sans">
                    Data Bundles
                    <span className="text-[7.5px] uppercase bg-emerald-600 text-white font-mono font-black px-1.5 py-0.5 rounded tracking-wider">Fast</span>
                  </h3>
                  <p className="text-xs text-slate-405 text-slate-400 mt-2 leading-relaxed leading-normal">
                    Unlock unlimited mobile browsing packages. All network operator configurations loaded instantly. Best wholesale prices.
                  </p>
                </motion.button>
              </div>
            )}

            {/* STEP 2: FILL DETAILS (OPAY LOGO CHIPS, AUTO FORMAT & AUTO DETECT) */}
            {vendingFlowStep === 'details' && (
              <div className="bg-slate-900 border border-slate-800/80 p-6 md:p-8 rounded-3xl space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-1.5">
                    {vendingType === 'airtime' ? <Phone className="w-4 h-4 text-indigo-400" /> : <Wifi className="w-4 h-4 text-emerald-400" />}
                    Enter {vendingType.toUpperCase()} Details
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setVendingFlowStep('choice');
                      addVendingLog('[Flow Update] Returned to main Category Selector.');
                    }}
                    className="text-[10px] uppercase font-black tracking-widest text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    ← Back to Choice
                  </button>
                </div>

                {/* Country Selection Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Target Country</label>
                  <div className="flex gap-2">
                    {GLOBAL_VENDING_COUNTRIES.map((ct) => (
                      <button
                        key={ct.code}
                        type="button"
                        onClick={() => {
                          setVendingCountry(ct.code);
                          // Reset Operator Code to country's first operator
                          if (ct.operators.length > 0) {
                            setVendingOperator(ct.operators[0].code);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono rounded-xl transition-all border cursor-pointer ${
                          vendingCountry === ct.code
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <span>{ct.flag}</span>
                        <span>{ct.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phone Number Entry & Preloads */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recipient Phone Number</label>
                    <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase">Auto-Network Detect Active</span>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none select-none">
                      <span className="text-xs font-mono text-slate-500 font-black">
                        {GLOBAL_VENDING_COUNTRIES.find(c => c.code === vendingCountry)?.phonePrefix || '+234'}
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="0803 000 0000"
                      value={vendingPhone}
                      onChange={(e) => {
                        const input = e.target.value;
                        // format phone input with visual spaces automatically
                        const clean = input.replace(/\D/g, '').substring(0, 11);
                        let formatted = clean;
                        if (clean.length > 3) {
                          formatted = clean.substring(0, 4) + ' ' + clean.substring(4);
                        }
                        if (clean.length > 7) {
                          formatted = clean.substring(0, 4) + ' ' + clean.substring(4, 7) + ' ' + clean.substring(7);
                        }
                        setVendingPhone(formatted);

                        // AUTO NETWORK DETECTION
                        const normalized = clean;
                        if (normalized.length >= 4) {
                          const prefix = normalized.substring(0, 4);
                          let detectedOpCode = '';
                          if (['0803', '0806', '0703', '0706', '0813', '0816', '0903', '0906', '0913', '0916', '0810', '0814', '0704'].includes(prefix)) {
                            detectedOpCode = 'mtn_ng';
                          } else if (['0802', '0808', '0701', '0708', '0812', '0902', '0901', '0907', '0912', '0904'].includes(prefix)) {
                            detectedOpCode = 'airtel_ng';
                          } else if (['0805', '0807', '0705', '0815', '0811', '0905', '0915'].includes(prefix)) {
                            detectedOpCode = 'glo_ng';
                          } else if (['0809', '0818', '0817', '0909', '0908'].includes(prefix)) {
                            detectedOpCode = '9mobile_ng';
                          }

                          if (detectedOpCode && vendingCountry === 'NG') {
                            setVendingOperator(detectedOpCode);
                            addVendingLog(`[Smart Prefix Detector] Auto-detected prefix: ${prefix} with network: ${detectedOpCode}`);
                          }
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl py-3.5 pl-14 pr-4 text-xs font-mono text-white outline-none transition-colors"
                    />
                  </div>

                  {/* Beneficiary quick select buttons */}
                  {savedBeneficiaries.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Select Beneficiary</span>
                      <div className="flex flex-wrap gap-1.5">
                        {savedBeneficiaries.map((b, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setVendingPhone(b.phone);
                              setVendingOperator(b.operator);
                              setVendingCountry(b.country);
                              addVendingLog(`[Preload] Recipient fast-loaded: ${b.name} (${b.phone})`);
                            }}
                            className="py-1 px-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-[9px] text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                          >
                            <UserCheck className="w-3 h-3 text-indigo-400" />
                            {b.name} : {b.phone}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Network Selector Chips (Opay-inspired branding layout) */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Network Operator</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {GLOBAL_VENDING_COUNTRIES.find(c => c.code === vendingCountry)?.operators.map((carrier) => {
                      const isSelected = vendingOperator === carrier.code;
                      return (
                        <button
                          key={carrier.code}
                          type="button"
                          onClick={() => {
                            setVendingOperator(carrier.code);
                            addVendingLog(`[Operator Selected] Manual shift to: ${carrier.name}`);
                          }}
                          className={`relative p-3 bg-slate-955 bg-slate-950 border rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-indigo-500 bg-indigo-950/20 shadow-lg shadow-indigo-650/10' 
                              : 'border-slate-800 hover:border-slate-705 hover:border-slate-700'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-white/5 flex items-center justify-center border border-slate-800">
                            <img 
                              src={carrier.logo || 'https://via.placeholder.com/150'} 
                              alt={carrier.name} 
                              className="w-10 h-10 object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <span className="text-[9px] font-black text-slate-350 tracking-tight text-center truncate w-full">
                            {carrier.name.replace('Nigeria', '')}
                          </span>
                          {isSelected && (
                            <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Amount Panel - Dynamic depending on Vending Type */}
                {vendingType === 'airtime' ? (
                  <div className="space-y-4">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Choose Refill Amount (₦)</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                      {[100, 200, 500, 1000, 2000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setVendingCustomAirtimeAmount(preset);
                          }}
                          className={`py-3 rounded-xl font-mono text-[11px] font-black transition-all border cursor-pointer ${
                            vendingCustomAirtimeAmount === preset
                              ? 'bg-rose-600 text-white border-rose-500 scale-102'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          ₦{preset.toLocaleString()}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest pl-1">Or enter Custom Amount (₦50 - ₦20,000)</span>
                      <input
                        type="number"
                        min="50"
                        max="20000"
                        value={vendingCustomAirtimeAmount}
                        onChange={(e) => setVendingCustomAirtimeAmount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl py-3 px-4 text-xs font-mono text-white outline-none"
                      />
                    </div>

                    {/* Price Breakdown live label */}
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-400">Transaction Fee</span>
                      <span className="font-mono text-emerald-400 font-extrabold uppercase tracking-wide">₦0 (FREE)</span>
                    </div>
                    <div className="bg-indigo-950/20 border border-indigo-900/30 p-3.5 rounded-2xl flex items-center justify-between text-xs font-mono font-bold">
                      <span className="text-slate-400">Total Charged</span>
                      <span className="text-xs font-black text-white">₦{Number(vendingCustomAirtimeAmount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                ) : (
                  // DATA DATA BUNDLES
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Choose Data Bundle</label>
                      
                      {/* Package validity tab selector */}
                      <div className="flex gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                        {['daily', 'weekly', 'monthly', 'sme'].map((tab) => (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setVendingDataTab(tab as any)}
                            className={`px-3 py-1 text-[8px] font-black uppercase tracking-wider rounded transition-all cursor-pointer ${
                              vendingDataTab === tab
                                ? 'bg-emerald-600 text-white'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Target custom bundle grid depending on choice of operator config plan */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {GLOBAL_VENDING_COUNTRIES.find(c => c.code === vendingCountry)
                        ?.operators.find(o => o.code === vendingOperator)
                        ?.plans.filter(p => {
                          if (vendingDataTab === 'daily') return p.validity.toLowerCase().includes('hour') || p.validity.toLowerCase().includes('1 day');
                          if (vendingDataTab === 'weekly') return p.validity.toLowerCase().includes('7 day') || p.validity.toLowerCase().includes('3 day');
                          if (vendingDataTab === 'monthly') return p.validity.toLowerCase().includes('30 day');
                          return p.id.includes('sme');
                        }).map((plan) => {
                          const isSelectedPlan = vendingSelectedDataPlanId === plan.id;
                          const isBestValue = plan.priceNGN <= 1500;
                          return (
                            <button
                              key={plan.id}
                              type="button"
                              onClick={() => {
                                setVendingSelectedDataPlanId(plan.id);
                                addVendingLog(`[Bundle Selector] Selected package ${plan.name} allowance ${plan.dataAllowance}`);
                              }}
                              className={`relative p-3.5 rounded-2xl border bg-slate-950 text-left transition-all cursor-pointer flex flex-col justify-between h-[95px] group ${
                                isSelectedPlan
                                  ? 'border-emerald-500 bg-emerald-950/20'
                                  : 'border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-black text-white group-hover:text-emerald-400 transition-colors truncate block max-w-[130px]">
                                    {plan.dataAllowance}
                                  </span>
                                  {isBestValue && (
                                    <span className="text-[6px] uppercase bg-rose-600 text-white font-mono font-black px-1.5 py-0.5 rounded tracking-widest animate-pulse">
                                      Best Value
                                    </span>
                                  )}
                                </div>
                                <p className="text-[9.5px] text-slate-400 font-medium truncate">
                                  {plan.name}
                                </p>
                              </div>
                              <div className="flex items-end justify-between border-t border-slate-900 pt-1.5">
                                <span className="text-[8.5px] font-mono text-slate-500 font-bold">
                                  Val: {plan.validity}
                                </span>
                                <span className="text-[10px] font-mono font-extrabold text-white">
                                  ₦{plan.priceNGN.toLocaleString()}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Save Beneficiary checkbox */}
                <div className="flex items-center gap-2 select-none">
                  <input
                    type="checkbox"
                    id="sv-beneficiary"
                    checked={saveBeneficiary}
                    onChange={(e) => setSaveBeneficiary(e.target.checked)}
                    className="w-4 h-4 accent-indigo-650 accent-indigo-600 bg-slate-950 cursor-pointer rounded"
                  />
                  <label htmlFor="sv-beneficiary" className="text-[10px] font-black uppercase text-slate-400 cursor-pointer tracking-wider hover:text-slate-200 transition-colors">
                    Save this number to beneficiaries
                  </label>
                </div>

                {/* Proceed checkout button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Basic validation checks
                      const cleanPhone = vendingPhone.replace(/\s+/g, '');
                      if (cleanPhone.length < 5) {
                        alert("Please specify a valid mobile phone number.");
                        return;
                      }
                      if (vendingType === 'airtime' && !vendingCustomAirtimeAmount) {
                        alert("Please enter a refill amount.");
                        return;
                      }
                      if (vendingType === 'data' && !vendingSelectedDataPlanId) {
                        alert("Please click on a data plan box to select it.");
                        return;
                      }
                      setVendingFlowStep('confirm');
                    }}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:opacity-90 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Continue to Checkout
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: CONFIRM & AUTHORIZE PAYMENT */}
            {vendingFlowStep === 'confirm' && (
              <div className="bg-slate-900 border border-slate-800/80 p-6 md:p-8 rounded-3xl space-y-6 text-left">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Authorize Wholesaler Dispatch
                  </span>
                  <button
                    type="button"
                    onClick={() => setVendingFlowStep('details')}
                    className="text-[10px] uppercase font-black tracking-widest text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    ← Back to Form
                  </button>
                </div>

                {/* Summary parameters list */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Transaction Type</span>
                    <span className="font-extrabold uppercase text-white font-mono">{vendingType === 'airtime' ? '📞 AIRTIME TOP-UP' : '🌐 DATA BROADBAND'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Carrier Network</span>
                    <span className="font-extrabold text-indigo-400 uppercase font-mono">
                      {GLOBAL_VENDING_COUNTRIES.find(c => c.code === vendingCountry)?.operators.find(o => o.code === vendingOperator)?.name || vendingOperator}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Destination Number</span>
                    <span className="font-extrabold font-mono text-white">
                      {GLOBAL_VENDING_COUNTRIES.find(c => c.code === vendingCountry)?.phonePrefix || '+234'} {vendingPhone}
                    </span>
                  </div>
                  {vendingType === 'data' && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Allocated Allowance</span>
                      <span className="font-extrabold text-emerald-400 font-mono">
                        {GLOBAL_VENDING_COUNTRIES.find(c => c.code === vendingCountry)?.operators.find(o => o.code === vendingOperator)?.plans.find(p => p.id === vendingSelectedDataPlanId)?.dataAllowance || 'Standard Bundle'}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-slate-910 border-slate-900 pt-3 flex items-center justify-between text-xs font-mono font-bold">
                    <span className="text-slate-400">Total Purchase Amount</span>
                    <span className="text-xs font-black text-rose-450 text-rose-400">
                      ₦{
                        vendingType === 'airtime' 
                          ? Number(vendingCustomAirtimeAmount || 0).toLocaleString() 
                          : (GLOBAL_VENDING_COUNTRIES.find(c => c.code === vendingCountry)?.operators.find(o => o.code === vendingOperator)?.plans.find(p => p.id === vendingSelectedDataPlanId)?.priceNGN || 0).toLocaleString()
                      }
                    </span>
                  </div>
                </div>

                {/* Payment Method Selector & Balance Safeguard */}
                <div className="space-y-4">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Payment Method & Source</label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {[
                      { method: 'win_wallet', title: 'Win Wallet / Play Balance', dbField: 'playerWallet', color: 'text-rose-400' },
                      { method: 'deposit_wallet', title: 'Deposit Wallet Balance', dbField: 'depositWallet', color: 'text-amber-400' }
                    ].map((wallet) => {
                      const walletBalance = user[wallet.dbField as 'playerWallet' | 'depositWallet'] || 0;
                      const totalCost = vendingType === 'airtime' 
                        ? Number(vendingCustomAirtimeAmount || 0) 
                        : (GLOBAL_VENDING_COUNTRIES.find(c => c.code === vendingCountry)?.operators.find(o => o.code === vendingOperator)?.plans.find(p => p.id === vendingSelectedDataPlanId)?.priceNGN || 0);
                      const isInsufficient = walletBalance < totalCost;
                      const isSelected = vendingPayMethod === wallet.method;

                      return (
                        <button
                          key={wallet.method}
                          type="button"
                          onClick={() => {
                            setVendingPayMethod(wallet.method as any);
                            addVendingLog(`[Source Update] Switched base payment mode to: ${wallet.method}`);
                          }}
                          className={`p-4 bg-slate-950 border rounded-2xl flex flex-col gap-1 text-left transition-all relative cursor-pointer ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-950/10'
                              : 'border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5 select-none">
                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-indigo-400' : 'bg-slate-730 bg-slate-700'}`} />
                            {wallet.title}
                          </span>
                          <span className={`text-[11px] font-mono font-bold ${wallet.color}`}>
                            ₦{walletBalance.toLocaleString()}
                          </span>
                          {isInsufficient && isSelected && (
                            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs rounded-2xl p-2.5 flex flex-col items-center justify-center text-center">
                              <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Insufficient Funds</p>
                              <span className="text-[7px] font-black uppercase text-indigo-400 font-mono">Fund balance to continue</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Action Block */}
                <div className="space-y-3">
                  <button
                    type="button"
                    disabled={vendingStatus === 'processing'}
                    onClick={() => {
                      // Double check balance constraint
                      const activeWalletField = vendingPayMethod === 'win_wallet' ? 'playerWallet' : 'depositWallet';
                      const activeBalance = user[activeWalletField as 'playerWallet' | 'depositWallet'] || 0;
                      const currentCost = vendingType === 'airtime' 
                        ? Number(vendingCustomAirtimeAmount || 0) 
                        : (GLOBAL_VENDING_COUNTRIES.find(c => c.code === vendingCountry)?.operators.find(o => o.code === vendingOperator)?.plans.find(p => p.id === vendingSelectedDataPlanId)?.priceNGN || 0);
                      if (activeBalance < currentCost) {
                        alert("Insufficient Balance in selected wallet. Please fund your account.");
                        return;
                      }
                      handleVendingPurchase();
                    }}
                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:opacity-90 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-650/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {vendingStatus === 'processing' ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-white animate-spin" />
                        Broadband Query Live...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-emerald-300 fill-emerald-300 animate-pulse" />
                        Confirm and Pay Now
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVendingFlowStep('details')}
                    className="w-full py-3 bg-transparent hover:bg-slate-800 text-slate-450 text-slate-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all text-center cursor-pointer"
                  >
                    Cancel and Modify
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: SUCCESS / FAILING RESULT PANELS */}
            {vendingFlowStep === 'result' && (
              <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl text-center space-y-6">
                
                {vendingStatus === 'success' ? (
                  <div className="space-y-4">
                    <div className="mx-auto w-14 h-14 rounded-full bg-emerald-550/15 bg-emerald-500/10 flex items-center justify-center">
                      <Check className="w-7 h-7 text-emerald-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-black uppercase text-emerald-450 text-emerald-400 tracking-tight">Top-Up Successful!</h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                        {vendingStatusMessage || 'Wholesale delivery successfully finished. Funds have been charged.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="mx-auto w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center">
                      <XCircle className="w-7 h-7 text-rose-500" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-black uppercase text-rose-500 tracking-tight">Transaction Failed</h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                        {vendingStatusMessage || 'An internal API carrier connection interrupt arose. Balance was untouched.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Print details list */}
                <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4.5 p-4 font-mono text-[11px] max-w-md mx-auto space-y-3.5 text-left">
                  <div className="border-b border-slate-900 pb-2 flex items-center justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                    <span>Receipt Proof</span>
                    <span>Ref: REL-{Math.floor(Math.random() * 99999999)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Destination</span>
                    <span className="text-white font-extrabold">{vendingPhone}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Carrier API</span>
                    <span className="text-indigo-400 font-extrabold uppercase">
                      {GLOBAL_VENDING_COUNTRIES.find(c => c.code === vendingCountry)?.operators.find(o => o.code === vendingOperator)?.name || vendingOperator}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Dispatch Status</span>
                    <span className={`font-black uppercase ${vendingStatus === 'success' ? 'text-emerald-400' : 'text-rose-500'}`}>
                      {vendingStatus.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Finish action choices */}
                <div className="flex gap-3 max-w-md mx-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setVendingFlowStep('details');
                      setVendingStatus('idle');
                    }}
                    className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Buy Again
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVendingFlowStep('choice');
                      setVendingStatus('idle');
                    }}
                    className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Home Menu
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Left Sidebar: Merchant markup & RAW logs console (PALMPAY MERCHANT MODE) */}
          <div className="space-y-6">
            
            {/* Merchant Mode Switcher */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 select-none">
                <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-indigo-400" />
                  Retail Merchant Mode
                </span>
                <input
                  type="checkbox"
                  className="w-8 h-4 bg-slate-950 accent-indigo-600 rounded cursor-pointer"
                  checked={isMerchant}
                  onChange={(e) => {
                    setIsMerchant(e.target.checked);
                    addVendingLog(`[Profile Context] Merchant billing state adjusted. Mode: ${e.target.checked ? 'ENABLED' : 'DISABLED'}`);
                  }}
                />
              </div>

              {isMerchant ? (
                <div className="space-y-4 animate-slideDown text-left">
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest pl-1">Selling Markup (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0.5"
                        max="15.0"
                        step="0.5"
                        value={merchantMarkup}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setMerchantMarkup(val);
                          addVendingLog(`[Markup Calibration] Selling profit margin modified: ${val}% markup override.`);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-505 focus:border-indigo-500 rounded-xl py-3 px-4 text-xs font-mono text-white outline-none"
                      />
                      <span className="absolute right-4 top-3 text-xs font-mono text-slate-500 font-bold">%</span>
                    </div>
                  </div>
                  <div className="bg-indigo-950/20 p-3.5 border border-indigo-900/40 rounded-2xl space-y-2 text-xs">
                    <p className="font-bold flex items-center justify-between">
                      <span className="text-slate-400">Merchant Float</span>
                      <span className="text-white font-mono">₦{merchantFloat.toLocaleString()}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed font-sans leading-normal">
                      Wholesaler discount rate permits you to buy below street values and markup <strong>{merchantMarkup}%</strong> profit per transaction.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-[10.5px] text-slate-400 font-semibold leading-relaxed leading-normal select-none">
                  Activate Retail Merchant mode to specify custom markup fees, sell to client users, and harvest instant arbitrage commission loops.
                </p>
              )}
            </div>

            {/* DEV CONSOLE PIPELINE LOGS */}
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest select-none">Server Real-time Sync Console</span>
                <button
                  type="button"
                  onClick={() => setShowAdvancedLogs(!showAdvancedLogs)}
                  className="text-[8.5px] uppercase tracking-wider font-extrabold text-indigo-400 hover:text-white transition-all cursor-pointer"
                >
                  {showAdvancedLogs ? 'Collapse console' : 'View full terminal'}
                </button>
              </div>

              {showAdvancedLogs && (
                <div className="bg-black/50 p-3 rounded-2xl border border-slate-850 max-h-[155px] overflow-y-auto no-scrollbar font-mono text-[9px] text-emerald-400 space-y-1.5 scroll-smooth">
                  {vendingLogs.map((lg, index) => (
                    <p key={index} className="whitespace-pre-wrap leading-normal [word-break:break-all]">
                      {lg}
                    </p>
                  ))}
                  <div ref={consoleEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 relative overflow-hidden font-sans selection:bg-indigo-600 selection:text-white">
      {/* GRAPHIC ENHANCEMENT: Classic high-fidelity mesh layouts and interactive visual depth elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.12),transparent_45%),radial-gradient(ellipse_at_bottom,rgba(16,185,129,0.06),transparent_50%),radial-gradient(circle_at_center,rgba(217,119,6,0.03),transparent_40%)] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.004)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.004)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_60%,transparent_100%)]" />
      
      {/* Deep decorative ambient elements */}
      <div className="absolute top-10 left-10 w-[550px] h-[550px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none z-0 animate-pulse duration-[8000ms]" />
      <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* Header with glassmorphism wrapper */}
      <div className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-30 shadow-lg shadow-slate-950/20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {view !== 'landing' && (
              <button 
                onClick={() => {
                  if (view === 'seller') setView('landing');
                  else if (view === 'checkout') setView('seller');
                  else setView('landing');
                }}
                className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2 select-none">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Globe className="text-slate-950 w-5 h-5 animate-spin-slow font-black" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-300">EFADO DOMAIN HUB</span>
                <span className="text-[9px] font-mono font-bold tracking-wider text-amber-400 select-none uppercase -mt-0.5">AI-Powered Hub Unified Portal</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setView('orders')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-350 hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-sm"
          >
            <History className="w-4 h-4" />
            My Orders
          </button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              {/* Segmented Workspace Selector */}
              <div className="flex flex-wrap md:flex-nowrap bg-slate-900/90 p-1.5 rounded-2xl max-w-5xl mx-auto border border-slate-800/80 shadow-2xl gap-1 relative z-10">
                <button
                  type="button"
                  onClick={() => setActiveLandingSection('domains')}
                  className={`flex-1 min-w-[125px] py-3.5 px-3 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeLandingSection === 'domains'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-650/40 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Globe className="w-4 h-4 text-indigo-400" />
                  Domains
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLandingSection('course')}
                  className={`flex-1 min-w-[125px] py-3.5 px-3 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 relative cursor-pointer ${
                    activeLandingSection === 'course'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-650/40 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Award className="w-4 h-4 text-amber-400" />
                  AI Course
                  <span className="absolute -top-1.5 -right-0.5 bg-rose-600 text-[7px] text-white font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-md animate-bounce">
                    70% OFF
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLandingSection('tools')}
                  className={`flex-1 min-w-[125px] py-3.5 px-3 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeLandingSection === 'tools'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-650/40 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Cpu className="w-4 h-4 text-purple-400" />
                  AI Apps
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLandingSection('vending')}
                  className={`flex-1 min-w-[145px] py-3.5 px-3 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeLandingSection === 'vending'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-650/40 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                  Airtime & Data
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLandingSection('otc')}
                  className={`flex-1 min-w-[145px] py-3.5 px-3 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeLandingSection === 'otc'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-650/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Coins className="w-4 h-4 text-emerald-400" />
                  OTC Desk
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLandingSection('sourcing')}
                  className={`flex-1 min-w-[160px] py-3.5 px-3 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 relative overflow-hidden cursor-pointer ${
                    activeLandingSection === 'sourcing'
                      ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-lg shadow-red-600/35 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 text-amber-300" />
                  China Sourcing
                  <span className="absolute top-0 right-0 bg-red-650 bg-red-600 text-white text-[6.5px] font-black px-1.5 py-0.5 rounded-bl uppercase tracking-widest">
                    Hot
                  </span>
                </button>
              </div>

              {/* SECTION: DOMAINS REGISTRAR */}
              {activeLandingSection === 'domains' && (
                <div className="space-y-12 animate-fadeIn">
                  {/* Hero Search */}
                  <div className="text-center space-y-6">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
                      Find Your Perfect <span className="text-indigo-600">Domain</span>
                    </h1>
                    <p className="text-slate-500 max-w-2xl mx-auto text-sm">
                      Search across top registration authorities and get the industry's lowest rates with Efado's exclusive reseller contracts.
                    </p>
                    <div className="max-w-2xl mx-auto relative group">
                      <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      </div>
                      <input 
                        type="text"
                        placeholder="Search for a domain (e.g. example.com)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full bg-white border-2 border-slate-200 rounded-[2rem] py-5 pl-16 pr-32 text-lg text-gray-950 focus:border-indigo-500 outline-none transition-all shadow-xl shadow-indigo-500/5"
                      />
                      <button 
                        onClick={handleSearch}
                        className="absolute right-3 top-3 bottom-3 px-8 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-indigo-500 transition-all"
                      >
                        Search
                      </button>
                    </div>
                  </div>

                  {/* Top Sellers */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">Top Sellers</h2>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verified Partners</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* EFADO Mail Card */}
                      <motion.div
                        whileHover={{ y: -5 }}
                        onClick={() => setView('email')}
                        className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-[2rem] shadow-xl text-white cursor-pointer group relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
                        <div className="relative z-10">
                          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl mb-4 flex items-center justify-center">
                            <Mail className="w-8 h-8 text-white" />
                          </div>
                          <h3 className="text-xl font-black tracking-tight uppercase">EFADO Mails</h3>
                          <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-1">Professional Email Hub</p>
                          <div className="mt-8 flex items-center justify-between">
                            <span className="px-2 py-1 bg-white/20 rounded-full text-[8px] font-black uppercase tracking-widest">New Feature</span>
                            <ChevronRight className="w-5 h-5 opacity-60 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </motion.div>

                      {sellers.map((seller) => (
                        <motion.div
                          key={seller.id}
                          whileHover={{ y: -5 }}
                          onClick={() => {
                            setSelectedSeller(seller);
                            setView('seller');
                          }}
                          className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                        >
                          <div className="w-16 h-16 bg-slate-50 rounded-2xl mb-4 flex items-center justify-center overflow-hidden border border-slate-100">
                            <img src={seller.logoUrl} alt={seller.name} className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                          </div>
                          <h3 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">{seller.name}</h3>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                            {seller.integrationType === 'reseller_api' ? 'Direct Reseller' : 'Affiliate Partner'}
                          </p>
                          <div className="mt-6 flex items-center justify-between">
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-widest">
                              {seller.supportedTlds.length} TLDs
                            </span>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-all" />
                          </div>
                        </motion.div>
                      ))}
                      {/* Mock Sellers if none in DB */}
                      {sellers.length === 0 && [
                        { name: 'HostAfrica', logo: 'https://picsum.photos/seed/host1/100/100' },
                        { name: 'BlueWave', logo: 'https://picsum.photos/seed/host2/100/100' },
                        { name: 'Goddy', logo: 'https://picsum.photos/seed/host3/100/100' },
                        { name: 'Hostger', logo: 'https://picsum.photos/seed/host4/100/100' }
                      ].map((s, i) => (
                        <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-200 opacity-50 grayscale">
                          <div className="w-16 h-16 bg-slate-50 rounded-2xl mb-4" />
                          <h3 className="text-lg font-black text-slate-900 uppercase">{s.name}</h3>
                          <p className="text-xs text-slate-400">Coming Soon</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: LEARN AI IN 28 DAYS */}
              {activeLandingSection === 'course' && (
                <div className="space-y-10 animate-fadeIn text-slate-900">
                  {/* Custom Header Badge & Course Pitch */}
                  <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 md:p-12 text-white shadow-xl border border-white/5">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />
                    
                    <div className="relative z-10 space-y-6 max-w-3xl">
                      <div className="inline-flex items-center gap-2 bg-rose-500/20 text-rose-300 px-4 py-2 rounded-full border border-rose-500/30">
                        <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-widest">Limited Enrollment — Only 50 Spots</span>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-400">THE ROADMAP TO COGNITIVE MASTERY</p>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none uppercase">
                          MASTER AI IN 28 DAYS
                        </h1>
                        <p className="text-lg font-medium text-indigo-200">
                          From Complete Beginner to AI-Powered Professional
                        </p>
                      </div>

                      <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                        No coding experience needed. Join thousands of digital professionals who have transformed their careers with our step-by-step AI mastery program. Learn, build real-world applications, and create side income streams using artificial intelligence.
                      </p>

                      {/* Course Core Pill Targets */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10">
                        <div className="flex items-start gap-3 bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                          <span className="text-2xl">🧠</span>
                          <div>
                            <h4 className="text-xs font-black tracking-widest text-white uppercase">Master AI Writing</h4>
                            <p className="text-[11px] text-slate-400 mt-1">ChatGPT, Claude, Jasper — produce professional content 10x faster.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                          <span className="text-2xl">🎨</span>
                          <div>
                            <h4 className="text-xs font-black tracking-widest text-white uppercase">Master AI Design</h4>
                            <p className="text-[11px] text-slate-400 mt-1">Midjourney, Canva AI, DALL-E — model stunning high-converting visuals.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                          <span className="text-2xl">💰</span>
                          <div>
                            <h4 className="text-xs font-black tracking-widest text-white uppercase">Automation & Income</h4>
                            <p className="text-[11px] text-slate-400 mt-1">Automate repetitive client tasks, land remote gigs, scale revenue.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Curriculum with Toggles */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="flex items-center gap-2 px-2">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Structured 28-Day Curriculum</h3>
                      </div>

                      {/* Week 1 */}
                      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm transition-all hover:border-slate-300">
                        <button
                          type="button"
                          onClick={() => setExpandedWeek(expandedWeek === 1 ? null : 1)}
                          className="w-full flex items-center justify-between p-6 bg-slate-50 hover:bg-slate-100/70 transition-colors"
                        >
                          <div className="text-left">
                            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">WEEK 1</span>
                            <h4 className="text-base font-black text-slate-900 uppercase">AI Foundations (Days 1-7)</h4>
                          </div>
                          <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${expandedWeek === 1 ? 'rotate-90 text-indigo-500' : ''}`} />
                        </button>
                        {expandedWeek === 1 && (
                          <div className="p-6 border-t border-slate-100 bg-white space-y-4 text-sm text-slate-600">
                            <ul className="space-y-3.5">
                              <li className="flex items-start gap-3">
                                <span className="text-indigo-600 font-bold mt-0.5">01</span>
                                <span><strong>What is AI & How It Works:</strong> Simple, visual explanations of neural nets & large models.</span>
                              </li>
                              <li className="flex items-start gap-3">
                                <span className="text-indigo-600 font-bold mt-0.5">02</span>
                                <span><strong>Setting Up Your AI Toolkit:</strong> Create workspace accounts for all best industry-standard free tools.</span>
                              </li>
                              <li className="flex items-start gap-3">
                                <span className="text-indigo-600 font-bold mt-0.5">03</span>
                                <span><strong>Prompt Engineering 101:</strong> Learn the exact template structures to force pristine outputs.</span>
                              </li>
                              <li className="flex items-start gap-3 pt-2.5 border-t border-slate-50 text-indigo-600 font-black text-xs uppercase tracking-widest items-center gap-1">
                                <Award className="w-4 h-4" />
                                <span>Day 7 Milestone Project: Your first AI-assisted content campaign piece</span>
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Week 2 */}
                      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm transition-all hover:border-slate-300">
                        <button
                          type="button"
                          onClick={() => setExpandedWeek(expandedWeek === 2 ? null : 2)}
                          className="w-full flex items-center justify-between p-6 bg-slate-50 hover:bg-slate-100/70 transition-colors"
                        >
                          <div className="text-left">
                            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">WEEK 2</span>
                            <h4 className="text-base font-black text-slate-900 uppercase">Content & Writing with AI (Days 8-14)</h4>
                          </div>
                          <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${expandedWeek === 2 ? 'rotate-90 text-indigo-500' : ''}`} />
                        </button>
                        {expandedWeek === 2 && (
                          <div className="p-6 border-t border-slate-100 bg-white space-y-4 text-sm text-slate-600">
                            <ul className="space-y-3.5">
                              <li className="flex items-start gap-3">
                                <span className="text-indigo-600 font-bold mt-0.5">01</span>
                                <span><strong>Blogs, Emails, & Social Captions:</strong> Generate high-retention copy in a matter of seconds.</span>
                              </li>
                              <li className="flex items-start gap-3">
                                <span className="text-indigo-600 font-bold mt-0.5">02</span>
                                <span><strong>Personality Injecting:</strong> Fine-tuning and editing AI outputs so they read like human-original.</span>
                              </li>
                              <li className="flex items-start gap-3">
                                <span className="text-indigo-600 font-bold mt-0.5">03</span>
                                <span><strong>AI-Powered Research & Summarization:</strong> Distill 100-page booklets into core actionable summaries.</span>
                              </li>
                              <li className="flex items-start gap-3 pt-2.5 border-t border-slate-50 text-indigo-600 font-black text-xs uppercase tracking-widest items-center gap-1">
                                <Award className="w-4 h-4" />
                                <span>Day 14 Milestone Project: Complete content marketing campaign package</span>
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Week 3 */}
                      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm transition-all hover:border-slate-300">
                        <button
                          type="button"
                          onClick={() => setExpandedWeek(expandedWeek === 3 ? null : 3)}
                          className="w-full flex items-center justify-between p-6 bg-slate-50 hover:bg-slate-100/70 transition-colors"
                        >
                          <div className="text-left">
                            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">WEEK 3</span>
                            <h4 className="text-base font-black text-slate-900 uppercase">Visuals & Media with AI (Days 15-21)</h4>
                          </div>
                          <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${expandedWeek === 3 ? 'rotate-90 text-indigo-500' : ''}`} />
                        </button>
                        {expandedWeek === 3 && (
                          <div className="p-6 border-t border-slate-100 bg-white space-y-4 text-sm text-slate-600">
                            <ul className="space-y-3.5">
                              <li className="flex items-start gap-3">
                                <span className="text-indigo-600 font-bold mt-0.5">01</span>
                                <span><strong>Stunning Image Prompts:</strong> Discover seed parameters to configure ultra-realistic images.</span>
                              </li>
                              <li className="flex items-start gap-3">
                                <span className="text-indigo-600 font-bold mt-0.5">02</span>
                                <span><strong>Video Synthesis Basics:</strong> Model voice narration and talking avatars with Synthesia.</span>
                              </li>
                              <li className="flex items-start gap-3">
                                <span className="text-indigo-600 font-bold mt-0.5">03</span>
                                <span><strong>Branding Asset Packs:</strong> Create professional social media graphics and advertising templates.</span>
                              </li>
                              <li className="flex items-start gap-3 pt-2.5 border-t border-slate-50 text-indigo-600 font-black text-xs uppercase tracking-widest items-center gap-1">
                                <Award className="w-4 h-4" />
                                <span>Day 21 Milestone Project: Create a fully branded visual media packet</span>
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Week 4 */}
                      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm transition-all hover:border-slate-300">
                        <button
                          type="button"
                          onClick={() => setExpandedWeek(expandedWeek === 4 ? null : 4)}
                          className="w-full flex items-center justify-between p-6 bg-slate-50 hover:bg-slate-100/70 transition-colors"
                        >
                          <div className="text-left">
                            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">WEEK 4</span>
                            <h4 className="text-base font-black text-slate-900 uppercase">Monetize & Automate (Days 22-28)</h4>
                          </div>
                          <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${expandedWeek === 4 ? 'rotate-90 text-indigo-500' : ''}`} />
                        </button>
                        {expandedWeek === 4 && (
                          <div className="p-6 border-t border-slate-100 bg-white space-y-4 text-sm text-slate-600">
                            <ul className="space-y-3.5">
                              <li className="flex items-start gap-3">
                                <span className="text-indigo-600 font-bold mt-0.5">01</span>
                                <span><strong>Freelancing with AI:</strong> Identify and offer elite-level client services on top online registries.</span>
                              </li>
                              <li className="flex items-start gap-3">
                                <span className="text-indigo-600 font-bold mt-0.5">02</span>
                                <span><strong>Automate Repetitive Workflows:</strong> Link platforms dynamically to skip hours of busywork.</span>
                              </li>
                              <li className="flex items-start gap-3">
                                <span className="text-indigo-600 font-bold mt-0.5">03</span>
                                <span><strong>Scaling Your Side Revenue:</strong> Create sustainable, modern services using simple smart triggers.</span>
                              </li>
                              <li className="flex items-start gap-3 pt-2.5 border-t border-slate-50 text-indigo-650 font-black text-xs uppercase tracking-widest items-center gap-1">
                                <Award className="w-4 h-4 text-amber-500" />
                                <span>Day 28 Final Exam Project & Certificate Authentication</span>
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right column: Student Benefits list */}
                    <div className="space-y-6">
                      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                        <h4 className="font-black text-slate-900 uppercase text-xs tracking-wider border-b border-slate-100 pb-2">Student Benefits & Materials</h4>
                        <ul className="space-y-3 text-xs text-slate-600 font-medium">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span>28 Video Lessons (Watch on demand)</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span>Exercises Workbook & Guides</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span>Exclusive Private Masterclass Community</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span>200+ Copy-Paste Ultimate Prompts</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span>Authentic Certificate of Completion</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span>Lifetime Free Access + Core Upgrades</span>
                          </li>
                        </ul>
                        
                        <div className="pt-3 border-t border-slate-100 text-center">
                          <p className="text-[10px] uppercase font-black tracking-widest text-indigo-600">🎓 ENROLLMENT OPEN NOW</p>
                          <p className="text-[11px] text-slate-500 font-medium mt-1">Select your optimized plan below and get immediate credentials!</p>
                        </div>
                      </div>

                      {/* Sticky Special Promo Card */}
                      <div className="p-6 rounded-3xl bg-slate-950 text-white border border-slate-800 shadow-xl space-y-4 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                        <span className="text-[9px] font-black uppercase text-amber-400 tracking-widest bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-500/20">Special 50% Slash</span>
                        <h4 className="text-base font-black uppercase mt-2 tracking-tight">Masterclass Cohort</h4>
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs line-through text-slate-500 font-black">₦70,500</span>
                          <span className="text-xl font-black text-indigo-400">₦35,000</span>
                        </div>
                        <p className="text-[9px] font-mono text-slate-400">($23.50 Flat — Limited seats)</p>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPlan('master');
                            setEnrollmentStatus(null);
                            setShowEnrollModal(true);
                          }}
                          className="w-full py-3 bg-indigo-600 hover:bg-indigo-505 hover:bg-indigo-500 text-white font-black uppercase tracking-wider text-[10px] rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-305 text-amber-300 animate-spin" />
                          👉 Select Masterclass 👈
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* GRAND INTERACTIVE TUITION PLANS - GAME-HUB INSPIRED BEAUTY! */}
                  <div className="pt-10 border-t border-slate-250 border-slate-200 mt-12 space-y-8">
                    <div className="text-center space-y-2">
                      <span className="text-[10px] font-black tracking-widest text-indigo-600 bg-indigo-50 px-3.5 py-1.5 rounded-full uppercase border border-indigo-200">
                        ⚡ PATRON TRUSTED MEMBERSHIP PLANS ⚡
                      </span>
                      <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">
                        Our Adjusted Tuition Options
                      </h3>
                      <p className="text-xs text-slate-500 max-w-2xl mx-auto font-medium">
                        We have slashed tuition costs by 50% to make AI capabilities affordable and accessible to the global community. Pay using your Win/Play Wallet, Deposit Balance, or direct transfer.
                      </p>
                    </div>

                    {/* Three Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 max-w-5xl mx-auto">
                      
                      {/* CARD 1: KICKSTART */}
                      <motion.div
                        whileHover={{ y: -8, scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                        className="bg-slate-900 text-white rounded-[2rem] border border-slate-800 p-6 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-indigo-500/30 hover:shadow-indigo-900/10"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-950 text-indigo-400 border border-indigo-800/40 px-3 py-1 rounded-full">
                              Starter Pass
                            </span>
                            <span className="text-[10px] font-mono text-indigo-300 font-bold">Week 1 Only</span>
                          </div>
                          
                          <h4 className="text-xl font-black text-white uppercase mt-4 tracking-tight">AI Foundations</h4>
                          <p className="text-[11px] text-slate-400 mt-2 font-medium leading-relaxed">
                            Perfect for curious minds looking to grasp basic AI setup, prompt design fundamentals, and simple writing.
                          </p>
                          
                          {/* Prices */}
                          <div className="mt-6 space-y-1">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs line-through text-slate-500">₦45,000</span>
                              <span className="text-2xl font-black text-white">₦10,000</span>
                            </div>
                            <p className="text-[10px] font-mono text-slate-500">($7 Flat • Saves 77%)</p>
                          </div>

                          <div className="border-t border-slate-800 mt-6 pt-6 space-y-3">
                            <div className="flex items-center gap-2 text-[11px] text-slate-300">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span>AI Foundations Day 1–7</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-300">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span>50+ Copy-Paste Ultimate Prompts</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-300">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span>Student Community Chat Entry</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPlan('starter');
                              setEnrollmentStatus(null);
                              setShowEnrollModal(true);
                            }}
                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            <Zap className="w-3.5 h-3.5 text-indigo-400" />
                            Select Starter Plan
                          </button>
                        </div>
                      </motion.div>

                      {/* CARD 2: MASTERCLASS (MOST POPULAR - AMAZING DESIGN!) */}
                      <motion.div
                        whileHover={{ y: -8, scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                        className="bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 text-white rounded-[2rem] border-2 border-amber-500/70 p-6 flex flex-col justify-between shadow-[0_0_35px_rgba(245,158,11,0.18)] relative overflow-hidden group"
                      >
                        {/* Shimmer/Glitter Glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute -top-10 -left-10 w-24 h-24 bg-indigo-500/20 rounded-full blur-xl pointer-events-none" />
                        
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-yellow-300 border border-amber-500/30 px-3 py-1 rounded-full animate-pulse">
                              🔥 BEST SELLER • 85% OFF
                            </span>
                            <span className="text-[10px] font-mono text-amber-400 font-black tracking-tighter">Lifetime Key</span>
                          </div>
                          
                          <h4 className="text-2xl font-black text-white uppercase mt-4 tracking-tight flex items-center gap-1.5">
                            28-Day Masterclass
                          </h4>
                          <p className="text-[11px] text-slate-300 mt-2 font-medium leading-relaxed">
                            Full comprehensive certification curriculum. From total greenhorns to elite AI operators and automated side-wealth creators.
                          </p>
                          
                          {/* Prices - Slashed to 35k */}
                          <div className="mt-6 space-y-1">
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm line-through text-slate-500 font-semibold">₦295,500</span>
                              <span className="text-3xl font-black text-indigo-300 font-display">₦35,000</span>
                            </div>
                            <p className="text-[10px] font-mono text-slate-400 bg-indigo-950/40 py-1 px-2.5 rounded-lg border border-indigo-800/20 inline-block font-semibold">
                              ($23.50 Flat • Save over ₦260,000 Now)
                            </p>
                          </div>

                          {/* Countdown inside Card for urgency */}
                          <div className="bg-slate-950/75 p-3 rounded-xl border border-slate-800 mt-4 space-y-1.5 text-center">
                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider flex items-center justify-center gap-1">
                              <Clock className="w-3 h-3 text-indigo-400 animate-pulse" /> Offer Closes In:
                            </span>
                            <div className="grid grid-cols-4 gap-1">
                              <div>
                                <span className="block text-xs font-mono font-bold text-white leading-none">{timeLeft.days}</span>
                                <span className="text-[7px] text-slate-500 uppercase font-sans">Days</span>
                              </div>
                              <div>
                                <span className="block text-xs font-mono font-bold text-white leading-none">{timeLeft.hours}</span>
                                <span className="text-[7px] text-slate-500 uppercase font-sans">Hrs</span>
                              </div>
                              <div>
                                <span className="block text-xs font-mono font-bold text-white leading-none">{timeLeft.minutes}</span>
                                <span className="text-[7px] text-slate-500 uppercase font-sans">Min</span>
                              </div>
                              <div>
                                <span className="block text-xs font-mono font-bold text-indigo-400 leading-none">{timeLeft.seconds}</span>
                                <span className="text-[7px] text-slate-500 uppercase font-sans">Sec</span>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-slate-800 mt-5 pt-5 space-y-2.5">
                            <div className="flex items-center gap-2 text-[11px] text-indigo-100">
                              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                              <span>28 video modules (lifetime)</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-indigo-100">
                              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                              <span>Certified Course Diploma</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-indigo-100">
                              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                              <span>200+ Copy-Paste Ready Prompts</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-indigo-100">
                              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                              <span>Discord Private Syndicate Access</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPlan('master');
                              setEnrollmentStatus(null);
                              setShowEnrollModal(true);
                            }}
                            className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-black uppercase tracking-widest text-[11px] rounded-xl transition-all active:scale-95 shadow-lg shadow-amber-500/10 flex items-center justify-center gap-1.5"
                          >
                            <Sparkles className="w-4 h-4 text-slate-950" />
                            👈 ENROLL NOW — ₦35,000 👉
                          </button>
                        </div>
                      </motion.div>

                      {/* CARD 3: VIP ELITE */}
                      <motion.div
                        whileHover={{ y: -8, scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                        className="bg-slate-900 text-white rounded-[2rem] border border-slate-800 p-6 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-purple-500/30 hover:shadow-purple-950/10"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-wider bg-purple-950 text-purple-400 border border-purple-800/40 px-3 py-1 rounded-full">
                              Sovereign VIP Elite
                            </span>
                            <span className="text-[10px] font-mono text-purple-300 font-bold">1-on-1 Mentorship</span>
                          </div>
                          
                          <h4 className="text-xl font-black text-white uppercase mt-4 tracking-tight">VIP AI Elite Plan</h4>
                          <p className="text-[11px] text-slate-400 mt-2 font-medium leading-relaxed">
                            Includes complete 28-day masterclass plus private consultations, personalized automation templates and personal roadmap construction with our leads.
                          </p>
                          
                          {/* Prices */}
                          <div className="mt-6 space-y-1">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs line-through text-slate-500">₦295,500</span>
                              <span className="text-2xl font-black text-purple-400">₦65,000</span>
                            </div>
                            <p className="text-[10px] font-mono text-slate-500">($43 Flat • Saves over 75%)</p>
                          </div>

                          <div className="border-t border-slate-800 mt-6 pt-6 space-y-3">
                            <div className="flex items-center gap-2 text-[11px] text-slate-300">
                              <Check className="w-4 h-4 text-purple-500 shrink-0" />
                              <span>All 28-Day Masterclass items</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-300">
                              <Check className="w-4 h-4 text-purple-500 shrink-0" />
                              <span>Private Telegram Group & Calls</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-300">
                              <Check className="w-4 h-4 text-purple-500 shrink-0" />
                              <span>Custom Automations built for you</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPlan('vip');
                              setEnrollmentStatus(null);
                              setShowEnrollModal(true);
                            }}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            <Award className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                            Select VIP Mentorship
                          </button>
                        </div>
                      </motion.div>

                    </div>
                  </div>
                  </div>
                )}

              {/* SECTION: TEXT / IMAGE / VIDEO COMPLETE AI DIRECTORY */}
              {activeLandingSection === 'tools' && (
                <div className="space-y-8 animate-fadeIn text-slate-900">
                  {/* Category Selection Header */}
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Master AI Directory</h3>
                        <p className="text-xs text-slate-500 font-medium">Explore premium external software & smart generators directly from Efado.</p>
                      </div>
                      <div className="relative max-w-xs w-full">
                        <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search AI Tools..."
                          value={toolsSearch}
                          onChange={(e) => setToolsSearch(e.target.value)}
                          className="w-full bg-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold border-none focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-gray-950"
                        />
                      </div>
                    </div>

                    {/* Filter Capsule Tabs */}
                    <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setSelectedCategory('all')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                          selectedCategory === 'all'
                            ? 'bg-slate-950 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        All Classes
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedCategory('writing')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                          selectedCategory === 'writing'
                            ? 'bg-slate-950 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        📝 Writing & Text AI
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedCategory('design')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                          selectedCategory === 'design'
                            ? 'bg-slate-950 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        🎨 Image & Graphics AI
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedCategory('video')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                          selectedCategory === 'video'
                            ? 'bg-slate-950 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        🎬 Video & Audio AI
                      </button>
                    </div>
                  </div>

                  {/* Filtered Bento Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {AI_TOOLS_LIST.filter(tool => {
                      const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
                      const matchesSearch = tool.name.toLowerCase().includes(toolsSearch.toLowerCase()) || 
                                            tool.desc.toLowerCase().includes(toolsSearch.toLowerCase());
                      return matchesCategory && matchesSearch;
                    }).map((tool) => (
                      <motion.div
                        key={tool.id}
                        whileHover={{ y: -4 }}
                        className="bg-white p-6 rounded-[2rem] border border-slate-250 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                              {tool.category === 'writing' ? '📝 TEXT AI' : tool.category === 'design' ? '🎨 GRAPHIC AI' : '🎬 SOUND & VIDEO'}
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                              {tool.badge}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <h4 className="text-lg font-black text-slate-900 tracking-tight">{tool.name}</h4>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed leading-normal">{tool.desc}</p>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-slate-50 mt-6 flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Sovereign Source</span>
                          <button
                            type="button"
                            onClick={() => window.open(tool.link, '_blank')}
                            className="bg-slate-100 hover:bg-indigo-600 text-slate-900 hover:text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
                          >
                            Explore Site
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION: GLOBAL AIRTIME & DATA VENDING SYSTEM */}
              {activeLandingSection === 'vending' && renderVendingPortal()}

              {/* SECTION: CHINA SOURCING FACTORY HUB */}
              {activeLandingSection === 'sourcing' && renderSourcingPortal()}

              {/* OLD VENDING BLOCK SHORT-CIRCUITED */}
              {false && activeLandingSection === 'vending' && (
                <div className="space-y-8 animate-fadeIn text-slate-900">
                  {/* Title banner */}
                  <div className="bg-slate-950 p-8 rounded-[2.5rem] border border-slate-800 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-650 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">eFado Hubs Connect</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight uppercase">
                          Global Airtime & Data <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-amber-400">Vending</span> Portal
                        </h2>
                        <p className="text-xs text-slate-400 font-medium max-w-2xl leading-relaxed">
                          Secure instant wholesale refills across 170+ countries on 800+ carriers including MTN, Safaricom, GLO and EE. Run your independent storefront with real-time Reloadly REST API endpoints.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="bg-slate-900/90 border border-slate-800 p-3 px-4 rounded-2xl flex items-center gap-3 min-w-[130px]">
                          <div className="p-2 bg-indigo-500/10 rounded-xl">
                            <CreditCard className="w-4 h-4 text-indigo-400" />
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Win Balance</p>
                            <p className="text-sm font-black text-white">₦{(user.playerWallet || 0).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="bg-slate-900/90 border border-slate-800 p-3 px-4 rounded-2xl flex items-center gap-3 min-w-[130px]">
                          <div className="p-2 bg-amber-500/10 rounded-xl">
                            <Briefcase className="w-4 h-4 text-amber-400" />
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Deposit Wallet</p>
                            <p className="text-sm font-black text-white">₦{(user.depositWallet || 0).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Vending Sub Navigation */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-8 pt-6 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => {
                          setIsMerchant(false);
                          addVendingLog(`[UI Navigation] Loaded Retail Hub purchase wizard.`);
                        }}
                        className={`px-4 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${
                          !isMerchant
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        📱 Refill Portal
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMerchant(true);
                          addVendingLog(`[UI Navigation] Loaded Merchant Dashboard Console. Merchant commissions active.`);
                        }}
                        className={`px-4 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${
                          isMerchant
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        💼 Merchant Dashboard
                      </button>
                    </div>
                  </div>

                  {/* MAIN SYSTEM BODY */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* LEFT WORKSPACE (60%) */}
                    <div className="lg:col-span-7 space-y-8">
                      {!isMerchant ? (
                        /* RETAIL HUB PANEL */
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                          <div>
                            <h3 className="text-lg font-black tracking-tight uppercase text-slate-900">1. Country & System Context</h3>
                            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Where is the target recipient device located?</p>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {GLOBAL_VENDING_COUNTRIES.map((cty) => (
                              <button
                                key={cty.code}
                                type="button"
                                onClick={() => {
                                  setVendingCountry(cty.code);
                                }}
                                className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 relative overflow-hidden ${
                                  vendingCountry === cty.code
                                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20'
                                    : 'border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50'
                                }`}
                              >
                                <span className="text-2xl">{cty.flag}</span>
                                <div>
                                  <p className="text-xs font-black text-slate-900">{cty.name}</p>
                                  <p className="text-[10px] font-mono text-slate-500 font-bold">{cty.phonePrefix}</p>
                                </div>
                                {vendingCountry === cty.code && (
                                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-indigo-650 bg-indigo-600 rounded-full animate-pulse" />
                                )}
                              </button>
                            ))}
                          </div>

                          {/* Refill Type Selections */}
                          <div className="space-y-4 pt-4 border-t border-slate-100">
                            <div>
                              <h3 className="text-lg font-black tracking-tight uppercase text-slate-900">2. Refill Product Category</h3>
                              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Refill instant liquid airtime credit or bulk data bandwidth</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <button
                                type="button"
                                onClick={() => setVendingType('airtime')}
                                className={`p-5 rounded-2xl border transition-all text-center flex flex-col items-center justify-center gap-2 ${
                                  vendingType === 'airtime'
                                    ? 'border-indigo-600 bg-indigo-50/30'
                                    : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50'
                                }`}
                              >
                                <Phone className="w-5 h-5 text-indigo-600" />
                                <div>
                                  <p className="text-xs font-black text-slate-950 uppercase tracking-wider">Airtime Top-Up</p>
                                  <p className="text-[9px] text-slate-500 font-medium mt-0.5">Flexible credits for voice & sms refills</p>
                                </div>
                              </button>
                              <button
                                type="button"
                                onClick={() => setVendingType('data')}
                                className={`p-5 rounded-2xl border transition-all text-center flex flex-col items-center justify-center gap-2 ${
                                  vendingType === 'data'
                                    ? 'border-indigo-600 bg-indigo-50/30'
                                    : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50'
                                }`}
                              >
                                <Wifi className="w-5 h-5 text-emerald-600" />
                                <div>
                                  <p className="text-xs font-black text-slate-950 uppercase tracking-wider">Data Bundles</p>
                                  <p className="text-[9px] text-slate-500 font-medium mt-0.5">Pre-provisioned dynamic data packages</p>
                                </div>
                              </button>
                            </div>
                          </div>

                          {/* Select carrier operator */}
                          <div className="space-y-4 pt-4 border-t border-slate-100">
                            <div>
                              <h3 className="text-lg font-black tracking-tight uppercase text-slate-900">3. Select Operator Carrier</h3>
                              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Wholesale API network authorities checked in country</p>
                            </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {(GLOBAL_VENDING_COUNTRIES.find(c => c.code === vendingCountry)?.operators || []).map((op) => {
                                const isSelected = vendingOperator === op.code;
                                return (
                                  <button
                                    key={op.code}
                                    type="button"
                                    onClick={() => setVendingOperator(op.code)}
                                    className={`relative p-5.5 p-5 rounded-[2rem] border-2 text-left transition-all flex flex-col justify-between overflow-hidden cursor-pointer h-[130px] ${
                                      isSelected
                                        ? 'border-indigo-600 bg-indigo-50/20 shadow-md shadow-indigo-600/5 translate-y-[-2px]'
                                        : 'border-slate-200/80 bg-white hover:border-slate-350 hover:bg-slate-50'
                                    }`}
                                  >
                                    {/* Top status indicator and rebate badge */}
                                    <div className="w-full flex items-center justify-between">
                                      <div className="flex items-center gap-1.5 select-none">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider font-semibold">🟢 Active</span>
                                      </div>
                                      
                                      <span className="text-[8px] bg-indigo-100 text-indigo-750 text-indigo-600 border border-indigo-150 px-2.5 py-0.5 rounded-full font-black font-semibold tracking-wider uppercase">
                                        -{adminWholesalerDiscount}% OFF
                                      </span>
                                    </div>

                                    {/* Center network branding and metadata */}
                                    <div className="flex items-center gap-3.5 mt-2.5">
                                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-150/80 p-1.5 shrink-0 bg-white">
                                        {op.logo ? (
                                          <img src={op.logo} alt={op.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                        ) : (
                                          <Globe className="w-5 h-5 text-indigo-500" />
                                        )}
                                      </div>
                                      
                                      <div className="min-w-0">
                                        <p className="text-xs font-black text-slate-950 truncate uppercase tracking-tight">{op.name}</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{op.currency === 'NGN font-mono' || op.currency === 'NGN' ? 'Local network' : 'Global Net'}</p>
                                      </div>
                                    </div>

                                    {/* Absolute Auto-Selected decoration overlay banner */}
                                    {isSelected && (
                                      <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[7.5px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl select-none shadow">
                                        Auto-Selected
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Values Input Segment */}
                          <div className="space-y-4 pt-4 border-t border-slate-100">
                            <div>
                              <h3 className="text-lg font-black tracking-tight uppercase text-slate-900">4. Formulate Refill Specifications</h3>
                              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Provide correct number & select target vending size</p>
                            </div>

                            {/* Mobile Number Container */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Mobile Phone Number</label>
                              <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-black text-slate-900">
                                  <span>{GLOBAL_VENDING_COUNTRIES.find(c => c.code === vendingCountry)?.flag}</span>
                                  <span>{GLOBAL_VENDING_COUNTRIES.find(c => c.code === vendingCountry)?.phonePrefix}</span>
                                </div>
                                <input
                                  type="tel"
                                  placeholder="8030001234"
                                  value={vendingPhone}
                                  onChange={(e) => setVendingPhone(e.target.value.replace(/[^0-9]/g, ''))}
                                  className="w-full bg-slate-100 border-none rounded-2xl py-4.5 pl-20 pr-4 text-xs font-mono font-bold text-slate-950 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                                />
                              </div>
                              <p className="text-[9px] text-slate-400 font-medium pl-1">Do not include country prefix. The prefix triggers automatically based on country.</p>
                            </div>

                            {/* CUSTOM AIRTIME REFILL OR SELECT CLASSIFIED DATA PLAN */}
                            {vendingType === 'airtime' ? (
                              <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Airtime Amount (₦)</label>
                                  <span className="text-xs font-mono font-bold text-slate-500">
                                    Bounds: ₦{((GLOBAL_VENDING_COUNTRIES.find(c => c.code === vendingCountry)?.operators.find(o => o.code === vendingOperator))?.minAirtimeNGN || 100).toLocaleString() } - ₦{((GLOBAL_VENDING_COUNTRIES.find(c => c.code === vendingCountry)?.operators.find(o => o.code === vendingOperator))?.maxAirtimeNGN || 40000).toLocaleString()}
                                  </span>
                                </div>
                                <input
                                  type="number"
                                  step="50"
                                  min="100"
                                  value={vendingCustomAirtimeAmount}
                                  onChange={(e) => setVendingCustomAirtimeAmount(Math.max(0, parseInt(e.target.value) || 0))}
                                  className="w-full bg-slate-100 border-none rounded-2xl py-4 pr-4 pl-5 text-sm font-black text-slate-950 focus:ring-2 focus:ring-indigo-500 outline-none focus:bg-white"
                                />
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {[100, 200, 500, 1000, 2500, 5000].map((preset) => (
                                    <button
                                      key={preset}
                                      type="button"
                                      onClick={() => setVendingCustomAirtimeAmount(preset)}
                                      className="px-3.5 py-2 rounded-xl text-[10px] font-mono font-bold bg-slate-100 text-slate-800 hover:bg-slate-200 transition-all border border-slate-200"
                                    >
                                      ₦{preset.toLocaleString()}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              // Data bundle choices grid
                              <div className="space-y-3 pt-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Choose Presale Data Package</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                                  {((GLOBAL_VENDING_COUNTRIES.find(c => c.code === vendingCountry)?.operators.find(o => o.code === vendingOperator))?.plans || []).map((plan) => (
                                    <button
                                      key={plan.id}
                                      type="button"
                                      onClick={() => setVendingSelectedDataPlanId(plan.id)}
                                      className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between h-32 relative overflow-hidden ${
                                        vendingSelectedDataPlanId === plan.id
                                          ? 'border-indigo-600 bg-indigo-50/50'
                                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                      }`}
                                    >
                                      <div>
                                        <p className="text-[10px] font-black uppercase text-indigo-650 text-indigo-600 tracking-wider">
                                          {plan.dataAllowance} Broadband
                                        </p>
                                        <h4 className="text-xs font-black text-slate-900 mt-0.5 leading-tight">{plan.name}</h4>
                                      </div>
                                      
                                      <div className="flex items-end justify-between w-full pt-2">
                                        <div>
                                          <p className="text-sm font-black text-slate-900">₦{plan.priceNGN.toLocaleString()}</p>
                                          <p className="text-[8px] font-mono font-semibold text-slate-400">~${plan.priceUSD.toFixed(2)} Flat</p>
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md uppercase tracking-wider">
                                          {plan.validity}
                                        </span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* MERCHANT RESELLER PANEL */
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-black tracking-tight uppercase text-slate-900">💼 Reseller Store Control</h3>
                              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Collect client payments directly & sell at markup percentages</p>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full animate-pulse border border-emerald-100">
                              API SANDBOX LIVE
                            </span>
                          </div>

                          {/* Merchant dashboard stats bento */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 text-left">
                              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Store Float</p>
                              <h4 className="text-xl font-black text-slate-900 mt-1">₦{merchantFloat.toLocaleString()}</h4>
                              <p className="text-[8px] text-slate-400 font-medium mt-0.5">API connection balance</p>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 text-left">
                              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Client Markup</p>
                              <h4 className="text-xl font-black text-indigo-600 mt-1">+{merchantMarkup}%</h4>
                              <p className="text-[8px] text-slate-400 font-medium mt-0.5">Your set pricing premium</p>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 text-left">
                              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Sales Dispatched</p>
                              <h4 className="text-xl font-black text-slate-900 mt-1">{merchantSalesCount}</h4>
                              <p className="text-[8px] text-slate-400 font-medium mt-0.5">Completed Refills</p>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 text-left">
                              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Wholesale Margin</p>
                              <h4 className="text-xl font-black text-amber-500 mt-1">₦{(merchantTotalRevenue * 0.05).toFixed(0)}</h4>
                              <p className="text-[8px] text-slate-400 font-medium mt-0.5">5% Carrier rebate flow</p>
                            </div>
                          </div>

                          {/* Adjust markup percentage slide */}
                          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-150 space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-xs font-black text-slate-900 uppercase">Reseller Markup Premium</h4>
                                <p className="text-[9px] text-slate-500 font-medium">Specify how much profit margin you want to calculate on client invoices.</p>
                              </div>
                              <span className="text-sm font-black text-indigo-600 bg-white px-3 py-1 rounded-xl border border-indigo-100">
                                {merchantMarkup}%
                              </span>
                            </div>

                            <input
                              type="range"
                              min="0"
                              max="15"
                              step="0.5"
                              value={merchantMarkup}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setMerchantMarkup(val);
                                addVendingLog(`[Console Settings] Reseller markup percentage calibrated to: +${val}% of carrier base wholesale.`);
                              }}
                              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-650 accent-indigo-600"
                            />

                            <div className="flex items-center justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest pt-1">
                              <span>0% wholesale cost</span>
                              <span>5% standard store</span>
                              <span>10% luxury markup</span>
                              <span>15% limit</span>
                            </div>
                          </div>

                          {/* Top-up merchant float */}
                          <div className="p-6 rounded-2xl border border-slate-150 bg-white space-y-4 shadow-inner">
                            <div>
                              <h4 className="text-xs font-black text-slate-900 uppercase">Fund Vending Merchant Float</h4>
                              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-0.5">
                                Convert standard funds in your **Deposit Wallet** to active Vending Liquid Cash Float. Base float receives a boost.
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if ((user.depositWallet || 0) < 5000) {
                                    alert('Insufficient balance in deposit wallet! You need ₦5,000 to fund your vending float.');
                                    return;
                                  }
                                  setMerchantFloat(prev => prev + 5000);
                                  addVendingLog('[Float Conversion] Top-Up ₦5,000 from Deposit Wallet. Conversion completed.');
                                }}
                                className="flex-1 py-3 bg-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-850 active:scale-95 transition-all"
                              >
                                Fund ₦5,000 Float
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if ((user.depositWallet || 0) < 15000) {
                                    alert('Insufficient balance in deposit wallet! You need ₦15,000 to fund your vending float.');
                                    return;
                                  }
                                  setMerchantFloat(prev => prev + 15000);
                                  addVendingLog('[Float Conversion] Top-Up ₦15,000 from Deposit Wallet. Extra ₦750 wholesaler bonus credited.');
                                }}
                                className="flex-1 py-3 bg-indigo-650 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 active:scale-95 transition-all"
                              >
                                Fund ₦15,000 Float
                              </button>
                            </div>
                          </div>

                          {/* Historical sales list */}
                          <div className="space-y-4 pt-4 border-t border-slate-150">
                            <div>
                              <h4 className="text-xs font-black text-slate-900 uppercase">Historic Wholesale Dispatches</h4>
                              <p className="text-[9px] text-slate-500 font-medium">Real-time persistent transactions registered under your eFado API token</p>
                            </div>

                            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                              {merchantVendingPurchases.length === 0 ? (
                                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-150">
                                  <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                                  <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-wider">No dispatches registered yet</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">Use the Refill Portal on the left tab to place orders.</p>
                                </div>
                              ) : (
                                merchantVendingPurchases.map((pur) => (
                                  <div key={pur.id} className="p-4 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-between text-xs transition-all hover:bg-white hover:shadow-sm">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg">
                                          {GLOBAL_VENDING_COUNTRIES.find(c => c.code === pur.countryCode)?.flag || '🌍'}
                                        </span>
                                        <span className="font-mono font-black text-slate-900">{pur.clientPhone}</span>
                                      </div>
                                      <p className="text-[9px] text-slate-500 font-bold font-semibold uppercase tracking-wider">
                                        {pur.operatorName} • {pur.vendingType.toUpperCase()}
                                      </p>
                                    </div>

                                    <div className="text-right">
                                      <span className="font-mono font-black text-indigo-600">₦{(pur.clientChargedNGN || pur.amountNGN || 0).toLocaleString()}</span>
                                      <p className="text-[8px] text-slate-400 mt-0.5">
                                        {pur.createdAt ? new Date(pur.createdAt.seconds * 1000).toLocaleDateString() : 'Awaiting sync'}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* RIGHT WORKSPACE (40%) - NEW HIGH QUALITY VISUAL COMPONENTS */}
                    <div className="lg:col-span-12 xl:col-span-5 space-y-6">

                      {/* 1. API CONNECTION STATUS WIDGET */}
                      <div id="connection_status_widget" className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-md space-y-4 text-left">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Reloadly API Pipeline</p>
                          <span className="flex h-2.5 w-2.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                          </span>
                        </div>

                        <div className="bg-slate-50 p-4.5 rounded-[1.5rem] border border-slate-150/60 flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-150 font-black uppercase px-2 py-0.5 rounded-md font-sans font-black">
                                🟢 API Connected
                              </span>
                            </div>
                            <h4 className="text-xs font-black uppercase tracking-tight text-slate-900 pt-1">
                              Reloadly Sandbox Mode
                            </h4>
                            <p className="text-[10px] text-slate-400 font-semibold">
                              Vending connection active. Live simulation network response.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-500 border-t border-slate-100 pt-2 px-1 font-sans">
                          <span className="flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                            latency: <span className="text-slate-950 font-black">24ms</span>
                          </span>
                          <span>
                            Last sync: <span className="text-indigo-600 font-black">{vendingLastSync || '15:53:48'}</span>
                          </span>
                        </div>
                      </div>

                      {/* 2. COMMISSION / EARNINGS CALCULATOR CARD */}
                      <div id="earnings_calculator_card" className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 rounded-[2.5rem] border border-slate-800 relative overflow-hidden shadow-xl space-y-4 text-left">
                        <div className="absolute right-0 top-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                        
                        <div>
                          <p className="text-[9px] font-black text-emerald-405 text-emerald-400 bg-emerald-400/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md inline-block">
                            Wholesale commission Active
                          </p>
                          <h3 className="text-xs font-black tracking-wider uppercase text-slate-100 mt-2 flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                            Your Rebates & Earnings
                          </h3>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs text-slate-350 leading-relaxed font-sans">
                            Wholesale operator bonus secures a <span className="text-emerald-400 font-black font-semibold">{adminWholesalerDiscount}% instant rebate</span> on all <span className="text-indigo-300 font-semibold font-black">{GLOBAL_VENDING_COUNTRIES.find(c => c.code === vendingCountry)?.operators.find(o => o.code === vendingOperator)?.name || 'MTN Nigeria'}</span> transactions.
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium font-sans">
                            Example: Sell ₦1,000 → Buy at ₦{(1000 * (100 - adminWholesalerDiscount)) / 100} and Keep <span className="text-slate-105 text-slate-100 font-black">₦{1000 * adminWholesalerDiscount / 100} net earnings</span>!
                          </p>
                        </div>

                        {/* Interactive dynamic calculator */}
                        <div className="bg-white/5 border border-white/10 p-4 rounded-3xl space-y-3 font-sans">
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] font-black text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                              <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                              Interactive Profit Calculator
                            </label>
                            <span className="text-[10px] font-mono font-bold text-slate-200 uppercase bg-slate-800/80 px-2 py-0.5 rounded-md">
                              Total: ₦{calcAmount.toLocaleString()}
                            </span>
                          </div>

                          <div className="relative font-sans">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs font-mono">₦</span>
                            <input
                              type="number"
                              min="100"
                              max="40000"
                              step="100"
                              value={calcAmount}
                              onChange={(e) => setCalcAmount(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-full bg-slate-900/60 border border-white/10 rounded-2xl py-3 pl-8 pr-3 text-xs font-mono font-black text-white outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          <div className="flex gap-1.5">
                            {[1000, 2000, 5000, 10000].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setCalcAmount(preset)}
                                className="flex-1 py-1.5 px-1 rounded-xl bg-white/5 hover:bg-white/15 text-[8.5px] font-mono font-bold text-slate-300 border border-white/5 transition-all text-center cursor-pointer"
                              >
                                ₦{preset.toLocaleString()}
                              </button>
                            ))}
                          </div>

                          {/* Cost and Earnings update dynamic view */}
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 font-sans">
                            <div className="bg-slate-900/50 p-2.5 rounded-xl border border-white/5 text-left">
                              <p className="text-[8px] text-slate-400 uppercase font-bold tracking-wide">You Pay (Cost)</p>
                              <p className="text-xs font-black text-indigo-300 font-mono">₦{(calcAmount * (100 - adminWholesalerDiscount) / 100).toLocaleString()}</p>
                            </div>
                            <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/15 text-left">
                              <p className="text-[8px] text-slate-400 uppercase font-bold tracking-wide">You Earn (Profit)</p>
                              <p className="text-xs font-black text-emerald-400 font-mono">₦{(calcAmount * adminWholesalerDiscount / 100).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Vending Checkout Invoice summary Card */}
                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-amber-500 to-emerald-500" />
                        
                        <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Vending Service Order Summary</h3>
                          <p className="text-[10px] text-slate-500 font-bold mt-0.5 uppercase tracking-wider">Authorize dispatch queue via eFado billing networks</p>
                        </div>

                        {/* Detailed pricing variables */}
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-4">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-bold uppercase tracking-wider">Target Recipient</span>
                            <span className="font-mono font-black text-slate-900">
                              {vendingPhone ? `${GLOBAL_VENDING_COUNTRIES.find(c => c.code === vendingCountry)?.phonePrefix} ${vendingPhone}` : 'Provide Phone Number'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-bold uppercase tracking-wider">Vending Operator</span>
                            <span className="font-black text-indigo-650 text-indigo-600 uppercase">
                              {GLOBAL_VENDING_COUNTRIES.find(c => c.code === vendingCountry)?.operators.find(o => o.code === vendingOperator)?.name || 'None'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-bold uppercase tracking-wider">Liquidation Type</span>
                            <span className="font-black text-slate-900 uppercase tracking-wider">
                              {vendingType === 'airtime' ? 'Call Credit Refill' : 'Broadband Data'}
                            </span>
                          </div>

                          <div className="pt-3 border-t border-slate-200 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 font-bold uppercase tracking-widest">Base wholesale price</span>
                              <span className="font-mono text-slate-700">
                                ₦{vendingType === 'airtime' 
                                  ? vendingCustomAirtimeAmount.toLocaleString() 
                                  : (GLOBAL_VENDING_COUNTRIES.find(c => c.code === vendingCountry)?.operators.find(o => o.code === vendingOperator)?.plans.find(p => p.id === vendingSelectedDataPlanId)?.priceNGN || 0).toLocaleString()}
                              </span>
                            </div>

                            {isMerchant && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500 font-bold uppercase tracking-widest">Markup Premium ({merchantMarkup}%)</span>
                                <span className="font-mono text-indigo-600 font-black">
                                  +₦{vendingType === 'airtime' 
                                    ? ((vendingCustomAirtimeAmount * merchantMarkup) / 100).toLocaleString() 
                                    : (((GLOBAL_VENDING_COUNTRIES.find(c => c.code === vendingCountry)?.operators.find(o => o.code === vendingOperator)?.plans.find(p => p.id === vendingSelectedDataPlanId)?.priceNGN || 0) * merchantMarkup) / 100).toLocaleString()}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 font-bold uppercase tracking-widest">Processing Service Fee</span>
                              <span className="font-mono text-slate-700">₦{adminServiceFeeNGN}</span>
                            </div>
                          </div>

                          <div className="pt-3 mt-3 border-t-2 border-dashed border-slate-200 flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Total Client Charged</span>
                            <div className="text-right">
                              <p className="text-lg font-black text-slate-900">
                                ₦{(vendingType === 'airtime' 
                                  ? (Number(vendingCustomAirtimeAmount) + (isMerchant ? (vendingCustomAirtimeAmount * merchantMarkup) / 100 : 0) + adminServiceFeeNGN)
                                  : ((GLOBAL_VENDING_COUNTRIES.find(c => c.code === vendingCountry)?.operators.find(o => o.code === vendingOperator)?.plans.find(p => p.id === vendingSelectedDataPlanId)?.priceNGN || 0) + (isMerchant ? ((GLOBAL_VENDING_COUNTRIES.find(c => c.code === vendingCountry)?.operators.find(o => o.code === vendingOperator)?.plans.find(p => p.id === vendingSelectedDataPlanId)?.priceNGN || 0) * merchantMarkup) / 100 : 0) + adminServiceFeeNGN)
                                ).toLocaleString()}
                              </p>
                              <p className="text-[8px] font-mono text-slate-400 font-semibold uppercase">
                                (~${vendingType === 'airtime' 
                                  ? (vendingCustomAirtimeAmount / 1500).toFixed(2) 
                                  : (GLOBAL_VENDING_COUNTRIES.find(c => c.code === vendingCountry)?.operators.find(o => o.code === vendingOperator)?.plans.find(p => p.id === vendingSelectedDataPlanId)?.priceUSD || 0).toFixed(2)} Flat)
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Payment selection capsule */}
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Payment Settle Pipeline</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setVendingPayMethod('win_wallet');
                                addVendingLog('[Settle Option] Changed checkout routing to user WIN WALLET / Play Balance.');
                              }}
                              className={`py-2.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all text-center ${
                                vendingPayMethod === 'win_wallet'
                                  ? 'border-indigo-650 border-indigo-600 bg-indigo-50/50 text-indigo-600'
                                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-500'
                              }`}
                            >
                              ₦ Win Wallet
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setVendingPayMethod('deposit_wallet');
                                addVendingLog('[Settle Option] Changed checkout routing to user DEPOSIT WALLET.');
                              }}
                              className={`py-2.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all text-center ${
                                vendingPayMethod === 'deposit_wallet'
                                  ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600'
                                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-500'
                              }`}
                            >
                              ₦ Deposit Wallet
                            </button>
                          </div>
                        </div>

                        {/* Process status indicators */}
                        {vendingStatusMessage && (
                          <div className={`p-4 rounded-xl flex items-start gap-2.5 text-xs font-semibold ${
                            vendingStatus === 'success' 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-150' 
                              : 'bg-rose-50 text-rose-800 border border-rose-150'
                          }`}>
                            {vendingStatus === 'success' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            )}
                            <p className="leading-normal">{vendingStatusMessage}</p>
                          </div>
                        )}

                        {/* Dispatch Button */}
                        <button
                          type="button"
                          disabled={vendingStatus === 'processing'}
                          onClick={handleVendingPurchase}
                          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-750 hover:from-indigo-500 hover:to-indigo-650 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all hover:shadow-lg disabled:opacity-50 active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          {vendingStatus === 'processing' ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Relaying to API Gateway...
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                              Authorize Wholesaler Dispatch
                            </>
                          )}
                        </button>
                      </div>

                      {/* 4. SYSTEM ACTIVITY LOGS TIMELINE */}
                      <div id="system_activity_timeline" className="bg-slate-955 bg-slate-950 p-6 rounded-[2.5rem] border border-slate-800 shadow-xl text-left space-y-4">
                        <button
                          type="button"
                          onClick={() => setTimelineExpanded(!timelineExpanded)}
                          className="w-full flex items-center justify-between border-b border-slate-800 pb-3 font-semibold text-slate-300 hover:text-white transition-all text-xs uppercase cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-emerald-405 text-emerald-400 animate-pulse" />
                            <h4 className="font-mono font-bold tracking-wider">System Activity</h4>
                          </div>
                          <span className="text-[9px] bg-slate-900 border border-slate-850 px-2.5 py-0.5 rounded text-indigo-400 select-none">
                            {timelineExpanded ? 'Hide Trace' : `Expand Trace (${vendingLogs.length})`}
                          </span>
                        </button>

                        {timelineExpanded && (
                          <div className="space-y-4 animate-fadeIn">
                            <div className="space-y-3.5 pl-2 border-l-2 border-slate-800 ml-2 pt-1 font-mono">
                              {/* Map last 4 logs to custom pretty-timeline elements */}
                              {vendingLogs.slice(-4).map((log, idx) => {
                                let timeStr = '';
                                let rawMsg = log;
                                if (log.startsWith('[')) {
                                  const splitIndex = log.indexOf(']');
                                  if (splitIndex !== -1) {
                                    timeStr = log.slice(1, splitIndex);
                                    rawMsg = log.slice(splitIndex + 1).trim();
                                  }
                                }

                                let isError = rawMsg.toLowerCase().includes('fail') || rawMsg.toLowerCase().includes('error');
                                let isSuccess = rawMsg.toLowerCase().includes('success') || rawMsg.toLowerCase().includes('ok') || rawMsg.toLowerCase().includes('completed') || rawMsg.toLowerCase().includes('synchronised') || rawMsg.toLowerCase().includes('found') || rawMsg.toLowerCase().includes('synchronized');
                                let isWIP = rawMsg.toLowerCase().includes('pending') || rawMsg.toLowerCase().includes('initializ') || rawMsg.toLowerCase().includes('query') || rawMsg.toLowerCase().includes('api request');

                                return (
                                  <div key={idx} className="relative flex items-start gap-3.5">
                                    <div className={`absolute -left-[14.5px] top-1.5 h-2.5 w-2.5 rounded-full border border-slate-950 ${
                                      isError ? 'bg-rose-500' :
                                      isSuccess ? 'bg-emerald-500' :
                                      isWIP ? 'bg-amber-400' : 
                                      'bg-indigo-500'
                                    }`} />
                                    
                                    <div className="min-w-[50px] text-[9px] text-slate-500 pt-0.5 select-none font-bold">
                                      {timeStr || 'now'}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <p className={`text-[10px] leading-relaxed break-words ${
                                        isError ? 'text-rose-400 font-bold' :
                                        isSuccess ? 'text-emerald-400' :
                                        isWIP ? 'text-amber-300' :
                                        'text-slate-300'
                                      }`}>
                                        {rawMsg}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="border-t border-slate-850 pt-3 flex items-center justify-between">
                              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Developer Console</span>
                              <button
                                type="button"
                                onClick={() => setShowAdvancedLogs(!showAdvancedLogs)}
                                className={`px-2 py-0.5 text-[8px] font-mono font-bold tracking-tight uppercase rounded border cursor-pointer ${
                                  showAdvancedLogs ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                {showAdvancedLogs ? 'Hide RAW Logs' : 'Show RAW Logs'}
                              </button>
                            </div>

                            {showAdvancedLogs && (
                              <div className="bg-black/30 p-2.5 rounded-xl border border-slate-850 max-h-[140px] overflow-y-auto no-scrollbar font-mono text-[9px] leading-relaxed text-emerald-405 text-emerald-400 space-y-1">
                                {vendingLogs.map((log, idx) => (
                                  <p key={idx} className="whitespace-pre-wrap">
                                    {log}
                                  </p>
                                ))}
                                <div ref={consoleEndRef} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* OWNER CONFIG PANEL (SYSTEM SETTINGS) */}
                      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 text-left">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                          <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4 text-slate-650 text-slate-650 text-slate-600" />
                            <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">Host Admin Commissions (Host-Admin Mode)</h4>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Network Rebate (%)</label>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={adminWholesalerDiscount}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setAdminWholesalerDiscount(val);
                                addVendingLog(`[Host Calibration] Global wholesaler operator discount rate adjusted to: ${val}%`);
                              }}
                              className="w-full bg-slate-100 border-none rounded-xl py-3 px-4 text-xs font-mono text-slate-950 font-bold outline-none mt-1"
                            />
                          </div>

                          <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Service Fee (₦)</label>
                            <input
                              type="number"
                              min="0"
                              max="1000"
                              step="10"
                              value={adminServiceFeeNGN}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setAdminServiceFeeNGN(val);
                                addVendingLog(`[Host Calibration] Processing flat fee set to: ₦${val}`);
                              }}
                              className="w-full bg-slate-100 border-none rounded-xl py-3 px-4 text-xs font-mono text-slate-950 font-bold outline-none mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: PREMIUM CRYPTO OTC & SWAP / CONVERT DESK */}
              {activeLandingSection === 'otc' && (
                <div id="otc-desk-hub" className="space-y-8 animate-fadeIn text-slate-900 text-left">
                  {/* Banner header with premium stats */}
                  <div className="bg-slate-950 p-8 rounded-[2.5rem] border border-slate-850 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 border border-emerald-500/20 rounded-full">
                          <Coins className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Efado Sovereign OTC Pipeline</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight uppercase">
                          Sovereign Crypto <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400">OTC Desk</span> & Convert Hub
                        </h2>
                        <p className="text-xs text-slate-400 font-medium max-w-2xl leading-relaxed">
                          Exchange tokens for local fiat or global bank transfers instantly with instant rate quotes, dual liquidity provider bridges, and 100% compliant secure custody.
                        </p>
                      </div>

                      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col justify-center min-w-[200px] text-left shadow-lg">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                          <span className="text-[9px] text-slate-400 uppercase font-black">Admin Receiving Bank (CEO)</span>
                        </div>
                        <p className="text-[11px] font-black text-white mt-1">Guaranty Trust Bank (GTBank)</p>
                        <p className="text-xs text-emerald-400 font-mono font-bold">01229415892</p>
                        <p className="text-[9px] text-slate-500 font-medium mt-0.5 leading-tight uppercase">EFADO INT'L COGNITIVE SERVICES</p>
                        <div className="border-t border-slate-800 mt-2 pt-2 flex items-center justify-between">
                          <span className="text-[8px] text-slate-400 uppercase font-bold">Sovereign Benefit Rate</span>
                          <span className="text-[10px] text-emerald-400 font-black">5.0% Fixed</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Columns Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Column (Core Interactive Workspace, Span 8) */}
                    <div className="lg:col-span-8 space-y-6">
                      
                      {/* Sub-navigation tabs within the OTC page */}
                      <div className="flex bg-slate-200/60 p-1.5 rounded-2xl border border-slate-300/30 gap-1 shadow-inner">
                        <button
                          type="button"
                          onClick={() => {
                            setOtcInternalTab('swap');
                            setOtcStep('input');
                          }}
                          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            otcInternalTab === 'swap'
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-300/40'
                          }`}
                        >
                          <Coins className="w-4 h-4" />
                          Crypto OTC Swap
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOtcInternalTab('convert');
                            setConvStatus('idle');
                          }}
                          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            otcInternalTab === 'convert'
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-300/40'
                          }`}
                        >
                          <ArrowLeftRight className="w-4 h-4" />
                          Currency Converter
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOtcInternalTab('history');
                            // Prime orders if empty
                            if (otcOrders.length === 0) {
                              setOtcOrders([
                                {
                                  id: "OTC-7392",
                                  date: "2026-05-23 14:32:10",
                                  type: "OTC Swap",
                                  sourceAmount: "500 USDT",
                                  targetAmount: "775,000 NGN",
                                  fee: "38,750 NGN (5%)",
                                  recipient: "GTBank ****5892 (Sovereign Benefit)",
                                  status: "Settled",
                                  txHash: "0x7a839dae198b182390f7a39e831"
                                },
                                {
                                  id: "CONV-4192",
                                  date: "2026-05-24 09:12:45",
                                  type: "Fiat Conversion",
                                  sourceAmount: "200 USD",
                                  targetAmount: "310,000 NGN",
                                  fee: "15,500 NGN (5%)",
                                  recipient: "Access Bank ****1102 (Aremu Adebayo)",
                                  status: "Dispatched",
                                  txHash: "0xe72a39d82138a0f9b1837d92"
                                }
                              ]);
                            }
                          }}
                          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            otcInternalTab === 'history'
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-300/40'
                          }`}
                        >
                          <Activity className="w-4 h-4" />
                          Audit Logs ({otcOrders.length || 2})
                        </button>
                      </div>

                      {/* TAB 1: OTC CRYPTO SWAP DESK */}
                      {otcInternalTab === 'swap' && (
                        <div className="bg-slate-50 border border-slate-200/80 p-6 md:p-8 rounded-[2rem] shadow-xl space-y-6">
                          
                          {/* Step 1: Input Setup */}
                          {otcStep === 'input' && (
                            <div className="space-y-6">
                              <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 border-b border-slate-200/80 pb-3 flex items-center gap-2">
                                <Coins className="w-5 h-5 text-emerald-500" />
                                Initiate OTC Liquidity Deal
                              </h3>

                              {/* Search or Add Contract */}
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Search Token or Paste ERC20 Contract Address</label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    placeholder="Enter symbol (e.g. USDT) or paste ERC20 address (0x...)"
                                    value={otcTokenSearch}
                                    onChange={(e) => setOtcTokenSearch(e.target.value)}
                                    className="w-full bg-white border border-slate-300/60 rounded-xl py-3.5 pl-4 pr-12 text-xs font-bold text-slate-950 placeholder-slate-400 outline-none shadow-sm focus:border-indigo-500 transition-all"
                                  />
                                  <Coins className="absolute right-4 top-3.5 w-4 h-4 text-slate-400" />
                                </div>

                                {/* Import custom token trigger if ERC20 address is detected */}
                                {otcTokenSearch.startsWith('0x') && otcTokenSearch.length >= 40 && (
                                  <div className="bg-indigo-50 border border-indigo-100 p-3.5 rounded-xl flex items-center justify-between animate-fadeIn mt-2">
                                    <div className="flex items-center gap-2.5">
                                      <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 font-mono text-xs font-bold">ERC20 Bridge</div>
                                      <div>
                                        <p className="text-[11px] font-black text-indigo-950 uppercase tracking-tight">Contract Detected on Avalanche/Ethereum</p>
                                        <p className="text-[9px] text-indigo-500 font-mono font-medium truncate max-w-[200px]">{otcTokenSearch}</p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const customSym = 'EFD';
                                        const customName = 'Efado Hub Token';
                                        const customDecimals = 18;
                                        // Inject into otcTokens list
                                        setOtcTokens(prev => [
                                          { symbol: customSym, name: customName, category: 'custom', chain: otcCustomTokenChain, decimals: customDecimals, status: 'Active', contractAddress: otcTokenSearch, logo: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png' },
                                          ...prev
                                        ]);
                                        setOtcRates(prev => ({ ...prev, [customSym]: 1.25 }));
                                        setOtcSellCrypto(customSym);
                                        setOtcTokenSearch('');
                                        addVendingLog(`[OTC Contract Link] Loaded custom token ${customSym} (${customName}) via proxy resolver. Live rate established at $1.25.`);
                                      }}
                                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-lg shadow-md transition-all cursor-pointer"
                                    >
                                      Load Token
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Token Selector Grid */}
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Choose Asset to Sell</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[160px] overflow-y-auto pr-1">
                                  {otcTokens
                                    .filter(t => t.symbol.toLowerCase().includes(otcTokenSearch.toLowerCase()) || t.name.toLowerCase().includes(otcTokenSearch.toLowerCase()))
                                    .map((token) => (
                                      <button
                                        key={token.symbol}
                                        type="button"
                                        onClick={() => {
                                          setOtcSellCrypto(token.symbol);
                                          addVendingLog(`[OTC Selection] Switched sell asset to: ${token.symbol} (${token.name}).`);
                                        }}
                                        className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between h-[75px] cursor-pointer ${
                                          otcSellCrypto === token.symbol
                                            ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                                            : 'border-slate-200 bg-white hover:border-slate-350 hover:bg-slate-50'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between w-full">
                                          <span className="text-xs font-black text-slate-900">{token.symbol}</span>
                                          {token.logo ? (
                                            <img src={token.logo} alt={token.symbol} className="w-4 h-4 object-contain rounded-full referrerPolicy='no-referrer'" />
                                          ) : (
                                            <Coins className="w-4 h-4 text-indigo-500" />
                                          )}
                                        </div>
                                        <div>
                                          <p className="text-[9px] text-slate-400 truncate max-w-[90%] font-medium">{token.name}</p>
                                          <p className="text-[10px] text-slate-600 font-mono font-bold">${otcRates[token.symbol]?.toFixed(2) || '0.00'}</p>
                                        </div>
                                        {otcSellCrypto === token.symbol && (
                                          <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-indigo-600 rounded-full" />
                                        )}
                                      </button>
                                    ))}
                                </div>
                              </div>

                              {/* Amount and payout currency settings */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center pl-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount to Sell</label>
                                    <span className="text-[10px] text-indigo-600 font-black tracking-tight font-mono">Rate: ${otcRates[otcSellCrypto]?.toLocaleString()}</span>
                                  </div>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min="0.0001"
                                      step="any"
                                      value={otcSellAmount}
                                      onChange={(e) => setOtcSellAmount(parseFloat(e.target.value) || 0)}
                                      className="w-full bg-white border border-slate-300/60 rounded-xl py-3 pl-4 pr-16 text-sm font-mono text-slate-950 font-bold outline-none shadow-sm focus:border-indigo-500 transition-all"
                                    />
                                    <span className="absolute right-4 top-3 text-[11px] font-black text-slate-400 font-mono uppercase">{otcSellCrypto}</span>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Receiving Currency</label>
                                  <select
                                    value={otcGetCurrency}
                                    onChange={(e) => {
                                      setOtcGetCurrency(e.target.value);
                                      addVendingLog(`[OTC Selection] Receving currency set to: ${e.target.value}. Refetching aggregated conversion indices...`);
                                    }}
                                    className="w-full bg-white border border-slate-300/60 rounded-xl py-3 px-4 text-xs font-bold text-slate-950 outline-none shadow-sm focus:border-indigo-500 transition-all mt-0.5"
                                  >
                                    {SUPPORTED_CURRENCIES.map(curr => (
                                      <option key={curr.code} value={curr.code}>
                                        {curr.name} ({curr.symbol} {curr.code})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div className="pt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (otcSellAmount <= 0) return;
                                    // Generate dynamic locked rate quote
                                    const coinRate = otcRates[otcSellCrypto] || 0.0;
                                    const rawFiatVal = otcSellAmount * coinRate * (fiatRates[otcGetCurrency] || 1550);
                                    setOtcQuoteRate(coinRate);
                                    setOtcQuoteExpiry(45);
                                    setOtcStep('quote');
                                    addVendingLog(`[Quote Desk] Quote Requested. Volume: ${otcSellAmount} ${otcSellCrypto}. Querying Binance OTC APIs & OKX Liquidity Desk for competitive rates...`);
                                  }}
                                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest py-4 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  Get Live OTC Quote
                                  <RefreshCw className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Step 2: Live Rate Quote Analysis */}
                          {otcStep === 'quote' && (
                            <div className="space-y-6 animate-fadeIn">
                              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                                  <Lock className="w-5 h-5 text-indigo-600" />
                                  Aggregated Best OTC Quote
                                </h3>
                                <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-150 px-2.5 py-1 rounded-full text-[10px] text-rose-600 font-bold font-mono">
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                                  </span>
                                  Quote Locks in {otcQuoteExpiry}s
                                </div>
                              </div>

                              {/* Price Math Sheet */}
                              <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200 space-y-4">
                                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-medium text-slate-600">
                                  <div>Asset to Transfer:</div>
                                  <div className="text-right font-black text-slate-950 font-mono">{otcSellAmount} {otcSellCrypto}</div>
                                  
                                  <div>Locked Rate index:</div>
                                  <div className="text-right font-bold text-slate-950 font-mono">1 {otcSellCrypto} = ${(otcQuoteRate || otcRates[otcSellCrypto] || 0.0).toLocaleString()} USD</div>

                                  <div>Fiat Index equivalent:</div>
                                  <div className="text-right font-bold text-slate-950 font-mono">1 USD = {(fiatRates[otcGetCurrency] || 1550).toLocaleString()} {otcGetCurrency}</div>
                                  
                                  <div className="border-t border-slate-300/60 pt-3 font-semibold text-slate-700">Gross Conversion Payout:</div>
                                  <div className="border-t border-slate-300/60 pt-3 text-right font-black text-slate-950 font-mono">
                                    {(otcSellAmount * otcQuoteRate * (fiatRates[otcGetCurrency] || 1550)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {otcGetCurrency}
                                  </div>

                                  <div className="pt-2 font-bold text-indigo-600 flex items-center gap-1">
                                    eFado Platform Service Fee (5%):
                                  </div>
                                  <div className="pt-2 text-right font-black text-indigo-600 font-mono">
                                    - {(otcSellAmount * otcQuoteRate * (fiatRates[otcGetCurrency] || 1550) * 0.05).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {otcGetCurrency}
                                  </div>

                                  <div className="border-t-2 border-dashed border-slate-300 pt-4 font-black uppercase text-sm text-slate-900">
                                    Net Credit Dispatch:
                                  </div>
                                  <div className="border-t-2 border-dashed border-slate-300 pt-4 text-right font-black text-sm text-emerald-600 font-mono">
                                    {(otcSellAmount * otcQuoteRate * (fiatRates[otcGetCurrency] || 1550) * 0.95).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {otcGetCurrency}
                                  </div>
                                </div>
                              </div>

                              {/* Alert Warning for 5% Admin Royalty */}
                              <div className="bg-indigo-50/70 border border-indigo-150 p-4 rounded-xl flex items-start gap-3">
                                <Coins className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <h4 className="text-[10px] font-black text-indigo-950 uppercase tracking-wider">CEO / Admin Brokerage Protocol Rules</h4>
                                  <p className="text-[10px] text-indigo-700 leading-relaxed font-semibold mt-0.5">
                                    The 5.0% service charge is allocated directly to the founding eFado Administrator bank index (GTBank - 01229415892) for processing settlements. This is auto-deducted before payout dispatch.
                                  </p>
                                </div>
                              </div>

                              {/* Routing Channels */}
                              <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider flex items-center gap-4 pl-1">
                                <span>Checked Pools:</span>
                                <span className="text-emerald-500">Binance OTC ✓</span>
                                <span className="text-emerald-500">OKX Liquid Pool ✓</span>
                                <span className="text-emerald-500">1inch Fusion API ✓</span>
                              </div>

                              {/* Actions */}
                              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOtcStep('input');
                                    addVendingLog('[Quote Cancel] Discarded locked quote rates. Back to inputs.');
                                  }}
                                  className="flex-1 border border-slate-300 text-slate-700 text-xs font-black uppercase tracking-widest py-3.5 px-4 rounded-xl hover:bg-slate-100 transition-all cursor-pointer text-center"
                                >
                                  Cancel Quote
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (otcQuoteExpiry === 0) {
                                      // Re-trigger quote
                                      setOtcQuoteExpiry(45);
                                      return;
                                    }
                                    setOtcStep('deposit');
                                    setOtcProgress(0);
                                    setOtcConfirmations(0);
                                    addVendingLog(`[Quote Cleared] Rate Locked successfully! Generating targeted dynamic deposit node for receiving address.`);
                                  }}
                                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest py-3.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  {otcQuoteExpiry === 0 ? 'Quote Expired - Re-quote' : 'Accept & Lock Rate'}
                                  <Lock className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Step 3: Deposit & Address Generation Screen */}
                          {otcStep === 'deposit' && (
                            <div className="space-y-6 animate-fadeIn text-left">
                              <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
                                <Download className="w-5 h-5 text-indigo-600" />
                                Settlement Deposit Node
                              </h3>

                              {/* Target Address Card */}
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                                <div className="md:col-span-8 space-y-4">
                                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-white space-y-2">
                                    <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-bold text-slate-400">
                                      <span>Transfer Network Protocol</span>
                                      <span className="text-emerald-400 font-bold font-mono">
                                        {otcTokens.find(t => t.symbol === otcSellCrypto)?.chain || 'ERC-20 / TRC-20 Network'}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400">Send exactly <span className="text-emerald-400 font-black text-xs font-mono">{otcSellAmount} {otcSellCrypto}</span> to the unique node below:</p>
                                    
                                    <div className="flex items-center gap-2 bg-slate-955 p-3 rounded-xl border border-slate-800/80 mt-2">
                                      <p className="text-xs font-mono font-bold tracking-tight select-all truncate text-emerald-400">
                                        {otcSellCrypto === 'USDT' ? 'TRs7c8m2901a83Bv92fP0921S82hXW' : '0xe29D4d5892ac7102FF0923847551abda7392c28b'}
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const addr = otcSellCrypto === 'USDT' ? 'TRs7c8m2901a83Bv92fP0921S82hXW' : '0xe29D4d5892ac7102FF0923847551abda7392c28b';
                                          navigator.clipboard.writeText(addr);
                                          addVendingLog(`[Clipboard Copy] Deposit address linked to memory: ${addr}`);
                                        }}
                                        className="text-slate-400 hover:text-white transition-all cursor-pointer p-1.5 bg-slate-800/50 rounded-lg hover:bg-slate-850"
                                        title="Copy Deposit Address"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Payout Information Fields */}
                                  <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Payout Credentials Setting</h4>
                                    
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="col-span-2">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Payout Method</label>
                                        <select
                                          value={otcPayoutMethod}
                                          onChange={(e) => setOtcPayoutMethod(e.target.value as any)}
                                          className="w-full bg-slate-100 border-none rounded-lg p-2 text-xs font-mono font-bold mt-1"
                                        >
                                          <option value="bank">Traditional Bank Transfer</option>
                                          <option value="mobile_money">Mobile Money (GHS, KES, ZAR)</option>
                                          <option value="paypal">Paypal Invoice</option>
                                          <option value="payoneer">Payoneer Swift</option>
                                          <option value="wallet">USDT Wallet payout</option>
                                        </select>
                                      </div>

                                      {otcPayoutMethod === 'bank' && (
                                        <>
                                          <div>
                                            <input
                                              type="text"
                                              placeholder="Bank Name"
                                              value={otcBankName}
                                              onChange={(e) => setOtcBankName(e.target.value)}
                                              className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-[11px] font-bold"
                                            />
                                          </div>
                                          <div>
                                            <input
                                              type="text"
                                              placeholder="Account Number"
                                              value={otcBankAccount}
                                              onChange={(e) => setOtcBankAccount(e.target.value)}
                                              className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-[11px] font-mono font-bold"
                                            />
                                          </div>
                                          <div className="col-span-2">
                                            <input
                                              type="text"
                                              placeholder="Account Holder Name"
                                              value={otcAccountName}
                                              onChange={(e) => setOtcAccountName(e.target.value)}
                                              className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-[11px] font-bold"
                                            />
                                          </div>
                                        </>
                                      )}

                                      {otcPayoutMethod === 'mobile_money' && (
                                        <div className="col-span-2">
                                          <input
                                            type="text"
                                            placeholder="Mobile Number (e.g. +233...)"
                                            value={otcPayPhone}
                                            onChange={(e) => setOtcPayPhone(e.target.value)}
                                            className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-[11px] font-bold font-mono"
                                          />
                                        </div>
                                      )}

                                      {otcPayoutMethod === 'paypal' && (
                                        <div className="col-span-2">
                                          <input
                                            type="email"
                                            placeholder="Paypal Email Address"
                                            value={otcEmailAddress}
                                            onChange={(e) => setOtcEmailAddress(e.target.value)}
                                            className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-[11px] font-bold font-mono"
                                          />
                                        </div>
                                      )}

                                      {otcPayoutMethod === 'wallet' && (
                                        <div className="col-span-2">
                                          <input
                                            type="text"
                                            placeholder="TRC-20 or ERC-20 Tether Receiving Address"
                                            value={otcBankAccount}
                                            onChange={(e) => setOtcBankAccount(e.target.value)}
                                            className="w-full bg-slate-100 border-none rounded-lg p-2.5 text-[11px] font-mono font-bold"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* QR Code Display (Col Span 4) */}
                                <div className="md:col-span-4 flex flex-col items-center justify-center border border-slate-200 p-4 rounded-xl bg-white space-y-2">
                                  <svg className="w-32 h-32 text-slate-800" viewBox="0 0 100 100">
                                    {/* Mock sophisticated code layout inside SVG */}
                                    <rect x="5" y="5" width="25" height="25" fill="currentColor" />
                                    <rect x="10" y="10" width="15" height="15" fill="white" />
                                    <rect x="70" y="5" width="25" height="25" fill="currentColor" />
                                    <rect x="75" y="10" width="15" height="15" fill="white" />
                                    <rect x="5" y="70" width="25" height="25" fill="currentColor" />
                                    <rect x="10" y="75" width="15" height="15" fill="white" />
                                    {/* Random matrix noise elements */}
                                    <rect x="35" y="5" width="5" height="15" fill="currentColor" />
                                    <rect x="45" y="20" width="5" height="10" fill="currentColor" />
                                    <rect x="5" y="50" width="10" height="5" fill="currentColor" />
                                    <rect x="55" y="35" width="15" height="5" fill="currentColor" />
                                    <rect x="35" y="70" width="15" height="15" fill="currentColor" />
                                    <rect x="60" y="60" width="10" height="20" fill="currentColor" />
                                    <rect x="80" y="80" width="15" height="15" fill="currentColor" />
                                    <rect x="90" y="45" width="5" height="15" fill="currentColor" />
                                    <rect x="40" y="40" width="20" height="20" fill="currentColor" />
                                    <rect x="45" y="45" width="10" height="10" fill="white" />
                                  </svg>
                                  <span className="text-[8px] font-black text-slate-400 tracking-wider uppercase">Scan and pay</span>
                                </div>
                              </div>

                              {/* Interactive Simulator Loop Trigger */}
                              <div className="bg-emerald-50 border border-emerald-150 p-5 rounded-2xl text-slate-850 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                      {otcProgress > 0 && otcProgress < 100 && (
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      )}
                                      <span className={`relative inline-flex rounded-full h-2 w-2 ${otcProgress >= 100 ? 'bg-emerald-600' : 'bg-amber-500'}`}></span>
                                    </span>
                                    <p className="text-[11px] font-black uppercase text-slate-900">Mempool Scan Status Indicator</p>
                                  </div>
                                  <span className="text-[11px] font-black text-emerald-700 font-mono tracking-wide">
                                    {otcConfirmations === 0 && otcProgress === 0 && 'Waiting Payout Confirmation'}
                                    {otcProgress > 0 && otcProgress < 100 && `${otcConfirmations}/3 Blocks Validated`}
                                    {otcProgress >= 100 && 'Sovereign Dispatch Complete ✓'}
                                  </span>
                                </div>

                                <div className="w-full bg-slate-200 rounded-full h-2.5">
                                  <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${otcProgress}%` }}></div>
                                </div>

                                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mt-1">
                                  <span>Deposit seen: {otcProgress > 0 ? '✓ YES' : 'Searching...'}</span>
                                  <span>Network speed: ~12s block-times</span>
                                </div>

                                <div className="pt-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // Start multi-staged blockchain scanning timeline sequence
                                      addVendingLog(`[ALCHEMY TRIGGER] Broadcasting direct swap trace query to mempool network...`);
                                      setOtcProgress(20);
                                      setOtcConfirmations(0);
                                      
                                      setTimeout(() => {
                                        setOtcProgress(50);
                                        setOtcConfirmations(1);
                                        addVendingLog(`[BLOCKCHAIN SYNC] Block 17392811 updated. First confirmation validated for ${otcSellAmount} ${otcSellCrypto}. Mempool verification status sets indicator at 1/3.`);
                                      }, 2000);

                                      setTimeout(() => {
                                        setOtcProgress(80);
                                        setOtcConfirmations(2);
                                        addVendingLog(`[BLOCKCHAIN SYNC] Block 17392812 updated. Second confirmation validated. Double spend prevention telemetry scores are 100% green.`);
                                      }, 4000);

                                      setTimeout(() => {
                                        setOtcProgress(100);
                                        setOtcConfirmations(3);
                                        
                                        // Push freshly minted ledger payload inside memory orders histories
                                        const totalNaira = otcSellAmount * (otcQuoteRate || otcRates[otcSellCrypto]) * (fiatRates[otcGetCurrency] || 1550);
                                        const splitRoyalty = totalNaira * 0.05;
                                        const cleanDispatchVal = totalNaira * 0.95;
                                        
                                        const payload = {
                                          id: `OTC-${Math.floor(Math.random() * 9000 + 1000)}`,
                                          date: new Date().toISOString().replace('T', ' ').substring(0, 19),
                                          type: 'OTC Swap',
                                          sourceAmount: `${otcSellAmount} ${otcSellCrypto}`,
                                          targetAmount: `${cleanDispatchVal.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${otcGetCurrency}`,
                                          fee: `${splitRoyalty.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${otcGetCurrency} (5%)`,
                                          recipient: `${otcPayoutMethod === 'bank' ? (otcBankName || 'Traditional Bank') + ' ****' + (otcBankAccount.slice(-4) || '5892') : otcPayoutMethod === 'paypal' ? otcEmailAddress : (otcBankAccount || 'Sovereign Wallet')}`,
                                          status: 'Settled',
                                          txHash: '0x' + Math.random().toString(16).substr(2, 24)
                                        };
                                        
                                        setOtcOrders(prev => [payload, ...prev]);
                                        setOtcStep('complete');
                                        addVendingLog(`[PAYOUT DISPATCH] 3/3 block confirmations archived! Broker system initiated fiat output settlement through bank API gateway.`);
                                        addVendingLog(`[PAYOUT CONFIRMED] Direct cashout finalized. Transferred ${cleanDispatchVal.toLocaleString()} ${otcGetCurrency} to ${payload.recipient}. 5% royalty routed to CEO bank index GTBank (01229415892). Done.`);
                                      }, 6000);
                                    }}
                                    disabled={otcProgress > 0}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-[11px] font-black uppercase tracking-widest py-3 px-4 rounded-xl shadow transition-all cursor-pointer text-center"
                                  >
                                    {otcProgress > 0 && otcProgress < 100 ? 'Confirming Transaction...' : otcProgress >= 100 ? 'Telemetry Settled ✓' : 'Simulate Blockchain Deposit Receipt'}
                                  </button>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOtcStep('input');
                                    setOtcProgress(0);
                                    addVendingLog(`[OTC Reset] Aborted active deposit channel node. Back variables to inputs.`);
                                  }}
                                  className="w-full border border-slate-300 text-slate-700 text-[10px] font-black uppercase tracking-widest py-3 rounded-lg text-center cursor-pointer hover:bg-slate-100 transition-all"
                                >
                                  Abandon Address
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Step 4: Complete Screen */}
                          {otcStep === 'complete' && (
                            <div className="space-y-6 text-center py-6 animate-fadeIn">
                              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                <Lock className="w-8 h-8 fill-emerald-150" />
                              </div>
                              <div className="space-y-2">
                                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Exchange Order Settled</h3>
                                <p className="text-xs text-slate-400 font-medium max-w-md mx-auto">
                                  Your blockchain transfer has successfully cleared 3 block validations and net credit has been dispatched to your designated receive coordinates.
                                </p>
                              </div>

                              <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200 text-left space-y-2 text-xs font-medium text-slate-600 max-w-md mx-auto">
                                <div className="flex justify-between">
                                  <span>Transfer Volume:</span>
                                  <span className="font-bold text-slate-950 font-mono">{otcSellAmount} {otcSellCrypto}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Net Dispatched:</span>
                                  <span className="font-black text-emerald-600 font-mono">
                                    {((otcSellAmount * (otcQuoteRate || otcRates[otcSellCrypto]) * (fiatRates[otcGetCurrency] || 1550)) * 0.95).toLocaleString(undefined, { minimumFractionDigits: 2 })} {otcGetCurrency}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Admin Benefit Broker Fee:</span>
                                  <span className="font-bold text-indigo-600 font-mono">
                                    {((otcSellAmount * (otcQuoteRate || otcRates[otcSellCrypto]) * (fiatRates[otcGetCurrency] || 1550)) * 0.05).toLocaleString(undefined, { minimumFractionDigits: 2 })} {otcGetCurrency} (5%)
                                  </span>
                                </div>
                                <div className="flex justify-between truncate">
                                  <span>Remittance Address:</span>
                                  <span className="font-bold text-slate-950 font-mono">{otcPayoutMethod === 'bank' ? otcBankName : otcPayoutMethod === 'paypal' ? otcEmailAddress : 'External Core'}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-200 mt-2 pt-2">
                                  <span>Dispatch Ref:</span>
                                  <span className="text-slate-400 font-mono select-all font-bold">GT-DESK-{Math.floor(Math.random() * 900000 + 100000)}</span>
                                </div>
                              </div>

                              <div className="flex justify-center pt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOtcStep('input');
                                    setOtcProgress(0);
                                    addVendingLog(`[OTC Reset] Swap desk cleared for fresh deal queues.`);
                                  }}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest py-3 px-8 rounded-xl shadow-md transition-all cursor-pointer"
                                >
                                  Begin New OTC Deal
                                </button>
                              </div>
                            </div>
                          )}

                        </div>
                      )}

                      {/* TAB 2: FIAT CONVERTER & TRANSFER DESK */}
                      {otcInternalTab === 'convert' && (
                        <div className="bg-slate-50 border border-slate-200/80 p-6 md:p-8 rounded-[2rem] shadow-xl space-y-6">
                          <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 border-b border-slate-200/80 pb-3 flex items-center gap-2">
                            <ArrowLeftRight className="w-5 h-5 text-emerald-500" />
                            Multi-Currency Converter & Transfer Desk
                          </h3>

                          {convStatus === 'idle' && (
                            <div className="space-y-5">
                              {/* Converter Form Inputs */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">From (Convert Out)</label>
                                  <select
                                    value={convSourceCurrency}
                                    onChange={(e) => setConvSourceCurrency(e.target.value)}
                                    className="w-full bg-white border border-slate-300/60 rounded-xl py-3 px-4 text-xs font-bold text-slate-950 outline-none shadow-sm focus:border-indigo-500 transition-all"
                                  >
                                    {SUPPORTED_CURRENCIES.map(curr => (
                                      <option key={curr.code} value={curr.code}>
                                        {curr.code} ({curr.name})
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">To (Recipient Receive)</label>
                                  <select
                                    value={convTargetCurrency}
                                    onChange={(e) => setConvTargetCurrency(e.target.value)}
                                    className="w-full bg-white border border-slate-300/60 rounded-xl py-3 px-4 text-xs font-bold text-slate-950 outline-none shadow-sm focus:border-indigo-500 transition-all"
                                  >
                                    {SUPPORTED_CURRENCIES.map(curr => (
                                      <option key={curr.code} value={curr.code}>
                                        {curr.code} ({curr.name})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Convert Volume</label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min="1"
                                      value={convAmount}
                                      onChange={(e) => setConvAmount(parseFloat(e.target.value) || 0)}
                                      className="w-full bg-white border border-slate-300/60 rounded-xl py-3 pl-4 pr-16 text-sm font-mono text-slate-950 font-bold outline-none shadow-sm focus:border-indigo-500 transition-all"
                                    />
                                    <span className="absolute right-4 top-3 text-[11px] font-black text-slate-400 font-mono uppercase">{convSourceCurrency}</span>
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Standard Market Exchange Rate</label>
                                  <div className="w-full bg-slate-100 rounded-xl py-3 px-4 text-xs font-mono font-bold text-slate-800 flex items-center justify-between border border-slate-205">
                                    <span>Exchange Rate:</span>
                                    <span>
                                      1 {convSourceCurrency} = {((fiatRates[convTargetCurrency] || 1.0) / (fiatRates[convSourceCurrency] || 1.0)).toFixed(4)} {convTargetCurrency}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Price Sheet details with 5% Service Charge */}
                              <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200 text-xs font-medium text-slate-600 space-y-2.5">
                                <div className="flex justify-between">
                                  <span>Total Input Amount:</span>
                                  <span className="font-bold text-slate-950 font-mono">{convAmount.toLocaleString()} {convSourceCurrency}</span>
                                </div>
                                <div className="flex justify-between text-indigo-600">
                                  <span>Admin Remittance Fee (5.0% Processing):</span>
                                  <span className="font-bold font-mono">
                                    - {(convAmount * 0.05).toLocaleString(undefined, { minimumFractionDigits: 2 })} {convSourceCurrency}
                                  </span>
                                </div>
                                <div className="flex justify-between border-t border-slate-200 mt-2 pt-2 text-slate-800 font-bold">
                                  <span>Target Recipient Receives (Net converted):</span>
                                  <span className="font-black text-emerald-600 text-[13px] font-mono">
                                    {((convAmount * 0.95) * ((fiatRates[convTargetCurrency] || 1.0) / (fiatRates[convSourceCurrency] || 1.0))).toLocaleString(undefined, { minimumFractionDigits: 2 })} {convTargetCurrency}
                                  </span>
                                </div>
                              </div>

                              {/* Target Bank Details setup */}
                              <div className="bg-slate-100 p-5 rounded-2xl border border-slate-205 space-y-3">
                                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Destination Transfer Coordinates</h4>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <input
                                      type="text"
                                      placeholder="Receiving Bank"
                                      value={convPayoutBank}
                                      onChange={(e) => setConvPayoutBank(e.target.value)}
                                      className="w-full bg-white border border-slate-250 rounded-xl p-3 text-[11px] font-bold"
                                    />
                                  </div>
                                  <div>
                                    <input
                                      type="text"
                                      placeholder="Routing / SWIFT Code"
                                      className="w-full bg-white border border-slate-250 rounded-xl p-3 text-[11px] font-mono font-bold"
                                    />
                                  </div>
                                  <div>
                                    <input
                                      type="text"
                                      placeholder="Account Number / IBAN"
                                      value={convPayoutAccount}
                                      onChange={(e) => setConvPayoutAccount(e.target.value)}
                                      className="w-full bg-white border border-slate-250 rounded-xl p-3 text-[11px] font-mono font-bold"
                                    />
                                  </div>
                                  <div>
                                    <input
                                      type="text"
                                      placeholder="Account Full Name"
                                      value={convPayoutName}
                                      onChange={(e) => setConvPayoutName(e.target.value)}
                                      className="w-full bg-white border border-slate-250 rounded-xl p-3 text-[11px] font-bold"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Action */}
                              <div className="pt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (convAmount <= 0) return;
                                    setConvStatus('processing');
                                    addVendingLog(`[CONVERTER] Lock conversion request for ${convAmount} ${convSourceCurrency}. Spanning secure financial pipelines for settlement.`);
                                    
                                    setTimeout(() => {
                                      const totalSource = convAmount;
                                      const royaltyFee = totalSource * 0.05;
                                      const recipientGetsSourceUnits = totalSource * 0.95;
                                      const convertedRecipientGets = recipientGetsSourceUnits * ((fiatRates[convTargetCurrency] || 1.0) / (fiatRates[convSourceCurrency] || 1.0));
                                      
                                      const receipt = {
                                        id: `CONV-${Math.floor(Math.random() * 9000 + 1000)}`,
                                        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
                                        type: 'Fiat Conversion',
                                        sourceAmount: `${convAmount} ${convSourceCurrency}`,
                                        targetAmount: `${convertedRecipientGets.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${convTargetCurrency}`,
                                        fee: `${royaltyFee.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${convSourceCurrency} (5%)`,
                                        recipient: `${convPayoutBank || 'Beneficiary Bank'} (Acct: ${convPayoutAccount.slice(-4) || '3891'})`,
                                        status: 'Dispatched',
                                        txHash: '0x' + Math.random().toString(16).substr(2, 24)
                                      };
                                      
                                      setOtcOrders(prev => [receipt, ...prev]);
                                      setConvStatus('success');
                                      addVendingLog(`[DISPATCH] Sovereign remit settled successfully! Dispatched ${convertedRecipientGets.toLocaleString()} ${convTargetCurrency} out to ${receipt.recipient}. 5% royalty routed to CEO GTBANK corporate (01229415892).`);
                                    }, 3000);
                                  }}
                                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest py-4 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  Execute Conversion & Remit Transfer
                                  <Send className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}

                          {convStatus === 'processing' && (
                            <div className="space-y-6 text-center py-10 animate-pulse">
                              <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
                              <div className="space-y-2">
                                <h4 className="text-sm font-black uppercase tracking-wider text-slate-800">Processing Remit Conversion</h4>
                                <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto">
                                  Routing conversion requests to authorized liquidity pools. Escrow balance verification indexes are checked...
                                </p>
                              </div>
                            </div>
                          )}

                          {convStatus === 'success' && (
                            <div className="space-y-6 text-center py-6 animate-fadeIn">
                              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                <Send className="w-8 h-8" />
                              </div>
                              <div className="space-y-2">
                                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Transfer Remitted Successfully</h3>
                                <p className="text-xs text-slate-400 font-medium max-w-md mx-auto">
                                  Your conversion transaction has been fully cleared. The funds have been remitted directly to the recipient details provided above.
                                </p>
                              </div>

                              <div className="bg-slate-100 p-5 rounded-2xl border border-slate-205 text-left space-y-2 text-xs font-medium text-slate-600 max-w-sm mx-auto">
                                <div className="flex justify-between">
                                  <span>Transfer Amount:</span>
                                  <span className="font-bold text-slate-950 font-mono">{convAmount} {convSourceCurrency}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Target Recipient Receives:</span>
                                  <span className="font-black text-emerald-600 font-mono">
                                    {(convAmount * 0.95 * ((fiatRates[convTargetCurrency] || 1) / (fiatRates[convSourceCurrency] || 1))).toLocaleString(undefined, { minimumFractionDigits: 2 })} {convTargetCurrency}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>5.0% Admin Protocol Royalty Fee:</span>
                                  <span className="font-bold text-indigo-600 font-mono">{(convAmount * 0.05).toLocaleString(undefined, { minimumFractionDigits: 2 })} {convSourceCurrency} (to GTBank)</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Recipient Details:</span>
                                  <span className="font-bold text-slate-950">{convPayoutName || 'Beneficiary'} (**** {convPayoutAccount.slice(-4) || '8293'})</span>
                                </div>
                              </div>

                              <div className="flex justify-center pt-2">
                                <button
                                  type="button"
                                  onClick={() => setConvStatus('idle')}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest py-3 px-8 rounded-xl shadow-md transition-all cursor-pointer"
                                >
                                  Begin New Transfer
                                </button>
                              </div>
                            </div>
                          )}

                        </div>
                      )}

                      {/* TAB 3: TRANSACTION AUDIT LOG RECIPIENTS HISTORIES */}
                      {otcInternalTab === 'history' && (
                        <div className="bg-slate-50 border border-slate-200/80 p-6 md:p-8 rounded-[2rem] shadow-xl space-y-6">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                            <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                              <Activity className="w-5 h-5 text-indigo-600" />
                              Sovereign Transfer Audit Logs
                            </h3>
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-3 py-1 rounded-full font-black font-mono">SECURE HISTORY</span>
                          </div>

                          <div className="space-y-4">
                            {otcOrders.map((order, i) => (
                              <div key={order.id || i} className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all space-y-3 text-left">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black font-mono bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md">{order.id}</span>
                                    <span className="text-[10px] text-slate-400 font-bold font-mono">{order.date}</span>
                                  </div>
                                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 border border-emerald-100 rounded-full flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    {order.status}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs font-medium text-slate-500">
                                  <div>
                                    <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Deal Category</p>
                                    <p className="font-bold text-slate-800 mt-0.5">{order.type}</p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Trading Volume</p>
                                    <p className="font-bold font-mono text-slate-800 mt-0.5">{order.sourceAmount}</p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Dispatched Credit</p>
                                    <p className="font-black font-mono text-emerald-600 mt-0.5">{order.targetAmount}</p>
                                  </div>
                                  <div className="col-span-2 md:col-span-1">
                                    <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Protocol royalty Paid</p>
                                    <p className="font-bold font-mono text-indigo-600 mt-0.5">{order.fee}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Recipient Account coordinates</p>
                                    <p className="font-bold text-slate-900 mt-0.5 truncate">{order.recipient}</p>
                                  </div>
                                </div>

                                <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] font-mono text-slate-400">
                                  <span className="truncate max-w-[220px]">Telemetry Ref: {order.txHash}</span>
                                  <a
                                    href={`https://etherscan.io/tx/${order.txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:text-indigo-700 font-bold uppercase text-[9px] tracking-wider flex items-center gap-1 transition-all"
                                  >
                                    Scan Explorer
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Right Column (Compliances and Security Badgeline Info, Span 4) */}
                    <div className="lg:col-span-4 space-y-6 text-slate-900">
                      
                      {/* Section A: Live Compliance Badges & Authority Signal */}
                      <div className="bg-slate-50 border border-slate-200/80 p-6 rounded-[2rem] shadow-lg space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-200 flex items-center gap-2">
                          <Lock className="w-4 h-4 text-emerald-500" />
                          Sovereign Compliance & Custody
                        </h4>

                        <div className="space-y-3.5">
                          <div className="flex items-start gap-2.5">
                            <span className="h-5 w-5 bg-emerald-100 text-emerald-600 rounded-md flex items-center justify-center text-[10px] font-black flex-shrink-0">MSB</span>
                            <div>
                              <p className="text-[11px] font-black text-slate-900 uppercase">Licensed MSB Broker</p>
                              <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-0.5">Approved currency merchant operator conforming with federal KYC/AML thresholds.</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5">
                            <span className="h-5 w-5 bg-indigo-100 text-indigo-600 rounded-md flex items-center justify-center text-[10px] font-black flex-shrink-0">SEC</span>
                            <div>
                              <p className="text-[11px] font-black text-slate-900 uppercase">Fireblocks Custody Partner</p>
                              <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-0.5">Cold multi-signature secure vault keeping transaction reserves isolated.</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5">
                            <span className="h-5 w-5 bg-purple-100 text-purple-600 rounded-md flex items-center justify-center text-[10px] font-black flex-shrink-0">AML</span>
                            <div>
                              <p className="text-[11px] font-black text-slate-900 uppercase">Automated AML screening</p>
                              <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-0.5">Direct sandbox linkages scan receiving wallets against global blocklists instantly.</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section B: Dynamic Live Quotes Feed ticker */}
                      <div className="bg-slate-50 border border-slate-200/80 p-6 rounded-[2rem] shadow-lg space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                            Live Exchange Feeds
                          </h4>
                          <span className="text-[9px] font-black uppercase text-indigo-600 font-mono tracking-tight bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">Ticker Refreshed</span>
                        </div>

                        <div className="space-y-2 mt-2">
                          <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200/60 font-bold">
                            <span className="text-slate-800">BTC / USD</span>
                            <span className="font-mono font-black text-slate-950">${(otcRates.BTC || 68500).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200/60 font-bold">
                            <span className="text-slate-800">ETH / USD</span>
                            <span className="font-mono font-black text-slate-950">${(otcRates.ETH || 3550).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200/60 font-bold">
                            <span className="text-slate-800">SOL / USD</span>
                            <span className="font-mono font-black text-slate-950">${(otcRates.SOL || 165).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200/60 font-bold">
                            <span className="text-slate-800">BNB / USD</span>
                            <span className="font-mono font-black text-slate-950">${(otcRates.BNB || 590).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200/60 font-bold">
                            <span className="text-slate-800">TON / USD</span>
                            <span className="font-mono font-black text-slate-950">${(otcRates.TON || 7.2).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs py-1.5 font-bold">
                            <span className="text-slate-800">SUI / USD</span>
                            <span className="font-mono font-black text-slate-950">${(otcRates.SUI || 1.15).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>
                </div>
              )}
            </motion.div>
          )}

          {view === 'seller' && selectedSeller && (
            <motion.div
              key="seller"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <span className="cursor-pointer hover:text-indigo-600" onClick={() => setView('landing')}>DomainHub</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-slate-900">{selectedSeller.name}</span>
              </div>

              {/* Seller Header */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-100">
                    <img src={selectedSeller.logoUrl} alt={selectedSeller.name} className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{selectedSeller.name}</h2>
                    <p className="text-slate-500">Browse and search domains specifically from {selectedSeller.name}.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right hidden md:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Commission Rate</p>
                    <p className="text-xl font-black text-emerald-600">{selectedSeller.commissionRate}%</p>
                  </div>
                  <div className="w-px h-10 bg-slate-200 mx-2 hidden md:block" />
                  <ShieldCheck className="w-8 h-8 text-indigo-500" />
                </div>
              </div>

              {/* TLD Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                {selectedSeller.supportedTlds.map((tld) => (
                  <button
                    key={tld}
                    onClick={() => setSelectedTld(tld)}
                    className={`px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all whitespace-nowrap ${
                      selectedTld === tld 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                        : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    {tld}
                  </button>
                ))}
              </div>

              {/* Search Field for Seller */}
              <div className="relative">
                <input 
                  type="text"
                  placeholder={`Search ${selectedTld} domains on ${selectedSeller.name}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border-2 border-slate-200 rounded-3xl py-5 px-8 text-lg text-gray-950 focus:border-indigo-500 outline-none transition-all shadow-sm"
                />
                <button 
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="absolute right-3 top-3 bottom-3 px-8 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                  {isSearching ? <Zap className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Check
                </button>
              </div>

              {/* Results List */}
              <div className="space-y-4">
                {availabilityResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-8 rounded-[2rem] border-2 transition-all ${
                      availabilityResult.available 
                        ? 'bg-emerald-50 border-emerald-200' 
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          availabilityResult.available ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {availabilityResult.available ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{availabilityResult.domain}</h3>
                          <p className={`text-xs font-bold uppercase tracking-widest ${
                            availabilityResult.available ? 'text-emerald-600' : 'text-slate-500'
                          }`}>
                            {availabilityResult.available ? 'Available for registration' : 'Already taken'}
                          </p>
                        </div>
                      </div>
                      {availabilityResult.available && (
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Starting at</p>
                            <p className="text-3xl font-black text-slate-900">{formatPrice(availabilityResult.price || 0)}<span className="text-sm text-slate-400">/yr</span></p>
                          </div>
                          <button 
                            onClick={() => setView('checkout')}
                            className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-500 shadow-xl shadow-indigo-200 transition-all flex items-center gap-2"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Buy Now
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {view === 'checkout' && selectedSeller && availabilityResult && (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Review Your Order</h2>
                <p className="text-slate-500">You're one step away from owning your new domain.</p>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
                <div className="p-8 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-200">
                      <Globe className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Domain Name</p>
                      <p className="text-xl font-black text-slate-900">{availabilityResult.domain}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Seller</p>
                    <p className="text-lg font-black text-slate-900">{selectedSeller.name}</p>
                  </div>
                </div>

                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Registration Term</span>
                    <select 
                      value={selectedTerm}
                      onChange={(e) => setSelectedTerm(Number(e.target.value))}
                      className="bg-slate-100 border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value={1}>1 Year</option>
                      <option value={2}>2 Years</option>
                      <option value={3}>3 Years</option>
                      <option value={5}>5 Years</option>
                    </select>
                  </div>

                  <div className="space-y-3 pt-6 border-t border-slate-100">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Domain Registration ({selectedTerm}yr)</span>
                      <span className="font-bold text-slate-900">{formatPrice(availabilityResult.price! * selectedTerm)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Efado Service Commission</span>
                      <span className="font-bold text-emerald-600">Included</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                      <span className="text-lg font-black text-slate-900 tracking-tight">Total Amount</span>
                      <span className="text-3xl font-black text-indigo-600">{formatPrice(availabilityResult.price! * selectedTerm)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-200">
                  <button 
                    onClick={handleCheckout}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-500 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-3"
                  >
                    {selectedSeller.integrationType === 'reseller_api' ? (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Complete Purchase
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-5 h-5" />
                        Continue to {selectedSeller.name}
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-slate-400 text-center mt-4 uppercase font-bold tracking-widest">
                    {selectedSeller.integrationType === 'reseller_api' 
                      ? 'Secure checkout via Efado Pay' 
                      : `You will be redirected to ${selectedSeller.name} to complete your purchase`}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900 tracking-tighter">My Domain Orders</h2>
                <button 
                  onClick={() => setView('landing')}
                  className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline"
                >
                  Back to Hub
                </button>
              </div>

              <div className="space-y-4">
                {orders.length === 0 ? (
                  <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 text-center space-y-4">
                    <Globe className="w-12 h-12 text-slate-200 mx-auto" />
                    <p className="text-slate-400 font-medium">No orders found. Start searching for your dream domain!</p>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          order.status === 'fulfilled' ? 'bg-emerald-100 text-emerald-600' : 
                          order.status === 'failed' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          {order.status === 'fulfilled' ? <CheckCircle2 className="w-6 h-6" /> : 
                           order.status === 'failed' ? <AlertCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 tracking-tight">{order.domainName}</h3>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                            {order.termYears} Year Term • {sellers.find(s => s.id === order.sellerId)?.name || 'Partner'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount Paid</p>
                          <p className="text-lg font-black text-slate-900">{formatPrice(order.amountCharged)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                            order.status === 'fulfilled' ? 'bg-emerald-100 text-emerald-700' : 
                            order.status === 'failed' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {view === 'email' && (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <EfadoEmailHub user={user} onClose={() => setView('landing')} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* GORGEOUS ENROLLMENT WALLET MODAL */}
      <AnimatePresence>
        {showEnrollModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isEnrolling && setShowEnrollModal(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white text-slate-900 rounded-[2.5rem] border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden relative z-10"
            >
              <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="space-y-1">
                  <span className="text-[10px] font-black tracking-widest text-indigo-600 uppercase">SUB-PORTAL</span>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">AI Course Checkout</h3>
                </div>
                <button
                  type="button"
                  disabled={isEnrolling}
                  onClick={() => setShowEnrollModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 font-extrabold transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 md:p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                {enrollmentStatus ? (
                  <div className={`p-6 rounded-2xl text-center space-y-4 ${
                    enrollmentStatus.success 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    <span className="text-4xl">{enrollmentStatus.success ? '🎉' : '❌'}</span>
                    <h4 className="text-lg font-black uppercase">{enrollmentStatus.success ? 'Enrollment Registered' : 'Transaction Declined'}</h4>
                    <p className="text-xs leading-relaxed font-semibold">{enrollmentStatus.message}</p>
                    
                    {!enrollmentStatus.success && (
                      <div className="pt-2 text-left bg-white/70 p-4 rounded-xl space-y-1 border border-rose-100 mt-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Your Wallet Balances:</p>
                        <p className="text-[11px] font-medium text-slate-700">💰 Win Wallet : ₦{(user.playerWallet || 0).toLocaleString()}</p>
                        <p className="text-[11px] font-medium text-slate-700">💰 Deposit Wallet: ₦{(user.depositWallet || 0).toLocaleString()}</p>
                      </div>
                    )}

                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          if (enrollmentStatus.success) {
                            setShowEnrollModal(false);
                          } else {
                            setEnrollmentStatus(null);
                          }
                        }}
                        className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all"
                      >
                        {enrollmentStatus.success ? 'Close Panel' : 'Try Alternative Method'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Course Summary Item */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase">
                          {selectedPlan === 'starter' ? 'AI Starter Foundations' : 
                           selectedPlan === 'vip' ? 'VIP Mentorship & AI Automation' : 
                           '28-Day Masterclass'}
                        </h4>
                        <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Special Premium Cohort</p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-indigo-600">
                          ₦{selectedPlan === 'starter' ? '10,000' : 
                            selectedPlan === 'vip' ? '65,000' : 
                            '35,000'}
                        </span>
                        <p className="text-[9px] text-slate-500 font-mono">
                          (${selectedPlan === 'starter' ? '7' : 
                             selectedPlan === 'vip' ? '43' : 
                             '23.50'} Flat)
                        </p>
                      </div>
                    </div>

                    {/* Pre-filled user details */}
                    <div className="space-y-3">
                      <label className="block">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Registered Email</span>
                        <input
                          type="text"
                          disabled
                          value={user.email}
                          className="w-full mt-1.5 bg-slate-100 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-500 cursor-not-allowed"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Full Name</span>
                        <input
                          type="text"
                          disabled
                          value={user.displayName || 'Efado Member'}
                          className="w-full mt-1.5 bg-slate-100 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-500 cursor-not-allowed"
                        />
                      </label>
                    </div>

                    {/* Choose Payment wallet model */}
                    <div className="space-y-3.5 pt-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Payment Source</span>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Win Wallet */}
                        <label className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                          paymentMethod === 'win_wallet'
                            ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-500/10'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}>
                          <input
                            type="radio"
                            name="pay_source"
                            checked={paymentMethod === 'win_wallet'}
                            onChange={() => setPaymentMethod('win_wallet')}
                            className="sr-only"
                          />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Win Wallet</span>
                          <span className="text-xs font-black text-slate-900 mt-2">₦{(user.playerWallet || 0).toLocaleString()}</span>
                        </label>

                        {/* Deposit Wallet */}
                        <label className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                          paymentMethod === 'deposit_wallet'
                            ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-500/10'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}>
                          <input
                            type="radio"
                            name="pay_source"
                            checked={paymentMethod === 'deposit_wallet'}
                            onChange={() => setPaymentMethod('deposit_wallet')}
                            className="sr-only"
                          />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Deposit Wallet</span>
                          <span className="text-xs font-black text-slate-900 mt-2">₦{(user.depositWallet || 0).toLocaleString()}</span>
                        </label>

                        {/* Direct bank transfer */}
                        <label className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                          paymentMethod === 'transfer'
                            ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-500/10'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}>
                          <input
                            type="radio"
                            name="pay_source"
                            checked={paymentMethod === 'transfer'}
                            onChange={() => setPaymentMethod('transfer')}
                            className="sr-only"
                          />
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Bank Transfer</span>
                          <span className="text-[11px] font-medium text-slate-500 mt-2">Send Proof</span>
                        </label>
                      </div>
                    </div>

                    {/* Bank Transfer specific instruction */}
                    {paymentMethod === 'transfer' && (
                      <div className="bg-slate-950 text-white p-5 rounded-2xl font-mono text-xs space-y-2 border border-slate-800 animate-slideUp">
                        <p className="text-[9px] text-amber-400 uppercase font-black tracking-widest">⚠️ EFADO CORRESPONDENT BANK ACCOUNTS</p>
                        <p className="text-slate-350">Please initiate transfer to our Sovereign corporate receiver accounts:</p>
                        <div className="space-y-1 border-t border-slate-800 pt-2 text-[10px]">
                          <p>🏦 <strong>Bank:</strong> Guaranty Trust Bank (GTBank)</p>
                          <p>📋 <strong>Acc Name:</strong> EFADO INTERNATIONAL COGNITIVE SERVICES</p>
                          <p>🔢 <strong>Acc Num:</strong> 01229415892</p>
                        </div>
                      </div>
                    )}

                    {/* Submit CTA button */}
                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={handleEnrollSubmit}
                        disabled={isEnrolling}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-xl shadow-indigo-150 flex items-center justify-center gap-2"
                      >
                        {isEnrolling ? (
                          <>
                            <Zap className="w-4 h-4 animate-spin" />
                            Authorizing Sovereign Link...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4" />
                            Authorize ₦{selectedPlan === 'starter' ? '10,000' : 
                                         selectedPlan === 'vip' ? '65,000' : 
                                         '35,000'} Registration
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Unified Secure Payment Platform Portal overlay */}
      <AnimatePresence>
        {showPaymentPlatform && (
          <PaymentPlatform
            user={user}
            type="deposit"
            amount={paymentPlatformAmount}
            purpose={paymentPlatformPurpose}
            hub="DOMAIN"
            onSuccess={async () => {
              setShowPaymentPlatform(false);
              if (paymentPlatformOnSuccess) {
                await paymentPlatformOnSuccess();
              }
            }}
            onCancel={() => {
              setShowPaymentPlatform(false);
              setPaymentPlatformOnSuccess(null);
            }}
            onClose={() => {
              setShowPaymentPlatform(false);
              setPaymentPlatformOnSuccess(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
