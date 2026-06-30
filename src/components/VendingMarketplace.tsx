import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Phone, 
  Wifi, 
  Briefcase, 
  CheckCircle2, 
  History, 
  UserCheck, 
  RefreshCw, 
  Sliders, 
  ShieldCheck, 
  Activity, 
  Info, 
  Coins, 
  Download, 
  ArrowRight, 
  Lock,
  PlusCircle,
  TrendingUp,
  CreditCard,
  User,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { 
  db, 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  collection, 
  increment, 
  serverTimestamp 
} from '../firebase';

interface VendingMarketplaceProps {
  user: any;
  telecomVendors: any[];
  telecomVendorOrders: any[];
  myTelecomVendor: any | null;
  selectedVendorForOrder: any | null;
  setSelectedVendorForOrder: (vendor: any | null) => void;
  vendingSubTab: 'refill' | 'marketplace' | 'console';
  setVendingSubTab: (tab: 'refill' | 'marketplace' | 'console') => void;
  setVendingFlowStep: (step: 'choice' | 'details' | 'confirm' | 'result') => void;
  addVendingLog: (log: string) => void;
  vendingType: 'airtime' | 'data';
}

export const VendingMarketplace: React.FC<VendingMarketplaceProps> = ({
  user,
  telecomVendors,
  telecomVendorOrders,
  myTelecomVendor,
  selectedVendorForOrder,
  setSelectedVendorForOrder,
  vendingSubTab,
  setVendingSubTab,
  setVendingFlowStep,
  addVendingLog,
  vendingType
}) => {
  // Local form states
  const [vendorOnboardBusinessName, setVendorOnboardBusinessName] = useState('');
  const [vendorOnboardEmail, setVendorOnboardEmail] = useState(user?.email || '');
  const [vendorProviderName, setVendorProviderName] = useState('Palmpay Business API');
  const [vendorApiKey, setVendorApiKey] = useState('sk_live_vtu_eFado_xxxxxxxxx');
  const [vendorApiEndpoint, setVendorApiEndpoint] = useState('https://api.palmpay.com/v1/vtu/recharge');
  const [vendorMarginAirtime, setVendorMarginAirtime] = useState<number>(0.0);
  const [vendorMarginData, setVendorMarginData] = useState<number>(0.0);
  const [vendorAirtimeActive, setVendorAirtimeActive] = useState<boolean>(true);
  const [vendorDataActive, setVendorDataActive] = useState<boolean>(true);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(1000);

  // Sync form inputs when myTelecomVendor is fetched
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

  // Onboarding Action
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
        status: 'verified', // Auto-verified for playground readiness
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
      alert("Congratulations! Your Verified Telecom Vendor profile has been registered successfully!");
    } catch (err: any) {
      addVendingLog(`[Onboarding Error] Registration failed: ${err.message}`);
      alert("Error: " + err.message);
    }
  };

  // Config Update Action
  const handleUpdateVendorConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myTelecomVendor) return;
    
    try {
      addVendingLog(`[Config Engine] Updating VTU credentials & margins for "${myTelecomVendor.businessName}"...`);
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
      addVendingLog(`[Config Engine] API parameters and margins updated.`);
      alert("Telecom vendor credentials and markup margins updated successfully!");
    } catch (err: any) {
      addVendingLog(`[Config Error] Failed to update settings: ${err.message}`);
      alert("Error: " + err.message);
    }
  };

  // Wallet Payout Withdrawal Action
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
      const vendorRef = doc(db, 'telecom_vendors', user.uid);
      await updateDoc(vendorRef, {
        walletBalance: increment(-withdrawAmount)
      });

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        depositWallet: increment(withdrawAmount)
      });

      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'refund',
        amount: withdrawAmount,
        currency: 'NGN',
        status: 'completed',
        purpose: 'Vendor Wallet Withdrawal',
        description: `Withdrew ₦${withdrawAmount.toLocaleString()} from telecom vendor wallet to main deposit wallet.`,
        timestamp: serverTimestamp()
      });

      addVendingLog(`[Payout Ledger] Payout successful. ₦${withdrawAmount.toLocaleString()} transferred.`);
      alert(`Withdrawal successful! ₦${withdrawAmount.toLocaleString()} has been added to your deposit wallet.`);
      setWithdrawAmount(1000);
    } catch (err: any) {
      addVendingLog(`[Payout Ledger Error] Withdrawal failed: ${err.message}`);
      alert("Withdrawal failed: " + err.message);
    }
  };

  if (vendingSubTab === 'marketplace') {
    return (
      <div className="space-y-8 animate-fadeIn text-left">
        {/* Marketplace banner */}
        <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-[2rem] space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-black uppercase text-white tracking-wider flex items-center gap-2">
                <Globe className="w-5 h-5 text-amber-500 animate-pulse" />
                Telecom Vendor Marketplace
              </h3>
              <p className="text-xs text-slate-400 font-semibold max-w-xl leading-relaxed">
                Connect and trade directly with third-party telecom vendors listing their airtime and data inventory. Select a custom seller to complete your transaction, or leverage auto-routing for the best available platform rates.
              </p>
            </div>
            
            <div className="p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-wider text-indigo-400">Auto-Routing Status</p>
                <p className="text-[10px] font-mono font-bold text-white">Active (Best Price Guaranteed)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Vendor Indicator */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold">
              ★
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-wider text-slate-400 font-mono">Active Pricing Route</p>
              <p className="text-xs font-black text-white">
                {selectedVendorForOrder 
                  ? `Selected: "${selectedVendorForOrder.businessName}" (Airtime Margin: ${selectedVendorForOrder.marginAirtime || 0}%, Data: ${selectedVendorForOrder.marginData || 0}%)`
                  : 'Auto-Routed (Smart Match - cheapest available verified seller will process recharge)'}
              </p>
            </div>
          </div>
          {selectedVendorForOrder && (
            <button
              type="button"
              onClick={() => {
                setSelectedVendorForOrder(null);
                addVendingLog('[Route Reset] Switched route to platform Smart Auto-routing.');
              }}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer font-sans"
            >
              Clear Choice (Auto-Route)
            </button>
          )}
        </div>

        {/* Grid of vendors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {telecomVendors.length === 0 ? (
            <div className="md:col-span-2 bg-slate-900 border border-slate-800/80 p-12 rounded-[2rem] text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Globe className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black uppercase text-white tracking-wider">No Telecom Vendors Listed</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Be the first to list! Navigate to the <strong>Vendor Console</strong> tab to configure your VTU APIs, margins, and join the marketplace pool.
                </p>
              </div>
            </div>
          ) : (
            telecomVendors.map((v) => {
              const isSelected = selectedVendorForOrder?.id === v.id;
              const isAirtimeAvail = v.airtimeAvailability !== false;
              const isDataAvail = v.dataAvailability !== false;
              
              return (
                <div 
                  key={v.id} 
                  className={`p-6 bg-slate-900 border rounded-3xl space-y-4 transition-all relative ${
                    isSelected 
                      ? 'border-amber-500 ring-4 ring-amber-500/10' 
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-black uppercase text-white flex items-center gap-1.5">
                        {v.businessName}
                        <span className="text-[7.5px] uppercase bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded font-mono">
                          Partner
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-500 font-bold font-mono">Gateway: {v.providerName || 'REST API'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black uppercase tracking-wider text-slate-500 font-mono">Dispatches</p>
                      <p className="text-sm font-mono font-black text-white">{v.salesCount || 0}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
                    <div>
                      <p className="text-[8px] font-black uppercase text-slate-500 tracking-wider font-mono">Airtime Markup</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isAirtimeAvail ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className="font-mono font-bold text-white">
                          {isAirtimeAvail ? `${v.marginAirtime >= 0 ? '+' : ''}${v.marginAirtime}%` : 'Disabled'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase text-slate-500 tracking-wider font-mono">Data Markup</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isDataAvail ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className="font-mono font-bold text-white">
                          {isDataAvail ? `${v.marginData >= 0 ? '+' : ''}${v.marginData}%` : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVendorForOrder(v);
                        addVendingLog(`[Route Selection] Explicitly routed future dispatches to vendor "${v.businessName}".`);
                      }}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-amber-500 text-slate-950' 
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      {isSelected ? '✓ Selected Route' : 'Use Vendor'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVendorForOrder(v);
                        setVendingSubTab('refill');
                        setVendingFlowStep('choice');
                        addVendingLog(`[Direct Buy] Form loaded using vendor route "${v.businessName}".`);
                      }}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Instant Recharge →
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // CONSOLE SUB-TAB
  return (
    <div className="space-y-8 animate-fadeIn text-left">
      {!myTelecomVendor ? (
        /* VENDOR SIGNUP FORM */
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-[2rem] space-y-6">
          <div className="text-center space-y-2 pb-4 border-b border-slate-800">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-400">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black uppercase text-white tracking-wider">Become a Certified Telecom Partner</h3>
            <p className="text-xs text-slate-405 text-slate-400 font-semibold max-w-md mx-auto leading-relaxed">
              Plug your custom API credentials, set your target service markup rates, and receive real-time settled payouts from the user base.
            </p>
          </div>

          <form onSubmit={handleOnboardVendor} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">Business / Partner Name</label>
                <input
                  type="text"
                  required
                  placeholder="Apex VTU Hub"
                  value={vendorOnboardBusinessName}
                  onChange={(e) => setVendorOnboardBusinessName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-3 px-4 text-xs font-mono text-white outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">Notification/Billing Email</label>
                <input
                  type="email"
                  required
                  placeholder="partner@vtu.com"
                  value={vendorOnboardEmail}
                  onChange={(e) => setVendorOnboardEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-3 px-4 text-xs font-mono text-white outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">API Connection Engine</label>
              <select
                value={vendorProviderName}
                onChange={(e) => setVendorProviderName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-3 px-4 text-xs font-semibold text-white outline-none cursor-pointer"
              >
                <option value="Palmpay Business API">Palmpay Business API</option>
                <option value="Clubkonnect Gateways">Clubkonnect Gateways</option>
                <option value="VTU.ng Gateway">VTU.ng Gateway</option>
                <option value="Custom Rest API">Custom REST API Gateway</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">API Base Target URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://api.vtu.com/v1/topup"
                  value={vendorApiEndpoint}
                  onChange={(e) => setVendorApiEndpoint(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-3 px-4 text-xs font-mono text-white outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">API Authorization Key / Secret</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••••••••••••"
                  value={vendorApiKey}
                  onChange={(e) => setVendorApiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-3 px-4 text-xs font-mono text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div className="space-y-2">
                <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">Airtime Profit Markup Margin (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="-10.0"
                  max="15.0"
                  value={vendorMarginAirtime}
                  onChange={(e) => setVendorMarginAirtime(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-3 px-4 text-xs font-mono text-white outline-none"
                />
                <p className="text-[9px] text-slate-500 pl-1 leading-normal">Markup margin (e.g. 1.5%) added to client's purchase cost.</p>
              </div>
              <div className="space-y-2">
                <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">Data Markup Margin (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="-10.0"
                  max="15.0"
                  value={vendorMarginData}
                  onChange={(e) => setVendorMarginData(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-3 px-4 text-xs font-mono text-white outline-none"
                />
                <p className="text-[9px] text-slate-500 pl-1 leading-normal">Margin adjustments applied to high-speed data bundles.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 py-2">
              <label className="flex items-center gap-2 text-xs text-slate-300 font-bold select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={vendorAirtimeActive}
                  onChange={(e) => setVendorAirtimeActive(e.target.checked)}
                  className="w-4 h-4 bg-slate-950 accent-emerald-500 rounded"
                />
                Activate Airtime Sales
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 font-bold select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={vendorDataActive}
                  onChange={(e) => setVendorDataActive(e.target.checked)}
                  className="w-4 h-4 bg-slate-950 accent-emerald-500 rounded"
                />
                Activate Data Bundle Sales
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer font-sans"
            >
              🚀 Activate Verification Partner Onboarding
            </button>
          </form>
        </div>
      ) : (
        /* VENDOR CONSOLE DASHBOARD */
        <div className="space-y-8 animate-fadeIn text-left">
          
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider font-mono">Withdrawable Balance</p>
              <p className="text-2xl font-black text-emerald-400 font-mono">₦{(myTelecomVendor.walletBalance || 0).toLocaleString()}</p>
              <p className="text-[9.5px] text-slate-500 font-medium">Real-time cleared settled customer recharge revenue.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider font-mono">Total Successful Dispatches</p>
              <p className="text-2xl font-black text-indigo-400 font-mono">{myTelecomVendor.salesCount || 0}</p>
              <p className="text-[9.5px] text-slate-500 font-medium">Accumulated transactions processed via your provider credentials.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider font-mono">Platform Gross Earnings</p>
              <p className="text-2xl font-black text-amber-400 font-mono">₦{(myTelecomVendor.totalEarnings || 0).toLocaleString()}</p>
              <p className="text-[9.5px] text-slate-500 font-medium">Cumulative earnings after platform's flat 2.5% middleman commission fee.</p>
            </div>
          </div>

          {/* Form and Payout panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-[2rem] space-y-6">
              <h3 className="text-sm font-black uppercase text-white tracking-widest flex items-center gap-2 border-b border-slate-800 pb-3">
                <Sliders className="w-4 h-4 text-emerald-400" />
                API Credentials & Margin pricing Configuration
              </h3>

              <form onSubmit={handleUpdateVendorConfig} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">VTU Provider Engine</label>
                  <select
                    value={vendorProviderName}
                    onChange={(e) => setVendorProviderName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-3 px-4 text-xs font-semibold text-white outline-none cursor-pointer"
                  >
                    <option value="Palmpay Business API">Palmpay Business API</option>
                    <option value="Clubkonnect Gateways">Clubkonnect Gateways</option>
                    <option value="VTU.ng Gateway">VTU.ng Gateway</option>
                    <option value="Custom Rest API">Custom REST API Gateway</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">API Target Endpoint URL</label>
                    <input
                      type="url"
                      required
                      value={vendorApiEndpoint}
                      onChange={(e) => setVendorApiEndpoint(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-3 px-4 text-xs font-mono text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">API Authorization Key / Secret</label>
                    <input
                      type="password"
                      required
                      value={vendorApiKey}
                      onChange={(e) => setVendorApiKey(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-3 px-4 text-xs font-mono text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                  <div className="space-y-2">
                    <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">Airtime Markup Margin (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="-10.0"
                      max="15.0"
                      value={vendorMarginAirtime}
                      onChange={(e) => setVendorMarginAirtime(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-3 px-4 text-xs font-mono text-white outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">Data Bundle Markup Margin (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="-10.0"
                      max="15.0"
                      value={vendorMarginData}
                      onChange={(e) => setVendorMarginData(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-3 px-4 text-xs font-mono text-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 py-2">
                  <label className="flex items-center gap-2 text-xs text-slate-300 font-bold select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={vendorAirtimeActive}
                      onChange={(e) => setVendorAirtimeActive(e.target.checked)}
                      className="w-4 h-4 bg-slate-950 accent-emerald-500 rounded animate-none"
                    />
                    Airtime Sales Active
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-300 font-bold select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={vendorDataActive}
                      onChange={(e) => setVendorDataActive(e.target.checked)}
                      className="w-4 h-4 bg-slate-950 accent-emerald-500 rounded animate-none"
                    />
                    Data Bundle Sales Active
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer font-sans"
                >
                  💾 Save Active Configurations & Markup Pricing
                </button>
              </form>
            </div>

            {/* Withdraw Earnings panel */}
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  Payout Earnings Withdrawal
                </h4>

                <form onSubmit={handleVendorWithdrawal} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">Withdrawal Amount (₦)</label>
                    <input
                      type="number"
                      required
                      min="100"
                      max={myTelecomVendor.walletBalance || 0}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-3 px-4 text-xs font-mono text-white outline-none"
                    />
                  </div>

                  <div className="bg-slate-955 bg-slate-950 p-3.5 border border-slate-850 rounded-xl text-[10px] text-slate-400 space-y-2">
                    <p className="flex justify-between font-mono">
                      <span>Available Earnings:</span>
                      <span className="font-bold text-emerald-400">₦{(myTelecomVendor.walletBalance || 0).toLocaleString()}</span>
                    </p>
                    <p className="flex justify-between font-mono">
                      <span>Processing Fee:</span>
                      <span className="font-bold text-white">₦0 (Free)</span>
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={myTelecomVendor.walletBalance <= 0}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer font-sans"
                  >
                    Withdraw to Deposit Wallet
                  </button>
                </form>
              </div>

              {/* Commission model information */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl text-left space-y-2">
                <div className="flex items-center gap-2 select-none">
                  <Info className="w-4 h-4 text-indigo-400" />
                  <h5 className="text-[10px] font-black uppercase tracking-wider text-white font-mono">Marketplace commission</h5>
                </div>
                <p className="text-[10px] text-slate-450 text-slate-400 font-semibold leading-relaxed leading-normal">
                  To operate as the trusted escrow middleman verifying API execution and routing transactions securely, eFado deducts a flat <strong>2.5% platform commission</strong> from client retail receipts. Earnings are fully withdrawable instantly without processing costs.
                </p>
              </div>
            </div>
          </div>

          {/* Local Vendor fulfillment transactions ledger list */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] space-y-4">
            <h4 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" />
              Live Order Fulfillment Ledger & Audits
            </h4>

            <div className="overflow-x-auto no-scrollbar">
              {telecomVendorOrders.filter(o => o.vendorId === user.uid).length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No orders have been routed to your VTU gateway credentials yet.</p>
              ) : (
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5">Buyer / Mobile</th>
                      <th className="py-2.5">Carrier</th>
                      <th className="py-2.5">Type</th>
                      <th className="py-2.5">Paid (NGN)</th>
                      <th className="py-2.5">Margin / Earnt</th>
                      <th className="py-2.5 text-right">Fulfillment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {telecomVendorOrders.filter(o => o.vendorId === user.uid).map((order) => {
                      const dateStr = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'Just now';
                      return (
                        <tr key={order.id} className="text-slate-300">
                          <td className="py-3 text-slate-500">{dateStr}</td>
                          <td className="py-3">
                            <p className="font-sans font-bold text-white text-[11px]">{order.customerEmail}</p>
                            <p className="text-[10px] text-slate-500">{order.phone}</p>
                          </td>
                          <td className="py-3 font-bold text-indigo-400 uppercase">{order.carrier}</td>
                          <td className="py-3 uppercase text-[10px] font-bold">
                            {order.type} {order.dataAllowance && <span className="text-emerald-400">({order.dataAllowance})</span>}
                          </td>
                          <td className="py-3 font-bold text-white">₦{(order.totalCharged || order.amount).toLocaleString()}</td>
                          <td className="py-3">
                            <p className="text-slate-400">Margin: {order.markupAmount >= 0 ? '+' : ''}₦{order.markupAmount?.toLocaleString() || '0'}</p>
                            <p className="text-[10px] text-emerald-400 font-bold">Earned: ₦{order.vendorEarned?.toLocaleString() || '0'}</p>
                          </td>
                          <td className="py-3 text-right">
                            <span className="bg-emerald-950 text-emerald-400 text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                              SUCCESS
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
