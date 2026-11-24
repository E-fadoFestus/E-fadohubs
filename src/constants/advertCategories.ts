import shopsBusinessImg from '../assets/images/shops_business_group_1795528310576.jpg';
import realEstateImg from '../assets/images/real_estate_group_1795528311876.jpg';
import eventsEntertainmentImg from '../assets/images/events_entertainment_group_1795528312444.jpg';
import servicesWorkImg from '../assets/images/services_work_group_1795528312729.jpg';
import foodHotelsTravelImg from '../assets/images/food_hotels_travel_group_1795528312922.jpg';
import othersCustomImg from '../assets/images/others_custom_group_1795528312914.jpg';
import { AdPlan } from '../types';

export type AdvertGroupId =
  | 'SHOPS_BUSINESS'
  | 'LAND_HOUSES_RENTALS'
  | 'EVENTS_CHURCH_ENTERTAINMENT'
  | 'SERVICES_WORK'
  | 'FOOD_HOTELS_TRAVEL'
  | 'OTHERS';

export interface AdvertSubCategory {
  id: string;
  groupId: AdvertGroupId;
  label: string;
  description: string;
  keywords: string[];
}

export interface AdvertGroupConfig {
  id: AdvertGroupId;
  number: number;
  title: string;
  subtitle: string;
  image: string;
  cardBg: string;
  cardBorder: string;
  accentText: string;
  pillBg: string;
  subCategories: AdvertSubCategory[];
}

export interface ContextualField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date';
  placeholder: string;
  options?: string[];
  optional?: boolean;
}

