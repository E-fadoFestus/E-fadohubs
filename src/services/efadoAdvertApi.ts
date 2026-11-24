import {
  db,
  auth,
  collection,
  doc,
  addDoc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  increment,
  serverTimestamp,
} from '../firebase';
import { arrayUnion, arrayRemove } from 'firebase/firestore';
import { getBackendUrl } from '../config/backend';
import { AdListing, AdPlan, UserProfile } from '../types';
import { trackGoogleAdvertPublish } from '../lib/googleAds';

export const PROMOTION_THRESHOLD = 5;

export interface AdvertSubmissionInput {
  type: 'ADVERT' | 'SELL';
  title: string;
  description: string;
  price: number;
  category: string;
  groupId: string;
  customCategoryName?: string;
  state: string;
  city: string;
  address: string;
  landmark?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  details: Record<string, any>;
  photos: string[];
  video?: string;
  plan: AdPlan;
}

export function normalizeCategorySlug(raw: string): string {
  return String(raw || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

export function generateAdvertSlug(title: string, locationHint?: string, uniqueSuffix?: string): string {
  const base = normalizeCategorySlug([title, locationHint].filter(Boolean).join(' '));
  const cleanBase = base || 'efado-advert';
  const suffix = uniqueSuffix ? `-${normalizeCategorySlug(uniqueSuffix).slice(0, 6)}` : '';
  return `${cleanBase.slice(0, 68)}${suffix}`;
}

export function getPublicAdvertUrl(ad: Pick<AdListing, 'id' | 'slug'>): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  if (ad.id === 'efado-platform') {
    return `${origin}/hub/advertising`;
  }
  return `${origin}/advert/${ad.slug || ad.id}`;
}

export function validateAdvertSubmission(input: Partial<AdvertSubmissionInput>): string | null {
  const title = (input.title || '').trim();
  if (title.length < 3 || title.length > 120) {
    return 'Please enter a clear name or title (at least 3 characters).';
  }
  const price = Number(input.price);
  if (!Number.isFinite(price) || price < 0 || price > 100000000000) {
    return 'Please enter a valid price.';
  }
  if (!input.category || !input.category.trim()) {
    return 'Please pick what kind of item or service this is.';
  }
  if (input.groupId === 'OTHERS' && !(input.customCategoryName || '').trim()) {
    return 'Please write what you want to advertise in your own words.';
  }
  const state = (input.state || '').trim();
  const city = (input.city || '').trim();
  const address = (input.address || '').trim();
  if (state.length < 2) return 'Please enter the state or region.';
  if (city.length < 2) return 'Please enter the town or city.';
  if (address.length < 3) return 'Please enter the street or area address.';

  const phone = (input.phone || '').trim();
  const phoneDigits = phone.replace(/\D/g, '');
  if (phoneDigits.length < 7 || phoneDigits.length > 18) {
    return 'Please enter a valid phone number so buyers can reach you.';
  }

  if (input.whatsapp && input.whatsapp.trim()) {
    const waDigits = input.whatsapp.replace(/\D/g, '');
    if (waDigits.length < 7 || waDigits.length > 18) {
      return 'Please enter a valid WhatsApp number or leave it blank.';
    }
  }

  if (input.email && input.email.trim()) {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim());
    if (!emailOk) return 'Please enter a valid email address or leave it blank.';
  }

  if (!input.photos || input.photos.length === 0) {
    return 'Please add at least 1 photo so people can see what you are promoting.';
  }
  if (input.photos.length > 4) {
    return 'You can add up to 4 photos.';
  }

  return null;
}

// Track last submit timestamp per user to avoid accidental double submission / spam
const lastSubmitByUser = new Map<string, number>();

