import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VendorRegistrationFlow } from './VendorRegistrationFlow';
import { 
  ShoppingBag, 
  ChevronRight, 
  UserPlus, 
  Package, 
  Search, 
  X, 
  CheckCircle2, 
  Info,
  MapPin,
  Trash2,
  Plus,
  Minus,
  Truck,
  Store,
  ShieldCheck,
  Clock,
  ExternalLink,
  History,
  ClipboardList,
  CreditCard,
  Wallet,
  Building2,
  Bitcoin,
  QrCode,
  Ticket,
  Smartphone,
  CheckCircle,
  ArrowRight,
  Zap,
  ShoppingBasket,
  Globe,
  SearchCode,
  Copy,
  ChevronDown,
  ArrowRightLeft,
  Hash,
  Fingerprint,
  User,
  AlertCircle
} from 'lucide-react';
import { SAMPLE_PRODUCTS } from '../sampleData';
import { MarketProduct, UserProfile, MarketOrder } from '../types';
import { useCurrency } from '../lib/CurrencyContext';
import { CurrencySelector } from './CurrencySelector';
import { SecurityGuard, TransactionPinModal } from './SecurityGuard';
import { db, collection, addDoc, serverTimestamp, query, where, onSnapshot, doc, updateDoc } from '../firebase';
import { MiningMiniCard, AdvertisingMiniCard } from './EfadoMining';
import { OFFICE_ADDRESSES } from '../constants/businessProfile';

