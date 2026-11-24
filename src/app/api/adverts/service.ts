import { db } from '../../../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  updateDoc,
  increment,
} from 'firebase/firestore';

const recentPrepByKey = new Map<string, number>();

export function sanitizeSlug(raw: string): string {
  return String(raw || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function validateAndPrepareAdvert(body: any, clientIp: string) {
  const userId = String(body?.userId || '').trim();
  const title = String(body?.title || '').trim();
  const price = Number(body?.price);
  const category = String(body?.category || '').trim();
  const state = String(body?.state || '').trim();
  const city = String(body?.city || '').trim();
  const phone = String(body?.phone || '').trim();
  const email = String(body?.email || '').trim();

  if (!userId) return { ok: false as const, status: 400, message: 'User account is required.' };
  if (title.length < 3 || title.length > 120) {
    return { ok: false as const, status: 400, message: 'Please enter a clear name or title.' };
  }
  if (!Number.isFinite(price) || price < 0 || price > 100000000000) {
    return { ok: false as const, status: 400, message: 'Please enter a valid price.' };
  }
  if (!category) return { ok: false as const, status: 400, message: 'Please select a category.' };
  if (state.length < 2 || city.length < 2) {
    return { ok: false as const, status: 400, message: 'Please enter both state and town/city.' };
  }
  const phoneDigits = phone.replace(/\D/g, '');
  if (phoneDigits.length < 7 || phoneDigits.length > 18) {
    return { ok: false as const, status: 400, message: 'Please enter a valid phone number.' };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false as const, status: 400, message: 'Please enter a valid email address.' };
  }

  // Server-side anti-spam guard (5 seconds cooldown per user/IP)
  const key = `${userId}_${clientIp}`;
  const last = recentPrepByKey.get(key) || 0;
  if (Date.now() - last < 5000) {
    return {
      ok: false as const,
      status: 429,
      message: 'Please wait a few seconds before submitting again.',
    };
  }
  recentPrepByKey.set(key, Date.now());
  if (recentPrepByKey.size > 2000) recentPrepByKey.clear();

  const suffix = Math.random().toString(36).slice(2, 6);
  const baseSlug = sanitizeSlug(`${title}-${city || state}`);
  const slug = `${baseSlug || 'efado-listing'}-${suffix}`;

  return { ok: true as const, slug };
}

export async function findPublicAdvertBySlugOrId(slugOrId: string): Promise<any | null> {
  const clean = String(slugOrId || '').trim();
  if (!clean) return null;

  try {
    // 1. Direct document ID match
    const byId = await getDoc(doc(db, 'ad_listings', clean));
    if (byId.exists()) {
      return { id: byId.id, ...byId.data() };
    }

    // 2. Slug field match
    const qSlug = query(collection(db, 'ad_listings'), where('slug', '==', clean), limit(1));
    const snap = await getDocs(qSlug);
    if (!snap.empty) {
      const first = snap.docs[0];
      return { id: first.id, ...first.data() };
    }

    // 3. Fallback case-insensitive / partial check across active adverts
    const allSnap = await getDocs(query(collection(db, 'ad_listings'), limit(150)));
    const lower = clean.toLowerCase();
    for (const d of allSnap.docs) {
      const data = d.data();
      if (
        d.id.toLowerCase() === lower ||
        String(data.slug || '').toLowerCase() === lower
      ) {
        return { id: d.id, ...data };
      }
    }
  } catch (err) {
    console.warn('[Server Adverts] Lookup notice:', err);
  }
  return null;
}

export async function trackAdvertMetric(adId: string, event: 'view' | 'share') {
  if (!adId) return;
  try {
    const ref = doc(db, 'ad_listings', adId);
    if (event === 'view') {
      await updateDoc(ref, { viewsCount: increment(1) });
    } else if (event === 'share') {
      await updateDoc(ref, { sharesCount: increment(1) });
    }
  } catch (err) {
    console.warn('[Server Adverts] Metric track notice:', err);
  }
}

export async function buildDynamicSitemapXml(baseUrl: string): Promise<string> {
  const origin = baseUrl.replace(/\/$/, '');
  const nowIso = new Date().toISOString().split('T')[0];

  const staticPaths = [
    '/',
    '/hubs',
    '/hub/advertising',
    '/hub/market',
    '/hub/arena',
    '/hub/services',
    '/hub/education',
    '/hub/gist',
  ];

  const advertUrls: { loc: string; lastmod: string }[] = [];
  try {
    const snap = await getDocs(query(collection(db, 'ad_listings'), limit(300)));
    for (const d of snap.docs) {
      const data = d.data();
      if (data?.status === 'deleted' || data?.status === 'expired') continue;
      const pathPart = encodeURIComponent(String(data?.slug || d.id));
      advertUrls.push({
        loc: `${origin}/advert/${pathPart}`,
        lastmod: nowIso,
      });
    }
  } catch (err) {
    console.warn('[Sitemap] Advert listing fetch notice:', err);
  }

  const urlsXml = [
    ...staticPaths.map(
      (p) => `  <url>\n    <loc>${escapeHtml(origin + p)}</loc>\n    <lastmod>${nowIso}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>${p === '/' ? '1.0' : '0.8'}</priority>\n  </url>`
    ),
    ...advertUrls.map(
      (u) => `  <url>\n    <loc>${escapeHtml(u.loc)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>`
    ),
  ].join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>`;
}

export function injectAdvertMetaIntoHtml(html: string, ad: any | null, pageUrl: string): string {
  if (!ad) return html;

  const priceNum = Number(ad.price || 0);
  const priceText = priceNum > 0 ? `₦${priceNum.toLocaleString()}` : 'Contact Seller';
  const loc = [ad.location?.city, ad.location?.state].filter(Boolean).join(', ');
  const title = `${ad.title}${priceNum > 0 ? ` — ${priceText}` : ''}${loc ? ` in ${loc}` : ''} | EFADO`;
  const description = String(ad.description || `${ad.title} listed on EFADO Hubs Connect.`).slice(0, 160);
  const firstPhoto = Array.isArray(ad.photos) && ad.photos[0] && !String(ad.photos[0]).startsWith('data:')
    ? String(ad.photos[0])
    : `${new URL(pageUrl).origin}/efado_logo_512.jpg`;

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: ad.title,
    description,
    image: firstPhoto,
    category: ad.category || 'Marketplace',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'NGN',
      price: priceNum,
      availability: ad.status === 'sold_out' ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      url: pageUrl,
    },
  };

  const safeJsonLd = JSON.stringify(productSchema).replace(/</g, '\\u003c');
  const googleAdsId = (process.env.VITE_GOOGLE_ADS_ID || '').trim();
  const adsScript = googleAdsId
    ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${escapeHtml(googleAdsId)}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('config','${escapeHtml(googleAdsId)}');</script>`
    : '';

  const injectedHead = `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(pageUrl)}" />
    <meta property="og:type" content="product" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(firstPhoto)}" />
    <meta property="og:url" content="${escapeHtml(pageUrl)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(firstPhoto)}" />
    <script type="application/ld+json">${safeJsonLd}</script>
    ${adsScript}
  `;

  let out = html.replace(/<title>[\s\S]*?<\/title>/i, '');
  out = out.replace(/<meta\s+name=["']description["'][^>]*>/i, '');
  return out.replace('</head>', `${injectedHead}\n  </head>`);
}