export const ADVERT_GROUPS: AdvertGroupConfig[] = [
  {
    id: 'SHOPS_BUSINESS',
    number: 1,
    title: 'Shops and Business',
    subtitle: 'Stores, clothes, phones, farm produce, and items for sale',
    image: shopsBusinessImg,
    cardBg: 'bg-purple-50',
    cardBorder: 'border-purple-200',
    accentText: 'text-purple-900',
    pillBg: 'bg-purple-100 text-purple-800',
    subCategories: [
      {
        id: 'BUSINESS',
        groupId: 'SHOPS_BUSINESS',
        label: 'Shops, Supermarkets & Electronics',
        description: 'Phones, laptops, home goods, and wholesale stock',
        keywords: ['shop', 'store', 'supermarket', 'phone', 'laptop', 'electronics', 'wholesale', 'retail'],
      },
      {
        id: 'FASHION',
        groupId: 'SHOPS_BUSINESS',
        label: 'Fashion, Clothes & Beauty',
        description: 'Clothing, shoes, bags, wigs, jewelry, and tailoring',
        keywords: ['fashion', 'clothes', 'shoes', 'dress', 'boutique', 'beauty', 'hair'],
      },
      {
        id: 'FARM',
        groupId: 'SHOPS_BUSINESS',
        label: 'Farms, Livestock & Food Produce',
        description: 'Fresh crops, poultry, fish, goats, honey, and bulk food',
        keywords: ['farm', 'goat', 'poultry', 'fish', 'eggs', 'maize', 'rice', 'livestock', 'produce'],
      },
      {
        id: 'AUCTION',
        groupId: 'SHOPS_BUSINESS',
        label: 'Clearance & Quick Deals',
        description: 'Items available for fast offers or urgent clearance',
        keywords: ['auction', 'clearance', 'deal', 'bulk', 'offer'],
      },
    ],
  },
  {
    id: 'LAND_HOUSES_RENTALS',
    number: 2,
    title: 'Land, Houses, and Rentals',
    subtitle: 'Plots of land, homes to buy or rent, and cars or trucks to hire',
    image: realEstateImg,
    cardBg: 'bg-sky-50',
    cardBorder: 'border-sky-200',
    accentText: 'text-sky-900',
    pillBg: 'bg-sky-100 text-sky-800',
    subCategories: [
      {
        id: 'PROPERTIES',
        groupId: 'LAND_HOUSES_RENTALS',
        label: 'Land & Plots for Sale',
        description: 'Farm land, residential plots, and commercial land',
        keywords: ['land', 'plot', 'acre', 'hectare', 'real estate', 'oyo', 'lagos', 'abuja'],
      },
      {
        id: 'MORTGAGE',
        groupId: 'LAND_HOUSES_RENTALS',
        label: 'Houses, Flats & Shop Spaces',
        description: 'Apartments for rent, houses for sale, and offices',
        keywords: ['house', 'flat', 'apartment', 'rent', 'shortlet', 'duplex', 'shop space'],
      },
      {
        id: 'RENTALS',
        groupId: 'LAND_HOUSES_RENTALS',
        label: 'Cars, Trucks & Equipment Rentals',
        description: 'Vehicles, vans, generators, and machines for sale or hire',
        keywords: ['car', 'truck', 'vehicle', 'bus', 'tractor', 'rental', 'hire', 'machine'],
      },
    ],
  },
  {
    id: 'EVENTS_CHURCH_ENTERTAINMENT',
    number: 3,
    title: 'Events, Church, and Entertainment',
    subtitle: 'Parties, church programs, concerts, and creative talent',
    image: eventsEntertainmentImg,
    cardBg: 'bg-pink-50',
    cardBorder: 'border-pink-200',
    accentText: 'text-pink-900',
    pillBg: 'bg-pink-100 text-pink-800',
    subCategories: [
      {
        id: 'EVENTS',
        groupId: 'EVENTS_CHURCH_ENTERTAINMENT',
        label: 'Events, Parties & Conferences',
        description: 'Weddings, birthdays, trade fairs, and event planners',
        keywords: ['event', 'party', 'wedding', 'birthday', 'hall', 'conference', 'planner'],
      },
      {
        id: 'CHURCH',
        groupId: 'EVENTS_CHURCH_ENTERTAINMENT',
        label: 'Church Programs & Gatherings',
        description: 'Crusades, conventions, choir concerts, and fellowships',
        keywords: ['church', 'crusade', 'program', 'convention', 'fellowship', 'ministry'],
      },
      {
        id: 'TALENT',
        groupId: 'EVENTS_CHURCH_ENTERTAINMENT',
        label: 'Music, MCs & Creative Talent',
        description: 'Singers, DJs, voice artists, photographers, and actors',
        keywords: ['music', 'dj', 'mc', 'singer', 'photographer', 'talent', 'entertainment'],
      },
    ],
  },
  {
    id: 'SERVICES_WORK',
    number: 4,
    title: 'Services and Work',
    subtitle: 'Skilled workers, repairs, training, health, and expert help',
    image: servicesWorkImg,
    cardBg: 'bg-emerald-50',
    cardBorder: 'border-emerald-200',
    accentText: 'text-emerald-900',
    pillBg: 'bg-emerald-100 text-emerald-800',
    subCategories: [
      {
        id: 'ARTISAN',
        groupId: 'SERVICES_WORK',
        label: 'Handcraft & Skilled Trades',
        description: 'Carpentry, tailoring, plumbing, painting, and building',
        keywords: ['artisan', 'carpenter', 'plumber', 'tailor', 'painter', 'mason', 'builder'],
      },
      {
        id: 'TECHNICAL',
        groupId: 'SERVICES_WORK',
        label: 'Solar, Phone & Appliance Repair',
        description: 'Solar installers, electricians, mechanics, and tech repairs',
        keywords: ['solar', 'repair', 'electrician', 'mechanic', 'ac', 'generator', 'tech'],
      },
      {
        id: 'EDUCATION',
        groupId: 'SERVICES_WORK',
        label: 'Schools, Lessons & Skill Training',
        description: 'Tutors, academies, vocational training, and workshops',
        keywords: ['school', 'lesson', 'training', 'catering training', 'tutorial', 'course'],
      },
      {
        id: 'MEDICAL',
        groupId: 'SERVICES_WORK',
        label: 'Health, Pharmacy & Clinics',
        description: 'Clinics, pharmacies, wellness centers, and lab checks',
        keywords: ['health', 'clinic', 'pharmacy', 'hospital', 'dental', 'wellness'],
      },
      {
        id: 'LEGAL',
        groupId: 'SERVICES_WORK',
        label: 'Legal & Document Services',
        description: 'Lawyers, land title checks, CAC business registration',
        keywords: ['lawyer', 'legal', 'cac', 'agreement', 'land paper'],
      },
      {
        id: 'SECURITY',
        groupId: 'SERVICES_WORK',
        label: 'CCTV & Security Services',
        description: 'Security cameras, guards, and property safety teams',
        keywords: ['security', 'cctv', 'camera', 'guard', 'alarm'],
      },
      {
        id: 'CONSULTANCY',
        groupId: 'SERVICES_WORK',
        label: 'Business Support & Experts',
        description: 'Accounting, branding, marketing, and business advice',
        keywords: ['consultancy', 'accounting', 'marketing', 'expert', 'advice'],
      },
    ],
  },
  {
    id: 'FOOD_HOTELS_TRAVEL',
    number: 5,
    title: 'Food, Hotels, and Travel',
    subtitle: 'Restaurants, catering, hotels, and passenger travel',
    image: foodHotelsTravelImg,
    cardBg: 'bg-orange-50',
    cardBorder: 'border-orange-200',
    accentText: 'text-orange-900',
    pillBg: 'bg-orange-100 text-orange-800',
    subCategories: [
      {
        id: 'FOOD',
        groupId: 'FOOD_HOTELS_TRAVEL',
        label: 'Food, Restaurants & Catering',
        description: 'Daily meals, pastries, small chops, and event catering',
        keywords: ['food', 'restaurant', 'catering', 'cake', 'buka', 'meal', 'drinks'],
      },
      {
        id: 'HOTEL',
        groupId: 'FOOD_HOTELS_TRAVEL',
        label: 'Hotels & Guest Houses',
        description: 'Comfortable rooms, suites, resorts, and weekend stays',
        keywords: ['hotel', 'guest house', 'resort', 'lodge', 'room', 'stay'],
      },
      {
        id: 'TRANSPORT',
        groupId: 'FOOD_HOTELS_TRAVEL',
        label: 'Travel, Delivery & Ride Services',
        description: 'Inter-city travel, dispatch riders, and airport pickup',
        keywords: ['travel', 'transport', 'delivery', 'dispatch', 'flight', 'bus'],
      },
    ],
  },
  {
    id: 'OTHERS',
    number: 6,
    title: 'Others - Advertise Something Different',
    subtitle: 'Write what you want to promote in your own words — no limits',
    image: othersCustomImg,
    cardBg: 'bg-indigo-50',
    cardBorder: 'border-indigo-200',
    accentText: 'text-indigo-900',
    pillBg: 'bg-indigo-100 text-indigo-800',
    subCategories: [
      {
        id: 'OTHER',
        groupId: 'OTHERS',
        label: 'Custom Category (Write Your Own)',
        description: 'Anything at all — e.g. Goat Farming, Catering Training, Car Wash Machine',
        keywords: ['other', 'custom', 'anything', 'different'],
      },
    ],
  },
];