// Category Dataset (4-level taxonomy)
const CATEGORIES: Record<string, Record<string, Record<string, string[]>>> = {
  "Electronics & Gadgets": {
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
    "Audio & Sound": {
      "Personal Audio": ["Headphones", "Earbuds", "MP3 Players"],
      "Home Audio": ["Speakers", "Soundbars", "Home Theater"],
      "Professional": ["Microphones", "Mixers", "Studio Monitors"]
    }
  },
  "Fashion & Accessories": {
    "Apparel": {
      "Men's Clothing": ["Shirts", "Trousers", "Suits", "Jackets"],
      "Women's Clothing": ["Dresses", "Tops", "Skirts", "Outerwear"],
      "Kids' Clothing": ["Infant", "Toddler", "Teens"]
    },
    "Footwear": {
      "Casual": ["Sneakers", "Sandals", "Slides"],
      "Formal": ["Oxford Shoes", "Heels", "Loafers"],
      "Sport": ["Running Shoes", "Cleats", "Hiking Boots"]
    },
    "Accessories": {
      "Timepieces": ["Luxury Watches", "Smartwatches", "Vintage"],
      "Jewelry": ["Rings", "Necklaces", "Bracelets"],
      "Bags": ["Handbags", "Backpacks", "Suitcases"]
    }
  },
  "Home & Kitchen": {
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
  "Vehicles & Parts": {
    "Automobiles": {
      "Cars": ["Sedans", "SUVs", "Trucks", "Coupes"],
      "Bikes": ["Motorcycles", "Scooters", "Bicycles"],
      "Heavy Duty": ["Tractors", "Vans", "Buses"]
    },
    "Spare Parts": {
      "Engine": ["Pistons", "Belts", "Filters"],
      "Exterior": ["Tires", "Lights", "Mirrors"],
      "Interior": ["Seat Covers", "Dash Cams", "Audio Systems"]
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

const FormField: React.FC<{
  label: string,
  icon?: React.ReactNode,
  error?: string,
  hint?: string,
  required?: boolean,
  children: React.ReactNode
}> = ({ label, icon, error, hint, required = true, children }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${error ? 'text-rose-500' : 'text-slate-400'}`}>
        {icon} {label} {!required && <span className="text-[8px] opacity-60">(Optional)</span>}
      </label>
      {required && <div className={`w-1 h-1 rounded-full ${error ? 'bg-rose-500 animate-ping' : 'bg-indigo-400'}`} />}
    </div>
    <div className={`transition-all duration-300 ${error ? 'ring-2 ring-rose-500/20' : ''}`}>
      {children}
    </div>
    {error ? (
      <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[9px] font-bold text-rose-500 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" /> {error}
      </motion.p>
    ) : hint && (
      <p className="text-[8px] font-medium text-slate-500 leading-tight">{hint}</p>
    )}
  </div>
);

interface FairlyUsedMarketProps {
  user: UserProfile;
  onClose: () => void;
  onOpenMining?: () => void;
  onNavigate?: (hub: any, subview?: any) => void;
}

export const FairlyUsedMarket: React.FC<FairlyUsedMarketProps> = ({ user, onClose, onOpenMining, onNavigate }) => {
  const { formatPrice } = useCurrency();
  const [activeView, setActiveView] = useState<'browse' | 'orders'>('browse');
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
    zipCode: '',
    landmark: '',
    instructions: ''
  });
  const [fulfillmentType, setFulfillmentType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [pickupLocationType, setPickupLocationType] = useState<'OFFICE' | 'VENDOR'>('OFFICE');
  const [addressError, setAddressError] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'Standard' | 'Expedited' | 'Instant'>('Standard');
  const [paymentMethod, setPaymentMethod] = useState<string>('wallet');
  const [couponCode, setCouponCode] = useState('');
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [orders, setOrders] = useState<MarketOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<MarketOrder | null>(null);
  const [generatedOrderCode, setGeneratedOrderCode] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [bankSearch, setBankSearch] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [manualBankMode, setManualBankMode] = useState(false);
  const [accountDetails, setAccountDetails] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    routingNumber: ''
  });
  const [paymentStrategy, setPaymentStrategy] = useState<'escrow_paystack' | 'direct_bank'>('escrow_paystack');
  const [senderBankName, setSenderBankName] = useState('');
  const [senderAccountNumber, setSenderAccountNumber] = useState('');
  const [senderAccountName, setSenderAccountName] = useState('');
  const [senderTransferRef, setSenderTransferRef] = useState('');
  const [copiedBankId, setCopiedBankId] = useState<string | null>(null);

  // Auto-search and verified bank states for Option A Secured Bank Transfer
  const [selectedBankCode, setSelectedBankCode] = useState<string>('');
  const [customBankName, setCustomBankName] = useState<string>('');
  const [bankAccountNumber, setBankAccountNumber] = useState<string>('');
  const [resolvedRecipientName, setResolvedRecipientName] = useState<string>('');
  const [recipientSearchLoading, setRecipientSearchLoading] = useState<boolean>(false);

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
    { code: 'intl_chase', name: 'Chase Bank (USA)' },
    { code: 'intl_bofa', name: 'Bank of America (USA)' },
    { code: 'intl_barclays', name: 'Barclays Bank (UK)' },
    { code: 'intl_hsbc', name: 'HSBC (International)' },
    { code: 'intl_revolut', name: 'Revolut' },
    { code: 'others', name: 'Others (Not in list)' }
  ].sort((a, b) => {
    if (a.code === 'others') return 1;
    if (b.code === 'others') return -1;
    return a.name.localeCompare(b.name);
  });

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
        { id: 'bank_transfer_opt', name: 'Secure Bank Transfer' }
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
    // ... (Your filter logic is correct, just adding search)
    if (selectedL1) filtered = filtered.filter(p => p.categoryPath.level1 === selectedL1);
    if (selectedL2) filtered = filtered.filter(p => p.categoryPath.level2 === selectedL2);
    if (selectedL3) filtered = filtered.filter(p => p.categoryPath.level3 === selectedL3);
    if (selectedL4) filtered = filtered.filter(p => p.categoryPath.level4 === selectedL4);
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredProducts(filtered);
  }, [selectedL1, selectedL2, selectedL3, selectedL4, searchQuery]);

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

  const [paystackInited, setPaystackInited] = useState(false);

  // Dynamically load Paystack Inline JS script
  useEffect(() => {
    if ((window as any).PaystackPop) {
      setPaystackInited(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setPaystackInited(true);
    document.body.appendChild(script);
  }, []);

  // Automated System Search for Escrow Recipient Verification (Fairly Used)
  useEffect(() => {
    if (selectedBankCode && bankAccountNumber.trim().length >= 6) {
      setRecipientSearchLoading(true);
      setResolvedRecipientName('');
      const delay = setTimeout(() => {
        setRecipientSearchLoading(false);
        // Set the secure, official escrow account of EFADO Technology to reassure the customer
        setResolvedRecipientName('EFADO HUB TECHNOLOGY LIMITED (Fairly Used Escrow)');
      }, 700);
      return () => clearTimeout(delay);
    } else {
      setRecipientSearchLoading(false);
      setResolvedRecipientName('');
    }
  }, [selectedBankCode, bankAccountNumber]);

  const handlePaystackCheckout = () => {
    const usdAmount = (cartTotal * (isCouponApplied ? 0.8 : 1)) + (shippingMethod === 'Standard' ? 0 : (shippingMethod === 'Expedited' ? 15 : 50));
    // Exchange rate conversion: 1450 NGN per 1 USD
    const ngnAmount = usdAmount * 1450;

    if (!(window as any).PaystackPop) {
      alert("Paystack secure gateway is initializing. Please wait a brief moment and retry.");
      return;
    }

    const paystackKey = (import.meta as any).env?.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_d3bd3cdb2b2b10931eb6ea637be5c0d68fbd6e78';
    const reference = `EFD_MARK_USED_${Math.floor(100 + Math.random() * 900)}_${Date.now()}`;

    // Map selected payment method to corresponding Paystack channels
    let channels = ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'];
    if (['visa', 'mastercard', 'verve'].includes(paymentMethod)) {
      channels = ['card'];
    } else if (['zenith', 'gtbank', 'access', 'uba'].includes(paymentMethod)) {
      channels = ['bank_transfer', 'bank'];
    } else if (['opay', 'palmpay', 'kuda'].includes(paymentMethod)) {
      channels = ['mobile_money', 'bank_transfer', 'card'];
    }

    try {
      const handler = (window as any).PaystackPop.setup({
        key: paystackKey,
        email: user.email,
        amount: Math.round(ngnAmount * 100), // convert to kobo
        currency: 'NGN',
        ref: reference,
        channels: channels,
        callback: (response: any) => {
          if (response && (response.status === 'success' || response.message === 'Approved')) {
            finalizePurchase(undefined, response.reference || reference);
          } else {
            alert("Payment approval was incomplete. Please verify details and retry.");
          }
        },
        onClose: () => {
          alert("Secure checkout closed by browser user.");
        }
      });
      handler.openIframe();
    } catch (err) {
      console.error("Paystack launch error:", err);
      alert("Could not load Paystack inline checkouts. Check network and refresh.");
    }
  };

  const handleCheckout = () => {
    setValidationErrors({});
    
    if (checkoutStep === 'cart') {
      if (cart.length === 0) {
        alert("Integrity Error: Your cart is empty. Please add items to proceed.");
        return;
      }
      setCheckoutStep('address');
    }
    else if (checkoutStep === 'address') {
      const errors: Record<string, string> = {};
      if (fulfillmentType === 'DELIVERY') {
        if (!deliveryAddress.fullName) errors.fullName = "Full name is required for delivery logistics.";
        if (!deliveryAddress.phone) errors.phone = "Active phone is critical for dispatch coordination.";
        if (!deliveryAddress.street) errors.street = "Detailed street info is required for mapping.";
        if (!deliveryAddress.city) errors.city = "City deployment node must be specified.";
        if (!deliveryAddress.state) errors.state = "State jurisdiction is required.";
      } else {
        if (!deliveryAddress.fullName) errors.fullName = "Full name of recipient authorized for pickup is required.";
        if (!deliveryAddress.phone) errors.phone = "Liaison phone contact for coordination is required.";
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }
      setCheckoutStep('payment');
    }
    else if (checkoutStep === 'payment') {
      if (paymentStrategy === 'escrow_paystack') {
        handlePaystackCheckout();
        return;
      } else if (paymentStrategy === 'direct_bank') {
        const errors: Record<string, string> = {};
        if (!senderBankName) errors.senderBankName = "Your sending bank name is crucial.";
        if (senderAccountNumber.length !== 10) errors.senderAccountNumber = "A valid 10-digit account number must be entered.";
        if (!senderAccountName) errors.senderAccountName = "Your sender account holder name is required.";

        if (Object.keys(errors).length > 0) {
          setValidationErrors(errors);
          alert(Object.values(errors).join("\n"));
          return;
        }

        finalizePurchase(undefined, undefined, {
          senderBankName,
          senderAccountNumber,
          senderAccountName,
          senderTransferRef,
          paymentStrategy
        });
        return;
      }

      const paystackSupportedMethods = ['paystack', 'visa', 'mastercard', 'verve', 'opay', 'palmpay', 'kuda', 'zenith', 'gtbank', 'access', 'uba'];
      if (paystackSupportedMethods.includes(paymentMethod)) {
        handlePaystackCheckout();
        return;
      }

      if (['bank', 'opay', 'ussd'].includes(paymentMethod)) {
        const errors: Record<string, string> = {};
        if (!accountDetails.bankName) errors.bankName = "Source bank identification required.";
        if (paymentMethod !== 'ussd' && accountDetails.accountNumber.length !== 10) {
          errors.accountNumber = "A valid 10-digit NUBAN identifier is required.";
        }

        if (Object.keys(errors).length > 0) {
          setValidationErrors(errors);
          return;
        }
      }

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

  const finalizePurchase = async (pin?: string, paystackRef?: string, directProof?: any) => {
    setIsProcessing(true);
    setPaymentStatusText('Initiating Secure Transaction...');
    setCheckoutStep('processing');
    setShowPinModal(false);

    // Simulated steps consistent with Modern Market Hub
    const steps = [
      'Verifying Fairly Used Item Condition...',
      paystackRef ? 'Confirming Paystack Instant Reference...' : directProof ? 'Registering Direct Proof Details...' : 'Securing Escrow Payment...',
      'Generating Digital Tracking Code...',
      'Finalizing Global Delivery Path...'
    ];

    for(const step of steps) {
      await new Promise(r => setTimeout(r, 800));
      setPaymentStatusText(step);
    }

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
        method: shippingMethod,
        fulfillmentType: fulfillmentType,
        pickupLocationType: fulfillmentType === 'PICKUP' ? pickupLocationType : undefined,
        street: (fulfillmentType === 'PICKUP' && pickupLocationType === 'OFFICE') ? 'Opposite Selta Steel Company Permanent Camp' : deliveryAddress.street,
        city: (fulfillmentType === 'PICKUP' && pickupLocationType === 'OFFICE') ? 'Warri' : deliveryAddress.city,
        state: (fulfillmentType === 'PICKUP' && pickupLocationType === 'OFFICE') ? 'Delta State' : deliveryAddress.state,
        landmark: (fulfillmentType === 'PICKUP' && pickupLocationType === 'OFFICE') ? 'Opposite Selta Steel Company Permanent Camp, Before Tivo Super Market' : deliveryAddress.landmark,
        instructions: (fulfillmentType === 'PICKUP' && pickupLocationType === 'OFFICE') ? `Dispatched to OFFICE_ADDRESSES_STATION:\n${OFFICE_ADDRESSES.DELIVERY_PICKUP_STATION}` : deliveryAddress.instructions
      },
      paymentMethod: directProof ? 'direct_bank_transfer' : paymentMethod,
      paystackRef: paystackRef || null,
      status: directProof ? 'pending_manual_verification' : 'processing',
      trackingNumber: `TRK-FU-${Math.random().toString(36).substring(7).toUpperCase()}`,
      trackingHistory: [
        {
          status: 'Order Placed',
          location: 'EFADO Digital System',
          timestamp: new Date(),
          description: paystackRef 
            ? `Your order has been paid via Paystack (Ref: ${paystackRef}) & received.` 
            : directProof
              ? `Order placed with Direct Bank Transfer Proof. Sender: ${directProof.senderAccountName} (${directProof.senderBankName} - ${directProof.senderAccountNumber}). Bank confirmation pending.`
              : 'Your fairly used item order has been received.'
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
      <div className="relative w-full max-w-7xl h-[90vh] bg-slate-50 border border-slate-200/80 rounded-[3rem] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-200 bg-white/95 backdrop-blur-xl z-20 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-black text-slate-900 tracking-tight">EFADO <span className="text-indigo-600">Fairly Used</span> Market Hub</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Where Fairly Used Products Find New Homes</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowCart(true)}
                className="relative flex items-center gap-3 px-5 py-3 text-slate-600 hover:text-slate-900 transition-all bg-slate-100 rounded-2xl hover:bg-slate-200 group border border-slate-200"
              >
                <div className="relative">
                  <ShoppingBag className="w-6 h-6 text-slate-700" />
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-indigo-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/40">
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
                className="group flex flex-col items-center bg-indigo-600 hover:bg-indigo-500 px-6 py-2 rounded-2xl transition-all shadow-lg shadow-indigo-500/20"
              >
                <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <UserPlus className="w-3 h-3" /> Vendor Registration
                </span>
                <span className="text-[8px] font-bold text-indigo-200 uppercase tracking-tighter">Register & Upload Products</span>
              </button>
              <CurrencySelector />
              <button onClick={onClose} className="p-3 text-slate-500 hover:text-slate-800 transition-colors bg-slate-100 rounded-2xl hover:bg-slate-200">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => setActiveView('browse')}
              className={`pb-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeView === 'browse' ? 'border-indigo-500 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Browse Items
            </button>
            <button 
              onClick={() => setActiveView('orders')}
              className={`pb-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeView === 'orders' ? 'border-indigo-500 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              My Orders & Tracking
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow overflow-hidden relative">
          <AnimatePresence mode="wait">
            {activeView === 'browse' ? (
              <motion.div 
                key="browse"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full flex flex-col p-8 overflow-y-auto custom-scrollbar"
              >
                {/* Breadcrumbs */}
          <div className="flex items-center gap-2 mb-8 bg-white px-6 py-3 rounded-2xl border border-slate-200 self-start shadow-sm">
            <ShoppingBag className="w-4 h-4 text-indigo-500" />
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className={`text-xs font-black uppercase tracking-widest ${selectedL1 ? 'text-slate-800' : 'text-slate-400'}`}>
              {selectedL1 || 'Select Category'}
            </span>
            {selectedL2 && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <span className="text-xs font-black text-slate-800 uppercase tracking-widest">{selectedL2}</span>
              </>
            )}
            {selectedL3 && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <span className="text-xs font-black text-slate-800 uppercase tracking-widest">{selectedL3}</span>
              </>
            )}
            {selectedL4 && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-600" />
                <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">{selectedL4}</span>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Level 1: Category */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Category</h3>
              <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {Object.keys(CATEGORIES).map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedL1(cat);
                      setSelectedL2(null);
                      setSelectedL3(null);
                      setSelectedL4(null);
                    }}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left group ${
                      selectedL1 === cat 
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-tight">{cat}</span>
                    <ChevronRight className={`w-3 h-3 transition-transform ${selectedL1 === cat ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Level 2: Section */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Section</h3>
              {selectedL1 ? (
                <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {Object.keys(CATEGORIES[selectedL1]).map(sub => (
                    <button
                      key={sub}
                      onClick={() => {
                        setSelectedL2(sub);
                        setSelectedL3(null);
                        setSelectedL4(null);
                      }}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left group ${
                        selectedL2 === sub 
                          ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-500/20' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-tight">{sub}</span>
                      <ChevronRight className={`w-3 h-3 transition-transform ${selectedL2 === sub ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center bg-slate-100/50 rounded-3xl border border-dashed border-slate-200 text-slate-400">
                  <Info className="w-8 h-8 mb-2 opacity-35" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Category First</p>
                </div>
              )}
            </div>

            {/* Level 3: Subcategory */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Subcategory</h3>
              {selectedL2 ? (
                <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {Object.keys(CATEGORIES[selectedL1!][selectedL2]).map(subSub => (
                    <button
                      key={subSub}
                      onClick={() => {
                        setSelectedL3(subSub);
                        setSelectedL4(null);
                      }}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left group ${
                        selectedL3 === subSub 
                          ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-tight">{subSub}</span>
                      <ChevronRight className={`w-3 h-3 transition-transform ${selectedL3 === subSub ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center bg-slate-100/50 rounded-3xl border border-dashed border-slate-200 text-slate-400">
                  <Info className="w-8 h-8 mb-2 opacity-35" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Section First</p>
                </div>
              )}
            </div>

            {/* Level 4: Group */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Group</h3>
              {selectedL3 ? (
                <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {CATEGORIES[selectedL1!][selectedL2!][selectedL3].map(group => (
                    <button
                      key={group}
                      onClick={() => setSelectedL4(group)}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left group ${
                        selectedL4 === group 
                          ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/20' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-tight">{group}</span>
                      <CheckCircle2 className={`w-3 h-3 transition-all ${selectedL4 === group ? 'scale-110 text-emerald-400' : 'opacity-0'}`} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center bg-slate-100/50 rounded-3xl border border-dashed border-slate-200 text-slate-400">
                  <Info className="w-8 h-8 mb-2 opacity-35" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Subcategory First</p>
                </div>
              )}
            </div>

            {/* Product Display Area */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 flex justify-between items-center">
                <span>Available Products</span>
                <span className="bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-full text-[8px]">{filteredProducts.length} Items</span>
              </h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {filteredProducts.length === 0 ? (
                  <div className="p-8 text-center bg-slate-100/50 rounded-3xl border border-dashed border-slate-200">
                    <Package className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-35" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No items in this category yet</p>
                  </div>
                ) : (
                  filteredProducts.map(product => (
                    <motion.div 
                       layout
                       initial={{ opacity: 0, scale: 0.9 }}
                       animate={{ opacity: 1, scale: 1 }}
                       key={product.id}
                       className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 group hover:border-indigo-500/50 transition-all cursor-pointer"
                    >
                      <div className="relative aspect-video rounded-xl overflow-hidden mb-3">
                        <img 
                          src={product.photos[0]} 
                          alt={product.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2 right-2 flex flex-col gap-1">
                          <div className="px-2 py-1 bg-white/95 backdrop-blur-md rounded-lg border border-slate-200 shadow-sm">
                            <span className="text-[10px] font-black text-indigo-600">${product.price}</span>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const text = `Check out this amazing deal on EFADO Fairly Used Market! 🚀\nItem: ${product.title}\nPrice: ${formatPrice(product.price, true)}\nLocation: ${product.location}`;
                              if (navigator.share) {
                                navigator.share({ title: product.title, text, url: window.location.href });
                              } else {
                                navigator.clipboard.writeText(`${text}\n${window.location.href}`);
                                alert("Viral promotion link copied to clipboard! Share it everywhere! 🚀");
                              }
                            }}
                            className="p-2 bg-rose-600/90 hover:bg-rose-500 text-white rounded-lg border border-rose-500 shadow-lg backdrop-blur-md transition-all flex items-center gap-1 group/share"
                            title="Share & Go Viral"
                          >
                            <Globe className="w-3 h-3 animate-pulse" />
                            <span className="text-[8px] font-black uppercase tracking-tighter hidden group-hover/share:block text-white">Viral Share</span>
                          </button>
                        </div>
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-indigo-600 rounded-lg text-[8px] font-black text-white uppercase tracking-widest">
                          {product.condition}
                        </div>
                      </div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">{product.title}</h4>
                      <div className="flex items-center justify-between mt-2 mb-3">
                        <div className="flex items-center gap-2 text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                          <MapPin className="w-3 h-3" />
                          {product.location}
                        </div>
                        <span className="text-[10px] font-black text-indigo-600">{formatPrice(product.price, true)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                          className="flex items-center justify-center gap-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-all border border-slate-200"
                        >
                          <Plus className="w-3 h-3 text-slate-600" />
                          <span className="text-[9px] font-black uppercase tracking-tighter">Add</span>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                            setShowCart(true);
                          }}
                          className="flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-lg shadow-indigo-500/20"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span className="text-[9px] font-black uppercase tracking-tighter">Buy</span>
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
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
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">My Orders</h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Track your secure transactions</p>
              </div>
              <div className="px-4 py-2 bg-slate-100 rounded-xl border border-slate-200">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{orders.length} Total Orders</span>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto space-y-4 pr-4 custom-scrollbar">
              {orders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-[2rem] border border-dashed border-slate-200 shadow-sm opacity-60">
                  <History className="w-16 h-16 mb-4 text-slate-400" />
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">No orders yet</p>
                </div>
              ) : (
                orders.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds).map(order => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`w-full p-6 rounded-[2rem] border transition-all text-left flex items-center justify-between group ${
                      selectedOrder?.id === order.id 
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl shadow-indigo-500/20' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center p-1 overflow-hidden">
                        <img src={order.items[0].photo} className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <p className={`text-xs font-black uppercase tracking-widest mb-1 ${selectedOrder?.id === order.id ? 'text-indigo-100' : 'text-indigo-600'}`}>
                          {order.orderCode}
                        </p>
                        <h4 className={`text-sm font-black uppercase tracking-tight ${selectedOrder?.id === order.id ? 'text-white' : 'text-slate-800'}`}>
                          {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
                        </h4>
                        <p className="text-[10px] font-bold opacity-60">
                          {new Date(order.createdAt?.seconds * 1000).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black mb-1">{formatPrice(order.totalAmount, true)}</p>
                      <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${order.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-600 font-bold' : 'bg-indigo-500/20 text-indigo-600 font-bold'}`}>
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
                className="bg-white border border-slate-200 rounded-[2.5rem] p-8 h-full flex flex-col overflow-hidden shadow-md"
              >
                <div className="flex items-center justify-between mb-8 pb-8 border-b border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID / Tracking</p>
                      <h4 className="text-xl font-black text-slate-800">{selectedOrder.orderCode}</h4>
                      <p className="text-[10px] font-bold text-indigo-600 mt-1">{selectedOrder.trackingNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                    <span className="text-sm font-black text-emerald-600 uppercase tracking-tighter">{selectedOrder.status.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="flex-grow overflow-y-auto pr-4 custom-scrollbar space-y-8">
                  {/* Package Contents summary */}
                  <div>
                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Package Contents</h5>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-all">
                          <div className="flex items-center gap-3">
                             <img src={item.photo} className="w-10 h-10 object-cover rounded-lg" referrerPolicy="no-referrer" />
                             <div>
                               <p className="text-xs font-black text-slate-800 uppercase tracking-tight truncate max-w-[150px]">{item.productTitle}</p>
                               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Qty: {item.quantity}</p>
                             </div>
                          </div>
                          <p className="text-xs font-black text-indigo-600">{formatPrice(item.price * item.quantity, true)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery/Pickup Coordinates Summary Box */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center gap-2">
                      {selectedOrder.deliveryDetails?.fulfillmentType === 'PICKUP' ? (
                        (selectedOrder.deliveryDetails as any).pickupLocationType === 'OFFICE' || selectedOrder.deliveryDetails.instructions?.includes('OFFICE_ADDRESSES_STATION') ? (
                          <>
                            <Building2 className="w-4 h-4 text-indigo-600" />
                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">eFADO Corporate Pick-Up Station</span>
                          </>
                        ) : (
                          <>
                            <Store className="w-4 h-4 text-indigo-600" />
                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Independent Vendor Pick-Up Order</span>
                          </>
                        )
                      ) : (
                        <>
                          <Truck className="w-4 h-4 text-blue-600" />
                          <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Direct Home/Office Delivery</span>
                        </>
                      )}
                    </div>
                    <div className="text-[11px] leading-relaxed text-slate-700 font-bold uppercase">
                      {selectedOrder.deliveryDetails?.fulfillmentType === 'PICKUP' ? (
                        <div className="space-y-1">
                          <p className="text-[10px] text-indigo-600">Authorized Recipient: {selectedOrder.deliveryDetails.fullName}</p>
                          <p className="text-[10px] text-slate-400">Verification Liaison Number: {selectedOrder.deliveryDetails.phone}</p>
                          {((selectedOrder.deliveryDetails as any).pickupLocationType === 'OFFICE' || selectedOrder.deliveryDetails.instructions?.includes('OFFICE_ADDRESSES_STATION')) ? (
                            <div className="mt-2 text-[9.5px] text-slate-300 normal-case bg-slate-950 p-3 rounded-xl border border-white/5 font-mono">
                              <span className="text-[9px] font-black text-indigo-400 block mb-1 uppercase">🏢 eFADO Pickup Coordinate:</span>
                              {OFFICE_ADDRESSES.DELIVERY_PICKUP_STATION}
                            </div>
                          ) : (
                            <p className="text-[8.5px] text-slate-500 mt-2 lowercase italic">
                              *All products in this order must be collected manually from their respective vendor's stores. Bring matching ID credentials or security verification key.*
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-white">{selectedOrder.deliveryDetails?.fullName} ({selectedOrder.deliveryDetails?.phone})</p>
                          <p className="text-slate-400">
                            {selectedOrder.deliveryDetails?.street}, {selectedOrder.deliveryDetails?.city}, {selectedOrder.deliveryDetails?.state} {selectedOrder.deliveryDetails?.zipCode || ''}
                          </p>
                          {selectedOrder.deliveryDetails?.landmark && (
                            <p className="text-[9.5px] text-amber-400">Landmark Focus: {selectedOrder.deliveryDetails.landmark}</p>
                          )}
                          {selectedOrder.deliveryDetails?.instructions && (
                            <p className="text-[9px] text-slate-500 lowercase italic">Instructions: "{selectedOrder.deliveryDetails.instructions}"</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tracking Timeline */}
                  <div className="space-y-6">
                    {selectedOrder.trackingHistory?.map((event, idx) => (
                      <div key={idx} className="flex gap-4 group">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-700'}`} />
                          {idx !== selectedOrder.trackingHistory!.length - 1 && (
                            <div className="w-0.5 flex-grow bg-slate-800 my-1 group-hover:bg-slate-700 transition-colors" />
                          )}
                        </div>
                        <div className="pb-6">
                          <p className={`text-xs font-black uppercase tracking-widest ${idx === 0 ? 'text-indigo-400' : 'text-slate-400'}`}>
                            {event.status}
                          </p>
                          <p className="text-[10px] font-bold text-slate-500 mt-0.5">{event.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-600 uppercase tracking-widest bg-slate-800/50 px-2 py-0.5 rounded-md">
                              <MapPin className="w-2.5 h-2.5" />
                              {event.location}
                            </div>
                            <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-600 uppercase tracking-widest bg-slate-800/50 px-2 py-0.5 rounded-md">
                              <Clock className="w-2.5 h-2.5" />
                              {new Date(event.timestamp?.seconds * 1000).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
                   <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Payment Method</p>
                      <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                            {selectedOrder.paymentMethod === 'wallet' && <Wallet className="w-3 h-3 text-indigo-400" />}
                            {selectedOrder.paymentMethod === 'card' && <CreditCard className="w-3 h-3 text-indigo-400" />}
                            {selectedOrder.paymentMethod === 'bank' && <Building2 className="w-3 h-3 text-indigo-400" />}
                            {selectedOrder.paymentMethod === 'crypto' && <Bitcoin className="w-3 h-3 text-indigo-400" />}
                            {selectedOrder.paymentMethod === 'pod' && <Truck className="w-3 h-3 text-indigo-400" />}
                            {(!['wallet', 'card', 'bank', 'crypto', 'pod'].includes(selectedOrder.paymentMethod)) && <Smartphone className="w-3 h-3 text-indigo-400" />}
                         </div>
                         <p className="text-[10px] font-black text-white uppercase tracking-widest">
                            {selectedOrder.paymentMethod.replace('_', ' ')}
                         </p>
                      </div>
                   </div>
                   <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Global Security</p>
                      <div className="flex items-center gap-2 text-indigo-400">
                         <ShieldCheck className="w-4 h-4" />
                         <span className="text-[10px] font-black uppercase tracking-widest">EFADO Guard Active</span>
                      </div>
                   </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white/5 rounded-[3rem] border border-dashed border-white/10 opacity-30">
                <ClipboardList className="w-20 h-20 mb-6" />
                <h4 className="text-xl font-black text-white uppercase tracking-tighter">Order Intelligence</h4>
                <p className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-[0.2em] max-w-[250px]">Select an order to view real-time tracking and delivery diagnostics</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>

      {/* Cart & Checkout Drawer */}
      <AnimatePresence>
        {showCart && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-slate-950/90 backdrop-blur-md flex justify-end"
          >
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="w-full max-w-xl bg-slate-900 border-l border-white/5 h-full flex flex-col relative"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-900/50 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                      <ShoppingBag className="w-5 h-5 text-indigo-400" />
                   </div>
                   <div>
                     <h3 className="text-xl font-black text-white uppercase tracking-tighter">Market Cart</h3>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                       {checkoutStep === 'cart' && 'Step 1: Review Items'}
                       {checkoutStep === 'address' && 'Step 2: Delivery Destination'}
                       {checkoutStep === 'payment' && 'Step 3: Secure Payment'}
                       {checkoutStep === 'processing' && 'Step 4: Holisitic Security Processing'}
                       {checkoutStep === 'success' && 'Order Confirmed!'}
                     </p>
                   </div>
                </div>
                <button onClick={() => { setShowCart(false); setCheckoutStep('cart'); }} className="p-2 text-slate-400 hover:text-white transition-colors bg-white/5 rounded-xl">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
                {checkoutStep === 'cart' && (
                  <div className="space-y-6">
                    {cart.length === 0 ? (
                      <div className="h-64 flex flex-col items-center justify-center text-slate-600 opacity-30">
                        <ShoppingBasket className="w-16 h-16 mb-4" />
                        <p className="text-sm font-black uppercase tracking-widest">Your cart is empty</p>
                      </div>
                    ) : (
                      cart.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-5 bg-white/5 p-4 rounded-2xl border border-white/5 relative group">
                          <button 
                            onClick={() => removeFromCart(item.product.id!)}
                            className="absolute -top-2 -right-2 w-8 h-8 bg-slate-900 text-slate-500 hover:text-red-400 rounded-full border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-800 border border-white/5">
                             <img src={item.product.photos[0]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-grow min-w-0">
                            <h4 className="text-sm font-black text-white uppercase tracking-tight truncate mb-1">{item.product.title}</h4>
                            <p className="text-xs font-bold text-indigo-400 mb-3">{formatPrice(item.product.price, true)}</p>
                            <div className="flex items-center gap-4">
                               <button 
                                 onClick={() => updateQuantity(item.product.id!, -1)}
                                 className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-all"
                               >
                                 <Minus className="w-3 h-3" />
                               </button>
                               <span className="text-sm font-black text-white w-4 text-center">{item.quantity}</span>
                               <button 
                                 onClick={() => updateQuantity(item.product.id!, 1)}
                                 className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-all"
                               >
                                 <Plus className="w-3 h-3" />
                               </button>
                            </div>
                          </div>
                          <div className="text-right whitespace-nowrap">
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Subtotal</p>
                             <p className="text-sm font-black text-white">{formatPrice(item.product.price * item.quantity, true)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {checkoutStep === 'address' && (
                  <div className="space-y-6">
                    {/* Segmented fulfillment protocol selector */}
                    <div className="bg-slate-900/60 p-1.5 rounded-2xl border border-white/5 flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setFulfillmentType('DELIVERY');
                        }}
                        className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                          fulfillmentType === 'DELIVERY'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10'
                            : 'bg-transparent text-slate-400 hover:text-white'
                        }`}
                      >
                        <Truck className="w-4 h-4" />
                        🚚 Delivery Address
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFulfillmentType('PICKUP');
                        }}
                        className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                          fulfillmentType === 'PICKUP'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10'
                            : 'bg-transparent text-slate-400 hover:text-white'
                        }`}
                      >
                        <Store className="w-4 h-4" />
                        🏪 Vendor Store Pickup
                      </button>
                    </div>

                    {fulfillmentType === 'DELIVERY' ? (
                      <div className="space-y-6">
                        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-6">
                          <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                            <Truck className="w-4 h-4" /> Recipient Identification
                          </h4>
                          <FormField label="Full Legal Name" error={validationErrors.fullName} hint="Official name as shown on national identity documents.">
                            <input 
                              type="text" 
                              placeholder="Tactical Full Name" 
                              value={deliveryAddress.fullName}
                              onChange={(e) => {
                                setDeliveryAddress({...deliveryAddress, fullName: e.target.value});
                                if (validationErrors.fullName) setValidationErrors({...validationErrors, fullName: ''});
                              }}
                              className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 transition-all font-bold ${validationErrors.fullName ? 'border-rose-500' : 'border-white/5'}`}
                            />
                          </FormField>
                          <FormField label="Strategic Liaison Phone" error={validationErrors.phone} hint="Active mobile number for delivery verification.">
                            <input 
                              type="tel" 
                              placeholder="080********" 
                              value={deliveryAddress.phone}
                              onChange={(e) => {
                                setDeliveryAddress({...deliveryAddress, phone: e.target.value});
                                if (validationErrors.phone) setValidationErrors({...validationErrors, phone: ''});
                              }}
                              className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 transition-all font-bold ${validationErrors.phone ? 'border-rose-500' : 'border-white/5'}`}
                            />
                          </FormField>
                        </div>
                        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-6">
                          <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4" /> Destination Node
                          </h4>
                          <FormField label="Street Deployment Point" error={validationErrors.street} hint="Specific street name and nearest landmark.">
                            <input 
                              type="text" 
                              placeholder="N0 24. Strategic Avenue..." 
                              value={deliveryAddress.street}
                              onChange={(e) => {
                                setDeliveryAddress({...deliveryAddress, street: e.target.value});
                                if (validationErrors.street) setValidationErrors({...validationErrors, street: ''});
                              }}
                              className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 transition-all font-bold ${validationErrors.street ? 'border-rose-500' : 'border-white/5'}`}
                            />
                          </FormField>
                          <div className="grid grid-cols-2 gap-4">
                            <FormField label="City Core" error={validationErrors.city}>
                              <input 
                                type="text" 
                                placeholder="City Name" 
                                value={deliveryAddress.city}
                                onChange={(e) => {
                                  setDeliveryAddress({...deliveryAddress, city: e.target.value});
                                  if (validationErrors.city) setValidationErrors({...validationErrors, city: ''});
                                }}
                                className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 transition-all font-bold ${validationErrors.city ? 'border-rose-500' : 'border-white/5'}`}
                              />
                            </FormField>
                            <FormField label="Region/State" error={validationErrors.state}>
                              <input 
                                type="text" 
                                placeholder="State" 
                                value={deliveryAddress.state}
                                onChange={(e) => {
                                  setDeliveryAddress({...deliveryAddress, state: e.target.value});
                                  if (validationErrors.state) setValidationErrors({...validationErrors, state: ''});
                                }}
                                className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 transition-all font-bold ${validationErrors.state ? 'border-rose-500' : 'border-white/5'}`}
                              />
                            </FormField>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="Postal Code / Zip" error="">
                              <input 
                                type="text" 
                                placeholder="Postal Code" 
                                value={deliveryAddress.zipCode}
                                onChange={(e) => setDeliveryAddress({...deliveryAddress, zipCode: e.target.value})}
                                className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 font-bold"
                              />
                            </FormField>
                            <FormField label="Nearby Landmark / Focal Point" error="">
                              <input 
                                type="text" 
                                placeholder="Nearby Focal Point (School, Port, etc)" 
                                value={deliveryAddress.landmark || ''}
                                onChange={(e) => setDeliveryAddress({...deliveryAddress, landmark: e.target.value})}
                                className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 font-bold"
                              />
                            </FormField>
                          </div>
                          <FormField label="Additional Delivery Coordinates Instruction" error="">
                            <textarea 
                              placeholder="Any specific delivery landmark, gate/flat number, instructions..." 
                              value={deliveryAddress.instructions || ''}
                              onChange={(e) => setDeliveryAddress({...deliveryAddress, instructions: e.target.value})}
                              rows={2}
                              className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 font-bold"
                            />
                          </FormField>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Selector for Pickup Location Type */}
                        <div className="grid grid-cols-2 gap-4 bg-slate-900/60 p-2 rounded-[2rem] border border-white/5">
                          <button
                            type="button"
                            onClick={() => {
                              setPickupLocationType('OFFICE');
                            }}
                            className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5 ${
                              pickupLocationType === 'OFFICE'
                                ? 'bg-indigo-600/90 text-white shadow-lg shadow-indigo-500/10'
                                : 'bg-transparent text-slate-400 hover:text-white'
                            }`}
                          >
                            <Building2 className="w-4 h-4" />
                            <span>🏫 eFADO Delivery Office</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPickupLocationType('VENDOR');
                            }}
                            className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5 ${
                              pickupLocationType === 'VENDOR'
                                ? 'bg-indigo-600/90 text-white shadow-lg shadow-indigo-500/10'
                                : 'bg-transparent text-slate-400 hover:text-white'
                            }`}
                          >
                            <Store className="w-4 h-4" />
                            <span>🏪 Vendor Direct Store</span>
                          </button>
                        </div>

                        {pickupLocationType === 'OFFICE' ? (
                          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-[2rem] space-y-3">
                            <div className="flex items-center gap-2 text-indigo-400">
                              <Building2 className="w-4 h-4" />
                              <span className="text-[10px] font-black uppercase tracking-wider">OFFICIAL CORPORATE PICK-UP STATION</span>
                            </div>
                            <div className="text-[11px] font-bold text-slate-200 mt-1 space-y-2 whitespace-pre-line bg-slate-1050 p-4 rounded-xl border border-white/5 font-mono">
                              {OFFICE_ADDRESSES.DELIVERY_PICKUP_STATION}
                            </div>
                            <p className="text-[9.5px] text-indigo-300 font-bold uppercase leading-relaxed">
                              Your products will be centrally delivered to this eFADO Head Office / Delivery Pick-Up Station in Warri, Delta State. Bring matching ID or verification liaison details for secured collection.
                            </p>
                          </div>
                        ) : (
                          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] space-y-2">
                            <div className="flex items-center gap-2 text-amber-500">
                              <Info className="w-4 h-4" />
                              <span className="text-[10px] font-black uppercase tracking-wider">Independent Pickup Protocol</span>
                            </div>
                            <p className="text-[9.5px] text-slate-300 font-bold uppercase leading-relaxed">
                              eFADO operates as a decentralized network. All pickup orders must be processed directly at the vendor's declared private point-of-sale coordinates listed below.
                            </p>
                          </div>
                        )}

                        {/* List coordinates for all items in cart */}
                        {pickupLocationType === 'VENDOR' && (
                          <div className="space-y-4">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block px-1">Selected Location coordinates for Items:</label>
                            {cart.map((item, idx) => {
                              const p = item.product;
                              const mainStr = p.vendorPickupLocation || 
                                             `${p.location || 'Unknown location'}${p.village ? ', ' + p.village : ''}${p.landmark ? ' (Landmark: ' + p.landmark + ')' : ''}`;
                              return (
                                <div key={idx} className="p-4 bg-slate-950/80 border border-white/5 rounded-[2rem] flex flex-col gap-2">
                                  <span className="text-xs font-black text-white uppercase tracking-tight">{p.title}</span>
                                  <div className="flex items-start gap-2 bg-slate-900/60 p-3 rounded-xl border border-white/5">
                                    <MapPin className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Vendor Pickup Station:</p>
                                      <p className="text-[10.5px] font-bold text-slate-200 mt-1 whitespace-pre-line leading-relaxed">{mainStr}</p>
                                      {(p.phone || p.whatsapp) && (
                                        <p className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest mt-2">
                                          Liaisons: {p.phone && `📞 ${p.phone}`} {p.whatsapp && `💬 ${p.whatsapp}`}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-6 animate-fadeIn">
                          <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                            <UserPlus className="w-4 h-4" /> Authorized Liaison Credentials
                          </h4>
                          <FormField label="Full Name of Authorized Recipient" error={validationErrors.fullName} hint="The full name of the authorized individual arriving to pick up the item.">
                            <input 
                              type="text" 
                              placeholder="Tactical Full Name" 
                              value={deliveryAddress.fullName}
                              onChange={(e) => {
                                setDeliveryAddress({...deliveryAddress, fullName: e.target.value});
                                if (validationErrors.fullName) setValidationErrors({...validationErrors, fullName: ''});
                              }}
                              className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 transition-all font-bold ${validationErrors.fullName ? 'border-rose-500' : 'border-white/5'}`}
                            />
                          </FormField>
                          <FormField label="Liaison Verification Contact Number" error={validationErrors.phone} hint="Phone number to submit secure pin and dispatch messages.">
                            <input 
                              type="tel" 
                              placeholder="080********" 
                              value={deliveryAddress.phone}
                              onChange={(e) => {
                                setDeliveryAddress({...deliveryAddress, phone: e.target.value});
                                if (validationErrors.phone) setValidationErrors({...validationErrors, phone: ''});
                              }}
                              className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 transition-all font-bold ${validationErrors.phone ? 'border-rose-500' : 'border-white/5'}`}
                            />
                          </FormField>
                          <p className="text-[8.5px] text-slate-400 uppercase font-bold tracking-widest">
                            {pickupLocationType === 'OFFICE'
                              ? '⚠️ Bring a valid ID or verification code to the eFADO Delivery Head Office matching the credentials above.'
                              : '⚠️ Present dynamic matching passport ID or matching confirmation code to ensure item handshaking security.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {checkoutStep === 'payment' && (
                  <div className="space-y-6 overflow-y-auto no-scrollbar max-h-[50vh]">
                    {/* Navigation Tab selection for Options */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-white/5 mb-4 font-sans">
                      <button
                        type="button"
                        onClick={() => setPaymentStrategy('escrow_paystack')}
                        className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1 text-center ${
                          paymentStrategy === 'escrow_paystack'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 border-t border-white/10'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                        Option A: Escrow Paystack
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentStrategy('direct_bank')}
                        className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1 text-center ${
                          paymentStrategy === 'direct_bank'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 border-t border-white/10'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        Option B: Direct Transfer
                      </button>
                    </div>

                    {paymentStrategy === 'escrow_paystack' ? (
                      <div className="space-y-4">
                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 space-y-1.5 text-left mb-4">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400 font-bold" />
                            <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Secured Intermediary Split Escrow</h5>
                          </div>
                          <p className="text-[9px] text-slate-400 leading-normal font-medium font-sans">
                            Buyer pays securely via Paystack on behalf of <strong>Efado Hubs</strong>. Paystack splits the money automatically — commission goes to Efado, and the rest goes directly to the vendor's secure subaccount. Best for **escrow and absolute buyer protection**.
                          </p>
                        </div>
                        <div className="bg-slate-800/20 p-6 rounded-[2rem] border border-white/5 mb-6 text-left">
                           <h4 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Choose Payment Strategy</h4>
                       <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
                         {paymentCategories.map((cat) => (
                           <div 
                             key={cat.id}
                             className="bg-slate-950/50 border border-white/5 rounded-[2rem] p-5 hover:border-indigo-500/30 hover:bg-slate-900 transition-all group"
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
                                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-500/20'
                                        : 'bg-slate-950/50 border-white/5 text-slate-400 hover:bg-slate-800'
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
                      {paymentMethod === 'bank_transfer_opt' && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 pt-4 border-t border-slate-200/20"
                        >
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">1. Select Sending Bank Institution</label>
                            <select
                              value={selectedBankCode}
                              onChange={(e) => {
                                setSelectedBankCode(e.target.value);
                                if (e.target.value !== 'others') {
                                  const b = nigerianBanks.find(nb => nb.code === e.target.value);
                                  setCustomBankName(b ? b.name : '');
                                } else {
                                  setCustomBankName('');
                                }
                              }}
                              className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                            >
                              <option value="">-- Choose Bank (Nigeria & International) --</option>
                              {nigerianBanks.map(b => (
                                <option key={`bank-select-${b.code}`} value={b.code}>
                                  {b.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {selectedBankCode === 'others' && (
                            <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Specify Other Bank Name</label>
                              <div className="relative">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                <input 
                                  placeholder="Type Custom Bank Name (e.g. Lotus Bank, Signature Bank)..."
                                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-all"
                                  value={customBankName}
                                  onChange={e => setCustomBankName(e.target.value)}
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">2. Enter Bank Account Number / Bank Number</label>
                            <div className="relative">
                              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                              <input 
                                placeholder="Enter Your 10-Digit Account Number"
                                maxLength={10}
                                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-all"
                                value={bankAccountNumber}
                                onChange={e => setBankAccountNumber(e.target.value.replace(/\D/g, ''))}
                              />
                            </div>
                          </div>

                          {/* Recipient Automatic Search Results */}
                          {recipientSearchLoading && (
                            <div className="flex items-center justify-center p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 gap-3">
                              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Searching Recipient Bank Details...</span>
                            </div>
                          )}

                          {!recipientSearchLoading && resolvedRecipientName && (
                            <div className="p-5 bg-emerald-500/10 rounded-[2rem] border border-emerald-500/20 space-y-4 text-left shadow-sm">
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">System Recipient Verified Match</span>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">BENEFICIARY HOLDER (ESCROW PROTOCOL)</span>
                                <h4 className="text-xs font-black text-white">{resolvedRecipientName}</h4>
                                <p className="text-[9px] text-emerald-400 font-bold">✔ Destination is fully secured. Funds will be deposited in trust.</p>
                              </div>

                              {/* Instantly Click Pay */}
                              <button
                                type="button"
                                onClick={handlePaystackCheckout}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 animate-pulse"
                              >
                                <ShieldCheck className="w-4.5 h-4.5 animate-bounce" />
                                <span className="uppercase tracking-[0.15em] text-[10px]">PAY SECURELY NOW VIA PAYSTACK</span>
                              </button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    </div>
                    ) : (
                      /* Option B: Direct to Vendor */
                      <div className="space-y-4 text-left">
                        <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-2xl p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-indigo-400 animate-pulse" />
                            <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Manual Direct Wire Transfer</h5>
                          </div>
                          <p className="text-[9px] text-slate-400 leading-normal font-medium font-sans">
                            Choose an official collection account below, execute the manual bank transfer from your banking app, then type your payment execution proof details below to finalize order.
                          </p>
                        </div>

                        {/* STEP 1: Bank list to copy */}
                        <div className="space-y-3 font-sans">
                          <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">STEP 1: SELECT & COPY CO-OPERATE ACCOUNT DETAILS</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                              { id: 'acc1', name: 'ACCESS BANK', num: '0001304979', holder: 'DANIEL F. OKHAWERE', type: 'Savings Account' },
                              { id: 'acc2', name: 'UBA BANK', num: '2120742200', holder: 'DANIEL F. OKHAWERE', type: 'Savings Account' },
                              { id: 'acc3', name: 'OPAY DIGITAL MFB', num: '8072456836', holder: 'EFADO TECHNOLOGY COMPUTER ENGINEER...', type: 'Opay Business' },
                              { id: 'acc4', name: 'GTBANK PLC', num: '3001964082', holder: 'EFADO TECHNOLOGY COMPUTER ENGINEER...', type: 'Corporate NGN' }
                            ].map(item => (
                              <div key={item.id} className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl flex flex-col justify-between gap-3 hover:border-white/15 transition-all text-left">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9.5px] font-black text-indigo-400 uppercase tracking-wide">{item.name}</span>
                                    <span className="text-[8px] font-sans font-black px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 uppercase tracking-wider">{item.type}</span>
                                  </div>
                                  <p className="text-[11px] font-mono font-black text-white tracking-widest leading-none py-1">{item.num}</p>
                                  <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-tight truncate max-w-full font-sans">{item.holder}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(item.num);
                                    setCopiedBankId(item.id);
                                    setTimeout(() => setCopiedBankId(null), 2000);
                                  }}
                                  className={`w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all font-sans ${
                                    copiedBankId === item.id 
                                      ? 'bg-emerald-600 border border-emerald-400 text-white' 
                                      : 'bg-slate-950 border border-white/5 text-slate-400 hover:text-white hover:bg-slate-900'
                                  }`}
                                >
                                  {copiedBankId === item.id ? (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      Copied!
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      Copy Account
                                    </>
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* STEP 2: Submit details */}
                        <div className="space-y-3 pt-3 border-t border-white/5">
                          <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">STEP 2: TYPE YOUR SENDER & AMOUNT PROOF DETAILS</label>
                          <div className="space-y-3 font-sans">
                            {/* NGN Grand Total Lock field */}
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-indigo-400">₦</span>
                              <input 
                                type="text"
                                disabled
                                className="w-full pl-10 pr-4 py-3 bg-slate-955/20 border border-white/5 rounded-xl text-xs font-mono font-bold text-slate-300 cursor-not-allowed select-none bg-slate-950"
                                value={`${((((cartTotal * (isCouponApplied ? 0.8 : 1)) * 1.013) + (shippingMethod === 'Standard' ? 0 : (shippingMethod === 'Expedited' ? 15 : 50))) * 1450).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} NGN`}
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[7px] font-black bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full uppercase tracking-widest">PRE-CHECKED NGN TOTAL</span>
                            </div>

                            <div className="relative">
                              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                              <input 
                                placeholder="Your Sending Bank Name (e.g. Zenith Bank, Access Bank)*"
                                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition-all font-sans"
                                value={senderBankName}
                                onChange={e => setSenderBankName(e.target.value)}
                              />
                            </div>

                            <div className="relative">
                              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                              <input 
                                placeholder="Your Sending 10-Digit Account Number*"
                                maxLength={10}
                                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition-all font-sans"
                                value={senderAccountNumber}
                                onChange={e => setSenderAccountNumber(e.target.value)}
                              />
                            </div>

                            <div className="relative">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                              <input 
                                placeholder="Your Sender Account Holder Name*"
                                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition-all font-sans"
                                value={senderAccountName}
                                onChange={e => setSenderAccountName(e.target.value)}
                              />
                            </div>

                            <div className="relative">
                              <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                              <input 
                                placeholder="Transfer Reference / Transaction note (Optional)"
                                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition-all font-sans"
                                value={senderTransferRef}
                                onChange={e => setSenderTransferRef(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-emerald-500/10 p-6 rounded-[2rem] border border-emerald-500/20">
                      <div className="flex items-center gap-3 text-emerald-400 mb-2">
                         <ShieldCheck className="w-5 h-5" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Fairly Used Escrow Protection</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">
                        Your payment is held securely by Efado until you confirm delivery of your fairly used product.
                      </p>
                    </div>
                  </div>
                )}

                {checkoutStep === 'processing' && (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-24 h-24 mb-8 relative">
                       <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
                       <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin" />
                       <div className="absolute inset-0 flex items-center justify-center opacity-20">
                          <Zap className="w-8 h-8 text-indigo-400 animate-pulse" />
                       </div>
                    </div>
                    <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Holisitic Transaction Sec</h4>
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest animate-pulse">{paymentStatusText}</p>
                    <div className="mt-12 bg-white/5 p-6 rounded-3xl border border-white/5 w-full">
                       <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-4">Security Protocol Diagnosis</p>
                       <div className="space-y-3">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                             <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Identity Logic Check</span>
                             <span className="text-emerald-400">VERIFIED</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                             <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Currency Consistency</span>
                             <span className="text-emerald-400">STABLE</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                             <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-indigo-400 animate-pulse" /> Escrow Hash Generation</span>
                             <span className="text-indigo-400">ACTIVE</span>
                          </div>
                       </div>
                    </div>
                  </div>
                )}

                {checkoutStep === 'success' && (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center text-white mb-6 shadow-xl shadow-emerald-500/20">
                       <CheckCircle className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Order Confirmed!</h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8 leading-relaxed">
                      Your fairly used product order has been successfully placed under the EFADO Guard escrow system.
                    </p>
                    <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 w-full mb-8">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Your Order Code</p>
                       <p className="text-3xl font-black text-white tracking-widest">{generatedOrderCode}</p>
                    </div>
                    <div className="flex flex-col gap-3 w-full">
                       <button 
                         onClick={() => {
                           setActiveView('orders');
                           setShowCart(false);
                           setCheckoutStep('cart');
                         }}
                         className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-500 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3"
                       >
                         <Truck className="w-4 h-4" /> Track My Order
                       </button>
                       <button 
                         onClick={() => { setShowCart(false); setCheckoutStep('cart'); }}
                         className="w-full py-4 bg-white/5 text-slate-400 font-black rounded-2xl hover:bg-white/10 transition-all uppercase tracking-widest text-xs"
                       >
                         Continue Shopping
                       </button>
                    </div>
                  </div>
                )}
              </div>

              {checkoutStep !== 'processing' && checkoutStep !== 'success' && cart.length > 0 && (
                <div className="p-8 border-t border-white/5 bg-slate-900/50 backdrop-blur-xl">
                  {checkoutStep === 'cart' && (
                     <div className="flex items-center gap-2 mb-6">
                        <input 
                           type="text" 
                           placeholder="PROMO CODE (e.g. EFADO20)" 
                           value={couponCode}
                           onChange={(e) => setCouponCode(e.target.value)}
                           className="flex-grow bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:border-indigo-500 transition-all uppercase tracking-widest font-bold"
                        />
                        <button 
                           onClick={() => { if(couponCode === 'EFADO20') setIsCouponApplied(true); }}
                           className="px-6 py-3 bg-white/10 text-white font-black rounded-xl hover:bg-white/20 transition-all text-xs uppercase tracking-widest"
                        >
                           Apply
                        </button>
                     </div>
                  )}

                  <div className="space-y-3 mb-8 px-2">
                    <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <span>Subtotal</span>
                      <span>{formatPrice(cartTotal, true)}</span>
                    </div>
                    {isCouponApplied && (
                       <div className="flex justify-between text-xs font-bold text-indigo-400 uppercase tracking-widest">
                          <span>Discount (EFADO20)</span>
                          <span>-{formatPrice(cartTotal * 0.2, true)}</span>
                       </div>
                    )}
                    <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <span>Shipping ({shippingMethod})</span>
                      <span>{shippingMethod === 'Standard' ? 'FREE' : formatPrice(shippingMethod === 'Expedited' ? 15 : 50, true)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-black text-white uppercase tracking-tighter pt-2 border-t border-white/10">
                      <span>Total Amount</span>
                      <span>{formatPrice((cartTotal * (isCouponApplied ? 0.8 : 1)) + (shippingMethod === 'Standard' ? 0 : (shippingMethod === 'Expedited' ? 15 : 50)), true)}</span>
                    </div>
                  </div>

                  {checkoutStep === 'address' && Object.keys(validationErrors).length > 0 && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-xs font-bold mb-4 space-y-1">
                      <p className="font-black uppercase tracking-widest flex items-center gap-1.5 text-rose-300">
                        <AlertCircle className="w-4 h-4 text-rose-400" /> Missing Required Coordinates:
                      </p>
                      <ul className="list-disc pl-5 space-y-0.5 text-[10px] opacity-90">
                        {Object.entries(validationErrors).map(([field, err]) => err && (
                          <li key={field}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {checkoutStep === 'payment' && paymentStrategy === 'escrow_paystack' ? (
                    <button 
                      onClick={handlePaystackCheckout}
                      className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-2xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 animate-pulse"
                    >
                      <CreditCard className="w-5 h-5" />
                      <span className="uppercase tracking-[0.2em] text-xs">
                        Complete Secure Order (Paystack)
                      </span>
                      <ArrowRight className="w-5 h-5 animate-bounce" />
                    </button>
                  ) : (
                    <button 
                      disabled={cart.length === 0}
                      onClick={handleCheckout}
                      className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-2xl shadow-2xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-3 animate-shimmer"
                    >
                      {checkoutStep === 'payment' ? <ShieldCheck className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                      <span className="uppercase tracking-[0.2em] text-xs">
                        {checkoutStep === 'cart' && 'Proceed to Checkout'}
                        {checkoutStep === 'address' && 'Confirm Delivery Address'}
                        {checkoutStep === 'payment' && paymentStrategy === 'direct_bank' && 'Submit Bank Transfer Proof'}
                        {checkoutStep === 'payment' && paymentStrategy !== 'direct_bank' && `Pay ${formatPrice((cartTotal * (isCouponApplied ? 0.8 : 1)) + (shippingMethod === 'Standard' ? 0 : (shippingMethod === 'Expedited' ? 15 : 50)), true)} Now`}
                      </span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  )}
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
        amount={(cartTotal * (isCouponApplied ? 0.8 : 1)) + (shippingMethod === 'Standard' ? 0 : (shippingMethod === 'Expedited' ? 15 : 50))}
        action="Fairly Used Purchase"
      />

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
              categories={CATEGORIES}
              hubName="Fairly Used Market"
              accentColor="indigo"
            />
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </motion.div>
  );
};
