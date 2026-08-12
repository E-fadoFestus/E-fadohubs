import React from 'react';
import { UserProfile } from '../types';
import { EasyPaymentPlatform } from './EasyPaymentPlatform';

export interface PaymentPlatformProps {
  user: UserProfile;
  type: 'deposit' | 'withdraw';
  onComplete?: (amount: number, method: string) => Promise<void>;
  onClose: () => void;
  amount?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  purpose?: string;
  hub?: string;
}

export const PaymentPlatform: React.FC<PaymentPlatformProps> = ({ 
  user, 
  type, 
  onComplete, 
  onClose,
  amount,
  onSuccess,
  onCancel,
  purpose,
  hub = 'WALLET'
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-lg my-auto">
        <EasyPaymentPlatform
          user={user}
          type={type}
          onComplete={onComplete}
          onClose={() => {
            if (onCancel) onCancel();
            onClose();
          }}
          amount={amount}
          onSuccess={onSuccess}
          purpose={purpose}
          hub={hub}
        />
      </div>
    </div>
  );
};