export const ALL_SUB_CATEGORIES: AdvertSubCategory[] = ADVERT_GROUPS.flatMap((g) => g.subCategories);

export function findGroupForCategory(categoryId: string): AdvertGroupConfig {
  const upper = (categoryId || '').toUpperCase();
  const bySub = ADVERT_GROUPS.find((g) => g.subCategories.some((s) => s.id === upper));
  if (bySub) return bySub;
  if (upper === 'LAND' || upper === 'HOUSING' || upper === 'VEHICLE') return ADVERT_GROUPS[1];
  if (upper === 'RESTAURANT') return ADVERT_GROUPS[4];
  if (upper === 'STORES') return ADVERT_GROUPS[0];
  if (upper === 'RELIGIOUS_EVENTS') return ADVERT_GROUPS[2];
  return ADVERT_GROUPS[5];
}

export function getCategoryLabel(categoryId: string, customCategoryName?: string): string {
  if (customCategoryName && customCategoryName.trim()) {
    return customCategoryName.trim();
  }
  const upper = (categoryId || '').toUpperCase();
  const found = ALL_SUB_CATEGORIES.find((c) => c.id === upper);
  if (found) return found.label;
  return categoryId || 'General Listing';
}

export const CONTEXTUAL_FIELDS: Record<string, ContextualField[]> = {
  BUSINESS: [
    { key: 'condition', label: 'Condition', type: 'select', placeholder: 'Choose condition', options: ['Brand New', 'Fairly Used', 'Wholesale Stock'], optional: true },
    { key: 'deliveryAvailable', label: 'Delivery Option', type: 'select', placeholder: 'How buyer receives item', options: ['Pickup Only', 'Delivery Available', 'Pickup or Delivery'], optional: true },
  ],
  FASHION: [
    { key: 'sizes', label: 'Sizes / Options', type: 'text', placeholder: 'e.g. S, M, L, XL or Custom Fit', optional: true },
    { key: 'deliveryAvailable', label: 'Delivery Option', type: 'select', placeholder: 'Select delivery option', options: ['Pickup or Delivery', 'Pickup Only', 'Nationwide Waybill'], optional: true },
  ],
  FARM: [
    { key: 'quantity', label: 'How Much Do You Have?', type: 'text', placeholder: 'e.g. 20 bags, 50 birds, 10 goats', optional: true },
    { key: 'deliveryAvailable', label: 'Pickup or Delivery', type: 'select', placeholder: 'Select option', options: ['Buyer Picks Up at Farm', 'Delivery Available', 'Both'], optional: true },
  ],
  AUCTION: [
    { key: 'offerDeadline', label: 'Last Day for Offers', type: 'date', placeholder: 'Choose date', optional: true },
    { key: 'condition', label: 'Item Condition', type: 'select', placeholder: 'Select condition', options: ['Brand New', 'Used - Working Great', 'Needs Small Fix'], optional: true },
  ],
  PROPERTIES: [
    { key: 'landSize', label: 'Land Size', type: 'text', placeholder: 'e.g. 1 Plot, 2 Acres, 600 sqm', optional: true },
    { key: 'landPaper', label: 'Paper / Document Type', type: 'text', placeholder: 'e.g. Survey, Deed of Assignment, C of O', optional: true },
  ],
  MORTGAGE: [
    { key: 'listingGoal', label: 'For Rent or For Sale?', type: 'select', placeholder: 'Select option', options: ['For Rent (Yearly)', 'Short-Let (Daily)', 'For Sale', 'Lease'], optional: false },
    { key: 'rooms', label: 'Number of Rooms / Size', type: 'text', placeholder: 'e.g. 2-Bedroom Flat, 1 Shop Space', optional: true },
  ],
  RENTALS: [
    { key: 'rentalRate', label: 'Price Is For', type: 'select', placeholder: 'Select basis', options: ['Per Day', 'Per Trip', 'Full Sale Price', 'Per Week'], optional: true },
    { key: 'driverIncluded', label: 'Includes Driver or Operator?', type: 'select', placeholder: 'Select option', options: ['Yes, Included', 'No (Self-Use)', 'Not Applicable'], optional: true },
  ],
  EVENTS: [
    { key: 'eventDate', label: 'Event Date', type: 'date', placeholder: 'When is it happening?', optional: true },
    { key: 'venue', label: 'Venue / Hall Name', type: 'text', placeholder: 'e.g. Grand Ballroom or Online', optional: true },
  ],
  CHURCH: [
    { key: 'programDate', label: 'Program Date & Time', type: 'text', placeholder: 'e.g. Fri 14th June, 5:00 PM', optional: true },
    { key: 'theme', label: 'Program Theme', type: 'text', placeholder: 'e.g. Night of Grace', optional: true },
  ],
  TALENT: [
    { key: 'talentRole', label: 'What You Do', type: 'text', placeholder: 'e.g. Gospel Singer, Event DJ, Photographer', optional: true },
    { key: 'availability', label: 'Booking Type', type: 'select', placeholder: 'Select option', options: ['Available for Events', 'Online & In-Person', 'Studio Bookings'], optional: true },
  ],
  ARTISAN: [
    { key: 'serviceArea', label: 'Where You Work', type: 'text', placeholder: 'e.g. All of Lagos, Ibadan & Nearby', optional: true },
    { key: 'homeService', label: 'Do You Come to Customer?', type: 'select', placeholder: 'Select option', options: ['Yes, Home / Site Visit', 'Workshop Only', 'Both'], optional: true },
  ],
  TECHNICAL: [
    { key: 'serviceArea', label: 'Work Coverage Area', type: 'text', placeholder: 'e.g. City-wide inspection & repair', optional: true },
    { key: 'warranty', label: 'Work Guarantee', type: 'text', placeholder: 'e.g. 30-day check after repair', optional: true },
  ],
  EDUCATION: [
    { key: 'learningMode', label: 'Class Format', type: 'select', placeholder: 'Select format', options: ['Physical Class', 'Online Class', 'Both Physical & Online'], optional: true },
    { key: 'schedule', label: 'Duration / Schedule', type: 'text', placeholder: 'e.g. 4 Weeks, Weekend Classes', optional: true },
  ],
  MEDICAL: [
    { key: 'openHours', label: 'Opening Hours', type: 'text', placeholder: 'e.g. Open 8am - 8pm or 24 Hours', optional: true },
    { key: 'appointmentNeeded', label: 'Walk-in or Booking?', type: 'select', placeholder: 'Select option', options: ['Walk-in Welcome', 'Book First', 'Home Visit Available'], optional: true },
  ],
  LEGAL: [
    { key: 'focusArea', label: 'Service Focus', type: 'text', placeholder: 'e.g. Land Documents, CAC Registration, Advice', optional: true },
  ],
  SECURITY: [
    { key: 'coverage', label: 'What You Provide', type: 'text', placeholder: 'e.g. CCTV Installation, Event Guards', optional: true },
  ],
  CONSULTANCY: [
    { key: 'sessionMode', label: 'Meeting Type', type: 'select', placeholder: 'Select option', options: ['Phone / Video Call', 'In-Person Meeting', 'Both'], optional: true },
  ],
  FOOD: [
    { key: 'servingInfo', label: 'Order Type', type: 'select', placeholder: 'Select option', options: ['Single Plates & Packs', 'Bulk / Party Catering', 'Both'], optional: true },
    { key: 'deliveryTime', label: 'Delivery Availability', type: 'text', placeholder: 'e.g. Same-day delivery within town', optional: true },
  ],
  HOTEL: [
    { key: 'roomCategory', label: 'Room Types', type: 'text', placeholder: 'e.g. Standard Room, Executive Suite', optional: true },
    { key: 'facilities', label: 'What Is Included', type: 'text', placeholder: 'e.g. 24hr Light, AC, WiFi, Breakfast', optional: true },
  ],
  TRANSPORT: [
    { key: 'route', label: 'Route or Coverage', type: 'text', placeholder: 'e.g. Ibadan to Lagos, Town Dispatch', optional: true },
    { key: 'schedule', label: 'Departure / Availability', type: 'text', placeholder: 'e.g. Daily 7am & 2pm, On Demand', optional: true },
  ],
  OTHER: [
    { key: 'keyHighlight', label: 'Main Benefit for Buyers', type: 'text', placeholder: 'e.g. Home delivery included, Free starter guide', optional: true },
  ],
};

export const ADVERT_PLANS: AdPlan[] = [
  { id: 'Free', name: 'Free 3-Day Listing', price: 0, durationDays: 3, features: ['Shows in EFADO Category & Search', 'Public Share Link Included'] },
  { id: 'Weekly', name: '7-Day Boost', price: 2000, durationDays: 7, features: ['7 Days Live', 'Highlighted on Home Page'] },
  { id: 'Express', name: 'Express Top Placement', price: 5000, durationDays: 7, features: ['Top of Category & Search', 'Featured on Home Feed & Reels'] },
  { id: 'Monthly', name: '30-Day Growth Plan', price: 7500, durationDays: 30, features: ['Full 30 Days Live', 'Priority Placement Across EFADO'] },
  { id: 'Quarterly', name: '3-Month Business Plan', price: 20000, durationDays: 90, features: ['90 Days Continuous Display', 'Full Social & Search Link Support'] },
];
