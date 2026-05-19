import React, { useState, useEffect } from 'react';
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
  Mail
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
  serverTimestamp 
} from '../firebase';
import { DomainSeller, DomainCatalog, DomainOrder, UserProfile } from '../types';
import { useCurrency } from '../lib/CurrencyContext';
import { EfadoEmailHub } from './EfadoEmailHub';

interface EfadoDomainHubProps {
  user: UserProfile;
}

export const EfadoDomainHub: React.FC<EfadoDomainHubProps> = ({ user }) => {
  const { formatPrice } = useCurrency();
  const [view, setView] = useState<'landing' | 'seller' | 'checkout' | 'orders' | 'email'>('landing');
  const [sellers, setSellers] = useState<DomainSeller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<DomainSeller | null>(null);
  const [catalog, setCatalog] = useState<DomainCatalog[]>([]);
  const [orders, setOrders] = useState<DomainOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTld, setSelectedTld] = useState('.com');
  const [availabilityResult, setAvailabilityResult] = useState<{ domain: string; available: boolean; price?: number } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState(1);

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

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {view !== 'landing' && (
              <button 
                onClick={() => {
                  if (view === 'seller') setView('landing');
                  else if (view === 'checkout') setView('seller');
                  else setView('landing');
                }}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Globe className="text-white w-5 h-5" />
              </div>
              <span className="font-black text-lg tracking-tight">EFADO Domain Hub</span>
            </div>
          </div>
          <button 
            onClick={() => setView('orders')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
          >
            <History className="w-4 h-4" />
            My Orders
          </button>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Hero Search */}
              <div className="text-center space-y-6">
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
                  Find Your Perfect <span className="text-indigo-600">Domain</span>
                </h1>
                <p className="text-slate-500 max-w-2xl mx-auto">
                  Search across top global registrars and get the best prices with Efado's exclusive partner commissions.
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
                      className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
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
    </div>
  );
};
