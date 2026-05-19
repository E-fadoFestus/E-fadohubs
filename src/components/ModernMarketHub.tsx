import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  ChevronRight, 
  Search, 
  X, 
  Info, 
  Laptop, 
  Building2,
  Bitcoin,
  QrCode,
  Ticket,
  Store,
  Smartphone,
  CreditCard,
  Wallet,
  Globe,
  Zap,
  ShoppingBasket,
  MapPin,
  Package,
  UserPlus,
  Trash2,
  Plus,
  Minus,
  Truck,
  ShieldCheck,
  Clock,
  ExternalLink,
  History,
  ClipboardList,
  CheckCircle2,
  ArrowRight,
  Cpu,
  Shirt,
  Home,
  Watch,
  Gamepad2,
  Camera,
  UtensilsCrossed,
  SearchCode,
  Copy,
  ChevronDown,
  ArrowRightLeft,
  Hash,
  Fingerprint,
  Mail
} from 'lucide-react';
import { SAMPLE_PRODUCTS } from '../sampleData';
import { MarketProduct, UserProfile, MarketOrder } from '../types';
import { useCurrency } from '../lib/CurrencyContext';
import { VendorRegistrationFlow } from './VendorRegistrationFlow';
import { SecurityGuard, TransactionPinModal } from './SecurityGuard';
import { db, collection, addDoc, serverTimestamp, query, where, onSnapshot, doc, updateDoc } from '../firebase';
import { MiningMiniCard, AdvertisingMiniCard } from './EfadoMining';
import { SUPPORT_EMAILS } from '../constants/businessProfile';

// ... (MODERN_CATEGORIES stays same)
const MODERN_CATEGORIES: Record<string, Record<string, Record<string, string[]>>> = {
  "Electronics & Computers": {
    "Computing": {
      "Laptops": ["MacBooks", "Windows Laptops", "Chromebooks"],
      "Desktops": ["PC Towers", "All-in-Ones", "Workstations"],
      "Peripherals": ["Monitors", "Keyboards", "Mice", "Printers"]
    },
    "Mobile Devices": {
      "Smartphones": ["iPhones", "Android Phones", "Feature Phones"],
      "Tablets": ["iPads", "Android Tablets", "E-readers"],
      "Accessories": ["Cases", "Chargers", "Power Banks"]
    },
    "Home Entertainment": {
      "TVs": ["OLED", "QLED", "4K UHD", "Smart TVs"],
      "Audio": ["Soundbars", "Home Theater", "Speakers"],
      "Gaming": ["Consoles", "VR Headsets", "Controllers"]
    }
  },
  "Fashion (Men/Women/Unisex)": {
    "Apparel": {
      "Men's": ["Shirts", "Trousers", "Suits", "Jackets"],
      "Women's": ["Dresses", "Tops", "Skirts", "Outerwear"],
      "Unisex": ["Hoodies", "T-Shirts", "Joggers"]
    },
    "Footwear": {
      "Casual": ["Sneakers", "Sandals", "Slides"],
      "Formal": ["Oxford Shoes", "Heels", "Loafers"],
      "Sport": ["Running Shoes", "Cleats", "Hiking Boots"]
    },
    "Accessories": {
      "Watches": ["Luxury", "Smartwatches", "Vintage"],
      "Jewelry": ["Rings", "Necklaces", "Bracelets"],
      "Bags": ["Handbags", "Backpacks", "Suitcases"]
    }
  },
  "Home, Kitchen & Appliances": {
    "Appliances": {
      "Kitchen": ["Refrigerators", "Microwaves", "Blenders", "Ovens"],
      "Laundry": ["Washing Machines", "Dryers", "Irons"],
      "Cleaning": ["Vacuum Cleaners", "Steam Cleaners", "Air Purifiers"]
    },
    "Living Space": {
      "Furniture": ["Sofas", "Dining Sets", "Beds", "Wardrobes"],
      "Decor": ["Wall Art", "Lighting", "Rugs", "Vases"],
      "Textiles": ["Bedding", "Curtains", "Towels"]
    }
  },
  "Health & Beauty": {
    "Personal Care": {
      "Skincare": ["Moisturizers", "Cleansers", "Serums"],
      "Haircare": ["Shampoos", "Conditioners", "Styling Tools"],
      "Oral Care": ["Electric Toothbrushes", "Whitening Kits"]
    },
    "Cosmetics": {
      "Makeup": ["Face", "Eyes", "Lips"],
      "Fragrances": ["Perfumes", "Colognes", "Body Sprays"]
    }
  },
  "Sports, Fitness & Outdoors": {
    "Fitness": {
      "Gym Equipment": ["Dumbbells", "Treadmills", "Yoga Mats"],
      "Wearables": ["Fitness Trackers", "Heart Rate Monitors"]
    },
    "Outdoor": {
      "Camping": ["Tents", "Sleeping Bags", "Lanterns"],
      "Cycling": ["Bicycles", "Helmets", "Locks"]
    }
  },
  "Baby & Kids": {
    "Toys": {
      "Educational": ["STEM Toys", "Puzzles", "Books"],
      "Action": ["Action Figures", "Dolls", "Vehicles"]
    },
    "Essentials": {
      "Gear": ["Strollers", "Car Seats", "Cribs"],
      "Clothing": ["Infant", "Toddler", "Teens"]
    }
  },
  "Automotive & Tools": {
    "Vehicles": {
      "Cars": ["Sedans", "SUVs", "Trucks"],
      "Bikes": ["Motorcycles", "Scooters"]
    },
    "Maintenance": {
      "Tools": ["Power Tools", "Hand Tools", "Diagnostic"],
      "Parts": ["Tires", "Batteries", "Filters"]
    }
  },
  "Furniture & Decor": {
    "Interior": {
      "Living Room": ["Sofas", "Coffee Tables", "TV Stands"],
      "Bedroom": ["Beds", "Wardrobes", "Nightstands"]
    },
    "Office": {
      "Work": ["Desks", "Chairs", "Bookshelves"]
    }
  },
  "Books, Music & Hobbies": {
    "Media": {
      "Books": ["Fiction", "Non-Fiction", "Textbooks"],
      "Music": ["Vinyl", "Instruments", "CDs"]
    },
    "Hobbies": {
      "Arts": ["Painting", "Crafting", "Sewing"],
      "Gaming": ["Board Games", "Card Games"]
    }
  },
  "Agriculture & Farm Products": {
    "Crops & Produce": {
      "Grains": ["Rice", "Maize", "Beans", "Soybeans"],
      "Vegetables": ["Tomatoes", "Onions", "Peppers", "Carrots"],
      "Fruits": ["Citrus", "Mangoes", "Pineapples", "Bananas"],
      "Tubers": ["Yam", "Cassava", "Potatoes"]
    },
    "Livestock": {
      "Poultry": ["Chickens", "Turkeys", "Eggs"],
      "Cattle": ["Cows", "Bulls", "Calves"],
      "Small Ruminants": ["Goats", "Sheep"],
      "Fishery": ["Catfish", "Tilapia", "Dried Fish"]
    },
    "Agro-Processing": {
      "Oils": ["Palm Oil", "Vegetable Oil", "Groundnut Oil"],
      "Flours": ["Cassava Flour", "Maize Flour", "Yam Flour"],
      "Local Snacks": ["Garri", "Kuli-Kuli", "Plantain Chips"]
    }
  },
  "Groceries & Essentials": {
    "Food": {
      "Pantry": ["Rice", "Oils", "Spices"],
      "Beverages": ["Coffee", "Tea", "Juices"]
    },
    "Home": {
      "Household": ["Detergents", "Paper Products", "Cleaners"]
    }
  },
  "Real Estate & Properties": {
    "Landed Properties": {
      "Land Plots": ["Residential Plots", "Commercial Land", "Industrial Land"],
      "Acreage": ["Farmland", "Plantations", "Estate Land"],
      "Specialty": ["Corner Pieces", "Waterfront", "Hillside"]
    },
    "Buildings & Houses": {
      "Residential": ["Duplexes", "Bungalows", "Apartments", "Mansions"],
      "Commercial": ["Office Blocks", "Shopping Complexes", "Warehouses"],
      "Industrial": ["Factories", "Plants", "Logistics Hubs"]
    },
    "Rentals & Vacancies": {
      "Accommodation": ["Self-Contains", "Flats", "Duplex Rents"],
      "Business": ["Store Rent", "Office Rent", "Warehouse Lease"],
      "Short Stay": ["Guest Houses", "Service Apartments", "Vacation Homes"]
    }
  }
};

