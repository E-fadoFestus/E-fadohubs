export type SupportSubject =
  | 'Payment Issue'
  | 'Game Issue'
  | 'Withdrawal'
  | 'Account'
  | 'Other';

export type HelpInboxStatus = 'New' | 'Replied' | 'Closed';

export const SUPPORT_SUBJECT_OPTIONS: SupportSubject[] = [
  'Payment Issue',
  'Game Issue',
  'Withdrawal',
  'Account',
  'Other',
];

export interface SupportHelpLaunchOptions {
  hub: string;
  subject?: SupportSubject;
}

type SupportListener = (options: SupportHelpLaunchOptions) => void;

const listeners = new Set<SupportListener>();
let pendingLaunch: SupportHelpLaunchOptions | null = null;

export function openSupportHelpForm(
  hubOrOptions: string | SupportHelpLaunchOptions = 'General Support',
  subject?: SupportSubject
): void {
  const payload: SupportHelpLaunchOptions =
    typeof hubOrOptions === 'string'
      ? { hub: hubOrOptions, subject }
      : hubOrOptions;

  if (listeners.size === 0) {
    pendingLaunch = payload;
    return;
  }

  listeners.forEach((listener) => {
    listener(payload);
  });
}

export function subscribeSupportHelpModal(listener: SupportListener): () => void {
  listeners.add(listener);
  if (pendingLaunch) {
    const queued = pendingLaunch;
    pendingLaunch = null;
    listener(queued);
  }
  return () => {
    listeners.delete(listener);
  };
}

export function getGuideHubLaunch(guideId: string): SupportHelpLaunchOptions {
  switch (guideId) {
    case 'games':
      return { hub: 'Game Zone', subject: 'Game Issue' };
    case 'vtu':
      return { hub: 'VTU Airtime & Data', subject: 'Payment Issue' };
    case 'cryptoOtc':
      return { hub: 'Crypto OTC', subject: 'Payment Issue' };
    case 'moneyExchange':
      return { hub: 'Money Exchange', subject: 'Payment Issue' };
    case 'marketplace':
      return { hub: 'Marketplace', subject: 'Payment Issue' };
    case 'advertising':
      return { hub: 'Advertisement Page', subject: 'Other' };
    case 'skills':
      return { hub: 'Show Your Skills (EFADOworks)', subject: 'Account' };
    case 'serviceCorps':
      return { hub: 'Service Corps', subject: 'Other' };
    case 'loans':
      return { hub: 'HepiHands Loan Hub', subject: 'Account' };
    case 'cscc':
      return { hub: 'CSCC Community Savings', subject: 'Payment Issue' };
    case 'education':
      return { hub: 'Education Hub', subject: 'Other' };
    case 'nexus':
      return { hub: 'EFADO Nexus Hub', subject: 'Account' };
    case 'domainsPartners':
      return { hub: 'Domains & Partners Hub', subject: 'Other' };
    case 'walletPaystack':
      return { hub: 'Wallet & Paystack', subject: 'Payment Issue' };
    case 'ceoPortal':
      return { hub: 'CEO Portal', subject: 'Other' };
    default:
      return { hub: 'General Support', subject: 'Other' };
  }
}
