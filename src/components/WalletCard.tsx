import React from 'react';
import { Wallet, ArrowDownCircle, ArrowUpCircle, Coins, ShieldCheck } from 'lucide-react';
import { useCurrency } from '../lib/CurrencyContext';

interface WalletCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
  color: string;
  description: string;
}

export function WalletCard({ title, amount, icon, color, description }: WalletCardProps) {
  const { formatPrice } = useCurrency();
  
  return (
    <div className="p-6 rounded-3xl glass-card-ultra group hover:scale-[1.02] transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${color} bg-opacity-20 group-hover:scale-110 transition-transform`}>
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: `w-6 h-6 ${color.replace('bg-', 'text-')}` }) : icon}
        </div>
        <span className="text-2xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] tracking-tight">
          {formatPrice(amount)}
        </span>
      </div>
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</h3>
      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{description}</p>
    </div>
  );
}

export function WalletGrid({ wallets, isAdmin }: { wallets: any, isAdmin: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <WalletCard 
        title="Deposit Wallet" 
        amount={wallets.depositWallet || 0} 
        icon={<ArrowDownCircle />} 
        color="bg-blue-500"
        description="Total funds deposited into your account."
      />
      <WalletCard 
        title="Player Wallet" 
        amount={wallets.playerWallet || 0} 
        icon={<Coins />} 
        color="bg-yellow-500"
        description="Funds available for staking and playing Game Hub games."
      />
      <WalletCard 
        title="Cash Out Wallet" 
        amount={wallets.cashOutWallet || 0} 
        icon={<ArrowUpCircle />} 
        color="bg-green-500"
        description="Winnings ready to be withdrawn."
      />
      {isAdmin && (
        <WalletCard 
          title="Admin Wallet" 
          amount={wallets.adminWallet || 0} 
          icon={<ShieldCheck />} 
          color="bg-purple-500"
          description="Total house profit from game operations."
        />
      )}
    </div>
  );
}