interface ModernMarketHubProps {
  user: UserProfile;
  onClose: () => void;
  onOpenMining?: () => void;
  onNavigate?: (hub: any, subview?: any) => void;
}

export const ModernMarketHub: React.FC<ModernMarketHubProps> = ({ user, onClose, onOpenMining, onNavigate }) => {
  const { formatPrice } = useCurrency();
  const [activeView, setActiveView] = useState<'browse' | 'orders'>('browse');
  const [showGuide, setShowGuide] = useState(false);
  const [selectedL1, setSelectedL1] = useState<string | null>(null);
  const [selectedL2, setSelectedL2] = useState<string | null>(null);
  const [selectedL3, setSelectedL3] = useState<string | null>(null);
  const [selectedL4, setSelectedL4] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<MarketProduct[]>(SAMPLE_PRODUCTS);
  const [showRegModal, setShowRegModal] = useState(false);
  const [cart, setCart] = useState<{product: MarketProduct, quantity: number}[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'address' | 'payment' | 'processing' | 'success'>('cart');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatusText, setPaymentStatusText] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: user.displayName || '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [shippingMethod, setShippingMethod] = useState<'Standard' | 'Expedited' | 'Instant'>('Standard');
  const [paymentMethod, setPaymentMethod] = useState<string>('wallet');
  const [couponCode, setCouponCode] = useState('');
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [orders, setOrders] = useState<MarketOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<MarketOrder | null>(null);
  const [generatedOrderCode, setGeneratedOrderCode] = useState<string>('');
  
  const [bankSearch, setBankSearch] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [accountDetails, setAccountDetails] = useState({
    accountNumber: '',
    bankName: '',
    accountName: ''
  });

  const nigerianBanks = [
    { code: '044', name: 'Access Bank' },
    { code: '011', name: 'First Bank of Nigeria' },
    { code: '058', name: 'GTBank' },
    { code: '232', name: 'Zenith Bank' },
    { code: '033', name: 'United Bank for Africa (UBA)' },
    { code: '070', name: 'Fidelity Bank' },
    { code: '214', name: 'First City Monument Bank (FCMB)' },
    { code: '032', name: 'Union Bank of Nigeria' },
    { code: '215', name: 'Unity Bank' },
    { code: '035', name: 'Wema Bank' },
    { code: '030', name: 'Heritage Bank' },
    { code: '082', name: 'Keystone Bank' },
    { code: '076', name: 'Polaris Bank' },
    { code: '221', name: 'Stanbic IBTC Bank' },
    { code: '068', name: 'Standard Chartered Bank' },
    { code: '090267', name: 'Kuda Bank' },
    { code: '999992', name: 'OPay Digital Services' },
    { code: '50515', name: 'Moniepoint MFB' },
  ].sort((a, b) => a.name.localeCompare(b.name));

  const paymentCategories = [
    {
      id: 'mobile_money',
      title: 'Mobile Money',
      icon: <Smartphone className="w-5 h-5 text-emerald-400" />,
      options: [
        { id: 'opay', name: 'OPay' },
        { id: 'palmpay', name: 'PalmPay' },
        { id: 'kuda', name: 'Kuda' }
      ]
    },
    {
      id: 'bank_transfer',
      title: 'Bank Transfer',
      icon: <Building2 className="w-5 h-5 text-blue-400" />,
      options: [
        { id: 'zenith', name: 'Zenith' },
        { id: 'gtbank', name: 'GTBank' },
        { id: 'access', name: 'Access' },
        { id: 'uba', name: 'UBA' }
      ]
    },
    {
      id: 'cards',
      title: 'Cards',
      icon: <CreditCard className="w-5 h-5 text-purple-400" />,
      options: [
        { id: 'visa', name: 'Visa' },
        { id: 'mastercard', name: 'Mastercard' },
        { id: 'verve', name: 'Verve' }
      ]
    },
    {
      id: 'ussd',
      title: 'USSD Code',
      icon: <Hash className="w-5 h-5 text-orange-400" />,
      options: [
        { id: 'efado_pay', name: '*EFADO*PAY#' },
        { id: 'ussd_894', name: '*894#' },
        { id: 'ussd_737', name: '*737#' },
        { id: 'ussd_901', name: '*901#' }
      ]
    },
    {
      id: 'qr_pay',
      title: 'QR Pay',
      icon: <Fingerprint className="w-5 h-5 text-pink-400" />,
      options: [
        { id: 'scan_pay', name: 'Scan & Pay' },
        { id: 'efado_qr', name: 'EFADO QR' }
      ]
    },
    {
      id: 'crypto',
      title: 'Crypto',
      icon: <Bitcoin className="w-5 h-5 text-yellow-400" />,
      options: [
        { id: 'btc', name: 'BTC' },
        { id: 'eth', name: 'ETH' },
        { id: 'usdt', name: 'USDT (TRC20)' }
      ]
    },
    {
      id: 'global',
      title: 'Global Payments',
      icon: <Globe className="w-5 h-5 text-indigo-400" />,
      options: [
        { id: 'paypal', name: 'PayPal' },
        { id: 'stripe', name: 'Stripe' },
        { id: 'paystack', name: 'Paystack' }
      ]
    }
  ];

  const filteredBanks = nigerianBanks.filter(b => 
    b.name.toLowerCase().includes(bankSearch.toLowerCase()) || 
    b.code.includes(bankSearch)
  );

  useEffect(() => {
    const q = query(collection(db, 'market_orders'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as MarketOrder)));
    });
    return unsub;
  }, [user.uid]);

  useEffect(() => {
    let filtered = SAMPLE_PRODUCTS;
    if (selectedL1) {
      filtered = filtered.filter(p => p.categoryPath.level1 === selectedL1);
    }
    if (selectedL2) {
      filtered = filtered.filter(p => p.categoryPath.level2 === selectedL2);
    }
    if (selectedL3) {
      filtered = filtered.filter(p => p.categoryPath.level3 === selectedL3);
    }
    if (selectedL4) {
      filtered = filtered.filter(p => p.categoryPath.level4 === selectedL4);
    }
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredProducts(filtered);
  }, [selectedL1, selectedL2, selectedL3, selectedL4, searchQuery]);

  const handleL1Select = (cat: string) => {
    setSelectedL1(cat);
    setSelectedL2(null);
    setSelectedL3(null);
    setSelectedL4(null);
  };

  const handleL2Select = (sub: string) => {
    setSelectedL2(sub);
    setSelectedL3(null);
    setSelectedL4(null);
  };

  const handleL3Select = (subSub: string) => {
    setSelectedL3(subSub);
    setSelectedL4(null);
  };

  const handleL4Select = (group: string) => {
    setSelectedL4(group);
  };

  const addToCart = (product: MarketProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const handleCheckout = () => {
    if (checkoutStep === 'cart') setCheckoutStep('address');
    else if (checkoutStep === 'address') setCheckoutStep('payment');
    else if (checkoutStep === 'payment') {
      if (paymentMethod === 'pod') {
        finalizePurchase();
      } else {
        setShowPinModal(true);
      }
    }
  };

  const generateOrderCode = () => {
    const random = Math.floor(100000 + Math.random() * 900000);
    return `EDADO${random}`;
  };

  const finalizePurchase = async () => {
    setIsProcessing(true);
    setPaymentStatusText('Initiating Secure Transaction...');
    setCheckoutStep('processing');

    // Simulate Payment Processing Steps based on method
    if (paymentMethod === 'bank') {
      await new Promise(r => setTimeout(r, 1500));
      setPaymentStatusText('Generating Secure Account Number...');
    } else if (paymentMethod === 'crypto') {
      await new Promise(r => setTimeout(r, 1500));
      setPaymentStatusText('Generating Unique Wallet Address...');
    } else {
      await new Promise(r => setTimeout(r, 1200));
      setPaymentStatusText('Verifying Payment Source...');
    }
    
    await new Promise(r => setTimeout(r, 1000));
    setPaymentStatusText('Securing Order Details...');
    await new Promise(r => setTimeout(r, 800));

    const code = generateOrderCode();
    setGeneratedOrderCode(code);
    
    const newOrder: MarketOrder = {
      orderCode: code,
      userId: user.uid,
      items: cart.map(item => ({
        productId: item.product.id!,
        productTitle: item.product.title,
        price: item.product.price,
        quantity: item.quantity,
        photo: item.product.photos[0]
      })),
      totalAmount: (cartTotal * (isCouponApplied ? 0.8 : 1)) + (shippingMethod === 'Standard' ? 0 : (shippingMethod === 'Expedited' ? 15 : 50)),
      currency: 'USD',
      deliveryDetails: {
        ...deliveryAddress,
        method: shippingMethod
      },
      paymentMethod: paymentMethod,
      status: 'processing',
      trackingNumber: `TRK${Math.random().toString(36).substring(7).toUpperCase()}`,
      trackingHistory: [
        {
          status: 'Order Placed',
          location: 'EFADO Digital System',
          timestamp: new Date(),
          description: 'Your order has been received and is being processed.'
        }
      ],
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'market_orders'), newOrder);
      setShowPinModal(false);
      setCheckoutStep('success');
      setCart([]);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error creating order:', error);
      setIsProcessing(false);
      setCheckoutStep('payment');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl overflow-hidden"
    >
      <AnimatePresence>
        {showGuide && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md"
          >
            <div className="w-full max-w-xl bg-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full blur-3xl -mr-24 -mt-24 opacity-50" />
              <button 
                onClick={() => setShowGuide(false)}
                className="absolute top-6 right-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-900 transition-all font-black"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-100 mb-8">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight uppercase">Tactical Marketplace Guide</h2>
                <p className="text-gray-600 font-bold mb-8 leading-relaxed uppercase tracking-[0.1em] text-xs">
                  Strategic commerce protocols active. Here is how you navigate the EFADO Marketplace:
                </p>
                
                <div className="space-y-6">
                  {[
                    { icon: ShoppingBag, title: "Modern Categories", desc: "Browse high-fidelity products across specialized categories from electronics to real estate." },
                    { icon: QrCode, title: "QR Strategic Link", desc: "Scan physical product markers to instantly link into the digital inventory system." },
                    { icon: UserPlus, title: "Vendor Protocol", desc: "Initialize your professional profile to start deploying products to the EFADO network." },
                    { icon: CreditCard, title: "Wallet Settlement", desc: "Seamless transactions using your EFADO Deposit Wallet for instant asset acquisition." }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 group">
                      <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-emerald-600 transition-all duration-300 pointer-events-none">
                        <item.icon className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-1">{item.title}</h4>
                        <p className="text-xs text-gray-500 leading-relaxed font-bold">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={() => setShowGuide(false)}
                  className="w-full mt-10 py-5 bg-gray-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-gray-300 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Initiate Trade
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="relative w-full max-w-7xl h-[90vh] bg-slate-900 border border-white/10 rounded-[3rem] flex flex-col shadow-2xl overflow-hidden">
        {/* Header Block */}
        <div className="px-10 py-8 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl z-20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
                <ShoppingBasket className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-display font-black text-white tracking-tight">EFADO <span className="text-cyan-400">Modern Market</span> Hub</h2>
                <div className="flex flex-col mt-1">
                  <div className="flex items-center gap-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Zap className="w-3 h-3 text-yellow-400" /> New + Fairly Used Products Sold
                    </p>
                    <button 
                      onClick={() => setShowGuide(true)}
                      className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1 hover:text-emerald-300 transition-colors"
                    >
                      <Info className="w-3 h-3" /> Tactical Guide
                    </button>
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Globe className="w-3 h-3 text-blue-400" /> Vendors Meet Buyers (Local + International)
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowCart(true)}
                className="relative flex items-center gap-3 px-5 py-3 text-slate-400 hover:text-white transition-all bg-white/5 rounded-2xl hover:bg-white/10 group border border-white/5 hover:border-blue-500/30"
              >
                <div className="relative">
                  <ShoppingBag className="w-6 h-6" />
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40 animate-bounce">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">My Cart</p>
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">View & Checkout</p>
                </div>
              </button>
              <button 
                onClick={() => setShowRegModal(true)}
                className="group flex flex-col items-center bg-cyan-600 hover:bg-cyan-500 px-6 py-2 rounded-2xl transition-all shadow-lg shadow-cyan-500/20"
              >
                <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <UserPlus className="w-3 h-3" /> Vendor Registration
                </span>
                <span className="text-[8px] font-bold text-cyan-200 uppercase tracking-tighter">Register & Upload Products</span>
              </button>
              <button onClick={onClose} className="p-3 text-slate-400 hover:text-white transition-colors bg-white/5 rounded-2xl hover:bg-white/10">
                <X className="w-7 h-7" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-6">
            <button 
              onClick={() => setActiveView('browse')}
              className={`pb-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeView === 'browse' ? 'border-blue-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              Browse Market
            </button>
            <button 
              onClick={() => setActiveView('orders')}
              className={`pb-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeView === 'orders' ? 'border-blue-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              My Orders & Tracking
            </button>
          </div>

          {/* Breadcrumb / Selection Path UI */}
          {activeView === 'browse' && (
            <div className="flex items-center gap-3 bg-slate-800/40 px-6 py-4 rounded-2xl border border-white/5 mt-6">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${selectedL1 ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-600'}`} />
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${selectedL1 ? 'text-white' : 'text-slate-500'}`}>
                {selectedL1 || 'Category'}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-700" />
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${selectedL2 ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]' : 'bg-slate-600'}`} />
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${selectedL2 ? 'text-white' : 'text-slate-500'}`}>
                {selectedL2 || 'Subcategory'}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-700" />
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${selectedL3 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${selectedL3 ? 'text-white' : 'text-slate-500'}`}>
                {selectedL3 || 'Subcategory'}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-700" />
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${selectedL4 ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-slate-600'}`} />
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${selectedL4 ? 'text-white' : 'text-slate-500'}`}>
                {selectedL4 || 'Group'}
              </span>
            </div>
            
            {selectedL4 && (
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="ml-auto flex items-center gap-2 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Path Complete</span>
              </motion.div>
            )}
          </div>
        )}
      </div>

        {/* Main Content Area */}
        <div className="flex-grow overflow-hidden relative">
          <AnimatePresence mode="wait">
            {activeView === 'browse' ? (
              <motion.div 
                key="browse" 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full flex flex-col lg:flex-row"
              >
                {/* Level 1: Category */}
                <div className="lg:w-1/5 border-r border-white/5 flex flex-col">
                  <div className="p-6 border-b border-white/5 bg-slate-800/20">
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px]">1</span>
                      Category
                    </h3>
                  </div>
                  <div className="flex-grow overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {Object.keys(MODERN_CATEGORIES).map(cat => (
                      <button
                        key={cat}
                        onClick={() => handleL1Select(cat)}
                        className={`w-full flex items-center justify-between p-5 rounded-[1.5rem] border transition-all text-left group relative overflow-hidden ${
                          selectedL1 === cat 
                            ? 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-500/20' 
                            : 'bg-slate-800/30 border-white/5 text-slate-400 hover:bg-slate-800 hover:border-white/10'
                        }`}
                      >
                        <div className="relative z-10 flex items-center gap-4">
                          {cat.includes('Electronics') && <Cpu className="w-5 h-5" />}
                          {cat.includes('Fashion') && <Shirt className="w-5 h-5" />}
                          {cat.includes('Home') && <Home className="w-5 h-5" />}
                          <span className="text-sm font-black uppercase tracking-tight leading-tight">{cat}</span>
                        </div>
                        <ChevronRight className={`w-5 h-5 relative z-10 transition-transform ${selectedL1 === cat ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Level 2: Section */}
                <div className="lg:w-1/5 border-r border-white/5 flex flex-col bg-slate-900/30">
                  <div className="p-6 border-b border-white/5 bg-slate-800/20">
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">2</span>
                      Section
                    </h3>
                  </div>
                  <div className="flex-grow overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {selectedL1 ? (
                      Object.keys(MODERN_CATEGORIES[selectedL1]).map(sub => (
                        <button
                          key={sub}
                          onClick={() => handleL2Select(sub)}
                          className={`w-full flex items-center justify-between p-5 rounded-[1.5rem] border transition-all text-left group relative overflow-hidden ${
                            selectedL2 === sub 
                              ? 'bg-cyan-600 border-cyan-400 text-white shadow-xl shadow-cyan-500/20' 
                              : 'bg-slate-800/30 border-white/5 text-slate-400 hover:bg-slate-800 hover:border-white/10'
                          }`}
                        >
                          <span className="relative z-10 text-sm font-black uppercase tracking-tight leading-tight">{sub}</span>
                          <ChevronRight className={`w-5 h-5 relative z-10 transition-transform ${selectedL2 === sub ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                        </button>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-20">
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-500 flex items-center justify-center mb-4">
                          <ArrowRight className="w-8 h-8 text-slate-500" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Select Category First</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Level 3: Subcategory */}
                <div className="lg:w-1/5 border-r border-white/5 flex flex-col bg-slate-950/20">
                  <div className="p-6 border-b border-white/5 bg-slate-800/20">
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">3</span>
                      Subcategory
                    </h3>
                  </div>
                  <div className="flex-grow overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {selectedL2 ? (
                      Object.keys(MODERN_CATEGORIES[selectedL1!][selectedL2]).map(subSub => (
                        <button
                          key={subSub}
                          onClick={() => handleL3Select(subSub)}
                          className={`w-full flex items-center justify-between p-5 rounded-[1.5rem] border transition-all text-left group relative overflow-hidden ${
                            selectedL3 === subSub 
                              ? 'bg-emerald-600 border-emerald-400 text-white shadow-xl shadow-emerald-500/20' 
                              : 'bg-slate-800/30 border-white/5 text-slate-400 hover:bg-slate-800 hover:border-white/10'
                          }`}
                        >
                          <span className="relative z-10 text-sm font-black uppercase tracking-tight leading-tight">{subSub}</span>
                          <ChevronRight className={`w-5 h-5 relative z-10 transition-transform ${selectedL3 === subSub ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                        </button>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-20">
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-500 flex items-center justify-center mb-4">
                          <ArrowRight className="w-8 h-8 text-slate-500" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Select Section First</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Level 4: Group */}
                <div className="lg:w-1/5 border-r border-white/5 flex flex-col bg-slate-900/40">
                  <div className="p-6 border-b border-white/5 bg-slate-800/20">
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px]">4</span>
                      Group
                    </h3>
                  </div>
                  <div className="flex-grow overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {selectedL3 ? (
                      MODERN_CATEGORIES[selectedL1!][selectedL2!][selectedL3].map(group => (
                        <button
                          key={group}
                          onClick={() => handleL4Select(group)}
                          className={`w-full flex items-center justify-between p-5 rounded-[1.5rem] border transition-all text-left group relative overflow-hidden ${
                            selectedL4 === group 
                              ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl shadow-indigo-500/20' 
                              : 'bg-slate-800/30 border-white/5 text-slate-400 hover:bg-slate-800 hover:border-white/10'
                          }`}
                        >
                          <span className="relative z-10 text-sm font-black uppercase tracking-tight leading-tight">{group}</span>
                          <CheckCircle2 className={`w-5 h-5 relative z-10 transition-all ${selectedL4 === group ? 'scale-110' : 'opacity-0'}`} />
                        </button>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-20">
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-500 flex items-center justify-center mb-4">
                          <ArrowRight className="w-8 h-8 text-slate-500" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Select Subcategory First</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Feed Area */}
                <div className="lg:w-1/5 flex flex-col bg-slate-900">
                  <div className="p-6 border-b border-white/5 bg-slate-800/20 flex items-center justify-between">
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Live Feed</h3>
                    <div className="px-2 py-0.5 bg-blue-500/20 rounded-full">
                      <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">{filteredProducts.length} Items</span>
                    </div>
                  </div>
                  <div className="p-4 flex-grow overflow-y-auto space-y-4 custom-scrollbar">
                    {filteredProducts.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-20">
                        <Package className="w-12 h-12 text-slate-500 mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">No items found</p>
                      </div>
                    ) : (
                      filteredProducts.map((product, idx) => (
                        <motion.div 
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          key={product.id}
                          className="bg-slate-800/40 border border-white/5 rounded-2xl overflow-hidden group hover:border-blue-500/50 transition-all cursor-pointer"
                        >
                          <div className="aspect-square relative overflow-hidden">
                            <img 
                              src={product.photos[0]} 
                              alt={product.title} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-2 right-2 flex flex-col gap-1">
                              <div className="px-2 py-1 bg-slate-900/90 backdrop-blur-md rounded-lg border border-white/10">
                                <span className="text-[10px] font-black text-blue-400">{formatPrice(product.price, true)}</span>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const text = `Check out this ${product.title} on EFADO Hubs! 🚀\nPrice: ${formatPrice(product.price, true)}\nLocation: ${product.location}`;
                                  if (navigator.share) {
                                    navigator.share({ title: product.title, text, url: window.location.href });
                                  } else {
                                    navigator.clipboard.writeText(`${text}\n${window.location.href}`);
                                    alert("Promotion link copied to clipboard! Share it on social media to go viral! 🚀");
                                  }
                                }}
                                className="p-2 bg-rose-600/90 hover:bg-rose-500 text-white rounded-lg border border-white/10 shadow-lg backdrop-blur-md transition-all flex items-center gap-1 group/share"
                                title="Share & Go Viral"
                              >
                                <Globe className="w-3 h-3 animate-pulse" />
                                <span className="text-[8px] font-black uppercase tracking-tighter hidden group-hover/share:block">Viral Share</span>
                              </button>
                            </div>
                          </div>
                          <div className="p-3">
                            <h4 className="text-[10px] font-black text-white uppercase tracking-tight truncate mb-1">{product.title}</h4>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2 text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                                <MapPin className="w-3 h-3" />
                                {product.location}
                              </div>
                              <span className="text-[10px] font-black text-blue-400">{formatPrice(product.price, true)}</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(product);
                                }}
                                className="flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all border border-white/5"
                              >
                                <Plus className="w-3 h-3" />
                                <span className="text-[9px] font-black uppercase tracking-tighter">Add to Cart</span>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(product);
                                  setShowCart(true);
                                }}
                                className="flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-lg shadow-blue-500/20"
                              >
                                <ShoppingBag className="w-3 h-3" />
                                <span className="text-[9px] font-black uppercase tracking-tighter">Buy Now</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="orders"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full flex flex-col md:flex-row p-10 gap-10 overflow-hidden"
              >
                {/* Orders List */}
                <div className="md:w-1/2 flex flex-col h-full">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter">My Orders</h3>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Track your secure transactions</p>
                      <button 
                        onClick={() => setActiveView('browse')}
                        className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] hover:text-blue-400 transition-colors"
                      >
                        <ArrowRight className="w-3 h-3 rotate-180" /> Back to Products
                      </button>
                    </div>
                    <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{orders.length} Total Orders</span>
                    </div>
                  </div>

                  <div className="flex-grow overflow-y-auto space-y-4 pr-4 custom-scrollbar">
                    {orders.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white/5 rounded-[2rem] border border-dashed border-white/10 opacity-40">
                        <History className="w-16 h-16 mb-4" />
                        <p className="text-xs font-black uppercase tracking-[0.3em]">No orders yet</p>
                      </div>
                    ) : (
                      orders.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds).map(order => (
                        <button
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className={`w-full p-6 rounded-[2rem] border transition-all text-left flex items-center justify-between group ${
                            selectedOrder?.id === order.id 
                              ? 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-500/20' 
                              : 'bg-slate-800/30 border-white/5 text-slate-400 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center p-1 overflow-hidden">
                              <img src={order.items[0].photo} className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                            </div>
                            <div>
                              <p className={`text-xs font-black uppercase tracking-widest mb-1 ${selectedOrder?.id === order.id ? 'text-blue-100' : 'text-blue-500'}`}>
                                {order.orderCode}
                              </p>
                              <h4 className={`text-sm font-black uppercase tracking-tight ${selectedOrder?.id === order.id ? 'text-white' : 'text-slate-200'}`}>
                                {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
                              </h4>
                              <p className="text-[10px] font-bold opacity-60">
                                {new Date(order.createdAt?.seconds * 1000).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black mb-1">{formatPrice(order.totalAmount, true)}</p>
                            <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${order.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                              {order.status.replace('_', ' ')}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Tracking Detail */}
                <div className="md:w-1/2 flex flex-col h-full">
                  {selectedOrder ? (
                    <motion.div 
                      key={selectedOrder.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-slate-800/50 border border-white/5 rounded-[2.5rem] p-8 h-full flex flex-col overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-8 pb-8 border-b border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <Package className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID / Tracking</p>
                            <h4 className="text-xl font-black text-white">{selectedOrder.orderCode}</h4>
                            <p className="text-[10px] font-bold text-blue-400 mt-1">{selectedOrder.trackingNumber}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Method</p>
                          <h4 className="text-sm font-black text-blue-400 uppercase">{selectedOrder.paymentMethod}</h4>
                        </div>
                      </div>

                      <div className="mb-8 p-6 bg-slate-900/60 rounded-3xl border border-white/5">
                        <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">Package Contents</h5>
                        <div className="space-y-3">
                          {selectedOrder.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/5">
                                  <img src={item.photo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </div>
                                <p className="text-xs font-bold text-white uppercase tracking-tight truncate max-w-[150px]">{item.productTitle}</p>
                              </div>
                              <p className="text-xs font-black text-slate-500">x{item.quantity}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex-grow overflow-y-auto space-y-10 pr-4 custom-scrollbar pb-10">
                        {/* Tracking Timeline */}
                        <div className="relative pl-10">
                          {/* Vertical Line */}
                          <div className="absolute left-[1.125rem] top-2 bottom-2 w-0.5 bg-white/10" />
                          
                          {/* Initial Placement Milestone */}
                          <div className="relative mb-12">
                            <div className="absolute -left-10 top-0 w-6 h-6 rounded-full bg-blue-500 border-4 border-slate-900 z-10" />
                            <div>
                              <h5 className="text-xs font-black text-white uppercase tracking-widest mb-1">Delivered to Point</h5>
                              <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-tighter">
                                {selectedOrder.deliveryDetails.street}, {selectedOrder.deliveryDetails.city}
                              </p>
                              {selectedOrder.status === 'delivered' ? (
                                <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md uppercase">Completed</span>
                              ) : (
                                <span className="text-[8px] font-black text-slate-500 bg-white/5 px-2 py-0.5 rounded-md uppercase">Upcoming</span>
                              )}
                            </div>
                          </div>

                          {/* Historical Tracking Steps */}
                          {selectedOrder.trackingHistory?.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds).map((event, idx) => (
                            <div key={idx} className="relative mb-12">
                              <div className={`absolute -left-10 top-0 w-6 h-6 rounded-full border-4 border-slate-900 z-10 ${idx === 0 ? 'bg-blue-500 animate-pulse' : 'bg-slate-700'}`} />
                              <div>
                                <h5 className="text-xs font-black text-white uppercase tracking-widest mb-1">{event.status}</h5>
                                <p className="text-[10px] font-bold text-slate-300 mb-1">{event.description}</p>
                                <div className="flex items-center gap-3">
                                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                    {event.location}
                                  </p>
                                  <p className="text-[8px] font-black text-blue-400/60 uppercase tracking-widest">
                                    {event.timestamp?.seconds ? new Date(event.timestamp.seconds * 1000).toLocaleString() : 'Recent'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-auto p-6 bg-slate-950/50 rounded-3xl border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                            <Truck className="w-5 h-5 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Delivery Status</p>
                            <p className="text-xs font-black text-white uppercase">{selectedOrder.status.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => window.location.href = `mailto:${SUPPORT_EMAILS.MARKET}`}
                          className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          <Mail className="w-4 h-4" /> Help Center
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10 opacity-20">
                      <ClipboardList className="w-16 h-16 mb-6" />
                      <p className="text-xs font-black uppercase tracking-[0.3em]">Select an order to track</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Info */}
        <div className="px-10 py-6 border-t border-white/5 bg-slate-900/80 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3 text-slate-500">
            <Info className="w-4 h-4" />
            <p className="text-[10px] font-bold uppercase tracking-widest">
              {selectedL4 
                ? `Ready to upload in: ${selectedL1} > ${selectedL2} > ${selectedL3} > ${selectedL4}`
                : "Complete the 4-level selection to proceed with product listing."}
            </p>
          </div>
          {selectedL4 && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20 hover:scale-105 transition-all"
            >
              Proceed with Upload
            </motion.button>
          )}
        </div>
      </div>

      {/* Registration Modal */}
      <AnimatePresence>
        {showRegModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl"
          >
            <VendorRegistrationFlow 
              onClose={() => setShowRegModal(false)}
              categories={MODERN_CATEGORIES}
              hubName="Modern Market Hub"
              accentColor="cyan"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart & Checkout Drawer */}
      <AnimatePresence>
        {showCart && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex justify-end bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="w-full max-w-md bg-slate-900 h-full shadow-2xl flex flex-col border-l border-white/10"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-6 h-6 text-blue-400" />
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Your Cart</h3>
                </div>
                <button onClick={() => { setShowCart(false); setCheckoutStep('cart'); }} className="p-2 text-slate-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
                {checkoutStep === 'cart' && (
                  <div className="space-y-4">
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center py-20 opacity-30">
                        <ShoppingBasket className="w-16 h-16 mb-4" />
                        <p className="font-black uppercase tracking-widest text-xs">Cart is empty</p>
                      </div>
                    ) : (
                      cart.map(item => (
                        <div key={item.product.id} className="bg-slate-800/50 border border-white/5 rounded-2xl p-4 flex gap-4">
                          <img src={item.product.photos[0]} className="w-20 h-20 rounded-xl object-cover" referrerPolicy="no-referrer" />
                          <div className="flex-grow">
                            <h4 className="text-xs font-black text-white uppercase tracking-tight mb-1">{item.product.title}</h4>
                            <p className="text-sm font-black text-blue-400 mb-3">{formatPrice(item.product.price, true)}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 bg-slate-900 rounded-lg p-1 border border-white/5">
                                <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 hover:text-white text-slate-500"><Minus className="w-3 h-3" /></button>
                                <span className="text-xs font-black text-white w-4 text-center">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 hover:text-white text-slate-500"><Plus className="w-3 h-3" /></button>
                              </div>
                              <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-300 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {checkoutStep === 'address' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                      <MapPin className="w-5 h-5 text-blue-400" />
                      <h4 className="text-sm font-black text-white uppercase tracking-widest">Delivery Address</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <input 
                        placeholder="Full Name"
                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none"
                        value={deliveryAddress.fullName}
                        onChange={e => setDeliveryAddress({...deliveryAddress, fullName: e.target.value})}
                      />
                      <input 
                        placeholder="Phone Number"
                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none"
                        value={deliveryAddress.phone}
                        onChange={e => setDeliveryAddress({...deliveryAddress, phone: e.target.value})}
                      />
                      <input 
                        placeholder="Street Address"
                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none"
                        value={deliveryAddress.street}
                        onChange={e => setDeliveryAddress({...deliveryAddress, street: e.target.value})}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input 
                          placeholder="City"
                          className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none"
                          value={deliveryAddress.city}
                          onChange={e => setDeliveryAddress({...deliveryAddress, city: e.target.value})}
                        />
                        <input 
                          placeholder="State"
                          className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none"
                          value={deliveryAddress.state}
                          onChange={e => setDeliveryAddress({...deliveryAddress, state: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {checkoutStep === 'payment' && (
                  <div className="space-y-6 overflow-y-auto no-scrollbar max-h-[50vh]">
                    <div className="space-y-4 mb-6">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Strategic Selection</label>
                      <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
                        {paymentCategories.map((cat) => (
                          <div 
                            key={cat.id}
                            className="bg-slate-800/40 border border-white/5 rounded-[2rem] p-5 hover:border-blue-500/30 hover:bg-slate-800 transition-all group"
                          >
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-slate-900 rounded-2xl border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                {cat.icon}
                              </div>
                              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{cat.title}</h4>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {cat.options.map(opt => (
                                <button
                                  key={opt.id}
                                  onClick={() => setPaymentMethod(opt.id)}
                                  className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${
                                    paymentMethod === opt.id
                                      ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/20'
                                      : 'bg-slate-950/50 border-white/5 text-slate-400 hover:bg-slate-900'
                                  }`}
                                >
                                  {opt.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      {(paymentMethod === 'bank' || paymentMethod === 'opay' || paymentMethod === 'ussd') && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 pt-4 border-t border-white/5"
                        >
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">Strategic Bank Details</label>
                          <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                            <input 
                              placeholder="Search Destination Bank..."
                              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-all"
                              value={bankSearch}
                              onChange={e => {
                                setBankSearch(e.target.value);
                                setShowBankDropdown(true);
                                setAccountDetails({...accountDetails, bankName: e.target.value});
                              }}
                              onFocus={() => setShowBankDropdown(true)}
                            />
                            
                            {showBankDropdown && (
                              <div className="absolute z-[160] left-0 right-0 top-[110%] bg-slate-800 border border-white/10 rounded-xl shadow-2xl max-h-40 overflow-y-auto custom-scrollbar p-1">
                                {filteredBanks.map(bank => (
                                  <button
                                    key={bank.code}
                                    onClick={() => {
                                      setAccountDetails({...accountDetails, bankName: bank.name});
                                      setBankSearch(bank.name);
                                      setShowBankDropdown(false);
                                    }}
                                    className="w-full text-left p-2.5 hover:bg-white/5 rounded-lg transition-all flex items-center justify-between group"
                                  >
                                    <span className="text-xs font-bold text-slate-300 group-hover:text-white">{bank.name}</span>
                                    <span className="text-[10px] font-mono text-slate-600 font-bold">{bank.code}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="relative">
                            <ArrowRightLeft className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                            <input 
                              placeholder="10-Digit Account Number"
                              maxLength={10}
                              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-all"
                              value={accountDetails.accountNumber}
                              onChange={e => setAccountDetails({...accountDetails, accountNumber: e.target.value})}
                            />
                          </div>

                          {paymentMethod === 'ussd' && (
                            <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 relative group overflow-hidden">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -translate-y-6 translate-x-6" />
                              <div className="flex items-center justify-between mb-2 relative z-10">
                                <Smartphone className="w-4 h-4 text-blue-400" />
                                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Tactical USSD Code</span>
                              </div>
                              <div className="bg-slate-900 p-3 rounded-xl border border-white/5 flex items-center justify-between relative z-10">
                                <code className="text-blue-400 font-mono font-black text-sm">
                                  *555*88*EFADO*{user.uid.slice(0,5).toUpperCase()}*{Math.round((cartTotal * (isCouponApplied ? 0.8 : 1)) + (shippingMethod === 'Standard' ? 0 : (shippingMethod === 'Expedited' ? 15 : 50)))}#
                                </code>
                                <Copy className="w-4 h-4 text-slate-600 cursor-pointer hover:text-white transition-colors" />
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="pt-6 border-t border-white/5">
                      <div className="flex items-center gap-3 mb-4">
                        <Ticket className="w-5 h-5 text-yellow-400" />
                        <h4 className="text-sm font-black text-white uppercase tracking-widest">Apply Coupon</h4>
                      </div>
                      <div className="flex gap-2">
                        <input 
                          placeholder="Enter Coupon Code (e.g. EFADO20)"
                          className="flex-grow bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-blue-500 outline-none uppercase"
                          value={couponCode}
                          onChange={e => setCouponCode(e.target.value)}
                        />
                        <button 
                          onClick={() => {
                            const codes: Record<string, number> = {
                              'EFADO20': 0.2,
                              'WELCOME': 0.1,
                              'SUMMER50': 0.5,
                              'LOCAL10': 0.1
                            };
                            const discount = codes[couponCode.toUpperCase()];
                            if(discount) {
                              setIsCouponApplied(true);
                            } else {
                              alert("Invalid Coupon Code");
                            }
                          }}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            isCouponApplied ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          {isCouponApplied ? 'Applied' : 'Apply'}
                        </button>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/5">
                      <div className="flex items-center gap-3 mb-4">
                        <Truck className="w-5 h-5 text-emerald-400" />
                        <h4 className="text-sm font-black text-white uppercase tracking-widest">Shipping Method</h4>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { id: 'Standard', price: 0, time: '3-5 Days' },
                          { id: 'Expedited', price: 15, time: '1-2 Days' },
                          { id: 'Instant', price: 50, time: 'Same Day' }
                        ].map(method => (
                          <button
                            key={method.id}
                            onClick={() => setShippingMethod(method.id as any)}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                              shippingMethod === method.id 
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                                : 'bg-slate-800/40 border-white/5 text-slate-500'
                            }`}
                          >
                            <span className="text-[10px] font-black uppercase">{method.id} - {method.time}</span>
                            <span className="text-[10px] font-black">{method.price === 0 ? 'FREE' : formatPrice(method.price)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <SecurityGuard level="ultra" />
                  </div>
                )}

                {checkoutStep === 'processing' && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="w-32 h-32 relative mb-8">
                       <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 rounded-full border-4 border-blue-500/20 border-t-blue-500"
                       />
                       <motion.div 
                        animate={{ rotate: -360 }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-4 rounded-full border-4 border-cyan-500/20 border-b-cyan-500"
                       />
                       <div className="absolute inset-0 flex items-center justify-center">
                          <ShieldCheck className="w-12 h-12 text-blue-400" />
                       </div>
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-4">Processing Transaction</h3>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">{paymentStatusText}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-black">Secure Gateway Active via EFADO Guard</p>
                    </div>
                  </div>
                )}

                {checkoutStep === 'success' && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 relative">
                      <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 rounded-full border-2 border-emerald-500/30"
                      />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Purchase Secured!</h3>
                    <div className="bg-slate-800 p-4 rounded-2xl border border-white/5 mb-6 w-full">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Your Order Code</p>
                      <h4 className="text-2xl font-black text-blue-400 tracking-tighter">{generatedOrderCode}</h4>
                    </div>
                    <p className="text-sm text-slate-400 mb-8">
                      Secure verification code has been sent to your email. You can track your goods in the "My Orders" tab.
                    </p>
                    <div className="flex flex-col gap-3 w-full">
                      <button 
                        onClick={() => { setActiveView('orders'); setShowCart(false); setCheckoutStep('cart'); }}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20"
                      >
                        Track Order Now
                      </button>
                      <button 
                        onClick={() => { setShowCart(false); setCheckoutStep('cart'); }}
                        className="w-full py-4 bg-white/5 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all"
                      >
                        Continue Shopping
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {checkoutStep !== 'success' && cart.length > 0 && (
                <div className="p-8 border-t border-white/5 bg-slate-800/80 backdrop-blur-xl">
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[10px] font-black uppercase tracking-widest">Subtotal</span>
                      <span className="text-[10px] font-black">{formatPrice(cartTotal, true)}</span>
                    </div>
                    {isCouponApplied && (
                      <div className="flex items-center justify-between text-emerald-400">
                        <span className="text-[10px] font-black uppercase tracking-widest">Discount (EFADO20)</span>
                        <span className="text-[10px] font-black">-{formatPrice(cartTotal * 0.2, true)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[10px] font-black uppercase tracking-widest">Delivery ({shippingMethod})</span>
                      <span className="text-[10px] font-black">
                        {shippingMethod === 'Standard' ? 'FREE' : formatPrice(shippingMethod === 'Expedited' ? 15 : 50, true)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-indigo-400/60">
                      <span className="text-[10px] font-black uppercase tracking-widest">Service Charge (1.3%)</span>
                      <span className="text-[10px] font-black">
                        {formatPrice((cartTotal * (isCouponApplied ? 0.8 : 1)) * 0.013, true)}
                      </span>
                    </div>
                    {checkoutStep === 'payment' && (
                      <div className="flex items-center justify-between text-blue-400/60">
                        <span className="text-[10px] font-black uppercase tracking-widest">Payment Mode</span>
                        <span className="text-[10px] font-black uppercase tracking-tight">{paymentMethod === 'pod' ? 'Offline (Delivery)' : 'Online (Instant)'}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-xs font-black text-white uppercase tracking-widest">Grand Total</span>
                      <span className="text-xl font-black text-blue-400">
                        {formatPrice(
                          ((cartTotal * (isCouponApplied ? 0.8 : 1)) * 1.013) + 
                          (shippingMethod === 'Standard' ? 0 : (shippingMethod === 'Expedited' ? 15 : 50)),
                          true
                        )}
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {checkoutStep === 'cart' ? 'Proceed to Address' : (checkoutStep === 'address' ? 'Proceed to Payment' : 'Complete Secure Order')}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <TransactionPinModal 
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onConfirm={finalizePurchase}
        amount={cartTotal}
        action="Marketplace Purchase"
      />
    </motion.div>
  );
};
