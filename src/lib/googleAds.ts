// Privacy-safe, standard Google Tag / Remarketing helper for EFADO public adverts.
// Only loads or triggers Google Ads remarketing events if VITE_GOOGLE_ADS_ID is configured.

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

const GOOGLE_ADS_ID = (import.meta.env.VITE_GOOGLE_ADS_ID || '').trim();
let adsConfigured = false;

export function ensureGoogleAdsTagConfigured() {
  if (typeof window === 'undefined' || !GOOGLE_ADS_ID || adsConfigured) return;

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function (...args: any[]) {
      window.dataLayer?.push(args);
    };
  }

  // Inject secondary Google Ads config script if not already loaded
  const existing = document.querySelector(`script[src*="id=${encodeURIComponent(GOOGLE_ADS_ID)}"]`);
  if (!existing) {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GOOGLE_ADS_ID)}`;
    document.head.appendChild(s);
  }

  window.gtag('config', GOOGLE_ADS_ID, {
    allow_google_signals: true,
    allow_ad_personalization_signals: true,
  });
  adsConfigured = true;
}

export function trackGoogleAdvertView(item: {
  id: string;
  title: string;
  category: string;
  price: number;
  currency?: string;
}) {
  if (typeof window === 'undefined') return;
  ensureGoogleAdsTagConfigured();
  if (typeof window.gtag !== 'function') return;

  try {
    window.gtag('event', 'view_item', {
      send_to: GOOGLE_ADS_ID || 'G-65LSEMP97N',
      currency: item.currency || 'NGN',
      value: Number(item.price) || 0,
      items: [
        {
          item_id: item.id,
          item_name: item.title,
          item_category: item.category,
          price: Number(item.price) || 0,
        },
      ],
    });
  } catch {
    // Ignore non-fatal analytics errors
  }
}

export function trackGoogleAdvertPublish(item: {
  id: string;
  title: string;
  category: string;
  planName: string;
  planPrice: number;
  currency?: string;
}) {
  if (typeof window === 'undefined') return;
  ensureGoogleAdsTagConfigured();
  if (typeof window.gtag !== 'function') return;

  try {
    window.gtag('event', item.planPrice > 0 ? 'purchase' : 'generate_lead', {
      send_to: GOOGLE_ADS_ID || 'G-65LSEMP97N',
      transaction_id: `AD_${item.id}`,
      currency: item.currency || 'NGN',
      value: Number(item.planPrice) || 0,
      items: [
        {
          item_id: item.id,
          item_name: item.title,
          item_category: item.category,
          item_variant: item.planName,
          price: Number(item.planPrice) || 0,
        },
      ],
    });
  } catch {
    // Ignore non-fatal analytics errors
  }
}