export const efadoAdvertApi = {
  /**
   * Reads or creates/updates custom category submissions and auto-promotes once 5+ users submit it.
   */
  async recordCustomCategory(customName: string, userId: string): Promise<{ promoted: boolean; count: number; slug: string }> {
    const cleanName = customName.trim().replace(/\s+/g, ' ');
    const slug = normalizeCategorySlug(cleanName);
    if (!slug) return { promoted: false, count: 0, slug: 'custom' };

    const catRef = doc(db, 'advert_categories', slug);
    const snap = await getDoc(catRef);
    const existing = snap.exists() ? snap.data() : null;
    const prevSubmitters: string[] = Array.isArray(existing?.submitters) ? existing.submitters : [];
    const alreadySubmittedByUser = prevSubmitters.includes(userId);
    const nextSubmitters = alreadySubmittedByUser ? prevSubmitters : [...prevSubmitters, userId];
    const nextCount = alreadySubmittedByUser
      ? Number(existing?.submissionCount || nextSubmitters.length || 1)
      : Math.max(Number(existing?.submissionCount || 0) + 1, nextSubmitters.length);
    const promoted = Boolean(existing?.promoted) || nextCount >= PROMOTION_THRESHOLD;

    await setDoc(
      catRef,
      {
        id: slug,
        slug,
        name: existing?.name || cleanName,
        groupId: 'OTHERS',
        submissionCount: nextCount,
        submitters: nextSubmitters.slice(-100),
        promoted,
        createdAt: existing?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return { promoted, count: nextCount, slug };
  },

  /**
   * Publishes an advert through the unified EFADO Advert API pipeline:
   * 1. Validates inputs & spam cooldown
   * 2. Pre-validates on backend `/api/adverts/prepare` (for server rate limit + slug consistency)
   * 3. Writes advert to `ad_listings`
   * 4. Syncs video to `reels` (if video attached)
   * 5. Records custom `Others` category for 5+ auto-promotion
   * 6. Creates live notification for user & CEO alert log
   */
  async createAdvert(user: UserProfile, input: AdvertSubmissionInput): Promise<AdListing> {
    if (!user?.uid) {
      throw new Error('Please sign in first to publish your advert.');
    }

    const validationError = validateAdvertSubmission(input);
    if (validationError) {
      throw new Error(validationError);
    }

    const lastAt = lastSubmitByUser.get(user.uid) || 0;
    if (Date.now() - lastAt < 8000) {
      throw new Error('Please wait a few seconds before sending another advert.');
    }

    const ownerName = user.fullName || user.displayName || user.email?.split('@')[0] || 'EFADO Member';
    const shortSuffix = Math.random().toString(36).slice(2, 6);
    let slug = generateAdvertSlug(input.title, input.city || input.state, shortSuffix);

    // Server-side validation & spam check (non-blocking if auth header absent in guest dev mode)
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken().catch(() => '') : '';
      const prepRes = await fetch(getBackendUrl('/api/adverts/prepare'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: user.uid,
          title: input.title.trim(),
          price: Number(input.price),
          category: input.category,
          state: input.state.trim(),
          city: input.city.trim(),
          phone: input.phone.trim(),
          email: input.email?.trim() || '',
        }),
      });
      if (prepRes.status === 429 || prepRes.status === 400) {
        const errData = await prepRes.json().catch(() => null);
        if (errData?.message) {
          throw new Error(errData.message);
        }
      }
      const prepData = await prepRes.json().catch(() => null);
      if (prepData?.slug) {
        slug = prepData.slug;
      }
    } catch (apiErr: any) {
      if (apiErr?.message && !String(apiErr.message).includes('Failed to fetch')) {
        throw apiErr;
      }
    }

    const expiryDate = Date.now() + (input.plan?.durationDays || 3) * 24 * 60 * 60 * 1000;
    const displayCategory =
      input.groupId === 'OTHERS' && input.customCategoryName?.trim()
        ? input.customCategoryName.trim()
        : input.category;

    const payload = {
      vendorId: user.uid,
      userId: user.uid,
      name: ownerName,
      ownerName,
      phone: input.phone.trim(),
      hub: 'ADVERTISING',
      type: input.type,
      category: displayCategory,
      groupId: input.groupId,
      customCategoryName: input.customCategoryName?.trim() || '',
      slug,
      title: input.title.trim(),
      description: (input.description || '').trim() || `${input.title.trim()} available in ${input.city.trim()}, ${input.state.trim()}.`,
      price: Number(input.price),
      location: {
        state: input.state.trim(),
        city: input.city.trim(),
        address: input.address.trim(),
        landmark: (input.landmark || '').trim(),
      },
      contact: {
        phone: input.phone.trim(),
        whatsapp: (input.whatsapp || input.phone).trim(),
        email: (input.email || user.email || '').trim(),
      },
      details: input.details || {},
      photos: input.photos.slice(0, 4),
      video: (input.video || '').trim(),
      isReelPromotion: Boolean(input.video && input.video.trim()),
      plan: input.plan?.id || 'Free',
      expiryDate,
      status: 'active' as const,
      viewsCount: 0,
      sharesCount: 0,
      likes: [] as string[],
      commentsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'ad_listings'), payload);
    lastSubmitByUser.set(user.uid, Date.now());

    // Sync to EFADO Reels automatically if a video or reel was added
    if (payload.video) {
      try {
        await addDoc(collection(db, 'reels'), {
          authorId: user.uid,
          authorName: ownerName,
          authorPhoto: user.photoURL || '',
          videoUrl: payload.video,
          linkedAdId: docRef.id,
          linkedAdSlug: slug,
          caption: `${payload.title} • ₦${payload.price.toLocaleString()} (${payload.location.city}, ${payload.location.state})\n\n${payload.description}`,
          likes: [],
          comments: [],
          shares: 0,
          tags: ['#EFADO', `#${normalizeCategorySlug(displayCategory) || 'market'}`],
          createdAt: serverTimestamp(),
        });
      } catch (reelErr) {
        console.warn('Reel sync skipped cleanly:', reelErr);
      }
    }

    // Track custom "Others" category for automatic promotion at 5+ entries
    if (input.groupId === 'OTHERS' && input.customCategoryName?.trim()) {
      await efadoAdvertApi.recordCustomCategory(input.customCategoryName, user.uid).catch((e) => {
        console.warn('Custom category record notice:', e);
      });
    }

    // Create live notification record for user & CEO visibility
    try {
      await addDoc(collection(db, 'efado_notifications'), {
        userId: user.uid,
        hub: 'ADVERTISING',
        type: 'ADVERT_PUBLISHED',
        title: input.type === 'SELL' ? 'Product Listed Live' : 'Advert Published Live',
        message: `"${payload.title}" is now live across EFADO and ready to share.`,
        link: `/advert/${slug}`,
        isRead: false,
        createdAt: serverTimestamp(),
      });
    } catch (notifErr) {
      console.warn('Notification log notice:', notifErr);
    }

    trackGoogleAdvertPublish({
      id: docRef.id,
      title: payload.title,
      category: displayCategory,
      planName: input.plan?.name || 'Free 3-Day Listing',
      planPrice: Number(input.plan?.price || 0),
    });

    return {
      ...payload,
      id: docRef.id,
    } as AdListing;
  },

  async updateAdvert(adId: string, userId: string, updates: Partial<AdListing>): Promise<void> {
    if (!adId || !userId) throw new Error('Missing advert or account information.');
    const ref = doc(db, 'ad_listings', adId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('This advert was not found.');
    const existing = snap.data();
    if (existing.vendorId !== userId && existing.userId !== userId) {
      throw new Error('You can only edit your own adverts.');
    }

    await updateDoc(ref, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteAdvert(adId: string, userId: string): Promise<void> {
    if (!adId || !userId) throw new Error('Missing advert or account information.');
    const ref = doc(db, 'ad_listings', adId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('This advert was not found.');
    const existing = snap.data();
    if (existing.vendorId !== userId && existing.userId !== userId) {
      throw new Error('You can only delete your own adverts.');
    }
    await deleteDoc(ref);
  },

  async boostAdvert(adId: string, userId: string, plan: AdPlan): Promise<void> {
    const newExpiry = Date.now() + (plan.durationDays || 7) * 24 * 60 * 60 * 1000;
    await efadoAdvertApi.updateAdvert(adId, userId, {
      plan: plan.id,
      expiryDate: newExpiry,
      status: 'active',
    });
    try {
      await addDoc(collection(db, 'efado_notifications'), {
        userId,
        hub: 'ADVERTISING',
        type: 'ADVERT_BOOSTED',
        title: 'Advert Boosted',
        message: `Your advert was boosted with ${plan.name} for ${plan.durationDays} days.`,
        link: `/advert/${adId}`,
        isRead: false,
        createdAt: serverTimestamp(),
      });
    } catch {}
  },

  async toggleLike(adId: string, userId: string, currentlyLiked: boolean): Promise<void> {
    if (!userId) throw new Error('Please sign in to like this advert.');
    const ref = doc(db, 'ad_listings', adId);
    await updateDoc(ref, {
      likes: currentlyLiked ? arrayRemove(userId) : arrayUnion(userId),
    });
  },

  async addComment(adId: string, user: UserProfile, text: string): Promise<void> {
    if (!user?.uid) throw new Error('Please sign in to post a comment.');
    const clean = text.trim();
    if (clean.length < 2 || clean.length > 500) {
      throw new Error('Comment must be between 2 and 500 characters.');
    }
    const userName = user.fullName || user.displayName || user.email?.split('@')[0] || 'EFADO User';
    await addDoc(collection(db, 'advert_comments'), {
      adId,
      userId: user.uid,
      userName,
      text: clean,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'ad_listings', adId), {
      commentsCount: increment(1),
    }).catch(() => {});
  },

  async trackView(adId: string): Promise<void> {
    if (!adId || typeof window === 'undefined') return;
    const key = `efado_ad_viewed_${adId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    try {
      await fetch(getBackendUrl(`/api/adverts/${encodeURIComponent(adId)}/track`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'view' }),
      });
    } catch {
      // Non-fatal
    }
  },

  async trackShare(adId: string, channel: string): Promise<void> {
    if (!adId) return;
    try {
      await fetch(getBackendUrl(`/api/adverts/${encodeURIComponent(adId)}/track`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'share', channel }),
      });
    } catch {
      // Fallback if authenticated
      if (auth.currentUser) {
        await updateDoc(doc(db, 'ad_listings', adId), {
          sharesCount: increment(1),
        }).catch(() => {});
      }
    }
  },

  buildShareMessage(ad: Pick<AdListing, 'id' | 'slug' | 'title' | 'price' | 'location'>): {
    url: string;
    text: string;
  } {
    const url = getPublicAdvertUrl(ad);
    const priceText = Number(ad.price || 0) > 0 ? `₦${Number(ad.price).toLocaleString()}` : 'Contact for price';
    const loc = [ad.location?.city, ad.location?.state].filter(Boolean).join(', ');
    const text = `${ad.title} — ${priceText}${loc ? ` (${loc})` : ''}\nSee photos and details on EFADO:\n${url}`;
    return { url, text };
  },
};
